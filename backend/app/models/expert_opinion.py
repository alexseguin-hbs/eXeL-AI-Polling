"""CRS-38 Round 3 Expert Opinion models."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ExpertAssignment(Base):
    __tablename__ = "expert_assignments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    theme_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("themes.id", ondelete="SET NULL"), nullable=True)
    expert_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expert_participant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("participants.id", ondelete="SET NULL"), nullable=True)
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    invited_by: Mapped[str] = mapped_column(String(255), nullable=False)
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    status: Mapped[str] = mapped_column(String(20), default="invited", nullable=False)


class ExpertOpinion(Base):
    __tablename__ = "expert_opinions"
    __table_args__ = (UniqueConstraint("assignment_id", "theme_id", name="uq_expert_opinion_assignment_theme"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    theme_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("themes.id", ondelete="CASCADE"), nullable=False)
    assignment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("expert_assignments.id", ondelete="CASCADE"), nullable=False)
    support_summary: Mapped[str] = mapped_column(Text, default="")
    risk_summary: Mapped[str] = mapped_column(Text, default="")
    neutral_summary: Mapped[str] = mapped_column(Text, default="")
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    submitted_by: Mapped[str] = mapped_column(String(255), nullable=False)


class ExpertOpinionPager(Base):
    __tablename__ = "expert_opinion_pagers"
    __table_args__ = (UniqueConstraint("session_id", "theme_id", name="uq_expert_pager_session_theme"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    theme_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("themes.id", ondelete="CASCADE"), nullable=False)
    pager_text: Mapped[str] = mapped_column(Text, default="")
    ready: Mapped[bool] = mapped_column(Boolean, default=False)
    opinion_ids: Mapped[list | None] = mapped_column(ARRAY(UUID(as_uuid=True)), default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    ready_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
