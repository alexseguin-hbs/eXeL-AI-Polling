-- 036 · pod_sessions — AUTHENTICATED membership (PROPOSAL — do not apply until seat tokens ship)
-- ============================================================================================
-- REVIEW ONLY tonight. Live schema apply is blocked until signed pod seat tokens and an
-- Auth0-verified write path exist. Applying this without those controls would either leave
-- the table unwritable to clients or tempt an insecure service-role upsert.
--
-- Intent (t65u / t69u):
--   · owner_user_id binds the creating Auth0/Supabase subject
--   · rev is append-oriented (idempotent same-rev hits; no silent rewrite of evidence)
--   · RLS: owner and proven members only — never anon open write
--   · seat proofs live in pod_seat_proofs; client-typed names never authorize
--
-- Apply only after: seat-token issuer + verifier deployed, and a backend/route that checks them.

alter table if exists pod_sessions
  add column if not exists owner_user_id text,
  add column if not exists rev integer not null default 0,
  add column if not exists project_id text;

create unique index if not exists pod_sessions_code_owner_uidx
  on pod_sessions (pod_code, owner_user_id);

create table if not exists pod_seat_proofs (
  id uuid primary key default gen_random_uuid(),
  pod_code text not null,
  seat integer not null check (seat >= 0 and seat < 16),
  subject text not null,
  proof_kind text not null check (proof_kind in ('signed_seat_token', 'verified_owner_binding')),
  token_hash text not null,
  created_at timestamptz not null default now(),
  unique (pod_code, seat)
);

alter table pod_sessions enable row level security;
alter table pod_seat_proofs enable row level security;

-- Default deny for anon. Authenticated policies are placeholders: replace with JWT claim
-- checks that match the deployed seat-token verifier. Do NOT open USING (true).
drop policy if exists "pod_sessions_owner_select" on pod_sessions;
-- create policy "pod_sessions_owner_select" on pod_sessions for select to authenticated
--   using (owner_user_id = auth.jwt()->>'sub');

drop policy if exists "pod_seat_proofs_member_select" on pod_seat_proofs;
-- create policy "pod_seat_proofs_member_select" on pod_seat_proofs for select to authenticated
--   using (subject = auth.jwt()->>'sub');

-- Keep service_role for backend-only writers that have already verified JWT + seat proofs.
drop policy if exists "pod_sessions_service_only" on pod_sessions;
create policy "pod_sessions_service_only" on pod_sessions for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "pod_seat_proofs_service_only" on pod_seat_proofs;
create policy "pod_seat_proofs_service_only" on pod_seat_proofs for all
  using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
