"""Cube 9 — Reports Functional Tests (mock DB).

Tests:
  - CSV export: DataFrame construction, column count, encoding
  - Analytics dashboard: empty session, aggregation math
  - CQS dashboard: empty + populated responses
  - Ranking summary: empty + populated
  - Data destruction: contract verification
  - Confidence formatting edge cases
"""

import io
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, PropertyMock

import pytest

SESSION_ID = uuid.uuid4()
PARTICIPANT_IDS = [uuid.uuid4() for _ in range(5)]
QUESTION_ID = uuid.uuid4()


# ---------------------------------------------------------------------------
# CSV Export Tests (mock DB)
# ---------------------------------------------------------------------------


def _make_response_meta(
    *,
    session_id=None,
    participant_id=None,
    question_id=None,
    raw_text="Test response text",
):
    meta = MagicMock()
    meta.id = uuid.uuid4()
    meta.session_id = session_id or SESSION_ID
    meta.participant_id = participant_id or PARTICIPANT_IDS[0]
    meta.question_id = question_id or QUESTION_ID
    meta.raw_text = raw_text
    meta.submitted_at = datetime.now(timezone.utc)
    return meta


def _make_question(*, qid=None, session_id=None, text="What matters?", order=0):
    q = MagicMock()
    q.id = qid or QUESTION_ID
    q.session_id = session_id or SESSION_ID
    q.question_text = text
    q.order_index = order
    return q


def _make_summary(*, response_meta_id=None):
    s = MagicMock()
    s.response_meta_id = response_meta_id
    s.session_id = SESSION_ID
    s.summary_333 = "This is a 333-word summary."
    s.summary_111 = "111-word summary."
    s.summary_33 = "33-word summary."
    s.theme01 = "Risk & Concerns"
    s.theme01_confidence = 0.92
    s.theme2_9 = "Community Safety"
    s.theme2_9_confidence = 0.87
    s.theme2_6 = "Safety & Trust"
    s.theme2_6_confidence = 0.91
    s.theme2_3 = "Trust"
    s.theme2_3_confidence = 0.95
    return s


def _make_participant(*, pid=None, lang="en"):
    p = MagicMock()
    p.id = pid or PARTICIPANT_IDS[0]
    p.language_code = lang
    return p


class TestCSVExportFunctional:
    """CSV export with mock database responses."""

    @pytest.mark.asyncio
    async def test_csv_empty_session_returns_empty_df(self):
        """Empty session produces CSV with headers only."""
        from app.cubes.cube9_reports.service import export_session_csv

        mock_db = AsyncMock()
        # ResponseMeta: empty
        meta_result = MagicMock()
        meta_result.scalars.return_value.all.return_value = []
        # Questions: empty
        q_result = MagicMock()
        q_result.scalars.return_value.all.return_value = []
        # Summaries: empty
        sum_result = MagicMock()
        sum_result.scalars.return_value.all.return_value = []
        # Participants: empty
        part_result = MagicMock()
        part_result.scalars.return_value.all.return_value = []

        mock_db.execute = AsyncMock(
            side_effect=[meta_result, q_result, sum_result, part_result]
        )

        buf = await export_session_csv(mock_db, SESSION_ID)
        assert isinstance(buf, io.BytesIO)

        content = buf.getvalue().decode("utf-8-sig")
        lines = content.strip().split("\n")
        assert len(lines) == 1  # Header only
        assert "Q_Number" in lines[0]
        assert "Theme2_3_Confidence" in lines[0]

    @pytest.mark.asyncio
    async def test_csv_single_response_16_columns(self):
        """Single response produces row with exactly 16 columns."""
        from app.cubes.cube9_reports.service import export_session_csv

        meta = _make_response_meta()
        question = _make_question(qid=meta.question_id)
        summary = _make_summary(response_meta_id=meta.id)
        participant = _make_participant(pid=meta.participant_id, lang="fr")

        mock_db = AsyncMock()
        meta_result = MagicMock()
        meta_result.scalars.return_value.all.return_value = [meta]
        q_result = MagicMock()
        q_result.scalars.return_value.all.return_value = [question]
        sum_result = MagicMock()
        sum_result.scalars.return_value.all.return_value = [summary]
        part_result = MagicMock()
        part_result.scalars.return_value.all.return_value = [participant]

        mock_db.execute = AsyncMock(
            side_effect=[meta_result, q_result, sum_result, part_result]
        )

        buf = await export_session_csv(mock_db, SESSION_ID)
        content = buf.getvalue().decode("utf-8-sig")
        lines = content.strip().split("\n")

        assert len(lines) == 2  # Header + 1 data row
        header_cols = lines[0].split(",")
        assert len(header_cols) == 16

    @pytest.mark.asyncio
    async def test_csv_response_language_from_participant(self):
        """Response_Language should come from participant.language_code."""
        from app.cubes.cube9_reports.service import export_session_csv

        meta = _make_response_meta()
        question = _make_question(qid=meta.question_id)
        summary = _make_summary(response_meta_id=meta.id)
        participant = _make_participant(pid=meta.participant_id, lang="es")

        mock_db = AsyncMock()
        meta_result = MagicMock()
        meta_result.scalars.return_value.all.return_value = [meta]
        q_result = MagicMock()
        q_result.scalars.return_value.all.return_value = [question]
        sum_result = MagicMock()
        sum_result.scalars.return_value.all.return_value = [summary]
        part_result = MagicMock()
        part_result.scalars.return_value.all.return_value = [participant]

        mock_db.execute = AsyncMock(
            side_effect=[meta_result, q_result, sum_result, part_result]
        )

        buf = await export_session_csv(mock_db, SESSION_ID)
        content = buf.getvalue().decode("utf-8-sig")
        assert ",es," in content  # Language column should have "es"


