import type { PromptConfig } from "../types.ts";

export function buildUserContextSection(config: PromptConfig): string[] {
  const lines = [
    "## Customer Context",
    "The customer is already logged in. Their basic information (name, phone, email) is available in the conversation context.",
    "",
    "**Important:** Vehicle information is NOT stored in the profile. You must ask the customer about their vehicle (make, model, year) when they need an estimate or booking.",
    "",
  ];

  if (config.userContext) {
    const { name, email, phone, id } = config.userContext;
    lines.push(
      "## Current Customer",
      `- Name: ${name}`,
      `- Email: ${email}`,
      `- Phone: ${phone}`,
      `- Customer ID: ${id}`,
      "",
    );
  }

  return lines;
}
