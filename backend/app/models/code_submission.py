"""Code Submission models — Cube 10 Simulation Engine.

Tracks code improvements submitted by AI or humans for any Cube (1-9).
Each submission goes through: pending → testing → voting → approved → deployed.
Admin can revert any deployed submission.

Supabase tables: code_submissions, submission_votes, deployment_log
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CodeSubmission(Base):
    """A code improvement submitted for a specific cube function."""

    __tablename__ = "code_submissions"

    cube_id: Mapped[int] = mapped_column(Integer, nullable=False)
    function_name: Mapped[str] = mapped_column(String(255), nullable=False)
    submitter_id: Mapped[str] = mapped_column(String(255), nullable=False)
    submitter_type: Mapped[str] = mapped_column(String(10), nullable=False)  # human / ai
    code_diff: Mapped[str] = mapped_column(Text, nullable=False)
    branch_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    tests_passed: Mapped[int] = mapped_column(Integer, default=0)
    tests_total: Mapped[int] = mapped_column(Integer, default=0)
    duration_ms: Mapped[float] = mapped_column(Float, default=0.0)
    ssses_scores: Mapped[dict | None] = mapped_column(JSON)
    replay_hash: Mapped[str | None] = mapped_column(String(64))

    __table_args__ = (
        Index("ix_code_submissions_cube", "cube_id"),
        Index("ix_code_submissions_status", "status"),
        Index("ix_code_submissions_submitter", "submitter_id"),
    )


class SubmissionVote(Base):
    """A community vote on a code submission."""

    __tablename__ = "submission_votes"

    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("code_submissions.id"), nullable=False
    )
    voter_id: Mapped[str] = mapped_column(String(255), nullable=False)
    vote: Mapped[str] = mapped_column(String(10), nullable=False)  # approve / reject
    weight: Mapped[float] = mapped_column(Float, default=1.0)
    tokens_staked: Mapped[float] = mapped_column(Float, default=0.0)

    __table_args__ = (
        Index("ix_submission_votes_submission", "submission_id"),
    )


class DeploymentLog(Base):
    """Immutable deployment audit trail."""

    __tablename__ = "deployment_log"

    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("code_submissions.id"), nullable=False
    )
    deployed_by: Mapped[str] = mapped_column(String(255), nullable=False)
    previous_version_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    new_version_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    rollback_available: Mapped[bool] = mapped_column(Boolean, default=True)
    reverted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revert_reason: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        Index("ix_deployment_log_submission", "submission_id"),
    )
