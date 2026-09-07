-- 036_sign_envelopes.sql
-- Sign Doc — no-fee e-signature envelopes for the ◬ ♡ 웃 landing (operator, 2026-09-07).
-- =============================================================================
-- One envelope = 1–5 PDFs (base64, ≤ 3 MB each — Thoth) + an ordered list of signers. Exactly one
-- signer may act at a time. Authorization is a PER-SIGNER SECRET minted by the client with the
-- envelope (Enki + Thor, round 1): the server stores only sha256(secret), so neither a shared
-- contact nor a database read can sign as somebody else. Every read of file bytes and every
-- signature is an append-only row in sign_events (Odin). `storage_url` is reserved so R2 can
-- replace `pdf_base64` later without a schema change.
--
-- Security posture (mirrors 032 + 030):
--   * RLS enabled + FORCED; anon/authenticated table grants revoked — nothing is selectable.
--   * The four SECURITY DEFINER functions below are the ONLY client path. They are granted to
--     anon/authenticated ON PURPOSE: the countersigner has no account (Sofia) and every call
--     carries the envelope token, and — for anything beyond title/status/masked names — a
--     per-signer secret. Failed secret checks count; 20 lock the envelope (`locked`).
--   * THE BATON: only signer 0's secret is minted by the client. Each later signer's secret is
--     minted HERE at the moment the previous signer signs, stored as a hash, and returned ONCE
--     to that previous signer so they can hand it on. Nobody — not even the creator — ever holds
--     a secret that is not theirs to pass.
--   * File bytes are returned ONLY to a party (a matching secret). Non-parties get the masked
--     roster, never a PDF.
--   * Envelopes expire 30 days after creation; the creator (signer 0) may revoke.

create extension if not exists pgcrypto;

-- ============================================================
-- sign_envelopes
-- ============================================================
create table if not exists sign_envelopes (
  id                   uuid primary key default gen_random_uuid(),
  token                text not null unique,                 -- 22-char base64url, the envelope's bearer token
  title                text not null,
  created_by           text not null,                        -- creator contact, normalised
  status               text not null default 'awaiting',     -- awaiting|complete|revoked|expired|locked
  current_signer_idx   int  not null default 0,
  signers              jsonb not null default '[]'::jsonb,   -- [{name, contact, order, secret_hash, signed_at}]
  chain                text not null default '',             -- running hash across signature passes
  failed_attempts      int  not null default 0,
  locked_until         timestamptz,                         -- a stranger's 20 wrong secrets lock for one hour, never for good (Thor, wave 3)
  expires_at           timestamptz,
  revoked_at           timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index if not exists sign_envelopes_token_idx  on sign_envelopes (token);
create index if not exists sign_envelopes_status_idx on sign_envelopes (status, expires_at) where status = 'awaiting';
alter table sign_envelopes enable row level security;
alter table sign_envelopes force row level security;
revoke all on sign_envelopes from anon, authenticated;

-- ============================================================
-- sign_files — every version of every PDF (0 = as uploaded, +1 per signature pass)
-- ============================================================
create table if not exists sign_files (
  id            uuid primary key default gen_random_uuid(),
  envelope_id   uuid not null references sign_envelopes(id) on delete cascade,
  name          text not null,
  page_count    int  not null default 0,
  pdf_base64    text not null check (length(pdf_base64) <= 4300000),  -- 3 MB binary, base64
  sha256        text not null,
  version       int  not null default 0,
  ordinal       int  not null default 0,                              -- file order within the envelope (chain replays in this order)
  storage_url   text,                                                 -- reserved: R2/Storage object instead of base64
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists sign_files_envelope_version_idx on sign_files (envelope_id, version desc);
alter table sign_files enable row level security;
alter table sign_files force row level security;
revoke all on sign_files from anon, authenticated;

-- ============================================================
-- sign_events — append-only evidence (viewed / signed / revoked / refused)
-- ============================================================
create table if not exists sign_events (
  id            uuid primary key default gen_random_uuid(),
  envelope_id   uuid not null references sign_envelopes(id) on delete cascade,
  signer_idx    int,
  kind          text not null,                    -- created|viewed|signed|revoked|refused|locked
  file_shas     text[],                           -- sha256 of every file version this event produced (computed server-side)
  version       int,                              -- the file version this event refers to
  contact_hash  text,
  ip_hash       text,
  user_agent    text,
  at            timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists sign_events_envelope_idx on sign_events (envelope_id, at);
alter table sign_events enable row level security;
alter table sign_events force row level security;
revoke all on sign_events from anon, authenticated;

-- ============================================================
-- helpers (private)
-- ============================================================
create or replace function sign__hash(p text) returns text
language sql immutable as $$ select encode(digest(coalesce(p, ''), 'sha256'), 'hex') $$;

create or replace function sign__mask(p text) returns text
language plpgsql immutable as $$
declare n text := lower(trim(coalesce(p, '')));
begin
  if n = '' then return ''; end if;
  if position('@' in n) > 0 then return left(split_part(n, '@', 1), 2) || '***@' || split_part(n, '@', 2); end if;
  n := regexp_replace(n, '\D', '', 'g');
  return '***' || right(n, 4);
end $$;

-- The public shape of an envelope. Files only when p_party (a matching secret).
create or replace function sign__shape(e sign_envelopes, p_party int, p_with_files boolean) returns jsonb
language plpgsql stable as $$
declare v_files jsonb := null; v_signers jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'name', s->>'name', 'contact_masked', sign__mask(s->>'contact'), 'order', (s->>'order')::int,
    'signed_at', s->'signed_at', 'me', (ord - 1) = p_party) order by ord), '[]'::jsonb)
  into v_signers from jsonb_array_elements(e.signers) with ordinality as t(s, ord);
  if p_with_files then
    select coalesce(jsonb_agg(jsonb_build_object('name', f.name, 'page_count', f.page_count, 'pdf_base64', f.pdf_base64,
      'sha256', f.sha256, 'version', f.version) order by f.ordinal, f.created_at), '[]'::jsonb)
    into v_files from sign_files f
    where f.envelope_id = e.id and f.version = (select max(version) from sign_files where envelope_id = e.id);
  end if;
  return jsonb_build_object('token', e.token, 'title', e.title,
    'status', case when e.status = 'awaiting' and e.locked_until is not null and e.locked_until > now() then 'locked' else e.status end,
    'current_signer_idx', e.current_signer_idx,
    'signers', v_signers, 'chain', e.chain, 'expires_at', e.expires_at, 'party', p_party, 'files', v_files);
