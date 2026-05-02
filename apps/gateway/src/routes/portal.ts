import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "@hmls/agent/db";
import { and, desc, eq } from "drizzle-orm";
import { Errors } from "@hmls/shared/errors";
import { type AuthEnv, requireAuth } from "../middleware/auth.ts";
import { transition } from "@hmls/agent/order-state";
import { sendOrderStateResult } from "../lib/order-state-http.ts";

const portal = new Hono<AuthEnv>();

portal.use("*", requireAuth);

// GET /me — current customer profile
portal.get("/me", async (c) => {
  const customerId = c.get("customerId");
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .limit(1);

  if (!customer) throw Errors.notFound("Customer", customerId);
  return c.json(customer);
});

// PUT /me — update customer profile
const updateProfileSchema = z.object({
  // Nullable so the customer can clear a previously-set field. Frontend
  // trims and sends `null` for empty input rather than empty string.
  name: z.string().min(1).max(255).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  address: z.string().nullable().optional(),
  vehicleInfo: z.object({
    make: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    year: z.string().nullable().optional(),
  }).optional(),
});

portal.put("/me", async (c) => {
  const customerId = c.get("customerId");
  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: parsed.error.issues.map((i) => i.message).join(", "),
        },
      },
      400,
    );
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
  if (parsed.data.address !== undefined) updates.address = parsed.data.address;
  if (parsed.data.vehicleInfo !== undefined) updates.vehicleInfo = parsed.data.vehicleInfo;

  if (Object.keys(updates).length === 0) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "No fields to update" } },
      400,
    );
  }

  const [updated] = await db
    .update(schema.customers)
    .set(updates)
    .where(eq(schema.customers.id, customerId))
    .returning();

  if (!updated) throw Errors.notFound("Customer", customerId);
  return c.json(updated);
});

// GET /me/bookings — orders with scheduling (unified after Layer 3)
portal.get("/me/bookings", async (c) => {
  const customerId = c.get("customerId");
  const rows = await db
    .select()
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.customerId, customerId),
        // Only orders that have been scheduled (scheduled_at set)
      ),
    )
    .orderBy(desc(schema.orders.scheduledAt));

  // Filter in JS so we still include orders without scheduled_at if none match
  return c.json(rows.filter((r) => r.scheduledAt != null));
});

// GET /me/orders — customer's orders (unified — replaces estimates + quotes)
portal.get("/me/orders", async (c) => {
  const customerId = c.get("customerId");
  const rows = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customerId, customerId))
    .orderBy(desc(schema.orders.createdAt));

  return c.json(rows);
});

// GET /me/orders/:id — single order detail with events (customer-scoped)
portal.get("/me/orders/:id", async (c) => {
  const customerId = c.get("customerId");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Invalid order ID" } }, 400);
  }

  const [order] = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);

  if (!order || order.customerId !== customerId) {
    return c.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, 404);
  }

  const events = await db
    .select()
    .from(schema.orderEvents)
    .where(eq(schema.orderEvents.orderId, id))
    .orderBy(desc(schema.orderEvents.createdAt));

  return c.json({ order, events });
});

// GET /me/estimates — backward compat redirect to orders
portal.get("/me/estimates", async (c) => {
  const customerId = c.get("customerId");
  const rows = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customerId, customerId))
    .orderBy(desc(schema.orders.createdAt));

  return c.json(rows);
});

// GET /me/quotes — backward compat redirect to orders
portal.get("/me/quotes", async (c) => {
  const customerId = c.get("customerId");
  const rows = await db
    .select()
    .from(schema.orders)
    .where(eq(schema.orders.customerId, customerId))
    .orderBy(desc(schema.orders.createdAt));

  return c.json(rows);
});

// Harness enforces role-based permission (e.g. "customer may approve
// estimated"). Ownership (this customer owns this specific row) is checked
// inline in each route below — a short SELECT is cheaper than plumbing
// ownership through the harness.

// POST /me/orders/:id/approve — customer approves estimate (estimated → approved)
portal.post("/me/orders/:id/approve", async (c) => {
  const customerId = c.get("customerId");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Invalid order ID" } }, 400);
  }

  // Ownership check — harness handles role-based permission, we handle
  // "this customer owns this row".
  const [order] = await db
    .select({ id: schema.orders.id, customerId: schema.orders.customerId })
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);
  if (!order || order.customerId !== customerId) {
    return c.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, 404);
  }

  const result = await transition(id, "approved", { kind: "customer", customerId });
  return sendOrderStateResult(c, result);
});

// POST /me/orders/:id/decline — customer declines estimate (estimated → declined)
portal.post("/me/orders/:id/decline", async (c) => {
  const customerId = c.get("customerId");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Invalid order ID" } }, 400);
  }

  const [order] = await db
    .select({ id: schema.orders.id, customerId: schema.orders.customerId })
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);
  if (!order || order.customerId !== customerId) {
    return c.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, 404);
  }

  const body = await c.req.json<{ reason?: string }>().catch(
    () => ({} as { reason?: string }),
  );
  const result = await transition(id, "declined", { kind: "customer", customerId }, {
    reason: body.reason,
  });
  return sendOrderStateResult(c, result);
});

// POST /me/orders/:id/cancel-booking — customer cancels a scheduled order
// before the shop has started work.
portal.post("/me/orders/:id/cancel-booking", async (c) => {
  const customerId = c.get("customerId");
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json({ error: { code: "BAD_REQUEST", message: "Invalid order ID" } }, 400);
  }

  const [order] = await db
    .select({ id: schema.orders.id, customerId: schema.orders.customerId })
    .from(schema.orders)
    .where(eq(schema.orders.id, id))
    .limit(1);
  if (!order || order.customerId !== customerId) {
    return c.json({ error: { code: "NOT_FOUND", message: "Order not found" } }, 404);
  }

  const body = await c.req.json<{ reason?: string }>().catch(
    () => ({} as { reason?: string }),
  );
  const result = await transition(id, "cancelled", { kind: "customer", customerId }, {
    reason: body.reason,
  });
  return sendOrderStateResult(c, result);
});

export { portal };
