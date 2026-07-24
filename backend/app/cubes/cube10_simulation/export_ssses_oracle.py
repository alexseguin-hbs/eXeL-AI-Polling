"""Export a deterministic per-block SSSES fingerprint oracle (T2525 drift alarm).

Captures `section_ssses(cube, fns)` (the pure/unmeasured path — no replay, no timing) for
EVERY Cube 1-9 × EVERY building block at the cube's Live·N granularity, plus the block's
decimal code + functions. `tests/cube10/test_ssses_drift_alarm.py` recomputes this and
asserts byte-identical — so a silent change to EITHER the foundational-first function
distribution OR the SSSES scoring formula fires a regression alarm across deploys.

Run offline to (re)generate after an intended change to the distribution or the formula:
    cd backend && .venv/bin/python -m app.cubes.cube10_simulation.export_ssses_oracle
"""
from __future__ import annotations

import json
from pathlib import Path

from app.cubes.cube10_simulation.sections import section_ssses, sections_for

# Live·N — each cube's real LIVE code-unit count (mirrors router._default_sections).
LIVE_N = {1: 6, 2: 8, 3: 7, 4: 8, 5: 7, 6: 7, 7: 8, 8: 7, 9: 8}
_PILLARS = ("security", "stability", "scalability", "efficiency", "succinctness")
_OUT = Path(__file__).resolve().parent.parent.parent.parent / "tests" / "cube10" / "fixtures" / "ssses-oracle.json"


def build_oracle() -> dict[str, list[dict]]:
    oracle: dict[str, list[dict]] = {}
    for cube in range(1, 10):
        n = LIVE_N[cube]
        rows: list[dict] = []
        for s in sections_for(cube, n):
            ss = section_ssses(cube, s.get("functions", []))
            rows.append({
                "code": s["code"],
                "functions": s.get("functions", []),
                "ssses": {p: ss[p] for p in _PILLARS},
            })
        oracle[str(cube)] = rows
    return oracle


def main() -> None:
    _OUT.parent.mkdir(parents=True, exist_ok=True)
    oracle = build_oracle()
    _OUT.write_text(json.dumps(oracle, indent=2, sort_keys=True) + "\n")
    blocks = sum(len(v) for v in oracle.values())
    print(f"wrote {_OUT} ({len(oracle)} cubes · {blocks} blocks)")


if __name__ == "__main__":
    main()
