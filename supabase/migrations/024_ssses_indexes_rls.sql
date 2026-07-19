-- SSSES pass — hot-path indexes + RLS hardening (Session 10, Item C1 + Item D4).
-- ============================================================================
-- Migration-only. Like 022/023, the code no-ops until the operator applies this
-- to the live Supabase. Idempotent: every statement is IF NOT EXISTS / guarded.
--
-- SACRED CODE NOTE (CLAUDE.md Trinity Redundancy): this migration ONLY adds
-- indexes and one DELETE policy. It does NOT touch the anon SELECT/INSERT
-- policies on `responses`/`participants` that feed the LOCKED live-feed. Indexes
-- are transparent to reads and writes — they speed queries without changing
-- behavior or row visibility.

-- ── 1. Perf indexes on hot paths ──────────────────────────────────────────────
-- `responses` exists in production with (session_code, participant_id, content,
-- created_at) — see 001_initial_schema.sql. Index only those real columns
-- (question_id does not exist on this table yet, so it is intentionally omitted).
CREATE INDEX IF NOT EXISTS idx_responses_session_code   ON responses(session_code);
CREATE INDEX IF NOT EXISTS idx_responses_created_at      ON responses(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_participant_id  ON responses(participant_id);

-- Audit log time scans (CRS-01 compliance queries) + feedback triage filter.
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at     ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_product_feedback_resolved ON product_feedback(is_resolved);

-- ── 2. architect_saved_files DELETE policy (Item D4) ──────────────────────────
-- 022/023 defined SELECT/INSERT/UPDATE but no DELETE, so a caller could never
-- remove its own cloud snapshot. Add a DELETE policy with the same non-empty
-- owner_key guard as 023 (defense-in-depth; not true tenant isolation — see below).
DROP POLICY IF EXISTS "Owners delete their saved files" ON architect_saved_files;
CREATE POLICY "Owners delete their saved files"
  ON architect_saved_files FOR DELETE
  TO anon, authenticated
  USING (owner_key IS NOT NULL AND length(owner_key) > 0);

-- ── 3. mot_emblem_config anon UPDATE — KNOWN EXPOSURE (documented, NOT changed) ─
-- 019 shipped `for update using(true) with check(true)`, so ANY anonymous caller
-- can overwrite the single global emblem row. The proper fix is NOT applied here
-- on purpose: the app authenticates with Auth0, not Supabase Auth, so the emblem
-- editor writes via the ANON key. Restricting this policy to `service_role` /
-- `authenticated` (a Supabase JWT the app never holds) would BREAK the live admin
-- emblem editor — a regression we will not ship blind.
--
-- RECOMMENDED FIX (operator milestone, needs a code change too): route emblem
-- writes through a backend endpoint that uses the service_role key + an admin
-- check (email == explore@eXeL-AI.com), then tighten this policy to service_role
-- only. Until that endpoint exists, this stays open by necessity. Tracked, honest.
