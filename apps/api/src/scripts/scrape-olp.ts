/**
 * OLP Labor Times Scraper
 *
 * Scrapes all labor time data from openlaborproject.com
 * and inserts into olp_vehicles + olp_labor_times tables.
 *
 * Run: deno task db:scrape-olp
 *
 * Resumable — skips vehicles already in DB. Safe to re-run.
 */

import postgres from "postgres";

const DATABASE_URL = Deno.env.get("DATABASE_URL");
if (!DATABASE_URL) throw new Error("DATABASE_URL required");

const sql = postgres(DATABASE_URL, {
  idle_timeout: 0,
  max_lifetime: null,
  connect_timeout: 30,
});

const BASE_URL = "https://openlaborproject.com";
const DELAY_MS = 300;
const MAX_RETRIES = 3;
const USER_AGENT = "HMLS-Scraper/1.0 (mobile mechanic labor time sync)";

// --- Types ---

interface Make {
  name: string;
  slug: string;
  modelCount: number;
}

interface Model {
  name: string;
  slug: string;
  vehicleCount: number;
}

interface VehicleConfig {
  yearRange: string;
  yearStart: number;
  yearEnd: number;
  engine: string;
  engineSlug: string;
  fuelType: string | null;
  timingType: string | null;
}

interface Job {
  name: string;
  slug: string;
  category: string;
  laborHours: number;
}

// --- Utilities ---

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.text();
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const backoff = DELAY_MS * Math.pow(2, attempt);
      console.warn(`  Retry ${attempt}/${MAX_RETRIES} for ${url} (${backoff}ms)`);
      await delay(backoff);
    }
  }
  throw new Error("unreachable");
}

/**
 * Extract embedded page props JSON from Next.js HTML.
 * Tries __NEXT_DATA__ script tag first, then falls back to
 * scanning for a props JSON blob in the HTML body.
 */
// deno-lint-ignore no-explicit-any
function extractPageProps(html: string): any {
  // Method 1: __NEXT_DATA__ script tag
  const ndMarker = '<script id="__NEXT_DATA__" type="application/json">';
  const ndStart = html.indexOf(ndMarker);
  if (ndStart !== -1) {
    const jsonStart = ndStart + ndMarker.length;
    const jsonEnd = html.indexOf("</script>", jsonStart);
    if (jsonEnd !== -1) {
      try {
        const data = JSON.parse(html.slice(jsonStart, jsonEnd));
        return data?.props?.pageProps ?? null;
      } catch { /* fall through */ }
    }
  }

  // Method 2: Find the largest JSON blob containing "pageProps"
  // Some Next.js versions embed data differently
  const ppIdx = html.indexOf('"pageProps"');
  if (ppIdx === -1) return null;

  // Walk backwards to find opening brace
  let depth = 0;
  let start = -1;
  for (let i = ppIdx; i >= 0; i--) {
    if (html[i] === "}") depth++;
    if (html[i] === "{") {
      depth--;
      if (depth < 0) { start = i; break; }
    }
  }
  if (start === -1) return null;

  // Walk forward to find matching closing brace
  depth = 0;
  for (let i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          const data = JSON.parse(html.slice(start, i + 1));
          return data?.pageProps ?? data;
        } catch { return null; }
      }
    }
  }
  return null;
}

// --- Crawl functions ---

async function fetchMakes(): Promise<Make[]> {
  console.log("Fetching makes...");
  const html = await fetchPage(`${BASE_URL}/labor-times`);
  const props = extractPageProps(html);
  const makes: Make[] = props?.makes ?? props?.data?.makes ?? [];
  if (makes.length === 0) throw new Error("No makes found");
  console.log(`  Found ${makes.length} makes\n`);
  return makes;
}

async function fetchModels(makeSlug: string): Promise<Model[]> {
  const html = await fetchPage(`${BASE_URL}/labor-times/${makeSlug}`);
  const props = extractPageProps(html);
  // Models are nested under pageProps.make.models
  return props?.make?.models ?? props?.models ?? props?.data?.models ?? [];
}

async function fetchVehicleConfigs(makeSlug: string, modelSlug: string): Promise<VehicleConfig[]> {
  const html = await fetchPage(`${BASE_URL}/labor-times/${makeSlug}/${modelSlug}`);
  const props = extractPageProps(html);
  if (!props) return [];
  const vehicles = props?.vehicles ?? props?.data?.vehicles ?? [];

  // deno-lint-ignore no-explicit-any
  return vehicles.map((v: any) => {
    const yr = v.yearRange ?? v.year_range ?? "";
    const parts = yr.split("-");
    return {
      yearRange: yr,
      yearStart: parseInt(parts[0]) || 0,
      yearEnd: parseInt(parts[1] ?? parts[0]) || 0,
      engine: v.engine ?? v.engineName ?? "",
      engineSlug: v.engineSlug ?? v.engine_slug ?? "",
      fuelType: v.fuelType ?? v.fuel_type ?? null,
      timingType: v.timingType ?? v.timing_type ?? null,
    };
  });
}

