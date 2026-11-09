-- 046: legacy token_ledger columns (token_type/amount/reason) are NOT NULL in Supabase but the backend ORM records
-- the SoI Trinity as delta_heart/delta_human/delta_unity and never writes them, so every join 500'd.
-- Defaults (table has 0 rows) plus NOT NULL relaxed on reason only; no columns dropped. 'heart' satisfies token_ledger_token_type_check.
ALTER TABLE public.token_ledger ALTER COLUMN token_type SET DEFAULT 'heart';
ALTER TABLE public.token_ledger ALTER COLUMN amount SET DEFAULT 0;
ALTER TABLE public.token_ledger ALTER COLUMN reason SET DEFAULT '';
-- The ORM declares reason nullable and may write NULL explicitly, so relax its NOT NULL (0 rows; nothing lost).
ALTER TABLE public.token_ledger ALTER COLUMN reason DROP NOT NULL;
