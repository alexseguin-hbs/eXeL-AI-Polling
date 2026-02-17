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
from motor.motor_asyncio import AsyncIOMotorDatabase
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.cubes.cube3_voice.providers.azure_realtime import (
    AzureRealtimeSTT,
    RealtimeEvent,
)
from app.cubes.cube3_voice.providers.aws_realtime import AWSRealtimeSTT

logger = structlog.get_logger(__name__)


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
    mongo: AsyncIOMotorDatabase,
    redis: Redis,
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

    try:
        stt = AzureRealtimeSTT(language_code=language_code, session_id=sid)
        await stt.start()
        provider_name = "azure"
    except Exception as e:
        logger.warning("cube3.realtime.azure_failed", error=str(e))
        # Circuit breaker: fallback to AWS
        try:
            stt = AWSRealtimeSTT(language_code=language_code, session_id=sid)
            await stt.start()
            provider_name = "aws"
        except Exception as e2:
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

    # --- 4. Start Cube 5 time tracking ---
    from app.cubes.cube5_gateway.service import start_time_tracking, stop_time_tracking

    time_entry = await start_time_tracking(
        db,
        session_id=session_id,
        participant_id=participant_id,
        action_type="voice_responding",
        reference_id=str(question_id),
        cube_id="cube3",
    )

    # --- 5. Stream audio → STT → client (concurrent tasks) ---
    final_transcript = ""

    async def _forward_events():
        """Forward STT events to WebSocket client."""
        async for event in stt.events():
            try:
                await _send_event(ws, event)
            except Exception:
                break

    event_task = asyncio.create_task(_forward_events())

    try:
        while True:
            message = await ws.receive()

            if message.get("type") == "websocket.disconnect":
                break

            if "bytes" in message and message["bytes"]:
                # Binary frame: audio chunk
                if isinstance(stt, AzureRealtimeSTT):
                    stt.push_audio(message["bytes"])
                else:
                    await stt.push_audio(message["bytes"])

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
    final_transcript = await stt.stop()
    event_task.cancel()

    if not final_transcript.strip():
        await ws.send_json({
            "type": "result",
            "text": "",
            "message": "No speech detected",
        })
        # Stop time tracking without storing
        await stop_time_tracking(db, time_entry_id=time_entry.id)
        try:
            await ws.close()
        except Exception:
            pass
        return

    # --- 7. Forward transcript through Cube 2 pipeline + store ---
    try:
        from app.cubes.cube3_voice.providers.base import TranscriptionResult
        from app.cubes.cube2_text.service import (
            detect_pii, scrub_pii,
            detect_profanity, scrub_profanity,
            publish_submission_event,
        )
        from app.cubes.cube3_voice.service import store_voice_response

        # Create a synthetic TranscriptionResult
        stt_result = TranscriptionResult(
            transcript=final_transcript,
            confidence=0.85,  # Default for streaming
            language_detected=language_code,
            provider=provider_name,
            audio_duration_sec=0.0,  # Duration tracked via time_entry
        )

        # PII + profanity pipeline
        pii_detections = await detect_pii(final_transcript)
        pii_detected = len(pii_detections) > 0
        pii_scrubbed = scrub_pii(final_transcript, pii_detections) if pii_detected else final_transcript
        pii_types_safe = [
            {"type": d["type"], "start": d["start"], "end": d["end"]}
            for d in pii_detections
        ] if pii_detected else None

        profanity_matches = await detect_profanity(db, pii_scrubbed, language_code)
        profanity_detected = len(profanity_matches) > 0
        clean_text = scrub_profanity(pii_scrubbed, profanity_matches) if profanity_detected else pii_scrubbed
        profanity_words_safe = [
            {"word": m["word"], "severity": m["severity"], "position": m["position"]}
            for m in profanity_matches
        ] if profanity_detected else None

        # Store voice response
        is_anonymous = session.anonymity_mode == "anonymous"
        response_meta = await store_voice_response(
            db, mongo,
            session_id=session_id,
            question_id=question_id,
            participant_id=participant_id,
            cycle_id=session.current_cycle,
            audio_bytes=b"",  # No raw audio in streaming mode
            audio_format="pcm",
            transcript=final_transcript,
            stt_result=stt_result,
            is_anonymous=is_anonymous,
            pii_detected=pii_detected,
            pii_types=pii_types_safe,
            pii_scrubbed_text=pii_scrubbed if pii_detected else None,
            profanity_detected=profanity_detected,
            profanity_words=profanity_words_safe,
            clean_text=clean_text,
        )

        # Stop time tracking → tokens
        time_entry = await stop_time_tracking(db, time_entry_id=time_entry.id)

        # Publish Redis event
        await publish_submission_event(
            redis, session_id, response_meta.id,
            language_code, len(final_transcript),
        )

        # Send final result with tokens to client
        await ws.send_json({
            "type": "result",
            "response_id": str(response_meta.id),
            "transcript": final_transcript,
            "clean_text": clean_text,
            "pii_detected": pii_detected,
            "profanity_detected": profanity_detected,
            "stt_provider": provider_name,
            "\u2661": time_entry.si_tokens_earned,  # ♡
            "\u25ec": time_entry.ai_tokens_earned,  # ◬
        })

        logger.info(
            "cube3.realtime.completed",
            session_id=sid,
            response_id=str(response_meta.id),
            provider=provider_name,
            transcript_length=len(final_transcript),
            si_tokens=time_entry.si_tokens_earned,
            ai_tokens=time_entry.ai_tokens_earned,
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
