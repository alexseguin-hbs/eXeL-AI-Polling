"""Cube 3 — Voice-to-Text Engine: Browser mic → STT → Cube 2 text pipeline.

Endpoints:
  POST /sessions/{session_id}/voice                   — Submit voice (multipart audio upload)
  WS   /sessions/{session_id}/voice/realtime          — Real-time streaming STT (paid feature)
  GET  /sessions/{session_id}/voice                   — List voice responses with pagination
  GET  /sessions/{session_id}/voice/metrics           — System/User/Outcome metrics for Cube 10
  GET  /sessions/{session_id}/voice/{response_id}     — Single voice response detail

Batch STT providers: OpenAI Whisper, Grok (xAI), Gemini (Google)
Real-time STT providers: Azure Speech Services (primary), AWS Transcribe (fallback)
Provider selected from session.ai_provider (Moderator choice at creation).
Real-time STT is a PAID feature (Moderator + User payment required).
"""

import uuid

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile, WebSocket
from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_optional_current_user
from app.core.dependencies import get_db, get_mongo, get_redis
from app.core.rate_limit import limiter
from app.cubes.cube3_voice import metrics as cube3_metrics
from app.cubes.cube3_voice import service
from app.schemas.voice import (
    PaginatedVoiceResponseList,
    VoiceResponseDetail,
    VoiceSubmissionRead,
)

router = APIRouter(
    prefix="/sessions/{session_id}/voice",
    tags=["Cube 3 — Voice"],
)

# Max audio upload size: 25 MB (Whisper API limit)
_MAX_AUDIO_SIZE = 25 * 1024 * 1024

# Accepted audio MIME types from browser MediaRecorder
_ACCEPTED_FORMATS = {"webm", "wav", "mp3", "ogg", "m4a", "flac"}


@router.post("", response_model=VoiceSubmissionRead, status_code=201)
@limiter.limit("60/minute")
async def submit_voice(
    request: Request,
    session_id: uuid.UUID,
    audio: UploadFile = File(..., description="Audio recording from browser mic"),
    question_id: uuid.UUID = Form(...),
    participant_id: uuid.UUID = Form(...),
    language_code: str = Form(default="en"),
    audio_format: str = Form(default="webm"),
    db: AsyncSession = Depends(get_db),
    mongo: AsyncIOMotorDatabase = Depends(get_mongo),
    redis: Redis = Depends(get_redis),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """CRS-15: User submits voice response.

    Accepts multipart audio upload from browser MediaRecorder API.
    Transcribes via STT provider (OpenAI Whisper / Grok / Gemini),
    forwards transcript through Cube 2 text pipeline (PII/profanity),
    and returns immediate token display (♡ and ◬).
    """
    from app.core.exceptions import ResponseValidationError

    # Validate audio format
    fmt = audio_format.lower()
    if fmt not in _ACCEPTED_FORMATS:
        raise ResponseValidationError(
            f"Unsupported audio format '{fmt}'. Accepted: {', '.join(sorted(_ACCEPTED_FORMATS))}"
        )

    # Read audio bytes
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise ResponseValidationError("Audio file is empty")
    if len(audio_bytes) > _MAX_AUDIO_SIZE:
        raise ResponseValidationError(
            f"Audio file too large ({len(audio_bytes) / 1024 / 1024:.1f} MB). "
            f"Maximum: {_MAX_AUDIO_SIZE / 1024 / 1024:.0f} MB"
        )

    result = await service.submit_voice_response(
        db, mongo, redis,
        session_id=session_id,
        question_id=question_id,
        participant_id=participant_id,
        audio_bytes=audio_bytes,
        language_code=language_code,
        audio_format=fmt,
    )
    return result


@router.websocket("/realtime")
async def realtime_transcription(
    ws: WebSocket,
    session_id: uuid.UUID,
    question_id: uuid.UUID,
    participant_id: uuid.UUID,
    language_code: str = "en",
    db: AsyncSession = Depends(get_db),
    mongo: AsyncIOMotorDatabase = Depends(get_mongo),
    redis: Redis = Depends(get_redis),
):
    """Real-time voice-to-text with word-by-word display (PAID FEATURE).

    WebSocket protocol:
      Client → Server:
        Binary frames: PCM 16-bit 16kHz mono audio chunks
        Text frame: {"action": "stop"} to end session
      Server → Client:
        {"type": "interim", "text": "partial words...", "words": [...]}
        {"type": "final", "text": "complete sentence.", "confidence": 0.95}
        {"type": "result", "response_id": "...", "♡": 1.0, "◬": 5.0}

    Providers: Azure Speech Services (primary) → AWS Transcribe (fallback)
    Payment gate: Session must have is_paid=True (Moderator paid or cost-split).
    """
    from app.cubes.cube3_voice.realtime import handle_realtime_transcription

    await handle_realtime_transcription(
        ws, session_id, participant_id, question_id,
        language_code, db, mongo, redis,
    )


@router.get("", response_model=PaginatedVoiceResponseList)
async def list_voice_responses(
    session_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """List paginated voice responses for a session."""
    return await service.get_voice_responses(
        db, session_id, page=page, page_size=page_size,
    )


@router.get("/metrics")
async def get_metrics(
    session_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Cube 3 metrics: System / User / Outcome.

    Used by Cube 10 simulation to compare proposed changes against
    production baselines. Returns all three metric categories.
    """
    return await cube3_metrics.get_all_metrics(db, session_id)


@router.get("/{response_id}", response_model=VoiceResponseDetail)
async def get_voice_response(
    session_id: uuid.UUID,
    response_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser | None = Depends(get_optional_current_user),
):
    """Get a single voice response by ID. Includes full STT + PII/profanity detail."""
    result = await service.get_voice_response_by_id(db, session_id, response_id)
    if result is None:
        from app.core.exceptions import SessionNotFoundError
        raise SessionNotFoundError(str(response_id))
    return result
