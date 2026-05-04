import { Hono } from "hono";
import { convertToModelMessages, type UIMessage } from "ai";
import { runFixoAgent } from "@hmls/agent";
import { checkFreeTierLimit } from "../../middleware/fixo/tier.ts";
import { getLogger } from "@logtape/logtape";
import { db, schema } from "@hmls/agent/db";
import { and, eq, or } from "drizzle-orm";
import type { AuthContext } from "../../middleware/fixo/auth.ts";
import { hydrateSessionMedia } from "./lib/hydrate-media.ts";
import { reopenIfComplete } from "./lib/session-lifecycle.ts";

const logger = getLogger(["hmls", "gateway", "fixo", "chat"]);

type Variables = { auth: AuthContext };

const chat = new Hono<{ Variables: Variables }>();

// AI SDK data stream endpoint for fixo chat
chat.post("/", async (c) => {
  const auth = c.get("auth");

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json(
      { error: "Invalid JSON body" },
      400,
    );
  }

  const { messages, sessionId } = body as {
    messages?: UIMessage[];
    sessionId?: number | string | null;
  };
  if (!messages || !Array.isArray(messages)) {
    return c.json(
      { error: "Invalid request: messages array is required" },
      400,
    );
  }

  const startTime = Date.now();
  const userId = auth.userId;
  const messageCount = messages.length;
  const parsedSessionId = typeof sessionId === "string"
    ? parseInt(sessionId)
    : typeof sessionId === "number"
    ? sessionId
    : null;

  // Tier check excludes the current session if the chat is continuing inside
  // an already-counted one. Without this, a free-tier user mid-conversation
  // in their 3rd session of the month gets 403'd from sending another turn —
  // even though that 3rd session was already counted when it was created.
  const excludeForTier = parsedSessionId !== null && Number.isInteger(parsedSessionId)
    ? parsedSessionId
    : undefined;
  const tierBlock = await checkFreeTierLimit(auth, "text", excludeForTier);
  if (tierBlock) {
    logger.warn("Tier limit reached", { userId: auth.userId });
    return tierBlock;
  }

  logger.info("Request received", {
    userId,
    messageCount,
    sessionId: parsedSessionId,
  });

  try {
    // Snapshot the inbound messages BEFORE hydrateSessionMedia mutates them
    // with signed-URL FileUIParts. Those URLs expire in 15 min, so persisting
    // the hydrated copy would leave stale links in the saved transcript that
    // 403 on cross-device resume. Persist the user-visible transcript only;
    // the gateway re-hydrates evidence on every turn from fixoMedia anyway.
    const originalMessages: UIMessage[] = structuredClone(messages);

    let attachedMedia = 0;
    if (parsedSessionId !== null && Number.isInteger(parsedSessionId)) {
      // Follow-up activity after a finalized session re-opens it so the
      // next Report click regenerates the diagnosis from the fuller chat.
      // Ownership is folded into the UPDATE so an attacker can't wipe
      // someone else's completed report by guessing their session id.
      await reopenIfComplete(
        parsedSessionId,
        auth.userId,
        auth.customerId,
      );
      attachedMedia = await hydrateSessionMedia(
        messages,
        parsedSessionId,
        auth.userId,
        auth.customerId,
      );
      if (attachedMedia > 0) {
        logger.info("Hydrated session media", {
          sessionId: parsedSessionId,
          attachedMedia,
        });
      }
    }

    const modelMessages = await convertToModelMessages(messages);

    const result = runFixoAgent({ messages: modelMessages, userId });

    const response = result.toUIMessageStreamResponse({
      originalMessages,
      // Sync onFinish — `handleUIMessageStreamFinish` AWAITS this in the
      // stream's `flush()`, so any await here delays stream close on the
      // wire. The client sees `status === "streaming"` until we return,
      // even though the model already finished. Kick the persistence off
      // and let it run after the response has been flushed; localStorage
      // still has the transcript, so a transient DB error never costs the
      // user data.
      onFinish: ({ messages: finalMessages }) => {
        if (parsedSessionId === null) return;
        const ownerPredicate = auth.customerId !== undefined
          ? or(
            eq(schema.fixoSessions.userId, auth.userId),
            eq(schema.fixoSessions.customerId, auth.customerId),
          )
          : eq(schema.fixoSessions.userId, auth.userId);
        // Fire-and-forget. Surface failures via logs so we notice if the
        // pattern is systematic, not via a hung stream.
        db
          .update(schema.fixoSessions)
          .set({ messages: finalMessages })
          .where(
            and(
              eq(schema.fixoSessions.id, parsedSessionId),
              ownerPredicate,
            ),
          )
          .catch((err: unknown) => {
            logger.warn("Failed to persist chat transcript", {
              sessionId: parsedSessionId,
              error: err instanceof Error ? err.message : String(err),
            });
          });
      },
    });
    const duration = Date.now() - startTime;
    logger.info("Request finished", {
      userId,
      messageCount,
      duration,
      attachedMedia,
    });
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
