"""Export the deterministic voxel partition + decimal codes to a JSON oracle the frontend
parity test (`frontend/tests/sim-partition-parity.test.mjs`) checks the JS mirror against,
so `frontend/lib/sim-sections.ts` can never silently drift from `sections.py`.

Run offline to (re)generate after any change to the partition/ordering/codes:
    cd backend && .venv/bin/python -m app.cubes.cube10_simulation.export_partition_oracle
"""
from __future__ import annotations

import json
from pathlib import Path

from app.cubes.cube10_simulation.sections import sections_for

CUBES = range(1, 10)
COUNTS = (2, 3, 4, 6, 9, 27)
_OUT = Path(__file__).resolve().parents[4] / "frontend" / "tests" / "fixtures" / "sim-partition-oracle.json"


def build_oracle() -> dict[str, list[dict]]:
    oracle: dict[str, list[dict]] = {}
    for cube in CUBES:
        for n in COUNTS:
            secs = sections_for(cube, n)
            oracle[f"{cube}.{n}"] = [{"code": s["code"], "cells": s["highlight"]["9"]} for s in secs]
    return oracle


def main() -> None:
    _OUT.parent.mkdir(parents=True, exist_ok=True)
    _OUT.write_text(json.dumps(build_oracle(), indent=2, sort_keys=True) + "\n")
    print(f"wrote {_OUT} ({len(build_oracle())} cube×count entries)")


if __name__ == "__main__":
    main()
