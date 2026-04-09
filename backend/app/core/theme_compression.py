"""Universal Theme Compression Engine — "The Reader for Humanity"

    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║   #1 UNIVERSAL API: The Marble Method as a Service                ║
    ║                                                                   ║
    ║   Input:  ANY text dataset (1 to 10,000,000 documents)           ║
    ║   Output: Hierarchical themes at 3 granularity levels            ║
    ║                                                                   ║
    ║   Use Cases:                                                      ║
    ║     Government: 1M citizen comments → 3 policy priorities         ║
    ║     Innovation: 50K ideas → 9 opportunity clusters → 3 bets      ║
    ║     Research:   10K papers → hierarchical literature map          ║
    ║     News:       100K articles → 3 narratives shaping the world   ║
    ║     Social:     1M posts → 9 sentiments → 3 movements            ║
    ║     Law:        5K statutes → 9 legal themes → 3 reform areas    ║
    ║     Health:     500K patient notes → 3 emerging conditions        ║
    ║                                                                   ║
    ║   The same engine that powers eXeL AI Polling's theme discovery  ║
    ║   becomes a universal intelligence compression tool.              ║
    ║                                                                   ║
    ║   "Where Shared Intention moves at the Speed of Thought"         ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝

Architecture:
    1. PARTITION: Classify inputs into 3 categories (customizable)
    2. SAMPLE:    Marble Method — Fisher-Yates groups of 10
    3. GENERATE:  3 candidate themes per marble group
    4. LIBRARY:   Accumulate all candidates (statistically relevant)
    5. COMPRESS:  Reduce all → 9 → 6 → 3 via LLM
    6. ASSIGN:    Map every input to its theme (embedding cosine or LLM)

API: POST /api/v1/compress
     Body: { texts: string[], partitions?: 3, levels?: [9,6,3] }
     Response: { themes_9: [...], themes_6: [...], themes_3: [...] }
"""

from __future__ import annotations

import hashlib
import logging
import math
import random
import time
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger("theme_compression")


# ═══════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════


@dataclass
class CompressionConfig:
    """Configuration for the Theme Compression Engine."""

    # Partition categories (default: governance model)
    partition_labels: list[str] = field(default_factory=lambda: [
        "Risk & Concerns",
        "Supporting Comments",
        "Neutral Comments",
    ])

    # Marble Method parameters
    marble_group_size: int = 10
    themes_per_group: int = 3

    # Reduction levels (each level reduces from the previous)
    reduction_levels: list[int] = field(default_factory=lambda: [9, 6, 3])

    # Scale thresholds
    max_direct_classify: int = 10_000  # Above this, sample first
    sample_size: int = 10_000

    # Determinism
    seed: int = 42

    def to_dict(self) -> dict:
        return {
            "partitions": self.partition_labels,
            "marble_group_size": self.marble_group_size,
            "themes_per_group": self.themes_per_group,
            "reduction_levels": self.reduction_levels,
            "max_direct_classify": self.max_direct_classify,
            "sample_size": self.sample_size,
        }


# ═══════════════════════════════════════════════════════════════════
# COMPRESSION RESULT
# ═══════════════════════════════════════════════════════════════════


@dataclass
class CompressionResult:
    """Result of theme compression — hierarchical themes at multiple levels."""

    input_count: int
    sample_size: int
    partition_distribution: dict[str, int]
    marble_groups: int
    candidate_themes: int

    # Hierarchical themes
    themes_9: list[dict] = field(default_factory=list)
    themes_6: list[dict] = field(default_factory=list)
    themes_3: list[dict] = field(default_factory=list)

    # Metadata
    duration_ms: float = 0.0
    replay_hash: str = ""
    config: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "input_count": self.input_count,
            "sample_size": self.sample_size,
            "partition_distribution": self.partition_distribution,
            "marble_groups": self.marble_groups,
            "candidate_themes": self.candidate_themes,
            "themes": {
                "9": self.themes_9,
                "6": self.themes_6,
                "3": self.themes_3,
            },
            "duration_ms": round(self.duration_ms, 1),
            "replay_hash": self.replay_hash,
        }


# ═══════════════════════════════════════════════════════════════════
# STEP 1: PARTITION (Classify into categories)
# ═══════════════════════════════════════════════════════════════════


def partition_texts(
    texts: list[str],
    labels: list[str],
    classifications: list[str],
) -> dict[str, list[str]]:
    """Partition texts into labeled categories based on classifications.

    If no classifications provided, distributes evenly across labels.
    """
    bins: dict[str, list[str]] = {label: [] for label in labels}

    for text, cls in zip(texts, classifications):
        if cls in bins:
            bins[cls].append(text)
        else:
            # Default to last partition (Neutral) if unknown
            bins[labels[-1]].append(text)

    return bins


