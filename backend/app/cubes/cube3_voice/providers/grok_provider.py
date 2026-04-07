"""Grok (xAI) STT provider implementation.

xAI Grok uses an OpenAI-compatible API, so this provider wraps the
same Whisper API interface but points to xAI's endpoint.

Pinned to whisper-large-v3 model for reproducibility.
"""

import io
import math

import openai
import structlog

from app.config import settings
from app.cubes.cube3_voice.providers.base import (
    STTProviderError,
    STTProviderName,
    STTProvider,
    TranscriptionResult,
)

logger = structlog.get_logger(__name__)

_GROK_MODEL = "whisper-large-v3"
_GROK_BASE_URL = "https://api.x.ai/v1"

# Grok Whisper supports same languages as OpenAI Whisper
_SUPPORTED_LANGUAGES = {
    "en", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "uk",
    "ja", "zh", "ko", "ar", "hi", "bn", "th", "vi", "id", "ms",
    "tr", "sv", "da", "no", "fi", "el", "cs", "ro", "hu", "he",
    "tl", "sw", "ne",
}

_FORMAT_EXTENSIONS = {
    "webm": "webm", "wav": "wav", "mp3": "mp3",
    "ogg": "ogg", "m4a": "m4a", "flac": "flac",
}


class GrokSTT(STTProvider):
    """xAI Grok STT provider using OpenAI-compatible Whisper API."""

    provider_name = STTProviderName.GROK

    def __init__(self) -> None:
        self._client = openai.AsyncOpenAI(
            api_key=settings.xai_api_key,
            base_url=_GROK_BASE_URL,
        )

    def model_id(self) -> str:
        return _GROK_MODEL

    def supports_language(self, language_code: str) -> bool:
        return language_code.lower().split("-")[0] in _SUPPORTED_LANGUAGES

    async def transcribe(
        self,
        audio_bytes: bytes,
        language_code: str,
        audio_format: str = "webm",
    ) -> TranscriptionResult:
        """Transcribe audio using xAI Grok's OpenAI-compatible Whisper API."""
        ext = _FORMAT_EXTENSIONS.get(audio_format, "webm")
        lang_hint = language_code.lower().split("-")[0]

        try:
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = f"recording.{ext}"

            response = await self._client.audio.transcriptions.create(
                model=_GROK_MODEL,
                file=audio_file,
                language=lang_hint if lang_hint in _SUPPORTED_LANGUAGES else None,
                response_format="verbose_json",
            )

            transcript = response.text or ""
            confidence = self._estimate_confidence(response)
            duration = getattr(response, "duration", 0.0) or 0.0

            logger.info(
                "cube3.grok.transcribed",
                language=lang_hint,
                transcript_length=len(transcript),
                confidence=confidence,
                duration_sec=duration,
            )

            from app.cubes.cube3_voice.providers.base import compute_stt_cost

            return TranscriptionResult(
                transcript=transcript,
                confidence=confidence,
                language_detected=getattr(response, "language", lang_hint) or lang_hint,
                provider="grok",
                audio_duration_sec=duration,
                cost_usd=compute_stt_cost("grok", duration),
            )

        except openai.APIError as e:
            logger.error("cube3.grok.api_error", error=str(e))
            raise STTProviderError("grok", f"API error: {e}") from e
        except Exception as e:
            logger.error("cube3.grok.error", error=str(e))
            raise STTProviderError("grok", str(e)) from e

    @staticmethod
    def _estimate_confidence(response) -> float:
        """Estimate confidence from verbose_json segments."""
        segments = getattr(response, "segments", None)
        if not segments:
            return 0.8
        total_logprob = sum(
            getattr(seg, "avg_logprob", -0.3) for seg in segments
        )
        avg_logprob = total_logprob / len(segments)
        confidence = min(1.0, max(0.0, math.exp(avg_logprob)))
        return round(confidence, 4)
