"""Cube 4 — Response Collector: Aggregate, store, cache, presence.

Endpoints aggregate collected responses from Cubes 2 & 3 into the
standardized Web_Results format, provide presence tracking, and expose
summary/theme status for the moderator dashboard.
"""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user, get_optional_current_user
from app.core.dependencies import get_db, get_redis
from app.core.exceptions import ResponseNotFoundError
from app.cubes.cube4_collector.service import (
    get_collected_responses,
    get_response_count,
    get_response_languages,
    get_session_presence,
    get_single_response,
    get_summary_status,
    validate_session_exists,
)

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 4 -- Collector"])


@router.get("/collected")
async def list_collected_responses(
    session_id: uuid.UUID,
    include_summaries: bool = Query(False, description="Include 333/111/33 summaries"),
    include_themes: bool = Query(False, description="Include theme assignments"),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """List collected responses in Web_Results format with optional summaries/themes.

    CRS-09: Session validated to prevent enumeration.
    """
    await validate_session_exists(db, session_id)
    return await get_collected_responses(
        db, session_id,
        include_summaries=include_summaries,
        include_themes=include_themes,
        page=page,
        page_size=page_size,
    )


@router.get("/collected/{response_id}")
async def get_collected_response(
    session_id: uuid.UUID,
    response_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Get a single collected response with all data (summaries + themes).

    CRS-09.01: Session validated; 404 uses ResponseNotFoundError.
    """
    await validate_session_exists(db, session_id)
    result = await get_single_response(db, session_id, response_id)
    if result is None:
        raise ResponseNotFoundError(str(response_id))
    return result


@router.get("/response-count")
async def response_count(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Get response count breakdown (total, text, voice)."""
    await validate_session_exists(db, session_id)
    return await get_response_count(db, session_id)


@router.get("/response-languages")
async def response_languages(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Get breakdown of response languages for a session."""
    await validate_session_exists(db, session_id)
    return await get_response_languages(db, session_id)


@router.get("/presence")
async def get_presence(
    session_id: uuid.UUID,
    redis=Depends(get_redis),
):
    """Get live presence count for a session (Redis). No auth — participants need this."""
    return await get_session_presence(redis, session_id)


@router.get("/summary-status")
async def summary_status(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Check summary generation progress (Moderator-only). CRS-09.05."""
    return await get_summary_status(db, session_id)
