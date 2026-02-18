"""Cube 1 — Session Join & QR: Full API endpoints.

Endpoints:
    GET    /sessions                — List moderator's sessions (paginated)
    POST   /sessions               — Create session (Moderator)
    GET    /sessions/{id}           — Get session by ID
    GET    /sessions/code/{code}    — Get session by short_code
    PATCH  /sessions/{id}           — Update session config (draft only)
    POST   /sessions/{id}/open      — Transition: draft → open
    POST   /sessions/{id}/poll      — Transition: open → polling
    POST   /sessions/{id}/rank      — Transition: polling → ranking
    POST   /sessions/{id}/close     — Close session
    POST   /sessions/{id}/archive   — Archive closed session
    POST   /sessions/join/{code}    — Participant joins via short_code
    GET    /sessions/{id}/participants — List participants
    POST   /sessions/{id}/questions — Add question
    GET    /sessions/{id}/questions — List questions
    GET    /sessions/{id}/qr        — Download QR code PNG
    GET    /sessions/{id}/qr-json   — QR code as base64 JSON
    GET    /sessions/{id}/presence  — Live participant count from Redis
    GET    /sessions/{id}/verify-determinism — Replay hash verification
"""

import uuid

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user, get_optional_current_user
from app.core.dependencies import get_db, get_redis
from app.core.permissions import require_role
from app.core.rate_limit import limiter
from app.cubes.cube1_session import service
from app.schemas.participant import ParticipantRead
from app.schemas.question import QuestionCreate, QuestionRead
from app.schemas.session import (
    QrJsonResponse,
    SessionCreate,
    SessionJoinRequest,
    SessionJoinResponse,
    SessionPresence,
    SessionRead,
    SessionUpdate,
)

router = APIRouter(prefix="/sessions", tags=["Cube 1 — Sessions"])


def _session_to_read(session, participant_count: int = 0) -> dict:
    """Convert Session ORM to dict with participant_count."""
    return {
        **{c.key: getattr(session, c.key) for c in session.__table__.columns},
        "participant_count": participant_count,
    }


# ---------------------------------------------------------------------------
# Session CRUD
# ---------------------------------------------------------------------------


