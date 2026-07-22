-- HWR Tier-2 bulk absorb RPC — collapse N per-row INSERTs into ONE call.
-- ============================================================================
-- Migration-only. Operator applies to live Supabase. Idempotent. This is the
-- server side of `core/rcore/write_rotor.absorb_bulk`: a client sends ONE JSONB
-- array and the DB absorbs it in a single round-trip via jsonb_to_recordset —
-- turning 1M per-response calls into ~100 chunked bulk calls (Tier 2 of the
-- 4-tier HWR distributor). Postgres computes the face on ingest, so no Python
-- hashing on the hot path; dedup is the destination table's UNIQUE constraint.
--
-- SACRED CODE NOTE (CLAUDE.md Trinity Redundancy): this adds a NEW function only.
-- It does NOT touch `responses`/`participants` or any policy feeding the LOCKED
-- live-feed. The single-response live path keeps its exact 3-path delivery; this
-- RPC is for BULK/high-throughput ingest (bulk import, SIM replay, 1M absorb).

-- ── hwr_absorb(payload jsonb) — bulk insert into response_meta with face routing ──
-- payload = a JSON ARRAY of row objects. Each row's hwr_face is computed by Postgres
-- (hashtextextended % 6) so routing agrees with write_rotor.rotor_face's 6-face oracle.
-- Returns the count actually inserted (ON CONFLICT DO NOTHING = the UNIQUE-constraint dedup).
CREATE OR REPLACE FUNCTION hwr_absorb(payload jsonb)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  inserted integer := 0;
BEGIN
  -- Guard: only run when the ring column exists (026 STEP 1 applied); else no-op 0.
  IF to_regclass('public.response_meta') IS NULL THEN
    RETURN 0;
  END IF;

  WITH rows AS (
    SELECT *
    FROM jsonb_to_recordset(payload) AS r(
      session_id   uuid,
      question_id  uuid,
      participant_id uuid,
      source       text,
      raw_text     text,
      char_count   integer
    )
  ),
  ins AS (
    INSERT INTO response_meta (session_id, question_id, participant_id, source, raw_text, char_count, hwr_face)
    SELECT session_id, question_id, participant_id, source, raw_text, char_count,
           (abs(hashtextextended(coalesce(session_id::text, '') || ':' || coalesce(raw_text, ''), 0)) % 6)::smallint
    FROM rows
    ON CONFLICT DO NOTHING          -- UNIQUE-constraint dedup = the coalesce(dedup_key) analogue
    RETURNING 1
  )
  SELECT count(*) INTO inserted FROM ins;

  RETURN inserted;
END $$;

-- Usage (Tier 2, one round-trip per chunk of ~5-10k rows instead of N calls):
--   SELECT hwr_absorb('[{"session_id":"…","raw_text":"…","char_count":42}, …]'::jsonb);
-- The client-side rotor (frontend/lib/hwr-client.ts) batches + dedups before the call;
-- Postgres routes each row to its face partition (once 026 STEP 2 provisions the 6-way
-- HASH partitions) with zero Python hashing on the hot path.
