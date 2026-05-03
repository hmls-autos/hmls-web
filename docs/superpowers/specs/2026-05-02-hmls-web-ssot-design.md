# hmls-web Single-Source-of-Truth Refactor

**Date:** 2026-05-02 **Scope:** `apps/hmls-web` ↔ `apps/gateway` (HMLS sub-app only) ↔
`packages/shared` **Out of scope:** Fixo (`fixo-web`, `apps/agent/src/fixo`,
`apps/gateway/src/routes/fixo`), streaming chat routes, UI/visual changes.

## Revision 2026-05-03 — Pivot from Hono RPC to typed-fetch

The original design proposed Hono RPC with `AdminApiType` / `PortalApiType` / `MechanicApiType`
propagated from gateway to web. During PR 2 implementation we hit a structural limit: web
typechecking the AppType pulls in the entire transitive type graph of every gateway file, which uses
Deno-specific imports (`.ts` extensions, `Deno.*` globals, `@hmls/agent` workspace package,
`@logtape/logtape` JSR import, ...). Each new Deno-side dependency would silently become a web
concern. The fragility outweighed the extra typesafety.

**The revision keeps the high-value parts:**

- Zod input schemas live in `packages/shared/src/api/contracts/` (originally in gateway). Both
  gateway routes (via `zValidator`) and web hooks/forms (via `z.infer`) consume the same schemas.
  Request shapes are SSOT.
- `c.json<T>(...)` response annotations on every gateway handler, typed by `@hmls/shared/db/types`.
  Response shapes are SSOT.
- Sub-app composition (`adminApp` / `portalApp` / `mechanicApp`) at gateway module scope for clean
  prefix/auth boundaries.

**The revision drops:**

- `AdminApiType` / `PortalApiType` / `MechanicApiType` exports from `hmls-app.ts`.
- The relative-path type bridge from `@hmls/shared/api/contract` into gateway source.
- Web-side accommodations for that bridge (`@deno/types` ambient, `@logtape/logtape`, `hono` dep).
  `allowImportingTsExtensions: true` stays — the contracts barrel uses `.ts` re-exports for Deno
  consumers.

**The replacement on the web side (PR 3):** a small `apps/hmls-web/lib/api-paths.ts` holds the route
strings; a thin typed-fetch wrapper takes a Zod schema for the input and a Drizzle type for the
output. Three SSOT layers (domain types, state machine, request + response shapes) are preserved.
The tradeoff: a route-string typo is not caught at compile time. Mitigation: every path lives in one
file.

## Goal

Eliminate duplicated and drifted definitions of (1) domain types, (2) order state machine, and (3)
HTTP request/response shapes between `hmls-web` and the gateway/agent. After this refactor, each of
these has exactly one place where it is defined; TypeScript catches drift at compile time across all
three apps.

### Concrete duplications removed

- `apps/hmls-web/lib/types.ts` — hand-written `Order` / `OrderItem` / `Customer` / `OrderEvent` /
  `OrderDetail` interfaces that duplicate `apps/agent/src/db/schema.ts` and have already drifted
  (e.g. `Order.vehicleInfo.year: number` vs `Customer.vehicleInfo.year: string`).
- `apps/hmls-web/lib/status.ts` — `ORDER_STATUS`, `ORDER_TRANSITIONS`, `EDITABLE_STATUSES`,
  `ORDER_MAIN_STEPS`, `ORDER_TERMINAL_STATUSES`, `ORDER_BRANCH_STATUSES`, `getOrderStepState`
  duplicate `apps/agent/src/services/order-state-core.ts`. The web's
  `EDITABLE_STATUSES =
  ["draft", "revised"]` is a degraded copy of the canonical
  `["draft", "revised", "estimated"]` — a real bug.
- `apps/hmls-web/lib/status.ts` `BOOKING_STATUS` and `QUOTE_STATUS` constants — dead code from Layer
  3 (those tables were dropped).
- `apps/hmls-web/app/(admin)/admin/orders/[id]/page.tsx` — local `QUOTE_STATUSES` and
  `BOOKING_STATUSES` `Set`s (lines 82–83). These are not really "quote/booking statuses" but UI
  panel-visibility predicates over canonical `OrderStatus`. Renaming + canonical typing.
