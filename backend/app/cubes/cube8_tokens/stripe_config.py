"""Cube 8 — Stripe configuration + status (wire the existing Stripe integration).

Resolves the effective API keys from the ENVIRONMENT (never the repo), reports a safe status
for the ops UI, and raises a HELPFUL error when a Stripe call is attempted with no key set —
instead of the cryptic auth error Stripe throws on an empty key.

KEY SOURCES (see backend/.env.example — nothing secret lives in the repo):
  • Test:  STRIPE_SECRET_KEY (sk_test_…)  + STRIPE_PUBLISHABLE_KEY (pk_test_…)
  • Live:  STRIPE_LIVE_SECRET_KEY (sk_live_…) + STRIPE_LIVE_PUBLISHABLE_KEY (pk_live_…)
Live keys are used only when ENVIRONMENT=production (and a live key is present); otherwise the
test key is used. The full SECRET key is NEVER returned or logged — only a masked prefix + the
mode (test/live). The publishable key is browser-safe and may be surfaced in full.
"""
from __future__ import annotations

from app.config import settings


class StripeNotConfiguredError(RuntimeError):
    """Raised when a Stripe call is attempted with no API key configured (helpful message)."""


def _is_production() -> bool:
    return settings.environment.lower() in ("production", "prod", "live")


def resolve_secret_key() -> str:
    """Effective server-side API key, resolved from the ENVIRONMENT only (never the repo).

    Prefers a RESTRICTED key (RAK, `rk_…`) over the unrestricted secret key within each mode —
    Stripe's own recommendation ("migrate secret key usage to RAKs") to limit blast radius if a
    key leaks. Uses live keys in production, test keys otherwise, and falls back across modes so a
    single configured key always works.
    """
    live = (settings.stripe_live_restricted_key, settings.stripe_live_secret_key)
    test = (settings.stripe_restricted_key, settings.stripe_secret_key)
    order = (live + test) if _is_production() else (test + live)
    for key in order:
        if key:
            return key
    return ""


def resolve_publishable_key() -> str:
    """Effective publishable key (browser-safe), mirroring the secret-key resolution order."""
    if _is_production() and settings.stripe_live_publishable_key:
        return settings.stripe_live_publishable_key
    return settings.stripe_publishable_key or settings.stripe_live_publishable_key or ""


def key_mode(key: str) -> str:
    """'test' | 'live' | 'unknown' from a Stripe key prefix."""
    if key.startswith(("sk_live_", "pk_live_", "rk_live_")):
        return "live"
    if key.startswith(("sk_test_", "pk_test_", "rk_test_")):
        return "test"
    return "unknown"


def stripe_configured() -> bool:
    return bool(resolve_secret_key())


def get_stripe_client():
    """Return the `stripe` module with api_key set — or raise a HELPFUL error if unconfigured."""
    import stripe

    key = resolve_secret_key()
    if not key:
        raise StripeNotConfiguredError(
            "Stripe is not configured. Add a key to backend/.env (see backend/.env.example): "
            "test → STRIPE_SECRET_KEY=sk_test_… ; production → ENVIRONMENT=production + "
            "STRIPE_LIVE_SECRET_KEY=sk_live_… . Never commit real keys."
        )
    stripe.api_key = key
    return stripe


def _mask(key: str) -> str:
    """Show only enough of a key to identify it — never the full secret."""
    if not key:
        return ""
    return f"{key[:8]}…{key[-4:]}" if len(key) > 12 else f"{key[:4]}…"


def stripe_config_status() -> dict:
    """Safe status for the ops UI. Full secret key is NEVER included — only a masked prefix."""
    sk = resolve_secret_key()
    pk = resolve_publishable_key()
    mode = key_mode(sk) if sk else "unconfigured"
    return {
        "configured": bool(sk),
        "mode": mode,                       # test | live | unknown | unconfigured
        "environment": settings.environment,
        "secret_key_masked": _mask(sk),     # e.g. "sk_test_…vUZw" — never the full key
        "publishable_key": pk,              # browser-safe, full value OK
        "webhook_configured": bool(settings.stripe_webhook_secret),
        "live_mode_warning": mode == "live",  # UI shows a red banner when operating on live keys
    }
