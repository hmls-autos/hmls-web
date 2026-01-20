import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { streamSSE } from "hono/streaming";
import { eachValueFrom } from "rxjs-for-await";
import { renderToStream } from "@react-pdf/renderer";

import { env } from "./env.ts";
import { createHmlsAgent } from "./agent.ts";
import { db } from "./db/client.ts";
import * as schema from "./db/schema.ts";
import { eq, and } from "drizzle-orm";
import { EstimatePdf } from "./pdf/EstimatePdf.tsx";
import { AppError, Errors } from "./lib/errors.ts";
import { createAguiEventStream, parseRunAgentInput } from "@zypher/agui";

// Agent singleton
let agentInstance: Awaited<ReturnType<typeof createHmlsAgent>> | null = null;
async function getAgent() {
  if (!agentInstance) {
    agentInstance = await createHmlsAgent();
  }
  return agentInstance;
}

// Create Hono app
const app = new Hono();

// Middleware
app.use("*", cors());
app.use("*", logger());

// Global error handler
app.onError((err, c) => {
  if (err instanceof AppError) {
    console.error(`[error] ${err.code}: ${err.message}`);
    return c.json(err.toJSON(), err.status);
  }
  console.error(`[error] Unhandled:`, err);
  return c.json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: { code: "NOT_FOUND", message: "Route not found" } }, 404);
});

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// GET estimate by ID
app.get("/api/estimates/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [estimate] = await db
    .select()
    .from(schema.estimates)
    .where(eq(schema.estimates.id, id))
    .limit(1);

  if (!estimate) throw Errors.notFound("Estimate", id);
  return c.json(estimate);
});

// GET customer by ID
app.get("/api/customers/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id))
    .limit(1);

  if (!customer) throw Errors.notFound("Customer", id);
  return c.json(customer);
});

// GET estimate PDF
app.get("/api/estimates/:id/pdf", async (c) => {
  const id = Number(c.req.param("id"));
  const token = c.req.query("token");

  const [estimate] = await db
    .select()
    .from(schema.estimates)
    .where(
      token
        ? and(eq(schema.estimates.id, id), eq(schema.estimates.shareToken, token))
        : eq(schema.estimates.id, id)
    )
    .limit(1);

  if (!estimate) throw Errors.notFound("Estimate", id);

  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, estimate.customerId))
    .limit(1);

  if (!customer) throw Errors.notFound("Customer", estimate.customerId);

  const pdfStream = await renderToStream(
    EstimatePdf({
      estimate: {
        ...estimate,
        items: estimate.items as { name: string; description: string; price: number }[],
      },
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        vehicleInfo: customer.vehicleInfo as { make?: string; model?: string; year?: string } | null,
      },
    })
  );

  return new Response(pdfStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="HMLS-Estimate-${id}.pdf"`,
    },
  });
});

// AG-UI chat endpoint
app.post("/task", async (c) => {
  const body = await c.req.json();

  let input;
  try {
    input = parseRunAgentInput(body);
  } catch (parseError) {
    throw Errors.validation("Invalid AG-UI input", String(parseError));
  }

  const { threadId, runId, messages } = input;
  console.log(`[agent] threadId=${threadId}, messages=${messages.length}`);

  const agent = await getAgent();
  const aguiStream = createAguiEventStream({ agent, messages, threadId, runId });

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

// Start server
Deno.serve({ port: env.HTTP_PORT }, app.fetch);
console.log(`[server] HMLS Agent running on http://localhost:${env.HTTP_PORT}`);
