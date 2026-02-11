"""Cube 2 — Text Submission Handler: Validate, store text responses."""

from fastapi import APIRouter

from app.schemas.response import ResponseCreate, ResponseRead

router = APIRouter(prefix="/sessions/{session_id}/responses", tags=["Cube 2 — Text Responses"])


@router.post("", response_model=ResponseRead, status_code=201)
async def submit_response(session_id: str, payload: ResponseCreate):
    """CRS-07: User submits text response."""
    raise NotImplementedError("Cube 2: submit_response — not yet implemented")
