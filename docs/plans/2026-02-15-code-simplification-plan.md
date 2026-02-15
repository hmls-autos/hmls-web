# Code Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce duplication across the monorepo with three targeted refactors.

**Architecture:** Extract shared constants, consolidate Deno workspace imports, and split a massive seed file into data + logic.

**Tech Stack:** TypeScript, Deno workspace imports, Next.js, JSON

---

### Task 1: Extract `toolDisplayNames` to shared constant

**Files:**
- Create: `apps/web/lib/agent-tools.ts`
- Modify: `apps/web/app/chat/page.tsx:43-54`
- Modify: `apps/web/components/ChatWidget.tsx:41-52`

**Step 1: Create the shared constant file**

Create `apps/web/lib/agent-tools.ts`:

```typescript
export const toolDisplayNames: Record<string, string> = {
  get_availability: "Checking availability",
  create_booking: "Creating booking",
  get_customer: "Looking up customer",
  create_customer: "Saving customer info",
  get_services: "Getting services",
  create_estimate: "Preparing estimate",
  get_estimate: "Loading estimate",
  create_quote: "Creating quote",
  create_invoice: "Creating invoice",
  get_quote_status: "Checking quote status",
};
```

**Step 2: Update `apps/web/app/chat/page.tsx`**

Add import at top (after other imports):
```typescript
import { toolDisplayNames } from "@/lib/agent-tools";
```

Remove lines 43-54 (the inline `toolDisplayNames` declaration inside the component).

**Step 3: Update `apps/web/components/ChatWidget.tsx`**

Add import at top (after other imports):
```typescript
import { toolDisplayNames } from "@/lib/agent-tools";
```

Remove lines 41-52 (the inline `toolDisplayNames` declaration inside the component).

**Step 4: Verify web app**

Run: `deno task typecheck:web`
Expected: No type errors

Run: `deno task lint:web`
Expected: No lint errors

**Step 5: Commit**

```bash
git add apps/web/lib/agent-tools.ts apps/web/app/chat/page.tsx apps/web/components/ChatWidget.tsx
git commit -m "refactor(web): extract toolDisplayNames to shared constant"
```

---

### Task 2: Consolidate shared Deno imports to root workspace

**Files:**
- Modify: `deno.json` (add imports section)
- Modify: `apps/api/deno.json` (remove 10 shared imports, keep 4 app-specific)
- Modify: `apps/diagnostic-agent/deno.json` (remove 10 shared imports, keep 4 app-specific)

**Step 1: Add shared imports to root `deno.json`**

Add `imports` section to root `deno.json`:

```json
{
  "workspace": ["./apps/api", "./apps/diagnostic-agent"],
  "imports": {
    "@corespeed/zypher": "jsr:@zypher/agent@0.9.1",
    "@zypher/agui": "jsr:@zypher/agui@0.3.0",
    "hono": "npm:hono@^4.7.10",
    "zod": "npm:zod@^4.3.5",
    "stripe": "npm:stripe@^20.2.0",
    "rxjs": "npm:rxjs@^7.8.2",
    "rxjs-for-await": "npm:rxjs-for-await@1.0.0",
    "drizzle-orm": "npm:drizzle-orm@^0.45.1",
    "drizzle-orm/postgres-js": "npm:drizzle-orm@^0.45.1/postgres-js",
    "postgres": "npm:postgres@^3.4.8"
  },
  "tasks": {
    "dev:api": "deno task --cwd apps/api dev",
    "dev:diagnostic": "deno task --cwd apps/diagnostic-agent dev",
    "check:api": "deno check apps/api/src/index.ts",
    "check:diagnostic": "deno check apps/diagnostic-agent/src/main.ts",
    "db:up": "docker compose up -d postgres"
  }
}
```

**Step 2: Trim `apps/api/deno.json` to app-specific imports only**

Keep only these 4 imports that are unique to the API:

```json
{
  "name": "@hmls/api",
  "version": "0.3.0",
  "exports": "./src/index.ts",
  "imports": {
    "@anthropic-ai/sdk": "npm:@anthropic-ai/sdk@0.71.2",
    "@react-pdf/renderer": "npm:@react-pdf/renderer@^4.3.2",
    "react": "npm:react@^19.2.3",
    "nanoid": "npm:nanoid@^5.1.5"
  },
  "deploy": {
    "runtime": {
      "entrypoint": "./src/index.ts"
    }
  },
  "tasks": {
    "dev": "deno run --env=../../.env --allow-net --allow-env --allow-read --allow-write --allow-run --allow-sys --watch src/index.ts",
    "start": "deno run --env=../../.env --allow-net --allow-env --allow-read --allow-write --allow-run --allow-sys src/index.ts",
    "db:migrate": "deno run --env=../../.env --allow-net --allow-env --allow-read src/db/migrate.ts",
    "db:seed": "deno run --env=../../.env --allow-net --allow-env --allow-read src/db/seed.ts",
    "db:reset": "deno task db:migrate && deno task db:seed"
  }
}
```

**Step 3: Trim `apps/diagnostic-agent/deno.json` to app-specific imports only**

Keep only these 4 imports that are unique to the diagnostic agent:

```json
{
  "name": "@hmls/diagnostic-agent",
  "version": "0.1.0",
  "exports": "./src/main.ts",
  "deploy": {
    "runtime": {
      "entrypoint": "./src/main.ts"
    }
  },
  "tasks": {
    "dev": "deno run --env=../../.env --allow-all --watch src/main.ts",
    "start": "deno run --env=../../.env --allow-all src/main.ts",
    "check": "deno check src/main.ts",
    "test": "deno test --allow-all src/test/"
  },
  "imports": {
    "@supabase/supabase-js": "npm:@supabase/supabase-js@^2.49.0",
    "@aws-sdk/client-s3": "npm:@aws-sdk/client-s3@^3.700.0",
    "openai": "npm:openai@^4.80.0",
    "@std/assert": "jsr:@std/assert@^1.0.0"
  }
}
```

