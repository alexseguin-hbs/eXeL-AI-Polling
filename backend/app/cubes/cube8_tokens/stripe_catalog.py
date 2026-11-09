"""Cube 8 — Stripe catalog: which live Product each Checkout line item belongs to.

Products were created once on the live eXeL AI account (idempotent setup, 2026-11-08); their IDs live in
settings (app/config.py). Amounts stay dynamic (`price_data.unit_amount`) because donations are donor-chosen and
poll prices are cost × margin, but every line item is attached to a real Product so Stripe reporting groups
revenue by product line. With a TEST key the live product IDs do not exist, so we fall back to inline
`product_data` (same name/description) — the flow works in either mode.
"""

from __future__ import annotations

from app.config import settings
from app.cubes.cube8_tokens.stripe_config import key_mode, resolve_secret_key

# product_line → (settings attr, fallback name)
_PRODUCTS: dict[str, tuple[str, str]] = {
    "divinity_guide_donation": ("stripe_product_divinity_donation", "The Divinity Guide — Donation"),
    "derisking_strategies_donation": ("stripe_product_derisking_donation", "DeRisking Strategies — Donation"),
    "community_donation": ("stripe_product_community_donation", "eXeL AI Polling — Community Contribution"),
    "poll_moderator_paid": ("stripe_product_poll_moderator_paid", "eXeL AI Polling — Moderator Paid poll"),
    "poll_cost_split_moderator": ("stripe_product_poll_cost_split_moderator", "eXeL AI Polling — Cost Split poll (moderator 50%)"),
    "poll_cost_split_participant": ("stripe_product_poll_cost_split_participant", "eXeL AI Polling — Cost Split poll (participant share)"),
}

# Donation purpose (public API value) → product line + PaymentTransaction.transaction_type
DONATION_PURPOSES: dict[str, tuple[str, str]] = {
    "divinity_guide": ("divinity_guide_donation", "divinity_guide_donation"),
    "derisking_strategies": ("derisking_strategies_donation", "derisking_strategies_donation"),
    "community": ("community_donation", "donation"),
}


def product_id(line: str) -> str:
    attr, _ = _PRODUCTS[line]
    pid = getattr(settings, attr, "") or ""
    return pid if pid and key_mode(resolve_secret_key()) == "live" else ""


def price_data(line: str, unit_amount: int, *, name: str | None = None, description: str | None = None) -> dict:
    """`price_data` for a Checkout line item: attached to the live Product when available."""
    pid = product_id(line)
    if pid:
        return {"currency": "usd", "unit_amount": int(unit_amount), "product": pid}
    _, fallback = _PRODUCTS[line]
    pd = {"name": (name or fallback)[:250]}
    if description:
        pd["description"] = description[:250]
    return {"currency": "usd", "unit_amount": int(unit_amount), "product_data": pd}


def catalog_status() -> dict:
    mode = key_mode(resolve_secret_key()) if resolve_secret_key() else "unconfigured"
    return {
        "mode": mode,
        "products": {line: (getattr(settings, attr, "") or None) for line, (attr, _) in _PRODUCTS.items()},
        "attached": mode == "live",
    }
