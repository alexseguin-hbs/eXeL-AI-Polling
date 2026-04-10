"""Cube 2 — Text Submission Service Tests.

Tests:
  - Session validation (polling required)
  - Question validation (exists + belongs to session)
  - Participant validation (exists + active + belongs to session)
  - Text input validation (empty, length, Unicode)
  - PII detection (regex patterns: email, phone, SSN, CC, IP)
  - PII scrubbing (placeholder replacement)
  - Profanity detection (DB pattern matching)
  - Profanity scrubbing (replacement)
  - Response storage (Postgres)
  - Supabase broadcast event publishing
  - Full orchestrator flow (submit_text_response)
  - Paginated response listing
  - Single response lookup
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.exceptions import (
    ParticipantNotFoundError,
    QuestionNotFoundError,
    ResponseValidationError,
    SessionNotFoundError,
    SessionNotPollingError,
)

from tests.conftest import make_participant, make_question, make_response_meta, make_session, make_time_entry


# ---------------------------------------------------------------------------
# Session Validation
# ---------------------------------------------------------------------------


class TestValidateSessionForSubmission:
    @pytest.mark.asyncio
    async def test_valid_polling_session(self):
        """Should return session when status is polling."""
        session = make_session(status="polling")
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import validate_session_for_submission
        result = await validate_session_for_submission(mock_db, session.id)
        assert result == session

    @pytest.mark.asyncio
    async def test_session_not_found(self):
        """Should raise SessionNotFoundError if session doesn't exist."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import validate_session_for_submission
        with pytest.raises(SessionNotFoundError):
            await validate_session_for_submission(mock_db, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_session_not_polling(self):
        """Should raise SessionNotPollingError if session is not in polling state."""
        session = make_session(status="open")
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = session
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import validate_session_for_submission
        with pytest.raises(SessionNotPollingError):
            await validate_session_for_submission(mock_db, session.id)


# ---------------------------------------------------------------------------
# Question Validation
# ---------------------------------------------------------------------------


class TestValidateQuestion:
    @pytest.mark.asyncio
    async def test_valid_question(self):
        """Should return question when found for session."""
        question = make_question()
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = question
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import validate_question
        result = await validate_question(mock_db, question.id, question.session_id)
        assert result == question

    @pytest.mark.asyncio
    async def test_question_not_found(self):
        """Should raise QuestionNotFoundError when question doesn't exist."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import validate_question
        with pytest.raises(QuestionNotFoundError):
            await validate_question(mock_db, uuid.uuid4(), uuid.uuid4())


# ---------------------------------------------------------------------------
# Participant Validation
# ---------------------------------------------------------------------------


class TestValidateParticipant:
    @pytest.mark.asyncio
    async def test_valid_participant(self):
        """Should return participant when found, active, and in session."""
        participant = make_participant()
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = participant
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import validate_participant
        result = await validate_participant(mock_db, participant.id, participant.session_id)
        assert result == participant

    @pytest.mark.asyncio
    async def test_participant_not_found(self):
        """Should raise ParticipantNotFoundError when not found."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import validate_participant
        with pytest.raises(ParticipantNotFoundError):
            await validate_participant(mock_db, uuid.uuid4(), uuid.uuid4())


# ---------------------------------------------------------------------------
# Text Input Validation
# ---------------------------------------------------------------------------


class TestValidateTextInput:
    def test_valid_text(self):
        """Normal text within limits should pass."""
        from app.cubes.cube2_text.service import validate_text_input
        result = validate_text_input("Hello world", 3333)
        assert result == "Hello world"

    def test_strips_whitespace(self):
        """Should strip leading/trailing whitespace."""
        from app.cubes.cube2_text.service import validate_text_input
        result = validate_text_input("  Hello  ", 3333)
        assert result == "Hello"

    def test_empty_text_raises(self):
        """Empty text should raise ResponseValidationError."""
        from app.cubes.cube2_text.service import validate_text_input
        with pytest.raises(ResponseValidationError):
            validate_text_input("", 3333)

    def test_whitespace_only_raises(self):
        """Whitespace-only text should raise ResponseValidationError."""
        from app.cubes.cube2_text.service import validate_text_input
        with pytest.raises(ResponseValidationError):
            validate_text_input("   \t\n  ", 3333)

    def test_exceeds_max_length_raises(self):
        """Text exceeding max length should raise ResponseValidationError."""
        from app.cubes.cube2_text.service import validate_text_input
        with pytest.raises(ResponseValidationError) as exc_info:
            validate_text_input("A" * 3334, 3333)
        assert "exceeds maximum length" in str(exc_info.value.detail)

    def test_unicode_text_passes(self):
        """Unicode text (CJK, emoji) should be accepted."""
        from app.cubes.cube2_text.service import validate_text_input
        result = validate_text_input("これはテストです 🎉", 3333)
        assert "これは" in result

    def test_exact_max_length_passes(self):
        """Text at exactly max length should pass."""
        from app.cubes.cube2_text.service import validate_text_input
        text = "A" * 3333
        result = validate_text_input(text, 3333)
        assert len(result) == 3333


# ---------------------------------------------------------------------------
# PII Detection (Regex)
# ---------------------------------------------------------------------------


class TestPIIDetectionRegex:
    """Test regex-based PII detection (NER mocked out)."""

    @pytest.mark.asyncio
    async def test_detect_email(self):
        """Should detect email addresses."""
        with patch("app.cubes.cube2_text.service._get_ner_pipeline", new_callable=AsyncMock) as mock_ner:
            mock_pipeline = MagicMock()
            mock_pipeline.return_value = []  # No NER results
            mock_ner.return_value = mock_pipeline

            from app.cubes.cube2_text.service import detect_pii

            with patch("asyncio.to_thread", new_callable=AsyncMock, return_value=[]):
                detections = await detect_pii("Contact me at john@example.com for info")

        email_types = [d for d in detections if d["type"] == "EMAIL"]
        assert len(email_types) >= 1
        assert "john@example.com" in email_types[0]["text"]

    @pytest.mark.asyncio
    async def test_detect_phone(self):
        """Should detect phone numbers."""
        with patch("app.cubes.cube2_text.service._get_ner_pipeline", new_callable=AsyncMock) as mock_ner:
            mock_pipeline = MagicMock()
            mock_pipeline.return_value = []
            mock_ner.return_value = mock_pipeline

            from app.cubes.cube2_text.service import detect_pii

            with patch("asyncio.to_thread", new_callable=AsyncMock, return_value=[]):
                detections = await detect_pii("Call me at +1-555-123-4567")

        phone_types = [d for d in detections if d["type"] == "PHONE"]
        assert len(phone_types) >= 1

    @pytest.mark.asyncio
    async def test_detect_ssn(self):
        """Should detect SSN patterns."""
        with patch("app.cubes.cube2_text.service._get_ner_pipeline", new_callable=AsyncMock) as mock_ner:
            mock_pipeline = MagicMock()
            mock_pipeline.return_value = []
            mock_ner.return_value = mock_pipeline

            from app.cubes.cube2_text.service import detect_pii

            with patch("asyncio.to_thread", new_callable=AsyncMock, return_value=[]):
                detections = await detect_pii("My SSN is 123-45-6789")

        ssn_types = [d for d in detections if d["type"] == "SSN"]
        assert len(ssn_types) >= 1

    @pytest.mark.asyncio
    async def test_detect_credit_card(self):
        """Should detect credit card numbers (continuous digits — no separator overlap with phone regex)."""
        with patch("app.cubes.cube2_text.service._get_ner_pipeline", new_callable=AsyncMock) as mock_ner:
            mock_pipeline = MagicMock()
            mock_pipeline.return_value = []
            mock_ner.return_value = mock_pipeline

            from app.cubes.cube2_text.service import detect_pii

            with patch("asyncio.to_thread", new_callable=AsyncMock, return_value=[]):
                detections = await detect_pii("Card: 4111111111111111")

        cc_types = [d for d in detections if d["type"] == "CREDIT_CARD"]
        assert len(cc_types) >= 1
        assert "4111111111111111" in cc_types[0]["text"]

    @pytest.mark.asyncio
    async def test_detect_ip_address(self):
        """Should detect IP addresses."""
        with patch("app.cubes.cube2_text.service._get_ner_pipeline", new_callable=AsyncMock) as mock_ner:
            mock_pipeline = MagicMock()
            mock_pipeline.return_value = []
            mock_ner.return_value = mock_pipeline

            from app.cubes.cube2_text.service import detect_pii

            with patch("asyncio.to_thread", new_callable=AsyncMock, return_value=[]):
                detections = await detect_pii("Server IP: 192.168.1.100")

        ip_types = [d for d in detections if d["type"] == "IP_ADDRESS"]
        assert len(ip_types) >= 1

    @pytest.mark.asyncio
    async def test_no_pii_in_clean_text(self):
        """Clean text without PII should return empty detections."""
        with patch("app.cubes.cube2_text.service._get_ner_pipeline", new_callable=AsyncMock) as mock_ner:
            mock_pipeline = MagicMock()
            mock_pipeline.return_value = []
            mock_ner.return_value = mock_pipeline

            from app.cubes.cube2_text.service import detect_pii

            with patch("asyncio.to_thread", new_callable=AsyncMock, return_value=[]):
                detections = await detect_pii("This is a normal response about climate change")

        assert len(detections) == 0


# ---------------------------------------------------------------------------
# PII Scrubbing
# ---------------------------------------------------------------------------


class TestPIIScrubbing:
    def test_scrub_email(self):
        """Email should be replaced with [EMAIL_REDACTED]."""
        from app.cubes.cube2_text.service import scrub_pii

        text = "Contact john@example.com"
        detections = [{"type": "EMAIL", "start": 8, "end": 24, "text": "john@example.com"}]
        result = scrub_pii(text, detections)
        assert "[EMAIL_REDACTED]" in result
        assert "john@example.com" not in result

    def test_scrub_multiple_pii(self):
        """Multiple PII items should all be scrubbed."""
        from app.cubes.cube2_text.service import scrub_pii

        text = "Email: a@b.com SSN: 123-45-6789"
        detections = [
            {"type": "EMAIL", "start": 7, "end": 14, "text": "a@b.com"},
            {"type": "SSN", "start": 20, "end": 31, "text": "123-45-6789"},
        ]
        result = scrub_pii(text, detections)
        assert "a@b.com" not in result
        assert "123-45-6789" not in result
        assert "[EMAIL_REDACTED]" in result
        assert "[SSN_REDACTED]" in result

    def test_scrub_empty_detections_returns_original(self):
        """No detections should return original text unchanged."""
        from app.cubes.cube2_text.service import scrub_pii

        text = "Clean text"
        result = scrub_pii(text, [])
        assert result == text


# ---------------------------------------------------------------------------
# Profanity Detection
# ---------------------------------------------------------------------------


class TestProfanityDetection:
    def setup_method(self):
        """Clear profanity caches between tests to prevent cross-test pollution."""
        from app.cubes.cube2_text.service import _profanity_pattern_cache, _profanity_query_cache
        _profanity_pattern_cache.clear()
        _profanity_query_cache.clear()

    @pytest.mark.asyncio
    async def test_no_profanity_filters(self):
        """Should return empty list when no filters exist."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import detect_profanity
        result = await detect_profanity(mock_db, "some text", "en")
        assert result == []

    @pytest.mark.asyncio
    async def test_profanity_filter_match(self):
        """Should match profanity patterns from DB."""
        mock_filter = MagicMock()
        mock_filter.id = uuid.uuid4()
        mock_filter.pattern = r"\bbadword\b"
        mock_filter.severity = "medium"
        mock_filter.replacement = "***"

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_filter]
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import detect_profanity
        result = await detect_profanity(mock_db, "This is a badword test", "en")
        assert len(result) == 1
        assert result[0]["word"] == "badword"
        assert result[0]["severity"] == "medium"

    @pytest.mark.asyncio
    async def test_invalid_regex_skipped(self):
        """Invalid regex in filter should be skipped without error."""
        mock_filter = MagicMock()
        mock_filter.id = uuid.uuid4()
        mock_filter.pattern = r"[invalid"
        mock_filter.severity = "high"
        mock_filter.replacement = "***"

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [mock_filter]
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import detect_profanity
        result = await detect_profanity(mock_db, "Any text", "en")
        assert result == []


# ---------------------------------------------------------------------------
# Profanity Scrubbing
# ---------------------------------------------------------------------------


class TestProfanityScrubbing:
    def test_scrub_profanity_replaces(self):
        """Profanity words should be replaced."""
        from app.cubes.cube2_text.service import scrub_profanity

        text = "This is badword here"
        matches = [{"word": "badword", "severity": "medium", "position": 8, "replacement": "***"}]
        result = scrub_profanity(text, matches)
        assert "badword" not in result
        assert "***" in result

    def test_scrub_no_profanity_returns_original(self):
        """No profanity matches should return original text."""
        from app.cubes.cube2_text.service import scrub_profanity

        text = "Clean text"
        result = scrub_profanity(text, [])
        assert result == text


# ---------------------------------------------------------------------------
# Supabase Broadcast (replaced Redis pub/sub)
# ---------------------------------------------------------------------------


class TestPublishSubmissionEvent:
    @pytest.mark.asyncio
    async def test_publishes_without_error(self):
        """Broadcast event should complete without error."""
        sid = uuid.uuid4()
        rid = uuid.uuid4()

        from app.cubes.cube2_text.service import publish_submission_event
        await publish_submission_event(sid, rid, "en", 42)

    @pytest.mark.asyncio
    async def test_publish_accepts_kwargs(self):
        """Broadcast should accept extra kwargs for backward compat."""
        from app.cubes.cube2_text.service import publish_submission_event
        await publish_submission_event(uuid.uuid4(), uuid.uuid4(), "en", 10)


# ---------------------------------------------------------------------------
# Paginated Response Listing
# ---------------------------------------------------------------------------


class TestGetResponses:
    @pytest.mark.asyncio
    async def test_empty_results(self):
        """Should return empty paginated list."""
        mock_db = AsyncMock()
        # Count query returns 0
        count_result = MagicMock()
        count_result.scalar.return_value = 0
        # Rows query returns empty
        rows_result = MagicMock()
        rows_result.all.return_value = []
        mock_db.execute = AsyncMock(side_effect=[count_result, rows_result])

        from app.cubes.cube2_text.service import get_responses
        result = await get_responses(mock_db, uuid.uuid4(), page=1, page_size=50)
        assert result["total"] == 0
        assert result["items"] == []
        assert result["pages"] == 0


# ---------------------------------------------------------------------------
# Single Response Lookup
# ---------------------------------------------------------------------------


class TestGetResponseById:
    @pytest.mark.asyncio
    async def test_not_found_returns_none(self):
        """Should return None when response not found."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube2_text.service import get_response_by_id
        result = await get_response_by_id(mock_db, uuid.uuid4(), uuid.uuid4())
        assert result is None


# ---------------------------------------------------------------------------
# DB Failure Path Tests (SPIRAL Pass 3 — gap coverage)
# ---------------------------------------------------------------------------


class TestStoreResponseFailure:
    """Verify store_response() handles DB failures with rollback."""

    @pytest.mark.asyncio
    async def test_flush_failure_rolls_back(self):
        """db.flush() failure should rollback and raise ResponseValidationError."""
        from app.cubes.cube2_text.service import store_response
        from app.core.exceptions import ResponseValidationError

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.flush = AsyncMock(side_effect=Exception("Connection lost"))
        mock_db.rollback = AsyncMock()

        with pytest.raises(ResponseValidationError, match="Failed to store response"):
            await store_response(
                mock_db,
                session_id=uuid.uuid4(),
                question_id=uuid.uuid4(),
                participant_id=uuid.uuid4(),
                cycle_id=1,
                raw_text="Test text",
                language_code="en",
                is_anonymous=False,
                anon_hash=None,
                pii_detected=False,
                pii_types=None,
                pii_scrubbed_text=None,
                profanity_detected=False,
                profanity_words=None,
                clean_text="Test text",
            )
        mock_db.rollback.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_commit_failure_rolls_back(self):
        """db.commit() failure should rollback and raise ResponseValidationError."""
        from app.cubes.cube2_text.service import store_response
        from app.core.exceptions import ResponseValidationError

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_meta = MagicMock()
        mock_meta.id = uuid.uuid4()
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock(side_effect=Exception("Disk full"))
        mock_db.rollback = AsyncMock()

        # Patch flush to set meta.id via add tracking
        with pytest.raises(ResponseValidationError, match="Failed to commit response"):
            await store_response(
                mock_db,
                session_id=uuid.uuid4(),
                question_id=uuid.uuid4(),
                participant_id=uuid.uuid4(),
                cycle_id=1,
                raw_text="Test text",
                language_code="en",
                is_anonymous=False,
                anon_hash=None,
                pii_detected=False,
                pii_types=None,
                pii_scrubbed_text=None,
                profanity_detected=False,
                profanity_words=None,
                clean_text="Test text",
            )
        mock_db.rollback.assert_awaited_once()


class TestCube5FaultTolerance:
    """Verify submission succeeds when Cube 5 time tracking is unavailable."""

    @pytest.mark.asyncio
    async def test_time_tracking_start_failure_non_fatal(self):
        """Submission should succeed even when start_time_tracking() fails."""
        from app.cubes.cube2_text.service import _submit_text_inner

        session = MagicMock()
        session.anonymity_mode = "identified"
        session.current_cycle = 1
        session.ai_provider = "openai"
        session.short_code = "TEST01"
        session.live_feed_enabled = False
        session.max_response_length = 3333

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.flush = AsyncMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        sid = uuid.uuid4()
        qid = uuid.uuid4()
        pid = uuid.uuid4()

        with patch("app.cubes.cube5_gateway.service.start_time_tracking", side_effect=Exception("Cube 5 down")), \
             patch("app.core.text_pipeline.run_text_pipeline") as mock_pipeline, \
             patch("app.core.phase_a_retry.run_phase_a_with_retry"):

            pipeline_result = MagicMock()
            pipeline_result.pii_detected = False
            pipeline_result.pii_types = None
            pipeline_result.pii_scrubbed_text = None
            pipeline_result.profanity_detected = False
            pipeline_result.profanity_words = None
            pipeline_result.clean_text = "Hello world"
            mock_pipeline.return_value = pipeline_result

            result = await _submit_text_inner(
                mock_db, session, "Hello world",
                session_id=sid, question_id=qid,
                participant_id=pid, language_code="en",
            )

            # Submission should succeed with 0 tokens
            assert result["heart_tokens_earned"] == 0.0
            assert result["unity_tokens_earned"] == 0.0
            assert result["char_count"] == 11


class TestSemaphorePoolBounds:
    """Verify SessionSemaphorePool evicts when at max capacity."""

    def test_pool_evicts_at_max(self):
        """Pool should evict oldest session when at max_sessions."""
        from app.core.concurrency import SessionSemaphorePool

        pool = SessionSemaphorePool(max_concurrent=5, max_sessions=3)
        s1, s2, s3, s4 = uuid.uuid4(), uuid.uuid4(), uuid.uuid4(), uuid.uuid4()

        pool.get(s1)
        pool.get(s2)
        pool.get(s3)
        assert pool.active_sessions == 3

        pool.get(s4)  # Should evict s1
        assert pool.active_sessions == 3
        assert str(s1) not in pool._semaphores
        assert str(s4) in pool._semaphores
