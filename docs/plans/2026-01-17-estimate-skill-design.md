# Estimate Skill Design

## Overview

A comprehensive estimate skill for the HMLS agent that generates downloadable PDF estimates for
customers. The skill includes a pricing engine with vehicle-based multipliers, tiered parts markup,
and dynamic fees.

## Architecture

### Skill Module Structure

```
apps/agent/src/skills/
└── estimate/
    ├── index.ts        # Exports skill object
    ├── tools.ts        # create_estimate, get_estimate
    ├── pricing.ts      # Pricing calculation engine
    ├── prompt.ts       # Estimate-specific instructions
    └── schema.ts       # Database schema additions
```

### Skill Export

```typescript
// skills/estimate/index.ts
import { createEstimateTool, getEstimateTool } from "./tools.ts";
import { ESTIMATE_PROMPT } from "./prompt.ts";

export const estimateSkill = {
  name: "estimate",
  tools: [createEstimateTool, getEstimateTool],
  prompt: ESTIMATE_PROMPT,
};
```

### Agent Integration

```typescript
// agent.ts
import { estimateSkill } from "./skills/estimate/index.ts";

const agent = await createZypherAgent({
  tools: [...estimateSkill.tools, ...otherTools],
  overrides: {
    systemPromptLoader: async () => BASE_PROMPT + "\n\n" + estimateSkill.prompt,
  },
});
```

---

## Pricing Model

### Base Rates

- **Labor rate:** $140/hr (for hourly services)
- **Diagnostic fee:** $95 (complex electrical/computer only, waived if repair proceeds)

### Vehicle Multipliers

Per-make pricing with model-level overrides:

- Search for exact make + model match
- If not found, fall back to make with `model: null`
- If still not found, default to 1.0

Examples:

| Make    | Model     | Multiplier |
| ------- | --------- | ---------- |
| Toyota  | (default) | 1.0        |
| Toyota  | Supra     | 1.30       |
| Honda   | S2000     | 1.20       |
| BMW     | (default) | 1.25       |
| BMW     | M3        | 1.40       |
| BMW     | M5        | 1.45       |
| Porsche | (default) | 1.40       |
| Audi    | R8        | 1.50       |

### Parts Markup (on OEM cost)

Tiered markup structure:

- Parts under $50: +40%
- Parts $50-200: +30%
- Parts over $200: +20%

### Dynamic Fees

- **Travel:** Free within Orange County
- **After 8PM:** +$50
- **Same-day rush:** +$75
- Fees can stack (late + rush = +$125)

### Service Types

- **Flat-rate services:** Fixed price × vehicle multiplier
- **Hourly services:** ($140 × hours × vehicle multiplier) + parts

---

## Database Schema

### Estimates Table

```sql
CREATE TABLE estimates (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),

  -- Line items as JSON array
  items JSONB NOT NULL,
  -- [{ name, description, price }]

  -- Pricing
  subtotal INTEGER NOT NULL,        -- in cents
  price_range_low INTEGER NOT NULL, -- in cents
  price_range_high INTEGER NOT NULL,-- in cents

  -- Optional notes from agent
  notes TEXT,

  -- Sharing
  share_token VARCHAR(32) UNIQUE,

  -- Validity
  valid_days INTEGER NOT NULL DEFAULT 14,
  expires_at TIMESTAMP NOT NULL,

  -- Tracking
  converted_to_quote_id INTEGER REFERENCES quotes(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Vehicle Pricing Table

```sql
CREATE TABLE vehicle_pricing (
  id SERIAL PRIMARY KEY,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50),  -- NULL = make-level default
  multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
  notes TEXT,

  UNIQUE(make, model)
);
```

### Pricing Config Table

```sql
CREATE TABLE pricing_config (
  key VARCHAR(50) PRIMARY KEY,
  value INTEGER NOT NULL,  -- cents or percentage
  description TEXT
);

INSERT INTO pricing_config (key, value, description) VALUES
  ('hourly_rate', 14000, 'Base labor rate in cents ($140)'),
  ('diagnostic_fee', 9500, 'Complex diagnostic fee in cents ($95)'),
  ('after_hours_fee', 5000, 'After 8PM fee in cents ($50)'),
  ('rush_fee', 7500, 'Same-day rush fee in cents ($75)'),
  ('parts_markup_tier1_pct', 40, 'Markup % for parts under $50'),
  ('parts_markup_tier2_pct', 30, 'Markup % for parts $50-200'),
  ('parts_markup_tier3_pct', 20, 'Markup % for parts over $200');
