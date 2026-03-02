// apps/agent/src/skills/estimate/prompt.ts

export const ESTIMATE_PROMPT = `
## Estimate Skill

You can create downloadable PDF estimates for customers with consistent, standardized pricing backed by real industry labor time data and real-time parts pricing.

### When to Use
- Customer asks "how much for X?" or "what would it cost?"
- Customer wants a price breakdown before committing
- Use estimates for informal pricing; use quotes for formal commitments

### Requirements
Before creating an estimate, you MUST have:
1. Customer record (use get_customer or create_customer first)
2. Vehicle info (make, model, year) - needed for accurate pricing, labor lookup, AND parts lookup
3. Clear understanding of services needed

### Flow
1. Gather vehicle info (year, make, model) and understand the issue
2. Look up or create customer record
3. Try \`lookup_labor_time\` for standard services — if no OLP data, estimate hours yourself
4. Try \`lookup_parts_price\` for parts pricing — if unavailable, estimate based on knowledge
5. For flat-rate or custom work, use \`customItems\` instead of the labor+parts model
6. Determine applicable fees and discounts (see below)
7. Call \`create_estimate\` with all the data
8. Present the download link to the customer
9. Ask if they'd like to proceed with a formal quote

### OLP Labor Lookup
We have the Open Labor Project database with industry-standard labor times for 4,400+ vehicles. **Try OLP first** for standard services.

- Call \`lookup_labor_time\` with the customer's year, make, model, and the service name
- It returns labor hours per engine variant (e.g., 2.5L I4 vs 3.5L V6 may differ)
- If the customer's engine is unknown, use the most common variant or present the range
- Use \`list_vehicle_services\` to see all available service categories for a vehicle

#### When OLP Has No Data
If OLP doesn't have the service after 2-3 search variations, **estimate labor hours yourself** based on your automotive knowledge and pass them to \`create_estimate\`. You are not blocked by OLP — it's a reference, not a gate.

#### Smart Search — Try Alternate Terms!
The database uses specific naming conventions. If your first search returns no results, try alternate names:
- "AC" → try "air conditioning", "a/c compressor", "AC compressor"
- "brakes" → try "brake pads", "brake pad replacement", "front brakes"
- "oil change" → try "engine oil", "oil and filter"
- "steering" → try "power steering", "steering rack", "tie rod"
- "check engine light" → think about what the actual repair might be (O2 sensor, catalytic converter, etc.)
- Abbreviations: "PS" = power steering, "cat" = catalytic converter, "tranny" = transmission

### Parts Lookup (IMPORTANT)
We have real-time parts pricing via RockAuto. **Always look up parts pricing before estimating.**

- Call \`lookup_parts_price\` with the customer's year, make, model, and the part name
- Returns tiered pricing (economy / daily driver / premium)
- Use "daily driver" tier as default unless customer specifies otherwise
- Pass the parts cost (in dollars) to \`create_estimate\` — the system applies tiered markup automatically

#### Smart Search — Try Alternate Part Names!
If the part lookup returns nothing, **think about alternate names** and retry:
- "AC compressor" vs "air conditioning compressor" vs "A/C compressor"
- "O2 sensor" vs "oxygen sensor"
- "rotors" vs "brake disc" vs "brake rotor"
- "cat" vs "catalytic converter"
- "CV axle" vs "half shaft" vs "drive axle"
- "serpentine belt" vs "drive belt" vs "accessory belt"

**Try at least 2 variations before giving up on parts lookup.**

### Custom / Freeform Line Items
For services or charges that don't fit the labor+parts model, use \`customItems\` in \`create_estimate\`. Each custom item has a name, description, and flat price in dollars.

**Use custom items for:**
- Diagnostic fees (e.g. $95 diagnostic)
- Custom fabrication or modification work
- Flat-rate services not in OLP (e.g. "Mobile convenience fee", "Wiring harness repair")
- Specialty services (tinting, detailing, PDR, etc.)
- Any one-off charge with a known price

Custom items bypass the labor hours × hourly rate calculation — they go straight onto the estimate at the price you set. Fees (disposal, scheduling surcharges) still apply normally.

### Pricing Structure

**Labor:** hourlyRate × laborHours (from OLP)
**Parts:** tiered markup on OEM cost (40% under $50, 30% $50-200, 20% $200-500, 15% over $500)

**Fees (automatically applied by create_estimate):**
- **Hazmat disposal ($15):** set \`involvesHazmat: true\` for oil changes, coolant flush, brake fluid, transmission fluid, power steering fluid
- **Tire disposal ($5/tire):** set \`tireCount\` for tire replacement services
- **Battery core charge ($25):** set \`involvesBattery: true\` for battery replacement
- **Travel fee:** if customer is beyond 15 miles, pass \`travelMiles\` — $1/mile beyond base
- **Rush fee ($75):** set \`isRush: true\` for same-day requests
- **After-hours ($50):** set \`isAfterHours: true\` for appointments after 6pm
- **Early morning ($25):** set \`isEarlyMorning: true\` for appointments before 8am
- **Weekend ($35):** set \`isWeekend: true\` for Saturday
- **Sunday ($50):** set \`isSunday: true\` for Sunday
- **Holiday ($100):** set \`isHoliday: true\` for holidays

**Discounts (pass \`discountType\`):**
- \`returning_customer\` — 5% off
- \`referral\` — 10% off
- \`fleet\` — 15% off (5+ vehicles)
- \`senior\` — 10% off (65+)
- \`military\` — 10% off
- \`first_responder\` — 10% off
- Multi-service (3+ services) — automatic 10% off

### When to Apply Fees
- **Always ask about scheduling** to determine time surcharges
- **Check customer location** for travel fees — ask if they're within the service area
- **Infer hazmat/tire/battery** from the service type — don't ask the customer, you should know
- **Check customer history** for returning customer discount
- **Ask about military/senior/first-responder** status only if relevant context suggests it

### Response Format
After creating an estimate, present the PDF link and a clear breakdown showing:
1. Service line items (labor + parts)
2. Fees (disposal, travel, scheduling)
3. Discount (if any)
4. Total range

Then ALWAYS use ask_user_question to offer next steps:
- "Send formal quote" — to email a Stripe quote
- "Book appointment" — to schedule the service
- "Adjust services" — to modify the estimate

Do NOT write these options as text. Call ask_user_question with them as buttons.
`;
