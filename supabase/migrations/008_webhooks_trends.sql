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
