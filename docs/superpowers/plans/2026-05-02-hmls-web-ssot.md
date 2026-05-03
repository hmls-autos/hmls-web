# hmls-web SSOT Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a single source of truth for (1) DB row shapes, (2) order state machine, and (3)
HTTP request/response contracts between `apps/hmls-web`, `apps/gateway`, and `apps/agent`. Eliminate
hand-duplicated and drifted types/constants.

**Architecture:** Three sequential PRs. PR 1 moves schema and pure state-machine code into
`packages/shared`. PR 2 adds Zod input contracts and exports three Hono RPC sub-app types
(`AdminApiType` / `PortalApiType` / `MechanicApiType`) from the gateway. PR 3 deletes web's
hand-written types and rewrites every fetch hook to use the typed clients exposed via an extended
`AuthProvider`.

**Tech Stack:** Deno workspaces (gateway, agent, shared), Bun + Next.js 16 + React 19 (web), Drizzle
ORM (Supabase Postgres), Hono v4 + Hono RPC, Zod v4, SWR v2, Supabase JS, AI SDK v6 (out-of-scope
streaming).

**Reference spec:**
[`docs/superpowers/specs/2026-05-02-hmls-web-ssot-design.md`](../specs/2026-05-02-hmls-web-ssot-design.md)
(commit `3758e7c`)

---

## Phase 1 — Shared package backbone (PR 1)

Goal: move `apps/agent/src/db/schema.ts` and `apps/agent/src/services/order-state-core.ts` into
`packages/shared`. Update every import site mechanically. No behavior change.

Pre-flight: this PR's regression net is `deno task check` + `deno task test`. They MUST pass before
commit.

---

### Task 1.1: Add the new shared package exports map

**Files:**

- Modify: `packages/shared/deno.json`
- Create: `packages/shared/package.json`

- [ ] **Step 1: Extend deno.json exports**

Replace `packages/shared/deno.json` with:

```json
{
  "name": "@hmls/shared",
  "version": "0.1.0",
  "exports": {
    ".": "./src/mod.ts",
    "./tool-result": "./src/lib/tool-result.ts",
    "./errors": "./src/lib/errors.ts",
    "./db": "./src/db/client.ts",
    "./db/schema": "./src/db/schema.ts",
    "./db/types": "./src/db/types.ts",
    "./order/status": "./src/order/status.ts",
    "./api/contract": "./src/api/contract.ts"
  }
}
```

- [ ] **Step 2: Create matching package.json for Bun/Next resolution**

Create `packages/shared/package.json`:

```json
{
  "name": "@hmls/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/mod.ts",
    "./tool-result": "./src/lib/tool-result.ts",
    "./errors": "./src/lib/errors.ts",
    "./db": "./src/db/client.ts",
    "./db/schema": "./src/db/schema.ts",
    "./db/types": "./src/db/types.ts",
    "./order/status": "./src/order/status.ts",
    "./api/contract": "./src/api/contract.ts"
  }
}
```

The exports point at `.ts` source files; Next.js's `transpilePackages` (configured in PR 3) compiles
them on demand. No build step.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/deno.json packages/shared/package.json
git commit -m "chore(shared): extend exports map for schema/types/order/api"
```

---

### Task 1.2: Move schema.ts into shared

**Files:**

- Create: `packages/shared/src/db/schema.ts`
- Delete: `apps/agent/src/db/schema.ts`
- Modify: `apps/agent/src/db/client.ts`

- [ ] **Step 1: Move the file**

```bash
git mv apps/agent/src/db/schema.ts packages/shared/src/db/schema.ts
```

- [ ] **Step 2: Update client.ts to import from new location**

Replace `apps/agent/src/db/client.ts` with:

```ts
import { createDbClient } from "@hmls/shared/db";
import * as schema from "@hmls/shared/db/schema";

export const db = createDbClient(schema);
export { schema };
export type { OrderItem } from "@hmls/shared/db/schema";
```

- [ ] **Step 3: Run gateway+agent typecheck**

Run: `deno task check` Expected: PASS — every file that imported from `apps/agent/src/db/schema.ts`
indirectly via `@hmls/agent/db` still works because client.ts forwards.

- [ ] **Step 4: Update direct schema imports**

Find files that import from `db/schema.ts` directly (not via `@hmls/agent/db`):

```bash
grep -rln "from \"\\(\\.\\.*/\\)*db/schema\\(\\.ts\\)\\?\"" apps/agent apps/gateway --include="*.ts"
```

For each match, replace `from "./db/schema.ts"` (or whatever relative path) with
`from "@hmls/shared/db/schema"`. The five files known to do this:

- `apps/agent/src/services/order-state.ts:31` — `import type { OrderItem } from "../db/schema.ts";`
  → `import type { OrderItem } from "@hmls/shared/db/schema";`
- `apps/agent/src/common/tools/order.ts:25` — same pattern
- `apps/agent/src/common/tools/schedule.ts:19` — same pattern
- `apps/agent/src/fixo/tools/fixo-estimate.ts:17` — same pattern
- `apps/agent/src/fixo/lib/stripe.ts:87,106,142` — three dynamic
  `await import("../../db/schema.ts")` calls. Replace with `await import("@hmls/shared/db/schema")`.

- [ ] **Step 5: Verify typecheck still passes**

Run: `deno task check` Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(shared): move db/schema.ts to packages/shared

All consumers updated to import from @hmls/shared/db/schema.
apps/agent/src/db/client.ts re-exports schema for callers using
@hmls/agent/db."
```

---

### Task 1.3: Move order-state-core.ts into shared as order/status.ts

**Files:**

- Create: `packages/shared/src/order/status.ts`
- Delete: `apps/agent/src/services/order-state-core.ts`
- Modify: `apps/agent/src/services/order-state.ts`

- [ ] **Step 1: Move file with rename**

```bash
mkdir -p packages/shared/src/order
git mv apps/agent/src/services/order-state-core.ts packages/shared/src/order/status.ts
```

- [ ] **Step 2: Update order-state.ts imports**

In `apps/agent/src/services/order-state.ts`, change line ~33:

```ts
} from "./order-state-core.ts";
```

to:

```ts
} from "@hmls/shared/order/status";
```

- [ ] **Step 3: Run typecheck**

Run: `deno task check` Expected: PASS

- [ ] **Step 4: Update other consumers if any**

```bash
grep -rln "order-state-core" apps/agent apps/gateway --include="*.ts"
```

Replace any matches with `@hmls/shared/order/status`. (`order-state_test.ts` is the most likely
sibling.)

- [ ] **Step 5: Run agent tests**

Run: `cd apps/agent && deno test` Expected: PASS — the existing `order-state_test.ts` exercises
`TRANSITIONS`, `ACTOR_PERMISSIONS`, `_checkTransitionActorCoverage`, etc. They must still pass with
the moved code.

- [ ] **Step 6: Promote step-progress helpers from web into shared**

The web's old `lib/status.ts` had four helpers that PR 3 will need from shared: `ORDER_MAIN_STEPS`,
`ORDER_TERMINAL_STATUSES`, `ORDER_BRANCH_STATUSES`, `getOrderStepState`, plus the `OrderStepState`
and `OrderMainStep` types. Add them to `packages/shared/src/order/status.ts` (append at the bottom):

```ts
// ---------------------------------------------------------------------------
// Step-progress helpers (consumed by web's progress bar)
// ---------------------------------------------------------------------------

/** Linear lifecycle steps (excludes branch states declined/revised and
 *  terminal cancellation). Used to render a progress bar. */
export const ORDER_MAIN_STEPS = [
  "draft",
  "estimated",
  "approved",
  "scheduled",
  "in_progress",
  "completed",
] as const;

export type OrderMainStep = (typeof ORDER_MAIN_STEPS)[number];

export const ORDER_TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "cancelled",
]);

export const ORDER_BRANCH_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "declined",
  "revised",
]);

export type OrderStepState = "completed" | "current" | "pending";

export function getOrderStepState(
  stepStatus: OrderStatus,
  currentStatus: OrderStatus,
): OrderStepState {
  const main = ORDER_MAIN_STEPS as readonly OrderStatus[];
  const currentIdx = main.indexOf(currentStatus);
  const stepIdx = main.indexOf(stepStatus);

  if (currentIdx === -1) {
    if (currentStatus === "declined" || currentStatus === "revised") {
      const effectiveIdx = main.indexOf("estimated");
      return stepIdx <= effectiveIdx ? "completed" : "pending";
    }
    return stepIdx === 0 ? "completed" : "pending";
  }

  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "current";
  return "pending";
}
```

