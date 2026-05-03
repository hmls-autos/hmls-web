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
// Wire shapes — what HTTP responses actually carry. JSON.stringify maps
// Date → ISO string, so timestamps arrive at web clients as strings. Web
// hooks consume these aliases to keep .createdAt etc. correctly typed.
//
// Gateway response annotations (`c.json<...>`) should use the *Row aliases
// above — those reflect Drizzle's $inferSelect (Date), which is what the
// pre-serialization data actually looks like inside Hono handlers. The two
// are related (`Wire<OrderRow>` ≡ `Order`) but kept distinct so each side
// of the boundary gets the runtime-accurate type.
// ---------------------------------------------------------------------------

// Order matters: check the non-null Date case FIRST because
// `Date extends Date | null` is true (Date is a subtype of Date | null).
// If we tested the union case first, every non-null timestamp would
// wrongly inherit `| null` — the bug we hit during initial integration.
type Wire<T> = {
  [K in keyof T]: T[K] extends Date
    ? string
    : T[K] extends Date | null
      ? string | null
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
// *Row variant: pre-serialization (Date timestamps) — used by gateway handlers.
export type OrderDetailRow = {
  order: OrderRow;
  customer: CustomerRow | null;
  events: OrderEventRow[];
};
// Wire variant: post-serialization (string timestamps) — used by web clients.
export type OrderDetail = {
  order: Order;
  customer: Customer | null;
  events: OrderEvent[];
};
