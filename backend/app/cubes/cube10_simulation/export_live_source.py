"""Export the REAL live source of every cube section function to a frontend data file.

The deployed workers.dev site runs MOCK_MODE (no FastAPI backend), so its /source
endpoint can't call inspect.getsource — it fabricated a placeholder. This bakes the
ACTUAL source (whitelisted to app/cubes/** + app/core/**, secrets denied) into
`frontend/lib/sim-live-source.ts`, which MOCK_MODE serves so the workbench shows the
real eXeL AI code per building block, offline.

Regenerate after changing any cube's SECTIONS or the whitelisted source:
    cd backend && .venv/bin/python -m app.cubes.cube10_simulation.export_live_source
"""
from __future__ import annotations

import json
from pathlib import Path

from app.cubes.cube10_simulation.router import _resolve_named_sources
from app.cubes.cube10_simulation.sections import SECTIONS

_OUT = Path(__file__).resolve().parents[4] / "frontend" / "lib" / "sim-live-source.ts"


def build() -> dict[str, dict[str, dict]]:
    out: dict[str, dict[str, dict]] = {}
    for cube_id in range(1, 10):
        fns = tuple(dict.fromkeys(fn for s in SECTIONS.get(cube_id, []) for fn in s["functions"]))
        by_fn: dict[str, dict] = {}
        for blk in _resolve_named_sources(cube_id, fns, "all"):
            if blk.get("resolved") and blk.get("source"):
                by_fn[blk["name"]] = {"path": blk["path"], "source": blk["source"]}
        out[str(cube_id)] = by_fn
    return out


def main() -> None:
    data = build()
    resolved = sum(len(v) for v in data.values())
    header = (
        "// AUTO-GENERATED — real LIVE source of each cube section function, baked in so the\n"
        "// MOCK_MODE (workers.dev, no backend) SIM workbench shows the ACTUAL eXeL AI code.\n"
        "// Regenerate: cd backend && .venv/bin/python -m app.cubes.cube10_simulation.export_live_source\n"
        "// Whitelisted to app/cubes/** + app/core/** (secrets denied). Do not edit by hand.\n\n"
        "export type LiveFn = { path: string; source: string };\n"
        "export const SIM_LIVE_SOURCE: Record<string, Record<string, LiveFn>> =\n"
    )
    _OUT.parent.mkdir(parents=True, exist_ok=True)
    _OUT.write_text(header + json.dumps(data, indent=2, ensure_ascii=False) + ";\n")
    print(f"wrote {_OUT} ({len(data)} cubes · {resolved} functions with real source)")


if __name__ == "__main__":
    main()
