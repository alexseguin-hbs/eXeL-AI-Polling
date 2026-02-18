"""Time tracking model — core to Cube 5 and ♡ token calculation.

Tracks active participation time per user per session.
Each action (login, responding, ranking) gets a start/stop entry.

Token defaults (SoI Trinity):
  ♡ = floor(active_minutes) — 1 min default on login
  웃 = 0 (until treasury funded, then $7.25/hr default)
  ◬ = 5x ♡
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Valid action types for time tracking
VALID_ACTION_TYPES = ("login", "responding", "ranking", "reviewing")


class TimeEntry(Base):
    __tablename__ = "time_entries"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("participants.id"), nullable=False
    )
    action_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "login", "responding", "ranking", "reviewing"
    cube_id: Mapped[str | None] = mapped_column(String(20))
    reference_id: Mapped[str | None] = mapped_column(
        String(255)
    )  # question_id or ranking_id
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    stopped_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    duration_seconds: Mapped[float | None] = mapped_column(Float)

    # SoI Trinity token earnings (calculated on stop)
    heart_tokens_earned: Mapped[float] = mapped_column(Float, default=0.0)
    person_tokens_earned: Mapped[float] = mapped_column(Float, default=0.0)
    triangle_tokens_earned: Mapped[float] = mapped_column(Float, default=0.0)

    session = relationship("Session", back_populates="time_entries")

    __table_args__ = (
        Index("ix_time_entries_session", "session_id"),
        Index("ix_time_entries_participant", "participant_id"),
        Index("ix_time_entries_action", "action_type"),
    )
