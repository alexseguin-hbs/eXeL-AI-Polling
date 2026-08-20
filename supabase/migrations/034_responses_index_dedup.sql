-- 034 · responses index de-duplication (post-r230 Supabase optimization)
--
-- WHY: migration 024 created the single-column index idx_responses_session_code(session_code).
-- Migration 031 later added the composite idx_responses_session_code_created(session_code, created_at).
-- A B-tree composite whose LEADING column is session_code fully serves every session_code-only
-- lookup, so the single-column index is now redundant — it only adds write cost on the hottest
-- path in the whole system: the Trinity-Redundancy response INSERT (three parallel delivery paths
-- per response). Removing a redundant index speeds every INSERT and shrinks storage with ZERO
-- query regression (the planner uses the composite for session_code-only reads).
--
-- SACRED CODE NOTE (CLAUDE.md Trinity Redundancy): this migration touches NO row, NO policy, and
-- NO delivery code. It removes ONE redundant index only. The composite from 031 remains and covers
-- both `WHERE session_code = ?` and `WHERE session_code = ? ORDER BY created_at` — the live feed
-- query — so read performance is unchanged or better (smaller index set to plan over).
--
-- SAFETY: DROP INDEX CONCURRENTLY takes no table lock (the responses table keeps serving reads and
-- writes throughout). It CANNOT run inside a transaction block — run this migration statement on
-- its own (the Supabase SQL editor runs it outside a transaction by default). Fully reversible:
-- recreate with  CREATE INDEX CONCURRENTLY idx_responses_session_code ON responses(session_code);
--
-- Prereq: migration 031 must be applied first (it creates the composite this de-dup relies on).

DROP INDEX CONCURRENTLY IF EXISTS idx_responses_session_code;

-- Verification (optional): the composite should be the index chosen for a session lookup.
--   EXPLAIN SELECT * FROM responses WHERE session_code = 'DEMO2026' ORDER BY created_at;
--   -> expect an Index Scan using idx_responses_session_code_created
