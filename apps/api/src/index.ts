import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { AppError } from "@hmls/shared/errors";
import { estimates } from "./routes/estimates.ts";
import { customers } from "./routes/customers.ts";
import { chat, initChat } from "./routes/chat.ts";

// Read all env vars in one place
initChat({
  anthropicApiKey: Deno.env.get("ANTHROPIC_API_KEY") ?? "",
  stripeSecretKey: Deno.env.get("STRIPE_SECRET_KEY") ?? "",
  calcomApiKey: Deno.env.get("CALCOM_API_KEY") ?? "",
  calcomEventTypeId: Deno.env.get("CALCOM_EVENT_TYPE_ID") ?? "",
  agentModel: Deno.env.get("AGENT_MODEL"),
});

// Create Hono app
const app = new Hono();

// Middleware
app.use(
  "*",
  cors({
    origin: [
      "https://hmls.autos",
      "https://www.hmls.autos",
      "http://localhost:3000",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-User-Context"],
  }),
);
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

// Mount routes
app.route("/api/estimates", estimates);
app.route("/api/customers", customers);
app.route("/task", chat);

// Start server
const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
if (isDenoDeploy) {
  Deno.serve(app.fetch);
  console.log(`[server] HMLS Agent running on Deno Deploy`);
} else {
  const port = Number(Deno.env.get("HTTP_PORT")) || 8080;
  Deno.serve({ port }, app.fetch);
  console.log(`[server] HMLS Agent running on http://localhost:${port}`);
}
