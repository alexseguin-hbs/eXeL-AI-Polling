# SECURITY-2525 · R-CORE Consolidation 1

> **One page for everyone.** Reconciles the two SSSES reviews (Grok + eXeL AI
> Custom GPT) of the MGRS terrain+subsurface wireframe into a single buildable
> R-CORE update: locked visualization method, reconciled scorecard, architecture
> patch plan, safety gates, and a risk-ordered backlog. Inputs:
> [[SSSES_CROSS_AI_QUERY]] · [[DATA_SOURCES]] · [[SECURITY_2525_FRAMEWORK]].

## 0. R-CORE loop (the discipline this doc enforces)

`Pilot → Replay → Qualify (SSSES) → Adapt → Certify → Educate → Expand`

Readiness gate today: **PROTOTYPE (proceed) — NOT qualified/operational.** Promotion
to *qualified* is blocked until provenance manifests, datum normalization, export
policy, replay bundle, and surface/subsurface **mesh separation** land (§4 gates).

## 1. Reconciled SSSES scorecard

Grok scored the *method*; GPT scored the *prompt* — different lenses, convergent signal.

| Pillar | Grok | GPT | **Consolidated** | Dominant gap (both) |
|--------|:----:|:---:|:----------------:|---------------------|
| **Security** | 82 | 72 | **77** | No data-provenance manifest / export-mode policy |
| **Stability** | 78 | 70 | **74** | Vertical-datum mixing; no no-data bathymetry handling |
| **Scalability** | 72 | 76 | **74** | No tiling/LOD; subsurface edge blow-up on big water |
| **Efficiency** | 85 | 78 | **81** | Line-only is right; needs mesh-split + benchmarks |
| **Succinctness** | 68 | 74 | **71** | **RED channel overloaded** |
| **Overall readiness** | — | 74 | **≈75 — proceed as prototype, do not certify** | |

## 2. LOCKED visualization method (both reviews converge)

**Dual-mesh wireframe + reduced-density dashed subsurface + sparse vertical depth ribs.**

- **Surface mesh** — green land + a **dim/semi-transparent blue water** plane (one layer).
- **Bathymetry mesh** — a *separate* geometry below the waterline, **cyan dashed**, at **reduced density** inside water masks (every Nth line / depth-binned), so edge count stays bounded.
- **Sparse vertical depth ribs** — connect surface↔bottom every N cells (and at markers/transects) so the operator never confuses water surface with bottom.
- **Heightfield (2D array)** — kept for exact numeric queries (depth-at-cell, fording, LOS incl. underwater segments) — no render cost.
- **"Profile mode" (optional)** — clean cross-section curtains along a **user-selected transect** (river crossing / AO line) for precise sectional detail on demand.

Rejected as *primary*: dense lower wires (unreadable), contour "curtains" everywhere (clutter), full translucent-surface-over-bottom-mesh (breaks line-only budget), cutaways-only (no area-wide view). These become optional modes, not the default.

## 3. ⚠ The one real conflict — RED channel (operator decision needed)

Both AIs independently say **red is overloaded** and recommend **red = legal/political boundaries + warnings ONLY** — *"no red elevation unless it is a risk warning."* This **contradicts the earlier operator instruction** to render elevation/AGL emphasis (marker profile boxes + AO elevation outline) in **red**.

**Recommended reconciliation (pending your call):**

| Element | Current (v0.3) | Proposed per SSSES |
|---------|----------------|--------------------|
| Country / state / political border | red / orange | **red solid** (boundaries only) |
| Warnings (no-data, exag over-range, threat) | — | **orange / pulsing red** |
| **Marker AGL profile box** | red | **gold/amber**, selected marker only |
| **AO elevation outline** | red | **amber/pale-green contour**, toggleable |
| Land / water surface / subsurface | green / blue / cyan | unchanged |
| MGRS / UTM grid | dim | **dim white** |
| Selected point / asset / AO center | gold | **yellow/gold** |

→ See §7 open decision. Until decided, v0.3 keeps red AGL (tracked debt).

## 4. Architecture patch plan (module map + artifacts + gates)

**Modules** (split the monolith prototype):
`data_loader.py · coordinate_engine.py ✅ · vertical_datum.py ⬅NEW · terrain_mesh.py · bathymetry_mesh.py ⬅NEW(separate) · hydro_boundary_classifier.py · mgrs_overlay.py · renderer.py · export_policy.py ⬅NEW · replay_manifest.py ⬅NEW · tests/`

**Artifacts emitted per render (replay = evidence, not just a picture):**
`data_manifest.json · layer_policy.yaml · coordinate_manifest.json · render_config.json · style_legend.json · mesh_stats.json · ssses_score.json · warnings.json · camera_state.json · export_policy.json` → bundled as **`replay_bundle.json`**.

**Coordinate authority (both agree):** internal render CRS = **UTM (Camp Blanding = 17N), meters** — never build grid geometry in decimal degrees. lat/lon = I/O · DMS = labels · **MGRS = overlay/reporting** · **UCRS-2525 = higher-level indexing**, not raw geo math.

**Per-layer provenance packet:** dataset · version · source · license · resolution · horizontal_datum · **vertical_datum** · update_date · **classification** (open / controlled-unclassified / user-ground-truth) · allowed_export_formats · derived-inherits-restrictions.

**Safety gates (block/warn):**
- BLOCK "certified" if dataset **license unknown** or **vertical datum unknown**.
- BLOCK **public export** if a controlled / known-ground-truth depth layer is enabled.
- WARN: lat/lon degrees used for meter grid · MGRS↔UTM zone mismatch vs AO · bathymetry no-data > threshold · vertical exaggeration out of readable range.
- **Export modes:** `public · training · internal · restricted` (generalize/suppress sensitive values in public/training).
- **No-data bathymetry:** interpolate / mask / dim, and return query `depth: unknown — use caution`.

## 5. Risk-ordered backlog (Consolidation 1)

1. **data_manifest.json + layer_policy.yaml + export modes** (Security)
2. **coordinate_engine.py** finalize lat/lon·DMS·UTM·MGRS·grid·scene ✅ *(core done — add manifest emit)*
3. **vertical_datum.py** — normalize (recommend EGM2008); reject unknown in qualified mode (Stability)
4. **Split terrain_mesh.py / bathymetry_mesh.py** — two meshes, dim water (Efficiency+Succinctness)
5. **Sparse vertical depth ribs** + reduced-density subsurface + edge budget (<20k lines low/mobile) (Scalability)
6. **ssses_score.json + warnings.json** emit
7. **replay_bundle.json** — full reproducibility package (R-CORE evidence)
8. **Tile-based LOD** (after stability proven)
9. **Export-mode enforcement** (public/training/internal/restricted)
10. **Interactive hover/click** → full coordinate+depth packet

## 6. Highest-value opportunities (both reviews)

Replayable **evidence product** not just a viz · surface/bathymetry **data separation** · UTM-internal grids · MGRS overlay · vertical-datum normalizer · licensing/classification manifests · low/med/high **mesh budgets** · public/training/internal/restricted modes · **no-data confidence shading** · **legend discipline** (one color = one meaning).

## 7. OPEN DECISION for the operator

**RED channel (§3):** adopt the SSSES standard (red = boundaries/warnings only; move AGL/elevation emphasis to gold/amber), keep the current red-AGL look, or a hybrid (red **only** when AGL/elevation crosses a risk threshold)? This gates the next renderer iteration.

*Consolidated by Master of Thought via R-CORE · 2026-07-04. Simulate before deployment · replay before expansion · qualify before certification · scale only what earns trust.*
