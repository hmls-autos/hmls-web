import { z } from "zod";

// ---------------------------------------------------------------------------
// PUT /me — update customer profile
// (portal.ts already has this schema inline; mirrored here so contracts are
//  the canonical location — Task 2.3 will replace the inline definition)
// ---------------------------------------------------------------------------

export const updateProfileInput = z.object({
  // Nullable so the customer can clear a previously-set field. Frontend
  // trims and sends `null` for empty input rather than empty string.
  name: z.string().min(1).max(255).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  address: z.string().nullable().optional(),
  vehicleInfo: z.object({
    make: z.string().nullable().optional(),
    model: z.string().nullable().optional(),
    year: z.string().nullable().optional(),
  }).optional(),
});

// ---------------------------------------------------------------------------
// POST /me/orders/:id/decline — customer declines estimate
// POST /me/orders/:id/cancel-booking — customer cancels scheduled order
// Both accept the same optional reason body.
// ---------------------------------------------------------------------------

export const orderReasonInput = z.object({
  reason: z.string().optional(),
});
