"""Cube 3 — STTProvider model.

Registry of available Speech-to-Text providers with language support,
priority for failover, cost rates, and active/inactive status.

Used by select_stt_provider() to pick the best provider for a given
language, respecting priority ordering and circuit breaker state.
"""

from sqlalchemy import Boolean, Float, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class STTProviderConfig(Base):
    __tablename__ = "stt_providers"

    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    supported_languages: Mapped[list] = mapped_column(JSONB, default=list)
    # e.g. ["en", "es", "fr", "de", "ja", "zh", "ar", ...]
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    priority: Mapped[int] = mapped_column(Integer, default=10)
    # Lower = higher priority (1 = primary, default: Gemini at 1)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False)
    # Cost transparency: USD per minute of audio
    cost_per_minute_usd: Mapped[float] = mapped_column(Float, default=0.0)

    __table_args__ = (
        Index("ix_stt_providers_active_priority", "is_active", "priority"),
    )
