ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preauth_amount_cents INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS captured_amount_cents INTEGER;
UPDATE orders SET status = 'draft' WHERE status = 'estimated';
