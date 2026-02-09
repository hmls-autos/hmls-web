# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Web (Next.js on port 3000)
turbo dev                        # Start all turbo tasks
bun run dev:web                  # Start web only

# Deno services
bun run dev:api                  # Start API agent (Deno on port 8080)
bun run dev:diagnostic           # Start diagnostic agent

# Build & quality
turbo build              # Build all packages
turbo lint               # Lint with Biome
turbo typecheck          # TypeScript type checking

# Database
docker compose up -d postgres   # Start PostgreSQL
```

## Architecture

Bun + Turbo monorepo for a mobile mechanic business with an AI-powered chat agent. All apps deploy to **Deno Deploy** via GitHub integration. Deno workspace is managed via `deno.jsonc`.

```
apps/
├── web/                # Next.js 16 frontend (React 19, Tailwind CSS 4) → Deno Deploy
├── api/                # Deno AI agent (Zypher framework, Claude Sonnet 4, AG-UI protocol) → Deno Deploy
└── diagnostic-agent/   # Deno diagnostic agent → Deno Deploy

packages/
├── shared/  # Shared types and utilities
└── proto/   # Protocol definitions
```

### Service Communication

- **Web → Agent**: Direct AG-UI protocol connection via `@ag-ui/client` (port 8080)
- **Agent → DB**: Direct PostgreSQL connection for tools

### Key Patterns

**Agent Tools** (`apps/agent/src/tools/`): Zod-validated functions the AI can call
- `customerTools` - Customer CRUD
- `stripeTools` - Payments/invoices
- `calcomTools` - Scheduling
- `estimateTools` - Estimate generation

**Agent Skills** (`apps/agent/src/skills/`): Multi-tool workflows
- `estimate` - Calculate prices, generate PDFs

**Database Schema** (`apps/api/src/db/schema.ts`): Drizzle ORM
- customers, conversations, messages, bookings, services, quotes, estimates
- `pricingConfig` / `vehiclePricing` tables for dynamic pricing

**PDF Generation** (`apps/api/src/pdf/`): React-PDF templates served by API routes

## Code Style

- **Formatter/Linter**: Biome (double quotes, 2-space indent)
- **TypeScript**: Strict mode across all packages
- **Commits**: Conventional format - `feat(scope): description`

## Environment Variables

Required in `.env`:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
ANTHROPIC_API_KEY=sk-ant-...
STRIPE_SECRET_KEY=sk_test_...
CALCOM_API_KEY=cal_live_...
CALCOM_EVENT_TYPE_ID=123456
```

Optional in web (`.env.local`):
```
NEXT_PUBLIC_AGENT_URL=http://localhost:8080  # defaults to localhost:8080
```
