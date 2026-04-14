"""Cube 6 Pipeline Orchestration — Public API for theme pipeline.

Coordinates Phase A (live summarization) and Phase B (parallel theming).
Exposes: run_pipeline, get_pipeline_status, get_session_themes, run_cqs_pipeline.

Split from service.py for Succinctness (O7 gap fix, 2026-04-13).
"""
import asyncio
import hashlib
import html
import json
import logging
import math
import re
import uuid
from datetime import datetime, timezone

import numpy as np
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.cubes.cube6_ai.providers.base import EmbeddingProvider, SummarizationProvider
from app.cubes.cube6_ai.providers.factory import (
    get_embedding_provider,
    get_summarization_provider,
)
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary
from app.models.session import Session
from app.models.theme import Theme
from app.models.theme_sample import ThemeSample

from app.cubes.cube6_ai.phase_b import (
    _fetch_summaries, _classify_theme01, _group_by_theme01,
    _parallel_marble_sample, _parallel_generate_themes,
    _reduce_themes, _assign_themes_llm, _assign_themes_embedding,
    _store_results,
)
logger = logging.getLogger(__name__)

# Theme01 categories (matches monolith)
THEME01_CATEGORIES = ["Risk & Concerns", "Supporting Comments", "Neutral Comments"]
_CONFIDENCE_THRESHOLD = 65  # <65% -> reclassify as Neutral (monolith line 127)



