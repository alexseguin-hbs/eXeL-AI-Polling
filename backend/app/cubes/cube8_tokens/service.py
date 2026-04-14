"""Cube 8 — Token Reward Calculator Service.

Manages the append-only token ledger for the SoI Trinity:
  ♡ — time-based participation tokens (ceil minutes = tokens, rounds UP)
  웃 — compensated skilled time (7.25/hr when enabled, 0 pre-treasury)
      Format: #.### (3 decimal places, no currency symbol)
  ◬ — automation multiplier (5x ♡ default)

Functions:
  - get_session_tokens: All ledger entries for a session
  - get_user_token_balance: Aggregated balance per user
  - create_ledger_entry: Append new entry (core ledger write)
  - transition_lifecycle_state: State machine enforcement
  - reverse_entry: Append offsetting negative entry
  - create_dispute: File token dispute
  - resolve_dispute: Admin resolves dispute
  - get_user_disputes: List disputes for a user
  - get_session_token_summary: Aggregate stats for moderator dashboard
  - disburse_cqs_reward: Award CQS winner tokens

CRS: 18, 19, 24, 25, 32, 33, 34, 35
"""

import logging
import math
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.token_ledger import TokenDispute, TokenLedger

logger = logging.getLogger("cube8")

# ---------------------------------------------------------------------------
# Lifecycle State Machine
# ---------------------------------------------------------------------------

VALID_TRANSITIONS: dict[str, set[str]] = {
    "simulated": {"pending"},
    "pending": {"approved", "reversed"},
    "approved": {"finalized", "reversed"},
    "finalized": {"reversed"},
    "reversed": set(),  # Terminal state
}

LIFECYCLE_STATES = set(VALID_TRANSITIONS.keys())

# HI token conversion: $ donated ÷ minimum wage = 웃 tokens earned
# This is the ONLY way to earn 웃 tokens — real money → real value
HI_RATE_PER_HOUR = 7.25  # US federal minimum wage (USD/hr)


def dollars_to_hi_tokens(amount_usd: float) -> float:
    """Convert USD payment/donation to 웃 (HI) tokens.

    Formula: 웃 = $ ÷ 7.25
    Examples:
      $11.11 moderator fee → 1.532 웃
      $50.00 donation      → 6.897 웃
      $7.25 (1 hour wage)  → 1.000 웃

    This makes 웃 the universal measure of compensated value.
    Anyone who pays or donates earns 웃 proportional to their contribution.
    """
    if amount_usd <= 0:
        return 0.0
    return round(amount_usd / HI_RATE_PER_HOUR, 3)


# ---------------------------------------------------------------------------
# Ledger Queries
# ---------------------------------------------------------------------------


