-- 033 · vision2525_i18n — language-pack storage for the Vision 2525 white paper
-- ============================================================================================
-- WHY: today each of the 33 languages is a ~6.4 MB self-contained HTML file committed to the repo
-- (~210 MB at full coverage). The source of truth is the small per-language block map
-- (docs/i18n/vision2525.<lang>.json). This table stores those maps so the white paper can fetch a
-- language pack at runtime and overlay it onto the static English document (via the existing
-- replay() hook), instead of shipping a full HTML file per language. English stays static and
-- self-contained (offline + gate-deterministic); every other language is a set of rows here.
--
-- DATA CLASSIFICATION: PUBLIC. These are translations of a public document — there is nothing
-- private here, so a permissive anon READ policy is correct (contrast innovation_state/030, which
-- guarded private per-browser data). Writes are service-role only (the upload script); the anon
-- key can read but never mutate.
-- ============================================================================================

create table if not exists public.vision2525_i18n (
  lang        text        not null,           -- ISO code: fr, es, de, ... (never 'en'; English is the static base)
  block_id    text        not null,           -- ledger block id, e.g. "unit.payout", "paper.toc"
  html        text        not null,           -- translated block HTML (entities/SVG/base64 preserved)
  doc_version integer     not null default 208,-- release the pack targets (#dlrel2)
  updated_at  timestamptz not null default now(),
  primary key (lang, block_id, doc_version)
);

-- Fast per-language pack fetch: select block_id, html where lang=? and doc_version=?
create index if not exists vision2525_i18n_lang_ver_idx
  on public.vision2525_i18n (lang, doc_version);

alter table public.vision2525_i18n enable row level security;

-- Public read: anyone (anon) may read language packs. Idempotent create.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'vision2525_i18n' and policyname = 'vision2525_i18n_public_read'
  ) then
    create policy vision2525_i18n_public_read
      on public.vision2525_i18n for select
      to anon, authenticated
      using (true);
  end if;
end $$;

-- No anon/authenticated write policies exist, so with RLS on, INSERT/UPDATE/DELETE are denied to
-- the public key. The upload script uses the service-role key, which bypasses RLS.
grant select on public.vision2525_i18n to anon, authenticated;
