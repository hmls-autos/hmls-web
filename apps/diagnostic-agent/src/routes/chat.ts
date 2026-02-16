import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { eachValueFrom } from "rxjs-for-await";
import { createDiagnosticAgent } from "../agent.ts";
import {
  convertAguiMessagesToZypher,
  createAguiEventStream,
  parseRunAgentInput,
} from "@zypher/agui";

const chat = new Hono();

// AG-UI streaming endpoint for real-time chat
chat.post("/", async (c) => {
  const body = await c.req.json();

  let input;
  try {
    input = parseRunAgentInput(body);
  } catch (parseError) {
    return c.json(
      { error: "Invalid AG-UI input", details: String(parseError) },
      400,
    );
  }

  const { threadId, runId, messages } = input;
  console.log(
    `[diagnostic-agent] threadId=${threadId}, messages=${messages.length}`,
  );

  // Convert previous messages to Zypher format for conversation context.
  // Creates a fresh agent per request — stateless, no in-memory cache dependency.
  const historyMessages = messages.slice(0, -1);
  const initialMessages = historyMessages.length > 0
    ? convertAguiMessagesToZypher(historyMessages)
    : undefined;

  const agentInstance = await createDiagnosticAgent({ initialMessages });
  const aguiStream = createAguiEventStream({
    agent: agentInstance,
    messages,
    threadId,
    runId,
  });

  return streamSSE(c, async (stream) => {
    try {
      for await (const event of eachValueFrom(aguiStream)) {
        await stream.writeSSE({ data: JSON.stringify(event) });
      }
    } catch (error) {
      console.error(`[diagnostic-agent] Stream error:`, error);
      await stream.writeSSE({
        data: JSON.stringify({
          type: "RUN_ERROR",
          message: error instanceof Error ? error.message : String(error),
        }),
      });
    }
  });
});

export { chat };
