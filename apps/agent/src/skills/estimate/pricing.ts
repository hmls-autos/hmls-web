// apps/agent/src/skills/estimate/pricing.ts

import { db, schema } from "../../db/client.ts";
import { eq, and, isNull } from "drizzle-orm";
import type { PricingConfig, ServiceInput, LineItem } from "./types.ts";

let cachedConfig: PricingConfig | null = null;

export async function getPricingConfig(): Promise<PricingConfig> {
  if (cachedConfig) return cachedConfig;

  const rows = await db.select().from(schema.pricingConfig);
  const configMap = new Map(rows.map((r) => [r.key, r.value]));

  cachedConfig = {
    hourlyRate: configMap.get("hourly_rate") ?? 14000,
    diagnosticFee: configMap.get("diagnostic_fee") ?? 9500,
    afterHoursFee: configMap.get("after_hours_fee") ?? 5000,
    rushFee: configMap.get("rush_fee") ?? 7500,
    partsMarkupTier1: configMap.get("parts_markup_tier1_pct") ?? 40,
    partsMarkupTier2: configMap.get("parts_markup_tier2_pct") ?? 30,
    partsMarkupTier3: configMap.get("parts_markup_tier3_pct") ?? 20,
  };

  return cachedConfig;
}

export function clearConfigCache(): void {
  cachedConfig = null;
}
