-- Architect-2525 saved files — cloud backup of the Design workspace snapshot (Vision 2525).
-- The snapshot bundles the house build spec, BIM imports (unclassified queue + manifest),
-- per-asset overrides, the project stage gate, and the replay log into one jsonb payload.
--
-- OPTIONAL table: the frontend (lib/architect-saved-files.ts) degrades gracefully to localStorage
-- if this table is absent — nothing breaks before it is applied. Apply it to promote the workspace
-- from device-local to durable + cross-device.
--
-- Scoping: one row per (owner_key, name). While the 2525 apps are MVPs behind the eXeL login and
-- use the anon key, owner_key is a per-browser id (arch2525.ownerId); it swaps to the authenticated
-- user id in a single place (ownerKey()) when accounts land.

CREATE TABLE IF NOT EXISTS architect_saved_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key   TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT 'workspace',
  payload     JSONB NOT NULL,
  source_hash TEXT,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_key, name)
);

CREATE INDEX IF NOT EXISTS ix_architect_saved_files_owner ON architect_saved_files(owner_key);

-- RLS: the app uses the anon key behind the eXeL login. Scope is by owner_key (per-browser id now,
-- authenticated user later). Allow anon + authenticated to read/write their own bucket; service_role full.
ALTER TABLE architect_saved_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read saved files" ON architect_saved_files;
CREATE POLICY "Anyone can read saved files"
  ON architect_saved_files FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert saved files" ON architect_saved_files;
CREATE POLICY "Anyone can insert saved files"
  ON architect_saved_files FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update saved files" ON architect_saved_files;
CREATE POLICY "Anyone can update saved files"
  ON architect_saved_files FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
