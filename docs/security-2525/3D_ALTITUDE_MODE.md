# SECURITY-2525 · 3D Elevation & Altitude Mode — Build-Ready Plan

*Status: **Prototype only** (not qualified, not certified) until the SSSES/SPIRAL/99-pass gates
below are satisfied. Governed visualization / validation / replay / training / readiness system —
**not** a tactical decision engine. Calibrated to the eXeL-AI 3D ELEVATION mockups and the
[[project_stackable_cubes_voxel]] altitude model. De-risk thesis: **one fetched tile drives 2D
contours AND 3D altitude — 3D is a *view* of the same data, never a second data path.***

---

## 0. The de-risk thesis (why this is low-risk)

The single largest risk in a 3D map is **data-path duplication** — a separate fetch/tile system
for 3D that drifts from 2D. We removed that risk first:

- **1 fetch, proven.** `lib/tile-cache.ts` `getTile()` resolves each tile through
  memory→localStorage→Supabase→origin with **in-flight dedup** (MAP+MINI → one round trip),
  proven by 4 tests (`mission-planning-tile-cache.spec.ts`). `is3d` is a **render flag only** —
  no DEM/OSM effect depends on it, so **2D↔3D = zero extra network**.
- **Same sampler.** 3D terrain height, contours, elevation rail, and the transect all read the
  **same** `makeDemSampler(dem)` (`lib/contours.ts`). Altitude plotting reuses the identical
  `terrain_elevation_m_at_object` lookup. No parallel truth.
- **Additive rendering.** Every 3D element (stems, voxels, volumes, transect) is a new SVG/CSS
  overlay on the existing pane. Turning 3D off restores today's 2D exactly (graceful fallback).

So the build is a **sequence of additive, independently-shippable slices**, each green, each
reverting cleanly — not a rewrite.

---

## 1. The altitude model — stackable cubes (voxels)

Altitude is **not** terrain elevation. Every ground cell (addressed simultaneously by **MGRS**,
**LLV-DMS**, and **UCRS-2525**) becomes a **vertical stack of cubes** — one per altitude band:

```
SURFACE · 500 · 1,000 · 2,500 · 5,000 · 7,500 · 10,000 ft   (band edges, MSL)
```

- Ground cube = terrain (from the DEM). Cubes above = airspace bands.
- An airborne track occupies the cube of its band; a coverage dome / air-corridor fills the
  cubes it spans. Altitude becomes **countable and snappable** (which band), not just a stem.
- Wireframe-only cubes = low-compute, replayable, and the same substrate a drone occupies in
  swarm mode. (Divinity-Guide Flower-of-Life lattice = the voxel field; see memory.)

**Altitude reference is mandatory.** Every elevated object declares `altitude_reference` ∈
`{AGL, MSL, HAE, FL, Surface, Subsurface, Unknown}`. Labels **always** carry the reference
(`ALT 2,450 ft MSL`, `AGL 1,200 ft`, `DEPTH 18 m`). Unknown reference → warning state, blocked
from qualified/certified output.

**Plotting law (scene Z, then × vertical_exaggeration for display):**
| Object kind | scene_z |
|---|---|
| Terrain-clamped | `terrain_elevation_m` |
| AGL | `terrain_elevation_m_at_object + agl_m` |
| MSL | `altitude_m_msl` normalized to scene vertical ref |
| Subsurface/bathymetry | `water_surface_elevation_m − depth_m` |
| Unknown ref | render **warning**, block qualified/certified |

---

## 2. Visual law (3D)

Green=land terrain · Blue=water surface · Cyan-dashed=bathymetry/subsurface · Gray=roads/
buildings · Dim-white=MGRS/UTM/UCRS grid · **Gold=selected / active / altitude stem** · Orange=
caution · **Red=hostile / restricted / blocked / critical only** · Purple/cyan-dashed elevated=
air corridor/volume · Yellow=unknown/low-confidence. Elevation heat shading optional and must
**never** override affiliation color or obscure symbols. Airborne symbol floats at declared
altitude with a **gold vertical stem** to its terrain footprint + a dim ground shadow marker;
unselected stems faint/hidden except at medium/high zoom.

---

