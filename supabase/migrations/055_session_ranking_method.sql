-- 055: per-session ranking method (live 9-theme prioritization, P1). Additive only: one nullable column, no default
-- rewrite, no drops. NULL = 'borda_count' (the existing behaviour). 'top3_points' = the original design's Round 2:
-- each participant picks their top 1–3 themes per Theme01 category (Support / Concerns / Neutral), scored 3/2/1.
-- Numbering: 053 is used twice and 054 is claimed by PR #16 (sensor_fusion_correction_binding); 055 is free.
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS ranking_method VARCHAR(30);
