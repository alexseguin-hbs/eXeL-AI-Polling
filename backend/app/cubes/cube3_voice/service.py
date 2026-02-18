"""Cube 3 — Voice-to-Text Engine Service.

Handles browser mic audio capture → STT transcription → forwards transcript
into Cube 2's text pipeline for PII/profanity processing, storage, and
downstream consumption.

Flow:
  1. Validate session (polling?), question, participant (reuse Cube 2 validators)
  2. Start time tracking (Cube 5, action_type="voice_responding")
  3. Select best STT provider for language (priority + circuit breaker)
  4. Transcribe audio → text + confidence
  5. Validate transcript (non-empty, confidence threshold)
  6. Store voice metadata (MongoDB audio + Postgres VoiceResponse)
  7. Forward transcript into Cube 2 text pipeline (PII/profanity/storage)
  8. Stop time tracking → calculate ♡/◬ tokens
  9. Publish Redis event for Cube 6
  10. Return response with immediate token display

Circuit breaker: If primary STT fails, failover to next provider by priority.
"""

from __future__ import annotations

import json
import math
import uuid
from datetime import datetime, timezone

import structlog
from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ResponseValidationError
from app.cubes.cube2_text.service import (
    detect_pii,
    detect_profanity,
    publish_submission_event,
    scrub_pii,
    scrub_profanity,
    validate_participant,
    validate_question,
    validate_session_for_submission,
    validate_text_input,
)
from app.cubes.cube3_voice.providers.base import STTProviderError, TranscriptionResult
from app.cubes.cube3_voice.providers.factory import get_stt_provider, select_stt_provider
from app.models.response_meta import ResponseMeta
from app.models.text_response import TextResponse
from app.models.voice_response import VoiceResponse

logger = structlog.get_logger(__name__)

# Minimum confidence threshold for accepting transcripts
_MIN_CONFIDENCE = 0.3  # Low threshold — UI warns at 0.65, but we still accept


# ---------------------------------------------------------------------------
# 1. STT Provider Selection
# ---------------------------------------------------------------------------


async def select_provider_for_language(
    db: AsyncSession,
    language_code: str,
) -> str:
    """Select best STT provider for a language. Returns provider name."""
    provider = await select_stt_provider(db, language_code)
    return provider.provider_name.value


# ---------------------------------------------------------------------------
# 2. Transcription
# ---------------------------------------------------------------------------


async def transcribe_audio(
    db: AsyncSession,
    audio_bytes: bytes,
    language_code: str,
    audio_format: str = "webm",
    preferred_provider: str | None = None,
) -> TranscriptionResult:
    """Transcribe audio using best available STT provider.

    Implements circuit breaker: tries preferred/primary provider first,
    falls back through all three launch providers (whisper, grok, gemini)
    on failure.

    Args:
        db: Database session for provider config lookup
        audio_bytes: Raw audio data
        language_code: ISO language hint
        audio_format: Audio container format
        preferred_provider: Provider name from session.ai_provider (openai/grok/gemini)

    Returns:
        TranscriptionResult with transcript, confidence, and metadata
    """
    if preferred_provider:
        provider = await select_stt_provider(db, language_code, preferred_provider)
    else:
        provider = await select_stt_provider(db, language_code)

    try:
        result = await provider.transcribe(audio_bytes, language_code, audio_format)
        return result
    except STTProviderError as e:
        logger.warning(
            "cube3.stt.primary_failed",
            provider=e.provider,
            error=e.message,
            language=language_code,
        )
        # Circuit breaker: try remaining providers
        return await _handle_stt_failure(
            db, audio_bytes, language_code, audio_format,
            failed_provider=e.provider,
        )


# Ordered fallback chain for circuit breaker
_FALLBACK_ORDER = ["whisper", "grok", "gemini"]


async def _handle_stt_failure(
    db: AsyncSession,
    audio_bytes: bytes,
    language_code: str,
    audio_format: str,
    failed_provider: str,
) -> TranscriptionResult:
    """Circuit breaker: failover to next STT provider after primary fails.

    Tries all remaining providers in order: whisper → grok → gemini.
    Skips the failed provider and any that also fail.
    """
    for fallback_name in _FALLBACK_ORDER:
        if fallback_name == failed_provider:
            continue
        try:
            logger.info("cube3.stt.failover", from_provider=failed_provider, to_provider=fallback_name)
            fallback = get_stt_provider(fallback_name)
            return await fallback.transcribe(audio_bytes, language_code, audio_format)
        except (STTProviderError, Exception) as e:
            logger.warning(
                "cube3.stt.failover_failed",
                provider=fallback_name,
                error=str(e),
            )
            continue

    raise ResponseValidationError(
        "Voice transcription failed — all STT providers unavailable. "
        "Please try again or submit text instead."
    )


