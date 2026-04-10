"""Cube 4 — Response Collector E2E Flow Tests.

Tests the complete flow from response collection through to
Web_Results format output, matching the monolith CSV structure.

NOT YET IMPLEMENTED:
  - Live API tests (require running DB + Supabase)
  - Full pipeline integration with Cube 2 + Cube 6

These tests validate the service functions with mocked dependencies.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from tests.conftest import make_participant, make_question, make_response_meta, make_session


# ---------------------------------------------------------------------------
# Test Method Documentation (Cube 10 Reference)
# ---------------------------------------------------------------------------

CUBE4_TEST_METHOD = {
    "cube": "cube4_collector",
    "version": "1.0.0",
    "test_command": "python -m pytest tests/cube4/ -v --tb=short",
    "test_files": [
        "tests/cube4/test_collector_service.py",
        "tests/cube4/test_e2e_flows.py",
    ],
    "baseline_metrics": {
        "unit_tests_passed": 17,
        "e2e_tests_passed": 10,
        "total_tests": 27,
    },
    "flows": {
        "collection": "Aggregate responses from Postgres -> Web_Results format",
        "presence": "Track active participants via in-memory presence",
        "summary_status": "Check Postgres for summary generation progress",
        "languages": "Break down response languages for session stats",
    },
    "spiral_propagation": {
        "forward": {
            "cube6": "Cube 6 fetches summaries from Postgres (stored by Cube 4 format)",
            "cube7": "Ranking uses Theme01/Theme2 assignments from collected data",
            "cube9": "Export uses Web_Results format from Cube 4 collector",
        },
        "backward": {
            "cube2": "Text responses stored by Cube 2 are aggregated by Cube 4",
            "cube3": "Voice transcripts stored by Cube 3 are aggregated by Cube 4",
            "cube1": "Session metadata (questions, participants) from Cube 1",
        },
    },
}


# ---------------------------------------------------------------------------
# E2E: Collection Flow
# ---------------------------------------------------------------------------


class TestCollectionFlow:
    """E2E test for the response collection -> Web_Results format pipeline."""

    @pytest.mark.asyncio
    async def test_full_collection_no_summaries(self):
        """Collect responses without requesting summaries."""
        from app.cubes.cube4_collector.service import get_collected_responses

        session_id = uuid.uuid4()
        meta = make_response_meta(session_id=session_id)
        question = make_question(session_id=session_id, question_text="What do you think?")
        participant = make_participant(session_id=session_id, display_name="Alice")

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, participant)]
        _empty = MagicMock()
        _empty.scalars.return_value.all.return_value = []
        # count + rows + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result, _empty])

        result = await get_collected_responses(mock_db, session_id)
        assert result["total"] == 1
        item = result["items"][0]
        assert item["user"] == "Alice"
        assert item["response_language"] == "English"
        assert "summary_333" not in item  # Not requested

    @pytest.mark.asyncio
    async def test_full_collection_with_summaries_and_themes(self):
        """Collect responses with summaries + theme assignments."""
        from app.cubes.cube4_collector.service import get_collected_responses

        session_id = uuid.uuid4()
        meta = make_response_meta(session_id=session_id)
        question = make_question(session_id=session_id)
        participant = make_participant(session_id=session_id)

        # Mock summary row for include_summaries + include_themes
        summary_row = MagicMock()
        summary_row.response_meta_id = meta.id
        summary_row.summary_333 = "Three-hundred-thirty-three word summary"
        summary_row.summary_111 = "One-hundred-eleven word summary"
        summary_row.summary_33 = "Thirty-three word summary"
        summary_row.theme01 = "Supporting Comments"
        summary_row.theme01_confidence = 92
        summary_row.theme2_9 = "Positive Outlook"
        summary_row.theme2_9_confidence = 85
        summary_row.theme2_6 = "Community Impact"
        summary_row.theme2_6_confidence = 88
        summary_row.theme2_3 = "Positive Impact"
        summary_row.theme2_3_confidence = 91

        _summary_batch = MagicMock()
        _summary_batch.scalars.return_value.all.return_value = [summary_row]
        _empty = MagicMock()
        _empty.scalars.return_value.all.return_value = []

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, participant)]
        # count + rows + summary batch + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result, _summary_batch, _empty])

        result = await get_collected_responses(
            mock_db, session_id,
            include_summaries=True,
            include_themes=True,
        )
        item = result["items"][0]
        assert item["summary_33"] == "Thirty-three word summary"
        assert item["theme01"] == "Supporting Comments"
        assert item["theme2_3"] == "Positive Impact"
        assert item["theme2_3_confidence"] == 91


class TestMultiLanguageCollection:
    """Test collection with responses in multiple languages."""

    @pytest.mark.asyncio
    async def test_mixed_language_responses(self):
        """Should correctly aggregate responses in different languages."""
        from app.cubes.cube4_collector.service import get_collected_responses

        session_id = uuid.uuid4()

        # Two participants: English and Spanish
        meta1 = make_response_meta(session_id=session_id)
        q = make_question(session_id=session_id)
        p1 = make_participant(session_id=session_id, display_name="John", language_code="en")

        meta2 = make_response_meta(session_id=session_id)
        p2 = make_participant(session_id=session_id, display_name="Maria", language_code="es")

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 2
        query_result = MagicMock()
        query_result.all.return_value = [(meta1, q, p1), (meta2, q, p2)]
        _empty = MagicMock()
        _empty.scalars.return_value.all.return_value = []
        # count + rows + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result, _empty])

        result = await get_collected_responses(mock_db, session_id)
        assert result["total"] == 2
        assert result["items"][0]["native_language"] == "en"
        assert result["items"][1]["native_language"] == "es"


class TestAnonymousCollection:
    """Test collection with anonymous participants."""

    @pytest.mark.asyncio
    async def test_anonymous_participant_shows_anonymous(self):
        """Anonymous participant should show 'Anonymous' as user."""
        from app.cubes.cube4_collector.service import get_collected_responses

        session_id = uuid.uuid4()
        meta = make_response_meta(session_id=session_id, participant_id=None)
        meta.participant_id = None
        question = make_question(session_id=session_id)

        _empty = MagicMock()
        _empty.scalars.return_value.all.return_value = []

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, None)]  # No participant
        # count + rows + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result, _empty])

        result = await get_collected_responses(mock_db, session_id)
        item = result["items"][0]
        assert item["user"] == "Anonymous"


class TestPagination:
    """Test pagination of collected responses."""

    @pytest.mark.asyncio
    async def test_pagination_params_passed(self):
        """Page and page_size should be correctly applied."""
        from app.cubes.cube4_collector.service import get_collected_responses

        _empty = MagicMock()
        _empty.scalars.return_value.all.return_value = []

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 100
        query_result = MagicMock()
        query_result.all.return_value = []
        # count + rows + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result, _empty])

        result = await get_collected_responses(
            mock_db, uuid.uuid4(), page=3, page_size=25
        )
        assert result["total"] == 100
        assert result["page"] == 3
        assert result["page_size"] == 25


class TestVoiceResponseCollection:
    """Test collection of voice responses."""

    @pytest.mark.asyncio
    async def test_voice_response_uses_transcript(self):
        """Voice responses should use transcript as detailed_results."""
        from app.cubes.cube4_collector.service import get_collected_responses

        session_id = uuid.uuid4()
        meta = make_response_meta(session_id=session_id, source="voice", raw_text="Voice transcript of the response")
        question = make_question(session_id=session_id)
        participant = make_participant(session_id=session_id)

        # Build TextResponse mock for batch-load
        text_resp = MagicMock()
        text_resp.response_meta_id = meta.id
        text_resp.clean_text = "Voice transcript of the response"
        text_resp.pii_detected = False
        text_resp.pii_scrubbed_text = None

        _text_batch = MagicMock()
        _text_batch.scalars.return_value.all.return_value = [text_resp]

        mock_db = AsyncMock()
        count_result = MagicMock()
        count_result.scalar.return_value = 1
        query_result = MagicMock()
        query_result.all.return_value = [(meta, question, participant)]
        # count + rows + text_resp batch
        mock_db.execute = AsyncMock(side_effect=[count_result, query_result, _text_batch])

        result = await get_collected_responses(mock_db, session_id)
        item = result["items"][0]
        assert item["source"] == "voice"
        assert item["detailed_results"] == "Voice transcript of the response"
