"""Product-line classification for Cube8 payments — donations vs paid eXeL sessions.

Preserves existing transaction_type strings; adds product_line + purpose metadata.
"""

from __future__ import annotations

from typing import Any

# Existing transaction_type values in PaymentTransaction / Stripe metadata
SESSION_CHARGE_TYPES = frozenset({
    "moderator_fee",
    "cost_split",
    "usage_billing",
})

DONATION_TYPES = frozenset({
    "donation",  # post-results session-anchored voluntary
    "divinity_guide_donation",
    "derisking_strategies_donation",  # new explicit type for DeRisking Strategies
})

PRODUCT_LINE_EXEL_SESSION = "exel_session_charge"
PRODUCT_LINE_DONATION_SESSION = "exel_session_donation"
PRODUCT_LINE_DONATION_DIVINITY = "divinity_guide_donation"
PRODUCT_LINE_DONATION_DERISKING = "derisking_strategies_donation"


def product_line_for(transaction_type: str) -> str:
    t = (transaction_type or "").strip()
    if t in ("moderator_fee", "cost_split", "usage_billing"):
        return PRODUCT_LINE_EXEL_SESSION
    if t == "donation":
        return PRODUCT_LINE_DONATION_SESSION
    if t == "divinity_guide_donation":
        return PRODUCT_LINE_DONATION_DIVINITY
    if t == "derisking_strategies_donation":
        return PRODUCT_LINE_DONATION_DERISKING
    return f"unknown:{t or '?'}"


def is_donation(transaction_type: str) -> bool:
    return (transaction_type or "") in DONATION_TYPES


def is_session_charge(transaction_type: str) -> bool:
    return (transaction_type or "") in SESSION_CHARGE_TYPES


def stripe_metadata(
    *,
    transaction_type: str,
    session_id: str | None = None,
    participant_id: str | None = None,
    scope_ref: str | None = None,
    purpose: str | None = None,
    extra: dict[str, Any] | None = None,
) -> dict[str, str]:
    """Build Stripe metadata preserving existing keys + product_line."""
    md: dict[str, str] = {
        "transaction_type": transaction_type,
        "product_line": product_line_for(transaction_type),
    }
    if session_id:
        md["session_id"] = session_id
    if participant_id:
        md["participant_id"] = participant_id
    if scope_ref:
        md["scope_ref"] = scope_ref
    if purpose:
        md["purpose"] = purpose
    elif is_donation(transaction_type):
        md["purpose"] = "donation"
    elif is_session_charge(transaction_type):
        md["purpose"] = "session_charge"
    if extra:
        for k, v in extra.items():
            if v is not None:
                md[str(k)] = str(v)
    return md
