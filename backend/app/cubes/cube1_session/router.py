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

import asyncio
import logging
import uuid

import redis.asyncio as aioredis
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user, get_optional_current_user
from app.core.dependencies import get_db, get_mongo, get_redis

logger = logging.getLogger(__name__)
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


# ---------------------------------------------------------------------------
# Shared helpers — eliminate repeated count + serialize boilerplate
# ---------------------------------------------------------------------------


async def _return_session(db: AsyncSession, session) -> SessionRead:
    """Fetch participant count and serialize a Session ORM to SessionRead."""
    count = await service.get_participant_count(db, session.id)
    data = {c.key: getattr(session, c.key) for c in session.__table__.columns}
    data["participant_count"] = count
    return SessionRead(**data)


async def _transition_and_return(
    db: AsyncSession,
    session_id: uuid.UUID,
    target_state: str,
    user: CurrentUser,
    redis: aioredis.Redis | None = None,
    mongo=None,
) -> SessionRead:
    """Verify ownership, transition state, and return serialized session.

    If transitioning to 'ranking', fires Cube 5 orchestrator to start the
    AI theming pipeline as a non-blocking background task. State transition
    always succeeds regardless of orchestration outcome.
    """
    session = await service.get_session_by_id(db, session_id)
    service.verify_session_owner(session, user)
    updated = await service.transition_session(
        db, session, target_state, redis=redis, actor_id=user.user_id
    )

    # Fire Cube 5 orchestrator on polling → ranking transition
    if target_state == "ranking" and mongo is not None:
        try:
            from app.cubes.cube5_gateway.service import orchestrate_post_polling

            asyncio.create_task(
                orchestrate_post_polling(
                    db, mongo, session_id, seed=updated.seed
                )
            )
            logger.info(
                "cube1.orchestrate_post_polling.fired",
                extra={"session_id": str(session_id)},
            )
        except Exception as exc:
            logger.error(
                "cube1.orchestrate_post_polling.failed",
                extra={"session_id": str(session_id), "error": str(exc)},
            )

    return await _return_session(db, updated)


# ---------------------------------------------------------------------------
# Session CRUD
# ---------------------------------------------------------------------------


@router.get("", response_model=dict)
async def list_sessions(
    status: str | None = None,
    include_archived: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """List sessions created by the current moderator (paginated).

    By default, archived sessions are excluded (recent results at hand).
    Use ``?status=archived`` to list only archived sessions, or
    ``?include_archived=true`` to include them alongside active sessions.
    """
    sessions, total = await service.list_sessions(
        db,
        created_by=user.user_id,
        status_filter=status,
        include_archived=include_archived,
        limit=min(limit, 100),
        offset=offset,
    )
    items = [await _return_session(db, s) for s in sessions]
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
        session_type=payload.session_type,
        polling_mode=payload.polling_mode,
        pricing_tier=payload.pricing_tier,
        max_participants=payload.max_participants,
        fee_amount_cents=payload.fee_amount_cents,
        cost_splitting_enabled=payload.cost_splitting_enabled,
        reward_enabled=payload.reward_enabled,
        reward_amount_cents=payload.reward_amount_cents,
        cqs_weights=payload.cqs_weights,
        theme2_voting_level=payload.theme2_voting_level,
        live_feed_enabled=payload.live_feed_enabled,
        polling_mode_type=payload.polling_mode_type,
        static_poll_duration_days=payload.static_poll_duration_days,
        timer_display_mode=payload.timer_display_mode,
    )
    return await _return_session(db, session)


@router.get("/{session_id}", response_model=SessionRead)
async def get_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get session details by UUID."""
    session = await service.get_session_by_id(db, session_id)
    return await _return_session(db, session)


@router.get("/code/{short_code}", response_model=SessionRead)
async def get_session_by_code(
    short_code: str,
    db: AsyncSession = Depends(get_db),
):
    """Get session details by short_code (used by join page)."""
    session = await service.get_session_by_short_code(db, short_code)
    return await _return_session(db, session)


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
    return await _return_session(db, updated)


# ---------------------------------------------------------------------------
# State Transitions
# ---------------------------------------------------------------------------


@router.post("/{session_id}/start", response_model=SessionRead)
async def start_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Quick-start: transitions draft→open (then moderator can manually advance to polling)."""
    session = await service.get_session_by_id(db, session_id)
    service.verify_session_owner(session, user)
    if session.status == "draft":
        session = await service.transition_session(db, session, "open", actor_id=user.user_id)
    return await _return_session(db, session)


@router.post("/{session_id}/open", response_model=SessionRead)
async def open_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-06: Moderator opens session for participants to join."""
    return await _transition_and_return(db, session_id, "open", user)


@router.post("/{session_id}/poll", response_model=SessionRead)
async def start_polling(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """Moderator starts polling phase (participants can submit responses)."""
    return await _transition_and_return(db, session_id, "polling", user)


@router.post("/{session_id}/rank", response_model=SessionRead)
async def start_ranking(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
    mongo=Depends(get_mongo),
):
    """Moderator starts ranking phase — fires Cube 5 orchestrator for AI theming."""
    return await _transition_and_return(db, session_id, "ranking", user, mongo=mongo)


@router.post("/{session_id}/close", response_model=SessionRead)
async def close_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
):
    """CRS-06: Moderator closes the session."""
    return await _transition_and_return(db, session_id, "closed", user)


@router.post("/{session_id}/archive", response_model=SessionRead)
async def archive_session(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("moderator", "admin")),
    redis: aioredis.Redis = Depends(get_redis),
):
    """Archive a closed session. Clears Redis presence data."""
    return await _transition_and_return(db, session_id, "archived", user, redis=redis)


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
        language_code=payload.language_code,
        results_opt_in=payload.results_opt_in,
        redis=redis,
    )
    return SessionJoinResponse(
        session_id=session.id,
        participant_id=participant.id,
        short_code=session.short_code,
        title=session.title,
        status=session.status,
        display_name=participant.display_name,
        theme_id=session.theme_id,
        custom_accent_color=session.custom_accent_color,
        polling_mode_type=session.polling_mode_type,
        ends_at=session.ends_at.isoformat() if session.ends_at else None,
        timer_display_mode=session.timer_display_mode,
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
