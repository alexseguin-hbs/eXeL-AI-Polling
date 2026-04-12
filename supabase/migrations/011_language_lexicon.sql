-- ==========================================================================
-- Migration 011 — Language Lexicon in Supabase
-- ==========================================================================
-- Single source of truth for all UI/UX translations.
-- Frontend loads from this table on init, caches in localStorage.
-- Admin edits via Language Lexicon panel write back to this table.
-- New languages/phrases added here propagate to all clients automatically.
-- ==========================================================================

-- Languages master table (34 languages)
create table if not exists lexicon_languages (
  code text primary key,                    -- ISO 639-1 (e.g., "en", "km")
  name_en text not null,                    -- English name
  name_native text not null,                -- Native name (e.g., "ខ្មែរ")
  direction text default 'ltr' check (direction in ('ltr', 'rtl')),
  status text default 'approved' check (status in ('approved', 'pending', 'rejected')),
  has_romanization boolean default false,   -- Whether romanization toggle is available
  romanization_system text,                 -- e.g., "Pinyin", "UNGEGN", "Rōmaji"
  proposer_email text,
  approved_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Translation keys master table (701+ keys)
create table if not exists lexicon_keys (
  key text primary key,                     -- e.g., "shared.landing.hero_title_primary"
  english_default text not null,            -- Fallback English text
  context text,                             -- Description for translators
  cube_id integer not null default 0,       -- Which cube owns this key (0=shared)
  created_at timestamptz default now()
);

create index if not exists ix_lexicon_keys_cube on lexicon_keys(cube_id);

-- Translations table (key × language = translated text)
create table if not exists lexicon_translations (
  id uuid primary key default gen_random_uuid(),
  key text not null references lexicon_keys(key) on delete cascade,
  language_code text not null references lexicon_languages(code) on delete cascade,
  translation text not null,
  verified boolean default false,           -- Admin-verified translation
  verified_by text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(key, language_code)                -- One translation per key per language
);

create index if not exists ix_lexicon_trans_key on lexicon_translations(key);
create index if not exists ix_lexicon_trans_lang on lexicon_translations(language_code);
create index if not exists ix_lexicon_trans_key_lang on lexicon_translations(key, language_code);

-- Romanization data (optional pronunciation guides for zh, km, ja, etc.)
create table if not exists lexicon_romanization (
  id uuid primary key default gen_random_uuid(),
  key text not null references lexicon_keys(key) on delete cascade,
  language_code text not null references lexicon_languages(code) on delete cascade,
  romanized_text text not null,             -- e.g., "Zhìlǐ" for 治理
  created_at timestamptz default now(),

  unique(key, language_code)
);

create index if not exists ix_lexicon_roman_key_lang on lexicon_romanization(key, language_code);

-- ─── RLS Policies ──────────────────────────────────────────────────

-- Languages: public read, service write
alter table lexicon_languages enable row level security;
create policy "lexicon_lang_public_read" on lexicon_languages for select using (true);
create policy "lexicon_lang_service_write" on lexicon_languages for insert with check (auth.role() = 'service_role');
create policy "lexicon_lang_service_update" on lexicon_languages for update using (auth.role() = 'service_role');

-- Keys: public read, service write
alter table lexicon_keys enable row level security;
create policy "lexicon_keys_public_read" on lexicon_keys for select using (true);
create policy "lexicon_keys_service_write" on lexicon_keys for insert with check (auth.role() = 'service_role');
create policy "lexicon_keys_service_update" on lexicon_keys for update using (auth.role() = 'service_role');

-- Translations: public read, service write
alter table lexicon_translations enable row level security;
create policy "lexicon_trans_public_read" on lexicon_translations for select using (true);
create policy "lexicon_trans_service_write" on lexicon_translations for insert with check (auth.role() = 'service_role');
create policy "lexicon_trans_service_update" on lexicon_translations for update using (auth.role() = 'service_role');
create policy "lexicon_trans_service_delete" on lexicon_translations for delete using (auth.role() = 'service_role');

-- Romanization: public read, service write
alter table lexicon_romanization enable row level security;
create policy "lexicon_roman_public_read" on lexicon_romanization for select using (true);
create policy "lexicon_roman_service_write" on lexicon_romanization for insert with check (auth.role() = 'service_role');

-- ─── Realtime ──────────────────────────────────────────────────────
-- Enable realtime so admin edits propagate instantly to connected clients
do $$ begin
  alter publication supabase_realtime add table lexicon_translations;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table lexicon_languages;
exception when duplicate_object then null;
end $$;