# ---------------------------------------------------------------------------
# 3. Transcript Validation
# ---------------------------------------------------------------------------


def validate_transcript(
    result: TranscriptionResult,
    max_length: int,
) -> str:
    """Validate transcript is non-empty and meets quality threshold.

    Returns cleaned transcript text. Raises ResponseValidationError on failure.
    """
    transcript = result.transcript.strip()
    if not transcript:
        raise ResponseValidationError(
            "No speech detected — please try again."
        )
    if result.confidence < _MIN_CONFIDENCE:
        raise ResponseValidationError(
            f"Transcription confidence too low ({result.confidence:.0%}). "
            "Please speak clearly and try again."
        )
    if len(transcript) > max_length:
        # Truncate rather than reject — voice is harder to control length
        transcript = transcript[:max_length]
    return transcript


# ---------------------------------------------------------------------------
# 4. Storage
# ---------------------------------------------------------------------------


async def store_voice_response(
    db: AsyncSession,
    mongo: AsyncIOMotorDatabase,
    *,
    session_id: uuid.UUID,
    question_id: uuid.UUID,
    participant_id: uuid.UUID,
    cycle_id: int,
    audio_bytes: bytes,
    audio_format: str,
    transcript: str,
    stt_result: TranscriptionResult,
    is_anonymous: bool,
    pii_detected: bool,
    pii_types: list[dict] | None,
    pii_scrubbed_text: str | None,
    profanity_detected: bool,
    profanity_words: list[dict] | None,
    clean_text: str,
) -> ResponseMeta:
    """Store voice response in MongoDB (audio + raw) + Postgres (ResponseMeta + VoiceResponse + TextResponse).

    MongoDB stores:
      - Raw audio bytes (GridFS-ready, stored as binary)
      - Raw transcript text

    Postgres stores:
      - ResponseMeta (shared response index, source="voice")
      - VoiceResponse (audio metadata, STT results)
      - TextResponse (PII/profanity results from Cube 2 pipeline)
    """
    now = datetime.now(timezone.utc)

    # --- MongoDB: audio + raw transcript ---
    mongo_doc = {
        "session_id": str(session_id),
        "question_id": str(question_id),
        "participant_id": str(participant_id),
        "source": "voice",
        "raw_transcript": transcript,
        "audio_format": audio_format,
        "audio_size_bytes": len(audio_bytes),
        "audio_duration_sec": stt_result.audio_duration_sec,
        "stt_provider": stt_result.provider,
        "stt_confidence": stt_result.confidence,
        "language_code": stt_result.language_detected,
        "submitted_at": now,
    }
    mongo_result = await mongo.responses.insert_one(mongo_doc)

    # Store audio binary separately for potential playback
    await mongo.audio_files.insert_one({
        "response_ref": str(mongo_result.inserted_id),
        "session_id": str(session_id),
        "audio_data": audio_bytes,
        "audio_format": audio_format,
        "created_at": now,
    })

    mongo_ref = str(mongo_result.inserted_id)

    # --- Postgres: ResponseMeta ---
    response_meta = ResponseMeta(
        session_id=session_id,
        question_id=question_id,
        participant_id=participant_id,
        cycle_id=cycle_id,
        source="voice",
        mongo_ref=mongo_ref,
        char_count=len(transcript),
        submitted_at=now,
        is_flagged=False,
    )
    db.add(response_meta)
    await db.flush()

    # --- Postgres: VoiceResponse (1:1 with ResponseMeta) ---
    voice_response = VoiceResponse(
        response_meta_id=response_meta.id,
        language_code=stt_result.language_detected,
        is_anonymous=is_anonymous,
        audio_duration_sec=stt_result.audio_duration_sec,
        audio_format=audio_format,
        audio_size_bytes=len(audio_bytes),
        stt_provider=stt_result.provider,
        transcript_text=transcript,
        transcript_confidence=stt_result.confidence,
    )
    db.add(voice_response)

    # --- Postgres: TextResponse (PII/profanity from Cube 2 pipeline) ---
    text_response = TextResponse(
        response_meta_id=response_meta.id,
        language_code=stt_result.language_detected,
        is_anonymous=is_anonymous,
        pii_detected=pii_detected,
        pii_types=pii_types,
        pii_scrubbed_text=pii_scrubbed_text,
        profanity_detected=profanity_detected,
        profanity_words=profanity_words,
        clean_text=clean_text,
    )
    db.add(text_response)

    await db.commit()
    await db.refresh(response_meta)
    return response_meta


