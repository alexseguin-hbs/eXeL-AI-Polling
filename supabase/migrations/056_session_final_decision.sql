-- 056 (2026-11-09) CRS-22.04 — moderator final decision with transparency. ADDITIVE ONLY: four nullable columns on
-- public.sessions; no defaults rewritten, no drops, no data changes. When the moderator adopts a theme other than the
-- group's #1, the group's #1 at decision time and the stated reason are kept and shown to participants.
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS final_theme_id UUID;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS final_group_top_theme_id UUID;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS final_decision_reason TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS final_decided_at TIMESTAMP WITH TIME ZONE;
