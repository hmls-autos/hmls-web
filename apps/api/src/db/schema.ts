import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  customType,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

const tstzrange = customType<{ data: string; driverParam: string }>({
  dataType() {
    return "tstzrange";
  },
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  laborHours: numeric("labor_hours", { precision: 4, scale: 2 }).notNull(), // e.g., 0.5, 1.0, 2.5
  category: varchar("category", { length: 50 }), // e.g., "maintenance", "repair", "diagnostic"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  vehicleInfo: jsonb("vehicle_info"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
  authUserId: varchar("auth_user_id", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const providers = pgTable("providers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  specialties: jsonb("specialties"),
  isActive: boolean("is_active").notNull().default(true),
  serviceRadiusMiles: integer("service_radius_miles").default(30),
  homeBaseLat: numeric("home_base_lat", { precision: 10, scale: 7 }),
  homeBaseLng: numeric("home_base_lng", { precision: 10, scale: 7 }),
  timezone: varchar("timezone", { length: 50 }).notNull().default("America/Los_Angeles"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const providerAvailability = pgTable("provider_availability", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id, { onDelete: "cascade" })
    .notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  // Stored as TIME in DB; varchar here because Drizzle returns TIME as string
  startTime: varchar("start_time", { length: 8 }).notNull(),
  endTime: varchar("end_time", { length: 8 }).notNull(),
});

export const providerScheduleOverrides = pgTable("provider_schedule_overrides", {
  id: serial("id").primaryKey(),
  providerId: integer("provider_id").references(() => providers.id, { onDelete: "cascade" })
    .notNull(),
  overrideDate: varchar("override_date", { length: 10 }).notNull(),
  isAvailable: boolean("is_available").notNull().default(false),
  startTime: varchar("start_time", { length: 8 }),
  endTime: varchar("end_time", { length: 8 }),
  reason: text("reason"),
});

export const providerServices = pgTable("provider_services", {
  providerId: integer("provider_id").references(() => providers.id, { onDelete: "cascade" })
    .notNull(),
  serviceId: integer("service_id").references(() => services.id, { onDelete: "cascade" })
    .notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.providerId, table.serviceId] }),
}));

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  channel: varchar("channel", { length: 20 }).notNull().default("web"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  bookingId: integer("booking_id").references((): AnyPgColumn => bookings.id),
  stripeQuoteId: varchar("stripe_quote_id", { length: 100 }),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 100 }), // linked invoice after quote accepted
  items: jsonb("items").notNull(), // [{ service, description, amount }]
  totalAmount: integer("total_amount").notNull(), // in cents
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, sent, accepted, invoiced, paid
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pricingConfig = pgTable("pricing_config", {
  key: varchar("key", { length: 50 }).primaryKey(),
  value: integer("value").notNull(),
  description: text("description"),
});

export const vehiclePricing = pgTable("vehicle_pricing", {
  id: serial("id").primaryKey(),
  make: varchar("make", { length: 50 }).notNull(),
  model: varchar("model", { length: 50 }),
  multiplier: numeric("multiplier", { precision: 3, scale: 2 }).notNull()
    .default("1.00"),
  notes: text("notes"),
}, (table) => ({
  uniqueMakeModel: unique().on(table.make, table.model),
}));

export const estimates = pgTable("estimates", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  items: jsonb("items").notNull(), // LineItem[]
  subtotal: integer("subtotal").notNull(), // in cents
  priceRangeLow: integer("price_range_low").notNull(), // in cents
  priceRangeHigh: integer("price_range_high").notNull(), // in cents
  notes: text("notes"),
  shareToken: varchar("share_token", { length: 64 }).notNull(),
  validDays: integer("valid_days").notNull().default(14),
  expiresAt: timestamp("expires_at").notNull(),
  convertedToQuoteId: integer("converted_to_quote_id").references(() => quotes.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NOTE: `scheduledAt` maps to `scheduled_at` — this IS the appointment start time.
// Column was not renamed to preserve backwards compatibility with existing data.
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  providerId: integer("provider_id").references(() => providers.id),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  serviceItems: jsonb("service_items").notNull().default([]),
  symptomDescription: text("symptom_description"),
  vehicleYear: integer("vehicle_year"),
  vehicleMake: varchar("vehicle_make", { length: 50 }),
  vehicleModel: varchar("vehicle_model", { length: 50 }),
  vehicleMileage: integer("vehicle_mileage"),
  estimateId: integer("estimate_id").references(() => estimates.id),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  appointmentEnd: timestamp("appointment_end", { withTimezone: true }),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  bufferBeforeMinutes: integer("buffer_before_minutes").notNull().default(30),
  bufferAfterMinutes: integer("buffer_after_minutes").notNull().default(15),
  blockedRange: tstzrange("blocked_range"),
  location: text("location"),
  locationLat: numeric("location_lat", { precision: 10, scale: 7 }),
  locationLng: numeric("location_lng", { precision: 10, scale: 7 }),
  accessInstructions: text("access_instructions"),
  customerName: varchar("customer_name", { length: 255 }),
  customerEmail: varchar("customer_email", { length: 255 }),
  customerPhone: varchar("customer_phone", { length: 20 }),
  photoUrls: jsonb("photo_urls"),
  customerNotes: text("customer_notes"),
  internalNotes: text("internal_notes"),
  preferredMechanicId: integer("preferred_mechanic_id").references(() => providers.id),
  status: varchar("status", { length: 50 }).notNull().default("requested"),
  calcomBookingId: varchar("calcom_booking_id", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  bookingId: integer("booking_id").references(() => bookings.id),
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 100 }),
  items: jsonb("items").notNull(), // [{ service, description, amount }]
  totalAmount: integer("total_amount").notNull(), // in cents
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, sent, paid
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