@router.get("", response_model=dict)
async def list_sessions(
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """List sessions created by the current moderator (paginated)."""
    sessions, total = await service.list_sessions(
        db,
        created_by=user.user_id,
        status_filter=status,
        limit=min(limit, 100),
        offset=offset,
    )
    items = []
    for s in sessions:
        count = await service.get_participant_count(db, s.id)
        items.append(SessionRead(**_session_to_read(s, count)))
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.post("", response_model=SessionRead, status_code=201)
async def create_session(
    payload: SessionCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-01: Moderator creates a new polling session."""
    session = await service.create_session(
        db,
        title=payload.title,
        created_by=user.user_id,
        description=payload.description,
        anonymity_mode=payload.anonymity_mode,
        cycle_mode=payload.cycle_mode,
        max_cycles=payload.max_cycles,
        ranking_mode=payload.ranking_mode,
        language=payload.language,
        max_response_length=payload.max_response_length,
        ai_provider=payload.ai_provider,
        seed=payload.seed,
    )
    count = await service.get_participant_count(db, session.id)
    return SessionRead(**_session_to_read(session, count))


@router.get("/{session_id}", response_model=SessionRead)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get session details by UUID."""
    session = await service.get_session_by_id(db, session_id)
    count = await service.get_participant_count(db, session.id)
    return SessionRead(**_session_to_read(session, count))


@router.get("/code/{short_code}", response_model=SessionRead)
async def get_session_by_code(
    short_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get session details by short_code (used by join page)."""
    session = await service.get_session_by_short_code(db, short_code)
    count = await service.get_participant_count(db, session.id)
    return SessionRead(**_session_to_read(session, count))


@router.patch("/{session_id}", response_model=SessionRead)
async def update_session(
    session_id: uuid.UUID,
    payload: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Update session configuration (draft state only)."""
    session = await service.get_session_by_id(db, session_id)
    service.verify_session_owner(session, user)
    updated = await service.update_session(
        db,
        session,
        **payload.model_dump(exclude_unset=True),
    )
    count = await service.get_participant_count(db, updated.id)
    return SessionRead(**_session_to_read(updated, count))


# ---------------------------------------------------------------------------
# State Transitions
# ---------------------------------------------------------------------------


@router.post("/{session_id}/open", response_model=SessionRead)
async def open_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-06: Moderator opens session for participants to join."""
    session = await service.get_session_by_id(db, session_id)
    service.verify_session_owner(session, user)
    updated = await service.transition_session(db, session, "open")
    count = await service.get_participant_count(db, updated.id)
    return SessionRead(**_session_to_read(updated, count))


@router.post("/{session_id}/poll", response_model=SessionRead)
async def start_polling(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Moderator starts polling phase (participants can submit responses)."""
    session = await service.get_session_by_id(db, session_id)
    service.verify_session_owner(session, user)
    updated = await service.transition_session(db, session, "polling")
    count = await service.get_participant_count(db, updated.id)
    return SessionRead(**_session_to_read(updated, count))


@router.post("/{session_id}/rank", response_model=SessionRead)
async def start_ranking(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Moderator starts ranking phase (after AI theming completes)."""
    session = await service.get_session_by_id(db, session_id)
    service.verify_session_owner(session, user)
    updated = await service.transition_session(db, session, "ranking")
    count = await service.get_participant_count(db, updated.id)
    return SessionRead(**_session_to_read(updated, count))


@router.post("/{session_id}/close", response_model=SessionRead)
async def close_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-06: Moderator closes the session."""
    session = await service.get_session_by_id(db, session_id)
    service.verify_session_owner(session, user)
    updated = await service.transition_session(db, session, "closed")
    count = await service.get_participant_count(db, updated.id)
    return SessionRead(**_session_to_read(updated, count))


@router.post("/{session_id}/archive", response_model=SessionRead)
async def archive_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
    redis: aioredis.Redis = Depends(get_redis),
):
    """Archive a closed session. Clears Redis presence data."""
    session = await service.get_session_by_id(db, session_id)
    service.verify_session_owner(session, user)
    updated = await service.transition_session(db, session, "archived", redis=redis)
    count = await service.get_participant_count(db, updated.id)
    return SessionRead(**_session_to_read(updated, count))


# ---------------------------------------------------------------------------
# Participant Join (rate-limited)
# ---------------------------------------------------------------------------


@router.post("/join/{short_code}", response_model=SessionJoinResponse, status_code=201)
@limiter.limit("100/minute")
async def join_session(
    request: Request,
    short_code: str,
    payload: SessionJoinRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
    redis: aioredis.Redis = Depends(get_redis),
):
    """CRS-03: Participant joins session via short_code or QR link."""
    session, participant = await service.join_session(
        db,
        short_code=short_code,
        user_id=user.user_id if user else None,
        display_name=payload.display_name,
        device_type=payload.device_type,
        redis=redis,
    )
    return SessionJoinResponse(
        session_id=session.id,
        participant_id=participant.id,
        short_code=session.short_code,
        title=session.title,
        status=session.status,
        display_name=participant.display_name,
    )


@router.get("/{session_id}/participants", response_model=list[ParticipantRead])
async def list_participants(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "lead_developer", "admin")),
):
    """List active participants in a session."""
    participants = await service.list_participants(db, session_id)
    return [ParticipantRead.model_validate(p) for p in participants]


# ---------------------------------------------------------------------------
# Presence (Redis)
# ---------------------------------------------------------------------------


@router.get("/{session_id}/presence", response_model=SessionPresence)
async def get_presence(
    session_id: uuid.UUID,
    redis: aioredis.Redis = Depends(get_redis),
):
    """Live participant count from Redis presence tracking."""
    data = await service.get_presence(redis, session_id)
    return SessionPresence(**data)


# ---------------------------------------------------------------------------
# Questions
# ---------------------------------------------------------------------------


@router.post("/{session_id}/questions", response_model=QuestionRead, status_code=201)
async def create_question(
    session_id: uuid.UUID,
    payload: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Add a question to a session."""
    session = await service.get_session_by_id(db, session_id)
    service.verify_session_owner(session, user)
    question = await service.add_question(
        db,
        session,
        question_text=payload.question_text,
        order_index=payload.order_index,
    )
    return QuestionRead.model_validate(question)


@router.get("/{session_id}/questions", response_model=list[QuestionRead])
async def list_questions(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """List questions for a session, ordered by order_index."""
    questions = await service.list_questions(db, session_id)
    return [QuestionRead.model_validate(q) for q in questions]


# ---------------------------------------------------------------------------
# QR Code
# ---------------------------------------------------------------------------


@router.get("/{session_id}/qr", responses={200: {"content": {"image/png": {}}}})
async def get_qr_code(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Generate and return QR code PNG for session join URL."""
    session = await service.get_session_by_id(db, session_id)
    service.validate_qr_accessible(session)
    png_bytes = service.generate_qr_png(session.join_url or session.qr_url or "")
    return Response(content=png_bytes, media_type="image/png")


@router.get("/{session_id}/qr-json", response_model=QrJsonResponse)
async def get_qr_json(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """QR code as base64-encoded JSON (for embedding in web UIs)."""
    session = await service.get_session_by_id(db, session_id)
    service.validate_qr_accessible(session)
    join_url = session.join_url or session.qr_url or ""
    qr_b64 = service.generate_qr_base64(join_url)
    return QrJsonResponse(qr_base64=qr_b64, join_url=join_url)


# ---------------------------------------------------------------------------
# Determinism Verification
# ---------------------------------------------------------------------------


@router.get("/{session_id}/verify-determinism")
async def verify_determinism(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Return stored replay_hash, seed, and verification status."""
    session = await service.get_session_by_id(db, session_id)
    return {
        "session_id": session.id,
        "seed": session.seed,
        "replay_hash": session.replay_hash,
        "is_deterministic": session.seed is not None,
        "has_replay_hash": session.replay_hash is not None,
    }
