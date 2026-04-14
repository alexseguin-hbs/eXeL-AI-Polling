"""Cube 7 — Router endpoint tests for Ranking / Prioritization endpoints.

Covers:
  - POST /sessions/{id}/rankings — submit ranking (auth required)
  - GET  /sessions/{id}/rankings — get live rankings (auth, WireGuard sort_order)
  - POST /sessions/{id}/rankings/aggregate — trigger aggregation (moderator/admin, WireGuard ranking_method)
  - GET  /sessions/{id}/rankings/anomalies — anomaly detection (moderator/admin/lead)
  - GET  /sessions/{id}/rankings/scale-info — scale engine info (moderator/admin)
  - GET  /sessions/{id}/rankings/emerging — emerging patterns (moderator/admin, WireGuard theme_level)
  - GET  /sessions/{id}/rankings/personal — personal vs group (auth required)
  - GET  /sessions/{id}/rankings/verify — replay verification (auth required)
  - GET  /sessions/{id}/rankings/progress — ranking progress (moderator/admin)
  - POST /sessions/{id}/override — governance override (lead/admin only)
  - GET  /sessions/{id}/overrides — override audit trail (moderator/admin/lead)
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.conftest import make_session, make_participant


SID = uuid.uuid4()
PREFIX = f"/api/v1/sessions/{SID}"
THEME_ID = uuid.uuid4()


# -----------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------


def _mock_session_query(session_mock):
    """Return a mock db.execute that yields session_mock as scalar_one_or_none."""
    result = MagicMock()
    result.scalar_one_or_none.return_value = session_mock
    return AsyncMock(return_value=result)


def _mock_participant_query(participant_mock):
    """Return a mock db.execute result for participant lookup."""
    result = MagicMock()
    result.scalar_one_or_none.return_value = participant_mock
    return result


# -----------------------------------------------------------------------
# Submit Ranking
# -----------------------------------------------------------------------


class TestSubmitRanking:
    """POST /sessions/{id}/rankings — auth required, 201."""
class TestGetRankings:
    """GET /sessions/{id}/rankings — auth required, WireGuard sort_order."""

    @pytest.mark.asyncio
    async def test_returns_rankings_desc(self, client, moderator_user):
        with patch(
            "app.cubes.cube7_ranking.service.get_live_rankings",
            new_callable=AsyncMock,
            return_value=[],
        ):
            resp = await client.get(f"{PREFIX}/rankings?sort_order=desc")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_returns_rankings_asc(self, client, moderator_user):
        with patch(
            "app.cubes.cube7_ranking.service.get_live_rankings",
            new_callable=AsyncMock,
            return_value=[],
        ):
            resp = await client.get(f"{PREFIX}/rankings?sort_order=asc")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_rejects_invalid_sort_order(self, client, moderator_user):
        resp = await client.get(f"{PREFIX}/rankings?sort_order=random")
        assert resp.status_code == 400
        assert "sort_order" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_rejects_sql_injection_sort_order(self, client, moderator_user):
        resp = await client.get(f"{PREFIX}/rankings?sort_order=asc;DROP TABLE--")
        assert resp.status_code == 400


# -----------------------------------------------------------------------
# Aggregate Rankings — WireGuard ranking_method
# -----------------------------------------------------------------------


class TestTriggerAggregation:
    """POST /sessions/{id}/rankings/aggregate — moderator/admin, WireGuard."""
    @pytest.mark.asyncio
    async def test_rejects_invalid_ranking_method(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/rankings/aggregate?ranking_method=random_algo"
        )
        assert resp.status_code == 400
        assert "ranking_method" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_requires_moderator_role(self, client, regular_user):
        from app.core.auth import get_current_user
        from app.main import app as test_app

        async def override_user():
            return regular_user

        test_app.dependency_overrides[get_current_user] = override_user
        try:
            resp = await client.post(
                f"{PREFIX}/rankings/aggregate?ranking_method=borda_count"
            )
            assert resp.status_code == 403
        finally:
            test_app.dependency_overrides.pop(get_current_user, None)


# -----------------------------------------------------------------------
# Emerging Patterns — WireGuard theme_level
# -----------------------------------------------------------------------


class TestEmergingPatterns:
    """GET /sessions/{id}/rankings/emerging — WireGuard theme_level."""

    @pytest.mark.asyncio
    async def test_valid_theme_level_3(self, client, moderator_user):
        with patch(
            "app.cubes.cube7_ranking.service.get_emerging_patterns",
            new_callable=AsyncMock,
            return_value={"patterns": []},
        ):
            resp = await client.get(f"{PREFIX}/rankings/emerging?theme_level=3")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_valid_theme_level_6(self, client, moderator_user):
        with patch(
            "app.cubes.cube7_ranking.service.get_emerging_patterns",
            new_callable=AsyncMock,
            return_value={"patterns": []},
        ):
            resp = await client.get(f"{PREFIX}/rankings/emerging?theme_level=6")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_valid_theme_level_9(self, client, moderator_user):
        with patch(
            "app.cubes.cube7_ranking.service.get_emerging_patterns",
            new_callable=AsyncMock,
            return_value={"patterns": []},
        ):
            resp = await client.get(f"{PREFIX}/rankings/emerging?theme_level=9")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_rejects_invalid_theme_level(self, client, moderator_user):
        resp = await client.get(f"{PREFIX}/rankings/emerging?theme_level=5")
        assert resp.status_code == 400
        assert "theme_level" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_rejects_theme_level_zero(self, client, moderator_user):
        resp = await client.get(f"{PREFIX}/rankings/emerging?theme_level=0")
        assert resp.status_code == 400


# -----------------------------------------------------------------------
# Governance Override — lead/admin only
# -----------------------------------------------------------------------


class TestGovernanceOverride:
    """POST /sessions/{id}/override — lead/admin only."""

    @pytest.mark.asyncio
    async def test_requires_lead_or_admin(self, client, moderator_user):
        """Moderator role should get 403 since override requires lead/admin."""
        resp = await client.post(
            f"{PREFIX}/override",
            json={
                "theme_id": str(THEME_ID),
                "new_rank": 1,
                "justification": "Strategic priority override for Q2 alignment",
            },
        )
        # Moderator is NOT in ("lead", "admin") — should be 403
        assert resp.status_code == 403
    @pytest.mark.asyncio
    async def test_regular_user_cannot_override(self, client, regular_user):
        from app.core.auth import get_current_user
        from app.main import app as test_app

        async def override_user():
            return regular_user

        test_app.dependency_overrides[get_current_user] = override_user
        try:
            resp = await client.post(
                f"{PREFIX}/override",
                json={
                    "theme_id": str(THEME_ID),
                    "new_rank": 1,
                    "justification": "Unauthorized attempt at override",
                },
            )
            assert resp.status_code == 403
        finally:
            test_app.dependency_overrides.pop(get_current_user, None)


# -----------------------------------------------------------------------
# Anomalies — moderator/admin/lead
# -----------------------------------------------------------------------


class TestAnomalies:
    """GET /sessions/{id}/rankings/anomalies — moderator/admin/lead only."""

    @pytest.mark.asyncio
    async def test_returns_anomalies(self, client, moderator_user):
        with patch(
            "app.cubes.cube7_ranking.service.detect_voting_anomalies",
            new_callable=AsyncMock,
            return_value=[],
        ):
            resp = await client.get(f"{PREFIX}/rankings/anomalies")
        assert resp.status_code == 200
        data = resp.json()
        assert "anomalies" in data
        assert data["session_id"] == str(SID)

    @pytest.mark.asyncio
    async def test_regular_user_blocked(self, client, regular_user):
        from app.core.auth import get_current_user
        from app.main import app as test_app

        async def override_user():
            return regular_user

        test_app.dependency_overrides[get_current_user] = override_user
        try:
            resp = await client.get(f"{PREFIX}/rankings/anomalies")
            assert resp.status_code == 403
        finally:
            test_app.dependency_overrides.pop(get_current_user, None)


# -----------------------------------------------------------------------
# Progress — moderator/admin
# -----------------------------------------------------------------------


class TestRankingProgress:
    """GET /sessions/{id}/rankings/progress — moderator/admin only."""

    @pytest.mark.asyncio
    async def test_returns_progress(self, client, moderator_user):
        mock_progress = {"total_participants": 10, "submitted": 7, "pending": 3}
        with patch(
            "app.cubes.cube7_ranking.service.get_ranking_progress",
            new_callable=AsyncMock,
            return_value=mock_progress,
        ):
            resp = await client.get(f"{PREFIX}/rankings/progress")
        assert resp.status_code == 200
        assert resp.json()["total_participants"] == 10