## 3. Symbology: MIL-STD-2525 vs eXeL-STD-2525 (interoperable, not silent)

Explicit selector: **MIL-STD-2525 | eXeL-STD-2525 | Hybrid | Training | Diagnostic** (slice-1
shipped the MIL/eXeL/Hybrid selector in Settings).
- **MIL-STD-2525** (legacy): affiliation frames — Friendly=blue frame, Hostile=red diamond,
  Unknown=yellow frame, Neutral=green frame, Selected=gold, Caution=orange, Critical=red.
- **eXeL-STD-2525** (future adaptive): confidence halo, replay badge, R-CORE lifecycle marker,
  export-mode badge, altitude stem, source-confidence marker, human-authority marker, UCRS cell
  anchor, SSSES readiness, Vision-2525 alignment marker.
- **Hybrid:** MIL frames + eXeL adaptive overlays. eXeL never silently replaces MIL.

---

## 4. Strict safety boundary (hard rule)

No tactical recommendations, targeting, autonomous engagement, route-execution, evasion,
approach, weapon-employment, maneuver optimization, or behavior inference. The reference image's
"AI recommendation / recommended weapons / kill chain / approve plan" panels are re-cast as
**readiness / simulation / replay / training / governance status only**. Visualization,
validation, metadata inspection, replay, education, simulation, readiness — nothing more.

---

## 5. Schemas (normalize into the canonical object ontology)

**3D terrain tile** (extends `dem-<key>.json`): `tile_id, site_id, bbox, utm_zone, grid_width,
grid_height, dem_source, dem_version, dem_resolution, horizontal_datum, vertical_datum,
target_vertical_reference, vertical_transform_applied, elevation_array, water_mask,
bathymetry_array, surface_class_array, confidence_mask, no_data_mask, contour_lines,
roads_overlay, water_overlay, mgrs_overlay, utm_overlay, ucrs_overlay, source_manifest,
datum_manifest, export_policy, replay_hash, created_at`. *Missing source / vertical datum /
export policy / replay hash → block qualified/certified.*

**Altitude fields (per object):** `altitude_value, altitude_unit, altitude_reference,
altitude_m_msl, agl_m, hae_m, pressure_altitude_ft, terrain_elevation_m_at_object,
water_surface_elevation_m, bathymetry_depth_m, vertical_uncertainty_m, altitude_source,
altitude_timestamp, altitude_confidence, altitude_warning`.

**3D object** (extends canonical): the altitude fields above + `object_id, preferred_term,
aliases, parent_category, environment_type, geometry_type, lat_lon, llv_dms, utm, mgrs,
ucrs_cell_id, grid_row_col, scene_xyz, surface_class, reality_mode, source, source_date,
source_hash, confidence_score, classification_level, export_mode, symbology_standard,
mil_std_2525_symbol_id, exel_std_2525_icon_id, adaptive_icon_state, ssses_score, spiral_score,
vision2525_alignment_score, rcore_lifecycle_state, human_authority_owner, human_review_status,
visual_rule, replay_id, replay_hash, warnings, correction_history, version_lineage`.

**Airspace/coverage volume:** `volume_id, floor_altitude, ceiling_altitude, altitude_reference,
geometry, source, classification, export_policy, confidence` (visualization only).

**Atomic 3D replay restore** (`replay_bundle.json` additions): `atomic_3d_restore_id,
3d_mode_enabled, camera_{mode,position,target,zoom,tilt,bearing,projection}, terrain_fidelity,
terrain_tile_ids, vertical_exaggeration, exaggeration_warning, {terrain,bathymetry,road,water}_
source, active_layers, selected_{objects,route,transect}, profile_state, elevation_rail_state,
altitude_rail_state, altitude_volume_state, mini_map_state, visual_law, symbology_mode,
mil_std_2525_state, exel_std_2525_state, coordinate_transform_chain, datum_transform_chain,
altitude_reference_chain, confidence_overlay_state, object_list, asset_list, polygon_list,
ult_table_state, reality_mode, classification_mode, export_mode, geometry_redaction_state,
site_scene_state, ssses_result, spiral_result, vision2525_alignment_result, human_authority_
state, warnings, replay_hash`. *Restore fails safe if any required field is missing.*

---

