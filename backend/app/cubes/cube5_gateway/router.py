"""Cube 5 — User Input Gateway / Orchestrator.

The CENTER of the 3x3 cube grid. All flows pass through here:
- Join events
- Submissions (triggers Cube 2/3 → Cube 4)
- Poll state changes (triggers Cube 6 AI after close)
- Ranking aggregation triggers (Cube 7)
- Time tracking (start/stop per action, feeds SI tokens)
"""

from fastapi import APIRouter

from app.schemas.participant import ParticipantJoin, ParticipantRead
from app.schemas.time_tracking import (
    ParticipantTimeSummary,
    TimeEntryRead,
    TimeEntryStart,
    TimeEntryStop,
)

router = APIRouter(tags=["Cube 5 — Gateway / Orchestrator"])


# --- Join Flow ---


@router.post(
    "/sessions/{session_id}/join",
    response_model=ParticipantRead,
    status_code=201,
)
async def join_session(session_id: str, payload: ParticipantJoin):
    """CRS-02: User joins session via QR/link. Gateway validates and registers."""
    raise NotImplementedError("Cube 5: join_session — not yet implemented")


# --- Time Tracking ---


@router.post(
    "/sessions/{session_id}/time/start",
    response_model=TimeEntryRead,
    status_code=201,
)
async def start_time_tracking(session_id: str, payload: TimeEntryStart):
    """Start tracking active participation time.

    Called when user begins responding or ranking.
    1 minute active = 1 ♡ SI token.
    """
    raise NotImplementedError("Cube 5: start_time_tracking — not yet implemented")


@router.post(
    "/sessions/{session_id}/time/stop",
    response_model=TimeEntryRead,
)
async def stop_time_tracking(session_id: str, payload: TimeEntryStop):
    """Stop tracking active participation time.

    Calculates duration and SI tokens earned.
    """
    raise NotImplementedError("Cube 5: stop_time_tracking — not yet implemented")


@router.get(
    "/sessions/{session_id}/time/summary/{participant_id}",
    response_model=ParticipantTimeSummary,
)
async def get_time_summary(session_id: str, participant_id: str):
    """Get total active time and SI tokens for a participant in a session."""
    raise NotImplementedError("Cube 5: get_time_summary — not yet implemented")


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
