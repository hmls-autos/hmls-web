import type { FileUIPart, UIMessage } from "ai";
import { and, eq, isNull } from "drizzle-orm";
import { createSignedReadUrl } from "@hmls/agent";
import { db, schema } from "@hmls/agent/db";
import type { FixoMedia } from "@hmls/agent/db";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["hmls", "gateway", "fixo", "hydrate-media"]);

const SIGNED_URL_TTL_SECONDS = 900; // 15 min — outlives any practical Gemini fetch

interface SessionEvidence {
  obdCodes: string[];
  photoFileParts: FileUIPart[];
}

/**
 * Mode controls whether we filter to only-new rows and mark them hydrated:
 *
 *  - "task": atomically claims rows where `hydratedAt IS NULL`, marks them
 *    hydrated, and returns only those. Concurrent /task calls won't double-
 *    attach the same photo.
 *  - "complete": reads every completed media row, never mutates. /complete
 *    needs the full evidence list for the structured-output summary.
 */
type EvidenceMode = "task" | "complete";

async function loadMediaRows(
  sessionId: number,
  mode: EvidenceMode,
): Promise<FixoMedia[]> {
  if (mode === "task") {
    return await db
      .update(schema.fixoMedia)
      .set({ hydratedAt: new Date() })
      .where(
        and(
          eq(schema.fixoMedia.sessionId, sessionId),
          eq(schema.fixoMedia.processingStatus, "complete"),
          isNull(schema.fixoMedia.hydratedAt),
        ),
      )
      .returning();
  }
  return await db
    .select()
    .from(schema.fixoMedia)
    .where(
      and(
        eq(schema.fixoMedia.sessionId, sessionId),
        eq(schema.fixoMedia.processingStatus, "complete"),
      ),
    );
}

/**
 * Fetch the server-side evidence (uploaded photos and stored OBD-II codes)
 * for a session, gated by ownership. Returns parts ready to splice into a
 * UIMessage array. Used by both /task hydration and /complete summarization.
 *
 * Photos return as FileUIPart with short-lived signed URLs (15 min) — long
 * enough for one Gemini fetch, short enough not to leak as durable links.
 *
 * `mode` selects task vs complete semantics — see EvidenceMode above.
 */
async function loadSessionEvidence(
  sessionId: number,
  authUserId: string,
  authCustomerId: number | undefined,
  mode: EvidenceMode,
): Promise<SessionEvidence | null> {
  // Verify the caller owns the session before we surface any URLs or codes.
  // /task mode mutates fixoMedia (claims rows for hydration), so the
  // ownership check MUST gate that mutation — otherwise a user could mark
  // someone else's media hydrated by guessing their session id, suppressing
  // legit hydration on the next /task call from the real owner.
  const [session] = await db
    .select()
    .from(schema.fixoSessions)
    .where(eq(schema.fixoSessions.id, sessionId))
    .limit(1);
  if (
    !session ||
    (session.userId !== authUserId && session.customerId !== authCustomerId)
  ) {
    return null;
  }

  const [mediaRows, obdRows] = await Promise.all([
    loadMediaRows(sessionId, mode),
    db
      .select()
      .from(schema.obdCodes)
      .where(eq(schema.obdCodes.sessionId, sessionId)),
  ]);

  const photoFileParts: FileUIPart[] = [];
  for (const row of mediaRows) {
    const meta = (row.metadata ?? {}) as { contentType?: string };
    // Photo and the spectrogram-stored-as-photo case both render as image
    // parts. Audio/video rows are skipped here — Gemini's audio/video file
    // part support via @ai-sdk/google is unverified for our flow (codex #8,
    // tracked in TODOS.md).
    if (row.type !== "photo") continue;
    const mediaType = meta.contentType ?? "image/jpeg";

    try {
      const signedUrl = await createSignedReadUrl(
        row.storageKey,
        SIGNED_URL_TTL_SECONDS,
      );
      photoFileParts.push({ type: "file", mediaType, url: signedUrl });
    } catch (err) {
      logger.warn("Failed to sign URL for media row {mediaId}", {
        mediaId: row.id,
        sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    obdCodes: obdRows.map((r) => r.code),
    photoFileParts,
  };
}

/**
 * Attach NEW session evidence (photos uploaded since the last /task call) to
 * the LATEST user message. Each fixoMedia row is hydrated exactly once in its
 * lifetime — `hydratedAt` is set atomically by `loadMediaRows("task")` so
 * follow-up text turns don't re-feed (and re-bill) the same image to the
 * model. Mutates `messages` in place; returns the count of FileUIParts added.
 *
 * OBD-II codes are NOT filtered here — they're short text and the obd_codes
 * table doesn't carry a hydratedAt column. Re-injecting them costs ~5 tokens
 * per turn and keeps the codes visible if the user buries them under chatter.
 */
export async function hydrateSessionMedia(
  messages: UIMessage[],
  sessionId: number,
  authUserId: string,
  authCustomerId: number | undefined,
): Promise<number> {
  if (messages.length === 0) return 0;

  const evidence = await loadSessionEvidence(
    sessionId,
    authUserId,
    authCustomerId,
    "task",
  );
  if (!evidence) return 0;
  if (evidence.obdCodes.length === 0 && evidence.photoFileParts.length === 0) {
    return 0;
  }

  let target: UIMessage | undefined;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      target = messages[i];
      break;
    }
  }
  if (!target) return 0;
  if (!Array.isArray(target.parts)) target.parts = [];

  if (evidence.obdCodes.length > 0) {
    target.parts.push({
      type: "text",
      text: `Stored OBD-II codes for this session: ${evidence.obdCodes.join(", ")}`,
    });
  }
  for (const part of evidence.photoFileParts) {
    target.parts.push(part);
  }

  return evidence.photoFileParts.length;
}

/**
 * PREPEND a synthetic user message containing all session evidence to the
 * front of the transcript. Used by /complete because we're summarizing the
 * whole conversation, not advancing the active turn — the LLM should have
 * the photos and OBD codes as session-wide context from the start, before
 * the assistant turns that referenced them. Without this, multi-turn
 * sessions would put evidence after the diagnosis, breaking attribution.
 *
 * Mutates `messages` in place; returns the count of FileUIParts added.
 */
export async function prependSessionEvidence(
  messages: UIMessage[],
  sessionId: number,
  authUserId: string,
  authCustomerId: number | undefined,
): Promise<number> {
  // /complete needs every uploaded photo so the structured-output summary can
  // attribute the diagnosis. Pass mode="complete" to read all rows without
  // mutating hydratedAt — otherwise calling Report after a chat would mark
  // every row hydrated and a follow-up /task would attach nothing.
  const evidence = await loadSessionEvidence(
    sessionId,
    authUserId,
    authCustomerId,
    "complete",
  );
  if (!evidence) return 0;
  if (evidence.obdCodes.length === 0 && evidence.photoFileParts.length === 0) {
    return 0;
  }

  const introText = "Session evidence (uploaded by the user during this " +
    "diagnostic session, listed here as session-wide context):";

  const parts: UIMessage["parts"] = [{ type: "text", text: introText }];
  if (evidence.obdCodes.length > 0) {
    parts.push({
      type: "text",
      text: `OBD-II codes: ${evidence.obdCodes.join(", ")}`,
    });
  }
  for (const part of evidence.photoFileParts) {
    parts.push(part);
  }

  messages.unshift({
    id: `session-evidence-${sessionId}`,
    role: "user",
    parts,
  });

  return evidence.photoFileParts.length;
}