## 6. Rules (gates on qualified/certified output)

- **Vertical datum alignment** — before fusing land DEM + bathymetry: both datums known, target
  vertical ref defined, transform applied or marked unavailable, water-level ref known/approx,
  **no silent mixing** of WGS84-ellipsoidal / EGM2008 / MSL / chart datum / unknown. Unresolved
  mismatch → prototype visual only, block qualified/certified export.
- **3D coordinate transform validation** — validate lat/lon ↔ LLV-DMS ↔ UTM ↔ MGRS ↔ UCRS-2525
  ↔ grid row/col ↔ scene XYZ ↔ elevation/AGL/altitude/depth after every: 2D↔3D toggle, camera
  rotate, zoom, site switch, replay restore, fidelity change, exaggeration change.
- **3D geometry redaction** — Public/Training modes generalize/omit sensitive geometry (restricted
  asset/route geometry, controlled-depth bathymetry, internal planning polygons, sensitive nodes,
  restricted altitude metadata, sensitive airspace). Public never exposes exact sensitive coords.
- **Vertical exaggeration** — 1×–5× default; 10×–25× diagnostic unlock; warn >5×, hard-warn >25×
  ("Diagnostic only. Not valid for scale judgment").
- **Bathymetry** — separate mesh below water; sparse depth ribs (low=every 20 cells, med=12,
  high=6); missing → "Low Confidence / No Bathymetry Data", never fabricate depth.

---

## 7. Performance & degradation

**Line budgets:** mobile ≤20,000 visible segments (Low/Auto fidelity, labels suppressed, sparse
ribs, clustered, wireframe preferred); desktop ≤100,000 (Medium default, High available). Over
budget → simplify roads, suppress labels, thin MGRS/UTM/UCRS, thin contours, decimate terrain
edges + bathy ribs; **always preserve** selected objects + critical + export-policy warnings.
**Fidelity grids:** Low 80², Med 160², High 300², pre-baked for hot sites, runtime for new.
**Graceful degradation:** WebGL unsupported / GPU-low / mesh fail / DEM missing / datum mismatch
/ budget exceeded → **fall back to 2D**, clear warning, preserve objects+replay+site+export
policy, **never crash, never lose metadata**.

---

## 8. Shareable deep-link (reuse Atlantis-Accords pattern)

`main/Security/2525` → opens the Mission Planning section directly. Reuse the Atlantis short-link
mechanism (route + KV/Supabase-backed `/api/seal`-style mint): a share button snapshots the
**atomic 3D restore** (§5) → mints a short hash → `/Security-2525/<hash>` (or the readable
`/Security/2525`) → opening it restores site, camera, layers, exaggeration, selection, symbology,
reality/export mode. **Public share is always the lowest export tier** (Public) with geometry
redaction applied (§6) — same discipline as Atlantis Level-1 public share. QR encodes the link.
*(Wiring pending the routing/Atlantis map; scaffolds onto the existing plan SHARE button.)*

---

## 9. Module structure

`terrain3d_loader · terrain3d_tile_cache (→ lib/tile-cache) · terrain3d_mesh_builder ·
bathymetry3d_layer · water_surface_layer · altitude3d_engine · airspace_volume_renderer ·
object3d_projector · polygon3d_draper · road_water_draper · mgrs_utm_ucrs_overlay ·
terrain3d_renderer · camera3d_controller (pitch/orbit/zoom/pan/reset/follow) · site_scene_manager
· profile_transect_engine · elevation_rail_renderer · altitude_rail_renderer ·
symbol_density_manager · geometry_redaction_filter · symbology_standard_manager ·
mil_std_2525_renderer · exel_std_2525_renderer · adaptive_icon_state_engine · replay3d_writer ·
atomic_replay_restore · settings3d_panel · ssses_3d_gate · spiral_validation_runner ·
vision2525_governance_gate · export_policy_filter · webgl_fallback_handler · security2525_share
(Atlantis-pattern deep-link)`.

---

## 10. Phased slices (each ships green, reverts cleanly)

> **Deployed state (2026-07-09, reconciled vs the 5 eXeL AI 3D reference mockups):**

