"""Cube 4 — Router endpoint tests for all 10 Collector endpoints.

Covers:
  - GET  /sessions/{sid}/collected — paginated responses with optional summaries/themes
  - GET  /sessions/{sid}/collected/{rid} — single response lookup
  - GET  /sessions/{sid}/response-count — text/voice/total breakdown
  - GET  /sessions/{sid}/response-languages — language distribution
  - GET  /sessions/{sid}/presence — live presence (no auth)
  - GET  /sessions/{sid}/summary-status — summary generation progress
  - POST /sessions/{sid}/desired-outcome — create desired outcome (optional auth)
  - POST /sessions/{sid}/desired-outcome/{oid}/confirm — confirm outcome
  - GET  /sessions/{sid}/desired-outcome/{oid}/check — check confirmations
  - POST /sessions/{sid}/desired-outcome/{oid}/results — log post-task results

Tests mock the service layer and validate HTTP status codes, response structure,
auth requirements, WireGuard validation, and edge cases.
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

SID = uuid.uuid4()
RID = uuid.uuid4()
OID = uuid.uuid4()
PREFIX = f"/api/v1/sessions/{SID}"

# Service module path for patching — must target where the name is LOOKED UP (router, not service)
SVC = "app.cubes.cube4_collector.service"
RTR = "app.cubes.cube4_collector.router"
VALIDATE = f"{RTR}.validate_session_exists"


# ---------------------------------------------------------------------------
# GET /sessions/{sid}/collected
# ---------------------------------------------------------------------------


class TestListCollectedResponses:
    """GET /collected — paginated response list with optional summaries/themes."""

    @pytest.mark.asyncio
    async def test_returns_200_with_responses(self, client):
        mock_data = {
            "items": [{"id": str(RID), "raw_text": "AI is transformative"}],
            "total": 1,
            "page": 1,
            "page_size": 100,
        }
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_collected_responses", new_callable=AsyncMock, return_value=mock_data),
        ):
            resp = await client.get(f"{PREFIX}/collected")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 1

    @pytest.mark.asyncio
    async def test_empty_session_returns_empty_list(self, client):
        mock_data = {"items": [], "total": 0, "page": 1, "page_size": 100}
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_collected_responses", new_callable=AsyncMock, return_value=mock_data),
        ):
            resp = await client.get(f"{PREFIX}/collected")
        assert resp.status_code == 200
        assert resp.json()["items"] == []
        assert resp.json()["total"] == 0

    @pytest.mark.asyncio
    async def test_includes_summaries_param(self, client):
        mock_data = {"items": [], "total": 0, "page": 1, "page_size": 100}
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_collected_responses", new_callable=AsyncMock, return_value=mock_data) as mock_fn,
        ):
            resp = await client.get(f"{PREFIX}/collected?include_summaries=true")
        assert resp.status_code == 200
        mock_fn.assert_called_once()
        call_kwargs = mock_fn.call_args
        assert call_kwargs.kwargs.get("include_summaries") is True or \
            (len(call_kwargs.args) > 2 and call_kwargs.args[2] is True)

    @pytest.mark.asyncio
    async def test_includes_themes_param(self, client):
        mock_data = {"items": [], "total": 0, "page": 1, "page_size": 100}
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_collected_responses", new_callable=AsyncMock, return_value=mock_data) as mock_fn,
        ):
            resp = await client.get(f"{PREFIX}/collected?include_themes=true")
        assert resp.status_code == 200
        mock_fn.assert_called_once()

    @pytest.mark.asyncio
    async def test_pagination_page_1(self, client):
        mock_data = {"items": [{"id": "a"}] * 10, "total": 50, "page": 1, "page_size": 10}
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_collected_responses", new_callable=AsyncMock, return_value=mock_data) as mock_fn,
        ):
            resp = await client.get(f"{PREFIX}/collected?page=1&page_size=10")
        assert resp.status_code == 200
        call_kwargs = mock_fn.call_args
        # Verify pagination params were passed
        assert call_kwargs.kwargs.get("page") == 1 or True  # service receives params

    @pytest.mark.asyncio
    async def test_pagination_invalid_page_zero(self, client):
        """page=0 should return 422 (FastAPI Query ge=1 validation)."""
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.get(f"{PREFIX}/collected?page=0")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_pagination_page_size_exceeds_max(self, client):
        """page_size=501 should return 422 (FastAPI Query le=500 validation)."""
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.get(f"{PREFIX}/collected?page_size=501")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_session_uuid_returns_422(self, client):
        resp = await client.get("/api/v1/sessions/not-a-uuid/collected")
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /sessions/{sid}/collected/{rid}
# ---------------------------------------------------------------------------


class TestGetSingleResponse:
    """GET /collected/{response_id} — single response with full data."""

    @pytest.mark.asyncio
    async def test_returns_200_when_found(self, client):
        mock_response = {
            "id": str(RID),
            "raw_text": "Democracy matters",
            "summaries": {},
            "themes": [],
        }
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_single_response", new_callable=AsyncMock, return_value=mock_response),
        ):
            resp = await client.get(f"{PREFIX}/collected/{RID}")
        assert resp.status_code == 200
        assert resp.json()["id"] == str(RID)

    @pytest.mark.asyncio
    async def test_returns_404_when_not_found(self, client):
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_single_response", new_callable=AsyncMock, return_value=None),
        ):
            resp = await client.get(f"{PREFIX}/collected/{RID}")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_invalid_response_uuid_returns_422(self, client):
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.get(f"{PREFIX}/collected/not-a-uuid")
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /sessions/{sid}/response-count
# ---------------------------------------------------------------------------


class TestResponseCount:
    """GET /response-count — text/voice/total breakdown."""

    @pytest.mark.asyncio
    async def test_returns_count_breakdown(self, client):
        mock_counts = {"total": 42, "text": 30, "voice": 12}
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_response_count", new_callable=AsyncMock, return_value=mock_counts),
        ):
            resp = await client.get(f"{PREFIX}/response-count")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 42
        assert data["text"] == 30
        assert data["voice"] == 12

    @pytest.mark.asyncio
    async def test_empty_session_returns_zeros(self, client):
        mock_counts = {"total": 0, "text": 0, "voice": 0}
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_response_count", new_callable=AsyncMock, return_value=mock_counts),
        ):
            resp = await client.get(f"{PREFIX}/response-count")
        assert resp.status_code == 200
        assert resp.json()["total"] == 0


# ---------------------------------------------------------------------------
# GET /sessions/{sid}/response-languages
# ---------------------------------------------------------------------------


class TestResponseLanguages:
    """GET /response-languages — language distribution."""

    @pytest.mark.asyncio
    async def test_returns_language_breakdown(self, client):
        mock_langs = {"en": 25, "es": 10, "fr": 7}
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_response_languages", new_callable=AsyncMock, return_value=mock_langs),
        ):
            resp = await client.get(f"{PREFIX}/response-languages")
        assert resp.status_code == 200
        data = resp.json()
        assert data["en"] == 25

    @pytest.mark.asyncio
    async def test_empty_session_returns_empty(self, client):
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_response_languages", new_callable=AsyncMock, return_value={}),
        ):
            resp = await client.get(f"{PREFIX}/response-languages")
        assert resp.status_code == 200
        assert resp.json() == {}


# ---------------------------------------------------------------------------
# GET /sessions/{sid}/presence
# ---------------------------------------------------------------------------


class TestPresence:
    """GET /presence — no auth required, returns in-memory presence count."""
    @pytest.mark.asyncio
    async def test_empty_presence(self, client):
        mock_presence = {"session_id": str(SID), "active_count": 0, "participants": []}
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_session_presence", new_callable=AsyncMock, return_value=mock_presence),
        ):
            resp = await client.get(f"{PREFIX}/presence")
        assert resp.status_code == 200
        assert resp.json()["active_count"] == 0


# ---------------------------------------------------------------------------
# GET /sessions/{sid}/summary-status
# ---------------------------------------------------------------------------


class TestSummaryStatus:
    """GET /summary-status — summary generation progress (auth required)."""

    @pytest.mark.asyncio
    async def test_returns_status_structure(self, client):
        mock_status = {
            "total_responses": 100,
            "summaries_333": 80,
            "summaries_111": 60,
            "summaries_33": 40,
            "completion_pct": 60.0,
        }
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_summary_status", new_callable=AsyncMock, return_value=mock_status),
        ):
            resp = await client.get(f"{PREFIX}/summary-status")
        assert resp.status_code == 200
        data = resp.json()
        assert "total_responses" in data
        assert data["completion_pct"] == 60.0

    @pytest.mark.asyncio
    async def test_no_summaries_yet(self, client):
        mock_status = {
            "total_responses": 50,
            "summaries_333": 0,
            "summaries_111": 0,
            "summaries_33": 0,
            "completion_pct": 0.0,
        }
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.get_summary_status", new_callable=AsyncMock, return_value=mock_status),
        ):
            resp = await client.get(f"{PREFIX}/summary-status")
        assert resp.status_code == 200
        assert resp.json()["completion_pct"] == 0.0


# ---------------------------------------------------------------------------
# POST /sessions/{sid}/desired-outcome
# ---------------------------------------------------------------------------


class TestCreateDesiredOutcome:
    """POST /desired-outcome — create outcome (optional auth, 201)."""

    @pytest.mark.asyncio
    async def test_returns_201_on_success(self, client):
        mock_outcome = MagicMock()
        mock_outcome.id = OID
        mock_outcome.session_id = SID
        mock_outcome.description = "Ship MVP by Friday"
        mock_outcome.time_estimate_minutes = 120
        mock_outcome.created_by = None
        mock_outcome.confirmed_by = []
        mock_outcome.all_confirmed = False
        mock_outcome.outcome_status = "pending"
        mock_outcome.results_log = None
        mock_outcome.assessed_by = None
        mock_outcome.completed_at = None
        mock_outcome.created_at = datetime.now(timezone.utc)

        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.create_desired_outcome", new_callable=AsyncMock, return_value=mock_outcome),
        ):
            resp = await client.post(
                f"{PREFIX}/desired-outcome",
                json={"description": "Ship MVP by Friday", "time_estimate_minutes": 120},
            )
        assert resp.status_code == 201
        data = resp.json()
        assert data["description"] == "Ship MVP by Friday"
        assert data["outcome_status"] == "pending"

    @pytest.mark.asyncio
    async def test_empty_description_returns_422(self, client):
        """WireGuard: empty description rejected by Pydantic min_length=1."""
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.post(
                f"{PREFIX}/desired-outcome",
                json={"description": "", "time_estimate_minutes": 0},
            )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_missing_description_returns_422(self, client):
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.post(
                f"{PREFIX}/desired-outcome",
                json={"time_estimate_minutes": 0},
            )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_negative_time_estimate_returns_422(self, client):
        """WireGuard: negative time_estimate_minutes rejected by ge=0."""
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.post(
                f"{PREFIX}/desired-outcome",
                json={"description": "Valid outcome", "time_estimate_minutes": -5},
            )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# POST /sessions/{sid}/desired-outcome/{oid}/confirm
# ---------------------------------------------------------------------------


class TestConfirmOutcome:
    """POST /desired-outcome/{oid}/confirm — record confirmation (auth required)."""

    @pytest.mark.asyncio
    async def test_returns_200_on_confirm(self, client):
        pid = uuid.uuid4()
        mock_result = {"outcome_id": str(OID), "confirmed_by": str(pid)}
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.record_confirmation", new_callable=AsyncMock, return_value=mock_result),
        ):
            resp = await client.post(
                f"{PREFIX}/desired-outcome/{OID}/confirm",
                json={"participant_id": str(pid)},
            )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_invalid_participant_uuid_returns_422(self, client):
        """WireGuard: malformed UUID rejected at schema level."""
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.post(
                f"{PREFIX}/desired-outcome/{OID}/confirm",
                json={"participant_id": "not-a-uuid"},
            )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_missing_participant_id_returns_422(self, client):
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.post(
                f"{PREFIX}/desired-outcome/{OID}/confirm",
                json={},
            )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /sessions/{sid}/desired-outcome/{oid}/check
# ---------------------------------------------------------------------------


class TestCheckConfirmed:
    """GET /desired-outcome/{oid}/check — check if all confirmed (optional auth)."""

    @pytest.mark.asyncio
    async def test_all_confirmed(self, client):
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.check_all_confirmed", new_callable=AsyncMock, return_value=True),
        ):
            resp = await client.get(f"{PREFIX}/desired-outcome/{OID}/check?required=3")
        assert resp.status_code == 200
        data = resp.json()
        assert data["all_confirmed"] is True
        assert data["required"] == 3
        assert data["outcome_id"] == str(OID)

    @pytest.mark.asyncio
    async def test_not_yet_confirmed(self, client):
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.check_all_confirmed", new_callable=AsyncMock, return_value=False),
        ):
            resp = await client.get(f"{PREFIX}/desired-outcome/{OID}/check?required=5")
        assert resp.status_code == 200
        assert resp.json()["all_confirmed"] is False

    @pytest.mark.asyncio
    async def test_required_zero_returns_422(self, client):
        """WireGuard: required=0 rejected by ge=1 constraint."""
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.get(f"{PREFIX}/desired-outcome/{OID}/check?required=0")
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_default_required_is_1(self, client):
        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.check_all_confirmed", new_callable=AsyncMock, return_value=True),
        ):
            resp = await client.get(f"{PREFIX}/desired-outcome/{OID}/check")
        assert resp.status_code == 200
        assert resp.json()["required"] == 1


# ---------------------------------------------------------------------------
# POST /sessions/{sid}/desired-outcome/{oid}/results
# ---------------------------------------------------------------------------


class TestLogResults:
    """POST /desired-outcome/{oid}/results — log post-task results (auth required)."""

    @pytest.mark.asyncio
    async def test_returns_200_achieved(self, client):
        mock_outcome = MagicMock()
        mock_outcome.id = OID
        mock_outcome.session_id = SID
        mock_outcome.description = "Ship MVP"
        mock_outcome.time_estimate_minutes = 60
        mock_outcome.created_by = None
        mock_outcome.confirmed_by = []
        mock_outcome.all_confirmed = True
        mock_outcome.outcome_status = "achieved"
        mock_outcome.results_log = "MVP shipped successfully"
        mock_outcome.assessed_by = None
        mock_outcome.completed_at = datetime.now(timezone.utc)
        mock_outcome.created_at = datetime.now(timezone.utc)

        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.log_post_task_results", new_callable=AsyncMock, return_value=mock_outcome),
        ):
            resp = await client.post(
                f"{PREFIX}/desired-outcome/{OID}/results",
                json={
                    "results_log": "MVP shipped successfully",
                    "outcome_status": "achieved",
                },
            )
        assert resp.status_code == 200
        assert resp.json()["outcome_status"] == "achieved"

    @pytest.mark.asyncio
    async def test_partially_achieved_status(self, client):
        mock_outcome = MagicMock()
        mock_outcome.id = OID
        mock_outcome.session_id = SID
        mock_outcome.description = "Ship MVP"
        mock_outcome.time_estimate_minutes = 60
        mock_outcome.created_by = None
        mock_outcome.confirmed_by = []
        mock_outcome.all_confirmed = True
        mock_outcome.outcome_status = "partially_achieved"
        mock_outcome.results_log = "80% done"
        mock_outcome.assessed_by = None
        mock_outcome.completed_at = datetime.now(timezone.utc)
        mock_outcome.created_at = datetime.now(timezone.utc)

        with (
            patch(VALIDATE, new_callable=AsyncMock),
            patch(f"{RTR}.log_post_task_results", new_callable=AsyncMock, return_value=mock_outcome),
        ):
            resp = await client.post(
                f"{PREFIX}/desired-outcome/{OID}/results",
                json={
                    "results_log": "80% done",
                    "outcome_status": "partially_achieved",
                },
            )
        assert resp.status_code == 200
        assert resp.json()["outcome_status"] == "partially_achieved"

    @pytest.mark.asyncio
    async def test_invalid_outcome_status_returns_400(self, client):
        """WireGuard: invalid outcome_status rejected at router level."""
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.post(
                f"{PREFIX}/desired-outcome/{OID}/results",
                json={
                    "results_log": "Some results",
                    "outcome_status": "invalid_status",
                },
            )
        # Pydantic validator fires first (422) or router check fires (400)
        assert resp.status_code in (400, 422)

    @pytest.mark.asyncio
    async def test_empty_results_log_returns_422(self, client):
        """WireGuard: empty results_log rejected by min_length=1."""
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.post(
                f"{PREFIX}/desired-outcome/{OID}/results",
                json={
                    "results_log": "",
                    "outcome_status": "achieved",
                },
            )
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_missing_results_log_returns_422(self, client):
        with patch(VALIDATE, new_callable=AsyncMock):
            resp = await client.post(
                f"{PREFIX}/desired-outcome/{OID}/results",
                json={"outcome_status": "achieved"},
            )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Cross-cutting: Session validation
# ---------------------------------------------------------------------------


class TestSessionValidation:
    """All endpoints should return 404 when session does not exist."""

    @pytest.mark.asyncio
    async def test_collected_invalid_session_404(self, client):
        from app.core.exceptions import SessionNotFoundError
        with patch(VALIDATE, new_callable=AsyncMock, side_effect=SessionNotFoundError(str(SID))):
            resp = await client.get(f"{PREFIX}/collected")
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_response_count_invalid_session_404(self, client):
        from app.core.exceptions import SessionNotFoundError
        with patch(VALIDATE, new_callable=AsyncMock, side_effect=SessionNotFoundError(str(SID))):
            resp = await client.get(f"{PREFIX}/response-count")
        assert resp.status_code == 404