Verify: `deno task check` passes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(shared): move order-state-core.ts to @hmls/shared/order/status

Pure state-machine types, transition tables, actor permissions, and read
helpers move into the shared package. Step-progress helpers
(ORDER_MAIN_STEPS, getOrderStepState, ...) added so PR 3's web layer
can drop its hand-written copies. DB-touching writes stay in
apps/agent/src/services/order-state.ts and now import from shared."
```

---

### Task 1.4: Add db/types.ts with derived row types

**Files:**

- Create: `packages/shared/src/db/types.ts`

- [ ] **Step 1: Write the file**

Create `packages/shared/src/db/types.ts`:

```ts
import type {
  customers,
  orderEvents,
  orders,
  pricingConfig,
  providerAvailability,
  providers,
  providerScheduleOverrides,
  shops,
} from "./schema.ts";

export type Order = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type CustomerInsert = typeof customers.$inferInsert;
export type Provider = typeof providers.$inferSelect;
export type ProviderInsert = typeof providers.$inferInsert;
export type ProviderAvailability = typeof providerAvailability.$inferSelect;
export type ProviderScheduleOverride = typeof providerScheduleOverrides.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type PricingConfig = typeof pricingConfig.$inferSelect;

// Single canonical shape. Both Customer.vehicleInfo and Order.vehicleInfo
// reference this — replaces the divergent definitions in web's old
// lib/types.ts (one had year: number, the other year: string).
export type VehicleInfo = { year?: number; make?: string; model?: string };

export type { OrderItem } from "./schema.ts";

// Composite shape returned by GET /api/admin/orders/:id and
// GET /api/portal/me/orders/:id. Declared once, both gateway and web
// import from here.
export type OrderDetail = {
  order: Order;
  customer: Customer | null;
  events: OrderEvent[];
};
```

- [ ] **Step 2: Verify typecheck passes**

Run: `deno task check` Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/db/types.ts
git commit -m "feat(shared): export Drizzle-derived row types from db/types.ts

Order, Customer, Provider, OrderEvent, etc. via $inferSelect/$inferInsert.
Adds canonical VehicleInfo and OrderDetail composite. Future PRs replace
hand-written equivalents in apps/hmls-web/lib/types.ts."
```

---

### Task 1.5: Add api/contract.ts stub

**Files:**

- Create: `packages/shared/src/api/contract.ts`

- [ ] **Step 1: Write a stub**

Create `packages/shared/src/api/contract.ts`:

```ts
// Placeholder. PR 2 wires:
//   export type { AdminApiType, PortalApiType, MechanicApiType }
//     from "../../../../apps/gateway/src/hmls-app.ts";
// and re-exports the Zod contracts barrel. Until then this file exists
// only so deno.json/package.json exports map resolves cleanly.

export {};
```

- [ ] **Step 2: Commit**

```bash
git add packages/shared/src/api/contract.ts
git commit -m "chore(shared): stub api/contract.ts placeholder for PR 2"
```

---

### Task 1.6: Extend mod.ts re-exports

**Files:**

- Modify: `packages/shared/src/mod.ts`

- [ ] **Step 1: Replace mod.ts**

Replace `packages/shared/src/mod.ts` with:

```ts
export { toolResult } from "./lib/tool-result.ts";
export { AppError, ErrorCode, Errors } from "./lib/errors.ts";
export { createDbClient } from "./db/client.ts";

// Schema and derived types
export * as schema from "./db/schema.ts";
export type {
  Customer,
  CustomerInsert,
  Order,
  OrderDetail,
  OrderEvent,
  OrderInsert,
  OrderItem,
  PricingConfig,
  Provider,
  ProviderAvailability,
  ProviderInsert,
  ProviderScheduleOverride,
  Shop,
  VehicleInfo,
} from "./db/types.ts";

// Order state machine
export type {
  Actor,
  ActorKind,
  OrderMainStep,
  OrderStatus,
  OrderStepState,
  TerminalStatus,
} from "./order/status.ts";
export {
  _checkTransitionActorCoverage,
  ACTOR_PERMISSIONS,
  actorString,
  allowedTransitions,
  availableActions,
  canActorTransition,
  EDITABLE_STATUSES,
  getOrderStepState,
  isOrderStatus,
  isTerminal,
  ORDER_BRANCH_STATUSES,
  ORDER_MAIN_STEPS,
  ORDER_TERMINAL_STATUSES,
  PAYMENT_ALLOWED_STATUSES,
  resolveAuthority,
  TRANSITIONS,
} from "./order/status.ts";
```

- [ ] **Step 2: Run typecheck**

Run: `deno task check` Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/mod.ts
git commit -m "feat(shared): re-export schema/types/order from mod.ts"
```

---

### Task 1.7: Fix the canonical EDITABLE_STATUSES dup in admin-order-tools

**Files:**

- Modify: `apps/agent/src/hmls/tools/admin-order-tools.ts:133`

- [ ] **Step 1: Read the dup**

Open `apps/agent/src/hmls/tools/admin-order-tools.ts`. Find line ~133:

```ts
const EDITABLE_STATUSES = new Set(["draft", "revised", "estimated"]);
```

This duplicates the canonical `EDITABLE_STATUSES` exported from `@hmls/shared/order/status`. The
canonical version contains the same three states, but the existence of two sources is the bug.

- [ ] **Step 2: Replace the local Set with an import**

Add to the imports at the top of `admin-order-tools.ts`:

```ts
import { EDITABLE_STATUSES } from "@hmls/shared/order/status";
```

Delete the local `const EDITABLE_STATUSES = new Set(...)` line.

- [ ] **Step 3: Verify typecheck**

Run: `deno task check` Expected: PASS — `EDITABLE_STATUSES.has(order.status)` still works because
`ReadonlySet<OrderStatus>.has()` accepts any string.

- [ ] **Step 4: Run agent tests**

Run: `cd apps/agent && deno test` Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/agent/src/hmls/tools/admin-order-tools.ts
git commit -m "fix(agent): remove duplicate EDITABLE_STATUSES in admin-order-tools

Use the canonical @hmls/shared/order/status export."
```

---

### Task 1.8: Bun-side resolution canary

**Goal:** prove that `apps/hmls-web` can resolve `@hmls/shared` _before_ PR 3 depends on it. This is
a temporary check — nothing committed.

**Files:**

- Modify temporarily: `apps/hmls-web/tsconfig.json`
- Modify temporarily: any web TS file (e.g. `apps/hmls-web/lib/utils.ts`)

- [ ] **Step 1: Add tsconfig path mapping**

In `apps/hmls-web/tsconfig.json`, edit the `paths` block:

```json
"paths": {
  "@/*": ["./*"],
  "@hmls/shared/*": ["../../packages/shared/src/*"]
}
```

- [ ] **Step 2: Add drizzle-orm + hono to web deps temporarily**

```bash
cd apps/hmls-web && bun add drizzle-orm@^0.45.2 hono@^4.12.14
```

- [ ] **Step 3: Add a throwaway type import**

In `apps/hmls-web/lib/utils.ts` (or any other file), add at the top:

```ts
import type { Order } from "@hmls/shared/db/types";
const _orderProbe: Order | null = null;
void _orderProbe;
```

- [ ] **Step 4: Run web typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS — proves the path mapping resolves and
Drizzle's `$inferSelect` types compile under web's TS config.

- [ ] **Step 5: Revert the throwaway import**

Remove the three throwaway lines from `lib/utils.ts`. Keep the `tsconfig.json` paths mapping and the
`package.json` dep additions — PR 3 needs them and adding them in PR 1 means PR 3 starts from a
verified baseline.

