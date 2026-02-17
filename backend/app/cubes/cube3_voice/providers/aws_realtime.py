"""AWS Transcribe Streaming — Real-time streaming STT provider (fallback).

Fallback provider when Azure is unavailable. Uses AWS Transcribe
Streaming API via boto3/aiobotocore for real-time word-by-word results.

Features:
  - ~300ms latency for interim (partial) results
  - Word-level interim results for live display
  - 30+ language support
  - Circuit breaker fallback from Azure

This is a PAID feature — requires active session with is_paid=True.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Any

import structlog

from app.config import settings
from app.cubes.cube3_voice.providers.azure_realtime import RealtimeEvent, RealtimeWord

logger = structlog.get_logger(__name__)

# AWS Transcribe language codes for system languages
_AWS_LANGUAGE_MAP: dict[str, str] = {
    "en": "en-US", "es": "es-US", "fr": "fr-FR", "de": "de-DE",
    "it": "it-IT", "pt": "pt-BR", "nl": "nl-NL", "pl": "pl-PL",
    "ru": "ru-RU", "uk": "uk-UA", "ja": "ja-JP", "zh": "zh-CN",
    "ko": "ko-KR", "ar": "ar-SA", "hi": "hi-IN", "th": "th-TH",
    "vi": "vi-VN", "id": "id-ID", "ms": "ms-MY", "tr": "tr-TR",
    "sv": "sv-SE", "da": "da-DK", "he": "he-IL",
}


class AWSRealtimeSTT:
    """AWS Transcribe Streaming real-time transcription (fallback).

    Usage:
        stt = AWSRealtimeSTT(language_code="en")
        await stt.start()
        await stt.push_audio(chunk_bytes)
        async for event in stt.events():
            ...
        final_text = await stt.stop()
    """

    def __init__(self, language_code: str = "en", session_id: str = ""):
        self._language = language_code
        self._session_id = session_id
        self._event_queue: asyncio.Queue[RealtimeEvent] = asyncio.Queue()
        self._running = False
        self._final_text_parts: list[str] = []
        self._audio_queue: asyncio.Queue[bytes | None] = asyncio.Queue()
        self._stream_task: asyncio.Task | None = None

    @property
    def aws_language(self) -> str:
        lang = self._language.lower().split("-")[0]
        return _AWS_LANGUAGE_MAP.get(lang, "en-US")

    async def start(self) -> None:
        """Start AWS Transcribe Streaming session."""
        if not settings.aws_access_key_id:
            raise RuntimeError("AWS credentials not configured")

        self._running = True
        self._stream_task = asyncio.create_task(self._run_stream())

        await self._event_queue.put(RealtimeEvent(
            event_type="started",
            language=self.aws_language,
        ))

        logger.info(
            "cube3.aws_realtime.started",
            language=self.aws_language,
            session_id=self._session_id,
        )

    async def push_audio(self, audio_chunk: bytes) -> None:
        """Push audio chunk to the streaming queue."""
        if self._running:
            await self._audio_queue.put(audio_chunk)

    async def stop(self) -> str:
        """Stop streaming and return full final transcript."""
        self._running = False
        await self._audio_queue.put(None)  # Signal end of stream

        if self._stream_task:
            try:
                await asyncio.wait_for(self._stream_task, timeout=5.0)
            except asyncio.TimeoutError:
                self._stream_task.cancel()

        final = " ".join(self._final_text_parts)
        await self._event_queue.put(RealtimeEvent(
            event_type="stopped",
            text=final,
            is_final=True,
        ))

        logger.info(
            "cube3.aws_realtime.stopped",
            session_id=self._session_id,
            final_parts=len(self._final_text_parts),
        )
        return final

    async def events(self) -> AsyncGenerator[RealtimeEvent, None]:
        """Async generator yielding transcription events."""
        while self._running or not self._event_queue.empty():
            try:
                event = await asyncio.wait_for(
                    self._event_queue.get(), timeout=0.5,
                )
                yield event
                if event.event_type == "stopped":
                    break
            except asyncio.TimeoutError:
                continue

    async def _run_stream(self) -> None:
        """Run the AWS Transcribe streaming session in background."""
        try:
            import boto3

            client = boto3.client(
                "transcribe",
                region_name=settings.aws_region,
                aws_access_key_id=settings.aws_access_key_id,
                aws_secret_access_key=settings.aws_secret_access_key,
            )

            # Use start_stream_transcription for real-time
            response = client.start_stream_transcription(
                LanguageCode=self.aws_language,
                MediaSampleRateHertz=16000,
                MediaEncoding="pcm",
            )

            stream = response["TranscriptResultStream"]

            # Feed audio in a separate coroutine
            async def _feed_audio():
                while self._running:
                    try:
                        chunk = await asyncio.wait_for(
                            self._audio_queue.get(), timeout=0.1,
                        )
                        if chunk is None:
                            break
                        # AWS SDK expects synchronous write
                        await asyncio.to_thread(
                            response["AudioStream"].send_audio_event,
                            audio_chunk=chunk,
                        )
                    except asyncio.TimeoutError:
                        continue

            feed_task = asyncio.create_task(_feed_audio())

            # Process results
            for event in stream:
                if not self._running:
                    break
                transcript_event = event.get("TranscriptEvent", {})
                results = transcript_event.get("Transcript", {}).get("Results", [])

                for result in results:
                    is_partial = result.get("IsPartial", True)
                    alternatives = result.get("Alternatives", [])
                    if not alternatives:
                        continue

                    alt = alternatives[0]
                    text = alt.get("Transcript", "")
                    items = alt.get("Items", [])

                    words = [
                        RealtimeWord(
                            text=item.get("Content", ""),
                            offset_ms=int(float(item.get("StartTime", 0)) * 1000),
                            duration_ms=int(
                                (float(item.get("EndTime", 0)) - float(item.get("StartTime", 0))) * 1000
                            ),
                            is_final=not is_partial,
                        )
                        for item in items
                        if item.get("Type") == "pronunciation"
                    ]

                    if is_partial:
                        await self._event_queue.put(RealtimeEvent(
                            event_type="interim",
                            text=text,
                            words=words,
                            is_final=False,
                            language=self.aws_language,
                        ))
                    else:
                        if text:
                            self._final_text_parts.append(text)
                        await self._event_queue.put(RealtimeEvent(
                            event_type="final",
                            text=text,
                            words=words,
                            confidence=float(alt.get("Confidence", 0.85)),
                            is_final=True,
                            language=self.aws_language,
                        ))

            await feed_task

        except Exception as e:
            logger.error("cube3.aws_realtime.error", error=str(e))
            await self._event_queue.put(RealtimeEvent(
                event_type="error",
                text=f"AWS STT error: {e}",
            ))
            self._running = False
