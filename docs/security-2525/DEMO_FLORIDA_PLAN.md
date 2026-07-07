# SECURITY-2525 · FLORIDA DEMO — Execution Plan (LIVE OVERVIEW + PLANNING only)
*Master of Thought · PLAN ONLY · execute 4:30 CST · VISION-2525 / R-CORE / "Innovation at the Speed of Thought"*

**North star:** LIVE OVERVIEW + PLANNING become the reusable basis for **simulation, training, replay, and after-action review**, driven by the eXeL AI Polling engine — participants **lock in for an exercise**, plan collaboratively, and the team's placements/votes compress into governed insight. Florida (statewide roads + bases + littoral) is the true demo.

---

## SCOPE (these two tabs only)
1. Contour: **separate Bathymetry and Elevation** into independent layers.
2. Color palette: **13 Trinity-spectrum swatches, horizontally scrollable** (never full-screen), **Edit (custom picker) as the farthest-right** option.
3. **Florida statewide roadways**; add AOs: **Jacksonville**, **all FL Naval Air Stations**, **Camp Blanding**; each base gets a **10 km circular road buffer** from its edges.
4. Globe → Texas/Florida → Capitol/base **continuous zoom** (drill lands regional, then zooms to site).
5. Wire both tabs as the **sim/training/replay/AAR + eXeL Polling exercise** basis.

---

## PHASE 0 — DATA (the demo enabler; do first, run offline)
**Goal:** Florida roads + waterways + coastline + base footprints, tiled to JSON like existing `public/security-2525/osm-*.json`.
- **Source:** Geofabrik `florida-latest.osm.pbf` (OpenStreetMap, ODbL — attribute).
- **Pipeline (Python, `scripts/security-2525/build_florida.py`):** parse PBF → filter `highway in {motorway,trunk,primary,secondary,tertiary,residential,service}` statewide → simplify (Douglas-Peucker, tolerance by tier) → `waterway` lines + `natural=water`/`coastline` polygons → tile by AO bbox + one coarse statewide tier (motorway/trunk only) for the wide view.
- **Bases (10 km buffer):** for each base centroid+boundary, clip roads within 10 km of the edge → per-base road set. Bases: **NAS Jacksonville**, **NS Mayport**, **NAS Cecil Field (former)**, **NAS Pensacola**, **NAS Whiting Field**, **NAS Key West/Boca Chica**, **Camp Blanding (FL NG)**, plus **Jacksonville** metro.
- **Output:** `osm-florida.json` (statewide tiers), `osm-<base>.json` per base; sizes budgeted <2 MB each (simplify aggressively; log dropped features — no silent truncation).
- **Determinism:** pin the PBF snapshot date + simplify tolerances in a manifest so replays are reproducible (R-CORE version-lock).
- **SSSES:** Security (integrity hash on each JSON; graceful-degradation banner on fetch fail — Thor). Scalability (tier + bbox cull already in `AoMapPane`). Succinctness (reuse `OsmData` schema; no new shape).

## PHASE 1 — Contour: separate Bathymetry & Elevation
- Split `ContourSettings` into two sub-configs: `elevation` and `bathymetry`, each with `enable, count(3–9), interval, colorPalette, thickness, labelMajor`.
- `computeContours` already tags `land` per line; render two independent `<g>` groups gated by `elevation.enable` / `bathymetry.enable`. Land uses elevation config, sub-MSL uses bathymetry config. Keep MSL slider shared.
- Settings UI: two collapsible sub-sections ("ELEVATION (land)", "BATHYMETRY (sea)"), each self-contained.
- **SSSES:** Succinctness (one engine, two views), Efficiency (skip a group when disabled), Stability (independent toggles, tested).

