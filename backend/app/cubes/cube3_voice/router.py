"""Cube 3 — Voice-to-Text Engine (MVP2 stub)."""

from fastapi import APIRouter

router = APIRouter(prefix="/sessions/{session_id}/voice", tags=["Cube 3 — Voice (MVP2)"])


@router.post("", status_code=501)
async def submit_voice():
    """CRS-15: Voice submission — MVP2, not yet implemented."""
    return {"detail": "Voice input is planned for MVP2"}
