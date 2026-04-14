"""Cube 1 — Session Service: CRUD, state machine, QR generation, join flow.

Handles:
- Session creation with short_code + join_url + QR
- State machine transitions (draft → open → polling → ranking → closed → archived)
- Participant join flow (via short_code / QR)
- Question management within sessions
- In-memory presence tracking for active participants
- Audit logging on all state transitions (CRS-01)
- Replay hash computation for determinism verification (CRS-03)
"""

import base64
import hashlib
import io
import logging
import uuid
from datetime import datetime, timedelta, timezone

import qrcode
import qrcode.constants
from fastapi import HTTPException, status
from nanoid import generate as nanoid
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.auth import CurrentUser
from app.core.exceptions import (
    PaymentRequiredError,
    SessionExpiredError,
    SessionNotFoundError,
    SessionStateError,
)
from app.core.security import anonymize_user_id
from app.models.audit_log import AuditLog
from app.models.participant import Participant
from app.models.question import Question
from app.models.session import SESSION_TRANSITIONS, Session

logger = logging.getLogger(__name__)


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
# Presence Tracking (in-memory via app.core.presence)
# ---------------------------------------------------------------------------


async def _set_presence(
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    **kwargs,
) -> None:
    """Record a participant as present via in-memory presence module."""
    from app.core.presence import set_presence
    await set_presence(session_id, participant_id)


async def _clear_presence(session_id: uuid.UUID, **kwargs) -> None:
    """Clear all presence data for a session (called on archive)."""
    from app.core.presence import clear_presence
    await clear_presence(session_id)


async def get_presence(session_id: uuid.UUID, **kwargs) -> dict:
    """Return presence data: {session_id, active_count, participants}."""
    from app.core.presence import get_presence as _get
    return await _get(session_id)


# ---------------------------------------------------------------------------
# Audit Logging (G5 fix — CRS-01)
# ---------------------------------------------------------------------------


async def _log_audit(
    db: AsyncSession,
    *,
    session_id: uuid.UUID,
    actor_id: str,
    actor_role: str,
    action_type: str,
    before_state: dict | None = None,
    after_state: dict | None = None,
) -> None:
    """Write an audit log entry for session actions."""
    entry = AuditLog(
        session_id=session_id,
        actor_id=actor_id,
        actor_role=actor_role,
        action_type=action_type,
        object_type="session",
        object_id=str(session_id),
        before_state=before_state,
        after_state=after_state,
    )
    db.add(entry)


# ---------------------------------------------------------------------------
# Replay Hash (G3 fix — CRS-03 determinism)
# ---------------------------------------------------------------------------


async def _compute_replay_hash(db: AsyncSession, session: Session) -> str:
    """Compute SHA-256 replay hash from session seed + all response IDs.

    Hash = sha256(seed | ai_provider | sorted(response_ids))
    Uses ResponseMeta.id (UUID) as deterministic response identifiers.
    """
    from app.models.response_meta import ResponseMeta

    result = await db.execute(
        select(ResponseMeta.id)
        .where(ResponseMeta.session_id == session.id)
        .order_by(ResponseMeta.id)
    )
    response_ids = [str(rid) for rid in result.scalars().all()]

    payload = "|".join([
        session.seed or "",
        session.ai_provider or "openai",
        ",".join(response_ids),
    ])
    return hashlib.sha256(payload.encode()).hexdigest()


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
    join_url = f"{settings.frontend_url}/join/?code={short_code}"
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

    allowed = {
        "title", "description", "anonymity_mode", "ranking_mode",
        "max_response_length", "ai_provider", "session_type", "polling_mode",
        "pricing_tier", "max_participants", "fee_amount_cents",
        "cost_splitting_enabled", "reward_enabled", "reward_amount_cents",
        "cqs_weights", "theme2_voting_level", "live_feed_enabled",
        "polling_mode_type", "static_poll_duration_days", "timer_display_mode",
        "stt_provider", "realtime_stt_enabled", "realtime_stt_provider",
        "allow_user_stt_choice", "theme_id", "custom_accent_color",
    }
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


async def get_participant_counts_batch(
    db: AsyncSession, session_ids: list[uuid.UUID]
) -> dict[uuid.UUID, int]:
    """Batch-fetch active participant counts for multiple sessions (single query).

    Returns a dict mapping session_id → count.  Sessions with zero participants
    are included with count 0.
    """
    if not session_ids:
        return {}
    result = await db.execute(
        select(
            Participant.session_id,
            func.count(Participant.id).label("count"),
        )
        .where(
            Participant.session_id.in_(session_ids),
            Participant.is_active.is_(True),
        )
        .group_by(Participant.session_id)
    )
    counts = {row.session_id: row.count for row in result}
    # Ensure every requested session_id is present (default 0)
    return {sid: counts.get(sid, 0) for sid in session_ids}