**Step 4: Verify both apps resolve imports correctly**

Run: `deno task check:api`
Expected: No errors

Run: `deno task check:diagnostic`
Expected: No errors

**Step 5: Commit**

```bash
git add deno.json apps/api/deno.json apps/diagnostic-agent/deno.json
git commit -m "refactor: consolidate shared Deno imports to root workspace"
```

---

### Task 3: Extract seed data to JSON files

**Files:**
- Create: `apps/api/src/db/seed-data/services.json`
- Create: `apps/api/src/db/seed-data/pricing-config.json`
- Create: `apps/api/src/db/seed-data/vehicle-pricing.json`
- Modify: `apps/api/src/db/seed.ts` (replace inline arrays with JSON imports)

**Step 1: Extract `servicesRaw` array to `seed-data/services.json`**

Copy lines 36-3105 of `seed.ts` (the `servicesRaw` array contents) to a new JSON file. The array contains objects with `name`, `description`, `minPrice`, `maxPrice`, `duration`, `category` fields.

Save as `apps/api/src/db/seed-data/services.json`.

**Step 2: Extract `pricingConfig` array to `seed-data/pricing-config.json`**

Copy lines 3108-3260 of `seed.ts` (the `pricingConfig` array contents) to a new JSON file. Objects have `key`, `value`, `description` fields.

Save as `apps/api/src/db/seed-data/pricing-config.json`.

**Step 3: Extract `vehiclePricing` array to `seed-data/vehicle-pricing.json`**

Copy lines 3263-5796 of `seed.ts` (the `vehiclePricing` array contents) to a new JSON file. Objects have `make`, `model`, `multiplier`, `notes` fields.

Save as `apps/api/src/db/seed-data/vehicle-pricing.json`.

**Step 4: Rewrite `seed.ts` to import from JSON**

Replace the entire `seed.ts` with:

```typescript
// Seed script for HMLS Mobile Mechanic database
// Run: deno run --allow-all --env=../../.env src/db/seed.ts

import { db, schema } from "./client.ts";
import servicesRaw from "./seed-data/services.json" with { type: "json" };
import pricingConfig from "./seed-data/pricing-config.json" with { type: "json" };
import vehiclePricing from "./seed-data/vehicle-pricing.json" with { type: "json" };

// Convert duration string to labor hours
function durationToLaborHours(duration: string): string {
  if (duration.toLowerCase().includes("included")) {
    return "0.00";
  }

  const minuteMatch = duration.match(/^(\d+)(?:-(\d+))?\s*minutes?$/i);
  if (minuteMatch) {
    const min = parseInt(minuteMatch[1]);
    const max = minuteMatch[2] ? parseInt(minuteMatch[2]) : min;
    return ((min + max) / 2 / 60).toFixed(2);
  }

  const hourMatch = duration.match(
    /^(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?\s*hours?$/i,
  );
  if (hourMatch) {
    const min = parseFloat(hourMatch[1]);
    const max = hourMatch[2] ? parseFloat(hourMatch[2]) : min;
    return ((min + max) / 2).toFixed(2);
  }

  console.warn(`Could not parse duration: "${duration}", defaulting to 1 hour`);
  return "1.00";
}

// Transform raw services to use laborHours instead of duration
const services = servicesRaw.map((s) => ({
  name: s.name,
  description: s.description,
  laborHours: durationToLaborHours(s.duration),
  category: s.category,
}));

// Helper to batch insert large arrays
async function batchInsert<T extends Record<string, unknown>>(
  table: Parameters<typeof db.insert>[0],
  data: T[],
  batchSize = 100,
) {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await db.insert(table).values(batch as typeof table.$inferInsert[]);
  }
}

async function seed() {
  console.log("Seeding database...\n");

  // Clear existing data
  console.log("Clearing existing data...");
  await db.delete(schema.vehiclePricing);
  await db.delete(schema.pricingConfig);
  await db.delete(schema.services);

  // Seed services
  console.log(`Inserting ${services.length} services...`);
  await batchInsert(schema.services, services, 50);

  // Seed pricing config
  console.log(`Inserting ${pricingConfig.length} pricing config entries...`);
  await db.insert(schema.pricingConfig).values(pricingConfig);

  // Seed vehicle pricing
  console.log(`Inserting ${vehiclePricing.length} vehicle pricing entries...`);
  await batchInsert(schema.vehiclePricing, vehiclePricing, 50);

  console.log("\nSeed completed successfully!");

  // Summary
  const serviceCount = await db.select().from(schema.services);
  const configCount = await db.select().from(schema.pricingConfig);
  const vehicleCount = await db.select().from(schema.vehiclePricing);

  console.log(`\nSummary:`);
  console.log(`  - Services: ${serviceCount.length}`);
  console.log(`  - Pricing config: ${configCount.length}`);
  console.log(`  - Vehicle pricing: ${vehicleCount.length}`);

  Deno.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  Deno.exit(1);
});
```

**Step 5: Verify API still type-checks**

Run: `deno task check:api`
Expected: No errors

**Step 6: Commit**

```bash
git add apps/api/src/db/seed-data/ apps/api/src/db/seed.ts
git commit -m "refactor(api): extract seed data to JSON files"
```

---

### Task 4: Final verification

**Step 1: Run all checks**

Run: `deno task check:api`
Run: `deno task check:diagnostic`
Run: `deno task typecheck:web`
Run: `deno task lint:web`

All should pass with no errors.

**Step 2: Verify build**

Run: `deno task build:web`
Expected: Successful build
