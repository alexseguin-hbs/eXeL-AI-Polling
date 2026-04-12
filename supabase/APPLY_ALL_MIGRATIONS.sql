-- ==========================================================================
-- COMBINED MIGRATION — Run this in Supabase SQL Editor to create all tables
-- URL: https://supabase.com/dashboard/project/ppgfjplawtlrfqpnszyb/sql/new
-- ==========================================================================

-- ── supabase/migrations/001_initial_schema.sql ──
-- ==========================================================================
-- Migration 001 — Initial Supabase schema aligned with SQLAlchemy models
-- ==========================================================================
-- NOTE: The backend uses SQLAlchemy (PostgreSQL) as the primary data store.
-- These Supabase tables mirror the backend schema for Realtime subscriptions
-- and edge-side reads only. The backend remains the source of truth.
-- ==========================================================================

-- Sessions (mirrors backend/app/models/session.py)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  short_code text unique not null,
  created_by text not null,
  status text default 'draft',
  title text not null,
  description text,

  -- Config
  anonymity_mode text default 'identified',
  cycle_mode text default 'single',
  max_cycles integer default 1,
  current_cycle integer default 1,
  ranking_mode text default 'auto',
  language text default 'en',
  max_response_length integer default 3333,

  -- AI provider
  ai_provider text default 'openai',
  stt_provider text default 'openai',
  realtime_stt_enabled boolean default false,
  realtime_stt_provider text default 'azure',
  allow_user_stt_choice boolean default false,

  -- Determinism
  seed text,
  replay_hash text,

  -- URLs
  qr_url text,
  join_url text,

  -- Timestamps
  opened_at timestamptz,
  closed_at timestamptz,
  expires_at timestamptz default (now() + interval '24 hours'),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Appearance
  theme_id text default 'exel-cyan',
  custom_accent_color text,

  -- Session type & polling mode
  session_type text default 'polling',
  polling_mode text default 'single_round',
  polling_mode_type text default 'live_interactive',
  static_poll_duration_days integer,
  ends_at timestamptz,
  timer_display_mode text default 'flex',

  -- Capacity & pricing
  pricing_tier text default 'free',
  max_participants integer,
  fee_amount_cents integer default 0,
  cost_splitting_enabled boolean default false,

  -- Gamified reward
  reward_enabled boolean default false,
  reward_amount_cents integer default 0,
  cqs_weights jsonb,

  -- Theme voting
  theme2_voting_level text default 'theme2_9',

  -- Live feed
  live_feed_enabled boolean default false,

  -- Monetization
  is_paid boolean default false,
  stripe_session_id text
);

-- Indexes
create index if not exists idx_sessions_code on sessions(short_code);
create index if not exists idx_sessions_status on sessions(status);
create index if not exists idx_sessions_created_by on sessions(created_by);

-- Participants (mirrors backend/app/models/participant.py)
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  user_id text,
  anon_hash text,
  display_name text,
  device_type text,
  joined_at timestamptz not null default now(),
  last_seen timestamptz,
  is_active boolean default true,
  language_code text default 'en',
  results_opt_in boolean default false,
  payment_status text default 'unpaid',
  stt_provider_preference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(session_id, user_id)
);

create index if not exists idx_participants_session on participants(session_id);

-- Responses (anonymous text submissions — Cube 2)
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  participant_id uuid references participants(id),
  question_id uuid,
  raw_text text not null,
  response_hash text,
  language_code text default 'en',
  char_count integer,
  pii_detected boolean default false,
  profanity_detected boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_responses_session on responses(session_id);

-- Themes (Cube 6 AI pipeline output)
create table if not exists themes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  theme_level text,
  theme_label text,
  confidence numeric,
  response_count integer default 0,
  summary_333 text,
  summary_111 text,
  summary_33 text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_themes_session on themes(session_id);

-- Rate limiting helper table (Cube 1 SSSES)
create table if not exists session_creation_log (
  id uuid primary key default gen_random_uuid(),
  host_id text,
  created_at timestamptz default now()
);

-- Audit logs (CRS-01 compliance)
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id),
  actor_id text not null,
  actor_role text not null,
  action_type text not null,
  object_type text not null,
  object_id text,
  before_state jsonb,
  after_state jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_session on audit_logs(session_id);
create index if not exists idx_audit_logs_actor on audit_logs(actor_id);

-- Enable Realtime on key tables
alter publication supabase_realtime add table sessions, responses, themes, participants;


-- ── supabase/migrations/002_cube1_ssses_fix.sql ──
-- ==========================================================================
-- Migration 002 — Cube 1 SSSES fixes (additive, runs after 001)
-- ==========================================================================
-- Row-Level Security policies for Supabase Realtime consumers.
-- Backend (service_role key) bypasses RLS; anon key uses these policies.
-- ==========================================================================

-- Enable RLS on all tables
alter table sessions enable row level security;
alter table participants enable row level security;
alter table responses enable row level security;
alter table themes enable row level security;
alter table audit_logs enable row level security;

-- Sessions: anyone can read (public join flow), only service_role writes
create policy "sessions_read_public" on sessions
  for select using (true);

-- Participants: read own or by session (for presence)
create policy "participants_read_by_session" on participants
  for select using (true);

-- Responses: read by session (live feed)
create policy "responses_read_by_session" on responses
  for select using (true);

-- Themes: public read (results display)
create policy "themes_read_public" on themes
  for select using (true);

-- Audit logs: no public read (admin only via service_role)
create policy "audit_logs_no_public" on audit_logs
  for select using (false);


