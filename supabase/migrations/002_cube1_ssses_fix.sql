-- Cube 1 SSSES 100% fixes
ALTER TABLE sessions
  ADD COLUMN expires_at timestamp with time zone DEFAULT (now() + interval '24 hours'),
  ADD COLUMN is_expired boolean GENERATED ALWAYS AS (expires_at < now()) STORED;

CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_host_status ON sessions(host_id, status);

-- Rate limiting helper table
CREATE TABLE session_creation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES auth.users(id),
  created_at timestamp DEFAULT now()
);

-- Enable realtime on sessions for live status
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
