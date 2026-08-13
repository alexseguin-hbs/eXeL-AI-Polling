-- 032_identity_verification.sql
-- TOK-28 · POD-join identity verification to the US REAL standard.
-- =============================================================================
-- The POD Lead may require identity verification for a session. When a joiner is
-- NOT logged in, they provide an email + a driver's-license number; the DL number
-- is verified to REAL-ID rules and held behind a "super-secure Supabase firewall"
-- (operator, 2026-08-13). This migration is the FOUNDATION ONLY — schema + RLS +
-- the write path. No UI captures real numbers until the flow is wired and the
-- verification provider is chosen; the design is default-deny so it is safe at rest.
--
-- Security posture (non-negotiable, per the spec in docs/TOKENIZATION_SPECS.md):
--   * RLS default-deny: no anon / authenticated read of the table at all.
--   * The DL number is stored ENCRYPTED and is NEVER returned to any client.
--   * Writes go through a SECURITY DEFINER function that returns only a verdict
--     and an id — the raw number never crosses the API boundary.
--   * Only a pass/fail verdict + minimal audit fields are ever selectable, and
--     only by the service role.

create extension if not exists pgcrypto;

-- One row per verification attempt. The DL number lives ONLY in dl_enc (bytea,
-- pgp_sym_encrypt); it is never stored in plaintext and never selected by a client.
create table if not exists public.identity_verification (
  id            uuid primary key default gen_random_uuid(),
  session_code  text not null,
  email         text not null,
  issuing_state text,                          -- e.g. 'TX' (REAL-ID issuing jurisdiction)
  dl_enc        bytea,                          -- pgp_sym_encrypt(dl_number, key) — write-only
  dl_hash       text,                           -- salted SHA-256, for one-person-one-ledger checks
  verified      boolean not null default false, -- pass/fail verdict only
  method        text not null default 'realid-format', -- 'realid-format' | 'aamva' | 'dmv'
  created_at    timestamptz not null default now()
);

create index if not exists idx_identity_verification_session
  on public.identity_verification (session_code, created_at);
-- dl_hash is indexed for anti-sybil (one human, one ledger) without exposing the number.
create index if not exists idx_identity_verification_dlhash
  on public.identity_verification (dl_hash) where dl_hash is not null;

-- RLS: default-deny. No policy is created for anon/authenticated, so those roles
-- can neither read nor write. The service role bypasses RLS and is the only path.
alter table public.identity_verification enable row level security;
alter table public.identity_verification force row level security;
revoke all on public.identity_verification from anon, authenticated;

-- The ONLY write path a client-facing service should use. SECURITY DEFINER runs
-- as the table owner, so it can insert past RLS; it returns ONLY the verdict and
-- the row id — the DL number is encrypted on the way in and never read back out.
-- p_key is the symmetric encryption key, supplied from server config (never a
-- client secret, never stored in this file).
create or replace function public.record_identity_verification(
  p_session_code text,
  p_email        text,
  p_issuing_state text,
  p_dl_number    text,
  p_verified     boolean,
  p_method       text,
  p_key          text,
  p_hash_salt    text
) returns table (verification_id uuid, verified boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.identity_verification
    (session_code, email, issuing_state, dl_enc, dl_hash, verified, method)
  values
    (p_session_code, p_email, p_issuing_state,
     case when p_dl_number is null then null else pgp_sym_encrypt(p_dl_number, p_key) end,
     case when p_dl_number is null then null else encode(digest(p_hash_salt || p_dl_number, 'sha256'), 'hex') end,
     coalesce(p_verified, false),
     coalesce(p_method, 'realid-format'))
  returning id into v_id;
  -- Return ONLY the verdict + id. The raw number and the ciphertext never leave.
  return query select v_id, coalesce(p_verified, false);
end;
$$;

-- Lock the function down: only the service role may call it (client-facing code
-- runs under the service role on the server, never in the browser).
revoke all on function public.record_identity_verification(text,text,text,text,boolean,text,text,text) from public, anon, authenticated;

comment on table public.identity_verification is
  'TOK-28: POD-join identity verification (US REAL standard). RLS default-deny; DL number encrypted (dl_enc) and never returned; writes via record_identity_verification() SECURITY DEFINER which returns only a verdict.';
