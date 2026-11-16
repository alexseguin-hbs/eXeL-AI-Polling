<!-- Hand-authored (not generated). Mirrors the sibling ladder of docs/drone-2525/CRS_DRONE-2525.md +
     docs/financial-2525/CRS_FINANCIAL-2525.md. An ARCH JSON+render generator is an optional follow-up. -->
# CRS · Architect-2525

**Version 00.00 · 2026-11-16** · Vision • 2525 Level-3 Domain Play (home design) on WIREFRAME-CORE

> A design-and-coordination tool for a 900 ft² tiny home. Bounding estimates and simulations for planning and
> critique — not a stamped construction document, not a permit, not structural certification. A human (the homeowner)
> decides at every gate.

Handoff: operator 2026-11-16 ("update architect-2525 … ensure UX aligns to CRS" → "Create CRS, then align").

Id law (docs/vision-2525/CRS-GOVERNANCE-PLAN.md): **`ARCH-##.##`**, two digits never letters; parents are permanent;
sub-ids append only; a changed requirement is **superseded**, never rewritten. (`ARC-*` is reserved for
architecture-2525 / celestial; this home-design app is `ARCH-*`.) Status vocabulary:
draft · approved · implemented · verified · superseded · out-of-scope.

Input / Output ids: `ARCH-##.##.IN` → `ARCH-##.##.OUT`. Feedback auto-tags carry `cube_id`, `crs_id`, `sub_crs_id`,
`feedback_type` (CRS | DI) exactly as the eXeL convention (CLAUDE.md § CRS Naming Convention).

## The ladder — one step per Vision • 2525 section

