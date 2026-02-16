# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Build & Development Commands

```bash
# Dev servers
cd apps/web && bun run dev       # Next.js on port 3000
deno task dev:api                # API agent on port 8080
deno task dev:diagnostic         # Diagnostic agent

# Build & quality
cd apps/web && bun run build     # Build Next.js
cd apps/web && bun run lint      # Lint with Biome
cd apps/web && bun run typecheck # TypeScript type checking
deno task check                  # Deno check both apps
deno task lint                   # Deno lint (excludes web)
deno task fmt:check              # Deno format check (excludes web)

# Database (Supabase PostgreSQL — no local DB needed)
deno task --cwd apps/api db:seed      # Seed data
```

## Setup

```bash
cd apps/web && bun install       # Install web dependencies
git config core.hooksPath .githooks  # Enable pre-commit hook
# Set DATABASE_URL in .env.local to your Supabase connection string
```

## Architecture

Deno workspace monorepo for a mobile mechanic business with an AI-powered chat agent. All apps
deploy to **Deno Deploy** (console.deno.com) via GitHub integration. Root config is `deno.json`; web
app uses Bun/Next.js internally. Root `deno.json` `imports` are inherited by all workspace members —
shared deps go there, app-specific deps in each app's `deno.json`.

```
apps/
├── web/                # Next.js 16 frontend (React 19, Tailwind CSS 4) → Deno Deploy
├── api/                # Deno AI agent (Zypher framework, Claude Sonnet 4, AG-UI protocol) → Deno Deploy
└── diagnostic-agent/   # Deno diagnostic agent → Deno Deploy
packages/
└── shared/             # @hmls/shared — shared utilities (errors, toolResult, db client)
```

### Service Communication

- **Web → Agent**: Direct AG-UI protocol connection via `@ag-ui/client` (port 8080)
- **Agent → DB**: Direct Supabase PostgreSQL connection via Drizzle ORM

### Key Patterns

**Shared Package** (`packages/shared/`): `@hmls/shared` with sub-path exports

- `@hmls/shared/errors` - AppError class, ErrorCode enum, Errors factories
- `@hmls/shared/tool-result` - MCP-compliant tool result helper
- `@hmls/shared/db` - Schema-agnostic `createDbClient(schema)` factory

**API Routes** (`apps/api/src/routes/`): Hono sub-routers mounted by `index.ts`

- `estimates.ts` - GET estimate, GET estimate PDF
- `customers.ts` - GET customer
- `chat.ts` - AG-UI streaming endpoint + agent cache

**Agent Tools** (`apps/api/src/tools/`): Zod-validated functions the AI can call

- `customer.ts` - Customer CRUD
- `stripe.ts` - Payments/invoices
- `calcom.ts` - Scheduling

**Agent Skills** (`apps/api/src/skills/`): Multi-tool workflows

- `estimate` - Calculate prices, generate PDFs

**Diagnostic Routes** (`apps/diagnostic-agent/src/routes/`): Hono sub-routers mounted by `main.ts`

- `sessions.ts` - CRUD for diagnostic sessions
- `input.ts` - Process diagnostic input (text, OBD, media)
- `chat.ts` - AG-UI streaming endpoint

**Database Schema** (`apps/api/src/db/schema.ts`): Drizzle ORM

- customers, conversations, messages, bookings, services, quotes, estimates
- `pricingConfig` / `vehiclePricing` tables for dynamic pricing

**Seed Data** (`apps/api/src/db/seed-data/`): JSON files imported by `seed.ts`

- `services.json`, `pricing-config.json`, `vehicle-pricing.json`

**PDF Generation** (`apps/api/src/pdf/`): React-PDF templates served by API routes

## Pre-Push CI

**Always run the full CI suite locally before pushing:**

```bash
cd apps/web && bun run lint        # Biome lint
cd apps/web && bun run typecheck   # TypeScript check
cd apps/web && bun run build       # Next.js build
deno task check:api                # Deno check API
deno task check:diagnostic         # Deno check diagnostic agent
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
cd apps/web && bunx npm-check-updates -u && bun install
```

## Environment Variables

Required in `.env`:

```
DATABASE_URL=postgres://postgres.[ref]:[password]@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
CALCOM_API_KEY=cal_live_...
CALCOM_EVENT_TYPE_ID=123456
```

Optional in web (`.env.local`):

```
NEXT_PUBLIC_AGENT_URL=http://localhost:8080  # defaults to localhost:8080
```
