-- Atlantis Accords short-link store.
--
-- Holds ONLY the sealed package (AES-GCM ciphertext + public cover meta) under a
-- short 7-char hash. The 4-digit / glyph unlock code NEVER touches this table —
-- it travels out-of-band between sender and recipient — so the backend is
-- zero-knowledge: a full table dump yields ciphertext without the key.
--
-- Run once in the Supabase SQL editor. The front end reads NEXT_PUBLIC_SUPABASE_URL
-- + NEXT_PUBLIC_SUPABASE_ANON_KEY (already configured for the rest of the app).

create table if not exists public.atlantis_seals (
  hash        text primary key,
  payload     text not null,               -- sealed package JSON (ciphertext + meta)
  created_at  timestamptz not null default now()
);

alter table public.atlantis_seals enable row level security;

-- Anyone may create a sealed link (insert ciphertext).
drop policy if exists atlantis_seals_insert on public.atlantis_seals;
create policy atlantis_seals_insert on public.atlantis_seals
  for insert to anon, authenticated with check (true);

-- Anyone holding the hash (the capability) may read the ciphertext…
drop policy if exists atlantis_seals_select on public.atlantis_seals;
create policy atlantis_seals_select on public.atlantis_seals
  for select to anon, authenticated using (true);

-- …and delete it (burn / one-time open — the reader deletes on close/seal).
drop policy if exists atlantis_seals_delete on public.atlantis_seals;
create policy atlantis_seals_delete on public.atlantis_seals
  for delete to anon, authenticated using (true);

-- Optional housekeeping: sweep seals older than 90 days (run via pg_cron if desired).
--   delete from public.atlantis_seals where created_at < now() - interval '90 days';
