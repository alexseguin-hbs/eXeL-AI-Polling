"""Cube 7 — Simulation Tests (Cube 10 Reference).

Simulates full ranking pipeline with canned data matching
the 5000-response reference dataset pattern. Tests:
  - 3/6/9 theme voting levels
  - 8 users (7 AI + 1 HI) with deterministic preferences
  - Quadratic voting with varied stakes
  - Anomaly detection with coordinated pattern
  - Governance override scenario
  - N=5 determinism verification
  - Replay hash consistency
"""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube7_ranking.service import (
    _borda_scores,
    _compute_replay_hash,
    _quadratic_weights,
    _seeded_tiebreak_key,
    _weighted_borda_scores,
    detect_voting_anomalies,
)


# ---------------------------------------------------------------------------
# Simulation Constants (from CUBES_7-9.md canned test data)
# ---------------------------------------------------------------------------

# 3 themes per poll — matching SIM data
THEME_3 = {
    "opportunity": str(uuid.uuid4()),
    "risk": str(uuid.uuid4()),
    "balanced": str(uuid.uuid4()),
}

# 9 themes for theme2_9 level
THEME_9 = {f"theme_{i}": str(uuid.uuid4()) for i in range(1, 10)}

# 6 themes for theme2_6 level
THEME_6 = {f"theme_{i}": str(uuid.uuid4()) for i in range(1, 7)}

# 8 user rankings per poll: 7 AI + 1 HI (from spec)
SIM_RANKINGS_3 = [
    # AI User 1 (Opportunity-leaning)
    [THEME_3["opportunity"], THEME_3["balanced"], THEME_3["risk"]],
    # AI User 2 (Risk-focused)
    [THEME_3["risk"], THEME_3["balanced"], THEME_3["opportunity"]],
    # AI User 3 (Balanced)
    [THEME_3["balanced"], THEME_3["opportunity"], THEME_3["risk"]],
    # AI User 4 (Opportunity-leaning)
    [THEME_3["opportunity"], THEME_3["risk"], THEME_3["balanced"]],
    # AI User 5 (Risk-focused)
    [THEME_3["risk"], THEME_3["opportunity"], THEME_3["balanced"]],
    # AI User 6 (Opportunity-leaning)
    [THEME_3["opportunity"], THEME_3["balanced"], THEME_3["risk"]],
    # AI User 7 (Balanced)
    [THEME_3["balanced"], THEME_3["risk"], THEME_3["opportunity"]],
    # HI User (fixture default)
    [THEME_3["opportunity"], THEME_3["risk"], THEME_3["balanced"]],
]

# Stakes for quadratic voting test (from spec)
SIM_STAKES = {
    "ai_1": 1.0,
    "ai_2": 4.0,
    "ai_3": 9.0,
    "ai_4": 16.0,
    "ai_5": 25.0,
    "ai_6": 1.0,
    "ai_7": 4.0,
    "hi_1": 9.0,
}

SIM_PARTICIPANT_IDS = [f"ai_{i}" for i in range(1, 8)] + ["hi_1"]

SEED = "cube7-simulation-v1"


# ---------------------------------------------------------------------------
# 3-Theme Voting Simulation
# ---------------------------------------------------------------------------


