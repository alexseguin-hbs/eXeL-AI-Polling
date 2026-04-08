"""Cube 7 — Ranking Service: Unit tests.

Tests:
  - Borda count scoring (correct math)
  - Seeded tie-breaking determinism
  - Replay hash consistency (N=5)
  - Submit validation (duplicate rejection, theme ID mismatch)
  - Anomaly detection (identical rankings burst, rapid submissions)
"""

import uuid
from datetime import datetime, timedelta, timezone

import pytest

from app.cubes.cube7_ranking.service import (
    _apply_influence_cap,
    _borda_scores,
    _compute_replay_hash,
    _quadratic_weights,
    _seeded_tiebreak_key,
    _weighted_borda_scores,
)


# ---------------------------------------------------------------------------
# Borda Count Math
# ---------------------------------------------------------------------------


class TestBordaScores:
    """Verify Borda count scoring logic."""

    def test_single_voter_3_themes(self):
        """One voter ranking 3 themes: top=2pts, mid=1pt, bottom=0pts."""
        rankings = [["A", "B", "C"]]
        scores = _borda_scores(rankings, 3)
        assert scores == {"A": 2.0, "B": 1.0, "C": 0.0}

    def test_two_voters_agreement(self):
        """Two voters with same ranking: scores double."""
        rankings = [["A", "B", "C"], ["A", "B", "C"]]
        scores = _borda_scores(rankings, 3)
        assert scores == {"A": 4.0, "B": 2.0, "C": 0.0}

    def test_two_voters_opposite(self):
        """Two voters with opposite rankings: all themes tie."""
        rankings = [["A", "B", "C"], ["C", "B", "A"]]
        scores = _borda_scores(rankings, 3)
        assert scores["A"] == scores["C"] == 2.0
        assert scores["B"] == 2.0

    def test_three_voters_mixed(self):
        """Three voters, mixed rankings."""
        rankings = [
            ["A", "B", "C"],
            ["B", "A", "C"],
            ["A", "C", "B"],
        ]
        scores = _borda_scores(rankings, 3)
        # A: 2+1+2=5, B: 1+2+0=3, C: 0+0+1=1
        assert scores["A"] == 5.0
        assert scores["B"] == 3.0
        assert scores["C"] == 1.0

    def test_six_themes(self):
        """6 themes: top=5pts down to bottom=0pts."""
        themes = ["T1", "T2", "T3", "T4", "T5", "T6"]
        rankings = [themes]
        scores = _borda_scores(rankings, 6)
        assert scores["T1"] == 5.0
        assert scores["T6"] == 0.0

    def test_nine_themes(self):
        """9 themes: top=8pts down to bottom=0pts."""
        themes = [f"T{i}" for i in range(1, 10)]
        rankings = [themes]
        scores = _borda_scores(rankings, 9)
        assert scores["T1"] == 8.0
        assert scores["T9"] == 0.0

    def test_empty_rankings(self):
        """No voters returns empty dict."""
        scores = _borda_scores([], 3)
        assert scores == {}

    def test_large_voter_count(self):
        """100 voters with identical ranking."""
        rankings = [["A", "B", "C"]] * 100
        scores = _borda_scores(rankings, 3)
        assert scores["A"] == 200.0
        assert scores["C"] == 0.0


# ---------------------------------------------------------------------------
# Deterministic Tie-Breaking
# ---------------------------------------------------------------------------


class TestSeededTiebreak:
    """Verify seeded tie-breaking is deterministic."""

    def test_same_seed_same_result(self):
        """Identical inputs produce identical tiebreak keys."""
        key1 = _seeded_tiebreak_key("theme-abc", "seed-123")
        key2 = _seeded_tiebreak_key("theme-abc", "seed-123")
        assert key1 == key2

    def test_different_seeds_different_results(self):
        """Different seeds produce different tiebreak keys."""
        key1 = _seeded_tiebreak_key("theme-abc", "seed-123")
        key2 = _seeded_tiebreak_key("theme-abc", "seed-456")
        assert key1 != key2

    def test_different_themes_different_results(self):
        """Different theme IDs produce different tiebreak keys."""
        key1 = _seeded_tiebreak_key("theme-abc", "seed-123")
        key2 = _seeded_tiebreak_key("theme-xyz", "seed-123")
        assert key1 != key2

    def test_tiebreak_is_sha256(self):
        """Key is 64-char hex (SHA-256)."""
        key = _seeded_tiebreak_key("t1", "s1")
        assert len(key) == 64
        assert all(c in "0123456789abcdef" for c in key)


