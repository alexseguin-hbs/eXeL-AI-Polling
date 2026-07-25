# Security-2525 Map Tiles — Authoritative Data Pull

> The AO map layers (roads, waterways, elevation, bathymetry) render from **pre-built JSON
> tiles** in `frontend/public/security-2525/` — `osm-<key>.json` (roads + water) and
> `dem-<key>.json` (elevation grid, also drives bathymetry when MSL is raised). The browser
> fetches these at runtime through the tile ladder (memory → localStorage → Supabase → origin).
> Tiles are generated offline by the scripts below, then committed.

## Why some AOs show "limited roads"

The generator scripts fetch from public map-data services. **This build/CI environment's egress
policy blocks every one of them** (connection refused at the gateway), so tiles authored here are
**grounded hand-curated seeds**, not the full network. Confirmed blocked:

| Host | Purpose | Status here |
|------|---------|:--:|
| `overpass-api.de` | OpenStreetMap roads + waterways (Overpass) | ✗ blocked |
| `overpass.openstreetmap.fr` | OSM French mirror | ✗ blocked |
| `download.geofabrik.de` | OSM regional extracts (France `.osm.pbf`) | ✗ blocked |
| `api.opentopodata.org` | GEBCO 2020 elevation + ocean bathymetry | ✗ blocked |
| `router.project-osrm.org`, `data.geopf.fr`, `wxs.ign.fr` | routing / France IGN | ✗ blocked |

Only package registries (pypi/npm/…) are allowed out, and none bundle city street geometry.

## To pull the AUTHORITATIVE tiles (one egress unblock)

Run **either** on a machine with normal internet **or** after allowlisting the two hosts below on
this environment's network policy (see the "Claude Code on the web" network-policy docs):

**Required allowlist entries:**
```
overpass-api.de          # roads + waterways  (OpenStreetMap, ODbL)
api.opentopodata.org     # elevation + bathymetry  (GEBCO 2020, public)
```

**Then regenerate + commit** (both scripts already have every AO key wired, incl. `paris`):
```bash
python3 scripts/security-2525/build_osm_overpass.py paris   # → frontend/public/security-2525/osm-paris.json (full street net + Seine)
python3 scripts/security-2525/build_dem.py           paris   # → frontend/public/security-2525/dem-paris.json (real GEBCO grid)
git add frontend/public/security-2525/osm-paris.json frontend/public/security-2525/dem-paris.json
git commit -m "Security-2525: authoritative Paris tiles (OSM + GEBCO)"
```
Omit `paris` to (re)build every AO. The full OSM tile replaces the curated seed with thousands of
real ways; the guard test (`npm run test:security-paris`) keeps AO ↔ DEM ↔ tile alignment locked.

## Data-source caveats (honest limits, not bugs)

- **Inland bathymetry:** GEBCO is land + *ocean* floor. It has **no river-channel depth** — the
  Seine's true soundings would need SHOM/IGN hydrographic data. Without it, the "bathymetry" layer
  for an inland AO is the DEM revealed below a raised MSL, i.e. terrain sub-MSL, not sounded depth.
- **Attribution:** OSM tiles are © OpenStreetMap contributors (ODbL); GEBCO is public (opentopodata).
- **Tile size:** dense metros at large radius can balloon; `build_osm_overpass.py` uses `MAJOR_ONLY`
  + coarse simplify for ≥100 km AOs to keep tiles phone-friendly.

## Current tile inventory (committed)

| AO key | osm tile | dem tile | Notes |
|--------|:--:|:--:|-------|
| `paris` | seed (36 ways) | grounded (16×16) | Place des Victoires 10 km AOR — **awaiting authoritative pull** |
| US AOs (mabry, capitol, dc, jblm, FL bases, TX metros…) | real (Overpass) | real (GEBCO) | built where egress was allowed |
