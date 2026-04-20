# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Build & Development Commands

```bash
# Dev servers
cd apps/hmls-web && bun run dev       # Next.js on port 3000
deno task dev:api                # API + Fixo agent on port 8080
# Main API: http://localhost:8080
# Fixo API: http://fixo.localhost:8080

# Build & quality
cd apps/hmls-web && bun run build     # Build Next.js
cd apps/hmls-web && bun run lint      # Lint with Biome
cd apps/hmls-web && bun run typecheck # TypeScript type checking
deno task check                  # Deno check gateway + agent
deno task lint                   # Deno lint (excludes web)
deno task fmt:check              # Deno format check (excludes web)

# Database (Supabase PostgreSQL — no local DB needed)
deno task --cwd apps/agent db:push      # Push schema changes to DB (dev)
deno task --cwd apps/agent db:generate  # Generate migration files
deno task --cwd apps/agent db:migrate   # Apply migrations (production)
deno task --cwd apps/agent db:studio    # Drizzle Studio GUI
```

## Setup

```bash
cd apps/hmls-web && bun install       # Install web dependencies
git config core.hooksPath .githooks  # Enable pre-commit hook

# Secrets — this repo uses Infisical (not .env.local). Config: .infisical.json at root.
# Run dev servers via infisical so secrets are injected:
infisical run --env=dev -- deno task dev:api
cd apps/hmls-web && GATEWAY_URL=http://localhost:8080 infisical run --env=dev -- bun run dev
# Note: GATEWAY_URL override is required for local web — the /api/chat Next.js route
# defaults to https://api.hmls.autos (prod) and must be pointed at the local API.
```

## Product Direction (as of 2026-04-20)

**Positioning**: AI-powered auto repair estimates for mechanic shops (SaaS). HMLS is the software
vendor; individual shops are the customers. One of those shops is HMLS's own self-operated mobile
mechanic business (dogfood).

**Core wedge**: AI Service Advisor. A customer chats with the shop's AI, gets a real (OLP-priced)
estimate, shop team reviews and sends, customer approves, mechanic assigned, job scheduled,
completed. No payment automation by default — shops record payments manually. Stripe plumbing kept
dormant for shops that want opt-in auto-capture later.

**Single source of truth**: `orders` is THE entity. All work-lifecycle data (including scheduling,
provider assignment, location, symptoms, photos) lives on the order. Legacy tables
(`estimates`, `quotes`, `bookings`) are **dropped** (Layer 3 complete).

## Order lifecycle (simplified status machine)

```
draft → estimated → approved → scheduled → in_progress → completed
           ↓           ↓                        ↓
         declined  cancelled                 cancelled
           ↓
         revised → estimated
```

- `draft` — AI-generated, awaiting shop review
- `estimated` — shop sent the estimate to customer
- `approved` — customer accepted; shop needs to assign mechanic + confirm booking
- `scheduled` — mechanic assigned + booking confirmed
- `in_progress` — mechanic working
- `completed` — done (payment tracked via `paid_at` / `payment_method` / `payment_reference`
  columns, not a status)
- Branches: `declined` (customer declined) / `revised` (shop re-sends) / `cancelled` (terminal)

**Removed states** (migrated in `0008_simplify_status_machine.sql`): `preauth → approved`,
`invoiced → in_progress`, `paid → completed + paid_at`, `archived → completed`, `void → cancelled`.

## Architecture

Deno workspace monorepo for a mobile mechanic business with an AI-powered chat agent. All apps
deploy to **Deno Deploy** (console.deno.com) via GitHub integration. Root config is `deno.json`; web
app uses Bun/Next.js internally. Root `deno.json` `imports` are inherited by all workspace members —
shared deps go there, app-specific deps in each app's `deno.json`.

```
apps/
├── hmls-web/           # Next.js 16 frontend (React 19, Tailwind CSS 4) → Deno Deploy
├── gateway/            # HTTP server (Hono, routing, auth, CORS) → Deno Deploy
└── agent/              # AI agents + domain logic (library package)
    ├── llm/            #   GeminiOpenAIProvider (shared)
    ├── db/             #   Drizzle schema + client (shared)
    ├── hmls/           #   HMLS agent, tools, skills, PDF
    └── fixo/           #   Fixo agent, tools, lib, PDF
packages/
└── shared/             # @hmls/shared — shared utilities (errors, toolResult, db client)
```

### Service Communication & Subdomain Routing

The API server uses hostname-based dispatch to route requests:

