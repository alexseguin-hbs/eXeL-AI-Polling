"""Cube 2 — Text Submission Handler: Validate, store text responses.

Endpoints:
  POST /sessions/{session_id}/responses             — Submit text (CRS-07), rate-limited 100/min
  GET  /sessions/{session_id}/responses              — List with pagination
  GET  /sessions/{session_id}/responses/{id}         — Single response (moderator: full detail)
  GET  /sessions/{session_id}/responses/metrics      — System/User/Outcome metrics for Cube 10
"""

import uuid

from fastapi import APIRouter, Depends, Query, Request
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user, get_optional_current_user
from app.core.dependencies import get_db, get_redis
from app.core.exceptions import ResponseNotFoundError
from app.core.rate_limit import limiter
from app.core.submission_validators import validate_session_exists
from app.cubes.cube2_text import metrics as cube2_metrics
from app.cubes.cube2_text import service
from app.schemas.response import (
    PaginatedResponseList,
    ResponseCreate,
    ResponseRead,
    TextResponseDetail,
)

router = APIRouter(
    prefix="/sessions/{session_id}/responses",
    tags=["Cube 2 — Text Input"],
)


@router.post("", response_model=ResponseRead, status_code=201)
@limiter.limit("100/minute")
async def submit_response(
    request: Request,
    session_id: uuid.UUID,
    payload: ResponseCreate,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """CRS-07: User submits text response.

    Validates session (must be polling), question, participant, and text input.
    Runs PII detection (NER + regex) and profanity detection (non-blocking).
    Stores raw text and metadata in PostgreSQL.
    Returns immediate token display (♡ and ◬).
    """
    result = await service.submit_text_response(
        db, redis,
        session_id=session_id,
        question_id=payload.question_id,
        participant_id=payload.participant_id,
        raw_text=payload.raw_text,
        language_code=payload.language_code,
    )
    return result


@router.get("", response_model=PaginatedResponseList)
@limiter.limit("200/minute")
async def list_responses(
    request: Request,
    session_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """List paginated responses for a session. CRS-07: Session validated."""
    await validate_session_exists(db, session_id)
    return await service.get_responses(
        db, session_id, page=page, page_size=page_size,
    )


@router.get("/metrics")
@limiter.limit("60/minute")
async def get_metrics(
    request: Request,
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Cube 2 metrics (Moderator-only). CRS-07: aggregate session data protected."""
    return await cube2_metrics.get_all_metrics(db, session_id)


@router.get("/{response_id}", response_model=TextResponseDetail)
@limiter.limit("200/minute")
async def get_response(
    request: Request,
    session_id: uuid.UUID,
    response_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Get a single response by ID. CRS-08: Session validated, correct 404."""
    await validate_session_exists(db, session_id)
    result = await service.get_response_by_id(db, session_id, response_id)
    if result is None:
        raise ResponseNotFoundError(str(response_id))
    return result
