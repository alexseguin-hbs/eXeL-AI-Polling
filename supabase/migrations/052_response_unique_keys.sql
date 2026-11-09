-- Applied to ppgfjplawtlrfqpnszyb 2026-11-09 via apply_migration as "047_response_unique_keys" (renumbered 52 here: 045-048 are taken in this dir).
-- 047: unique keys the backend's ON CONFLICT (response_meta_id) upserts need (Phase A/B summaries) and the ORM
-- declares (one text/voice row per response). Additive indexes only; IF NOT EXISTS; no data changes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_response_summaries_response_meta_id ON public.response_summaries (response_meta_id);
CREATE INDEX IF NOT EXISTS ix_response_summaries_session_id ON public.response_summaries (session_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_text_responses_response_meta_id ON public.text_responses (response_meta_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_voice_responses_response_meta_id ON public.voice_responses (response_meta_id);
