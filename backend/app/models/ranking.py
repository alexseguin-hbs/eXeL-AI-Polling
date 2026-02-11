import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.session import Session


class Ranking(Base):
    __tablename__ = "rankings"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    cycle_id: Mapped[int] = mapped_column(Integer, default=1)
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("participants.id"), nullable=False
    )
    ranked_theme_ids: Mapped[dict | None] = mapped_column(JSON)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    session: Mapped["Session"] = relationship(back_populates="rankings")

    __table_args__ = (
        Index("ix_rankings_session_cycle", "session_id", "cycle_id"),
        UniqueConstraint(
            "session_id", "cycle_id", "participant_id",
            name="uq_ranking_session_cycle_participant",
        ),
    )


class AggregatedRanking(Base):
    __tablename__ = "aggregated_rankings"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    cycle_id: Mapped[int] = mapped_column(Integer, default=1)
    algorithm: Mapped[str] = mapped_column(String(50), default="borda_count")
    results: Mapped[dict | None] = mapped_column(JSON)
    participant_count: Mapped[int] = mapped_column(Integer, default=0)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False)
    override_by: Mapped[str | None] = mapped_column(String(255))
    override_reason: Mapped[str | None] = mapped_column(String(1000))

    __table_args__ = (
        Index("ix_agg_rankings_session_cycle", "session_id", "cycle_id"),
    )
