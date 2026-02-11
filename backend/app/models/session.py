import uuid
from datetime import datetime
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
    from app.models.time_tracking import TimeEntry


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

    # URLs
    qr_url: Mapped[str | None] = mapped_column(String(2048))
    join_url: Mapped[str | None] = mapped_column(String(2048))

    # Timestamps
    opened_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Monetization
    is_paid: Mapped[bool] = mapped_column(default=False)
    stripe_session_id: Mapped[str | None] = mapped_column(String(255))

    # Relationships
    participants: Mapped[list["Participant"]] = relationship(back_populates="session")
    questions: Mapped[list["Question"]] = relationship(back_populates="session")
    themes: Mapped[list["Theme"]] = relationship(back_populates="session")
    rankings: Mapped[list["Ranking"]] = relationship(back_populates="session")
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="session")
    time_entries: Mapped[list["TimeEntry"]] = relationship(back_populates="session")

    __table_args__ = (
        Index("ix_sessions_status", "status"),
        Index("ix_sessions_created_by", "created_by"),
    )
