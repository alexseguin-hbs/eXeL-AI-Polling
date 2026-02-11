"""Cube 8 — Token Reward Calculator.

SoI Trinity token ledger:
  ♡ = time-based participation (1 min = 1 token)
  웃 = 0 by default ($7.25/hr when treasury funded)
  ◬ = 5x ♡ default
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube8_tokens import service
from app.schemas.token import TokenDisputeCreate, TokenDisputeRead, TokenLedgerRead

router = APIRouter(tags=["Cube 8 — Tokens"])


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
