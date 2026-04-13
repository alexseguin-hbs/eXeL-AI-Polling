"""Cube 6 — Router endpoint tests for untested AI pipeline endpoints.

Covers:
  - POST /ai/run (run_ai_theming) — auth gate + 202 response
  - GET  /ai/status (get_ai_status) — auth gate + status structure
  - GET  /themes (get_themes) — optional auth + theme list
"""

import uuid
from unittest.mock import AsyncMock, patch

import pytest


SID = uuid.uuid4()
PREFIX = f"/api/v1/sessions/{SID}"


class TestRunAiTheming:
    """POST /ai/run — moderator/admin only, returns 202."""

    @pytest.mark.asyncio
    async def test_returns_202_on_success(self, client, moderator_user):
        mock_result = {"status": "completed", "themes_found": 3, "seed": 42}
        with patch("app.cubes.cube6_ai.service.run_pipeline", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.post(f"{PREFIX}/ai/run")
        assert resp.status_code == 202
        assert resp.json()["themes_found"] == 3

    @pytest.mark.asyncio
    async def test_accepts_seed_in_payload(self, client, moderator_user):
        mock_result = {"status": "completed", "seed": "99"}
        with patch("app.cubes.cube6_ai.service.run_pipeline", new_callable=AsyncMock, return_value=mock_result) as mock_fn:
            resp = await client.post(f"{PREFIX}/ai/run", json={"seed": "99"})
        assert resp.status_code == 202
        mock_fn.assert_called_once()


class TestGetAiStatus:
    """GET /ai/status — moderator/admin/lead only."""

    @pytest.mark.asyncio
    async def test_returns_status_structure(self, client, moderator_user):
        mock_status = {"stage": "idle", "themes_count": 0, "error": None}
        with patch("app.cubes.cube6_ai.service.get_pipeline_status", new_callable=AsyncMock, return_value=mock_status):
            resp = await client.get(f"{PREFIX}/ai/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "stage" in data

    @pytest.mark.asyncio
    async def test_returns_error_stage(self, client, moderator_user):
        mock_status = {"stage": "error", "themes_count": 0, "error": "Provider timeout"}
        with patch("app.cubes.cube6_ai.service.get_pipeline_status", new_callable=AsyncMock, return_value=mock_status):
            resp = await client.get(f"{PREFIX}/ai/status")
        assert resp.status_code == 200
        assert resp.json()["stage"] == "error"


class TestGetThemes:
    """GET /themes — optional auth, returns theme list."""

    @pytest.mark.asyncio
    async def test_returns_empty_list_for_new_session(self, client, moderator_user):
        with patch("app.cubes.cube6_ai.service.get_session_themes", new_callable=AsyncMock, return_value=[]):
            resp = await client.get(f"{PREFIX}/themes")
        assert resp.status_code == 200
        assert resp.json() == []