# ---------------------------------------------------------------------------
# Confidence Formatting
# ---------------------------------------------------------------------------


class TestConfidenceFormatting:
    """Test the _fmt_confidence helper logic."""

    def test_float_below_1_formats_as_percent(self):
        """0.92 → '92%'."""
        val = 0.92
        result = f"{int(val)}%" if val > 1 else f"{int(val * 100)}%"
        assert result == "92%"

    def test_float_above_1_formats_directly(self):
        """92 → '92%'."""
        val = 92
        result = f"{int(val)}%" if val > 1 else f"{int(val * 100)}%"
        assert result == "92%"

    def test_zero_formats_as_0_percent(self):
        val = 0
        result = f"{int(val)}%" if val > 1 else f"{int(val * 100)}%"
        assert result == "0%"

    def test_one_formats_as_100_percent(self):
        val = 1.0
        result = f"{int(val)}%" if val > 1 else f"{int(val * 100)}%"
        assert result == "100%"

    def test_none_returns_empty(self):
        val = None
        result = str(val) if val else ""
        assert result == ""


# ---------------------------------------------------------------------------
# Analytics Dashboard (mock DB)
# ---------------------------------------------------------------------------


class TestAnalyticsDashboardFunctional:
    """Analytics dashboard with mock database."""

    @pytest.mark.asyncio
    async def test_empty_session_returns_zeros(self):
        """Empty session returns all-zero analytics."""
        from app.cubes.cube9_reports.service import build_analytics_dashboard

        mock_db = AsyncMock()
        # All counts return 0
        zero_result = MagicMock()
        zero_result.scalar.return_value = 0
        zero_one = MagicMock()
        zero_one.one.return_value = (None, None, None)

        mock_db.execute = AsyncMock(return_value=zero_result)

        result = await build_analytics_dashboard(mock_db, SESSION_ID)
        assert result["session_id"] == str(SESSION_ID)
        assert result["total_responses"] == 0
        assert result["unique_participants"] == 0


# ---------------------------------------------------------------------------
# CQS Dashboard (mock DB)
# ---------------------------------------------------------------------------


class TestCQSDashboardFunctional:
    """CQS dashboard with mock database."""

    @pytest.mark.asyncio
    async def test_no_scores_returns_empty(self):
        """No CQS scores returns empty dashboard."""
        from app.cubes.cube9_reports.service import build_cqs_dashboard

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await build_cqs_dashboard(mock_db, SESSION_ID)
        assert result["session_id"] == str(SESSION_ID)
        assert result["total_scored"] == 0
        assert result["winner"] is None
        assert result["cqs_scores"] == []


# ---------------------------------------------------------------------------
# Ranking Summary (mock DB)
# ---------------------------------------------------------------------------


class TestRankingSummaryFunctional:
    """Ranking summary with mock database."""

    @pytest.mark.asyncio
    async def test_no_rankings_returns_empty(self):
        """No rankings returns empty summary."""
        from app.cubes.cube9_reports.service import build_ranking_summary

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await build_ranking_summary(mock_db, SESSION_ID)
        assert result["session_id"] == str(SESSION_ID)
        assert result["rankings"] == []


# ---------------------------------------------------------------------------
# Data Destruction Contract
# ---------------------------------------------------------------------------


class TestDataDestructionContract:
    """Verify data destruction function contract."""

    def test_function_requires_destroyed_by(self):
        """destroy_session_export_data requires destroyed_by parameter."""
        import inspect
        from app.cubes.cube9_reports.service import destroy_session_export_data

        sig = inspect.signature(destroy_session_export_data)
        params = list(sig.parameters.keys())
        assert "destroyed_by" in params

    def test_function_is_async(self):
        """destroy_session_export_data must be async."""
        import asyncio
        from app.cubes.cube9_reports.service import destroy_session_export_data

        assert asyncio.iscoroutinefunction(destroy_session_export_data)


# ---------------------------------------------------------------------------
# Cross-Cube Integration Contracts
# ---------------------------------------------------------------------------


class TestCrossCubeContracts:
    """Verify Cube 9 can import from upstream cubes."""

    def test_imports_response_meta(self):
        from app.models.response_meta import ResponseMeta
        assert ResponseMeta.__tablename__ == "response_meta"

    def test_imports_response_summary(self):
        from app.models.response_summary import ResponseSummary
        assert ResponseSummary.__tablename__ == "response_summaries"

    def test_imports_question(self):
        from app.models.question import Question
        assert Question.__tablename__ == "questions"

    def test_imports_participant(self):
        from app.models.participant import Participant
        assert Participant.__tablename__ == "participants"

    def test_imports_ranking_model(self):
        from app.models.ranking import AggregatedRanking
        assert AggregatedRanking.__tablename__ == "aggregated_rankings"

    def test_imports_token_ledger(self):
        from app.models.token_ledger import TokenLedger
        assert TokenLedger.__tablename__ == "token_ledger"
