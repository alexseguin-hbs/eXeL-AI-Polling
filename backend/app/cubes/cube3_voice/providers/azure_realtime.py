"""Azure Speech Services — Real-time streaming STT provider.

Primary provider for real-time word-by-word transcription.
Uses Azure Cognitive Services Speech SDK with push audio stream.

Features:
  - ~200ms latency for interim (partial) results
  - Word-level timestamps and word-by-word display
  - 100+ language support (covers all 33 system languages)
  - WebSocket-ready: push audio chunks, receive word events

This is a PAID feature — requires active session with is_paid=True
or cost-splitting enabled. Gated at the WebSocket endpoint level.
"""

from __future__ import annotations

import asyncio
import uuid
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from typing import Any

import structlog

from app.config import settings

logger = structlog.get_logger(__name__)

# Azure Speech SDK language codes for all 33 system languages
_AZURE_LANGUAGE_MAP: dict[str, str] = {
    "en": "en-US", "es": "es-ES", "fr": "fr-FR", "de": "de-DE",
    "it": "it-IT", "pt": "pt-BR", "nl": "nl-NL", "pl": "pl-PL",
    "ru": "ru-RU", "uk": "uk-UA", "ja": "ja-JP", "zh": "zh-CN",
    "ko": "ko-KR", "ar": "ar-SA", "hi": "hi-IN", "bn": "bn-IN",
    "th": "th-TH", "vi": "vi-VN", "id": "id-ID", "ms": "ms-MY",
    "tr": "tr-TR", "sv": "sv-SE", "da": "da-DK", "no": "nb-NO",
    "fi": "fi-FI", "el": "el-GR", "cs": "cs-CZ", "ro": "ro-RO",
    "hu": "hu-HU", "he": "he-IL", "tl": "fil-PH", "sw": "sw-KE",
    "ne": "ne-NP",
}


@dataclass
class RealtimeWord:
    """A single word from real-time transcription."""
    text: str
    offset_ms: int = 0
    duration_ms: int = 0
    is_final: bool = False


@dataclass
class RealtimeEvent:
    """Event emitted during real-time transcription."""
    event_type: str  # "interim" | "final" | "error" | "started" | "stopped"
    text: str = ""
    words: list[RealtimeWord] = field(default_factory=list)
    confidence: float = 0.0
    language: str = ""
    is_final: bool = False


