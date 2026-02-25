"""Cube 1 — Session Service: CRUD, state machine, QR generation, join flow.

Handles:
- Session creation with short_code + join_url + QR
- State machine transitions (draft → open → polling → ranking → closed → archived)
- Participant join flow (via short_code / QR)
- Question management within sessions
- Redis presence tracking for active participants
"""

import base64
import io
import uuid
from datetime import datetime, timedelta, timezone

import qrcode
import qrcode.constants
import redis.asyncio as aioredis
from fastapi import HTTPException, status
from nanoid import generate as nanoid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import CurrentUser
from app.core.exceptions import SessionExpiredError, SessionNotFoundError, SessionStateError
from app.cubes.cube5_gateway.service import create_login_time_entry
from app.core.security import anonymize_user_id
from app.models.participant import Participant
from app.models.question import Question
from app.models.session import SESSION_TRANSITIONS, Session


# Short code alphabet: URL-safe, no ambiguous chars (0/O, 1/l/I)
_SHORT_CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz"
_SHORT_CODE_LENGTH = 8


def _generate_short_code() -> str:
    """Generate a human-readable session short code (e.g., 'Ab3kQ7xR')."""
    return nanoid(_SHORT_CODE_ALPHABET, _SHORT_CODE_LENGTH)


_SHORT_CODE_MAX_RETRIES = 5


async def _generate_unique_short_code(db: AsyncSession) -> str:
    """Generate a short code with collision retry (up to 5 attempts)."""
    for attempt in range(_SHORT_CODE_MAX_RETRIES):
        code = _generate_short_code()
        result = await db.execute(
            select(Session.id).where(Session.short_code == code)
        )
        if result.scalar_one_or_none() is None:
            return code
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Failed to generate unique session code after multiple attempts",
    )