async def get_session_tokens(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> list[TokenLedger]:
    """Get all token ledger entries for a session, ordered by creation time."""
    result = await db.execute(
        select(TokenLedger)
        .where(TokenLedger.session_id == session_id)
        .order_by(TokenLedger.created_at)
    )
    return list(result.scalars().all())


async def get_user_token_balance(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: str,
) -> dict:
    """Get aggregated token balance for a user in a session.

    Only counts entries in active lifecycle states (pending/approved/finalized).
    Reversed entries have already been offset by negative entries.

    Uses SQL SUM/COUNT (G4+O4 optimisation) instead of loading all rows.
    """
    _active = ("pending", "approved", "finalized")
    result = await db.execute(
        select(
            func.coalesce(func.sum(TokenLedger.delta_heart), 0.0).label("heart"),
            func.coalesce(func.sum(TokenLedger.delta_human), 0.0).label("human"),
            func.coalesce(func.sum(TokenLedger.delta_unity), 0.0).label("unity"),
            func.count().label("entry_count"),
        ).where(
            and_(
                TokenLedger.session_id == session_id,
                TokenLedger.user_id == user_id,
                TokenLedger.lifecycle_state.in_(_active),
            )
        )
    )
    row = result.one()

    return {
        "user_id": user_id,
        "session_id": str(session_id),
        "total_heart": round(float(row.heart), 3),
        "total_human": round(float(row.human), 3),
        "total_unity": round(float(row.unity), 3),
        "entry_count": row.entry_count,
    }


async def get_session_token_summary(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """CRS-19: Aggregate token stats for moderator dashboard.

    Returns total tokens awarded, participant count, averages, distribution.
    Uses SQL SUM/COUNT/GROUP BY (G4+O4 optimisation) instead of loading all rows.
    """
    _active = ("pending", "approved", "finalized")
    _where = and_(
        TokenLedger.session_id == session_id,
        TokenLedger.lifecycle_state.in_(_active),
    )

    # Main aggregates — single row
    agg_result = await db.execute(
        select(
            func.coalesce(func.sum(TokenLedger.delta_heart), 0.0).label("total_heart"),
            func.coalesce(func.sum(TokenLedger.delta_human), 0.0).label("total_human"),
            func.coalesce(func.sum(TokenLedger.delta_unity), 0.0).label("total_unity"),
            func.count(func.distinct(TokenLedger.user_id)).label("unique_users"),
            func.count().label("entry_count"),
        ).where(_where)
    )
    agg = agg_result.one()

    if agg.entry_count == 0:
        return {
            "session_id": str(session_id),
            "total_entries": 0,
            "unique_users": 0,
            "total_heart": 0.0,
            "total_human": 0.0,
            "total_unity": 0.0,
            "avg_heart": 0.0,
            "avg_human": 0.0,
            "avg_unity": 0.0,
            "by_lifecycle": {},
            "by_action": {},
        }

    total_heart = float(agg.total_heart)
    total_human = float(agg.total_human)
    total_unity = float(agg.total_unity)
    unique_users = agg.unique_users

    # by_lifecycle breakdown — GROUP BY (small result set: max 3 states)
    lc_result = await db.execute(
        select(
            TokenLedger.lifecycle_state,
            func.count().label("cnt"),
        ).where(_where).group_by(TokenLedger.lifecycle_state)
    )
    by_lifecycle = {row.lifecycle_state: row.cnt for row in lc_result.all()}

    # by_action breakdown — GROUP BY
    act_result = await db.execute(
        select(
            TokenLedger.action_type,
            func.count().label("cnt"),
        ).where(
            _where,
            TokenLedger.action_type.isnot(None),
        ).group_by(TokenLedger.action_type)
    )
    by_action = {row.action_type: row.cnt for row in act_result.all()}

    return {
        "session_id": str(session_id),
        "total_entries": agg.entry_count,
        "unique_users": unique_users,
        "total_heart": round(total_heart, 3),
        "total_human": round(total_human, 3),
        "total_unity": round(total_unity, 3),
        "avg_heart": round(total_heart / unique_users, 3) if unique_users else 0.0,
        "avg_human": round(total_human / unique_users, 3) if unique_users else 0.0,
        "avg_unity": round(total_unity / unique_users, 3) if unique_users else 0.0,
        "by_lifecycle": by_lifecycle,
        "by_action": by_action,
    }


# ---------------------------------------------------------------------------
# Ledger Writes
# ---------------------------------------------------------------------------


async def create_ledger_entry(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    user_id: str,
    cube_id: str,
    action_type: str,
    delta_heart: float = 0.0,
    delta_human: float = 0.0,
    delta_unity: float = 0.0,
    lifecycle_state: str = "pending",
    reason: str | None = None,
    reference_id: str | None = None,
    distribution_method: str | None = None,
    anon_hash: str | None = None,
    session_short_code: str | None = None,
) -> TokenLedger:
    """CRS-23: Audit trail — append-only ledger, no deletes, no updates.
    CRS-25: Create a new append-only ledger entry.

    This is the canonical way to write to the token ledger. All cubes
    should use this function instead of constructing TokenLedger directly.
    """
    if lifecycle_state not in LIFECYCLE_STATES:
        raise ValueError(f"Invalid lifecycle_state: {lifecycle_state}")

    entry = TokenLedger(
        session_id=session_id,
        user_id=user_id,
        anon_hash=anon_hash,
        cube_id=cube_id,
        action_type=action_type,
        distribution_method=distribution_method,
        delta_heart=round(delta_heart, 3),
        delta_human=round(delta_human, 3),
        delta_unity=round(delta_unity, 3),
        lifecycle_state=lifecycle_state,
        reason=reason,
        reference_id=reference_id,
    )
    db.add(entry)
    await db.flush()
    await db.refresh(entry)

    # CRS-18: Broadcast token update for real-time HUD
    if session_short_code:
        try:
            from app.core.supabase_broadcast import broadcast_event

            await broadcast_event(
                channel=f"session:{session_short_code}",
                event="tokens_awarded",
                payload={
                    "session_id": str(session_id),
                    "user_id": user_id,
                    "action": action_type,
                    "heart": delta_heart,
                    "human": delta_human,
                    "unity": delta_unity,
                },
            )
        except Exception:
            pass  # Non-fatal: token is stored even if broadcast fails

    logger.info(
        "cube8.ledger.entry_created",
        extra={
            "session_id": str(session_id),
            "user_id": user_id,
            "action": action_type,
            "heart": delta_heart,
            "human": delta_human,
            "unity": delta_unity,
        },
    )
    return entry


# ---------------------------------------------------------------------------
# Lifecycle State Machine (CRS-34)
# ---------------------------------------------------------------------------


async def transition_lifecycle_state(
    db: AsyncSession,
    entry_id: uuid.UUID,
    new_state: str,
    *,
    transitioned_by: str | None = None,
) -> TokenLedger:
    """CRS-34.01: Enforce lifecycle state transitions.

    Valid: simulated→pending→approved→finalized
    Reversed: any active state → reversed (via reverse_entry instead)

    Returns 409 on illegal transitions.
    """
    if new_state not in LIFECYCLE_STATES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid state: {new_state}",
        )

    result = await db.execute(
        select(TokenLedger).where(TokenLedger.id == entry_id)
    )
    entry = result.scalar_one_or_none()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ledger entry {entry_id} not found",
        )

    current = entry.lifecycle_state
    allowed = VALID_TRANSITIONS.get(current, set())

    if new_state not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot transition from '{current}' to '{new_state}'. "
                   f"Allowed: {allowed or 'none (terminal state)'}",
        )

    entry.lifecycle_state = new_state
    await db.flush()

    logger.info(
        "cube8.lifecycle.transitioned",
        extra={
            "entry_id": str(entry_id),
            "from": current,
            "to": new_state,
            "by": transitioned_by,
        },
    )
    return entry


