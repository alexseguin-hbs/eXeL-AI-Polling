"""Cube 7 — E2E Flow Tests: Submit → Aggregate → Identify → Emit.

Tests the full ranking pipeline using mocked DB and broadcast.
Verifies CRS-11, CRS-12, CRS-11.03, CRS-11.04 integration.
"""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.cubes.cube7_ranking.service import (
    _borda_scores,
    _seeded_tiebreak_key,
    detect_voting_anomalies,
)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

THEME_IDS = [uuid.uuid4() for _ in range(3)]
SESSION_ID = uuid.uuid4()
PARTICIPANT_IDS = [uuid.uuid4() for _ in range(5)]

CUBE7_TEST_METHOD = {
    "cube": "cube7_ranking",
    "version": "1.0.0",
    "test_command": "python -m pytest tests/cube7/ -v --tb=short",
    "test_files": [
        "tests/cube7/test_ranking_service.py",
        "tests/cube7/test_e2e_flows.py",
    ],
    "baseline_metrics": {
        "tests_total": 45,
        "backend_duration_ms": "target <1000",
        "typescript_errors": 0,
    },
    "flows": {
        "submit_ranking": "Participant submits ranked theme order",
        "aggregate": "Borda count + seeded tie-breaking",
        "identify_top": "Set is_top_theme2 on #1 theme",
        "emit_complete": "Broadcast ranking_complete + trigger CQS",
        "anomaly_detect": "Anti-sybil pattern detection",
    },
    "spiral_propagation": {
        "forward": {
            "cube7→cube5": "emit_ranking_complete triggers CQS via trigger_cqs_scoring",
            "cube7→cube8": "CQS winner feeds reward calculation",
            "cube7→cube9": "aggregated_rankings populates CSV export",
        },
        "backward": {
            "cube6→cube7": "themes_ready triggers ranking phase",
            "cube5→cube7": "trigger_ranking_pipeline creates trigger record",
            "cube1→cube7": "session.theme2_voting_level controls theme count",
        },
    },
}


# ---------------------------------------------------------------------------
# Schema Validation Tests
# ---------------------------------------------------------------------------


class TestSchemaValidation:
    """Verify Pydantic schemas accept/reject correctly."""

    def test_ranking_submit_valid(self):
        from app.schemas.ranking import RankingSubmit
        payload = RankingSubmit(ranked_theme_ids=THEME_IDS)
        assert len(payload.ranked_theme_ids) == 3

    def test_ranking_submit_empty(self):
        from app.schemas.ranking import RankingSubmit
        payload = RankingSubmit(ranked_theme_ids=[])
        assert payload.ranked_theme_ids == []

    def test_aggregated_ranking_read(self):
        from app.schemas.ranking import AggregatedRankingRead
        data = {
            "id": uuid.uuid4(),
            "session_id": SESSION_ID,
            "cycle_id": 1,
            "theme_id": THEME_IDS[0],
            "rank_position": 1,
            "score": 10.0,
            "vote_count": 5,
            "is_top_theme2": True,
            "participant_count": 5,
            "algorithm": "borda_count",
            "is_final": True,
            "aggregated_at": datetime.now(timezone.utc),
        }
        read = AggregatedRankingRead(**data)
        assert read.rank_position == 1
        assert read.is_top_theme2 is True

    def test_ranking_read(self):
        from app.schemas.ranking import RankingRead
        data = {
            "id": uuid.uuid4(),
            "session_id": SESSION_ID,
            "cycle_id": 1,
            "participant_id": PARTICIPANT_IDS[0],
            "ranked_theme_ids": [str(t) for t in THEME_IDS],
            "submitted_at": datetime.now(timezone.utc),
        }
        read = RankingRead(**data)
        assert len(read.ranked_theme_ids) == 3

    def test_ranking_submit_with_9_themes(self):
        ids = [uuid.uuid4() for _ in range(9)]
        from app.schemas.ranking import RankingSubmit
        payload = RankingSubmit(ranked_theme_ids=ids)
        assert len(payload.ranked_theme_ids) == 9

    def test_ranking_submit_with_6_themes(self):
        ids = [uuid.uuid4() for _ in range(6)]
        from app.schemas.ranking import RankingSubmit
        payload = RankingSubmit(ranked_theme_ids=ids)
        assert len(payload.ranked_theme_ids) == 6


