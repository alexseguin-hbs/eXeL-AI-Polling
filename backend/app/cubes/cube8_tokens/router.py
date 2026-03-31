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

import uuid

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.dependencies import get_db
from app.core.hi_rates import get_all_rates, resolve_human_rate
from app.core.permissions import require_role
from app.cubes.cube8_tokens import payment_service, service
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


@router.get("/tokens/rates")
async def get_human_rates():
    """Get all 웃 rates by country/state (per-hour minimum wage table)."""
    return get_all_rates()


@router.get("/tokens/rates/lookup")
async def lookup_human_rate(
    country: str = Query("United States", description="Country name"),
    state: str | None = Query(None, description="State/province (US only)"),
):
    """Look up 웃 rate for a specific jurisdiction."""
    rate = resolve_human_rate(country, state)
    return {
        "country": country,
        "state": state,
        "human_rate": rate,
        "currency": "USD",
        "per_minute": round(rate / 60.0, 4),
    }