class AzureRealtimeSTT:
    """Azure Speech Services real-time streaming transcription.

    Usage:
        stt = AzureRealtimeSTT(language_code="en")
        await stt.start()
        # Push audio chunks as they arrive from WebSocket
        stt.push_audio(chunk_bytes)
        # Iterate over events
        async for event in stt.events():
            if event.event_type == "interim":
                # Word-by-word partial result
            elif event.event_type == "final":
                # Completed sentence/utterance
        await stt.stop()
    """

    def __init__(self, language_code: str = "en", session_id: str = ""):
        self._language = language_code
        self._session_id = session_id
        self._event_queue: asyncio.Queue[RealtimeEvent] = asyncio.Queue()
        self._recognizer: Any = None
        self._stream: Any = None
        self._running = False
        self._final_text_parts: list[str] = []

    @property
    def azure_language(self) -> str:
        lang = self._language.lower().split("-")[0]
        return _AZURE_LANGUAGE_MAP.get(lang, "en-US")

    async def start(self) -> None:
        """Initialize Azure Speech SDK and start continuous recognition."""
        import azure.cognitiveservices.speech as speechsdk

        if not settings.azure_speech_key:
            raise RuntimeError("Azure Speech key not configured")

        speech_config = speechsdk.SpeechConfig(
            subscription=settings.azure_speech_key,
            region=settings.azure_speech_region,
        )
        speech_config.speech_recognition_language = self.azure_language
        speech_config.set_property(
            speechsdk.PropertyId.SpeechServiceResponse_RequestWordLevelTimestamps,
            "true",
        )

        # Push stream for feeding audio chunks
        self._stream = speechsdk.audio.PushAudioInputStream()
        audio_config = speechsdk.audio.AudioConfig(stream=self._stream)

        self._recognizer = speechsdk.SpeechRecognizer(
            speech_config=speech_config,
            audio_config=audio_config,
        )

        # Wire up event handlers
        self._recognizer.recognizing.connect(self._on_recognizing)
        self._recognizer.recognized.connect(self._on_recognized)
        self._recognizer.canceled.connect(self._on_canceled)
        self._recognizer.session_started.connect(self._on_session_started)
        self._recognizer.session_stopped.connect(self._on_session_stopped)

        # Start continuous recognition in background
        self._recognizer.start_continuous_recognition_async()
        self._running = True

        await self._event_queue.put(RealtimeEvent(
            event_type="started",
            language=self.azure_language,
        ))

        logger.info(
            "cube3.azure_realtime.started",
            language=self.azure_language,
            session_id=self._session_id,
        )

    def push_audio(self, audio_chunk: bytes) -> None:
        """Push raw audio bytes (PCM 16-bit, 16kHz mono) to the recognition stream."""
        if self._stream and self._running:
            self._stream.write(audio_chunk)

    async def stop(self) -> str:
        """Stop recognition and return the full final transcript."""
        if self._recognizer and self._running:
            self._running = False
            if self._stream:
                self._stream.close()
            self._recognizer.stop_continuous_recognition_async()

            await self._event_queue.put(RealtimeEvent(
                event_type="stopped",
                text=" ".join(self._final_text_parts),
                is_final=True,
            ))

        logger.info(
            "cube3.azure_realtime.stopped",
            session_id=self._session_id,
            final_parts=len(self._final_text_parts),
        )
        return " ".join(self._final_text_parts)

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

    # --- Azure SDK Callbacks (run in SDK thread, put events on async queue) ---

    def _on_recognizing(self, evt: Any) -> None:
        """Interim (partial) result — words appearing as spoken."""
        words = self._extract_words(evt.result, is_final=False)
        event = RealtimeEvent(
            event_type="interim",
            text=evt.result.text,
            words=words,
            is_final=False,
            language=self.azure_language,
        )
        self._event_queue.put_nowait(event)

    def _on_recognized(self, evt: Any) -> None:
        """Final result — complete utterance."""
        if evt.result.text:
            self._final_text_parts.append(evt.result.text)
            words = self._extract_words(evt.result, is_final=True)
            event = RealtimeEvent(
                event_type="final",
                text=evt.result.text,
                words=words,
                confidence=self._extract_confidence(evt.result),
                is_final=True,
                language=self.azure_language,
            )
            self._event_queue.put_nowait(event)

    def _on_canceled(self, evt: Any) -> None:
        """Recognition canceled or errored."""
        import azure.cognitiveservices.speech as speechsdk
        reason = evt.cancellation_details.reason
        if reason == speechsdk.CancellationReason.Error:
            error_msg = evt.cancellation_details.error_details
            logger.error("cube3.azure_realtime.error", error=error_msg)
            self._event_queue.put_nowait(RealtimeEvent(
                event_type="error",
                text=f"STT error: {error_msg}",
            ))
        self._running = False

    def _on_session_started(self, evt: Any) -> None:
        logger.debug("cube3.azure_realtime.sdk_session_started")

    def _on_session_stopped(self, evt: Any) -> None:
        logger.debug("cube3.azure_realtime.sdk_session_stopped")
        self._running = False

    @staticmethod
    def _extract_words(result: Any, is_final: bool) -> list[RealtimeWord]:
        """Extract word-level data from Azure result."""
        words = []
        try:
            import json
            details = result.properties.get(
                "SpeechServiceResponse_JsonResult", ""
            )
            if details:
                parsed = json.loads(details)
                for nb in parsed.get("NBest", [{}])[:1]:
                    for w in nb.get("Words", []):
                        words.append(RealtimeWord(
                            text=w.get("Word", ""),
                            offset_ms=w.get("Offset", 0) // 10000,
                            duration_ms=w.get("Duration", 0) // 10000,
                            is_final=is_final,
                        ))
        except Exception:
            # Fallback: split text into words
            for word in (result.text or "").split():
                words.append(RealtimeWord(text=word, is_final=is_final))
        return words

    @staticmethod
    def _extract_confidence(result: Any) -> float:
        """Extract confidence from Azure result."""
        try:
            import json
            details = result.properties.get(
                "SpeechServiceResponse_JsonResult", ""
            )
            if details:
                parsed = json.loads(details)
                nbest = parsed.get("NBest", [{}])
                if nbest:
                    return round(nbest[0].get("Confidence", 0.85), 4)
        except Exception:
            pass
        return 0.85
