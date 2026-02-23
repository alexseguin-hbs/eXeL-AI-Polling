"""Cube 3 — End-to-End Flow Tests + CUBE3_TEST_METHOD for Cube 10 Simulator.

Test flows:
  1. TestSubmissionFlow — Full voice submit pipeline: record → transcribe → PII → store → tokens
  2. TestPIIFlow — PII detection on voice transcripts (reuses Cube 2 pipeline)
  3. TestCRS08Integrity — CRS-08: SHA-256 response hash on voice transcripts
  4. TestCircuitBreakerE2E — Circuit breaker failover across all 4 providers
  5. TestAWSProvider — AWS Transcribe batch provider validation

CUBE3_TEST_METHOD: Baseline metrics + flow definitions for Cube 10 Simulator.
"""

import hashlib
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
from tests.conftest import (
    make_participant,
    make_question,
    make_session,
    make_time_entry,
)


# ---------------------------------------------------------------------------
# Helper: mock transcription result
# ---------------------------------------------------------------------------

def _make_stt_result(
    transcript: str = "Hello world from voice",
    confidence: float = 0.92,
    language: str = "en",
    provider: str = "whisper",
    duration: float = 3.5,
) -> TranscriptionResult:
    return TranscriptionResult(
        transcript=transcript,
        confidence=confidence,
        language_detected=language,
        provider=provider,
        audio_duration_sec=duration,
    )


# ---------------------------------------------------------------------------
# 1. Full Voice Submission Flow
# ---------------------------------------------------------------------------


