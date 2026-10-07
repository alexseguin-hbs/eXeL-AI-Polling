"""Cube 6 — AI Theming Clusterer: Embeddings, marble sampling, theme pipeline."""

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_optional_current_user
from app.core.rate_limit import limiter
from app.core.session_access import require_session_owner
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
    user: CurrentUser = Depends(require_session_owner("moderator", "admin")),
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
    from app.cubes.cube6_ai.phase_b import ThemesLockedError

    try:
        result = await service.run_pipeline(db, session_id, seed=seed)
    except ThemesLockedError as e:
        raise HTTPException(status_code=409, detail=str(e))
    return result


@router.get("/ai/status")
async def get_ai_status(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", "lead", leads_read=True)),
):
    """Task B5: Pipeline status — stage, error info, theme count.

    Returns current pipeline stage for recovery monitoring.
    Moderator can re-trigger POST /ai/run if status shows error.
    """
    return await service.get_pipeline_status(db, session_id)


@router.post("/ai/cqs", status_code=202)
@limiter.limit("10/minute")  # each call runs a provider-backed scoring of the whole winning theme (Krishna, r16)
async def run_cqs_scoring(
    request: Request,
    session_id: uuid.UUID,
    top_theme2_label: str,
    theme_level: str = "3",
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin")),
):
    """CRS-11: Run CQS scoring on #1 most-voted Theme2 cluster.

    Scores eligible responses (>95% confidence) on 6 quality metrics.
    Selects winner with deterministic tie-breaking. Moderator-only.
    """
    # WireGuard-inspired input validation: whitelist theme_level to prevent
    # arbitrary attribute access via getattr() in downstream code
    if theme_level not in VALID_THEME_LEVELS:
        raise HTTPException(status_code=400, detail="theme_level must be '3', '6', or '9'")
    # The label must be one of THIS session's Theme02 labels — an exact, parameterised lookup, never a character
    # whitelist: phase B stores html-escaped labels in any of 33 languages ('Privacy &amp; Trust', Hindi, Thai), and
    # the old regex refused them, or let the raw '&' through to match nothing (Enki, AsM round 12).
    import html as _html

    from sqlalchemy import select as _select

    from app.models.theme import Theme

    if not top_theme2_label or len(top_theme2_label) > 200:
        raise HTTPException(status_code=400, detail="Invalid theme label")
    found = (await db.execute(
        _select(Theme.label, Theme.parent_theme_id).where(
            Theme.session_id == session_id,
            Theme.parent_theme_id.isnot(None),
            Theme.label.in_({top_theme2_label, _html.escape(top_theme2_label)}),
        ).order_by(Theme.response_count.desc(), Theme.id).limit(1)
    )).one_or_none()
    if found is None:
        raise HTTPException(status_code=400, detail="That theme is not one of this session's themes")
    stored, parent_id = found
    category = (await db.execute(_select(Theme.label).where(Theme.id == parent_id))).scalar_one_or_none()
    # The same tracked path as the ranking handoff: its own trigger, CQS capacity, timeout and failure cleanup, scoped
    # to the theme's own Theme01 category (Krishna, round 16).
    from app.cubes.cube5_gateway.service import run_cqs_tracked

    return await run_cqs_tracked(db, session_id, stored, theme_level, category)


@router.get("/themes", response_model=list[ThemeRead])
async def get_themes(
    session_id: uuid.UUID,
    category: str | None = None,
    level: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """CRS-10: Get generated themes for a session.

    Enriched with theme01_category (risk|support|neutral) + theme_level (3|6|9)
    so Cube 7 can filter without re-joining. Optional query params filter
    server-side; whitelist-validated for safety.
    """
    if category is not None and category not in ("risk", "support", "neutral"):
        raise HTTPException(
            status_code=400,
            detail="category must be one of: risk, support, neutral",
        )
    if level is not None and level not in VALID_THEME_LEVELS:
        raise HTTPException(
            status_code=400,
            detail=f"level must be one of: {', '.join(VALID_THEME_LEVELS)}",
        )
    # The ballot cycle's themes only (a re-opened session keeps earlier cycles' rows — Athena, AsM round 5).
    enriched = await service.get_session_themes_enriched(db, session_id, ballot_cycle_only=True)
    if category is not None:
        enriched = [e for e in enriched if e["theme01_category"] == category]
    if level is not None:
        enriched = [e for e in enriched if e["theme_level"] == level]
    return [ThemeRead.model_validate(e) for e in enriched]


@router.post("/themes/summarize", status_code=202)
async def generate_theme_summaries(
    session_id: uuid.UUID,
    theme_level: str = "theme2_3",
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin")),
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


@router.get("/ai/metrics")
async def get_ai_metrics(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", "lead", leads_read=True)),
):
    """Cube 6 SSSES metrics (System/User/Outcome) — R-Core parity with cubes 2/3/7/8.

    Library-only metrics engine (cube6_ai.metrics) surfaced for the Dev-Sim /
    qualification gateway. Privileged-role only; DB-error-guarded downstream.
    """
    from app.cubes.cube6_ai import metrics as ai_metrics

    return await ai_metrics.get_all_metrics(db, session_id)


@router.get("/ai/verify-replay")
async def verify_ai_replay(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_session_owner("moderator", "admin", "lead", leads_read=True)),
):
    """Cube 6 replay-anchor verification (R-Core parity with Cube 1 verify-determinism).

    Surfaces the theming `replay_hash` Cube 6 persists at completion so a consumer can
    confirm deterministic theming across re-runs. Read-only; privileged-role only.
    """
    from app.cubes.cube6_ai.pipeline import verify_theming_replay

    return await verify_theming_replay(db, session_id)
