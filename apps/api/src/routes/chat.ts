import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { eachValueFrom } from "rxjs-for-await";
import { createHmlsAgent, type AgentConfig } from "../agent.ts";
import { Errors } from "@hmls/shared/errors";
import {
  convertAguiMessagesToZypher,
  createAguiEventStream,
  parseRunAgentInput,
} from "@zypher/agui";
import type { UserContext } from "../types/user-context.ts";

let _config: AgentConfig;

export function initChat(config: AgentConfig) {
  _config = config;
}

const chat = new Hono();

// AG-UI chat endpoint
chat.post("/", async (c) => {
  const body = await c.req.json();

  let input;
  try {
    input = parseRunAgentInput(body);
  } catch (parseError) {
    throw Errors.validation("Invalid AG-UI input", String(parseError));
  }

  // Extract user context from header (set by web frontend)
  let userContext: UserContext | undefined;
  const userContextHeader = c.req.header("X-User-Context");
  if (userContextHeader) {
    try {
      userContext = JSON.parse(userContextHeader);
    } catch {
      console.warn("[agent] Invalid X-User-Context header");
    }
  }

  const { threadId, runId, messages } = input;
  console.log(
    `[agent] threadId=${threadId}, messages=${messages.length}, user=${
      userContext?.id ?? "anonymous"
    }`,
  );

  // Convert previous messages (all except last user message) to Zypher format
  // so the agent has full conversation context on every request.
  // This makes the endpoint stateless — no reliance on in-memory agent cache.
  const historyMessages = messages.slice(0, -1);
  const initialMessages = historyMessages.length > 0
    ? convertAguiMessagesToZypher(historyMessages)
    : undefined;

  let agent;
  try {
    agent = await createHmlsAgent({
      config: _config,
      userContext,
      initialMessages,
    });
  } catch (error) {
    console.error(`[agent] Agent init failed:`, error);
    return c.json(
      {
        error: {
          code: "AGENT_ERROR",
          message: error instanceof Error ? error.message : String(error),
        },
      },
      500,
    );
  }

  const aguiStream = createAguiEventStream({
    agent,
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
      console.error(`[agent] Stream error:`, error);
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
