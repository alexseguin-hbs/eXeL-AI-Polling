"""Cube 7 — Scale Engine: 1M+ Voter Ranking at the Speed of Thought.

    ╔═══════════════════════════════════════════════════════════════════╗
    ║                                                                   ║
    ║       "Where Shared Intention moves at the Speed of Thought"     ║
    ║                                                                   ║
    ║   Architecture for 1,000,000 concurrent voters:                  ║
    ║                                                                   ║
    ║   ┌──────────┐     ┌──────────┐     ┌──────────┐                ║
    ║   │  Vote    │────▶│  Redis   │────▶│ Instant  │                ║
    ║   │  Submit  │     │  Accum   │     │ Results  │                ║
    ║   └──────────┘     └──────────┘     └──────────┘                ║
    ║    16,667/sec       O(1)/vote        O(k) read                  ║
    ║                                                                   ║
    ║   Per-vote: HINCRBY → O(1) atomic                               ║
    ║   Aggregation: READ k counters → O(k) where k=3/6/9            ║
    ║   Result: <100ms for ANY number of voters                       ║
    ║                                                                   ║
    ╚═══════════════════════════════════════════════════════════════════╝

This module provides:
  - StreamingBordaAccumulator: In-memory accumulator for votes
  - RedisVoteAccumulator: Redis-backed accumulator for production
  - instant_aggregate: O(k) aggregation from pre-computed counters
  - sharded_broadcast: Fan-out to 1M clients via channel sharding

The original service.py functions remain for correctness verification
and small-scale sessions. This engine activates when participant_count > 1000.
"""

from __future__ import annotations

import hashlib
import logging
import math
import uuid
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger("cube7.scale")


# ═══════════════════════════════════════════════════════════════════
# STREAMING BORDA ACCUMULATOR
# ═══════════════════════════════════════════════════════════════════


@dataclass
class BordaAccumulator:
    """O(1)-per-vote Borda count accumulator.

    Instead of storing all N rankings and computing scores in O(N×K),
    this accumulates scores incrementally. Each vote is O(K) to process,
    and final aggregation is O(K log K) to sort.

    Memory: O(K) regardless of voter count (K = number of themes).

    Usage:
        acc = BordaAccumulator(n_themes=9, seed="session-seed")
        for vote in votes:
            acc.add_vote(vote.ranked_theme_ids, vote.participant_id)
        result = acc.aggregate()
    """

    n_themes: int
    seed: str
    _scores: dict[str, float] = field(default_factory=lambda: defaultdict(float))
    _vote_counts: dict[str, int] = field(default_factory=lambda: defaultdict(int))
    _voter_count: int = 0
    _hash_state: Any = field(default=None)
    _excluded: set[str] = field(default_factory=set)

    def __post_init__(self):
        self._hash_state = hashlib.sha256()
        self._hash_state.update(f"borda_count:{self.seed}:".encode())

    def add_vote(
        self,
        ranked_theme_ids: list[str],
        participant_id: str,
        weight: float = 1.0,
    ) -> None:
        """Process a single vote — O(K) where K = number of themes.

        Args:
            ranked_theme_ids: Ordered list of theme IDs (first = most important)
            participant_id: Voter identifier (for exclusion check)
            weight: Quadratic governance weight (default 1.0 = equal weight)
        """
        if participant_id in self._excluded:
            return

        for position, theme_id in enumerate(ranked_theme_ids):
            points = (self.n_themes - 1 - position) * weight
            self._scores[theme_id] += points
            self._vote_counts[theme_id] += 1

        self._voter_count += 1

        # Streaming replay hash update — O(1) per vote
        vote_str = ",".join(ranked_theme_ids)
        self._hash_state.update(vote_str.encode())

    def exclude_participant(self, participant_id: str) -> None:
        """Mark a participant for exclusion (anti-sybil)."""
        self._excluded.add(participant_id)

    def aggregate(self) -> list[dict]:
        """Produce final ranked results — O(K log K).

        Returns list of dicts sorted by score DESC with deterministic tiebreak.
        """
        sorted_themes = sorted(
            self._scores.items(),
            key=lambda item: (
                -item[1],
                hashlib.sha256(f"{item[0]}:{self.seed}".encode()).hexdigest(),
            ),
        )

        results = []
        for rank, (theme_id, score) in enumerate(sorted_themes, 1):
            results.append({
                "theme_id": theme_id,
                "rank_position": rank,
                "score": round(score, 6),
                "vote_count": self._vote_counts[theme_id],
                "is_top_theme2": rank == 1,
            })

        return results

    @property
    def replay_hash(self) -> str:
        """SHA-256 replay hash — streaming, never stores all votes."""
        return self._hash_state.hexdigest()

    @property
    def voter_count(self) -> int:
        return self._voter_count

    @property
    def scores(self) -> dict[str, float]:
        return dict(self._scores)

    def merge(self, other: BordaAccumulator) -> None:
        """Merge another accumulator into this one — for parallel aggregation.

        Enables horizontal scaling: each worker accumulates a shard,
        then shards are merged into the final result.
        """
        for theme_id, score in other._scores.items():
            self._scores[theme_id] += score
        for theme_id, count in other._vote_counts.items():
            self._vote_counts[theme_id] += count
        self._voter_count += other._voter_count
        # Hash merge: chain the other's hash into ours
        self._hash_state.update(other.replay_hash.encode())


