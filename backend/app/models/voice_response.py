"""Cube 3 — VoiceResponse model.

Extends ResponseMeta with voice-specific fields: audio duration,
STT provider used, transcript text, and confidence score.

Stores a 1:1 relationship with ResponseMeta (FK to response_meta.id).
Audio files stored via Supabase Storage (path in audio_storage_path).
After transcription, the transcript is forwarded into Cube 2's text
pipeline for PII/profanity processing — results live on the linked
TextResponse record. Architecture: Supabase/PostgreSQL only.
"""

import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class VoiceResponse(Base):
    __tablename__ = "voice_responses"

    response_meta_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("response_meta.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    language_code: Mapped[str] = mapped_column(String(10), default="en")
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)

    # Audio metadata
    audio_duration_sec: Mapped[float] = mapped_column(Float, default=0.0)
    audio_format: Mapped[str] = mapped_column(String(20), default="webm")
    audio_size_bytes: Mapped[int] = mapped_column(default=0)

    # STT results
    stt_provider: Mapped[str] = mapped_column(String(50), nullable=False)
    transcript_text: Mapped[str] = mapped_column(Text, nullable=False)
    transcript_confidence: Mapped[float] = mapped_column(Float, default=0.0)

    __table_args__ = (
        Index("ix_voice_responses_response_meta", "response_meta_id"),
        Index("ix_voice_responses_language", "language_code"),
        Index("ix_voice_responses_provider", "stt_provider"),
    )
