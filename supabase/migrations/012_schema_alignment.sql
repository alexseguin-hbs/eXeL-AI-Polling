-- ==========================================================================
-- Migration 012 — Schema Alignment (SPIRAL v5 — Enlil)
-- ==========================================================================
-- Aligns Supabase migrations with SQLAlchemy ORM models.
-- Fixes: token_ledger schema drift, missing auto-create tables, RLS gaps.
-- ==========================================================================

-- ============================================================
-- 1. TOKEN LEDGER — Align with SQLAlchemy model
--    Migration 009 used: participant_id, token_type, amount
--    ORM model uses:     user_id, anon_hash, cube_id, delta_heart/human/unity, etc.
-- ============================================================

-- Add missing columns (non-destructive — keeps existing data)
alter table token_ledger add column if not exists user_id text;
alter table token_ledger add column if not exists anon_hash varchar(64);
alter table token_ledger add column if not exists cube_id varchar(20);
alter table token_ledger add column if not exists action_type varchar(100);
alter table token_ledger add column if not exists distribution_method varchar(30);
alter table token_ledger add column if not exists delta_heart float default 0.0;
alter table token_ledger add column if not exists delta_human float default 0.0;
alter table token_ledger add column if not exists delta_unity float default 0.0;
alter table token_ledger add column if not exists desired_outcome_id uuid;
alter table token_ledger add column if not exists outcome_status varchar(30);
alter table token_ledger add column if not exists reference_id varchar(255);
alter table token_ledger add column if not exists version_id varchar(255);

-- Add ORM-style indexes
create index if not exists ix_token_ledger_user on token_ledger(user_id);
create index if not exists ix_token_ledger_lifecycle on token_ledger(lifecycle_state);

-- ============================================================
-- 2. USER_RANKINGS — ORM table (separate from migration 009 "rankings")
-- ============================================================

create table if not exists user_rankings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  cycle_id integer default 1,
  participant_id uuid references participants(id) on delete cascade not null,
  ranked_theme_ids jsonb,
  submitted_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_ranking_session_cycle_participant unique (session_id, cycle_id, participant_id)
);

create index if not exists ix_user_rankings_session_cycle on user_rankings(session_id, cycle_id);

alter table user_rankings enable row level security;
create policy "user_rankings_public_read" on user_rankings for select using (true);
create policy "user_rankings_service_write" on user_rankings for insert with check (auth.role() = 'service_role');

-- ============================================================
-- 3. AGGREGATED_RANKINGS — Per-theme aggregated scores
-- ============================================================

create table if not exists aggregated_rankings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  cycle_id integer default 1,
  theme_id uuid references themes(id) on delete cascade not null,
  rank_position integer not null,
  score float default 0.0,
  vote_count integer default 0,
  is_top_theme2 boolean default false,
  confidence_avg float default 0.0,
  participant_count integer default 0,
  algorithm varchar(50) default 'borda_count',
  is_final boolean default false,
  aggregated_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint uq_agg_ranking_session_cycle_theme unique (session_id, cycle_id, theme_id)
);

create index if not exists ix_agg_rankings_session_cycle on aggregated_rankings(session_id, cycle_id);
create index if not exists ix_agg_rankings_top_theme2 on aggregated_rankings(session_id, is_top_theme2);

alter table aggregated_rankings enable row level security;
create policy "agg_rankings_public_read" on aggregated_rankings for select using (true);
create policy "agg_rankings_service_write" on aggregated_rankings for insert with check (auth.role() = 'service_role');
create policy "agg_rankings_service_update" on aggregated_rankings for update using (auth.role() = 'service_role');

-- ============================================================
-- 4. GOVERNANCE_OVERRIDES — CRS-22 audit trail
-- ============================================================

