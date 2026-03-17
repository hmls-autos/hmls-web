// Base URL for non-chat API calls (estimates, orders, etc.)
export const AGENT_URL =
  process.env.NEXT_PUBLIC_AGENT_URL ?? "https://api.hmls.autos";

// Chat endpoint: same-origin proxy in production to fix iOS Safari SSE streaming.
// Local dev: set NEXT_PUBLIC_AGENT_URL=http://localhost:8080 to hit the gateway directly.
export const CHAT_ENDPOINT = process.env.NEXT_PUBLIC_AGENT_URL
  ? `${process.env.NEXT_PUBLIC_AGENT_URL}/task`
  : "/api/chat";
