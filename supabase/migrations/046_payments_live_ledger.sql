-- 046: payments go-live ledger (applied to Supabase ppgfjplawtlrfqpnszyb 2026-11-08 with owner approval, t111u).
-- Promotes the REVIEW-ONLY backend/migrations/033_cost_ledger_payment_events.sql, additive only:
--   * stripe_webhook_events      — durable Stripe event-id dedupe (replaces the per-process set)
--   * payment_transactions       — product_line / idempotency / event / scope columns + one-row-per-Checkout guard
--   * session_cost_ledger_lines  — durable per-session STT/Theme02 cost lines (unknown rate never stored as 0)
-- RLS ON for every new table with NO anon/authenticated policy: only the hosted FastAPI backend (service role /
-- postgres, which bypasses RLS) reads or writes. Moderators see their rows through the API, which checks ownership.
-- No drops, no data changes (payment_transactions had 0 rows when applied).

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id                text NOT NULL UNIQUE,
    event_type              text NOT NULL,
    livemode                boolean NULL,
    processed_at            timestamptz NOT NULL DEFAULT now(),
    session_id              uuid NULL REFERENCES public.sessions(id) ON DELETE SET NULL,
    payment_transaction_id  uuid NULL REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
    outcome                 text NULL,
    payload_digest          text NULL
);
CREATE INDEX IF NOT EXISTS ix_stripe_webhook_events_type ON public.stripe_webhook_events (event_type, processed_at DESC);
CREATE INDEX IF NOT EXISTS ix_stripe_webhook_events_session ON public.stripe_webhook_events (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_stripe_webhook_events_ptx ON public.stripe_webhook_events (payment_transaction_id) WHERE payment_transaction_id IS NOT NULL;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events FROM anon, authenticated;
COMMENT ON TABLE public.stripe_webhook_events IS '046 — Stripe event id dedupe for Cube8 webhooks (backend-only; RLS on, no client policy)';

ALTER TABLE public.payment_transactions
    ADD COLUMN IF NOT EXISTS product_line     text NULL,
    ADD COLUMN IF NOT EXISTS idempotency_key  text NULL,
    ADD COLUMN IF NOT EXISTS stripe_event_id  text NULL,
    ADD COLUMN IF NOT EXISTS reconcile_status text NULL,
    ADD COLUMN IF NOT EXISTS scope_ref        text NULL,
    ADD COLUMN IF NOT EXISTS attempt_count    integer NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_tx_idempotency_key ON public.payment_transactions (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_tx_checkout_session ON public.payment_transactions (stripe_checkout_session_id) WHERE stripe_checkout_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_tx_payment_intent ON public.payment_transactions (stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_payment_tx_product_line ON public.payment_transactions (product_line);
CREATE INDEX IF NOT EXISTS ix_payment_tx_session ON public.payment_transactions (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_payment_tx_participant ON public.payment_transactions (participant_id) WHERE participant_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.session_cost_ledger_lines (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    scope_ref         text NULL,
    org_id            text NULL,
    kind              text NOT NULL,
    provider          text NOT NULL,
    model             text NULL,
    quantity          numeric NULL,
    quantity_unit     text NOT NULL,
    amount_usd        numeric NULL,
    currency          text NOT NULL DEFAULT 'USD',
    rate_status       text NOT NULL,
    reconcile_status  text NOT NULL,
    catalog_version   text NOT NULL,
    attempt           integer NOT NULL DEFAULT 1,
    billed_retry      boolean NOT NULL DEFAULT false,
    failure           boolean NOT NULL DEFAULT false,
    source            text NOT NULL,
    notes             text NULL,
    meta_json         jsonb NULL,
    created_at        timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT session_cost_ledger_lines_kind_chk CHECK (kind IN ('stt', 'theme02', 'other')),
    CONSTRAINT session_cost_ledger_lines_rate_chk CHECK (rate_status IN ('known', 'unknown', 'explicit_zero')),
    CONSTRAINT session_cost_ledger_lines_unknown_not_zero_chk CHECK (NOT (rate_status = 'unknown' AND amount_usd = 0))
);
CREATE INDEX IF NOT EXISTS ix_session_cost_ledger_session ON public.session_cost_ledger_lines (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_session_cost_ledger_scope ON public.session_cost_ledger_lines (scope_ref) WHERE scope_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_session_cost_ledger_org ON public.session_cost_ledger_lines (org_id) WHERE org_id IS NOT NULL;
ALTER TABLE public.session_cost_ledger_lines ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.session_cost_ledger_lines FROM anon, authenticated;
COMMENT ON TABLE public.session_cost_ledger_lines IS '046 — per-session Theme02/STT cost lines; unknown rates must not be stored as zero (backend-only)';