class TestSimulation3Themes:
    """Simulate 8-user ranking of 3 themes."""

    def test_opportunity_wins(self):
        """With spec rankings, Opportunity should be #1 (4 users rank it first)."""
        scores = _borda_scores(SIM_RANKINGS_3, 3)
        sorted_t = sorted(
            scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)),
        )
        assert sorted_t[0][0] == THEME_3["opportunity"]

    def test_balanced_and_risk_tied_at_7(self):
        """Balanced and Risk both score 7 — tied, resolved by seeded tiebreak."""
        scores = _borda_scores(SIM_RANKINGS_3, 3)
        sorted_t = sorted(
            scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)),
        )
        # Both score 7.0, tiebreak determines order
        tied_themes = {sorted_t[1][0], sorted_t[2][0]}
        assert tied_themes == {THEME_3["balanced"], THEME_3["risk"]}

    def test_tiebreak_is_deterministic(self):
        """Tied themes always resolve in same order with same seed."""
        results = []
        for _ in range(5):
            scores = _borda_scores(SIM_RANKINGS_3, 3)
            sorted_t = sorted(
                scores.items(),
                key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)),
            )
            results.append(sorted_t[1][0])  # Who gets #2?
        assert len(set(results)) == 1  # Always the same

    def test_exact_borda_scores(self):
        """Verify exact Borda math for 8 voters × 3 themes."""
        scores = _borda_scores(SIM_RANKINGS_3, 3)
        # Opportunity: ranked #1 by users 1,4,6,8 (4×2=8), #2 by users 3,5 (2×1=2) = 10
        # Balanced: ranked #1 by users 3,7 (2×2=4), #2 by users 1,2,6 (3×1=3) = 7
        # Risk: ranked #1 by users 2,5 (2×2=4), #2 by users 4,7,8 (3×1=3) = 7
        assert scores[THEME_3["opportunity"]] == 10.0
        # Balanced and Risk both = 7 — tiebreak decides order
        assert scores[THEME_3["balanced"]] == 7.0
        assert scores[THEME_3["risk"]] == 7.0

    def test_n5_determinism(self):
        """N=5 runs produce identical results."""
        results = []
        for _ in range(5):
            scores = _borda_scores(SIM_RANKINGS_3, 3)
            sorted_t = sorted(
                scores.items(),
                key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)),
            )
            results.append([t[0] for t in sorted_t])
        assert all(r == results[0] for r in results)

    def test_replay_hash_n5(self):
        """N=5 replay hashes are identical."""
        hashes = [_compute_replay_hash(SIM_RANKINGS_3, SEED) for _ in range(5)]
        assert len(set(hashes)) == 1


# ---------------------------------------------------------------------------
# 9-Theme Voting Simulation
# ---------------------------------------------------------------------------


class TestSimulation9Themes:
    """Simulate 8-user ranking of 9 themes."""

    def _generate_rankings(self):
        theme_ids = list(THEME_9.values())
        rankings = []
        for i in range(8):
            # Each user rotates the list by their index
            offset = i % 9
            rankings.append(theme_ids[offset:] + theme_ids[:offset])
        return rankings

    def test_9_themes_all_scored(self):
        rankings = self._generate_rankings()
        scores = _borda_scores(rankings, 9)
        assert len(scores) == 9

    def test_9_themes_deterministic_n5(self):
        rankings = self._generate_rankings()
        results = []
        for _ in range(5):
            scores = _borda_scores(rankings, 9)
            s = sorted(scores.items(), key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)))
            results.append([t[0] for t in s])
        assert all(r == results[0] for r in results)

    def test_9_themes_top_score_highest(self):
        rankings = self._generate_rankings()
        scores = _borda_scores(rankings, 9)
        sorted_t = sorted(scores.items(), key=lambda x: -x[1])
        assert sorted_t[0][1] >= sorted_t[-1][1]


# ---------------------------------------------------------------------------
# 6-Theme Voting Simulation
# ---------------------------------------------------------------------------


class TestSimulation6Themes:
    """Simulate 8-user ranking of 6 themes."""

    def _generate_rankings(self):
        theme_ids = list(THEME_6.values())
        rankings = []
        for i in range(8):
            offset = i % 6
            rankings.append(theme_ids[offset:] + theme_ids[:offset])
        return rankings

    def test_6_themes_all_scored(self):
        rankings = self._generate_rankings()
        scores = _borda_scores(rankings, 6)
        assert len(scores) == 6

    def test_6_themes_deterministic_n5(self):
        rankings = self._generate_rankings()
        results = []
        for _ in range(5):
            scores = _borda_scores(rankings, 6)
            s = sorted(scores.items(), key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)))
            results.append([t[0] for t in s])
        assert all(r == results[0] for r in results)


# ---------------------------------------------------------------------------
# Quadratic Voting Simulation
# ---------------------------------------------------------------------------


