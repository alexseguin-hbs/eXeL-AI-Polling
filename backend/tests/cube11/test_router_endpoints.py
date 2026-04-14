"""Cube 11 — Blockchain Router Endpoint Tests.

Tests all 4 endpoints: record-survey, verify, pending, retry-pending.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

SID = str(uuid.uuid4())
RTR = "app.cubes.cube11_blockchain.router"
SVC = "app.cubes.cube11_blockchain.service"


class TestRecordSurvey:
    """POST /chain/record-survey — moderator/admin only."""

    @pytest.mark.asyncio
    async def test_records_survey(self, client):
        mock_result = {"status": "recorded", "governance_proof": "abc" * 21, "session_hash": SID}
        with patch(f"{SVC}.record_survey_on_chain", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.post("/api/v1/chain/record-survey", json={
                "session_hash": SID,
                "cube6_theme_hash": "h6",
                "cube7_ranking_hash": "h7",
                "cube9_export_hash": "h9",
                "cube1_session_hash": "h1",
                "winning_theme": "AI Governance",
                "voter_count": 12,
                "response_count": 36,
            })
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_idempotent_duplicate(self, client):
        mock_result = {"status": "already_recorded", "session_hash": SID, "governance_proof": "x" * 64}
        with patch(f"{SVC}.record_survey_on_chain", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.post("/api/v1/chain/record-survey", json={
                "session_hash": SID,
                "cube6_theme_hash": "h6", "cube7_ranking_hash": "h7",
                "cube9_export_hash": "h9", "cube1_session_hash": "h1",
                "winning_theme": "Theme", "voter_count": 5, "response_count": 10,
            })
        assert resp.status_code == 201
        assert resp.json()["status"] == "already_recorded"


class TestVerifySurvey:
    """GET /chain/verify/{hash} — public, no auth."""

    @pytest.mark.asyncio
    async def test_verified(self, client):
        mock_result = {"verified": True, "winning_theme": "Democracy", "voter_count": 50}
        with patch(f"{SVC}.verify_survey", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.get(f"/api/v1/chain/verify/{SID}")
        assert resp.status_code == 200
        assert resp.json()["verified"] is True

    @pytest.mark.asyncio
    async def test_not_found(self, client):
        mock_result = {"verified": False, "session_hash": "bad", "reason": "No record found"}
        with patch(f"{SVC}.verify_survey", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.get("/api/v1/chain/verify/nonexistent")
        assert resp.status_code == 200
        assert resp.json()["verified"] is False


class TestPending:
    """GET /chain/pending — admin only (dev-mode auth returns moderator → 403)."""

    @pytest.mark.asyncio
    async def test_admin_required(self, client):
        """Non-admin gets 403 — endpoint is admin-only."""
        resp = await client.get("/api/v1/chain/pending")
        assert resp.status_code == 403


class TestRetryPending:
    """POST /chain/retry-pending — admin only."""

    @pytest.mark.asyncio
    async def test_admin_required(self, client):
        """Non-admin gets 403 — endpoint is admin-only."""
        resp = await client.post("/api/v1/chain/retry-pending")
        assert resp.status_code == 403
