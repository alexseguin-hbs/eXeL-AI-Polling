"""Cube 5 — Time Tracking Service.

Tracks active participation time and calculates SoI Trinity tokens:
  ♡ SI (Shared Intention) = floor(active_minutes) — 1 min default on login
  웃 HI (Human Intelligence) = min-wage rate per minute when enabled ($7.25/hr default)
                               0.0 when hi_enabled=False (pre-treasury)
  ◬ AI (Artificial Intelligence) = SI * ai_si_multiplier (default 5x)

HI vision: Pay out globally at local minimum wage to leverage global talent.
           Default rate = US federal min wage ($7.25/hr = $0.1208/min).
           Flip hi_enabled=True once treasury is funded.
"""

import math
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.time_tracking import TimeEntry
from app.models.token_ledger import TokenLedger


# ---------------------------------------------------------------------------
# Token Calculation
# ---------------------------------------------------------------------------


def _calculate_hi(duration_minutes: float) -> float:
    """Calculate 웃 HI tokens from duration.

    When hi_enabled=True: HI = duration_minutes * (hi_hourly_rate / 60)
    When hi_enabled=False: HI = 0.0 (pre-treasury, no payouts yet)

    Default rate: $7.25/hr (US federal / Texas minimum wage) = $0.1208/min.
    Goal: anchor HI to jurisdiction min wage so the system can leverage
    global talent by paying out HI at their local rate.
    """
    if not settings.hi_enabled:
        return 0.0
    rate_per_minute = settings.hi_hourly_rate / 60.0
    return round(duration_minutes * rate_per_minute, 4)


def calculate_tokens(
    duration_seconds: float,
    action_type: str,
) -> tuple[float, float, float]:
    """Calculate ♡ SI, 웃 HI, ◬ AI tokens from duration.

    Returns:
        (si_tokens, hi_tokens, ai_tokens)

    Rules:
        ♡ SI = floor(duration_minutes)         — 1 minute = 1 SI token
        웃 HI = duration_min * (wage/60)       — $7.25/hr when enabled, else 0
        ◬ AI = SI * ai_si_multiplier           — default 5x SI
    """
    duration_minutes = duration_seconds / 60.0
    si = math.floor(duration_minutes) if duration_minutes >= 1.0 else 0.0
    hi = _calculate_hi(duration_minutes)
    ai = si * settings.ai_si_multiplier  # 5x SI by default
    return float(si), hi, ai


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
) -> TimeEntry:
    """Stop tracking time, calculate duration and SoI Trinity tokens.

    Also creates a TokenLedger entry (append-only) for the earned tokens.
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

    si, hi, ai = calculate_tokens(entry.duration_seconds, entry.action_type)
    entry.si_tokens_earned = si
    entry.hi_tokens_earned = hi
    entry.ai_tokens_earned = ai

    # Create append-only token ledger entry if any tokens earned
    if si > 0 or hi > 0 or ai > 0:
        ledger = TokenLedger(
            session_id=entry.session_id,
            user_id=str(entry.participant_id),
            cube_id=entry.cube_id or "cube5",
            action_type=entry.action_type,
            delta_si=si,
            delta_hi=hi,
            delta_ai=ai,
            lifecycle_state="pending",
            reason=f"Time tracked: {entry.action_type} ({entry.duration_seconds:.0f}s)",
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
) -> TimeEntry:
    """Create a login time entry and immediately award default tokens.

    Called automatically when a participant joins a session.
    Awards:
      ♡ SI = login_si_tokens (default 1)
      웃 HI = 1 min at hourly rate when enabled, else 0
      ◬ AI = SI * ai_si_multiplier (default 5)
    """
    now = datetime.now(timezone.utc)
    login_si = settings.login_si_tokens
    login_hi = _calculate_hi(1.0)  # 1 minute of login time
    login_ai = login_si * settings.ai_si_multiplier

    entry = TimeEntry(
        session_id=session_id,
        participant_id=participant_id,
        action_type="login",
        cube_id="cube5",
        started_at=now,
        stopped_at=now,  # instant — login credit is immediate
        duration_seconds=60.0,  # 1 minute default
        si_tokens_earned=login_si,
        hi_tokens_earned=login_hi,
        ai_tokens_earned=login_ai,
    )
    db.add(entry)

    # Append-only token ledger entry for login credit
    ledger = TokenLedger(
        session_id=session_id,
        user_id=user_id or str(participant_id),
        cube_id="cube5",
        action_type="login",
        delta_si=login_si,
        delta_hi=login_hi,
        delta_ai=login_ai,
        lifecycle_state="pending",
        reason="Session join — login participation credit",
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
    total_si = sum(e.si_tokens_earned for e in entries)
    total_hi = sum(e.hi_tokens_earned for e in entries)
    total_ai = sum(e.ai_tokens_earned for e in entries)

    return {
        "participant_id": participant_id,
        "session_id": session_id,
        "total_active_seconds": total_seconds,
        "total_si_tokens": total_si,
        "total_hi_tokens": total_hi,
        "total_ai_tokens": total_ai,
        "entries": entries,
    }
