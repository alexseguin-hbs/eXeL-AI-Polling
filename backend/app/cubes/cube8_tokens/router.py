"""Cube 8 — Token Reward Calculator + Stripe Payments.

SoI Trinity token ledger:
  ♡ = time-based participation (ceil minutes = tokens, rounds UP)
  웃 = jurisdiction min-wage rate (7.25/hr default, Austin TX)
      Format: #.### (3 decimal places, no currency symbol)
  ◬ = 5x ♡ default

Payments (3 tiers):
  Free (max 19): donation after results
  Moderator Paid: min $11.11 upfront via Stripe Checkout
  Cost Split: 50% Moderator + 50%/N Users via Payment Intents
"""

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# WireGuard-style whitelist constants — reject anything not in the set
# ---------------------------------------------------------------------------
VALID_TOKEN_TYPES = {"heart", "human", "triangle"}
VALID_LIFECYCLE_STATES = {"simulated", "pending", "approved", "finalized", "reversed"}
VALID_LIFECYCLE_TRANSITIONS = {
    "simulated": {"pending"},
    "pending": {"approved", "reversed"},
    "approved": {"finalized", "reversed"},
    "finalized": {"reversed"},
    "reversed": set(),
}
VALID_PAYMENT_PROVIDERS = {"stripe"}
VALID_DISPUTE_RESOLUTIONS = {"resolved", "rejected"}
# ISO 3166-1 alpha-2: exactly 2 uppercase ASCII letters
_JURISDICTION_RE = re.compile(r"^[A-Z]{2}$")

from fastapi.responses import HTMLResponse

from app.core.auth import CurrentUser, get_current_user
from app.core.dependencies import get_db
from app.core.hi_rates import get_all_rates, resolve_human_rate
from app.core.permissions import require_role
from app.cubes.cube8_tokens import payment_service, service, stripe_config
from app.schemas.token import TokenDisputeCreate, TokenDisputeRead, TokenLedgerRead

router = APIRouter(tags=["Cube 8 — Tokens"])


# ---------------------------------------------------------------------------
# Payment Schemas
# ---------------------------------------------------------------------------


class ModeratorCheckoutRequest(BaseModel):
    session_id: uuid.UUID
    amount_cents: int | None = None  # None = minimum $11.11
    success_url: str = ""
    cancel_url: str = ""


class CostSplitRequest(BaseModel):
    session_id: uuid.UUID
    participant_id: uuid.UUID
    is_moderator: bool = False


class DonationRequest(BaseModel):
    session_id: uuid.UUID
    participant_id: uuid.UUID | None = None
    amount_cents: int


# ---------------------------------------------------------------------------
# Stripe Status & Ops UI (wire the existing Stripe integration)
# ---------------------------------------------------------------------------


@router.get("/payments/stripe/status")
async def get_stripe_status():
    """Safe Stripe configuration status (masked secret — never the full key)."""
    return stripe_config.stripe_config_status()


