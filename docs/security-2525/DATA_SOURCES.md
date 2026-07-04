# SECURITY-2525 · MGRS Wireframe — Authoritative Data Source Stack

> Source-of-record for the wireframe's four data families: **surface elevation ·
> hydrography · subsurface/bathymetry · coordinate systems**. They are separate
> data engines that converge into one mesh. (Curated from ChatGPT eXeL AI GPT +
> operator research, 2026-07-04.) Replaces the placeholder in `wireframe/README.md`.

## 1. Surface elevation → GREEN terrain mesh

| Priority | Source | What | Notes |
|:-:|--------|------|-------|
| 1 (US) | **USGS 3DEP** | High-accuracy US DEM, often **bare-earth DTM**, ≤1 m derived | Free, no use restrictions. Preferred for Camp Blanding. Check per-product vertical datum. |
| 2 (global) | **Copernicus DEM GLO-30** | Global **DSM**, 30 m, WGS84 / EGM2008 vertical, GeoTIFF/DTED + water-body & height-error masks | DSM includes buildings/vegetation — not bare earth. |
| 3 | SRTM / NASADEM | Global fallback | Coarser. |
| 4 | State / local **lidar** | Highest local detail | Where available. |
| 5 | image-derived / synthetic | **prototype only** | What the v0.3 demo uses now. |

## 2. Hydrography → BLUE water wires

| Priority | Source | What |
|:-:|--------|------|
| 1 (US) | **USGS 3DHP** (3D Hydrography Program) | Modern national remap, elevation-aligned to 3DEP; rivers/streams/lakes/wetlands/flowlines/waterbody polygons |
| 2 | **NHD / NHDPlus HR** | Where 3DHP not yet available |
| 3 | Copernicus DEM **Water Body Mask** | Raster helper |
| 4 | OpenStreetMap water polygons/rivers | Quick visual preview |
| 5 | **NOAA** shoreline/coastline | Coastal boundaries |

*Camp Blanding water layer:* inland lakes, wetlands, river corridors, **St. Johns River** system, Atlantic coastal water to the east.

## 3. Subsurface / bathymetry → CYAN submerged wires (below zero-elevation plane)

Two meanings: **(a) bathymetry** (seafloor/lakebed/riverbed — do this first, connects to the mesh) and **(b) below-ground geology** (later layer).

| Priority | Source | What |
|:-:|--------|------|
| 1 (global) | **GEBCO_2026 Grid** | Global ocean+land terrain, 15 arc-sec, meters; **ocean depths = negative**; Type Identifier Grid flags source type |
| 2 (US coastal) | **NOAA NCEI Bathymetry** | Multibeam/singlebeam/lidar bathymetry, NOS hydrographic surveys, estuarine DEMs, coastal relief. Grid Extract / AutoGrid / Bathymetric Data Viewer |
| — | **Below-ground geology (later):** USGS National Geologic Map DB · USGS groundwater/well data · state geological surveys · borehole/well logs · aquifer maps · **SSURGO** soils · geotechnical borings |

GEBCO = regional/global baseline (not fine harbor detail); NOAA NCEI for higher-confidence coastal.

## 4. Coordinate systems (math, not terrain datasets)

- **WGS84 / EPSG:4326** — lat/lon, DMS, I/O exchange, GeoJSON. Source datum (NGA DoD WGS84 standard).
- **UTM (Camp Blanding = Zone 17N, WGS84)** — the internal **metric** engine; build 1 km grid spacing in **meters**, not degrees; MGRS derives from UTM/UPS.
- **MGRS** — generated mathematically from WGS84 → UTM/UPS; references a **square area**, precision by digit count (10 km→1 m). Libs: `mgrs`, `geographiclib`, `pyproj`/PROJ, GDAL/OGR; QGIS to validate.
- **LLV-DMS** — *representation*, not a dataset: Latitude·Longitude·Vertical in DMS, derived from source coord + elevation.

## 5. Vertical datums (track explicitly per source)

| Source | Vertical datum |
|--------|----------------|
| Copernicus GLO-30 | **EGM2008 / EPSG:3855** (m) |
| USGS 3DEP | per-product metadata (check) |
| GEBCO | meters; **ocean = negative** |

Carry a `vertical_datum` field on every elevation sample — mixing EGM2008/ellipsoidal/MSL/chart-datum silently corrupts the mesh (an SSSES-Stability risk flagged in `SSSES_CROSS_AI_QUERY.md`).

## 6. Boundary layer → RED wires

US Census **TIGER/Line** state + county boundaries; Florida state GIS layers; installation boundary from official public sources where available. (Prototype currently uses **Natural Earth** admin-0/1 — fine for AO context, upgrade to TIGER/Line for US precision.)

## 7. Per-cell metadata packet (production rule)

Every rendered cell stores: name · lat · lon · DMS lat · DMS lon · UTM zone/easting/northing · MGRS · elevation (m) · **vertical_datum** · surface_class · water_class · boundary_class · **source_dataset** · source_resolution · **confidence_score**. This is what turns the wireframe from a picture into a coordination layer. (Extends `coordinate_engine.coord_packet()`.)

## 8. Recommended stack — Camp Blanding

- **Elevation:** USGS 3DEP → Copernicus GLO-30 fallback
- **Water:** USGS 3DHP → NHDPlus HR fallback → Copernicus water mask
- **Boundary:** TIGER/Line + Florida GIS
- **Subsurface:** GEBCO_2026 → NOAA NCEI (coastal/lidar)
- **Coords:** WGS84 (lat/lon/DMS) · UTM 17N (metric grid) · MGRS from UTM/UPS
- **Vertical:** DEM meters, datum tracked (Copernicus=EGM2008)

## References

Copernicus DEM (dataspace.copernicus.eu/…/COP-DEM) · USGS 3DEP (usgs.gov/3d-elevation-program) · USGS 3DHP (usgs.gov/3d-hydrography-program) · GEBCO (gebco.net/data-products/gridded-bathymetry-data) · NOAA NCEI (ncei.noaa.gov/products/bathymetry) · MGRS (en.wikipedia.org/wiki/Military_Grid_Reference_System) · NGA WGS84 (earth-info.nga.mil).