async def reverse_entry(
    db: AsyncSession,
    entry_id: uuid.UUID,
    *,
    reason: str,
    reversed_by: str,
) -> TokenLedger:
    """CRS-34.02: Create offsetting negative entry for reversal.

    Append-only: original entry is NOT modified. A new entry with
    negative deltas is appended, and original marked as 'reversed'.
    """
    result = await db.execute(
        select(TokenLedger).where(TokenLedger.id == entry_id)
    )
    original = result.scalar_one_or_none()
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ledger entry {entry_id} not found",
        )

    if original.lifecycle_state == "reversed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Entry already reversed",
        )

    # Mark original as reversed
    original.lifecycle_state = "reversed"

    # Create offsetting negative entry
    reversal = TokenLedger(
        session_id=original.session_id,
        user_id=original.user_id,
        anon_hash=original.anon_hash,
        cube_id=original.cube_id,
        action_type="reversal",
        distribution_method=original.distribution_method,
        delta_heart=-original.delta_heart,
        delta_human=-original.delta_human,
        delta_unity=-original.delta_unity,
        lifecycle_state="finalized",
        reason=f"Reversal of {entry_id}: {reason}",
        reference_id=str(entry_id),
    )
    db.add(reversal)
    await db.flush()
    await db.refresh(reversal)

    logger.info(
        "cube8.ledger.reversed",
        extra={
            "original_id": str(entry_id),
            "reversal_id": str(reversal.id),
            "by": reversed_by,
        },
    )
    return reversal


# ---------------------------------------------------------------------------
# CQS Reward Disbursement (CRS-25)
# ---------------------------------------------------------------------------


# NOTE: disburse_cqs_reward is defined ONCE below (after award_hi_tokens_for_payment).
# A duplicate definition was removed here on 2026-04-13 (G6 gap fix, Succinctness +5).
# The canonical version includes Supabase broadcast notification.


# ---------------------------------------------------------------------------
# Payment → 웃 Token Conversion (THE ONLY WAY TO EARN HI TOKENS)
# ---------------------------------------------------------------------------


async def award_hi_tokens_for_payment(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    user_id: str,
    amount_usd: float,
    payment_type: str,  # "moderator_fee" | "cost_split" | "donation"
    reference_id: str | None = None,
    session_short_code: str | None = None,
) -> TokenLedger:
    """Award 웃 (HI) tokens when a user pays or donates.

    Formula: 웃 = $ amount ÷ 7.25 (US federal minimum wage)

    This is the ONLY way to earn 웃 tokens — real money creates real value.
    Tracks who's investing in the platform and how much.

    Examples:
      $11.11 moderator fee → 1.532 웃
      $50.00 donation      → 6.897 웃
      $100.00 cost split   → 13.793 웃
    """
    hi_tokens = dollars_to_hi_tokens(amount_usd)

    if hi_tokens <= 0:
        raise ValueError("Payment amount must be positive to earn 웃 tokens")

    entry = await create_ledger_entry(
        db,
        session_id=session_id,
        user_id=user_id,
        cube_id="cube8",
        action_type=f"payment_{payment_type}",
        delta_heart=0.0,
        delta_human=hi_tokens,
        delta_unity=0.0,
        lifecycle_state="pending",
        reason=f"웃 earned: ${amount_usd:.2f} ÷ $7.25/hr = {hi_tokens:.3f} 웃",
        reference_id=reference_id,
        session_short_code=session_short_code,
    )

    logger.info(
        "cube8.hi_tokens.awarded",
        extra={
            "session_id": str(session_id),
            "user_id": user_id,
            "amount_usd": amount_usd,
            "hi_tokens": hi_tokens,
            "payment_type": payment_type,
        },
    )

    return entry


