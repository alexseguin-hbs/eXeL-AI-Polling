"""Cube 8 — Payment models for Stripe integration.

3 pricing tiers:
  Free (max 19): donation after results
  Moderator Paid: min $11.11 upfront, donation after results
  Cost Split: 50% Moderator + 50%/N Users, donation after results
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False
    )
    participant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("participants.id"), nullable=True
    )
    transaction_type: Mapped[str] = mapped_column(
        String(30), nullable=False
        # moderator_fee / cost_split / donation / reward_payout
    )
    amount_cents: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    stripe_payment_intent_id: Mapped[str | None] = mapped_column(String(255))
    stripe_checkout_session_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(
        String(20), default="pending"
        # pending / completed / failed / refunded
    )
    metadata_json: Mapped[str | None] = mapped_column(Text)

    __table_args__ = (
        Index("ix_payment_tx_session", "session_id"),
        Index("ix_payment_tx_status", "status"),
        Index("ix_payment_tx_stripe_pi", "stripe_payment_intent_id"),
    )
