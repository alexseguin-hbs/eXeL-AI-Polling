"""Cube 5 — User Input Gateway / Orchestrator.

The CENTER of the 3x3 cube grid. All flows pass through here:
- Join events
- Submissions (triggers Cube 2/3 → Cube 4)
- Poll state changes (triggers Cube 6 AI after close)
- Ranking aggregation triggers (Cube 7)
- Time tracking (start/stop per action, feeds ♡ 웃 ◬ tokens)
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user, get_optional_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube5_gateway import service
from app.schemas.pipeline import (
    PipelineRetryResponse,
    PipelineStatusResponse,
    PipelineTriggerRead,
    TriggerThemingRequest,
)
from app.schemas.time_tracking import (
    ParticipantTimeSummary,
    TimeEntryRead,
    TimeEntryStart,
    TimeEntryStop,
)

router = APIRouter(tags=["Cube 5 — Gateway / Orchestrator"])


# --- Time Tracking ---


@router.post(
    "/sessions/{session_id}/time/start",
    response_model=TimeEntryRead,
    status_code=201,
)
async def start_time_tracking(
    session_id: uuid.UUID,
    payload: TimeEntryStart,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Start tracking active participation time.

    Called when user begins responding or ranking.
    ♡ = floor(active_minutes), 웃 = 0, ◬ = 5x ♡.
    """
    # Resolve participant_id from authenticated user, fallback to session_id for internal calls
    participant_id = uuid.UUID(user.user_id) if user else session_id
    entry = await service.start_time_tracking(
        db,
        session_id=session_id,
        participant_id=participant_id,
        action_type=payload.action_type,
        reference_id=payload.reference_id,
    )
    return TimeEntryRead.model_validate(entry)


@router.post(
    "/sessions/{session_id}/time/stop",
    response_model=TimeEntryRead,
)
async def stop_time_tracking(
    session_id: uuid.UUID,
    payload: TimeEntryStop,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Stop tracking active participation time.

    Calculates duration and ♡ 웃 ◬ tokens.
    Creates append-only token ledger entry.
    """
    entry = await service.stop_time_tracking(
        db,
        time_entry_id=payload.time_entry_id,
    )
    return TimeEntryRead.model_validate(entry)


@router.get(
    "/sessions/{session_id}/time/summary/{participant_id}",
    response_model=ParticipantTimeSummary,
)
async def get_time_summary(
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Get total active time and ♡ 웃 ◬ tokens for a participant."""
    summary = await service.get_participant_time_summary(
        db,
        session_id=session_id,
        participant_id=participant_id,
    )
    return ParticipantTimeSummary(**summary)


# --- Pipeline Orchestrator ---


@router.post(
    "/sessions/{session_id}/pipeline/trigger-theming",
    response_model=PipelineTriggerRead,
    status_code=202,
)
async def trigger_theming(
    session_id: uuid.UUID,
    payload: TriggerThemingRequest | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Manually trigger the AI theming pipeline (Cube 6) for a session.

    Returns 202 Accepted — pipeline runs asynchronously in the background.
    Poll /pipeline/status to check progress.
    """
    seed = payload.seed if payload else None
    use_embedding = payload.use_embedding_assignment if payload else False
    trigger = await service.trigger_ai_pipeline(
        db, session_id, seed=seed, use_embedding_assignment=use_embedding
    )
    return PipelineTriggerRead.model_validate(trigger)


@router.get(
    "/sessions/{session_id}/pipeline/status",
    response_model=PipelineStatusResponse,
)
async def get_pipeline_status(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Get pipeline status for all triggers (Moderator-only — CRS-11.04)."""
    data = await service.get_pipeline_status(db, session_id)
    return PipelineStatusResponse(
        session_id=data["session_id"],
        triggers=[PipelineTriggerRead.model_validate(t) for t in data["triggers"]],
        total=data["total"],
        has_pending=data["has_pending"],
        has_failed=data["has_failed"],
        all_completed=data["all_completed"],
    )


@router.post(
    "/sessions/{session_id}/pipeline/retry/{trigger_id}",
    response_model=PipelineRetryResponse,
)
async def retry_pipeline(
    session_id: uuid.UUID,
    trigger_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Retry a failed pipeline trigger.

    Only triggers in 'failed' status can be retried. Returns 409 if not failed.
    """
    from app.models.pipeline_trigger import PipelineTrigger
    from sqlalchemy import select

    result = await db.execute(
        select(PipelineTrigger).where(
            PipelineTrigger.id == trigger_id,
            PipelineTrigger.session_id == session_id,
        )
    )
    trigger = result.scalar_one_or_none()
    if trigger is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Pipeline trigger not found")
    if trigger.status != "failed":
        from fastapi import HTTPException
        raise HTTPException(
            status_code=409,
            detail=f"Cannot retry trigger in '{trigger.status}' status — only 'failed' triggers can be retried",
        )

    # Reset to pending and re-fire based on trigger type
    trigger.status = "pending"
    trigger.error_message = None
    trigger.completed_at = None
    await db.commit()
    await db.refresh(trigger)

    if trigger.trigger_type == "ai_theming":
        seed = (trigger.trigger_metadata or {}).get("seed")
        use_embedding = (trigger.trigger_metadata or {}).get("use_embedding_assignment", False)
        await service.trigger_ai_pipeline(
            db, session_id, seed=seed, use_embedding_assignment=use_embedding
        )

    return PipelineRetryResponse(
        trigger_id=trigger_id,
        new_status="pending",
        message=f"Trigger {trigger_id} reset to pending and re-fired",
    )


# --- Payments / Monetization ---
# Stripe checkout, payment status, and webhook endpoints will be implemented
# with Cube 8 (Token Reward Calculator). See docs/CUBES_7-9.md for spec.
