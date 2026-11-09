-- SensorFusion-2525 collaborative progress, per-project settings, XML provenance, and append-only label corrections.
-- Applied live 2026-11-08 as migration sensor_fusion_collab_progress (history version 20261109030808).
-- Builds on 040–042 + review label fields: members-only RLS (sensor_fusion_is_member), independent Level 2, device-local XML until shared.

-- Team progress (clock + level counts) per member, scoped by project membership.
CREATE TABLE IF NOT EXISTS sensor_fusion_progress (
  project_id TEXT NOT NULL,
  member_id  UUID NOT NULL,
  payload    JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, member_id)
);

ALTER TABLE sensor_fusion_progress ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON sensor_fusion_progress FROM anon;
GRANT SELECT, INSERT, UPDATE ON sensor_fusion_progress TO authenticated;

DROP POLICY IF EXISTS "Members read their project progress" ON sensor_fusion_progress;
CREATE POLICY "Members read their project progress"
  ON sensor_fusion_progress FOR SELECT
  TO authenticated
  USING (sensor_fusion_is_member(project_id));

DROP POLICY IF EXISTS "Members upsert their own progress" ON sensor_fusion_progress;
CREATE POLICY "Members upsert their own progress"
  ON sensor_fusion_progress FOR INSERT
  TO authenticated
  WITH CHECK (sensor_fusion_is_member(project_id) AND member_id = auth.uid());

DROP POLICY IF EXISTS "Members update their own progress" ON sensor_fusion_progress;
CREATE POLICY "Members update their own progress"
  ON sensor_fusion_progress FOR UPDATE
  TO authenticated
  USING (sensor_fusion_is_member(project_id) AND member_id = auth.uid())
  WITH CHECK (sensor_fusion_is_member(project_id) AND member_id = auth.uid());

-- Per-project settings (scheme, coral, alerts). One row per project.
CREATE TABLE IF NOT EXISTS sensor_fusion_project_settings (
  project_id TEXT PRIMARY KEY,
  settings   JSONB NOT NULL,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sensor_fusion_project_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON sensor_fusion_project_settings FROM anon;
GRANT SELECT, INSERT, UPDATE ON sensor_fusion_project_settings TO authenticated;

DROP POLICY IF EXISTS "Members read their project settings" ON sensor_fusion_project_settings;
CREATE POLICY "Members read their project settings"
  ON sensor_fusion_project_settings FOR SELECT
  TO authenticated
  USING (sensor_fusion_is_member(project_id));

DROP POLICY IF EXISTS "Members write their project settings" ON sensor_fusion_project_settings;
CREATE POLICY "Members write their project settings"
  ON sensor_fusion_project_settings FOR INSERT
  TO authenticated
  WITH CHECK (sensor_fusion_is_member(project_id));

DROP POLICY IF EXISTS "Members update their project settings" ON sensor_fusion_project_settings;
CREATE POLICY "Members update their project settings"
  ON sensor_fusion_project_settings FOR UPDATE
  TO authenticated
  USING (sensor_fusion_is_member(project_id))
  WITH CHECK (sensor_fusion_is_member(project_id));

-- Per-image XML provenance when a member device contributes or renames into the shared project.
ALTER TABLE sensor_fusion_pictures ADD COLUMN IF NOT EXISTS xml_text TEXT;
ALTER TABLE sensor_fusion_pictures ADD COLUMN IF NOT EXISTS source_device TEXT;
ALTER TABLE sensor_fusion_pictures ADD COLUMN IF NOT EXISTS renamed_from TEXT;
ALTER TABLE sensor_fusion_pictures ADD COLUMN IF NOT EXISTS pair_stem TEXT;

-- Append-only correction provenance for Level 2 adjustments. Rows are inserted, never updated.
CREATE TABLE IF NOT EXISTS sensor_fusion_label_corrections (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  picture_id TEXT NOT NULL,
  label_id   UUID,
  corrected_by TEXT NOT NULL,
  labeled_by   TEXT,
  kind       TEXT NOT NULL CHECK (kind IN ('adjust', 'reject', 'restore')),
  from_box   JSONB NOT NULL,
  to_box     JSONB NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT sensor_fusion_correction_independent CHECK (
    labeled_by IS NULL OR corrected_by IS DISTINCT FROM labeled_by
  )
);

ALTER TABLE sensor_fusion_label_corrections ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON sensor_fusion_label_corrections FROM anon;
GRANT SELECT, INSERT ON sensor_fusion_label_corrections TO authenticated;

DROP POLICY IF EXISTS "Members read their project corrections" ON sensor_fusion_label_corrections;
CREATE POLICY "Members read their project corrections"
  ON sensor_fusion_label_corrections FOR SELECT
  TO authenticated
  USING (sensor_fusion_is_member(project_id));

DROP POLICY IF EXISTS "Members append corrections in their project" ON sensor_fusion_label_corrections;
CREATE POLICY "Members append corrections in their project"
  ON sensor_fusion_label_corrections FOR INSERT
  TO authenticated
  WITH CHECK (sensor_fusion_is_member(project_id));

-- No UPDATE or DELETE policies on corrections: append-only by omission.

-- Independent reviewer at the label row when Level 2 fields are present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sensor_fusion_labels_independent_reviewer'
  ) THEN
    ALTER TABLE sensor_fusion_labels
      ADD CONSTRAINT sensor_fusion_labels_independent_reviewer
      CHECK (
        reviewed_by IS NULL
        OR labeled_by IS NULL
        OR lower(reviewed_by) IS DISTINCT FROM lower(labeled_by)
      );
  END IF;
END $$;
