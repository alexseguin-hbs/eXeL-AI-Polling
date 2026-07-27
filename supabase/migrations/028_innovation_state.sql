-- Innovation Project (Portfolio Prioritization) — durable state for the /innovation tool.
-- Namespaced JSON blobs per (owner_key, name): "config" (admin bundle — pillars · review board ·
-- stack name · dog-tag highlights · biz-setup · glossary · segment library) and per-project
-- namespaces ("signoff" · "ledger" · "drivers" · "edits"). New slices add a namespace or a key
-- WITHOUT a schema change.
--
-- OPTIONAL table: the frontend (lib/innovation-store.ts) degrades gracefully to localStorage if this
-- table is absent — nothing breaks before it is applied. Apply it to promote Innovation config/edits
-- from device-local to durable + cross-device.
--
-- Scoping: one row per (owner_key, name). While behind the eXeL login on the anon key, owner_key is a
-- per-browser id (innovation.ownerId); it swaps to the authenticated user id in a single place
-- (ownerKey()) when accounts land. Mirrors architect_saved_files (migrations 022/023).

CREATE TABLE IF NOT EXISTS innovation_state (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key   TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT 'config',
  payload     JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_key, name)
);

CREATE INDEX IF NOT EXISTS ix_innovation_state_owner ON innovation_state(owner_key);

-- RLS: anon key behind the eXeL login; scope by owner_key (per-browser id now, authenticated user
-- later). A non-null/non-empty guard prevents a missing client filter from returning the whole table.
-- ⚠ REAL FIX (when Innovation carries the logged-in user): replace with owner_key = auth.uid()::text
-- so the database — not the client — is the authority on identity. Tracked for the accounts milestone.
ALTER TABLE innovation_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read innovation state" ON innovation_state;
CREATE POLICY "Owners read innovation state"
  ON innovation_state FOR SELECT
  TO anon, authenticated
  USING (owner_key IS NOT NULL AND length(owner_key) > 0);

DROP POLICY IF EXISTS "Owners insert innovation state" ON innovation_state;
CREATE POLICY "Owners insert innovation state"
  ON innovation_state FOR INSERT
  TO anon, authenticated
  WITH CHECK (owner_key IS NOT NULL AND length(owner_key) > 0);

DROP POLICY IF EXISTS "Owners update innovation state" ON innovation_state;
CREATE POLICY "Owners update innovation state"
  ON innovation_state FOR UPDATE
  TO anon, authenticated
  USING (owner_key IS NOT NULL AND length(owner_key) > 0)
  WITH CHECK (owner_key IS NOT NULL AND length(owner_key) > 0);
