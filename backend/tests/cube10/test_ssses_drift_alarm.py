"""Cube 10 — T2525 SSSES drift alarm (time-travel regression guard).

A committed oracle (`fixtures/ssses-oracle.json`) pins each Cube 1-9 building block's
decimal code, function set, and 5-pillar SSSES score at Live·N. This test recomputes them
and asserts byte-identical — so a SILENT change to EITHER the foundational-first function
distribution OR the SSSES scoring formula fires an alarm across deploys, instead of quietly
shifting every block's qualification. Regenerate intentionally with:
    cd backend && .venv/bin/python -m app.cubes.cube10_simulation.export_ssses_oracle
"""

import json
from pathlib import Path

import pytest

from app.cubes.cube10_simulation.export_ssses_oracle import LIVE_N, build_oracle

_ORACLE = Path(__file__).parent / "fixtures" / "ssses-oracle.json"


class TestSSSESDriftAlarm:
    def test_oracle_exists_and_covers_all_cubes(self):
        assert _ORACLE.exists(), "SSSES oracle missing — run export_ssses_oracle"
        oracle = json.loads(_ORACLE.read_text())
        assert set(oracle) == {str(c) for c in range(1, 10)}
        for cube, rows in oracle.items():
            assert len(rows) == LIVE_N[int(cube)]  # one entry per Live·N block

    def test_no_silent_drift(self):
        """The live computation MUST match the committed oracle byte-for-byte."""
        committed = json.loads(_ORACLE.read_text())
        live = build_oracle()
        assert live == committed, (
            "SSSES drift detected — a block's function distribution or the SSSES formula "
            "changed. If intended, regenerate: python -m "
            "app.cubes.cube10_simulation.export_ssses_oracle"
        )

    def test_build_is_deterministic(self):
        assert build_oracle() == build_oracle()  # pure — same inputs, same output

    @pytest.mark.parametrize("cube_id", list(range(1, 10)))
    def test_every_block_scored_in_range(self, cube_id):
        rows = json.loads(_ORACLE.read_text())[str(cube_id)]
        for r in rows:
            assert r["code"].startswith(f"{cube_id}.")           # decimal cube.section code
            for p in ("security", "stability", "scalability", "efficiency", "succinctness"):
                assert 0 <= r["ssses"][p] <= 100
