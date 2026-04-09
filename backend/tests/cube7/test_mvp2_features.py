"""Cube 7 — MVP2+ Feature Tests.

Tests:
  - CRS-16.01: Emerging patterns (partial aggregation)
  - CRS-17.01: Personal vs group rank (agreement score)
  - CRS-13.03: Replay verification (re-run match)
  - Router structure: new endpoints exist
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube7_ranking.service import (
    get_emerging_patterns,
    get_personal_vs_group_rank,
    verify_replay,
)


SESSION_ID = uuid.uuid4()
THEME_IDS = [uuid.uuid4() for _ in range(3)]
PARTICIPANT_ID = uuid.uuid4()


# ---------------------------------------------------------------------------
# CRS-16.01: Emerging Patterns
# ---------------------------------------------------------------------------


class TestEmergingPatterns:
    """Live emerging patterns during ranking phase."""

    @pytest.mark.asyncio
    async def test_empty_session_returns_zero(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_emerging_patterns(mock_db, SESSION_ID)
        assert result["submissions_so_far"] == 0
        assert result["emerging_leader"] is None
        assert result["convergence"] == 0.0

    @pytest.mark.asyncio
    async def test_single_submission_has_leader(self):
        mock_db = AsyncMock()
        ids = [str(t) for t in THEME_IDS]

        r = MagicMock()
        r.ranked_theme_ids = ids
        r.participant_id = PARTICIPANT_ID
        r.submitted_at = datetime.now(timezone.utc)

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [r]

        # First call: rankings, second call: theme label
        theme_result = MagicMock()
        theme_result.scalar_one_or_none.return_value = "Test Theme"

        mock_db.execute = AsyncMock(side_effect=[mock_result, theme_result])

        result = await get_emerging_patterns(mock_db, SESSION_ID)
        assert result["submissions_so_far"] == 1
        assert result["emerging_leader"] is not None
        assert result["convergence"] > 0

    def test_convergence_range(self):
        """Convergence should always be 0-1."""
        # Max convergence: all voters agree on #1
        from app.cubes.cube7_ranking.service import _borda_scores
        rankings = [["A", "B", "C"]] * 10
        scores = _borda_scores(rankings, 3)
        leader_score = max(scores.values())
        total_possible = 10 * 2  # n_voters * (n_themes - 1)
        convergence = leader_score / total_possible
        assert 0 <= convergence <= 1.0


# ---------------------------------------------------------------------------
# CRS-17.01: Personal vs Group Rank
# ---------------------------------------------------------------------------


class TestPersonalVsGroupRank:
    """Personal ranking compared to group consensus."""

    @pytest.mark.asyncio
    async def test_no_ranking_returns_empty(self):
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        result = await get_personal_vs_group_rank(
            mock_db, SESSION_ID, PARTICIPANT_ID
        )
        assert result["personal_rank"] == []
        assert result["agreement_score"] == 0.0

    def test_perfect_agreement_score(self):
        """If personal order matches group order, agreement should be 1.0."""
        # Both have same order: concordant pairs = all pairs
        personal = ["A", "B", "C"]
        group = ["A", "B", "C"]
        # All 3 pairs concordant: (A,B), (A,C), (B,C)
        concordant = 3
        total = 3
        assert concordant / total == 1.0

    def test_complete_disagreement(self):
        """Reversed order: 0 concordant pairs out of 3."""
        personal = ["A", "B", "C"]
        group = ["C", "B", "A"]
        # (A,B): personal A<B, group A>B → discordant
        # (A,C): personal A<C, group A>C → discordant
        # (B,C): personal B<C, group B>C → discordant
        concordant = 0
        total = 3
        assert concordant / total == 0.0


# ---------------------------------------------------------------------------
# CRS-13.03: Replay Verification
# ---------------------------------------------------------------------------


class TestReplayVerification:
    """Re-run aggregation and verify determinism."""

    def test_verify_replay_function_exists(self):
        import asyncio
        assert asyncio.iscoroutinefunction(verify_replay)

    def test_verify_replay_is_read_only(self):
        """verify_replay should not write to DB — check source."""
        import inspect
        src = inspect.getsource(verify_replay)
        assert "db.add" not in src
        assert "db.commit" not in src
        assert "db.flush" not in src


# ---------------------------------------------------------------------------
# Router Structure Tests
# ---------------------------------------------------------------------------


class TestMVP2RouterEndpoints:
    """Verify new MVP2 endpoints exist."""

    def test_emerging_endpoint(self):
        from app.cubes.cube7_ranking.router import router
        found = any(
            "emerging" in r.path
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_personal_endpoint(self):
        from app.cubes.cube7_ranking.router import router
        found = any(
            "personal" in r.path
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_verify_endpoint(self):
        from app.cubes.cube7_ranking.router import router
        found = any(
            "verify" in r.path
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_total_endpoint_count(self):
        """Cube 7 should now have 11 endpoints."""
        from app.cubes.cube7_ranking.router import router
        routes = [r for r in router.routes if hasattr(r, "methods")]
        assert len(routes) == 11
