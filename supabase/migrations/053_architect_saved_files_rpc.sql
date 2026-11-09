-- Architect-2525 · Round 1 (M — capability at risk): the cloud-save RPCs the client already calls.
-- ============================================================================
-- lib/architect-saved-files.ts calls rpc('architect_saved_files_get' / '_put') FIRST and falls back to the
-- legacy table path only when the function is missing. No migration ever defined them, so every Architect
-- load logged 2× HTTP 404 on /rest/v1/rpc/architect_saved_files_get (Round 0 evidence) and cloud save ran on
-- the wide table path, where 023's policy `owner_key IS NOT NULL AND length(owner_key) > 0` lets any anon
-- caller SELECT/UPDATE/DELETE every owner's rows (no tenant isolation at all).
--
-- ADDITIVE + order-independent:
--   1. Two SECURITY DEFINER functions, fixed search_path, scoped to exactly one (owner_key, name) row.
--      A caller must present the per-browser owner UUID; there is no listing / scan path.
--   2. Direct table access for anon/authenticated is withdrawn (policies dropped, privileges revoked) — the
--      client already prefers the RPC, so live saves keep working; only the cross-owner scan is closed.
--      RLS stays ENABLED; service_role is untouched. No rows are modified or deleted.
-- ⚠ Still NOT user identity: owner_key is a client-held UUID until Architect carries the logged-in user
--   (then compare against auth.uid()::text inside these functions). Tracked for the accounts milestone.

CREATE OR REPLACE FUNCTION public.architect_saved_files_get(p_owner text, p_name text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT f.payload
    FROM public.architect_saved_files f
   WHERE p_owner IS NOT NULL AND length(p_owner) BETWEEN 32 AND 64
     AND p_name  IS NOT NULL AND length(p_name)  BETWEEN 1 AND 64
     AND f.owner_key = p_owner
     AND f.name = p_name
   LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.architect_saved_files_put(p_owner text, p_name text, p_payload jsonb, p_source_hash text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_owner IS NULL OR length(p_owner) NOT BETWEEN 32 AND 64 THEN
    RAISE EXCEPTION 'architect_saved_files_put: invalid owner' USING ERRCODE = '22023';
  END IF;
  IF p_name IS NULL OR length(p_name) NOT BETWEEN 1 AND 64 THEN
    RAISE EXCEPTION 'architect_saved_files_put: invalid name' USING ERRCODE = '22023';
  END IF;
  IF p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' OR pg_column_size(p_payload) > 5242880 THEN
    RAISE EXCEPTION 'architect_saved_files_put: invalid payload' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.architect_saved_files (owner_key, name, payload, source_hash, updated_at)
  VALUES (p_owner, p_name, p_payload, left(p_source_hash, 128), now())
  ON CONFLICT (owner_key, name)
  DO UPDATE SET payload = EXCLUDED.payload, source_hash = EXCLUDED.source_hash, updated_at = now();
END
$$;

REVOKE ALL ON FUNCTION public.architect_saved_files_get(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.architect_saved_files_put(text, text, jsonb, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.architect_saved_files_get(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.architect_saved_files_put(text, text, jsonb, text) TO anon, authenticated, service_role;

-- Close the cross-owner table path (the RPCs above are now the only anon/authenticated door).
ALTER TABLE public.architect_saved_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners read their saved files"   ON public.architect_saved_files;
DROP POLICY IF EXISTS "Owners insert their saved files" ON public.architect_saved_files;
DROP POLICY IF EXISTS "Owners update their saved files" ON public.architect_saved_files;
DROP POLICY IF EXISTS "Owners delete their saved files" ON public.architect_saved_files;
REVOKE ALL ON TABLE public.architect_saved_files FROM anon, authenticated;
