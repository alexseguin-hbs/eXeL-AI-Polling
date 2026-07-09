-- SECURITY-2525 · shared map-tile cache (the Supabase rung of the tile ladder)
-- Run once in the Supabase SQL editor. Until it exists, the client falls back to
-- origin (static /security-2525/*.json) automatically — nothing breaks without it.

create table if not exists public.map_tiles (
  tile_key   text primary key,          -- e.g. "dem-austin", "osm-houston"
  face       text not null default 'dem',-- elevation | vector | imagery | grid | tracks | governance
  payload    jsonb not null,            -- the tile JSON (DEM grid / OSM roads+water / ...)
  updated_at timestamptz not null default now()
);

create index if not exists map_tiles_face_idx on public.map_tiles (face);

-- The tile cache is non-sensitive derived geodata (GEBCO / OpenStreetMap, public sources).
-- Allow anon read + write-through so any operator warms the cache for the whole team.
alter table public.map_tiles enable row level security;

drop policy if exists map_tiles_read on public.map_tiles;
create policy map_tiles_read on public.map_tiles
  for select using (true);

drop policy if exists map_tiles_write on public.map_tiles;
create policy map_tiles_write on public.map_tiles
  for insert with check (true);

drop policy if exists map_tiles_update on public.map_tiles;
create policy map_tiles_update on public.map_tiles
  for update using (true) with check (true);

-- Optional hardening later: restrict write to authenticated operators, add a size cap,
-- and a TTL/eviction job. For now the cache is best-effort and self-healing.
