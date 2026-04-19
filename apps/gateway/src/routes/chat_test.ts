import { assertEquals } from "@std/assert";
import { chat } from "./chat.ts";

// The 401 path short-circuits before any agent/db/supabase call runs, so these
// tests need no env vars.

Deno.test("chat: rejects request with no Authorization header", async () => {
  const res = await chat.request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
  });

  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error.code, "UNAUTHORIZED");
});

Deno.test("chat: rejects request with non-Bearer Authorization header", async () => {
  const res = await chat.request("/", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: "Basic dXNlcjpwYXNz",
    },
    body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
  });

  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error.code, "UNAUTHORIZED");
});
