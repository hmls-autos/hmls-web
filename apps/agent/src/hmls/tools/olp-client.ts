import { getLogger } from "@logtape/logtape";

const logger = getLogger(["hmls", "agent", "olp-client"]);

const OLP_WORKER_URL = Deno.env.get("OLP_WORKER_URL") ??
  "https://olp-worker.spencerzhyp.workers.dev";
const OLP_WORKER_SECRET = Deno.env.get("OLP_WORKER_SECRET") ?? "";

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (OLP_WORKER_SECRET) {
    headers["Authorization"] = `Bearer ${OLP_WORKER_SECRET}`;
  }
  return headers;
}

async function olpPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${OLP_WORKER_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "(no body)");
    throw new Error(`OLP Worker request failed: ${res.status} ${res.statusText} — ${text}`);
  }
  return res.json() as Promise<T>;
}

// --- Interfaces (same shapes as olp-sqlite.ts) ---

export interface OlpVehicle {
  id: number;
  make: string;
  model: string;
  year_range: string;
  engine: string;
  fuel_type: string | null;
}

export interface OlpLaborTime {
  name: string;
  category: string;
  labor_hours: number;
  vehicle_id: number;
}

export interface OlpCategory {
  category: string;
  count: number;
}

// --- Query functions ---

export async function findVehicles(
  make: string,
  model: string,
  year: number,
  fuzzy = false,
): Promise<OlpVehicle[]> {
  logger.debug("findVehicles", { make, model, year, fuzzy });
  const data = await olpPost<{ vehicles: OlpVehicle[] }>("/vehicles", {
    make,
    model,
    year,
    fuzzy,
  });
  return data.vehicles;
}

export async function searchLaborTimes(
  vehicleIds: number[],
  serviceWords: string[],
  category: string | undefined,
  matchAny = false,
): Promise<OlpLaborTime[]> {
  if (vehicleIds.length === 0 || serviceWords.length === 0) return [];
  logger.debug("searchLaborTimes", {
    vehicleIds: vehicleIds.length,
    serviceWords,
    category,
    matchAny,
  });
  const data = await olpPost<{ laborTimes: OlpLaborTime[] }>("/labor-times", {
    vehicleIds,
    serviceWords,
    category,
    matchAny,
  });
  return data.laborTimes;
}

export async function getCategoryBreakdown(
  vehicleIds: number[],
): Promise<OlpCategory[]> {
  if (vehicleIds.length === 0) return [];
  logger.debug("getCategoryBreakdown", { vehicleIds: vehicleIds.length });
  const data = await olpPost<{ categories: OlpCategory[] }>("/categories", {
    vehicleIds,
  });
  return data.categories;
}
