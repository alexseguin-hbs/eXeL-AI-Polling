"""Cube 3 — Live E2E Voice Tests with Saved Audio Fixtures.

    Uses pre-generated MP3 fixtures in tests/fixtures/ to test the
    full voice→transcript→validate pipeline against live STT APIs.

    Fixtures:
      test_english.mp3  — "AI can help improve governance..."
      test_spanish.mp3  — "La inteligencia artificial puede..."
      test_french.mp3   — "Intelligence artificielle peut..."
      test_short.mp3    — "Yes I agree" (edge case: <33 words)

    Run with: LIVE_STT=1 pytest tests/cube3/test_live_e2e_voice.py -v -s
"""

import os
import sys
from pathlib import Path

import pytest

# Gate: skip unless LIVE_STT=1
_skip = pytest.mark.skipif(
    os.getenv("LIVE_STT", "") != "1",
    reason="Live STT tests require LIVE_STT=1 (calls real APIs)",
)

# Load .env for API keys
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"


def _load_fixture(name: str) -> bytes:
    path = FIXTURES_DIR / name
    assert path.exists(), f"Fixture not found: {path}"
    return path.read_bytes()


# ═══════════════════════════════════════════════════════════════════
# Whisper (OpenAI) — Live E2E
# ═══════════════════════════════════════════════════════════════════


class TestWhisperE2E:
    """Full pipeline: fixture audio → Whisper → transcript validation."""

    @_skip
    @pytest.mark.asyncio
    async def test_english_fixture(self):
        from app.cubes.cube3_voice.providers.whisper_provider import WhisperSTT

        audio = _load_fixture("test_english.mp3")
        provider = WhisperSTT()
        result = await provider.transcribe(audio, language_code="en", audio_format="mp3")

        print(f"\n  [Whisper EN] {result.transcript}")
        assert result.provider == "whisper"
        assert len(result.transcript) > 20
        transcript_lower = result.transcript.lower()
        assert any(w in transcript_lower for w in ["intelligence", "governance", "voices"])

    @_skip
    @pytest.mark.asyncio
    async def test_spanish_fixture(self):
        from app.cubes.cube3_voice.providers.whisper_provider import WhisperSTT

        audio = _load_fixture("test_spanish.mp3")
        provider = WhisperSTT()
        result = await provider.transcribe(audio, language_code="es", audio_format="mp3")

        print(f"\n  [Whisper ES] {result.transcript}")
        assert len(result.transcript) > 20
        assert any(w in result.transcript.lower() for w in ["inteligencia", "artificial", "gobernanza"])

    @_skip
    @pytest.mark.asyncio
    async def test_short_fixture(self):
        from app.cubes.cube3_voice.providers.whisper_provider import WhisperSTT

        audio = _load_fixture("test_short.mp3")
        provider = WhisperSTT()
        result = await provider.transcribe(audio, language_code="en", audio_format="mp3")

        print(f"\n  [Whisper SHORT] {result.transcript}")
        assert len(result.transcript) > 5
        assert any(w in result.transcript.lower() for w in ["yes", "agree"])


# ═══════════════════════════════════════════════════════════════════
# Gemini — Live E2E
# ═══════════════════════════════════════════════════════════════════


class TestGeminiE2E:
    """Full pipeline: fixture audio → Gemini → transcript validation."""

    @_skip
    @pytest.mark.asyncio
    async def test_english_fixture(self):
        from app.cubes.cube3_voice.providers.gemini_provider import GeminiSTT

        audio = _load_fixture("test_english.mp3")
        provider = GeminiSTT()
        result = await provider.transcribe(audio, language_code="en", audio_format="mp3")

        print(f"\n  [Gemini EN] {result.transcript}")
        assert result.provider == "gemini"
        assert len(result.transcript) > 20

    @_skip
    @pytest.mark.asyncio
    async def test_french_fixture(self):
        from app.cubes.cube3_voice.providers.gemini_provider import GeminiSTT

        audio = _load_fixture("test_french.mp3")
        provider = GeminiSTT()
        result = await provider.transcribe(audio, language_code="fr", audio_format="mp3")

        print(f"\n  [Gemini FR] {result.transcript}")
        assert len(result.transcript) > 20


# ═══════════════════════════════════════════════════════════════════
# Fixture Validation (always runs, no API needed)
# ═══════════════════════════════════════════════════════════════════


class TestFixtureFiles:
    """Verify audio fixtures exist and are valid."""

    def test_english_fixture_exists(self):
        assert (FIXTURES_DIR / "test_english.mp3").exists()

    def test_spanish_fixture_exists(self):
        assert (FIXTURES_DIR / "test_spanish.mp3").exists()

    def test_french_fixture_exists(self):
        assert (FIXTURES_DIR / "test_french.mp3").exists()

    def test_short_fixture_exists(self):
        assert (FIXTURES_DIR / "test_short.mp3").exists()

    def test_english_fixture_size(self):
        size = (FIXTURES_DIR / "test_english.mp3").stat().st_size
        assert 10_000 < size < 200_000, f"Unexpected size: {size}"

    def test_short_fixture_smaller(self):
        en_size = (FIXTURES_DIR / "test_english.mp3").stat().st_size
        short_size = (FIXTURES_DIR / "test_short.mp3").stat().st_size
        assert short_size < en_size
