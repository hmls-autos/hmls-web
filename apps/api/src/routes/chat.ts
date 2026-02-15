import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { eachValueFrom } from "rxjs-for-await";
import { createHmlsAgent, type AgentConfig } from "../agent.ts";
import { Errors } from "@hmls/shared/errors";
import { createAguiEventStream, parseRunAgentInput } from "@zypher/agui";
import type { UserContext } from "../types/user-context.ts";

// Agent cache by user ID (or singleton for anonymous)
const agentCache = new Map<
  string,
  Awaited<ReturnType<typeof createHmlsAgent>>
>();

let _config: AgentConfig;

export function initChat(config: AgentConfig) {
  _config = config;
}

async function getAgent(userContext?: UserContext) {
  const cacheKey = userContext ? `user:${userContext.id}` : "anonymous";

  if (!agentCache.has(cacheKey)) {
    const agent = await createHmlsAgent({ config: _config, userContext });
    agentCache.set(cacheKey, agent);
  }

  return agentCache.get(cacheKey)!;
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

  const agent = await getAgent(userContext);
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
