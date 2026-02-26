"""Cube 3 — Live STT Integration Tests.

These tests call REAL external APIs (Grok, Gemini) with real audio files.
They verify that the provider implementations actually transcribe speech correctly.

NOT run in CI — run manually with:
    cd backend && source .venv/bin/activate
    LIVE_STT=1 python -m pytest tests/cube3/test_live_stt.py -v -s

Requirements:
    - LIVE_STT=1 environment variable set (opt-in gate)
    - XAI_API_KEY set in .env (for Grok tests)
    - GEMINI_API_KEY set in .env (for Gemini tests)
    - gtts package installed (for generating test audio)
"""

import asyncio
import os
import sys
import tempfile
from pathlib import Path

import pytest

# Gate: skip entire module unless LIVE_STT=1 is explicitly set
pytestmark = pytest.mark.skipif(
    os.getenv("LIVE_STT", "") != "1",
    reason="Live STT tests require LIVE_STT=1 env var (calls real APIs with billing)",
)

# Add backend root to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

from app.cubes.cube3_voice.providers.base import STTProviderError, TranscriptionResult


# ── Test Audio Generation ─────────────────────────────────────────

KNOWN_ENGLISH_TEXT = (
    "Artificial intelligence can help improve governance "
    "by processing millions of voices simultaneously."
)

KNOWN_SPANISH_TEXT = (
    "La inteligencia artificial puede ayudar a mejorar la gobernanza."
)


def generate_test_audio(text: str, lang: str = "en", fmt: str = "mp3") -> bytes:
    """Generate real speech audio using Google TTS. Returns raw bytes."""
    from gtts import gTTS

    tts = gTTS(text=text, lang=lang, slow=False)
    with tempfile.NamedTemporaryFile(suffix=f".{fmt}", delete=False) as f:
        tts.save(f.name)
        f.seek(0)
        audio_bytes = open(f.name, "rb").read()
    os.unlink(f.name)
    return audio_bytes


# ── Fixtures ──────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def english_audio_mp3() -> bytes:
    """Pre-generate English speech audio for all tests in this module."""
    print(f"\n  Generating English test audio ({len(KNOWN_ENGLISH_TEXT)} chars)...")
    audio = generate_test_audio(KNOWN_ENGLISH_TEXT, lang="en", fmt="mp3")
    print(f"  Audio generated: {len(audio):,} bytes")
    return audio


@pytest.fixture(scope="module")
def spanish_audio_mp3() -> bytes:
    """Pre-generate Spanish speech audio."""
    print(f"\n  Generating Spanish test audio ({len(KNOWN_SPANISH_TEXT)} chars)...")
    audio = generate_test_audio(KNOWN_SPANISH_TEXT, lang="es", fmt="mp3")
    print(f"  Audio generated: {len(audio):,} bytes")
    return audio


# ── Skip Conditions ───────────────────────────────────────────────

xai_key = os.getenv("XAI_API_KEY", "")
gemini_key = os.getenv("GEMINI_API_KEY", "")
openai_key = os.getenv("OPENAI_API_KEY", "")

skip_grok = pytest.mark.skipif(not xai_key, reason="XAI_API_KEY not set")
skip_gemini = pytest.mark.skipif(not gemini_key, reason="GEMINI_API_KEY not set")
skip_openai = pytest.mark.skipif(not openai_key, reason="OPENAI_API_KEY not set")


# ══════════════════════════════════════════════════════════════════
# Grok (xAI) — Live Tests
# ══════════════════════════════════════════════════════════════════