end $$;

-- ============================================================
-- sign_envelope_create — the creator mints token + per-signer secrets client-side; we store hashes only
-- ============================================================
create or replace function sign_envelope_create(
  p_token text, p_title text, p_created_by text, p_signers jsonb, p_files jsonb, p_expires_at timestamptz
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_signers jsonb; s jsonb; f jsonb; n int := 0; nf int := 0; v_total bigint := 0;
begin
  select coalesce(sum(length(f2->>'pdf_base64')), 0) into v_total from jsonb_array_elements(coalesce(p_files, '[]'::jsonb)) as f2;
  if v_total > 17000000 then raise exception 'envelope_too_large'; end if;   -- 12 MB binary across all files (Thoth, wave 3)
  if p_token !~ '^[A-Za-z0-9_-]{22}$' then raise exception 'bad_token'; end if;
  if jsonb_typeof(p_signers) <> 'array' or jsonb_array_length(p_signers) < 1 then raise exception 'need_signer'; end if;
  if jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) < 1 or jsonb_array_length(p_files) > 5 then raise exception 'file_count'; end if;
  v_signers := '[]'::jsonb;
  for s in select * from jsonb_array_elements(p_signers) loop
    -- signer 0 brings its own secret; every later secret is minted at hand-off (the baton)
    if n = 0 and coalesce(s->>'secret', '') !~ '^[A-Za-z0-9_-]{22}$' then raise exception 'bad_secret'; end if;
    v_signers := v_signers || jsonb_build_object('name', left(coalesce(s->>'name', ''), 120), 'contact', left(coalesce(s->>'contact', ''), 200),
      'order', n, 'secret_hash', case when n = 0 then sign__hash(s->>'secret') else null end, 'signed_at', null);
    n := n + 1;
  end loop;
  insert into sign_envelopes (token, title, created_by, signers, expires_at)
  values (p_token, left(coalesce(nullif(trim(p_title), ''), 'Untitled'), 200), left(coalesce(p_created_by, ''), 200), v_signers,
          coalesce(p_expires_at, now() + interval '30 days'))
  returning id into v_id;
  for f in select * from jsonb_array_elements(p_files) loop
    if length(coalesce(f->>'pdf_base64', '')) > 4300000 then raise exception 'file_too_large'; end if;
    insert into sign_files (envelope_id, name, page_count, pdf_base64, sha256, version, ordinal)
    values (v_id, left(coalesce(f->>'name', 'document.pdf'), 200), coalesce((f->>'page_count')::int, 0), f->>'pdf_base64',
            encode(digest(decode(f->>'pdf_base64', 'base64'), 'sha256'), 'hex'), 0, nf);
    nf := nf + 1;
  end loop;
  insert into sign_events (envelope_id, signer_idx, kind, version, contact_hash) values (v_id, 0, 'created', 0, sign__hash(p_created_by));
  return jsonb_build_object('token', p_token, 'files', nf, 'signers', n);
