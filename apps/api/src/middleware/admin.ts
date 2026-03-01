import type { Env } from "hono";
import { createMiddleware } from "hono/factory";
import { type AuthUser, verifyToken } from "../lib/supabase.ts";
import { db } from "../db/client.ts";
import * as schema from "../db/schema.ts";
import { eq } from "drizzle-orm";

/** Env type for admin routes. Adds `customerRole` alongside standard auth fields. */
export type AdminEnv = Env & {
  Variables: {
    authUser: AuthUser;
    customerId: number;
    customerRole: string;
  };
};

/**
 * Requires a valid JWT AND admin role.
 * Returns 401 if missing/invalid token, 403 if no customer or not admin.
 */
export const requireAdmin = createMiddleware<AdminEnv>(async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Missing authorization header" } },
      401,
    );
  }

  const token = auth.slice(7);
  const user = await verifyToken(token);
  if (!user) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
      401,
    );
  }

  const [customer] = await db
    .select({ id: schema.customers.id, role: schema.customers.role })
    .from(schema.customers)
    .where(eq(schema.customers.email, user.email))
    .limit(1);

  if (!customer) {
    return c.json(
      { error: { code: "FORBIDDEN", message: "No customer account found" } },
      403,
    );
  }

  if (customer.role !== "admin") {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      403,
    );
  }

  c.set("authUser", user);
  c.set("customerId", customer.id);
  c.set("customerRole", customer.role);
  await next();
});
