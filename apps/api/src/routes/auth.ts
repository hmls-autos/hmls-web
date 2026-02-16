import { Hono } from "hono";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { eq } from "drizzle-orm";

const auth = new Hono();

// POST /sync — match or create customer from OAuth sign-in
auth.post("/sync", async (c) => {
  const body = await c.req.json();
  const { authUserId, email, name, phone } = body as {
    authUserId: string;
    email: string;
    name?: string;
    phone?: string;
  };

  // Validate required fields
  if (!authUserId || !email) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "authUserId and email are required" } },
      400,
    );
  }

  // 1. Check if customer already linked by authUserId
  const [existingByAuth] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.authUserId, authUserId))
    .limit(1);

  if (existingByAuth) {
    return c.json(existingByAuth);
  }

  // 2. Check if customer exists by email → link it
  const [existingByEmail] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.email, email))
    .limit(1);

  if (existingByEmail) {
    const [updated] = await db
      .update(schema.customers)
      .set({ authUserId })
      .where(eq(schema.customers.id, existingByEmail.id))
      .returning();

    return c.json(updated);
  }

  // 3. Create new customer
  const [created] = await db
    .insert(schema.customers)
    .values({
      authUserId,
      email,
      name: name ?? null,
      phone: phone ?? null,
    })
    .returning();

  return c.json(created, 201);
});

export { auth };
