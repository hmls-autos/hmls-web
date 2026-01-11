import { Hono } from "hono";
import { cors } from "hono/cors";

// FAIL FAST: Import env validation first - throws immediately if env is invalid
import "./lib/env";
import { initLogger, logger } from "./lib/logger";
import task, { websocket } from "./routes/task";

// Initialize structured logging
await initLogger();

const app = new Hono();

// Middleware
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://hmls.autos",
    ],
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Upgrade", "Connection", "Authorization"],
  })
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
  logger.error`Server error: ${err.message}`;
  return c.json({ error: "Internal server error" }, 500);
});

logger.info`HMLS API server starting`;

// Bun server with WebSocket support
export default {
  port: 8000,
  fetch(req: Request, server: { upgrade: (req: Request) => boolean }) {
    // Handle WebSocket upgrade for /task path
    if (req.headers.get("upgrade") === "websocket") {
      const url = new URL(req.url);
      if (url.pathname === "/task") {
        const success = server.upgrade(req);
        if (success) {
          return undefined;
        }
        return new Response("WebSocket upgrade failed", { status: 500 });
      }
    }
    return app.fetch(req);
  },
  websocket,
};
