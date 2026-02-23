import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Reference existing customers table (defined in apps/api)
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }),
});

// User tier enum
export const userTierEnum = pgEnum("user_tier", ["free", "plus"]);

// User profiles (extends Supabase auth.users)
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: uuid("id").primaryKey(), // matches auth.users.id
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    tier: userTierEnum("tier").default("free").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_user_profiles_stripe").on(table.stripeCustomerId)],
);

// Vehicles
export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => userProfiles.id),
    year: integer("year"),
    make: text("make").notNull(),
    model: text("model").notNull(),
    vin: text("vin"),
    nickname: text("nickname"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_vehicles_user").on(table.userId)],
);

// Enums
export const sessionStatusEnum = pgEnum("diagnostic_session_status", [
  "pending",
  "processing",
  "complete",
  "failed",
]);

export const mediaTypeEnum = pgEnum("diagnostic_media_type", [
  "photo",
  "audio",
  "video",
  "obd_photo",
]);

export const processingStatusEnum = pgEnum("diagnostic_processing_status", [
  "pending",
  "processing",
  "complete",
  "failed",
]);

export const obdSourceEnum = pgEnum("diagnostic_obd_source", [
  "manual",
  "bluetooth",
  "ocr",
]);

// Diagnostic Sessions
export const diagnosticSessions = pgTable(
  "diagnostic_sessions",
  {
    id: serial("id").primaryKey(),
    customerId: integer("customer_id")
      .references(() => customers.id),
    userId: uuid("user_id").references(() => userProfiles.id),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id),
    status: sessionStatusEnum("status").notNull().default("pending"),
    creditsCharged: integer("credits_charged").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    result: jsonb("result"),
  },
  (table) => [index("idx_diagnostic_sessions_customer").on(table.customerId)],
);

// Diagnostic Media
export const diagnosticMedia = pgTable(
  "diagnostic_media",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => diagnosticSessions.id),
    type: mediaTypeEnum("type").notNull(),
    storageKey: text("r2_key").notNull(),
    creditCost: integer("credit_cost").notNull(),
    metadata: jsonb("metadata"),
    processingStatus: processingStatusEnum("processing_status")
      .notNull()
      .default("pending"),
    transcription: text("transcription"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_diagnostic_media_session").on(table.sessionId)],
);

// OBD Codes
export const obdCodes = pgTable(
  "diagnostic_obd_codes",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => diagnosticSessions.id),
    code: text("code").notNull(),
    source: obdSourceEnum("source").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("idx_diagnostic_obd_codes_session").on(table.sessionId)],
);

// Types
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type DiagnosticSession = typeof diagnosticSessions.$inferSelect;
export type NewDiagnosticSession = typeof diagnosticSessions.$inferInsert;
export type DiagnosticMedia = typeof diagnosticMedia.$inferSelect;
export type NewDiagnosticMedia = typeof diagnosticMedia.$inferInsert;
export type ObdCode = typeof obdCodes.$inferSelect;
export type NewObdCode = typeof obdCodes.$inferInsert;
