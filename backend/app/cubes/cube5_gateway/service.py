"""Cube 5 — Gateway / Orchestrator Service.

The CENTER of the 3x3 cube grid. Two responsibilities:

1. TIME TRACKING (existing):
   Tracks active participation time and calculates SoI Trinity tokens:
     ♡ = ceil(active_minutes) — rounds UP to nearest minute, 1 min default on login
     웃 = jurisdiction min-wage rate per minute when enabled
         0.0 when human_enabled=False (pre-treasury)
     ◬ = ♡ * unity_heart_multiplier (default 5x)

2. PIPELINE ORCHESTRATOR (new):
   Coordinates downstream pipeline triggers when session state changes:
     polling → ranking: fires Cube 6 AI theming pipeline as background task
     ranking → closed: fires ranking aggregation (Cube 7, placeholder)
     CQS scoring: fires after Cube 7 completes (placeholder)
   Tracks pipeline status (pending/in_progress/completed/failed) with retry.

Designed for 1M peak: background tasks use fresh DB sessions, non-blocking
fire-and-forget pattern, status polling for monitoring.
"""

import asyncio
import logging
import math
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.hi_rates import resolve_human_rate
from app.models.pipeline_trigger import PipelineTrigger, VALID_TRIGGER_TYPES
from app.models.time_tracking import TimeEntry
from app.models.token_ledger import TokenLedger

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Token Calculation
# ---------------------------------------------------------------------------


def _calculate_human(
    duration_minutes: float,
    country: str | None = None,
    state: str | None = None,
) -> float:
    """Calculate 웃 tokens from duration using jurisdiction rate.

    When human_enabled=True: 웃 = duration_minutes * (rate / 60)
    When human_enabled=False: 웃 = 0.0 (pre-treasury, no payouts yet)

    Rate resolved from rate table by country + state.
    Default: 7.25/hr (Austin, Texas / US federal).
    Format: #.### (3 decimal places, no currency symbol).
    """
    if not settings.human_enabled:
        return 0.0
    rate = resolve_human_rate(country, state)
    rate_per_minute = rate / 60.0
    return round(duration_minutes * rate_per_minute, 4)


def calculate_tokens(
    duration_seconds: float,
    action_type: str,
    country: str | None = None,
    state: str | None = None,
) -> tuple[float, float, float]:
    """Calculate ♡, 웃, ◬ tokens from duration.

    Returns:
        (♡, 웃, ◬)

    Rules:
        ♡ = ceil(duration_minutes)           — rounds UP to nearest minute
        웃 = duration_min * (wage/60)        — jurisdiction rate when enabled
        ◬ = ♡ * unity_heart_multiplier   — default 5x ♡
    """
    duration_minutes = duration_seconds / 60.0
    heart = math.ceil(duration_minutes) if duration_minutes > 0 else 0.0
    human = _calculate_human(duration_minutes, country, state)
    unity = heart * settings.unity_heart_multiplier
    return float(heart), human, unity


# ---------------------------------------------------------------------------
# Start / Stop Time Tracking
# ---------------------------------------------------------------------------


async def start_time_tracking(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    action_type: str,
    reference_id: str | None = None,
    cube_id: str | None = "cube5",
) -> TimeEntry:
    """Start tracking time for an action. Creates an open TimeEntry."""
    entry = TimeEntry(
        session_id=session_id,
        participant_id=participant_id,
        action_type=action_type,
        cube_id=cube_id,
        reference_id=reference_id,
        started_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def stop_time_tracking(
    db: AsyncSession,
    *,
    time_entry_id: uuid.UUID,
    country: str | None = None,
    state: str | None = None,
) -> TimeEntry:
    """Stop tracking time, calculate duration and ♡ 웃 ◬ tokens.

    Also creates a TokenLedger entry (append-only) for the earned tokens.
    Country/state used to resolve 웃 jurisdiction rate.
    """
    result = await db.execute(
        select(TimeEntry).where(TimeEntry.id == time_entry_id)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Time entry '{time_entry_id}' not found",
        )
    if entry.stopped_at is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time entry already stopped",
        )

    now = datetime.now(timezone.utc)
    entry.stopped_at = now
    entry.duration_seconds = (now - entry.started_at).total_seconds()

    heart, human, unity = calculate_tokens(
        entry.duration_seconds, entry.action_type, country, state
    )
    entry.heart_tokens_earned = heart
    entry.human_tokens_earned = human
    entry.unity_tokens_earned = unity

    # Create append-only token ledger entry if any tokens earned
    if heart > 0 or human > 0 or unity > 0:
        ledger = TokenLedger(
            session_id=entry.session_id,
            user_id=str(entry.participant_id),
            cube_id=entry.cube_id or "cube5",
            action_type=entry.action_type,
            delta_heart=heart,
            delta_human=human,
            delta_unity=unity,
            lifecycle_state="pending",
            reason=f"{entry.action_type} ({entry.duration_seconds:.0f}s) — ♡{heart} 웃{human} ◬{unity}",
            reference_id=str(entry.id),
        )
        db.add(ledger)

    await db.commit()
    await db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Login Time Tracking (auto-created on join)
