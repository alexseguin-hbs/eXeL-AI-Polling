-- 047: explicit service-role-only policies on the 046 tables (clears advisor 0008 rls_enabled_no_policy).
-- Scoped TO service_role with a constant predicate, so no per-row auth.*() re-evaluation (advisor 0003).
-- anon/authenticated still get nothing; the hosted backend connects as postgres (bypasses RLS) or service_role.
DROP POLICY IF EXISTS stripe_webhook_events_service_only ON public.stripe_webhook_events;
CREATE POLICY stripe_webhook_events_service_only ON public.stripe_webhook_events
    FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS session_cost_ledger_lines_service_only ON public.session_cost_ledger_lines;
CREATE POLICY session_cost_ledger_lines_service_only ON public.session_cost_ledger_lines
    FOR ALL TO service_role USING (true) WITH CHECK (true);