- [ ] **Step 6: Verify web still builds**

Run: `cd apps/hmls-web && bun run typecheck && bun run lint` Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/hmls-web/tsconfig.json apps/hmls-web/package.json apps/hmls-web/bun.lock
git commit -m "chore(web): add @hmls/shared path mapping + drizzle/hono deps

Verified packages/shared resolves under web's TypeScript config.
Web doesn't consume the shared package yet — PR 3 will."
```

---

### Task 1.9: Add transpilePackages to next.config

**Files:**

- Modify: `apps/hmls-web/next.config.ts`

- [ ] **Step 1: Read current config**

Read `apps/hmls-web/next.config.ts`. It is currently a minimal config object.

- [ ] **Step 2: Add transpilePackages**

Edit the config to include:

```ts
const nextConfig: NextConfig = {
  transpilePackages: ["@hmls/shared"],
  // ...existing fields stay
};
```

If `next.config.ts` does not currently export a typed `NextConfig`, follow the existing shape but
add the `transpilePackages` key.

- [ ] **Step 3: Verify build**

Run: `cd apps/hmls-web && bun run build` Expected: PASS — Next compiles without error. The shared
package isn't actually imported by any web file yet, but adding `transpilePackages` is harmless and
will be needed in PR 3.

- [ ] **Step 4: Commit**

```bash
git add apps/hmls-web/next.config.ts
git commit -m "chore(web): transpilePackages @hmls/shared in Next config

Next will compile TS sources from the workspace package directly,
no separate build step required."
```

---

### Task 1.10: PR 1 acceptance + self-review

- [ ] **Step 1: Full check suite**

Run all of:

```bash
deno task check
deno task test
cd apps/hmls-web && bun run typecheck && bun run lint && bun run build
```

All must pass.

- [ ] **Step 2: Verify file moves committed**

```bash
git log --oneline --diff-filter=D | head
```

Should show `apps/agent/src/db/schema.ts` and `apps/agent/src/services/order-state-core.ts` were
deleted (renamed via `git mv`).

- [ ] **Step 3: Verify no leftover imports of old paths**

```bash
grep -rn "order-state-core\|/db/schema\\.ts\"" apps/agent apps/gateway --include="*.ts"
```

Expected: no matches (apart from any tests that explicitly reference the file path string).

- [ ] **Step 4: Open PR 1**

```bash
git push -u origin spinsirr/focused-jang-d55600
gh pr create --title "refactor(shared): move schema and order-state-core to @hmls/shared (1/3)" --body "$(cat <<'EOF'
## Summary

PR 1 of 3 for the [hmls-web SSOT refactor](docs/superpowers/specs/2026-05-02-hmls-web-ssot-design.md).

- Move `apps/agent/src/db/schema.ts` → `packages/shared/src/db/schema.ts`
- Move pure state-machine code (`order-state-core.ts`) → `@hmls/shared/order/status`
- Add `@hmls/shared/db/types` exporting Drizzle `$inferSelect` derived types
- Add web-side path mapping + `transpilePackages` (web does not consume shared yet — PR 3 does)
- Fix duplicate `EDITABLE_STATUSES` in `admin-order-tools.ts`

No behavior change. All 25+ import sites updated mechanically.

## Test plan
- [ ] `deno task check` passes
- [ ] `deno task test` passes (agent + gateway tests cover state machine + DB writes)
- [ ] `cd apps/hmls-web && bun run typecheck && bun run lint && bun run build` passes
EOF
)"
```

---

## Phase 2 — Gateway typed contracts (PR 2)

Goal: gateway exports `AdminApiType` / `PortalApiType` / `MechanicApiType` with full TS-inferred
response types, with Zod input validation in a centralized `contracts/` directory.

Pre-flight: PR 1 must be merged.

---

### Task 2.1: Create contracts directory with index barrel

**Files:**

- Create: `apps/gateway/src/contracts/index.ts`
- Create: `apps/gateway/src/contracts/admin.ts`

- [ ] **Step 1: Create empty barrel**

Create `apps/gateway/src/contracts/index.ts`:

```ts
export * from "./admin.ts";
export * from "./admin-mechanics.ts";
export * from "./mechanic.ts";
export * from "./orders.ts";
export * from "./portal.ts";
```

This will fail typecheck until the per-route files exist. That's expected — we add them next.

- [ ] **Step 2: Create admin contracts file**

Create `apps/gateway/src/contracts/admin.ts`. Inspect `apps/gateway/src/routes/admin.ts` for every
place that currently calls `c.req.json()` or `c.req.parseBody()`. For `admin.ts`, the input shapes
are:

```ts
import { z } from "zod";

// PUT /customers/:id
export const updateCustomerInput = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  vehicleInfo: z.object({
    year: z.number().int().optional(),
    make: z.string().optional(),
    model: z.string().optional(),
  }).optional(),
});

// Query parameters for GET /customers
export const listCustomersQuery = z.object({
  search: z.string().optional(),
});

