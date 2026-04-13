"""Cube 9 — Router endpoint tests for untested reports endpoints.

Covers:
  - GET  /export/content-tier — tier resolution + unlock flags
  - GET  /replay/options — Pangu simulation config listing
  - POST /replay/preview — Pangu dry-run preview
  - GET  /trends — Odin trend analysis (subscription-gated)
  - POST /trends/snapshot — Odin snapshot capture
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient

from app.main import app


SID = uuid.uuid4()
PREFIX = f"/api/v1/sessions/{SID}"


class TestContentTier:
    """GET /export/content-tier — donation-based tier resolution."""

    @pytest.mark.asyncio
    async def test_free_tier_returns_base_unlocks(self, client: AsyncClient, moderator_user):
        with patch("app.cubes.cube9_reports.service.resolve_export_tier", new_callable=AsyncMock, return_value="free"):
            resp = await client.get(f"{PREFIX}/export/content-tier")
        assert resp.status_code == 200
        data = resp.json()
        assert data["content_tier"] == "free"
        assert "unlocked" in data
        assert data["unlocked"]["summary_33"] is True
        assert data["unlocked"]["summary_111"] is True
        assert "thresholds" in data
        assert data["thresholds"]["tier_333_cents"] == 999

    @pytest.mark.asyncio
    async def test_full_tier_unlocks_everything(self, client: AsyncClient, moderator_user):
        with patch("app.cubes.cube9_reports.service.resolve_export_tier", new_callable=AsyncMock, return_value="tier_full"):
            resp = await client.get(f"{PREFIX}/export/content-tier")
        assert resp.status_code == 200
        data = resp.json()
        assert data["content_tier"] == "tier_full"
        assert data["unlocked"]["detailed_results"] is True
        assert data["unlocked"]["summary_333"] is True

    @pytest.mark.asyncio
    async def test_thresholds_match_monetization_tiers(self, client: AsyncClient, moderator_user):
        with patch("app.cubes.cube9_reports.service.resolve_export_tier", new_callable=AsyncMock, return_value="free"):
            resp = await client.get(f"{PREFIX}/export/content-tier")
        thresholds = resp.json()["thresholds"]
        assert thresholds["tier_theme_111_cents"] == 111
        assert thresholds["tier_theme_333_cents"] == 333
        assert thresholds["tier_conf_cents"] == 444
        assert thresholds["tier_cqs_cents"] == 777
        assert thresholds["tier_333_cents"] == 999
        assert thresholds["tier_full_cents"] == 1111
        assert thresholds["tier_talent_cents"] == 1212


class TestReplayOptions:
    """GET /replay/options — Pangu simulation config listing."""

    @pytest.mark.asyncio
    async def test_returns_replay_options(self, client: AsyncClient, moderator_user):
        mock_options = {
            "original": {"theme_count": 3, "seed": 42, "sample_rate": 1.0},
            "alternatives": [
                {"theme_count": 6, "seed": 42, "sample_rate": 1.0},
                {"theme_count": 9, "seed": 42, "sample_rate": 1.0},
            ],
            "cost_per_replay_cents": 222,
        }
        with patch("app.cubes.cube10_simulation.replay_service.list_replay_options", new_callable=AsyncMock, return_value=mock_options):
            resp = await client.get(f"{PREFIX}/replay/options")
        assert resp.status_code == 200
        data = resp.json()
        assert "original" in data
        assert "alternatives" in data


class TestReplayPreview:
    """POST /replay/preview — Pangu dry-run preview."""

    @pytest.mark.asyncio
    async def test_preview_returns_dry_run(self, client: AsyncClient, moderator_user):
        mock_preview = {
            "status": "preview",
            "theme_count": 3,
            "response_count": 100,
            "estimated_clusters": 3,
        }
        with patch("app.cubes.cube10_simulation.replay_service.preview_replay", new_callable=AsyncMock, return_value=mock_preview):
            resp = await client.post(f"{PREFIX}/replay/preview?theme_count=3&seed=42")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "preview"

    @pytest.mark.asyncio
    async def test_preview_with_ai_supplement(self, client: AsyncClient, moderator_user):
        mock_preview = {"status": "preview", "theme_count": 3, "response_count": 100}
        with patch("app.cubes.cube10_simulation.replay_service.preview_replay", new_callable=AsyncMock, return_value=mock_preview):
            resp = await client.post(f"{PREFIX}/replay/preview?theme_count=3&seed=42&ai_supplement_pct=22")
        assert resp.status_code == 200
        data = resp.json()
        assert "ai_supplement" in data
        assert data["ai_supplement"]["percent"] == 22
        assert data["ai_supplement"]["supplement_cost_cents"] == 222


class TestTrends:
    """GET /trends — Odin cross-session trend analysis."""

    @pytest.mark.asyncio
    async def test_trends_with_subscription(self, client: AsyncClient, moderator_user):
        mock_trends = {"project_id": "proj-1", "snapshots": 5, "drift_detected": False}
        with (
            patch("app.cubes.cube9_reports.trend_service.check_subscription", new_callable=AsyncMock, return_value=True),
            patch("app.cubes.cube9_reports.trend_service.get_trend_analysis", new_callable=AsyncMock, return_value=mock_trends),
        ):
            resp = await client.get(f"{PREFIX}/trends?project_id=proj-1")
        assert resp.status_code == 200
        assert resp.json()["drift_detected"] is False

    @pytest.mark.asyncio
    async def test_trends_without_subscription_returns_402(self, client: AsyncClient, regular_user):
        with patch("app.cubes.cube9_reports.trend_service.check_subscription", new_callable=AsyncMock, return_value=False):
            resp = await client.get(f"{PREFIX}/trends?project_id=proj-1")
        assert resp.status_code == 402


class TestTrendSnapshot:
    """POST /trends/snapshot — Odin snapshot capture."""

    @pytest.mark.asyncio
    async def test_capture_snapshot(self, client: AsyncClient, moderator_user):
        mock_result = {"snapshot_id": str(uuid.uuid4()), "themes_captured": 3}
        with patch("app.cubes.cube9_reports.trend_service.capture_snapshot", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.post(f"{PREFIX}/trends/snapshot?project_id=proj-1")
        assert resp.status_code == 200
        assert "snapshot_id" in resp.json()
