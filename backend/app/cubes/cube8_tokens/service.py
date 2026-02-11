"""Cube 8 — Token Reward Calculator Service.

Manages the append-only token ledger for the SoI Trinity:
  ♡ SI (Shared Intention) — time-based participation tokens
  웃 HI (Human Intelligence) — paid incentive tokens (0 by default)
  ◬ AI (Artificial Intelligence) — automation multiplier (5x SI default)
"""

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.token_ledger import TokenDispute, TokenLedger


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
    """Get aggregated token balance for a user in a session."""
    result = await db.execute(
        select(TokenLedger).where(
            TokenLedger.session_id == session_id,
            TokenLedger.user_id == user_id,
            TokenLedger.lifecycle_state.in_(("pending", "approved", "finalized")),
        )
    )
    entries = list(result.scalars().all())

    return {
        "user_id": user_id,
        "session_id": session_id,
        "total_si": sum(e.delta_si for e in entries),
        "total_hi": sum(e.delta_hi for e in entries),
        "total_ai": sum(e.delta_ai for e in entries),
        "entry_count": len(entries),
    }


# ---------------------------------------------------------------------------
# Disputes
# ---------------------------------------------------------------------------


async def create_dispute(
    db: AsyncSession,
    *,
    ledger_entry_id: uuid.UUID,
    flagged_by: str,
    reason: str,
    evidence: str | None = None,
) -> TokenDispute:
    """Create a token dispute against a ledger entry."""
    # Verify ledger entry exists
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
    return dispute
