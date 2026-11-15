# SECURITY-2525 — AO map data pipeline

Tooling to build the Mission-Planning map tiles (`frontend/public/security-2525/osm-<key>.json`,
`dem-<key>.json`) and to render a standalone phone-openable tactical map for any AO.

**Data sources (same as the rest of the pipeline):**
- **Roads + waterways** — OpenStreetMap via **Overpass** (`build_osm_overpass.py`, and the tiled
  `fetch_ao_data.py`). © OpenStreetMap contributors (ODbL).
- **Elevation + bathymetry** — **opentopodata** GEBCO 2020 (land + ocean depth) or aster30m / srtm30m
  for finer land relief (`build_dem.py`, `fetch_ao_data.py`).

## Scripts
| Script | What it does |
|---|---|
| `build_osm_overpass.py` | Original single-query Overpass fetch per base (BASES dict). Fine for small AOs. |
| `build_dem.py` | Original opentopodata DEM grid per region (REGIONS dict, GEBCO 2020). |
| `fetch_ao_data.py` | **Generalized, TILED** fetch for ANY AO: `--key --center lat,lon --radius km`. Tiles the Overpass query (N×N) so a 42 km / 84 km-box AO returns instead of timing out, iterates mirrors (kumi · osm.ch · overpass-api.de), and defaults to GEBCO 2020 so inlet **bathymetry** renders. Writes `osm-<key>.json` + `dem-<key>.json` into `public/security-2525/`. This is the tool for the all-AO "42 km radius of detail" program. |
| `render_tactical_map.py` | Renders a **standalone HTML** tactical map from `osm-<key>.json` + `dem-<key>.json`: hypsometric relief + hillshade + contours, **bathymetry** (negative GEBCO = depth-graded blue), tiered roads, water, a **true UTM 1 km grid** (zone-correct), scale bar, N arrow, an optional AO radius ring, place labels, and a marked point. Phone-openable, no deploy. |

## Examples
```bash
# JBLM, 42 km AO, GEBCO bathymetry + tiled roads
python3 scripts/security-2525/fetch_ao_data.py --key jblm --center 47.0855,-122.5821 --radius 42

# Render the standalone map (ring = 42 km around JBLM center, 50 m contours)
python3 scripts/security-2525/render_tactical_map.py \
  --osm public/security-2525/osm-jblm.json --dem public/security-2525/dem-jblm.json \
  --out /tmp/jblm.html --center=47.0855,-122.5821 \
  --box=-123.1362,46.7057,-122.0280,47.4653 --ring 42 --ci 50 --mgrs "JBLM CENTER" \
  --title "SECURITY-2525 · JBLM · 42 km AO"
```

## Known caveat — Overpass egress (recorded 2026-11-14)
From this cloud session's egress, **all three Overpass mirrors were refusing** (overpass-api.de
connection-reset, kumi read-timeout, osm.ch HTML error) while **opentopodata (GEBCO/aster) stayed
reachable**. So a run here writes the DEM but may get an **empty OSM** (roads/water). `fetch_ao_data.py`
is best-effort per tile and prints which tiles failed; re-run when a mirror recovers (or from a network
that can reach Overpass). This is an infrastructure outage, not a source choice — the sources are the
same ones the pipeline has always used.
