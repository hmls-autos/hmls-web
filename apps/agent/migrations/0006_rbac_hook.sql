-- Migration: RBAC via Supabase Custom Access Token Hook
-- Date: 2026-04-19
--
-- 1. Add providers.auth_user_id so mechanics can link to Supabase Auth.
-- 2. Define custom_access_token_hook: injects `user_role` and (for mechanics)
--    `provider_id` into the JWT. Role precedence:
--       - mechanic  → providers.auth_user_id match (is_active = true)
--       - admin / customer → customers.role
--       - legacy admin → auth.users.raw_app_meta_data->>'role'
--       - default   → "customer"
--
--    The legacy fallback exists so admins configured via Supabase
--    Dashboard's app_metadata continue to work without data migration.
--
-- After applying, enable the hook in Supabase Dashboard:
--   Authentication → Hooks → Custom Access Token
--     → Postgres Function: public.custom_access_token_hook

-- ---------------------------------------------------------------------------
-- 1. Schema change
-- ---------------------------------------------------------------------------

ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS auth_user_id VARCHAR(255) UNIQUE;

-- ---------------------------------------------------------------------------
-- 2. Hook function
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  v_user_id text;
  v_role text;
  v_provider_id integer;
BEGIN
  v_user_id := event->>'user_id';
  claims := event->'claims';

  -- Mechanic takes precedence: an active providers row linked to this auth user
  SELECT id INTO v_provider_id
  FROM public.providers
  WHERE auth_user_id = v_user_id
    AND is_active = true
  LIMIT 1;

  IF v_provider_id IS NOT NULL THEN
    v_role := 'mechanic';
    claims := jsonb_set(claims, '{provider_id}', to_jsonb(v_provider_id));
  ELSE
    -- Customer role (admin / customer / …) from our customers table
    SELECT role INTO v_role
    FROM public.customers
    WHERE auth_user_id = v_user_id
    LIMIT 1;

    -- Legacy bridge: admins set via Supabase Dashboard live on
    -- auth.users.raw_app_meta_data.role. Honor that so no data migration
    -- is required.
    IF v_role IS NULL OR v_role = 'customer' THEN
      SELECT COALESCE(raw_app_meta_data->>'role', v_role)
      INTO v_role
      FROM auth.users
      WHERE id::text = v_user_id
      LIMIT 1;
    END IF;
  END IF;

  IF v_role IS NULL THEN
    v_role := 'customer';
  END IF;

  claims := jsonb_set(claims, '{user_role}', to_jsonb(v_role));
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Grants — the hook runs as supabase_auth_admin
-- ---------------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;

GRANT SELECT ON public.providers TO supabase_auth_admin;
GRANT SELECT ON public.customers TO supabase_auth_admin;
-- The hook reads auth.users to bridge legacy app_metadata admins.
-- supabase_auth_admin already owns the auth schema, so no grant needed.
