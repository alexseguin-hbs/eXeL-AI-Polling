"""Theme Compression Engine — Universal API Tests.

#1 Universal API: The Reader for Humanity.
Any text corpus → hierarchical themes at 3 granularity levels.
"""

import pytest

from app.core.theme_compression import (
    CompressionConfig,
    CompressionCostEstimate,
    CompressionResult,
    compute_compression_hash,
    estimate_compression_cost,
    marble_sample,
    partition_texts,
    validate_compression_request,
)


class TestCompressionConfig:
    def test_default_3_partitions(self):
        cfg = CompressionConfig()
        assert len(cfg.partition_labels) == 3
        assert "Risk & Concerns" in cfg.partition_labels

    def test_default_reduction_levels(self):
        cfg = CompressionConfig()
        assert cfg.reduction_levels == [9, 6, 3]

    def test_custom_partitions(self):
        cfg = CompressionConfig(partition_labels=["Positive", "Negative"])
        assert len(cfg.partition_labels) == 2


class TestPartitionTexts:
    def test_basic_partition(self):
        texts = ["risk text", "good text", "neutral text"]
        labels = ["Risk", "Support", "Neutral"]
        classifications = ["Risk", "Support", "Neutral"]
        bins = partition_texts(texts, labels, classifications)
        assert len(bins["Risk"]) == 1
        assert len(bins["Support"]) == 1

    def test_unknown_classification_goes_to_last(self):
        texts = ["mystery text"]
        labels = ["A", "B", "C"]
        classifications = ["UNKNOWN"]
        bins = partition_texts(texts, labels, classifications)
        assert len(bins["C"]) == 1  # Falls to last partition


class TestMarbleSample:
    def test_groups_of_10(self):
        texts = [f"text_{i}" for i in range(55)]
        groups = marble_sample(texts, group_size=10, seed=42)
        assert len(groups) == 6  # 55/10 = 5.5 → 6 groups
        assert len(groups[0]) == 10
        assert len(groups[-1]) == 5  # Last group partial

    def test_deterministic(self):
        texts = [f"text_{i}" for i in range(100)]
        g1 = marble_sample(texts, seed=42)
        g2 = marble_sample(texts, seed=42)
        assert g1 == g2

    def test_different_seed_different_result(self):
        texts = [f"text_{i}" for i in range(100)]
        g1 = marble_sample(texts, seed=42)
        g2 = marble_sample(texts, seed=99)
        assert g1 != g2

    def test_empty_input(self):
        assert marble_sample([]) == []

    def test_small_input(self):
        groups = marble_sample(["a", "b", "c"], group_size=10)
        assert len(groups) == 1
        assert len(groups[0]) == 3

    def test_no_duplicates(self):
        texts = [f"text_{i}" for i in range(100)]
        groups = marble_sample(texts, seed=42)
        all_texts = [t for g in groups for t in g]
        assert len(all_texts) == len(set(all_texts))  # No duplicates


class TestCompressionHash:
    def test_deterministic(self):
        texts = ["hello", "world", "test"]
        cfg = CompressionConfig()
        h1 = compute_compression_hash(texts, cfg)
        h2 = compute_compression_hash(texts, cfg)
        assert h1 == h2

    def test_different_input_different_hash(self):
        cfg = CompressionConfig()
        h1 = compute_compression_hash(["a", "b"], cfg)
        h2 = compute_compression_hash(["c", "d"], cfg)
        assert h1 != h2

    def test_hash_is_sha256(self):
        h = compute_compression_hash(["test"], CompressionConfig())
        assert len(h) == 64


class TestCostEstimate:
    def test_1k_texts(self):
        est = CompressionCostEstimate(1000)
        assert est.estimated_cost_usd > 0
        assert est.total_groups > 0

    def test_1m_texts(self):
        est = CompressionCostEstimate(1_000_000)
        assert est.sample_size == 10_000  # Capped at sample_size
        assert est.estimated_cost_usd < 5.0  # Must be cheap

    def test_cost_scales_sublinearly(self):
        """Cost at 1M should NOT be 1000x cost at 1K."""
        c1k = CompressionCostEstimate(1_000).estimated_cost_usd
        c1m = CompressionCostEstimate(1_000_000).estimated_cost_usd
        # Due to sampling, 1M is only ~10x cost of 1K (not 1000x)
        assert c1m < c1k * 20

    def test_to_dict(self):
        d = CompressionCostEstimate(5000).to_dict()
        assert "total_llm_calls" in d
        assert "estimated_cost_usd" in d


class TestValidation:
    def test_valid_request(self):
        result = validate_compression_request(["text1 about policy", "text2 about innovation", "text3 about risk"])
        assert result["valid"] is True
        assert result["input_count"] == 3

    def test_empty_texts(self):
        result = validate_compression_request([])
        assert result["valid"] is False

    def test_too_few_texts(self):
        result = validate_compression_request(["one", "two"])
        assert result["valid"] is False

    def test_short_texts(self):
        result = validate_compression_request(["hi", "ok", "no"])
        assert result["valid"] is False


class TestCompressionResult:
    def test_to_dict(self):
        result = CompressionResult(
            input_count=5000,
            sample_size=5000,
            partition_distribution={"Risk": 1777, "Support": 734, "Neutral": 2489},
            marble_groups=500,
            candidate_themes=1500,
            themes_9=[{"label": f"T{i}"} for i in range(9)],
            themes_6=[{"label": f"T{i}"} for i in range(6)],
            themes_3=[{"label": f"T{i}"} for i in range(3)],
        )
        d = result.to_dict()
        assert d["input_count"] == 5000
        assert len(d["themes"]["9"]) == 9
        assert len(d["themes"]["6"]) == 6
        assert len(d["themes"]["3"]) == 3


class TestPublicAPI:
    def test_estimate_function(self):
        d = estimate_compression_cost(50000)
        assert "estimated_cost_usd" in d
        assert d["input_count"] == 50000


class TestGovernanceUseCases:
    """Verify the engine works for the 3 target use cases."""

    def test_government_1m_citizen_comments(self):
        """1M citizen comments → affordable compression."""
        est = CompressionCostEstimate(1_000_000)
        assert est.estimated_cost_usd < 5.0
        assert est.sample_size == 10_000

    def test_innovation_50k_ideas(self):
        """50K innovation ideas → hierarchical clusters."""
        est = CompressionCostEstimate(50_000)
        assert est.total_groups > 100

    def test_self_healing_app_feedback(self):
        """App feedback → theme compression for prioritization."""
        texts = [
            "The ranking UI crashes on mobile when more than 10 themes shown",
            "I love the real-time voting feature, it keeps everyone engaged",
            "The color scheme options are nice but the custom picker is hard to use",
            "Voice input doesn't work well in noisy environments",
            "Please add dark mode support for late night sessions",
        ]
        result = validate_compression_request(texts)
        assert result["valid"] is True
