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
        # WireGuard: Pydantic field_validator returns 422, router-level returns 400
        assert resp.status_code in (400, 422)

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


class TestSimCheckInSubmit:
    """§4b — Check In (version, nothing runs) then Submit to Simulate (run → verdict)."""

    @pytest.mark.asyncio
    async def test_check_in_versions_without_running(self, client):
        resp = await client.post("/api/v1/sim/cube/2/check-in", json={"section": "B", "note": "faster PII"})
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "checked_in"
        assert body["run_id"] and body["proposed_version"]
        assert body["section"] == "B"

    @pytest.mark.asyncio
    async def test_submit_returns_verdict_replay_and_validation(self, client):
        resp = await client.post(
            "/api/v1/sim/cube/2/submit",
            json={"section": "B", "tier": "manual", "human_approved": False},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "verdict" in body and "decision" in body
        # Manual + not-yet-approved → hold (awaiting human).
        assert body["decision"]["decision"] in ("hold", "swap", "reject")
        assert body["decision"]["tier"] == "manual"
        # 3-member outcome-validation gate present.
        assert body["validation"]["required"] == 3
        assert body["validation"]["state"] == "pending_validation"
        # section replay hash is real (64-hex, block scope).
        assert len(body["replay"]["replay_hash"]) == 64
        assert body["replay"]["scope"] == "block"

    @pytest.mark.asyncio
    async def test_submit_bad_tier_returns_400(self, client):
        resp = await client.post("/api/v1/sim/cube/2/submit", json={"tier": "nope"})
        assert resp.status_code == 400


class TestSimContractRichness:
    """GET /sim/cube/{id}/contract — every cube 1-9 returns a RICH inputs·functions·outputs."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("cube_id", [1, 2, 3, 4, 5, 6, 7, 8, 9])
    async def test_contract_rich_for_all_cubes(self, client, cube_id):
        resp = await client.get(f"/api/v1/sim/cube/{cube_id}/contract")
        assert resp.status_code == 200
        io = resp.json()["io_contract"]
        # §2: cubes 2-9 compose from core.universal; cube 1 from its harness. All non-empty.
        assert io.get("inputs"), f"cube {cube_id} inputs empty"
        assert io.get("functions"), f"cube {cube_id} functions empty"
        assert io.get("outputs"), f"cube {cube_id} outputs empty"


class TestSimContractGranularity:
    """FX-G — /contract?sections=N returns coherent block-segments."""

    @pytest.mark.asyncio
    @pytest.mark.parametrize("n", [3, 4, 9, 27])
    async def test_contract_returns_n_sections(self, client, n):
        resp = await client.get(f"/api/v1/sim/cube/2/contract?sections={n}")
        assert resp.status_code == 200
        secs = resp.json()["sections"]
        assert len(secs) == n
        merged = [c for s in secs for c in s["highlight"]["9"]]
        assert sorted(merged) == list(range(27))  # cover all 27 once

    @pytest.mark.asyncio
    async def test_n3_are_levels(self, client):
        resp = await client.get("/api/v1/sim/cube/2/contract?sections=3")
        assert [s["label"] for s in resp.json()["sections"]] == ["Level 1", "Level 2", "Level 3"]

    @pytest.mark.asyncio
    async def test_bad_count_returns_400(self, client):
        resp = await client.get("/api/v1/sim/cube/2/contract?sections=5")
        assert resp.status_code == 400

    @pytest.mark.asyncio
    @pytest.mark.parametrize("cube_id", [1, 2, 7])
    async def test_each_block_has_its_own_io(self, client, cube_id):
        # FX-H: every section/building block carries its own inputs·functions·outputs.
        resp = await client.get(f"/api/v1/sim/cube/{cube_id}/contract")
        assert resp.status_code == 200
        for s in resp.json()["sections"]:
            io = s.get("io")
            assert io and set(io) == {"inputs", "functions", "outputs"}
            assert io["inputs"] and io["outputs"]        # never empty (fallback to whole-cube)
            assert io["functions"] == s["functions"]


class TestSimCubeReplayRoute:
    """GET /sim/cube/{id}/replay — beat the WHOLE cube or ONE building block (section)."""

    @staticmethod
    def _auth(admin_user):
        from app.core.auth import get_current_user
        from app.main import app as test_app

        async def override():
            return admin_user

        test_app.dependency_overrides[get_current_user] = override
        return test_app, get_current_user

    @pytest.mark.asyncio
    async def test_cube2_whole_cube_replay(self, client, admin_user):
        test_app, dep = self._auth(admin_user)
        try:
            resp = await client.get("/api/v1/sim/cube/2/replay")
            assert resp.status_code == 200
            body = resp.json()
            assert body["scope"] == "cube"
            assert len(body["replay_hash"]) == 64
        finally:
            test_app.dependency_overrides.pop(dep, None)

    @pytest.mark.asyncio
    async def test_cube2_section_replay(self, client, admin_user):
        test_app, dep = self._auth(admin_user)
        try:
            resp = await client.get("/api/v1/sim/cube/2/replay?section=B")
            assert resp.status_code == 200
            body = resp.json()
            assert body["scope"] == "block"
            assert body["section"] == "B"
            assert len(body["replay_hash"]) == 64
        finally:
            test_app.dependency_overrides.pop(dep, None)

    @pytest.mark.asyncio
    async def test_bad_section_returns_400(self, client, admin_user):
        test_app, dep = self._auth(admin_user)
        try:
            resp = await client.get("/api/v1/sim/cube/2/replay?section=Z")
            assert resp.status_code == 400
        finally:
            test_app.dependency_overrides.pop(dep, None)
