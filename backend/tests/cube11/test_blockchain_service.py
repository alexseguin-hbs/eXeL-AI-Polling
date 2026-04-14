"""Cube 11 — Blockchain Service Tests.

Tests governance proof computation, survey recording, verification,
and pending/retry queue. All mocked — no real Quai chain calls.

CRS: CRS-23 (Audit trail)
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube11_blockchain.service import (
    compute_governance_proof,
    record_survey_on_chain,
    verify_survey,
    get_pending_records,
    retry_pending,
)


class TestGovernanceProof:
    """4-hash governance proof chain computation."""

    def test_deterministic_n99(self):
        """Same 4 hashes always produce the same governance proof."""
        ref = None
        for _ in range(99):
            proof = compute_governance_proof("hash6", "hash7", "hash9", "hash1")
            if ref is None:
                ref = proof
            assert proof == ref

    def test_different_inputs_different_proof(self):
        """Changing any hash changes the proof."""
        base = compute_governance_proof("a", "b", "c", "d")
        assert compute_governance_proof("X", "b", "c", "d") != base
        assert compute_governance_proof("a", "X", "c", "d") != base
        assert compute_governance_proof("a", "b", "X", "d") != base
        assert compute_governance_proof("a", "b", "c", "X") != base

    def test_proof_is_sha256(self):
        """Proof is a 64-char hex SHA-256 hash."""
        proof = compute_governance_proof("a", "b", "c", "d")
        assert len(proof) == 64
        assert all(c in "0123456789abcdef" for c in proof)

    def test_order_matters(self):
        """Hash order matters — swapping inputs changes proof."""
        p1 = compute_governance_proof("a", "b", "c", "d")
        p2 = compute_governance_proof("b", "a", "c", "d")
        assert p1 != p2


class TestRecordSurvey:
    """Record survey governance proof to Supabase."""

    @pytest.mark.asyncio
    async def test_records_new_survey(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None  # No duplicate
        db.execute = AsyncMock(return_value=mock_result)

        async def mock_refresh(obj):
            obj.id = uuid.uuid4()
            obj.created_at = datetime.now(timezone.utc)
        db.refresh = AsyncMock(side_effect=mock_refresh)

        result = await record_survey_on_chain(
            db,
            session_hash="sess-001",
            cube6_theme_hash="h6", cube7_ranking_hash="h7",
            cube9_export_hash="h9", cube1_session_hash="h1",
            winning_theme="AI Governance",
            voter_count=12, response_count=36,
        )

        assert result["status"] == "recorded"
        assert result["winning_theme"] == "AI Governance"
        assert result["voter_count"] == 12
        assert len(result["governance_proof"]) == 64

    @pytest.mark.asyncio
    async def test_idempotent_duplicate(self):
        db = AsyncMock()
        existing = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing
        db.execute = AsyncMock(return_value=mock_result)

        result = await record_survey_on_chain(
            db,
            session_hash="sess-001",
            cube6_theme_hash="h6", cube7_ranking_hash="h7",
            cube9_export_hash="h9", cube1_session_hash="h1",
            winning_theme="Theme", voter_count=5, response_count=10,
        )

        assert result["status"] == "already_recorded"


class TestVerifySurvey:
    """Public verify endpoint."""

    @pytest.mark.asyncio
    async def test_found(self):
        db = AsyncMock()
        record = MagicMock()
        record.governance_proof = "abc123"
        record.winning_theme = "Democracy"
        record.voter_count = 50
        record.response_count = 200
        record.chain_status = "recorded"
        record.quai_tx_hash = "0xabc"
        record.created_at = datetime.now(timezone.utc)
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = record
        db.execute = AsyncMock(return_value=mock_result)

        result = await verify_survey(db, "sess-001")
        assert result["verified"] is True
        assert result["winning_theme"] == "Democracy"

    @pytest.mark.asyncio
    async def test_not_found(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        db.execute = AsyncMock(return_value=mock_result)

        result = await verify_survey(db, "nonexistent")
        assert result["verified"] is False


class TestPendingRetry:
    """Pending queue and retry."""

    @pytest.mark.asyncio
    async def test_retry_returns_count(self):
        db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar.return_value = 5
        db.execute = AsyncMock(return_value=mock_result)

        result = await retry_pending(db)
        assert result["pending_count"] == 5
        assert result["status"] == "queued_for_retry"
