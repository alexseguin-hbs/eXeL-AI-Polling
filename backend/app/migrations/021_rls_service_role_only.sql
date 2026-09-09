-- 2026-09-09 — RLS policies that were open to every role are pinned to service_role (operator: "ensure Supabase data links are secure").
--
-- 014 and 017 created policies named "service_role_*" as `FOR ALL USING (true) WITH CHECK (true)` with no `TO` clause: a policy
-- without TO applies to EVERY role, and Supabase grants anon/authenticated table privileges on public by default — so the anon
-- key could read and write blockchain_records, arx_items, arx_transactions, deferred_claim_tokens and arx_otp_codes through REST.
-- The backend reaches them with the service-role key only. Below: the five policies are recreated `TO service_role`, and the
-- anon / authenticated table grants are revoked, so the tables answer to the backend alone. Sign Doc's tables (036) already do
-- this (RLS forced, grants revoked, four SECURITY DEFINER RPCs as the only client path).
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['blockchain_records', 'arx_items', 'arx_transactions', 'deferred_claim_tokens'] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS "service_role_all" ON public.%I', t);
      EXECUTE format('CREATE POLICY "service_role_all" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
      EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
      EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
  IF to_regclass('public.arx_otp_codes') IS NOT NULL THEN
    DROP POLICY IF EXISTS "service_role_otp" ON public.arx_otp_codes;
    CREATE POLICY "service_role_otp" ON public.arx_otp_codes FOR ALL TO service_role USING (true) WITH CHECK (true);
    REVOKE ALL ON public.arx_otp_codes FROM anon, authenticated;
    ALTER TABLE public.arx_otp_codes FORCE ROW LEVEL SECURITY;
  END IF;
END $$;
