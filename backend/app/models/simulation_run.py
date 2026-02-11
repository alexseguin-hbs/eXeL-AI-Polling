import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, String, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    cube_id: Mapped[str] = mapped_column(String(20), nullable=False)
    initiated_by: Mapped[str] = mapped_column(String(255), nullable=False)
    base_version: Mapped[str] = mapped_column(String(100), nullable=False)
    proposed_version: Mapped[str] = mapped_column(String(100), nullable=False)
    replay_dataset_ref: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), default="pending")
    metrics: Mapped[dict | None] = mapped_column(JSON)
    results_summary: Mapped[str | None] = mapped_column(Text)
    pass_fail: Mapped[bool | None] = mapped_column(Boolean)
    approved_by: Mapped[str | None] = mapped_column(String(255))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(String(1000))

    __table_args__ = (
        Index("ix_simulation_runs_cube", "cube_id"),
        Index("ix_simulation_runs_status", "status"),
    )
