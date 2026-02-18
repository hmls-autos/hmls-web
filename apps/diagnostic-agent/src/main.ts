import { Hono } from "hono";
import { cors } from "hono/cors";
import { type AuthContext, authenticateRequest } from "./middleware/auth.ts";
import { sessions } from "./routes/sessions.ts";
import { input } from "./routes/input.ts";
import { chat } from "./routes/chat.ts";
import { billing, webhookHandler } from "./routes/billing.ts";
import { reports } from "./routes/reports.ts";
import { vehicleRoutes } from "./routes/vehicles.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8001");
const DEV_MODE = Deno.env.get("DEV_MODE") === "true";

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

// Auth middleware for billing routes (except webhook)
app.use("/billing/checkout", async (c, next) => {
  const authResult = await authenticateRequest(c.req.raw);
  if (authResult instanceof Response) {
    return authResult;
  }
  c.set("auth", authResult);
  await next();
});

app.use("/billing/portal", async (c, next) => {
  const authResult = await authenticateRequest(c.req.raw);
  if (authResult instanceof Response) {
    return authResult;
  }
  c.set("auth", authResult);
  await next();
});

// Auth middleware for vehicles
app.use("/vehicles", async (c, next) => {
  const authResult = await authenticateRequest(c.req.raw);
  if (authResult instanceof Response) {
    return authResult;
  }
  c.set("auth", authResult);
  await next();
});
app.use("/vehicles/*", async (c, next) => {
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

// Mount routes
app.route("/diagnostics", sessions);
app.route("/diagnostics", input);
app.route("/diagnostics", reports);
app.route("/task", chat);
app.route("/vehicles", vehicleRoutes);
app.route("/billing", billing);
app.route("/billing/webhook", webhookHandler);

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
