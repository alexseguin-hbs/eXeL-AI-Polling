"""Per-org usage metering — the billing/analytics event stream for the API-first platform.

Every metered action (an API call, an AI inference, a webhook delivery, an export) appends
one row scoped to the org (and optionally the API key + scope_ref that produced it). Rows
are immutable; billing aggregates them per period. Kept deliberately generic so any producer
can `record_usage(...)` one line without a bespoke table.
"""

import uuid
from datetime import datetime

from sqlalchemy import Float, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base

# Canonical metered metrics (extend as producers are added).
USAGE_METRICS = (
    "api_call",
    "ai_inference",
    "webhook_delivery",
    "export",
    "response_processed",
)


class UsageRecord(Base):
    __tablename__ = "usage_records"

    org_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    metric: Mapped[str] = mapped_column(String(40), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    # Cost in SoI ◬ tokens (matches the webhook 0.99 ◬/delivery convention).
    cost_tokens: Mapped[float] = mapped_column(Float, default=0.0)
    # Provenance (all nullable) — which key / session / scope produced the usage.
    api_key_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))
    scope_ref: Mapped[str | None] = mapped_column(String(255))
    occurred_at: Mapped[datetime] = mapped_column(nullable=False)

    __table_args__ = (
        Index("ix_usage_org_metric_time", "org_id", "metric", "occurred_at"),
    )
