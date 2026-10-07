"""New code vs a baseline commit on the same 1M SIM database (addendum 4: "metrics of new code vs baseline").

Usage (from backend/, after `python scripts/sim_1m.py seed`):
  python scripts/sim_compare.py <baseline-sha> [--runs 3]

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


def bench(tree_backend: str, runs: int, out: str) -> dict:
    env = {**os.environ, "ENVIRONMENT": os.environ.get("ENVIRONMENT", "test")}
    subprocess.run(
        [sys.executable, os.path.join(HERE, "sim_1m.py"), "bench", "--runs", str(runs), "--out", out],
        cwd=tree_backend, env=env, check=True, stdout=subprocess.DEVNULL,
    )
    with open(out) as f:
        return json.load(f)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("baseline")
    ap.add_argument("--runs", type=int, default=3)
    a = ap.parse_args()
    tmp = tempfile.mkdtemp(prefix="sim-baseline-")
    wt = os.path.join(tmp, "tree")
    subprocess.run(["git", "worktree", "add", "-q", "--detach", wt, a.baseline], cwd=BACKEND, check=True)
    try:
        base = bench(os.path.join(wt, "backend"), a.runs, os.path.join(tmp, "base.json"))
        new = bench(BACKEND, a.runs, os.path.join(tmp, "new.json"))
    finally:
        subprocess.run(["git", "worktree", "remove", "--force", wt], cwd=BACKEND, check=False)
        shutil.rmtree(tmp, ignore_errors=True)
    same = base["result_hash"] == new["result_hash"]
    report = {
        "ballots": new["result"]["ballots"],
        "baseline": {"sha": a.baseline, "seconds": base["aggregate_seconds_median"], "peak_rss_mb": base["peak_rss_mb"]},
        "new": {"seconds": new["aggregate_seconds_median"], "peak_rss_mb": new["peak_rss_mb"]},
        "speedup": round(base["aggregate_seconds_median"] / max(new["aggregate_seconds_median"], 1e-9), 1),
        "identical_result": same,
    }
    print(json.dumps(report, indent=2))
    sys.exit(0 if same else 1)


if __name__ == "__main__":
    main()
