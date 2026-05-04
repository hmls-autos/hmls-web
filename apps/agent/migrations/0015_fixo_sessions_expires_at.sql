-- Add `expires_at` to fixo_sessions so abandoned pending/processing sessions
-- age out instead of accumulating forever.
--
-- Why: there is no cleanup story for sessions today. A user who clicks the
-- camera button (creating a session) and walks away leaves a row + media
-- objects that nothing ever revisits. Lazy-filtering by expires_at lets the
-- list/detail/tier paths skip aged-out sessions without a destructive worker
-- in this PR. A future PR will add the cleanup worker that hard-deletes
-- expired rows + the R2 objects they own.
--
-- Defaults:
--   * pending / processing / failed → 30 days from insert
--   * complete                      → 1 year (existing reports hold value
--                                     the user paid attention for)
-- The gateway extends expires_at on the /complete UPDATE; this migration
-- only seeds existing rows.
--
-- Done as add → backfill → set NOT NULL + default so an in-flight Deno
-- Deploy revision can't see a half-applied schema.

ALTER TABLE public.fixo_sessions
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

UPDATE public.fixo_sessions
SET expires_at = CASE
  WHEN status = 'complete' THEN created_at + interval '1 year'
  ELSE created_at + interval '30 days'
END
WHERE expires_at IS NULL;

ALTER TABLE public.fixo_sessions
  ALTER COLUMN expires_at SET NOT NULL,
  ALTER COLUMN expires_at SET DEFAULT (now() + interval '30 days');

CREATE INDEX IF NOT EXISTS idx_fixo_sessions_expires_at
  ON public.fixo_sessions(expires_at);
