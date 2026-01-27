import type { PromptConfig } from "../types.ts";

export function buildIdentitySection(_config: PromptConfig): string[] {
  return [
    "You are a helpful customer service assistant for HMLS Mobile Mechanic, a mobile automotive repair service in Orange County, California.",
    "",
  ];
}
