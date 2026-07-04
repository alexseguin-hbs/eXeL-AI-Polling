# SECURITY-2525 · MGRS Wireframe Engine (prototype)

Low-compute, **line-only** tactical terrain + **subsurface** visualization for
SECURITY-2525 mission planning, simulation, and replay. Synthesizes the ChatGPT
"MGRS Wireframe" concept and Grok's "Enhanced low-compute + subsurface" spec,
plus the operator's **red elevation/AGL profile** requirement.

> Concept credit: ChatGPT (eXeL AI GPT) + Grok. Reference render that seeded this:
> Grok "MGRS WIREFRAME v0.2 — Security-2525 Tactical Mesh".

## Run

```bash
cd docs/security-2525/wireframe
python3 -m venv .venv
.venv/bin/pip install numpy matplotlib pyproj mgrs utm
.venv/bin/python wireframe_demo.py      # renders out/*.png + coord_packets.json
.venv/bin/python coordinate_engine.py   # prints a Camp Blanding coordinate packet
.venv/bin/python borders.py             # fetches + clips state/country borders
```

Outputs (committed): `out/camp_blanding_oblique.png`, `out/camp_blanding_overhead.png`.
The `.venv/` and `cache/` (downloaded Natural Earth GeoJSON) are gitignored.

## Modules

| File | Role |
|------|------|
| `coordinate_engine.py` | lat/lon ⇄ DMS ⇄ UTM ⇄ **MGRS** ⇄ **UCRS-2525 (base-3600)** ⇄ render grid; `coord_packet()` |
| `borders.py` | Natural Earth admin-0 (country) + admin-1 (state) borders, cached + Liang–Barsky clipped to AO |
| `wireframe_demo.py` | terrain grid + water surface + subsurface bathymetry + draped borders + **red AGL boxes / elevation outline** |

## Visual language

green = land · blue = water surface · **cyan dashed = subsurface bathymetry** ·
orange = state border · red = country border / AO frame / **elevation + AGL emphasis**
(vertical profile box on markers, elevation outline around the AO).

## Fidelity (per the specs)

| Level | grid | bathy | MGRS spacing | use |
|-------|:----:|:-----:|:------------:|-----|
| low | 64–80 | none/coarse | 10 km | command overview, mobile |
| **medium** *(default)* | 120–160 | moderate | 5 km | regional planning |
| high | 240–300+ | fine | 1 km | analysis / SIM prep / export |

## Data sources (production ingest — next phase)

- **Land elevation:** Copernicus GLO-30 (30 m); USGS 3DEP optional (US, higher accuracy)
- **Bathymetry / subsurface:** GEBCO; local survey / operator "known depth" overrides
- **Hydrography:** vector polygons (rivers, lakes, wetlands, coastline)
- **Borders:** Natural Earth admin-0/1 (public domain)

## Scenario — Camp Blanding AO

bbox `[-83.0183, 29.0526, -80.9415, 30.8512]` (~100 km radius). Key points:
Camp Blanding `29.9519, -81.9799` (center); Gainesville `29.6516, -82.3248` (SW);
Jacksonville `30.3322, -81.6557` (NE).

## Status & next

v0.3 prototype (synthetic terrain). SSSES cross-AI review pending — see
`../SSSES_CROSS_AI_QUERY.md`. Then: real DEM/GEBCO ingest → pygame/software
runtime (WASD + MGRS pick/query) → SIM/replay hooks (`../SECURITY_2525_FRAMEWORK.md` §8).
