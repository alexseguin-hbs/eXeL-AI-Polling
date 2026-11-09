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

import hashlib
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from app.config import settings
from app.core.rate_limit import limiter
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

from app.core.auth import CurrentUser, get_current_user, get_optional_current_user
from app.core.session_access import require_session_owner
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
    amount_cents: int | None = Field(None, ge=0, le=100_000_000)  # may RAISE the quote, never lower it
    success_url: str = Field("", max_length=500)
    cancel_url: str = Field("", max_length=500)
    participants: int | None = Field(None, ge=1, le=1_000_000)
    options: list[str] | None = Field(None, max_length=12)
    voice_share: float | None = Field(None, ge=0, le=1)
    client_key: str | None = Field(None, pattern=r"^[A-Za-z0-9_-]{8,64}$")


class PollQuoteRequest(BaseModel):
    pricing_tier: str = Field("moderator_paid", pattern=r"^(moderator_paid|cost_split)$")
    participants: int = Field(100, ge=1, le=1_000_000)
    responses_per_participant: int = Field(1, ge=1, le=9)
    max_response_length: int = Field(3333, ge=1, le=100_000)
    ai_provider: str = Field("openai", max_length=20)
    stt_provider: str = Field("whisper", max_length=20)
    voice_share: float = Field(0.0, ge=0, le=1)
    options: list[str] | None = Field(None, max_length=12)


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
    user: CurrentUser = Depends(require_role("moderator", "admin", creator=True)),
):
    """Create Stripe Checkout Session for Moderator Paid tier (min $11.11)."""
    if not (_own_site(payload.success_url) and _own_site(payload.cancel_url)):
        raise HTTPException(status_code=400, detail="Redirect URLs must return to this site")
    return await payment_service.create_moderator_checkout(
        db,
        session_id=payload.session_id,
        user_id=user.user_id,
        amount_cents=payload.amount_cents,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        participants=payload.participants,
        options=payload.options,
        voice_share=payload.voice_share,
        client_key=payload.client_key,
    )


@router.post("/payments/poll-quote")
@limiter.limit("60/minute")
async def quote_poll_options(request: Request, payload: PollQuoteRequest):
    """Price the options chosen on the Create Poll form (public, no charge): tracked cost × margin + Stripe fee,
    floor $11.11. The same function prices the Checkout server-side, so the number shown is the number charged."""
    from app.cubes.cube8_tokens import poll_pricing

    return poll_pricing.quote_poll(poll_pricing.PollQuoteInput(
        pricing_tier=payload.pricing_tier,
        participants=payload.participants,
        responses_per_participant=payload.responses_per_participant,
        max_response_length=payload.max_response_length,
        ai_provider=payload.ai_provider,
        stt_provider=payload.stt_provider,
        voice_share=payload.voice_share,
        options=tuple(payload.options) if payload.options else poll_pricing.DEFAULT_OPTIONS,
    ))


@router.get("/payments/catalog")
async def get_payment_catalog():
    """Live Stripe Product IDs per product line + the margin setting (no secrets)."""
    from app.cubes.cube8_tokens import poll_pricing, stripe_catalog

    m = poll_pricing.margin_multiplier()
    return {**stripe_catalog.catalog_status(), "margin_multiplier": str(m), "margin_label": poll_pricing.margin_label(m),
            "margin_decision_pending": True, "moderator_min_fee_cents": poll_pricing.MODERATOR_MIN_FEE_CENTS}


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


class CostSplitShareCheckoutRequest(BaseModel):
    session_id: uuid.UUID
    participant_id: uuid.UUID
    success_url: str = Field("", max_length=500)
    cancel_url: str = Field("", max_length=500)
    client_key: str | None = Field(None, pattern=r"^[A-Za-z0-9_-]{8,64}$")


