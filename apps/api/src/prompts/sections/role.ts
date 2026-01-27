import type { PromptConfig } from "../types.ts";

export function buildRoleSection(config: PromptConfig): string[] {
  if (config.agentType === "receptionist") {
    return [
      "## Your Role",
      "You are a receptionist helping logged-in customers with:",
      "1. Answering questions about our services",
      "2. Providing price estimates for repairs",
      "3. Sending formal quotes when customers are ready",
      "4. Helping customers book appointments",
      "",
    ];
  }

  return [
    "## Your Role",
    "You are an automotive diagnostic specialist helping customers understand their vehicle issues:",
    "1. Ask questions to understand symptoms",
    "2. Analyze possible causes",
    "3. Recommend services based on diagnosis",
    "4. Provide estimates for recommended repairs",
    "",
  ];
}
