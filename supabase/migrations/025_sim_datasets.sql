-- Supabase-source simulation datasets (operator: "CSV can't be source — SQL 101").
-- ============================================================================
-- Migration-only. Like 022/023/024, the code no-ops until the operator applies
-- this to the live Supabase. `core/dataset_source.py` queries this table FIRST and
-- falls back to the committed CSV seed only when the table is absent (offline/CI).
-- Idempotent: every statement is IF NOT EXISTS / guarded.
--
-- SACRED CODE NOTE (CLAUDE.md Trinity Redundancy): this migration adds a NEW table
-- only. It does NOT touch `responses`/`participants` or any policy feeding the
-- LOCKED live-feed.

-- ── 1. sim_datasets — the 20-column export schema (CSV_COLUMNS) + locator keys ──
-- Column order mirrors app/cubes/cube9_reports/service.py CSV_COLUMNS exactly, so a
-- COPY from the 20-col seed CSV lines up 1:1 (after the dataset_name/row_index keys).
CREATE TABLE IF NOT EXISTS sim_datasets (
  id                        BIGSERIAL   PRIMARY KEY,
  dataset_name              TEXT        NOT NULL,   -- e.g. 'sim_use_case_1000', 'demo'
  row_index                 INTEGER     NOT NULL,   -- stable ORDER BY key (0-based)
  "Q_Number"                TEXT,
  "Question"                TEXT,
  "User"                    TEXT,
  "Detailed_Results"        TEXT,
  "Response_Language"       TEXT,
  "333_Summary"             TEXT,
  "111_Summary"             TEXT,
  "33_Summary"              TEXT,
  "Theme01"                 TEXT,
  "Theme01_Category"        TEXT,        -- the 20th additive slice key (risk/support/neutral)
  "Theme01_Confidence"      TEXT,
  "Theme2_9"                TEXT,
  "Theme2_9_Confidence"     TEXT,
  "Theme2_9_Description"    TEXT,
  "Theme2_6"                TEXT,
  "Theme2_6_Confidence"     TEXT,
  "Theme2_6_Description"    TEXT,
  "Theme2_3"                TEXT,
  "Theme2_3_Confidence"     TEXT,
  "Theme2_3_Description"    TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dataset_name, row_index)
);

-- ── 2. Hot-path index — the loader filters by dataset_name and ORDER BY row_index ──
CREATE INDEX IF NOT EXISTS idx_sim_datasets_name_row
  ON sim_datasets (dataset_name, row_index);

-- ── 3. RLS — read-mostly reference data (defense in depth; not tenant isolation) ──
ALTER TABLE sim_datasets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sim_datasets readable" ON sim_datasets;
CREATE POLICY "sim_datasets readable"
  ON sim_datasets FOR SELECT
  TO anon, authenticated
  USING (true);
-- Writes are seed-time only (service_role / COPY), so no anon INSERT/UPDATE policy.

-- ── 4. Seed note (operator runs once, out-of-band) ────────────────────────────
--   \copy sim_datasets(dataset_name,row_index,"Q_Number",...,"Theme2_3_Description")
--        FROM 'sim_use_case_1000.csv' WITH (FORMAT csv, HEADER true);
--   (prefix each row's dataset_name + row_index, or load via a staging table.)
-- Once seeded, dataset_source.load_dataset() returns Supabase rows and the CSV
-- becomes a bootstrap seed only — "CSV is not the source" holds true.