async def list_sessions(
    db: AsyncSession,
    *,
    created_by: str | None = None,
    status_filter: str | None = None,
    include_archived: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Session], int]:
    """List sessions with optional filters. Returns (sessions, total_count).

    By default, archived sessions are excluded (kept in a separate "bucket").
    Pass ``include_archived=True`` or ``status_filter="archived"`` to retrieve them.
    """
    query = select(Session)
    count_query = select(func.count(Session.id))

    if created_by:
        query = query.where(Session.created_by == created_by)
        count_query = count_query.where(Session.created_by == created_by)
    if status_filter:
        query = query.where(Session.status == status_filter)
        count_query = count_query.where(Session.status == status_filter)
    elif not include_archived:
        # Default: exclude archived sessions so recent results stay at hand
        query = query.where(Session.status != "archived")
        count_query = count_query.where(Session.status != "archived")

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
    actor_id: str | None = None,
    **kwargs,
) -> Session:
    """Transition session to a new state. Validates against allowed transitions.

    Writes audit log entry on every transition (G5 fix).
    Computes replay_hash on close for determinism verification (G3 fix).
    """
    if not session.can_transition_to(new_status):
        allowed = SESSION_TRANSITIONS.get(session.status, ())
        raise SessionStateError(
            session.status,
            f"transition to '{new_status}' (allowed: {allowed})",
        )

    old_status = session.status
    now = datetime.now(timezone.utc)

    if new_status == "open" and session.opened_at is None:
        session.opened_at = now
    elif new_status == "polling":
        # Compute ends_at for static polls when transitioning to polling
        if session.polling_mode_type == "static_poll" and session.static_poll_duration_days:
            session.ends_at = now + timedelta(days=session.static_poll_duration_days)
    elif new_status == "closed":
        session.closed_at = now
        # G3 fix: compute replay hash for determinism verification
        try:
            session.replay_hash = await _compute_replay_hash(db, session)
        except Exception as exc:
            logger.warning(
                "cube1.replay_hash.failed",
                extra={"session_id": str(session.id), "error": str(exc)},
            )

    # Clear presence data on archive
    if new_status == "archived":
        await _clear_presence(session.id)

    session.status = new_status

    # G5 fix: audit log on every state transition
    await _log_audit(
        db,
        session_id=session.id,
        actor_id=actor_id or session.created_by,
        actor_role="moderator",
        action_type=f"session.transition.{old_status}_to_{new_status}",
        before_state={"status": old_status},
        after_state={"status": new_status},
    )

    await db.commit()
    await db.refresh(session)
    return session


# ---------------------------------------------------------------------------
# Participant Join
# ---------------------------------------------------------------------------

async def check_capacity(db: AsyncSession, session: Session) -> None:
    """Enforce max_participants limit. Raises 409 if session is full.

    Free tier: hard cap at 19 even if max_participants not explicitly set.
    """
    max_allowed = session.max_participants

    # Free tier: enforce 19-user cap even if not set on session
    if session.pricing_tier == "free" and max_allowed is None:
        from app.config import settings
        max_allowed = settings.free_tier_max_participants  # 19

    if max_allowed is None:
        return
    count = await get_participant_count(db, session.id)
    if count >= max_allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Session is full ({max_allowed} participants max)",
        )


async def _check_payment(session: Session, results_opt_in: bool) -> None:
    """G2 fix: enforce payment for paid sessions (CRS-01 monetization).

    - free tier: always allowed
    - moderator_paid: moderator pays, participants join free
    - cost_split: participants must opt in + pay to see results
    """
    if session.pricing_tier == "free":
        return
    if session.pricing_tier == "moderator_paid":
        # Moderator pays — participants always join free
        if not session.is_paid:
            raise PaymentRequiredError("Session fee has not been paid by moderator")
        return
    if session.pricing_tier == "cost_split" and results_opt_in:
        # Cost-split sessions: results_opt_in triggers payment requirement
        # Actual payment is handled by Cube 8 / Stripe webhook;
        # here we just validate the session has a fee configured
        if session.fee_amount_cents <= 0:
            return  # No fee configured — allow
        # Payment check deferred to Cube 8 post-join flow
        return


async def join_session(
    db: AsyncSession,
    *,
    short_code: str,
    user_id: str | None = None,
    display_name: str | None = None,
    device_type: str | None = None,
    language_code: str = "en",
    results_opt_in: bool = False,
    **kwargs,
) -> tuple[Session, Participant]:
    """Join a session via short_code. Returns (session, participant).

    - Session must be in 'open' or 'polling' state.
    - Duplicate joins (same user_id + session) return existing participant.
    - Anonymous sessions generate an anon_hash from user_id + session salt (CRS-05).
    - Payment enforcement for paid sessions (G2 fix).
    - Cube 5 time entry is fire-and-forget — join never fails on token error (G1 fix).
    """
    session = await get_session_by_short_code(db, short_code)

    if session.is_expired:
        raise SessionExpiredError(short_code)

    if session.status not in ("open", "polling"):
        raise SessionStateError(session.status, "join")

    # G2 fix: enforce payment rules before allowing join
    await _check_payment(session, results_opt_in)

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

    # CRS-05: build anon hash if anonymity mode enabled
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

    # G1 fix: Cube 5 login time entry is fire-and-forget — join never fails on token error
    try:
        from app.cubes.cube5_gateway.service import create_login_time_entry

        await create_login_time_entry(
            db,
            session_id=session.id,
            participant_id=participant.id,
            user_id=user_id,
        )
    except Exception as exc:
        logger.warning(
            "cube1.login_time_entry.failed",
            extra={
                "session_id": str(session.id),
                "participant_id": str(participant.id),
                "error": str(exc),
            },
        )

    # Record presence in memory
    await _set_presence(session.id, participant.id)

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