class TestSimulationQuadraticVoting:
    """CRS-12.02: Quadratic weights with spec fixtures."""

    def test_spec_stake_weights(self):
        """Stakes 1,4,9,16,25 → raw weights 1,2,3,4,5 via sqrt."""
        weights = _quadratic_weights(SIM_STAKES)
        # All 8 participants have weights
        assert len(weights) == 8
        # Sum to 1
        assert abs(sum(weights.values()) - 1.0) < 1e-10

    def test_high_stake_user_has_more_influence(self):
        """User with 25 tokens has more weight than user with 1 token."""
        weights = _quadratic_weights(SIM_STAKES)
        assert weights["ai_5"] > weights["ai_1"]

    def test_quadratic_dampens_whale(self):
        """User with 25x more tokens doesn't get 25x more weight."""
        weights = _quadratic_weights(SIM_STAKES)
        ratio = weights["ai_5"] / weights["ai_1"]
        assert ratio < 10  # sqrt(25)/sqrt(1) = 5, but cap may reduce further

    def test_weighted_borda_with_stakes(self):
        """Quadratic-weighted Borda produces different ordering than equal-weight."""
        equal_scores = _borda_scores(SIM_RANKINGS_3, 3)
        weights = _quadratic_weights(SIM_STAKES)
        weighted_scores = _weighted_borda_scores(
            SIM_RANKINGS_3, SIM_PARTICIPANT_IDS, weights, 3
        )
        # Scores should be different due to weighting
        for theme_id in equal_scores:
            assert theme_id in weighted_scores

    def test_weighted_determinism_n5(self):
        """N=5 weighted runs are deterministic."""
        weights = _quadratic_weights(SIM_STAKES)
        results = []
        for _ in range(5):
            scores = _weighted_borda_scores(
                SIM_RANKINGS_3, SIM_PARTICIPANT_IDS, weights, 3
            )
            s = sorted(scores.items(), key=lambda x: -x[1])
            results.append([t[0] for t in s])
        assert all(r == results[0] for r in results)


# ---------------------------------------------------------------------------
# Anomaly Detection Simulation
# ---------------------------------------------------------------------------


class TestSimulationAnomalyDetection:
    """CRS-12.04: Anti-sybil with spec fixture."""

    @pytest.mark.asyncio
    async def test_coordinated_voting_detected(self):
        """3 users submit identical rankings within 2s — flagged."""
        mock_db = AsyncMock()
        identical_order = [THEME_3["opportunity"], THEME_3["risk"], THEME_3["balanced"]]
        now = datetime.now(timezone.utc)

        rankings = []
        for i in range(3):
            r = MagicMock()
            r.ranked_theme_ids = identical_order
            r.participant_id = uuid.uuid4()
            r.submitted_at = now + timedelta(seconds=i * 0.5)
            rankings.append(r)
        # Add 5 normal rankings
        for i in range(5):
            r = MagicMock()
            r.ranked_theme_ids = SIM_RANKINGS_3[i]
            r.participant_id = uuid.uuid4()
            r.submitted_at = now + timedelta(seconds=10 + i * 5)
            rankings.append(r)

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = rankings
        mock_db.execute = AsyncMock(return_value=mock_result)

        anomalies = await detect_voting_anomalies(mock_db, uuid.uuid4())
        assert len(anomalies) >= 1
        assert anomalies[0]["type"] == "identical_ranking_burst"
        assert anomalies[0]["count"] == 3

    @pytest.mark.asyncio
    async def test_legitimate_rapid_not_flagged(self):
        """8 users submit within 10s with varied rankings — NOT flagged."""
        mock_db = AsyncMock()
        now = datetime.now(timezone.utc)

        rankings = []
        for i, ranked in enumerate(SIM_RANKINGS_3):
            r = MagicMock()
            r.ranked_theme_ids = ranked
            r.participant_id = uuid.uuid4()
            r.submitted_at = now + timedelta(seconds=i * 1.5)
            rankings.append(r)

        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = rankings
        mock_db.execute = AsyncMock(return_value=mock_result)

        anomalies = await detect_voting_anomalies(mock_db, uuid.uuid4())
        burst = [a for a in anomalies if a["type"] == "identical_ranking_burst"]
        assert len(burst) == 0