## PHASE 2 — Color palette UX (13 scroll + edit-last)
- `CONTOUR_SPECTRUM` = 13 (add `blank`/white to the 12 Trinity colors → full IR→ROYGBIV→UV→White).
- Render a single-row `overflow-x-auto` strip (`shrink-0` swatches), **custom `<input type=color>` pinned as the LAST item** ("EDIT"). Applies per active sub-layer (elevation vs bathymetry).
- **SSSES:** Succinctness/HI-usability (compact, never full-screen; reuse for both sub-layers).

## PHASE 3 — Florida roadways + base AOs
- Add AO entries (center, halfKm = base radius + 10 km, `osm:"<base>"`, landmarks). Statewide "FLORIDA" AO uses `osm:"florida"` coarse tier.
- Base ring: render a 10 km dashed circle at each base center (reuse the range-ring pattern) to show the buffer edge.
- Continuous zoom: statewide FLORIDA view (span ~600 km) → drill a base → ~40 km → site.
- **SSSES:** Scalability (bbox cull + tiers), Stability (data integrity).

## PHASE 4 — Globe → region → site continuous zoom
- `enteringRef` guard in `MissionPlanning`; `onEnterAo(k)` sets `viewA={center, spanKm≈400}` (regional) and the `aoKey` effect SKIPS its tight `initView` reset when entering from the globe. Command-bar AO buttons keep landing at site scale.
- **SSSES:** Stability +; add a zoom-band E2E assertion (Athena) proving Earth→region→site is monotonic and continuous.

## PHASE 5 — Sim / Training / Replay / AAR + eXeL Polling exercise
- **Replay ID** on every plan, contour set, and track (already have plan summary + governance) → Cube 10 replay + Cube 9 export contract.
- **Lock-in exercise (eXeL Polling reuse):** a "START EXERCISE" action creates an eXeL session (Cube 1) for the AO; participants **lock in** (join), each proposes placements; the Borda/governance engine (Cube 7) compresses team placements into a ranked consensus plan; SUBMIT→commander APPROVE (HITL) closes it; AAR replays the session.
- **LIVE OVERVIEW** consumes the live session feed (Trinity Redundancy delivery) to show real-time participation, threat/asset rollups, and the consensus forming — the "live" in LIVE OVERVIEW.
- **VISION-2525 buses:** stamp COMM/LINK/SYNC/EDGE/UCRS-2525 on session + objects for future real-time device sync; UCRS coordinates keep it planet-agnostic.
- **SSSES:** Integration (Krishna — objects flow to Cube 9/10/11), Security (governance metadata enforced at creation — Thor).

---

## SSSES TARGET (both tabs → 100) & GRADING GATES
Execute each phase behind: `tsc` 0 err · eslint 0 err · Playwright green (add `mission-planning-flow.spec.ts` + `contours` extended for bathy/elev split) · prod build 25/25 · commit+push. Re-score after each phase.

| Pillar | Gate to 100 |
|---|---|
| Security | data-integrity hashes + fetch-fail banners; approval RBAC-gated to commander; governance stamped at creation |
| Stability | continuous-zoom E2E; independent layer toggles; 3× deterministic |
| Scalability | statewide tiers + bbox cull; contour ceiling with logged cap; simplify land-fill polygon (Douglas-Peucker budget) |
| Efficiency | per-frame land-fill memoized; disabled layers skip compute |
| Succinctness | split `mission-planning.tsx` into files; one engine two views; reuse spectrum/ontology |

## R-CORE / VISION-2525 ALIGNMENT
- Stable contract + capability-detected fallback + verified determinism (zoom-continuum, contours libs already model this).
- Maximum reuse: Trinity spectrum, MGRS, mission-support ontology, eXeL Polling Cubes 1/7/9/10, Trinity Redundancy feed.
- Nomenclature from Divinity Guide + eXeL Polling: sessions, governance compression, ♡ 웃 ◬ trinity, lock-in, AAR.

## EXECUTION ORDER (4:30 CST)
0 (data, offline) → 1 (contour split) → 2 (palette) → 3 (FL roads+bases) → 4 (continuous zoom) → 5 (exercise/polling) → SSSES re-score → 9× SPIRAL report.
