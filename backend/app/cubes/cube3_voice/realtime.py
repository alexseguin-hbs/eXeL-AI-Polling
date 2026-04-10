"""Cube 3 — Real-time Voice-to-Text WebSocket Handler.

Manages the full lifecycle of a real-time transcription session:
  1. WebSocket connect → payment gate check (paid feature only)
  2. Validate session (polling?) + participant
  3. Start Azure STT (primary) with AWS fallback (circuit breaker)
  4. Receive audio chunks from browser → push to STT provider
  5. Stream word-by-word events back to client via WebSocket
  6. On stop → full transcript → Cube 2 text pipeline → store + tokens

Audio format: PCM 16-bit, 16kHz mono (browser converts via AudioWorklet).

Payment gate: Real-time STT is a paid feature.
  - Session must have is_paid=True OR cost-splitting enabled
  - Free tier users see "upgrade to use real-time voice" message
"""

from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timezone

import structlog
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.circuit_breaker import CircuitBreaker
from app.cubes.cube3_voice.providers.azure_realtime import (
    AzureRealtimeSTT,
    RealtimeEvent,
)
from app.cubes.cube3_voice.providers.aws_realtime import AWSRealtimeSTT

logger = structlog.get_logger(__name__)

# Circuit breaker for realtime STT providers (shared with batch path naming)
_realtime_cb = CircuitBreaker(max_failures=3, cooldown_seconds=60.0, name="cube3_realtime")

# WebSocket connection limiter — max concurrent realtime sessions
_ws_connection_semaphore = asyncio.Semaphore(50)


