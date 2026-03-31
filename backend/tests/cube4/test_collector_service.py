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
        """Empty session returns 0 counts."""
        from app.cubes.cube4_collector.service import get_response_count

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar.return_value = 0
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_response_count(mock_db, uuid.uuid4())
        assert result["total"] == 0
        assert result["text_count"] == 0
        assert result["voice_count"] == 0

    @pytest.mark.asyncio
    async def test_returns_correct_counts(self):
        """Should return correct breakdown by source type."""
        from app.cubes.cube4_collector.service import get_response_count

        mock_db = AsyncMock()
        call_count = 0
        counts = [10, 7, 3]  # total, text, voice

        def _make_result():
            nonlocal call_count
            mock_result = MagicMock()
            mock_result.scalar.return_value = counts[call_count]
            call_count += 1
            return mock_result

        mock_db.execute = AsyncMock(side_effect=lambda *a: _make_result())

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

        mock_redis = AsyncMock()
        mock_redis.hgetall = AsyncMock(return_value={})

        result = await get_session_presence(mock_redis, uuid.uuid4())
        assert result["active_count"] == 0
        assert result["participants"] == []

    @pytest.mark.asyncio
    async def test_presence_with_participants(self):
        """Should return participant list with timestamps."""
        from app.cubes.cube4_collector.service import get_session_presence

        mock_redis = AsyncMock()
        mock_redis.hgetall = AsyncMock(return_value={
            "pid-1": "2026-02-26T10:00:00Z",
            "pid-2": "2026-02-26T10:01:00Z",
        })

        result = await get_session_presence(mock_redis, uuid.uuid4())
        assert result["active_count"] == 2
        assert len(result["participants"]) == 2

    @pytest.mark.asyncio
    async def test_update_presence(self):
        """Should set participant presence in Redis."""
        from app.cubes.cube4_collector.service import update_presence

        mock_redis = AsyncMock()
        mock_redis.hset = AsyncMock()
        mock_redis.expire = AsyncMock()

        sid = uuid.uuid4()
        pid = uuid.uuid4()
        await update_presence(mock_redis, sid, pid)

        mock_redis.hset.assert_called_once()
        mock_redis.expire.assert_called_once()


# ---------------------------------------------------------------------------
# Summary Status
# ---------------------------------------------------------------------------


class TestSummaryStatus:
    @pytest.mark.asyncio
    async def test_no_summaries(self):
        """Empty session returns 0 summaries."""
        from app.cubes.cube4_collector.service import get_summary_status

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar.return_value = 0
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_summary_status(mock_db, uuid.uuid4())
        assert result["total_summaries"] == 0
        assert result["with_33_word_summary"] == 0
        assert result["with_theme_assignment"] == 0

    @pytest.mark.asyncio
    async def test_summary_counts(self):
        """Should return correct summary/theme counts."""
        from app.cubes.cube4_collector.service import get_summary_status

        mock_db = AsyncMock()
        call_count = 0
        counts = [10, 8, 5]  # total, with_33, with_themes

        async def _execute(*args, **kwargs):
            nonlocal call_count
            mock_result = MagicMock()
            mock_result.scalar.return_value = counts[call_count]
            call_count += 1
            return mock_result

        mock_db.execute = _execute

        result = await get_summary_status(mock_db, uuid.uuid4())
        assert result["total_summaries"] == 10
        assert result["with_33_word_summary"] == 8
        assert result["with_theme_assignment"] == 5


# ---------------------------------------------------------------------------
# Collected Responses (Web_Results format)
# ---------------------------------------------------------------------------


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

        mock_db.execute = AsyncMock(side_effect=[count_result, query_result])

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
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result])

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

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, participant)]
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result])

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

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, participant)]
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result])

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
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result])

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

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.one_or_none.return_value = (meta, question, participant)
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_single_response(mock_db, session_id, meta.id)
        assert result is not None
        assert result["q_number"].startswith("Q-")
        assert result["summary_333"] == "Long summary"
        assert result["theme01"] == "Supporting Comments"
