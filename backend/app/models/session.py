import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.audit_log import AuditLog
    from app.models.participant import Participant
    from app.models.question import Question
    from app.models.ranking import Ranking
    from app.models.theme import Theme
    from app.models.theme_sample import ThemeSample
    from app.models.time_tracking import TimeEntry


# Valid session state transitions
SESSION_STATES = ("draft", "open", "polling", "ranking", "closed", "archived")

# Validation constants for enum-like fields
VALID_ANONYMITY_MODES = ("identified", "anonymous", "pseudonymous")
VALID_CYCLE_MODES = ("single", "multi")
VALID_RANKING_MODES = ("auto", "manual")
VALID_AI_PROVIDERS = ("openai", "grok", "gemini")
VALID_STT_PROVIDERS = ("openai", "grok", "gemini")  # Batch STT (maps to whisper/grok/gemini)
VALID_REALTIME_STT_PROVIDERS = ("azure", "aws")  # Streaming STT (paid feature)
SESSION_TRANSITIONS: dict[str, tuple[str, ...]] = {
    "draft": ("open",),
    "open": ("polling", "closed"),
    "polling": ("ranking", "closed"),
    "ranking": ("polling", "closed"),  # can cycle back
    "closed": ("archived",),
    "archived": (),
}


class Session(Base):
    __tablename__ = "sessions"

    short_code: Mapped[str] = mapped_column(String(12), unique=True, nullable=False, index=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    # Config
    anonymity_mode: Mapped[str] = mapped_column(String(20), default="identified")
    cycle_mode: Mapped[str] = mapped_column(String(20), default="single")
    max_cycles: Mapped[int] = mapped_column(Integer, default=1)
    current_cycle: Mapped[int] = mapped_column(Integer, default=1)
    ranking_mode: Mapped[str] = mapped_column(String(20), default="auto")
    language: Mapped[str] = mapped_column(String(10), default="en")
    max_response_length: Mapped[int] = mapped_column(Integer, default=500)

    # AI provider for this session (moderator selects at creation)
    ai_provider: Mapped[str] = mapped_column(String(20), default="openai")

    # STT provider settings (Moderator configures at session creation)
    stt_provider: Mapped[str] = mapped_column(
        String(20), default="openai"
    )  # Batch STT: openai | grok | gemini
    realtime_stt_enabled: Mapped[bool] = mapped_column(
        default=False
    )  # Paid feature: real-time word-by-word (Azure/AWS)
    realtime_stt_provider: Mapped[str] = mapped_column(
        String(20), default="azure"
    )  # Streaming STT: azure | aws
    allow_user_stt_choice: Mapped[bool] = mapped_column(
        default=False
    )  # If True, users can override stt_provider with their preference

    # Determinism
    seed: Mapped[str | None] = mapped_column(String(255))
    replay_hash: Mapped[str | None] = mapped_column(String(64))

    # URLs
    qr_url: Mapped[str | None] = mapped_column(String(2048))
    join_url: Mapped[str | None] = mapped_column(String(2048))

    # Timestamps
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Appearance — Moderator's theme cascades to all session participants
    theme_id: Mapped[str] = mapped_column(String(50), default="exel-cyan")
    custom_accent_color: Mapped[str | None] = mapped_column(String(7))  # hex e.g. #FF5733

    # Monetization
    is_paid: Mapped[bool] = mapped_column(default=False)
    stripe_session_id: Mapped[str | None] = mapped_column(String(255))

    # Relationships
    participants: Mapped[list["Participant"]] = relationship(back_populates="session")
    questions: Mapped[list["Question"]] = relationship(back_populates="session", order_by="Question.order_index")
    themes: Mapped[list["Theme"]] = relationship(back_populates="session")
    rankings: Mapped[list["Ranking"]] = relationship(back_populates="session")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="session")
    time_entries: Mapped[list["TimeEntry"]] = relationship(back_populates="session")
    theme_samples: Mapped[list["ThemeSample"]] = relationship(back_populates="session")

    @property
    def is_expired(self) -> bool:
        if self.expires_at is None:
            return False
        return datetime.now(timezone.utc) >= self.expires_at

    def can_transition_to(self, new_status: str) -> bool:
        return new_status in SESSION_TRANSITIONS.get(self.status, ())

    __table_args__ = (
        Index("ix_sessions_status", "status"),
        Index("ix_sessions_created_by", "created_by"),
    )