def generate_qr_png(data: str) -> bytes:
    """Generate QR code as PNG bytes."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_qr_base64(data: str) -> str:
    """Generate QR code as a base64-encoded data URI string."""
    png_bytes = generate_qr_png(data)
    b64 = base64.b64encode(png_bytes).decode("ascii")
    return f"data:image/png;base64,{b64}"


# ---------------------------------------------------------------------------
# Redis Presence Tracking
# ---------------------------------------------------------------------------


async def _set_presence(
    redis: aioredis.Redis,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
) -> None:
    """Record a participant as present in a session (Redis HSET + TTL)."""
    key = f"session:{session_id}:presence"
    await redis.hset(key, str(participant_id), datetime.now(timezone.utc).isoformat())
    await redis.expire(key, 3600)


async def _clear_presence(redis: aioredis.Redis, session_id: uuid.UUID) -> None:
    """Clear all presence data for a session (called on archive)."""
    key = f"session:{session_id}:presence"
    await redis.delete(key)


async def get_presence(redis: aioredis.Redis, session_id: uuid.UUID) -> dict:
    """Return presence data: {session_id, active_count, participants}."""
    key = f"session:{session_id}:presence"
    data = await redis.hgetall(key)
    participants = [
        {"participant_id": pid, "joined_at": ts}
        for pid, ts in data.items()
    ]
    return {
        "session_id": session_id,
        "active_count": len(participants),
        "participants": participants,
    }


# ---------------------------------------------------------------------------
# Session CRUD
# ---------------------------------------------------------------------------

async def create_session(
    db: AsyncSession,
    *,
    title: str,
    created_by: str,
    description: str | None = None,
    anonymity_mode: str = "identified",
    cycle_mode: str = "single",
    max_cycles: int = 1,
    ranking_mode: str = "auto",
    language: str = "en",
    max_response_length: int = 3333,
    ai_provider: str = "openai",
    seed: str | None = None,
    # New Cube 1 fields
    session_type: str = "polling",
    polling_mode: str = "single_round",
    pricing_tier: str = "free",
    max_participants: int | None = None,
    fee_amount_cents: int = 0,
    cost_splitting_enabled: bool = False,
    reward_enabled: bool = False,
    reward_amount_cents: int = 0,
    cqs_weights: dict | None = None,
    theme2_voting_level: str = "theme2_9",
    live_feed_enabled: bool = False,
    # Static poll countdown
    polling_mode_type: str = "live_interactive",
    static_poll_duration_days: int | None = None,
    timer_display_mode: str = "flex",
) -> Session:
    """Create a new session with short_code, join_url, and QR.

    If a seed is provided, generates a deterministic UUID5 session ID.
    Re-creating with the same seed+title returns the existing session (idempotent).
    """
    effective_seed = seed or settings.session_seed

    # Deterministic ID when seed is provided
    session_id: uuid.UUID | None = None
    if effective_seed:
        session_id = uuid.uuid5(uuid.NAMESPACE_URL, f"exel:{effective_seed}:{title}")
        # Idempotent: return existing session if same seed+title already exists
        result = await db.execute(select(Session).where(Session.id == session_id))
        existing = result.scalar_one_or_none()
        if existing:
            return existing

    short_code = await _generate_unique_short_code(db)
    join_url = f"{settings.frontend_url}/join/{short_code}"
    qr_url = join_url  # QR encodes the join URL
    expires_at = datetime.now(timezone.utc) + timedelta(
        hours=settings.default_session_expiry_hours
    )

    kwargs: dict = dict(
        short_code=short_code,
        created_by=created_by,
        title=title,
        description=description,
        anonymity_mode=anonymity_mode,
        cycle_mode=cycle_mode,
        max_cycles=max_cycles,
        ranking_mode=ranking_mode,
        language=language,
        max_response_length=max_response_length,
        ai_provider=ai_provider,
        join_url=join_url,
        qr_url=qr_url,
        expires_at=expires_at,
        status="draft",
        seed=effective_seed,
        # New Cube 1 fields
        session_type=session_type,
        polling_mode=polling_mode,
        pricing_tier=pricing_tier,
        max_participants=max_participants,
        fee_amount_cents=fee_amount_cents,
        cost_splitting_enabled=cost_splitting_enabled,
        reward_enabled=reward_enabled,
        reward_amount_cents=reward_amount_cents,
        cqs_weights=cqs_weights,
        theme2_voting_level=theme2_voting_level,
        live_feed_enabled=live_feed_enabled,
        polling_mode_type=polling_mode_type,
        static_poll_duration_days=static_poll_duration_days,
        timer_display_mode=timer_display_mode,
    )
    if session_id:
        kwargs["id"] = session_id

    session = Session(**kwargs)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session_by_id(db: AsyncSession, session_id: uuid.UUID) -> Session:
    """Fetch session by UUID. Raises SessionNotFoundError if missing."""
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise SessionNotFoundError(str(session_id))
    return session


async def get_session_by_short_code(db: AsyncSession, short_code: str) -> Session:
    """Fetch session by short_code. Raises SessionNotFoundError if missing."""
    result = await db.execute(select(Session).where(Session.short_code == short_code))
    session = result.scalar_one_or_none()
    if session is None:
        raise SessionNotFoundError(short_code)
    return session


async def update_session(
    db: AsyncSession,
    session: Session,
    **updates: object,
) -> Session:
    """Update mutable session fields. Only allowed in draft state."""
    if session.status != "draft":
        raise SessionStateError(session.status, "update config")

    allowed = {"title", "description", "anonymity_mode", "ranking_mode", "max_response_length", "ai_provider"}
    for key, value in updates.items():
        if key in allowed and value is not None:
            setattr(session, key, value)
    await db.commit()
    await db.refresh(session)
    return session


async def get_participant_count(db: AsyncSession, session_id: uuid.UUID) -> int:
    """Count active participants in a session."""
    result = await db.execute(
        select(func.count(Participant.id)).where(
            Participant.session_id == session_id,
            Participant.is_active.is_(True),
        )
    )
    return result.scalar_one()


async def list_sessions(
    db: AsyncSession,
    *,
    created_by: str | None = None,
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Session], int]:
    """List sessions with optional filters. Returns (sessions, total_count)."""
    query = select(Session)
    count_query = select(func.count(Session.id))

    if created_by:
        query = query.where(Session.created_by == created_by)
        count_query = count_query.where(Session.created_by == created_by)
    if status_filter:
        query = query.where(Session.status == status_filter)
        count_query = count_query.where(Session.status == status_filter)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Get paginated results
    query = query.order_by(Session.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    sessions = list(result.scalars().all())

    return sessions, total


# ---------------------------------------------------------------------------
# State Machine
# ---------------------------------------------------------------------------

async def transition_session(
    db: AsyncSession,
    session: Session,
    new_status: str,
    redis: aioredis.Redis | None = None,
) -> Session:
    """Transition session to a new state. Validates against allowed transitions."""
    if not session.can_transition_to(new_status):
        allowed = SESSION_TRANSITIONS.get(session.status, ())
        raise SessionStateError(
            session.status,
            f"transition to '{new_status}' (allowed: {allowed})",
        )

    now = datetime.now(timezone.utc)

    if new_status == "open" and session.opened_at is None:
        session.opened_at = now
    elif new_status == "polling":
        # Compute ends_at for static polls when transitioning to polling
        if session.polling_mode_type == "static_poll" and session.static_poll_duration_days:
            session.ends_at = now + timedelta(days=session.static_poll_duration_days)
    elif new_status == "closed":
        session.closed_at = now

    # Clear presence data on archive
    if new_status == "archived" and redis:
        await _clear_presence(redis, session.id)

    session.status = new_status
    await db.commit()
    await db.refresh(session)
    return session


# ---------------------------------------------------------------------------
# Participant Join
# ---------------------------------------------------------------------------

async def check_capacity(db: AsyncSession, session: Session) -> None:
    """Enforce max_participants limit. Raises 409 if session is full."""
    if session.max_participants is None:
        return
    count = await get_participant_count(db, session.id)
    if count >= session.max_participants:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Session is full ({session.max_participants} participants max)",
        )


async def join_session(
    db: AsyncSession,
    *,
    short_code: str,
    user_id: str | None = None,
    display_name: str | None = None,
    device_type: str | None = None,
    language_code: str = "en",
    results_opt_in: bool = False,
    redis: aioredis.Redis | None = None,
) -> tuple[Session, Participant]:
    """Join a session via short_code. Returns (session, participant).

    - Session must be in 'open' or 'polling' state.
    - Duplicate joins (same user_id + session) return existing participant.
    - Anonymous sessions generate an anon_hash from user_id + session salt.
    """
    session = await get_session_by_short_code(db, short_code)

    if session.is_expired:
        raise SessionExpiredError(short_code)

    if session.status not in ("open", "polling"):
        raise SessionStateError(session.status, "join")

    # Check capacity before allowing new joins
    await check_capacity(db, session)

    # Check for existing participant (rejoin)
    if user_id:
        result = await db.execute(
            select(Participant).where(
                Participant.session_id == session.id,
                Participant.user_id == user_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.is_active = True
            existing.last_seen = datetime.now(timezone.utc)
            await db.commit()
            await db.refresh(existing)
            return session, existing

    # Build anon hash if anonymity mode enabled
    anon_hash = None
    if session.anonymity_mode == "anonymous" and user_id:
        anon_hash = anonymize_user_id(user_id, str(session.id))

    participant = Participant(
        session_id=session.id,
        user_id=user_id,
        anon_hash=anon_hash,
        display_name=display_name or f"Participant-{nanoid(_SHORT_CODE_ALPHABET, 4)}",
        device_type=device_type,
        language_code=language_code,
        results_opt_in=results_opt_in,
        joined_at=datetime.now(timezone.utc),
        is_active=True,
    )
    db.add(participant)
    await db.commit()
    await db.refresh(participant)

    # Auto-create login time entry → awards default ♡ + ◬ tokens
    await create_login_time_entry(
        db,
        session_id=session.id,
        participant_id=participant.id,
        user_id=user_id,
    )

    # Record presence in Redis
    if redis:
        await _set_presence(redis, session.id, participant.id)

    return session, participant


async def list_participants(
    db: AsyncSession,
    session_id: uuid.UUID,
    active_only: bool = True,
) -> list[Participant]:
    """List participants for a session."""
    stmt = select(Participant).where(Participant.session_id == session_id)
    if active_only:
        stmt = stmt.where(Participant.is_active.is_(True))
    result = await db.execute(stmt.order_by(Participant.joined_at))
    return list(result.scalars().all())


# ---------------------------------------------------------------------------
# Ownership + QR Validation
# ---------------------------------------------------------------------------


def verify_session_owner(session: Session, user: CurrentUser) -> None:
    """Verify the user owns the session. Admins bypass the check."""
    if user.role == "admin":
        return
    if session.created_by != user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this session",
        )


def validate_qr_accessible(session: Session) -> None:
    """Block QR code access for expired, closed, or archived sessions."""
    if session.is_expired:
        raise SessionExpiredError(str(session.id))
    if session.status in ("closed", "archived"):
        raise SessionStateError(session.status, "generate QR code")


# ---------------------------------------------------------------------------
# Question Management
# ---------------------------------------------------------------------------

async def add_question(
    db: AsyncSession,
    session: Session,
    *,
    question_text: str,
    order_index: int = 0,
) -> Question:
    """Add a question to a session. Only in draft or open state."""
    if session.status not in ("draft", "open"):
        raise SessionStateError(session.status, "add question")

    question = Question(
        session_id=session.id,
        cycle_id=session.current_cycle,
        question_text=question_text,
        order_index=order_index,
        status="draft",
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def list_questions(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> list[Question]:
    """List questions for a session, ordered by order_index."""
    result = await db.execute(
        select(Question)
        .where(Question.session_id == session_id)
        .order_by(Question.order_index)
    )
    return list(result.scalars().all())


async def get_question(
    db: AsyncSession,
    question_id: uuid.UUID,
) -> Question:
    """Get a single question by ID."""
    result = await db.execute(select(Question).where(Question.id == question_id))
    question = result.scalar_one_or_none()
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")
    return question
