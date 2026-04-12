"""Trend Forecasting model — cross-session theme tracking (Odin).

Tracks how themes shift across sessions within a project/organization.
Enables: "Priority shifted from Infrastructure to AI Governance over 3 months"

Subscription: $11.11/mo via Stripe recurring billing.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TrendSnapshot(Base):
    """Point-in-time snapshot of theme rankings for a session.

    One row per session — captures the theme state at close time.
    Used to build longitudinal trend lines across sessions.
    """
    __tablename__ = "trend_snapshots"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False, unique=True
    )
    project_id: Mapped[str] = mapped_column(
        String(100), nullable=False  # Groups sessions for cross-session analysis
    )
    snapshot_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    input_count: Mapped[int] = mapped_column(Integer, default=0)
    participant_count: Mapped[int] = mapped_column(Integer, default=0)

    # Theme rankings as JSON arrays (ordered by rank)
    themes_3: Mapped[dict | None] = mapped_column(JSON)   # [{label, rank, confidence, count}]
    themes_6: Mapped[dict | None] = mapped_column(JSON)
    themes_9: Mapped[dict | None] = mapped_column(JSON)

    # Compression ratio at snapshot time
    compression_ratio: Mapped[float | None] = mapped_column(Float)

    __table_args__ = (
        Index("ix_trend_project", "project_id"),
        Index("ix_trend_snapshot_at", "snapshot_at"),
        Index("ix_trend_project_time", "project_id", "snapshot_at"),
    )


class TrendSubscription(Base):
    """Monthly subscription for cross-session trend access.

    $11.11/mo via Stripe recurring billing.
    Scoped to a project_id (organization-level).
    """
    __tablename__ = "trend_subscriptions"

    user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    project_id: Mapped[str] = mapped_column(String(100), nullable=False)
    stripe_subscription_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(
        String(20), default="active"
        # active / cancelled / past_due / trialing
    )
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime)
    amount_cents: Mapped[int] = mapped_column(Integer, default=1111)  # $11.11/mo

    __table_args__ = (
        Index("ix_trend_sub_user", "user_id"),
        Index("ix_trend_sub_project", "project_id"),
        Index("ix_trend_sub_status", "status"),
    )