# ---------------------------------------------------------------------------


async def create_login_time_entry(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    user_id: str | None = None,
    country: str | None = None,
    state: str | None = None,
) -> TimeEntry:
    """Create a login time entry and immediately award default tokens.

    Called automatically when a participant joins a session.
    Awards:
      ♡ = login_heart_tokens (default 1)
      웃 = 1 min at jurisdiction rate when enabled, else 0
      ◬ = ♡ * unity_heart_multiplier (default 5)
    """
    now = datetime.now(timezone.utc)
    login_heart = settings.login_heart_tokens
    login_human = _calculate_human(1.0, country, state)
    login_unity = login_heart * settings.unity_heart_multiplier

    entry = TimeEntry(
        session_id=session_id,
        participant_id=participant_id,
        action_type="login",
        cube_id="cube5",
        started_at=now,
        stopped_at=now,  # instant — login credit is immediate
        duration_seconds=60.0,  # 1 minute default
        heart_tokens_earned=login_heart,
        human_tokens_earned=login_human,
        unity_tokens_earned=login_unity,
    )
    db.add(entry)

    # Append-only token ledger entry for login credit
    ledger = TokenLedger(
        session_id=session_id,
        user_id=user_id or str(participant_id),
        cube_id="cube5",
        action_type="login",
        delta_heart=login_heart,
        delta_human=login_human,
        delta_unity=login_unity,
        lifecycle_state="pending",
        reason=f"Login — ♡{login_heart} 웃{login_human} ◬{login_unity}",
        reference_id=str(participant_id),
    )
    db.add(ledger)

    await db.commit()
    await db.refresh(entry)
    return entry


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------


async def get_participant_time_summary(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
) -> dict:
    """Get aggregated time and token summary for a participant in a session."""
    result = await db.execute(
        select(TimeEntry).where(
            TimeEntry.session_id == session_id,
            TimeEntry.participant_id == participant_id,
        ).order_by(TimeEntry.started_at)
    )
    entries = list(result.scalars().all())

    total_seconds = sum(e.duration_seconds or 0.0 for e in entries)
    total_heart = sum(e.heart_tokens_earned for e in entries)
    total_human = sum(e.human_tokens_earned for e in entries)
    total_unity = sum(e.unity_tokens_earned for e in entries)

    return {
        "participant_id": participant_id,
        "session_id": session_id,
        "total_active_seconds": total_seconds,
        "total_heart_tokens": total_heart,
        "total_human_tokens": total_human,
        "total_unity_tokens": total_unity,
        "entries": entries,
    }


# ---------------------------------------------------------------------------
# Pipeline Orchestrator
# ---------------------------------------------------------------------------


async def _create_trigger(
    db: AsyncSession,
    session_id: uuid.UUID,
    trigger_type: str,
    metadata: dict | None = None,
) -> PipelineTrigger:
    """Create a PipelineTrigger record in pending state.

    Validates trigger_type against VALID_TRIGGER_TYPES.
    """
    if trigger_type not in VALID_TRIGGER_TYPES:
        raise ValueError(
            f"Invalid trigger_type '{trigger_type}'. "
            f"Must be one of: {', '.join(VALID_TRIGGER_TYPES)}"
        )

    trigger = PipelineTrigger(
        session_id=session_id,
        trigger_type=trigger_type,
        status="pending",
        triggered_at=datetime.now(timezone.utc),
        trigger_metadata=metadata,
    )
    db.add(trigger)
    await db.commit()
    await db.refresh(trigger)
    return trigger


async def update_pipeline_status(
    db: AsyncSession,
    trigger_id: uuid.UUID,
    new_status: str,
    error_message: str | None = None,
    result_metadata: dict | None = None,
) -> PipelineTrigger:
    """Update the status of a pipeline trigger.

    Called by background tasks on completion or failure.
    Sets completed_at when status is 'completed' or 'failed'.
    """
    result = await db.execute(
        select(PipelineTrigger).where(PipelineTrigger.id == trigger_id)
    )
    trigger = result.scalar_one_or_none()
    if trigger is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pipeline trigger '{trigger_id}' not found",
        )

    trigger.status = new_status
    if new_status in ("completed", "failed"):
        trigger.completed_at = datetime.now(timezone.utc)
    if error_message:
        trigger.error_message = error_message
    if result_metadata:
        trigger.trigger_metadata = {**(trigger.trigger_metadata or {}), **result_metadata}

    await db.commit()
    await db.refresh(trigger)
    return trigger


