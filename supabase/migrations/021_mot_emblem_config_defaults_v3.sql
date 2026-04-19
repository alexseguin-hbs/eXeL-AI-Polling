-- ==========================================================================
-- Migration 021 — Master of Thought emblem defaults v3
-- ==========================================================================
-- Second user-supplied calibration via the Thought Master edit panel.
-- Applies the v3 values: center (201, 189), verticalStretch 1.05, all 5
-- outer arcs at fontSize 16 with adjusted radii/spans, inner arc at fs 14.
-- Idempotent — safe to re-run.
-- ==========================================================================

update mot_emblem_config
set
  center_cx = 201,
  center_cy = 189,
  outer_arcs = '[
    {"label":"Humanity''s Universal Challenge","cuneiform":"\ud808\udc3d  \ud808\udc28 \ud808\udd17   \ud808\udcf7  \ud808\udd60","startAngle":-90,"span":91,"clockwise":true,"radius":120,"fontSize":16},
    {"label":"Divinity Guide","cuneiform":"\ud808\udc97 \ud808\udc01 \ud808\udc7a","startAngle":194,"span":54,"clockwise":true,"radius":118,"fontSize":16},
    {"label":"Book of Thoth","cuneiform":"\ud808\udc7e  \ud808\udd17  \ud808\udcff","startAngle":-13,"span":54,"clockwise":true,"radius":116,"fontSize":16},
    {"label":"Flower of Life","cuneiform":"\ud808\udcf1 \ud808\udc51 \ud808\udc01 \ud808\udd63","startAngle":128,"span":72,"clockwise":false,"radius":127,"fontSize":16},
    {"label":"Emerald Tablets","cuneiform":"\ud808\udc7e  \ud808\udd00  \ud808\udd3e \ud808\udd3e","startAngle":53,"span":72,"clockwise":false,"radius":129,"fontSize":16}
  ]'::jsonb,
  inner_arc = '{"label":"Master of Thought","cuneiform":"\ud808\udc97 \ud808\udcd5  \ud808\udd20","startAngle":-90,"span":79,"clockwise":true,"radius":58,"fontSize":14}'::jsonb,
  updated_by = 'thought_master',
  updated_at = now()
where id = 'current';
