-- ==========================================================================
-- Migration 019 — Master of Thought emblem config (Cube 12)
-- ==========================================================================
-- Single-row config table holding the current placement of the MoT cuneiform
-- arcs (Humanity's Universal Challenge, Divinity Guide, Book of Thoth, Flower
-- of Life, Emerald Tablets) + inner "Master of Thought" arc + emblem center.
--
-- Admin Console (Thought Master) writes to this table via the edit panel.
-- All frontend clients load the latest row on mount and subscribe to
-- Realtime changes so live edits propagate to every user instantly.
-- ==========================================================================

create table if not exists mot_emblem_config (
  id text primary key default 'current'
    check (id = 'current'),               -- single-row enforcement
  center_cx numeric not null default 200,
  center_cy numeric not null default 200,
  outer_arcs jsonb not null,              -- Array<CuneiformArc>
  inner_arc jsonb not null,               -- CuneiformArc
  updated_at timestamptz not null default now(),
  updated_by text                         -- optional: who inscribed (e.g. 'thought_master')
);

-- Seed the single row with current hardcoded defaults (app falls back to
-- these anyway if the row is absent, so this is purely for explicitness).
insert into mot_emblem_config (id, center_cx, center_cy, outer_arcs, inner_arc)
values (
  'current',
  200,
  200,
  '[
    {"label":"Humanity''s Universal Challenge","cuneiform":"\ud808\udc3d  \ud808\udc28 \ud808\udd17   \ud808\udcf7  \ud808\udd60","startAngle":-90,"span":72,"clockwise":true,"radius":123,"fontSize":14},
    {"label":"Divinity Guide","cuneiform":"\ud808\udc97 \ud808\udc01 \ud808\udc7a","startAngle":197,"span":32,"clockwise":true,"radius":116,"fontSize":14},
    {"label":"Book of Thoth","cuneiform":"\ud808\udc7e  \ud808\udd17  \ud808\udcff","startAngle":-17,"span":40,"clockwise":true,"radius":116,"fontSize":14},
    {"label":"Flower of Life","cuneiform":"\ud808\udcf1 \ud808\udc51 \ud808\udc01 \ud808\udd63","startAngle":132,"span":48,"clockwise":false,"radius":113,"fontSize":14},
    {"label":"Emerald Tablets","cuneiform":"\ud808\udc7e  \ud808\udd00  \ud808\udd3e \ud808\udd3e","startAngle":46,"span":60,"clockwise":false,"radius":117,"fontSize":14}
  ]'::jsonb,
  '{"label":"Master of Thought","cuneiform":"\ud808\udc97 \ud808\udcd5  \ud808\udd20","startAngle":-90,"span":50,"clockwise":true,"radius":68,"fontSize":13}'::jsonb
)
on conflict (id) do nothing;

-- Realtime: push row-level changes to all connected clients
do $$ begin
  alter publication supabase_realtime add table mot_emblem_config;
exception when duplicate_object then null;
end $$;

-- Row-level security: anyone can read; writes are gated by the edit code
-- enforced client-side for now. (A future iteration can move the write
-- through a backend endpoint that verifies the admin code server-side.)
alter table mot_emblem_config enable row level security;

drop policy if exists "mot_emblem_config_public_read" on mot_emblem_config;
create policy "mot_emblem_config_public_read"
  on mot_emblem_config for select
  using (true);

drop policy if exists "mot_emblem_config_anon_write" on mot_emblem_config;
create policy "mot_emblem_config_anon_write"
  on mot_emblem_config for update
  using (true)
  with check (true);

-- Touch updated_at on every update
create or replace function set_mot_emblem_config_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_mot_emblem_config_updated_at on mot_emblem_config;
create trigger trg_mot_emblem_config_updated_at
  before update on mot_emblem_config
  for each row execute function set_mot_emblem_config_updated_at();