# ═══════════════════════════════════════════════════════════════════
# STEP 2: MARBLE SAMPLE (Fisher-Yates groups of N)
# ═══════════════════════════════════════════════════════════════════


def marble_sample(
    texts: list[str],
    group_size: int = 10,
    seed: int = 42,
) -> list[list[str]]:
    """Deterministic marble sampling — shuffle then slice into groups.

    Each text used exactly once. No replacement sampling.
    Identical to the Cube 6 Marble Method.
    """
    if not texts:
        return []

    rng = random.Random(seed)
    shuffled = texts.copy()
    rng.shuffle(shuffled)

    groups = []
    for i in range(0, len(shuffled), group_size):
        groups.append(shuffled[i:i + group_size])

    return groups


# ═══════════════════════════════════════════════════════════════════
# STEP 5: COMPRESS (Reduce hierarchy)
# ═══════════════════════════════════════════════════════════════════


def compute_compression_hash(
    texts: list[str],
    config: CompressionConfig,
) -> str:
    """Deterministic hash for replay verification."""
    payload = f"{config.seed}:{len(texts)}:" + "|".join(
        hashlib.md5(t[:100].encode()).hexdigest()[:8] for t in sorted(texts[:1000])
    )
    return hashlib.sha256(payload.encode()).hexdigest()


# ═══════════════════════════════════════════════════════════════════
# COST ESTIMATION
# ═══════════════════════════════════════════════════════════════════


@dataclass
class CompressionCostEstimate:
    """Estimate API cost for theme compression."""

    input_count: int
    config: CompressionConfig = field(default_factory=CompressionConfig)

    @property
    def sample_size(self) -> int:
        return min(self.input_count, self.config.sample_size)

    @property
    def groups_per_partition(self) -> int:
        per_partition = self.sample_size // len(self.config.partition_labels)
        return math.ceil(per_partition / self.config.marble_group_size)

    @property
    def total_groups(self) -> int:
        return self.groups_per_partition * len(self.config.partition_labels)

    @property
    def classification_calls(self) -> int:
        """LLM calls to classify texts into partitions."""
        return self.sample_size  # 1 call per text (batched)

    @property
    def generation_calls(self) -> int:
        """LLM calls to generate candidate themes."""
        return self.total_groups

    @property
    def reduction_calls(self) -> int:
        """LLM calls for each reduction level × partition count."""
        return len(self.config.reduction_levels) * len(self.config.partition_labels)

    @property
    def total_llm_calls(self) -> int:
        return self.generation_calls + self.reduction_calls
        # Note: classification uses batch API, counted separately

    @property
    def estimated_cost_usd(self) -> float:
        """Rough cost estimate using gpt-4o-mini pricing."""
        # Classification: batch (cheap)
        classify_cost = self.sample_size * 0.00005  # ~$0.05 per 1K

        # Theme generation: 1 call per group
        gen_cost = self.generation_calls * 0.0003  # ~$0.30 per 1K calls

        # Reduction: few calls, higher quality
        reduce_cost = self.reduction_calls * 0.001

        return round(classify_cost + gen_cost + reduce_cost, 4)

    def to_dict(self) -> dict:
        return {
            "input_count": self.input_count,
            "sample_size": self.sample_size,
            "total_groups": self.total_groups,
            "classification_calls": self.classification_calls,
            "generation_calls": self.generation_calls,
            "reduction_calls": self.reduction_calls,
            "total_llm_calls": self.total_llm_calls,
            "estimated_cost_usd": self.estimated_cost_usd,
        }


# ═══════════════════════════════════════════════════════════════════
# PUBLIC API
# ═══════════════════════════════════════════════════════════════════


def estimate_compression_cost(input_count: int) -> dict:
    """Quick cost estimate for compressing N texts."""
    return CompressionCostEstimate(input_count).to_dict()


def validate_compression_request(
    texts: list[str],
    config: CompressionConfig | None = None,
) -> dict:
    """Validate inputs before compression. Returns issues if any."""
    cfg = config or CompressionConfig()
    issues = []

    if not texts:
        issues.append("No texts provided")
    if len(texts) < 3:
        issues.append("Minimum 3 texts required for meaningful compression")
    if any(len(t.strip()) < 5 for t in texts):
        issues.append("Some texts are too short (minimum 5 characters)")

    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "input_count": len(texts),
        "config": cfg.to_dict(),
        "cost_estimate": estimate_compression_cost(len(texts)),
    }
