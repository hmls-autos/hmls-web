import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Hono } from "hono";
import { cors } from "hono/cors";
import task from "./routes/task.ts";

const app = new Hono();

// Middleware
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://hmls.autos"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Upgrade", "Connection", "Authorization"],
  }),
);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.route("/task", task);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

Deno.serve(app.fetch);
