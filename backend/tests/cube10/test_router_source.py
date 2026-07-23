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

    def test_core_operational_code_is_shown(self):
        # FX-H: a section's shared operational code (e.g. compute_response_hash from
        # app/core) IS shown now, so the section's code is complete.
        blocks = _resolve_cube_sources(2, "D")
        core_fn = next(b for b in blocks if b["name"] == "compute_response_hash")
        assert core_fn["resolved"] is True and core_fn["source"]

    def test_section_filter_narrows_blocks(self):
        blocks = _resolve_cube_sources(2, "B")
        assert blocks and all(b["section"] == "B" for b in blocks)

    def test_no_block_leaks_a_secret_file(self):
        # WireGuard: source may come from app/cubes OR app/core, but NEVER a secret file.
        for cube in range(1, 10):
            for b in _resolve_cube_sources(cube, None):
                if b["resolved"]:
                    p = b["path"] or ""
                    assert "app/cubes/" in p or "app/core/" in p, f"cube {cube} odd path {p}"
                    assert not any(x in p for x in ("security.py", "config.py", "auth.py",
                        "provider_credentials.py", "stripe_config.py")), f"cube {cube} leaked {p}"

    def test_every_level1_section_has_complete_source(self):
        # FX-H.3: every cube 1-9, all 4 sections resolve real, complete code to operate them.
        from app.cubes.cube10_simulation.sections import SECTION_KEYS
        for cube in range(1, 10):
            for key in SECTION_KEYS:
                blocks = _resolve_cube_sources(cube, key)
                assert any(b["resolved"] and b["source"] for b in blocks), \
                    f"cube {cube} section {key} has no resolvable source"

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
