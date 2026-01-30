-- Enums
CREATE TYPE diagnostic_session_status AS ENUM ('pending', 'processing', 'complete', 'failed');
CREATE TYPE diagnostic_media_type AS ENUM ('photo', 'audio', 'video', 'obd_photo');
CREATE TYPE diagnostic_processing_status AS ENUM ('pending', 'processing', 'complete', 'failed');
CREATE TYPE diagnostic_obd_source AS ENUM ('manual', 'bluetooth', 'ocr');

-- Diagnostic Sessions
CREATE TABLE diagnostic_sessions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status diagnostic_session_status NOT NULL DEFAULT 'pending',
  credits_charged INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  result JSONB
);

-- Diagnostic Media
CREATE TABLE diagnostic_media (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES diagnostic_sessions(id),
  type diagnostic_media_type NOT NULL,
  r2_key TEXT NOT NULL,
  credit_cost INTEGER NOT NULL,
  metadata JSONB,
  processing_status diagnostic_processing_status NOT NULL DEFAULT 'pending',
  transcription TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- OBD Codes
CREATE TABLE diagnostic_obd_codes (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES diagnostic_sessions(id),
  code TEXT NOT NULL,
  source diagnostic_obd_source NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_diagnostic_sessions_customer ON diagnostic_sessions(customer_id);
CREATE INDEX idx_diagnostic_media_session ON diagnostic_media(session_id);
CREATE INDEX idx_diagnostic_obd_codes_session ON diagnostic_obd_codes(session_id);
