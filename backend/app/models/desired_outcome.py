"""Cube 4 — DesiredOutcome model (Methods 2 & 3).

Stores the group's desired outcome for a session, participant confirmations,
and post-task results assessment. Used by CRS-10.01 through CRS-10.03.

Flow:
  1. Moderator or participant creates desired outcome (description + time estimate)
  2. Each participant confirms via record_confirmation()
  3. When all confirmed → all_confirmed=True, gate signal to Cube 5
  4. After task completion → log_post_task_results() stores assessment
"""

import uuid

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class DesiredOutcome(Base):
    __tablename__ = "desired_outcomes"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    time_estimate_minutes: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("participants.id"),
        nullable=True,
    )

    # Confirmation tracking
    confirmed_by: Mapped[list] = mapped_column(JSONB, default=list)
    all_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)

    # Outcome status (CRS-10.03)
    outcome_status: Mapped[str] = mapped_column(
        String(30), default="pending"
    )  # pending | achieved | partially_achieved | not_achieved

    # Post-task results
    results_log: Mapped[str | None] = mapped_column(Text, nullable=True)
    assessed_by: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    completed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("ix_desired_outcomes_session", "session_id"),
    )
