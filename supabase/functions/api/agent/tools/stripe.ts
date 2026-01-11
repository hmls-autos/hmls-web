import { z } from "zod";
import Stripe from "stripe";
import { db, schema } from "../../db/client.ts";
import { eq } from "drizzle-orm";
import { env } from "../../lib/env.ts";
import { stripeLogger } from "../../lib/logger.ts";
import { NotFoundError } from "../../lib/errors.ts";

// Initialize Stripe SDK with validated API key
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
});

/**
 * Get or create a Stripe customer, preventing duplicates.
 * Stores stripeCustomerId in the database for future lookups.
 */
async function getOrCreateStripeCustomer(customerId: number): Promise<string> {
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .limit(1);

  if (!customer) {
    throw new NotFoundError("Customer", customerId);
  }

  // Return cached Stripe ID if we have it
  if (customer.stripeCustomerId) {
    stripeLogger.debug`Using cached Stripe customer: ${customer.stripeCustomerId}`;
    return customer.stripeCustomerId;
  }

  // Search Stripe by email to prevent duplicates
  if (customer.email) {
    stripeLogger.debug`Searching Stripe for customer with email: ${customer.email}`;
    const existing = await stripe.customers.list({
      email: customer.email,
      limit: 1,
    });

    if (existing.data.length > 0) {
      const stripeId = existing.data[0].id;
      stripeLogger.info`Found existing Stripe customer: ${stripeId}`;

      // Cache the Stripe ID in our database
      await db
        .update(schema.customers)
        .set({ stripeCustomerId: stripeId })
        .where(eq(schema.customers.id, customerId));

      return stripeId;
    }
  }

  // Create new Stripe customer
  stripeLogger.info`Creating new Stripe customer for: ${customer.name || customer.email}`;
  const stripeCustomer = await stripe.customers.create({
    email: customer.email ?? undefined,
    name: customer.name ?? undefined,
    phone: customer.phone ?? undefined,
    metadata: {
      hmls_customer_id: String(customerId),
    },
  });

  // Cache the Stripe ID in our database
  await db
    .update(schema.customers)
    .set({ stripeCustomerId: stripeCustomer.id })
    .where(eq(schema.customers.id, customerId));

  return stripeCustomer.id;
}

/**
 * Convert dollars to cents for Stripe API
 */
function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars for display
 */
function centsToDollars(cents: number): number {
  return cents / 100;
}

export const createQuoteTool = {
  name: "create_quote",
  description:
    "Create a quote/estimate for a customer with line items for services. The quote can be sent to the customer for approval.",
  parameters: z.object({
    customerId: z.number().describe("The customer ID from the database"),
    items: z
      .array(
        z.object({
          service: z.string().describe("Service name"),
          description: z.string().describe("Description of the work"),
          amount: z.number().describe("Price in dollars"),
        })
      )
      .describe("List of services and their prices"),
    expiresInDays: z.number().default(7).describe("Days until quote expires"),
  }),
  execute: async (params: {
    customerId: number;
    items: { service: string; description: string; amount: number }[];
    expiresInDays?: number;
  }) => {
    const stripeCustomerId = await getOrCreateStripeCustomer(params.customerId);

    // Create line items using SDK types
    const lineItems: Stripe.QuoteCreateParams.LineItem[] = params.items.map(
      (item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.service,
            description: item.description,
          },
          unit_amount: dollarsToCents(item.amount),
        },
        quantity: 1,
      })
    );

    // Create quote using SDK
    const quote = await stripe.quotes.create({
      customer: stripeCustomerId,
      line_items: lineItems,
      expires_at:
        Math.floor(Date.now() / 1000) +
        (params.expiresInDays || 7) * 24 * 60 * 60,
    });

    // Finalize the quote so it can be sent
    const finalizedQuote = await stripe.quotes.finalize(quote.id);

    const totalAmount = params.items.reduce(
      (sum, item) => sum + dollarsToCents(item.amount),
      0
    );

    stripeLogger.info`Quote created: ${finalizedQuote.id} for $${centsToDollars(totalAmount)}`;

    // Store in database
    const [dbQuote] = await db
      .insert(schema.quotes)
      .values({
        customerId: params.customerId,
        stripeQuoteId: finalizedQuote.id,
        items: params.items,
        totalAmount,
        status: "sent",
        expiresAt: new Date(
          Date.now() + (params.expiresInDays || 7) * 24 * 60 * 60 * 1000
        ),
      })
      .returning();

    return {
      success: true,
      quoteId: dbQuote.id,
      stripeQuoteId: finalizedQuote.id,
      totalAmount: centsToDollars(totalAmount),
      hostedUrl: finalizedQuote.hosted_quote_url,
      message: `Quote created for $${centsToDollars(totalAmount).toFixed(
        2
      )}. Customer can view and accept at: ${finalizedQuote.hosted_quote_url}`,
    };
  },
};

