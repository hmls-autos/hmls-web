-- Migration: Add per-order contact snapshot fields
-- Date: 2026-03-16
-- Purpose: Allow editing contact info on a specific order without mutating the
--          global customers record (which would affect all orders for that customer).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS contact_name    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_email   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS contact_phone   VARCHAR(20),
  ADD COLUMN IF NOT EXISTS contact_address TEXT;
