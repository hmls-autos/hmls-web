import { createMiddleware } from "hono/factory";
import { getLogger, withContext } from "@logtape/logtape";

const logger = getLogger(["hmls", "gateway", "http"]);

/**
 * Assigns a request id (honors inbound `X-Request-Id`, else generates one),
 * binds it into the logtape async context, and emits a single structured
 * access log when the response completes. Replaces `hono/logger`.
 *
 * Downstream handlers + agent code invoked within this request see
 * `{ requestId, method, path }` on every log record with no threading.
 */
export const requestContext = createMiddleware(async (c, next) => {
  const requestId = c.req.header("X-Request-Id") ?? crypto.randomUUID();
  const method = c.req.method;
  const path = c.req.path;
  c.header("X-Request-Id", requestId);

  const start = performance.now();
  await withContext({ requestId, method, path }, async () => {
    try {
      await next();
    } finally {
      const durationMs = Math.round(performance.now() - start);
      const status = c.res.status;
      const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
      logger[level]("http {method} {path} {status} ({durationMs}ms)", {
        status,
        durationMs,
      });
    }
  });
});
