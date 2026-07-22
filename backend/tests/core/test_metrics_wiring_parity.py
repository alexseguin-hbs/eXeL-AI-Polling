"""Phase M — R-Core metrics-wiring parity: get_all_metrics is surfaced on every
cube router (1-8). Locks the endpoints exist (cubes 2/3/7/8 already had them;
1/4/5/6 wired in Phase M)."""

import importlib

import pytest

# (cube module router, expected metrics route path)
_CASES = [
    ("app.cubes.cube1_session.router", "/sessions/{session_id}/ssses-metrics"),
    ("app.cubes.cube4_collector.router", "/sessions/{session_id}/metrics"),
    ("app.cubes.cube5_gateway.router", "/sessions/{session_id}/pipeline/metrics"),
    ("app.cubes.cube6_ai.router", "/sessions/{session_id}/ai/metrics"),
    ("app.cubes.cube7_ranking.router", "/rankings/metrics"),
    ("app.cubes.cube8_tokens.router", "/sessions/{session_id}/tokens/metrics"),
]


@pytest.mark.parametrize("module,path", _CASES)
def test_metrics_endpoint_present(module, path):
    router = importlib.import_module(module).router
    paths = {r.path for r in router.routes if hasattr(r, "path")}
    # cube7's route path is relative to its own prefix; match by suffix to be robust.
    assert any(p.endswith(path) for p in paths), f"{module} missing metrics route {path}"
