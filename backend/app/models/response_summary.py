"""Response summaries — replaces MongoDB 'summaries' collection.

Stores AI-generated 333/111/33-word summaries and theme assignments
per response. One row per response_meta_id (1:1 with ResponseMeta).

Previously in MongoDB; migrated to PostgreSQL for Supabase-only architecture.
"""

import uuid

from sqlalchemy import Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ResponseSummary(Base):
    __tablename__ = "response_summaries"

    response_meta_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("response_meta.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )

    # AI provider that generated summaries
    provider: Mapped[str | None] = mapped_column(String(30))
    model_id: Mapped[str | None] = mapped_column(String(100))

    # Three-tier summaries (Phase A: live per-response)
    summary_333: Mapped[str | None] = mapped_column(Text)
    summary_111: Mapped[str | None] = mapped_column(Text)
    summary_33: Mapped[str | None] = mapped_column(Text)

    # Theme assignments (Phase B: batch post-close)
    theme01: Mapped[str | None] = mapped_column(String(100))
    theme01_confidence: Mapped[float | None] = mapped_column(Float)
    theme2_9: Mapped[str | None] = mapped_column(String(200))
    theme2_9_confidence: Mapped[float | None] = mapped_column(Float)
    theme2_6: Mapped[str | None] = mapped_column(String(200))
    theme2_6_confidence: Mapped[float | None] = mapped_column(Float)
    theme2_3: Mapped[str | None] = mapped_column(String(200))
    theme2_3_confidence: Mapped[float | None] = mapped_column(Float)

    __table_args__ = (
        Index("ix_response_summaries_session", "session_id"),
        Index("ix_response_summaries_meta", "response_meta_id"),
    )
