"""New code vs a baseline commit on the same 1M SIM database (addendum 4: "metrics of new code vs baseline").

Usage (from backend/, after `python scripts/sim_1m.py seed`):
  python scripts/sim_compare.py <baseline-sha> [--runs 3] [--endpoint]

It checks the baseline out into a temporary git worktree, runs this tree's sim_1m.py bench against both trees'
`app` package (same database, same seed), and prints time, peak memory and whether the results are identical.
Exit 1 when the results differ: a faster method that changes the answer is a regression, not an improvement.
Local database only (sim_1m.py refuses anything else); no provider is ever called.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)


def bench(tree_backend: str, runs: int, out: str, endpoint: bool = False) -> dict:
    env = {**os.environ, "ENVIRONMENT": os.environ.get("ENVIRONMENT", "test")}
    subprocess.run(
        [sys.executable, os.path.join(HERE, "sim_1m.py"), "bench", "--runs", str(runs), "--out", out]
        + (["--endpoint"] if endpoint else []),
        cwd=tree_backend, env=env, check=True, stdout=subprocess.DEVNULL,
    )
    with open(out) as f:
        return json.load(f)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("baseline")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--endpoint", action="store_true", help="compare run_ranking_pipeline (POST /rankings/aggregate)")
    a = ap.parse_args()
    tmp = tempfile.mkdtemp(prefix="sim-baseline-")
    wt = os.path.join(tmp, "tree")
    subprocess.run(["git", "worktree", "add", "-q", "--detach", wt, a.baseline], cwd=BACKEND, check=True)
    try:
        base = bench(os.path.join(wt, "backend"), a.runs, os.path.join(tmp, "base.json"), a.endpoint)
        new = bench(BACKEND, a.runs, os.path.join(tmp, "new.json"), a.endpoint)
    finally:
        subprocess.run(["git", "worktree", "remove", "--force", wt], cwd=BACKEND, check=False)
        shutil.rmtree(tmp, ignore_errors=True)
    same = base["result_hash"] == new["result_hash"]
    key = "endpoint_seconds_median" if a.endpoint else "aggregate_seconds_median"

    def side(r: dict) -> dict:
        out = {"seconds": r[key], "peak_rss_mb": r["peak_rss_mb"]}
        if a.endpoint:
            out.update(anomalies_seconds=r["anomalies_seconds_median"], aggregate_seconds=r["aggregate_seconds_median"])
        return out

    report = {
        "ballots": new["result"].get("ballots", new["result"].get("participant_count")),
        "measured": "run_ranking_pipeline" if a.endpoint else "aggregate_rankings",
        "baseline": {"sha": a.baseline, **side(base)},
        "new": side(new),
        "speedup": round(base[key] / max(new[key], 1e-9), 1),
        "identical_result": same,
    }
    print(json.dumps(report, indent=2))
    sys.exit(0 if same else 1)


if __name__ == "__main__":
    main()
