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

// ---------------------------------------------------------------------------
// DB row shapes (Drizzle $inferSelect — Date for timestamps, used by gateway
// and agent inside DB-touching code).
// ---------------------------------------------------------------------------

export type OrderRow = typeof orders.$inferSelect;
export type CustomerRow = typeof customers.$inferSelect;
export type ProviderRow = typeof providers.$inferSelect;
export type ProviderAvailabilityRow = typeof providerAvailability.$inferSelect;
export type ProviderScheduleOverrideRow = typeof providerScheduleOverrides.$inferSelect;
export type ShopRow = typeof shops.$inferSelect;
export type OrderEventRow = typeof orderEvents.$inferSelect;
export type PricingConfigRow = typeof pricingConfig.$inferSelect;

// Insert types (writes accept Date — Drizzle handles the conversion).
export type OrderInsert = typeof orders.$inferInsert;
export type CustomerInsert = typeof customers.$inferInsert;
export type ProviderInsert = typeof providers.$inferInsert;

// ---------------------------------------------------------------------------
// Bridge shape — accepts both Drizzle's Date (server-side, Date object)
// and the JSON-serialized form (client-side, ISO string). One name per
// entity; both sides use the same type. JSON.stringify silently maps
// Date → string at the wire, so runtime values on web are strings even
// though the type allows Date too. Web call sites that need Date methods
// wrap with `new Date(value)` explicitly.
// ---------------------------------------------------------------------------

type Wire<T> = {
  [K in keyof T]: T[K] extends Date | null
    ? Date | string | null
    : T[K] extends Date
      ? Date | string
      : T[K];
};

export type Order = Wire<OrderRow>;
export type Customer = Wire<CustomerRow>;
export type Provider = Wire<ProviderRow>;
export type ProviderAvailability = Wire<ProviderAvailabilityRow>;
export type ProviderScheduleOverride = Wire<ProviderScheduleOverrideRow>;
export type Shop = Wire<ShopRow>;
export type OrderEvent = Wire<OrderEventRow>;
export type PricingConfig = Wire<PricingConfigRow>;

// Re-export jsonb element shapes from schema (declared there so Drizzle's
// $type<...>() can reference them). One canonical definition for both
// the gateway/agent and the web.
export type { OrderItem, OrderStatusHistoryEntry, VehicleInfo } from "./schema.ts";

// Composite shape returned by GET /api/admin/orders/:id (admin sees the
// customer record alongside; portal endpoint returns a slimmer shape).
export type OrderDetail = {
  order: Order;
  customer: Customer | null;
  events: OrderEvent[];
};
