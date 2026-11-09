-- 053 · Additive privilege tightening (2026-11-09, Supabase security advisor:
-- anon/authenticated_security_definer_function_executable).
-- Callers verified before revoking:
--   * feedback_admin_ok(text): only called INSIDE the SECURITY DEFINER functions
--     product_feedback_list / product_feedback_resolve (039), which run as owner postgres.
--     No frontend/backend RPC calls it; tests/feedback-2525.test.mjs already asserts it is
--     "not callable from outside". 039 revoked PUBLIC, but Supabase default privileges
--     re-granted anon/authenticated.
--   * rls_auto_enable(): event-trigger function for event trigger `ensure_rls`. Event
--     triggers are fired by the server, not by EXECUTE grants; it returns event_trigger and
--     cannot be called via PostgREST anyway.
-- NOT touched (called by design): arx_* OTP (Divinity Guide), sign_envelope_* (Sign Doc),
-- innovation_state_* (Innovation store), product_feedback_* (Feedback), sensor_fusion_is_member.
REVOKE EXECUTE ON FUNCTION public.feedback_admin_ok(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
