"""Webhook registration model — stores subscriber URLs for event delivery.

Event types:
  themes_ready      — AI theming complete, themes available
  ranking_complete   — Voting/ranking aggregation finished
  session_closed     — Session transitioned to closed state
  export_ready       — CSV export generated and available
  payment_received   — Stripe payment completed

Delivery: POST to registered URL with JSON payload + HMAC signature.
Metered: 0.99 ◬ per successful delivery.
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

VALID_EVENT_TYPES = [
    "themes_ready",
    "ranking_complete",
    "session_closed",
    "export_ready",
    "payment_received",
]


class WebhookSubscription(Base):
    __tablename__ = "webhook_subscriptions"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    url: Mapped[str] = mapped_column(Text, nullable=False)
    event_types: Mapped[str] = mapped_column(
        Text, nullable=False  # Comma-separated: "themes_ready,ranking_complete"
    )
    secret: Mapped[str] = mapped_column(
        String(64), nullable=False  # HMAC signing secret
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    failure_count: Mapped[int] = mapped_column(Integer, default=0)
    max_failures: Mapped[int] = mapped_column(Integer, default=5)
    last_delivery_at: Mapped[datetime | None] = mapped_column(DateTime)
    last_failure_at: Mapped[datetime | None] = mapped_column(DateTime)

    __table_args__ = (
        Index("ix_webhook_sub_session", "session_id"),
        Index("ix_webhook_sub_active", "is_active"),
    )


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    subscription_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("webhook_subscriptions.id"), nullable=False
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    status_code: Mapped[int | None] = mapped_column(Integer)
    response_body: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(
        String(20), default="pending"
        # pending / delivered / failed / retrying
    )
    attempt_count: Mapped[int] = mapped_column(Integer, default=0)
    cost_tokens: Mapped[float] = mapped_column(default=0.99)  # ◬ per delivery

    __table_args__ = (
        Index("ix_webhook_del_sub", "subscription_id"),
        Index("ix_webhook_del_status", "status"),
    )