async def _check_payment_gate(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> bool:
    """Check if session is paid (real-time STT is a paid feature).

    Returns True if session has is_paid=True (Moderator paid or cost-splitting).
    """
    from app.models.session import Session
    from sqlalchemy import select

    result = await db.execute(
        select(Session.is_paid).where(Session.id == session_id)
    )
    is_paid = result.scalar_one_or_none()
    return bool(is_paid)


async def _send_event(ws: WebSocket, event: RealtimeEvent) -> None:
    """Send a transcription event as JSON over WebSocket."""
    payload = {
        "type": event.event_type,
        "text": event.text,
        "words": [
            {
                "text": w.text,
                "offset_ms": w.offset_ms,
                "duration_ms": w.duration_ms,
                "is_final": w.is_final,
            }
            for w in event.words
        ],
        "confidence": event.confidence,
        "language": event.language,
        "is_final": event.is_final,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await ws.send_json(payload)


async def handle_realtime_transcription(
    ws: WebSocket,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    question_id: uuid.UUID,
    language_code: str,
    db: AsyncSession,
    *args,
    **kwargs,
) -> None:
    """WebSocket handler for real-time voice-to-text transcription.

    Protocol:
      Client → Server:
        - Binary frames: raw PCM audio chunks (16-bit, 16kHz mono)
        - Text frame: {"action": "stop"} to end transcription
      Server → Client:
        - JSON: {"type": "interim", "text": "...", "words": [...]}
        - JSON: {"type": "final", "text": "...", "confidence": 0.95}
        - JSON: {"type": "result", ...tokens/response data...}
        - JSON: {"type": "error", "text": "..."}
    """
    await ws.accept()
    sid = str(session_id)

    # --- 0. Connection rate limit ---
    if _ws_connection_semaphore.locked():
        await ws.send_json({
            "type": "error",
            "text": "Too many concurrent voice sessions. Please try again shortly.",
            "code": "RATE_LIMITED",
        })
        await ws.close(code=4029, reason="Rate limited")
        return
    await _ws_connection_semaphore.acquire()

    try:
        await _handle_realtime_inner(ws, session_id, participant_id, question_id, language_code, db)
    finally:
        _ws_connection_semaphore.release()


async def _handle_realtime_inner(
    ws: WebSocket,
    session_id: uuid.UUID,
    participant_id: uuid.UUID,
    question_id: uuid.UUID,
    language_code: str,
    db,
) -> None:
    """Inner handler — runs under WebSocket connection semaphore."""
    sid = str(session_id)

    # --- 1. Payment gate ---
    is_paid = await _check_payment_gate(db, session_id)
    if not is_paid:
        await ws.send_json({
            "type": "error",
            "text": "Real-time voice transcription is a paid feature. "
                    "Upgrade your session or use standard voice submission.",
            "code": "PAYMENT_REQUIRED",
        })
        await ws.close(code=4002, reason="Payment required")
        return

    # --- 2. Validate session + participant ---
    try:
        from app.cubes.cube2_text.service import (
            validate_session_for_submission,
            validate_participant,
            validate_question,
        )
        session = await validate_session_for_submission(db, session_id)
        await validate_question(db, question_id, session_id)
        await validate_participant(db, participant_id, session_id)
    except Exception as e:
        await ws.send_json({"type": "error", "text": str(e)})
        await ws.close(code=4001, reason="Validation failed")
        return

    # --- 3. Start STT provider (Azure primary, AWS fallback) ---
    stt: AzureRealtimeSTT | AWSRealtimeSTT | None = None
    provider_name = "azure"

    _STT_START_TIMEOUT = 10.0  # seconds — prevent hung provider on start

    # Circuit breaker: skip providers in cooldown
    try:
        if not _realtime_cb.is_open("azure"):
            stt = AzureRealtimeSTT(language_code=language_code, session_id=sid)
            await asyncio.wait_for(stt.start(), timeout=_STT_START_TIMEOUT)
            _realtime_cb.record_success("azure")
            provider_name = "azure"
        else:
            raise ConnectionError("Azure in circuit breaker cooldown")
    except (Exception, asyncio.TimeoutError) as e:
        _realtime_cb.record_failure("azure")
        logger.warning("cube3.realtime.azure_failed", error=str(e))
        # Fallback to AWS
        try:
            if not _realtime_cb.is_open("aws"):
                stt = AWSRealtimeSTT(language_code=language_code, session_id=sid)
                await asyncio.wait_for(stt.start(), timeout=_STT_START_TIMEOUT)
                _realtime_cb.record_success("aws")
                provider_name = "aws"
            else:
                raise ConnectionError("AWS in circuit breaker cooldown")
        except (Exception, asyncio.TimeoutError) as e2:
            _realtime_cb.record_failure("aws")
            logger.error("cube3.realtime.all_providers_failed", error=str(e2))
            await ws.send_json({
                "type": "error",
                "text": "Real-time transcription unavailable. Please try standard voice submission.",
            })
            await ws.close(code=4003, reason="STT unavailable")
            return

    logger.info(
        "cube3.realtime.session_started",
        session_id=sid,
        provider=provider_name,
        language=language_code,
    )

    # --- 4. Start Cube 5 time tracking (non-fatal on failure) ---
    from app.cubes.cube5_gateway.service import start_time_tracking, stop_time_tracking

    time_entry = None
    try:
        time_entry = await start_time_tracking(
            db,
            session_id=session_id,
            participant_id=participant_id,
            action_type="voice_responding",
            reference_id=str(question_id),
            cube_id="cube3",
        )
    except Exception as e:
        logger.warning("cube3.realtime.time_tracking.start_failed", error=str(e), session_id=sid)

    # --- 5. Stream audio → STT → client (concurrent tasks) ---
    # Max session duration: 5 minutes (prevents resource exhaustion)
    _WS_SESSION_TIMEOUT = 300  # seconds
    final_transcript = ""

    async def _forward_events():
        """Forward STT events to WebSocket client."""
        try:
            async for event in stt.events():
                try:
                    await _send_event(ws, event)
                except Exception as send_err:
                    logger.warning("cube3.realtime.event_send_failed", error=str(send_err), session_id=sid)
                    break
        except Exception as e:
            logger.warning("cube3.realtime.event_forward_error", error=str(e), session_id=sid)

    event_task = asyncio.create_task(_forward_events())

    _MAX_REALTIME_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB max per session
    total_audio_bytes = 0

    try:
        deadline = asyncio.get_event_loop().time() + _WS_SESSION_TIMEOUT
        while True:
            # Enforce session timeout
            remaining = deadline - asyncio.get_event_loop().time()
            if remaining <= 0:
                logger.info("cube3.realtime.session_timeout", session_id=sid)
                await ws.send_json({"type": "error", "text": "Session timeout (5 min max)"})
                break

            try:
                message = await asyncio.wait_for(ws.receive(), timeout=min(remaining, 30.0))
            except asyncio.TimeoutError:
                # No data for 30s — keep alive, continue
                continue

            if message.get("type") == "websocket.disconnect":
                break

            if "bytes" in message and message["bytes"]:
                chunk = message["bytes"]
                total_audio_bytes += len(chunk)
                if total_audio_bytes > _MAX_REALTIME_AUDIO_BYTES:
                    logger.warning("cube3.realtime.audio_size_exceeded", session_id=sid, bytes=total_audio_bytes)
                    await ws.send_json({"type": "error", "text": "Audio size limit exceeded (25 MB max)"})
                    break

                # Binary frame: audio chunk — with mid-stream error recovery
                try:
                    if isinstance(stt, AzureRealtimeSTT):
                        stt.push_audio(chunk)
                    else:
                        await stt.push_audio(chunk)
                except Exception as push_err:
                    logger.warning("cube3.realtime.push_error", error=str(push_err), session_id=sid)
                    await ws.send_json({"type": "error", "text": "Audio stream interrupted"})
                    break

            elif "text" in message and message["text"]:
                # Text frame: control message
                try:
                    data = json.loads(message["text"])
                    if data.get("action") == "stop":
                        break
                except json.JSONDecodeError:
                    pass

    except WebSocketDisconnect:
        logger.info("cube3.realtime.client_disconnected", session_id=sid)
    except Exception as e:
        logger.error("cube3.realtime.error", error=str(e), session_id=sid)

    # --- 6. Stop STT, get final transcript ---
    try:
        final_transcript = await asyncio.wait_for(stt.stop(), timeout=10.0)
    except (Exception, asyncio.TimeoutError) as stop_err:
        logger.error("cube3.realtime.stop_error", error=str(stop_err), session_id=sid)
        final_transcript = ""
    event_task.cancel()
    try:
        await event_task
    except asyncio.CancelledError:
        pass

    if not final_transcript.strip():
        await ws.send_json({
            "type": "result",
            "text": "",
            "message": "No speech detected",
        })
        # Stop time tracking without storing
        if time_entry is not None:
            try:
                await stop_time_tracking(db, time_entry_id=time_entry.id)
            except Exception:
                pass
        try:
            await ws.close()
        except Exception:
            pass
        return

    # --- 7. Forward transcript through Cube 2 pipeline + store ---
    try:
        from app.core.text_pipeline import run_text_pipeline
        from app.cubes.cube3_voice.providers.base import TranscriptionResult
        from app.cubes.cube2_text.service import publish_submission_event
        from app.cubes.cube3_voice.service import store_voice_response

        # Create a synthetic TranscriptionResult
        stt_result = TranscriptionResult(
            transcript=final_transcript,
            confidence=0.85,  # Default for streaming
            language_detected=language_code,
            provider=provider_name,
            audio_duration_sec=0.0,  # Duration tracked via time_entry
        )

        # Shared PII + profanity pipeline
        pipeline = await run_text_pipeline(db, final_transcript, language_code)

        # Task A7: PII gate assertion — only clean_text reaches downstream
        pii_gate_passed = (not pipeline.pii_detected) or (pipeline.clean_text != final_transcript)
        logger.info(
            "cube6.phase_a.pii_safe",
            response_id="realtime",
            input_is_clean_text=pii_gate_passed,
            pii_detected=pipeline.pii_detected,
            source="voice_realtime",
        )

        # Store voice response
        is_anonymous = session.anonymity_mode == "anonymous"
        response_meta = await store_voice_response(
            db,
            session_id=session_id,
            question_id=question_id,
            participant_id=participant_id,
            cycle_id=session.current_cycle,
            audio_bytes=b"",  # No raw audio in streaming mode
            audio_format="pcm",
            transcript=final_transcript,
            stt_result=stt_result,
            is_anonymous=is_anonymous,
            pii_detected=pipeline.pii_detected,
            pii_types=pipeline.pii_types,
            pii_scrubbed_text=pipeline.pii_scrubbed_text,
            profanity_detected=pipeline.profanity_detected,
            profanity_words=pipeline.profanity_words,
            clean_text=pipeline.clean_text,
        )

        # Stop time tracking → tokens (non-fatal on failure)
        heart_earned = 0.0
        unity_earned = 0.0
        if time_entry is not None:
            try:
                time_entry = await stop_time_tracking(db, time_entry_id=time_entry.id)
                heart_earned = time_entry.heart_tokens_earned
                unity_earned = time_entry.unity_tokens_earned
            except Exception as e:
                logger.warning("cube3.realtime.time_tracking.stop_failed", error=str(e))

        # Broadcast event via Supabase
        await publish_submission_event(
            session_id, response_meta.id,
            language_code, len(final_transcript),
        )

        # Send final result with tokens to client
        await ws.send_json({
            "type": "result",
            "response_id": str(response_meta.id),
            "transcript": final_transcript,
            "clean_text": pipeline.clean_text,
            "pii_detected": pipeline.pii_detected,
            "profanity_detected": pipeline.profanity_detected,
            "stt_provider": provider_name,
            "\u2661": heart_earned,  # ♡
            "\u25ec": unity_earned,  # ◬
        })

        logger.info(
            "cube3.realtime.completed",
            session_id=sid,
            response_id=str(response_meta.id),
            provider=provider_name,
            transcript_length=len(final_transcript),
            heart_tokens=heart_earned,
            unity_tokens=unity_earned,
        )

    except Exception as e:
        logger.error("cube3.realtime.store_error", error=str(e))
        await ws.send_json({
            "type": "error",
            "text": f"Failed to store response: {e}",
        })

    try:
        await ws.close()
    except Exception:
        pass
