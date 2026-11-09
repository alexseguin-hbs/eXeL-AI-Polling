-- 060 (2026-11-09) CRS-38 Round 3 Expert Opinion. ADDITIVE ONLY: two new tables; no drops.
-- Moderator designates up to N experts per session; each expert submits Concerns / Neutral / Support
-- summaries for a chosen theme; an AI 1-pager is marked ready only after 3 expert packets + audit.
-- Numbering: 059 = Round 1 auto-select (expert-paytoview); 060 is next free.
CREATE TABLE IF NOT EXISTS public.expert_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  expert_user_id TEXT,
  expert_participant_id UUID REFERENCES public.participants(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL,
  invited_by TEXT NOT NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'invited',
  CONSTRAINT expert_assignments_status_chk CHECK (status IN ('invited', 'accepted', 'submitted', 'revoked')),
  CONSTRAINT expert_assignments_identity_chk CHECK (
    expert_user_id IS NOT NULL OR expert_participant_id IS NOT NULL
  )
);
CREATE INDEX IF NOT EXISTS expert_assignments_session_idx ON public.expert_assignments(session_id);

CREATE TABLE IF NOT EXISTS public.expert_opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES public.expert_assignments(id) ON DELETE CASCADE,
  support_summary TEXT NOT NULL DEFAULT '',
  risk_summary TEXT NOT NULL DEFAULT '',
  neutral_summary TEXT NOT NULL DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_by TEXT NOT NULL,
  UNIQUE (assignment_id, theme_id)
);
CREATE INDEX IF NOT EXISTS expert_opinions_session_theme_idx ON public.expert_opinions(session_id, theme_id);

CREATE TABLE IF NOT EXISTS public.expert_opinion_pagers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  theme_id UUID NOT NULL REFERENCES public.themes(id) ON DELETE CASCADE,
  pager_text TEXT NOT NULL DEFAULT '',
  ready BOOLEAN NOT NULL DEFAULT false,
  opinion_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ready_at TIMESTAMPTZ,
  UNIQUE (session_id, theme_id)
);

-- RLS: service role / API host only (same pattern as other API-managed tables)
ALTER TABLE public.expert_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_opinion_pagers ENABLE ROW LEVEL SECURITY;
