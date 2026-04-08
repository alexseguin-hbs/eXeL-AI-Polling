"""CQS (Content Quality Score) — AI-evaluated response quality for gamified reward.

Scores responses in the #1 most-voted Theme2 cluster with >95% confidence
using 6 weighted metrics. The highest composite_cqs wins the Moderator-set reward.

CQS is hidden from participants — visible only to Moderators and system.
Triggered by Cube 5 after Cube 7 ranking identifies the top Theme2 cluster.
"""

import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


# Default CQS weights (Moderator can override via session.cqs_weights)
DEFAULT_CQS_WEIGHTS = {
    "insight": 0.20,
    "depth": 0.15,
    "future_impact": 0.25,
    "originality": 0.15,
    "actionability": 0.15,
    "relevance": 0.10,
}


class CQSScore(Base):
    __tablename__ = "cqs_scores"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    response_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("response_meta.id", ondelete="CASCADE"), nullable=False
    )
    participant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("participants.id"), nullable=False
    )

    # Theme context — must be #1 most-voted Theme2 cluster
    theme2_cluster_label: Mapped[str] = mapped_column(String(200), nullable=False)
    theme_confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # 6 individual metric scores (0–100 each)
    insight_score: Mapped[float] = mapped_column(Float, default=0.0)
    depth_score: Mapped[float] = mapped_column(Float, default=0.0)
    future_impact_score: Mapped[float] = mapped_column(Float, default=0.0)
    originality_score: Mapped[float] = mapped_column(Float, default=0.0)
    actionability_score: Mapped[float] = mapped_column(Float, default=0.0)
    relevance_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Weighted composite (0–100)
    composite_cqs: Mapped[float] = mapped_column(Float, default=0.0)

    # Winner flag — exactly 1 per session
    is_winner: Mapped[bool] = mapped_column(Boolean, default=False)

    # AI provider used for scoring
    provider: Mapped[str] = mapped_column(String(30), nullable=False)

    __table_args__ = (
        Index("ix_cqs_scores_session", "session_id"),
        Index("ix_cqs_scores_response", "response_id"),
        Index("ix_cqs_scores_participant", "participant_id"),
        Index("ix_cqs_scores_winner", "session_id", "is_winner"),
    )