# ═══════════════════════════════════════════════════════════════════
# REDIS VOTE ACCUMULATOR (Production)
# ═══════════════════════════════════════════════════════════════════


class RedisVoteAccumulator:
    """Redis-backed vote accumulator for production 1M+ scale.

    Each vote translates to:
      HINCRBY ranking:{session}:scores {theme_id}:{position} 1
      INCR ranking:{session}:voter_count

    Final aggregation reads K hash keys — O(K), not O(N).
    """

    def __init__(self, session_id: str, n_themes: int, seed: str):
        self.session_id = session_id
        self.n_themes = n_themes
        self.seed = seed
        self._key_prefix = f"ranking:{session_id}"

    def vote_commands(self, ranked_theme_ids: list[str]) -> list[tuple[str, ...]]:
        """Generate Redis commands for a single vote — pipelineable.

        Returns list of (command, *args) tuples for Redis pipeline.
        """
        commands = []
        for position, theme_id in enumerate(ranked_theme_ids):
            points = self.n_themes - 1 - position
            if points > 0:
                commands.append((
                    "HINCRBY",
                    f"{self._key_prefix}:scores",
                    theme_id,
                    str(points),
                ))
            # Track vote count per theme
            commands.append((
                "HINCRBY",
                f"{self._key_prefix}:votes",
                theme_id,
                "1",
            ))

        # Increment total voter count
        commands.append(("INCR", f"{self._key_prefix}:count"))

        return commands

    async def read_scores(self, redis) -> dict[str, float]:
        """Read accumulated scores from Redis — O(K)."""
        raw = await redis.hgetall(f"{self._key_prefix}:scores")
        return {k.decode(): float(v) for k, v in raw.items()} if raw else {}

    async def read_vote_counts(self, redis) -> dict[str, int]:
        """Read vote counts per theme from Redis — O(K)."""
        raw = await redis.hgetall(f"{self._key_prefix}:votes")
        return {k.decode(): int(v) for k, v in raw.items()} if raw else {}

    async def read_voter_count(self, redis) -> int:
        """Read total voter count — O(1)."""
        count = await redis.get(f"{self._key_prefix}:count")
        return int(count) if count else 0

    async def aggregate(self, redis) -> list[dict]:
        """Read pre-computed scores and produce ranked results — O(K log K)."""
        scores = await self.read_scores(redis)
        votes = await self.read_vote_counts(redis)
        voter_count = await self.read_voter_count(redis)

        sorted_themes = sorted(
            scores.items(),
            key=lambda item: (
                -item[1],
                hashlib.sha256(f"{item[0]}:{self.seed}".encode()).hexdigest(),
            ),
        )

        results = []
        for rank, (theme_id, score) in enumerate(sorted_themes, 1):
            results.append({
                "theme_id": theme_id,
                "rank_position": rank,
                "score": round(score, 6),
                "vote_count": votes.get(theme_id, 0),
                "is_top_theme2": rank == 1,
                "voter_count": voter_count,
            })

        return results

    async def cleanup(self, redis) -> None:
        """Remove all Redis keys for this session ranking."""
        await redis.delete(
            f"{self._key_prefix}:scores",
            f"{self._key_prefix}:votes",
            f"{self._key_prefix}:count",
        )


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