async function fetchJobs(
  makeSlug: string,
  modelSlug: string,
  yearRange: string,
  engineSlug: string,
): Promise<Job[]> {
  const url = `${BASE_URL}/labor-times/${makeSlug}/${modelSlug}/${yearRange}/${engineSlug}`;
  const html = await fetchPage(url);
  const props = extractPageProps(html);
  const jobsByCategory = props?.jobsByCategory ?? props?.data?.jobsByCategory ?? {};

  const jobs: Job[] = [];
  for (const [category, categoryJobs] of Object.entries(jobsByCategory)) {
    // deno-lint-ignore no-explicit-any
    for (const job of categoryJobs as any[]) {
      jobs.push({
        name: job.name ?? "",
        slug: job.slug ?? "",
        category: job.category ?? category,
        laborHours: parseFloat(job.laborHours ?? job.labor_hours ?? "0"),
      });
    }
  }
  return jobs;
}

// --- DB functions ---

async function vehicleExists(
  makeSlug: string,
  modelSlug: string,
  yearRange: string,
  engineSlug: string,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM olp_vehicles
    WHERE make_slug = ${makeSlug}
      AND model_slug = ${modelSlug}
      AND year_range = ${yearRange}
      AND engine_slug = ${engineSlug}
    LIMIT 1
  `;
  return rows.length > 0;
}

async function insertVehicle(
  make: string,
  makeSlug: string,
  model: string,
  modelSlug: string,
  config: VehicleConfig,
): Promise<number> {
  const [row] = await sql`
    INSERT INTO olp_vehicles
      (make, make_slug, model, model_slug, year_range, year_start, year_end, engine, engine_slug, fuel_type, timing_type)
    VALUES
      (${make}, ${makeSlug}, ${model}, ${modelSlug}, ${config.yearRange}, ${config.yearStart}, ${config.yearEnd}, ${config.engine}, ${config.engineSlug}, ${config.fuelType}, ${config.timingType})
    ON CONFLICT (make_slug, model_slug, year_range, engine_slug) DO UPDATE SET make = EXCLUDED.make
    RETURNING id
  `;
  return row.id;
}

async function insertJobs(vehicleId: number, jobs: Job[]): Promise<void> {
  // Batch insert using postgres.js multi-row VALUES
  const BATCH = 100;
  for (let i = 0; i < jobs.length; i += BATCH) {
    const batch = jobs.slice(i, i + BATCH);
    const rows = batch.map((j) => ({
      vehicle_id: vehicleId,
      name: j.name,
      slug: j.slug,
      category: j.category,
      labor_hours: j.laborHours,
    }));
    await sql`
      INSERT INTO olp_labor_times ${sql(rows, "vehicle_id", "name", "slug", "category", "labor_hours")}
      ON CONFLICT (vehicle_id, slug) DO NOTHING
    `;
  }
}

// --- Main ---

async function main() {
  console.log("=== OLP Labor Times Scraper ===\n");

  const makes = await fetchMakes();
  await delay(DELAY_MS);

  let totalVehicles = 0;
  let totalJobs = 0;
  let skipped = 0;
  let errors = 0;

  for (const make of makes) {
    console.log(`[${make.name}] Fetching ${make.modelCount} models...`);

    let models: Model[];
    try {
      models = await fetchModels(make.slug);
      await delay(DELAY_MS);
    } catch (err) {
      console.error(`  [ERR] Failed to fetch models for ${make.name}: ${err}`);
      errors++;
      continue;
    }

    for (const model of models) {
      let configs: VehicleConfig[];
      try {
        configs = await fetchVehicleConfigs(make.slug, model.slug);
        await delay(DELAY_MS);
      } catch (err) {
        console.error(`  [ERR] Failed to fetch configs for ${make.name} ${model.name}: ${err}`);
        errors++;
        continue;
      }

      for (const config of configs) {
        // Resumability check
        const exists = await vehicleExists(make.slug, model.slug, config.yearRange, config.engineSlug);
        if (exists) {
          skipped++;
          continue;
        }

        let jobs: Job[];
        try {
          jobs = await fetchJobs(make.slug, model.slug, config.yearRange, config.engineSlug);
          await delay(DELAY_MS);
        } catch (err) {
          console.error(
            `  [ERR] Failed to fetch jobs for ${make.name} ${model.name} ${config.yearRange} ${config.engine}: ${err}`,
          );
          errors++;
          continue;
        }

        if (jobs.length === 0) {
          console.warn(
            `  [WARN] No jobs for ${make.name} ${model.name} ${config.yearRange} ${config.engine}`,
          );
          continue;
        }

        try {
          const vehicleId = await insertVehicle(make.name, make.slug, model.name, model.slug, config);
          await insertJobs(vehicleId, jobs);
        } catch (err) {
          console.error(
            `  [ERR] DB insert failed for ${make.name} ${model.name} ${config.yearRange} ${config.engine}: ${err}`,
          );
          errors++;
          continue;
        }

        totalVehicles++;
        totalJobs += jobs.length;
        console.log(
          `  [${totalVehicles}] ${make.name} ${model.name} ${config.yearRange} ${config.engine} — ${jobs.length} jobs`,
        );
      }
    }
  }

  console.log(`\n=== Done ===`);
  console.log(`Vehicles: ${totalVehicles} new, ${skipped} skipped`);
  console.log(`Jobs: ${totalJobs} inserted`);
  console.log(`Errors: ${errors}`);

  await sql.end();
  Deno.exit(0);
}

main().catch(async (err) => {
  console.error("Scraper failed:", err);
  await sql.end();
  Deno.exit(1);
});
