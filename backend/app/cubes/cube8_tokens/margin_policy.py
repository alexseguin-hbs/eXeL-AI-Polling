"""Margin / markup policy — gated OFF until operator clarifies cost+50% vs 50% gross margin.

Do NOT activate automatic session pricing from this module.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Literal

from app.cubes.cube8_tokens.cost_ledger import D, money

MarginInterpretation = Literal["markup_1_5", "gross_margin_50"]

# Hard gate — must stay False until human clarification + sandbox proof.
PRICING_ACTIVATION_ENABLED = False


def apply_margin(cost_usd: Decimal, interpretation: MarginInterpretation) -> Decimal:
    """Return suggested price from cost. Raises if activation disabled (default)."""
    if not PRICING_ACTIVATION_ENABLED:
        raise RuntimeError(
            "Pricing activation disabled pending margin clarification "
            "(cost*1.5 markup vs cost/0.5 gross margin). Preserve current prices."
        )
    if interpretation == "markup_1_5":
        return money(cost_usd * D("1.5"))
    if interpretation == "gross_margin_50":
        return money(cost_usd / D("0.5"))
    raise ValueError(f"unknown interpretation: {interpretation}")


def preview_margin_both(cost_usd: Decimal) -> dict:
    """Safe preview of both interpretations without activating prices."""
    c = money(cost_usd)
    return {
        "pricing_activation_enabled": PRICING_ACTIVATION_ENABLED,
        "cost_usd": str(c),
        "markup_1_5_price_usd": str(money(c * D("1.5"))),
        "gross_margin_50_price_usd": str(money(c / D("0.5"))),
        "note": "Preview only — do not charge; activation gated OFF",
    }
