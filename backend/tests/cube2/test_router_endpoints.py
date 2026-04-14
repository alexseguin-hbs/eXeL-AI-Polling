"""Cube 2 — Router endpoint tests for text submission endpoints.

Covers:
  - POST /sessions/{sid}/responses (submit_response) — optional auth, WireGuard validation
  - GET  /sessions/{sid}/responses (list_responses) — requires auth
  - GET  /sessions/{sid}/responses/metrics (get_metrics) — requires auth
  - GET  /sessions/{sid}/responses/{id} (get_response) — requires auth
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest


SID = uuid.uuid4()
PREFIX = f"/api/v1/sessions/{SID}/responses"


# ---------------------------------------------------------------------------
# POST /responses — submit text (optional auth, WireGuard validation)
# ---------------------------------------------------------------------------


class TestSubmitResponse:
    """POST /sessions/{sid}/responses — CRS-07 text submission."""

    @pytest.mark.asyncio
    async def test_submit_returns_201_on_success(self, client):
        mock_result = {
            "id": str(uuid.uuid4()),
            "session_id": str(SID),
            "question_id": str(uuid.uuid4()),
            "participant_id": str(uuid.uuid4()),
            "source": "text",
            "char_count": 42,
            "language_code": "en",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "is_flagged": False,
            "pii_detected": False,
            "profanity_detected": False,
            "clean_text": "Test response",
            "summary_33": None,
            "response_hash": "abc123",
            "heart_tokens_earned": 1.0,
            "unity_tokens_earned": 5.0,
        }
        with patch(
            "app.cubes.cube2_text.service.submit_text_response",
            new_callable=AsyncMock,
            return_value=mock_result,
        ):
            resp = await client.post(
                PREFIX,
                json={
                    "question_id": str(uuid.uuid4()),
                    "participant_id": str(uuid.uuid4()),
                    "raw_text": "I think AI governance is crucial.",
                    "language_code": "en",
                },
            )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_submit_rejects_invalid_language_code_numbers(self, client):
        """WireGuard: language_code with digits must be rejected."""
        resp = await client.post(
            PREFIX,
            json={
                "question_id": str(uuid.uuid4()),
                "participant_id": str(uuid.uuid4()),
                "raw_text": "Test input.",
                "language_code": "e1",
            },
        )
        assert resp.status_code == 400
        assert "Invalid language_code" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_submit_rejects_language_code_too_long(self, client):
        """WireGuard: language_code longer than 3 chars rejected at router."""
        resp = await client.post(
            PREFIX,
            json={
                "question_id": str(uuid.uuid4()),
                "participant_id": str(uuid.uuid4()),
                "raw_text": "Test input.",
                "language_code": "english",
            },
        )
        # Pydantic max_length=10 passes, but router regex rejects >3 alpha
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_submit_rejects_special_chars_in_language_code(self, client):
        """WireGuard: language_code with special characters rejected."""
        resp = await client.post(
            PREFIX,
            json={
                "question_id": str(uuid.uuid4()),
                "participant_id": str(uuid.uuid4()),
                "raw_text": "Test input.",
                "language_code": "e;",
            },
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_submit_accepts_3_char_language_code(self, client):
        """WireGuard: 3-char alphabetic language_code (e.g., 'fra') is valid."""
        mock_result = {
            "id": str(uuid.uuid4()),
            "session_id": str(SID),
            "question_id": str(uuid.uuid4()),
            "participant_id": str(uuid.uuid4()),
            "source": "text",
            "char_count": 10,
            "language_code": "fra",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "is_flagged": False,
            "pii_detected": False,
            "profanity_detected": False,
            "clean_text": "Test",
            "summary_33": None,
            "response_hash": None,
            "heart_tokens_earned": 0.0,
            "unity_tokens_earned": 0.0,
        }
        with patch(
            "app.cubes.cube2_text.service.submit_text_response",
            new_callable=AsyncMock,
            return_value=mock_result,
        ):
            resp = await client.post(
                PREFIX,
                json={
                    "question_id": str(uuid.uuid4()),
                    "participant_id": str(uuid.uuid4()),
                    "raw_text": "Bonjour le monde.",
                    "language_code": "fra",
                },
            )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_submit_rejects_empty_text(self, client):
        """Pydantic: raw_text min_length=1 validation."""
        resp = await client.post(
            PREFIX,
            json={
                "question_id": str(uuid.uuid4()),
                "participant_id": str(uuid.uuid4()),
                "raw_text": "",
                "language_code": "en",
            },
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# GET /responses — list with pagination (requires auth)
# ---------------------------------------------------------------------------


class TestListResponses:
    """GET /sessions/{sid}/responses — paginated list, auth required."""

    @pytest.mark.asyncio
    async def test_list_returns_200_with_items(self, client, moderator_user):
        mock_result = {
            "items": [],
            "total": 0,
            "page": 1,
            "page_size": 50,
            "pages": 0,
        }
        with (
            patch(
                "app.core.submission_validators.validate_session_exists",
                new_callable=AsyncMock,
            ),
            patch(
                "app.cubes.cube2_text.service.get_responses",
                new_callable=AsyncMock,
                return_value=mock_result,
            ),
        ):
            resp = await client.get(PREFIX)
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert data["total"] == 0

    @pytest.mark.asyncio
    async def test_list_accepts_pagination_params(self, client, moderator_user):
        mock_result = {
            "items": [],
            "total": 0,
            "page": 2,
            "page_size": 10,
            "pages": 0,
        }
        with (
            patch(
                "app.core.submission_validators.validate_session_exists",
                new_callable=AsyncMock,
            ),
            patch(
                "app.cubes.cube2_text.service.get_responses",
                new_callable=AsyncMock,
                return_value=mock_result,
            ) as mock_fn,
        ):
            resp = await client.get(PREFIX, params={"page": 2, "page_size": 10})
        assert resp.status_code == 200
        mock_fn.assert_called_once()


# ---------------------------------------------------------------------------
# GET /responses/metrics — session metrics (requires auth)
# ---------------------------------------------------------------------------


class TestGetMetrics:
    """GET /sessions/{sid}/responses/metrics — moderator-only metrics."""

    @pytest.mark.asyncio
    async def test_metrics_returns_200(self, client, moderator_user):
        mock_metrics = {
            "system": {"total_responses": 100},
            "user": {"avg_char_count": 200},
            "outcome": {"themes_found": 5},
        }
        with patch(
            "app.cubes.cube2_text.metrics.get_all_metrics",
            new_callable=AsyncMock,
            return_value=mock_metrics,
        ):
            resp = await client.get(f"{PREFIX}/metrics")
        assert resp.status_code == 200
        data = resp.json()
        assert "system" in data


# ---------------------------------------------------------------------------
# GET /responses/{response_id} — single response detail (requires auth)
# ---------------------------------------------------------------------------


class TestGetResponse:
    """GET /sessions/{sid}/responses/{id} — single response detail."""

    @pytest.mark.asyncio
    async def test_detail_returns_200_on_found(self, client, moderator_user):
        rid = uuid.uuid4()
        mock_result = {
            "id": str(rid),
            "session_id": str(SID),
            "question_id": str(uuid.uuid4()),
            "participant_id": str(uuid.uuid4()),
            "source": "text",
            "char_count": 42,
            "language_code": "en",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "is_flagged": False,
            "pii_detected": False,
            "profanity_detected": False,
            "clean_text": "Test response",
            "summary_33": None,
            "response_hash": "abc",
            "heart_tokens_earned": 1.0,
            "unity_tokens_earned": 5.0,
            "pii_types": None,
            "pii_scrubbed_text": None,
            "profanity_words": None,
        }
        with (
            patch(
                "app.core.submission_validators.validate_session_exists",
                new_callable=AsyncMock,
            ),
            patch(
                "app.cubes.cube2_text.service.get_response_by_id",
                new_callable=AsyncMock,
                return_value=mock_result,
            ),
        ):
            resp = await client.get(f"{PREFIX}/{rid}")
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_detail_returns_404_on_not_found(self, client, moderator_user):
        rid = uuid.uuid4()
        with (
            patch(
                "app.core.submission_validators.validate_session_exists",
                new_callable=AsyncMock,
            ),
            patch(
                "app.cubes.cube2_text.service.get_response_by_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
        ):
            resp = await client.get(f"{PREFIX}/{rid}")
        assert resp.status_code == 404
