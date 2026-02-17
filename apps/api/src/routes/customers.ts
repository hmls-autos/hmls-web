import { Hono } from "hono";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { Errors } from "@hmls/shared/errors";
import { type AuthEnv, requireAuth } from "../middleware/auth.ts";

const customers = new Hono<AuthEnv>();

// GET customer by ID (authenticated, owner-only)
customers.get("/:id", requireAuth, async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return c.json(
      { error: { code: "BAD_REQUEST", message: "Invalid customer ID" } },
      400,
    );
  }

  const customerId = c.get("customerId");
  if (id !== customerId) {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Not authorized to view this customer" } },
      403,
    );
  }

  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id))
    .limit(1);

  if (!customer) throw Errors.notFound("Customer", id);
  return c.json(customer);
});

export { customers };
