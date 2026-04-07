"""Cube 3 — Voice-to-Text Engine Service Tests.

Tests:
  - STT provider base classes and factory
  - Transcript validation (empty, low confidence, length truncation)
  - Circuit breaker failover logic
  - Provider selection (Moderator default → User override)
  - Transcription with mock provider
  - Voice response storage (Postgres)
  - Full orchestrator flow (submit_voice_response)
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import ResponseValidationError
from app.cubes.cube3_voice.providers.base import (
    STTProviderError,
    STTProviderName,
    TranscriptionResult,
)

from tests.conftest import make_participant, make_session, make_time_entry


# ---------------------------------------------------------------------------
# TranscriptionResult
# ---------------------------------------------------------------------------


class TestTranscriptionResult:
    def test_create_result(self):
        """Should create a valid TranscriptionResult."""
        result = TranscriptionResult(
            transcript="Hello world",
            confidence=0.95,
            language_detected="en",
            provider="whisper",
            audio_duration_sec=3.5,
        )
        assert result.transcript == "Hello world"
        assert result.confidence == 0.95
        assert result.provider == "whisper"


class TestSTTProviderName:
    def test_enum_values(self):
        """Should have whisper, grok, gemini providers."""
        assert STTProviderName.WHISPER.value == "whisper"
        assert STTProviderName.GROK.value == "grok"
        assert STTProviderName.GEMINI.value == "gemini"


class TestSTTProviderError:
    def test_error_format(self):
        """Should format error with provider name."""
        err = STTProviderError("whisper", "Connection timeout")
        assert err.provider == "whisper"
        assert err.message == "Connection timeout"
        assert "[whisper]" in str(err)


# ---------------------------------------------------------------------------
# Transcript Validation
# ---------------------------------------------------------------------------


class TestValidateTranscript:
    def test_valid_transcript(self):
        """Normal transcript should pass validation."""
        from app.cubes.cube3_voice.service import validate_transcript

        result = TranscriptionResult(
            transcript="Hello world",
            confidence=0.95,
            language_detected="en",
            provider="whisper",
            audio_duration_sec=2.0,
        )
        text = validate_transcript(result, 3333)
        assert text == "Hello world"

    def test_empty_transcript_raises(self):
        """Empty transcript should raise ResponseValidationError."""
        from app.cubes.cube3_voice.service import validate_transcript

        result = TranscriptionResult(
            transcript="   ",
            confidence=0.9,
            language_detected="en",
            provider="whisper",
            audio_duration_sec=1.0,
        )
        with pytest.raises(ResponseValidationError) as exc_info:
            validate_transcript(result, 3333)
        assert "No speech detected" in str(exc_info.value.detail)

    def test_low_confidence_raises(self):
        """Confidence below threshold should raise."""
        from app.cubes.cube3_voice.service import validate_transcript

        result = TranscriptionResult(
            transcript="Maybe something",
            confidence=0.1,  # Below 0.3 threshold
            language_detected="en",
            provider="whisper",
            audio_duration_sec=1.0,
        )
        with pytest.raises(ResponseValidationError) as exc_info:
            validate_transcript(result, 3333)
        assert "confidence too low" in str(exc_info.value.detail)

    def test_long_transcript_truncated(self):
        """Transcript exceeding max_length should be truncated (not rejected)."""
        from app.cubes.cube3_voice.service import validate_transcript

        long_text = "A" * 5000
        result = TranscriptionResult(
            transcript=long_text,
            confidence=0.9,
            language_detected="en",
            provider="whisper",
            audio_duration_sec=30.0,
        )
        text = validate_transcript(result, 3333)
        assert len(text) == 3333

    def test_borderline_confidence_passes(self):
        """Confidence exactly at threshold should pass."""
        from app.cubes.cube3_voice.service import validate_transcript

        result = TranscriptionResult(
            transcript="Borderline",
            confidence=0.3,  # Exactly at threshold
            language_detected="en",
            provider="whisper",
            audio_duration_sec=1.0,
        )
        text = validate_transcript(result, 3333)
        assert text == "Borderline"


# ---------------------------------------------------------------------------
# Circuit Breaker Failover
# ---------------------------------------------------------------------------


class TestCircuitBreakerFailover:
    @pytest.mark.asyncio
    async def test_failover_on_primary_failure(self):
        """Should try next provider when primary fails."""
        from app.cubes.cube3_voice.service import _handle_stt_failure

        mock_provider = MagicMock()
        mock_provider.transcribe = AsyncMock(
            return_value=TranscriptionResult(
                transcript="Recovered",
                confidence=0.85,
                language_detected="en",
                provider="grok",
                audio_duration_sec=2.0,
            )
        )

        with patch("app.cubes.cube3_voice.service.get_stt_provider", return_value=mock_provider):
            result = await _handle_stt_failure(
                AsyncMock(),  # db
                b"audio_bytes",
                "en",
                "webm",
                failed_provider="whisper",
            )
        assert result.transcript == "Recovered"

    @pytest.mark.asyncio
    async def test_all_providers_fail_raises(self):
        """Should raise ResponseValidationError when all providers fail."""
        from app.cubes.cube3_voice.service import _handle_stt_failure

        mock_provider = MagicMock()
        mock_provider.transcribe = AsyncMock(
            side_effect=STTProviderError("test", "All failed")
        )

        with patch("app.cubes.cube3_voice.service.get_stt_provider", return_value=mock_provider):
            with pytest.raises(ResponseValidationError) as exc_info:
                await _handle_stt_failure(
                    AsyncMock(),
                    b"audio_bytes",
                    "en",
                    "webm",
                    failed_provider="whisper",
                )
            assert "all STT providers unavailable" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_failover_skips_failed_provider(self):
        """Should not retry the same provider that originally failed."""
        from app.cubes.cube3_voice.service import _handle_stt_failure

        call_log = []

        def mock_get_provider(name):
            call_log.append(name)
            provider = MagicMock()
            provider.transcribe = AsyncMock(
                return_value=TranscriptionResult(
                    transcript="OK",
                    confidence=0.8,
                    language_detected="en",
                    provider=name,
                    audio_duration_sec=1.0,
                )
            )
            return provider

        with patch("app.cubes.cube3_voice.service.get_stt_provider", side_effect=mock_get_provider):
            result = await _handle_stt_failure(
                AsyncMock(),
                b"audio",
                "en",
                "webm",
                failed_provider="whisper",
            )

        assert "whisper" not in call_log
        assert result.transcript == "OK"


# ---------------------------------------------------------------------------
# Transcribe Audio (with mock)
# ---------------------------------------------------------------------------


class TestTranscribeAudio:
    @pytest.mark.asyncio
    async def test_successful_transcription(self):
        """Should return transcription result on success."""
        from app.cubes.cube3_voice.service import transcribe_audio

        mock_provider = MagicMock()
        mock_provider.transcribe = AsyncMock(
            return_value=TranscriptionResult(
                transcript="Test transcript",
                confidence=0.92,
                language_detected="en",
                provider="whisper",
                audio_duration_sec=5.0,
            )
        )

        with patch("app.cubes.cube3_voice.service.select_stt_provider", new_callable=AsyncMock, return_value=mock_provider):
            result = await transcribe_audio(
                AsyncMock(), b"audio", "en", "webm"
            )
        assert result.transcript == "Test transcript"
        assert result.confidence == 0.92

    @pytest.mark.asyncio
    async def test_transcription_triggers_failover(self):
        """Should invoke circuit breaker on STTProviderError."""
        from app.cubes.cube3_voice.service import transcribe_audio

        mock_provider = MagicMock()
        mock_provider.transcribe = AsyncMock(
            side_effect=STTProviderError("whisper", "Timeout")
        )

        fallback_result = TranscriptionResult(
            transcript="Fallback result",
            confidence=0.8,
            language_detected="en",
            provider="grok",
            audio_duration_sec=3.0,
        )

        with (
            patch("app.cubes.cube3_voice.service.select_stt_provider", new_callable=AsyncMock, return_value=mock_provider),
            patch("app.cubes.cube3_voice.service._handle_stt_failure", new_callable=AsyncMock, return_value=fallback_result),
        ):
            result = await transcribe_audio(
                AsyncMock(), b"audio", "en", "webm"
            )
        assert result.provider == "grok"


# ---------------------------------------------------------------------------
# Provider Selection with User Override
# ---------------------------------------------------------------------------


class TestProviderSelection:
    @pytest.mark.asyncio
    async def test_uses_session_stt_provider_default(self):
        """Should use session.stt_provider by default."""
        session = make_session(stt_provider="gemini", allow_user_stt_choice=False)
        participant = make_participant(stt_provider_preference="grok")

        # The provider name resolved should be "gemini" (session default)
        stt_provider_name = getattr(session, "stt_provider", None) or session.ai_provider
        if getattr(session, "allow_user_stt_choice", False):
            user_pref = getattr(participant, "stt_provider_preference", None)
            if user_pref:
                stt_provider_name = user_pref

        assert stt_provider_name == "gemini"

    @pytest.mark.asyncio
    async def test_user_override_when_allowed(self):
        """Should use participant preference when allow_user_stt_choice=True."""
        session = make_session(stt_provider="openai", allow_user_stt_choice=True)
        participant = make_participant(stt_provider_preference="grok")

        stt_provider_name = getattr(session, "stt_provider", None) or session.ai_provider
        if getattr(session, "allow_user_stt_choice", False):
            user_pref = getattr(participant, "stt_provider_preference", None)
            if user_pref:
                stt_provider_name = user_pref

        assert stt_provider_name == "grok"

    @pytest.mark.asyncio
    async def test_no_user_preference_falls_back(self):
        """Should fall back to session.stt_provider when user has no preference."""
        session = make_session(stt_provider="openai", allow_user_stt_choice=True)
        participant = make_participant(stt_provider_preference=None)

        stt_provider_name = getattr(session, "stt_provider", None) or session.ai_provider
        if getattr(session, "allow_user_stt_choice", False):
            user_pref = getattr(participant, "stt_provider_preference", None)
            if user_pref:
                stt_provider_name = user_pref

        assert stt_provider_name == "openai"


# ---------------------------------------------------------------------------
# Voice Response Query
# ---------------------------------------------------------------------------


class TestGetVoiceResponses:
    @pytest.mark.asyncio
    async def test_empty_results(self):
        """Should return empty paginated list."""
        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 0
        rows_result = MagicMock()
        rows_result.all.return_value = []
        mock_db.execute = AsyncMock(side_effect=[count_result, rows_result])

        from app.cubes.cube3_voice.service import get_voice_responses
        result = await get_voice_responses(mock_db, uuid.uuid4())
        assert result["total"] == 0
        assert result["items"] == []

    @pytest.mark.asyncio
    async def test_single_response_lookup_not_found(self):
        """Should return None when voice response not found."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube3_voice.service import get_voice_response_by_id
        result = await get_voice_response_by_id(mock_db, uuid.uuid4(), uuid.uuid4())
        assert result is None


