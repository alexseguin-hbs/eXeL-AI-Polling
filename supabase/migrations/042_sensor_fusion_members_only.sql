-- R4a. A guest cannot read or add Sensor Fusion pictures or labels.
-- A signed-in person can read and add a row only when they are a member of that project.
-- Nobody can join a project from the page. Only the server adds a row to sensor_fusion_members.
-- There is no insert rule on that table. That is on purpose until a project home is chosen. It is not a bug.

CREATE TABLE IF NOT EXISTS sensor_fusion_members (
  project_id TEXT NOT NULL,
  member_id  UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, member_id)
);

ALTER TABLE sensor_fusion_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE sensor_fusion_pictures ADD COLUMN IF NOT EXISTS project_id TEXT;
ALTER TABLE sensor_fusion_labels ADD COLUMN IF NOT EXISTS project_id TEXT;

CREATE OR REPLACE FUNCTION sensor_fusion_is_member(pid TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pid IS NOT NULL
     AND auth.uid() IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM sensor_fusion_members
       WHERE project_id = pid AND member_id = auth.uid()
     );
$$;

REVOKE ALL ON FUNCTION sensor_fusion_is_member(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sensor_fusion_is_member(TEXT) TO authenticated;

REVOKE ALL ON sensor_fusion_pictures FROM anon;
REVOKE ALL ON sensor_fusion_labels FROM anon;
REVOKE ALL ON sensor_fusion_members FROM anon;

DROP POLICY IF EXISTS "Anyone can insert sensor fusion pictures" ON sensor_fusion_pictures;
DROP POLICY IF EXISTS "Anyone can read sensor fusion pictures" ON sensor_fusion_pictures;
DROP POLICY IF EXISTS "Members read their project pictures" ON sensor_fusion_pictures;
DROP POLICY IF EXISTS "Members add pictures to their project" ON sensor_fusion_pictures;

CREATE POLICY "Members read their project pictures"
  ON sensor_fusion_pictures FOR SELECT
  TO authenticated
  USING (sensor_fusion_is_member(project_id));

CREATE POLICY "Members add pictures to their project"
  ON sensor_fusion_pictures FOR INSERT
  TO authenticated
  WITH CHECK (sensor_fusion_is_member(project_id));

DROP POLICY IF EXISTS "Anyone can insert sensor fusion labels" ON sensor_fusion_labels;
DROP POLICY IF EXISTS "Anyone can read sensor fusion labels" ON sensor_fusion_labels;
DROP POLICY IF EXISTS "Members read their project labels" ON sensor_fusion_labels;
DROP POLICY IF EXISTS "Members add labels to their project" ON sensor_fusion_labels;

CREATE POLICY "Members read their project labels"
  ON sensor_fusion_labels FOR SELECT
  TO authenticated
  USING (sensor_fusion_is_member(project_id));

CREATE POLICY "Members add labels to their project"
  ON sensor_fusion_labels FOR INSERT
  TO authenticated
  WITH CHECK (sensor_fusion_is_member(project_id));

DROP POLICY IF EXISTS "A member reads their own seat" ON sensor_fusion_members;
CREATE POLICY "A member reads their own seat"
  ON sensor_fusion_members FOR SELECT
  TO authenticated
  USING (member_id = auth.uid());
