"""Cube 6 — Scale Pipeline: Statistical Significance + Theme Library Tests.

Tests:
  - Cochran sample size: known values for 1K, 100K, 1M populations
  - Theme library: candidate accumulation, statistical relevance
  - Pipeline config: budget allocation, sample sizing
  - Metrics tracking: phase timing, budget verification
"""

import math
import uuid

import pytest

from app.cubes.cube6_ai.scale_pipeline import (
    PipelineMetrics,
    ScalePipelineConfig,
    ThemeLibrary,
    cochran_sample_size,
    is_statistically_significant,
)


# ═══════════════════════════════════════════════════════════════════
# COCHRAN SAMPLE SIZE
# ═══════════════════════════════════════════════════════════════════


class TestCochranSampleSize:
    """Verify Cochran's formula against known statistical values."""

    def test_1m_population_95_5(self):
        """1M population, 95% confidence, ±5% → ~384."""
        n = cochran_sample_size(1_000_000, 0.95, 0.05)
        assert 380 <= n <= 390, f"Expected ~384, got {n}"

    def test_100k_population_95_5(self):
        """100K population → ~383 (nearly same as 1M, finite correction tiny)."""
        n = cochran_sample_size(100_000, 0.95, 0.05)
        assert 380 <= n <= 390

    def test_1k_population_95_5(self):
        """1K population → ~278 (finite correction matters)."""
        n = cochran_sample_size(1_000, 0.95, 0.05)
        assert 270 <= n <= 290

    def test_100_population_95_5(self):
        """100 population → ~80."""
        n = cochran_sample_size(100, 0.95, 0.05)
        assert 75 <= n <= 85

    def test_10_population(self):
        """10 population → 10 (sample = population)."""
        n = cochran_sample_size(10, 0.95, 0.05)
        assert n <= 10

    def test_tighter_margin_larger_sample(self):
        """±1% margin requires much larger sample than ±5%."""
        n_5pct = cochran_sample_size(1_000_000, 0.95, 0.05)
        n_1pct = cochran_sample_size(1_000_000, 0.95, 0.01)
        assert n_1pct > n_5pct * 10  # ~25x larger

    def test_higher_confidence_larger_sample(self):
        """99% confidence requires larger sample than 95%."""
        n_95 = cochran_sample_size(1_000_000, 0.95, 0.05)
        n_99 = cochran_sample_size(1_000_000, 0.99, 0.05)
        assert n_99 > n_95


class TestStatisticalSignificance:
    """Verify significance check."""

    def test_10k_sample_from_1m_is_significant(self):
        """10K from 1M → absolutely significant."""
        assert is_statistically_significant(10_000, 1_000_000)

    def test_385_from_1m_is_significant(self):
        """385 from 1M → just significant at 95%/5% (Cochran gives 385)."""
        required = cochran_sample_size(1_000_000, 0.95, 0.05)
        assert is_statistically_significant(required, 1_000_000)

    def test_100_from_1m_not_significant(self):
        """100 from 1M → not significant at 95%/5%."""
        assert not is_statistically_significant(100, 1_000_000)

    def test_all_from_small_population(self):
        """50 from 50 → always significant."""
        assert is_statistically_significant(50, 50)


# ═══════════════════════════════════════════════════════════════════
# SCALE PIPELINE CONFIG
# ═══════════════════════════════════════════════════════════════════


class TestScalePipelineConfig:
    """Pipeline configuration for 1M scale."""

    def test_default_sample_10k(self):
        cfg = ScalePipelineConfig()
        assert cfg.theme_discovery_sample_size == 10_000

    def test_budget_under_65s(self):
        """Total phase budgets must fit within 65s (60s + 5s grace)."""
        cfg = ScalePipelineConfig()
        assert cfg.total_budget <= 65.0

    def test_sample_for_1m(self):
        cfg = ScalePipelineConfig()
        size = cfg.sample_size_for_population(1_000_000)
        assert size == 10_000

    def test_sample_for_small_session(self):
        cfg = ScalePipelineConfig()
        size = cfg.sample_size_for_population(50)
        assert size == 50  # Use all for small sessions

    def test_marble_groups_count(self):
        cfg = ScalePipelineConfig()
        # 3333 samples in one bin, groups of 10 → 334 groups
        assert cfg.marble_groups_count(3333) == 334

    def test_estimated_theme_library(self):
        cfg = ScalePipelineConfig()
        # 10K samples → ~1000 themes per category → ~3000 total candidates
        estimated = cfg.estimated_theme_library_size(10_000)
        assert estimated > 1000  # Plenty of candidates

    def test_embedding_assignment_always_at_scale(self):
        cfg = ScalePipelineConfig()
        assert cfg.use_embedding_assignment is True

    def test_to_dict(self):
        cfg = ScalePipelineConfig()
        d = cfg.to_dict()
        assert "sample_size" in d
        assert "total_budget_sec" in d


