"""Google Gemini STT provider implementation.

Uses Gemini's multimodal capabilities to transcribe audio input.
Gemini accepts audio directly as input and can produce text transcription.

Pinned to gemini-2.5-flash model for reproducibility and speed.
"""

import base64
import io

import structlog

from app.config import settings
from app.cubes.cube3_voice.providers.base import (
    STTProviderError,
    STTProviderName,
    STTProvider,
    TranscriptionResult,
)

logger = structlog.get_logger(__name__)

_GEMINI_MODEL = "gemini-2.5-flash"

# Gemini supports transcription for all major languages
_SUPPORTED_LANGUAGES = {
    "en", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "uk",
    "ja", "zh", "ko", "ar", "hi", "bn", "th", "vi", "id", "ms",
    "tr", "sv", "da", "no", "fi", "el", "cs", "ro", "hu", "he",
    "tl", "sw", "ne",
}

# MIME types for audio formats
_FORMAT_MIME = {
    "webm": "audio/webm",
    "wav": "audio/wav",
    "mp3": "audio/mpeg",
    "ogg": "audio/ogg",
    "m4a": "audio/mp4",
    "flac": "audio/flac",
}


class GeminiSTT(STTProvider):
    """Google Gemini STT provider using multimodal audio transcription."""

    provider_name = STTProviderName.GEMINI

    def __init__(self) -> None:
        from google import genai
        self._client = genai.Client(api_key=settings.gemini_api_key)

    def model_id(self) -> str:
        return _GEMINI_MODEL

    def supports_language(self, language_code: str) -> bool:
        return language_code.lower().split("-")[0] in _SUPPORTED_LANGUAGES

    async def transcribe(
        self,
        audio_bytes: bytes,
        language_code: str,
        audio_format: str = "webm",
    ) -> TranscriptionResult:
        """Transcribe audio using Gemini multimodal input.

        Sends audio as inline data with a transcription prompt.
        Gemini processes audio natively and returns text.
        """
        from google import genai
        from google.genai import types

        mime_type = _FORMAT_MIME.get(audio_format, "audio/webm")
        lang_hint = language_code.lower().split("-")[0]

        try:
            # Build prompt with language context
            prompt = (
                f"Transcribe the following audio accurately. "
                f"The speaker is using {lang_hint} language. "
                f"Return ONLY the transcribed text, nothing else."
            )

            response = await self._client.aio.models.generate_content(
                model=_GEMINI_MODEL,
                contents=[
                    types.Content(parts=[
                        types.Part(
                            inline_data=types.Blob(
                                mime_type=mime_type,
                                data=audio_bytes,
                            )
                        ),
                        types.Part(text=prompt),
                    ]),
                ],
                config=types.GenerateContentConfig(
                    temperature=0.0,
                ),
            )

            transcript = response.text.strip() if response.text else ""

            # Gemini doesn't provide native STT confidence; estimate from response
            confidence = 0.85 if transcript else 0.0

            # Estimate audio duration from file size (rough: ~16kbps for webm)
            bytes_per_sec = {
                "webm": 2000, "wav": 32000, "mp3": 16000,
                "ogg": 2000, "m4a": 16000, "flac": 44100,
            }
            bps = bytes_per_sec.get(audio_format, 2000)
            estimated_duration = len(audio_bytes) / bps if bps > 0 else 0.0

            logger.info(
                "cube3.gemini.transcribed",
                language=lang_hint,
                transcript_length=len(transcript),
                confidence=confidence,
                estimated_duration_sec=estimated_duration,
            )

            from app.cubes.cube3_voice.providers.base import compute_stt_cost

            duration = round(estimated_duration, 2)
            return TranscriptionResult(
                transcript=transcript,
                confidence=confidence,
                language_detected=lang_hint,
                provider="gemini",
                audio_duration_sec=duration,
                cost_usd=compute_stt_cost("gemini", duration),
            )

        except Exception as e:
            logger.error("cube3.gemini.error", error=str(e))
            raise STTProviderError("gemini", str(e)) from e
