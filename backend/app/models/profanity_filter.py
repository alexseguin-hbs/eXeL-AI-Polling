"""Cube 2 — ProfanityFilter model.

Language-specific profanity patterns stored in Postgres.
Starts empty; populated via admin API or seed migration.
Matched via regex per language_code against submitted text.
Non-blocking: profanity is flagged and cleaned but submission is allowed through.
"""

from sqlalchemy import Boolean, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ProfanityFilter(Base):
    __tablename__ = "profanity_filters"

    language_code: Mapped[str] = mapped_column(String(10), nullable=False)
    pattern: Mapped[str] = mapped_column(Text, nullable=False)  # regex pattern
    severity: Mapped[str] = mapped_column(
        String(20), default="medium"
    )  # low | medium | high
    replacement: Mapped[str] = mapped_column(String(50), default="***")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    __table_args__ = (
        Index("ix_profanity_filters_language", "language_code"),
        Index("ix_profanity_filters_active", "is_active"),
    )
