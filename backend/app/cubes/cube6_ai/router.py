"""Cube 6 — AI Theming Clusterer: Embeddings, marble sampling, theme pipeline."""

import uuid

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser
from app.core.dependencies import get_db, get_mongo
from app.core.permissions import require_role
from app.cubes.cube6_ai import service
from app.schemas.theme import ThemeRead
from app.schemas.theme_pipeline import PipelineRunRequest

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 6 — AI Theming"])


@router.post("/ai/run", status_code=202)
async def run_ai_theming(
    session_id: uuid.UUID,
    payload: PipelineRunRequest | None = None,
    db: AsyncSession = Depends(get_db),
    mongo_db: AsyncIOMotorDatabase = Depends(get_mongo),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-09: Trigger full AI theme pipeline (marble sampling → reduction → assignment).

    Returns 202 with pipeline result summary.
    """
    seed = payload.seed if payload else None
    result = await service.run_pipeline(db, mongo_db, session_id, seed=seed)
    return result


@router.get("/themes", response_model=list[ThemeRead])
async def get_themes(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """CRS-10: Get generated themes for a session."""
    themes = await service.get_session_themes(db, session_id)
    return [ThemeRead.model_validate(t) for t in themes]