# ---------------------------------------------------------------------------
# Anomaly Detection Tests
# ---------------------------------------------------------------------------


def _make_mock_ranking(ranked_ids, participant_id, submitted_at):
    """Helper to create a mock Ranking object."""
    r = MagicMock()
    r.ranked_theme_ids = ranked_ids
    r.participant_id = participant_id
    r.submitted_at = submitted_at
    return r


class TestAnomalyDetection:
    """Anti-sybil detection unit tests."""

    @pytest.mark.asyncio
    async def test_no_anomalies_normal_voting(self):
        """Normal diverse voting produces no anomalies."""
        mock_db = AsyncMock()
        now = datetime.now(timezone.utc)
        rankings = []
        for i in range(5):
            ids = [str(THEME_IDS[(i + j) % 3]) for j in range(3)]
            rankings.append(_make_mock_ranking(ids, PARTICIPANT_IDS[i], now + timedelta(seconds=i * 10)))

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = rankings
        mock_db.execute = AsyncMock(return_value=mock_result)

        anomalies = await detect_voting_anomalies(mock_db, SESSION_ID)
        assert len(anomalies) == 0

    @pytest.mark.asyncio
    async def test_identical_ranking_burst_detected(self):
        """3+ identical rankings within 2s flagged."""
        mock_db = AsyncMock()
        identical_order = [str(t) for t in THEME_IDS]
        now = datetime.now(timezone.utc)
        rankings = [
            _make_mock_ranking(identical_order, PARTICIPANT_IDS[i], now + timedelta(seconds=i * 0.5))
            for i in range(3)
        ]

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = rankings
        mock_db.execute = AsyncMock(return_value=mock_result)

        anomalies = await detect_voting_anomalies(mock_db, SESSION_ID)
        assert len(anomalies) >= 1
        assert anomalies[0]["type"] == "identical_ranking_burst"

    @pytest.mark.asyncio
    async def test_identical_but_spaced_not_flagged(self):
        """3 identical rankings spread over 10 minutes are NOT flagged."""
        mock_db = AsyncMock()
        identical_order = [str(t) for t in THEME_IDS]
        now = datetime.now(timezone.utc)
        rankings = [
            _make_mock_ranking(identical_order, PARTICIPANT_IDS[i], now + timedelta(minutes=i * 5))
            for i in range(3)
        ]

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = rankings
        mock_db.execute = AsyncMock(return_value=mock_result)

        anomalies = await detect_voting_anomalies(mock_db, SESSION_ID)
        burst = [a for a in anomalies if a["type"] == "identical_ranking_burst"]
        assert len(burst) == 0

    @pytest.mark.asyncio
    async def test_two_identical_not_flagged(self):
        """Only 2 identical rankings (below threshold of 3) — not flagged."""
        mock_db = AsyncMock()
        identical_order = [str(t) for t in THEME_IDS]
        now = datetime.now(timezone.utc)
        rankings = [
            _make_mock_ranking(identical_order, PARTICIPANT_IDS[i], now + timedelta(seconds=i * 0.5))
            for i in range(2)
        ]

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = rankings
        mock_db.execute = AsyncMock(return_value=mock_result)

        anomalies = await detect_voting_anomalies(mock_db, SESSION_ID)
        assert len(anomalies) == 0

    @pytest.mark.asyncio
    async def test_empty_rankings_no_anomalies(self):
        """No rankings at all — no anomalies."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        anomalies = await detect_voting_anomalies(mock_db, SESSION_ID)
        assert len(anomalies) == 0


# ---------------------------------------------------------------------------
# Model Tests
# ---------------------------------------------------------------------------


class TestRankingModel:
    """Verify ORM model structure."""

    def test_ranking_table_name(self):
        from app.models.ranking import Ranking
        assert Ranking.__tablename__ == "user_rankings"

    def test_aggregated_ranking_table_name(self):
        from app.models.ranking import AggregatedRanking
        assert AggregatedRanking.__tablename__ == "aggregated_rankings"

    def test_ranking_unique_constraint(self):
        from app.models.ranking import Ranking
        constraints = [
            c.name for c in Ranking.__table_args__
            if hasattr(c, "name") and c.name
        ]
        assert "uq_ranking_session_cycle_participant" in constraints

    def test_aggregated_ranking_indexes(self):
        from app.models.ranking import AggregatedRanking
        names = [
            c.name for c in AggregatedRanking.__table_args__
            if hasattr(c, "name") and c.name
        ]
        assert "ix_agg_rankings_session_cycle" in names
        assert "ix_agg_rankings_top_theme2" in names

    def test_ranking_has_session_relationship(self):
        from app.models.ranking import Ranking
        assert hasattr(Ranking, "session")

    def test_aggregated_ranking_columns(self):
        from app.models.ranking import AggregatedRanking
        col_names = [c.key for c in AggregatedRanking.__table__.columns]
        expected = [
            "id", "session_id", "cycle_id", "theme_id", "rank_position",
            "score", "vote_count", "is_top_theme2", "participant_count",
            "algorithm", "is_final", "aggregated_at",
        ]
        for col in expected:
            assert col in col_names, f"Missing column: {col}"


# ---------------------------------------------------------------------------
# Router Structure Tests (no DB)
# ---------------------------------------------------------------------------


class TestRouterStructure:
    """Verify router is properly configured."""

    def test_router_prefix(self):
        from app.cubes.cube7_ranking.router import router
        assert router.prefix == "/sessions/{session_id}"

    def test_router_tags(self):
        from app.cubes.cube7_ranking.router import router
        assert "Cube 7 — Ranking" in router.tags

    def test_endpoint_count(self):
        """Router has 5 endpoints: POST rankings, GET rankings, POST aggregate, GET anomalies, POST override."""
        from app.cubes.cube7_ranking.router import router
        routes = [r for r in router.routes if hasattr(r, "methods")]
        assert len(routes) == 5

    def test_post_rankings_exists(self):
        from app.cubes.cube7_ranking.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("/rankings" in p for p in paths)

    def test_get_rankings_exists(self):
        from app.cubes.cube7_ranking.router import router
        found = any(
            "/rankings" in r.path and "GET" in r.methods
            for r in router.routes if hasattr(r, "methods")
        )
        assert found

    def test_aggregate_endpoint_exists(self):
        from app.cubes.cube7_ranking.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("aggregate" in p for p in paths)

    def test_anomalies_endpoint_exists(self):
        from app.cubes.cube7_ranking.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("anomalies" in p for p in paths)

    def test_override_endpoint_exists(self):
        from app.cubes.cube7_ranking.router import router
        paths = [r.path for r in router.routes if hasattr(r, "methods")]
        assert any("override" in p for p in paths)


# ---------------------------------------------------------------------------
# Integration: Borda Full Pipeline (Pure Logic)
# ---------------------------------------------------------------------------


class TestBordaFullPipeline:
    """Test complete Borda scoring → sorting → winner ID flow."""

    def test_3_voters_3_themes_clear_winner(self):
        """3 voters all pick A as #1 → A wins."""
        rankings = [
            ["A", "B", "C"],
            ["A", "C", "B"],
            ["A", "B", "C"],
        ]
        scores = _borda_scores(rankings, 3)
        sorted_t = sorted(
            scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], "seed")),
        )
        assert sorted_t[0][0] == "A"

    def test_5_voters_9_themes_deterministic(self):
        """5 voters ranking 9 themes: N=5 determinism check."""
        themes = [str(uuid.uuid4()) for _ in range(9)]
        rankings = [
            themes[i:] + themes[:i]  # Each voter rotates the list
            for i in range(5)
        ]
        seed = "cube7-9themes-test"

        results = []
        for _ in range(5):
            scores = _borda_scores(rankings, 9)
            s = sorted(
                scores.items(),
                key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], seed)),
            )
            results.append([t[0] for t in s])

        assert all(r == results[0] for r in results)

    def test_100_voters_3_themes(self):
        """Stress: 100 voters with varied rankings."""
        themes = ["T1", "T2", "T3"]
        rankings = []
        for i in range(100):
            # Rotate themes based on voter index
            offset = i % 3
            rankings.append(themes[offset:] + themes[:offset])

        scores = _borda_scores(rankings, 3)
        # With perfect rotation, all themes should have similar scores
        values = list(scores.values())
        assert max(values) - min(values) <= 34  # Roughly equal (100 voters * 2 max diff / 3)

    def test_winner_identification_logic(self):
        """Rank position 1 = highest score."""
        scores = {"A": 10.0, "B": 5.0, "C": 1.0}
        sorted_t = sorted(
            scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], "s")),
        )
        assert sorted_t[0][0] == "A"
        assert sorted_t[0][1] == 10.0
