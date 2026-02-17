import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.session import Session


class Participant(Base):
    __tablename__ = "participants"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    user_id: Mapped[str | None] = mapped_column(String(255))
    anon_hash: Mapped[str | None] = mapped_column(String(64))
    display_name: Mapped[str | None] = mapped_column(String(255))
    device_type: Mapped[str | None] = mapped_column(String(20))
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_seen: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # User STT preference (if session.allow_user_stt_choice=True)
    stt_provider_preference: Mapped[str | None] = mapped_column(String(20))

    session: Mapped["Session"] = relationship(back_populates="participants")

    __table_args__ = (
        Index("ix_participants_session", "session_id"),
        UniqueConstraint("session_id", "user_id", name="uq_participant_session_user"),
    )
