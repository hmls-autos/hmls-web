import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  serviceType: varchar("service_type", { length: 100 }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  location: text("location"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  notes: text("notes"),
  calcomBookingId: varchar("calcom_booking_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id),
  bookingId: integer("booking_id").references(() => bookings.id),
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
