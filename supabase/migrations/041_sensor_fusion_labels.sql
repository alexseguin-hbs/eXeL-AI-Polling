-- Boxes a team draws on Sensor Fusion pictures. The phone keeps the box. This table takes a copy only after the person shares it.
CREATE TABLE IF NOT EXISTS sensor_fusion_labels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key   TEXT NOT NULL,
  picture_id  TEXT NOT NULL,
  name        TEXT NOT NULL,
  x1          INTEGER NOT NULL,
  y1          INTEGER NOT NULL,
  x2          INTEGER NOT NULL,
  y2          INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sensor_fusion_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert sensor fusion labels" ON sensor_fusion_labels;
CREATE POLICY "Anyone can insert sensor fusion labels"
  ON sensor_fusion_labels FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read sensor fusion labels" ON sensor_fusion_labels;
CREATE POLICY "Anyone can read sensor fusion labels"
  ON sensor_fusion_labels FOR SELECT
  TO anon, authenticated
  USING (true);
