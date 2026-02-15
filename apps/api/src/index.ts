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
import { and, eq } from "drizzle-orm";
import { EstimatePdf } from "./pdf/EstimatePdf.tsx";
import { AppError, Errors } from "@hmls/shared/errors";
import { createAguiEventStream, parseRunAgentInput } from "@zypher/agui";
import type { UserContext } from "./types/user-context.ts";

// Agent cache by user ID (or singleton for anonymous)
const agentCache = new Map<
  string,
  Awaited<ReturnType<typeof createHmlsAgent>>
>();

async function getAgent(userContext?: UserContext) {
  const cacheKey = userContext ? `user:${userContext.id}` : "anonymous";

  if (!agentCache.has(cacheKey)) {
    const agent = await createHmlsAgent({ userContext });
    agentCache.set(cacheKey, agent);
  }

  return agentCache.get(cacheKey)!;
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
    return c.json(
      err.toJSON(),
      err.status as 400 | 401 | 403 | 404 | 422 | 500 | 502,
    );
  }
  console.error(`[error] Unhandled:`, err);
  return c.json({
    error: { code: "INTERNAL_ERROR", message: "Internal server error" },
  }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json(
    { error: { code: "NOT_FOUND", message: "Route not found" } },
    404,
  );
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
        ? and(
          eq(schema.estimates.id, id),
          eq(schema.estimates.shareToken, token),
        )
        : eq(schema.estimates.id, id),
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
        items: estimate.items as {
          name: string;
          description: string;
          price: number;
        }[],
      },
      customer: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        vehicleInfo: customer.vehicleInfo as {
          make?: string;
          model?: string;
          year?: string;
        } | null,
      },
    }),
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

// Start server
// Deno Deploy manages its own port, only specify port for local dev
const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
if (isDenoDeploy) {
  Deno.serve(app.fetch);
  console.log(`[server] HMLS Agent running on Deno Deploy`);
} else {
  Deno.serve({ port: env.HTTP_PORT }, app.fetch);
  console.log(
    `[server] HMLS Agent running on http://localhost:${env.HTTP_PORT}`,
  );
}