async def run_pipeline(
    db: AsyncSession,
    session_id: uuid.UUID,
    seed: str | None = None,
    *,
    use_embedding_assignment: bool = False,
) -> dict:
    """Execute the full parallel theming pipeline for a session.

    CRS-11: AI Theme generation from user responses.
    CRS-12: Deterministic theme hierarchy (9 → 6 → 3).
    CRS-13: Theme assignment with confidence scores.

    Called after moderator closes polling. Summaries already exist
    from Phase A (live per-response summarization during polling).

    Pipeline Steps (I/O boundaries for Cube 10 Challengers):
      Step 1: Fetch summaries       → list[dict] (CRS-11.01)
      Step 2: Classify Theme01      → responses with theme01 field (CRS-11.02)
      Step 3: Group by Theme01      → 3 bins (CRS-11.03)
      Step 4: Marble sampling       → grouped samples (CRS-11.04)
      Step 5: Generate themes       → theme labels per bin (CRS-12.01)
      Step 6: Reduce 9 → 6 → 3     → hierarchy dict (CRS-12.02)
      Step 7: Assign themes         → responses with theme2_9/6/3 (CRS-13.01)
      Step 8: Store results         → PostgreSQL + replay hash (CRS-13.02)

    Args:
        use_embedding_assignment: If True, use cosine similarity for theme
            assignment (faster). If False, use LLM matching (monolith approach).
    """
    import time
    start_time = time.monotonic()

    # Load session
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise ValueError(f"Session {session_id} not found")

    # Task B5: Track pipeline stage for recovery + status endpoint
    session.pipeline_stage = "starting"

    effective_seed = seed or session.seed or str(session_id)
    seed_int = int(hashlib.md5(effective_seed.encode()).hexdigest()[:8], 16)

    provider_name = session.ai_provider or "openai"
    summarizer = get_summarization_provider(provider_name)

    # Cost tracking for this pipeline run
    from app.cubes.cube6_ai.providers.base import AICostTracker
    cost_tracker = AICostTracker(provider_name)

    logger.info("cube6.pipeline.start", session_id=str(session_id), provider=provider_name)

    # Step 1: Fetch pre-computed 33-word summaries
    logger.info("Step 1: Fetching pre-computed summaries")
    responses = await _fetch_summaries(db, session_id)
    if not responses:
        return {
            "session_id": str(session_id),
            "status": "completed",
            "total_responses": 0,
            "message": "No responses to process",
            "duration_sec": round(time.monotonic() - start_time, 2),
        }

    # Task B5: Wrap pipeline in try/except for failure recovery.
    # On failure: store partial results, set pipeline_stage to error stage.
    # Moderator can re-trigger POST /ai/run which is idempotent.
    try:
        # Step 2: Classify Theme01 (batch parallel)
        session.pipeline_stage = "classifying"
        logger.info("Step 2: Classifying Theme01 for %d responses", len(responses))
        responses = await _classify_theme01(summarizer, responses)

        # Step 3: Group by Theme01
        session.pipeline_stage = "grouping"
        logger.info("Step 3: Grouping by Theme01")
        bins = _group_by_theme01(responses)
        bin_counts = {k: len(v) for k, v in bins.items()}

        # Step 4: Marble sampling (shuffle + slice)
        session.pipeline_stage = "sampling"
        logger.info("Step 4: Marble sampling (seed=%d)", seed_int)
        bin_samples = await _parallel_marble_sample(bins, seed_int)
        group_counts = {k: len(v) for k, v in bin_samples.items()}

        # Step 5: Generate 3 themes per marble group (10+ concurrent agents)
        session.pipeline_stage = "generating"
        logger.info("Step 5: Generating themes (%s groups total)",
                    sum(group_counts.values()))
        all_themes = await _parallel_generate_themes(summarizer, bin_samples)
        theme_counts = {k: len(v) for k, v in all_themes.items()}

        # Step 6: Reduce all -> 9 -> 6 -> 3 (concurrent per category)
        session.pipeline_stage = "reducing"
        logger.info("Step 6: Reducing themes (all->9->6->3)")
        reduced = await _reduce_themes(summarizer, all_themes)

        # Step 7: Assign themes to all responses
        session.pipeline_stage = "assigning"
        logger.info("Step 7: Assigning themes to all responses")
        if use_embedding_assignment:
            embedder = get_embedding_provider(provider_name)
            responses = await _assign_themes_embedding(embedder, responses, reduced)
        else:
            responses = await _assign_themes_llm(summarizer, responses, reduced)

        # Step 8: Store results
        session.pipeline_stage = "storing"
        logger.info("Step 8: Storing results")
        replay_hash = await _store_results(
            db, session, responses, bin_samples, reduced
        )

        session.pipeline_stage = "completed"

    except Exception as exc:
        # Task B5: On failure, mark session with error stage for status endpoint
        failed_stage = getattr(session, "pipeline_stage", "unknown")
        session.pipeline_stage = f"error:{failed_stage}"
        try:
            await db.commit()
        except Exception:
            pass
        logger.error(
            "cube6.pipeline.failed",
            session_id=str(session_id),
            stage=failed_stage,
            error=str(exc),
        )
        return {
            "session_id": str(session_id),
            "status": "error",
            "stage": failed_stage,
            "error": str(exc),
            "duration_sec": round(time.monotonic() - start_time, 2),
        }

    duration = round(time.monotonic() - start_time, 2)

    # Estimate cost from response count × AI calls made
    # Phase B: ~3 calls per category (reduce 9→6→3) × 3 categories = 9
    # + 1 classify call + N assignment calls
    total_chars = sum(len(r.get("summary_33", "")) for r in responses)
    cost_tracker.log_call(total_chars * 3, total_chars)  # classify + assign estimate
    cost_tracker.log_call(total_chars, total_chars // 3)  # reduction estimate

    logger.info(
        "cube6.pipeline.completed",
        session_id=str(session_id),
        total_responses=len(responses),
        duration_sec=duration,
        **cost_tracker.summary(),
    )

    # Persist cost tracking to DB for audit trail
    try:
        from app.models.ai_cost_log import AICostLog
        cost_summary = cost_tracker.summary()
        cost_log = AICostLog(
            session_id=session_id,
            phase="phase_b",
            provider=provider_name,
            total_calls=cost_summary["total_calls"],
            total_input_chars=cost_summary["total_input_chars"],
            total_output_chars=cost_summary["total_output_chars"],
            estimated_cost_usd=cost_summary["estimated_cost_usd"],
            response_count=len(responses),
            duration_sec=duration,
        )
        db.add(cost_log)
        await db.commit()
    except Exception as e:
        logger.warning("cube6.cost_log.persist_failed", error=str(e))

    # --- Task B4: Broadcast themes_ready after full pipeline success ---
    # Gate: only fires on full success (not partial). Dashboard transitions
    # to results view on receipt.
    try:
        from app.core.supabase_broadcast import broadcast_event

        theme_count = sum(
            len(levels.get("3", []))
            for levels in reduced.values()
        )
        await broadcast_event(
            channel=f"session:{session.short_code}",
            event="themes_ready",
            payload={
                "session_id": str(session_id),
                "theme_count": theme_count,
                "total_responses": len(responses),
                "replay_hash": replay_hash,
                "duration_sec": duration,
            },
        )
        logger.info(
            "cube6.themes_ready.broadcast",
            session_id=str(session_id),
            theme_count=theme_count,
        )
    except Exception as exc:
        # Non-fatal — results are stored even if broadcast fails
        logger.warning(
            "cube6.themes_ready.broadcast_failed",
            session_id=str(session_id),
            error=str(exc),
        )

    return {
        "session_id": str(session_id),
        "status": "completed",
        "total_responses": len(responses),
        "bins": bin_counts,
        "marble_groups": group_counts,
        "candidate_themes": theme_counts,
        "themes_9": {
            cat: [t["label"] for t in levels.get("9", [])]
            for cat, levels in reduced.items()
        },
        "themes_6": {
            cat: [t["label"] for t in levels.get("6", [])]
            for cat, levels in reduced.items()
        },
        "themes_3": {
            cat: [t["label"] for t in levels.get("3", [])]
            for cat, levels in reduced.items()
        },
        "replay_hash": replay_hash,
        "duration_sec": duration,
        "cost": cost_tracker.summary(),
    }


# ═══════════════════════════════════════════════════════════════════
# CQS SCORING — delegated to cqs_engine.py for succinctness
# ═══════════════════════════════════════════════════════════════════

from app.cubes.cube6_ai.cqs_engine import (  # noqa: E402
    score_cqs,
    select_cqs_winner,
    run_cqs_pipeline,
)


async def get_pipeline_status(
    db: AsyncSession, session_id: uuid.UUID
) -> dict:
    """Task B5: Return current pipeline stage + error info for status endpoint."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise ValueError(f"Session {session_id} not found")

    stage = getattr(session, "pipeline_stage", None) or "not_started"
    is_error = stage.startswith("error:")

    # Count stored themes to show progress
    theme_result = await db.execute(
        select(func.count(Theme.id)).where(Theme.session_id == session_id)
    )
    theme_count = theme_result.scalar() or 0

    return {
        "session_id": str(session_id),
        "stage": stage.replace("error:", "") if is_error else stage,
        "status": "error" if is_error else ("completed" if stage == "completed" else "running"),
        "theme_count": theme_count,
        "replay_hash": session.replay_hash,
    }


async def get_session_themes(
    db: AsyncSession, session_id: uuid.UUID
) -> list[Theme]:
    """Return all Theme records for a session."""
    result = await db.execute(
        select(Theme)
        .where(Theme.session_id == session_id)
        .order_by(Theme.created_at)
    )
    return list(result.scalars().all())