# ---------------------------------------------------------------------------
# 5. Main Orchestrator
# ---------------------------------------------------------------------------


async def submit_voice_response(
    db: AsyncSession,
    mongo: AsyncIOMotorDatabase,
    redis: Redis,
    *,
    session_id: uuid.UUID,
    question_id: uuid.UUID,
    participant_id: uuid.UUID,
    audio_bytes: bytes,
    language_code: str = "en",
    audio_format: str = "webm",
) -> dict:
    """Main orchestrator: transcribe voice, process through Cube 2 pipeline, store, return with tokens.

    Flow:
      1. Validate session (polling?), question, participant
      2. Start time tracking (Cube 5)
      3. Select STT provider + transcribe audio
      4. Validate transcript (non-empty, confidence)
      5. Run Cube 2 PII/profanity pipeline on transcript
      6. Store: MongoDB (audio + raw) + Postgres (ResponseMeta + VoiceResponse + TextResponse)
      7. Stop time tracking → ♡/◬ tokens
      8. Publish Redis event for Cube 6
      9. Return response with immediate token display
    """
    # --- 1. Validate session, question, participant (reuse Cube 2) ---
    session = await validate_session_for_submission(db, session_id)
    await validate_question(db, question_id, session_id)
    participant = await validate_participant(db, participant_id, session_id)

    # --- 2. Start time tracking (Cube 5) ---
    from app.cubes.cube5_gateway.service import start_time_tracking, stop_time_tracking

    time_entry = await start_time_tracking(
        db,
        session_id=session_id,
        participant_id=participant_id,
        action_type="voice_responding",
        reference_id=str(question_id),
        cube_id="cube3",
    )

    # --- 3. Resolve STT provider (Moderator default → User override if allowed) ---
    stt_provider_name = getattr(session, "stt_provider", None) or session.ai_provider
    if getattr(session, "allow_user_stt_choice", False):
        user_pref = getattr(participant, "stt_provider_preference", None)
        if user_pref:
            stt_provider_name = user_pref

    stt_result = await transcribe_audio(
        db, audio_bytes, language_code, audio_format,
        preferred_provider=stt_provider_name,
    )
    transcript = validate_transcript(stt_result, session.max_response_length)

    # --- 4. Run Cube 2 PII/profanity pipeline on transcript ---
    pii_detections = await detect_pii(transcript)
    pii_detected = len(pii_detections) > 0
    pii_scrubbed = scrub_pii(transcript, pii_detections) if pii_detected else transcript
    pii_types_safe = [
        {"type": d["type"], "start": d["start"], "end": d["end"]}
        for d in pii_detections
    ] if pii_detected else None

    profanity_matches = await detect_profanity(db, pii_scrubbed, stt_result.language_detected)
    profanity_detected = len(profanity_matches) > 0
    clean_text = scrub_profanity(pii_scrubbed, profanity_matches) if profanity_detected else pii_scrubbed
    profanity_words_safe = [
        {"word": m["word"], "severity": m["severity"], "position": m["position"]}
        for m in profanity_matches
    ] if profanity_detected else None

    # --- 5. Store ---
    is_anonymous = session.anonymity_mode == "anonymous"
    response_meta = await store_voice_response(
        db, mongo,
        session_id=session_id,
        question_id=question_id,
        participant_id=participant_id,
        cycle_id=session.current_cycle,
        audio_bytes=audio_bytes,
        audio_format=audio_format,
        transcript=transcript,
        stt_result=stt_result,
        is_anonymous=is_anonymous,
        pii_detected=pii_detected,
        pii_types=pii_types_safe,
        pii_scrubbed_text=pii_scrubbed if pii_detected else None,
        profanity_detected=profanity_detected,
        profanity_words=profanity_words_safe,
        clean_text=clean_text,
    )

    # --- 6. Stop time tracking → tokens ---
    time_entry = await stop_time_tracking(
        db,
        time_entry_id=time_entry.id,
    )
    heart_earned = time_entry.heart_tokens_earned
    unity_earned = time_entry.unity_tokens_earned

    # --- 7. Publish Redis event ---
    await publish_submission_event(
        redis, session_id, response_meta.id,
        stt_result.language_detected, len(transcript),
    )

    # --- 8. Return composite result ---
    logger.info(
        "cube3.voice.submitted",
        session_id=str(session_id),
        response_id=str(response_meta.id),
        language=stt_result.language_detected,
        stt_provider=stt_result.provider,
        confidence=stt_result.confidence,
        transcript_length=len(transcript),
        audio_duration=stt_result.audio_duration_sec,
        pii_detected=pii_detected,
        profanity_detected=profanity_detected,
        heart_tokens=heart_earned,
        unity_tokens=unity_earned,
    )

    return {
        "id": response_meta.id,
        "session_id": session_id,
        "question_id": question_id,
        "participant_id": participant_id,
        "source": "voice",
        "char_count": len(transcript),
        "language_code": stt_result.language_detected,
        "submitted_at": response_meta.submitted_at,
        "is_flagged": False,
        "audio_duration_sec": stt_result.audio_duration_sec,
        "stt_provider": stt_result.provider,
        "transcript_text": transcript,
        "transcript_confidence": stt_result.confidence,
        "pii_detected": pii_detected,
        "profanity_detected": profanity_detected,
        "clean_text": clean_text,
        "heart_tokens_earned": heart_earned,
        "unity_tokens_earned": unity_earned,
    }


