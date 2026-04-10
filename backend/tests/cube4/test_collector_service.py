"""Cube 4 — Response Collector Service Tests.

Tests:
  - Collected response aggregation (Web_Results format)
  - Response count by source type
  - Language breakdown
  - Presence tracking (Redis)
  - Summary status check
  - Single response lookup
  - Pagination
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.conftest import make_participant, make_question, make_response_meta, make_session


# ---------------------------------------------------------------------------
# Response Count
# ---------------------------------------------------------------------------


class TestResponseCount:
    @pytest.mark.asyncio
    async def test_empty_session_returns_zero(self):
        """Empty session returns 0 counts (single optimized query)."""
        from app.cubes.cube4_collector.service import get_response_count

        mock_db = AsyncMock()
        mock_result = MagicMock()
        row = MagicMock()
        row.total = 0
        row.text_count = 0
        row.voice_count = 0
        mock_result.one_or_none.return_value = row
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_response_count(mock_db, uuid.uuid4())
        assert result["total"] == 0
        assert result["text_count"] == 0
        assert result["voice_count"] == 0

    @pytest.mark.asyncio
    async def test_returns_correct_counts(self):
        """Should return correct breakdown by source type (single query)."""
        from app.cubes.cube4_collector.service import get_response_count

        mock_db = AsyncMock()
        mock_result = MagicMock()
        row = MagicMock()
        row.total = 10
        row.text_count = 7
        row.voice_count = 3
        mock_result.one_or_none.return_value = row
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_response_count(mock_db, uuid.uuid4())
        assert result["total"] == 10
        assert result["text_count"] == 7
        assert result["voice_count"] == 3


# ---------------------------------------------------------------------------
# Response Languages
# ---------------------------------------------------------------------------


class TestResponseLanguages:
    @pytest.mark.asyncio
    async def test_returns_language_breakdown(self):
        """Should return language counts grouped by language_code."""
        from app.cubes.cube4_collector.service import get_response_languages

        mock_db = AsyncMock()
        mock_row_en = MagicMock()
        mock_row_en.language_code = "en"
        mock_row_en.count = 5
        mock_row_es = MagicMock()
        mock_row_es.language_code = "es"
        mock_row_es.count = 3

        mock_result = MagicMock()
        mock_result.all.return_value = [mock_row_en, mock_row_es]
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_response_languages(mock_db, uuid.uuid4())
        assert len(result) == 2
        assert result[0]["language_code"] == "en"
        assert result[0]["count"] == 5
        assert result[1]["language_code"] == "es"
        assert result[1]["count"] == 3


# ---------------------------------------------------------------------------
# Presence Tracking
# ---------------------------------------------------------------------------


class TestPresenceTracking:
    @pytest.mark.asyncio
    async def test_empty_presence(self):
        """Empty session returns 0 active participants."""
        from app.cubes.cube4_collector.service import get_session_presence

        result = await get_session_presence(uuid.uuid4())
        assert result["active_count"] == 0
        assert result["participants"] == []

    @pytest.mark.asyncio
    async def test_presence_with_participants(self):
        """Should return participant list with timestamps."""
        from app.core.presence import set_presence, _presence
        from app.cubes.cube4_collector.service import get_session_presence

        sid = uuid.uuid4()
        await set_presence(sid, uuid.uuid4())
        await set_presence(sid, uuid.uuid4())

        result = await get_session_presence(sid)
        assert result["active_count"] == 2
        assert len(result["participants"]) == 2
        _presence.pop(str(sid), None)

    @pytest.mark.asyncio
    async def test_update_presence(self):
        """Should set participant presence in memory."""
        from app.core.presence import _presence
        from app.cubes.cube4_collector.service import update_presence

        sid = uuid.uuid4()
        pid = uuid.uuid4()
        await update_presence(sid, pid)

        assert str(pid) in _presence[str(sid)]
        _presence.pop(str(sid), None)


# ---------------------------------------------------------------------------
# Summary Status
# ---------------------------------------------------------------------------


class TestSummaryStatus:
    @pytest.mark.asyncio
    async def test_no_summaries(self):
        """Empty session returns 0 summaries (single-query optimization)."""
        from app.cubes.cube4_collector.service import get_summary_status

        mock_db = AsyncMock()
        mock_row = MagicMock()
        mock_row.total = 0
        mock_row.with_33 = 0
        mock_row.with_themes = 0
        mock_result = MagicMock()
        mock_result.one_or_none.return_value = mock_row
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_summary_status(mock_db, uuid.uuid4())
        assert result["total_summaries"] == 0
        assert result["with_33_word_summary"] == 0
        assert result["with_theme_assignment"] == 0

    @pytest.mark.asyncio
    async def test_summary_counts(self):
        """Should return correct summary/theme counts (single-query optimization)."""
        from app.cubes.cube4_collector.service import get_summary_status

        mock_db = AsyncMock()
        mock_row = MagicMock()
        mock_row.total = 10
        mock_row.with_33 = 8
        mock_row.with_themes = 5
        mock_result = MagicMock()
        mock_result.one_or_none.return_value = mock_row
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_summary_status(mock_db, uuid.uuid4())
        assert result["total_summaries"] == 10
        assert result["with_33_word_summary"] == 8
        assert result["with_theme_assignment"] == 5


# ---------------------------------------------------------------------------
# Collected Responses (Web_Results format)
# ---------------------------------------------------------------------------


def _empty_scalars():
    """Mock result with empty scalars().all() for batch-load queries."""
    r = MagicMock()
    r.scalars.return_value.all.return_value = []
    return r


def _scalars_with(items):
    """Mock result with given items in scalars().all()."""
    r = MagicMock()
    r.scalars.return_value.all.return_value = items
    return r


class TestCollectedResponses:
    @pytest.mark.asyncio
    async def test_empty_session(self):
        """Empty session returns no items."""
        from app.cubes.cube4_collector.service import get_collected_responses

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 0
        query_result = MagicMock()
        query_result.all.return_value = []

        # count + rows + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result, _empty_scalars()])

        result = await get_collected_responses(mock_db, uuid.uuid4())
        assert result["total"] == 0
        assert result["items"] == []

    @pytest.mark.asyncio
    async def test_response_has_web_results_format(self):
        """Response items should contain Web_Results columns."""
        from app.cubes.cube4_collector.service import get_collected_responses

        session_id = uuid.uuid4()
        question = make_question(session_id=session_id, question_text="What is AI?")
        participant = make_participant(session_id=session_id, display_name="TestUser")
        meta = make_response_meta(
            session_id=session_id,
            question_id=question.id,
            participant_id=participant.id,
        )

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, participant)]
        # count + rows + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result, _empty_scalars()])

        result = await get_collected_responses(mock_db, session_id)
        assert result["total"] == 1
        item = result["items"][0]

        # Verify Web_Results format columns
        assert "q_number" in item
        assert "question" in item
        assert "user" in item
        assert "detailed_results" in item
        assert "response_language" in item
        assert "native_language" in item
        assert item["q_number"] == "Q-0001"
        assert item["question"] == "What is AI?"
        assert item["user"] == "TestUser"

    @pytest.mark.asyncio
    async def test_response_includes_summaries_when_requested(self):
        """Should include 333/111/33 summaries when include_summaries=True."""
        from app.cubes.cube4_collector.service import get_collected_responses

        session_id = uuid.uuid4()
        meta = make_response_meta(session_id=session_id)
        question = make_question(session_id=session_id)
        participant = make_participant(session_id=session_id)

        summary_row = MagicMock()
        summary_row.response_meta_id = meta.id
        summary_row.summary_333 = "Long summary about governance"
        summary_row.summary_111 = "Medium summary"
        summary_row.summary_33 = "Short summary"

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, participant)]
        # count + rows + summary batch + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[
            count_result, query_result, _scalars_with([summary_row]), _empty_scalars(),
        ])

        result = await get_collected_responses(
            mock_db, session_id, include_summaries=True
        )
        item = result["items"][0]
        assert item["summary_333"] == "Long summary about governance"
        assert item["summary_111"] == "Medium summary"
        assert item["summary_33"] == "Short summary"

    @pytest.mark.asyncio
    async def test_response_includes_themes_when_requested(self):
        """Should include theme assignments when include_themes=True."""
        from app.cubes.cube4_collector.service import get_collected_responses

        session_id = uuid.uuid4()
        meta = make_response_meta(session_id=session_id)
        question = make_question(session_id=session_id)
        participant = make_participant(session_id=session_id)

        summary_row = MagicMock()
        summary_row.response_meta_id = meta.id
        summary_row.theme01 = "Risk & Concerns"
        summary_row.theme01_confidence = 92
        summary_row.theme2_9 = "Privacy Data Concerns Regulation Needed"
        summary_row.theme2_9_confidence = 85
        summary_row.theme2_6 = "Privacy Regulation"
        summary_row.theme2_6_confidence = 88
        summary_row.theme2_3 = "Regulation Required"
        summary_row.theme2_3_confidence = 91

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, participant)]
        # count + rows + summary batch + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[
            count_result, query_result, _scalars_with([summary_row]), _empty_scalars(),
        ])

        result = await get_collected_responses(
            mock_db, session_id, include_themes=True
        )
        item = result["items"][0]
        assert item["theme01"] == "Risk & Concerns"
        assert item["theme01_confidence"] == 92
        assert item["theme2_9"] == "Privacy Data Concerns Regulation Needed"
        assert item["theme2_3"] == "Regulation Required"

    @pytest.mark.asyncio
    async def test_native_language_from_participant(self):
        """Native language should come from participant.language_code."""
        from app.cubes.cube4_collector.service import get_collected_responses

        session_id = uuid.uuid4()
        meta = make_response_meta(session_id=session_id)
        question = make_question(session_id=session_id)
        participant = make_participant(session_id=session_id, language_code="es")

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, participant)]
        # count + rows + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result, _empty_scalars()])

        result = await get_collected_responses(mock_db, session_id)
        item = result["items"][0]
        assert item["native_language"] == "es"


# ---------------------------------------------------------------------------
# Single Response Lookup
# ---------------------------------------------------------------------------


class TestSingleResponse:
    @pytest.mark.asyncio
    async def test_not_found(self):
        """Should return None for nonexistent response."""
        from app.cubes.cube4_collector.service import get_single_response

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_single_response(mock_db, uuid.uuid4(), uuid.uuid4())
        assert result is None

    @pytest.mark.asyncio
    async def test_found_with_full_data(self):
        """Should return full response data including summaries and themes."""
        from app.cubes.cube4_collector.service import get_single_response

        session_id = uuid.uuid4()
        meta = make_response_meta(session_id=session_id)
        question = make_question(session_id=session_id)
        participant = make_participant(session_id=session_id)

        summary_row = MagicMock()
        summary_row.response_meta_id = meta.id
        summary_row.summary_333 = "Long summary"
        summary_row.summary_111 = "Medium summary"
        summary_row.summary_33 = "Short summary"
        summary_row.theme01 = "Supporting Comments"
        summary_row.theme01_confidence = 92
        summary_row.theme2_9 = "Positive"
        summary_row.theme2_9_confidence = 85
        summary_row.theme2_6 = "Good"
        summary_row.theme2_6_confidence = 88
        summary_row.theme2_3 = "Great"
        summary_row.theme2_3_confidence = 91

        mock_db = AsyncMock()
        row_result = MagicMock()
        row_result.one_or_none.return_value = (meta, question, participant)
        text_resp_result = MagicMock()
        text_resp_result.scalar_one_or_none.return_value = None
        summary_result = MagicMock()
        summary_result.scalar_one_or_none.return_value = summary_row
        # row + text_resp + summary
        mock_db.execute = AsyncMock(side_effect=[row_result, text_resp_result, summary_result])

        result = await get_single_response(mock_db, session_id, meta.id)
        assert result is not None
        assert result["q_number"].startswith("Q-")
        assert result["summary_333"] == "Long summary"
        assert result["theme01"] == "Supporting Comments"


# ---------------------------------------------------------------------------
# Cube 4 Phase 1 Tests — C4-4 (Anon Hash), Auth, Error Handling, Optimization
# ---------------------------------------------------------------------------


class TestAnonHashCollision:
    """C4-4 / CRS-09.01: SHA-256 anon_hash replaces 8-char UUID prefix."""

    def test_anon_hash_is_12_chars(self):
        """Anon hash should be 12-char hex (SHA-256 truncated)."""
        import hashlib
        pid = uuid.uuid4()
        sid = uuid.uuid4()
        h = hashlib.sha256(f"{pid}:{sid}".encode()).hexdigest()[:12]
        assert len(h) == 12
        assert all(c in "0123456789abcdef" for c in h)

    def test_anon_hash_deterministic(self):
        """Same participant+session should produce same hash."""
        import hashlib
        pid = uuid.uuid4()
        sid = uuid.uuid4()
        h1 = hashlib.sha256(f"{pid}:{sid}".encode()).hexdigest()[:12]
        h2 = hashlib.sha256(f"{pid}:{sid}".encode()).hexdigest()[:12]
        assert h1 == h2

    def test_anon_hash_session_scoped(self):
        """Same participant in different sessions should get different hashes."""
        import hashlib
        pid = uuid.uuid4()
        s1 = uuid.uuid4()
        s2 = uuid.uuid4()
        h1 = hashlib.sha256(f"{pid}:{s1}".encode()).hexdigest()[:12]
        h2 = hashlib.sha256(f"{pid}:{s2}".encode()).hexdigest()[:12]
        assert h1 != h2


class TestSessionValidation:
    """CRS-09: Session existence validation on read endpoints."""

    @pytest.mark.asyncio
    async def test_valid_session_passes(self):
        from app.cubes.cube4_collector.service import validate_session_exists
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = uuid.uuid4()
        mock_db.execute = AsyncMock(return_value=mock_result)
        await validate_session_exists(mock_db, uuid.uuid4())

    @pytest.mark.asyncio
    async def test_missing_session_raises(self):
        from app.cubes.cube4_collector.service import validate_session_exists
        from app.core.exceptions import SessionNotFoundError
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)
        with pytest.raises(SessionNotFoundError):
            await validate_session_exists(mock_db, uuid.uuid4())


class TestResponseCountOptimized:
    """Efficiency: response_count uses single query instead of 3."""

    @pytest.mark.asyncio
    async def test_single_query_returns_breakdown(self):
        from app.cubes.cube4_collector.service import get_response_count
        mock_db = AsyncMock()
        mock_result = MagicMock()
        row = MagicMock()
        row.total = 10
        row.text_count = 7
        row.voice_count = 3
        mock_result.one_or_none.return_value = row
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_response_count(mock_db, uuid.uuid4())
        assert result["total"] == 10
        assert result["text_count"] == 7
        assert result["voice_count"] == 3


# ---------------------------------------------------------------------------
# Cube 4 Phase 3: CRS-10 Desired Outcomes Tests
# ---------------------------------------------------------------------------


class TestCreateDesiredOutcome:
    """CRS-10.01: Create desired outcome for a session."""

    @pytest.mark.asyncio
    async def test_creates_outcome(self):
        from app.cubes.cube4_collector.service import create_desired_outcome

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        outcome = await create_desired_outcome(
            mock_db, uuid.uuid4(),
            description="Achieve consensus on AI governance priorities",
            time_estimate_minutes=30,
        )
        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_sets_pending_status(self):
        from app.cubes.cube4_collector.service import create_desired_outcome

        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        await create_desired_outcome(mock_db, uuid.uuid4(), description="Test")
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.outcome_status == "pending"
        assert added_obj.all_confirmed is False


class TestRecordConfirmation:
    """CRS-10.01: Record participant confirmation."""

    @pytest.mark.asyncio
    async def test_appends_participant(self):
        from app.cubes.cube4_collector.service import record_confirmation

        outcome_mock = MagicMock()
        outcome_mock.id = uuid.uuid4()
        outcome_mock.confirmed_by = []
        outcome_mock.all_confirmed = False

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = outcome_mock
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        pid = uuid.uuid4()
        result = await record_confirmation(mock_db, uuid.uuid4(), outcome_mock.id, pid)
        assert str(pid) in result["confirmed_by"]

    @pytest.mark.asyncio
    async def test_idempotent_confirmation(self):
        from app.cubes.cube4_collector.service import record_confirmation

        pid = uuid.uuid4()
        outcome_mock = MagicMock()
        outcome_mock.id = uuid.uuid4()
        outcome_mock.confirmed_by = [str(pid)]
        outcome_mock.all_confirmed = False

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = outcome_mock
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        result = await record_confirmation(mock_db, uuid.uuid4(), outcome_mock.id, pid)
        assert result["confirmed_by"].count(str(pid)) == 1


class TestCheckAllConfirmed:
    """CRS-10.02: Gate opens when all required participants confirm."""

    @pytest.mark.asyncio
    async def test_returns_true_when_met(self):
        from app.cubes.cube4_collector.service import check_all_confirmed

        outcome_mock = MagicMock()
        outcome_mock.confirmed_by = ["a", "b", "c"]
        outcome_mock.all_confirmed = False

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = outcome_mock
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()

        result = await check_all_confirmed(mock_db, uuid.uuid4(), uuid.uuid4(), required_count=3)
        assert result is True

    @pytest.mark.asyncio
    async def test_returns_false_when_insufficient(self):
        from app.cubes.cube4_collector.service import check_all_confirmed

        outcome_mock = MagicMock()
        outcome_mock.confirmed_by = ["a"]
        outcome_mock.all_confirmed = False

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = outcome_mock
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await check_all_confirmed(mock_db, uuid.uuid4(), uuid.uuid4(), required_count=3)
        assert result is False


class TestLogPostTaskResults:
    """CRS-10.03: Store post-task results."""

    @pytest.mark.asyncio
    async def test_stores_results(self):
        from app.cubes.cube4_collector.service import log_post_task_results

        outcome_mock = MagicMock()
        outcome_mock.id = uuid.uuid4()
        outcome_mock.assessed_by = []

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = outcome_mock
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        await log_post_task_results(
            mock_db, uuid.uuid4(), outcome_mock.id,
            results_log="We achieved 80% consensus.",
            outcome_status="achieved",
        )
        assert outcome_mock.results_log == "We achieved 80% consensus."
        assert outcome_mock.outcome_status == "achieved"

    @pytest.mark.asyncio
    async def test_rejects_invalid_status(self):
        from app.cubes.cube4_collector.service import log_post_task_results
        from app.core.exceptions import ResponseValidationError

        outcome_mock = MagicMock()
        outcome_mock.id = uuid.uuid4()
        outcome_mock.assessed_by = []

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = outcome_mock
        mock_db.execute = AsyncMock(return_value=mock_result)

        with pytest.raises(ResponseValidationError):
            await log_post_task_results(
                mock_db, uuid.uuid4(), outcome_mock.id,
                results_log="Test",
                outcome_status="invalid_status",
            )
