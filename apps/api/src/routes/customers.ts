import { Hono } from "hono";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { eq } from "drizzle-orm";
import { Errors } from "@hmls/shared/errors";

const customers = new Hono();

// GET customer by ID
customers.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const [customer] = await db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, id))
    .limit(1);

  if (!customer) throw Errors.notFound("Customer", id);
  return c.json(customer);
});

export { customers };
