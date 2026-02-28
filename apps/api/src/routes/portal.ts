import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { desc, eq } from "drizzle-orm";
import { Errors } from "@hmls/shared/errors";
import { type AuthEnv, requireAuth } from "../middleware/auth.ts";

const portal = new Hono<AuthEnv>();

// All portal routes require authentication
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
  name: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional(),
  address: z.string().optional(),
  vehicleInfo: z.object({
    make: z.string().optional(),
    model: z.string().optional(),
    year: z.string().optional(),
  }).optional(),
});

portal.put("/me", async (c) => {
  const customerId = c.get("customerId");
  const body = await c.req.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: parsed.error.message } },
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

// GET /me/bookings — customer's bookings
portal.get("/me/bookings", async (c) => {
  const customerId = c.get("customerId");
  const rows = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.customerId, customerId))
    .orderBy(desc(schema.bookings.scheduledAt));

  return c.json(rows);
});

// GET /me/estimates — customer's estimates
portal.get("/me/estimates", async (c) => {
  const customerId = c.get("customerId");
  const rows = await db
    .select()
    .from(schema.estimates)
    .where(eq(schema.estimates.customerId, customerId))
    .orderBy(desc(schema.estimates.createdAt));

  return c.json(rows);
});

// GET /me/quotes — customer's quotes
portal.get("/me/quotes", async (c) => {
  const customerId = c.get("customerId");
  const rows = await db
    .select()
    .from(schema.quotes)
    .where(eq(schema.quotes.customerId, customerId))
    .orderBy(desc(schema.quotes.createdAt));

  return c.json(rows);
});

export { portal };