-- ── supabase/migrations/005_product_feedback.sql ──
-- Product Feedback table — collects feedback at every stage of use
-- Moderators and Users can submit from any screen
-- Stored in Supabase PostgreSQL for prioritized backlog

CREATE TABLE IF NOT EXISTS product_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  participant_id UUID,
  user_id VARCHAR(255),
  role VARCHAR(30) DEFAULT 'user',
  screen VARCHAR(50) DEFAULT 'unknown',
  cube_id INTEGER,
  crs_id VARCHAR(20),
  sub_crs_id VARCHAR(20),
  feedback_text TEXT NOT NULL,
  category VARCHAR(30) DEFAULT 'general',
  sentiment FLOAT,
  device_type VARCHAR(20),
  language_code VARCHAR(10) DEFAULT 'en',
  priority INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS ix_product_feedback_session ON product_feedback(session_id);
CREATE INDEX IF NOT EXISTS ix_product_feedback_screen ON product_feedback(screen);
CREATE INDEX IF NOT EXISTS ix_product_feedback_category ON product_feedback(category);
CREATE INDEX IF NOT EXISTS ix_product_feedback_priority ON product_feedback(priority);
CREATE INDEX IF NOT EXISTS ix_product_feedback_created ON product_feedback(created_at);

-- RLS: anyone can INSERT (submit feedback), only service_role can SELECT (admin reads)
ALTER TABLE product_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON product_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role reads all feedback"
  ON product_feedback FOR SELECT
  TO service_role
  USING (true);


-- ── supabase/migrations/006_payment_divinity_dictionary.sql ──
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
  using (auth.role() = 'service_role');

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
  using (auth.role() = 'service_role');

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


-- ── supabase/migrations/007_theme_summary_cascade.sql ──
-- ==========================================================================
-- Migration 007 — Theme Summary Cascade (333 → 111 → 33 words)
-- ==========================================================================
-- Adds tiered theme-level summaries that explain what a 2-3 word theme
-- label means at scale. Generated by sampling per-response summaries.
--
-- Pricing tiers:
--   theme_summary_333 ($3.33): 3 paragraphs, deep understanding
--   theme_summary_111 ($1.11): 1 paragraph, actionable summary
--   theme_summary_33  (FREE):  1 sentence, quick context
-- ==========================================================================

do $$
begin
  if not exists (select 1 from information_schema.columns
    where table_name = 'themes' and column_name = 'theme_summary_333') then
    alter table themes add column theme_summary_333 text;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name = 'themes' and column_name = 'theme_summary_111') then
    alter table themes add column theme_summary_111 text;
  end if;

  if not exists (select 1 from information_schema.columns
    where table_name = 'themes' and column_name = 'theme_summary_33') then
    alter table themes add column theme_summary_33 text;
  end if;
end $$;


-- ── supabase/migrations/008_webhooks_trends.sql ──
-- ==========================================================================
-- Migration 008 — Webhooks + Trend Forecasting
-- ==========================================================================
-- Enlil: Webhook subscriptions + delivery tracking ($0.99/event)
-- Odin:  Trend snapshots + subscriptions ($11.11/mo)
-- ==========================================================================

-- Webhook Subscriptions
create table if not exists webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) not null,
  url text not null,
  event_types text not null,
  secret text not null,
  is_active boolean default true,
  failure_count integer default 0,
  max_failures integer default 5,
  last_delivery_at timestamptz,
  last_failure_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_webhook_sub_session on webhook_subscriptions(session_id);
create index if not exists ix_webhook_sub_active on webhook_subscriptions(is_active);

alter table webhook_subscriptions enable row level security;
create policy "webhook_sub_service_only" on webhook_subscriptions for all
  using (auth.role() = 'service_role');

-- Webhook Deliveries
create table if not exists webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references webhook_subscriptions(id) not null,
  event_type text not null,
  payload_json text not null,
  status_code integer,
  response_body text,
  status text default 'pending',
  attempt_count integer default 0,
  cost_tokens float default 0.99,
  created_at timestamptz default now()
);

create index if not exists ix_webhook_del_sub on webhook_deliveries(subscription_id);
create index if not exists ix_webhook_del_status on webhook_deliveries(status);

alter table webhook_deliveries enable row level security;
create policy "webhook_del_service_only" on webhook_deliveries for all
  using (auth.role() = 'service_role');

-- Trend Snapshots (Odin)
create table if not exists trend_snapshots (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) unique not null,
  project_id text not null,
  snapshot_at timestamptz not null,
  input_count integer default 0,
  participant_count integer default 0,
  themes_3 jsonb,
  themes_6 jsonb,
  themes_9 jsonb,
  compression_ratio float,
  created_at timestamptz default now()
);

create index if not exists ix_trend_project on trend_snapshots(project_id);
create index if not exists ix_trend_snapshot_at on trend_snapshots(snapshot_at);
create index if not exists ix_trend_project_time on trend_snapshots(project_id, snapshot_at);

alter table trend_snapshots enable row level security;
create policy "trend_snap_service_only" on trend_snapshots for all
  using (auth.role() = 'service_role');

-- Trend Subscriptions ($11.11/mo)
create table if not exists trend_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  project_id text not null,
  stripe_subscription_id text,
  status text default 'active',
  current_period_end timestamptz,
  amount_cents integer default 1111,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_trend_sub_user on trend_subscriptions(user_id);
create index if not exists ix_trend_sub_project on trend_subscriptions(project_id);
create index if not exists ix_trend_sub_status on trend_subscriptions(status);

alter table trend_subscriptions enable row level security;
create policy "trend_sub_service_only" on trend_subscriptions for all
  using (auth.role() = 'service_role');