// Query parameters for GET /orders (admin orders list)
export const listOrdersQuery = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
});
```

Read `routes/admin.ts` thoroughly — if other handlers parse JSON bodies, add their schemas here. The
rule: **every `c.req.json()` call must have a matching schema in this file.**

- [ ] **Step 3: Run typecheck**

Run: `deno task check` Expected: PASS for `admin.ts` itself; failure on `index.ts` is acceptable
until other contract files exist (we will add them in subsequent tasks).

- [ ] **Step 4: Commit**

```bash
git add apps/gateway/src/contracts/index.ts apps/gateway/src/contracts/admin.ts
git commit -m "feat(gateway): scaffold contracts/ directory with admin schemas"
```

---

### Task 2.2: Create remaining contract files

**Files:**

- Create: `apps/gateway/src/contracts/admin-mechanics.ts`
- Create: `apps/gateway/src/contracts/mechanic.ts`
- Create: `apps/gateway/src/contracts/orders.ts`
- Create: `apps/gateway/src/contracts/portal.ts`

For each: read the matching `routes/*.ts` file, extract input shapes from every
`c.req.json()`/`c.req.query()`/`c.req.param()` access. Define one named Zod schema per request body
or query block.

- [ ] **Step 1: orders.ts contracts**

Create `apps/gateway/src/contracts/orders.ts` based on `routes/orders.ts`. Schemas to include
(verify against the actual route file):

```ts
import { z } from "zod";
import type { OrderStatus } from "@hmls/shared/order/status";

export const orderStatusEnum = z.enum([
  "draft",
  "estimated",
  "revised",
  "approved",
  "declined",
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]) satisfies z.ZodType<OrderStatus>;

// POST /:id/status
export const transitionInput = z.object({
  status: orderStatusEnum,
  reason: z.string().optional(),
});

// PATCH /:id
export const updateOrderInput = z.object({
  notes: z.string().nullable().optional(),
  adminNotes: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  contactAddress: z.string().nullable().optional(),
  validDays: z.number().int().min(1).optional(),
  // extend with whatever fields routes/orders.ts actually accepts
});

// POST /:id/schedule
export const scheduleOrderInput = z.object({
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(480),
  providerId: z.number().int().positive().nullable(),
  location: z.string().optional(),
  locationLat: z.string().optional(),
  locationLng: z.string().optional(),
  accessInstructions: z.string().optional(),
});

// POST /:id/payment
export const recordPaymentInput = z.object({
  paymentMethod: z.enum(["cash", "check", "card", "ach", "other"]),
  paymentReference: z.string().optional(),
  capturedAmountCents: z.number().int().min(0).optional(),
});

// PATCH /:id/items
export const patchItemsInput = z.object({
  items: z.array(z.object({
    id: z.string(),
    category: z.enum(["labor", "parts", "fee", "discount"]),
    name: z.string(),
    description: z.string().optional(),
    quantity: z.number(),
    unitPriceCents: z.number().int(),
    totalCents: z.number().int(),
    laborHours: z.number().optional(),
    partNumber: z.string().optional(),
    taxable: z.boolean(),
  })),
});
```

If `routes/orders.ts` accepts other endpoints with bodies, add their schemas. **Do not skip
endpoints.**

- [ ] **Step 2: admin-mechanics.ts contracts**

Create `apps/gateway/src/contracts/admin-mechanics.ts`. Read `routes/admin-mechanics.ts` (706
lines). Schemas (verify against actual code):

```ts
import { z } from "zod";

export const createMechanicInput = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  serviceRadiusMiles: z.number().int().positive().optional(),
  homeBaseLat: z.string().optional(),
  homeBaseLng: z.string().optional(),
  timezone: z.string().optional(),
});

export const updateMechanicInput = createMechanicInput.partial();

export const setAvailabilityInput = z.object({
  windows: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string(), // "HH:MM:SS"
    endTime: z.string(),
  })),
});

export const createOverrideInput = z.object({
  overrideDate: z.string(), // "YYYY-MM-DD"
  isAvailable: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
});

export const reassignBookingInput = z.object({
  newProviderId: z.number().int().positive(),
});
```

- [ ] **Step 3: portal.ts contracts**

Create `apps/gateway/src/contracts/portal.ts`. Read `routes/portal.ts`. Schemas:

```ts
import { z } from "zod";

export const updatePortalProfileInput = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

// POST /me/orders/:id/approve, /decline, /cancel — these may take optional reason
export const portalOrderActionInput = z.object({
  reason: z.string().optional(),
});
```

- [ ] **Step 4: mechanic.ts contracts**

Create `apps/gateway/src/contracts/mechanic.ts`. Read `routes/mechanic.ts`. Schemas:

```ts
import { z } from "zod";

export const setMechanicAvailabilityInput = z.object({
  windows: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
  })),
});

export const createTimeOffInput = z.object({
  overrideDate: z.string(),
  isAvailable: z.literal(false),
  reason: z.string().optional(),
});
```

- [ ] **Step 5: Run typecheck**

Run: `deno task check` Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/gateway/src/contracts/
git commit -m "feat(gateway): add Zod input schemas for orders/admin-mechanics/portal/mechanic"
```

---

### Task 2.3: Wire zValidator into routes

For each of the 5 RPC route files, replace ad-hoc `c.req.json()` parsing with Hono's `zValidator`
middleware. This causes Hono RPC to expose the input shape to the typed client.

**Files:**

- Modify: `apps/gateway/src/routes/orders.ts`
- Modify: `apps/gateway/src/routes/admin.ts`
- Modify: `apps/gateway/src/routes/admin-mechanics.ts`
- Modify: `apps/gateway/src/routes/portal.ts`
- Modify: `apps/gateway/src/routes/mechanic.ts`

- [ ] **Step 1: Add @hono/zod-validator to root deno.json**

In `/Users/spenc/hmls/hmls-web/.claude/worktrees/focused-jang-d55600/deno.json`, add to `imports`:

```json
"@hono/zod-validator": "npm:@hono/zod-validator@^0.4.3"
```

Then run `deno install` to refresh the lock.

- [ ] **Step 2: Wire zValidator in orders.ts**

In `apps/gateway/src/routes/orders.ts`, add to top imports:

```ts
import { zValidator } from "@hono/zod-validator";
import {
  patchItemsInput,
  recordPaymentInput,
  scheduleOrderInput,
  transitionInput,
  updateOrderInput,
} from "../contracts/orders.ts";
```

For each handler that currently does:

```ts
orders.post("/:id/status", async (c) => {
  const body = await c.req.json();
  // manual validation here
  ...
});
```

replace with:

```ts
orders.post("/:id/status", zValidator("json", transitionInput), async (c) => {
  const body = c.req.valid("json");   // typed!
  ...
});
```

Repeat for `/:id` (PATCH → updateOrderInput), `/:id/schedule` (POST → scheduleOrderInput),
`/:id/payment` (POST → recordPaymentInput), `/:id/items` (PATCH → patchItemsInput).

- [ ] **Step 3: Verify orders.ts typechecks**

Run: `deno task check:gateway` Expected: PASS

- [ ] **Step 4: Repeat for admin.ts**

Wire `zValidator("json", updateCustomerInput)` on PUT `/customers/:id`. Wire
`zValidator("query", listCustomersQuery)` on GET `/customers` and
`zValidator("query", listOrdersQuery)` on GET `/orders` if such endpoints exist.

- [ ] **Step 5: Repeat for admin-mechanics.ts**

Wire each schema from `contracts/admin-mechanics.ts`.

- [ ] **Step 6: Repeat for portal.ts**

Wire each schema from `contracts/portal.ts`.

- [ ] **Step 7: Repeat for mechanic.ts**

Wire each schema from `contracts/mechanic.ts`.

- [ ] **Step 8: Run all gateway tests**

Run: `cd apps/gateway && deno test` Expected: PASS — existing route tests should still hit the
handlers; if a test passed an invalid body, fix the test body to match the schema.

- [ ] **Step 9: Commit**

```bash
git add deno.json deno.lock apps/gateway/src/routes/
git commit -m "feat(gateway): validate inputs with zValidator + contracts/ schemas"
```

---

### Task 2.4: Add explicit response types to c.json calls

Hono RPC infers response types from the literal type returned by `c.json(...)`. To guarantee the
inference is deliberate (not just whatever shape happens to flow out today), annotate every `c.json`
call site with an explicit type from `@hmls/shared/db/types`.

**Files:**

- Modify: `apps/gateway/src/routes/orders.ts`
- Modify: `apps/gateway/src/routes/admin.ts`
- Modify: `apps/gateway/src/routes/admin-mechanics.ts`
- Modify: `apps/gateway/src/routes/portal.ts`
- Modify: `apps/gateway/src/routes/mechanic.ts`

- [ ] **Step 1: Annotate the orders.ts responses**

In `apps/gateway/src/routes/orders.ts`, import the response types:

```ts
import type { Order, OrderDetail } from "@hmls/shared/db/types";
```

For every `c.json(...)` call, annotate the return type. Example transformations:

`return c.json({ orders, page, total });` →
`return c.json<{ orders: Order[]; page: number; total: number }>({ orders, page, total });`

`return c.json({ order, customer, events });` →
`return c.json<OrderDetail>({ order, customer, events });`

`return c.json({ ok: true });` → `return c.json<{ ok: true }>({ ok: true });`

For error responses, use a shared error shape:

```ts
return c.json<{ error: { code: string; message: string } }>(
  { error: { code: "FORBIDDEN", message: "..." } },
  403,
);
```

Repeat for every `c.json` in the file (32 in `orders.ts`).

- [ ] **Step 2: Run typecheck**

Run: `deno task check:gateway` Expected: PASS — the explicit types must match the actual data shape.
Drizzle's `Order` type covers all DB columns so list/detail responses align naturally.

- [ ] **Step 3: Repeat for admin.ts (15 c.json calls)**

For dashboard endpoint, declare the response shape inline:

```ts
return c.json<{
  stats: {
    customers: number;
    orders: number;
    pendingReview: number;
    pendingApprovals: number;
    activeJobs: number;
    revenue30d: number;
  };
  upcomingOrders: Array<{
    id: number;
    scheduledAt: string | null;
    contactName: string | null;
    vehicleInfo: VehicleInfo | null;
    status: OrderStatus;
  }>;
  recentCustomers: Customer[];
}>({ ... });
```

For `/customers/:id` detail endpoint:

```ts
return c.json<{ customer: Customer; orders: Order[] }>({ customer, orders });
```

- [ ] **Step 4: Repeat for admin-mechanics.ts (36 c.json calls)**

Provider-related responses use `Provider`, `ProviderAvailability`, `ProviderScheduleOverride` from
`@hmls/shared/db/types`.

- [ ] **Step 5: Repeat for portal.ts (17 c.json calls)**

Customer-portal endpoints return `Customer`, `Order[]`, `OrderDetail`.

- [ ] **Step 6: Repeat for mechanic.ts (16 c.json calls)**

Mechanic self-service endpoints return `Provider`, `ProviderAvailability[]`, etc.

- [ ] **Step 7: Verify all tests pass**

Run: `cd apps/gateway && deno test` Expected: PASS — annotations are TS-only, no runtime impact.

- [ ] **Step 8: Commit**

```bash
git add apps/gateway/src/routes/
git commit -m "feat(gateway): annotate c.json response types from @hmls/shared/db/types

Explicit types make Hono RPC's client-side inference deterministic
and tied to the canonical Drizzle row shapes."
```

---

### Task 2.5: Compose three sub-apps in hmls-app.ts and export types

**Files:**

- Modify: `apps/gateway/src/hmls-app.ts`

- [ ] **Step 1: Refactor route mounting**

In `apps/gateway/src/hmls-app.ts`, find the section:

```ts
app.route("/api/estimates", estimates);
app.route("/api/orders", ordersPdf);
app.route("/api/portal", portal);
app.route("/api/admin", admin);
app.route("/api/admin/orders", orders);
app.route("/api/admin/mechanics", adminMechanics);
app.route("/api/mechanic", mechanic);
app.route("/api/chat", chat);
app.route("/api/admin/chat", staffChat);
```

Replace with:

```ts
const adminApp = new Hono()
  .route("/", admin)
  .route("/orders", orders)
  .route("/mechanics", adminMechanics);

const portalApp = portal;
const mechanicApp = mechanic;

app.route("/api/estimates", estimates);
app.route("/api/orders", ordersPdf);
app.route("/api/admin", adminApp);
app.route("/api/portal", portalApp);
app.route("/api/mechanic", mechanicApp);
app.route("/api/chat", chat);
app.route("/api/admin/chat", staffChat);

export type AdminApiType = typeof adminApp;
export type PortalApiType = typeof portalApp;
export type MechanicApiType = typeof mechanicApp;
```

- [ ] **Step 2: Run gateway typecheck**

Run: `deno task check:gateway` Expected: PASS

- [ ] **Step 3: Run gateway tests**

Run: `cd apps/gateway && deno test` Expected: PASS — route prefixes are unchanged so request
handling is byte-identical.

- [ ] **Step 4: Smoke test the dev server**

```bash
infisical run --env=dev -- deno task dev:api &
SERVER_PID=$!
sleep 3
curl -fsS http://localhost:8080/health
# Expected: {"status":"ok",...}
curl -fsS http://localhost:8080/api/admin/dashboard 2>&1 | head -c 200
# Expected: 401 / unauthorized — proves admin middleware still wraps the new sub-app
kill $SERVER_PID
```

- [ ] **Step 5: Commit**

```bash
git add apps/gateway/src/hmls-app.ts
git commit -m "feat(gateway): compose admin/portal/mechanic sub-apps + export AppTypes

AdminApiType/PortalApiType/MechanicApiType are the typed contract that
PR 3's web client consumes via hc<T>()."
```

---

### Task 2.6: Wire api/contract.ts to gateway types

**Files:**

- Modify: `packages/shared/src/api/contract.ts`

- [ ] **Step 1: Replace stub with real re-exports**

Replace `packages/shared/src/api/contract.ts` with:

```ts
// Type-only re-export from gateway. The relative path crosses workspace
// packages but `import type` is fully erased — gateway runtime is NOT
// pulled into web's bundle.
export type {
  AdminApiType,
  MechanicApiType,
  PortalApiType,
} from "../../../../apps/gateway/src/hmls-app.ts";

// Zod input schemas. Both gateway routes and web forms import from here
// to keep request shapes in lockstep.
export * from "../../../../apps/gateway/src/contracts/index.ts";
```

- [ ] **Step 2: Run check**

Run: `deno task check` Expected: PASS

- [ ] **Step 3: Web-side resolution canary (temporary)**

In `apps/hmls-web/lib/utils.ts`, add temporarily:

```ts
import type { AdminApiType } from "@hmls/shared/api/contract";
const _adminProbe: AdminApiType | null = null;
void _adminProbe;
```

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS — this proves cross-runtime type
resolution works for the gateway types.

- [ ] **Step 4: Revert canary**

Remove the three temporary lines.

- [ ] **Step 5: Commit**

```bash
git add packages/shared/src/api/contract.ts
git commit -m "feat(shared): wire AdminApiType/PortalApiType/MechanicApiType exports

api/contract.ts re-exports gateway types and Zod schemas as a type-only
boundary. Web's hc<AdminApiType>() in PR 3 consumes these."
```

---

### Task 2.7: PR 2 acceptance + open PR

- [ ] **Step 1: Full check suite**

```bash
deno task check
deno task test
cd apps/hmls-web && bun run typecheck && bun run lint && bun run build
```

All must pass.

- [ ] **Step 2: Push + open PR**

```bash
git push
gh pr create --title "feat(gateway): typed Hono RPC contracts (admin/portal/mechanic) (2/3)" --body "$(cat <<'EOF'
## Summary

PR 2 of 3 for the [hmls-web SSOT refactor](docs/superpowers/specs/2026-05-02-hmls-web-ssot-design.md).

- New `apps/gateway/src/contracts/` directory with Zod input schemas per route group
- Every `c.req.json()`/`c.req.query()` migrated to `zValidator`
- Every `c.json(...)` response annotated with explicit type from `@hmls/shared/db/types`
- `hmls-app.ts` composes three sub-apps and exports `AdminApiType` / `PortalApiType` / `MechanicApiType`
- `packages/shared/src/api/contract.ts` re-exports the gateway types + Zod barrel

No runtime behavior change. PR 3 (web migration) consumes the new exports.

## Test plan
- [ ] `deno task check` passes
- [ ] `deno task test` passes (route + state-machine tests)
- [ ] Dev server smoke: `/health` 200, `/api/admin/dashboard` returns 401 unauth (auth middleware still wraps the composed admin sub-app)
- [ ] Web-side typecheck passes with the new path mapping (canary tested + reverted)
EOF
)"
```

---

## Phase 3 — Web one-shot migration (PR 3)

Goal: web stops duplicating types and stops using `authFetch`. All fetch hooks talk through three
typed clients exposed via the AuthProvider context.

Pre-flight: PR 1 and PR 2 must be merged.

---

### Task 3.1: Add api-client.ts factory

**Files:**

- Create: `apps/hmls-web/lib/api-client.ts`

- [ ] **Step 1: Write the factory**

Create `apps/hmls-web/lib/api-client.ts`:

```ts
import { hc } from "hono/client";
import type { AdminApiType, MechanicApiType, PortalApiType } from "@hmls/shared/api/contract";
import { AGENT_URL } from "./config";

export type ApiClients = {
  admin: ReturnType<typeof hc<AdminApiType>>;
  portal: ReturnType<typeof hc<PortalApiType>>;
  mechanic: ReturnType<typeof hc<MechanicApiType>>;
};

export function createApiClients(token: string | null | undefined): ApiClients {
  const customFetch: typeof fetch = (input, init) => {
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  };
  return {
    admin: hc<AdminApiType>(`${AGENT_URL}/api/admin`, { fetch: customFetch }),
    portal: hc<PortalApiType>(`${AGENT_URL}/api/portal`, { fetch: customFetch }),
    mechanic: hc<MechanicApiType>(`${AGENT_URL}/api/mechanic`, {
      fetch: customFetch,
    }),
  };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/hmls-web/lib/api-client.ts
git commit -m "feat(web): add createApiClients factory for typed Hono RPC clients"
```

---

### Task 3.2: Extend AuthProvider with api context

**Files:**

- Modify: `apps/hmls-web/components/AuthProvider.tsx`

- [ ] **Step 1: Update context type**

In `AuthProvider.tsx`, change the imports and type:

```tsx
import { type ApiClients, createApiClients } from "@/lib/api-client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  supabase: ReturnType<typeof createClient>;
  isLoading: boolean;
  isAdmin: boolean;
  isMechanic: boolean;
  api: ApiClients;
};
```

- [ ] **Step 2: Memoize api inside provider**

Inside the `AuthProvider` function body, after the `isAdmin` / `isMechanic` `useMemo`, add:

```tsx
const api = useMemo(
  () => createApiClients(session?.access_token),
  [session?.access_token],
);
```

- [ ] **Step 3: Add api to context value**

Update the `value` `useMemo`:

```tsx
const value = useMemo(
  () => ({ user, session, supabase, isLoading, isAdmin, isMechanic, api }),
  [user, session, supabase, isLoading, isAdmin, isMechanic, api],
);
```

- [ ] **Step 4: Run typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/hmls-web/components/AuthProvider.tsx
git commit -m "feat(web): expose typed api clients via AuthProvider context

api clients re-memoize when session.access_token changes; React state
remains the single source of truth for auth."
```

---

### Task 3.3: Add useApi.ts thin readers

**Files:**

- Create: `apps/hmls-web/hooks/useApi.ts`

- [ ] **Step 1: Write the file**

Create `apps/hmls-web/hooks/useApi.ts`:

```ts
import { useAuth } from "@/components/AuthProvider";

export const useAdminApi = () => useAuth().api.admin;
export const usePortalApi = () => useAuth().api.portal;
export const useMechanicApi = () => useAuth().api.mechanic;
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/hmls-web/hooks/useApi.ts
git commit -m "feat(web): add useAdminApi / usePortalApi / useMechanicApi hooks"
```

---

### Task 3.4: Rewrite usePortal.ts

**Files:**

- Modify: `apps/hmls-web/hooks/usePortal.ts`

- [ ] **Step 1: Replace the file**

Replace `apps/hmls-web/hooks/usePortal.ts` with:

```ts
import useSWR from "swr";
import { usePortalApi } from "@/hooks/useApi";
import { useStableArray } from "@/lib/swr-stable";

export function usePortalCustomer() {
  const api = usePortalApi();
  const { data, error, isLoading, mutate } = useSWR(
    api.me.$url().toString(),
    async () => {
      const res = await api.me.$get();
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  );
  return { customer: data, isLoading, isError: !!error, mutate };
}

export function usePortalOrders() {
  const api = usePortalApi();
  const { data, error, isLoading, mutate } = useSWR(
    api.me.orders.$url().toString(),
    async () => {
      const res = await api.me.orders.$get();
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  );
  return { orders: useStableArray(data), isLoading, isError: !!error, mutate };
}

export function usePortalOrder(id: string | number | null) {
  const api = usePortalApi();
  const orderId = id != null ? String(id) : null;
  const { data, error, isLoading, mutate } = useSWR(
    orderId
      ? api.me.orders[":id"]
        .$url({ param: { id: orderId } })
        .toString()
      : null,
    async () => {
      if (!orderId) return undefined;
      const res = await api.me.orders[":id"].$get({
        param: { id: orderId },
      });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  );
  return { data, isLoading, isError: !!error, mutate };
}

export function usePortalBookings() {
  const api = usePortalApi();
  const { data, error, isLoading, mutate } = useSWR(
    api.me.bookings.$url().toString(),
    async () => {
      const res = await api.me.bookings.$get();
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  );
  return {
    bookings: useStableArray(data),
    isLoading,
    isError: !!error,
    mutate,
  };
}
```

Note: the exact path segments (`api.me`, `api.me.orders[":id"]`) depend on how `routes/portal.ts`
mounts its handlers. **Hover over `api.me` in your editor before writing the call** — TypeScript
will reveal the actual shape. If the route is mounted as `/me/orders/:id`, the client path is
`api.me.orders[":id"]`.

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

If a mismatch surfaces (e.g. the route is `/orders/me` not `/me/orders`), the TS error pinpoints
which path segments are wrong — fix the client call to match.

- [ ] **Step 3: Commit**

```bash
git add apps/hmls-web/hooks/usePortal.ts
git commit -m "refactor(web): rewrite usePortal hooks on typed portalApi"
```

---

### Task 3.5: Rewrite useAdmin.ts

**Files:**

- Modify: `apps/hmls-web/hooks/useAdmin.ts`

- [ ] **Step 1: Replace the file**

Replace `apps/hmls-web/hooks/useAdmin.ts` with the equivalent shape:

```ts
import useSWR from "swr";
import { useAdminApi } from "@/hooks/useApi";
import { useStableArray } from "@/lib/swr-stable";
import type { Customer, Order } from "@hmls/shared/db/types";

export type AdminOrder = Order;
export type { Customer };

export function useAdminDashboard() {
  const api = useAdminApi();
  const { data, error, isLoading } = useSWR(
    api.dashboard.$url().toString(),
    async () => {
      const res = await api.dashboard.$get();
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  );
  return { data, isLoading, isError: !!error };
}

export function useAdminCustomers(search?: string) {
  const api = useAdminApi();
  const query = search ? { search } : {};
  const { data, error, isLoading, mutate } = useSWR(
    api.customers.$url({ query }).toString(),
    async () => {
      const res = await api.customers.$get({ query });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  );
  return {
    customers: useStableArray(data),
    isLoading,
    isError: !!error,
    mutate,
  };
}

export function useAdminCustomer(id: number | null) {
  const api = useAdminApi();
  const customerId = id != null ? String(id) : null;
  const { data, error, isLoading, mutate } = useSWR(
    customerId
      ? api.customers[":id"]
        .$url({ param: { id: customerId } })
        .toString()
      : null,
    async () => {
      if (!customerId) return undefined;
      const res = await api.customers[":id"].$get({
        param: { id: customerId },
      });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  );
  return { data, isLoading, isError: !!error, mutate };
}

export function useAdminOrder(id: number | string | null) {
  const api = useAdminApi();
  const orderId = id != null ? String(id) : null;
  const { data, error, isLoading, mutate } = useSWR(
    orderId ? api.orders[":id"].$url({ param: { id: orderId } }).toString() : null,
    async () => {
      if (!orderId) return undefined;
      const res = await api.orders[":id"].$get({ param: { id: orderId } });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  );
  return { data, isLoading, isError: !!error, mutate };
}

export function useAdminOrders(status?: string) {
  const api = useAdminApi();
  const query = status ? { status } : {};
  const { data, error, isLoading, mutate } = useSWR(
    api.orders.$url({ query }).toString(),
    async () => {
      const res = await api.orders.$get({ query });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json();
    },
  );
  return { orders: useStableArray(data), isLoading, isError: !!error, mutate };
}
```

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/hmls-web/hooks/useAdmin.ts
git commit -m "refactor(web): rewrite useAdmin hooks on typed adminApi"
```

---

### Task 3.6: Rewrite useOrderMutations.ts

**Files:**

- Modify: `apps/hmls-web/hooks/useOrderMutations.ts`

- [ ] **Step 1: Read current file** to record which mutations exist

Run: `cat apps/hmls-web/hooks/useOrderMutations.ts`

Identify the mutations: status transition, update order, partial update, schedule, etc.

- [ ] **Step 2: Replace the file**

Use the typed admin client. Sketch (adapt to actual mutations in current file):

```ts
import { useAdminApi } from "@/hooks/useApi";
import type { OrderStatus } from "@hmls/shared/order/status";

export function useOrderMutations(orderId: number) {
  const api = useAdminApi();
  const id = String(orderId);

  return {
    transition: async (
      status: OrderStatus,
      reason?: string,
    ) => {
      const res = await api.orders[":id"].status.$post({
        param: { id },
        json: { status, reason },
      });
      if (!res.ok) throw new Error("Status change failed");
      return res.json();
    },
    update: async (
      patch: Parameters<typeof api.orders[":id"]["$patch"]>[0]["json"],
    ) => {
      const res = await api.orders[":id"].$patch({
        param: { id },
        json: patch,
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    schedule: async (
      input: Parameters<typeof api.orders[":id"]["schedule"]["$post"]>[0]["json"],
    ) => {
      const res = await api.orders[":id"].schedule.$post({
        param: { id },
        json: input,
      });
      if (!res.ok) throw new Error("Schedule failed");
      return res.json();
    },
    recordPayment: async (
      input: Parameters<typeof api.orders[":id"]["payment"]["$post"]>[0]["json"],
    ) => {
      const res = await api.orders[":id"].payment.$post({
        param: { id },
        json: input,
      });
      if (!res.ok) throw new Error("Payment record failed");
      return res.json();
    },
  };
}
```

The `Parameters<typeof api.orders[":id"]["$patch"]>[0]["json"]` pattern lets the call site
type-check the body without redefining the schema.

- [ ] **Step 3: Verify typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/hmls-web/hooks/useOrderMutations.ts
git commit -m "refactor(web): rewrite order mutation hooks on typed adminApi"
```

---

### Task 3.7: Rewrite useAdminMechanics.ts

**Files:**

- Modify: `apps/hmls-web/hooks/useAdminMechanics.ts`

- [ ] **Step 1: Replace the file**

Mirror the patterns from `useAdmin.ts` and `useOrderMutations.ts`. Use `api.mechanics`,
`api.mechanics[":id"]`, `api.mechanics[":id"].availability`,
`api.mechanics[":id"].overrides[":overrideId"]`. **Hover over `api.mechanics` first** to confirm the
actual route shape before writing.

For the response types, import from `@hmls/shared/db/types`:

```ts
import type {
  Provider,
  ProviderAvailability,
  ProviderScheduleOverride,
} from "@hmls/shared/db/types";
```

Replace the inline `Mechanic` / `MechanicDetail` interfaces previously hand-defined in this hook
file.

- [ ] **Step 2: Verify typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/hmls-web/hooks/useAdminMechanics.ts
git commit -m "refactor(web): rewrite mechanic hooks on typed adminApi.mechanics"
```

---

### Task 3.8: Rewrite remaining four hooks

**Files:**

- Modify: `apps/hmls-web/hooks/useCustomer.ts`
- Modify: `apps/hmls-web/hooks/useEstimate.ts`
- Modify: `apps/hmls-web/hooks/useMechanic.ts`

- [ ] **Step 1: useCustomer.ts** — wrap `usePortalApi().me` and similar customer-side endpoints.
      Replace any hand-typed `Customer` import with
      `import type { Customer } from "@hmls/shared/db/types"`.

- [ ] **Step 2: useEstimate.ts** — short file (36 lines). Currently fetches estimates by share
      token. If the endpoint is public (no auth), it stays on a plain `fetch` call rather than going
      through a typed client (because the public estimates endpoint isn't in any of the 3 sub-apps).
      Otherwise, route through `usePortalApi()`.

- [ ] **Step 3: useMechanic.ts** — wrap `useMechanicApi()` for the self-service
      availability/time-off endpoints. Replace inline types with `Provider`, `ProviderAvailability`,
      `ProviderScheduleOverride` from shared.

- [ ] **Step 4: Verify typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/hmls-web/hooks/useCustomer.ts apps/hmls-web/hooks/useEstimate.ts apps/hmls-web/hooks/useMechanic.ts
git commit -m "refactor(web): rewrite remaining hooks on typed clients"
```

---

### Task 3.9: Delete fetcher.ts and types.ts

**Files:**

- Delete: `apps/hmls-web/lib/fetcher.ts`
- Delete: `apps/hmls-web/lib/types.ts`

- [ ] **Step 1: Verify no remaining consumers**

```bash
grep -rln "from \"@/lib/fetcher\"\|from \"@/lib/types\"" apps/hmls-web --include="*.ts" --include="*.tsx"
```

Expected: no matches. If matches appear, fix those import sites first to use `@hmls/shared/db/types`
or the typed clients.

- [ ] **Step 2: Delete the files**

```bash
rm apps/hmls-web/lib/fetcher.ts apps/hmls-web/lib/types.ts
```

- [ ] **Step 3: Verify typecheck + lint + build**

Run: `cd apps/hmls-web && bun run typecheck && bun run lint && bun run build` Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(web): remove lib/fetcher.ts and lib/types.ts

All hooks now use @hmls/shared/db/types and the typed Hono RPC clients
exposed through AuthProvider."
```

---

### Task 3.10: Slim status.ts → status-display.ts

**Files:**

- Delete: `apps/hmls-web/lib/status.ts`
- Create: `apps/hmls-web/lib/status-display.ts`

- [ ] **Step 1: Create status-display.ts**

Create `apps/hmls-web/lib/status-display.ts`:

```ts
import type { OrderStatus } from "@hmls/shared/order/status";

export interface StatusConfig {
  label: string;
  color: string;
}

export const ORDER_STATUS: Record<OrderStatus, StatusConfig> = {
  draft: {
    label: "Draft",
    color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  },
  estimated: {
    label: "Estimated",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  declined: {
    label: "Declined",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
  revised: {
    label: "Revised",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
  scheduled: {
    label: "Scheduled",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  },
  in_progress: {
    label: "In Progress",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

/** Portal-facing labels (admin/portal share colors but differ on phrasing). */
export const PORTAL_ORDER_STATUS: Record<OrderStatus, StatusConfig> = {
  ...ORDER_STATUS,
  draft: { ...ORDER_STATUS.draft, label: "Preparing" },
  estimated: { ...ORDER_STATUS.estimated, label: "Estimate Ready" },
  revised: { ...ORDER_STATUS.revised, label: "Updated Estimate" },
};

