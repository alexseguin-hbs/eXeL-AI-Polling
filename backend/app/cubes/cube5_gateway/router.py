"""Cube 5 — User Input Gateway / Orchestrator.

The CENTER of the 3x3 cube grid. All flows pass through here:
- Join events
- Submissions (triggers Cube 2/3 → Cube 4)
- Poll state changes (triggers Cube 6 AI after close)
- Ranking aggregation triggers (Cube 7)
- Time tracking (start/stop per action, feeds SI tokens)
"""

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_optional_current_user
from app.core.dependencies import get_db
from app.cubes.cube5_gateway import service
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
    ♡ SI = floor(active_minutes), 웃 HI = 0, ◬ AI = 5x SI.
    """
    # Use user_id as participant_id fallback for now
    participant_id_str = user.user_id if user else str(session_id)
    entry = await service.start_time_tracking(
        db,
        session_id=session_id,
        participant_id=session_id,  # Will be resolved by caller with real participant_id
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
):
    """Stop tracking active participation time.

    Calculates duration and SoI Trinity tokens (♡ SI, 웃 HI, ◬ AI).
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
):
    """Get total active time and SoI Trinity tokens for a participant."""
    summary = await service.get_participant_time_summary(
        db,
        session_id=session_id,
        participant_id=participant_id,
    )
    return ParticipantTimeSummary(**summary)


# --- Payments / Monetization ---


@router.post("/sessions/{session_id}/payment/checkout")
async def create_payment_checkout(session_id: str):
    """Create Stripe checkout for session payment (moderator) or result download (user)."""
    raise NotImplementedError("Cube 5: create_payment_checkout — not yet implemented")


@router.get("/sessions/{session_id}/payment/status")
async def get_payment_status(session_id: str):
    """Check payment status for a session."""
    raise NotImplementedError("Cube 5: get_payment_status — not yet implemented")


@router.post("/webhooks/stripe")
async def stripe_webhook():
    """Handle Stripe webhook events (payment success, etc.)."""
    raise NotImplementedError("Cube 5: stripe_webhook — not yet implemented")