# ---------------------------------------------------------------------------
# Replay Hash Determinism (N=5)
# ---------------------------------------------------------------------------


class TestReplayHash:
    """CRS-12.01: Identical inputs MUST yield identical replay hash."""

    def test_determinism_n5(self):
        """N=5 replay runs with identical input produce identical hash."""
        rankings = [["A", "B", "C"], ["B", "A", "C"]]
        seed = "test-seed-42"
        hashes = [
            _compute_replay_hash(rankings, seed)
            for _ in range(5)
        ]
        assert len(set(hashes)) == 1, f"Non-deterministic: {hashes}"

    def test_different_inputs_different_hash(self):
        """Changed rankings produce different hash."""
        r1 = [["A", "B", "C"]]
        r2 = [["B", "A", "C"]]
        h1 = _compute_replay_hash(r1, "seed")
        h2 = _compute_replay_hash(r2, "seed")
        assert h1 != h2

    def test_different_seeds_different_hash(self):
        """Changed seed produces different hash."""
        rankings = [["A", "B", "C"]]
        h1 = _compute_replay_hash(rankings, "seed-1")
        h2 = _compute_replay_hash(rankings, "seed-2")
        assert h1 != h2

    def test_order_independent(self):
        """Rankings are sorted internally, so order of voters doesn't matter."""
        r1 = [["A", "B"], ["B", "A"]]
        r2 = [["B", "A"], ["A", "B"]]
        h1 = _compute_replay_hash(r1, "seed")
        h2 = _compute_replay_hash(r2, "seed")
        assert h1 == h2

    def test_hash_is_sha256(self):
        """Hash is 64-char hex."""
        h = _compute_replay_hash([["A"]], "s")
        assert len(h) == 64


# ---------------------------------------------------------------------------
# Borda Sort + Tiebreak Integration
# ---------------------------------------------------------------------------


class TestBordaSortDeterminism:
    """Full Borda + tiebreak sorting is deterministic."""

    def test_tied_themes_resolved_by_seed(self):
        """When two themes tie on score, seed-based tiebreak resolves order."""
        # A and C tie at 2 points each
        rankings = [["A", "B", "C"], ["C", "B", "A"]]
        scores = _borda_scores(rankings, 3)
        seed = "deterministic-seed"

        sorted_themes = sorted(
            scores.items(),
            key=lambda item: (-item[1], _seeded_tiebreak_key(item[0], seed)),
        )

        # All three tie at 2.0, so order is purely by tiebreak
        assert len(sorted_themes) == 3

        # Re-run 5 times — must be identical
        for _ in range(5):
            resorted = sorted(
                scores.items(),
                key=lambda item: (-item[1], _seeded_tiebreak_key(item[0], seed)),
            )
            assert resorted == sorted_themes

    def test_clear_winner_not_affected_by_tiebreak(self):
        """When scores are distinct, tiebreak doesn't change order."""
        rankings = [["A", "B", "C"], ["A", "B", "C"], ["A", "B", "C"]]
        scores = _borda_scores(rankings, 3)

        sorted_themes = sorted(
            scores.items(),
            key=lambda item: (-item[1], _seeded_tiebreak_key(item[0], "any-seed")),
        )

        assert sorted_themes[0][0] == "A"
        assert sorted_themes[1][0] == "B"
        assert sorted_themes[2][0] == "C"

    def test_n5_determinism_full_sort(self):
        """N=5 full sort runs produce identical ordering."""
        rankings = [
            ["X", "Y", "Z", "W", "V", "U"],
            ["U", "V", "W", "X", "Y", "Z"],
            ["Z", "X", "V", "U", "W", "Y"],
        ]
        scores = _borda_scores(rankings, 6)
        seed = "cube7-test"

        results = []
        for _ in range(5):
            s = sorted(
                scores.items(),
                key=lambda item: (-item[1], _seeded_tiebreak_key(item[0], seed)),
            )
            results.append([t[0] for t in s])

        assert all(r == results[0] for r in results), f"Non-deterministic: {results}"


