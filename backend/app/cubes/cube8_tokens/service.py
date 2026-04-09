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
    """
    result = await db.execute(
        select(TokenLedger).where(
            and_(
                TokenLedger.session_id == session_id,
                TokenLedger.user_id == user_id,
                TokenLedger.lifecycle_state.in_(("pending", "approved", "finalized")),
            )
        )
    )
    entries = list(result.scalars().all())

    return {
        "user_id": user_id,
        "session_id": str(session_id),
        "total_heart": round(sum(e.delta_heart for e in entries), 3),
        "total_human": round(sum(e.delta_human for e in entries), 3),
        "total_unity": round(sum(e.delta_unity for e in entries), 3),
        "entry_count": len(entries),
    }


async def get_session_token_summary(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """CRS-19: Aggregate token stats for moderator dashboard.

    Returns total tokens awarded, participant count, averages, distribution.
    """
    result = await db.execute(
        select(TokenLedger).where(
            and_(
                TokenLedger.session_id == session_id,
                TokenLedger.lifecycle_state.in_(("pending", "approved", "finalized")),
            )
        )
    )
    entries = list(result.scalars().all())

    if not entries:
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

    unique_users = len({e.user_id for e in entries if e.user_id})
    total_heart = sum(e.delta_heart for e in entries)
    total_human = sum(e.delta_human for e in entries)
    total_unity = sum(e.delta_unity for e in entries)

    by_lifecycle: dict[str, int] = {}
    by_action: dict[str, int] = {}
    for e in entries:
        by_lifecycle[e.lifecycle_state] = by_lifecycle.get(e.lifecycle_state, 0) + 1
        if e.action_type:
            by_action[e.action_type] = by_action.get(e.action_type, 0) + 1

    return {
        "session_id": str(session_id),
        "total_entries": len(entries),
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
    """CRS-25: Create a new append-only ledger entry.

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
    """Award CQS winner tokens via ledger entry.

    Called by Cube 7→5→6 CQS pipeline after ranking completes.
    Creates a 'reward' action_type entry with reference to CQS score.
    """
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
