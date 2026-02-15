# Code Simplification Design

**Date:** 2026-02-15
**Status:** Draft
**Approach:** Three targeted cleanups

## Overview

Three focused simplifications to reduce duplication and improve maintainability without over-engineering.

## 1. Extract shared `toolDisplayNames` constant

**Problem:** `apps/web/app/chat/page.tsx` (lines 43-54) and `apps/web/components/ChatWidget.tsx` (lines 41-52) define identical `toolDisplayNames` mappings (10 entries each).

**Solution:** Extract to `apps/web/lib/agent-tools.ts` and import in both files.

**Files changed:**
- Create `apps/web/lib/agent-tools.ts` (new, ~12 lines)
- Edit `apps/web/app/chat/page.tsx` (remove inline map, add import)
- Edit `apps/web/components/ChatWidget.tsx` (remove inline map, add import)

## 2. Consolidate shared Deno imports to root workspace

**Problem:** 8 dependencies duplicated across `apps/api/deno.json` and `apps/diagnostic-agent/deno.json`:
- `@corespeed/zypher`, `@zypher/agui`, `hono`, `zod`, `stripe`, `rxjs`, `rxjs-for-await`, `drizzle-orm`, `drizzle-orm/postgres-js`, `postgres`

Version drift risk if updated independently.

**Solution:** Move shared imports to root `deno.json` imports map. Keep app-specific imports in their respective configs. Deno workspace resolution will cascade root imports to member packages.

**Shared imports (move to root):**
- `@corespeed/zypher`: `jsr:@zypher/agent@0.9.1`
- `@zypher/agui`: `jsr:@zypher/agui@0.3.0`
- `hono`: `npm:hono@^4.7.10`
- `zod`: `npm:zod@^4.3.5`
- `stripe`: `npm:stripe@^20.2.0`
- `rxjs`: `npm:rxjs@^7.8.2`
- `rxjs-for-await`: `npm:rxjs-for-await@1.0.0`
- `drizzle-orm`: `npm:drizzle-orm@^0.45.1`
- `drizzle-orm/postgres-js`: `npm:drizzle-orm@^0.45.1/postgres-js`
- `postgres`: `npm:postgres@^3.4.8`

**App-specific imports (stay):**
- API only: `@anthropic-ai/sdk`, `@react-pdf/renderer`, `react`, `nanoid`
- Diagnostic only: `@supabase/supabase-js`, `@aws-sdk/client-s3`, `openai`, `@std/assert`

**Files changed:**
- Edit `deno.json` (add imports section)
- Edit `apps/api/deno.json` (remove shared imports, keep app-specific)
- Edit `apps/diagnostic-agent/deno.json` (remove shared imports, keep app-specific)

## 3. Extract seed data to JSON files

**Problem:** `apps/api/src/db/seed.ts` is 5,796 lines. ~95% is pure data arrays:
- `servicesRaw` (~3,069 lines) - 693 service definitions
- `pricingConfig` (~152 lines) - 45 pricing rules
- `vehiclePricing` (~2,533 lines) - 568 vehicle multipliers

The actual logic (duration parsing, DB inserts) is ~40 lines buried at the top and bottom.

**Solution:** Extract data arrays to JSON files in `apps/api/src/db/seed-data/`, keep logic in `seed.ts`.

**Files changed:**
- Create `apps/api/src/db/seed-data/services.json`
- Create `apps/api/src/db/seed-data/pricing-config.json`
- Create `apps/api/src/db/seed-data/vehicle-pricing.json`
- Edit `apps/api/src/db/seed.ts` (replace inline arrays with JSON imports, ~50 lines total)

## Verification

After all changes:
1. `deno task check:api` - API type-checks
2. `deno task check:diagnostic` - Diagnostic agent type-checks
3. `deno task typecheck:web` - Web app type-checks
4. `deno task lint:web` - Biome lint passes
5. `deno task build:web` - Next.js builds successfully

## Risk Assessment

**Risk Level:** Low
- All changes are local refactors (no behavior changes)
- Easy rollback via git
- Each change is independent and can be reverted separately
