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

const migrationStep4 = `
-- Add new columns to existing bookings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN provider_id INTEGER REFERENCES providers(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'service_items'
  ) THEN
    ALTER TABLE bookings ADD COLUMN service_items JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'symptom_description'
  ) THEN
    ALTER TABLE bookings ADD COLUMN symptom_description TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'vehicle_year'
  ) THEN
    ALTER TABLE bookings ADD COLUMN vehicle_year INTEGER;
    ALTER TABLE bookings ADD COLUMN vehicle_make VARCHAR(50);
    ALTER TABLE bookings ADD COLUMN vehicle_model VARCHAR(50);
    ALTER TABLE bookings ADD COLUMN vehicle_mileage INTEGER;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'estimate_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN estimate_id INTEGER REFERENCES estimates(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'appointment_end'
  ) THEN
    ALTER TABLE bookings ADD COLUMN appointment_end TIMESTAMPTZ;
    ALTER TABLE bookings ADD COLUMN duration_minutes INTEGER NOT NULL DEFAULT 60;
    ALTER TABLE bookings ADD COLUMN buffer_before_minutes INTEGER NOT NULL DEFAULT 30;
    ALTER TABLE bookings ADD COLUMN buffer_after_minutes INTEGER NOT NULL DEFAULT 15;
    ALTER TABLE bookings ADD COLUMN blocked_range TSTZRANGE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'location_lat'
  ) THEN
    ALTER TABLE bookings ADD COLUMN location_lat NUMERIC(10, 7);
    ALTER TABLE bookings ADD COLUMN location_lng NUMERIC(10, 7);
    ALTER TABLE bookings ADD COLUMN access_instructions TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN customer_name VARCHAR(255);
    ALTER TABLE bookings ADD COLUMN customer_email VARCHAR(255);
    ALTER TABLE bookings ADD COLUMN customer_phone VARCHAR(20);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'photo_urls'
  ) THEN
    ALTER TABLE bookings ADD COLUMN photo_urls JSONB;
    ALTER TABLE bookings ADD COLUMN customer_notes TEXT;
    ALTER TABLE bookings ADD COLUMN internal_notes TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'preferred_mechanic_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN preferred_mechanic_id INTEGER REFERENCES providers(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Trigger: auto-compute blocked_range from scheduled_at + duration + buffers
-- NOTE: scheduled_at is the appointment start time (existing column name preserved)
CREATE OR REPLACE FUNCTION compute_blocked_range()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scheduled_at IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
    NEW.appointment_end := NEW.scheduled_at + make_interval(mins => NEW.duration_minutes);
    NEW.blocked_range := tstzrange(
      NEW.scheduled_at - make_interval(mins => NEW.buffer_before_minutes),
      NEW.appointment_end + make_interval(mins => NEW.buffer_after_minutes),
      '[)'
    );
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_compute_blocked_range ON bookings;
CREATE TRIGGER trg_compute_blocked_range
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION compute_blocked_range();

-- RLS on bookings (block direct PostgREST access)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
`;

const migrationStep5 = `
-- Exclusion constraint: no overlapping bookings per provider
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_no_overlap'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_no_overlap
      EXCLUDE USING gist (
        provider_id WITH =,
        blocked_range WITH &&
      ) WHERE (
        status NOT IN ('cancelled', 'no_show')
        AND provider_id IS NOT NULL
        AND blocked_range IS NOT NULL
      );
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_provider_time
  ON bookings USING gist (provider_id, blocked_range)
  WHERE status NOT IN ('cancelled', 'no_show') AND provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_customer
  ON bookings (customer_id, scheduled_at DESC);
`;

const migrationStep6 = `
-- OLP (Open Labor Project) reference data
CREATE TABLE IF NOT EXISTS olp_vehicles (
  id SERIAL PRIMARY KEY,
  make VARCHAR(100) NOT NULL,
  make_slug VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  model_slug VARCHAR(100) NOT NULL,
  year_range VARCHAR(20) NOT NULL,
  year_start INTEGER NOT NULL,
  year_end INTEGER NOT NULL,
  engine VARCHAR(50) NOT NULL,
  engine_slug VARCHAR(50) NOT NULL,
  fuel_type VARCHAR(20),
  timing_type VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(make_slug, model_slug, year_range, engine_slug)
);

CREATE TABLE IF NOT EXISTS olp_labor_times (
  id SERIAL PRIMARY KEY,
  vehicle_id INTEGER NOT NULL REFERENCES olp_vehicles(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  labor_hours NUMERIC(5, 2) NOT NULL,
  UNIQUE(vehicle_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_olp_vehicles_lookup
  ON olp_vehicles(make_slug, model_slug, year_start, year_end);
CREATE INDEX IF NOT EXISTS idx_olp_labor_times_vehicle
  ON olp_labor_times(vehicle_id, category);

ALTER TABLE olp_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE olp_labor_times ENABLE ROW LEVEL SECURITY;
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

    console.log("Step 4: Enhanced bookings...");
    await sql.unsafe(migrationStep4);

    console.log("Step 5: Exclusion constraint + indexes...");
    await sql.unsafe(migrationStep5);

    console.log("Step 6: OLP reference tables...");
    await sql.unsafe(migrationStep6);

    console.log("Migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    Deno.exit(1);
  }

  await sql.end();
  Deno.exit(0);
}

migrate();
