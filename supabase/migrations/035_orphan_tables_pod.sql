-- 035_orphan_tables_pod.sql
-- EIGHT tables the backend already MOUNTS AND QUERIES but no migration ever created: the four
-- from the gap assessment (2026-09-02 §I.4 — eleven endpoints and all usage metering failed
-- against the deployed schema) plus four more the parity script then found — api_keys and the
-- projects → differentiators → specifications scoping tree, both documented as IMPLEMENTED, plus the pod's durable record (soi-session assessment §5: "the clock
-- is an event, not a claim" must be true beyond a phone's memory).
--
-- Columns mirror the SQLAlchemy models exactly (usage_record.py, cube11_blockchain/models.py,
-- cube12_divinity_nft/models.py; Base = uuid id + created_at). Every statement is idempotent
-- (Enki, round 1): applying twice is a no-op. RLS follows 012_schema_alignment — service_role
-- only until a per-user policy is ruled. scripts/verify-migrations-vs-models.mjs proves parity.

-- ============================================================
-- usage_records  (core/usage_service · metering → billing)
-- ============================================================
create table if not exists usage_records (
  id            uuid primary key default gen_random_uuid(),
  org_id        text not null,
  metric        text not null,
  quantity      integer not null default 1,
  cost_tokens   double precision not null default 0,
  api_key_id    uuid,
  session_id    uuid,
  scope_ref     text,
  occurred_at   timestamptz not null,
  created_at    timestamptz not null default now()
);
create index if not exists usage_records_org_metric_time_idx on usage_records (org_id, metric, occurred_at desc);
create index if not exists usage_records_session_idx           on usage_records (session_id) where session_id is not null;
alter table usage_records enable row level security;
drop policy if exists "usage_records_service_only" on usage_records;
create policy "usage_records_service_only" on usage_records for all using (auth.role() = 'service_role');

-- ============================================================
-- blockchain_records  (cube11 — the 4-hash governance proof; Quai submission is Phase 2)
-- ============================================================
create table if not exists blockchain_records (
  id                uuid primary key default gen_random_uuid(),
  session_hash      text not null unique,
  governance_proof  text not null,
  winning_theme     text not null,
  voter_count       integer not null default 0,
  response_count    integer not null default 0,
  quai_tx_hash      text,
  chain_status      text not null default 'pending',   -- pending | recorded | failed
  created_at        timestamptz not null default now()
);
create index if not exists blockchain_records_status_idx on blockchain_records (chain_status, created_at desc);
alter table blockchain_records enable row level security;
drop policy if exists "blockchain_records_service_only" on blockchain_records;
create policy "blockchain_records_service_only" on blockchain_records for all using (auth.role() = 'service_role');