export const ORDER_STEP_LABELS_ADMIN: Record<OrderStatus, string> = {
  draft: "Draft",
  estimated: "Estimated",
  approved: "Approved",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  declined: "Declined",
  revised: "Revised",
  cancelled: "Cancelled",
};

export const ORDER_STEP_LABELS_PORTAL: Record<OrderStatus, string> = {
  draft: "Preparing",
  estimated: "Estimate Ready",
  approved: "Approved",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Complete",
  declined: "Declined",
  revised: "Updated Estimate",
  cancelled: "Cancelled",
};
```

Notice: `ORDER_TRANSITIONS`, `EDITABLE_STATUSES`, `ORDER_MAIN_STEPS`, `ORDER_TERMINAL_STATUSES`,
`ORDER_BRANCH_STATUSES`, `getOrderStepState`, `BOOKING_STATUS`, `QUOTE_STATUS` are **not** here.
Consumers of those import from `@hmls/shared/order/status` instead (next task).

- [ ] **Step 2: Delete status.ts**

```bash
rm apps/hmls-web/lib/status.ts
```

- [ ] **Step 3: Update consumers**

```bash
grep -rln "from \"@/lib/status\"" apps/hmls-web --include="*.ts" --include="*.tsx"
```

For each matching file, split the imports:

- `ORDER_STATUS`, `PORTAL_ORDER_STATUS`, `ORDER_STEP_LABELS_*`, `StatusConfig` →
  `from "@/lib/status-display"`
- `ORDER_TRANSITIONS`, `EDITABLE_STATUSES`, `ORDER_MAIN_STEPS`, `ORDER_TERMINAL_STATUSES`,
  `ORDER_BRANCH_STATUSES`, `getOrderStepState`, `OrderStatus`, `OrderStepState` →
  `from "@hmls/shared/order/status"`

These helpers were promoted into `@hmls/shared/order/status` during Task 1.3 step 6, so the imports
resolve cleanly here.

- [ ] **Step 4: Verify web typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(web): split lib/status.ts → lib/status-display.ts + shared

Display layer (label/color) stays in web, typed by canonical OrderStatus.
State machine constants/helpers moved to @hmls/shared/order/status.
BOOKING_STATUS and QUOTE_STATUS removed (Layer 3 dropped those tables)."
```

