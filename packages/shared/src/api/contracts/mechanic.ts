import { z } from "zod";

// ---------------------------------------------------------------------------
// PUT /availability — replace weekly schedule atomically
// (same row shape as admin-mechanics; kept in this file so each contract
//  module is self-contained)
// ---------------------------------------------------------------------------

export const mechanicAvailabilityRowInput = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
});

export const setMechanicAvailabilityInput = z.object({
  availability: z.array(mechanicAvailabilityRowInput),
});

// ---------------------------------------------------------------------------
// GET /overrides — query string
// ---------------------------------------------------------------------------

export const listMechanicOverridesQuery = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /overrides — upsert a schedule override
// ---------------------------------------------------------------------------

export const createMechanicOverrideInput = z.object({
  overrideDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isAvailable: z.boolean(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().optional(),
});

// ---------------------------------------------------------------------------
// GET /orders — query string (date range filter)
// ---------------------------------------------------------------------------

export const listMyOrdersQuery = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});