create table if not exists governance_overrides (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  cycle_id integer default 1,
  theme_id uuid references themes(id) on delete cascade not null,
  original_rank integer not null,
  new_rank integer not null,
  overridden_by varchar(255) not null,
  justification text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_gov_overrides_session on governance_overrides(session_id, cycle_id);

alter table governance_overrides enable row level security;
create policy "gov_overrides_service_only" on governance_overrides for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 5. RESPONSE_META — Raw response storage (Cube 4)
-- ============================================================

create table if not exists response_meta (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  question_id uuid references questions(id) on delete set null,
  cycle_id integer default 1,
  participant_id uuid references participants(id) on delete set null,
  source varchar(20) default 'text',
  raw_text text,
  char_count integer default 0,
  submitted_at timestamptz,
  is_flagged boolean default false,
  flag_reason varchar(255),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_response_meta_session on response_meta(session_id);
create index if not exists ix_response_meta_participant on response_meta(participant_id);

alter table response_meta enable row level security;
create policy "response_meta_public_read" on response_meta for select using (true);
create policy "response_meta_service_write" on response_meta for insert with check (auth.role() = 'service_role');

-- ============================================================
-- 6. TEXT_RESPONSES — PII-scrubbed text (Cube 2)
-- ============================================================

create table if not exists text_responses (
  id uuid primary key default gen_random_uuid(),
  response_meta_id uuid references response_meta(id) on delete cascade,
  language_code varchar(10),
  is_anonymous boolean default false,
  pii_detected boolean default false,
  pii_types jsonb,
  pii_scrubbed_text text,
  profanity_detected boolean default false,
  profanity_words jsonb,
  clean_text text,
  response_hash varchar(64),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_text_responses_meta on text_responses(response_meta_id);

alter table text_responses enable row level security;
create policy "text_responses_public_read" on text_responses for select using (true);
create policy "text_responses_service_write" on text_responses for insert with check (auth.role() = 'service_role');

-- ============================================================
-- 7. VOICE_RESPONSES — STT transcripts (Cube 3)
-- ============================================================

create table if not exists voice_responses (
  id uuid primary key default gen_random_uuid(),
  response_meta_id uuid references response_meta(id) on delete cascade,
  language_code varchar(10),
  is_anonymous boolean default false,
  audio_duration_sec float,
  audio_format varchar(20),
  audio_size_bytes integer,
  stt_provider varchar(50),
  transcript_text text,
  transcript_confidence float,
  cost_usd float,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_voice_responses_meta on voice_responses(response_meta_id);

alter table voice_responses enable row level security;
create policy "voice_responses_service_only" on voice_responses for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 8. TIME_ENTRIES — Per-user participation tracking (Cube 5)
-- ============================================================

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  action_type varchar(50) not null,
  cube_id varchar(20),
  reference_id varchar(255),
  started_at timestamptz,
  stopped_at timestamptz,
  duration_seconds float default 0.0,
  heart_tokens_earned float default 0.0,
  human_tokens_earned float default 0.0,
  unity_tokens_earned float default 0.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_time_entries_session on time_entries(session_id);
create index if not exists ix_time_entries_participant on time_entries(participant_id);

alter table time_entries enable row level security;
create policy "time_entries_service_only" on time_entries for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 9. AI_COST_LOGS — Per-session AI provider costs (Cube 6)
-- ============================================================

create table if not exists ai_cost_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  phase varchar(20),
  provider varchar(30),
  total_calls integer default 0,
  total_input_chars integer default 0,
  total_output_chars integer default 0,
  estimated_cost_usd float default 0.0,
  response_count integer default 0,
  duration_sec float default 0.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_ai_cost_session on ai_cost_logs(session_id);

alter table ai_cost_logs enable row level security;
create policy "ai_cost_service_only" on ai_cost_logs for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 10. CQS_SCORES — Contribution Quality Scores (Cube 6)
-- ============================================================

create table if not exists cqs_scores (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  response_id uuid,
  participant_id uuid references participants(id) on delete set null,
  theme2_cluster_label varchar(200),
  theme_confidence float,
  insight_score float,
  depth_score float,
  future_impact_score float,
  originality_score float,
  actionability_score float,
  relevance_score float,
  composite_cqs float,
  is_winner boolean default false,
  provider varchar(30),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_cqs_session on cqs_scores(session_id);

alter table cqs_scores enable row level security;
create policy "cqs_public_read" on cqs_scores for select using (true);
create policy "cqs_service_write" on cqs_scores for insert with check (auth.role() = 'service_role');

-- ============================================================
-- 11. DESIRED_OUTCOMES — Session outcome tracking (Cube 4/5)
-- ============================================================

create table if not exists desired_outcomes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  description text,
  time_estimate_minutes integer,
  created_by uuid,
  confirmed_by jsonb,
  all_confirmed boolean default false,
  outcome_status varchar(30) default 'pending',
  results_log text,
  assessed_by jsonb,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_desired_outcomes_session on desired_outcomes(session_id);

alter table desired_outcomes enable row level security;
create policy "desired_outcomes_public_read" on desired_outcomes for select using (true);
create policy "desired_outcomes_service_write" on desired_outcomes for insert with check (auth.role() = 'service_role');

-- ============================================================
-- 12. PIPELINE_TRIGGERS — AI pipeline orchestration (Cube 5)
-- ============================================================

create table if not exists pipeline_triggers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade not null,
  trigger_type varchar(50),
  status varchar(20) default 'pending',
  triggered_at timestamptz,
  completed_at timestamptz,
  error_message text,
  trigger_metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_pipeline_triggers_session on pipeline_triggers(session_id);

alter table pipeline_triggers enable row level security;
create policy "pipeline_triggers_service_only" on pipeline_triggers for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 13. THEME_SAMPLES — Sampled responses per theme (Cube 6)
-- ============================================================

create table if not exists theme_samples (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  theme01_label varchar(50),
  sample_index integer,
  response_ids jsonb,
  secondary_theme varchar(255),
  confidence float,
  theme_id uuid references themes(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_theme_samples_session on theme_samples(session_id);

alter table theme_samples enable row level security;
create policy "theme_samples_public_read" on theme_samples for select using (true);
create policy "theme_samples_service_write" on theme_samples for insert with check (auth.role() = 'service_role');

-- ============================================================
-- 14. SIMULATION_RUNS — Cube 10 simulation tracking
-- ============================================================

create table if not exists simulation_runs (
  id uuid primary key default gen_random_uuid(),
  cube_id varchar(20),
  initiated_by varchar(255),
  base_version varchar(100),
  proposed_version varchar(100),
  replay_dataset_ref varchar(500),
  status varchar(20) default 'pending',
  metrics jsonb,
  results_summary text,
  pass_fail boolean,
  approved_by varchar(255),
  approved_at timestamptz,
  rejection_reason varchar(1000),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table simulation_runs enable row level security;
create policy "sim_runs_service_only" on simulation_runs for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 15. CODE_SUBMISSIONS — Cube 10 code challenge system
-- ============================================================

create table if not exists code_submissions (
  id uuid primary key default gen_random_uuid(),
  cube_id integer,
  function_name varchar(255),
  submitter_id varchar(255),
  submitter_type varchar(10),
  code_diff text,
  branch_name varchar(255),
  status varchar(20) default 'pending',
  tests_passed integer default 0,
  tests_total integer default 0,
  duration_ms float,
  ssses_scores jsonb,
  replay_hash varchar(64),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table code_submissions enable row level security;
create policy "code_submissions_service_only" on code_submissions for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 16. SUBMISSION_VOTES — Cube 10 challenge voting
-- ============================================================

create table if not exists submission_votes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references code_submissions(id) on delete cascade,
  voter_id varchar(255) not null,
  vote varchar(10) not null,
  weight float default 1.0,
  tokens_staked float default 0.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table submission_votes enable row level security;
create policy "submission_votes_service_only" on submission_votes for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 17. CHALLENGES — Cube 10 challenge definitions
-- ============================================================

create table if not exists challenges (
  id uuid primary key default gen_random_uuid(),
  cube_id integer,
  function_name varchar(255),
  title varchar(500),
  description text,
  acceptance_criteria text,
  reward_heart float default 0.0,
  reward_unity float default 0.0,
  status varchar(20) default 'open',
  claimed_by varchar(255),
  simulation_id varchar(255),
  base_code_snapshot text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table challenges enable row level security;
create policy "challenges_public_read" on challenges for select using (true);
create policy "challenges_service_write" on challenges for insert with check (auth.role() = 'service_role');
create policy "challenges_service_update" on challenges for update using (auth.role() = 'service_role');

-- ============================================================
-- 18. DEPLOYMENT_LOG — Cube 10 deployment tracking
-- ============================================================

create table if not exists deployment_log (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references code_submissions(id) on delete set null,
  deployed_by varchar(255),
  previous_version_hash varchar(64),
  new_version_hash varchar(64),
  rollback_available boolean default true,
  reverted_at timestamptz,
  revert_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table deployment_log enable row level security;
create policy "deployment_log_service_only" on deployment_log for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 19. PROFANITY_FILTERS — Language-aware profanity patterns
-- ============================================================

create table if not exists profanity_filters (
  id uuid primary key default gen_random_uuid(),
  language_code varchar(10),
  pattern text not null,
  severity varchar(20) default 'moderate',
  replacement varchar(50) default '***',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table profanity_filters enable row level security;
create policy "profanity_service_only" on profanity_filters for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 20. STT_PROVIDERS — Voice provider registry (Cube 3)
-- ============================================================

create table if not exists stt_providers (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null,
  supported_languages jsonb,
  is_active boolean default true,
  priority integer default 0,
  is_primary boolean default false,
  cost_per_minute_usd float default 0.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table stt_providers enable row level security;
create policy "stt_providers_public_read" on stt_providers for select using (true);
create policy "stt_providers_service_write" on stt_providers for insert with check (auth.role() = 'service_role');

-- ============================================================
-- 21. USERS — Auth user registry
-- ============================================================

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth0_id varchar(255) unique,
  email varchar(320),
  display_name varchar(255),
  role varchar(50) default 'user',
  is_active boolean default true,
  last_login timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_users_auth0 on users(auth0_id);

alter table users enable row level security;
create policy "users_service_only" on users for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 22. TOKEN_DISPUTES — Cube 8 dispute resolution
-- ============================================================

create table if not exists token_disputes (
  id uuid primary key default gen_random_uuid(),
  ledger_entry_id uuid references token_ledger(id) on delete cascade not null,
  flagged_by varchar(255) not null,
  reason varchar(1000) not null,
  evidence varchar(2000),
  status varchar(20) default 'open',
  resolution_notes varchar(2000),
  resolved_by varchar(255),
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_token_disputes_status on token_disputes(status);

alter table token_disputes enable row level security;
create policy "token_disputes_service_only" on token_disputes for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 23. SESSION_CREATION_LOG — Add missing RLS (Thor)
-- ============================================================

alter table session_creation_log enable row level security;
create policy "session_creation_log_service_only" on session_creation_log for all
  using (auth.role() = 'service_role');

-- ============================================================
-- 24. Enable Realtime on new key tables
-- ============================================================

alter publication supabase_realtime add table user_rankings;
alter publication supabase_realtime add table aggregated_rankings;
alter publication supabase_realtime add table time_entries;
alter publication supabase_realtime add table cqs_scores;
