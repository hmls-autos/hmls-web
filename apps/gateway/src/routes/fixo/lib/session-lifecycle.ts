import { and, eq } from "drizzle-orm";
import { db, schema } from "@hmls/agent/db";
import { getLogger } from "@logtape/logtape";

const logger = getLogger(["hmls", "gateway", "fixo", "lifecycle"]);

/**
 * Re-open a previously-finalized session when the user keeps interacting.
 *
 * After /complete writes status='complete' + result, follow-up activity (a
 * new /task turn or another /sessions/:id/input) means the prior diagnosis
 * is stale: the new conversation deserves a fresh report. Flip the row back
 * to 'processing' and null out result/completedAt so /complete's cache
 * short-circuit doesn't return the stale snapshot on the next Report click.
 *
 * No-op if the session isn't currently 'complete'. Single atomic UPDATE,
 * cheap to call on hot paths.
 */
export async function reopenIfComplete(sessionId: number): Promise<boolean> {
  const updated = await db
    .update(schema.fixoSessions)
    .set({ status: "processing", result: null, completedAt: null })
    .where(
      and(
        eq(schema.fixoSessions.id, sessionId),
        eq(schema.fixoSessions.status, "complete"),
      ),
    )
    .returning({ id: schema.fixoSessions.id });
  const reopened = updated.length > 0;
  if (reopened) {
    logger.info("Reopened completed session on follow-up activity", {
      sessionId,
    });
  }
  return reopened;
}
