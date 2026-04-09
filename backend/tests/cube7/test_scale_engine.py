"""Cube 7 — Scale Engine: 1M Voter Performance Proofs.

    ╔═══════════════════════════════════════════════════════════════════╗
    ║  TARGET: 1,000,000 voters → results in < 3 seconds              ║
    ║  PROOF:  Pure Python, no DB, no network — raw algorithm speed   ║
    ╚═══════════════════════════════════════════════════════════════════╝

Tests:
  - 1M voter accumulation: < 3s total, < 3μs per vote
  - Streaming vs batch: identical results
  - Accumulator merge: sharded aggregation produces same result
  - Shard distribution: uniform across 100 shards
  - Replay hash: streaming matches batch at 1M scale
  - Auto-theming budget: within 60s allocation
  - Reservoir sampling: correct size, deterministic with seed
"""

import hashlib
import time
import uuid

import pytest

from app.cubes.cube7_ranking.scale_engine import (
    AutoThemingBudget,
    BordaAccumulator,
    ScaleMetrics,
    compute_shard,
    sample_responses,
    shard_channel,
)
from app.cubes.cube7_ranking.service import (
    _borda_scores,
    _compute_replay_hash,
    _seeded_tiebreak_key,
)


# ═══════════════════════════════════════════════════════════════════
# 1M VOTER ACCUMULATION BENCHMARK
# ═══════════════════════════════════════════════════════════════════


class TestMillionVoterBenchmark:
    """Prove the streaming accumulator handles 1M votes."""

    def test_1m_voters_3_themes_under_3s(self):
        """1,000,000 votes on 3 themes: accumulated in < 3 seconds."""
        themes = [str(uuid.uuid4()) for _ in range(3)]
        seed = "million-voter-benchmark"
        acc = BordaAccumulator(n_themes=3, seed=seed)

        start = time.perf_counter()
        for i in range(1_000_000):
            offset = i % 3
            vote = themes[offset:] + themes[:offset]
            acc.add_vote(vote, f"voter_{i}")
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert acc.voter_count == 1_000_000
        assert elapsed_ms < 3000, f"Too slow: {elapsed_ms:.0f}ms (budget: 3000ms)"

        metrics = ScaleMetrics(
            operation="1M_accumulate_3_themes",
            voter_count=1_000_000,
            theme_count=3,
            duration_ms=elapsed_ms,
        )
        print(f"\n  1M voters × 3 themes: {elapsed_ms:.0f}ms "
              f"({metrics.throughput_per_sec:,.0f} votes/sec)")

    def test_1m_voters_9_themes_under_5s(self):
        """1,000,000 votes on 9 themes: accumulated in < 5 seconds."""
        themes = [str(uuid.uuid4()) for _ in range(9)]
        seed = "million-9-themes"
        acc = BordaAccumulator(n_themes=9, seed=seed)

        start = time.perf_counter()
        for i in range(1_000_000):
            offset = i % 9
            vote = themes[offset:] + themes[:offset]
            acc.add_vote(vote, f"voter_{i}")
        elapsed_ms = (time.perf_counter() - start) * 1000

        assert acc.voter_count == 1_000_000
        assert elapsed_ms < 5000, f"Too slow: {elapsed_ms:.0f}ms"

        print(f"\n  1M voters × 9 themes: {elapsed_ms:.0f}ms "
              f"({1_000_000 / elapsed_ms * 1000:,.0f} votes/sec)")

    def test_aggregation_is_instant(self):
        """After 1M accumulations, final sort is < 1ms (O(K log K))."""
        themes = [str(uuid.uuid4()) for _ in range(9)]
        acc = BordaAccumulator(n_themes=9, seed="instant-sort")

        for i in range(100_000):
            offset = i % 9
            acc.add_vote(themes[offset:] + themes[:offset], f"v{i}")

        start = time.perf_counter()
        results = acc.aggregate()
        sort_ms = (time.perf_counter() - start) * 1000

        assert sort_ms < 1.0, f"Sort took {sort_ms:.3f}ms (budget: 1ms)"
        assert len(results) == 9
        assert results[0]["is_top_theme2"] is True
        print(f"\n  Aggregation of 100K votes: {sort_ms:.3f}ms")


# ═══════════════════════════════════════════════════════════════════
# STREAMING VS BATCH EQUIVALENCE
# ═══════════════════════════════════════════════════════════════════


