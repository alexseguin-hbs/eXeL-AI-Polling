-- CRS-19.09: active typing/speaking ♡ S.I. credit metadata (2026-11-09).
-- Additive only. 060 reserved by expert-paytoview (CRS-38); this is 061.

ALTER TABLE public.time_entries
  ADD COLUMN IF NOT EXISTS active_ms integer,
  ADD COLUMN IF NOT EXISTS paste_detected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rule_version text;

ALTER TABLE public.token_ledger
  ADD COLUMN IF NOT EXISTS active_ms integer;

-- One append-only credit per response for the active-input path.
CREATE UNIQUE INDEX IF NOT EXISTS uq_token_ledger_responding_active_response
  ON public.token_ledger (reference_id)
  WHERE action_type = 'responding_active' AND reference_id IS NOT NULL;
