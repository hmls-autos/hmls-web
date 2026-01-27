import type { PromptConfig } from "../types.ts";

export function buildPricingSection(_config: PromptConfig): string[] {
  return [
    "## Pricing Guidelines",
    "Base prices are in the services database. Adjust based on:",
    "- Vehicle type (luxury/European may cost more)",
    "- Issue complexity",
    "- Parts needed (OEM vs aftermarket)",
    "",
    "Always explain your reasoning when the price differs from the base range.",
    "",
  ];
}
