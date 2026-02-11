import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.session import Session


class AuditLog(Base):
    __tablename__ = "audit_logs"

    session_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id")
    )
    actor_id: Mapped[str] = mapped_column(String(255), nullable=False)
    actor_role: Mapped[str] = mapped_column(String(50), nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    object_type: Mapped[str] = mapped_column(String(50), nullable=False)
    object_id: Mapped[str | None] = mapped_column(String(255))
    before_state: Mapped[dict | None] = mapped_column(JSON)
    after_state: Mapped[dict | None] = mapped_column(JSON)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(String(500))

    session: Mapped["Session | None"] = relationship(back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_logs_session", "session_id"),
        Index("ix_audit_logs_actor", "actor_id"),
        Index("ix_audit_logs_action", "action_type"),
        Index("ix_audit_logs_timestamp", "created_at"),
    )