export const createInvoiceTool = {
  name: "create_invoice",
  description:
    "Create and send an invoice to a customer for completed services. The invoice will be emailed to the customer.",
  parameters: z.object({
    customerId: z.number().describe("The customer ID from the database"),
    items: z
      .array(
        z.object({
          service: z.string().describe("Service name"),
          description: z
            .string()
            .describe("Description of the work completed"),
          amount: z.number().describe("Price in dollars"),
        })
      )
      .describe("List of services and their prices"),
    bookingId: z
      .number()
      .optional()
      .describe("Associated booking ID if applicable"),
    dueInDays: z.number().default(7).describe("Days until invoice is due"),
  }),
  execute: async (params: {
    customerId: number;
    items: { service: string; description: string; amount: number }[];
    bookingId?: number;
    dueInDays?: number;
  }) => {
    const stripeCustomerId = await getOrCreateStripeCustomer(params.customerId);

    // Create invoice items using SDK
    for (const item of params.items) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        description: `${item.service}: ${item.description}`,
        amount: dollarsToCents(item.amount),
        currency: "usd",
      });
    }

    // Create invoice using SDK
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: "send_invoice",
      days_until_due: params.dueInDays || 7,
    });

    // Finalize and send
    const finalizedInvoice = await stripe.invoices.finalize(invoice.id);
    const sentInvoice = await stripe.invoices.sendInvoice(finalizedInvoice.id);

    const totalAmount = params.items.reduce(
      (sum, item) => sum + dollarsToCents(item.amount),
      0
    );

    stripeLogger.info`Invoice sent: ${sentInvoice.id} for $${centsToDollars(totalAmount)}`;

    // Store in database
    const [dbInvoice] = await db
      .insert(schema.invoices)
      .values({
        customerId: params.customerId,
        bookingId: params.bookingId,
        stripeInvoiceId: sentInvoice.id,
        items: params.items,
        totalAmount,
        status: "sent",
      })
      .returning();

    return {
      success: true,
      invoiceId: dbInvoice.id,
      stripeInvoiceId: sentInvoice.id,
      totalAmount: centsToDollars(totalAmount),
      hostedUrl: sentInvoice.hosted_invoice_url,
      message: `Invoice for $${centsToDollars(totalAmount).toFixed(
        2
      )} has been sent to the customer. They can pay at: ${
        sentInvoice.hosted_invoice_url
      }`,
    };
  },
};

export const getQuoteStatusTool = {
  name: "get_quote_status",
  description:
    "Check the status of a quote (draft, sent, accepted, declined).",
  parameters: z.object({
    quoteId: z.number().describe("The quote ID from the database"),
  }),
  execute: async (params: { quoteId: number }) => {
    const [quote] = await db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.id, params.quoteId))
      .limit(1);

    if (!quote) {
      return { found: false, message: "Quote not found" };
    }

    // Get latest status from Stripe if we have a Stripe ID
    if (quote.stripeQuoteId) {
      const stripeQuote = await stripe.quotes.retrieve(quote.stripeQuoteId);

      // Update local status if changed
      if (stripeQuote.status !== quote.status) {
        await db
          .update(schema.quotes)
          .set({ status: stripeQuote.status })
          .where(eq(schema.quotes.id, params.quoteId));
      }

      return {
        found: true,
        quoteId: quote.id,
        status: stripeQuote.status,
        totalAmount: centsToDollars(quote.totalAmount),
        items: quote.items,
        expiresAt: quote.expiresAt,
      };
    }

    return {
      found: true,
      quoteId: quote.id,
      status: quote.status,
      totalAmount: centsToDollars(quote.totalAmount),
      items: quote.items,
    };
  },
};

export const stripeTools = [
  createQuoteTool,
  createInvoiceTool,
  getQuoteStatusTool,
];