| CRS | Requirement | § | R-CORE | Phase | Status | Verified by |
|---|---|---|---|---|---|---|
| `ARCH-01` | Humanity-first product: one command shell, a homeowner speaks to it in plain language, routeable + unlockable | I Humanity First | Manual | pilot | implemented | `tests/architect-voice.test.mjs · next build` |
| `ARCH-02` | Versioned, revisioned, comparable — the R-CORE badge + version history on every surface | II R-CORE | Manual | pilot | verified | `tests/architect-rcore.test.mjs · tests/rcore-revisions.test.mjs · tests/traceability.test.mjs` |
| `ARCH-03` | One project file carries the home — save, reopen, export (BOM/BIM), nothing lost | III COMM | Manual | pilot | verified | `tests/architect-project-file.test.mjs · tests/architect-bom.test.mjs · tests/architect-bim.test.mjs` |
| `ARCH-04` | Plan and 3D walk tell ONE story — the walk crosses only real openings, collides with real walls | IV LINK | Manual | pilot | verified | `tests/architect-circulation.test.mjs · tests/architect-walk-nav.test.mjs · tests/architect-walk-collide.test.mjs · tests/architect-walk-rooms.test.mjs` |
| `ARCH-05` | Simulate the design on device — the 13-sim battery per model, deterministic + mobile-safe | V EDGE | Manual | pilot | verified | `tests/architect-sim-options.test.mjs · tests/architect-sim-environment.test.mjs · tests/architect-sim-mobile.test.mjs` |
| `ARCH-06` | Determinism: one canonical model, identical inputs → identical outputs (seed/serialize/round-trip) | VI SYNC / Replay | Manual | pilot | verified | `tests/architect-canonical-seed.test.mjs · architect-canonical-serialize · architect-canonical-ref · architect-canonical-package` |
| `ARCH-07` | One coordinate truth: the 3×3 house / 10×10 room grid; geometry from a single source | VII UCRS | Manual | pilot | verified | `tests/architect-geometry-source.test.mjs · tests/architect-one-source.test.mjs · tests/room-standard-layout.test.mjs` |
| `ARCH-08` | Bottom-up build order: the 12-ft shell envelope, phased, with the real MEP runs | VIII Rehearsal | Manual | pilot | verified | `tests/architect-build-instructions.test.mjs · tests/architect-voxel-proportion.test.mjs · tests/architect-phases.test.mjs · tests/mep-runs-stable.test.mjs` |
| `ARCH-09` | Honest money: ONE derived build cost shown against the target, never contradictory | IX Trust | Manual | pilot | verified | `tests/architect-one-cost-truth.test.mjs · tests/architect-house-truth.test.mjs · tests/architect-estimate.test.mjs · tests/architect-proforma.test.mjs` |
| `ARCH-10` | Human authority: the homeowner decides at each stage gate; nothing auto-advances | X Governance | Manual | pilot | verified | `tests/architect-stage-plan.test.mjs · tests/architect-phase-gate.test.mjs` |
| `ARCH-11` | Livability proven: the 900 ft² is a real home — connected ∧ lit ∧ functioned | XI SSSES | Manual | pilot | verified | `tests/architect-livability.test.mjs · tests/architect-circulation.test.mjs` |
| `ARCH-12` | Flywheel: a reusable asset library (named assets, GLB models) + BIM/BOM reuse | XII Flywheel | Manual | pilot | verified | `tests/architect-asset-registry.test.mjs · architect-asset-inventory · architect-asset-glb · architect-asset-glb-build` |
| `ARCH-13` | Every word in 33 languages; no machine voice on a human path | XIII Translation | Manual | pilot | implemented | `tests/lexicon-coverage.test.mjs · tests/architect-voice.test.mjs` |
| `ARCH-07.01` | Every room is walkable from the front door; the master suite is private + internally connected | VII UCRS | Manual | pilot | verified | `tests/architect-circulation.test.mjs` |
| `ARCH-07.02` | No asset overlaps another; nothing blocks a doorway — on place, move AND rotate | VII UCRS | Manual | pilot | verified | `tests/room-no-overlap.test.mjs` |
| `ARCH-07.03` | The nine seeded rooms hold a valid standard layout (every door centered, clearances kept) | VII UCRS | Manual | pilot | verified | `tests/room-standard-layout.test.mjs` |
| `ARCH-07.04` | A window prioritizes the room's OUTER exterior wall; openings re-map when a room moves | VII UCRS | Manual | pilot | verified | `tests/room-no-overlap.test.mjs (OBJ-1, F-V3)` |
| `ARCH-07.05` | Doors render with the standard swing symbol + width; sliding is an option where noise allows | VII UCRS | Manual | pilot | verified | `tests/door-convention.test.mjs` |
| `ARCH-04.01` | The walk crosses ONLY at a real placed opening; a solid wall where there is none | IV LINK | Manual | pilot | verified | `tests/architect-circulation.test.mjs (LIV-5) · tests/architect-walk-rooms.test.mjs` |
| `ARCH-04.02` | A rearranged saved layout HEALS its openings to walkable on load (good work never disturbed) | IV LINK | Manual | pilot | verified | `tests/architect-circulation.test.mjs (LIV-7)` |
| `ARCH-08.01` | The build viewport shows the 3D 12-ft shell envelope (10-ft clear + 2-ft plenum; STOREY_FT law unchanged) | VIII Rehearsal | Manual | pilot | verified | `tests/architect-geometry-source.test.mjs · tests/architect-voxel-proportion.test.mjs · tests/architect-cube-height.test.mjs` |
| `ARCH-08.02` | Electrical / plumbing / HVAC runs are stable + consistent across the plan and the walk | VIII Rehearsal | Manual | pilot | verified | `tests/mep-runs-stable.test.mjs · tests/architect-walk-mep.test.mjs · architect-walk-mep-rooms · architect-walk-mep-callsite` |
| `ARCH-09.01` | Overview + Master Readout show the DERIVED build cost vs the budget target as one non-contradictory pair | IX Trust | Manual | pilot | verified | `tests/architect-one-cost-truth.test.mjs · tests/architect-product-truth.test.mjs · tests/architect-consistency.test.mjs` |
| `ARCH-09.02` | Labor + vendor + code assumptions are declared, never invented | IX Trust | Manual | pilot | verified | `tests/architect-labor.test.mjs · tests/architect-vendors.test.mjs · tests/architect-codes.test.mjs` |
| `ARCH-11.01` | Daylight: every habitable room is lit (glazing ≥ 8% floor, IRC R303; borrowed light via a cased opening) | XI SSSES | Manual | pilot | verified | `tests/architect-livability.test.mjs` |
| `ARCH-11.02` | The 13-sim battery runs per design option (Structural · Wind · Flood · Fire · Quake · Thermal · Solar · Water · HVAC · Evac · Access · Carbon · Lifecycle) | XI SSSES | Manual | pilot | verified | `tests/architect-sim-options.test.mjs · tests/architect-sim-environment.test.mjs` |
| `ARCH-01.01` | No machine / dev / analytics word faces a person on a cleaned Architect surface (voice grows per surface) | I Humanity First | Manual | pilot | implemented | `tests/architect-voice.test.mjs` |
| `ARCH-12.01` | Placed assets wear real names; any selected element can be moved / rotated / mirrored / varied | XII Flywheel | Manual | pilot | verified | `tests/architect-asset-registry.test.mjs · tests/architect-asset-placement.test.mjs` |
| `ARCH-13.01` | Every Architect UI string is a lexicon key with a value in all 33 languages (staged English until native fill) | XIII Translation | Manual | pilot | implemented | `tests/lexicon-coverage.test.mjs` |

## Every row in full — the parents (sub-CRS follow the same shape)

