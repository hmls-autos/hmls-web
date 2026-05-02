import type {
  customers,
  orderEvents,
  orders,
  pricingConfig,
  providerAvailability,
  providers,
  providerScheduleOverrides,
  shops,
} from "./schema.ts";

export type Order = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type CustomerInsert = typeof customers.$inferInsert;
export type Provider = typeof providers.$inferSelect;
export type ProviderInsert = typeof providers.$inferInsert;
export type ProviderAvailability = typeof providerAvailability.$inferSelect;
export type ProviderScheduleOverride = typeof providerScheduleOverrides.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type PricingConfig = typeof pricingConfig.$inferSelect;

// Single canonical shape. Both Customer.vehicleInfo and Order.vehicleInfo
// reference this — replaces the divergent definitions in web's old
// lib/types.ts (one had year: number, the other year: string).
export type VehicleInfo = { year?: number; make?: string; model?: string };

export type { OrderItem } from "./schema.ts";

// Composite shape returned by GET /api/admin/orders/:id and
// GET /api/portal/me/orders/:id. Declared once, both gateway and web
// import from here.
export type OrderDetail = {
  order: Order;
  customer: Customer | null;
  events: OrderEvent[];
};