-- ============================================================
-- arx_items · arx_transactions  (cube12 — physical-item provenance registry)
-- ============================================================
create table if not exists arx_items (
  id                  uuid primary key default gen_random_uuid(),
  token_id            integer,
  chip_key_hash       text,
  item_name           text not null,
  serial_number       text,
  identifiers         text,
  language            text not null default 'en',
  current_owner       text,
  purchase_price_usd  numeric(10,2),
  purchase_date       date,
  quai_tx_hash        text,
  qr_code_url         text,
  last_transfer_at    timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists arx_items_token_idx on arx_items (token_id) where token_id is not null;
create index if not exists arx_items_owner_idx on arx_items (current_owner) where current_owner is not null;
alter table arx_items enable row level security;
drop policy if exists "arx_items_service_only" on arx_items;
create policy "arx_items_service_only" on arx_items for all using (auth.role() = 'service_role');

create table if not exists arx_transactions (
  id                uuid primary key default gen_random_uuid(),
  arx_tx_id         text not null unique,
  token_id          integer not null,
  from_address      text,
  to_address        text not null,
  price_usd         numeric(10,2),
  transaction_type  text not null,                     -- mint | transfer | sale
  quai_tx_hash      text,
  created_at        timestamptz not null default now()
);
create index if not exists arx_transactions_token_idx on arx_transactions (token_id, created_at desc);
alter table arx_transactions enable row level security;
drop policy if exists "arx_transactions_service_only" on arx_transactions;
create policy "arx_transactions_service_only" on arx_transactions for all using (auth.role() = 'service_role');

-- ============================================================
-- api_keys  (core/api_key_service — per-org keys; the parity script found this orphan too)
-- ============================================================
create table if not exists api_keys (
  id            uuid primary key default gen_random_uuid(),
  org_id        text not null,
  name          text not null,
  key_prefix    text not null,
  key_hash      text not null unique,
  scopes        text not null default '*',
  is_active     boolean not null default true,
  created_by    text not null,
  last_used_at  timestamptz,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists api_keys_org_idx    on api_keys (org_id);
create index if not exists api_keys_prefix_idx on api_keys (key_prefix);
alter table api_keys enable row level security;
drop policy if exists "api_keys_service_only" on api_keys;
create policy "api_keys_service_only" on api_keys for all using (auth.role() = 'service_role');

-- ============================================================
-- projects → differentiators → specifications  (core/scoping_service — the API's scoping tree)
-- ============================================================
create table if not exists projects (
  id            uuid primary key default gen_random_uuid(),
  org_id        text not null,
  name          text not null,
  description   text,
  status        text not null default 'active',
  config        jsonb not null default '{}'::jsonb,
  created_by    text not null,
  created_at    timestamptz not null default now()
);
create index if not exists projects_org_idx on projects (org_id);
alter table projects enable row level security;
drop policy if exists "projects_service_only" on projects;
create policy "projects_service_only" on projects for all using (auth.role() = 'service_role');

create table if not exists differentiators (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  name          text not null,
  description   text,
  hypothesis    text,
  status        text not null default 'active',
  config        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists differentiators_project_idx on differentiators (project_id);
alter table differentiators enable row level security;
drop policy if exists "differentiators_service_only" on differentiators;
create policy "differentiators_service_only" on differentiators for all using (auth.role() = 'service_role');

create table if not exists specifications (
  id                 uuid primary key default gen_random_uuid(),
  differentiator_id  uuid not null references differentiators(id) on delete cascade,
  name               text not null,
  description        text,
  status             text not null default 'active',
  parameters         jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);
create index if not exists specifications_diff_idx on specifications (differentiator_id);
alter table specifications enable row level security;
drop policy if exists "specifications_service_only" on specifications;
create policy "specifications_service_only" on specifications for all using (auth.role() = 'service_role');

-- ============================================================
-- pod_sessions  (◬ ♡ 웃 Session — the pod's durable record; WP-12 wires the Cube 5 hook)
-- One row per pod. `members`/`seats` mirror lib/pod-roster.ts PodState so Cube 10 can replay
-- a recorded pod and reproduce its settlement + synthesis (asserted by tests/soi-pod-sim).
-- ============================================================
create table if not exists pod_sessions (
  id               uuid primary key default gen_random_uuid(),
  pod_code         text not null,
  lead_client      text not null,
  intent           text,
  outcome          text,
  phase            text not null default 'compose',    -- compose|invite|sync|active|record|audit|closed
  members          jsonb not null default '[]'::jsonb,
  seats            jsonb not null default '{}'::jsonb,
  started_at       timestamptz,                        -- the synchronized start (an event, never backdated)
  closed_at        timestamptz,
  witnessed_hours  numeric(8,3),
  yug_yok          numeric(10,3),                      -- 웃 that settle = M × witnessed hours
  ya_triangle      numeric(10,3),                      -- ◬ recognised (frozen-baseline delta only)
  record_method    text,                               -- video | written | voice
  record_text      text,
  synthesis        jsonb,                              -- { results, changed, next } — 3 × 111
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists pod_sessions_code_idx   on pod_sessions (pod_code, created_at desc);
create index if not exists pod_sessions_phase_idx  on pod_sessions (phase) where phase <> 'closed';
alter table pod_sessions enable row level security;
drop policy if exists "pod_sessions_service_only" on pod_sessions;
create policy "pod_sessions_service_only" on pod_sessions for all using (auth.role() = 'service_role');
