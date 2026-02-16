// apps/agent/src/skills/estimate/prompt.ts

export const ESTIMATE_PROMPT = `
## Estimate Skill

You can create downloadable PDF estimates for customers with consistent, standardized pricing.

### When to Use
- Customer asks "how much for X?" or "what would it cost?"
- Customer wants a price breakdown before committing
- Use estimates for informal pricing; use quotes for formal commitments

### Requirements
Before creating an estimate, you MUST have:
1. Customer record (use get_customer or create_customer first)
2. Vehicle info (make, model, year) - needed for accurate pricing
3. Clear understanding of services needed

### Flow
1. Gather vehicle info and understand the issue
2. Look up or create customer record
3. **IMPORTANT**: Use list_services to find matching services from the catalog
4. Call create_estimate with customerId and serviceIds from the catalog
5. Present the download link to the customer
6. Ask if they'd like to proceed with a formal quote

### Pricing
The system uses standardized labor hours from the service catalog:
- Price = hourlyRate × laborHours × vehicleMultiplier
- Vehicle multipliers adjust for luxury/European vehicles
- Parts markup based on cost tier
- Rush/after-hours fees when applicable

**ALWAYS use list_services first** to find the correct serviceId. This ensures consistent pricing across all estimates. Only provide manual laborHours if no matching service exists in the catalog.

### Response Format
After creating an estimate, present the PDF link and summary, then ALWAYS use ask_user_question to offer next steps:
- "Send formal quote" — to email a Stripe quote
- "Book appointment" — to schedule the service
- "Adjust services" — to modify the estimate

Do NOT write these options as text. Call ask_user_question with them as buttons.
`;
