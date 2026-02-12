"""ThemeSample model — stores marble sampling results for the AI pipeline."""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.session import Session
    from app.models.theme import Theme


class ThemeSample(Base):
    __tablename__ = "theme_samples"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    theme01_label: Mapped[str] = mapped_column(String(50), nullable=False)
    sample_index: Mapped[int] = mapped_column(Integer, nullable=False)
    response_ids: Mapped[list] = mapped_column(JSON, nullable=False)
    secondary_theme: Mapped[str] = mapped_column(String(255), default="")
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    theme_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("themes.id")
    )

    session: Mapped["Session"] = relationship(back_populates="theme_samples")
    theme: Mapped["Theme | None"] = relationship()

    __table_args__ = (
        Index("ix_theme_samples_session", "session_id"),
        Index("ix_theme_samples_session_label", "session_id", "theme01_label"),
    )
