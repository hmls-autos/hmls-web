import { Hono } from "hono";
import Stripe from "stripe";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { notifyOrderStatusChange } from "../lib/notifications.ts";

function appendStatusHistory(
  current: unknown[],
  newStatus: string,
  actor: string,
): unknown[] {
  return [
    ...(Array.isArray(current) ? current : []),
    { status: newStatus, timestamp: new Date().toISOString(), actor },
  ];
}

export function createWebhookRoute(stripeSecretKey: string) {
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2026-01-28.clover",
  });

  const webhook = new Hono();

  webhook.post("/stripe", async (c) => {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
      return c.json({ error: "Webhook not configured" }, 500);
    }

    const signature = c.req.header("stripe-signature");
    if (!signature) {
      return c.json({ error: "Missing stripe-signature header" }, 400);
    }

    let event: Stripe.Event;
    try {
      const body = await c.req.text();
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret,
      ) as Stripe.Event;
    } catch (err) {
      console.error("[webhook] Signature verification failed:", err);
      return c.json({ error: "Invalid signature" }, 400);
    }

    console.log(`[webhook] Received event: ${event.type} (${event.id})`);

    try {
      switch (event.type) {
        case "quote.accepted":
          await handleQuoteAccepted(event.data.object as Stripe.Quote);
          break;

        case "invoice.paid":
          await handleInvoicePaid(event.data.object as Stripe.Invoice);
          break;

        case "invoice.payment_failed":
          await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
          break;

        default:
          console.log(`[webhook] Unhandled event type: ${event.type}`);
      }
    } catch (err) {
      console.error(`[webhook] Error handling ${event.type}:`, err);
      // Return 200 anyway to prevent Stripe retries on application errors
    }

    return c.json({ received: true });
  });

  async function handleQuoteAccepted(stripeQuote: Stripe.Quote) {
    const stripeQuoteId = stripeQuote.id;
    console.log(`[webhook] Quote accepted: ${stripeQuoteId}`);

    // Find our local quote
    const [quote] = await db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.stripeQuoteId, stripeQuoteId))
      .limit(1);

    if (!quote) {
      console.warn(`[webhook] No local quote found for Stripe quote ${stripeQuoteId}`);
      return;
    }

    // Update quote status
    await db
      .update(schema.quotes)
      .set({ status: "accepted" })
      .where(eq(schema.quotes.id, quote.id));

    // Find and update the linked order
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.quoteId, quote.id))
      .limit(1);

    if (!order) {
      console.warn(`[webhook] No order linked to quote ${quote.id}`);
      return;
    }

    if (order.status !== "quoted") {
      console.warn(`[webhook] Order ${order.id} is '${order.status}', expected 'quoted' — skipping`);
      return;
    }

    await db
      .update(schema.orders)
      .set({
        status: "accepted",
        statusHistory: appendStatusHistory(
          order.statusHistory as unknown[],
          "accepted",
          "stripe_webhook",
        ),
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, order.id));

    console.log(`[webhook] Order ${order.id} → accepted`);
    notifyOrderStatusChange(order.id, "accepted");
  }

  async function handleInvoicePaid(invoice: Stripe.Invoice) {
    console.log(`[webhook] Invoice paid: ${invoice.id}`);

    // Stripe quotes generate an invoice — try to link it
    const quoteId = (invoice as unknown as Record<string, unknown>).quote as string | null;
    if (!quoteId) return;

    const [quote] = await db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.stripeQuoteId, quoteId))
      .limit(1);

    if (!quote) return;

    // Store the invoice ID on the quote
    await db
      .update(schema.quotes)
      .set({
        stripeInvoiceId: invoice.id,
        status: "paid",
      })
      .where(eq(schema.quotes.id, quote.id));

    console.log(`[webhook] Quote ${quote.id} marked as paid (invoice: ${invoice.id})`);
  }

  async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log(`[webhook] Invoice payment failed: ${invoice.id}`);

    const quoteId = (invoice as unknown as Record<string, unknown>).quote as string | null;
    if (!quoteId) return;

    const [quote] = await db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.stripeQuoteId, quoteId))
      .limit(1);

    if (!quote) return;

    // Find the linked order and mark it as declined
    const [order] = await db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.quoteId, quote.id))
      .limit(1);

    if (order && order.status === "accepted") {
      await db
        .update(schema.orders)
        .set({
          status: "declined",
          statusHistory: appendStatusHistory(
            order.statusHistory as unknown[],
            "declined",
            "stripe_webhook",
          ),
          adminNotes: `${order.adminNotes ? order.adminNotes + "\n" : ""}Payment failed for invoice ${invoice.id}`,
          updatedAt: new Date(),
        })
        .where(eq(schema.orders.id, order.id));

      console.log(`[webhook] Order ${order.id} → declined (payment failed)`);
      notifyOrderStatusChange(order.id, "declined");
    }
  }

  return webhook;
}