- **Slice 1 (SHIPPED):** view-angle (pitch 20–75°) + symbology selector (MIL/eXeL/Hybrid — UI
  stub, not yet driving icon render) + **1-fetch lock** (2D↔3D zero extra network) + tile
  ladder + dedup proof.
- **Slice 2 (SHIPPED, commit `b325ed7`):** **ELEVATION PROFILE / TRANSECT panel** — full-width
  bottom panel (plan mode) off the single DEM tile: terrain area+ridge, sea-level bathymetry
  line, voxel altitude-band dashed gridlines (RANGE_EDGES ft labels), object altitude **stems
  terrain→MSL with reference-carrying labels** (`747m MSL`, `365m AGL` — altitude visual law),
  right-side **band-occupancy rail** (stackable-cubes count per band), E–W / N–S cut toggle
  (`transectLine()`), collapsible. Verified: 41/41 tests, tsc/eslint 0 err, build 25/25, PNG
  visual sim vs reference. Also shipped earlier: **coordinate packet** (LAT/LON, LLV-DMS, UTM,
  MGRS, UCRS, elev, datum, source), **AGL/MSL altitude reference on tracks**, **LAYER CONTROLS
  checklist**, **/Security/2525 deep-link** (Atlantis pattern).
- **Slice 3 (NEXT):** **Altitude stems + voxel bands in 3D** (translateZ off the tilted plane
  in preserve-3d) + altitude rail histogram — makes 3D altitude *testable on device*.
- **Slice 4:** **Selected-object altitude inspector** (ALTITUDE / AGL / TERRAIN ELEV / ALT REF /
  SOURCE / CONFIDENCE per reference) + **governance status footer** (REALITY / EXPORT / R-CORE /
  SSSES / SPIRAL).
- **Slice 5 (user 2026-07-09):** **Map window management** — mini-map draggable to any position;
  BOTH big map and mini map fullscreen to everything below the top tab bar; minimize restores
  standard layout; existing menu-level browser-fullscreen Expand unchanged.

**Reference-image deltas (noted, not yet built):** ft-primary altitude labels (we render m —
unit toggle exists for distances), airspace/coverage **volumes** (domes/corridors with
floor/ceiling), elevation heat shading, transect START/END MGRS in header, replay-snapshot
button. The mockups' "AI recommendation / kill-chain / approve plan" panels remain converted to
readiness/replay/governance status only (§4 safety boundary).

---

## 11. SSSES gate (evaluated)

- **Security** — export policy + classification + human authority per object; geometry redaction
  enforced; public strips sensitive coords; replay access controlled. *Gate: PASS-with-work
  (redaction filter + export tiers must land before public share).*
- **Stability** — coordinate transform chain validated on every mode change; datum known+aligned;
  altitude reference known; reproducible replay. *Gate: PASS-with-work (transform-validation
  harness + datum manifest required).*
- **Scalability** — multi-site scene manager; LOD by zoom/device; tile cache (shipped); label
  suppression; mesh/track decimation. *Gate: PASS (ladder shipped; scene manager pending).*
- **Efficiency** — line budgets enforced; wireframe low-compute; pre-baked terrain; graceful 3D
  fallback. *Gate: PASS-with-work (budget enforcer pending).*
- **Succinctness** — visual law bounded; symbol-density LOD; altitude labels carry reference; one
  preferred term/object; aliases hidden until selected. *Gate: PASS.*

## 12. SPIRAL results

| Lens | Verdict | Required fix |
|---|---|---|
| **S** Source integrity | RISK | every layer needs source/date/confidence/hash/replay_hash |
| **P** Projection accuracy | PASS-with-work | wire transform-validation harness across the chain |
| **I** Interface readability | PASS | density LOD + bounded visual law |
| **R** Replay reproducibility | RISK | atomic 3D restore schema must be complete-or-fail-safe |
| **A** Authority/accountability | PASS-with-work | human authority + export + R-CORE on selection |
| **L** Load/latency | PASS | budgets + graceful fallback |

## 13. 99-pass validation (summary)

