// apps/agent/src/skills/estimate/index.ts

import { listServicesTool, createEstimateTool, getEstimateTool } from "./tools.ts";
import { ESTIMATE_PROMPT } from "./prompt.ts";

export const estimateSkill = {
  name: "estimate",
  description: "Generate and manage customer estimates with PDF download",
  tools: [listServicesTool, createEstimateTool, getEstimateTool],
  prompt: ESTIMATE_PROMPT,
};

// Re-export for direct access if needed
export { listServicesTool, createEstimateTool, getEstimateTool } from "./tools.ts";
export { ESTIMATE_PROMPT } from "./prompt.ts";
export * from "./types.ts";
export * from "./pricing.ts";