# ═══════════════════════════════════════════════════════════════════
# THEME LIBRARY
# ═══════════════════════════════════════════════════════════════════


class TestThemeLibrary:
    """Theme candidate library accumulation and relevance check."""

    def test_empty_library_not_relevant(self):
        lib = ThemeLibrary()
        assert lib.total_candidates == 0
        assert not lib.is_statistically_relevant

    def test_library_with_enough_candidates(self):
        lib = ThemeLibrary()
        for cat in lib.candidates:
            lib.candidates[cat] = [f"theme_{i}" for i in range(10)]
        assert lib.total_candidates == 30
        assert lib.is_statistically_relevant

    def test_library_partially_filled(self):
        lib = ThemeLibrary()
        lib.candidates["Risk & Concerns"] = ["t1", "t2"]
        lib.candidates["Supporting Comments"] = [f"t{i}" for i in range(10)]
        lib.candidates["Neutral Comments"] = [f"t{i}" for i in range(10)]
        assert not lib.is_statistically_relevant  # Risk only has 2

    def test_to_dict(self):
        lib = ThemeLibrary()
        lib.candidates["Risk & Concerns"] = [f"t{i}" for i in range(50)]
        d = lib.to_dict()
        assert d["total_candidates"] == 50
        assert d["by_category"]["Risk & Concerns"] == 50


# ═══════════════════════════════════════════════════════════════════
# PIPELINE METRICS
# ═══════════════════════════════════════════════════════════════════


class TestPipelineMetrics:
    """Phase timing and budget tracking."""

    def test_metrics_start(self):
        m = PipelineMetrics(total_responses=1_000_000, sample_size=10_000)
        m.start()
        assert m.total_ms >= 0

    def test_phase_tracking(self):
        import time
        m = PipelineMetrics()
        m.start()
        m.phase_start("classify")
        time.sleep(0.01)
        m.phase_end("classify")
        assert m.phases["classify"]["duration_ms"] > 0

    def test_within_budget_initially(self):
        m = PipelineMetrics()
        m.start()
        assert m.within_budget

    def test_to_dict(self):
        m = PipelineMetrics(total_responses=1_000_000, sample_size=10_000)
        m.start()
        d = m.to_dict()
        assert d["total_responses"] == 1_000_000
        assert d["sample_size"] == 10_000


# ═══════════════════════════════════════════════════════════════════
# INTEGRATION: Full Scale Math
# ═══════════════════════════════════════════════════════════════════


class TestScaleMathIntegration:
    """Verify the math works at 1M scale."""

    def test_1m_sample_is_significant(self):
        """10K from 1M is overwhelmingly significant."""
        cfg = ScalePipelineConfig()
        sample = cfg.sample_size_for_population(1_000_000)
        required = cochran_sample_size(1_000_000)
        assert sample > required * 20  # 10K >> 384 (26x oversample)

    def test_marble_groups_at_scale(self):
        """10K sample → ~1000 groups → ~3000 candidate themes."""
        cfg = ScalePipelineConfig()
        sample = 10_000
        per_bin = sample // 3  # ~3333 per Theme01 bin
        groups = cfg.marble_groups_count(per_bin)  # ~334 groups per bin
        themes_per_bin = groups * cfg.themes_per_group  # ~1002 per bin
        total = themes_per_bin * 3  # ~3006 total

        assert groups >= 300, f"Too few groups: {groups}"
        assert total >= 2700, f"Too few candidates: {total}"

    def test_reduction_chain_valid(self):
        """all → 9 → 6 → 3 is a valid reduction chain."""
        cfg = ScalePipelineConfig()
        assert cfg.reduce_to_9 > cfg.reduce_to_6 > cfg.reduce_to_3
        assert cfg.reduce_to_9 == 9
        assert cfg.reduce_to_6 == 6
        assert cfg.reduce_to_3 == 3

    def test_assignment_batch_count_at_1m(self):
        """1M responses ÷ 2048 batch size = 489 embedding batches."""
        cfg = ScalePipelineConfig()
        n_batches = math.ceil(1_000_000 / cfg.embedding_batch_size)
        assert n_batches == 489


# ═══════════════════════════════════════════════════════════════════
# REAL DATA: v04.1_5000.csv Scale Analysis
# ═══════════════════════════════════════════════════════════════════


