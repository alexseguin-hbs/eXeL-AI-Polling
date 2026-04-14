"""Cube 5 — Router endpoint tests for Gateway / Orchestrator endpoints.

Covers:
  - POST /sessions/{id}/time/start — start time tracking
  - POST /sessions/{id}/time/stop — stop time tracking
  - GET  /sessions/{id}/time/summary/{pid} — participant time summary
  - POST /sessions/{id}/pipeline/trigger-theming — moderator/admin only
  - GET  /sessions/{id}/pipeline/status — authenticated users
  - POST /sessions/{id}/pipeline/retry/{tid} — moderator/admin only
  - POST /sessions/{id}/webhooks — register webhook (SSRF protection)
  - GET  /sessions/{id}/webhooks — list webhooks
  - DELETE /webhooks/{sub_id} — deactivate webhook
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.conftest import make_pipeline_trigger, make_time_entry


SID = uuid.uuid4()
PID = uuid.uuid4()
TID = uuid.uuid4()
PREFIX = f"/api/v1/sessions/{SID}"


# -----------------------------------------------------------------------
# Time Tracking
# -----------------------------------------------------------------------


class TestStartTimeTracking:
    """POST /sessions/{id}/time/start — optional auth, returns 201."""

    @pytest.mark.asyncio
    async def test_returns_201_on_success(self, client, moderator_user):
        entry = make_time_entry(id=uuid.uuid4())
        entry.session_id = SID
        entry.participant_id = PID
        entry.reference_id = None
        with patch(
            "app.cubes.cube5_gateway.service.start_time_tracking",
            new_callable=AsyncMock,
            return_value=entry,
        ):
            resp = await client.post(
                f"{PREFIX}/time/start",
                json={"action_type": "responding"},
            )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_rejects_invalid_action_type(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/time/start",
            json={"action_type": "hacking"},
        )
        assert resp.status_code == 422


class TestStopTimeTracking:
    """POST /sessions/{id}/time/stop — optional auth."""

    @pytest.mark.asyncio
    async def test_returns_200_on_success(self, client, moderator_user):
        entry = make_time_entry(id=TID)
        entry.session_id = SID
        entry.participant_id = PID
        entry.stopped_at = datetime.now(timezone.utc)
        entry.duration_seconds = 120.0
        entry.reference_id = None
        with patch(
            "app.cubes.cube5_gateway.service.stop_time_tracking",
            new_callable=AsyncMock,
            return_value=entry,
        ):
            resp = await client.post(
                f"{PREFIX}/time/stop",
                json={"time_entry_id": str(TID)},
            )
        assert resp.status_code == 200


class TestTimeSummary:
    """GET /sessions/{id}/time/summary/{pid} — optional auth."""

    @pytest.mark.asyncio
    async def test_returns_summary(self, client, moderator_user):
        summary = {
            "participant_id": PID,
            "session_id": SID,
            "total_active_seconds": 300.0,
            "total_heart_tokens": 5.0,
            "total_human_tokens": 0.0,
            "total_unity_tokens": 25.0,
            "entries": [],
        }
        with patch(
            "app.cubes.cube5_gateway.service.get_participant_time_summary",
            new_callable=AsyncMock,
            return_value=summary,
        ):
            resp = await client.get(f"{PREFIX}/time/summary/{PID}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_active_seconds"] == 300.0


# -----------------------------------------------------------------------
# Pipeline Orchestrator
# -----------------------------------------------------------------------


class TestTriggerTheming:
    """POST /sessions/{id}/pipeline/trigger-theming — moderator/admin only, 202."""

    @pytest.mark.asyncio
    async def test_returns_202_on_success(self, client, moderator_user):
        trigger = make_pipeline_trigger(session_id=SID, status="pending")
        with patch(
            "app.cubes.cube5_gateway.service.trigger_ai_pipeline",
            new_callable=AsyncMock,
            return_value=trigger,
        ):
            resp = await client.post(f"{PREFIX}/pipeline/trigger-theming")
        assert resp.status_code == 202

    @pytest.mark.asyncio
    async def test_accepts_seed_parameter(self, client, moderator_user):
        trigger = make_pipeline_trigger(session_id=SID, status="pending")
        with patch(
            "app.cubes.cube5_gateway.service.trigger_ai_pipeline",
            new_callable=AsyncMock,
            return_value=trigger,
        ) as mock_fn:
            resp = await client.post(
                f"{PREFIX}/pipeline/trigger-theming",
                json={"seed": "42"},
            )
        assert resp.status_code == 202
        mock_fn.assert_called_once()

    @pytest.mark.asyncio
    async def test_requires_moderator_or_admin(self, client, regular_user):
        """Dev mode returns moderator, so this passes. But a real user role would 403."""
        from app.core.auth import get_current_user
        from app.main import app as test_app

        async def override_user():
            return regular_user

        test_app.dependency_overrides[get_current_user] = override_user
        try:
            resp = await client.post(f"{PREFIX}/pipeline/trigger-theming")
            assert resp.status_code == 403
        finally:
            test_app.dependency_overrides.pop(get_current_user, None)


class TestPipelineStatus:
    """GET /sessions/{id}/pipeline/status — authenticated users."""

    @pytest.mark.asyncio
    async def test_returns_status_structure(self, client, moderator_user):
        trigger = make_pipeline_trigger(session_id=SID, status="completed")
        mock_data = {
            "session_id": SID,
            "triggers": [trigger],
            "total": 1,
            "has_pending": False,
            "has_failed": False,
            "all_completed": True,
        }
        with patch(
            "app.cubes.cube5_gateway.service.get_pipeline_status",
            new_callable=AsyncMock,
            return_value=mock_data,
        ):
            resp = await client.get(f"{PREFIX}/pipeline/status")
        assert resp.status_code == 200
        data = resp.json()
        assert data["all_completed"] is True
        assert data["total"] == 1


# -----------------------------------------------------------------------
# Webhooks — SSRF Protection
# -----------------------------------------------------------------------


class TestRegisterWebhook:
    """POST /sessions/{id}/webhooks — moderator/admin, SSRF protection."""

    @pytest.mark.asyncio
    async def test_valid_https_url_accepted(self, client, moderator_user):
        mock_result = {
            "id": str(uuid.uuid4()),
            "url": "https://example.com/hook",
            "event_types": ["themes_ready"],
            "signing_secret": "sec_abc123",
        }
        with patch(
            "app.cubes.cube5_gateway.webhook_service.register_webhook",
            new_callable=AsyncMock,
            return_value=mock_result,
        ):
            resp = await client.post(
                f"{PREFIX}/webhooks",
                json={
                    "url": "https://example.com/hook",
                    "event_types": ["themes_ready"],
                },
            )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_rejects_http_url(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/webhooks",
            json={
                "url": "http://example.com/hook",
                "event_types": ["themes_ready"],
            },
        )
        assert resp.status_code == 400
        assert "HTTPS" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_rejects_localhost(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/webhooks",
            json={
                "url": "https://localhost/hook",
                "event_types": ["themes_ready"],
            },
        )
        assert resp.status_code == 400
        assert "internal" in resp.json()["detail"].lower() or "loopback" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_rejects_127_0_0_1(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/webhooks",
            json={
                "url": "https://127.0.0.1/hook",
                "event_types": ["themes_ready"],
            },
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_rejects_private_ip_192_168(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/webhooks",
            json={
                "url": "https://192.168.1.1/hook",
                "event_types": ["themes_ready"],
            },
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_rejects_private_ip_10_x(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/webhooks",
            json={
                "url": "https://10.0.0.1/hook",
                "event_types": ["themes_ready"],
            },
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_rejects_metadata_endpoint(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/webhooks",
            json={
                "url": "https://169.254.169.254/latest/meta-data/",
                "event_types": ["themes_ready"],
            },
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_rejects_invalid_event_type(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/webhooks",
            json={
                "url": "https://example.com/hook",
                "event_types": ["invalid_event"],
            },
        )
        assert resp.status_code == 400
        assert "Invalid event types" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_rejects_empty_event_types(self, client, moderator_user):
        resp = await client.post(
            f"{PREFIX}/webhooks",
            json={
                "url": "https://example.com/hook",
                "event_types": [],
            },
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_requires_moderator_or_admin(self, client, regular_user):
        from app.core.auth import get_current_user
        from app.main import app as test_app

        async def override_user():
            return regular_user

        test_app.dependency_overrides[get_current_user] = override_user
        try:
            resp = await client.post(
                f"{PREFIX}/webhooks",
                json={
                    "url": "https://example.com/hook",
                    "event_types": ["themes_ready"],
                },
            )
            assert resp.status_code == 403
        finally:
            test_app.dependency_overrides.pop(get_current_user, None)


class TestListWebhooks:
    """GET /sessions/{id}/webhooks — moderator/admin only."""

    @pytest.mark.asyncio
    async def test_returns_list(self, client, moderator_user):
        with patch(
            "app.cubes.cube5_gateway.webhook_service.list_webhooks",
            new_callable=AsyncMock,
            return_value=[],
        ):
            resp = await client.get(f"{PREFIX}/webhooks")
        assert resp.status_code == 200
        assert resp.json() == []
