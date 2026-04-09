"""Cube 6 — Centroid Summarizer Tests: Cost model + truncation + representatives.

Tests the 1000x cost reduction engine:
  - Cost estimates at 1K, 10K, 100K, 1M scale
  - Client-side truncation (free, instant)
  - Centroid representative selection
  - Scale mode decision threshold
"""

import numpy as np
import pytest

from app.cubes.cube6_ai.centroid_summarizer import (
    CostEstimate,
    generate_summary_tiers,
    select_centroid_representatives,
    should_use_centroid_mode,
    truncate_to_words,
)


class TestCostModel:
    """Verify cost savings at various scales."""

    def test_1k_responses(self):
        est = CostEstimate(1000)
        assert est.old_cost > est.new_cost
        print(f"\n  1K: old=${est.old_cost:.4f}, new=${est.new_cost:.6f}, savings={est.savings_percent:.1f}%")

    def test_10k_responses(self):
        est = CostEstimate(10_000)
        assert est.savings_ratio > 10
        print(f"\n  10K: old=${est.old_cost:.4f}, new=${est.new_cost:.6f}, savings={est.savings_ratio:.0f}x")

    def test_100k_responses(self):
        est = CostEstimate(100_000)
        assert est.savings_ratio > 50

    def test_1m_responses(self):
        est = CostEstimate(1_000_000)
        assert est.savings_ratio > 50  # 55x+ savings at 1M
        assert est.new_cost < 1.10  # ~$1 for 1M responses (was $55+ old way)
        print(f"\n  1M: old=${est.old_cost:.2f}, new=${est.new_cost:.4f}, savings={est.savings_ratio:.0f}x")

    def test_to_dict(self):
        d = CostEstimate(5000).to_dict()
        assert "old_approach" in d
        assert "new_approach" in d
        assert "savings" in d
        assert d["new_approach"]["centroid_summaries"] == 27


class TestTruncation:
    """Client-side truncation — zero cost, instant."""

    def test_short_text_unchanged(self):
        result = truncate_to_words("Hello world", 33)
        assert result == "Hello world"

    def test_exact_limit(self):
        text = " ".join(["word"] * 33)
        result = truncate_to_words(text, 33)
        assert result == text  # Exactly 33, no truncation

    def test_over_limit_truncated(self):
        text = " ".join(["word"] * 50)
        result = truncate_to_words(text, 33)
        assert result.endswith("...")
        # 33 words including the "..." concatenated to last word
        assert len(result.split()) <= 34

    def test_empty_text(self):
        assert truncate_to_words("", 33) == ""

    def test_summary_tiers(self):
        text = " ".join(["governance"] * 500)
        tiers = generate_summary_tiers(text)
        assert len(tiers["summary_333"].split()) <= 334
        assert len(tiers["summary_111"].split()) <= 112
        assert len(tiers["summary_33"].split()) <= 34


class TestCentroidRepresentatives:
    """Select nearest responses to each cluster centroid."""

    def test_3_clusters_5_reps_each(self):
        np.random.seed(42)
        n = 100
        dim = 8

        # 3 clusters of 100 points each
        embeddings = np.vstack([
            np.random.randn(n, dim) + [3, 0, 0, 0, 0, 0, 0, 0],
            np.random.randn(n, dim) + [0, 3, 0, 0, 0, 0, 0, 0],
            np.random.randn(n, dim) + [0, 0, 3, 0, 0, 0, 0, 0],
        ]).tolist()

        labels = [0] * n + [1] * n + [2] * n
        centroids = [
            [3, 0, 0, 0, 0, 0, 0, 0],
            [0, 3, 0, 0, 0, 0, 0, 0],
            [0, 0, 3, 0, 0, 0, 0, 0],
        ]

        reps = select_centroid_representatives(embeddings, labels, centroids, n_representatives=5)

        assert len(reps) == 3
        for cluster_id in range(3):
            assert len(reps[cluster_id]) == 5
            # Representatives should be in the correct cluster range
            for idx in reps[cluster_id]:
                assert labels[idx] == cluster_id

    def test_empty_cluster(self):
        reps = select_centroid_representatives(
            [[1, 0], [0, 1]],
            [0, 0],  # All in cluster 0, none in cluster 1
            [[1, 0], [0, 1]],
            n_representatives=3,
        )
        assert len(reps[0]) == 2  # Only 2 points available
        assert len(reps[1]) == 0  # Empty cluster

    def test_fewer_than_n_reps(self):
        """Cluster with 3 points, requesting 5 reps → get 3."""
        reps = select_centroid_representatives(
            [[1, 0], [0.9, 0.1], [0.8, 0.2]],
            [0, 0, 0],
            [[1, 0]],
            n_representatives=5,
        )
        assert len(reps[0]) == 3


class TestScaleModeDecision:
    """Should we use centroid mode or per-response LLM?"""

    def test_below_threshold(self):
        assert not should_use_centroid_mode(500)
        assert not should_use_centroid_mode(1000)

    def test_above_threshold(self):
        assert should_use_centroid_mode(1001)
        assert should_use_centroid_mode(10000)
        assert should_use_centroid_mode(1000000)