async def trigger_ai_pipeline(
    db: AsyncSession,
    session_id: uuid.UUID,
    seed: str | None = None,
    use_embedding_assignment: bool = False,
) -> PipelineTrigger:
    """Create a pipeline trigger and fire the Cube 6 AI theming pipeline.

    The AI pipeline runs as a background asyncio task using a fresh DB session
    (the request session may close before the pipeline completes). On success,
    updates trigger to 'completed'. On failure, updates to 'failed'.

    Returns the PipelineTrigger record immediately (202 Accepted pattern).
    """
    trigger = await _create_trigger(
        db,
        session_id,
        "ai_theming",
        metadata={"seed": seed, "use_embedding_assignment": use_embedding_assignment},
    )

    async def _run_pipeline_background(trigger_id: uuid.UUID) -> None:
        """Background coroutine — uses fresh DB session."""
        from app.db.postgres import async_session_factory
        from app.cubes.cube6_ai.service import run_pipeline

        async with async_session_factory() as bg_db:
            try:
                await update_pipeline_status(bg_db, trigger_id, "in_progress")
                result = await run_pipeline(
                    bg_db,
                    session_id,
                    seed=seed,
                    use_embedding_assignment=use_embedding_assignment,
                )
                await update_pipeline_status(
                    bg_db,
                    trigger_id,
                    "completed",
                    result_metadata={
                        "total_responses": result.get("total_responses", 0),
                        "replay_hash": result.get("replay_hash"),
                        "duration_sec": result.get("duration_sec"),
                    },
                )
                logger.info(
                    "cube5.pipeline.ai_theming.completed",
                    extra={"trigger_id": str(trigger_id), "session_id": str(session_id)},
                )
            except Exception as exc:
                logger.error(
                    "cube5.pipeline.ai_theming.failed",
                    extra={"trigger_id": str(trigger_id), "error": str(exc)},
                )
                try:
                    await update_pipeline_status(
                        bg_db, trigger_id, "failed", error_message=str(exc)
                    )
                except Exception:
                    logger.exception("cube5.pipeline.status_update_failed")

    asyncio.create_task(_run_pipeline_background(trigger.id))
    return trigger


async def trigger_ranking_pipeline(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> PipelineTrigger:
    """Create a pipeline trigger for Cube 7 ranking aggregation (placeholder).

    The actual ranking logic will be implemented in Cube 7.
    This creates the trigger record so status tracking is ready.
    """
    return await _create_trigger(
        db, session_id, "ranking_aggregation"
    )


async def trigger_cqs_scoring(
    db: AsyncSession,
    session_id: uuid.UUID,
    top_theme2_id: str | None = None,
) -> PipelineTrigger:
    """Create a pipeline trigger for CQS scoring (placeholder).

    CQS scoring fires after Cube 7 ranking completes. Scores only
    responses in the #1 most-voted Theme2 cluster with >95% confidence.
    """
    return await _create_trigger(
        db,
        session_id,
        "cqs_scoring",
        metadata={"top_theme2_id": top_theme2_id},
    )


async def orchestrate_post_polling(
    db: AsyncSession,
    session_id: uuid.UUID,
    seed: str | None = None,
) -> PipelineTrigger:
    """Master orchestrator — called on polling → ranking transition.

    Fires the AI theming pipeline as the first step. Subsequent pipelines
    (ranking aggregation, CQS scoring) will be chained after Cube 7 is
    implemented.
    """
    logger.info(
        "cube5.orchestrate_post_polling",
        extra={"session_id": str(session_id)},
    )
    return await trigger_ai_pipeline(
        db, session_id, seed=seed
    )


async def get_pipeline_status(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> dict:
    """Return all pipeline triggers for a session with status flags.

    Returns dict with:
      - triggers: list of PipelineTrigger records
      - total: count
      - has_pending: any trigger in pending/in_progress
      - has_failed: any trigger failed
      - all_completed: all triggers completed
    """
    result = await db.execute(
        select(PipelineTrigger)
        .where(PipelineTrigger.session_id == session_id)
        .order_by(PipelineTrigger.triggered_at)
    )
    triggers = list(result.scalars().all())

    statuses = [t.status for t in triggers]
    return {
        "session_id": session_id,
        "triggers": triggers,
        "total": len(triggers),
        "has_pending": any(s in ("pending", "in_progress") for s in statuses),
        "has_failed": any(s == "failed" for s in statuses),
        "all_completed": len(triggers) > 0 and all(s == "completed" for s in statuses),
    }
