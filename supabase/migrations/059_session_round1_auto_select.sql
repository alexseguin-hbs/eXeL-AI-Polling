-- 059 (2026-11-09) CRS-36 Round 1 variable auto-select. ADDITIVE ONLY: three nullable columns on
-- public.sessions; no defaults rewritten, no drops, no data changes.
-- When auto_select_percent and/or auto_select_n are set, Cube 7 computes a per-category Theme02
-- shortlist (ordered from the live AggregatedRanking when present) into auto_select_theme_ids.
-- Round 2 ballots may only pick from that set; non-selected themes stay reviewable.
-- Numbering: 056 = final decision (voting-gaps), 057/058 = Architect; 059 is free.
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS auto_select_percent DOUBLE PRECISION;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS auto_select_n INTEGER;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS auto_select_theme_ids JSONB;
