-- A finished Sensor Fusion set can name who labeled it, who reviewed it, and the Light Codex line for each.
-- The picture and the XML stay on the device. This adds the review words to the project copy.

ALTER TABLE sensor_fusion_pictures ADD COLUMN IF NOT EXISTS codex_l1 TEXT;
ALTER TABLE sensor_fusion_pictures ADD COLUMN IF NOT EXISTS codex_l2 TEXT;

ALTER TABLE sensor_fusion_labels ADD COLUMN IF NOT EXISTS level INTEGER;
ALTER TABLE sensor_fusion_labels ADD COLUMN IF NOT EXISTS labeled_by TEXT;
ALTER TABLE sensor_fusion_labels ADD COLUMN IF NOT EXISTS labeled_at TEXT;
ALTER TABLE sensor_fusion_labels ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE sensor_fusion_labels ADD COLUMN IF NOT EXISTS reviewed_at TEXT;
ALTER TABLE sensor_fusion_labels ADD COLUMN IF NOT EXISTS codex TEXT;
