import { Hono } from "hono";
import { db } from "../db/client.ts";
import {
  diagnosticMedia,
  diagnosticSessions,
  obdCodes,
} from "../db/schema.ts";
import { desc, eq, or } from "drizzle-orm";
import type { AuthContext } from "../middleware/auth.ts";

type Variables = { auth: AuthContext };

const sessions = new Hono<{ Variables: Variables }>();

// POST /diagnostics - Start new session
sessions.post("/", async (c) => {
  const auth = c.get("auth");

  const [session] = await db
    .insert(diagnosticSessions)
    .values({
      userId: auth.userId,
      customerId: auth.customerId ?? null,
    })
    .returning();

  return c.json({
    sessionId: session.id,
    status: session.status,
    message: "Diagnostic session started. Send inputs to analyze.",
  });
});

// GET /diagnostics - List sessions
sessions.get("/", async (c) => {
  const auth = c.get("auth");

  // Match by userId (SaaS) or customerId (legacy)
  const conditions = [eq(diagnosticSessions.userId, auth.userId)];
  if (auth.customerId) {
    conditions.push(eq(diagnosticSessions.customerId, auth.customerId));
  }

  const sessions_ = await db
    .select()
    .from(diagnosticSessions)
    .where(or(...conditions))
    .orderBy(desc(diagnosticSessions.createdAt));

  return c.json({ sessions: sessions_ });
});

// GET /diagnostics/:id - Get session details
sessions.get("/:id", async (c) => {
  const auth = c.get("auth");
  const sessionId = parseInt(c.req.param("id"));

  const [session] = await db
    .select()
    .from(diagnosticSessions)
    .where(eq(diagnosticSessions.id, sessionId))
    .limit(1);

  if (
    !session ||
    (session.userId !== auth.userId &&
      session.customerId !== auth.customerId)
  ) {
    return c.json({ error: "Session not found" }, 404);
  }

  const media = await db
    .select()
    .from(diagnosticMedia)
    .where(eq(diagnosticMedia.sessionId, sessionId));

  const codes = await db
    .select()
    .from(obdCodes)
    .where(eq(obdCodes.sessionId, sessionId));

  return c.json({ session, media, codes });
});

export { sessions };
