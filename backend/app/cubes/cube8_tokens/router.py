"""Cube 8 — Token Reward Calculator (MVP3 stub). SI tokens calculated by Cube 5 time tracking."""

from fastapi import APIRouter

from app.schemas.token import TokenDisputeCreate, TokenDisputeRead, TokenLedgerRead

router = APIRouter(tags=["Cube 8 — Tokens (MVP3)"])


@router.get("/sessions/{session_id}/tokens", response_model=list[TokenLedgerRead])
async def get_session_tokens(session_id: str):
    """CRS-25: Get token ledger for a session."""
    raise NotImplementedError("Cube 8: get_session_tokens — not yet implemented")


@router.post("/tokens/dispute", response_model=TokenDisputeRead, status_code=201)
async def create_token_dispute(payload: TokenDisputeCreate):
    """CRS-33: Flag/dispute token calculation."""
    raise NotImplementedError("Cube 8: create_token_dispute — not yet implemented")
