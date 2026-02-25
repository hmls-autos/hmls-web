// apps/agent/src/skills/estimate/tools.ts

import { z } from "zod";
import { nanoid } from "nanoid";
import { db, schema } from "../../db/client.ts";
import { eq } from "drizzle-orm";
import { calculatePrice, getPricingConfig } from "./pricing.ts";
import { toolResult } from "@hmls/shared/tool-result";

export const createEstimateTool = {
  name: "create_estimate",
  description:
    "Generate a price estimate for services. Provide vehicle info directly (year/make/model). " +
    "If the user is a known customer, also pass customerId to save the estimate to their account.",
  schema: z.object({
    customerId: z
      .number()
      .optional()
      .describe("Customer ID from database (if known). Omit for anonymous users."),
    vehicle: z.object({
      year: z.number().describe("Vehicle year, e.g. 2015"),
      make: z.string().describe("Vehicle make, e.g. 'Honda'"),
      model: z.string().describe("Vehicle model, e.g. 'Civic'"),
    }).describe("Vehicle the estimate is for"),
    services: z
      .array(
        z.object({
          name: z.string().describe("Service name"),
          description: z.string().describe("Brief description"),
          laborHours: z
            .number()
            .describe("Labor hours from OLP lookup"),
          partsCost: z
            .number()
            .optional()
            .describe("Estimated parts cost in dollars"),
        }),
      )
      .describe("List of services to include in estimate"),
    notes: z.string().optional().describe("Additional notes for the estimate"),
    validDays: z.number().default(14).describe("Days until estimate expires"),
    isRush: z.boolean().default(false).describe("Same-day service requested"),
    isAfterHours: z
      .boolean()
      .default(false)
      .describe("After 8PM appointment requested"),
  }),
  execute: async (params: {
    customerId?: number;
    vehicle: { year: number; make: string; model: string };
    services: {
      name: string;
      description: string;
      laborHours: number;
      partsCost?: number;
    }[];
    notes?: string;
    validDays?: number;
    isRush?: boolean;
    isAfterHours?: boolean;
  }, _ctx: unknown) => {
    // 1. Resolve customer if provided
    let customer;
    if (params.customerId) {
      const [found] = await db
        .select()
        .from(schema.customers)
        .where(eq(schema.customers.id, params.customerId))
        .limit(1);
      customer = found;
    }

    // 2. Calculate pricing for each service (labor hours from OLP are already vehicle-specific)
    const items = await Promise.all(
      params.services.map((s) => calculatePrice(s)),
    );

    // 4. Add fees
    const config = await getPricingConfig();
    let feesTotal = 0;

    if (params.isRush) {
      feesTotal += config.rushFee;
      items.push({
        name: "Same-Day Service",
        description: "Rush scheduling fee",
        price: config.rushFee,
      });
    }

    if (params.isAfterHours) {
      feesTotal += config.afterHoursFee;
      items.push({
        name: "After-Hours Service",
        description: "Evening appointment fee",
        price: config.afterHoursFee,
      });
    }

    // 5. Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.price, 0);
    const rangeLow = Math.round(subtotal * 0.9);
    const rangeHigh = Math.round(subtotal * 1.1);

    // 6. Generate share token
    const shareToken = nanoid(32);
    const validDays = params.validDays ?? 14;
    const expiresAt = new Date(
      Date.now() + validDays * 24 * 60 * 60 * 1000,
    );

    // 7. Save to DB if we have a customer, otherwise return pricing only
    if (customer) {
      const [estimate] = await db
        .insert(schema.estimates)
        .values({
          customerId: customer.id,
          items: items,
          subtotal,
          priceRangeLow: rangeLow,
          priceRangeHigh: rangeHigh,
          notes: params.notes,
          shareToken,
          validDays,
          expiresAt,
        })
        .returning();

      const baseUrl = "/api/estimates";

      return toolResult({
        success: true,
        estimateId: estimate.id,
        vehicle: `${params.vehicle.year} ${params.vehicle.make} ${params.vehicle.model}`,
        downloadUrl: `${baseUrl}/${estimate.id}/pdf`,
        shareUrl: `${baseUrl}/${estimate.id}/pdf?token=${shareToken}`,
        subtotal: subtotal / 100,
        priceRange: `$${(rangeLow / 100).toFixed(2)} - $${(rangeHigh / 100).toFixed(2)}`,
        expiresAt,
      });
    }

    // Anonymous user — return pricing without saving
    return toolResult({
      success: true,
      vehicle: `${params.vehicle.year} ${params.vehicle.make} ${params.vehicle.model}`,
      items: items.map((i) => ({ name: i.name, price: i.price / 100 })),
      subtotal: subtotal / 100,
      priceRange: `$${(rangeLow / 100).toFixed(2)} - $${(rangeHigh / 100).toFixed(2)}`,
      note: "Estimate not saved — customer not signed in.",
    });
  },
};

export const getEstimateTool = {
  name: "get_estimate",
  description: "Retrieve an existing estimate by ID to check status or details",
  schema: z.object({
    estimateId: z.number().describe("Estimate ID from database"),
  }),
  execute: async (params: { estimateId: number }, _ctx: unknown) => {
    const [estimate] = await db
      .select()
      .from(schema.estimates)
      .where(eq(schema.estimates.id, params.estimateId))
      .limit(1);

    if (!estimate) {
      return toolResult({ found: false, message: "Estimate not found" });
    }

    const isExpired = new Date() > estimate.expiresAt;

    return toolResult({
      found: true,
      estimate: {
        id: estimate.id,
        items: estimate.items,
        subtotal: estimate.subtotal / 100,
        priceRange: `$${(estimate.priceRangeLow / 100).toFixed(2)} - $${
          (estimate.priceRangeHigh / 100).toFixed(2)
        }`,
        notes: estimate.notes,
        expiresAt: estimate.expiresAt,
        isExpired,
        convertedToQuote: estimate.convertedToQuoteId !== null,
        downloadUrl: `/api/estimates/${estimate.id}/pdf`,
        shareUrl: `/api/estimates/${estimate.id}/pdf?token=${estimate.shareToken}`,
      },
    });
  },
};

export const estimateTools = [
  createEstimateTool,
  getEstimateTool,
];
