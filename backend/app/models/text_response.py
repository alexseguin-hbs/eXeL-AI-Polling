"""Cube 2 — TextResponse model.

Extends ResponseMeta with text-specific fields: language detection,
PII detection results, profanity detection, and cleaned text versions.

Stores a 1:1 relationship with ResponseMeta (FK to response_meta.id).
Raw response text lives in MongoDB; this table holds Postgres metadata.
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TextResponse(Base):
    __tablename__ = "text_responses"

    response_meta_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("response_meta.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    language_code: Mapped[str] = mapped_column(String(10), default="en")
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)

    # PII detection results
    pii_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    pii_types: Mapped[dict | None] = mapped_column(JSONB)
    # e.g. [{"type": "EMAIL", "start": 10, "end": 25, "text": "***"}]
    pii_scrubbed_text: Mapped[str | None] = mapped_column(Text)

    # Profanity detection results (non-blocking — raw + clean stored)
    profanity_detected: Mapped[bool] = mapped_column(Boolean, default=False)
    profanity_words: Mapped[dict | None] = mapped_column(JSONB)
    # e.g. [{"word": "***", "severity": "medium", "position": 5}]
    clean_text: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        Index("ix_text_responses_response_meta", "response_meta_id"),
        Index("ix_text_responses_language", "language_code"),
    )