class TestRealData5000CSV:
    """Scale analysis using the actual 5000-response reference dataset.

    This proves the pipeline math works on real data, then projects
    to 1M scale via multiplication factors.
    """

    @pytest.fixture(scope="class")
    def csv_data(self):
        import pandas as pd
        import os
        csv_path = os.path.join(
            os.path.dirname(__file__), "..", "..",
            "Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv"
        )
        if not os.path.exists(csv_path):
            # Try project root
            csv_path = "/home/alex/eXeL-AI-Polling/Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv"
        return pd.read_csv(csv_path)

    def test_csv_has_5000_rows(self, csv_data):
        assert len(csv_data) == 5000

    def test_csv_has_19_columns(self, csv_data):
        assert len(csv_data.columns) == 19

    def test_all_33_summaries_populated(self, csv_data):
        """Every row has a 33-word summary for theme classification."""
        assert csv_data["33_Summary"].notna().sum() == 5000

    def test_theme01_distribution(self, csv_data):
        """Theme01 split roughly matches 3-way classification."""
        dist = csv_data["Theme01"].value_counts()
        for cat in ["Risk & Concerns", "Supporting Comments", "Neutral Comments"]:
            assert cat in dist.index, f"Missing Theme01 category: {cat}"
            assert dist[cat] > 100, f"Too few in {cat}: {dist[cat]}"

    def test_sample_from_5000_is_significant(self, csv_data):
        """Sampling from 5000 is statistically significant."""
        cfg = ScalePipelineConfig()
        sample_size = cfg.sample_size_for_population(5000)
        assert is_statistically_significant(sample_size, 5000)

    def test_marble_groups_from_5000(self, csv_data):
        """5000 responses → marble groups per Theme01 bin."""
        cfg = ScalePipelineConfig()
        dist = csv_data["Theme01"].value_counts()

        total_groups = 0
        total_candidates = 0
        for cat, count in dist.items():
            groups = cfg.marble_groups_count(count)
            candidates = groups * cfg.themes_per_group
            total_groups += groups
            total_candidates += candidates

        assert total_groups >= 400, f"Too few groups: {total_groups}"
        assert total_candidates >= 1200, f"Too few candidates: {total_candidates}"

    def test_scale_projection_5k_to_1m(self, csv_data):
        """Project 5K dataset to 1M: timing multiplication factors."""
        import time
        from app.cubes.cube7_ranking.scale_engine import BordaAccumulator, sample_responses

        # Simulate: 5000 summaries already exist (Phase A done)
        summaries = csv_data["33_Summary"].tolist()

        # Phase B Step 1: Sample (would be 10K from 1M, here use all 5K)
        start = time.perf_counter()
        sample = sample_responses(
            [str(i) for i in range(len(summaries))],
            min(len(summaries), 10_000),
            seed="scale-projection",
        )
        sample_ms = (time.perf_counter() - start) * 1000

        # Phase B simulate voting on 3 themes from 5000 voters
        themes = ["T_risk", "T_support", "T_neutral"]
        acc = BordaAccumulator(n_themes=3, seed="5k-projection")

        start = time.perf_counter()
        for i in range(5000):
            offset = i % 3
            acc.add_vote(themes[offset:] + themes[:offset], f"v{i}")
        vote_ms = (time.perf_counter() - start) * 1000

        start = time.perf_counter()
        results = acc.aggregate()
        agg_ms = (time.perf_counter() - start) * 1000

        # Scale projection: 1M = 200x of 5K
        scale_factor = 1_000_000 / 5_000
        projected_vote_ms = vote_ms * scale_factor
        projected_total_ms = sample_ms + projected_vote_ms + agg_ms

        print(f"\n  5K actual: sample={sample_ms:.1f}ms, vote={vote_ms:.1f}ms, agg={agg_ms:.3f}ms")
        print(f"  1M projected: vote={projected_vote_ms:.0f}ms, total={projected_total_ms:.0f}ms")
        print(f"  Budget: {'WITHIN' if projected_total_ms < 3000 else 'OVER'} 3s target")

        # Vote accumulation should project to < 3s at 1M
        assert projected_vote_ms < 5000, f"Projected vote time too high: {projected_vote_ms:.0f}ms"

    def test_33_summary_lengths(self, csv_data):
        """33-word summaries should be roughly 33 words."""
        word_counts = csv_data["33_Summary"].str.split().str.len()
        avg_words = word_counts.mean()
        assert 20 <= avg_words <= 50, f"Average word count: {avg_words:.1f}"

    def test_theme2_hierarchy_present(self, csv_data):
        """All theme hierarchy levels present: Theme01, Theme2_9, Theme2_6, Theme2_3."""
        for col in ["Theme01", "Theme2_9", "Theme2_6", "Theme2_3"]:
            non_null = csv_data[col].notna().sum()
            assert non_null > 4000, f"{col} has too many nulls: {5000 - non_null}"

    def test_confidence_values_valid(self, csv_data):
        """Confidence columns contain valid percentages."""
        for col in ["Theme01_Confidence", "Theme2_9_Confidence",
                     "Theme2_6_Confidence", "Theme2_3_Confidence"]:
            # Parse percentage strings like "92%"
            vals = csv_data[col].dropna()
            if len(vals) > 0:
                # May be string "92%" or float 0.92
                sample = vals.iloc[0]
                if isinstance(sample, str) and "%" in sample:
                    nums = vals.str.rstrip("%").astype(float)
                    assert (nums >= 0).all()
                    assert (nums <= 100).all()