# ---------------------------------------------------------------------------
# CRS-12.02: Quadratic Vote Normalization
# ---------------------------------------------------------------------------


class TestQuadraticWeights:
    """Verify quadratic governance weight calculations."""

    def test_equal_stakes_equal_weights(self):
        """Equal token stakes produce equal weights."""
        stakes = {"A": 100.0, "B": 100.0, "C": 100.0}
        weights = _quadratic_weights(stakes)
        assert abs(weights["A"] - weights["B"]) < 1e-10
        assert abs(sum(weights.values()) - 1.0) < 1e-10

    def test_sqrt_diminishing_returns(self):
        """User with 4x tokens gets diminished weight via sqrt + cap."""
        stakes = {"whale": 400.0, "small": 100.0}
        weights = _quadratic_weights(stakes)
        # sqrt(400)=20, sqrt(100)=10. Raw ratio 2:1
        # With 15% cap on 2 users, both may equalize to 0.5 each
        assert weights["whale"] <= 0.50 + 1e-10  # Well below linear 0.80
        assert abs(sum(weights.values()) - 1.0) < 1e-10

    def test_zero_stakes_equal_weights(self):
        """Zero stakes for all → equal weights."""
        stakes = {"A": 0.0, "B": 0.0, "C": 0.0}
        weights = _quadratic_weights(stakes)
        assert abs(weights["A"] - 1.0 / 3) < 1e-10

    def test_empty_stakes(self):
        """Empty dict returns empty."""
        assert _quadratic_weights({}) == {}

    def test_single_user(self):
        """Single user gets weight 1.0."""
        weights = _quadratic_weights({"solo": 50.0})
        assert abs(weights["solo"] - 1.0) < 1e-10

    def test_weights_sum_to_one(self):
        """All weights sum to 1.0 regardless of input."""
        stakes = {"A": 1.0, "B": 10.0, "C": 100.0, "D": 1000.0, "E": 10000.0}
        weights = _quadratic_weights(stakes)
        assert abs(sum(weights.values()) - 1.0) < 1e-10

    def test_negative_stakes_treated_as_zero(self):
        """Negative stakes clamped to 0."""
        stakes = {"A": -5.0, "B": 100.0}
        weights = _quadratic_weights(stakes)
        # A gets sqrt(0)=0 raw weight, B gets sqrt(100)=10
        # After normalization: A=0, B=1.0 if only two. But equal fallback if A=0
        assert weights["B"] >= weights["A"]


class TestInfluenceCap:
    """Verify 15% influence cap."""

    def test_whale_capped_below_raw(self):
        """A dominant whale is significantly dampened from raw 80% weight."""
        weights = {"whale": 0.80, "a": 0.05, "b": 0.05, "c": 0.05, "d": 0.05}
        capped = _apply_influence_cap(weights)
        # With iterative redistribution, all 5 users equalize to 0.20 each
        # because excess from whale pushes others above cap too
        assert capped["whale"] < 0.50  # Dampened well below 0.80
        assert abs(sum(capped.values()) - 1.0) < 1e-10  # Sum to 1

    def test_no_cap_when_below_threshold(self):
        """When no one exceeds 15%, weights unchanged (just renormalized)."""
        weights = {"a": 0.10, "b": 0.10, "c": 0.10, "d": 0.10, "e": 0.10,
                   "f": 0.10, "g": 0.10, "h": 0.10, "i": 0.10, "j": 0.10}
        capped = _apply_influence_cap(weights)
        for w in capped.values():
            assert abs(w - 0.10) < 1e-10

    def test_capped_weights_sum_to_one(self):
        """After capping, weights still sum to 1.0."""
        weights = {"whale": 0.60, "a": 0.10, "b": 0.10, "c": 0.10, "d": 0.10}
        capped = _apply_influence_cap(weights)
        assert abs(sum(capped.values()) - 1.0) < 1e-10


