"""Cube 4 — Response Collector: Aggregate, store, cache, presence."""

from fastapi import APIRouter

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 4 — Collector"])


@router.get("/presence")
async def get_presence(session_id: str):
    """Get live presence count for a session."""
    raise NotImplementedError("Cube 4: get_presence — not yet implemented")


@router.get("/responses")
async def list_responses(session_id: str):
    """List collected responses for a session."""
    raise NotImplementedError("Cube 4: list_responses — not yet implemented")
