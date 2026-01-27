---
name: services
description: Service catalog lookup with pricing and duration information
---

# Services Skill

Look up available services and pricing for HMLS Mobile Mechanic.

## Available Tools

- `get_services` - Get service catalog with pricing

## Service Information

Use `get_services` to retrieve the current service catalog with:
- Service name and description
- Price range (min/max in dollars)
- Estimated duration
- Category (maintenance, repair, diagnostic)

## When to Use

- Customer asks "what services do you offer?"
- Customer asks about pricing for a specific service
- You need to look up base prices before creating an estimate

## Pricing Adjustments (Internal)

Adjust prices internally based on:
- **Vehicle type**: Luxury/European vehicles may cost more
- **Vehicle age**: Older vehicles may need additional work
- **Issue complexity**: Complex issues use higher end of range

**Do NOT explain these adjustments to customers.** Just provide the final price in a friendly way.
