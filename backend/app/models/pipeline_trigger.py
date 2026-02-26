"""Pipeline trigger model — tracks Cube 5 orchestrator pipeline executions.

Each trigger records when Cube 5 fires a downstream pipeline (e.g., AI theming,
ranking aggregation, CQS scoring) and tracks its lifecycle:
  pending → in_progress → completed | failed

Designed for peak demand (1M users): indexes on session_id, trigger_type, status
enable fast lookups without full-table scans. Append-only pattern with status
updates keeps write contention low under high concurrency.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Valid trigger types
VALID_TRIGGER_TYPES = (
    "ai_theming",
    "ranking_aggregation",
    "cqs_scoring",
    "reward_payout",
)

# Valid trigger statuses
VALID_TRIGGER_STATUSES = ("pending", "in_progress", "completed", "failed")


class PipelineTrigger(Base):
    __tablename__ = "pipeline_triggers"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    trigger_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # ai_theming | ranking_aggregation | cqs_scoring | reward_payout
    status: Mapped[str] = mapped_column(
        String(20), default="pending"
    )  # pending | in_progress | completed | failed
    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    error_message: Mapped[str | None] = mapped_column(Text)
    trigger_metadata: Mapped[dict | None] = mapped_column(JSONB)

    session = relationship("Session", back_populates="pipeline_triggers")

    __table_args__ = (
        Index("ix_pipeline_triggers_session", "session_id"),
        Index("ix_pipeline_triggers_type", "trigger_type"),
        Index("ix_pipeline_triggers_status", "status"),
    )
