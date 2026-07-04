# SECURITY-2525 · R-CORE Consolidation 2 — Locked Defaults

> Pressure-test round. Both SSSES reviews (Grok + eXeL AI GPT) converged; this
> locks the three open defaults into build-ready values. Machine-readable form:
> [`wireframe/config.py`](wireframe/config.py). Baseline = [[RCORE_CONSOLIDATION_1]].
> **Status after this patch: qualified prototype — NOT certified; eligible for
> controlled internal demo only.**

## A. Updated SSSES scorecard

| Pillar | C1 | **C2 target** | Unlocked by |
|--------|:--:|:-------------:|-------------|
| Security | 77 | **83** | export modes + manifests + risk modes enforced |
| Stability | 74 | **82** | vertical-datum normalization + no-data handling |
| Scalability | 74 | **80** | line budgets + tiling/LOD |
| Efficiency | 81 | **86** | sparse ribs + instanced line batches |
| Succinctness | 71 | **84** | visual law locked, red no longer overloaded |
| **Overall** | ~75 | **~83** | |

## B. Locked defaults

**B1 · Sparse depth ribs — ADAPTIVE first, spacing fallback.** Ribs render only where they add understanding, never uniformly (uniform = diagnostic mode only).
- Placement priority: water-body centroid · deepest point · shallowest-safe crossing · selected transect · depth inflection points · every-Nth along river centerline.
- Per-body caps: small pond 3–12 · medium lake/river **4–6 core** (max 40) · large = screen-space decimation. Spacing 400–800 m along primary axis.
- Fallback spacing by fidelity: low = every **20** cells · med = **12** · high = **6**.
- Device rib caps: mobile **200** · tablet 400 · desktop 1000.
- Min-depth visibility: low **2.0 m** · med **1.0 m** · high **0.5 m** (hides puddles/marsh noise).

**B2 · Vertical datum — default EGM2008 orthometric (MSL-aligned).**
- Horizontal WGS84 in → UTM internal (Camp Blanding **17N**). Store `elev_m_egm2008` + `elev_m_source` + `datum_source`.
- Confidence: 100 all-known-normalized · 80 minor-mismatch · 60 one-approx · 40 one-missing · 0 multiple-unknown.
- Gates: **no certified < 80** · no operational < 70 · training < 70 only with visible warning · **block certified if any datum unknown**.

**B3 · Risk triggers — GOLD → ORANGE → RED** (red stays rare = warning/border only; transient, reverts to gold when risk clears). *Visualization thresholds, not clearance.*

| Family | Orange (caution) | Red (risk) | Notes |
|--------|------------------|-----------|-------|
| **Fording depth** | personnel ≥0.4 m · vehicle ≥0.6 m | personnel ≥**0.7 m** · vehicle ≥**1.2 m** | unknown platform → strictest (personnel). Force red if flow unknown+crossing / low bathy confidence / stale water level / no-data on transect. *"Depth visualization only. Not a crossing clearance."* |
| **LOS** | clearance 0–5 m · conf 60–80 · vexag-active · DSM-needs-bare-earth | ray intersects terrain · clearance <0 · obstruction >8° · conf <60 | observer 2/10/30 m, target 2 m. *"LOS estimate depends on DEM type, heights, datum."* |
| **Envelope/boundary** | within 1 km of restricted boundary · within 5% of AO radius | inside/crossing restricted · outside AO · unknown boundary in restricted mode | generalized ("risk envelope / restricted zone / mission boundary"); no weapon-specific modeling. Example radii tunable, not defaults. |

## C. Revised visual law (locked)

green land · **dim blue water (opacity 0.25)** · **cyan dashed bathymetry (0.75)** · depth ribs (0.6) · **RED = political borders + critical warnings ONLY** · **GOLD = AGL/elevation + selected point → RED only on B3 risk trigger** · **ORANGE = focus outline + caution** · dim white MGRS/UTM grid · pale labels. Max **2–3 simultaneous emphasis layers** (AGL + MGRS off by default).

## D. Architecture patch list

`config.py` ✅ (this patch) · `vertical_datum.py` ⬅ `detect_vertical_datum` / `normalize_to_target_vertical` / `validate_vertical_alignment` / `emit_vertical_warnings` · split `terrain_mesh.py` + `bathymetry_mesh.py` · `ribs.py` (adaptive placement + curvature/inflection detection) · `risk.py` (B3 evaluators over the heightfield) · `export_policy.py` (modes + gates) · `replay_manifest.py` (schema §F) · `data_loader.py` + `data_manifest.json` + `layer_policy.yaml` · `tests/`.

## E. Config object

Locked in [`wireframe/config.py`](wireframe/config.py): `FIDELITY · LINE_BUDGET · MAX_RIBS_VISIBLE · RIB · VERTICAL · RISK · VEXAG · OPACITY · COLOR · EXPORT_MODES · SCENARIO_CAMP_BLANDING`.

## F. Replay-bundle schema additions

Per-render `replay_bundle.json` adds: `source_vertical_datum · target_vertical_datum · vertical_transform_applied · geoid_model_used · water_level_reference · bathymetry_reference · vertical_confidence_score · certified_allowed(bool)` · `rib_count · rib_placement_reasons` · `risk_events[]` (family, threshold, cell, gold→orange→red) · `camera_state · active_layers · mesh_stats(vertices,edges,frame_ms) · queried_packets[]`.

## G. Tests that must pass (prototype → qualified)

1. **Datum:** unknown datum ⇒ certified export **blocked** + warning in bundle; EGM2008 normalization applied when known; confidence < 80 ⇒ not certified.
2. **Ribs:** never exceed device cap; medium river renders 4–6 core ribs; sub-min-depth cells render **no** rib; uniform only in diagnostic mode.
3. **Risk law:** gold flips red exactly at B3 thresholds and **reverts** when cleared; red never used for non-warning elevation.
4. **Budget:** mobile render ≤ 20k line segments at medium fidelity.
5. **Coord spine:** grid built in UTM meters (not degrees); MGRS↔UTM zone matches AO or warns.
6. **Determinism:** same inputs+config ⇒ identical mesh_stats + SSSES score (replay reproducibility).

## H. Lowest-compute mobile recommendation

Surface mesh + reduced-density cyan dashed bathymetry + **≤200 adaptive ribs** + 2D heightfield for all numeric queries; **pre-baked instanced line batches**; ≤20k visible segments; AGL/MGRS layers **off by default** (toggle on demand); profile-mode curtains only on a selected transect. Ship depth understanding at a glance without a GPU.

## Next

Implement D in backlog order (config ✅ → vertical_datum → mesh split + ribs → risk → export_policy → replay_manifest → tests). Then real-data ingest starting with **Austin, TX** land+water, widening to Camp Blanding / Gainesville / Jacksonville, then the **Austin–San Antonio corridor**.

*R-CORE Consolidation 2 · Master of Thought · 2026-07-04. Defaults reduce ambiguity, make SSSES measurable, make the build faster.*
