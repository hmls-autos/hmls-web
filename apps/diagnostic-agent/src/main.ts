import { Hono } from "hono";
import { cors } from "hono/cors";
import { streamSSE } from "hono/streaming";
import { eachValueFrom } from "rxjs-for-await";

import { createDiagnosticAgent } from "./agent.ts";
import { type AuthContext, authenticateRequest } from "./middleware/auth.ts";
import { processCredits } from "./middleware/credits.ts";
import { db } from "./db/client.ts";
import { diagnosticMedia, diagnosticSessions, obdCodes } from "./db/schema.ts";
import { desc, eq } from "drizzle-orm";
import { uploadMedia } from "./lib/r2.ts";
import type { InputType } from "./lib/stripe.ts";
import { createAguiEventStream, parseRunAgentInput } from "@zypher/agui";

const PORT = parseInt(Deno.env.get("PORT") || "8001");
const DEV_MODE = Deno.env.get("DEV_MODE") === "true";

// Agent singleton
let agent: Awaited<ReturnType<typeof createDiagnosticAgent>> | null = null;

async function getAgent() {
  if (!agent) {
    agent = await createDiagnosticAgent();
  }
  return agent;
}

// Type for Hono app with custom variables
type Variables = {
  auth: AuthContext;
};

const app = new Hono<{ Variables: Variables }>();

// CORS
app.use("*", cors());

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth middleware for all routes except health
app.use("/diagnostics/*", async (c, next) => {
  const authResult = await authenticateRequest(c.req.raw);
  if (authResult instanceof Response) {
    return authResult;
  }
  c.set("auth", authResult);
  await next();
});

app.use("/task", async (c, next) => {
  // Skip auth in dev mode for testing
  if (DEV_MODE) {
    console.log("[diagnostic-agent] DEV_MODE: skipping auth");
    await next();
    return;
  }
  const authResult = await authenticateRequest(c.req.raw);
  if (authResult instanceof Response) {
    return authResult;
  }
  c.set("auth", authResult);
  await next();
});

// POST /diagnostics - Start new session
app.post("/diagnostics", async (c) => {
  const auth = c.get("auth");

  const [session] = await db
    .insert(diagnosticSessions)
    .values({ customerId: auth.customerId })
    .returning();

  return c.json({
    sessionId: session.id,
    status: session.status,
    message: "Diagnostic session started. Send inputs to analyze.",
  });
});

// GET /diagnostics - List sessions
app.get("/diagnostics", async (c) => {
  const auth = c.get("auth");

  const sessions = await db
    .select()
    .from(diagnosticSessions)
    .where(eq(diagnosticSessions.customerId, auth.customerId))
    .orderBy(desc(diagnosticSessions.createdAt));

  return c.json({ sessions });
});

// GET /diagnostics/:id - Get session details
app.get("/diagnostics/:id", async (c) => {
  const auth = c.get("auth");
  const sessionId = parseInt(c.req.param("id"));

  const [session] = await db
    .select()
    .from(diagnosticSessions)
    .where(eq(diagnosticSessions.id, sessionId))
    .limit(1);

  if (!session || session.customerId !== auth.customerId) {
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

// POST /diagnostics/:id/input - Process input (non-streaming)
app.post("/diagnostics/:id/input", async (c) => {
  const auth = c.get("auth");
  const sessionId = parseInt(c.req.param("id"));

  const [session] = await db
    .select()
    .from(diagnosticSessions)
    .where(eq(diagnosticSessions.id, sessionId))
    .limit(1);

  if (!session || session.customerId !== auth.customerId) {
    return c.json({ error: "Session not found" }, 404);
  }

  const body = await c.req.json();
  const { type, content, filename, contentType, durationSeconds } = body;

  // Validate input type
  const validTypes = ["text", "obd", "photo", "audio", "video"];
  if (!validTypes.includes(type)) {
    return c.json({ error: "Invalid input type" }, 400);
  }

  // Check and deduct credits
  const creditResult = await processCredits(
    auth.stripeCustomerId,
    type as InputType,
    sessionId,
    durationSeconds,
  );
  if (creditResult instanceof Response) {
    return creditResult;
  }

  // Update session credits
  await db
    .update(diagnosticSessions)
    .set({
      creditsCharged: session.creditsCharged + creditResult.charged,
      status: "processing",
    })
    .where(eq(diagnosticSessions.id, sessionId));

  // Handle different input types
  let agentInput: string;

  if (type === "text") {
    agentInput = content;
  } else if (type === "obd") {
    await db.insert(obdCodes).values({
      sessionId,
      code: content,
      source: "manual",
    });
    agentInput = `OBD-II Code: ${content}`;
  } else if (type === "photo" || type === "audio" || type === "video") {
    const binaryData = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
    const uploadResult = await uploadMedia(
      binaryData,
      filename,
      contentType,
      String(sessionId),
    );

    await db.insert(diagnosticMedia).values({
      sessionId,
      type: type === "photo" ? "photo" : type === "audio" ? "audio" : "video",
      r2Key: uploadResult.key,
      creditCost: creditResult.charged,
      metadata: { filename, contentType, durationSeconds },
    });

    agentInput = `[${type.toUpperCase()} uploaded: ${filename}] URL: ${uploadResult.url}`;
  } else {
    agentInput = content;
  }

  // Use AG-UI stream but collect final response
  const agentInstance = await getAgent();
  const messageId = crypto.randomUUID();
  const aguiStream = createAguiEventStream({
    agent: agentInstance,
    messages: [{ id: messageId, role: "user", content: agentInput }],
    threadId: `session-${sessionId}`,
    runId: crypto.randomUUID(),
  });

  // Collect the final text response
  let responseText = "";
  for await (const event of eachValueFrom(aguiStream)) {
    // Type assertion for events with delta property
    const evt = event as { type: string; delta?: string };
    if (evt.type === "TEXT_MESSAGE_CONTENT" && evt.delta) {
      responseText += evt.delta;
    }
  }

  return c.json({
    response: responseText,
    creditsCharged: creditResult.charged,
    sessionCreditsTotal: session.creditsCharged + creditResult.charged,
  });
});

// AG-UI streaming endpoint for real-time chat
app.post("/task", async (c) => {
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

  const agentInstance = await getAgent();
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

// Start server
const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
if (isDenoDeploy) {
  Deno.serve(app.fetch);
  console.log(`[diagnostic-agent] Running on Deno Deploy`);
} else {
  Deno.serve({ port: PORT }, app.fetch);
  console.log(`[diagnostic-agent] Running on http://localhost:${PORT}`);
  if (DEV_MODE) {
    console.log(
      `[diagnostic-agent] DEV_MODE enabled - /task endpoint auth bypassed`,
    );
  }
}
