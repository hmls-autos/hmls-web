# Development Setup

This guide will help you set up the HMLS project for local development.

## Prerequisites

- [Bun](https://bun.sh/) v1.3.5 or later
- [Docker](https://www.docker.com/) and Docker Compose
- [Deno](https://deno.com/) v2.x (for agent service)
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/hmls-autos/hmls-web.git
cd hmls-web
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hmls

# API Keys
ANTHROPIC_API_KEY=your_anthropic_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Services
AGENT_URL=http://localhost:8001
```

### 4. Start the Database

```bash
docker compose up -d postgres
```

### 5. Run Database Migrations

```bash
bun run db:push
```

### 6. Start Development Servers

Start all services:

```bash
bun run dev
```

Or start individual services:

```bash
# Web app only
bun run dev:web

# API only
bun run dev:api

# Agent (in apps/agent directory)
cd apps/agent && deno task dev
```

## Project Structure

```
hmls/
├── apps/
│   ├── web/          # Next.js frontend
│   ├── api/          # Bun/Hono API server
│   └── agent/        # Deno AI agent service
├── packages/
│   ├── shared/       # Shared utilities and types
│   └── proto/        # Protocol definitions
├── scripts/          # Build and utility scripts
└── docker-compose.yml
```

## Available Scripts

| Command                 | Description                            |
| ----------------------- | -------------------------------------- |
| `bun run dev`           | Start all services in development mode |
| `bun run dev:web`       | Start web app only                     |
| `bun run dev:api`       | Start API server only                  |
| `bun run build`         | Build all packages                     |
| `bun run lint`          | Run linter                             |
| `bun run typecheck`     | Run type checking                      |
| `bun run db:push`       | Push database schema changes           |
| `bun run db:studio`     | Open database studio                   |
| `bun run version:sync`  | Sync versions across packages          |
| `bun run version:check` | Check version sync (CI)                |

## Ports

| Service    | Port |
| ---------- | ---- |
| Web App    | 3000 |
| API        | 8080 |
| Agent      | 8001 |
| PostgreSQL | 5432 |

## Troubleshooting

### Module not found errors

Try clearing caches and reinstalling:

```bash
rm -rf node_modules apps/*/node_modules packages/*/.node_modules
rm -rf apps/web/.next
bun install --force
```

### Database connection issues

Ensure PostgreSQL is running:

```bash
docker compose ps
docker compose logs postgres
```

### Type errors

Run type check to see all errors:

```bash
bun run typecheck
```
