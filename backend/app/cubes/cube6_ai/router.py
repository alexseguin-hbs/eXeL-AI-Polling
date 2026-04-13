"""Cube 6 — AI Theming Clusterer: Embeddings, marble sampling, theme pipeline."""

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_optional_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube6_ai import service
from app.schemas.theme import ThemeRead
from app.schemas.theme_pipeline import PipelineRunRequest

# WireGuard-inspired whitelists: only these exact values pass the gate
VALID_PROVIDERS = ("openai", "grok", "gemini", "claude")
VALID_THEME_LEVELS = ("3", "6", "9")
VALID_SUMMARY_LEVELS = ("theme2_3", "theme2_6", "theme2_9")

router = APIRouter(prefix="/sessions/{session_id}", tags=["Cube 6 — AI Theming"])


@router.post("/ai/run", status_code=202)
async def run_ai_theming(
    session_id: uuid.UUID,
    payload: PipelineRunRequest | None = None,
    provider: str = "openai",
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-09: Trigger full AI theme pipeline (marble sampling → reduction → assignment).

    Returns 202 with pipeline result summary.
    """
    # WireGuard-inspired: whitelist provider at the gate
    if provider not in VALID_PROVIDERS:
        raise HTTPException(
            status_code=400,
            detail=f"provider must be one of: {', '.join(VALID_PROVIDERS)}",
        )
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
    # WireGuard-inspired input validation: whitelist theme_level to prevent
    # arbitrary attribute access via getattr() in downstream code
    if theme_level not in VALID_THEME_LEVELS:
        raise HTTPException(status_code=400, detail="theme_level must be '3', '6', or '9'")
    # Sanitize top_theme2_label — alphanumeric, spaces, ampersands, and basic punctuation only
    if not re.match(r'^[\w\s&\-.,()]+$', top_theme2_label):
        raise HTTPException(status_code=400, detail="Invalid theme label characters")
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


@router.post("/themes/summarize", status_code=202)
async def generate_theme_summaries(
    session_id: uuid.UUID,
    theme_level: str = "theme2_3",
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Generate 333→111→33 word theme-level summaries.

    Samples per-response 33-word summaries from each cluster (max 50),
    then cascades through AI: 333 words → 111 words → 33 words.

    O(sample_size) not O(N) — safe for 1M+ response sessions.

    Args:
        theme_level: "theme2_3" (3 themes), "theme2_6" (6), or "theme2_9" (9)
    """
    # WireGuard-inspired: whitelist theme_level at the gate
    if theme_level not in VALID_SUMMARY_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"theme_level must be one of: {', '.join(VALID_SUMMARY_LEVELS)}",
        )
    from app.cubes.cube6_ai.theme_summarizer import generate_theme_summaries as gen

    # Dry run without AI provider (returns prompts for review)
    # To execute with AI, pass the provider function in a future integration
    results = await gen(db, session_id, theme_level=theme_level, ai_provider_fn=None)

    return {
        "status": "dry_run",
        "session_id": str(session_id),
        "theme_level": theme_level,
        "themes_found": len(results),
        "results": results,
        "note": "AI provider integration pending. Returns prompts for review.",
    }
