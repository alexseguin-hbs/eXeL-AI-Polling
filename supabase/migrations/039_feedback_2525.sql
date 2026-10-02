-- 039 · Feedback-2525 — the operator reads the feedback repository from the easter-egg admin console
-- ============================================================================================
-- Operator 2026-10-02 (addendum 132): "supabase is repo of feedback; accessible by Easter egg unlock in admin console:
-- Feedback-2525". Addendum 128: every sub-site's feedback is written to product_feedback, tagged with the sub-site.
--
-- product_feedback stays write-only for the public (005: anyone may INSERT, only service_role may SELECT). The admin console runs
-- in a browser with the public anon key, so it cannot SELECT. This migration adds the only read path: two SECURITY DEFINER
-- functions that answer ONLY when given an admin key whose SHA-256 is on file in feedback_admin_keys. The table holds hashes,
-- never keys; it has no policy and no grant, so nothing outside these functions can read or write it. A key is added by the
-- operator's workflow (.github/workflows/feedback-admin-key.yml), which receives only the hash — the key itself never touches
-- the repository, a log or the database.
--
-- Idempotent. Safe to re-run.

CREATE TABLE IF NOT EXISTS feedback_admin_keys (
  key_hash   TEXT PRIMARY KEY CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  label      TEXT NOT NULL DEFAULT 'operator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE feedback_admin_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE feedback_admin_keys FROM anon, authenticated;

CREATE OR REPLACE FUNCTION feedback_admin_ok(p_key TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_key IS NOT NULL AND length(p_key) >= 24
     AND EXISTS (SELECT 1 FROM feedback_admin_keys k WHERE k.key_hash = encode(sha256(convert_to(p_key, 'UTF8')), 'hex'));
$$;

-- newest first; optional filter by sub-site (product_feedback.screen); at most 1,000 rows per call
CREATE OR REPLACE FUNCTION product_feedback_list(p_key TEXT, p_screen TEXT DEFAULT NULL, p_limit INTEGER DEFAULT 500)
RETURNS TABLE (id UUID, screen VARCHAR, category VARCHAR, feedback_text TEXT, device_type VARCHAR, language_code VARCHAR,
               is_resolved BOOLEAN, created_at TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT feedback_admin_ok(p_key) THEN
    RAISE EXCEPTION 'feedback: key not accepted' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT f.id, f.screen, f.category, f.feedback_text, f.device_type, f.language_code, f.is_resolved, f.created_at
      FROM product_feedback f
     WHERE p_screen IS NULL OR f.screen = p_screen
     ORDER BY f.created_at DESC
     LIMIT LEAST(GREATEST(COALESCE(p_limit, 500), 1), 1000);
END;
$$;

CREATE OR REPLACE FUNCTION product_feedback_resolve(p_key TEXT, p_id UUID, p_resolved BOOLEAN)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT feedback_admin_ok(p_key) THEN
    RAISE EXCEPTION 'feedback: key not accepted' USING ERRCODE = '42501';
  END IF;
  UPDATE product_feedback SET is_resolved = COALESCE(p_resolved, FALSE), resolved_by = 'Feedback-2525', updated_at = now() WHERE id = p_id;
  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION feedback_admin_ok(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION product_feedback_list(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION product_feedback_resolve(TEXT, UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION product_feedback_list(TEXT, TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION product_feedback_resolve(TEXT, UUID, BOOLEAN) TO anon, authenticated;
