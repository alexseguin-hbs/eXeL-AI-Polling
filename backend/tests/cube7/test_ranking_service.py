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
    _borda_scores,
    _compute_replay_hash,
    _seeded_tiebreak_key,
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
