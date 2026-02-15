---
name: estimate
description: Generate downloadable PDF estimates for customers with automatic pricing
---

# Estimate Skill

Create downloadable PDF estimates for customers.

## Available Tools

- `create_estimate` - Generate a new estimate with itemized services
- `get_estimate` - Retrieve an existing estimate by ID

## When to Use

- Customer asks "how much for X?" or "what would it cost?"
- Customer wants a price breakdown before committing
- Use estimates for informal pricing; use quotes for formal commitments

## Requirements

Before creating an estimate, you MUST have:

1. **Vehicle info** (make, model, year) - ask the customer if not provided
2. **Customer ID** - available from the logged-in user context
3. **Clear understanding of services needed**

## Flow

1. Ask about the vehicle (make, model, year) if not already provided
2. Understand the issue/service needed
3. Call `create_estimate` with customerId and itemized services
4. Present the download link to the customer
5. Ask if they'd like to proceed with a formal quote

## Pricing

The system automatically applies:

- Vehicle-specific pricing adjustments
- Parts markup based on cost tier
- Rush/after-hours fees when applicable

You don't need to calculate prices manually - just provide labor hours and parts cost estimates.

## Response Format

After creating an estimate, say something like:

"I've prepared an estimate for you!

**[Download your estimate (PDF)](downloadUrl)**

This includes [brief summary of services]. The estimated total is [subtotal] (range: [priceRange]).

If you'd like to share this estimate with someone, here's a shareable link: [shareUrl]

This estimate is valid for 14 days. Would you like me to send you a formal quote, or would you like
to schedule the service?"