- **`localhost:8080`** / default → Main HMLS API (estimates, portal, admin, chat)
- **`fixo.localhost:8080`** / `api.fixo.hmls.autos` → Fixo API (sessions, billing, vehicles, chat)

Each sub-app has its own CORS, auth middleware, and error handler. No middleware leaks between
domains.

- **Web → Agent**: AI SDK v6 `useChat` with `DefaultChatTransport` (port 8080)
- **Fixo Web → Agent**: AI SDK v6 via `http://fixo.localhost:8080` / `https://api.fixo.hmls.autos`
- **Agent → DB**: Direct Supabase PostgreSQL connection via Drizzle ORM

### Key Patterns

**Shared Package** (`packages/shared/`): `@hmls/shared` with sub-path exports

- `@hmls/shared/errors` - AppError class, ErrorCode enum, Errors factories
- `@hmls/shared/tool-result` - MCP-compliant tool result helper
- `@hmls/shared/db` - Schema-agnostic `createDbClient(schema)` factory

**Gateway Routes** (`apps/gateway/src/routes/`): Hono sub-routers mounted by `hmls-app.ts`

- `chat.ts` / `staff-chat.ts` - AG-UI streaming endpoints (customer + admin)
- `orders.ts` - admin order CRUD + status transitions + `POST /:id/payment` (manual mark-paid)
- `portal.ts` - customer-facing order/booking endpoints
- `admin.ts` - dashboard, customers, bookings CRUD
- `admin-mechanics.ts` - mechanic management + booking reassignment
- `mechanic.ts` - mechanic self-service (availability, time-off)
- `estimates.ts` - public PDF route (reads orders now; legacy `estimates` table unused)
- `webhook.ts` - Stripe webhook (invoice.paid / payment_intent.succeeded only — quote handlers
  removed)
- `fixo/` - Fixo sub-app routes

**Deleted recently** (2026-04-20): legacy `/admin/estimates`, `/admin/quotes` CRUD routes;
customer-side `/preauth`, `/confirm-preauth`; admin-side `/capture`; Stripe `quote.accepted`
webhook. `apps/agent/src/hmls/tools/stripe.ts` (dead `create_quote` tool) deleted.

**Gateway Middleware** (`apps/gateway/src/middleware/`): Auth + admin middleware

- `auth.ts` - HMLS: requireAuth, optionalAuth
- `admin.ts` - Admin role check
- `fixo/` - Fixo-specific auth, credits, tier

**Agent Package** (`apps/agent/`): `@hmls/agent` with sub-path exports

- `@hmls/agent` → Agent factories, types, fixo lib, notifications, PDF components
- `@hmls/agent/db` → Drizzle DB client + schema

**HMLS Agent** (`apps/agent/src/hmls/`): Gemini 3 Flash Preview

- `agent.ts` - runHmlsAgent() — customer-facing (no stripe tools, scoped customer-order actions)
- `staff-agent.ts` - runStaffAgent() — admin-facing (includes adminOrderTools: create_order,
  find_customer, list_orders)
- `tools/` - scheduling, labor-lookup, parts-lookup, ask-user-question, admin-order-tools,
  customer-order-actions, customer-booking-actions, order-ops
- `skills/estimate/` - Pricing engine (OLP labor + parts + fees + discount), PDF template
- `common/tools/estimate.ts` - `create_estimate` tool — writes directly to `orders` table at
  status=`draft`
  - Customer agent: `customerId` resolved from auth context (ctx.customerId), not AI-supplied
  - Staff agent: AI passes `customerId` explicitly for walk-in order creation

### Agent flow (customer chat)

1. Customer enters `/chat` (login required)
2. AI collects vehicle, symptoms; calls `lookup_labor_time` + `create_estimate`
3. Estimate lands as `orders` row with status=`draft`, `pendingReview: true` returned in tool result
4. Customer sees EstimateCard with "Pending review" badge (not "Not saved")
5. Admin reviews in `/admin/orders?status=draft` and clicks "Send to customer" → status=`estimated`
6. Customer approves in `/portal/orders/:id` → status=`approved`
7. Admin assigns mechanic + confirms booking in order detail page → status=`scheduled`

### Agent flow (admin walk-in)

Admin opens `/admin/chat` → tells staff agent ("create order for John, 2020 Civic, oil change") →
staff agent calls `find_customer` / `create_order` / `create_estimate` with explicit customerId.

