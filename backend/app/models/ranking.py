import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.session import Session


class Ranking(Base):
    __tablename__ = "user_rankings"

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
        Index("ix_user_rankings_session_cycle", "session_id", "cycle_id"),
        UniqueConstraint(
            "session_id", "cycle_id", "participant_id",
            name="uq_ranking_session_cycle_participant",
        ),
    )


class AggregatedRanking(Base):
    """Per-theme aggregated ranking row.

    One row per theme per cycle — enables indexed queries on rank_position,
    is_top_theme2, and direct JOINs from Cube 9 CSV export.
    """

    __tablename__ = "aggregated_rankings"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    cycle_id: Mapped[int] = mapped_column(Integer, default=1)
    theme_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("themes.id"), nullable=False
    )
    rank_position: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    vote_count: Mapped[int] = mapped_column(Integer, default=0)
    is_top_theme2: Mapped[bool] = mapped_column(Boolean, default=False)
    participant_count: Mapped[int] = mapped_column(Integer, default=0)
    algorithm: Mapped[str] = mapped_column(String(50), default="borda_count")
    is_final: Mapped[bool] = mapped_column(Boolean, default=False)
    aggregated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    __table_args__ = (
        Index("ix_agg_rankings_session_cycle", "session_id", "cycle_id"),
        Index("ix_agg_rankings_top_theme2", "session_id", "is_top_theme2"),
        UniqueConstraint(
            "session_id", "cycle_id", "theme_id",
            name="uq_agg_ranking_session_cycle_theme",
        ),
    )


class GovernanceOverride(Base):
    """CRS-22: Immutable audit trail for Lead/Developer ranking overrides.

    Every override creates a new row (append-only). Original rank preserved
    for audit. Justification is mandatory (min 10 chars).
    """

    __tablename__ = "governance_overrides"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    cycle_id: Mapped[int] = mapped_column(Integer, default=1)
    theme_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("themes.id"), nullable=False
    )
    original_rank: Mapped[int] = mapped_column(Integer, nullable=False)
    new_rank: Mapped[int] = mapped_column(Integer, nullable=False)
    overridden_by: Mapped[str] = mapped_column(String(255), nullable=False)
    justification: Mapped[str] = mapped_column(Text, nullable=False)

    __table_args__ = (
        Index("ix_gov_overrides_session", "session_id", "cycle_id"),
    )