### `ARCH-01` — Humanity-first product
| field | value |
|---|---|
| Input / Output | `ARCH-01.IN` (homeowner intent, plain words) → `ARCH-01.OUT` (one command shell, routeable, unlockable) |
| Vision • 2525 | § I — Humanity First |
| R-CORE mode | Manual |
| De-risk phase | pilot |
| Declared metric M | the cleaned surfaces carry no machine/dev/analytics vocabulary; the shell builds + routes |
| DTM target | `architect-voice` green for the cleaned-surface list; `next build` passes |
| Stretch | every Architect surface cleaned human-first; voice gate covers 100% of rendered copy |
| Verification | `tests/architect-voice.test.mjs · next build` |
| Status | **implemented** (voice coverage grows one surface at a time — see ARCH-01.01) |

### `ARCH-07` — One coordinate truth (UCRS)
| field | value |
|---|---|
| Input / Output | `ARCH-07.IN` (the 3×3 house seed) → `ARCH-07.OUT` (one geometry source drives plan + 3D + walk + BOM) |
| Vision • 2525 | § VII — UCRS |
| Declared metric M | `canonicalHouseTruth().roomCells` and `TINY_ROOM_LAYOUT` describe the same house; one source, no drift |
| DTM target | `architect-geometry-source` + `architect-one-source` + `room-standard-layout` green |
| Stretch | arbitrary floor plans (not only the seeded 3×3) under the same one-source law |
| Verification | `tests/architect-geometry-source.test.mjs · tests/architect-one-source.test.mjs · tests/room-standard-layout.test.mjs` |
| Status | **verified** |

### `ARCH-09` — Honest money (Trust)
| field | value |
|---|---|
| Input / Output | `ARCH-09.IN` (the derived section cost model) → `ARCH-09.OUT` (ONE cost shown vs target, everywhere, consistent) |
| Vision • 2525 | § IX — Trust |
| Declared metric M | Overview + Master Readout + HouseSpec all read `canonicalHouseTruth().costUsd`; no screen says "NOT CALCULATED" beside a figure |
| DTM target | `architect-one-cost-truth` + `architect-product-truth` + `architect-consistency` green |
| Stretch | live per-option cost deltas from the 13-sim battery |
| Verification | `tests/architect-one-cost-truth.test.mjs · tests/architect-house-truth.test.mjs · tests/architect-proforma.test.mjs` |
| Status | **verified** |

### `ARCH-11` — Livability proven (SSSES)
| field | value |
|---|---|
| Input / Output | `ARCH-11.IN` (the placed 900 ft² layout) → `ARCH-11.OUT` (headline "900 ft² · 1 bed · 1 bath · livable" only when connected ∧ lit ∧ functioned) |
| Vision • 2525 | § XI — SSSES |
| Declared metric M | livable predicate holds: every room reachable, every habitable room lit (glazing ≥ 8% floor), every room functioned |
| DTM target | `architect-livability` + `architect-circulation` green; headline suppressed until predicates pass |
| Stretch | per-climate daylight + thermal livability, not only IRC R303 glazing |
| Verification | `tests/architect-livability.test.mjs · tests/architect-circulation.test.mjs` |
| Status | **verified** |

### `ARCH-13` — Every word in 33 languages (Translation)
| field | value |
|---|---|
| Input / Output | `ARCH-13.IN` (each rendered string) → `ARCH-13.OUT` (a lexicon key with a value in all 33 languages) |
| Vision • 2525 | § XIII — Translation |
| Declared metric M | every Architect UI string resolves via `t()`; `lexicon-coverage` green (staged English until the native fill) |
| DTM target | `lexicon-coverage` 0 failed; no hardcoded English on an Architect human path |
| Stretch | the ×32 native-speaker fill lands for all staged Architect keys; AFTER_FILL for Architect → 0 |
| Verification | `tests/lexicon-coverage.test.mjs · tests/architect-voice.test.mjs` |
| Status | **implemented** (staged English; native fill owed — see ARCH-13.01) |

## Alignment notes (UX ⇄ CRS)
- **Verification is the architect gate battery** (79 gates under `frontend/tests/architect-*`, `room-*`, `mep-*`,
  `door-convention`, `lexicon-coverage`). A requirement is `verified` only when its named gate is green on the live SHA.
- **Open alignment items** (tracked, `implemented` not yet `verified`): ARCH-01 / ARCH-01.01 — `architect-voice`
  cleaned-surface coverage GROWS one surface at a time, so the human-voice law is proven only for cleaned surfaces;
  ARCH-13 / ARCH-13.01 — Architect strings are staged English in `AFTER_FILL`, awaiting the ×32 native-speaker fill
  (barred until the English UI is HI-final per CLAUDE.md "NO TRANSLATION FILL BEFORE ENGLISH FINAL").
- **VOC (voice-of-customer) ties** (operator rulings already shipped): livable 900 ft² (ARCH-11), walkable house +
  centered doors (ARCH-07.01/.03), 12-ft shell (ARCH-08.01), calculated-vs-target cost (ARCH-09.01), sliding door
  option (ARCH-07.05), exterior-wall windows (ARCH-07.04), heal-on-load (ARCH-04.02).
