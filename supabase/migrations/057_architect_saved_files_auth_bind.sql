-- 057 · Architect-2525 cloud-save — auth claim bind (030 sibling; HI Q4 / SSSES Security).
-- ============================================================================
-- SECURITY REVIEW (2026-11-09) of architect_saved_files_get/_put from 053/056:
--   Who can call: anon + authenticated + service_role (EXECUTE granted). SECURITY DEFINER.
--   Read/write scope: exact equality on caller-supplied (p_owner, p_name); no list/scan RPC.
--   search_path: pinned to public, pg_temp (no hijack). RLS: enabled, no policies (deny-all on
--   table); anon/authenticated table privileges revoked — RPC is the only door.
--   Abuse: possession of a 122-bit owner UUID is authorisation (bearer). XSS / shared-device /
--   stolen localStorage still leaks that owner's rows. No rate limit at SQL layer.
--
-- WHY NOT "authenticated-only + owner = auth.uid()" today (justified alternative):
--   Evidence DERIVED: frontend/lib/supabase.ts builds the browser client with the publishable
--   anon key only — Auth0 login (USER_STATED active) does not mint a Supabase JWT, so auth.uid()
--   is NULL on every request even when the operator is signed in. Revoking anon EXECUTE would
--   silently disable cloud save (capability at risk; construction method UNDECIDED for the
--   Auth0→Supabase bridge). Same trade-off innovation_state took in 030.
--
-- MINIMAL SAFE FIX (preserve capability; close the accounts-cutover hole 056 left open):
--   1. Add nullable user_id (+ created_at) so a signed-in write can claim a row.
--   2. Rewrite get/put: a row with user_id set is readable/writable ONLY by that auth.uid();
--      first authenticated write stamps user_id; anonymous writes never un-claim.
--   3. Keep anon EXECUTE (bearer UUID) so current Architect cloud save keeps working.
--   4. When auth.uid() IS present, p_owner must equal auth.uid()::text (owner binding).
--      (Inactive until Auth0↔Supabase lands; then it binds without a further migration.)
-- Applied live: ONLY after this PR merges (corrective). SIM rolled-back proof: tests/057_*.sim.sql.
-- Idempotent. No rows deleted. CRS: HI Q4 2026.10.31 ask; SSSES Security; ARC cloud-saved-files
-- (VISION_2525_REUSE_CATALOG); migration lineage 022 → 023 → 053(live)/056(repo) → 057.

-- 1 · org-cutover columns (nullable — existing bearer rows stay reachable)
ALTER TABLE public.architect_saved_files
  ADD COLUMN IF NOT EXISTS user_id UUID;
-- No FK to auth.users yet: Auth0≠Supabase JWT today, so claim stamps use auth.uid()
-- values that may not exist in auth.users until the bridge lands. Claim logic does not
-- need the FK; add REFERENCES auth.users(id) ON DELETE SET NULL in a follow-up when
-- real Supabase users exist (preserves capability + sim-testability).
ALTER TABLE public.architect_saved_files
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.architect_saved_files
   SET created_at = updated_at
 WHERE created_at > updated_at;

CREATE INDEX IF NOT EXISTS ix_architect_saved_files_user
  ON public.architect_saved_files(user_id);

-- 2 · owner-key shape guard (same entropy bar as innovation_state_owner_ok)
CREATE OR REPLACE FUNCTION public.architect_saved_files_owner_ok(p_owner text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT p_owner IS NOT NULL
     AND length(p_owner) BETWEEN 32 AND 64
     AND p_owner ~ '^[A-Za-z0-9-]+$'
     AND lower(p_owner) <> 'anon';
$$;

REVOKE ALL ON FUNCTION public.architect_saved_files_owner_ok(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.architect_saved_files_owner_ok(text) TO anon, authenticated, service_role;

-- 3 · get — one row; claimed rows only for their auth.uid()
CREATE OR REPLACE FUNCTION public.architect_saved_files_get(p_owner text, p_name text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v jsonb;
  uid uuid := auth.uid();
BEGIN
  IF NOT public.architect_saved_files_owner_ok(p_owner) THEN
    RETURN NULL;
  END IF;
  IF p_name IS NULL OR length(p_name) < 1 OR length(p_name) > 64 THEN
    RETURN NULL;
  END IF;
  -- When a Supabase JWT is present, the owner key MUST be that uid (accounts path).
  IF uid IS NOT NULL AND p_owner IS DISTINCT FROM uid::text THEN
    RAISE EXCEPTION 'architect_saved_files_get: owner must match auth.uid()' USING ERRCODE = '42501';
  END IF;

  SELECT f.payload INTO v
    FROM public.architect_saved_files f
   WHERE f.owner_key = p_owner
     AND f.name = p_name
     AND (f.user_id IS NULL OR f.user_id = uid)
   LIMIT 1;
  RETURN v;
END;
$$;

-- 4 · put — claim guard; first signed-in write stamps user_id; never un-claims
CREATE OR REPLACE FUNCTION public.architect_saved_files_put(
  p_owner text,
  p_name text,
  p_payload jsonb,
  p_source_hash text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF NOT public.architect_saved_files_owner_ok(p_owner) THEN
    RAISE EXCEPTION 'architect_saved_files_put: invalid owner' USING ERRCODE = '22023';
  END IF;
  IF p_name IS NULL OR length(p_name) < 1 OR length(p_name) > 64 THEN
    RAISE EXCEPTION 'architect_saved_files_put: invalid name' USING ERRCODE = '22023';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' OR pg_column_size(p_payload) > 5242880 THEN
    RAISE EXCEPTION 'architect_saved_files_put: invalid payload' USING ERRCODE = '22023';
  END IF;
  IF uid IS NOT NULL AND p_owner IS DISTINCT FROM uid::text THEN
    RAISE EXCEPTION 'architect_saved_files_put: owner must match auth.uid()' USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.architect_saved_files f
     WHERE f.owner_key = p_owner AND f.name = p_name
       AND f.user_id IS NOT NULL AND f.user_id IS DISTINCT FROM uid
  ) THEN
    RAISE EXCEPTION 'architect_saved_files_put: row is claimed by another account' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.architect_saved_files (owner_key, name, payload, source_hash, user_id, updated_at)
  VALUES (p_owner, p_name, p_payload, left(p_source_hash, 128), uid, now())
  ON CONFLICT (owner_key, name)
  DO UPDATE SET
    payload     = EXCLUDED.payload,
    source_hash = EXCLUDED.source_hash,
    updated_at  = now(),
    user_id     = COALESCE(public.architect_saved_files.user_id, EXCLUDED.user_id);
END;
$$;

-- 5 · grants (capability preserved: anon still reaches the RPC door; table stays deny-all)
REVOKE ALL ON FUNCTION public.architect_saved_files_get(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.architect_saved_files_put(text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.architect_saved_files_get(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.architect_saved_files_put(text, text, jsonb, text) TO anon, authenticated, service_role;

ALTER TABLE public.architect_saved_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.architect_saved_files FROM anon, authenticated;
