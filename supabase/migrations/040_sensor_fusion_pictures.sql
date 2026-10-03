-- Sensor Fusion pictures. The phone keeps the jpeg. This table takes a copy only after the person says to upload.
CREATE TABLE IF NOT EXISTS sensor_fusion_pictures (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_key  TEXT NOT NULL,
  name       TEXT NOT NULL,
  model      TEXT,
  jpeg       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sensor_fusion_pictures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert sensor fusion pictures" ON sensor_fusion_pictures;
CREATE POLICY "Anyone can insert sensor fusion pictures"
  ON sensor_fusion_pictures FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read sensor fusion pictures" ON sensor_fusion_pictures;
CREATE POLICY "Anyone can read sensor fusion pictures"
  ON sensor_fusion_pictures FOR SELECT
  TO anon, authenticated
  USING (true);