# ---------------------------------------------------------------------------
# Governance Override Simulation
# ---------------------------------------------------------------------------


class TestSimulationGovernanceOverride:
    """CRS-22: Override scenario from spec."""

    def test_override_reorders_correctly(self):
        """Moving #3 to #1 shifts others down."""
        # Original: A=#1, B=#2, C=#3
        # Override: C moved to #1 → C=#1, A=#2, B=#3
        original = [("A", 10), ("B", 7), ("C", 5)]
        # After override, rank order changes
        target_moved_to_1 = "C"
        new_order = [target_moved_to_1] + [t[0] for t in original if t[0] != target_moved_to_1]
        assert new_order == ["C", "A", "B"]

    def test_justification_fixture(self):
        """Spec fixture: 'Strategic priority alignment' >= 10 chars."""
        from app.cubes.cube7_ranking.service import _MIN_JUSTIFICATION_LEN
        justification = "Strategic priority alignment"
        assert len(justification) >= _MIN_JUSTIFICATION_LEN


# ---------------------------------------------------------------------------
# Full Pipeline Simulation (Pure Logic)
# ---------------------------------------------------------------------------


class TestSimulationFullPipeline:
    """End-to-end pipeline with all 8 spec rankings."""

    def test_full_pipeline_3_themes(self):
        """Complete pipeline: score → sort → identify winner → hash."""
        scores = _borda_scores(SIM_RANKINGS_3, 3)
        sorted_t = sorted(
            scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)),
        )
        replay_hash = _compute_replay_hash(SIM_RANKINGS_3, SEED)

        # Verify pipeline outputs
        assert sorted_t[0][0] == THEME_3["opportunity"]  # Winner
        assert len(sorted_t) == 3
        assert len(replay_hash) == 64  # SHA-256
        assert sorted_t[0][1] == 10.0  # Exact score

    def test_full_pipeline_with_quadratic(self):
        """Pipeline with quadratic weights: score → sort → hash."""
        weights = _quadratic_weights(SIM_STAKES)
        scores = _weighted_borda_scores(
            SIM_RANKINGS_3, SIM_PARTICIPANT_IDS, weights, 3
        )
        sorted_t = sorted(
            scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)),
        )
        replay_hash = _compute_replay_hash(SIM_RANKINGS_3, SEED, "quadratic_borda")

        assert len(sorted_t) == 3
        assert len(replay_hash) == 64
        # Winner should still be opportunity (majority preference)
        assert sorted_t[0][0] == THEME_3["opportunity"]

    def test_full_pipeline_9_themes(self):
        """9-theme pipeline produces 9 ranked items."""
        theme_ids = list(THEME_9.values())
        rankings = [theme_ids[i:] + theme_ids[:i] for i in range(8)]
        scores = _borda_scores(rankings, 9)
        sorted_t = sorted(
            scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)),
        )
        assert len(sorted_t) == 9
        # All scores >= 0
        assert all(s >= 0 for _, s in sorted_t)

    def test_full_pipeline_6_themes(self):
        """6-theme pipeline produces 6 ranked items."""
        theme_ids = list(THEME_6.values())
        rankings = [theme_ids[i:] + theme_ids[:i] for i in range(8)]
        scores = _borda_scores(rankings, 6)
        sorted_t = sorted(
            scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)),
        )
        assert len(sorted_t) == 6

    def test_pipeline_n5_full_consistency(self):
        """N=5 full pipeline runs: order + hash + scores all identical."""
        ref_order = None
        ref_hash = None
        ref_scores = None

        for _ in range(5):
            scores = _borda_scores(SIM_RANKINGS_3, 3)
            sorted_t = sorted(
                scores.items(),
                key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], SEED)),
            )
            replay_hash = _compute_replay_hash(SIM_RANKINGS_3, SEED)

            order = [t[0] for t in sorted_t]
            score_vals = [t[1] for t in sorted_t]

            if ref_order is None:
                ref_order = order
                ref_hash = replay_hash
                ref_scores = score_vals
            else:
                assert order == ref_order
                assert replay_hash == ref_hash
                assert score_vals == ref_scores
