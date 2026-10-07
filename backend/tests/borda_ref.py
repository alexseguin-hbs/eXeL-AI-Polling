"""Test helper: collect ballots, rank them with Cube 7's one Borda engine.

HP-08 (AsM r1, 2026-10-07): the in-memory BordaAccumulator in scale_engine.py was a second Borda engine nothing in
the app called — with its own replay hash (no separators, vote-order dependent) that never matched the real one.
It was removed. Tests that used it as "the ranking step" now use this collector, which holds the ballots and hands
them to the real functions in ranking_aggregation (_borda_scores, _weighted_borda_scores, _seeded_tiebreak_key,
_compute_replay_hash). The 1M proof of the production tally is scripts/sim_1m.py + test_sql_tally_parity.py.
"""
from __future__ import annotations

from app.cubes.cube7_ranking.ranking_aggregation import (
    _borda_scores,
    _compute_replay_hash,
    _seeded_tiebreak_key,
    _weighted_borda_scores,
)


class BordaTally:
    """Same calls the old accumulator offered; the arithmetic is the aggregator's own.

    Exclusion follows the aggregator: an excluded participant's ballots never reach the tally, whenever they came.
    """

    def __init__(self, n_themes: int, seed: str):
        self.n_themes = n_themes
        self.seed = seed
        self._ballots: list[tuple[list[str], str, float]] = []
        self._excluded: set[str] = set()

    def add_vote(self, ranked_theme_ids: list[str], participant_id: str, weight: float = 1.0) -> None:
        self._ballots.append((list(ranked_theme_ids), participant_id, weight))

    def exclude_participant(self, participant_id: str) -> None:
        self._excluded.add(participant_id)

    def merge(self, other: "BordaTally") -> None:
        """Borda is additive: a shard's ballots join this tally."""
        self._ballots.extend(other._ballots)
        self._excluded |= other._excluded

    def _counted(self) -> list[tuple[list[str], str, float]]:
        return [b for b in self._ballots if b[1] not in self._excluded]

    @property
    def voter_count(self) -> int:
        return len(self._counted())

    @property
    def scores(self) -> dict[str, float]:
        ballots = self._counted()
        rankings = [b[0] for b in ballots]
        if any(b[2] != 1.0 for b in ballots):
            pids = [f"{i}:{b[1]}" for i, b in enumerate(ballots)]
            return _weighted_borda_scores(rankings, pids, {p: b[2] for p, b in zip(pids, ballots)}, self.n_themes)
        return _borda_scores(rankings, self.n_themes)

    @property
    def replay_hash(self) -> str:
        return _compute_replay_hash([b[0] for b in self._counted()], self.seed)

    def aggregate(self) -> list[dict]:
        scores = self.scores
        votes: dict[str, int] = {}
        for ranked, _, _ in self._counted():
            for tid in set(ranked):
                votes[tid] = votes.get(tid, 0) + 1
        ordered = sorted(scores.items(), key=lambda kv: (-kv[1], _seeded_tiebreak_key(kv[0], self.seed)))
        return [
            {"theme_id": tid, "rank_position": i, "score": round(score, 6), "vote_count": votes.get(tid, 0),
             "is_top_theme2": i == 1}
            for i, (tid, score) in enumerate(ordered, 1)
        ]
