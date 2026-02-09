import { z } from "zod";
import Stripe from "stripe";
import { db, schema } from "../db/client.ts";
import { eq } from "drizzle-orm";
import { env } from "../env.ts";
import { Errors } from "../lib/errors.ts";
import { toolResult } from "../lib/tool-result.ts";

// Initialize Stripe SDK with validated API key
const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});

async function getOrCreateStripeCustomer(customerId: number): Promise<string> {
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .limit(1);

  if (!customer) {
    throw Errors.notFound("Customer", customerId);
  }

  if (customer.stripeCustomerId) {
    console.log(`[stripe] Using cached customer: ${customer.stripeCustomerId}`);
    return customer.stripeCustomerId;
  }

  if (customer.email) {
    console.log(
      `[stripe] Searching for customer with email: ${customer.email}`,
    );
    const existing = await stripe.customers.list({
      email: customer.email,
      limit: 1,
    });

    if (existing.data.length > 0) {
      const stripeId = existing.data[0].id;
      console.log(`[stripe] Found existing customer: ${stripeId}`);

      await db
        .update(schema.customers)
        .set({ stripeCustomerId: stripeId })
        .where(eq(schema.customers.id, customerId));

      return stripeId;
    }
  }

  console.log(
    `[stripe] Creating new customer for: ${customer.name || customer.email}`,
  );
  const stripeCustomer = await stripe.customers.create({
    email: customer.email ?? undefined,
    name: customer.name ?? undefined,
    phone: customer.phone ?? undefined,
    metadata: {
      hmls_customer_id: String(customerId),
    },
  });

  await db
    .update(schema.customers)
    .set({ stripeCustomerId: stripeCustomer.id })
    .where(eq(schema.customers.id, customerId));

  return stripeCustomer.id;
}

function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

function centsToDollars(cents: number): number {
  return cents / 100;
}

export const createQuoteTool = {
  name: "create_quote",
  description:
    "Create a quote/estimate for a customer with line items for services. The quote can be sent to the customer for approval.",
  schema: z.object({
    customerId: z.number().describe("The customer ID from the database"),
    items: z
      .array(
        z.object({
          service: z.string().describe("Service name"),
          description: z.string().describe("Description of the work"),
          amount: z.number().describe("Price in dollars"),
        }),
      )
      .describe("List of services and their prices"),
    expiresInDays: z.number().default(7).describe("Days until quote expires"),
  }),
  execute: async (params: {
    customerId: number;
    items: { service: string; description: string; amount: number }[];
    expiresInDays?: number;
  }, _ctx: unknown) => {
    const stripeCustomerId = await getOrCreateStripeCustomer(params.customerId);

    const lineItems = params.items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.service,
          description: item.description,
        },
        unit_amount: dollarsToCents(item.amount),
      },
      quantity: 1,
    }));

    // @ts-ignore - Stripe API types have changed, this works at runtime
    const quote = await stripe.quotes.create({
      customer: stripeCustomerId,
      line_items: lineItems,
      expires_at: Math.floor(Date.now() / 1000) +
        (params.expiresInDays || 7) * 24 * 60 * 60,
    });

    const finalizedQuote = await stripe.quotes.finalizeQuote(quote.id);

    const totalAmount = params.items.reduce(
      (sum, item) => sum + dollarsToCents(item.amount),
      0,
    );

    console.log(
      `[stripe] Quote created: ${finalizedQuote.id} for $${
        centsToDollars(totalAmount)
      }`,
    );

    const [dbQuote] = await db
      .insert(schema.quotes)
      .values({
        customerId: params.customerId,
        stripeQuoteId: finalizedQuote.id,
        items: params.items,
        totalAmount,
        status: "sent",
        expiresAt: new Date(
          Date.now() + (params.expiresInDays || 7) * 24 * 60 * 60 * 1000,
        ),
      })
      .returning();

    return toolResult({
      success: true,
      quoteId: dbQuote.id,
      stripeQuoteId: finalizedQuote.id,
      totalAmount: centsToDollars(totalAmount),
      // @ts-ignore - Stripe API types have changed
      hostedUrl: finalizedQuote.hosted_quote_url,
      // @ts-ignore - Stripe API types have changed
      message: `Quote created for $${
        centsToDollars(totalAmount).toFixed(2)
      }. Customer can view and accept at: ${finalizedQuote.hosted_quote_url}`,
    });
  },
};

export const getQuoteStatusTool = {
  name: "get_quote_status",
  description: "Check the status of a quote (draft, sent, accepted, declined).",
  schema: z.object({
    quoteId: z.number().describe("The quote ID from the database"),
  }),
  execute: async (params: { quoteId: number }, _ctx: unknown) => {
    const [quote] = await db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.id, params.quoteId))
      .limit(1);

    if (!quote) {
      return toolResult({ found: false, message: "Quote not found" });
    }

    if (quote.stripeQuoteId) {
      const stripeQuote = await stripe.quotes.retrieve(quote.stripeQuoteId);

      if (stripeQuote.status !== quote.status) {
        await db
          .update(schema.quotes)
          .set({ status: stripeQuote.status })
          .where(eq(schema.quotes.id, params.quoteId));
      }

      return toolResult({
        found: true,
        quoteId: quote.id,
        status: stripeQuote.status,
        totalAmount: centsToDollars(quote.totalAmount),
        items: quote.items,
        expiresAt: quote.expiresAt,
      });
    }

    return toolResult({
      found: true,
      quoteId: quote.id,
      status: quote.status,
      totalAmount: centsToDollars(quote.totalAmount),
      items: quote.items,
    });
  },
};

export const stripeTools = [
  createQuoteTool,
  getQuoteStatusTool,
];
