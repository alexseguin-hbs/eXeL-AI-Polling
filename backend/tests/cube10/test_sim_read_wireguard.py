"""Cube 10 — WireGuard negative-input lock for the sim READ endpoints (Security Round).

The read-only sim endpoints (/source, /section-metrics, /ai-council) expose REAL live source
+ per-block metrics. This locks their trust-boundary guards so a future change can't silently
open them: out-of-range cube_id → 400/404 (never 500), unknown section → 400, out-of-range
`sections` degrades to the cube's Live·N (never crashes), and /source NEVER leaks a denied
secret file (auth/config/credentials) regardless of what is requested.
"""

import pytest

from app.cubes.cube10_simulation.router import _SOURCE_DENY, _source_allowed

_READ_ENDPOINTS = ("source", "section-metrics", "ai-council")


class TestCubeIdBounds:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("action", _READ_ENDPOINTS)
    @pytest.mark.parametrize("cube_id", [0, 10, 99, -1])
    async def test_out_of_range_cube_id_rejected(self, client, action, cube_id):
        r = await client.get(f"/api/v1/sim/cube/{cube_id}/{action}?section=A")
        assert r.status_code in (400, 404)   # never a 500 / leak

    @pytest.mark.asyncio
    @pytest.mark.parametrize("action", _READ_ENDPOINTS)
    async def test_non_numeric_cube_id_422(self, client, action):
        r = await client.get(f"/api/v1/sim/cube/abc/{action}?section=A")
        assert r.status_code == 422   # FastAPI path-type validation


class TestSectionWhitelist:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("action", ("section-metrics", "ai-council"))
    @pytest.mark.parametrize("bad", ["ZZ", "../secret", "B999", "'; DROP TABLE"])
    async def test_unknown_section_rejected(self, client, action, bad):
        r = await client.get(f"/api/v1/sim/cube/1/{action}?section={bad}&sections=6")
        assert r.status_code == 400

    @pytest.mark.asyncio
    async def test_source_unknown_block_key_rejected(self, client):
        r = await client.get("/api/v1/sim/cube/1/source?section=B999&sections=6")
        assert r.status_code == 400


class TestSectionsParamDegradesSafely:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("action", _READ_ENDPOINTS)
    @pytest.mark.parametrize("n", [0, 1, 99, 10_000])
    async def test_out_of_range_sections_degrades_not_crashes(self, client, action, n):
        # A curated key (A) always resolves; an out-of-range `sections` must fall back to
        # Live·N rather than 500. Valid → 200; if the fallback count lacks key A → 400. Never 500.
        r = await client.get(f"/api/v1/sim/cube/2/{action}?section=A&sections={n}")
        assert r.status_code in (200, 400)


class TestSecretsNeverLeak:
    def test_deny_list_blocks_secret_files(self):
        for f in _SOURCE_DENY:
            assert _source_allowed(f"/app/core/{f}") is False

    def test_allows_cube_source(self):
        assert _source_allowed("/app/cubes/cube1_session/service.py") is True

    @pytest.mark.asyncio
    async def test_source_response_carries_no_denied_file_path(self, client):
        # Whatever /source returns for a real cube, no block may point at a denied secret file.
        r = await client.get("/api/v1/sim/cube/1/source?section=A")
        assert r.status_code == 200
        for blk in r.json().get("blocks", []):
            path = (blk.get("path") or "").rsplit("/", 1)[-1]
            assert path not in _SOURCE_DENY
