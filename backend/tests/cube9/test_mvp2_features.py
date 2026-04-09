"""Cube 9 — MVP2+ Feature Tests.

Tests:
  - CRS-14.02: PDF export stub
  - CRS-14.05: Results distribution eligibility
  - CRS-14.01: Reward winner announcement
  - Router: new endpoints exist (8 total)
"""

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube9_reports.service import (
    distribute_results,
    announce_reward_winner,
    generate_pdf_stub,
)

SESSION_ID = uuid.uuid4()


# ---------------------------------------------------------------------------
# CRS-14.02: PDF Export Stub
# ---------------------------------------------------------------------------


class TestPDFExportStub:
    """PDF export returns MVP2 stub message."""

    @pytest.mark.asyncio
    async def test_returns_stub_status(self):
        mock_db = AsyncMock()
        result = await generate_pdf_stub(mock_db, SESSION_ID)
        assert result["status"] == "not_implemented"
        assert result["mvp"] == 2

    @pytest.mark.asyncio
    async def test_includes_session_id(self):
        mock_db = AsyncMock()
        result = await generate_pdf_stub(mock_db, SESSION_ID)
        assert result["session_id"] == str(SESSION_ID)


# ---------------------------------------------------------------------------
# CRS-14.05: Results Distribution
# ---------------------------------------------------------------------------


def _make_participant(*, pid=None, payment_status="unpaid"):
    p = MagicMock()
    p.id = pid or uuid.uuid4()
    p.payment_status = payment_status
    return p


def _make_session(*, pricing_tier="free"):
    s = MagicMock()
    s.pricing_tier = pricing_tier
    return s


class TestResultsDistribution:
    """Results eligibility based on pricing tier + payment status."""

    @pytest.mark.asyncio
    async def test_free_tier_all_eligible(self):
        mock_db = AsyncMock()
        session = _make_session(pricing_tier="free")
        participants = [_make_participant() for _ in range(5)]

        sess_result = MagicMock()
        sess_result.scalar_one_or_none.return_value = session
        part_result = MagicMock()
        part_result.scalars.return_value.all.return_value = participants

        mock_db.execute = AsyncMock(side_effect=[sess_result, part_result])

        result = await distribute_results(mock_db, SESSION_ID)
        assert result["eligible_count"] == 5
        assert result["ineligible_count"] == 0

    @pytest.mark.asyncio
    async def test_cost_split_filters_unpaid(self):
        mock_db = AsyncMock()
        session = _make_session(pricing_tier="cost_split")
        participants = [
            _make_participant(payment_status="paid"),
            _make_participant(payment_status="paid"),
            _make_participant(payment_status="unpaid"),
            _make_participant(payment_status="lead_exempt"),
        ]

        sess_result = MagicMock()
        sess_result.scalar_one_or_none.return_value = session
        part_result = MagicMock()
        part_result.scalars.return_value.all.return_value = participants

        mock_db.execute = AsyncMock(side_effect=[sess_result, part_result])

        result = await distribute_results(mock_db, SESSION_ID)
        assert result["eligible_count"] == 3  # 2 paid + 1 lead_exempt
        assert result["ineligible_count"] == 1  # 1 unpaid

    @pytest.mark.asyncio
    async def test_moderator_paid_all_eligible(self):
        mock_db = AsyncMock()
        session = _make_session(pricing_tier="moderator_paid")
        participants = [_make_participant(payment_status="unpaid") for _ in range(3)]

        sess_result = MagicMock()
        sess_result.scalar_one_or_none.return_value = session
        part_result = MagicMock()
        part_result.scalars.return_value.all.return_value = participants

        mock_db.execute = AsyncMock(side_effect=[sess_result, part_result])

        result = await distribute_results(mock_db, SESSION_ID)
        assert result["eligible_count"] == 3

    @pytest.mark.asyncio
    async def test_missing_session(self):
        mock_db = AsyncMock()
        sess_result = MagicMock()
        sess_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=sess_result)

        result = await distribute_results(mock_db, SESSION_ID)
        assert "error" in result


# ---------------------------------------------------------------------------
# CRS-14.01: Reward Winner Announcement
# ---------------------------------------------------------------------------


class TestRewardAnnouncement:
    """CQS winner announcement."""

    @pytest.mark.asyncio
    async def test_no_winner(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await announce_reward_winner(mock_db, SESSION_ID)
        assert result["has_winner"] is False

    @pytest.mark.asyncio
    async def test_winner_found(self):
        mock_db = AsyncMock()
        winner = MagicMock()
        winner.participant_id = uuid.uuid4()
        winner.composite_cqs = 0.87
        winner.theme2_cluster_label = "Innovation"
        winner.is_winner = True

        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = winner
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await announce_reward_winner(mock_db, SESSION_ID)
        assert result["has_winner"] is True
        assert result["winner"]["composite_cqs"] == 0.87

    def test_function_is_async(self):
        import asyncio
        assert asyncio.iscoroutinefunction(announce_reward_winner)


# ---------------------------------------------------------------------------
# Router Structure
# ---------------------------------------------------------------------------


class TestCube9RouterMVP2:
    """Verify all 8 endpoints exist."""

    def test_endpoint_count(self):
        from app.cubes.cube9_reports.router import router
        routes = [r for r in router.routes if hasattr(r, "methods")]
        assert len(routes) == 8

    def test_pdf_endpoint(self):
        from app.cubes.cube9_reports.router import router
        found = any("pdf" in r.path for r in router.routes if hasattr(r, "methods"))
        assert found

    def test_distribution_endpoint(self):
        from app.cubes.cube9_reports.router import router
        found = any("distribution" in r.path for r in router.routes if hasattr(r, "methods"))
        assert found

    def test_reward_endpoint(self):
        from app.cubes.cube9_reports.router import router
        found = any("reward" in r.path for r in router.routes if hasattr(r, "methods"))
        assert found
