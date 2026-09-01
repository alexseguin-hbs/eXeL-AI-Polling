-- 020_sum_feedback.sql
-- Human annotation store for the Sumerian (SUM) Executive Summary — a scholarly
-- DRAFT that scholars correct over time. Each row is one suggested transliteration
-- correction, keyed to the sentence's page.paragraph..sentence reference so a curator
-- can recall every suggestion for one chunk and apply it to docs/i18n/exec-summary.sum.json.
--
-- Written by the Cloudflare Pages Function functions/api/sum-feedback.js (service role).

CREATE TABLE IF NOT EXISTS sum_feedback (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref          text NOT NULL,               -- page.paragraph..sentence, e.g. 00.01..01
  lang         text NOT NULL DEFAULT 'sum',
  current_t    text,                         -- transliteration the reader saw
  suggested_t  text NOT NULL,                -- their corrected transliteration
  note         text,                         -- optional rationale / source citation
  sentence_e   text,                         -- the English master sentence, for context
  page_sha     text,                         -- frozen-source sha the reader was reading
  ua           text,
  status       text NOT NULL DEFAULT 'open', -- open | accepted | rejected | applied
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sum_feedback_ref_idx     ON sum_feedback (ref);
CREATE INDEX IF NOT EXISTS sum_feedback_status_idx  ON sum_feedback (status);
CREATE INDEX IF NOT EXISTS sum_feedback_created_idx ON sum_feedback (created_at DESC);

-- RLS: writes come only through the service-role Pages Function; no anon access.
ALTER TABLE sum_feedback ENABLE ROW LEVEL SECURITY;
-- (no anon policy created on purpose — the service role bypasses RLS; readers never
--  touch this table directly, only via the server-side function.)
