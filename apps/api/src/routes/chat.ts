import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { eachValueFrom } from "rxjs-for-await";
import { eq } from "drizzle-orm";
import { type AgentConfig, createHmlsAgent } from "../agent.ts";
import { db, schema } from "../db/client.ts";
import { Errors } from "@hmls/shared/errors";
import {
  convertAguiMessagesToZypher,
  createAguiEventStream,
  parseRunAgentInput,
} from "@zypher/agui";
import type { UserContext } from "../types/user-context.ts";
import { optionalAuth, type OptionalAuthEnv } from "../middleware/auth.ts";

let _config: AgentConfig;

export function initChat(config: AgentConfig) {
  _config = config;
}

/** Look up customer by email, or create one if not found. */
async function resolveCustomer(
  userInfo: { email: string; name?: string; phone?: string },
): Promise<UserContext | undefined> {
  if (!userInfo.email) return undefined;

  // Try to find existing customer by email
  const [existing] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.email, userInfo.email))
    .limit(1);

  if (existing) {
    return {
      id: existing.id,
      name: existing.name ?? userInfo.name ?? "",
      email: existing.email ?? userInfo.email,
      phone: existing.phone ?? userInfo.phone ?? "",
    };
  }

  // Create new customer
  const [created] = await db
    .insert(schema.customers)
    .values({
      name: userInfo.name || null,
      email: userInfo.email,
      phone: userInfo.phone || null,
    })
    .returning();

  return {
    id: created.id,
    name: created.name ?? "",
    email: created.email ?? userInfo.email,
    phone: created.phone ?? "",
  };
}

const chat = new Hono<OptionalAuthEnv>();

// AG-UI chat endpoint
chat.post("/", optionalAuth, async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON body" } },
      400,
    );
  }

  let input;
  try {
    input = parseRunAgentInput(body);
  } catch (parseError) {
    throw Errors.validation("Invalid AG-UI input", String(parseError));
  }

  // Resolve authenticated user -> customer record via JWT
  let userContext: UserContext | undefined;
  const authUser = c.get("authUser");
  if (authUser) {
    userContext = await resolveCustomer({ email: authUser.email });
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
