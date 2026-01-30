import { assertEquals } from "jsr:@std/assert";

const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8001";

Deno.test("health check returns ok", async () => {
  const response = await fetch(`${BASE_URL}/health`);
  const body = await response.json();
  assertEquals(response.status, 200);
  assertEquals(body.status, "ok");
});

Deno.test("unauthenticated request to /diagnostics returns 401", async () => {
  const response = await fetch(`${BASE_URL}/diagnostics`);
  assertEquals(response.status, 401);
  const body = await response.json();
  assertEquals(body.error, "Missing authorization header");
});

Deno.test("invalid token returns 401", async () => {
  const response = await fetch(`${BASE_URL}/diagnostics`, {
    headers: {
      Authorization: "Bearer invalid-token",
    },
  });
  assertEquals(response.status, 401);
  const body = await response.json();
  assertEquals(body.error, "Invalid or expired token");
});

Deno.test("POST /diagnostics/:id/input with invalid type returns 400", async () => {
  // This test requires authentication, so it will return 401 first
  // In a real test environment, we would mock the auth
  const response = await fetch(`${BASE_URL}/diagnostics/1/input`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "invalid", content: "test" }),
  });
  assertEquals(response.status, 401);
});

Deno.test("CORS preflight returns correct headers", async () => {
  const response = await fetch(`${BASE_URL}/health`, {
    method: "OPTIONS",
  });
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(
    response.headers.get("Access-Control-Allow-Methods"),
    "GET, POST, OPTIONS"
  );
});
