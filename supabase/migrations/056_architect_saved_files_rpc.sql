-- 056 (renumbered from 053 in the repo) · Architect-2525 cloud-save RPCs.
-- ============================================================================
-- LIVE HISTORY MAPPING (do not rewrite supabase_migrations rows):
--   Applied live 2026-11-09 as version 20261109131322 / name 053_architect_saved_files_rpc
--   (13:13:22Z). Repo file was also numbered 053, colliding with 053_revoke_internal_definer_fn_execute
--   (live version 20261109131219). SensorFusion took 054; ranking took 055; this file is 056.
--   Fresh environments apply this file as 056; the live project already has the same SQL under the
--   053_* history name — CREATE OR REPLACE makes a re-apply idempotent. No live history row is edited.
--
-- CRS / decisions cited:
--   HI decision Q4 (docs/asks/2026.10.31_06.28..05_architect2525_hi_decisions_r5b_r6.md) — ship the
--   030-shaped saved-files hardening (planned as 044; delivered as this RPC door + 057 claim bind).
--   SSSES Security class: anon SECURITY DEFINER must be scoped, non-enumerable, fixed search_path.
--
-- Round 1 (M — capability at risk): RPCs the client already calls (lib/architect-saved-files.ts).
-- ADDITIVE: SECURITY DEFINER get/put, fixed search_path, one (owner_key,name) row; table path revoked
-- for anon/authenticated. Bearer owner_key until accounts — claim bind lands in 057.
--
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
