import { env } from "./env";

export interface TaskEvent {
  type: "text_delta" | "tool_start" | "tool_end" | "done" | "error";
  text?: string;
  toolName?: string;
  message?: string;
}

export async function* runAgentTask(
  message: string,
  conversationId?: number
): AsyncGenerator<TaskEvent> {
  const agentUrl = `http://${env.AGENT_URL}/task`;

  const response = await fetch(agentUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, conversation_id: conversationId }),
  });

  if (!response.ok) {
    yield { type: "error", message: `Agent request failed: ${response.status}` };
    return;
  }

  if (!response.body) {
    yield { type: "error", message: "No response body" };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6);
          try {
            const event = JSON.parse(jsonStr);

            if (event.type === "text_delta") {
              yield { type: "text_delta", text: event.text };
            } else if (event.type === "tool_start") {
              yield { type: "tool_start", toolName: event.tool_name };
            } else if (event.type === "tool_end") {
              yield { type: "tool_end", toolName: event.tool_name };
            } else if (event.type === "done") {
              yield { type: "done" };
            } else if (event.type === "error") {
              yield { type: "error", message: event.message };
            }
          } catch {
            // Ignore invalid JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
