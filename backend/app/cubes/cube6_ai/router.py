"""Cube 6 — AI Theming Clusterer: Embeddings, marble sampling, theme pipeline."""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_optional_current_user
from app.core.dependencies import get_db
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
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-09: Trigger full AI theme pipeline (marble sampling → reduction → assignment).

    Returns 202 with pipeline result summary.
    """
    seed = payload.seed if payload else None
    result = await service.run_pipeline(db, session_id, seed=seed)
    return result


@router.get("/ai/status")
async def get_ai_status(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin", "lead")),
):
    """Task B5: Pipeline status — stage, error info, theme count.

    Returns current pipeline stage for recovery monitoring.
    Moderator can re-trigger POST /ai/run if status shows error.
    """
    return await service.get_pipeline_status(db, session_id)


@router.post("/ai/cqs", status_code=202)
async def run_cqs_scoring(
    session_id: uuid.UUID,
    top_theme2_label: str,
    theme_level: str = "3",
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-11: Run CQS scoring on #1 most-voted Theme2 cluster.

    Scores eligible responses (>95% confidence) on 6 quality metrics.
    Selects winner with deterministic tie-breaking. Moderator-only.
    """
    return await service.run_cqs_pipeline(
        db, session_id, top_theme2_label, theme_level
    )


@router.get("/themes", response_model=list[ThemeRead])
async def get_themes(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """CRS-10: Get generated themes for a session."""
    themes = await service.get_session_themes(db, session_id)
    return [ThemeRead.model_validate(t) for t in themes]
