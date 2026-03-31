-- Product Feedback table — collects feedback at every stage of use
-- Moderators and Users can submit from any screen
-- Stored in Supabase PostgreSQL for prioritized backlog

CREATE TABLE IF NOT EXISTS product_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  participant_id UUID,
  user_id VARCHAR(255),
  role VARCHAR(30) DEFAULT 'user',
  screen VARCHAR(50) DEFAULT 'unknown',
  cube_id INTEGER,
  crs_id VARCHAR(20),
  sub_crs_id VARCHAR(20),
  feedback_text TEXT NOT NULL,
  category VARCHAR(30) DEFAULT 'general',
  sentiment FLOAT,
  device_type VARCHAR(20),
  language_code VARCHAR(10) DEFAULT 'en',
  priority INTEGER DEFAULT 0,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS ix_product_feedback_session ON product_feedback(session_id);
CREATE INDEX IF NOT EXISTS ix_product_feedback_screen ON product_feedback(screen);
CREATE INDEX IF NOT EXISTS ix_product_feedback_category ON product_feedback(category);
CREATE INDEX IF NOT EXISTS ix_product_feedback_priority ON product_feedback(priority);
CREATE INDEX IF NOT EXISTS ix_product_feedback_created ON product_feedback(created_at);

-- RLS: anyone can INSERT (submit feedback), only service_role can SELECT (admin reads)
ALTER TABLE product_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON product_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role reads all feedback"
  ON product_feedback FOR SELECT
  TO service_role
  USING (true);
