import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ResponseMeta(Base):
    __tablename__ = "response_meta"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    question_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("questions.id"), nullable=False
    )
    cycle_id: Mapped[int] = mapped_column(Integer, default=1)
    # CRS-05: nullable for anonymous mode — anon_hash stored in MongoDB instead
    participant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("participants.id"), nullable=True
    )
    source: Mapped[str] = mapped_column(String(20), default="text")
    mongo_ref: Mapped[str] = mapped_column(String(64), nullable=False)
    char_count: Mapped[int] = mapped_column(Integer, default=0)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    flag_reason: Mapped[str | None] = mapped_column(String(255))

    __table_args__ = (
        Index("ix_response_meta_session_question", "session_id", "question_id"),
        Index("ix_response_meta_participant", "participant_id"),
    )
