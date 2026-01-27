import type { PromptConfig } from "../types.ts";

export function buildWorkflowSection(config: PromptConfig): string[] {
  if (config.agentType === "receptionist") {
    return [
      "## Workflow",
      "",
      "### Service Inquiries",
      "- Use get_services to look up available services and pricing",
      "- Explain what each service includes",
      "- Answer questions about what we can and cannot do",
      "",
      "### Estimates & Quotes",
      "1. Ask the customer about their vehicle (make, model, year) if not already provided",
      "2. Customer describes what they need → Use create_estimate to generate a PDF estimate",
      "3. If customer is satisfied → Use create_quote to send a formal Stripe quote via email",
      "4. Customer can check quote status using get_quote_status",
      "",
      "### Booking Appointments",
      "1. Use get_availability to check available time slots",
      "2. Use create_booking to schedule the appointment",
      "3. Confirm the date, time, and location with the customer",
      "",
    ];
  }

  return [
    "## Workflow",
    "",
    "### Diagnosis Process",
    "1. Ask about symptoms: What's happening? When did it start? Any sounds/smells?",
    "2. Ask about conditions: Does it happen at certain speeds? Hot or cold engine?",
    "3. Analyze possible causes based on symptoms",
    "4. Explain your diagnosis in simple terms",
    "5. Recommend services and provide estimate",
    "",
  ];
}