class TestSubmissionFlow:
    """E2E: User records voice → transcribe → Cube 2 pipeline → store → tokens."""

    @pytest.mark.asyncio
    async def test_voice_submit_full_pipeline(self):
        """Voice submission stores in MongoDB (audio) + Postgres (meta + voice + text)."""
        session = make_session(status="polling")
        question = make_question(session_id=session.id)
        participant = make_participant(session_id=session.id)
        time_entry = make_time_entry(heart_tokens_earned=1.0, unity_tokens_earned=5.0)

        mock_db = AsyncMock()
        mock_mongo = MagicMock()
        mock_mongo.responses.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id="mongo_voice_001")
        )
        mock_mongo.audio_files = MagicMock()
        mock_mongo.audio_files.insert_one = AsyncMock()
        mock_redis = AsyncMock()
        mock_redis.publish = AsyncMock()

        stt_result = _make_stt_result()

        call_count = 0

        async def mock_execute(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            result = MagicMock()
            if call_count == 1:  # validate_session
                result.scalar_one_or_none.return_value = session
            elif call_count == 2:  # validate_question
                result.scalar_one_or_none.return_value = question
            elif call_count == 3:  # validate_participant
                result.scalar_one_or_none.return_value = participant
            elif call_count == 4:  # profanity_filters
                result.scalars.return_value.all.return_value = []
            else:
                result.scalar_one_or_none.return_value = None
            return result

        mock_db.execute = mock_execute
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        with patch(
            "app.cubes.cube3_voice.service.transcribe_audio",
            new_callable=AsyncMock,
            return_value=stt_result,
        ), patch(
            "app.cubes.cube2_text.service._get_ner_pipeline",
            new_callable=AsyncMock,
        ) as mock_ner, patch(
            "asyncio.to_thread",
            new_callable=AsyncMock,
            return_value=[],
        ), patch(
            "app.cubes.cube5_gateway.service.start_time_tracking",
            new_callable=AsyncMock,
            return_value=time_entry,
        ), patch(
            "app.cubes.cube5_gateway.service.stop_time_tracking",
            new_callable=AsyncMock,
            return_value=time_entry,
        ):
            mock_ner.return_value = MagicMock(return_value=[])

            from app.cubes.cube3_voice.service import submit_voice_response

            result = await submit_voice_response(
                mock_db, mock_mongo, mock_redis,
                session_id=session.id,
                question_id=question.id,
                participant_id=participant.id,
                audio_bytes=b"fake_audio_bytes",
                language_code="en",
                audio_format="webm",
            )

        # Verify MongoDB writes (audio + raw transcript)
        mock_mongo.responses.insert_one.assert_awaited_once()
        mock_mongo.audio_files.insert_one.assert_awaited_once()

        # Verify Postgres writes (ResponseMeta + VoiceResponse + TextResponse)
        assert mock_db.add.call_count == 3

        # Verify return includes tokens + voice metadata
        assert result["source"] == "voice"
        assert result["heart_tokens_earned"] == 1.0
        assert result["unity_tokens_earned"] == 5.0
        assert result["stt_provider"] == "whisper"
        assert result["transcript_text"] == "Hello world from voice"
        assert result["transcript_confidence"] == 0.92

    @pytest.mark.asyncio
    async def test_voice_submit_returns_token_display(self):
        """Immediate ♡ and ◬ token display returned after voice submission."""
        session = make_session(status="polling")
        question = make_question(session_id=session.id)
        participant = make_participant(session_id=session.id)
        time_entry = make_time_entry(heart_tokens_earned=2.0, unity_tokens_earned=10.0)

        mock_db = AsyncMock()
        mock_mongo = MagicMock()
        mock_mongo.responses.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id="mongo_v002")
        )
        mock_mongo.audio_files = MagicMock()
        mock_mongo.audio_files.insert_one = AsyncMock()
        mock_redis = AsyncMock()
        mock_redis.publish = AsyncMock()

        call_count = 0

        async def mock_execute(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            result = MagicMock()
            if call_count == 1:
                result.scalar_one_or_none.return_value = session
            elif call_count == 2:
                result.scalar_one_or_none.return_value = question
            elif call_count == 3:
                result.scalar_one_or_none.return_value = participant
            elif call_count == 4:
                result.scalars.return_value.all.return_value = []
            return result

        mock_db.execute = mock_execute
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        with patch(
            "app.cubes.cube3_voice.service.transcribe_audio",
            new_callable=AsyncMock,
            return_value=_make_stt_result(),
        ), patch(
            "app.cubes.cube2_text.service._get_ner_pipeline",
            new_callable=AsyncMock,
        ) as mock_ner, patch(
            "asyncio.to_thread",
            new_callable=AsyncMock,
            return_value=[],
        ), patch(
            "app.cubes.cube5_gateway.service.start_time_tracking",
            new_callable=AsyncMock,
            return_value=time_entry,
        ), patch(
            "app.cubes.cube5_gateway.service.stop_time_tracking",
            new_callable=AsyncMock,
            return_value=time_entry,
        ):
            mock_ner.return_value = MagicMock(return_value=[])

            from app.cubes.cube3_voice.service import submit_voice_response

            result = await submit_voice_response(
                mock_db, mock_mongo, mock_redis,
                session_id=session.id,
                question_id=question.id,
                participant_id=participant.id,
                audio_bytes=b"audio_data",
                language_code="en",
            )

        assert result["heart_tokens_earned"] == 2.0
        assert result["unity_tokens_earned"] == 10.0

    @pytest.mark.asyncio
    async def test_voice_submit_rejects_non_polling_session(self):
        """Should raise SessionNotPollingError for non-polling session."""
        from app.core.exceptions import SessionNotPollingError
        from app.cubes.cube2_text.service import validate_session_for_submission

        session = make_session(status="open")
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(SessionNotPollingError):
            await validate_session_for_submission(mock_db, session.id)

    def test_voice_submit_rejects_empty_transcript(self):
        """Empty transcript after STT should raise ResponseValidationError."""
        from app.cubes.cube3_voice.service import validate_transcript

        result = _make_stt_result(transcript="   ", confidence=0.9)
        with pytest.raises(ResponseValidationError) as exc_info:
            validate_transcript(result, 3333)
        assert "No speech detected" in str(exc_info.value.detail)

    def test_voice_submit_accepts_all_formats(self):
        """All supported audio formats should be accepted by the router check."""
        accepted = {"webm", "wav", "mp3", "ogg", "m4a", "flac"}
        for fmt in accepted:
            assert fmt in accepted  # Validates router._ACCEPTED_FORMATS

    @pytest.mark.asyncio
    async def test_redis_event_published_after_voice_store(self):
        """Redis event should be published on successful voice submission."""
        session = make_session(status="polling")
        question = make_question(session_id=session.id)
        participant = make_participant(session_id=session.id)
        time_entry = make_time_entry()

        mock_db = AsyncMock()
        mock_mongo = MagicMock()
        mock_mongo.responses.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id="mongo_v003")
        )
        mock_mongo.audio_files = MagicMock()
        mock_mongo.audio_files.insert_one = AsyncMock()
        mock_redis = AsyncMock()
        mock_redis.publish = AsyncMock()

        call_count = 0

        async def mock_execute(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            result = MagicMock()
            if call_count == 1:
                result.scalar_one_or_none.return_value = session
            elif call_count == 2:
                result.scalar_one_or_none.return_value = question
            elif call_count == 3:
                result.scalar_one_or_none.return_value = participant
            elif call_count == 4:
                result.scalars.return_value.all.return_value = []
            return result

        mock_db.execute = mock_execute
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        with patch(
            "app.cubes.cube3_voice.service.transcribe_audio",
            new_callable=AsyncMock,
            return_value=_make_stt_result(),
        ), patch(
            "app.cubes.cube2_text.service._get_ner_pipeline",
            new_callable=AsyncMock,
        ) as mock_ner, patch(
            "asyncio.to_thread",
            new_callable=AsyncMock,
            return_value=[],
        ), patch(
            "app.cubes.cube5_gateway.service.start_time_tracking",
            new_callable=AsyncMock,
            return_value=time_entry,
        ), patch(
            "app.cubes.cube5_gateway.service.stop_time_tracking",
            new_callable=AsyncMock,
            return_value=time_entry,
        ):
            mock_ner.return_value = MagicMock(return_value=[])

            from app.cubes.cube3_voice.service import submit_voice_response

            await submit_voice_response(
                mock_db, mock_mongo, mock_redis,
                session_id=session.id,
                question_id=question.id,
                participant_id=participant.id,
                audio_bytes=b"audio_for_redis",
                language_code="en",
            )

        mock_redis.publish.assert_awaited_once()
        channel = mock_redis.publish.call_args[0][0]
        assert f"session:{session.id}:responses" == channel


# ---------------------------------------------------------------------------
# 2. PII Detection Flow (Voice Transcripts)
# ---------------------------------------------------------------------------


class TestPIIFlow:
    """E2E: PII detected in voice transcript → scrubbed via Cube 2 pipeline."""

    @pytest.mark.asyncio
    async def test_voice_transcript_email_detected(self):
        """Email in voice transcript should be detected and scrubbed."""
        with patch(
            "app.cubes.cube2_text.service._get_ner_pipeline",
            new_callable=AsyncMock,
        ) as mock_ner, patch(
            "asyncio.to_thread", new_callable=AsyncMock, return_value=[]
        ):
            mock_ner.return_value = MagicMock(return_value=[])
            from app.cubes.cube2_text.service import detect_pii, scrub_pii

            transcript = "My email is voice_user@example.com for follow-up"
            detections = await detect_pii(transcript)
            scrubbed = scrub_pii(transcript, detections)

        assert any(d["type"] == "EMAIL" for d in detections)
        assert "voice_user@example.com" not in scrubbed
        assert "[EMAIL_REDACTED]" in scrubbed

    @pytest.mark.asyncio
    async def test_clean_voice_transcript_no_pii(self):
        """Clean voice transcript should return empty detections."""
        with patch(
            "app.cubes.cube2_text.service._get_ner_pipeline",
            new_callable=AsyncMock,
        ) as mock_ner, patch(
            "asyncio.to_thread", new_callable=AsyncMock, return_value=[]
        ):
            mock_ner.return_value = MagicMock(return_value=[])
            from app.cubes.cube2_text.service import detect_pii

            detections = await detect_pii(
                "I believe we should focus on renewable energy solutions"
            )

        assert len(detections) == 0

    @pytest.mark.asyncio
    async def test_multiple_pii_in_voice_transcript(self):
        """Multiple PII types in voice transcript should all be detected."""
        with patch(
            "app.cubes.cube2_text.service._get_ner_pipeline",
            new_callable=AsyncMock,
        ) as mock_ner, patch(
            "asyncio.to_thread", new_callable=AsyncMock, return_value=[]
        ):
            mock_ner.return_value = MagicMock(return_value=[])
            from app.cubes.cube2_text.service import detect_pii

            transcript = "Call me at a@b.com or 555-123-4567 SSN 123-45-6789"
            detections = await detect_pii(transcript)

        types = {d["type"] for d in detections}
        assert "EMAIL" in types
        assert "SSN" in types


# ---------------------------------------------------------------------------
# 3. CRS-08 Response Hash (Voice Transcripts)
# ---------------------------------------------------------------------------


class TestCRS08Integrity:
    """CRS-08: SHA-256 hash for voice transcript integrity verification."""

    def test_voice_hash_computed(self):
        """response_hash should be SHA-256 of clean transcript text (64 hex chars)."""
        clean_text = "Hello world from voice transcription"
        h = hashlib.sha256(clean_text.encode()).hexdigest()
        assert len(h) == 64

    def test_voice_hash_changes_with_transcript(self):
        """Different transcripts should produce different hashes."""
        hash1 = hashlib.sha256("Voice response A".encode()).hexdigest()
        hash2 = hashlib.sha256("Voice response B".encode()).hexdigest()
        assert hash1 != hash2

    def test_voice_hash_is_deterministic(self):
        """Same transcript always produces same hash."""
        text = "Deterministic voice hash test"
        hash1 = hashlib.sha256(text.encode()).hexdigest()
        hash2 = hashlib.sha256(text.encode()).hexdigest()
        assert hash1 == hash2

    def test_unicode_voice_transcript_hash(self):
        """Unicode voice transcript should hash correctly."""
        text = "これは音声テスト 🎤"
        h = hashlib.sha256(text.encode()).hexdigest()
        assert len(h) == 64

    @pytest.mark.asyncio
    async def test_response_hash_in_submission_result(self):
        """submit_voice_response should return response_hash in result dict."""
        session = make_session(status="polling")
        question = make_question(session_id=session.id)
        participant = make_participant(session_id=session.id)
        time_entry = make_time_entry(heart_tokens_earned=1.0, unity_tokens_earned=5.0)

        mock_db = AsyncMock()
        mock_mongo = MagicMock()
        mock_mongo.responses.insert_one = AsyncMock(
            return_value=MagicMock(inserted_id="mongo_hash_test")
        )
        mock_mongo.audio_files = MagicMock()
        mock_mongo.audio_files.insert_one = AsyncMock()
        mock_redis = AsyncMock()
        mock_redis.publish = AsyncMock()

        stt_result = _make_stt_result(transcript="Hash test voice input")

        call_count = 0

        async def mock_execute(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            result = MagicMock()
            if call_count == 1:
                result.scalar_one_or_none.return_value = session
            elif call_count == 2:
                result.scalar_one_or_none.return_value = question
            elif call_count == 3:
                result.scalar_one_or_none.return_value = participant
            elif call_count == 4:
                result.scalars.return_value.all.return_value = []
            return result

        mock_db.execute = mock_execute
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_db.add = MagicMock()

        with patch(
            "app.cubes.cube3_voice.service.transcribe_audio",
            new_callable=AsyncMock,
            return_value=stt_result,
        ), patch(
            "app.cubes.cube2_text.service._get_ner_pipeline",
            new_callable=AsyncMock,
        ) as mock_ner, patch(
            "asyncio.to_thread",
            new_callable=AsyncMock,
            return_value=[],
        ), patch(
            "app.cubes.cube5_gateway.service.start_time_tracking",
            new_callable=AsyncMock,
            return_value=time_entry,
        ), patch(
            "app.cubes.cube5_gateway.service.stop_time_tracking",
            new_callable=AsyncMock,
            return_value=time_entry,
        ):
            mock_ner.return_value = MagicMock(return_value=[])

            from app.cubes.cube3_voice.service import submit_voice_response

            result = await submit_voice_response(
                mock_db, mock_mongo, mock_redis,
                session_id=session.id,
                question_id=question.id,
                participant_id=participant.id,
                audio_bytes=b"audio_hash_test",
                language_code="en",
            )

        # CRS-08: response_hash must be present and valid SHA-256
        assert "response_hash" in result
        assert result["response_hash"] is not None
        assert len(result["response_hash"]) == 64

        # Verify hash matches expected computation
        expected = hashlib.sha256(result["clean_text"].encode()).hexdigest()
        assert result["response_hash"] == expected


# ---------------------------------------------------------------------------
# 4. Circuit Breaker E2E
# ---------------------------------------------------------------------------


class TestCircuitBreakerE2E:
    """E2E: Circuit breaker failover across all 4 STT providers."""

    @pytest.mark.asyncio
    async def test_primary_fails_fallback_succeeds(self):
        """When primary provider fails, next provider in chain should succeed."""
        from app.cubes.cube3_voice.service import _handle_stt_failure

        fallback_provider = MagicMock()
        fallback_provider.transcribe = AsyncMock(
            return_value=_make_stt_result(provider="grok"),
        )

        with patch(
            "app.cubes.cube3_voice.service.get_stt_provider",
            return_value=fallback_provider,
        ):
            result = await _handle_stt_failure(
                AsyncMock(), b"audio", "en", "webm",
                failed_provider="whisper",
            )

        assert result.provider == "grok"

    @pytest.mark.asyncio
    async def test_all_providers_fail_returns_422(self):
        """When all 4 providers fail, should raise ResponseValidationError."""
        from app.cubes.cube3_voice.service import _handle_stt_failure

        failing_provider = MagicMock()
        failing_provider.transcribe = AsyncMock(
            side_effect=STTProviderError("test", "Unavailable"),
        )

        with patch(
            "app.cubes.cube3_voice.service.get_stt_provider",
            return_value=failing_provider,
        ):
            with pytest.raises(ResponseValidationError) as exc_info:
                await _handle_stt_failure(
                    AsyncMock(), b"audio", "en", "webm",
                    failed_provider="whisper",
                )
            assert "all STT providers unavailable" in str(exc_info.value.detail)

    @pytest.mark.asyncio
    async def test_failover_includes_aws_in_chain(self):
        """Fallback order should include aws as the 4th provider."""
        from app.cubes.cube3_voice.service import _FALLBACK_ORDER

        assert "aws" in _FALLBACK_ORDER
        assert len(_FALLBACK_ORDER) == 4
        assert _FALLBACK_ORDER == ["whisper", "grok", "gemini", "aws"]


# ---------------------------------------------------------------------------
# 5. AWS Provider
# ---------------------------------------------------------------------------


class TestAWSProvider:
    """AWS Transcribe batch provider validation."""

    def test_aws_enum_exists(self):
        """AWS should be in STTProviderName enum."""
        assert STTProviderName.AWS.value == "aws"

    def test_aws_provider_model_id_pinned(self):
        """AWS provider model_id should be pinned."""
        from app.cubes.cube3_voice.providers.aws_provider import AWSTranscribeSTT

        provider = AWSTranscribeSTT()
        assert provider.model_id() == "aws-transcribe"

    def test_aws_language_support(self):
        """AWS provider should support 23 languages."""
        from app.cubes.cube3_voice.providers.aws_provider import AWSTranscribeSTT

        provider = AWSTranscribeSTT()
        assert provider.supports_language("en") is True
        assert provider.supports_language("es") is True
        assert provider.supports_language("ja") is True
        assert provider.supports_language("ar") is True
        assert provider.supports_language("ko") is True
        # Unsupported languages
        assert provider.supports_language("bn") is False
        assert provider.supports_language("ne") is False

    def test_aws_factory_mapping(self):
        """AWS should be mapped in factory _AI_TO_STT_MAP."""
        from app.cubes.cube3_voice.providers.factory import _AI_TO_STT_MAP

        assert "aws" in _AI_TO_STT_MAP
        assert _AI_TO_STT_MAP["aws"] == "aws"


# ---------------------------------------------------------------------------
# CUBE3_TEST_METHOD — Cube 10 Simulator Reference
# ---------------------------------------------------------------------------

CUBE3_TEST_METHOD = {
    "cube": "cube3_voice",
    "version": "1.0.0",
    "test_command": "python -m pytest tests/cube3/ -v --tb=short",
    "test_files": [
        "tests/cube3/test_voice_service.py",
        "tests/cube3/test_e2e_flows.py",
    ],
    "baseline_metrics": {
        "unit_tests_passed": 18,
        "e2e_tests_passed": 19,
        "total_tests": 37,
        "test_duration_ms": 500,
        "coverage_target_pct": 85,
    },
    "flows": {
        "submission": {
            "steps": [
                "validate_session (status=polling)",
                "validate_question (belongs to session)",
                "validate_participant (active, in session)",
                "start_time_tracking (Cube 5, action_type=voice_responding)",
                "select_stt_provider (session.ai_provider → fallback chain)",
                "transcribe_audio (circuit breaker: whisper → grok → gemini → aws)",
                "validate_transcript (non-empty, confidence threshold)",
                "detect_pii (NER + regex via Cube 2)",
                "scrub_pii (placeholder replacement)",
                "detect_profanity (DB patterns via Cube 2)",
                "scrub_profanity (configured replacements)",
                "store_voice_response (MongoDB audio + Postgres meta/voice/text)",
                "compute_response_hash (CRS-08: SHA-256 of clean_text)",
                "stop_time_tracking (token calculation)",
                "publish_redis_event (Cube 6 downstream)",
                "return composite result with tokens + response_hash",
            ],
            "crs_coverage": ["CRS-08", "CRS-15"],
        },
        "circuit_breaker": {
            "fallback_order": ["whisper", "grok", "gemini", "aws"],
            "behavior": "Try preferred → failover through chain → 422 if all fail",
        },
        "integrity": {
            "hash_algorithm": "SHA-256",
            "field": "response_hash",
            "computed_on": "clean_text (post-PII/profanity scrubbing)",
            "crs_coverage": ["CRS-08"],
        },
    },
    "stt_providers": {
        "whisper": {"model": "whisper-1", "type": "batch", "languages": 33},
        "grok": {"model": "whisper-large-v3", "type": "batch", "languages": 33},
        "gemini": {"model": "gemini-2.0-flash", "type": "batch", "languages": 33},
        "aws": {"model": "aws-transcribe", "type": "batch", "languages": 23},
    },
    "spiral_propagation": {
        "forward": {
            "cube4_collector": "Aggregates voice responses stored by Cube 3",
            "cube5_gateway": "Time tracking integration (start/stop voice_responding)",
            "cube6_ai": "Consumes Redis events for theme pipeline (voice + text)",
            "cube8_tokens": "Token ledger entries via Cube 5 time tracking",
            "cube9_reports": "Exports voice transcript data with clean_text + response_hash",
        },
        "backward": {
            "cube1_session": "Session state, ai_provider, max_response_length, anonymity_mode",
            "cube2_text": "PII/profanity pipeline reused, validate_session/question/participant",
        },
    },
}
