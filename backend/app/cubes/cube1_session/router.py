"""Cube 1 — Session Join & QR: Session CRUD, QR generation, state machine."""

from fastapi import APIRouter

from app.schemas.common import ErrorResponse
from app.schemas.session import SessionCreate, SessionRead

router = APIRouter(prefix="/sessions", tags=["Cube 1 — Sessions"])


@router.post("", response_model=SessionRead, status_code=201)
async def create_session(payload: SessionCreate):
    """CRS-01: Moderator creates session."""
    raise NotImplementedError("Cube 1: create_session — not yet implemented")


@router.get("/{session_id}", response_model=SessionRead)
async def get_session(session_id: str):
    """Get session details by ID or short_code."""
    raise NotImplementedError("Cube 1: get_session — not yet implemented")


@router.post("/{session_id}/open", response_model=SessionRead)
async def open_session(session_id: str):
    """CRS-06: Moderator opens polling window."""
    raise NotImplementedError("Cube 1: open_session — not yet implemented")


@router.post("/{session_id}/close", response_model=SessionRead)
async def close_session(session_id: str):
    """CRS-06: Moderator closes polling window."""
    raise NotImplementedError("Cube 1: close_session — not yet implemented")


@router.post("/{session_id}/questions", status_code=201)
async def create_question(session_id: str):
    """Create/update questions for a session."""
    raise NotImplementedError("Cube 1: create_question — not yet implemented")
