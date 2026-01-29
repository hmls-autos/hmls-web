// apps/agent/src/skills/estimate/tools.ts

import { z } from "zod";
import { nanoid } from "npm:nanoid";
import { db, schema } from "../../db/client.ts";
import { eq, ilike, or } from "drizzle-orm";
import { calculatePrice, getVehicleMultiplier, getPricingConfig } from "./pricing.ts";
import { toolResult } from "../../lib/tool-result.ts";

export const listServicesTool = {
  name: "list_services",
  description:
    "Search the service catalog for available services with standardized labor hours. Use this to find serviceIds for consistent estimates.",
  schema: z.object({
    search: z
      .string()
      .optional()
      .describe("Optional search term to filter services by name or category"),
    category: z
      .string()
      .optional()
      .describe("Filter by category (e.g., 'maintenance', 'repair', 'diagnostic')"),
  }),
  execute: async (params: { search?: string; category?: string }, _ctx: unknown) => {
    let query = db
      .select({
        id: schema.services.id,
        name: schema.services.name,
        description: schema.services.description,
        laborHours: schema.services.laborHours,
        category: schema.services.category,
      })
      .from(schema.services)
      .where(eq(schema.services.isActive, true))
      .$dynamic();

    if (params.category) {
      query = query.where(eq(schema.services.category, params.category));
    }

    if (params.search) {
      query = query.where(
        or(
          ilike(schema.services.name, `%${params.search}%`),
          ilike(schema.services.description, `%${params.search}%`)
        )
      );
    }

    const services = await query.limit(20);

    return toolResult({
      services: services.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        laborHours: Number(s.laborHours),
        category: s.category,
      })),
      count: services.length,
      note: "Use serviceId when creating estimates for consistent pricing based on labor hours",
    });
  },
};

export const createEstimateTool = {
  name: "create_estimate",
  description:
    "Generate a downloadable PDF estimate for a customer. Requires existing customer with vehicle info. Returns download and shareable URLs.",
  schema: z.object({
    customerId: z.number().describe("Customer ID from database"),
    services: z
      .array(
        z.object({
          serviceId: z.number().optional().describe("Service ID from catalog"),
          name: z.string().describe("Service name"),
          description: z.string().describe("Brief description"),
          laborHours: z
            .number()
            .optional()
            .describe("Labor hours (for hourly services)"),
          partsCost: z
            .number()
            .optional()
            .describe("Estimated parts cost in dollars"),
        })
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
    customerId: number;
    services: {
      serviceId?: number;
      name: string;
      description: string;
      laborHours?: number;
      partsCost?: number;
    }[];
    notes?: string;
    validDays?: number;
    isRush?: boolean;
    isAfterHours?: boolean;
  }, _ctx: unknown) => {
    // 1. Get customer with vehicle info
    const [customer] = await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, params.customerId))
      .limit(1);

    if (!customer) {
      return toolResult({ success: false, error: "Customer not found" });
    }

    const vehicleInfo = customer.vehicleInfo as {
      make?: string;
      model?: string;
      year?: string;
    } | null;

    if (!vehicleInfo?.make) {
      return toolResult({
        success: false,
        error: "Vehicle info required. Please add vehicle make/model first.",
      });
    }

    // 2. Get vehicle multiplier
    const multiplier = await getVehicleMultiplier(
      vehicleInfo.make,
      vehicleInfo.model
    );

    // 3. Calculate pricing for each service
    const items = await Promise.all(
      params.services.map((s) => calculatePrice(s, multiplier))
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
      Date.now() + validDays * 24 * 60 * 60 * 1000
    );

    // 7. Create estimate record
    const [estimate] = await db
      .insert(schema.estimates)
      .values({
        customerId: params.customerId,
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

    // 8. Return result with download links
    const baseUrl = "/api/estimates";

    return toolResult({
      success: true,
      estimateId: estimate.id,
      downloadUrl: `${baseUrl}/${estimate.id}/pdf`,
      shareUrl: `${baseUrl}/${estimate.id}/pdf?token=${shareToken}`,
      subtotal: subtotal / 100,
      priceRange: `$${(rangeLow / 100).toFixed(2)} - $${(rangeHigh / 100).toFixed(2)}`,
      expiresAt,
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
        priceRange: `$${(estimate.priceRangeLow / 100).toFixed(2)} - $${(estimate.priceRangeHigh / 100).toFixed(2)}`,
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

export const estimateTools = [listServicesTool, createEstimateTool, getEstimateTool];
