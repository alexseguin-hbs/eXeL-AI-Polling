-- One-time setup: run this in Supabase SQL editor (supabase.com → project → SQL Editor)
-- Enables Layer 4 sync: Supabase DB 1s poll (HTTP REST, no CF KV binding required)

create table if not exists public.session_status (
  code             text primary key,
  status           text not null default 'draft',
  participant_count int  not null default 0,
  updated_at       timestamptz default now()
);

alter table public.session_status enable row level security;

-- Allow anonymous reads (phone checks status without auth)
create policy "anon_read"   on public.session_status
  for select to anon using (true);

-- Allow anonymous writes (moderator writes status without backend auth)
create policy "anon_insert" on public.session_status
  for insert to anon with check (true);

create policy "anon_update" on public.session_status
  for update to anon using (true);
