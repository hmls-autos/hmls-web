# Development
dev:
    #!/usr/bin/env bash
    supabase functions serve &
    cd hmls-web && bun dev

dev-api:
    supabase functions serve

dev-web:
    cd hmls-web && bun dev

# Supabase
start:
    supabase start

stop:
    supabase stop

status:
    supabase status

# Database
db-migrate:
    supabase db push

db-reset:
    supabase db reset

# Code quality
fmt:
    deno fmt supabase/functions
    cd hmls-web && bun run format

lint:
    deno lint supabase/functions
    cd hmls-web && bun run lint

# Build
build:
    cd hmls-web && bun run build

# Deploy
deploy-api:
    supabase functions deploy api

deploy-web:
    cd hmls-web && bun run build