@router.post("/payments/cost-split-checkout")
async def create_cost_split_share_checkout(
    payload: CostSplitShareCheckoutRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CRS-01.01 / CRS-14.05: hosted Stripe Checkout for a Cost Split participant's share (same quote as creator)."""
    if not (_own_site(payload.success_url) and _own_site(payload.cancel_url)):
        raise HTTPException(status_code=400, detail="Redirect URLs must return to this site")
    return await payment_service.create_cost_split_share_checkout(
        db,
        session_id=payload.session_id,
        participant_id=payload.participant_id,
        user_id=user.user_id,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        client_key=payload.client_key,
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
    # Anonymous, so every field is bounded and the redirects must come back to our own site.
    amount_cents: int = Field(333, ge=50, le=1_000_000)
    success_url: str = Field("", max_length=500)
    cancel_url: str = Field("", max_length=500)
    label: str = Field("The Divinity Guide — Sacred Contribution", max_length=120)
    description: str = Field("Voluntary contribution supporting the Divinity Guide; not tax-deductible", max_length=300)
    purpose: str = Field("divinity_guide", pattern=r"^(divinity_guide|derisking_strategies|community)$")
    client_key: str | None = Field(None, pattern=r"^[A-Za-z0-9_-]{8,64}$")
    # Optional poll scope: credits the donation ladder (333 / Original) once the webhook confirms it.
    session_id: uuid.UUID | None = None
    participant_id: uuid.UUID | None = None


def _own_site(url: str) -> bool:
    """Only our frontend (or a configured CORS origin) may be a Checkout redirect target."""
    if not url:
        return True
    from urllib.parse import urlparse

    allowed = {settings.frontend_url.rstrip("/")} | {
        o.strip().rstrip("/") for o in (settings.allowed_origins or "").split(",") if o.strip()
    }
    u = urlparse(url)
    return f"{u.scheme}://{u.netloc}" in allowed


@router.post("/payments/divinity-donate")
@limiter.limit("10/minute")
async def create_divinity_donation(
    request: Request,
    payload: DivinityDonationRequest,
    db: AsyncSession = Depends(get_db),
):
    if not (_own_site(payload.success_url) and _own_site(payload.cancel_url)):
        raise HTTPException(status_code=400, detail="Redirect URLs must return to this site")
    """Create an anonymous Stripe Checkout for a voluntary donation (no auth).

    The universal donate path used by both the site-wide navbar button and the Divinity
    Guide; `label`/`description` brand the Checkout line item.
    """
    return await payment_service.create_divinity_donation_checkout(
        db=db,
        amount_cents=payload.amount_cents,
        success_url=payload.success_url,
        cancel_url=payload.cancel_url,
        label=payload.label,
        description=payload.description,
        purpose=payload.purpose,
        client_key=payload.client_key,
        session_id=payload.session_id,
        participant_id=payload.participant_id,
    )


# ---------------------------------------------------------------------------
# Paid views — 333-word summaries + Original text, unlocked only by webhook-confirmed payment
# ---------------------------------------------------------------------------

DRILLDOWN_LEVELS = ("3", "6", "9")
DRILLDOWN_CATEGORIES = {"risk": "Risk & Concerns", "support": "Supporting Comments", "neutral": "Neutral Comments"}


async def _session_or_404(db: AsyncSession, session_id: uuid.UUID):
    from sqlalchemy import select

    from app.models.session import Session

    s = (await db.execute(select(Session).where(Session.id == session_id))).scalar_one_or_none()
    if s is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return s


@router.get("/sessions/{session_id}/view-entitlement")
async def get_view_entitlement(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """What this viewer has PAID to see (Stripe webhook-confirmed), never the tier chosen at creation."""
    from app.cubes.cube8_tokens.view_entitlement import resolve_view_entitlement

    session = await _session_or_404(db, session_id)
    return {"session_id": str(session_id), "pricing_tier": session.pricing_tier or "free",
            **(await resolve_view_entitlement(db, session, user))}


@router.get("/sessions/{session_id}/drilldown")
async def get_theme_drilldown(
    session_id: uuid.UUID,
    level: str = Query(..., description="Theme02 level: 3 | 6 | 9"),
    theme: str = Query(..., min_length=1, max_length=200, description="Theme02 label at that level"),
    category: str | None = Query(None, description="risk | support | neutral (Theme01)"),
    offset: int = Query(0, ge=0, le=1_000_000),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Responses behind one Theme02 bubble with 33 / 111 always and 333 / Original only when PAID.

    Enforced here, not in the browser: summary_333 and original are null unless view_entitlement grants them.
    Access: session creator, operators, or a participant of this session who opted into results (CRS-05).
    """
    from sqlalchemy import func as sa_func
    from sqlalchemy import select

    from app.cubes.cube8_tokens.view_entitlement import resolve_view_entitlement
    from app.models.participant import Participant
    from app.models.response_meta import ResponseMeta
    from app.models.response_summary import ResponseSummary

    if level not in DRILLDOWN_LEVELS:
        raise HTTPException(status_code=400, detail="level must be one of: 3, 6, 9")
    if category is not None and category not in DRILLDOWN_CATEGORIES:
        raise HTTPException(status_code=400, detail="category must be one of: risk, support, neutral")
    session = await _session_or_404(db, session_id)
    ent = await resolve_view_entitlement(db, session, user)
    if ent["viewer"] in ("other", "anonymous"):
        raise HTTPException(status_code=403, detail="Not a member of this session")
    if ent["viewer"] == "participant":
        opted = (await db.execute(select(Participant.results_opt_in).where(
            Participant.session_id == session_id, Participant.user_id == user.user_id).limit(1))).scalar_one_or_none()
        if not opted:
            raise HTTPException(status_code=403, detail="Results require joining this session logged in and opting into results")

    col = {"3": ResponseSummary.theme2_3, "6": ResponseSummary.theme2_6, "9": ResponseSummary.theme2_9}[level]
    conf = {"3": ResponseSummary.theme2_3_confidence, "6": ResponseSummary.theme2_6_confidence,
            "9": ResponseSummary.theme2_9_confidence}[level]
    where = [ResponseSummary.session_id == session_id, col == theme]
    if category is not None:
        where.append(ResponseSummary.theme01 == DRILLDOWN_CATEGORIES[category])
    total = int((await db.execute(select(sa_func.count(ResponseSummary.id)).where(*where))).scalar() or 0)
    rows = (await db.execute(
        select(ResponseSummary, ResponseMeta)
        .join(ResponseMeta, ResponseMeta.id == ResponseSummary.response_meta_id)
        .where(*where)
        .order_by(ResponseMeta.submitted_at.asc(), ResponseMeta.id.asc())
        .offset(offset).limit(limit)
    )).all()
    s333, orig = ent["summary_333"], ent["original"]
    items = []
    for rs, rm in rows:
        items.append({
            "id": str(rm.id),
            # Pseudonymous, stable per participant; never the participant id itself.
            "participant_ref": (hashlib.sha256(f"{session_id}:{rm.participant_id}".encode()).hexdigest()[:8]
                                if rm.participant_id else None),
            "theme01": rs.theme01,
            "theme01_confidence": rs.theme01_confidence,
            "theme2_3": rs.theme2_3, "theme2_6": rs.theme2_6, "theme2_9": rs.theme2_9,
            "confidence": getattr(rs, conf.key, None),
            "summary_33": rs.summary_33 or "",
            "summary_111": rs.summary_111 or "",
            "summary_333": (rs.summary_333 or "") if s333 else None,
            "original": (rm.raw_text or "") if orig else None,
        })
    return {"session_id": str(session_id), "level": level, "theme": theme, "total": total,
            "offset": offset, "limit": limit, "entitlement": ent, "items": items}


@router.get("/sessions/{session_id}/payments")
async def get_payment_status(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", leads_read=True)),
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




@router.get("/sessions/{session_id}/cost-ledger")
async def get_session_cost_ledger(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", leads_read=True)),
):
    """Per-session Theme02 + STT cost rollup (auth: session owner / admin).

    Builds from recorded VoiceResponse + AICostLog only — does not invent usage.
    Durable Supabase table is review migration 033 (not applied here).
    """
    from app.cubes.cube8_tokens.session_cost_service import build_session_cost_rollup
    return await build_session_cost_rollup(
        db, session_id, user_id=user.user_id, role=user.role,
    )


@router.get("/payments/provider-fees")
async def get_provider_fees():
    """Moderator Settings Cost Estimate source — versioned provider fees + UI combos.

    Returns UI_ESTIMATE labels; ``invoice_accurate`` is always false here.
    Free-tier note clarifies user-not-charged ≠ provider cost zero.
    """
    from app.cubes.cube8_tokens.fee_catalog import public_fee_payload
    return public_fee_payload()


@router.post("/payments/provider-fees/refresh")
async def refresh_provider_fees(
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Weekly server-side fee catalog reaffirmation (admin). Does not scrape or write Stripe prices.

    Deployment cron should call this weekly — see backend/deploy/provider-fee-weekly-refresh.md.
    Persists to backend/data/provider_fee_catalog.json when writable.
    """
    from app.cubes.cube8_tokens.fee_catalog import mark_weekly_check, freshness, public_fee_payload
    cat = mark_weekly_check(source="admin_or_cron_refresh", persist=True)
    return {
        "ok": True,
        "freshness": freshness(cat),
        "prior_versions_retained": len(cat.get("prior_versions") or []),
        "payload": public_fee_payload(),
    }


@router.get("/sessions/{session_id}/tokens", response_model=list[TokenLedgerRead])
async def get_session_tokens(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "lead_developer", "admin", leads_read=True)),
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
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", leads_read=True)),
):
    """CRS-19: Get aggregate token stats for moderator dashboard."""
    return await service.get_session_token_summary(db, session_id)


@router.get("/sessions/{session_id}/tokens/metrics")
async def get_token_metrics(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", leads_read=True)),
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
