"""AI Cost Log — persistent cost tracking per pipeline run.

Records estimated AI provider costs for each session's pipeline execution.
Used for cost estimation display, billing reconciliation, and audit trail.
One row per pipeline run (Phase A summaries + Phase B theming + CQS scoring).
"""

import uuid

from sqlalchemy import Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AICostLog(Base):
    __tablename__ = "ai_cost_logs"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )

    # Pipeline phase: "phase_a", "phase_b", "cqs"
    phase: Mapped[str] = mapped_column(String(20), nullable=False)

    # AI provider used
    provider: Mapped[str] = mapped_column(String(30), nullable=False)

    # Metrics
    total_calls: Mapped[int] = mapped_column(Integer, default=0)
    total_input_chars: Mapped[int] = mapped_column(Integer, default=0)
    total_output_chars: Mapped[int] = mapped_column(Integer, default=0)
    estimated_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)

    # Context
    response_count: Mapped[int] = mapped_column(Integer, default=0)
    duration_sec: Mapped[float] = mapped_column(Float, default=0.0)

    __table_args__ = (
        Index("ix_ai_cost_logs_session", "session_id"),
        Index("ix_ai_cost_logs_provider", "provider"),
    )