end $$;

-- ============================================================
-- sign_envelope_get — anyone with the token sees title/status/masked roster; a party also gets the files
-- ============================================================
create or replace function sign_envelope_get(p_token text, p_secret text, p_ip_hash text default null, p_user_agent text default null)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare e sign_envelopes; v_party int := -1; v_h text;
begin
  select * into e from sign_envelopes where token = p_token for update;
  if not found then raise exception 'not_found'; end if;
  if e.status = 'awaiting' and e.expires_at is not null and e.expires_at < now() then
    update sign_envelopes set status = 'expired', updated_at = now() where id = e.id; e.status := 'expired';
  end if;
  if coalesce(p_secret, '') <> '' then
    v_h := sign__hash(p_secret);
    select (ord - 1) into v_party from jsonb_array_elements(e.signers) with ordinality as t(s, ord) where s->>'secret_hash' = v_h limit 1;
    if v_party is null then
      v_party := -1;
      update sign_envelopes set failed_attempts = case when locked_until is not null and locked_until < now() then 1 else failed_attempts + 1 end,
        locked_until = case when failed_attempts + 1 >= 20 then now() + interval '1 hour' else locked_until end, updated_at = now()
      where id = e.id returning * into e;
      insert into sign_events (envelope_id, kind, ip_hash, user_agent) values (e.id, 'refused', p_ip_hash, left(p_user_agent, 300));
    else
      insert into sign_events (envelope_id, signer_idx, kind, ip_hash, user_agent) values (e.id, v_party, 'viewed', p_ip_hash, left(p_user_agent, 300));
    end if;
  end if;
  return sign__shape(e, v_party, v_party >= 0);
end $$;

-- ============================================================
-- sign_envelope_sign — the current signer, with its secret, replaces every file with its stamped version
-- ============================================================
create or replace function sign_envelope_sign(
  p_token text, p_signer_idx int, p_secret text, p_files jsonb, p_chain text, p_ip_hash text default null, p_user_agent text default null
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare e sign_envelopes; v_h text; v_cur int; v_n int; f jsonb; v_last boolean; v_ver int; v_signers jsonb; v_next text := null; v_shas text[]; v_chain text;
begin
  select * into e from sign_envelopes where token = p_token for update;
  if not found then raise exception 'not_found'; end if;
  if e.status = 'awaiting' and e.expires_at is not null and e.expires_at < now() then
    update sign_envelopes set status = 'expired', updated_at = now() where id = e.id; raise exception 'expired';
  end if;
  if e.status <> 'awaiting' then raise exception '%', e.status; end if;
  if e.locked_until is not null and e.locked_until > now() then raise exception 'locked'; end if;
  if p_signer_idx <> e.current_signer_idx then raise exception 'not_your_turn'; end if;
  v_h := sign__hash(p_secret);
  if (e.signers->p_signer_idx->>'secret_hash') is distinct from v_h then
    update sign_envelopes set failed_attempts = case when locked_until is not null and locked_until < now() then 1 else failed_attempts + 1 end,
      locked_until = case when failed_attempts + 1 >= 20 then now() + interval '1 hour' else locked_until end, updated_at = now() where id = e.id;
    insert into sign_events (envelope_id, signer_idx, kind, ip_hash, user_agent) values (e.id, p_signer_idx, 'refused', p_ip_hash, left(p_user_agent, 300));
    raise exception 'bad_secret';
  end if;
  select count(*) into v_n from sign_files where envelope_id = e.id and version = (select max(version) from sign_files where envelope_id = e.id);
  if jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) <> v_n then raise exception 'file_count_mismatch'; end if;
  if (select coalesce(sum(length(f2->>'pdf_base64')), 0) from jsonb_array_elements(p_files) as f2) > 17000000 then raise exception 'envelope_too_large'; end if;
  select max(version) + 1 into v_ver from sign_files where envelope_id = e.id;
  v_n := 0;
  for f in select * from jsonb_array_elements(p_files) loop
    if length(coalesce(f->>'pdf_base64', '')) > 4300000 then raise exception 'file_too_large'; end if;
    insert into sign_files (envelope_id, name, page_count, pdf_base64, sha256, version, ordinal)
    values (e.id, left(coalesce(f->>'name', 'document.pdf'), 200), coalesce((f->>'page_count')::int, 0), f->>'pdf_base64',
            encode(digest(decode(f->>'pdf_base64', 'base64'), 'sha256'), 'hex'), v_ver, v_n);
    v_n := v_n + 1;
  end loop;
  -- The chain is recomputed HERE from the files just stored, never trusted from the client (Odin,
  -- wave 2): chain_n = sha256(chain_{n-1} || ':' || sha_1 ',' sha_2 ...) in file order — the same
  -- formula lib/sign-envelope.ts chainHash() uses, so client and server agree or the client is wrong.
  -- every sha is computed HERE from the stored bytes — the client's claimed digest is ignored
  select array_agg(encode(digest(decode(fj->>'pdf_base64', 'base64'), 'sha256'), 'hex') order by ord) into v_shas
    from jsonb_array_elements(p_files) with ordinality as t(fj, ord);    -- `fj`, not `f`: `f` is a plpgsql variable here
  v_chain := sign__hash(e.chain || ':' || array_to_string(v_shas, ','));
  v_last := p_signer_idx = jsonb_array_length(e.signers) - 1;
  v_signers := jsonb_set(e.signers, array[p_signer_idx::text, 'signed_at'], to_jsonb(now()), true);
  if not v_last then
    -- mint the next signer's secret now; store the hash; hand the plaintext back exactly once
    v_next := replace(translate(encode(gen_random_bytes(16), 'base64'), '+/', '-_'), '=', '');
    v_signers := jsonb_set(v_signers, array[(p_signer_idx + 1)::text, 'secret_hash'], to_jsonb(sign__hash(v_next)), true);
  end if;
  update sign_envelopes set signers = v_signers, chain = v_chain,
    current_signer_idx = case when v_last then current_signer_idx else current_signer_idx + 1 end,
    status = case when v_last then 'complete' else 'awaiting' end,
    completed_at = case when v_last then now() else null end, updated_at = now()
  where id = e.id returning * into e;
  insert into sign_events (envelope_id, signer_idx, kind, file_shas, version, contact_hash, ip_hash, user_agent)
  values (e.id, p_signer_idx, 'signed', v_shas, v_ver, sign__hash(e.signers->p_signer_idx->>'contact'), p_ip_hash, left(p_user_agent, 300));
  return sign__shape(e, p_signer_idx, true) || jsonb_build_object('next_secret', v_next);
