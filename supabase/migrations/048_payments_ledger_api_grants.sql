-- 048: the hosted API connects as role exel_api (BYPASSRLS, explicit per-table grants — not postgres/service_role).
-- Give it exactly what Cube 8 needs on the 046 tables: no DELETE (event dedupe + cost lines are append/update only).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'exel_api') THEN
    GRANT SELECT, INSERT, UPDATE ON public.stripe_webhook_events TO exel_api;
    GRANT SELECT, INSERT, UPDATE ON public.session_cost_ledger_lines TO exel_api;
  END IF;
END $$;
