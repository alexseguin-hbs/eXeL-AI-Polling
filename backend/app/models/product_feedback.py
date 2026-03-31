"""Product Feedback — collected at every stage of use.

Stores feedback from Moderators and Users on any screen.
Categorized by cube, screen, role, and sentiment for prioritized backlog.
Stored in Supabase PostgreSQL under product_feedback table.
"""

import uuid

from sqlalchemy import Boolean, DateTime, Float, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProductFeedback(Base):
    """One row per feedback submission from any user at any stage."""

    __tablename__ = "product_feedback"

    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    participant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Context: where was the user when they submitted feedback?
    role: Mapped[str] = mapped_column(
        String(30), default="user"
    )  # moderator | user | lead | admin
    screen: Mapped[str] = mapped_column(
        String(50), default="unknown"
    )  # landing | join | polling | results | dashboard | settings | ranking | sim
    cube_id: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-10
    crs_id: Mapped[str | None] = mapped_column(String(20), nullable=True)  # e.g. CRS-07, CRS-07.02
    sub_crs_id: Mapped[str | None] = mapped_column(String(20), nullable=True)  # e.g. CRS-07.02.01

    # Feedback content
    feedback_text: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(30), default="general"
    )  # bug | feature | usability | improvement | general
    sentiment: Mapped[float | None] = mapped_column(
        Float, nullable=True
    )  # -1.0 to 1.0 (AI-scored later)

    # Device context
    device_type: Mapped[str | None] = mapped_column(String(20))  # mobile | desktop | tablet
    language_code: Mapped[str] = mapped_column(String(10), default="en")

    # Triage
    priority: Mapped[int] = mapped_column(Integer, default=0)  # 0=unset, 1=low, 2=med, 3=high
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved_by: Mapped[str | None] = mapped_column(String(255), nullable=True)

    __table_args__ = (
        Index("ix_product_feedback_session", "session_id"),
        Index("ix_product_feedback_screen", "screen"),
        Index("ix_product_feedback_category", "category"),
        Index("ix_product_feedback_priority", "priority"),
        Index("ix_product_feedback_created", "created_at"),
    )
