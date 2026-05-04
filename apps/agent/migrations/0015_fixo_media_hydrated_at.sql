-- Track when each fixo_media row was first hydrated into the chat agent on
-- /task. Without this, hydrateSessionMedia re-attaches every photo to the
-- LATEST user message on every turn — so a single uploaded photo gets re-fed
-- to the model (and re-paid for in vision tokens) on every follow-up message.
--
-- Backfill: existing rows get the current timestamp so they aren't re-injected
-- into in-progress chats after the migration runs. Brand-new uploads land
-- with NULL and get hydrated exactly once.
--
-- /complete (prependSessionEvidence) intentionally ignores this column and
-- always pulls every media row for the final structured-output summary.

ALTER TABLE public.fixo_media
  ADD COLUMN IF NOT EXISTS hydrated_at timestamptz;

UPDATE public.fixo_media
  SET hydrated_at = now()
  WHERE hydrated_at IS NULL;
