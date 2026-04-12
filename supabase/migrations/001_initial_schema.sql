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

-- Responses — NOTE: Table already exists in production with (session_code, participant_id, content, created_at)
-- Do NOT recreate. The live Trinity redundancy system writes to this table.
-- Future migration will add columns (question_id, response_hash, etc.) if needed.
-- create table if not exists responses (...);  -- SKIPPED: already exists with different schema

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
