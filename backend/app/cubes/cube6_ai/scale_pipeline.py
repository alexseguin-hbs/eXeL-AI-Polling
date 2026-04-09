"""Cube 6 — Scale Pipeline: 1M Responses → Themes in 60 Seconds.

    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║   The Marble Method at Planetary Scale                            ║
    ║                                                                   ║
    ║   1,000,000 responses → 33-word summaries (Phase A, live)        ║
    ║                       → Sample 10K for theme generation          ║
    ║                       → Classify into Risk/Supporting/Neutral     ║
    ║                       → Marble sample → 3 themes per group       ║
    ║                       → Theme library (statistically relevant)   ║
    ║                       → Reduce: all → 9 → 6 → 3                 ║
    ║                       → Assign all 1M via embedding cosine       ║
    ║                       → Moderator selects 3/6/9 → VOTE           ║
    ║                                                                   ║
    ║   Budget: 60 seconds from "Rank" click to voting open            ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝

Scale strategy:
  - Phase A (during polling): Each response summarized to 33 words live
  - Phase B Step 1: Sample 10K from N responses (O(K) reservoir sampling)
  - Phase B Step 2: Classify 10K samples into Theme01 (10K LLM calls, not 1M)
  - Phase B Step 3: Marble sample from classified 10K
  - Phase B Step 4: Generate candidate themes from marble groups
  - Phase B Step 5: Build theme library, reduce all→9→6→3
  - Phase B Step 6: Assign ALL N responses using embedding cosine similarity
    (centroid matching — 1M × 9 cosine ops, no LLM calls)
  - Phase B Step 7: Store results, broadcast themes_ready

The key insight: theme DISCOVERY uses a sample (10K is statistically
significant for any population). Theme ASSIGNMENT uses embeddings on the
full population (fast vector math, no LLM round-trips).
"""

from __future__ import annotations

import logging
import math
import time
from dataclasses import dataclass, field

logger = logging.getLogger("cube6.scale")


# ═══════════════════════════════════════════════════════════════════
# SCALE PIPELINE CONFIGURATION
# ═══════════════════════════════════════════════════════════════════


