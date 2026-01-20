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

export async function getVehicleMultiplier(
  make: string,
  model?: string | null
): Promise<number> {
  // Try exact make + model match first
  if (model) {
    const exact = await db
      .select()
      .from(schema.vehiclePricing)
      .where(
        and(
          eq(schema.vehiclePricing.make, make),
          eq(schema.vehiclePricing.model, model)
        )
      )
      .limit(1);

    if (exact.length > 0) {
      return Number(exact[0].multiplier);
    }
  }

  // Fall back to make-level default
  const makeDefault = await db
    .select()
    .from(schema.vehiclePricing)
    .where(
      and(
        eq(schema.vehiclePricing.make, make),
        isNull(schema.vehiclePricing.model)
      )
    )
    .limit(1);

  if (makeDefault.length > 0) {
    return Number(makeDefault[0].multiplier);
  }

  // Default multiplier if make not found
  return 1.0;
}

export async function calculatePrice(
  service: ServiceInput,
  vehicleMultiplier: number
): Promise<LineItem> {
  const config = await getPricingConfig();

  let laborCost = 0;
  let partsCost = 0;

  // Labor calculation
  if (service.laborHours) {
    // Hourly service: rate × hours × vehicle multiplier
    laborCost = Math.round(
      config.hourlyRate * service.laborHours * vehicleMultiplier
    );
  } else if (service.serviceId) {
    // Flat-rate from catalog - would need service lookup
    // For now, skip if no laborHours provided
  }

  // Parts markup (tiered on OEM cost)
  if (service.partsCost) {
    const costCents = Math.round(service.partsCost * 100);
    let markupPct: number;

    if (costCents < 5000) {
      // Under $50
      markupPct = config.partsMarkupTier1;
    } else if (costCents < 20000) {
      // $50-200
      markupPct = config.partsMarkupTier2;
    } else {
      // Over $200
      markupPct = config.partsMarkupTier3;
    }

    partsCost = Math.round(costCents * (1 + markupPct / 100));
  }

  return {
    name: service.name,
    description: service.description,
    price: laborCost + partsCost,
  };
}