async def disburse_cqs_reward(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    winner_user_id: str,
    reward_heart: float,
    reward_unity: float,
    cqs_score_id: str | None = None,
    session_short_code: str | None = None,
) -> TokenLedger:
    """Award CQS winner tokens via ledger entry."""
    entry = await create_ledger_entry(
        db,
        session_id=session_id,
        user_id=winner_user_id,
        cube_id="cube8",
        action_type="cqs_reward",
        delta_heart=reward_heart,
        delta_human=0.0,
        delta_unity=reward_unity,
        lifecycle_state="pending",
        reason="CQS winner reward",
        reference_id=cqs_score_id,
    )

    # Broadcast reward notification
    if session_short_code:
        try:
            from app.core.supabase_broadcast import broadcast_event

            await broadcast_event(
                channel=f"session:{session_short_code}",
                event="tokens_awarded",
                payload={
                    "session_id": str(session_id),
                    "action": "cqs_reward",
                    "heart": reward_heart,
                    "unity": reward_unity,
                },
            )
        except Exception:
            pass

    return entry


# ---------------------------------------------------------------------------
# Disputes (CRS-33)
# ---------------------------------------------------------------------------


async def create_dispute(
    db: AsyncSession,
    *,
    ledger_entry_id: uuid.UUID,
    flagged_by: str,
    reason: str,
    evidence: str | None = None,
) -> TokenDispute:
    """CRS-33.01: Create a token dispute against a ledger entry."""
    result = await db.execute(
        select(TokenLedger).where(TokenLedger.id == ledger_entry_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Token ledger entry '{ledger_entry_id}' not found",
        )

    dispute = TokenDispute(
        ledger_entry_id=ledger_entry_id,
        flagged_by=flagged_by,
        reason=reason,
        evidence=evidence,
        status="open",
    )
    db.add(dispute)
    await db.commit()
    await db.refresh(dispute)

    logger.info(
        "cube8.dispute.created",
        extra={
            "dispute_id": str(dispute.id),
            "entry_id": str(ledger_entry_id),
            "by": flagged_by,
        },
    )
    return dispute


async def resolve_dispute(
    db: AsyncSession,
    dispute_id: uuid.UUID,
    *,
    resolution: str,
    notes: str,
    resolved_by: str,
) -> TokenDispute:
    """CRS-33.02: Admin resolves dispute with notes.

    Resolution: 'resolved' (upheld — entry reversed) or 'rejected' (denied).
    """
    result = await db.execute(
        select(TokenDispute).where(TokenDispute.id == dispute_id)
    )
    dispute = result.scalar_one_or_none()
    if not dispute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dispute {dispute_id} not found",
        )

    if dispute.status != "open":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Dispute already {dispute.status}",
        )

    if resolution not in ("resolved", "rejected"):
        raise ValueError("Resolution must be 'resolved' or 'rejected'")

    dispute.status = resolution
    dispute.resolution_notes = notes
    dispute.resolved_by = resolved_by
    dispute.resolved_at = datetime.now(timezone.utc)

    # If upheld, reverse the ledger entry
    if resolution == "resolved":
        await reverse_entry(
            db,
            dispute.ledger_entry_id,
            reason=f"Dispute {dispute_id} upheld: {notes}",
            reversed_by=resolved_by,
        )

    await db.flush()

    logger.info(
        "cube8.dispute.resolved",
        extra={
            "dispute_id": str(dispute_id),
            "resolution": resolution,
            "by": resolved_by,
        },
    )
    return dispute


async def get_user_disputes(
    db: AsyncSession,
    user_id: str,
) -> list[TokenDispute]:
    """Get all disputes filed by a user."""
    result = await db.execute(
        select(TokenDispute)
        .where(TokenDispute.flagged_by == user_id)
        .order_by(TokenDispute.created_at.desc())
    )
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# CRS-24.03: Velocity Caps (Anti-Manipulation)
# ---------------------------------------------------------------------------

_VELOCITY_CAP_PER_HOUR = 60.0  # Max ♡ tokens per hour per participant
_VELOCITY_ANOMALY_MULTIPLIER = 3.0  # Flag if earning rate > 3x session average