**Fixo Agent** (`apps/agent/src/fixo/`): Zypher + Gemini 2.5 Flash

- `agent.ts` - createFixoAgent() factory
- `tools/` - Vision analysis, audio spectrogram, OBD lookup, storage
- `lib/` - Stripe credits, Supabase storage, agent cache
- `pdf/fixo-report.tsx` - React-PDF fixo report

**Database Schema** (`apps/agent/src/db/schema.ts`): Drizzle ORM

- `orders` — **single source of truth** for the work lifecycle (status, items, contact snapshot,
  payment)
  - Payment columns: `paid_at`, `payment_method`, `payment_reference`, `capturedAmountCents`
  - Legacy FK columns still present but unwritten by new flows: `estimate_id`, `quote_id`,
    `booking_id`, `stripe_quote_id`, `stripe_invoice_id`, `stripe_payment_intent_id`,
    `preauth_amount_cents` (scheduled to drop in Layer 3)
- `order_events` — audit log (fromStatus, toStatus, actor, metadata)
- `customers`, `shops` (multi-tenant foundation, not yet enforced), `providers` (mechanics)
- `bookings` — still exists; will be absorbed into `orders` in Layer 3
- **Deprecated, don't write to**: `estimates`, `quotes` — still exist in schema and DB but no code
  path writes. Scheduled for drop in Layer 3.
- `pricingConfig` for dynamic pricing config
- `olpVehicles` / `olpLaborTimes` for OLP labor reference data
- `userProfiles` / `vehicles` / `fixoSessions` / `fixoMedia` / `obdCodes` / `fixoEstimates` for fixo

### Migrations

- `0001` - Orders lifecycle (initial orders table)
- `0002` - Order contact snapshot fields
- `0003` - Preauth fields (now deprecated by 0008)
- `0004` - Fixo estimates
- `0005` - Bookings status machine
- `0006` - RBAC auth hook
- `0007` - Fix `compute_blocked_range` trigger (was referencing non-existent `buffer_before_minutes`
  / `buffer_after_minutes` cols)
- `0008` - Simplify status machine: drop preauth/invoiced/paid/archived/void; add
  paid_at/payment_method/payment_reference

## Pre-Push CI

**Always run the full CI suite locally before pushing:**

```bash
cd apps/hmls-web && bun run lint        # Biome lint
cd apps/hmls-web && bun run typecheck   # TypeScript check
cd apps/hmls-web && bun run build       # Next.js build
deno task check                    # Deno check gateway + agent
```

Do not push if any of these fail.

## Code Style

- **Web**: Biome (double quotes, 2-space indent)
- **Deno apps**: `deno fmt` (double quotes, 2-space indent, 100 char line width) + `deno lint`
- **TypeScript**: Strict mode across all packages
- **Commits**: Conventional format - `feat(scope): description`

## Updating Dependencies

```bash
# Deno apps — update versions in deno.json, then:
deno install

# Web app
cd apps/hmls-web && bunx npm-check-updates -u && bun install
```

## Environment Variables

Required in `.env`:

```
DATABASE_URL=postgres://postgres.[ref]:[password]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
GOOGLE_API_KEY=...              # Google AI Studio key for Gemini 2.5 Flash
STRIPE_SECRET_KEY=sk_test_...
SUPABASE_URL=...                # Supabase project URL
SUPABASE_ANON_KEY=...           # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=...   # Supabase service role key (fixo media storage)
```

Optional in web (`.env.local`):

```
NEXT_PUBLIC_AGENT_URL=http://localhost:8080  # defaults to localhost:8080
```

## Deno Deploy CLI

Use `deno deploy` (NOT `deployctl` — deprecated):

```bash
# Environment variables
deno deploy env list --app hmls-api --org spinsirr
deno deploy env add <KEY> <VALUE> --app hmls-api --org spinsirr --secret
deno deploy env delete <KEY> --app hmls-api --org spinsirr
```

## Deployment & Domains

### Production URLs

| App               | Domain                               | Hosting                                                                  |
| ----------------- | ------------------------------------ | ------------------------------------------------------------------------ |
| Web (HMLS)        | `https://hmls.autos`                 | Deno Deploy                                                              |
| API (main + fixo) | `https://api.fixo.hmls.autos` (fixo) | Deno Deploy (`hmls-api`)                                                 |
| Fixo Web          | `https://fixo.hmls.autos`            | Vercel (`prj_EzagTZlxfjG6U6h3Cbdt8uWjPwdO`, scope: `spinsirrs-projects`) |