end $$;

-- ============================================================
-- sign_envelope_revoke — the creator (signer 0) withdraws an awaiting envelope
-- ============================================================
create or replace function sign_envelope_revoke(p_token text, p_secret text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare e sign_envelopes;
begin
  select * into e from sign_envelopes where token = p_token for update;
  if not found then raise exception 'not_found'; end if;
  if (e.signers->0->>'secret_hash') is distinct from sign__hash(p_secret) then raise exception 'bad_secret'; end if;
  if e.status <> 'awaiting' then raise exception '%', e.status; end if;
  update sign_envelopes set status = 'revoked', revoked_at = now(), updated_at = now() where id = e.id returning * into e;
  insert into sign_events (envelope_id, signer_idx, kind) values (e.id, 0, 'revoked');
  return sign__shape(e, 0, false);
end $$;

-- ============================================================
-- grants — the four entry points only; helpers stay private
-- ============================================================
revoke all on function sign__hash(text) from public, anon, authenticated;
revoke all on function sign__mask(text) from public, anon, authenticated;
revoke all on function sign__shape(sign_envelopes, int, boolean) from public, anon, authenticated;
revoke all on function sign_envelope_create(text, text, text, jsonb, jsonb, timestamptz) from public;
revoke all on function sign_envelope_get(text, text, text, text) from public;
revoke all on function sign_envelope_sign(text, int, text, jsonb, text, text, text) from public;
revoke all on function sign_envelope_revoke(text, text) from public;
grant execute on function sign_envelope_create(text, text, text, jsonb, jsonb, timestamptz) to anon, authenticated;
grant execute on function sign_envelope_get(text, text, text, text) to anon, authenticated;
grant execute on function sign_envelope_sign(text, int, text, jsonb, text, text, text) to anon, authenticated;
grant execute on function sign_envelope_revoke(text, text) to anon, authenticated;

comment on table sign_envelopes is 'Sign Doc envelopes: per-signer secret hashes, turn order, 30-day expiry; RLS forced; four SECURITY DEFINER RPCs are the only client path.';
comment on table sign_files is 'Every version of every PDF in an envelope (base64 ≤ 3 MB; storage_url reserved for R2).';
comment on table sign_events is 'Append-only signature evidence: created/viewed/signed/refused/revoked with contact/ip hashes.';
