CREATE TABLE IF NOT EXISTS fixo_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES fixo_sessions(id) ON DELETE SET NULL,
  vehicle_info JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal_cents INTEGER NOT NULL,
  price_range_low_cents INTEGER NOT NULL,
  price_range_high_cents INTEGER NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  valid_days INTEGER NOT NULL DEFAULT 14,
  expires_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fixo_estimates_user_id ON fixo_estimates(user_id);
CREATE INDEX idx_fixo_estimates_session_id ON fixo_estimates(session_id);