# ---------------------------------------------------------------------------
# 6. Query Functions
# ---------------------------------------------------------------------------


async def get_voice_responses(
    db: AsyncSession,
    session_id: uuid.UUID,
    *,
    page: int = 1,
    page_size: int = 50,
) -> dict:
    """Paginated list of voice responses for a session."""
    offset = (page - 1) * page_size

    # Count total voice responses
    count_result = await db.execute(
        select(func.count(ResponseMeta.id)).where(
            ResponseMeta.session_id == session_id,
            ResponseMeta.source == "voice",
        )
    )
    total = count_result.scalar() or 0
    pages = math.ceil(total / page_size) if total > 0 else 0

    # Fetch page
    result = await db.execute(
        select(ResponseMeta, VoiceResponse)
        .outerjoin(VoiceResponse, VoiceResponse.response_meta_id == ResponseMeta.id)
        .where(
            ResponseMeta.session_id == session_id,
            ResponseMeta.source == "voice",
        )
        .order_by(ResponseMeta.submitted_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = result.all()

    items = []
    for meta, voice in rows:
        items.append({
            "id": meta.id,
            "session_id": meta.session_id,
            "question_id": meta.question_id,
            "participant_id": meta.participant_id,
            "source": "voice",
            "char_count": meta.char_count,
            "language_code": voice.language_code if voice else "en",
            "submitted_at": meta.submitted_at,
            "is_flagged": meta.is_flagged,
            "audio_duration_sec": voice.audio_duration_sec if voice else 0.0,
            "stt_provider": voice.stt_provider if voice else "unknown",
            "transcript_confidence": voice.transcript_confidence if voice else 0.0,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


async def get_voice_response_by_id(
    db: AsyncSession,
    session_id: uuid.UUID,
    response_id: uuid.UUID,
) -> dict | None:
    """Single voice response lookup with full detail."""
    result = await db.execute(
        select(ResponseMeta, VoiceResponse, TextResponse)
        .outerjoin(VoiceResponse, VoiceResponse.response_meta_id == ResponseMeta.id)
        .outerjoin(TextResponse, TextResponse.response_meta_id == ResponseMeta.id)
        .where(
            ResponseMeta.id == response_id,
            ResponseMeta.session_id == session_id,
            ResponseMeta.source == "voice",
        )
    )
    row = result.one_or_none()
    if row is None:
        return None

    meta, voice, text_resp = row
    return {
        "id": meta.id,
        "session_id": meta.session_id,
        "question_id": meta.question_id,
        "participant_id": meta.participant_id,
        "source": "voice",
        "char_count": meta.char_count,
        "language_code": voice.language_code if voice else "en",
        "submitted_at": meta.submitted_at,
        "is_flagged": meta.is_flagged,
        "audio_duration_sec": voice.audio_duration_sec if voice else 0.0,
        "audio_format": voice.audio_format if voice else "webm",
        "audio_size_bytes": voice.audio_size_bytes if voice else 0,
        "stt_provider": voice.stt_provider if voice else "unknown",
        "transcript_text": voice.transcript_text if voice else "",
        "transcript_confidence": voice.transcript_confidence if voice else 0.0,
        "pii_detected": text_resp.pii_detected if text_resp else False,
        "profanity_detected": text_resp.profanity_detected if text_resp else False,
        "clean_text": text_resp.clean_text if text_resp else None,
        "pii_types": text_resp.pii_types if text_resp else None,
        "pii_scrubbed_text": text_resp.pii_scrubbed_text if text_resp else None,
        "profanity_words": text_resp.profanity_words if text_resp else None,
    }
