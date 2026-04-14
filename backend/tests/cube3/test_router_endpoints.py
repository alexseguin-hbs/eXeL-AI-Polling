"""Cube 3 — Router endpoint tests for voice-to-text endpoints.

Covers:
  - POST /sessions/{sid}/voice (submit_voice) — optional auth, WireGuard validation
  - GET  /sessions/{sid}/voice (list_voice_responses) — requires auth
  - GET  /sessions/{sid}/voice/metrics (get_metrics) — requires auth
  - GET  /sessions/{sid}/voice/{id} (get_voice_response) — requires auth
"""

import io
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest


SID = uuid.uuid4()
PREFIX = f"/api/v1/sessions/{SID}/voice"


def _fake_audio_bytes(size: int = 1024) -> bytes:
    """Generate fake audio bytes for upload tests."""
    return b"\x00" * size


# ---------------------------------------------------------------------------
# POST /voice — submit voice (optional auth, WireGuard validation)
# ---------------------------------------------------------------------------


class TestSubmitVoice:
    """POST /sessions/{sid}/voice — CRS-15 voice submission."""

    def _build_form_data(self, **overrides):
        """Build multipart form data for voice submission."""
        defaults = {
            "question_id": str(uuid.uuid4()),
            "participant_id": str(uuid.uuid4()),
            "language_code": "en",
            "audio_format": "webm",
        }
        defaults.update(overrides)
        return defaults

    @pytest.mark.asyncio
    async def test_submit_returns_201_on_success(self, client):
        mock_result = {
            "id": str(uuid.uuid4()),
            "session_id": str(SID),
            "question_id": str(uuid.uuid4()),
            "participant_id": str(uuid.uuid4()),
            "source": "voice",
            "char_count": 25,
            "language_code": "en",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "is_flagged": False,
            "audio_duration_sec": 3.5,
            "stt_provider": "whisper",
            "transcript_text": "Hello world test.",
            "transcript_confidence": 0.95,
            "pii_detected": False,
            "profanity_detected": False,
            "clean_text": "Hello world test.",
            "response_hash": "abc123",
            "summary_33": None,
            "cost_usd": 0.01,
            "heart_tokens_earned": 1.0,
            "unity_tokens_earned": 5.0,
        }
        form = self._build_form_data()
        with patch(
            "app.cubes.cube3_voice.service.submit_voice_response",
            new_callable=AsyncMock,
            return_value=mock_result,
        ):
            resp = await client.post(
                PREFIX,
                data=form,
                files={"audio": ("test.webm", io.BytesIO(_fake_audio_bytes()), "audio/webm")},
            )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_submit_rejects_invalid_language_code(self, client):
        """WireGuard: language_code with digits rejected."""
        form = self._build_form_data(language_code="e1")
        resp = await client.post(
            PREFIX,
            data=form,
            files={"audio": ("test.webm", io.BytesIO(_fake_audio_bytes()), "audio/webm")},
        )
        assert resp.status_code == 400
        assert "Invalid language_code" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_submit_rejects_special_chars_in_language_code(self, client):
        """WireGuard: language_code with special characters rejected."""
        form = self._build_form_data(language_code="x;")
        resp = await client.post(
            PREFIX,
            data=form,
            files={"audio": ("test.webm", io.BytesIO(_fake_audio_bytes()), "audio/webm")},
        )
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_submit_accepts_3_char_language_code(self, client):
        """WireGuard: 3-char alphabetic code (e.g., 'fra') passes validation."""
        mock_result = {
            "id": str(uuid.uuid4()),
            "session_id": str(SID),
            "question_id": str(uuid.uuid4()),
            "participant_id": str(uuid.uuid4()),
            "source": "voice",
            "char_count": 10,
            "language_code": "fra",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "is_flagged": False,
            "audio_duration_sec": 2.0,
            "stt_provider": "whisper",
            "transcript_text": "Bonjour.",
            "transcript_confidence": 0.90,
            "pii_detected": False,
            "profanity_detected": False,
            "clean_text": "Bonjour.",
            "response_hash": None,
            "summary_33": None,
            "cost_usd": 0.005,
            "heart_tokens_earned": 0.0,
            "unity_tokens_earned": 0.0,
        }
        form = self._build_form_data(language_code="fra")
        with patch(
            "app.cubes.cube3_voice.service.submit_voice_response",
            new_callable=AsyncMock,
            return_value=mock_result,
        ):
            resp = await client.post(
                PREFIX,
                data=form,
                files={"audio": ("test.webm", io.BytesIO(_fake_audio_bytes()), "audio/webm")},
            )
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_submit_rejects_unsupported_audio_format(self, client):
        """WireGuard: unsupported audio formats rejected."""
        form = self._build_form_data(audio_format="exe")
        resp = await client.post(
            PREFIX,
            data=form,
            files={"audio": ("test.exe", io.BytesIO(_fake_audio_bytes()), "application/octet-stream")},
        )
        assert resp.status_code == 400
        assert "Unsupported audio format" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_submit_rejects_empty_audio(self, client):
        """Empty audio file rejected."""
        form = self._build_form_data()
        resp = await client.post(
            PREFIX,
            data=form,
            files={"audio": ("test.webm", io.BytesIO(b""), "audio/webm")},
        )
        assert resp.status_code == 400
        assert "empty" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# GET /voice — list voice responses (requires auth)