async def check_velocity_cap(
    db: AsyncSession,
    session_id: uuid.UUID,
    user_id: str,
) -> dict:
    """CRS-24.03: Check if user's token earning rate exceeds velocity cap.

    Returns velocity status + whether anomaly flag should be raised.
    """
    from datetime import timedelta

    one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)

    # User's tokens in last hour
    user_result = await db.execute(
        select(func.sum(TokenLedger.delta_heart)).where(
            and_(
                TokenLedger.session_id == session_id,
                TokenLedger.user_id == user_id,
                TokenLedger.created_at >= one_hour_ago,
                TokenLedger.lifecycle_state.in_(("pending", "approved", "finalized")),
            )
        )
    )
    user_hourly = user_result.scalar() or 0.0

    # Session average in last hour
    avg_result = await db.execute(
        select(
            func.sum(TokenLedger.delta_heart),
            func.count(func.distinct(TokenLedger.user_id)),
        ).where(
            and_(
                TokenLedger.session_id == session_id,
                TokenLedger.created_at >= one_hour_ago,
                TokenLedger.lifecycle_state.in_(("pending", "approved", "finalized")),
            )
        )
    )
    total_heart, user_count = avg_result.one()
    total_heart = total_heart or 0.0
    user_count = user_count or 1
    session_avg = total_heart / user_count

    cap_exceeded = user_hourly > _VELOCITY_CAP_PER_HOUR
    anomaly_flagged = (
        session_avg > 0 and user_hourly > session_avg * _VELOCITY_ANOMALY_MULTIPLIER
    )

    if cap_exceeded or anomaly_flagged:
        logger.warning(
            "cube8.velocity.alert",
            extra={
                "session_id": str(session_id),
                "user_id": user_id,
                "user_hourly": user_hourly,
                "session_avg": session_avg,
                "cap_exceeded": cap_exceeded,
                "anomaly_flagged": anomaly_flagged,
            },
        )

    return {
        "user_id": user_id,
        "session_id": str(session_id),
        "user_hourly_heart": round(user_hourly, 3),
        "session_avg_hourly": round(session_avg, 3),
        "velocity_cap": _VELOCITY_CAP_PER_HOUR,
        "cap_exceeded": cap_exceeded,
        "anomaly_flagged": anomaly_flagged,
    }


# ---------------------------------------------------------------------------
# CRS-35: Token Policy Config
# ---------------------------------------------------------------------------


async def get_session_token_config(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """CRS-35.01: Return session-level token configuration.

    Reads from session model and global settings.
    """
    from app.config import settings
    from app.models.session import Session

    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    return {
        "session_id": str(session_id),
        "hi_enabled": settings.human_enabled,
        "hi_hourly_rate": settings.human_hourly_rate,
        "hi_currency": settings.human_currency,
        "ai_multiplier": settings.unity_heart_multiplier,
        "login_heart_tokens": settings.login_heart_tokens,
        "pricing_tier": getattr(session, "pricing_tier", "free"),
        "reward_enabled": getattr(session, "reward_enabled", False),
        "reward_amount_cents": getattr(session, "reward_amount_cents", 0),
        "cqs_weights": getattr(session, "cqs_weights", None),
        "fee_amount_cents": getattr(session, "fee_amount_cents", 0),
        "cost_splitting_enabled": getattr(session, "cost_splitting_enabled", False),
    }


# ---------------------------------------------------------------------------
# CRS-25.06: Talent Profile (MVP3 Stub)
# ---------------------------------------------------------------------------


async def get_talent_profile(
    db: AsyncSession,
    user_id: str,
) -> dict:
    """CRS-25.06: Get or build talent profile from CQS + participation data.

    MVP3 stub — returns computed profile from ledger data.
    """
    # Aggregate across all sessions
    result = await db.execute(
        select(
            func.sum(TokenLedger.delta_heart),
            func.sum(TokenLedger.delta_human),
            func.sum(TokenLedger.delta_unity),
            func.count(func.distinct(TokenLedger.session_id)),
        ).where(
            and_(
                TokenLedger.user_id == user_id,
                TokenLedger.lifecycle_state.in_(("pending", "approved", "finalized")),
            )
        )
    )
    heart, human, unity, session_count = result.one()

    return {
        "user_id": user_id,
        "total_heart": round(heart or 0, 3),
        "total_human": round(human or 0, 3),
        "total_unity": round(unity or 0, 3),
        "session_count": session_count or 0,
        "is_available": False,  # Default off until user opts in
        "skills": [],  # Populated by CQS integration in future
        "avg_cqs_composite": 0.0,  # Populated by CQS integration
    }