```

---

## PDF Generation

### Technology

- **Library:** `@react-pdf/renderer`
- **Generation:** Server-side via API endpoint
- **Style:** Clean & modern, emerald accent, sans-serif fonts

### PDF Template Layout

**Header Section:**

- HMLS logo (left)
- "ESTIMATE" title (right)
- Estimate # and date
- Valid until date

**Customer Section:**

- Customer name, phone, email
- Service address
- Vehicle: Year Make Model

**Line Items Table:**

| Service               | Description                | Price       |
| --------------------- | -------------------------- | ----------- |
| Brake Pad Replacement | Front brake pads           | $356.25     |
| Brake Fluid Flush     | Complete fluid replacement | $118.75     |
|                       | **Subtotal**               | $475.00     |
|                       | **Estimated Range**        | $427 - $523 |

_Note: Prices shown are final. Vehicle adjustments and fees are applied internally but not
displayed._

**Footer Section:**

- Disclaimer: "This estimate is valid for 14 days. Final price may vary based on conditions found
  during service."
- Terms: Payment due upon completion, accepted methods
- CTA: "Ready to proceed? Reply in chat or call (XXX) XXX-XXXX"
- HMLS contact info and service area

---

## API Endpoint

### GET /api/estimates/:id/pdf

Dual-access model:

1. **Authenticated (owner):** `/api/estimates/:id/pdf`
2. **Shareable link:** `/api/estimates/:id/pdf?token=abc123`

```typescript
export async function getEstimatePdf(req, res) {
  const { id } = req.params;
  const { token } = req.query;

  let estimate;

  if (token) {
    // Public access via share token
    estimate = await db.query.estimates.findFirst({
      where: and(
        eq(schema.estimates.id, id),
        eq(schema.estimates.shareToken, token),
      ),
      with: { customer: true },
    });
  } else if (req.user) {
    // Authenticated owner access
    estimate = await db.query.estimates.findFirst({
      where: and(
        eq(schema.estimates.id, id),
        eq(schema.estimates.customerId, req.user.id),
      ),
      with: { customer: true },
    });
  }

  if (!estimate) return res.status(404);

  const pdfStream = await renderToStream(
    <EstimatePdf estimate={estimate} customer={estimate.customer} />,
  );

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="HMLS-Estimate-${id}.pdf"`,
  );
  pdfStream.pipe(res);
}
```

---

## Skill Tools

### create_estimate

```typescript
export const createEstimateTool = {
  name: "create_estimate",
  description:
    "Generate a downloadable PDF estimate for a customer. Requires existing customer with vehicle info.",
  parameters: z.object({
    customerId: z.number().describe("Customer ID from database"),
    services: z.array(
      z.object({
        serviceId: z.number().optional().describe("Service ID from catalog"),
        name: z.string().describe("Service name"),
        description: z.string().describe("Brief description"),
        laborHours: z.number().optional().describe(
          "Labor hours (for hourly services)",
        ),
        partsCost: z.number().optional().describe(
          "Estimated parts cost in dollars",
        ),
      }),
    ),
    notes: z.string().optional(),
    validDays: z.number().default(14),
    isRush: z.boolean().default(false).describe("Same-day service"),
    isAfterHours: z.boolean().default(false).describe("After 8PM appointment"),
  }),
};
```

**Returns:**

```typescript
{
  success: true,
  estimateId: number,
  downloadUrl: string,      // Authenticated access
  shareUrl: string,         // Public shareable link
  subtotal: number,         // In dollars
  priceRange: string,       // "$X - $Y"
  expiresAt: Date,
}
```

### get_estimate

```typescript
export const getEstimateTool = {
  name: "get_estimate",
  description: "Retrieve an existing estimate by ID",
  parameters: z.object({
    estimateId: z.number().describe("Estimate ID"),
  }),
};
```

---

## Skill Prompt

```
## Estimate Skill

You can create downloadable PDF estimates for customers.

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
3. Call create_estimate with customerId and itemized services
4. Present the download link to the customer
5. Ask if they'd like to proceed with a formal quote

### Pricing
The system automatically applies:
- Vehicle-specific pricing adjustments
- Parts markup
- Rush/after-hours fees when applicable

### Response Format
After creating an estimate, say something like:
"I've prepared an estimate for you. **[Download your estimate (PDF)](downloadUrl)**

If you'd like to share this estimate, here's a link: [Share estimate](shareUrl)

This includes [brief summary]. Valid for 14 days. Would you like me to send a formal quote?"
```

---

## Pricing Helper

```typescript
// skills/estimate/pricing.ts
export async function calculatePrice(
  service: ServiceInput,
  vehicleMultiplier: number,
): Promise<LineItem> {
  const config = await getPricingConfig();

  let laborCost = 0;
  let partsCost = 0;

  // Labor calculation
  if (service.laborHours) {
    // Hourly service
    laborCost = Math.round(
      config.hourlyRate * service.laborHours * vehicleMultiplier,
    );
  } else if (service.serviceId) {
    // Flat-rate from catalog
    const catalogService = await getService(service.serviceId);
    laborCost = Math.round(catalogService.basePrice * vehicleMultiplier);
  }

  // Parts markup (tiered)
  if (service.partsCost) {
    const costCents = service.partsCost * 100;
    let markupPct;

    if (costCents < 5000) markupPct = config.partsMarkupTier1; // 40%
    else if (costCents < 20000) markupPct = config.partsMarkupTier2; // 30%
    else markupPct = config.partsMarkupTier3; // 20%

    partsCost = Math.round(costCents * (1 + markupPct / 100));
  }

  return {
    name: service.name,
    description: service.description,
    price: laborCost + partsCost,
  };
}

export async function getVehicleMultiplier(
  make: string,
  model?: string,
): Promise<number> {
  // Try exact make + model match
  if (model) {
    const exact = await db.query.vehiclePricing.findFirst({
      where: and(
        eq(schema.vehiclePricing.make, make),
        eq(schema.vehiclePricing.model, model),
      ),
    });
    if (exact) return exact.multiplier;
  }

  // Fall back to make-level default
  const makeDefault = await db.query.vehiclePricing.findFirst({
    where: and(
      eq(schema.vehiclePricing.make, make),
      isNull(schema.vehiclePricing.model),
    ),
  });
  if (makeDefault) return makeDefault.multiplier;

  // Default multiplier
  return 1.0;
}
```

---

## Dependencies

Add to `apps/api/package.json`:

```json
{
  "@react-pdf/renderer": "^3.x"
}
```

---

## Summary

The estimate skill provides:

- Modular skill architecture for the HMLS agent
- Comprehensive pricing engine with vehicle multipliers and tiered parts markup
- PDF generation with clean, professional template
- Dual-access (authenticated + shareable links)
- Database persistence for tracking and analytics
- Conversion tracking to formal quotes
