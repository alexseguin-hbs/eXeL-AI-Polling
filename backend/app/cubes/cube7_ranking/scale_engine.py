"""Cube 7 — Scale Engine: 1M+ Voter Ranking at the Speed of Thought.

    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║       "Where Shared Intention moves at the Speed of Thought"     ║
    ║                                                                   ║
    ║   Architecture for 1,000,000 concurrent voters:                  ║
    ║                                                                   ║
    ║   ┌──────────┐     ┌──────────┐     ┌──────────┐                ║
    ║   │  Vote    │────▶│ In-Mem   │────▶│ Instant  │                ║
    ║   │  Submit  │     │  Accum   │     │ Results  │                ║
    ║   └──────────┘     └──────────┘     └──────────┘                ║
    ║    16,667/sec       O(1)/vote        O(k) read                  ║
    ║                                                                   ║
    ║   Per-vote: increment → O(1) atomic                             ║
    ║   Aggregation: READ k counters → O(k) where k=3/6/9            ║
    ║   Result: <100ms for ANY number of voters                       ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝

This module provides:
  - sharded_broadcast: Fan-out to 1M clients via Supabase channel sharding
  - AutoThemingBudget / sample_responses: the 60-second auto-theming budget
  - ScaleMetrics: throughput bookkeeping

HP-08 (AsM r1, 2026-10-07): the in-memory BordaAccumulator and its SupabaseVoteAccumulator wrapper were
a second Borda engine nothing called. They are removed: the one tally is
ranking_aggregation.aggregate_rankings (SQL tally on Postgres, 1M ballots in ~2 s).
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

import structlog

logger = structlog.get_logger("cube7.scale")  # keyword fields need structlog; stdlib raised TypeError


# ═══════════════════════════════════════════════════════════════════
# SHARDED BROADCAST
# ═══════════════════════════════════════════════════════════════════


def compute_shard(participant_id: str, n_shards: int = 100) -> int:
    """Deterministic shard assignment: hash(participant_id) % n_shards.

    For 1M users with 100 shards: ~10K users per shard.
    Each shard gets its own Supabase channel.
    """
    h = int(hashlib.md5(participant_id.encode()).hexdigest(), 16)
    return h % n_shards


def shard_channel(session_code: str, participant_id: str, n_shards: int = 100) -> str:
    """Get the broadcast channel for a participant's shard."""
    shard = compute_shard(participant_id, n_shards)
    return f"session:{session_code}:shard_{shard}"


async def broadcast_to_all_shards(
    session_code: str,
    event: str,
    payload: dict,
    n_shards: int = 100,
) -> int:
    """Fan-out broadcast to all shards — for ranking results.

    Returns number of shards successfully notified.
    """
    try:
        from app.core.supabase_broadcast import broadcast_event

        success_count = 0
        for shard in range(n_shards):
            try:
                await broadcast_event(
                    channel=f"session:{session_code}:shard_{shard}",
                    event=event,
                    payload=payload,
                )
                success_count += 1
            except Exception:
                continue

        logger.info(
            "cube7.scale.broadcast_all_shards",
            extra={
                "session_code": session_code,
                "shards": n_shards,
                "success": success_count,
            },
        )
        return success_count
    except Exception as exc:
        logger.warning("cube7.scale.broadcast_failed", extra={"error": str(exc)})
        return 0


# ═══════════════════════════════════════════════════════════════════
# 60-SECOND AUTO-THEMING PIPELINE
# ═══════════════════════════════════════════════════════════════════


@dataclass
class AutoThemingBudget:
    """Time budget for the 60-second auto-theming pipeline.

    When Moderator clicks Rank:
      T+0s:  Freeze submissions, sample 10K from N responses
      T+5s:  Batch embed 10K samples (2 batches × 5K)
      T+15s: MiniBatchKMeans cluster → 9 themes
      T+20s: Reduce 9→6→3 via LLM
      T+30s: Assign themes to all N responses (embedding similarity)
      T+45s: Stream themes to ranking UI (progressive reveal)
      T+50s: Open voting
      T+60s: Budget complete — voting is live

    At 1M responses:
      - Sample 10K: O(1) random sample, not O(N) sort
      - Embed 10K: 2 batches × 5K (OpenAI batch limit)
      - Cluster: MiniBatchKMeans on 10K × 1536-dim ≈ 2s
      - Reduce: 3 LLM calls (9→6→3) ≈ 5s
      - Assign 1M: Cosine similarity against 9 centroids = O(N×9) ≈ 10s
    """

    total_budget_sec: float = 60.0
    sample_size: int = 10_000
    batch_size: int = 5_000
    freeze_sec: float = 2.0
    embed_sec: float = 10.0
    cluster_sec: float = 5.0
    reduce_sec: float = 10.0
    assign_sec: float = 15.0
    reveal_sec: float = 10.0
    buffer_sec: float = 8.0

    @property
    def allocated(self) -> float:
        return (
            self.freeze_sec + self.embed_sec + self.cluster_sec +
            self.reduce_sec + self.assign_sec + self.reveal_sec + self.buffer_sec
        )

    @property
    def within_budget(self) -> bool:
        return self.allocated <= self.total_budget_sec

    def to_dict(self) -> dict:
        return {
            "total_budget_sec": self.total_budget_sec,
            "allocated_sec": self.allocated,
            "within_budget": self.within_budget,
            "phases": {
                "freeze": self.freeze_sec,
                "embed": self.embed_sec,
                "cluster": self.cluster_sec,
                "reduce": self.reduce_sec,
                "assign": self.assign_sec,
                "reveal": self.reveal_sec,
                "buffer": self.buffer_sec,
            },
            "sample_size": self.sample_size,
            "batch_size": self.batch_size,
        }


def sample_responses(
    response_ids: list[str],
    sample_size: int = 10_000,
    seed: str | None = None,
) -> list[str]:
    """O(K) reservoir sampling from N responses — no sort needed.

    Uses Fisher-Yates partial shuffle for O(K) random sample.
    With seed: deterministic sample for reproducibility.
    """
    import random

    n = len(response_ids)
    if n <= sample_size:
        return response_ids

    rng = random.Random(seed)
    # Partial Fisher-Yates: swap first K elements with random later elements
    ids = response_ids.copy()
    for i in range(sample_size):
        j = rng.randint(i, n - 1)
        ids[i], ids[j] = ids[j], ids[i]

    return ids[:sample_size]


# ═══════════════════════════════════════════════════════════════════
# SCALE METRICS
# ═══════════════════════════════════════════════════════════════════


@dataclass
class ScaleMetrics:
    """Performance metrics for scale operations."""

    operation: str
    voter_count: int
    theme_count: int
    duration_ms: float
    throughput_per_sec: float = 0.0

    def __post_init__(self):
        if self.duration_ms > 0:
            self.throughput_per_sec = round(
                self.voter_count / (self.duration_ms / 1000), 1
            )

    def to_dict(self) -> dict:
        return {
            "operation": self.operation,
            "voter_count": self.voter_count,
            "theme_count": self.theme_count,
            "duration_ms": round(self.duration_ms, 2),
            "throughput_per_sec": self.throughput_per_sec,
        }
