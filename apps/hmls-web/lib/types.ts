// Transitional re-export. PR 3 finishes by replacing call sites to
// import directly from `@hmls/shared/db/types`; this file goes away in
// Task 3.C. Kept here so PR 3's hook commits land incrementally without
// a single big-bang import migration.

export type {
  Customer,
  Order,
  OrderDetail,
  OrderEvent,
  OrderItem,
  Provider,
  ProviderAvailability,
  ProviderScheduleOverride,
  Shop,
  VehicleInfo,
} from "@hmls/shared/db/types";

// Display-only shapes that never lived in the DB. Kept here for now;
// future cleanup will move these into a web-side display module.
export interface LineItem {
  name: string;
  description: string;
  price: number;
}

export interface ServiceItem {
  name: string;
  partsNeeded: boolean;
  partsNote?: string;
}
