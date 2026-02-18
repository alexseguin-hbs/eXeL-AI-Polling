"""Cube 5 — Time Tracking Service.

Tracks active participation time and calculates SoI Trinity tokens:
  ♡ = floor(active_minutes) — 1 min default on login
  웃 = jurisdiction min-wage rate per minute when enabled
      0.0 when person_enabled=False (pre-treasury)
  ◬ = ♡ * triangle_heart_multiplier (default 5x)

웃 vision: Pay out globally at local minimum wage to leverage global talent.
          Rate resolved per participant from rate table.
          Default: Austin, Texas = $7.25/hr.
          Flip person_enabled=True once treasury is funded.
"""

import math
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.hi_rates import resolve_person_rate
from app.models.time_tracking import TimeEntry
from app.models.token_ledger import TokenLedger


# ---------------------------------------------------------------------------
# Token Calculation
# ---------------------------------------------------------------------------


def _calculate_person(
    duration_minutes: float,
    country: str | None = None,
    state: str | None = None,
) -> float:
    """Calculate 웃 tokens from duration using jurisdiction rate.

    When person_enabled=True: 웃 = duration_minutes * (rate / 60)
    When person_enabled=False: 웃 = 0.0 (pre-treasury, no payouts yet)

    Rate resolved from rate table by country + state.
    Default: $7.25/hr (Austin, Texas / US federal).
    """
    if not settings.person_enabled:
        return 0.0
    rate = resolve_person_rate(country, state)
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
        ♡ = floor(duration_minutes)          — 1 minute = 1 ♡
        웃 = duration_min * (wage/60)        — jurisdiction rate when enabled
        ◬ = ♡ * triangle_heart_multiplier   — default 5x ♡
    """
    duration_minutes = duration_seconds / 60.0
    heart = math.floor(duration_minutes) if duration_minutes >= 1.0 else 0.0
    person = _calculate_person(duration_minutes, country, state)
    triangle = heart * settings.triangle_heart_multiplier
    return float(heart), person, triangle


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

    heart, person, triangle = calculate_tokens(
        entry.duration_seconds, entry.action_type, country, state
    )
    entry.heart_tokens_earned = heart
    entry.person_tokens_earned = person
    entry.triangle_tokens_earned = triangle

    # Create append-only token ledger entry if any tokens earned
    if heart > 0 or person > 0 or triangle > 0:
        ledger = TokenLedger(
            session_id=entry.session_id,
            user_id=str(entry.participant_id),
            cube_id=entry.cube_id or "cube5",
            action_type=entry.action_type,
            delta_heart=heart,
            delta_person=person,
            delta_triangle=triangle,
            lifecycle_state="pending",
            reason=f"{entry.action_type} ({entry.duration_seconds:.0f}s) — ♡{heart} 웃{person} ◬{triangle}",
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
      ◬ = ♡ * triangle_heart_multiplier (default 5)
    """
    now = datetime.now(timezone.utc)
    login_heart = settings.login_heart_tokens
    login_person = _calculate_person(1.0, country, state)
    login_triangle = login_heart * settings.triangle_heart_multiplier

    entry = TimeEntry(
        session_id=session_id,
        participant_id=participant_id,
        action_type="login",
        cube_id="cube5",
        started_at=now,
        stopped_at=now,  # instant — login credit is immediate
        duration_seconds=60.0,  # 1 minute default
        heart_tokens_earned=login_heart,
        person_tokens_earned=login_person,
        triangle_tokens_earned=login_triangle,
    )
    db.add(entry)

    # Append-only token ledger entry for login credit
    ledger = TokenLedger(
        session_id=session_id,
        user_id=user_id or str(participant_id),
        cube_id="cube5",
        action_type="login",
        delta_heart=login_heart,
        delta_person=login_person,
        delta_triangle=login_triangle,
        lifecycle_state="pending",
        reason=f"Login — ♡{login_heart} 웃{login_person} ◬{login_triangle}",
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
    total_person = sum(e.person_tokens_earned for e in entries)
    total_triangle = sum(e.triangle_tokens_earned for e in entries)

    return {
        "participant_id": participant_id,
        "session_id": session_id,
        "total_active_seconds": total_seconds,
        "total_heart_tokens": total_heart,
        "total_person_tokens": total_person,
        "total_triangle_tokens": total_triangle,
        "entries": entries,
    }
