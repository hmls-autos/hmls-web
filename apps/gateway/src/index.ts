import { getLogger } from "@logtape/logtape";
import { createHmlsApp } from "./hmls-app.ts";
import { createFixoApp } from "./fixo-app.ts";
import { setupLogging } from "./logger.ts";

await setupLogging();
const serverLogger = getLogger(["hmls", "gateway", "server"]);

// ── Fail fast on required env vars ──
const DATABASE_URL = Deno.env.get("DATABASE_URL");
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required but not set");
}
if (!GOOGLE_API_KEY) {
  throw new Error("GOOGLE_API_KEY is required but not set");
}

// Warn on optional vars
for (
  const key of [
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
  ]
) {
  if (!Deno.env.get(key)) {
    serverLogger.warn(`Optional env var {key} is not set`, { key });
  }
}

const mainApp = createHmlsApp({ googleApiKey: GOOGLE_API_KEY });
const fixoApp = createFixoApp();

// ── Subdomain dispatch ──
const FIXO_HOSTS = ["api.fixo.hmls.autos", "api.fixo.ink", "fixo.localhost"];

function handler(request: Request): Response | Promise<Response> {
  const host = (request.headers.get("host") ?? "").split(":")[0];
  if (FIXO_HOSTS.includes(host)) {
    return fixoApp.fetch(request);
  }

  // Path-based routing: /fixo/* → fixo app (strip prefix)
  const url = new URL(request.url);
  if (url.pathname === "/fixo" || url.pathname.startsWith("/fixo/")) {
    const newPath = url.pathname.slice("/fixo".length) || "/";
    const newUrl = new URL(newPath + url.search, url.origin);
    return fixoApp.fetch(new Request(newUrl, request));
  }

  return mainApp.fetch(request);
}

// Start server
const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;
if (isDenoDeploy) {
  Deno.serve(handler);
  serverLogger.info("HMLS API running on Deno Deploy");
} else {
  const port = Number(Deno.env.get("HTTP_PORT")) || 8080;
  Deno.serve({ port }, handler);
  serverLogger.info(`HMLS API running on http://localhost:{port}`, { port });
  serverLogger.info(`Fixo API available at http://fixo.localhost:{port}`, { port });
}
