import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TokenLedger(Base):
    __tablename__ = "token_ledger"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    user_id: Mapped[str | None] = mapped_column(String(255))
    anon_hash: Mapped[str | None] = mapped_column(String(64))
    cube_id: Mapped[str | None] = mapped_column(String(20))
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    delta_heart: Mapped[float] = mapped_column(Float, default=0.0)
    delta_human: Mapped[float] = mapped_column(Float, default=0.0)
    delta_unity: Mapped[float] = mapped_column(Float, default=0.0)
    lifecycle_state: Mapped[str] = mapped_column(String(20), default="pending")
    reason: Mapped[str | None] = mapped_column(String(500))
    reference_id: Mapped[str | None] = mapped_column(String(255))
    version_id: Mapped[str | None] = mapped_column(String(255))

    __table_args__ = (
        Index("ix_token_ledger_session", "session_id"),
        Index("ix_token_ledger_user", "user_id"),
        Index("ix_token_ledger_lifecycle", "lifecycle_state"),
    )


class TokenDispute(Base):
    __tablename__ = "token_disputes"

    ledger_entry_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("token_ledger.id"), nullable=False
    )
    flagged_by: Mapped[str] = mapped_column(String(255), nullable=False)
    reason: Mapped[str] = mapped_column(String(1000), nullable=False)
    evidence: Mapped[str | None] = mapped_column(String(2000))
    status: Mapped[str] = mapped_column(String(20), default="open")
    resolution_notes: Mapped[str | None] = mapped_column(String(2000))
    resolved_by: Mapped[str | None] = mapped_column(String(255))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index("ix_token_disputes_status", "status"),
    )
