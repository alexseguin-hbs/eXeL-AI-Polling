-- ==========================================================================
-- Migration 009 — Missing core tables: rankings, token_ledger, questions, response_summaries
-- ==========================================================================
-- These tables are referenced by Cubes 5-9 but were not in earlier migrations.
-- ==========================================================================

-- Questions (Cube 5 — orchestrator assigns questions to sessions)
create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  question_number integer not null default 1,
  text text not null,
  max_response_length integer default 3333,
  created_at timestamptz default now()
);

create index if not exists ix_questions_session on questions(session_id);

alter table questions enable row level security;
create policy "questions_public_read" on questions for select using (true);
create policy "questions_service_write" on questions for insert with check (auth.role() = 'service_role');
create policy "questions_service_update" on questions for update using (auth.role() = 'service_role');

-- Rankings (Cube 7 — participant ranking submissions)
create table if not exists rankings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  ranking_data jsonb not null,      -- ordered array of theme IDs
  algorithm text default 'borda',
  governance_weight float default 1.0,
  submitted_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists ix_rankings_session on rankings(session_id);
create index if not exists ix_rankings_participant on rankings(participant_id);

alter table rankings enable row level security;
create policy "rankings_public_read" on rankings for select using (true);
create policy "rankings_service_write" on rankings for insert with check (auth.role() = 'service_role');

-- Token Ledger (Cube 8 — append-only token transactions)
create table if not exists token_ledger (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete set null,
  participant_id uuid references participants(id) on delete set null,
  token_type text not null check (token_type in ('heart', 'unity', 'human')),
  amount float not null,
  reason text not null,
  lifecycle_state text default 'pending' check (
    lifecycle_state in ('pending', 'approved', 'finalized', 'simulated', 'reversed')
  ),
  metadata_json text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists ix_token_session on token_ledger(session_id);
create index if not exists ix_token_participant on token_ledger(participant_id);
create index if not exists ix_token_type on token_ledger(token_type);
create index if not exists ix_token_state on token_ledger(lifecycle_state);

alter table token_ledger enable row level security;
create policy "token_ledger_service_only" on token_ledger for all
  using (auth.role() = 'service_role');

-- Response Summaries (Cube 6 — AI-generated 33/111/333-word summaries)
create table if not exists response_summaries (
  id uuid primary key default gen_random_uuid(),
  response_id uuid references responses(id) on delete cascade,
  session_code text not null,
  summary_33 text,
  summary_111 text,
  summary_333 text,
  ai_provider text default 'openai',
  confidence float,
  created_at timestamptz default now()
);

create index if not exists ix_summaries_response on response_summaries(response_id);
create index if not exists ix_summaries_session_code on response_summaries(session_code);

alter table response_summaries enable row level security;
create policy "summaries_public_read" on response_summaries for select using (true);
create policy "summaries_service_write" on response_summaries for insert with check (auth.role() = 'service_role');
create policy "summaries_service_update" on response_summaries for update using (auth.role() = 'service_role');

-- Enable realtime on key tables
alter publication supabase_realtime add table rankings;
alter publication supabase_realtime add table questions;
