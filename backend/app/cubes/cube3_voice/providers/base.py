"""Abstract base class for Speech-to-Text provider abstraction layer.

Mirrors Cube 6's AI provider pattern (base.py / factory.py / implementation).

Batch providers: OpenAI Whisper, Grok (xAI), Gemini (Google)
Real-time providers: Azure Speech Services (primary), AWS Transcribe (fallback)
User selects batch STT provider at session creation (same selector as AI provider).
Real-time STT is a paid feature (Azure primary, AWS circuit breaker fallback).
Extensible: add more providers by implementing the STTProvider interface.

Each provider must:
  - Accept raw audio bytes + language hint
  - Return transcript text + confidence score
  - Declare which languages it supports
  - Handle provider-specific errors internally
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class STTProviderName(str, Enum):
    """Supported STT providers. Extensible — add new entries as providers are implemented."""

    WHISPER = "whisper"    # OpenAI Whisper API (openai)
    GROK = "grok"          # xAI Grok — uses OpenAI-compatible Whisper API
    GEMINI = "gemini"      # Google Gemini multimodal (audio input)
    AWS = "aws"            # AWS Transcribe batch API (boto3)


@dataclass
class TranscriptionResult:
    """Standardized result from any STT provider."""

    transcript: str
    confidence: float  # 0.0–1.0
    language_detected: str  # ISO language code detected/confirmed by provider
    provider: str  # Provider name that produced this result
    audio_duration_sec: float  # Duration of processed audio
    cost_usd: float = 0.0  # Estimated cost of this transcription call


# Per-provider cost rates (USD per minute of audio)
# Source: provider pricing pages as of 2026-04
STT_COST_RATES: dict[str, float] = {
    "whisper": 0.006,    # OpenAI Whisper: $0.006/min
    "grok": 0.006,       # xAI Grok (Whisper-compatible): $0.006/min
    "gemini": 0.00016,   # Google Gemini Flash: $0.00016/min
    "aws": 0.024,        # AWS Transcribe: $0.024/min
}


def compute_stt_cost(provider: str, duration_sec: float) -> float:
    """Compute estimated cost for an STT call based on provider rate and audio duration."""
    rate = STT_COST_RATES.get(provider, 0.0)
    return round(rate * (duration_sec / 60.0), 6)


class STTProvider(ABC):
    """Abstract interface for speech-to-text transcription.

    Implementations must handle audio in common web formats (webm, wav, mp3, ogg).
    Must support language hinting for improved accuracy across 33 languages.
    """

    provider_name: STTProviderName

    @abstractmethod
    async def transcribe(
        self,
        audio_bytes: bytes,
        language_code: str,
        audio_format: str = "webm",
    ) -> TranscriptionResult:
        """Transcribe audio bytes to text.

        Args:
            audio_bytes: Raw audio data from browser recording.
            language_code: ISO language hint (e.g., "en", "es", "ja").
            audio_format: Audio container format (webm, wav, mp3, ogg).

        Returns:
            TranscriptionResult with transcript, confidence, and metadata.

        Raises:
            STTProviderError: On transcription failure.
        """
        ...

    @abstractmethod
    def supports_language(self, language_code: str) -> bool:
        """Check if this provider supports a specific language."""
        ...

    @abstractmethod
    def model_id(self) -> str:
        """Return the pinned model identifier for reproducibility tracking."""
        ...


class STTProviderError(Exception):
    """Raised when an STT provider fails to transcribe."""

    def __init__(self, provider: str, message: str):
        self.provider = provider
        self.message = message
        super().__init__(f"[{provider}] {message}")
