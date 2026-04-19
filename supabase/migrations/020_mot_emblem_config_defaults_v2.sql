-- ==========================================================================
-- Migration 020 — Master of Thought emblem defaults v2
-- ==========================================================================
-- User-supplied final calibration (center + 5 outer arcs + inner arc),
-- captured via the Thought Master edit panel. Updates the 'current' row
-- if present; idempotent no-op if the row was deleted or the table
-- doesn't exist yet (019 must be applied first).
-- ==========================================================================

update mot_emblem_config
set
  center_cx = 201,
  center_cy = 190,
  outer_arcs = '[
    {"label":"Humanity''s Universal Challenge","cuneiform":"\ud808\udc3d  \ud808\udc28 \ud808\udd17   \ud808\udcf7  \ud808\udd60","startAngle":-90,"span":72,"clockwise":true,"radius":114,"fontSize":15},
    {"label":"Divinity Guide","cuneiform":"\ud808\udc97 \ud808\udc01 \ud808\udc7a","startAngle":194,"span":32,"clockwise":true,"radius":116,"fontSize":15},
    {"label":"Book of Thoth","cuneiform":"\ud808\udc7e  \ud808\udd17  \ud808\udcff","startAngle":-13,"span":40,"clockwise":true,"radius":115,"fontSize":15},
    {"label":"Flower of Life","cuneiform":"\ud808\udcf1 \ud808\udc51 \ud808\udc01 \ud808\udd63","startAngle":128,"span":72,"clockwise":false,"radius":123,"fontSize":15},
    {"label":"Emerald Tablets","cuneiform":"\ud808\udc7e  \ud808\udd00  \ud808\udd3e \ud808\udd3e","startAngle":53,"span":72,"clockwise":false,"radius":124,"fontSize":15}
  ]'::jsonb,
  inner_arc = '{"label":"Master of Thought","cuneiform":"\ud808\udc97 \ud808\udcd5  \ud808\udd20","startAngle":-90,"span":79,"clockwise":true,"radius":58,"fontSize":13}'::jsonb,
  updated_by = 'thought_master',
  updated_at = now()
where id = 'current';
