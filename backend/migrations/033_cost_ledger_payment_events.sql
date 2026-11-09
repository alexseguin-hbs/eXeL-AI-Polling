-- SUPERSEDED by supabase/migrations/046_payments_live_ledger.sql (applied 2026-11-08). Kept for history; do not apply.
-- Migration 033: cost ledger + Stripe webhook event dedupe + payment metadata.
-- Generated 2026-11-08 for feat/cost-ledger-payment-reliability.
--
-- Authorization model (API enforces; RLS reviewed for service-role backend):
--   * Rows keyed by session_id (+ optional scope_ref / project).
--   * Readable by session owner (moderator), org admin, or project member via
--     existing scoping membership — NOT anonymous.
--   * No claim of live persistence until migration applied + tested.
--
-- Shared identifiers (coordinate with Trinity pod audit; do not conflict):
--   session_id uuid  — polling Session.id (canonical)
--   scope_ref  text  — Session.scope_ref / Project→Differentiator→Specification
--   org_id     text  — session.created_by (v1 org = owner principal)
--   participant_id uuid — optional
-- Trinity pod time/outcome/evidence tables keep their own ids; join ONLY via
-- session_id / scope_ref when both sides present. Do not rename Trinity columns.

-- 1) Webhook event dedupe
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        text NOT NULL UNIQUE,
    event_type      text NOT NULL,
    processed_at    timestamptz NOT NULL DEFAULT now(),
    session_id      uuid NULL REFERENCES sessions(id),
    payment_transaction_id uuid NULL REFERENCES payment_transactions(id),
    payload_digest  text NULL
);
CREATE INDEX IF NOT EXISTS ix_stripe_webhook_events_type
    ON stripe_webhook_events (event_type, processed_at DESC);

-- 2) Additive columns on payment_transactions
ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS product_line text NULL,
    ADD COLUMN IF NOT EXISTS idempotency_key text NULL,
    ADD COLUMN IF NOT EXISTS stripe_event_id text NULL,
    ADD COLUMN IF NOT EXISTS reconcile_status text NULL,
    ADD COLUMN IF NOT EXISTS scope_ref text NULL,
    ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_tx_idempotency_key
    ON payment_transactions (idempotency_key)
    WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_payment_tx_product_line
    ON payment_transactions (product_line);

-- 3) Durable session cost ledger lines (Theme02 + STT attribution)
CREATE TABLE IF NOT EXISTS session_cost_ledger_lines (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          uuid NOT NULL REFERENCES sessions(id),
    scope_ref           text NULL,
    org_id              text NULL,
    kind                text NOT NULL,           -- stt | theme02 | other
    provider            text NOT NULL,
    model               text NULL,
    quantity            numeric NULL,
    quantity_unit       text NOT NULL,          -- minutes | tokens | ...
    amount_usd          numeric NULL,           -- NULL when unknown rate/usage
    currency            text NOT NULL DEFAULT 'USD',
    rate_status         text NOT NULL,          -- known | unknown | explicit_zero
    reconcile_status    text NOT NULL,          -- estimated | recorded_estimate | reconciled | ...
    catalog_version     text NOT NULL,
    attempt             integer NOT NULL DEFAULT 1,
    billed_retry        boolean NOT NULL DEFAULT false,
    failure             boolean NOT NULL DEFAULT false,
    source              text NOT NULL,          -- voice_responses | ai_cost_logs | fixture | ...
    notes               text NULL,
    meta_json           jsonb NULL,
    created_at          timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT session_cost_ledger_lines_kind_chk
        CHECK (kind IN ('stt', 'theme02', 'other')),
    CONSTRAINT session_cost_ledger_lines_rate_chk
        CHECK (rate_status IN ('known', 'unknown', 'explicit_zero')),
    CONSTRAINT session_cost_ledger_lines_unknown_not_zero_chk
        CHECK (NOT (rate_status = 'unknown' AND amount_usd = 0))
);

CREATE INDEX IF NOT EXISTS ix_session_cost_ledger_session
    ON session_cost_ledger_lines (session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_session_cost_ledger_scope
    ON session_cost_ledger_lines (scope_ref)
    WHERE scope_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_session_cost_ledger_org
    ON session_cost_ledger_lines (org_id)
    WHERE org_id IS NOT NULL;

COMMENT ON TABLE session_cost_ledger_lines IS
    'REVIEW 033 — per-session Theme02/STT cost lines; unknown rates must not be stored as zero';
COMMENT ON TABLE stripe_webhook_events IS
    'REVIEW 033 — Stripe event id dedupe for Cube8 webhooks';

-- 4) RLS sketch (service-role backend primary; tighten when applied)
-- ALTER TABLE session_cost_ledger_lines ENABLE ROW LEVEL SECURITY;
-- Policy examples deferred to apply-time review with Supabase roles.
