import { Hono } from "hono";
import { renderToStream } from "@react-pdf/renderer";
import { db, schema } from "@hmls/agent/db";
import { and, eq } from "drizzle-orm";
import { EstimatePdf, notifyOrderStatusChange } from "@hmls/agent";
import { Errors } from "@hmls/shared/errors";
import { type AuthEnv, requireAuth } from "../middleware/auth.ts";

const estimates = new Hono<AuthEnv>();

// GET estimate by ID (authenticated, owner-only)
estimates.get("/:id", requireAuth, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Invalid estimate ID" } },
      400,
    );
  }

  const customerId = c.get("customerId");
  const [estimate] = await db
    .select()
    .from(schema.estimates)
    .where(eq(schema.estimates.id, id))
    .limit(1);

  if (!estimate) throw Errors.notFound("Estimate", id);

  if (estimate.customerId !== customerId) {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Not authorized to view this estimate" } },
      403,
    );
  }

  return c.json(estimate);
});

// GET estimate PDF (share-token for public access, or authenticated owner)
estimates.get("/:id/pdf", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Invalid estimate ID" } },
      400,
    );
  }

  const token = c.req.query("token");

  // Single JOIN: estimate + customer in one query
  const [row] = await db
    .select({
      estimate: schema.estimates,
      customerName: schema.customers.name,
      customerPhone: schema.customers.phone,
      customerEmail: schema.customers.email,
      customerAddress: schema.customers.address,
    })
    .from(schema.estimates)
    .leftJoin(schema.customers, eq(schema.estimates.customerId, schema.customers.id))
    .where(
      token
        ? and(
          eq(schema.estimates.id, id),
          eq(schema.estimates.shareToken, token),
        )
        : eq(schema.estimates.id, id),
    )
    .limit(1);

  if (!row) throw Errors.notFound("Estimate", id);

  const estimate = row.estimate;
  const customer = {
    name: row.customerName,
    phone: row.customerPhone,
    email: row.customerEmail,
    address: row.customerAddress,
    vehicleInfo: estimate.vehicleInfo as { make?: string; model?: string; year?: string } | null,
  };

  const pdfStream = await renderToStream(
    EstimatePdf({
      estimate: {
        ...estimate,
        items: estimate.items as {
          name: string;
          description: string;
          price: number;
        }[],
      },
      customer,
    }),
  );

  return new Response(pdfStream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="HMLS-Estimate-${id}.pdf"`,
    },
  });
});

// --- Public token-based routes (no auth required) ---

// GET estimate review data by share token
estimates.get("/:id/review", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Invalid estimate ID" } }, 400);
  }

  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Token required" } }, 400);
  }

  const [row] = await db
    .select({
      estimate: schema.estimates,
      customerName: schema.customers.name,
      customerEmail: schema.customers.email,
      orderId: schema.orders.id,
      orderStatus: schema.orders.status,
    })
    .from(schema.estimates)
    .leftJoin(schema.customers, eq(schema.estimates.customerId, schema.customers.id))
    .leftJoin(schema.orders, eq(schema.orders.estimateId, schema.estimates.id))
    .where(and(eq(schema.estimates.id, id), eq(schema.estimates.shareToken, token)))
    .limit(1);

  if (!row) {
    return c.json({ error: { code: "NOT_FOUND", message: "Estimate not found" } }, 404);
  }

  return c.json({
    estimate: {
      id: row.estimate.id,
      items: row.estimate.items,
      subtotal: row.estimate.subtotal,
      priceRangeLow: row.estimate.priceRangeLow,
      priceRangeHigh: row.estimate.priceRangeHigh,
      vehicleInfo: row.estimate.vehicleInfo,
      notes: row.estimate.notes,
      expiresAt: row.estimate.expiresAt,
      createdAt: row.estimate.createdAt,
    },
    customerName: row.customerName,
    orderId: row.orderId,
    orderStatus: row.orderStatus,
  });
});

// POST approve estimate by share token
estimates.post("/:id/approve", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Invalid estimate ID" } }, 400);
  }

  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Token required" } }, 400);
  }

  // Verify token matches estimate
  const [estimate] = await db
    .select()
    .from(schema.estimates)
    .where(and(eq(schema.estimates.id, id), eq(schema.estimates.shareToken, token)))
    .limit(1);

  if (!estimate) {
    return c.json({ error: { code: "NOT_FOUND", message: "Estimate not found" } }, 404);
  }

  // Find linked order
  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.estimateId, id))
    .limit(1);

  if (!order) {
    return c.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, 404);
  }

  if (order.status !== "estimated") {
    return c.json(
      { error: { code: "BAD_REQUEST", message: `Order is already '${order.status}'` } },
      400,
    );
  }

  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const [updated] = await db
    .update(schema.orders)
    .set({
      status: "customer_approved",
      statusHistory: [
        ...history,
        { status: "customer_approved", timestamp: new Date().toISOString(), actor: "customer" },
      ],
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, order.id))
    .returning();

  notifyOrderStatusChange(order.id, "customer_approved");

  return c.json({ success: true, order: updated });
});

// POST decline estimate by share token
estimates.post("/:id/decline", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Invalid estimate ID" } }, 400);
  }

  const token = c.req.query("token");
  if (!token) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Token required" } }, 400);
  }

  const [estimate] = await db
    .select()
    .from(schema.estimates)
    .where(and(eq(schema.estimates.id, id), eq(schema.estimates.shareToken, token)))
    .limit(1);

  if (!estimate) {
    return c.json({ error: { code: "NOT_FOUND", message: "Estimate not found" } }, 404);
  }

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.estimateId, id))
    .limit(1);

  if (!order) {
    return c.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, 404);
  }

  if (order.status !== "estimated") {
    return c.json(
      { error: { code: "BAD_REQUEST", message: `Order is already '${order.status}'` } },
      400,
    );
  }

  const body = await c.req.json<{ reason?: string }>().catch(() => ({}));
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const [updated] = await db
    .update(schema.orders)
    .set({
      status: "customer_declined",
      statusHistory: [
        ...history,
        { status: "customer_declined", timestamp: new Date().toISOString(), actor: "customer" },
      ],
      cancellationReason: (body as { reason?: string }).reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, order.id))
    .returning();

  notifyOrderStatusChange(order.id, "customer_declined");

  return c.json({ success: true, order: updated });
});

export { estimates };
