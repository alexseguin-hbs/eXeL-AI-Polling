"""Cube 7 (Prioritization & Ranking) stand-alone harness (Dev-Sim reference).

Runs the REAL Cube 7 ranking math — Borda count (unweighted) and quadratic
governance-weighted Borda, seeded deterministic tiebreak, and the replay hash —
on sample ranked-ballots, OFFLINE and deterministic (pure functions, no DB). Lets
a Dev Lead play-test the aggregation engine and challenge a candidate against LIVE
CUBE metrics via challenge_loop (mirrors harness_cube1/2/6).

It also makes the C7-1 point concrete: unweighted and quadratic Borda produce
DIFFERENT orders on staked ballots — so `verify_replay` must recompute with the
SAME algorithm the aggregator used, or it falsely reports a determinism mismatch.

Run: `cd backend && .venv/bin/python -m app.cubes.cube10_simulation.harness_cube7`
"""

from app.cubes.cube7_ranking import ranking_aggregation as ra

_THEMES = ["t_mobile", "t_api", "t_analytics", "t_branding", "t_moderation"]
_RANKINGS: list[list[str]] = [
    ["t_mobile", "t_api", "t_analytics", "t_branding", "t_moderation"],
    ["t_mobile", "t_analytics", "t_api", "t_moderation", "t_branding"],
    ["t_api", "t_mobile", "t_branding", "t_analytics", "t_moderation"],
    ["t_analytics", "t_mobile", "t_api", "t_moderation", "t_branding"],
]
_PIDS = ["p1", "p2", "p3", "p4"]
# p1 stakes heavily → quadratic weighting shifts the outcome vs one-person-one-vote.
_STAKES = {"p1": 100.0, "p2": 25.0, "p3": 4.0, "p4": 1.0}


def _order(scores: dict[str, float], seed: str) -> list[str]:
    return [
        t for t, _ in sorted(
            scores.items(),
            key=lambda kv: (-kv[1], ra._seeded_tiebreak_key(kv[0], seed)),
        )
    ]


def run_harness_cube7(
    rankings: list[list[str]] = _RANKINGS,
    participant_ids: list[str] = _PIDS,
    stakes: dict[str, float] = _STAKES,
    seed: str = "lock",
) -> dict:
    """Run the real Cube 7 ranking math (unweighted + quadratic) on `rankings`."""
    n = len(rankings[0])

    u_scores = ra._borda_scores(rankings, n)
    u_order = _order(u_scores, seed)
    u_hash = ra._compute_replay_hash(rankings, seed, "borda_count")

    weights = ra._quadratic_weights(stakes)
    w_scores = ra._weighted_borda_scores(rankings, participant_ids, weights, n)
    w_order = _order(w_scores, seed)
    w_hash = ra._compute_replay_hash(rankings, seed, "quadratic_borda")

    return {
        "cube": "cube7_ranking",
        "n_themes": n,
        "participants": len(rankings),
        "unweighted": {"winner": u_order[0], "order": u_order, "replay_hash": u_hash},
        "quadratic": {
            "weights": {p: round(w, 4) for p, w in weights.items()},
            "winner": w_order[0],
            "order": w_order,
            "replay_hash": w_hash,
        },
        "orders_differ": u_order != w_order,
        # The replay hash folds in the algorithm string, so unweighted vs quadratic
        # hash DIFFERENTLY even on identical ballots — the C7-1 crux: verify_replay
        # must recompute with the SAME algorithm the aggregator used.
        "hashes_differ": u_hash != w_hash,
    }


def render(r: dict) -> str:
    out = ["═" * 72, f"  CUBE 7 RANKING HARNESS — {r['participants']} ballots × {r['n_themes']} themes", "═" * 72]
    out.append("  UNWEIGHTED Borda:")
    out.append(f"    winner: {r['unweighted']['winner']}")
    out.append(f"    order:  {' > '.join(r['unweighted']['order'])}")
    out.append(f"    hash:   {r['unweighted']['replay_hash'][:16]}…")
    out.append("  QUADRATIC (stake-weighted) Borda:")
    out.append(f"    weights: {r['quadratic']['weights']}")
    out.append(f"    winner:  {r['quadratic']['winner']}")
    out.append(f"    order:   {' > '.join(r['quadratic']['order'])}")
    out.append(f"    hash:    {r['quadratic']['replay_hash'][:16]}…")
    out.append("─" * 72)
    out.append(f"  Replay hash depends on the algorithm (verify_replay must match it): differ={r['hashes_differ']}")
    out.append("═" * 72)
    return "\n".join(out)


if __name__ == "__main__":
    print(render(run_harness_cube7()))
