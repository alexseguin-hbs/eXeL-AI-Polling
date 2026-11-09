"""Cube 8 — what a viewer has actually PAID to see (333-word summaries, Original text).

ONE rule, used by every server path that can return 333 / Original content (drill-down API, export ladder):

  • Only WEBHOOK-CONFIRMED money counts: PaymentTransaction.status == "completed" AND stripe_event_id set.
    stripe_event_id is written only by the signed-webhook handler (payment_service.handle_payment_completed),
    so a pending Checkout, a client-side "?donated=true", an expired/failed session, or an amount-mismatch row
    never unlocks anything. The tier picked at creation (session.pricing_tier) is NOT proof of payment.
  • admin / lead_developer (operators): always unlocked.
  • Session creator: Moderator Paid / Cost Split → unlocked once the creator Checkout is webhook-confirmed;
    otherwise (Free, or paid tier still unpaid) the donation ladder over the creator's own confirmed payments
    for this session (rows with participant_id NULL).
  • Participant (logged in, joined this session): the donation ladder over that participant's confirmed
    payments for this session (cost-split share + donations), same thresholds as the CSV export.
  • Anyone else / anonymous: locked.

Ladder thresholds are the existing export thresholds (cube9_reports.service): 333 at $9.99, Original at $11.11.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import PaymentTransaction

SUMMARY_333_CENTS = 999     # == cube9_reports.service.THRESHOLD_333_CENTS
ORIGINAL_CENTS = 1111       # == cube9_reports.service.THRESHOLD_FULL_CENTS
CREATOR_PAYMENT_TYPES = ("moderator_fee", "cost_split", "usage_billing")
OPERATOR_ROLES = ("admin", "lead_developer")


def _confirmed():
    """SQL predicate: a payment Stripe confirmed through the signed webhook."""
    return (
        (PaymentTransaction.status == "completed")
        & PaymentTransaction.stripe_event_id.isnot(None)
        & func.coalesce(PaymentTransaction.reconcile_status, "").notlike("amount_mismatch%")
    )


async def confirmed_cents(db: AsyncSession, session_id: uuid.UUID, participant_id: uuid.UUID | None) -> int:
    """Webhook-confirmed cents paid for this session by one payer (participant, or the creator when None)."""
    payer = (PaymentTransaction.participant_id == participant_id) if participant_id else PaymentTransaction.participant_id.is_(None)
    row = await db.execute(
        select(func.coalesce(func.sum(PaymentTransaction.amount_cents), 0)).where(
            PaymentTransaction.session_id == session_id, payer, _confirmed()
        )
    )
    return int(row.scalar() or 0)


async def creator_payment_confirmed(db: AsyncSession, session_id: uuid.UUID) -> bool:
    row = await db.execute(
        select(func.count(PaymentTransaction.id)).where(
            PaymentTransaction.session_id == session_id,
            PaymentTransaction.participant_id.is_(None),
            PaymentTransaction.transaction_type.in_(CREATOR_PAYMENT_TYPES),
            _confirmed(),
        )
    )
    return int(row.scalar() or 0) > 0


def _result(viewer: str, basis: str, paid_cents: int, s333: bool, orig: bool, participant_id=None) -> dict[str, Any]:
    # CRS-39.01 Detail 1/2/3 map — same payment path, no parallel checkout:
    # Detail 1 = summary_111 (free in drawer), Detail 2 = summary_333, Detail 3 = Original + expert 1-pager.
    return {
        "viewer": viewer,
        "basis": basis,
        "confirmed_paid_cents": paid_cents,
        "summary_333": bool(s333),
        "original": bool(orig),
        "detail_1": True,
        "detail_2": bool(s333),
        "detail_3": bool(orig),
        "detail_map": {"detail_1": "summary_111", "detail_2": "summary_333", "detail_3": "original+expert_pager"},
        "participant_id": str(participant_id) if participant_id else None,
        "thresholds": {"summary_333_cents": SUMMARY_333_CENTS, "original_cents": ORIGINAL_CENTS},
    }


def _ladder(viewer: str, basis: str, cents: int, participant_id=None) -> dict[str, Any]:
    return _result(viewer, basis, cents, cents >= SUMMARY_333_CENTS, cents >= ORIGINAL_CENTS, participant_id)


async def resolve_view_entitlement(db: AsyncSession, session, user) -> dict[str, Any]:
    """Entitlement for `user` (CurrentUser | None) on `session` (a Session row)."""
    if user is None:
        return _result("anonymous", "not_signed_in", 0, False, False)
    from app.core.permissions import canonical_role

    role = canonical_role(getattr(user, "role", "") or "")
    if role in OPERATOR_ROLES:
        return _result("operator", "operator_role", 0, True, True)

    if session.created_by == user.user_id:
        if (session.pricing_tier or "free") in ("moderator_paid", "cost_split") and await creator_payment_confirmed(db, session.id):
            cents = await confirmed_cents(db, session.id, None)
            return _result("creator", "poll_payment_confirmed", cents, True, True)
        return _ladder("creator", "donation_ladder", await confirmed_cents(db, session.id, None))

    from app.models.participant import Participant

    pid = (await db.execute(
        select(Participant.id).where(Participant.session_id == session.id, Participant.user_id == user.user_id).limit(1)
    )).scalar_one_or_none()
    if not pid:
        return _result("other", "not_in_session", 0, False, False)
    return _ladder("participant", "donation_ladder", await confirmed_cents(db, session.id, pid), pid)
