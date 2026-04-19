import { assertEquals } from "@std/assert";
import { adminMechanics } from "./admin-mechanics.ts";

// The 401 path short-circuits before any DB call runs — no env vars needed.

Deno.test("admin-mechanics: rejects missing Authorization header", async () => {
  const res = await adminMechanics.request("/", { method: "GET" });
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error.code, "UNAUTHORIZED");
});

Deno.test("admin-mechanics: rejects non-Bearer auth", async () => {
  const res = await adminMechanics.request("/", {
    method: "GET",
    headers: { authorization: "Basic dXNlcjpwYXNz" },
  });
  assertEquals(res.status, 401);
});

Deno.test("admin-mechanics: rejects reassign missing header", async () => {
  const res = await adminMechanics.request("/bookings/1/reassign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ providerId: 1 }),
  });
  assertEquals(res.status, 401);
});
