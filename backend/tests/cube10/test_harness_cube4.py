"""Lock harness_cube4 — the real Cube 4 analytical synthesis, offline + deterministic."""

from app.cubes.cube10_simulation.harness_cube4 import run_harness_cube4


def test_produces_rcore_analysis_with_signature():
    r = run_harness_cube4()
    assert r["cube"] == "cube4_collector"
    assert len(r["determinism_signature"]) == 64
    for k in ("confidence", "evidence_quality", "risk", "recommended_actions",
              "alternative_scenarios", "source_crs"):
        assert k in r
    assert r["source_crs"] == "CRS-09"


def test_deterministic():
    assert run_harness_cube4()["determinism_signature"] == \
        run_harness_cube4()["determinism_signature"]