---

### Task 3.11: Clean up local panel-visibility Sets in admin orders page

**Files:**

- Modify: `apps/hmls-web/app/(admin)/admin/orders/[id]/page.tsx`
- Modify: `apps/hmls-web/app/(admin)/admin/mechanics/[id]/page.tsx`

- [ ] **Step 1: Rename panel-visibility Sets**

In `apps/hmls-web/app/(admin)/admin/orders/[id]/page.tsx` (around lines 82–83), change:

```ts
const QUOTE_STATUSES = new Set(["estimated", "approved"]);
const BOOKING_STATUSES = new Set(["scheduled", "in_progress", "completed"]);
```

to:

```ts
import type { OrderStatus } from "@hmls/shared/order/status";

const SHOW_QUOTE_PANEL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "estimated",
  "approved",
]);
const SHOW_BOOKING_PANEL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "scheduled",
  "in_progress",
  "completed",
]);
```

Update the references later in the file (`QUOTE_STATUSES.has(...)` →
`SHOW_QUOTE_PANEL_STATUSES.has(...)`, `BOOKING_STATUSES.has(...)` →
`SHOW_BOOKING_PANEL_STATUSES.has(...)`).

- [ ] **Step 2: Remove BOOKING_STATUS import in mechanics detail page**

In `apps/hmls-web/app/(admin)/admin/mechanics/[id]/page.tsx:30`, find:

