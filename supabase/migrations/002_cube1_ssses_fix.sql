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
