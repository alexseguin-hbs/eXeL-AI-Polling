"""Q4 lock: Cube 7 SSSES metrics are exposed on the router (were library-only)."""

import inspect


def test_rankings_metrics_route_registered():
    from app.cubes.cube7_ranking.router import router

    paths = [r.path for r in router.routes if hasattr(r, "methods")]
    assert any(p.endswith("/rankings/metrics") for p in paths)


def test_metrics_endpoint_is_rbac_gated():
    from app.cubes.cube7_ranking import router as r

    src = inspect.getsource(r.get_ranking_metrics)
    assert "require_role" in src
    assert "get_all_metrics" in src
