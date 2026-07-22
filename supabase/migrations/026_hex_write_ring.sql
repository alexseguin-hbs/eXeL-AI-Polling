-- Hexagonal Write Rotor (HWR) ring provisioning — activates the write seams.
-- ============================================================================
-- Migration-only. Operator applies to live Supabase. Idempotent (IF NOT EXISTS /
-- guarded). Turning this on is what makes `rotor_adapter.stamp_orm` stop being a
-- no-op: the seam sets `record.hwr_face` only when BOTH settings.hwr_enabled is
-- true AND the model carries the hwr_face column — so applying this migration +
-- flipping HWR_ENABLED is the two-step activation. Until then, every cube write
-- flows down its existing single-table path, byte-for-byte unchanged.
--
-- 6 faces = a cube's 6 faces = hex ring = drone-swarm modular units;
-- 6 faces + 1 hub = Seed of Life. face = sha256(seed:key:seq) mod 6 (see
-- app/core/rcore/write_rotor.py — that seeded selector is the determinism anchor,
-- reproduced here as the partition key so Postgres routing and the Python oracle
-- agree bit-for-bit).
--
-- SACRED CODE NOTE (CLAUDE.md Trinity Redundancy): STEP 1 below only ADDS a
-- nullable smallint column to existing tables — transparent to the LOCKED
-- live-feed (no policy, no read-shape, no visibility change). The full
-- hash-partitioned parent (STEP 2) is provided as commented DDL for a planned,
-- operator-scheduled table rebuild — NOT auto-run, because repartitioning a live
-- table is a maintenance-window operation, never a blind migration.

-- ── STEP 1 · Face column on the four highest-volume write targets (the activator) ──
-- Matches the H4 seams: Cube 4 desired_outcomes · Cube 2/3 responses · Cube 8 ledger.
-- CHECK keeps it in the 0..5 face range; a partial index supports per-face reads.
-- (Table names follow the production schema; each guarded so a missing table is a
-- no-op rather than an error.)

DO $$
BEGIN
  IF to_regclass('public.response_meta') IS NOT NULL THEN
    ALTER TABLE response_meta   ADD COLUMN IF NOT EXISTS hwr_face smallint
      CHECK (hwr_face IS NULL OR (hwr_face >= 0 AND hwr_face < 6));
    CREATE INDEX IF NOT EXISTS idx_response_meta_hwr_face ON response_meta (hwr_face);
  END IF;

  IF to_regclass('public.desired_outcomes') IS NOT NULL THEN
    ALTER TABLE desired_outcomes ADD COLUMN IF NOT EXISTS hwr_face smallint
      CHECK (hwr_face IS NULL OR (hwr_face >= 0 AND hwr_face < 6));
    CREATE INDEX IF NOT EXISTS idx_desired_outcomes_hwr_face ON desired_outcomes (hwr_face);
  END IF;

  IF to_regclass('public.token_ledger') IS NOT NULL THEN
    ALTER TABLE token_ledger    ADD COLUMN IF NOT EXISTS hwr_face smallint
      CHECK (hwr_face IS NULL OR (hwr_face >= 0 AND hwr_face < 6));
    CREATE INDEX IF NOT EXISTS idx_token_ledger_hwr_face ON token_ledger (hwr_face);
  END IF;
END $$;

-- ── STEP 2 · (PLANNED, operator-scheduled) full 6-partition ring + hub ─────────
-- The absorb-fast/coalesce-once design: a HASH-partitioned parent into exactly 6
-- partitions (one per face) so concurrent writers land on different faces with no
-- lock contention, then a hub view unions them for reads. Provided as reviewed DDL;
-- run during a maintenance window when migrating an existing hot table.
--
--   CREATE TABLE response_meta_ring (LIKE response_meta INCLUDING ALL, hwr_face smallint NOT NULL)
--     PARTITION BY HASH (hwr_face);
--   -- one partition per face (0..5):
--   CREATE TABLE response_meta_ring_f0 PARTITION OF response_meta_ring FOR VALUES WITH (MODULUS 6, REMAINDER 0);
--   CREATE TABLE response_meta_ring_f1 PARTITION OF response_meta_ring FOR VALUES WITH (MODULUS 6, REMAINDER 1);
--   CREATE TABLE response_meta_ring_f2 PARTITION OF response_meta_ring FOR VALUES WITH (MODULUS 6, REMAINDER 2);
--   CREATE TABLE response_meta_ring_f3 PARTITION OF response_meta_ring FOR VALUES WITH (MODULUS 6, REMAINDER 3);
--   CREATE TABLE response_meta_ring_f4 PARTITION OF response_meta_ring FOR VALUES WITH (MODULUS 6, REMAINDER 4);
--   CREATE TABLE response_meta_ring_f5 PARTITION OF response_meta_ring FOR VALUES WITH (MODULUS 6, REMAINDER 5);
--   -- hub (coalesced read surface): the parent is read transparently, so no view is
--   -- required; add response_meta_hub as a MATERIALIZED VIEW only if a pre-coalesced
--   -- snapshot is wanted (REFRESH after each absorb batch — "pull together formally
--   -- once processed"). Dedup at the hub is the PRIMARY KEY / UNIQUE constraint,
--   -- which is exactly what coalesce(dedup_key="id") mirrors in the Python oracle.
--
-- After STEP 2, point the adapter's read_target at the parent; STEP 1's column on
-- the legacy table remains a valid, non-breaking intermediate state.