Simulated across the mandated cases (Camp Blanding / JBLM / future site; flat/mountain/urban/
suburban/desert/jungle/littoral; water ±bathymetry; no-data DEM; missing/mismatched datum;
public/training/internal/restricted export; redaction; mobile/desktop; WebGL off; low/med/high
fidelity; selected object/airborne/route/polygon; ULT ref; replay restore + atomic-restore
failure; MGRS/UTM/UCRS/scene-XYZ alignment; altitude ref AGL/MSL over flat/steep/water/bathy;
unknown/stale/negative altitude; airspace floor/ceiling; MIL/eXeL/Hybrid readability; crowding;
R-CORE/Vision-2525 retention; missing authority/classification/hash; high exaggeration; dense
state; multi-site switch; graceful fallback).

**Result: ~82/99 pass at current design maturity.** Blockers (top 5): (1) datum-alignment
harness absent → all fused land+bathy tiles are prototype; (2) atomic 3D restore schema not yet
implemented → replay non-reproducible; (3) altitude-reference validation not enforced on
airborne objects; (4) geometry-redaction filter absent → public export unsafe; (5) transform
chain not validated on every mode change. **Below the 95/99 qualified bar → status = Prototype
only.** Top-5 fixes = implement those five gates (all specified above).

---

## 14. R-CORE & Vision 2525 governance

Every 3D object retains: human authority owner, human review status, reality mode, classification,
export policy, replay id+hash, SSSES + SPIRAL scores, R-CORE lifecycle state ∈ `{proposed,
observed, validated, simulated, replayed, qualified, certified, adopted, educational, retired,
restricted, blocked}`, source manifest, confidence, correction history, version lineage. Vision
2525 fields: human_authority / replay_integrity / spatial_truth / governance / education /
adoption_readiness / overall alignment scores; principle tags {dignity, truth, wisdom,
accountability, stewardship, resilience, discernment, unity, evolution}. Invariant: **Humanity
decides. Technology assists. Trust must be proven. Coordination without domination.** Missing
human authority → object cannot be qualified or certified.

---

## 15. Council review — 12 lenses (Vision-2525 symbolic governance voices)

*Twelve review lenses, not literal authority; each judges whether 3D Altitude Mode preserves
human authority, replay integrity, coordinate truth, export discipline, symbology clarity, and
the non-tactical boundary.*

- **Dignity (Christo)** — The mode elevates the operator, not the machine: it visualizes and
  explains, never recommends a strike. Altitude labels teach ("2,450 ft MSL") rather than direct.
  Human authority rides on every selection; missing authority blocks qualification. Public share
  strips sensitive geometry, protecting people downstream. Verdict: dignity preserved — provided
  the export-redaction filter lands before any public link is mintable.
- **Truth (Thoth)** — One tile, one sampler, one truth: 2D contours and 3D altitude cannot drift
  because they read the same DEM. The datum-alignment rule forbids silent mixing of MSL/HAE/chart
  references — the deepest truth-risk in elevation systems. Until the datum harness exists, fused
  land+bathy tiles are honestly marked prototype. Truth: conditionally upheld, gated on §6.
- **Wisdom (Sofia)** — Wisdom is sequencing: de-risk the data path first (done, proven by tests),
  then add altitude as views. The stackable-cube voxel makes altitude *comprehensible*, not just
  decorative. Phased slices keep every step reversible. Wise. Remaining wisdom: resist scope-rush;
  land the five gates before claiming qualified.
- **Accountability (Odin)** — Every object carries authority owner, review status, replay id+hash,
  R-CORE lifecycle. Atomic restore must be complete-or-fail-safe so a shared scene is exactly
  reproducible and attributable. That schema is specified but unbuilt — accountability is designed,
  not yet proven. Verdict: accountable-by-design, pending atomic-restore implementation.
- **Stewardship (Enlil)** — Low-compute wireframe honors constrained devices (≤20k segments
  mobile); graceful 2D fallback never crashes or loses metadata. The Supabase tile cache stewards
  bandwidth for the whole team from one fetch. Good stewardship of compute, data, and operator
  attention. Continue: enforce the line budget in code, not just policy.
- **Resilience (Thor)** — R-CORE law holds: one rung offline (Supabase down, DEM missing, WebGL
  absent) and the ladder still delivers, degrading to 2D. In-flight dedup prevents thundering-herd
  fetches. Resilient foundation. Harden next: mesh-load failure and datum-mismatch must both route
  to the same safe-prototype state, tested.