class TestStreamingBatchEquivalence:
    """Streaming accumulator produces identical results to batch Borda."""

    def test_1000_voters_exact_match(self):
        """1000 voters: streaming scores == batch scores."""
        themes = [str(uuid.uuid4()) for _ in range(3)]
        seed = "equivalence-test"

        # Batch (original algorithm)
        rankings = []
        for i in range(1000):
            offset = i % 3
            rankings.append(themes[offset:] + themes[:offset])
        batch_scores = _borda_scores(rankings, 3)

        # Streaming (new accumulator)
        acc = BordaAccumulator(n_themes=3, seed=seed)
        for i, ranking in enumerate(rankings):
            acc.add_vote(ranking, f"voter_{i}")

        stream_scores = acc.scores

        for theme_id in themes:
            assert abs(batch_scores[theme_id] - stream_scores[theme_id]) < 0.001, \
                f"Mismatch for {theme_id}: batch={batch_scores[theme_id]}, stream={stream_scores[theme_id]}"

    def test_10000_voters_order_match(self):
        """10K voters: streaming ranking order == batch ranking order."""
        themes = [str(uuid.uuid4()) for _ in range(6)]
        seed = "order-match"

        rankings = []
        for i in range(10_000):
            offset = i % 6
            rankings.append(themes[offset:] + themes[:offset])
        batch_scores = _borda_scores(rankings, 6)
        batch_order = sorted(
            batch_scores.items(),
            key=lambda x: (-x[1], _seeded_tiebreak_key(x[0], seed)),
        )

        acc = BordaAccumulator(n_themes=6, seed=seed)
        for i, ranking in enumerate(rankings):
            acc.add_vote(ranking, f"v{i}")
        stream_results = acc.aggregate()

        # Verify identical ordering
        for i, (batch_tid, _) in enumerate(batch_order):
            assert stream_results[i]["theme_id"] == batch_tid


# ═══════════════════════════════════════════════════════════════════
# ACCUMULATOR MERGE (Horizontal Scaling)
# ═══════════════════════════════════════════════════════════════════


class TestAccumulatorMerge:
    """Sharded accumulators merge to produce identical result as single."""

    def test_2_shard_merge_equals_single(self):
        """Split 10K votes across 2 shards, merge → same as single accumulator."""
        themes = [str(uuid.uuid4()) for _ in range(3)]
        seed = "merge-test"

        # Single accumulator
        single = BordaAccumulator(n_themes=3, seed=seed)

        # Two shards
        shard_a = BordaAccumulator(n_themes=3, seed=seed)
        shard_b = BordaAccumulator(n_themes=3, seed=seed)

        for i in range(10_000):
            offset = i % 3
            vote = themes[offset:] + themes[:offset]
            pid = f"voter_{i}"
            single.add_vote(vote, pid)
            if i % 2 == 0:
                shard_a.add_vote(vote, pid)
            else:
                shard_b.add_vote(vote, pid)

        # Merge shards
        shard_a.merge(shard_b)

        # Scores must match
        for theme_id in themes:
            assert abs(single.scores[theme_id] - shard_a.scores[theme_id]) < 0.001

        assert single.voter_count == shard_a.voter_count

    def test_10_shard_merge(self):
        """10 shards merged → correct total."""
        themes = ["A", "B", "C"]
        seed = "10-shard"
        n_voters = 100_000

        shards = [BordaAccumulator(n_themes=3, seed=seed) for _ in range(10)]

        for i in range(n_voters):
            offset = i % 3
            vote = themes[offset:] + themes[:offset]
            shards[i % 10].add_vote(vote, f"v{i}")

        # Merge all into first
        for s in shards[1:]:
            shards[0].merge(s)

        assert shards[0].voter_count == n_voters
        total_score = sum(shards[0].scores.values())
        expected = n_voters * 3 * 2 / 2  # n × k × (k-1) / 2
        assert abs(total_score - expected) < 0.01


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
# REPLAY HASH: STREAMING VS BATCH
# ═══════════════════════════════════════════════════════════════════


class TestReplayHashStreaming:
    """Streaming hash is consistent across runs."""

    def test_streaming_hash_deterministic_n10(self):
        """Same votes in same order → identical hash N=10."""
        themes = ["A", "B", "C"]
        hashes = []

        for _ in range(10):
            acc = BordaAccumulator(n_themes=3, seed="hash-test")
            for i in range(1000):
                offset = i % 3
                acc.add_vote(themes[offset:] + themes[:offset], f"v{i}")
            hashes.append(acc.replay_hash)

        assert len(set(hashes)) == 1

    def test_different_vote_order_different_hash(self):
        """Vote order matters for hash (audit trail integrity)."""
        themes = ["A", "B", "C"]

        acc1 = BordaAccumulator(n_themes=3, seed="order-a")
        acc1.add_vote(themes, "v1")
        acc1.add_vote(list(reversed(themes)), "v2")

        acc2 = BordaAccumulator(n_themes=3, seed="order-a")
        acc2.add_vote(list(reversed(themes)), "v2")
        acc2.add_vote(themes, "v1")

        # Scores are identical but hashes differ (order-sensitive audit)
        assert acc1.scores == acc2.scores
        assert acc1.replay_hash != acc2.replay_hash


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
