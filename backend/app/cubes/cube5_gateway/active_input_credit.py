"""Persist CRS-19.09 active-input credits onto TimeEntry + append-only TokenLedger."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.cubes.cube5_gateway.active_input import (
    ACTION_TYPE,
    RULE_VERSION,
    ActiveInputDecision,
    decide_active_input_credit,
)
from app.core.hi_rates import settlement_stamp
from app.models.participant import Participant
from app.models.time_tracking import TimeEntry
from app.models.token_ledger import TokenLedger

logger = structlog.get_logger(__name__)


async def wall_ms_for_participant(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    input_opened_at: datetime | None,
    now: datetime | None = None,
) -> int:
    """Wall clock from join (or input_opened_at if later) to now, in ms."""
    now = now or datetime.now(timezone.utc)
    participant = (
        await db.execute(
            select(Participant).where(
                Participant.id == participant_id,
                Participant.session_id == session_id,
            )
        )
    ).scalar_one_or_none()
    start = participant.joined_at if participant is not None else None
    if input_opened_at is not None:
        if input_opened_at.tzinfo is None:
            input_opened_at = input_opened_at.replace(tzinfo=timezone.utc)
        start = input_opened_at if start is None else max(start, input_opened_at)
    if start is None:
        return 0
    if start.tzinfo is None:
        start = start.replace(tzinfo=timezone.utc)
    return max(0, int((now - start).total_seconds() * 1000))


async def already_credited(db: AsyncSession, response_id: uuid.UUID) -> bool:
    row = (
        await db.execute(
            select(TokenLedger.id).where(
                TokenLedger.action_type == ACTION_TYPE,
                TokenLedger.reference_id == str(response_id),
            ).limit(1)
        )
    ).scalar_one_or_none()
    return row is not None


async def credit_active_input(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    response_id: uuid.UUID,
    text: str,
    claimed_ms: int | None,
    paste_detected: bool = False,
    voice_ms: int = 0,
    input_opened_at: datetime | None = None,
    cube_id: str = "cube2",
    anon_hash: str | None = None,
    country: str | None = None,
    state: str | None = None,
) -> ActiveInputDecision:
    """Validate + mint one append-only credit for this response. Idempotent on response_id."""
    if await already_credited(db, response_id):
        logger.info(
            "cube5.active_input.duplicate_skipped",
            response_id=str(response_id),
            session_id=str(session_id),
        )
        return ActiveInputDecision(
            credited_ms=0,
            heart=0.0,
            unity=0.0,
            human=0.0,
            reason=f"{ACTION_TYPE} duplicate response_id={response_id}",
        )

    wall = await wall_ms_for_participant(
        db,
        session_id=session_id,
        participant_id=participant_id,
        input_opened_at=input_opened_at,
    )
    decision = decide_active_input_credit(
        claimed_ms=claimed_ms,
        wall_ms=wall,
        text=text,
        paste_detected=paste_detected,
        voice_ms=voice_ms,
    )

    now = datetime.now(timezone.utc)
    duration_s = decision.credited_ms / 1000.0
    started = now if decision.credited_ms <= 0 else datetime.fromtimestamp(
        now.timestamp() - duration_s, tz=timezone.utc
    )

    entry = TimeEntry(
        session_id=session_id,
        participant_id=participant_id,
        action_type=ACTION_TYPE,
        cube_id=cube_id,
        reference_id=str(response_id),
        started_at=started,
        stopped_at=now,
        duration_seconds=duration_s,
        heart_tokens_earned=decision.heart,
        human_tokens_earned=decision.human,
        unity_tokens_earned=decision.unity,
        active_ms=decision.credited_ms,
        paste_detected=bool(paste_detected),
        rule_version=RULE_VERSION,
    )
    db.add(entry)

    if decision.heart > 0 or decision.human > 0 or decision.unity > 0:
        jurisdiction, settlement_rate = settlement_stamp(country, state)
        ledger = TokenLedger(
            session_id=session_id,
            user_id=str(participant_id),
            anon_hash=anon_hash,
            cube_id=cube_id,
            action_type=ACTION_TYPE,
            delta_heart=decision.heart,
            delta_human=decision.human,
            delta_unity=decision.unity,
            settlement_jurisdiction=jurisdiction,
            settlement_rate=settlement_rate,
            lifecycle_state="pending",
            reason=decision.reason,
            reference_id=str(response_id),
            version_id=RULE_VERSION,
            active_ms=decision.credited_ms,
        )
        db.add(ledger)

    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        logger.info(
            "cube5.active_input.integrity_duplicate",
            response_id=str(response_id),
        )
        return ActiveInputDecision(
            credited_ms=0,
            heart=0.0,
            unity=0.0,
            human=0.0,
            reason=f"{ACTION_TYPE} duplicate response_id={response_id}",
        )

    logger.info(
        "cube5.active_input.credited",
        response_id=str(response_id),
        active_ms=decision.credited_ms,
        heart=decision.heart,
        unity=decision.unity,
        paste=paste_detected,
        rule=RULE_VERSION,
    )
    return decision