```ts
import { BOOKING_STATUS } from "@/lib/status";
```

Replace with `ORDER_STATUS` from `@/lib/status-display`. Update the usage at line ~123:

```ts
const statusCfg = BOOKING_STATUS[b.status] ?? { ... };
```

becomes:

```ts
const statusCfg = ORDER_STATUS[b.status as OrderStatus] ?? { ... };
```

(`b.status` is the order status from the typed `Order` row — the cast is safe because Drizzle infers
`string` from `varchar(30)`. If you want stronger guarantees, add `isOrderStatus(b.status)` from
`@hmls/shared/order/status` and branch.)

- [ ] **Step 3: Verify typecheck**

Run: `cd apps/hmls-web && bun run typecheck` Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/hmls-web/app/\(admin\)/admin/orders/\[id\]/page.tsx apps/hmls-web/app/\(admin\)/admin/mechanics/\[id\]/page.tsx
git commit -m "refactor(web): rename panel-visibility Sets + drop BOOKING_STATUS usage

QUOTE_STATUSES → SHOW_QUOTE_PANEL_STATUSES (etc.) — these are panel
visibility predicates over canonical OrderStatus, not legacy quote/booking
table statuses (those tables were dropped in Layer 3)."
```

---

### Task 3.12: Walk vehicleInfo year drift

**Files:**

- Modify: any consumer that treats `Customer.vehicleInfo.year` as `string`

- [ ] **Step 1: Find consumers**

```bash
grep -rn "vehicleInfo.year\|vehicleInfo?.year" apps/hmls-web --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: For each match**