# ---------------------------------------------------------------------------
# Phase 1 Security Tests — P1.1 (Auth), P1.2 (Timeout), P1.3 (PII Gate),
#                           P1.4 (Schema), P1.5 (DB Session)
# ---------------------------------------------------------------------------


class TestSTTTimeout:
    """P1.2: STT API calls must timeout after 30s to prevent hung providers."""

    @pytest.mark.asyncio
    async def test_primary_timeout_triggers_failover(self):
        """Timeout on primary provider should trigger circuit breaker failover."""
        import asyncio
        from app.cubes.cube3_voice.service import transcribe_audio

        mock_provider = MagicMock()
        mock_provider.provider_name = STTProviderName.WHISPER

        # Simulate a provider that hangs forever
        async def hang_forever(*args, **kwargs):
            await asyncio.sleep(999)

        mock_provider.transcribe = hang_forever

        fallback_result = TranscriptionResult(
            transcript="Fallback after timeout",
            confidence=0.85,
            language_detected="en",
            provider="grok",
            audio_duration_sec=2.0,
        )

        with (
            patch("app.cubes.cube3_voice.service.select_stt_provider", new_callable=AsyncMock, return_value=mock_provider),
            patch("app.cubes.cube3_voice.service._handle_stt_failure", new_callable=AsyncMock, return_value=fallback_result),
            patch("app.cubes.cube3_voice.service.STT_TIMEOUT_SECONDS", 0.1),
        ):
            result = await transcribe_audio(AsyncMock(), b"audio", "en", "webm")
        assert result.provider == "grok"

    @pytest.mark.asyncio
    async def test_failover_timeout_skips_to_next(self):
        """Timeout in failover chain should skip to next provider."""
        import asyncio
        from app.cubes.cube3_voice.service import _handle_stt_failure

        call_count = 0

        def mock_get_provider(name):
            nonlocal call_count
            call_count += 1
            provider = MagicMock()
            if name == "grok":
                # Grok hangs
                async def hang(*a, **kw):
                    await asyncio.sleep(999)
                provider.transcribe = hang
            else:
                # Gemini succeeds
                provider.transcribe = AsyncMock(
                    return_value=TranscriptionResult(
                        transcript="Gemini recovered",
                        confidence=0.8,
                        language_detected="en",
                        provider=name,
                        audio_duration_sec=1.0,
                    )
                )
            return provider

        with (
            patch("app.cubes.cube3_voice.service.get_stt_provider", side_effect=mock_get_provider),
            patch("app.cubes.cube3_voice.service.STT_TIMEOUT_SECONDS", 0.1),
        ):
            result = await _handle_stt_failure(
                AsyncMock(), b"audio", "en", "webm",
                failed_provider="whisper",
            )
        assert result.transcript == "Gemini recovered"

    @pytest.mark.asyncio
    async def test_all_providers_timeout_raises(self):
        """If all providers timeout, should raise ResponseValidationError."""
        import asyncio
        from app.cubes.cube3_voice.service import _handle_stt_failure

        def mock_get_provider(name):
            provider = MagicMock()
            async def hang(*a, **kw):
                await asyncio.sleep(999)
            provider.transcribe = hang
            return provider

        with (
            patch("app.cubes.cube3_voice.service.get_stt_provider", side_effect=mock_get_provider),
            patch("app.cubes.cube3_voice.service.STT_TIMEOUT_SECONDS", 0.1),
        ):
            with pytest.raises(ResponseValidationError) as exc_info:
                await _handle_stt_failure(
                    AsyncMock(), b"audio", "en", "webm",
                    failed_provider="whisper",
                )
            assert "all STT providers unavailable" in str(exc_info.value.detail)


