-- ==========================================================================
-- Migration 006 — Payment Transactions + Divinity Guide + Dictionary
-- ==========================================================================
-- Adds:
--   1. payment_transactions — Stripe payment ledger (mirrors backend model)
--   2. divinity_pages — All 185 pages × 9 languages (en + 8 translations)
--   3. divinity_dictionary — 4,436 words × 7 language translations
-- ==========================================================================

-- ---------------------------------------------------------------------------
-- 1. Payment Transactions (mirrors backend/app/models/payment.py)
-- ---------------------------------------------------------------------------
create table if not exists payment_transactions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,  -- nullable for divinity donations
  participant_id uuid references participants(id) on delete set null,
  transaction_type text not null check (
    transaction_type in ('moderator_fee', 'cost_split', 'donation', 'divinity_guide_donation', 'reward_payout')
  ),
  amount_cents integer not null check (amount_cents >= 0),
  currency text default 'USD' check (length(currency) = 3),
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  status text default 'pending' check (
    status in ('pending', 'completed', 'failed', 'refunded')
  ),
  metadata_json text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes (match SQLAlchemy model)
create index if not exists ix_payment_tx_session on payment_transactions(session_id);
create index if not exists ix_payment_tx_status on payment_transactions(status);
create index if not exists ix_payment_tx_stripe_pi on payment_transactions(stripe_payment_intent_id);
create index if not exists ix_payment_tx_stripe_cs on payment_transactions(stripe_checkout_session_id);

-- RLS: service role only (no direct client access to payment data)
alter table payment_transactions enable row level security;

create policy "payment_transactions_service_only"
  on payment_transactions for all
  using (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2. Divinity Guide Pages — 185 pages × 9 languages
-- ---------------------------------------------------------------------------
create table if not exists divinity_pages (
  id serial primary key,
  page_id text not null,           -- e.g. "prelude-01", "01.01", "i05"
  language_code text not null,     -- en, es, uk, ru, zh, fa, he, pt, ne
  chapter integer not null,        -- 0=prelude, 1-12=main, 13=appendix
  page integer not null,           -- page number within chapter
  text text not null,              -- full page content
  gated boolean default false,     -- donation-gated content
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(page_id, language_code)   -- one entry per page per language
);

-- Indexes for fast lookup
create index if not exists ix_divinity_pages_lang on divinity_pages(language_code);
create index if not exists ix_divinity_pages_chapter on divinity_pages(chapter);
create index if not exists ix_divinity_pages_gated on divinity_pages(gated);
create index if not exists ix_divinity_pages_page_id on divinity_pages(page_id);

-- RLS: public read, service write
alter table divinity_pages enable row level security;

create policy "divinity_pages_public_read"
  on divinity_pages for select
  using (true);

create policy "divinity_pages_service_write"
  on divinity_pages for insert
  with check (auth.role() = 'service_role');

create policy "divinity_pages_service_update"
  on divinity_pages for update
  using (auth.role() = 'service_role');

-- Enable realtime for live content updates
alter publication supabase_realtime add table divinity_pages;

-- ---------------------------------------------------------------------------
-- 3. Divinity Dictionary — 4,436 words × 7 language translations
-- ---------------------------------------------------------------------------
create table if not exists divinity_dictionary (
  id serial primary key,
  english_word text not null,      -- source English word
  language_code text not null,     -- es, zh, fa, ru, uk, he, pt
  translation text not null,       -- translated word/phrase
  created_at timestamptz default now(),

  unique(english_word, language_code)
);

-- Indexes
create index if not exists ix_divinity_dict_word on divinity_dictionary(english_word);
create index if not exists ix_divinity_dict_lang on divinity_dictionary(language_code);

-- RLS: public read, service write
alter table divinity_dictionary enable row level security;

create policy "divinity_dict_public_read"
  on divinity_dictionary for select
  using (true);

create policy "divinity_dict_service_write"
  on divinity_dictionary for insert
  with check (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 4. Add payment fields to sessions table (if not already present)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_name = 'sessions' and column_name = 'pricing_tier') then
    alter table sessions add column pricing_tier text default 'free';
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name = 'sessions' and column_name = 'fee_amount_cents') then
    alter table sessions add column fee_amount_cents integer;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name = 'sessions' and column_name = 'estimated_cost_cents') then
    alter table sessions add column estimated_cost_cents integer;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name = 'sessions' and column_name = 'is_paid') then
    alter table sessions add column is_paid boolean default false;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name = 'sessions' and column_name = 'stripe_session_id') then
    alter table sessions add column stripe_session_id text;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name = 'sessions' and column_name = 'cost_splitting_enabled') then
    alter table sessions add column cost_splitting_enabled boolean default false;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Add payment_status to participants (if not already present)
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_name = 'participants' and column_name = 'payment_status') then
    alter table participants add column payment_status text default 'unpaid';
  end if;
end $$;
