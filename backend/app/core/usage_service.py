"""Usage metering service — append events + aggregate per org for billing/analytics.

`record_usage` appends one immutable event (fire-and-forget friendly). `summarize_usage`
returns per-metric totals (count + tokens) over an optional window, org-scoped. Pure
aggregation SQL so it scales to millions of rows via the (org, metric, time) index.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.usage_record import USAGE_METRICS, UsageRecord

# Billing price list — SoI ◬ tokens per unit of each metric (the monetization anchor;
# CLAUDE.md: cost estimated from # users × # responses × AI processing). Deterministic +
# config-overridable later. webhook_delivery matches the 0.99 ◬/delivery convention.
USAGE_PRICES: dict[str, float] = {
    "api_call": 0.01,
    "ai_inference": 0.50,
    "webhook_delivery": 0.99,
    "export": 2.00,
    "response_processed": 0.10,
}
# ◬ → USD conversion for the human-readable estimate (config-overridable).
TOKEN_USD_RATE = 0.001


def estimate_cost(by_metric: dict[str, dict]) -> dict:
    """Turn a per-metric usage summary into a billable ◬ + USD estimate. Pure: price table
    is authoritative (quantity × unit price), so it never double-counts recorded cost_tokens."""
    per: dict[str, dict] = {}
    total_tokens = 0.0
    for metric, price in USAGE_PRICES.items():
        qty = int(by_metric.get(metric, {}).get("quantity", 0))
        tokens = round(qty * price, 4)
        per[metric] = {"quantity": qty, "unit_price_tokens": price, "cost_tokens": tokens}
        total_tokens += tokens
    total_tokens = round(total_tokens, 4)
    return {
        "by_metric": per,
        "billable_tokens": total_tokens,
        "estimated_usd": round(total_tokens * TOKEN_USD_RATE, 4),
        "token_usd_rate": TOKEN_USD_RATE,
    }


async def record_usage(
    db: AsyncSession, *, org_id: str, metric: str, quantity: int = 1,
    cost_tokens: float = 0.0, api_key_id: uuid.UUID | None = None,
    session_id: uuid.UUID | None = None, scope_ref: str | None = None,
    occurred_at: datetime | None = None,
) -> UsageRecord:
    """Append a usage event. Unknown metric → ValueError (WireGuard on the metric name)."""
    if metric not in USAGE_METRICS:
        raise ValueError(f"metric must be one of {USAGE_METRICS}, got {metric!r}")
    rec = UsageRecord(
        org_id=org_id, metric=metric, quantity=max(0, int(quantity)),
        cost_tokens=float(cost_tokens), api_key_id=api_key_id, session_id=session_id,
        scope_ref=scope_ref, occurred_at=occurred_at or datetime.now(timezone.utc),
    )
    db.add(rec)
    await db.flush()
    return rec


async def summarize_usage(
    db: AsyncSession, *, org_id: str,
    start: datetime | None = None, end: datetime | None = None,
    session_id: uuid.UUID | None = None,
) -> dict:
    """Per-metric totals for an org over [start, end). Returns every known metric (0 when
    unused) so a billing consumer sees a stable shape, plus overall totals. Pass
    `session_id` to scope the summary to a single session (per-session metered billing)."""
    stmt = (
        select(
            UsageRecord.metric,
            func.coalesce(func.sum(UsageRecord.quantity), 0),
            func.coalesce(func.sum(UsageRecord.cost_tokens), 0.0),
        )
        .where(UsageRecord.org_id == org_id)
        .group_by(UsageRecord.metric)
    )
    if start is not None:
        stmt = stmt.where(UsageRecord.occurred_at >= start)
    if end is not None:
        stmt = stmt.where(UsageRecord.occurred_at < end)
    if session_id is not None:
        stmt = stmt.where(UsageRecord.session_id == session_id)

    by_metric = {m: {"quantity": 0, "cost_tokens": 0.0} for m in USAGE_METRICS}
    total_qty, total_tokens = 0, 0.0
    for metric, qty, tokens in (await db.execute(stmt)).all():
        by_metric.setdefault(metric, {"quantity": 0, "cost_tokens": 0.0})
        by_metric[metric] = {"quantity": int(qty), "cost_tokens": round(float(tokens), 4)}
        total_qty += int(qty)
        total_tokens += float(tokens)
    return {
        "org_id": org_id,
        "start": start.isoformat() if start else None,
        "end": end.isoformat() if end else None,
        "by_metric": by_metric,
        "total_quantity": total_qty,
        "total_cost_tokens": round(total_tokens, 4),
        # Billable estimate from the authoritative price table (◬ + USD) — the monetization
        # anchor a billing consumer reads; independent of recorded cost_tokens (no double-count).
        "cost": estimate_cost(by_metric),
    }
