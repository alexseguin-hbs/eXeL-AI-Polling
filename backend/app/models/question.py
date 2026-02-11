import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.session import Session


class Question(Base):
    __tablename__ = "questions"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    cycle_id: Mapped[int] = mapped_column(Integer, default=1)
    question_text: Mapped[str] = mapped_column(String(500), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    parent_theme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("themes.id")
    )

    session: Mapped["Session"] = relationship(back_populates="questions")

    __table_args__ = (
        Index("ix_questions_session_cycle", "session_id", "cycle_id"),
    )
