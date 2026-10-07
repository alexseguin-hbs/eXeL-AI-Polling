-- 032_time_entry_one_open_cqs_anonymous.sql  (AsM round 12)
--
-- 1. One open public time entry per participant per session, enforced by the database. The application checked
--    before inserting, so a burst of parallel starts could each pass the check and each later earn up to the 3-hour
--    cap. Cube 2/3 entries carry their own cube_id and are not constrained. Close any duplicate open public
--    entries first (keep the newest open one) so the index can be built on existing data.
UPDATE time_entries t
   SET stopped_at = t.started_at, duration_seconds = 0
 WHERE t.cube_id = 'cube5' AND t.stopped_at IS NULL
   AND EXISTS (SELECT 1 FROM time_entries n
                WHERE n.session_id = t.session_id AND n.participant_id = t.participant_id
                  AND n.cube_id = 'cube5' AND n.stopped_at IS NULL AND n.started_at > t.started_at);

CREATE UNIQUE INDEX IF NOT EXISTS uq_time_entries_one_open_public
    ON time_entries (session_id, participant_id)
 WHERE cube_id = 'cube5' AND stopped_at IS NULL;

-- 2. A CQS score of an anonymous answer has no participant: the answer is attributed by response_id. The column
--    was NOT NULL, so CQS raised on every anonymous session (the default anonymity mode).
ALTER TABLE cqs_scores ALTER COLUMN participant_id DROP NOT NULL;