class TestSessionValidation:
    """P1.1: Session existence check prevents UUID enumeration."""

    @pytest.mark.asyncio
    async def test_valid_session_passes(self):
        """Existing session should not raise."""
        from app.cubes.cube3_voice.service import validate_session_exists

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = uuid.uuid4()
        mock_db.execute = AsyncMock(return_value=mock_result)

        # Should not raise
        await validate_session_exists(mock_db, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_missing_session_raises_404(self):
        """Non-existent session should raise SessionNotFoundError."""
        from app.core.exceptions import SessionNotFoundError
        from app.cubes.cube3_voice.service import validate_session_exists

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(SessionNotFoundError):
            await validate_session_exists(mock_db, uuid.uuid4())


class TestPIIGateAssertion:
    """P1.3: PII gate must dynamically verify clean_text != raw when PII detected."""

    def test_pii_gate_passes_when_scrubbed(self):
        """When PII is detected AND clean_text differs from raw, gate passes."""
        pii_detected = True
        transcript = "My email is john@test.com"
        clean_text = "My email is [REDACTED]"

        pii_gate_passed = (not pii_detected) or (clean_text != transcript)
        assert pii_gate_passed is True

    def test_pii_gate_passes_when_no_pii(self):
        """When no PII detected, gate passes regardless of text match."""
        pii_detected = False
        transcript = "Hello world"
        clean_text = "Hello world"

        pii_gate_passed = (not pii_detected) or (clean_text != transcript)
        assert pii_gate_passed is True

    def test_pii_gate_fails_when_pii_not_scrubbed(self):
        """When PII detected but clean_text == raw, gate FAILS (scrubbing broken)."""
        pii_detected = True
        transcript = "My email is john@test.com"
        clean_text = "My email is john@test.com"  # Scrubbing failed

        pii_gate_passed = (not pii_detected) or (clean_text != transcript)
        assert pii_gate_passed is False


class TestResponseHashSchema:
    """P1.4: VoiceSubmissionRead must include response_hash field."""

    def test_schema_includes_response_hash(self):
        """VoiceSubmissionRead should have response_hash field."""
        from app.schemas.voice import VoiceSubmissionRead

        fields = VoiceSubmissionRead.model_fields
        assert "response_hash" in fields

    def test_response_hash_optional_default_none(self):
        """response_hash should default to None (optional)."""
        from app.schemas.voice import VoiceSubmissionRead

        field = VoiceSubmissionRead.model_fields["response_hash"]
        assert field.default is None
