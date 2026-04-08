"""OpenAI Whisper STT provider implementation.

Uses the OpenAI Whisper API (whisper-1 model) for transcription.
Supports all 33 languages in the system via language hinting.
Pinned to whisper-1 model for reproducibility.

Audio is sent as a file-like object to the API — supports webm, wav, mp3, ogg.
"""

import asyncio
import io

import openai
import structlog

from app.config import settings
from app.cubes.cube3_voice.providers.base import (
    AUDIO_FORMAT_EXTENSIONS,
    SUPPORTED_LANGUAGE_CODES,
    STTProviderError,
    STTProviderName,
    STTProvider,
    TranscriptionResult,
    normalize_language_code,
)

logger = structlog.get_logger(__name__)

_WHISPER_MODEL = "whisper-1"


class WhisperSTT(STTProvider):
    """OpenAI Whisper STT provider using whisper-1 model."""

    provider_name = STTProviderName.WHISPER

    def __init__(self) -> None:
        self._client = openai.AsyncOpenAI(api_key=settings.openai_api_key)

    def model_id(self) -> str:
        return _WHISPER_MODEL

    def supports_language(self, language_code: str) -> bool:
        return normalize_language_code(language_code) in SUPPORTED_LANGUAGE_CODES

    async def transcribe(
        self,
        audio_bytes: bytes,
        language_code: str,
        audio_format: str = "webm",
    ) -> TranscriptionResult:
        """Transcribe audio using OpenAI Whisper API.

        Sends audio as file upload, returns verbose JSON for confidence scoring.
        """
        ext = AUDIO_FORMAT_EXTENSIONS.get(audio_format, "webm")
        lang_hint = normalize_language_code(language_code)

        try:
            # Create file-like object for the API
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = f"recording.{ext}"

            response = await self._client.audio.transcriptions.create(
                model=_WHISPER_MODEL,
                file=audio_file,
                language=lang_hint if lang_hint in SUPPORTED_LANGUAGE_CODES else None,
                response_format="verbose_json",
            )

            transcript = response.text or ""
            # Whisper verbose_json includes segments with avg_logprob
            # Convert log probability to approximate confidence
            confidence = self._estimate_confidence(response)
            duration = getattr(response, "duration", 0.0) or 0.0

            logger.info(
                "cube3.whisper.transcribed",
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
                provider="whisper",
                audio_duration_sec=duration,
                cost_usd=compute_stt_cost("whisper", duration),
            )

        except openai.APIError as e:
            logger.error("cube3.whisper.api_error", error=str(e))
            raise STTProviderError("whisper", f"API error: {e}") from e
        except Exception as e:
            logger.error("cube3.whisper.error", error=str(e))
            raise STTProviderError("whisper", str(e)) from e

    @staticmethod
    def _estimate_confidence(response) -> float:
        """Estimate confidence from Whisper verbose_json response.

        Uses average log probability from segments. Whisper returns
        avg_logprob per segment; convert to 0.0–1.0 confidence scale.

        Log probs range roughly from -1.0 (low) to 0.0 (high).
        We map: 0.0 logprob → 1.0 confidence, -1.0 → ~0.37 (exp(-1)).
        """
        segments = getattr(response, "segments", None)
        if not segments:
            return 0.8  # Default confidence if no segments available

        import math
        total_logprob = sum(
            getattr(seg, "avg_logprob", -0.3) for seg in segments
        )
        avg_logprob = total_logprob / len(segments)
        # exp(logprob) gives probability; clamp to [0.0, 1.0]
        confidence = min(1.0, max(0.0, math.exp(avg_logprob)))
        return round(confidence, 4)