@router.post("/payments/stripe/test-checkout")
async def create_stripe_test_checkout(
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Create a standalone $11.11 test Checkout Session to verify charge capability.

    Returns the Stripe-hosted URL. Helpful 400 when unconfigured; 502 on a Stripe error
    (e.g. the dev sandbox blocks api.stripe.com — run backend/scripts/verify_stripe_charge.py
    where Stripe is reachable, or unblock the host in the environment network policy).
    """
    from fastapi import HTTPException

    try:
        stripe = stripe_config.get_stripe_client()
    except stripe_config.StripeNotConfiguredError as e:
        raise HTTPException(status_code=400, detail=str(e))
    try:
        cs = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{"price_data": {"currency": "usd",
                "product_data": {"name": "eXeL AI Polling — Stripe verification ($11.11)"},
                "unit_amount": 1111}, "quantity": 1}],
            success_url="https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="https://example.com/cancel",
        )
        return {"url": cs.url, "mode": stripe_config.stripe_config_status()["mode"]}
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Stripe error: {type(e).__name__}: {e}")


@router.get("/payments/stripe", response_class=HTMLResponse)
async def stripe_ops_page():
    """Simple ops page: shows Stripe config status + how to verify charging."""
    s = stripe_config.stripe_config_status()
    mode = s["mode"]
    badge = {"test": ("#16c784", "TEST MODE"), "live": ("#e5484d", "⚠ LIVE MODE"),
             "unconfigured": ("#8b8f96", "NOT CONFIGURED")}.get(mode, ("#f5a623", mode.upper()))
    dot = "#16c784" if s["configured"] else "#e5484d"
    wh = "#16c784" if s["webhook_configured"] else "#f5a623"
    html = f"""<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>eXeL AI · Stripe Status</title>
<style>
  :root{{color-scheme:dark}}
  body{{margin:0;background:#0a0e14;color:#e6edf3;font:15px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}}
  .wrap{{max-width:640px;margin:0 auto;padding:32px 20px}}
  h1{{font-size:20px;margin:0 0 4px;color:#00ffff}}
  .sub{{color:#8b98a5;margin:0 0 24px;font-size:13px}}
  .card{{background:#111722;border:1px solid #1e2733;border-radius:12px;padding:20px;margin:0 0 16px}}
  .row{{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #19212b}}
  .row:last-child{{border-bottom:none}}
  .k{{color:#8b98a5}} .v{{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}}
  .badge{{display:inline-block;padding:3px 10px;border-radius:999px;font-size:12px;font-weight:600;color:#0a0e14;background:{badge[0]}}}
  .dot{{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:middle}}
  code{{background:#0a0e14;border:1px solid #1e2733;border-radius:6px;padding:2px 6px;font-size:13px}}
  pre{{background:#0a0e14;border:1px solid #1e2733;border-radius:8px;padding:12px;overflow:auto;font-size:12.5px}}
  .hint{{color:#8b98a5;font-size:13px}}
</style></head><body><div class="wrap">
  <h1>◬ eXeL AI Polling — Stripe Status</h1>
  <p class="sub">SoI Trinity payments · Cube 8. Keys come only from the environment; nothing secret is stored in the repo.</p>
  <div class="card">
    <div class="row"><span class="k">Configured</span><span class="v"><span class="dot" style="background:{dot}"></span>{str(s['configured']).lower()}</span></div>
    <div class="row"><span class="k">Mode</span><span class="v"><span class="badge">{badge[1]}</span></span></div>
    <div class="row"><span class="k">Environment</span><span class="v">{s['environment']}</span></div>
    <div class="row"><span class="k">Secret key</span><span class="v">{s['secret_key_masked'] or '—'}</span></div>
    <div class="row"><span class="k">Publishable key</span><span class="v">{(s['publishable_key'][:14] + '…') if s['publishable_key'] else '—'}</span></div>
    <div class="row"><span class="k">Webhook secret</span><span class="v"><span class="dot" style="background:{wh}"></span>{'set' if s['webhook_configured'] else 'not set'}</span></div>
  </div>
  <div class="card">
    <b>Verify charge capability</b>
    <p class="hint">Run where <code>api.stripe.com</code> is reachable (the dev sandbox blocks it):</p>
    <pre>export STRIPE_SECRET_KEY=sk_test_…
cd backend &amp;&amp; python scripts/verify_stripe_charge.py</pre>
    <p class="hint">Or, as admin: <code>POST /api/v1/payments/stripe/test-checkout</code> → returns a hosted $11.11 checkout URL.</p>
  </div>
</div></body></html>"""
    return HTMLResponse(html)


# ---------------------------------------------------------------------------
# Payment Endpoints
# ---------------------------------------------------------------------------


@router.post("/payments/moderator-checkout")
async def create_moderator_checkout(
    payload: ModeratorCheckoutRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Create Stripe Checkout Session for Moderator Paid tier (min $11.11)."""
    return await payment_service.create_moderator_checkout(
        db,
        session_id=payload.session_id,
        user_id=user.user_id,
        amount_cents=payload.amount_cents,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
    )


@router.post("/payments/cost-split")
async def create_cost_split_payment(
    payload: CostSplitRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Create Stripe Payment Intent for Cost Split tier (50%/50%)."""
    return await payment_service.create_cost_split_intent(
        db,
        session_id=payload.session_id,
        participant_id=payload.participant_id,
        user_id=user.user_id,
        is_moderator=payload.is_moderator,
    )


@router.post("/payments/donate")
async def create_donation(
    payload: DonationRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Create donation Payment Intent (shown after results delivery)."""
    return await payment_service.create_donation_intent(
        db,
        session_id=payload.session_id,
        participant_id=payload.participant_id,
        amount_cents=payload.amount_cents,
    )


class DivinityDonationRequest(BaseModel):
    amount_cents: int = 333
    success_url: str = ""
    cancel_url: str = ""


@router.post("/payments/divinity-donate")
async def create_divinity_donation(
    payload: DivinityDonationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create Stripe Checkout for Divinity Guide donation (no auth — anonymous)."""
    return await payment_service.create_divinity_donation_checkout(
        db=db,
        amount_cents=payload.amount_cents,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
    )


@router.get("/sessions/{session_id}/payments")
async def get_payment_status(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Get payment summary for a session (Moderator/Admin only)."""
    return await payment_service.get_payment_status(db, session_id)


@router.get("/sessions/{session_id}/cost-estimate")
async def get_cost_estimate(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get cost estimate for a session (used in UX for donation anchoring)."""
    return await payment_service.estimate_session_cost(db, session_id)


@router.get("/sessions/{session_id}/tokens", response_model=list[TokenLedgerRead])
async def get_session_tokens(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "lead_developer", "admin")),
):
    """CRS-25: Get token ledger for a session."""
    entries = await service.get_session_tokens(db, session_id)
    return [TokenLedgerRead.model_validate(e) for e in entries]


@router.post("/tokens/dispute", response_model=TokenDisputeRead, status_code=201)
async def create_token_dispute(
    payload: TokenDisputeCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-33: Flag/dispute token calculation."""
    dispute = await service.create_dispute(
        db,
        ledger_entry_id=payload.ledger_entry_id,
        flagged_by=user.user_id,
        reason=payload.reason,
        evidence=payload.evidence,
    )
    return TokenDisputeRead.model_validate(dispute)


@router.get("/sessions/{session_id}/tokens/balance")
async def get_user_balance(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-25: Get authenticated user's token balance for a session."""
    return await service.get_user_token_balance(db, session_id, user.user_id)


@router.get("/sessions/{session_id}/tokens/summary")
async def get_token_summary(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-19: Get aggregate token stats for moderator dashboard."""
    return await service.get_session_token_summary(db, session_id)


@router.get("/sessions/{session_id}/tokens/metrics")
async def get_token_metrics(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Cube 8 SSSES metrics (System/User/Outcome) — R-Core parity with cubes 1-7.

    Library-only metrics engine (cube8_tokens.metrics) surfaced so the Dev-Sim /
    qualification gateway can read Cube 8's live token-ledger baseline. Privileged-role
    only (aggregate session data). DB-error-guarded downstream (never 500s).
    """
    from app.cubes.cube8_tokens import metrics as token_metrics

    return await token_metrics.get_all_metrics(db, session_id)


@router.post("/tokens/{entry_id}/transition")
async def transition_state(
    entry_id: uuid.UUID,
    new_state: str = Query(..., description="Target lifecycle state"),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin")),
):
    """CRS-34.01: Transition token lifecycle state (admin only)."""
    # WireGuard: whitelist lifecycle state
    if new_state not in VALID_LIFECYCLE_STATES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid lifecycle state '{new_state}'. Must be one of: {sorted(VALID_LIFECYCLE_STATES)}",
        )
    entry = await service.transition_lifecycle_state(
        db, entry_id, new_state, transitioned_by=user.user_id
    )
    await db.commit()
    return TokenLedgerRead.model_validate(entry)


@router.post("/tokens/{entry_id}/reverse")
async def reverse_token_entry(
    entry_id: uuid.UUID,
    reason: str = Query(..., min_length=5),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """CRS-34.02: Reverse a ledger entry (append offsetting negative entry)."""
    reversal = await service.reverse_entry(
        db, entry_id, reason=reason, reversed_by=user.user_id
    )
    await db.commit()
    return TokenLedgerRead.model_validate(reversal)


@router.post("/tokens/disputes/{dispute_id}/resolve")
async def resolve_token_dispute(
    dispute_id: uuid.UUID,
    resolution: str = Query(..., description="'resolved' or 'rejected'"),
    notes: str = Query(..., min_length=5),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """CRS-33.02: Admin resolves a token dispute."""
    # WireGuard: whitelist resolution value
    if resolution not in VALID_DISPUTE_RESOLUTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid resolution '{resolution}'. Must be one of: {sorted(VALID_DISPUTE_RESOLUTIONS)}",
        )
    dispute = await service.resolve_dispute(
        db, dispute_id, resolution=resolution, notes=notes, resolved_by=user.user_id
    )
    await db.commit()
    return TokenDisputeRead.model_validate(dispute)


@router.get("/sessions/{session_id}/tokens/velocity")
async def check_velocity(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-24.03: Check token earning velocity for current user."""
    return await service.check_velocity_cap(db, session_id, user.user_id)


@router.get("/sessions/{session_id}/tokens/config")
async def get_token_config(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-35.01: Get session token policy configuration."""
    return await service.get_session_token_config(db, session_id)


@router.get("/tokens/talent/{user_id}")
async def get_talent_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin", "lead_developer")),
):
    """CRS-25.06: Get talent profile for a user (Moderator/Admin/Lead only)."""
    return await service.get_talent_profile(db, user_id)


@router.get("/tokens/rates")
async def get_human_rates():
    """Get all 웃 rates by country/state (per-hour minimum wage table)."""
    return get_all_rates()


@router.get("/tokens/rates/lookup")
async def lookup_human_rate(
    country: str = Query("United States", description="Country name"),
    state: str | None = Query(None, description="State/province (US only)"),
    jurisdiction_code: str | None = Query(None, description="ISO 3166-1 alpha-2 code (e.g. 'US', 'CA')"),
):
    """Look up 웃 rate for a specific jurisdiction."""
    # WireGuard: whitelist jurisdiction_code format (2-char uppercase alpha)
    if jurisdiction_code is not None and not _JURISDICTION_RE.match(jurisdiction_code):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid jurisdiction_code '{jurisdiction_code}'. Must be exactly 2 uppercase letters (ISO 3166-1 alpha-2).",
        )
    rate = resolve_human_rate(country, state)
    return {
        "country": country,
        "state": state,
        "jurisdiction_code": jurisdiction_code,
        "human_rate": rate,
        "currency": "USD",
        "per_minute": round(rate / 60.0, 4),
    }
