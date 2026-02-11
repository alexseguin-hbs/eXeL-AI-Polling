import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.session import Session


class Theme(Base):
    __tablename__ = "themes"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    cycle_id: Mapped[int] = mapped_column(Integer, default=1)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    response_count: Mapped[int] = mapped_column(Integer, default=0)
    exemplar_response_ids: Mapped[dict | None] = mapped_column(JSON)
    parent_theme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("themes.id")
    )
    cluster_metadata: Mapped[dict | None] = mapped_column(JSON)
    ai_provider: Mapped[str] = mapped_column(String(50), default="")
    ai_model: Mapped[str] = mapped_column(String(100), default="")

    session: Mapped["Session"] = relationship(back_populates="themes")

    __table_args__ = (
        Index("ix_themes_session_cycle", "session_id", "cycle_id"),
    )
