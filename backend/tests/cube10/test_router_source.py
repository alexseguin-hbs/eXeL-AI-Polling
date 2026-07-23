"""FX-B — GET /sim/cube/{id}/source (read-only LIVE code).

The workbench LIVE panel must show the REAL running code, not a placeholder, so a
Dev can write a candidate against it. Source is inspect.getsource, WireGuard-
whitelisted to app/cubes/** ONLY — core/config/secret paths are dropped, never leaked.
"""
import pytest

from app.cubes.cube10_simulation.router import _resolve_cube_sources


class TestResolveCubeSources:
    def test_cube1_all_resolved_nonempty_in_cube_tree(self):
        blocks = _resolve_cube_sources(1, None)
        assert blocks, "cube 1 should have section blocks"
        resolved = [b for b in blocks if b["resolved"]]
        assert resolved, "cube 1 should resolve real source"
        for b in resolved:
            assert b["source"] and len(b["source"]) > 0
            assert "app/cubes/" in b["path"]  # WireGuard: cube tree only

    def test_whitelist_drops_core_utilities(self):
        # cube 2 section D = compute_response_hash, which lives in app/core (not a cube).
        # It must NOT be leaked → resolved False, source None.
        blocks = _resolve_cube_sources(2, "D")
        core_fn = next(b for b in blocks if b["name"] == "compute_response_hash")
        assert core_fn["resolved"] is False
        assert core_fn["source"] is None
        assert core_fn["path"] is None

    def test_section_filter_narrows_blocks(self):
        blocks = _resolve_cube_sources(2, "B")
        assert blocks and all(b["section"] == "B" for b in blocks)

    def test_no_block_ever_points_outside_cube_tree(self):
        for cube in range(1, 10):
            for b in _resolve_cube_sources(cube, None):
                if b["resolved"]:
                    assert "app/cubes/" in (b["path"] or ""), f"cube {cube} leaked {b['path']}"

    def test_result_is_memoized(self):
        # SSSES Efficiency: source is static at runtime → same (cube, section) is cached
        # (the LIVE panel re-fetches on every section change without re-walking the package).
        a = _resolve_cube_sources(1, "A")
        b = _resolve_cube_sources(1, "A")
        assert a is b  # lru_cache hit returns the identical object


class TestSourceEndpoint:
    @pytest.mark.asyncio
    async def test_source_returns_real_blocks(self, client):
        resp = await client.get("/api/v1/sim/cube/1/source")
        assert resp.status_code == 200
        body = resp.json()
        assert body["cube_id"] == 1
        assert any(b["resolved"] and b["source"] for b in body["blocks"])

    @pytest.mark.asyncio
    async def test_source_section_filter(self, client):
        resp = await client.get("/api/v1/sim/cube/2/source?section=B")
        assert resp.status_code == 200
        assert all(b["section"] == "B" for b in resp.json()["blocks"])

    @pytest.mark.asyncio
    async def test_bad_section_returns_400(self, client):
        resp = await client.get("/api/v1/sim/cube/2/source?section=Z")
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_bad_cube_returns_400(self, client):
        resp = await client.get("/api/v1/sim/cube/99/source")
        assert resp.status_code == 400
