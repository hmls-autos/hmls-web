import { Hono } from "hono";
import { convertToModelMessages } from "ai";
import { runFixoAgent } from "@hmls/agent";
import { checkFreeTierLimit } from "../../middleware/fixo/tier.ts";
import { getLogger } from "@logtape/logtape";
import type { AuthContext } from "../../middleware/fixo/auth.ts";

const logger = getLogger(["hmls", "gateway", "fixo", "chat"]);

type Variables = { auth: AuthContext };

const chat = new Hono<{ Variables: Variables }>();

// AI SDK data stream endpoint for fixo chat
chat.post("/", async (c) => {
  const auth = c.get("auth");

  // Validate that the user has an active subscription/tier before running the agent
  const tierBlock = await checkFreeTierLimit(auth, "text");
  if (tierBlock) {
    logger.warn("Tier limit reached", { userId: auth.userId });
    return tierBlock;
  }

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { error: "Invalid JSON body" },
      400,
    );
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return c.json(
      { error: "Invalid request: messages array is required" },
      400,
    );
  }

  const startTime = Date.now();
  const userId = auth.userId;
  const messageCount = messages.length;
  logger.info("Request received", { userId, messageCount });

  try {
    const modelMessages = await convertToModelMessages(messages);

    const result = runFixoAgent({ messages: modelMessages, userId });

    const response = result.toUIMessageStreamResponse();
    const duration = Date.now() - startTime;
    logger.info("Request finished", { userId, messageCount, duration });
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Agent failed", {
      userId,
      messageCount,
      duration,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return c.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      500,
    );
  }
});

export { chat };
