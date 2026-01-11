import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createHmlsAgent, runAgentTask } from "../agent/index";
import { db, schema } from "../db/client";
import { wsLogger } from "../lib/logger";
import type { ServerMessage, ClientMessage } from "@hmls/shared";
import { isValidClientMessage } from "@hmls/shared";

const task = new Hono();

// Store agent instance (singleton for performance)
let agentInstance: Awaited<ReturnType<typeof createHmlsAgent>> | null = null;

async function getAgent() {
  if (!agentInstance) {
    agentInstance = await createHmlsAgent();
  }
  return agentInstance;
}

/**
 * Send a typed message to the WebSocket client
 */
function sendMessage(ws: { send: (data: string) => void }, message: ServerMessage): void {
  ws.send(JSON.stringify(message));
}

// WebSocket upgrade handler using Bun's API
task.get("/", (c) => {
  const upgrade = c.req.header("upgrade");

  if (upgrade?.toLowerCase() !== "websocket") {
    return c.json({ error: "WebSocket upgrade required" }, 426);
  }

  // Bun's server.upgrade() is handled at the server level
  // For Hono + Bun, we use the websocket property on the server
  const success = c.env?.upgrade?.(c.req.raw);
  if (success) {
    return new Response(null);
  }
  return c.json({ error: "WebSocket upgrade failed" }, 500);
});

// Get conversation history (REST endpoint)
task.get("/history/:conversationId", async (c) => {
  const conversationId = Number(c.req.param("conversationId"));

  const messages = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationId, conversationId))
    .orderBy(schema.messages.createdAt);

  return c.json({ messages });
});

// Export WebSocket handlers for Bun
export const websocket = {
  async message(ws: { send: (data: string) => void; data: { conversationId: number | null } }, message: string) {
    try {
      let data: unknown;
      try {
        data = JSON.parse(message);
      } catch {
        wsLogger.warn`Invalid JSON received`;
        sendMessage(ws, { type: "error", message: "Invalid JSON" });
        return;
      }

      if (!isValidClientMessage(data)) {
        wsLogger.warn`Invalid message format`;
        sendMessage(ws, { type: "error", message: "Invalid message format" });
        return;
      }

      const { message: userMessage, conversationId: convId } = data;
      let conversationId = ws.data.conversationId;

      // Create or get conversation
      if (!conversationId && !convId) {
        const [conv] = await db
          .insert(schema.conversations)
          .values({ channel: "web" })
          .returning();
        conversationId = conv.id;
        ws.data.conversationId = conversationId;
        wsLogger.debug`Created new conversation: ${conversationId}`;
      } else if (convId) {
        conversationId = convId;
        ws.data.conversationId = conversationId;
      }

      // Store user message
      await db.insert(schema.messages).values({
        conversationId: conversationId!,
        role: "user",
        content: userMessage,
      });

      // Send conversation ID back
      sendMessage(ws, { type: "conversation", conversationId: conversationId! });

      // Get agent and run task
      const agent = await getAgent();
      const taskStream = runAgentTask(agent, userMessage);

      let fullResponse = "";

      // Use async iterator
      const { eachValueFrom } = await import("rxjs-for-await");
      for await (const event of eachValueFrom(taskStream)) {
        if (event.type === "text_delta") {
          fullResponse += event.text;
          sendMessage(ws, { type: "delta", text: event.text });
        } else if (event.type === "tool_use") {
          sendMessage(ws, { type: "tool_start", tool: event.name });
        } else if (event.type === "tool_result") {
          sendMessage(ws, { type: "tool_end", tool: event.name });
        }
      }

      // Store assistant response
      if (fullResponse) {
        await db.insert(schema.messages).values({
          conversationId: conversationId!,
          role: "assistant",
          content: fullResponse,
        });
      }

      sendMessage(ws, { type: "done" });
    } catch (error) {
      wsLogger.error`WebSocket message error: ${error instanceof Error ? error.message : String(error)}`;
      sendMessage(ws, {
        type: "error",
        message: "An error occurred while processing your request",
      });
    }
  },
  open(ws: { data: { conversationId: number | null } }) {
    ws.data = { conversationId: null };
    wsLogger.info`WebSocket connected`;
  },
  close() {
    wsLogger.info`WebSocket disconnected`;
  },
};

export default task;
