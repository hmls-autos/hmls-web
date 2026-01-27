import type { PromptConfig, PromptSection } from "./types.ts";
import { buildIdentitySection } from "./sections/identity.ts";
import { buildBusinessSection } from "./sections/business.ts";
import { buildRoleSection } from "./sections/role.ts";
import { buildUserContextSection } from "./sections/user-context.ts";
import { buildWorkflowSection } from "./sections/workflow.ts";
import { buildGuidelinesSection } from "./sections/guidelines.ts";
import { buildPricingSection } from "./sections/pricing.ts";

const DEFAULT_SECTIONS: PromptSection[] = [
  buildIdentitySection,
  buildBusinessSection,
  buildRoleSection,
  buildUserContextSection,
  buildWorkflowSection,
  buildPricingSection,
  buildGuidelinesSection,
];

export function buildSystemPrompt(
  config: PromptConfig,
  sections: PromptSection[] = DEFAULT_SECTIONS,
): string {
  const lines: string[] = [];

  for (const section of sections) {
    lines.push(...section(config));
  }

  return lines.join("\n");
}
