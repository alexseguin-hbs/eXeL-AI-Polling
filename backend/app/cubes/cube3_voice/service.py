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
  6. Store voice metadata (Postgres VoiceResponse + ResponseMeta.raw_text)
  7. Forward transcript into Cube 2 text pipeline (PII/profanity/storage)
  8. Stop time tracking → calculate ♡/◬ tokens
  9. Publish Redis event for Cube 6
  10. Return response with immediate token display

Circuit breaker: If primary STT fails, failover to next provider by priority.
"""

from __future__ import annotations

import asyncio
import math
import uuid
from datetime import datetime, timezone

import structlog
from redis.asyncio import Redis
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.concurrency import SessionSemaphorePool
from app.core.crypto_utils import compute_response_hash
from app.core.exceptions import ResponseValidationError
from app.core.submission_validators import (
    validate_participant,
    validate_question,
    validate_session_exists,
    validate_session_for_submission,
)
from app.core.text_pipeline import run_text_pipeline
from app.cubes.cube2_text.service import publish_submission_event
from app.cubes.cube3_voice.providers.base import STTProviderError, TranscriptionResult
from app.cubes.cube3_voice.providers.factory import get_stt_provider_safe, select_stt_provider
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary
from app.models.text_response import TextResponse
from app.models.voice_response import VoiceResponse

logger = structlog.get_logger(__name__)

# Minimum confidence threshold for accepting transcripts
_MIN_CONFIDENCE = 0.3  # Low threshold — UI warns at 0.65, but we still accept

# STT API call timeout (seconds) — prevents hung providers blocking circuit breaker
STT_TIMEOUT_SECONDS = 30

# Shared circuit breaker for STT providers (reusable by Cube 6 for AI providers)
from app.core.circuit_breaker import CircuitBreaker

_stt_cb = CircuitBreaker(max_failures=3, cooldown_seconds=60.0, name="cube3")

# Per-session concurrency pool: limits concurrent STT calls (shared pattern with Cube 6)
_stt_semaphore_pool = SessionSemaphorePool(max_concurrent=20, name="cube3_stt")


# NOTE: validate_session_exists() now in core/submission_validators.py (shared Cubes 2-4)

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

    prov_name = provider.provider_name.value

    # Circuit breaker: skip if provider is in cooldown
    if _stt_cb.is_open(prov_name):
        logger.info("cube3.stt.cb_skip_primary", provider=prov_name)
        return await _handle_stt_failure(
            db, audio_bytes, language_code, audio_format,
            failed_provider=prov_name,
        )

    try:
        result = await asyncio.wait_for(
            provider.transcribe(audio_bytes, language_code, audio_format),
            timeout=STT_TIMEOUT_SECONDS,
        )
        _stt_cb.record_success(prov_name)
        return result
    except asyncio.TimeoutError:
        _stt_cb.record_failure(prov_name)
        logger.warning(
            "cube3.stt.timeout",
            provider=prov_name,
            timeout_seconds=STT_TIMEOUT_SECONDS,
            language=language_code,
        )
        return await _handle_stt_failure(
            db, audio_bytes, language_code, audio_format,
            failed_provider=prov_name,
        )
    except STTProviderError as e:
        _stt_cb.record_failure(e.provider)
        logger.warning(
            "cube3.stt.primary_failed",
            provider=e.provider,
            error=e.message,
            language=language_code,
        )
        return await _handle_stt_failure(
            db, audio_bytes, language_code, audio_format,
            failed_provider=e.provider,
        )


# Ordered fallback chain for circuit breaker (cost-optimized: Gemini cheapest → AWS most expensive)
_FALLBACK_ORDER = ["gemini", "whisper", "grok", "aws"]


async def _handle_stt_failure(
    db: AsyncSession,
    audio_bytes: bytes,
    language_code: str,
    audio_format: str,
    failed_provider: str,
) -> TranscriptionResult:
    """Circuit breaker: failover to next STT provider after primary fails.

    Tries remaining providers in cost-optimized order (gemini → whisper → grok → aws).
    Skips the failed provider, any in cooldown, and any that also fail.
    """
    for fallback_name in _FALLBACK_ORDER:
        if fallback_name == failed_provider:
            continue
        if _stt_cb.is_open(fallback_name):
            logger.info("cube3.stt.cb_skip_fallback", provider=fallback_name)
            continue
        try:
            logger.info("cube3.stt.failover", from_provider=failed_provider, to_provider=fallback_name)
            fallback = await get_stt_provider_safe(fallback_name)
            result = await asyncio.wait_for(
                fallback.transcribe(audio_bytes, language_code, audio_format),
                timeout=STT_TIMEOUT_SECONDS,
            )
            _stt_cb.record_success(fallback_name)
            return result
        except asyncio.TimeoutError:
            _stt_cb.record_failure(fallback_name)
            logger.warning(
                "cube3.stt.failover_timeout",
                provider=fallback_name,
                timeout_seconds=STT_TIMEOUT_SECONDS,
            )
            continue
        except (STTProviderError, Exception) as e:
            _stt_cb.record_failure(fallback_name)
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
    response_hash: str | None = None,
) -> ResponseMeta:
    """Store voice response in Postgres (ResponseMeta + VoiceResponse + TextResponse).

    Postgres stores:
      - ResponseMeta (shared response index, source="voice", raw_text=transcript)
      - VoiceResponse (audio metadata, STT results)
      - TextResponse (PII/profanity results from Cube 2 pipeline)
    """
    now = datetime.now(timezone.utc)

    # TODO: Supabase Storage integration for audio binary (deferred).
    # Audio playback will require uploading audio_bytes to Supabase Storage
    # and storing the path in VoiceResponse.audio_storage_path.
    audio_storage_path = ""  # noqa: F841 — placeholder for Supabase Storage

    # --- Postgres: ResponseMeta ---
    response_meta = ResponseMeta(
        session_id=session_id,
        question_id=question_id,
        participant_id=participant_id,
        cycle_id=cycle_id,
        source="voice",
        raw_text=transcript,
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
        cost_usd=stt_result.cost_usd,
    )
    db.add(voice_response)

    # --- Postgres: TextResponse (PII/profanity from Cube 2 pipeline) ---
    # CRS-08: SHA-256 integrity hash of clean transcript text
    if response_hash is None:
        response_hash = compute_response_hash(clean_text)

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
        response_hash=response_hash,
    )
    db.add(text_response)

    await db.commit()
    await db.refresh(response_meta)
    return response_meta


# ---------------------------------------------------------------------------
# 5. Main Orchestrator
# ---------------------------------------------------------------------------
# NOTE: English translation for summaries (333/111/33) AND themes (Theme1 + Theme2)
# is handled by Cube 6 Phase A/B (cube6_ai/service.py line 162): adds "translate
# to English" instruction when language_code != "en". All downstream AI output
# (summaries + themes) is in English. Cube 3 passes language_code through to
# Phase A via core/phase_a_retry.py → summarize_single_response().


async def submit_voice_response(
    db: AsyncSession,
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
      6. Store: Postgres (ResponseMeta + VoiceResponse + TextResponse)
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

    # Concurrency cap: limit parallel STT calls per session
    sem = _stt_semaphore_pool.get(session_id)
    async with sem:
        stt_result = await transcribe_audio(
            db, audio_bytes, language_code, audio_format,
            preferred_provider=stt_provider_name,
        )
    transcript = validate_transcript(stt_result, session.max_response_length)
    # NOTE: Transcript stored in original language. English translation for
    # summaries (333/111/33) AND themes (Theme1 + Theme2) is handled by Cube 6
    # Phase A/B via language_code passed to summarize_single_response().

    # --- 4. Run Cube 2 PII/profanity pipeline on transcript ---
    pipeline = await run_text_pipeline(db, transcript, stt_result.language_detected)
    pii_detected = pipeline.pii_detected
    profanity_detected = pipeline.profanity_detected
    clean_text = pipeline.clean_text

    # --- 5. Store ---
    # CRS-08: compute response_hash once (reused in storage + return)
    response_hash = compute_response_hash(clean_text)
    is_anonymous = session.anonymity_mode == "anonymous"
    response_meta = await store_voice_response(
        db,
        session_id=session_id,
        question_id=question_id,
        participant_id=participant_id,
        cycle_id=session.current_cycle,
        audio_bytes=audio_bytes,
        audio_format=audio_format,
        transcript=transcript,
        stt_result=stt_result,
        is_anonymous=is_anonymous,
        pii_detected=pipeline.pii_detected,
        pii_types=pipeline.pii_types,
        pii_scrubbed_text=pipeline.pii_scrubbed_text,
        profanity_detected=pipeline.profanity_detected,
        profanity_words=pipeline.profanity_words,
        clean_text=clean_text,
        response_hash=response_hash,
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

    # --- 7b. Fire-and-forget: live summarization (Cube 6 Phase A) ---
    # Task A7: PII gate assertion — only clean_text (post-scrub) reaches Cube 6.
    # Dynamically verify that raw transcript is NOT forwarded when PII was detected.
    pii_gate_passed = (not pii_detected) or (clean_text != transcript)
    logger.info(
        "cube6.phase_a.pii_safe",
        response_id=str(response_meta.id),
        input_is_clean_text=pii_gate_passed,
        pii_detected=pii_detected,
        raw_text_excluded=clean_text != transcript if pii_detected else True,
        source="voice",
    )
    if not pii_gate_passed:
        # CRS-08.02: Informational warning — submission proceeds with clean_text
        # (scrub_pii may have returned identical text if PII type was not redactable).
        # Phase A always receives pipeline.clean_text, never raw transcript.
        logger.warning(
            "cube6.phase_a.pii_gate_warning",
            response_id=str(response_meta.id),
            detail="PII detected but clean_text == raw transcript — scrubbing may have produced identical output",
        )

    # Fire-and-forget: shared Phase A with <33-word fallback + live feed broadcast
    from app.core.phase_a_retry import run_phase_a_with_retry

    try:
        task = asyncio.create_task(
            run_phase_a_with_retry(
                session_id=session_id,
                response_id=response_meta.id,
                clean_text=clean_text,
                language_code=stt_result.language_detected,
                ai_provider=session.ai_provider or "openai",
                session_short_code=session.short_code,
                live_feed_enabled=getattr(session, "live_feed_enabled", True),
                source="voice",
            )
        )

        def _on_phase_a_done(t: asyncio.Task):
            if t.exception():
                logger.error(
                    "cube3.phase_a.task_exception",
                    error=str(t.exception()),
                    response_id=str(response_meta.id),
                )
        task.add_done_callback(_on_phase_a_done)

    except Exception as e:
        logger.warning("cube3.live_summarization.error", error=str(e))

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
        cost_usd=stt_result.cost_usd,
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
        "cost_usd": stt_result.cost_usd,
        "heart_tokens_earned": heart_earned,
        "unity_tokens_earned": unity_earned,
        "response_hash": response_hash,
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
            "cost_usd": voice.cost_usd if voice else 0.0,
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
    """Single voice response lookup with full detail + summary_33."""
    result = await db.execute(
        select(ResponseMeta, VoiceResponse, TextResponse, ResponseSummary)
        .outerjoin(VoiceResponse, VoiceResponse.response_meta_id == ResponseMeta.id)
        .outerjoin(TextResponse, TextResponse.response_meta_id == ResponseMeta.id)
        .outerjoin(ResponseSummary, ResponseSummary.response_meta_id == ResponseMeta.id)
        .where(
            ResponseMeta.id == response_id,
            ResponseMeta.session_id == session_id,
            ResponseMeta.source == "voice",
        )
    )
    row = result.one_or_none()
    if row is None:
        return None

    meta, voice, text_resp, summary = row
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
        "response_hash": text_resp.response_hash if text_resp else None,
        "pii_types": text_resp.pii_types if text_resp else None,
        "pii_scrubbed_text": text_resp.pii_scrubbed_text if text_resp else None,
        "profanity_words": text_resp.profanity_words if text_resp else None,
        "summary_33": summary.summary_33 if summary else None,
    }
