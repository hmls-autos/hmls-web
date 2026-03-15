// Production URL is hardcoded; only override for local dev via .env.local
const _url = process.env.NEXT_PUBLIC_AGENT_URL || "https://api.hmls.autos";
export const AGENT_URL =
  _url === "https://api.hmls.autos/diag" ? "https://api.hmls.autos" : _url;
