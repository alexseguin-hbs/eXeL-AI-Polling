-- Hot-path composite index for the live-feed poll (Supabase optimization).
-- ============================================================================
-- Migration-only, like 022/023/024: the app no-ops until the operator applies
-- this to the live Supabase. Idempotent (IF NOT EXISTS).
--
-- SACRED CODE NOTE (CLAUDE.md Trinity Redundancy): this migration ONLY adds an
-- index. It does NOT touch the anon SELECT/INSERT policies or any row on the
-- LOCKED live-feed. An index is transparent to reads and writes — it speeds the
-- query without changing behavior or row visibility.
--
-- WHY: the moderator dashboard live feed polls, once every 2s per open session
--   (frontend/app/dashboard/page.tsx), exactly:
--     SELECT id, content, created_at
--       FROM responses
--      WHERE session_code = $1 AND created_at > $2      -- since-cursor
--      ORDER BY created_at ASC
--      LIMIT 20;
--   Migration 024 added SINGLE-column indexes on responses(session_code) and
--   responses(created_at). For this query Postgres must bitmap-AND the two and
--   then sort — at 100K concurrent sessions that is the dominant DB cost.
--   A COMPOSITE (session_code, created_at) index serves the equality + range +
--   ORDER BY + LIMIT as one ordered index range scan (no separate sort), which
--   is the single highest-leverage, zero-risk Supabase optimization on the hot
--   path. It leaves 024's single-column indexes in place (still useful for a
--   participant_id lookup or a session-agnostic created_at scan).
--
-- Prereq: migration 024 must be applied first (it creates the `responses`
--   hot-path indexes this composite complements). This migration is safe to run
--   independently and repeatedly.

CREATE INDEX IF NOT EXISTS idx_responses_session_code_created
  ON responses (session_code, created_at);

-- Optional supporting composite for the moderator's postgres_changes / audit
-- time scans scoped to a session (transparent; no behavior change).
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_created
  ON audit_logs (session_id, created_at);