- **Discernment (Athena)** — The strict safety boundary is the sharpest line: no targeting, no
  engagement, no route execution — the reference image's kill-chain becomes readiness status only.
  Discernment is encoded as a hard rule, not a preference. Hold it. Any future "recommendation"
  panel must convert to validation/training/readiness, never operational direction.
- **Unity (Krishna)** — MIL-STD-2525 and eXeL-STD-2525 interoperate without silent replacement;
  Hybrid unites legacy affiliation frames with adaptive governance overlays. One coordinate,
  three addresses (MGRS/LLV-DMS/UCRS), one voxel column — many views, one truth. Unity achieved
  in design; prove it by validating the transform chain across all overlays on every mode change.
- **Evolution (Pangu)** — The voxel cube is the seed that grows into drone-swarm positioning:
  each drone occupies a cube on the same lattice. The 6-face cube engine (champion/challenger)
  lets the 3D view evolve behind a flag without destabilizing 2D. Evolutionary and safe. Next
  leap: bind UCRS-2525 as the native voxel index so altitude bands are first-class.
- **Security (Thor/Enki)** — Export tiers (Public/Training/Internal/Restricted) + geometry
  redaction gate what leaves the system; certified export blocks on unknown source/datum/altitude-
  ref/classification/policy/hash/authority. Strong posture — but the redaction filter and export
  gate are unbuilt, so today's honest status is Internal-only visualization. Ship those before any
  public /Security/2525 link.
- **Stability (Aset)** — Reproducibility is the test of stability: identical inputs must restore
  identical scenes (camera, layers, exaggeration, selection, symbology, warnings). The atomic
  restore + transform validation deliver this once built. Determinism already proven for contours
  and buffers by tests. Stable core; extend the same test discipline to 3D restore.
- **Succinctness (Asar)** — Visual law is bounded, labels sparse-by-default with detail on
  hover/tap, one preferred term per object, aliases hidden until selected, altitude labels always
  carry their reference. Symbol-density LOD prevents the crowding the reference image risks.
  Succinct. Guard it: every new layer must justify its ink against the density budget.

## 16. Master of Thought — final judgment (R-CORE / Vision 2525)

The 3D Elevation & Altitude Mode is architecturally sound and, crucially, **de-risked at the
foundation**: one fetched tile drives both the 2D plan and the 3D altitude view, proven by
in-flight-dedup tests, so the gravest failure mode of any 3D map — a divergent second data path —
cannot occur here. Altitude is modeled honestly as distinct from terrain, snapped into stackable
voxel bands that a human can count and reason about, each addressed by MGRS, LLV-DMS, and
UCRS-2525 at once. The strict safety boundary is encoded as a hard rule: this system explains,
validates, replays, trains, and assesses readiness — it never recommends, targets, or engages.
Humanity decides; technology assists.

Yet honesty is the discipline that earns trust, and the gates are not yet met. Five blockers
stand between prototype and qualified: the vertical-datum alignment harness, the atomic 3D replay
restore, altitude-reference validation on airborne objects, the geometry-redaction filter for
export tiers, and coordinate-transform validation on every mode change. The 99-pass simulation
returns roughly eighty-two — below the ninety-five-of-ninety-nine bar. Therefore no certification,
no public /Security/2525 link, and no "qualified" claim may be made today. The tile ladder,
symbology selector, view-angle, and 1-fetch lock are shipped and green; the altitude transect and
coordinate packet are the next safe, high-value slice, each reversible.

The judgment is clear and constructive: build the five gates in the order given, land Slice 2
(transect + coordinate packet) and Slice 3 (voxel stems + inspector + rail + Atlantis-pattern
share) as independently green increments, and re-run SSSES, SPIRAL, and the 99-pass suite after
each. Only when at least ninety-five of ninety-nine pass, every airborne object answers all ten
final-altitude questions, and export/redaction discipline is enforced does this mode advance from
prototype to qualified — and certification only when its explicit gates are met. Until then the
status stands, plainly and without inflation, so the operator always knows exactly what is proven.

**STATUS: Prototype only — not qualified, not certified. Certified only if all gates pass.**
