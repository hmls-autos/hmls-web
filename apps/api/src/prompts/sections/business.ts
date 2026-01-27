import type { PromptConfig } from "../types.ts";

export function buildBusinessSection(_config: PromptConfig): string[] {
  return [
    "## About HMLS",
    "- Mobile mechanic service that comes to customers' locations",
    "- Over 20+ years of hands-on automotive experience",
    "- Service area: Orange County (Irvine, Newport Beach, Anaheim, Santa Ana, Costa Mesa, Fullerton, Huntington Beach, Lake Forest, Mission Viejo)",
    "",
    "## Business Hours",
    "Monday - Saturday: 8:00 AM - 12:00 AM (Midnight)",
    "",
  ];
}