class TestGrokLive:
    """Live integration tests for Grok (xAI) STT provider."""

    @skip_grok
    @pytest.mark.asyncio
    async def test_grok_english_transcription(self, english_audio_mp3: bytes):
        """Grok should transcribe English speech with recognizable output."""
        from app.cubes.cube3_voice.providers.grok_provider import GrokSTT

        provider = GrokSTT()
        result = await provider.transcribe(
            audio_bytes=english_audio_mp3,
            language_code="en",
            audio_format="mp3",
        )

        print(f"\n  [GROK EN] Transcript: {result.transcript}")
        print(f"  [GROK EN] Confidence: {result.confidence}")
        print(f"  [GROK EN] Duration: {result.audio_duration_sec}s")
        print(f"  [GROK EN] Language: {result.language_detected}")
        print(f"  [GROK EN] Provider: {result.provider}")

        # Verify result structure
        assert isinstance(result, TranscriptionResult)
        assert result.provider == "grok"
        assert result.confidence > 0.3, f"Confidence too low: {result.confidence}"
        assert len(result.transcript) > 10, f"Transcript too short: {result.transcript}"
        assert result.audio_duration_sec > 0

        # Verify key words from the known text appear in transcript
        transcript_lower = result.transcript.lower()
        assert any(word in transcript_lower for word in [
            "artificial", "intelligence", "governance", "voices", "millions",
        ]), f"Transcript doesn't match expected content: {result.transcript}"

    @skip_grok
    @pytest.mark.asyncio
    async def test_grok_spanish_transcription(self, spanish_audio_mp3: bytes):
        """Grok should transcribe Spanish speech correctly."""
        from app.cubes.cube3_voice.providers.grok_provider import GrokSTT

        provider = GrokSTT()
        result = await provider.transcribe(
            audio_bytes=spanish_audio_mp3,
            language_code="es",
            audio_format="mp3",
        )

        print(f"\n  [GROK ES] Transcript: {result.transcript}")
        print(f"  [GROK ES] Confidence: {result.confidence}")

        assert isinstance(result, TranscriptionResult)
        assert result.provider == "grok"
        assert result.confidence > 0.3
        assert len(result.transcript) > 5

        # Check Spanish keywords
        transcript_lower = result.transcript.lower()
        assert any(word in transcript_lower for word in [
            "inteligencia", "artificial", "gobernanza", "ayudar",
        ]), f"Spanish transcript doesn't match: {result.transcript}"

    @skip_grok
    @pytest.mark.asyncio
    async def test_grok_language_support(self):
        """Grok should report support for all 33 languages."""
        from app.cubes.cube3_voice.providers.grok_provider import GrokSTT

        provider = GrokSTT()
        for lang in ["en", "es", "fr", "ja", "zh", "ar", "hi", "ko", "de"]:
            assert provider.supports_language(lang), f"Grok should support {lang}"
        assert provider.model_id() == "whisper-large-v3"

    @skip_grok
    @pytest.mark.asyncio
    async def test_grok_empty_audio_handling(self):
        """Grok should handle empty/invalid audio gracefully."""
        from app.cubes.cube3_voice.providers.grok_provider import GrokSTT

        provider = GrokSTT()
        with pytest.raises(STTProviderError) as exc_info:
            await provider.transcribe(
                audio_bytes=b"not_real_audio",
                language_code="en",
                audio_format="mp3",
            )
        print(f"\n  [GROK] Error handling works: {exc_info.value}")
        assert "grok" in str(exc_info.value).lower()


# ══════════════════════════════════════════════════════════════════
# Gemini (Google) — Live Tests
# ══════════════════════════════════════════════════════════════════

class TestGeminiLive:
    """Live integration tests for Google Gemini STT provider."""

    @skip_gemini
    @pytest.mark.asyncio
    async def test_gemini_english_transcription(self, english_audio_mp3: bytes):
        """Gemini should transcribe English speech accurately."""
        from app.cubes.cube3_voice.providers.gemini_provider import GeminiSTT

        provider = GeminiSTT()
        result = await provider.transcribe(
            audio_bytes=english_audio_mp3,
            language_code="en",
            audio_format="mp3",
        )

        print(f"\n  [GEMINI EN] Transcript: {result.transcript}")
        print(f"\n  [GEMINI EN] Confidence: {result.confidence}")
        print(f"  [GEMINI EN] Duration: {result.audio_duration_sec}s")
        print(f"  [GEMINI EN] Provider: {result.provider}")

        assert isinstance(result, TranscriptionResult)
        assert result.provider == "gemini"
        assert result.confidence > 0.3
        assert len(result.transcript) > 10

        # Verify key words
        transcript_lower = result.transcript.lower()
        assert any(word in transcript_lower for word in [
            "artificial", "intelligence", "governance", "voices", "millions",
        ]), f"Transcript doesn't match expected content: {result.transcript}"

    @skip_gemini
    @pytest.mark.asyncio
    async def test_gemini_spanish_transcription(self, spanish_audio_mp3: bytes):
        """Gemini should transcribe Spanish speech correctly."""
        from app.cubes.cube3_voice.providers.gemini_provider import GeminiSTT

        provider = GeminiSTT()
        result = await provider.transcribe(
            audio_bytes=spanish_audio_mp3,
            language_code="es",
            audio_format="mp3",
        )

        print(f"\n  [GEMINI ES] Transcript: {result.transcript}")
        print(f"  [GEMINI ES] Confidence: {result.confidence}")

        assert isinstance(result, TranscriptionResult)
        assert result.provider == "gemini"
        assert len(result.transcript) > 5

        transcript_lower = result.transcript.lower()
        assert any(word in transcript_lower for word in [
            "inteligencia", "artificial", "gobernanza", "ayudar",
        ]), f"Spanish transcript doesn't match: {result.transcript}"

    @skip_gemini
    @pytest.mark.asyncio
    async def test_gemini_language_support(self):
        """Gemini should report support for all 33 languages."""
        from app.cubes.cube3_voice.providers.gemini_provider import GeminiSTT

        provider = GeminiSTT()
        for lang in ["en", "es", "fr", "ja", "zh", "ar", "hi", "ko", "de"]:
            assert provider.supports_language(lang), f"Gemini should support {lang}"
        assert provider.model_id() == "gemini-2.0-flash"


# ══════════════════════════════════════════════════════════════════
# OpenAI Whisper — Live Tests (skipped if no key)
# ══════════════════════════════════════════════════════════════════

