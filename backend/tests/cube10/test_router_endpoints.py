"""Cube 10 — Router endpoint tests for untested simulation endpoints.

Covers:
  - POST /verify-access — admin and challenger code verification
  - GET  /saved-cases/{case_id}/replay — replay against saved datasets
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestVerifyAccess:
    """POST /verify-access — Cube 10 access code verification."""

    @pytest.mark.asyncio
    async def test_valid_admin_code_grants_access(self, client, moderator_user):
        with patch("app.config.settings") as mock_settings:
            mock_settings.cube10_admin_code = "96541230"
            mock_settings.cube10_challenger_code = "366999"
            resp = await client.post(
                "/api/v1/verify-access",
                json={"code": "96541230", "access_type": "admin"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["granted"] is True
        assert data["access"] == "admin"

    @pytest.mark.asyncio
    async def test_valid_challenger_code_grants_access(self, client, moderator_user):
        with patch("app.config.settings") as mock_settings:
            mock_settings.cube10_admin_code = "96541230"
            mock_settings.cube10_challenger_code = "366999"
            resp = await client.post(
                "/api/v1/verify-access",
                json={"code": "366999", "access_type": "challenger"},
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["granted"] is True
        assert data["access"] == "challenger"

    @pytest.mark.asyncio
    async def test_invalid_code_returns_403(self, client, moderator_user):
        with patch("app.config.settings") as mock_settings:
            mock_settings.cube10_admin_code = "96541230"
            mock_settings.cube10_challenger_code = "366999"
            resp = await client.post(
                "/api/v1/verify-access",
                json={"code": "wrong", "access_type": "admin"},
            )
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_invalid_access_type_returns_400(self, client, moderator_user):
        resp = await client.post(
            "/api/v1/verify-access",
            json={"code": "96541230", "access_type": "hacker"},
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_constant_time_comparison_used(self, client, moderator_user):
        """Verify HMAC constant-time comparison is used (anti-timing attack)."""
        import hmac as hmac_mod
        with (
            patch("app.config.settings") as mock_settings,
            patch("hmac.compare_digest", wraps=hmac_mod.compare_digest) as mock_compare,
        ):
            mock_settings.cube10_admin_code = "96541230"
            mock_settings.cube10_challenger_code = "366999"
            await client.post(
                "/api/v1/verify-access",
                json={"code": "96541230", "access_type": "admin"},
            )
            mock_compare.assert_called_once()


class TestReplayCase:
    """GET /saved-cases/{case_id}/replay — replay against saved datasets.

    This endpoint requires admin/lead_developer role. Dev mode returns moderator
    by default, so we override get_current_user to return admin.
    """

    @pytest.mark.asyncio
    async def test_replay_returns_results(self, client, admin_user):
        mock_case = {"id": "demo", "name": "Demo Case", "responses": 100}
        mock_result = {
            "status": "completed",
            "themes_found": 3,
            "replay_hash": "abc123",
        }
        from app.core.auth import get_current_user
        from app.main import app as test_app

        async def override_admin():
            return admin_user

        test_app.dependency_overrides[get_current_user] = override_admin
        try:
            with (
                patch("app.cubes.cube10_simulation.saved_use_cases.SavedUseCaseManager") as MockMgr,
                patch("app.cubes.cube10_simulation.saved_use_cases.replay_against_dataset", new_callable=AsyncMock, return_value=mock_result),
            ):
                MockMgr.return_value.get_case.return_value = mock_case
                MockMgr.return_value.to_dict.return_value = {"cases": [mock_case]}
                resp = await client.get("/api/v1/saved-cases/demo/replay")
            assert resp.status_code == 200
            assert resp.json()["status"] == "completed"
        finally:
            test_app.dependency_overrides.pop(get_current_user, None)

    @pytest.mark.asyncio
    async def test_replay_invalid_case_returns_404(self, client, admin_user):
        from app.core.auth import get_current_user
        from app.main import app as test_app

        async def override_admin():
            return admin_user

        test_app.dependency_overrides[get_current_user] = override_admin
        try:
            with patch("app.cubes.cube10_simulation.saved_use_cases.SavedUseCaseManager") as MockMgr:
                MockMgr.return_value.get_case.return_value = None
                resp = await client.get("/api/v1/saved-cases/nonexistent/replay")
            assert resp.status_code == 404
        finally:
            test_app.dependency_overrides.pop(get_current_user, None)

    @pytest.mark.asyncio
    async def test_replay_requires_admin_or_lead(self, client, regular_user):
        """Dev mode returns moderator — which is not admin/lead, so 403 expected."""
        resp = await client.get("/api/v1/saved-cases/demo/replay")
        assert resp.status_code == 403