# ---------------------------------------------------------------------------


class TestListVoiceResponses:
    """GET /sessions/{sid}/voice — paginated list, auth required."""

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
                "app.cubes.cube3_voice.service.validate_session_exists",
                new_callable=AsyncMock,
            ),
            patch(
                "app.cubes.cube3_voice.service.get_voice_responses",
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
            "page": 3,
            "page_size": 25,
            "pages": 0,
        }
        with (
            patch(
                "app.cubes.cube3_voice.service.validate_session_exists",
                new_callable=AsyncMock,
            ),
            patch(
                "app.cubes.cube3_voice.service.get_voice_responses",
                new_callable=AsyncMock,
                return_value=mock_result,
            ) as mock_fn,
        ):
            resp = await client.get(PREFIX, params={"page": 3, "page_size": 25})
        assert resp.status_code == 200
        mock_fn.assert_called_once()


# ---------------------------------------------------------------------------
# GET /voice/metrics — session metrics (requires auth)
# ---------------------------------------------------------------------------


class TestGetVoiceMetrics:
    """GET /sessions/{sid}/voice/metrics — moderator-only metrics."""

    @pytest.mark.asyncio
    async def test_metrics_returns_200(self, client, moderator_user):
        mock_metrics = {
            "system": {"total_voice_responses": 50},
            "user": {"avg_audio_duration_sec": 4.2},
            "outcome": {"avg_confidence": 0.92},
        }
        with patch(
            "app.cubes.cube3_voice.metrics.get_all_metrics",
            new_callable=AsyncMock,
            return_value=mock_metrics,
        ):
            resp = await client.get(f"{PREFIX}/metrics")
        assert resp.status_code == 200
        data = resp.json()
        assert "system" in data


# ---------------------------------------------------------------------------
# GET /voice/{response_id} — single voice response detail (requires auth)
# ---------------------------------------------------------------------------


class TestGetVoiceResponse:
    """GET /sessions/{sid}/voice/{id} — single voice response detail."""

    @pytest.mark.asyncio
    async def test_detail_returns_200_on_found(self, client, moderator_user):
        rid = uuid.uuid4()
        mock_result = {
            "id": str(rid),
            "session_id": str(SID),
            "question_id": str(uuid.uuid4()),
            "participant_id": str(uuid.uuid4()),
            "source": "voice",
            "char_count": 25,
            "language_code": "en",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "is_flagged": False,
            "audio_duration_sec": 3.5,
            "stt_provider": "whisper",
            "transcript_text": "Hello world.",
            "transcript_confidence": 0.95,
            "pii_detected": False,
            "profanity_detected": False,
            "clean_text": "Hello world.",
            "response_hash": "abc",
            "summary_33": None,
            "cost_usd": 0.01,
            "heart_tokens_earned": 1.0,
            "unity_tokens_earned": 5.0,
            "audio_format": "webm",
            "audio_size_bytes": 1024,
            "pii_types": None,
            "pii_scrubbed_text": None,
            "profanity_words": None,
        }
        with (
            patch(
                "app.cubes.cube3_voice.service.validate_session_exists",
                new_callable=AsyncMock,
            ),
            patch(
                "app.cubes.cube3_voice.service.get_voice_response_by_id",
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
                "app.cubes.cube3_voice.service.validate_session_exists",
                new_callable=AsyncMock,
            ),
            patch(
                "app.cubes.cube3_voice.service.get_voice_response_by_id",
                new_callable=AsyncMock,
                return_value=None,
            ),
        ):
            resp = await client.get(f"{PREFIX}/{rid}")
        assert resp.status_code == 404
