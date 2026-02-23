// Migration script - creates tables if they don't exist
// Run: deno run --env=../../.env --allow-net --allow-env --allow-read src/db/migrate.ts

import postgres from "postgres";

const connectionString = Deno.env.get("DATABASE_URL");
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = postgres(connectionString);

const migrations = `
-- Services table (using labor_hours for consistent pricing)
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  labor_hours NUMERIC(4, 2) NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Migration: convert old services table to new schema
DO $$
BEGIN
  -- Check if old columns exist and new column doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'min_price'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'labor_hours'
  ) THEN
    -- Add new column
    ALTER TABLE services ADD COLUMN labor_hours NUMERIC(4, 2);
    -- Convert duration to labor_hours (approximate)
    UPDATE services SET labor_hours = 1.00;
    -- Make it not null
    ALTER TABLE services ALTER COLUMN labor_hours SET NOT NULL;
    -- Drop old columns
    ALTER TABLE services DROP COLUMN IF EXISTS min_price;
    ALTER TABLE services DROP COLUMN IF EXISTS max_price;
    ALTER TABLE services DROP COLUMN IF EXISTS duration;
  END IF;
END $$;

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  vehicle_info JSONB,
  stripe_customer_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  channel VARCHAR(20) NOT NULL DEFAULT 'web',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  service_type VARCHAR(100) NOT NULL,
  scheduled_at TIMESTAMP NOT NULL,
  location TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  notes TEXT,
  calcom_booking_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  booking_id INTEGER REFERENCES bookings(id),
  stripe_quote_id VARCHAR(100),
  stripe_invoice_id VARCHAR(100),
  items JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Pricing config table
CREATE TABLE IF NOT EXISTS pricing_config (
  key VARCHAR(50) PRIMARY KEY,
  value INTEGER NOT NULL,
  description TEXT
);

-- Vehicle pricing table
CREATE TABLE IF NOT EXISTS vehicle_pricing (
  id SERIAL PRIMARY KEY,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50),
  multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.00,
  notes TEXT,
  UNIQUE(make, model)
);

-- Estimates table
CREATE TABLE IF NOT EXISTS estimates (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  price_range_low INTEGER NOT NULL,
  price_range_high INTEGER NOT NULL,
  notes TEXT,
  share_token VARCHAR(64) NOT NULL,
  valid_days INTEGER NOT NULL DEFAULT 14,
  expires_at TIMESTAMP NOT NULL,
  converted_to_quote_id INTEGER REFERENCES quotes(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  booking_id INTEGER REFERENCES bookings(id),
  stripe_invoice_id VARCHAR(100),
  items JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
`;

const migrationStep2 = `
CREATE EXTENSION IF NOT EXISTS btree_gist;
`;

const migrationStep3 = `
-- Mechanic profiles
CREATE TABLE IF NOT EXISTS providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  specialties JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  service_radius_miles INTEGER DEFAULT 30,
  home_base_lat NUMERIC(10, 7),
  home_base_lng NUMERIC(10, 7),
  timezone VARCHAR(50) NOT NULL DEFAULT 'America/Los_Angeles',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recurring weekly schedule per mechanic
CREATE TABLE IF NOT EXISTS provider_availability (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CHECK (start_time < end_time OR end_time = TIME '00:00:00'),
  UNIQUE (provider_id, day_of_week, start_time)
);

-- Date-specific overrides (vacations, holidays, special hours)
CREATE TABLE IF NOT EXISTS provider_schedule_overrides (
  id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT false,
  start_time TIME,
  end_time TIME,
  reason TEXT,
  UNIQUE (provider_id, override_date)
);

-- Which services each provider can perform
CREATE TABLE IF NOT EXISTS provider_services (
  provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (provider_id, service_id)
);

-- RLS: block direct PostgREST access (all access through API)
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_schedule_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_services ENABLE ROW LEVEL SECURITY;
`;

async function migrate() {
  console.log("Running migrations...\n");

  try {
    console.log("Step 1: Core tables...");
    await sql.unsafe(migrations);

    console.log("Step 2: Extensions...");
    await sql.unsafe(migrationStep2);

    console.log("Step 3: Provider tables...");
    await sql.unsafe(migrationStep3);

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    Deno.exit(1);
  }

  await sql.end();
  Deno.exit(0);
}

migrate();
