import { verifyToken, type AuthUser } from "../lib/supabase.ts";
import { db } from "../db/client.ts";
import { customers } from "../db/schema.ts";
import { eq } from "drizzle-orm";

export interface AuthContext {
  user: AuthUser;
  customerId: number;
  stripeCustomerId: string;
}

export async function authenticateRequest(
  request: Request
): Promise<AuthContext | Response> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.slice(7);
  const user = await verifyToken(token);

  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Look up customer by email to get customerId and stripeCustomerId
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, user.email))
    .limit(1);

  if (!customer) {
    return new Response(JSON.stringify({ error: "Customer not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!customer.stripeCustomerId) {
    return new Response(JSON.stringify({ error: "Customer has no billing account" }), {
      status: 402,
      headers: { "Content-Type": "application/json" },
    });
  }

  return {
    user,
    customerId: customer.id,
    stripeCustomerId: customer.stripeCustomerId,
  };
}