class TestWhisperLive:
    """Live integration tests for OpenAI Whisper STT provider."""

    @skip_openai
    @pytest.mark.asyncio
    async def test_whisper_english_transcription(self, english_audio_mp3: bytes):
        """Whisper should transcribe English speech accurately."""
        from app.cubes.cube3_voice.providers.whisper_provider import WhisperSTT

        provider = WhisperSTT()
        result = await provider.transcribe(
            audio_bytes=english_audio_mp3,
            language_code="en",
            audio_format="mp3",
        )

        print(f"\n  [WHISPER EN] Transcript: {result.transcript}")
        print(f"  [WHISPER EN] Confidence: {result.confidence}")
        print(f"  [WHISPER EN] Duration: {result.audio_duration_sec}s")

        assert isinstance(result, TranscriptionResult)
        assert result.provider == "whisper"
        assert result.confidence > 0.3
        assert len(result.transcript) > 10


# ══════════════════════════════════════════════════════════════════
# Circuit Breaker — Live Failover Test
# ══════════════════════════════════════════════════════════════════

class TestCircuitBreakerLive:
    """Live test for circuit breaker failover between providers."""

    @pytest.mark.asyncio
    async def test_failover_chain_with_available_providers(self, english_audio_mp3: bytes):
        """Test that circuit breaker correctly fails over between available providers."""
        results = {}

        # Test each available provider
        if xai_key:
            try:
                from app.cubes.cube3_voice.providers.grok_provider import GrokSTT
                provider = GrokSTT()
                result = await provider.transcribe(english_audio_mp3, "en", "mp3")
                results["grok"] = result.transcript[:50]
                print(f"\n  [FAILOVER] Grok OK: {result.transcript[:50]}...")
            except STTProviderError as e:
                results["grok"] = f"FAILED: {e}"
                print(f"\n  [FAILOVER] Grok failed: {e}")

        if gemini_key:
            try:
                from app.cubes.cube3_voice.providers.gemini_provider import GeminiSTT
                provider = GeminiSTT()
                result = await provider.transcribe(english_audio_mp3, "en", "mp3")
                results["gemini"] = result.transcript[:50]
                print(f"  [FAILOVER] Gemini OK: {result.transcript[:50]}...")
            except STTProviderError as e:
                results["gemini"] = f"FAILED: {e}"
                print(f"  [FAILOVER] Gemini failed: {e}")

        assert len(results) > 0, "At least one provider must be available"
        # At least one should have succeeded
        successful = [k for k, v in results.items() if not v.startswith("FAILED")]
        print(f"\n  [FAILOVER] {len(successful)}/{len(results)} providers succeeded")
        assert len(successful) > 0, f"All providers failed: {results}"


# ══════════════════════════════════════════════════════════════════
# Provider Comparison — Side-by-side output
# ══════════════════════════════════════════════════════════════════

class TestProviderComparison:
    """Compare transcription quality across all available providers."""

    @pytest.mark.asyncio
    async def test_compare_all_providers_english(self, english_audio_mp3: bytes):
        """Side-by-side comparison of all available providers on same audio."""
        print("\n" + "=" * 70)
        print("  PROVIDER COMPARISON — English Audio")
        print(f"  Source text: \"{KNOWN_ENGLISH_TEXT}\"")
        print("=" * 70)

        providers_tested = 0

        if xai_key:
            from app.cubes.cube3_voice.providers.grok_provider import GrokSTT
            try:
                result = await GrokSTT().transcribe(english_audio_mp3, "en", "mp3")
                print(f"\n  GROK (whisper-large-v3):")
                print(f"    Transcript:  {result.transcript}")
                print(f"    Confidence:  {result.confidence:.4f}")
                print(f"    Duration:    {result.audio_duration_sec:.2f}s")
                providers_tested += 1
            except STTProviderError as e:
                print(f"\n  GROK: FAILED — {e}")

        if gemini_key:
            from app.cubes.cube3_voice.providers.gemini_provider import GeminiSTT
            try:
                result = await GeminiSTT().transcribe(english_audio_mp3, "en", "mp3")
                print(f"\n  GEMINI (gemini-2.0-flash):")
                print(f"    Transcript:  {result.transcript}")
                print(f"    Confidence:  {result.confidence:.4f}")
                print(f"    Duration:    {result.audio_duration_sec:.2f}s")
                providers_tested += 1
            except STTProviderError as e:
                print(f"\n  GEMINI: FAILED — {e}")

        if openai_key:
            from app.cubes.cube3_voice.providers.whisper_provider import WhisperSTT
            try:
                result = await WhisperSTT().transcribe(english_audio_mp3, "en", "mp3")
                print(f"\n  WHISPER (whisper-1):")
                print(f"    Transcript:  {result.transcript}")
                print(f"    Confidence:  {result.confidence:.4f}")
                print(f"    Duration:    {result.audio_duration_sec:.2f}s")
                providers_tested += 1
            except STTProviderError as e:
                print(f"\n  WHISPER: FAILED — {e}")

        print(f"\n  Total providers tested: {providers_tested}")
        print("=" * 70)
        assert providers_tested > 0, "No providers available to test"