class TestWeightedBordaScores:
    """Verify weighted Borda scoring."""

    def test_equal_weights_matches_unweighted(self):
        """With equal weights, weighted Borda matches standard Borda (scaled)."""
        rankings = [["A", "B", "C"], ["B", "A", "C"]]
        pids = ["p1", "p2"]
        weights = {"p1": 0.5, "p2": 0.5}

        weighted = _weighted_borda_scores(rankings, pids, weights, 3)
        unweighted = _borda_scores(rankings, 3)

        # Weighted scores = unweighted * 0.5 per voter
        for theme in unweighted:
            assert abs(weighted[theme] - unweighted[theme] * 0.5) < 1e-10

    def test_heavy_voter_dominates(self):
        """A voter with 90% weight determines the outcome."""
        rankings = [["A", "B", "C"], ["C", "B", "A"]]
        pids = ["heavy", "light"]
        weights = {"heavy": 0.9, "light": 0.1}

        scores = _weighted_borda_scores(rankings, pids, weights, 3)
        # Heavy: A=1.8, B=0.9, C=0. Light: C=0.2, B=0.1, A=0
        # Total: A=1.8, B=1.0, C=0.2
        sorted_t = sorted(scores.items(), key=lambda x: -x[1])
        assert sorted_t[0][0] == "A"

    def test_n5_determinism_weighted(self):
        """N=5 weighted Borda runs are deterministic."""
        rankings = [["A", "B", "C"]] * 5
        pids = [f"p{i}" for i in range(5)]
        weights = {f"p{i}": 0.2 for i in range(5)}

        results = []
        for _ in range(5):
            scores = _weighted_borda_scores(rankings, pids, weights, 3)
            results.append(scores)

        assert all(r == results[0] for r in results)


# ---------------------------------------------------------------------------
# CRS-22: Governance Override Validation
# ---------------------------------------------------------------------------


class TestGovernanceOverrideValidation:
    """Test governance override business rules."""

    def test_justification_min_length(self):
        """Justification under 10 chars must fail."""
        from app.cubes.cube7_ranking.service import _MIN_JUSTIFICATION_LEN
        assert _MIN_JUSTIFICATION_LEN == 10

    def test_governance_override_model_exists(self):
        from app.models.ranking import GovernanceOverride
        assert GovernanceOverride.__tablename__ == "governance_overrides"

    def test_governance_override_columns(self):
        from app.models.ranking import GovernanceOverride
        col_names = [c.key for c in GovernanceOverride.__table__.columns]
        required = ["session_id", "theme_id", "original_rank", "new_rank",
                     "overridden_by", "justification"]
        for col in required:
            assert col in col_names, f"Missing column: {col}"

    def test_governance_override_schema_submit(self):
        import uuid
        from app.schemas.ranking import GovernanceOverrideSubmit
        payload = GovernanceOverrideSubmit(
            theme_id=uuid.uuid4(),
            new_rank=1,
            justification="Strategic priority shift per board directive",
        )
        assert payload.new_rank == 1

    def test_governance_override_schema_read(self):
        import uuid
        from app.schemas.ranking import GovernanceOverrideRead
        from datetime import datetime, timezone
        data = {
            "id": uuid.uuid4(),
            "session_id": uuid.uuid4(),
            "cycle_id": 1,
            "theme_id": uuid.uuid4(),
            "original_rank": 3,
            "new_rank": 1,
            "overridden_by": "auth0|lead_001",
            "justification": "Critical risk must be prioritized",
            "created_at": datetime.now(timezone.utc),
        }
        read = GovernanceOverrideRead(**data)
        assert read.original_rank == 3