@dataclass
class ScalePipelineConfig:
    """Configuration for 1M-scale theming pipeline.

    The 60-second budget is allocated across phases. Each phase has a
    hard timeout — if exceeded, the pipeline falls back to partial results.
    """

    # Sampling
    theme_discovery_sample_size: int = 10_000
    min_sample_for_statistical_significance: int = 384  # 95% CI, ±5% margin

    # Marble Method
    marble_group_size: int = 10
    themes_per_group: int = 3
    max_concurrent_theme_gen: int = 50

    # Reduction targets
    reduce_to_9: int = 9  # 3 per Theme01 category
    reduce_to_6: int = 6  # 2 per Theme01 category
    reduce_to_3: int = 3  # 1 per Theme01 category

    # Assignment
    use_embedding_assignment: bool = True  # Always True at scale
    embedding_batch_size: int = 2048  # OpenAI batch limit

    # Timeouts per phase (seconds)
    timeout_sample: float = 2.0
    timeout_classify: float = 15.0
    timeout_marble: float = 2.0
    timeout_generate: float = 15.0
    timeout_reduce: float = 10.0
    timeout_assign: float = 15.0
    timeout_store: float = 5.0

    @property
    def total_budget(self) -> float:
        return (
            self.timeout_sample + self.timeout_classify + self.timeout_marble +
            self.timeout_generate + self.timeout_reduce + self.timeout_assign +
            self.timeout_store
        )

    def sample_size_for_population(self, n: int) -> int:
        """Compute optimal sample size for a given population.

        Uses Cochran's formula: n = Z²·p·(1-p) / e²
        Adjusted for finite population: n_adj = n / (1 + (n-1)/N)

        For 1M population at 95% confidence, ±5% margin: 384 samples.
        We use 10K for richer theme discovery (>>statistically significant).
        """
        if n <= self.theme_discovery_sample_size:
            return n  # Small enough to process all

        return min(self.theme_discovery_sample_size, n)

    def marble_groups_count(self, bin_size: int) -> int:
        """Number of marble groups from a Theme01 bin."""
        return math.ceil(bin_size / self.marble_group_size)

    def estimated_theme_library_size(self, sample_size: int) -> int:
        """Estimated total candidate themes before reduction.

        Each marble group produces 3 themes.
        ~1/3 of samples per bin × ceil(bin_size/10) groups × 3 themes.
        """
        groups_per_bin = self.marble_groups_count(sample_size // 3)
        return groups_per_bin * 3 * self.themes_per_group

    def to_dict(self) -> dict:
        return {
            "sample_size": self.theme_discovery_sample_size,
            "min_statistical": self.min_sample_for_statistical_significance,
            "marble_group_size": self.marble_group_size,
            "themes_per_group": self.themes_per_group,
            "embedding_batch_size": self.embedding_batch_size,
            "total_budget_sec": self.total_budget,
            "use_embedding_assignment": self.use_embedding_assignment,
        }


# ═══════════════════════════════════════════════════════════════════
# SCALE METRICS TRACKER
# ═══════════════════════════════════════════════════════════════════


@dataclass
class PipelineMetrics:
    """Track timing for each phase of the scale pipeline."""

    total_responses: int = 0
    sample_size: int = 0
    phases: dict = field(default_factory=dict)
    _start: float = 0.0

    def start(self):
        self._start = time.monotonic()

    def phase_start(self, name: str):
        self.phases[name] = {"start": time.monotonic(), "end": 0, "duration_ms": 0}

    def phase_end(self, name: str):
        if name in self.phases:
            self.phases[name]["end"] = time.monotonic()
            self.phases[name]["duration_ms"] = round(
                (self.phases[name]["end"] - self.phases[name]["start"]) * 1000, 1
            )

    @property
    def total_ms(self) -> float:
        return round((time.monotonic() - self._start) * 1000, 1)

    @property
    def within_budget(self) -> bool:
        return self.total_ms < 60_000  # 60 seconds

    def to_dict(self) -> dict:
        return {
            "total_responses": self.total_responses,
            "sample_size": self.sample_size,
            "total_ms": self.total_ms,
            "within_budget": self.within_budget,
            "phases": {
                name: {
                    "duration_ms": p["duration_ms"],
                }
                for name, p in self.phases.items()
            },
        }


# ═══════════════════════════════════════════════════════════════════
# STATISTICAL SIGNIFICANCE CALCULATOR
# ═══════════════════════════════════════════════════════════════════


def cochran_sample_size(
    population: int,
    confidence: float = 0.95,
    margin: float = 0.05,
    proportion: float = 0.5,
) -> int:
    """Cochran's formula for minimum sample size.

    Args:
        population: Total population size (N)
        confidence: Confidence level (0.95 = 95%)
        margin: Margin of error (0.05 = ±5%)
        proportion: Expected proportion (0.5 = max variance, most conservative)

    Returns:
        Minimum sample size for statistical significance.
    """
    # Z-scores for common confidence levels
    z_scores = {0.90: 1.645, 0.95: 1.96, 0.99: 2.576}
    z = z_scores.get(confidence, 1.96)

    # Cochran's formula (infinite population)
    n0 = (z ** 2 * proportion * (1 - proportion)) / (margin ** 2)

    # Finite population correction
    n = n0 / (1 + (n0 - 1) / population)

    return math.ceil(n)


def is_statistically_significant(
    sample_size: int,
    population: int,
    confidence: float = 0.95,
    margin: float = 0.05,
) -> bool:
    """Check if a sample size is statistically significant for a population."""
    required = cochran_sample_size(population, confidence, margin)
    return sample_size >= required


# ═══════════════════════════════════════════════════════════════════
# THEME LIBRARY
# ═══════════════════════════════════════════════════════════════════


@dataclass
class ThemeLibrary:
    """Collection of candidate themes generated from marble groups.

    Before reduction, this holds ALL generated themes organized by
    Theme01 category. Reduction collapses these to 9→6→3.

    At 1M scale with 10K sample:
      ~3,333 per Theme01 bin
      ~333 marble groups per bin
      ~999 candidate themes per bin
      ~2,997 total candidates across all 3 bins
    """

    candidates: dict[str, list[str]] = field(default_factory=lambda: {
        "Risk & Concerns": [],
        "Supporting Comments": [],
        "Neutral Comments": [],
    })

    reduced_9: dict[str, list[dict]] = field(default_factory=dict)
    reduced_6: dict[str, list[dict]] = field(default_factory=dict)
    reduced_3: dict[str, list[dict]] = field(default_factory=dict)

    @property
    def total_candidates(self) -> int:
        return sum(len(v) for v in self.candidates.values())

    @property
    def is_statistically_relevant(self) -> bool:
        """Theme library has enough candidates for meaningful reduction.

        At least 9 candidate themes per category (3 groups × 3 themes).
        """
        return all(len(v) >= 9 for v in self.candidates.values())

    def to_dict(self) -> dict:
        return {
            "total_candidates": self.total_candidates,
            "by_category": {k: len(v) for k, v in self.candidates.items()},
            "is_statistically_relevant": self.is_statistically_relevant,
            "reduced_9_count": sum(len(v) for v in self.reduced_9.values()),
            "reduced_6_count": sum(len(v) for v in self.reduced_6.values()),
            "reduced_3_count": sum(len(v) for v in self.reduced_3.values()),
        }
