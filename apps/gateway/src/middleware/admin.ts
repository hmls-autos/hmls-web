import type { Env } from "hono";
import { createMiddleware } from "hono/factory";
import { type AuthUser, verifyToken } from "../lib/supabase.ts";

/** Env type for admin routes. */
export type AdminEnv = Env & {
  Variables: {
    authUser: AuthUser;
  };
};

/**
 * Requires a valid JWT with admin role in app_metadata.
 * No DB query — checks the JWT claim directly.
 * Returns 401 if missing/invalid token, 403 if not admin.
 */
export const requireAdmin = createMiddleware<AdminEnv>(async (c, next) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Missing authorization header" } },
      401,
    );
  }

  const user = await verifyToken(auth.slice(7));
  if (!user) {
    return c.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
      401,
    );
  }

  if (user.role !== "admin") {
    return c.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      403,
    );
  }

  c.set("authUser", user);
  await next();
});
