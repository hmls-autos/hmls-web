import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { runAgentTask } from "../lib/agent-client";
import { db, schema } from "../db/client";
import { wsLogger } from "../lib/logger";
import type { ServerMessage } from "@hmls/shared";
import { isValidClientMessage } from "@hmls/shared";

const task = new Hono();

/**
 * Send a typed message to the WebSocket client
 */
function sendMessage(ws: { send: (data: string) => void }, message: ServerMessage): void {
  ws.send(JSON.stringify(message));
}

// WebSocket upgrade is handled at the server level in index.ts
task.get("/", (c) => {
  return c.json({ error: "WebSocket upgrade required" }, 426);
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

      // Call agent via gRPC
      let fullResponse = "";

      for await (const event of runAgentTask(userMessage, conversationId ?? undefined)) {
        if (event.type === "text_delta" && event.text) {
          fullResponse += event.text;
          sendMessage(ws, { type: "delta", text: event.text });
        } else if (event.type === "tool_start") {
          sendMessage(ws, { type: "tool_start", tool: event.toolName || "unknown" });
        } else if (event.type === "tool_end") {
          sendMessage(ws, { type: "tool_end", tool: event.toolName || "unknown" });
        } else if (event.type === "error") {
          sendMessage(ws, { type: "error", message: event.message || "Unknown error" });
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
