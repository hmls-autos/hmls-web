import { Hono } from "hono";
import { eachValueFrom } from "rxjs-for-await";
import { eq } from "drizzle-orm";
import { createHmlsAgent, runAgentTask } from "../agent/index.ts";
import { db, schema } from "../db/client.ts";
import { wsLogger } from "../lib/logger.ts";
import type { ServerMessage, ClientMessage } from "../types/websocket.ts";
import { isValidClientMessage } from "../types/websocket.ts";

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
function sendMessage(socket: WebSocket, message: ServerMessage): void {
  socket.send(JSON.stringify(message));
}

// WebSocket upgrade handler
task.get("/", (c) => {
  const upgrade = c.req.header("upgrade");

  if (upgrade?.toLowerCase() !== "websocket") {
    return c.json({ error: "WebSocket upgrade required" }, 426);
  }

  const { socket, response } = Deno.upgradeWebSocket(c.req.raw);

  let conversationId: number | null = null;

  socket.onopen = () => {
    wsLogger.info`WebSocket connected`;
  };

  socket.onmessage = async (event) => {
    try {
      // Safely parse JSON with try-catch
      let data: unknown;
      try {
        data = JSON.parse(event.data);
      } catch {
        wsLogger.warn`Invalid JSON received`;
        sendMessage(socket, { type: "error", message: "Invalid JSON" });
        return;
      }

      // Validate message structure
      if (!isValidClientMessage(data)) {
        wsLogger.warn`Invalid message format`;
        sendMessage(socket, { type: "error", message: "Invalid message format" });
        return;
      }

      const { message, conversationId: convId } = data;

      // Create or get conversation
      if (!conversationId && !convId) {
        const [conv] = await db
          .insert(schema.conversations)
          .values({ channel: "web" })
          .returning();
        conversationId = conv.id;
        wsLogger.debug`Created new conversation: ${conversationId}`;
      } else if (convId) {
        conversationId = convId;
      }

      // Store user message
      await db.insert(schema.messages).values({
        conversationId: conversationId!,
        role: "user",
        content: message,
      });

      // Send conversation ID back
      sendMessage(socket, { type: "conversation", conversationId: conversationId! });

      // Get agent and run task
      const agent = await getAgent();
      const taskEvents = runAgentTask(agent, message);

      let fullResponse = "";

      for await (const event of eachValueFrom(taskEvents)) {
        if (event.type === "text_delta") {
          fullResponse += event.text;
          sendMessage(socket, { type: "delta", text: event.text });
        } else if (event.type === "tool_use") {
          sendMessage(socket, { type: "tool_start", tool: event.name });
        } else if (event.type === "tool_result") {
          sendMessage(socket, { type: "tool_end", tool: event.name });
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

      sendMessage(socket, { type: "done" });
    } catch (error) {
      wsLogger.error`WebSocket message error: ${error instanceof Error ? error.message : String(error)}`;
      sendMessage(socket, {
        type: "error",
        message: "An error occurred while processing your request",
      });
    }
  };

  socket.onclose = () => {
    wsLogger.info`WebSocket disconnected`;
  };

  socket.onerror = (error) => {
    wsLogger.error`WebSocket error: ${error}`;
  };

  return response;
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

export default task;