Both main API and Fixo API run in the same Deno Deploy app (`hmls-api`), routed by hostname.

### Cloudflare DNS (zone: `hmls.autos`)

| Type  | Name       | Target                 | Proxy                 |
| ----- | ---------- | ---------------------- | --------------------- |
| CNAME | `fixo`     | `cname.vercel-dns.com` | DNS only (gray cloud) |
| CNAME | `api.fixo` | `hmls-api.deno.dev`    | DNS only (gray cloud) |

### Supabase Auth (project: `ddkapmjkubklyzuciscd`)

**URL Configuration** (Dashboard > Authentication > URL Configuration):

- **Site URL**: `https://hmls.autos`
- **Redirect URLs**:
  - `https://hmls.autos`
  - `http://localhost:3000`
  - `https://fixo.hmls.autos/**`
  - `http://localhost:3001/**` (fixo local dev)

### Vercel Environment Variables (fixo-web)

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL --scope spinsirrs-projects
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY --scope spinsirrs-projects
vercel env add NEXT_PUBLIC_AGENT_URL --scope spinsirrs-projects  # https://api.fixo.hmls.autos
```

## Roadmap — Layer 3: collapse bookings into orders

Goal: one entity. Every work-lifecycle field lives on `orders`. `bookings`, `estimates`, `quotes`
tables get dropped.

### PR A — schema + double write

1. Add columns to `orders`: `scheduled_at`, `appointment_end`, `duration_minutes`, `provider_id` (FK
   → providers), `location`, `location_lat`, `location_lng`, `access_instructions`,
   `symptom_description`, `photo_urls`, `customer_notes`, `blocked_range` (tstzrange).
2. Migrate `compute_blocked_range` trigger from `bookings` to `orders`.
3. Backfill: for every `orders.booking_id`, copy booking fields onto the order.
4. Update `create_booking` tool (`apps/agent/src/hmls/tools/scheduling.ts`) to **also** write the
   new fields to the order row (dual-write, bookings row still created for compatibility).

### PR B — switch reads to orders

1. `get_availability` reads provider_id / blocked_range from `orders`, not `bookings`.
2. Admin order detail page (`/admin/orders/:id`) BookingPanel reads order.scheduled_at etc directly.
3. Admin-mechanics `POST /bookings/:id/reassign` → operates on orders.provider_id.
4. Portal `/me/bookings` endpoint → returns `orders` with `scheduled_at IS NOT NULL`.
5. Admin booking CRUD endpoints in `admin.ts` → delete or rewrite to orders.
6. `create_booking` tool stops writing to `bookings` (writes only to orders).

### PR C — drop legacy tables

1. Migration: drop `bookings`, `estimates`, `quotes` tables.
2. Drop columns: `orders.estimate_id`, `orders.quote_id`, `orders.booking_id`,
   `orders.stripe_quote_id`, `orders.stripe_invoice_id`, `orders.stripe_payment_intent_id`,
   `orders.preauth_amount_cents`.
3. Remove schema definitions for bookings/estimates/quotes from `schema.ts`.
4. Remove legacy type re-exports from `apps/hmls-web/lib/types.ts`.

## Recent session summary (2026-04-20)

- **Layer 1 done**: status machine simplified from 13→9 states. Migration `0008` remaps legacy data.
  New `paid_at` / `payment_method` / `payment_reference` columns added. `/capture`, `/preauth`,
  `/confirm-preauth` routes deleted.
- **Layer 2 done**: admin UI consolidated. Dashboard shows order-based stats. `/admin/schedule`
  deleted — Assign/Confirm/Reject actions migrated into order detail page BookingPanel.
  `/admin/estimates` and `/admin/quotes` admin routes deleted.
- **Agent UX hardened**: EstimateCard shows "Pending review" badge when order is draft.
  `create_estimate` pulls customerId from auth context for customer chat; staff agent still passes
  it explicitly for walk-ins. `get_availability` Postgres `ANY(ARRAY[...])` type cast bug fixed (use
  `inArray` helper). `compute_blocked_range` trigger fixed (no-buffer version). SlotPicker converted
  to date + time dropdowns, bookings created unassigned (admin dispatches).
- **Known deferred**: Layer 3 (collapse bookings into orders) — planned, not started. Multi-shop
  tenancy — `shops` table exists but no code path scopes by `shop_id` yet. BAR § 3353 compliance
  flow — design in the air, not implemented.
