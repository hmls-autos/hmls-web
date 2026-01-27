---
name: payments
description: Handle formal Stripe quotes for customer billing
---

# Payments Skill

Manage formal quotes via Stripe integration.

## Available Tools

- `create_quote` - Create formal quote sent to customer email
- `get_quote_status` - Check quote status (draft, sent, accepted, declined)

## Estimate vs Quote Flow

```
Customer inquiry → Estimate (informal PDF) → Quote (formal Stripe)
```

1. **Estimate**: Informal price shown as downloadable PDF (`create_estimate`)
2. **Quote**: Formal proposal emailed via Stripe, customer can accept online

## Creating Quotes

Use `create_quote` when customer wants to proceed after seeing an estimate.

Required information:
- `customerId` - Customer ID from the logged-in user context
- `items` - List of services with:
  - `service` - Service name
  - `description` - Description of work
  - `amount` - Price in dollars
- `expiresInDays` - Quote validity (default: 7 days)

The quote is emailed to the customer with a link to view and accept online.

## Checking Quote Status

Use `get_quote_status` to check if a customer has:
- Viewed the quote
- Accepted it
- Let it expire
- Declined it

## Best Practices

1. **Only quote after estimate** - Customer should see estimate first
2. **Itemize clearly** - Break down each service separately
3. **Confirm before sending** - Verify customer email before sending
4. **Follow up** - If quote expires, ask if they'd like a new one