Inspect the surrounding code. If the code does `String(c.vehicleInfo?.year)`, drop the coercion —
`year` is now `number | undefined`. If the code displays it directly inside JSX, no change needed
(`{year}` works). If the code does `parseInt(year, 10)`, replace with the value directly.

The known offender pattern was forms that used `year: ""` defaults; update to `year: 0` or
`year: undefined` consistently.

- [ ] **Step 3: Verify typecheck + lint**

Run: `cd apps/hmls-web && bun run typecheck && bun run lint` Expected: PASS

- [ ] **Step 4: Manual smoke**

Run: `cd apps/hmls-web && GATEWAY_URL=http://localhost:8080 infisical run --env=dev -- bun run dev`

In another terminal, run the gateway: `infisical run --env=dev -- deno task dev:api`

Visit:

- `/admin` (dashboard) — KPIs render, customer list shows
- `/admin/customers` — list + detail + edit form
- `/admin/orders` — list, filter by status, open detail
- `/admin/orders/:id` — details, quote panel for `estimated`/`approved`, booking panel for
  `scheduled`+
- `/admin/mechanics` — list + detail with availability + booking schedule
- `/portal/orders` — customer list + detail
- `/mechanic/availability` (logged in as mechanic) — set availability

Check console for errors. Each page should issue a typed RPC call (visible in Network tab going to
`localhost:8080/api/...`).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix(web): clean up vehicleInfo.year coercions after type unification"
```

---

### Task 3.13: PR 3 acceptance + open PR

- [ ] **Step 1: Full check suite**

```bash
cd apps/hmls-web && bun run lint && bun run typecheck && bun run build
deno task check
deno task test
```

All must pass.

- [ ] **Step 2: Verify deletions**

```bash
ls apps/hmls-web/lib/types.ts apps/hmls-web/lib/fetcher.ts apps/hmls-web/lib/status.ts 2>&1
```

Expected: all three "No such file" errors.

- [ ] **Step 3: Verify no leftover dead constants**

```bash
grep -rn "BOOKING_STATUS\|QUOTE_STATUS\b" apps/hmls-web --include="*.ts" --include="*.tsx"
```

Expected: no matches (the renamed `SHOW_*_PANEL_STATUSES` should not match this pattern).

- [ ] **Step 4: Push + open PR**

```bash
git push
gh pr create --title "refactor(web): consume @hmls/shared types + Hono RPC clients (3/3)" --body "$(cat <<'EOF'
## Summary

PR 3 of 3 for the [hmls-web SSOT refactor](docs/superpowers/specs/2026-05-02-hmls-web-ssot-design.md).

- Delete `lib/types.ts` (hand-written Order/Customer/OrderItem/OrderEvent — drifted from schema)
- Delete `lib/fetcher.ts` (`authFetch` no longer needed)
- Slim `lib/status.ts` → `lib/status-display.ts` (label/color only, keyed by canonical `OrderStatus`)
- Delete `BOOKING_STATUS`/`QUOTE_STATUS` (dead since Layer 3)
- Add `lib/api-client.ts` (typed Hono RPC factory)
- Extend `AuthProvider` to memoize and expose `api: { admin, portal, mechanic }`
- Add `useAdminApi`/`usePortalApi`/`useMechanicApi` thin readers
- Rewrite all 7 fetch hooks to use typed clients
- Rename panel-visibility Sets in `admin/orders/[id]/page.tsx` to use canonical OrderStatus
- Resolve `vehicleInfo.year` type drift (number throughout)

## Test plan
- [ ] `bun run typecheck && bun run lint && bun run build` passes
- [ ] `deno task check && deno task test` passes
- [ ] Manual smoke: admin dashboard, customers list+detail, orders list+detail, mechanics list+detail, portal orders, mechanic availability all render and issue typed RPC calls without console errors
EOF
)"
```

---

## Plan self-review notes

This plan covers every requirement in the spec:

| Spec section / requirement                                | Plan task     |
| --------------------------------------------------------- | ------------- |
| Move `apps/agent/src/db/schema.ts` to shared              | Task 1.2      |
| Move `order-state-core.ts` to shared                      | Task 1.3      |
| Add `db/types.ts` with `$inferSelect`                     | Task 1.4      |
| Add `api/contract.ts` (stub)                              | Task 1.5      |
| Extend `mod.ts` re-exports                                | Task 1.6      |
| Fix dup `EDITABLE_STATUSES` in admin-order-tools          | Task 1.7      |
| `packages/shared` dual-publish (deno.json + package.json) | Task 1.1      |
| Bun-side resolution canary                                | Task 1.8      |
| `transpilePackages` in next.config                        | Task 1.9      |
| Zod input contracts per route group                       | Tasks 2.1–2.2 |
| Wire `zValidator` in routes                               | Task 2.3      |
| Annotate `c.json` response types                          | Task 2.4      |
| Compose 3 sub-apps + export AppTypes                      | Task 2.5      |
| Wire `api/contract.ts` to gateway types                   | Task 2.6      |
| Add `lib/api-client.ts` factory                           | Task 3.1      |
| Extend `AuthProvider` with api context                    | Task 3.2      |
| Add `useApi.ts` thin readers                              | Task 3.3      |
| Rewrite all 7 fetch hooks                                 | Tasks 3.4–3.8 |
| Delete `lib/fetcher.ts` + `lib/types.ts`                  | Task 3.9      |
| Slim `lib/status.ts` → `lib/status-display.ts`            | Task 3.10     |
| Rename panel-visibility Sets + drop `BOOKING_STATUS`      | Task 3.11     |
| Walk `vehicleInfo.year` consumers                         | Task 3.12     |

**Out of scope (per spec):** server-side proxy for auth, multi-shop tenancy, Stripe
re-implementation, BAR § 3353, `OrderEvent.metadata` discriminated union, fixo, streaming chat
routes, UI/UX changes — none of these appear in any task.
