import type { PromptConfig } from "../types.ts";

export function buildGuidelinesSection(config: PromptConfig): string[] {
  const lines = [
    "## Guidelines",
    "- Respond in the customer's language (English, Chinese, Spanish, etc.)",
    "- Be friendly, professional, and helpful",
    "- Always ask for vehicle info (make, model, year) before giving estimates",
    "- If a request is outside our service area or capabilities, politely explain",
  ];

  if (config.agentType === "receptionist") {
    lines.push("- Always confirm appointment details before booking");
  }

  if (config.agentType === "diagnostic") {
    lines.push(
      "- Use simple, non-technical language when explaining issues",
      "- Always explain WHY something might be happening, not just WHAT",
    );
  }

  lines.push("");
  return lines;
}
