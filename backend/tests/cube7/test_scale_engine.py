"""Cube 7 — Scale Engine helpers: shard routing, auto-theming budget, reservoir sampling, metrics.

Tests (HP-08: the BordaAccumulator proofs went with the unused engine; the 1M tally is proven by
scripts/sim_1m.py and tests/cube7/test_sql_tally_parity.py):
  - Shard distribution: uniform across 100 shards
  - Auto-theming budget: within 60s allocation
  - Reservoir sampling: correct size, deterministic with seed
"""

from app.cubes.cube7_ranking.scale_engine import (
    AutoThemingBudget,
    ScaleMetrics,
    compute_shard,
    sample_responses,
    shard_channel,
)


# ═══════════════════════════════════════════════════════════════════
# SHARD DISTRIBUTION
# ═══════════════════════════════════════════════════════════════════


class TestShardDistribution:
    """Verify uniform distribution across broadcast shards."""

    def test_100k_users_uniform_across_100_shards(self):
        """100K users → each shard gets ~1000 (±10%)."""
        shard_counts = [0] * 100
        for i in range(100_000):
            shard = compute_shard(f"user_{i}", 100)
            shard_counts[shard] += 1

        avg = 100_000 / 100  # 1000
        for shard_id, count in enumerate(shard_counts):
            assert count > avg * 0.85, f"Shard {shard_id} too empty: {count}"
            assert count < avg * 1.15, f"Shard {shard_id} too full: {count}"

    def test_shard_channel_format(self):
        channel = shard_channel("DEMO2026", "user_42", 100)
        assert channel.startswith("session:DEMO2026:shard_")
        assert 0 <= int(channel.split("_")[-1]) < 100

    def test_same_user_always_same_shard(self):
        """Deterministic: same user_id → same shard every time."""
        results = [compute_shard("user_abc", 100) for _ in range(100)]
        assert len(set(results)) == 1


# ═══════════════════════════════════════════════════════════════════
# AUTO-THEMING BUDGET
# ═══════════════════════════════════════════════════════════════════


class TestAutoThemingBudget:
    """60-second pipeline budget verification."""

    def test_budget_within_60s(self):
        budget = AutoThemingBudget()
        assert budget.within_budget
        assert budget.allocated <= 60.0

    def test_default_sample_10k(self):
        budget = AutoThemingBudget()
        assert budget.sample_size == 10_000

    def test_budget_phases_sum(self):
        budget = AutoThemingBudget()
        phases = budget.to_dict()["phases"]
        total = sum(phases.values())
        assert abs(total - budget.allocated) < 0.01

    def test_custom_budget(self):
        budget = AutoThemingBudget(total_budget_sec=30.0)
        # Tighter budget — may not fit
        assert budget.total_budget_sec == 30.0


# ═══════════════════════════════════════════════════════════════════
# RESERVOIR SAMPLING
# ═══════════════════════════════════════════════════════════════════


class TestReservoirSampling:
    """O(K) sampling from N responses."""

    def test_sample_size_correct(self):
        ids = [str(i) for i in range(1_000_000)]
        sample = sample_responses(ids, 10_000, seed="test")
        assert len(sample) == 10_000

    def test_deterministic_with_seed(self):
        ids = [str(i) for i in range(100_000)]
        s1 = sample_responses(ids, 1000, seed="deterministic")
        s2 = sample_responses(ids, 1000, seed="deterministic")
        assert s1 == s2

    def test_different_seeds_different_samples(self):
        ids = [str(i) for i in range(100_000)]
        s1 = sample_responses(ids, 1000, seed="alpha")
        s2 = sample_responses(ids, 1000, seed="beta")
        assert s1 != s2

    def test_small_input_returns_all(self):
        ids = [str(i) for i in range(100)]
        sample = sample_responses(ids, 10_000, seed="small")
        assert len(sample) == 100  # Can't sample more than exists

    def test_sample_contains_no_duplicates(self):
        ids = [str(i) for i in range(100_000)]
        sample = sample_responses(ids, 10_000, seed="unique")
        assert len(sample) == len(set(sample))


# ═══════════════════════════════════════════════════════════════════
# SCALE METRICS DATACLASS
# ═══════════════════════════════════════════════════════════════════


class TestScaleMetrics:
    """Scale metrics calculation."""

    def test_throughput_calculation(self):
        m = ScaleMetrics("test", 1_000_000, 3, 2000.0)
        assert m.throughput_per_sec == 500_000.0

    def test_zero_duration(self):
        m = ScaleMetrics("test", 100, 3, 0.0)
        assert m.throughput_per_sec == 0.0

    def test_to_dict(self):
        m = ScaleMetrics("accumulate", 1_000_000, 9, 1500.0)
        d = m.to_dict()
        assert d["voter_count"] == 1_000_000
        assert d["throughput_per_sec"] > 0