- `apps/agent/src/hmls/tools/admin-order-tools.ts:133` — local
  `EDITABLE_STATUSES = new Set(["draft", "revised", "estimated"])` shadows the canonical constant.
  Replaced with import from canonical.
- Inline response types in every web hook (`DashboardData`, `CustomerDetail`, `UpcomingOrderRow`,
  `Mechanic`, `MechanicDetail`, `AvailabilityResponse`, etc.) — replaced with TypeScript inference
  from the gateway's typed responses.
- API path strings scattered across hooks (`/api/admin/dashboard`,
  `/api/admin/orders/${id}/
  status`, etc.) — replaced with property access on the typed client
  (`api.orders[":id"].
  status.$post(...)`).

## Architecture

Three SSOT layers, in order from "data" outward to "wire":

```
┌─────────────────────────────────────────────────────────────────────┐
│ Layer 1: Domain types (shape of rows in DB)                         │
│   Source: packages/shared/src/db/schema.ts (Drizzle table defs)     │
│   Derived: $inferSelect / $inferInsert in db/types.ts               │
│   Consumers: agent (queries), gateway (responses), web (props)      │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 2: State machine invariants (lifecycle rules)                 │
│   Source: packages/shared/src/order/status.ts                       │
│   Defines: OrderStatus, TRANSITIONS, ACTOR_PERMISSIONS,             │
│            EDITABLE_STATUSES, PAYMENT_ALLOWED_STATUSES, Actor,      │
│            canTransition(), ORDER_MAIN_STEPS, getOrderStepState()   │
│   Consumers: agent harness (transition writes), gateway (validators │
│            ), web (UI guards, progress bar, edit-enable)            │
├─────────────────────────────────────────────────────────────────────┤
│ Layer 3: HTTP contract (request body, response body, path, method)  │
│   Source: each gateway route file's typed `c.json<T>(...)` returns  │
│            + Zod input schemas in apps/gateway/src/contracts/       │
│   Exported as: HmlsAppType (composed) → split into                  │
│            AdminApiType / PortalApiType / MechanicApiType           │
│   Consumer: web via hc<T>() typed client                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Why three sub-apps, not one

The HMLS app's mounted prefixes already match the auth boundaries and the web's route groups:

| Prefix            | Auth          | Web pages          | Client        |
| ----------------- | ------------- | ------------------ | ------------- |
| `/api/admin/*`    | requireAdmin  | `app/(admin)/*`    | `adminApi`    |
| `/api/portal/*`   | requireAuth   | `app/(portal)/*`   | `portalApi`   |
| `/api/mechanic/*` | mechanic auth | `app/(mechanic)/*` | `mechanicApi` |

Splitting `AppType` along these lines keeps the TypeScript inference cost on each web page group
bounded — no page ever loads the full HMLS app type. (Hono RPC's known TS-perf cliff is around 50+
routes; the combined HMLS surface is ~40–60 endpoints, right at the edge, so we split now rather
than wait for editor lag.)

### What stays out of `HmlsAppType`

- `/api/chat`, `/api/admin/chat` — AI SDK SSE streams, contracted by `useChat` from `@ai-sdk/react`,
  not our concern.
- `/webhook` — Stripe webhook, no web caller.
- `/api/estimates/*`, `/api/orders/:token/pdf` — public share-token PDF + token approval. Web mostly
  just renders links. Add a `publicApi` later if we ever fetch instead of link.
- `/health` — infra concern.

## Layout

```
packages/shared/
├── deno.json                    # extended exports map
├── package.json                 # NEW — name "@hmls/shared", "exports" map
└── src/
    ├── mod.ts                   # extended re-exports
    ├── lib/
    │   ├── errors.ts            # existing
    │   └── tool-result.ts       # existing
    ├── db/
    │   ├── client.ts            # existing
    │   ├── schema.ts            # MOVED from apps/agent/src/db/schema.ts
    │   └── types.ts             # NEW — $inferSelect / $inferInsert exports
    ├── order/
    │   └── status.ts            # MOVED from apps/agent/src/services/order-state-core.ts
    │                            #   (constants + types + pure helpers; DB writes stay)
    └── api/
        └── contract.ts          # NEW — re-export AdminApiType/PortalApiType/MechanicApiType
                                 #   from gateway via TS-only relative import

apps/agent/src/db/schema.ts      # becomes a re-export shim of @hmls/shared/db/schema
apps/agent/src/services/
├── order-state-core.ts          # becomes a re-export shim of @hmls/shared/order/status
└── order-state.ts               # unchanged (DB-touching writes stay here, import shared core)

apps/gateway/src/
├── contracts/                   # NEW dir
│   ├── orders.ts                # Zod input schemas for /api/admin/orders/*
│   ├── admin.ts                 # Zod input schemas for /api/admin/*
│   ├── admin-mechanics.ts       # Zod input schemas for /api/admin/mechanics/*
│   ├── portal.ts                # Zod input schemas for /api/portal/*
│   ├── mechanic.ts              # Zod input schemas for /api/mechanic/*
│   └── index.ts                 # barrel
├── hmls-app.ts                  # composes adminApp / portalApp / mechanicApp;
│                                #   exports AdminApiType / PortalApiType / MechanicApiType
└── routes/                      # unchanged file boundaries; each route file gets:
                                 #   - zValidator("json", schemaFromContracts)
                                 #   - explicit c.json<T>(...) return type annotations

apps/hmls-web/
├── tsconfig.json                # add path "@hmls/shared/*": ["../../packages/shared/src/*"]
├── package.json                 # add deps: hono, drizzle-orm, zod (versions match root deno.json)
├── lib/
│   ├── types.ts                 # DELETED
│   ├── fetcher.ts               # DELETED (authFetch removed)
│   ├── status-display.ts        # RENAMED from lib/status.ts and slimmed to display only —
│   │                            #   Record<OrderStatus, { label; color }>, per-surface
│   │                            #   variants (admin / portal); typed by canonical OrderStatus.
│   │                            #   ORDER_TRANSITIONS, EDITABLE_STATUSES, ORDER_MAIN_STEPS,
│   │                            #   getOrderStepState removed — imported from @hmls/shared
│   └── api-client.ts            # NEW — exports createApiClients(token) factory
│                                #       returning { admin, portal, mechanic } typed clients
├── components/
│   └── AuthProvider.tsx         # extended — useMemo(createApiClients(session?.access_token))
│                                #   exposes `api` field on context value
└── hooks/
    ├── useApi.ts                # NEW — useAdminApi / usePortalApi / useMechanicApi
    └── (rewrite of every fetch hook to call apiClient.foo.$get / $post)
```

### `packages/shared/src/db/types.ts` (sketch)

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
export type Provider = typeof providers.$inferSelect;
export type ProviderAvailability = typeof providerAvailability.$inferSelect;
export type ProviderScheduleOverride = typeof providerScheduleOverrides.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type PricingConfig = typeof pricingConfig.$inferSelect;

// Single canonical shape — replaces the divergent `vehicleInfo` definitions
// in web's old lib/types.ts (one had year: number, the other year: string).
export type VehicleInfo = { year?: number; make?: string; model?: string };

// Order's items column is jsonb; type narrowed with the OrderItem interface
// already exported from schema.ts.
export type { OrderItem } from "./schema.ts";

// Composite shape used by GET /api/admin/orders/:id — gateway returns this;
// declaring it once here lets web import without redefining.
export type OrderDetail = {
  order: Order;
  customer: Customer | null;
  events: OrderEvent[];
};
```

### `packages/shared/src/api/contract.ts` (sketch)

```ts
// Type-only re-export. Gateway runtime is not pulled into web's bundle —
// `import type` is fully erased.
export type {
  AdminApiType,
  MechanicApiType,
  PortalApiType,
} from "../../../../apps/gateway/src/hmls-app.ts";

// Input Zod schemas (runtime values). Both gateway routes and web forms
// import from here.
export * as Contracts from "../../../../apps/gateway/src/contracts/index.ts";
```

### `apps/hmls-web/lib/api-client.ts` (sketch)

```ts
import { hc } from "hono/client";
import type { AdminApiType, MechanicApiType, PortalApiType } from "@hmls/shared/api/contract";
import { AGENT_URL } from "./config.ts";

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
    mechanic: hc<MechanicApiType>(`${AGENT_URL}/api/mechanic`, { fetch: customFetch }),
  };
}
```

### `apps/hmls-web/components/AuthProvider.tsx` extension (sketch)

```tsx
import { type ApiClients, createApiClients } from "@/lib/api-client";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  supabase: ReturnType<typeof createClient>;
  isLoading: boolean;
  isAdmin: boolean;
  isMechanic: boolean;
  api: ApiClients; // NEW
};

// inside AuthProvider:
const api = useMemo(
  () => createApiClients(session?.access_token),
  [session?.access_token],
);
const value = useMemo(
  () => ({ user, session, supabase, isLoading, isAdmin, isMechanic, api }),
  [user, session, supabase, isLoading, isAdmin, isMechanic, api],
);
```

### `apps/hmls-web/hooks/useApi.ts` (sketch)

```ts
import { useAuth } from "@/components/AuthProvider";

export const useAdminApi = () => useAuth().api.admin;
export const usePortalApi = () => useAuth().api.portal;
export const useMechanicApi = () => useAuth().api.mechanic;
```

### Hook rewrite shape (sketch)

```ts
// hooks/useAdmin.ts (after)
export function useAdminOrder(id: number | null) {
  const api = useAdminApi();
  return useSWR(
    id ? api.orders[":id"].$url({ param: { id: String(id) } }).toString() : null,
    async () => {
      const res = await api.orders[":id"].$get({ param: { id: String(id) } });
      if (!res.ok) throw new Error("Fetch failed");
      return res.json(); // type inferred from HmlsAppType
    },
  );
}
```

## Migration order (3 PRs)

### PR 1 — Shared package backbone (no behavior change)

**Goal:** make `packages/shared` the physical home of schema + state-machine. Agent and gateway are
mechanically updated to import from the new location; no shim layer. Web is untouched.

**Changes:**

1. Move file content of `apps/agent/src/db/schema.ts` → `packages/shared/src/db/schema.ts`. Update
   all 25 import sites in agent + gateway to `import ... from "@hmls/shared/db/schema"` (or
   `@hmls/shared/db/types` for derived types). Delete the original
   `apps/agent/src/db/
   schema.ts`. `apps/agent/src/db/client.ts` keeps its own existence but
   imports schema from shared.
2. Move pure parts of `apps/agent/src/services/order-state-core.ts` (types, constants,
   `canTransition`, `assertCanTransition`, `ORDER_MAIN_STEPS`, `getOrderStepState`, etc.) →
   `packages/shared/src/order/status.ts`. Update `apps/agent/src/services/order-state.ts` and any
   other consumer to import from `@hmls/shared/order/status`. Delete the original
   `order-state-core.ts`.
3. Add `packages/shared/src/db/types.ts` with `$inferSelect` exports and `VehicleInfo`,
   `OrderDetail`.
4. Extend `packages/shared/deno.json` `exports`:
   ```json
   {
     ".": "./src/mod.ts",
     "./tool-result": "./src/lib/tool-result.ts",
     "./errors": "./src/lib/errors.ts",
     "./db": "./src/db/client.ts",
     "./db/schema": "./src/db/schema.ts",
     "./db/types": "./src/db/types.ts",
     "./order/status": "./src/order/status.ts",
     "./api/contract": "./src/api/contract.ts"
   }
   ```
5. Add `packages/shared/package.json` with matching `name`, `exports` map (using `.ts` source
   directly — Next.js with `transpilePackages` will handle TS, no build step needed).
6. Fix the agent dup at `apps/agent/src/hmls/tools/admin-order-tools.ts:133` — replace local
   `EDITABLE_STATUSES` with import from `@hmls/shared/order/status`.

**Acceptance:**

- `deno task check` passes
- `deno task test` passes (agent + gateway tests)
- All 25 import sites of `apps/agent/src/db/schema.ts` updated to `@hmls/shared/...`
- All consumers of `order-state-core.ts` (notably `services/order-state.ts`) updated
- `apps/agent/src/db/schema.ts` and `apps/agent/src/services/order-state-core.ts` no longer exist
- `packages/shared/src/api/contract.ts` is a stub at this point (the type-only relative import to
  gateway is added in PR 2 once gateway exports the types)
- **Bun-side resolution canary**: temporarily add
  `import type { Order } from "@hmls/shared/db/types";` to any file in `apps/hmls-web` and verify
  `bun run typecheck` passes; revert before merging. This proves the cross-runtime resolution works
  before PR 3 depends on it.

### PR 2 — Gateway typed contracts

**Goal:** make the gateway export `AdminApiType` / `PortalApiType` / `MechanicApiType` with full
TS-inferred response types, and centralize Zod input schemas.

**Changes:**

1. Create `apps/gateway/src/contracts/` with one Zod-schema file per route group. Migrate the ad-hoc
   `c.req.json()` parsing in each route to `zValidator("json", schemaFromContracts)`.
2. Add explicit response type annotations to every `c.json(...)` call in the 5 RPC route files
   (`orders`, `admin`, `admin-mechanics`, `portal`, `mechanic`). Where the same response type is
   imported from `@hmls/shared/db/types` (e.g. `Order`, `OrderDetail`), use that.
3. In `apps/gateway/src/hmls-app.ts`, compose three sub-apps:
   ```ts
   const adminApp = new Hono()
     .route("/", admin)
     .route("/orders", orders)
     .route("/mechanics", adminMechanics);
   const portalApp = portal;
   const mechanicApp = mechanic;

   export type AdminApiType = typeof adminApp;
   export type PortalApiType = typeof portalApp;
   export type MechanicApiType = typeof mechanicApp;

   app.route("/api/admin", adminApp);
   app.route("/api/portal", portalApp);
   app.route("/api/mechanic", mechanicApp);
   ```
4. Wire the type re-exports in `packages/shared/src/api/contract.ts`.

**Acceptance:**

- `deno task check` passes
- `deno task test` passes
- Streaming routes (`/api/chat`, `/api/admin/chat`), webhook, estimates PDF — untouched
- Hovering `AdminApiType` in TS shows nested route shapes correctly (smoke test)

### PR 3 — Web one-shot migration

**Goal:** web stops duplicating types and stops using `authFetch`. All fetch hooks talk through the
typed clients.

**Changes:**

1. `apps/hmls-web/tsconfig.json`: add `paths` mapping
   `"@hmls/shared/*":
   ["../../packages/shared/src/*"]`. Add
   `"transpilePackages": ["@hmls/shared"]` to `next.config.ts` so Next compiles the workspace TS
   sources.
2. `apps/hmls-web/package.json`: add `hono`, `drizzle-orm`, `zod` (versions matching the root deno
   workspace).
3. Delete `apps/hmls-web/lib/types.ts`.
4. Delete `apps/hmls-web/lib/fetcher.ts`.
5. Add `apps/hmls-web/lib/api-client.ts` (factory).
6. Extend `apps/hmls-web/components/AuthProvider.tsx` to memoize and expose `api`.
7. Add `apps/hmls-web/hooks/useApi.ts` — three thin readers.
8. Rewrite each fetch hook to use `useXxxApi()`:
   - `hooks/useAdmin.ts`
   - `hooks/useAdminMechanics.ts`
   - `hooks/useCustomer.ts`
   - `hooks/useEstimate.ts`
   - `hooks/useMechanic.ts`
   - `hooks/useOrderMutations.ts`
   - `hooks/usePortal.ts`
9. Slim `apps/hmls-web/lib/status.ts` to display layer; rename to `lib/status-display.ts`. The
   constants (`ORDER_STATUS`, `ORDER_TRANSITIONS`, `EDITABLE_STATUSES`, `ORDER_MAIN_STEPS`,
   `ORDER_TERMINAL_STATUSES`, `ORDER_BRANCH_STATUSES`, `getOrderStepState`) come from
   `@hmls/shared/order/status`; only `label + color` records and the per-surface variants stay in
   web.
10. Delete dead `BOOKING_STATUS` and `QUOTE_STATUS` constants (and remove the import in
    `app/(admin)/admin/mechanics/[id]/page.tsx:30`).
11. In `app/(admin)/admin/orders/[id]/page.tsx`:
    - rename local `QUOTE_STATUSES` → `SHOW_QUOTE_PANEL_STATUSES` (or similar)
    - rename `BOOKING_STATUSES` → `SHOW_BOOKING_PANEL_STATUSES`
    - type the Sets as `ReadonlySet<OrderStatus>` so canonical type checks them
12. Walk the codebase for any consumer of `Customer.vehicleInfo.year` or `Order.vehicleInfo.year`
    and update the few sites where the year is treated as `string` (these were tolerating the drift
    via `String(year)`-style coercions).

**Acceptance:**

- `cd apps/hmls-web && bun run typecheck` passes
- `cd apps/hmls-web && bun run lint` passes
- `cd apps/hmls-web && bun run build` passes
- `deno task check` passes
- Manual smoke: load `/admin`, `/admin/orders`, `/admin/orders/:id`, `/admin/mechanics`,
  `/portal/orders`, `/portal/orders/:id`, `/mechanic/availability` — each issues a typed RPC call,
  no console errors.

## Risks and open questions

### R1 · Hono RPC TS inference cost

Three sub-apps keep each `AppType` bounded (~15–25 routes each). If editor lag still appears, we can
split `adminApp` further (e.g. peel `/api/admin/orders` and `/api/admin/mechanics` into
`adminOrdersApi` and `adminMechanicsApi` clients). Not preemptive — measure and split if needed.

### R2 · Bun ↔ Deno workspace resolution for `@hmls/shared`

Approach: `packages/shared` keeps its `deno.json` (consumed by gateway/agent through Deno workspace)
**and** gains a `package.json` with an `exports` map pointing at TS sources. Web resolves the
package via tsconfig `paths` mapping straight at the source directory; Next.js configured with
`transpilePackages: ["@hmls/shared"]` so TS sources are compiled at build time. No separate build
step for the shared package.

The schema file's `import { ... } from "drizzle-orm/pg-core"` is compatible with both worlds: Deno
resolves via its `imports` map (`npm:drizzle-orm`); Bun/Next resolves via web's `package.json`
(`drizzle-orm` direct dep). Versions match (`^0.45.2` in root `deno.json`, same pinned version added
to web).

PR 1 acceptance MUST verify the web side imports successfully — at the end of PR 1, even though web
isn't using anything yet, add a temporary throwaway
`import type { Order } from
"@hmls/shared/db/types"` somewhere in web and run `bun run typecheck`.
Remove the throwaway before merging PR 1; it's a build-pipeline canary.

### R3 · Streaming routes do not enter the typed client

`/api/chat` and `/api/admin/chat` continue to use AI SDK's `useChat` with `DefaultChatTransport`.
They are not part of `AdminApiType` (the customer chat is even outside the admin sub-app). This is
intentional — AI SDK has its own protocol contract; pulling SSE streams into Hono RPC adds nothing.

### R4 · Display-layer presentation stays in web

Tailwind class strings (`"bg-amber-100 text-amber-700 ..."`) are web-specific and live in
`apps/hmls-web/lib/status-display.ts`, keyed by canonical `OrderStatus`. They are NOT moved to
`packages/shared`; doing so would couple shared contracts to a frontend styling system. If a second
front-end ever needs status presentation, it can build its own keyed by the same canonical type.

### R5 · `OrderEvent.metadata` stays `Record<string, unknown>`

Out of scope. The `metadata` jsonb column carries different shapes per event type; narrowing to a
discriminated union is its own design problem. Left as-is.

### R6 · Server-side proxy for auth

Out of scope. The current SPA + bearer-token flow keeps auth in `AuthProvider`'s React state,
already a single source of truth for the session. Eliminating browser-side token exposure entirely
(httpOnly cookies + Next catchall proxy + audit of `supabase.auth.getSession()` client calls) is a
separate, security-motivated PR.

## Out of scope

- Multi-shop tenancy enforcement (separate, larger initiative — `shops` table exists but no code
  path scopes by `shop_id` yet)
- Stripe auto-capture re-implementation (dormant by design)
- BAR § 3353 compliance flow (open design)
- `OrderEvent.metadata` discriminated union
- Browser-side token elimination via Next.js proxy
- Any UI/UX changes
