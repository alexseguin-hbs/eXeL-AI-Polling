"""Cube 10 — Model Tests for DB tables.

Tests:
  - CodeSubmission table + columns + indexes
  - SubmissionVote table + FK
  - DeploymentLog table + FK
  - ProductFeedback table (pre-existing, verify Cube 10 compatibility)
"""

import pytest


class TestCodeSubmissionModel:
    def test_table_name(self):
        from app.models.code_submission import CodeSubmission
        assert CodeSubmission.__tablename__ == "code_submissions"

    def test_required_columns(self):
        from app.models.code_submission import CodeSubmission
        cols = [c.key for c in CodeSubmission.__table__.columns]
        for col in ["cube_id", "function_name", "submitter_id", "submitter_type",
                     "code_diff", "branch_name", "status", "tests_passed",
                     "tests_total", "duration_ms", "ssses_scores", "replay_hash"]:
            assert col in cols, f"Missing: {col}"

    def test_indexes(self):
        from app.models.code_submission import CodeSubmission
        names = [c.name for c in CodeSubmission.__table_args__ if hasattr(c, "name") and c.name]
        assert "ix_code_submissions_cube" in names
        assert "ix_code_submissions_status" in names


class TestSubmissionVoteModel:
    def test_table_name(self):
        from app.models.code_submission import SubmissionVote
        assert SubmissionVote.__tablename__ == "submission_votes"

    def test_fk_to_submissions(self):
        from app.models.code_submission import SubmissionVote
        cols = [c.key for c in SubmissionVote.__table__.columns]
        assert "submission_id" in cols
        assert "voter_id" in cols
        assert "vote" in cols
        assert "weight" in cols


class TestDeploymentLogModel:
    def test_table_name(self):
        from app.models.code_submission import DeploymentLog
        assert DeploymentLog.__tablename__ == "deployment_log"

    def test_required_columns(self):
        from app.models.code_submission import DeploymentLog
        cols = [c.key for c in DeploymentLog.__table__.columns]
        for col in ["submission_id", "deployed_by", "previous_version_hash",
                     "new_version_hash", "rollback_available", "revert_reason"]:
            assert col in cols, f"Missing: {col}"


class TestProductFeedbackModel:
    def test_table_name(self):
        from app.models.product_feedback import ProductFeedback
        assert ProductFeedback.__tablename__ == "product_feedback"

    def test_cube_id_column(self):
        from app.models.product_feedback import ProductFeedback
        cols = [c.key for c in ProductFeedback.__table__.columns]
        assert "cube_id" in cols
        assert "feedback_text" in cols
        assert "priority" in cols
        assert "sentiment" in cols
