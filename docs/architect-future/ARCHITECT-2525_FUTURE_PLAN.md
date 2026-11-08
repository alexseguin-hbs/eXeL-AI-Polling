# ARCHITECT-2525 / FUTURE

**Complete greenfield architecture · Original CRS · Future CRS · Claude Code execution plan**

| | |
|---|---|
| Date | 2026-11-08 |
| Authority | H.I. Thought Master |
| Coordinator | Master of Thought (MoT) |
| Executor | Claude Code |
| Future route | `/Architect-2525/future` |
| Legacy reference route | `/Architect-2525/` |
| Execution state | **PHASE 0 / HOLD FOR IMPLEMENTATION** |
| Architecture mode | **GREENFIELD REBUILD** |
| Plan revision | **R1** (R0 = the operator's MoT final plan, kept verbatim in `source/`) |
| This file | `docs/architect-future/ARCHITECT-2525_FUTURE_PLAN.md` — the one plan of record |

> Humanity decides. Technology assists. R-CORE remembers. SPIRAL verifies. SSSES qualifies. Trust must be proven.

---

## 0 · How to use this document — the external feedback path

- **This file is the plan of record.** Grok, eXeL AI, DeepSeek and every future Claude Code version read the plan here,
  on `main`. It always carries the current revision; every past revision is kept unchanged in `history/`.
- **The operator's own words are kept verbatim** in `docs/architect-future/source/` with a sha256 sidecar. Where this
  file and the verbatim source differ, the source wins unless a later H.I. decision says otherwise.
- **To give feedback**, add one file: `docs/architect-future/feedback/YYYY.MM.DD_HH.MM..SS_<reviewer>_<topic>.md`
  (CST, stamp taken when written). Name the section (§) or requirement (CRS/FCRS/T-id) you are attacking, give
  repository evidence as `path:line`, and end with APPROVE / APPROVE WITH CHANGE / HOLD. Do not edit this plan to record
  feedback.
- **MoT folds accepted feedback into a new revision** (R2, R3 …), logs it in §41, and snapshots the old revision in
  `history/`. H.I. accepts or rejects each revision.

---

## 1 · Purpose and governing method

Build Architect-2525/Future as a **new product**, not a repaired version of the current Architect route. The current
`/Architect-2525/` is kept as historical evidence, donor material, a comparison baseline and a rollback reference. It is
not the foundation of Future.

```
PAST FAILURE → EVIDENCE → ARCHITECTURAL CONSTRAINT → SCHEMA / TYPE / FIREWALL / TEST → ADVERSARIAL REVIEW → HUMAN ACCEPTANCE
```

A past mistake is not removed from history. It is converted into a constraint that stops it from returning.

## 2 · The binding repository finding

**The legacy 10-ft grid is not the physical geometry of the Future 36-ft house.** The legacy seed is historical
evidence. The Future house is a new canonical project with new physical coordinates, new canonical identity, explicit
provenance and replay.

## 3 · Starting rules

- Do not patch the current Architect interface into Future.
- Do not copy the existing screen and rename it.
- Do not begin with a Layer Tree, cost card, ratings panel or asset catalog.
- **Begin with the human.** The first design questions are: What are you creating? Who will use it? What must it do?
  What matters most? What constraints exist? What is known? What remains an assumption?

## 4 · Success criterion and the one canonical project

Future succeeds when a person can design a home naturally while the architecture underneath stays deterministic,
replayable, evidence-aware and human-governed. There is **one canonical project**. Plan, 3D, Walk, Simulate, Review,
Health and Replay are projections over it. **No projection owns its own copy of truth.**

## 5 · Legacy and Future roles

| Legacy `/Architect-2525/` | Future `/Architect-2525/future` |
|---|---|
| donor · reference · failure evidence · rollback baseline | new product · new domain model · new canonical state · new human experience |

Legacy may contribute evidence, tested utilities, reference data and failure lessons — **nothing automatically**.
Every donor is classified **SHARED_STABLE · FUTURE_OWNED · LEGACY_ONLY · DO_NOT_IMPORT**.

**DO_NOT_IMPORT** — Future may not import these directly or indirectly (including through a barrel file):

```
frontend/lib/architect-house-truth.ts
frontend/lib/architect-sim-options.ts
frontend/lib/architect-estimate.ts
frontend/lib/architect-wall-system.ts
frontend/components/architect-2525/house-spec.tsx
frontend/components/architect-2525/command-ux1.tsx
frontend/components/security-2525/mission-planning.tsx
```

An executable import-boundary test (T-IMPORT-BAN) fails if any Future file reaches one of them. Its scope is
`frontend/lib/architect-future/**`, `frontend/components/architect-future/**` **and the route
`frontend/app/Architect-2525/future/**`**.

**Donor candidates** (never copied just because they exist; consumed only through Future-owned adapters):
`canonical/serialize.ts` · `canonical/rcore.ts` · `canonical/units.ts` · `canonical/runtime.ts` · `canonical/package.ts`
(all under `frontend/lib/architect-2525/canonical/`) · `seeds/tiny-home-v1.ts` (READ ONLY) · `architect-labor.ts` ·
`use-rcore-gestures.ts` · `rcore-gestures.ts` · `feedback-artifact.mjs` · `arch-decision.mjs`. Real paths and purity
are recorded in `SOURCE_REUSE_DISPOSITION.md` (§40 lists what verification found).

## 6 · The legacy seed and the V1 → V2 transformation

`frontend/lib/architect-2525/seeds/tiny-home-v1.ts` is **immutable**. Its `x_um` / `y_um` are the minimum corner of a
clear 10-ft room on a 10-ft grid (seed lines 9–10, 39–59: nine 3,048,000 µm spaces at a 3,048,000 µm pitch). They are
**not** the outer corner of a 12-ft module, and Future must not reinterpret them.

```
IMMUTABLE LEGACY V1 (source hash H0) → explicit reference transformation → NEW FUTURE V2 PROJECT (target hash H1)
```

Only semantic information transfers from V1: bay identity · room name · room function · wet/dry classification ·
approved program metadata. **Physical geometry is regenerated.**

## 7 · Future V2 geometry

```ts
interface SpaceEntityV2 {
  entity_id: string;
  entity_type: 'SPACE';
  bay_code: string;
  outer_x_um: number;
  outer_y_um: number;
  z_um: number;
  outer_width_um: number;
  outer_depth_um: number;
  clear_width_um: number;
  clear_depth_um: number;
  wall_zone_thickness_um: number;
}
```

| Locked reference | Value |
|---|---|
| Outer module | 12 ft = 3,657,600 µm |
| Clear room | 10 ft = 3,048,000 µm |
| Reserved perimeter wall/service zone | 1 ft = 304,800 µm |
| Invariant | `outer_width = clear_width + 2 × wall_zone_thickness` (same for depth) |
| Outer-module origins (3×3) | 0 · 12 · 24 ft |
| Clear-room origins | 1 · 13 · 25 ft |
| Shell | 36 × 36 ft [DERIVED] |
| Gross | 1,296 ft² [DERIVED] |
| Clear program | 900 ft² [DERIVED] |
| Difference | 396 ft² [DERIVED] |

These are Future truths. They are **not** inserted retroactively into V1.

## 8 · Service zone ≠ wall assembly

The 1-ft value is the reserved perimeter wall/service zone. It is **not** a statement that the structural wall is
12 inches thick. Wall assemblies are modelled separately:

```ts
interface WallAssembly {
  wall_id: string;
  space_id: string;
  side: 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';
  method: 'FRAME' | 'PRINT' | 'OTHER';
  actual_assembly_thickness_um?: number;
  evidence_state: 'ASSUMED' | 'REFERENCE' | 'DERIVED' | 'QUALIFIED';
}
```

This prevents `SERVICE ZONE = STRUCTURAL WALL THICKNESS` from becoming another mixed-truth failure.

## 9 · The project root

```ts
interface ArchitectProjectV2 {
  schema_version: 2;
  project_id: string;
  revision_id: string;
  intent: HumanIntent;
  site: SiteDefinition | null;
  spaces: SpaceEntityV2[];
  wall_assemblies: WallAssembly[];
  openings: OpeningDefinition[];
  assets: PlacedAsset[];
  construction: ConstructionScenario;
  economics: ProjectEconomics;
  references: ReferenceClaim[];
  design_targets: DesignTarget[];
  qualifications: ProjectQualification[];
  assumptions: AssumptionRecord[];
  authority: AuthorityState;
  provenance: ProjectProvenance;
}
```

All views derive from this object.

## 10 · Serialization and hash

Future has its own canonical serialization and hash rules (`serialize-v2.ts`, `hash-v2.ts`).

| The V2 hash INCLUDES | The V2 hash EXCLUDES |
|---|---|
| physical geometry · space metadata · wall/service zones · wall assemblies · openings · canonical asset placements · construction method · design targets · authority state · canonical assumptions · project-defining human intent | camera · orbit · zoom · hover · selection · drawer state · active tab · viewport · temporary armed tool · animation state · temporary display state |

| Action | Hash |
|---|---|
| initial canonical project | H0 |
| orbit · select room · arm sofa | H0 |
| place canonical sofa | H1 |
| rotate canonical sofa | H2 |
| save · reload | H2 |
| change canonical wall/service-zone geometry | H3 |

There is no global "H0 stays stable" rule. Render-only behaviour preserves the hash; canonical edits change it.

## 11 · The reference transformation

File: `frontend/lib/architect-future/transformation/reference-v1-to-v2.ts`. It is pure, deterministic, free of hidden
random or current-time canonical values, and never mutates V1. Same V1 + same profile → same V2 output and hash.

The **transformation profile** records: reference identity · 12-ft outer pitch · 10-ft clear dimension · 1-ft reserved
zone · coordinate transformation rules · assumptions. Provenance is an explicit event (never an overloaded legacy event):

```ts
interface ProjectTransformedFromV1Event {
  event_type: 'PROJECT_TRANSFORMED_FROM_V1';
  source_project_hash: string;
  target_project_hash: string;
  transformation_profile_id: string;
  assumptions: string[];
  actor: ActorRef;
  occurred_at: string;
}
```

## 12 · Future R-CORE event vocabulary

`PROJECT_CREATED` · `PROJECT_TRANSFORMED_FROM_V1` · `INTENT_CHANGED` · `SPACE_CHANGED` · `WALL_ASSEMBLY_CHANGED` ·
`OPENING_ADDED` · `OPENING_CHANGED` · `OPENING_REMOVED` · `ASSET_PLACED` · `ASSET_MOVED` · `ASSET_ROTATED` ·
`ASSET_REMOVED` · `CONSTRUCTION_METHOD_CHANGED` · `ASSUMPTION_ADDED` · `DESIGN_TARGET_CREATED` ·
`DESIGN_TARGET_REVISED` · `SIMULATION_RUN` · `PLAN_SUBMITTED` · `PLAN_REVIEWED` · `PLAN_APPROVED` ·
`QUALIFICATION_ATTACHED` · `REVISION_CREATED`.

The legacy five-event union (`SEED_R0, EDGE_RESIZE, FUNCTION_CHANGE, WET_CHANGE, PLAN_APPROVED`,
`frontend/lib/architect-2525/canonical/types.ts:150-152`) is not preserved merely because it exists. If Future wants
canonical asset placement, R-CORE must be able to represent it. Not every UI interaction is an event.

## 13 · Actors and human authority

```ts
type ActorRef = AuthenticatedHumanActor | UnauthenticatedHumanActor | SystemActor;
```

| An unauthenticated human MAY | Requires an AUTHENTICATED human |
|---|---|
| draft · plan · place · move · simulate · save a draft · establish design intent · set a design target | approve · qualify · declare build-ready · sign professional evidence |

Invalid states: `approved_by = unknown`, `qualified_by = unknown`. No AI component may promote `SUBMITTED → APPROVED`
or `APPROVED → BUILD READY`.

## 14 · Human intent comes first

```ts
interface HumanIntent {
  project_type: 'CUSTOM_RESIDENCE';
  occupants?: number;
  needs: string[];
  accessibility_needs: string[];
  priorities: string[];
  construction_preference: 'UNDECIDED' | 'FRAME' | 'PRINT';
  budget_intent?: { amount_usd: number; authority: 'USER_STATED' };
}
```

A budget the human enters is shown as **USER STATED · NOT AN ESTIMATE** and never becomes cost authority.

## 15 · Navigation and the planning workspace

- **Primary navigation:** OVERVIEW · PLAN · DESIGN · SYSTEMS · SIMULATE · REVIEW · BUILD · HEALTH · REPLAY.
  Technical hierarchy lives behind **ADVANCED / CAD**.
- **Desktop:** LEFT Vision Tree · CENTER Planning Canvas · RIGHT Active Elements · SUPPORTING Design Draft.
- **Mobile:** Planning Canvas primary; Vision Tree and Active Elements are drawers. No desktop sidebar stack on phones.
- **Vision Tree** is a human planning tool, construction-ordered, buildable/placeable items only — e.g. Site ·
  Foundation · Structure · Envelope · Openings · Systems · Fixtures · Furniture · Exterior. It is not a BIM/debug
  hierarchy. If H.I. keeps a technical Layer Tree, it lives in Advanced/CAD.

## 16 · Placement, Security-2525 lessons, mobile 3D

```
TAP ITEM → ARM → TAP VALID LOCATION → ONE CANONICAL PLACEMENT → DISARM
```

Invariant: **one arm → at most one placement → disarm.** Placement goes through canonical state and R-CORE; never mutate
renderer objects and later pretend they were project state.

**Security-2525 contributes patterns, not state:** planning discipline · arm/place behaviour · left-centre-right
information architecture · mobile gesture lessons. Future must not import mission semantics, threat state, drone state,
`mission-planning.tsx` or Security domain schemas. **Pattern yes. Domain state no.**

**Mobile 3D contract (behaviour):** one-finger movement orbits the 3D model without accidentally panning the planning
surface. Donor flags such as `pan: false` / `touchOrbit: true` are implementation details, not the contract.

## 17 · One state, many projections

Plan, 3D and Walk consume the same semantic project. A placed object has one identity:

```ts
interface PlacedAsset {
  instance_id: string;
  asset_id: string;
  space_id: string;
  position_um: { x: number; y: number; z: number };
  rotation_deg: number;
  authority: 'ILLUSTRATIVE' | 'USER_SELECTED';
}
```

Never serialize mesh copies into canonical state — store semantic identity and transform.

## 18 · Construction method and material take-off

`type ConstructionMethod = 'UNDECIDED' | 'FRAME' | 'PRINT';` — changing it changes the project and emits a canonical
event. Take-off branches by method: FRAME shows the frame take-off; PRINT must **not** keep showing
"2×6 studs @ 16″ o.c." as current construction truth. Every quantity carries construction method · calculation ·
source · evidence state.

## 19 · Economics

**Four independent domains:** `BaselineBuildEstimate` · `ProjectLaborCost` · `GlobalRecognition` · `LocalSettlement`.
A generic "Project Cost" label is prohibited wherever it could mean more than one of them.

**Baseline Build Estimate** — the repository-evidenced illustrative source sections (rows ASSUMED / ILLUSTRATIVE
BASELINE; total DERIVED; not a quote):

| Section | USD |
|---|---:|
| Site Work | 23,000 |
| Foundation | 33,000 |
| Wall System | 48,000 |
| Roof | 17,000 |
| Plumbing | 21,000 |
| Electrical | 18,000 |
| HVAC | 16,000 |
| Drywall | 14,000 |
| Interior Finish | 40,000 |
| Landscaping | 10,000 |
| **Total** | **240,000** |

- Display rollups are allowed and labelled **DERIVED DISPLAY ROLLUP** — e.g. MEP = Plumbing + Electrical + HVAC =
  $55,000 — without replacing the source taxonomy. No canonical "Finish = Site Work + …" group (not what the evidence
  shows).
- Net metric: $240,000 ÷ 900 ≈ **$267 / net ft²**, DERIVED from an ASSUMED baseline — not a market benchmark.
- **Labour** uses shared logic through `frontend/lib/architect-future/adapters/labor.ts` wrapping the audited real
  functions in `frontend/lib/architect-labor.ts`: `recognitionU` (:88) · `projectLaborCost` (:179) · `projectHeadline`
  (:194) · `settlementComparison` (:207). Its local `EvidenceState` (:37) is aliased **`LaborEvidenceState`** and never
  merged with Future evidence types.
- **The firewall is architectural.** Jurisdiction may change `LocalSettlement` only — never `BaselineBuildEstimate`,
  `ProjectLaborCost` or `GlobalRecognition`. Enforced by types, controlled APIs, selectors and runtime tests — not labels.
- **Benchmarks are separate axes:** wall-system benchmark ($/wall ft²) · national wall benchmark ($/wall ft²) ·
  Baseline Build Estimate (total USD) · net build metric ($/net floor ft²). No UI may imply `$34 × something = $240,000`
  unless verified evidence establishes that calculation.

## 20 · References, targets, qualifications

Three records — never one mutable ratings object: **ReferenceClaim · DesignTarget · ProjectQualification**.

- **ReferenceClaim** = external evidence; a reference stays a reference. If its source cannot be verified it is
  **UNVERIFIED** and either stays off the primary route or is shown visibly as unverified provenance.
  "ICON reference deck received 2026-11-02" means received on that date — not that the source is dated 2026-11-02.
- **DesignTarget** — created when the user picks "Set as design target"; never mutates the ReferenceClaim; carries human
  actor · timestamp · target value · source reference ID where applicable.
- **ProjectQualification** — requires project-specific evidence · qualified value · `qualified_at` · authenticated
  `qualified_by`. A heuristic score can never produce PASS or QUALIFIED.

## 21 · Project Health and the evidence vocabulary

Project Health derives from canonical selectors. Categories: TRUTH · GEOMETRY · ASSETS · SYSTEMS · AUTHORITY ·
ECONOMICS · SIMULATION · REPLAY · PERFORMANCE · MOBILE. It may report problems; it may not hold competing truth.

General evidence vocabulary: **USER_STATED · ASSUMED · REFERENCE · DERIVED · QUOTED · QUALIFIED · NOT_CALCULATED ·
UNVERIFIED.** Domains may use narrower unions. A consequential number without an evidence state is a defect.

## 22 · Greenfield source structure

```
frontend/
├── lib/architect-future/
│   ├── domain/          project · intent · geometry · walls · openings · assets · construction · economics · ratings · actors · evidence
│   ├── state/           project-store · placement-machine · authority-machine
│   ├── rcore/           events · replay · revisions
│   ├── serialization/   serialize-v2 · hash-v2
│   ├── transformation/  reference-v1-to-v2
│   ├── selectors/       geometry · economics · ratings · health
│   ├── simulation/      costs · materials · compare
│   └── adapters/        legacy-v1 · labor · gestures · feedback
└── components/architect-future/
    intent · vision-tree · planning-canvas · active-elements · design-draft · projections · systems · simulate · review · health · replay · advanced
```

No legacy screen is copied. Only `adapters/` may import donor modules.

## 23 · Governance

**The 12 AsM persona lenses** (review lenses and simulation identities — never an authority over H.I.):

| AsM | Lens |
|---|---|
| Enki | systems integration / physical coherence |
| Thor | risk / failure modes / unknowns |
| Odin | replay / continuity / long-horizon state |
| Athena | logic / contradiction / traceability |
| Krishna | human interaction / planning flow |
| Enlil | determinism / computation / state discipline |
| Sofia | human-centred language / accessibility |
| Aset | evidence / provenance / drift |
| Pangu | greenfield architecture / structural creation |
| Christo | human consequence / dignity / simplicity |
| Thoth | arithmetic / hash / exactness / reconciliation |
| Asar | completeness / synthesis / closure |

**48-seat model:** 12 MoT coordinator seats + 36 specialist seats = 48. The 36 form 12 review cells of **Builder ·
Adversary · Voter**, each through one AsM lens. H.I. is the human authority above the fleet and is not a seat. No
execution owner performs final self-qualification.

**Phase-boundary simulation** (no "Cube" terminology needed):

```
AUTOMATED TESTS → BUILDER EVIDENCE → ADVERSARY ATTACK → VOTER REVIEW → AsM PHASE SIMULATION → SSSES REVIEW → MoT SYNTHESIS → H.I. REVIEW WHERE REQUIRED
```

**Source authority order:** 1 H.I. explicit decision · 2 Final Future CRS + Schema Lock · 3 Verified repository evidence ·
4 eXeL doctrine contracts · 5 Future implementation evidence · 6 Audited donor behaviour · 7 Legacy UI behaviour as
historical evidence only. If legacy contradicts Future, Future wins — unless repository constraints make the Future
contract impossible.

## 24 · Two requirement layers

| ID | Layer | Status |
|---|---|---|
| `CRS-##` | ORIGINAL CRS | historical requirement baseline |
| `FCRS-##` | FUTURE GREENFIELD CRS | binding implementation authority |

The Original CRS is never silently rewritten to look as if it always held the corrected architecture — that would
destroy design-history evidence. Persisted as `docs/architect-future/00_ORIGINAL_CRS_PHASE_PLAN.md`,
`01_FUTURE_CRS.md`, `02_CRS_CHANGE_MAP.md`.

## 25 · ORIGINAL CRS & PHASE PLAN (historical baseline)

> **STATUS: HISTORICAL BASELINE — NON-BINDING FOR GREENFIELD IMPLEMENTATION.**
> Preserves the exact requirement model that existed before repository audit and architecture adjudication.
> **DO NOT MODIFY TO MATCH FUTURE.**

| CRS | Original requirement | Original need / note |
|---|---|---|
| CRS-01 | The fourteen doctrine files plus three execution artifacts published and signed so pods cannot invent schemas. | One source of truth for design doctrine. "No pod writes a type until MoT publishes it." |
| CRS-02 | Five red-first tests: T-HASH-VIEW · T-FIREWALL · T-COST · T-RATINGS · T-SEAM. | Test-first discipline. "A test that passes on the stub is theater." |
| CRS-03 | Coordinate identity locked as `x_um / y_um` = outer-module minimum corner, OR `outer_x_um / outer_y_um` if legacy differs. | No silent geometry ambiguity. "Coordinate meaning is a schema act, not a pod decision." |
| CRS-04 | A 12-ft outer / 10-ft inner / 1-ft wall geometry view computed from `width_um = 3,048,000` without altering the canonical hash. | "The seed is not edited. The view is computed." |
| CRS-05 | `tiny-home-v1.ts` read-only; a deterministic `migrate-v1-to-v2.ts` produces a v2 seed with provenance. | "Same v1 input always produces same v2 output." |
| CRS-06 | R-CORE event types unchanged in Phase 1: SEED_R0 · EDGE_RESIZE · FUNCTION_CHANGE · WET_CHANGE · PLAN_APPROVED. | "No new event types. OpeningDefinition, WallAssembly do not enter the union yet." |
| CRS-07 | Four distinct economic types: BaselineBuildEstimate · ProjectLaborCost · GlobalRecognition · LocalSettlement. | Prevent the two-totals bug. "The words Project Cost are banned as a generic label." |
| CRS-08 | Canonical ribbon shows "Project Cost · NOT CALCULATED"; the estimate sits behind "ESTIMATE · NOT THE PROJECT". | "The old page taught the sofa-save. Future cannot." |
| CRS-09 | Foundation $33,000 · Wall System $48,000 · Roof $17,000 · MEP $55,000 · Finish $87,000 = $240,000; Finish = Site $23,000 + Drywall $14,000 + Interior $40,000 + Landscape $10,000. | "No invented Other row. Site Work is a member of Finish, not a hidden row." |
| CRS-10 | `architect-labor.ts` imported in place, not copied, with projectHeadline · projectLaborCost · settlementComparison · recognitionU, and `EvidenceState → LaborEvidenceState`. | "Reuse in place, no fork." |
| CRS-11 | Type-level firewall: `SettlementRef[]` cannot be assigned to projectHeadline input. | "A type violation would be a compile error." |
| CRS-12 | Vision Tree · Planning Canvas · Active Elements with arm → tap → place. | "Copy the pattern. Do not import mission-planning.tsx." |
| CRS-13 | Auto-disarm: tap arm · tap place · tool disarms. | — |
| CRS-14 | One-finger orbit, assuming `pan: false`. | "Copy the pattern, not the file." |
| CRS-15 | Nine seed names visible on the first viewport; excluded 240,000 · 1,296 · 36 · R-22 · 2×4 · Layer Tree. Empty state: "Tap a room. Nothing you tap changes the project." | — |
| CRS-16 | Ratings (R-22, fire, wind, termite, mold, flood) move off the project card onto a reference sheet "REFERENCE · ICON deck 2026-11-02". | "The word QUALIFIED never appears in Phase 4." |
| CRS-17 | ReferenceClaim · DesignTarget · ProjectQualification via a RatingDisplay discriminated union so `{ claim_type: 'QUALIFIED', qualification_evidence: undefined }` fails TypeScript. | — |
| CRS-18 | ICON wall benchmark $34 / wall ft² and baseline estimate $240,000 on separate axes. | "No arithmetic connects them until Grok establishes one." |
| CRS-19 | The seven-step seam at 375 · 428 · 768 · 1200, with "hash H0 stable · no sofa-save". | "Any step fails → whole seam fails." |
| CRS-20 | One HTML feedback artifact + paired JSON per Phase: REAL CAPTURE · WHAT · WHERE · TEST · PROOF · RISK · verdict · SAVE JSON. | The human role is design judgment, not QA. |

**Original Phase sequence:** P0 Doctrine + Schema Lock · P1 Canonical Geometry + R-CORE · P2 Economic Domains ·
P3 Human Planning UX · P4 Assembly Compare + Benchmarks · P5 Convergence + Human Acceptance.

**Original team vocabulary:** PA Product Authority / Thought Master · MOT Master of Thought / Claude Code · ADV Adversary
Pod Lead / Grok · VOT Voter Pod Lead / eXeL AI · POD-A Canonical Geometry · POD-B Labor / Firewall · POD-C Security-2525
UX Parity · POD-D Assembly Compare · SUPA Supabase / R-CORE persistence · CF Cloudflare / deployment.

**Original MVP structure:** MVP 0 / POC = Phase 0 (doctrine signed, five red tests failing, scaffold compiles) ·
MVP 1 / Alpha = Phases 1 + 2 (geometry, R-CORE, economic domains, estimate) · MVP 2 / Beta = Phases 3 + 4 (human
planning, reference sheet, rating records) · MVP 3 / Production = Phase 5 (full seam, feedback, H.I. acceptance).

**Original planning estimate:** Frontend 21 · Backend 25 · AI 16 · DevOps 2 = **64 man-days** — retained as ORIGINAL
PLANNING ESTIMATE, NOT CURRENT SCHEDULE AUTHORITY.

**Original assumptions (unchanged):**
A.01 `x_um / y_um` mean outer-module minimum corner, or a two-field schema is adopted ·
A.02 `tiny-home-v1.ts` is preserved as-is ·
A.03 The four economic types have no overlapping fields ·
A.04 `architect-labor.ts` exports projectHeadline, projectLaborCost, settlementComparison, recognitionU ·
A.05 its EvidenceState is aliased as LaborEvidenceState ·
A.06 Roof = $17,000 from `architect-estimate.ts` ·
A.07 The five-row card exists only behind "ESTIMATE · NOT THE PROJECT" ·
A.08 The canonical ribbon always shows NOT CALCULATED ·
A.09 Ratings live on a separate reference sheet ·
A.10 QUALIFIED is banned from Phase 4 tests ·
A.11 QUALIFIED without qualification evidence is a TypeScript error ·
A.12 The seven-step seam is binary at all four viewports ·
A.13 Empty-state copy: "Tap a room. Nothing you tap changes the project." ·
A.14 No sofa-save, no wall tool, no opening tool in Phases 0–5 ·
A.15 The deployment gate is separate from the Phase 0 design gate.

**Original design-change lineage:** DC.001 Phase 0 doctrine + schema lock initial publish · DC.002 five red tests
written · DC.003 coordinate identity contract · DC.004 geometry view · DC.005 deterministic migration · DC.006 R-CORE
event types unchanged · DC.007 four economic domains · DC.008 ribbon NOT CALCULATED / estimate separate · DC.009
five-row cost reconciliation · DC.010 labor imports / EvidenceState alias · DC.011 firewall · DC.012 Vision Tree /
Canvas / Active Elements · DC.013 auto-disarm · DC.014 one-finger orbit · DC.015 first viewport · DC.016 ratings
reference sheet · DC.017 three rating records · DC.018 benchmark separation · DC.019 four-viewport seam · DC.020 feedback
artifacts. These are never retroactively edited to make the original architecture look more correct than it was.

## 26 · FUTURE GREENFIELD CRS (binding)

| FCRS | Requirement |
|---|---|
| FCRS-01 | Human authority stays final; AI cannot approve, qualify or declare build-ready. |
| FCRS-02 | Every consequential value and state carries evidence and provenance. |
| FCRS-03 | The Future dependency boundary rejects DO_NOT_IMPORT legacy modules. |
| FCRS-04 | Legacy V1 stays immutable historical evidence. |
| FCRS-05 | Future V2 is created by explicit reference transformation, not a visual overlay. |
| FCRS-06 | Future physical geometry encodes 12-ft outer / 10-ft clear / 1-ft reserved wall-service zone. |
| FCRS-07 | Canonical physical geometry participates in V2 identity and hash. |
| FCRS-08 | Render/view state stays outside canonical identity. |
| FCRS-09 | Future R-CORE replays canonical project history. |
| FCRS-10 | Human Intent precedes asset selection. |
| FCRS-11 | Vision Tree, Planning Canvas, Active Elements and Design Draft are the primary planning UX. |
| FCRS-12 | Tap → Arm → Tap → Place → Disarm is the primary placement primitive. |
| FCRS-13 | One arm creates at most one placement. |
| FCRS-14 | Saved canonical asset placement persists and alters canonical identity. |
| FCRS-15 | Plan, 3D and Walk consume the same semantic state. |
| FCRS-16 | Mobile planning works at 375 px. |
| FCRS-17 | Mobile planning works at 428 px. |
| FCRS-18 | Adaptive tablet behaviour at 768 px. |
| FCRS-19 | Full planning workspace at 1200 px. |
| FCRS-20 | Construction method is canonical. |
| FCRS-21 | Material take-off branches correctly by construction method. |
| FCRS-22 | BaselineBuildEstimate uses the evidenced illustrative source rows. |
| FCRS-23 | ProjectLaborCost stays a distinct economic domain. |
| FCRS-24 | GlobalRecognition stays distinct. |
| FCRS-25 | LocalSettlement stays distinct. |
| FCRS-26 | Jurisdiction changes cannot mutate unrelated economic domains. |
| FCRS-27 | No generic "Project Cost" label where multiple economic meanings are possible. |
| FCRS-28 | Benchmarks stay separate axes. |
| FCRS-29 | ReferenceClaim stays separate from DesignTarget. |
| FCRS-30 | DesignTarget stays separate from ProjectQualification. |
| FCRS-31 | ProjectQualification contains project-specific evidence. |
| FCRS-32 | Qualification has authenticated human authority. |
| FCRS-33 | Submit, Review and Approve are distinct authority states. |
| FCRS-34 | Project Health derives from canonical state. |
| FCRS-35 | Every Phase receives automated proof before H.I. review. |
| FCRS-36 | Every Phase produces capture-based human feedback artifacts. |
| FCRS-37 | The complete seam is binary PASS/FAIL at all four required viewports. |
| FCRS-38 | Future builds independently of legacy UI before cutover. |
| FCRS-39 | GitHub, Supabase and Cloudflare authority are explicitly verified before deployment/cutover. |
| FCRS-40 | H.I. remains the final design and release gate. |

## 27 · CRS change map (Original → Future)

| Original | Disposition | Why |
|---|---|---|
| CRS-01 | structure superseded · intent preserved | — |
| CRS-02 | expanded test architecture | — |
| CRS-03 | rejected and replaced | legacy x/y are clear-grid coordinates |
| CRS-04 | rejected and replaced | canonical V2 physical geometry must affect the hash |
| CRS-05 | rebuilt as explicit reference transformation | — |
| CRS-06 | rejected | Future requires a richer replayable event vocabulary |
| CRS-07 | refined | shared field names are not the real risk |
| CRS-08 | label rejected | "Project Cost" is ambiguous |
| CRS-09 | source model replaced with the ten evidenced baseline rows | — |
| CRS-10 | intent preserved behind a Future adapter | — |
| CRS-11 | strengthened to types + APIs + selectors + runtime firewall | — |
| CRS-12 | preserved and extended with Design Draft | — |
| CRS-13 | strengthened to one arm → at most one placement → disarm | — |
| CRS-14 | refined — human behaviour is the contract; flags are implementation detail | — |
| CRS-15 | refined — first-view hierarchy separated from truth doctrine | — |
| CRS-16 | corrected — received date distinguished from source date | — |
| CRS-17 | replaced with three independent records | — |
| CRS-18 | preserved and strengthened | — |
| CRS-19 | replaced — render state preserves the hash; canonical saved edits change it | — |
| CRS-20 | preserved behind the Future feedback adapter | — |

## 28 · Design traceability matrix (DTM) row contract

Every row carries: FCRS ID · Original CRS lineage (if any) · human need · past failure prevented · repository evidence ·
owner · design input · design output · binary acceptance · automated test · adversarial review · SSSES review · human
decision where required · design change ID. **No requirement transfers without measurable acceptance.**

## 29 · Phase 0 artifacts and limits

All under `docs/architect-future/`: `00_ORIGINAL_CRS_PHASE_PLAN.md` · `01_FUTURE_CRS.md` · `02_CRS_CHANGE_MAP.md` ·
`FUTURE_DOCTRINE.md` · `ARCHITECTURE.md` · `SCHEMA_LOCK.md` · `LEGACY_BOUNDARY_AND_TRANSFORM.md` ·
`HASH_AND_SERIALIZATION.md` · `RCORE_EVENTS_AND_REPLAY.md` · `ACTOR_AND_AUTHORITY.md` · `HUMAN_INTENT_AND_UX.md` ·
`ECONOMIC_AND_MATERIALS.md` · `RATINGS_AND_BENCHMARKS.md` · `TEST_AND_SEAM_SPEC.md` · `CUTOVER_AND_RESOURCE_GATE.md` ·
`SOURCE_REUSE_DISPOSITION.md` · `PARALLEL_LANES.md` · `DESIGN_TRACEABILITY_MATRIX.md` · `TEST_REGISTRY.md` ·
`FEEDBACK_AND_RELEASE.md` (20 files).

| Phase 0 MAY create | Phase 0 may NOT create |
|---|---|
| documents · schemas · types · stubs · test harnesses · fixtures · scaffolding · source audits | production domain implementation · production route implementation · route promotion · legacy deletion |

## 30 · Contract tests

**Registry:** T-SCHEMA · T-IMPORT-BAN · T-TRANSFORM · T-HASH · T-REPLAY · T-PLACEMENT · T-PROJECTION · T-MATERIAL ·
T-COST · T-FIREWALL · T-RATINGS · T-ACTOR-AUTH · T-HEALTH · T-SEAM.

A **legitimate red-first test** compiles, loads the intended real interface/module, reaches the intended assertion, and
fails because the implementation is absent. A syntax error, malformed fixture or unrelated missing module is not a red
test. T-SCHEMA and T-IMPORT-BAN are boundary tests and must be **green** from the start; the behavioural tests are red
until their Phase builds them. Red tests run in their own script and are **never wired into `prebuild` or `test:ci`**
(Cloudflare runs `prebuild` on every deploy, so a red test there would block the live site).

**Mandatory negative tests:**

| Situation | Required result |
|---|---|
| wall/service-zone thickness change | hash changes |
| camera change | hash unchanged |
| unauthenticated qualification | rejected |
| qualification without evidence | rejected (type-level where possible, via `@ts-expect-error` fixtures compiled by `tsc`) |
| Future imports DO_NOT_IMPORT | rejected |
| jurisdiction changes BaselineBuildEstimate | test fails |
| ReferenceClaim mutated into ProjectQualification | impossible / rejected |
| FRAME take-off remains under PRINT | test fails |

## 31 · Phases 1–5

| Phase | Build | Exit proof |
|---|---|---|
| **P1 · Canonical Engine** | ArchitectProjectV2 · SpaceEntityV2 · reference transformation · serialize-v2 · hash-v2 · Future R-CORE · replay · actor model | V1 untouched · same V1 + same profile → same V2 · 36×36, 9 spaces, 900 clear, 1,296 gross · canonical geometry affects hash, view state does not · replay reconstructs the project |
| **P2 · Human Planning** | Human Intent · Vision Tree · Planning Canvas · Active Elements · Design Draft · Plan · 3D · Walk · semantic assets · tap-arm-tap-place · save/reload | intent precedes catalog · tap-arm-tap-place works · one placement · auto-disarm · saved object survives reload · Plan / 3D / Walk agree |
| **P3 · Systems + Economics** | construction method · Frame/Print branching · material take-off · Baseline Build Estimate · Project Labor Cost · Global Recognition · Local Settlement · economic firewall | ten rows sum to $240,000 · generic Project Cost absent · jurisdiction affects only LocalSettlement · Print shows no current Frame take-off |
| **P4 · Simulation + Reference + Review** | simulation · benchmarks · ReferenceClaim · DesignTarget · ProjectQualification · Project Health · Submit · Review | Reference ≠ Target ≠ Qualified · no heuristic score produces qualification · qualification needs evidence + authenticated human · benchmark axes separate · Submit ≠ Approve |
| **P5 · Convergence + Acceptance + Cutover proof** | the complete product journey at 375 · 428 · 768 · 1200 | the seven-step seam (§32) is binary — no PASS WITH WARNINGS |

## 32 · The seven-step seam

| Step | Pass | Fail |
|---|---|---|
| 1 · OPEN + INTENT | Future loads at all four viewports; no body-level horizontal overflow; human intent appears before catalog/product selection | a required viewport fails, or the catalog precedes intent |
| 2 · CREATE / LOAD FUTURE REFERENCE HOUSE | 9 spaces · 12-ft outer · 10-ft clear · 1-ft reserved zone · 36×36 shell [DERIVED] · 900 clear [DERIVED] · 1,296 gross [DERIVED] · transformation provenance visible | legacy V1 geometry shown as if it were already V2 |
| 3 · DESIGN | select Living Room · select Sofa · ARMED · tap valid location · exactly one ASSET_PLACED event · DISARMED · rotate | duplicate placement · failure to disarm · a renderer-only object presented as canonical state |
| 4 · CROSS-PROJECTION | the same asset instance in Plan, 3D and Walk with identical semantic identity and transform; orbit leaves the hash unchanged | view-specific state diverges |
| 5 · SAVE + RELOAD | post-edit hash = H1 · save · reload · reloaded hash = H1 · same asset instance survives | state disappears · hash changes without a canonical change · semantic identity changes |
| 6 · SIMULATE | Baseline Build Estimate $240,000 with evidence · Project Labor Cost, Global Recognition, Local Settlement each separate · changing jurisdiction changes only settlement · changing FRAME/PRINT changes the take-off appropriately | economic conflation · wood take-off still current under Print · benchmark arithmetic implied without evidence |
| 7 · SUBMIT / REVIEW / REPLAY | Submit ≠ Approve · qualification needs project evidence · approval/qualification need an authenticated human · replay reconstructs intent, geometry, assets, construction method, economics, design targets, qualifications, authority | AI approves · an unknown actor qualifies · replay loses consequential state |

Any failed step → **T-SEAM = FAIL**.

## 33 · Feedback before H.I.

H.I. sees a design only after: tests pass · Builder evidence exists · Adversary review exists · Voter review exists ·
AsM review exists · the Playwright journey passes where relevant · real screenshots/captures exist.

The artifact (standalone HTML + paired JSON): **REAL CAPTURE · WHAT · WHERE · TEST · PROOF · RISK · 👍 APPROVE · ✎ CHANGES ·
✋ HOLD · COMMENT · SAVE → JSON**, one decision row per image, the decision section at the end of the page. Existing
feedback tooling is used through a Future adapter where compatible. **H.I. is the design authority, not the routine
regression-testing layer.**

## 34 · Resource check and deployment path

`RESOURCE_CHECK` records separately:

| GitHub | Supabase | Cloudflare |
|---|---|---|
| repository identity · read · write · push authority · expected branch/SHA | project identity · required database authority | target deployment · deploy authority · post-deploy verification ability |

A local repository does not prove push authority. A live page does not prove Cloudflare deploy authority. A reachable
Supabase host does not prove database authority. Missing deploy authority blocks deployment; it does not erase valid
architecture work.

Deployment path: **local/test → preview → review → Future route.** The live Future route shows non-invasive build
evidence (SHA · deployment date/time · environment/version) without turning the product into a developer console.

## 35 · Cutover contract

Before replacing `/Architect-2525/`: all FCRS pass · full seam passes · all four viewports pass · replay passes · critical
Project Health gates pass · SSSES review closes · H.I. approves · legacy tag/archive created · Future builds with legacy UI
removed from the dependency graph · Cloudflare deployment verified · rollback preserved. Then
`/Architect-2525/future → /Architect-2525/`. The old implementation is **archived, not blindly deleted**.

## 36 · Estimate status

The 64-man-day estimate stays historical (ASSUMED PLANNING BASELINE), not a schedule commitment. Re-estimate after
Phase 0, because the corrected architecture now includes previously hidden work: new V2 serializer/hash · reference
transformation · Future R-CORE event model · canonical asset persistence · actor authority · material-method branching ·
legacy dependency isolation · four-viewport seam · replay · feedback tooling integration · cutover dependency test.

## 37 · Pod activation gate and pre-vote

Phase 0 work proceeds under HOLD. Implementation pods activate only when: Original CRS persisted · Future FCRS persisted ·
CRS Change Map persisted · architecture documents published · DTM complete · source dispositions complete · schema
compiles · contract tests exist · red tests fail for the intended reasons · T-IMPORT-BAN exists · repository blockers
closed · 12 AsM persona-cell pre-votes complete · no unresolved HOLD · MoT synthesis complete · **H.I. accepts Phase 0**.

Each persona cell votes on assignment · Phase role · review responsibility · largest concern → APPROVE / APPROVE WITH
CHANGE / HOLD. Threshold: **≥ 8 APPROVE or APPROVE WITH CHANGE, and 0 unresolved HOLDs.** H.I. resolves remaining
conflicts.

## 38 · Claude Code execution order (Phase 0 only)

1. **Audit every current `/future` file** and classify KEEP / REWRITE / DELETE. Do not keep Grok-created or prior Future
   code merely because it exists. (§40 records the audit already found.)
2. Persist the Original CRS verbatim.
3. Persist the Future FCRS separately.
4. Create the CRS change map.
5. Publish the Phase-0 architecture documents (§29).
6. Create the Future directory scaffold (§22).
7. Create the locked V2 type definitions.
8. Create the contract / red-first test suite (§30).
9. Add T-IMPORT-BAN immediately.
10. Run `tsc --noEmit` — the scaffold must compile.
11. Run the contract tests — behavioural tests fail for the intended missing-implementation reasons.
12. Run the 12 persona-cell pre-vote and MoT synthesis; create the Phase-0 feedback artifact (real captures at
    375 · 428 · 768 · 1200).
13. **STOP.** No production implementation until the Phase-0 gate is approved.

**Claude Code must not:** patch the old page into Future · copy `canonicalHouseTruth()` · copy `command-ux1.tsx` · copy
`architect-estimate.ts` · copy `architect-wall-system.ts` · copy Security mission planning · quietly reinterpret
`x_um/y_um` · make 12/10/1 only a visual overlay · use one mutable ratings state · use generic Project Cost for multiple
domains · let settlement alter baseline economics · let AI approve · let QUALIFIED exist without evidence · let unknown
actors approve/qualify · make H.I. discover ordinary regressions · declare SHIP because a page renders · delete legacy
before cutover proof.

## 39 · Success, definition of done, directive

**Future succeeds when a human can:** state what they need · create/load the 3×3 Future reference house · understand
12 / 10 / 1 · understand 900 clear vs 1,296 gross · design a room · select a semantic asset · arm it · place it · rotate
it · save it · reload it · see the same object in Plan / 3D / Walk · switch construction method · receive a
method-appropriate take-off · see an estimate without confusing it with labour or settlement · switch jurisdiction
without changing unrelated economics · see references without mistaking them for qualification · set design targets
without creating qualification · submit for review · keep human approval authority · replay exactly how the project
reached its current state — **without needing to understand** legacy hash conventions, mixed economic terminology,
legacy UI internals, repository history or debug hierarchy.

**Definition of done is not "the screen looks better". It is:** one human need → one canonical project · one canonical
project → consistent projections · one canonical change → one replayable event · one saved state → one reproducible
hash · one economic concept → one clearly named domain · one external claim → never accidentally a qualification · one
qualification → evidence + authenticated human · one Phase → automated proof + adversarial review + human judgment.

**MoT directive to Claude Code:** Build Architect-2525/Future as a new product, not a repaired legacy route. Preserve
the Original CRS as historical memory and use the Future FCRS as implementation authority. Preserve the old 10-ft seed
as evidence, then create a new canonical 12/10/1 physical project with its own geometry, identity, provenance and
replay. Begin with the human's needs. Use one canonical project across Plan, 3D, Walk, Simulate, Review, Health and
Replay. Make asset placement genuinely canonical and replayable. Separate every economic and authority domain that legacy
blurred together. Treat references as references, targets as targets, and qualifications as evidence-backed human
decisions. Use Security-2525 only for proven interaction patterns. Test and review before asking H.I. to judge design.
Do not inherit a past failure merely because code already exists.

| Current state | |
|---|---|
| Execution | **PHASE 0 ONLY** |
| Original CRS | PRESERVED |
| Future FCRS | BINDING GREENFIELD AUTHORITY |
| Implementation pods | HOLD UNTIL PHASE-0 GATE |

## 40 · Repository verification (R1, 2026-11-08) — facts the reviewers need

Checked against `main` at `bed1d4a52`. Each item cites the repository.

1. **`/Architect-2525/future` served the legacy Design tool.** Grok's commit `bed1d4a52` made
   `frontend/app/Architect-2525/future/page.tsx` render `ArchitectCommandUX1` (`command-ux1.tsx`, DO_NOT_IMPORT) — byte-for-
   byte the existing `/Architect-2525/design` route (`design/page.tsx:7-9`). Through command-ux1 it reaches 6 of the 7
   DO_NOT_IMPORT modules (house-spec → architect-house-truth, architect-wall-system, architect-sim-options;
   architect-estimate component → lib/architect-estimate); only mission-planning is not reached. **H.I. decision
   2026-11-08: "delete commit and start green field"** → Grok's three commits (`1f592e032`, `c2ccb6ebe`, `bed1d4a52`) are
   reverted (history kept), recorded as R-CORE rev 31 (correction). The route shows a Phase-0 placeholder that imports
   nothing legacy until Phase 2.
2. **Step-1 audit of Grok's files** (all now reverted; ideas kept only as requirements input):
   - `page.tsx` v1 (`1f592e032`, 536 lines): an intent form → "create the reference house" → workspace with
     Plan/3D/Walk — one monolithic file, CSS-div "3D", whole derived project saved to localStorage instead of the event log.
     Replaced (`c2ccb6ebe`) because **its primary button sat below the phone fold** — the failure T-SEAM step 1 must catch
     at 375/428. v2 hard-coded "$240,000", "9 spaces", colours. v3 mounted legacy. → DELETE.
   - `engine.ts` (529 lines) → REWRITE into §22's folders. Right: 12/10/1 µm constants, profile id, outer origins
     0/12/24 + clear 1/13/25, 36/1,296/900/396, the ten baseline rows, the 8-term evidence union. Wrong: event type is a
     free `string`; 14 of the 22 events missing (and a non-plan `JURISDICTION_CHANGED`); PLAN_APPROVED reducer never checks
     the actor (a replayed log reaches APPROVED); `openings` typed `[]`; PlacedAsset uses `x_um/y_um`, rotation fixed +90°,
     ids collide after removal; design targets/references change state without events → replay ≠ live hash; qualification
     can never be created; take-off returns placeholder strings; labour is a hard null (architect-labor.ts unused); a
     hand-written hash allowlist silently drops new fields.
   - `hash.ts` (90 lines): a second hand-written SHA-256 + a forked canonicaliser without the donor's volatile-key filter
     and entity-id sort → DELETE; Phase 1 uses an adapter over `canonical/serialize.ts`.
   - `index.ts`: star re-export → DELETE. No tests or package scripts existed for any of it.
3. **The labour engine already exists and is gated.** `frontend/lib/architect-labor.ts` exports exactly the four
   functions §19 names (`recognitionU :88`, `projectLaborCost :179`, `projectHeadline :194`,
   `settlementComparison :207`) and a local `EvidenceState` (:37); tests T1–T10 already pass in
   `tests/architect-labor.test.mjs` (T3 = Austin $5,200 QUOTED headline identical across jurisdictions). A.04/A.05 are
   TRUE.
4. **The legacy seed is a 10-ft clear grid** (`seeds/tiny-home-v1.ts:9-10, 39-59`). The binding finding (§2) and the
   rejection of CRS-03/CRS-04 stand.
5. **The legacy canonical schema gate bans the token `wall`** in legacy canonical field names
   (`tests/architect-canonical-schema.test.mjs:56`, scoped to the legacy canonical types). It does not govern Future;
   the Future names in §7–§9 (`wall_zone_thickness_um`, `wall_assemblies`, `wall_id`) are deliberate and must not be
   added to that legacy gate's scope.
6. **Three evidence vocabularies already exist** — legacy canonical `AUTHORITY_STATES` + `EVIDENCE_VALIDITIES`
   (`canonical/types.ts:20-38`), labour `COST_AUTHORITY_ORDER` (`architect-labor.ts:49`), and the Future vocabulary
   (§21). Future keeps its own and maps the others only inside adapters.
7. **Repository-claim verification (origin/main `bed1d4a52`) — corrections Phase 1/3 must carry:**
   - All 7 DO_NOT_IMPORT paths exist. `@/*` resolves to `frontend/*` (`tsconfig.json:17`), so **T-IMPORT-BAN must walk
     the resolved transitive graph**, not basenames — e.g. `architect-project.ts:17` imports `architect-estimate`.
   - **Donor path fixes:** the gesture hook is `frontend/components/architect-2525/use-rcore-gestures.ts` (not `lib/`);
     the scripts are `frontend/scripts/feedback-artifact.mjs` and `frontend/scripts/arch-decision.mjs` (no repo-root
     copies); canonical donors are under `frontend/lib/architect-2525/canonical/`.
   - **Donor adapters must not take the typed legacy functions.** `serialize.projectHash` and `rcore.commitRevision` are
     typed to the legacy `ArchitectProject`/`EventType` (`serialize.ts:67-74`, `rcore.ts:69-72`). The Future
     `serialization/` adapter wraps the untyped `canonicalHash(value: unknown)` (`serialize.ts:85-87`) + the existing
     `@/lib/wire-core/sha256` (`sha256.ts:18`) — **not** a second hand-written SHA-256 (Grok's `hash.ts` → DELETE).
   - **The ten baseline rows live ONLY in the banned `architect-estimate.ts:82-93`; the first row is "Site Work" (not
     "Site"); legacy rows carry no `evidence` field.** Future re-declares the rows (ASSUMED) in its own domain, never
     imports them.
   - **The Original CRS-09 grouping is real but only as a DISPLAY ROLLUP** (`architect-house-truth.ts:75-84,138-141`):
     Foundation 33k / Wall System 48k / Roof 17k / "MEP (parallel)" 55k / Finish 87k, where Finish 87k = Site + Drywall +
     Interior + Landscape. §19's source taxonomy (ten rows) stands; this grouping is a labelled rollup only.
   - **ICON provenance — the plan's wording does not exist in the repo.** There is no "ICON reference deck received
     2026-11-02" string; the real sources are `architect-wall-system.ts:2,15` and
     `docs/asks/2026.11.02_icon_nomenclature_carbonx_phoenix.md:3-5` ("The operator sent ICON's reference deck"). §20's
     received-date-vs-source-date rule holds; Phase 4 must cite the real files and never fabricate the quote.
   - **T-FIREWALL cannot rely on today's types:** `projectLaborCost({ storedWageUsd: settlementRef.localSettlementNative })`
     compiles today (`architect-labor.ts:170-179,204`), so settlement can be laundered into a USD labour input. The V2
     economics need a **branded type** so a settlement value cannot be assigned to a labour input.
   - **T-MATERIAL:** the legacy take-off always lists "2×6 studs @16″ o.c." on the 36×36 shell regardless of method
     (`architect-house-truth.ts:150-170`). Future must suppress studs/plates under PRINT (§18).
   - **T-SEAM step 1 must assert the primary create action is visible without scrolling at 375/428 px** — the exact
     failure ("a long form whose button sat below the phone fold", commit `c2ccb6ebe`) that made Grok abandon the Future
     flow and mount legacy.
   - **Actor authorization must be enforced in the reducer and on replay**, not only in command helpers (Grok's
     `engine.ts:381-382` applied PLAN_APPROVED with no actor check while `approve()` checked at `:452-457`).
   - **Every canonical change must emit an event** — Grok changed references/design-targets without one
     (`engine.ts:459-469`), so replay diverged from live state; T-REPLAY must cover ReferenceClaim/DesignTarget/
     ProjectQualification. Persist a validated event log, not a derived snapshot.
8. **Phase-0 tooling (origin/main) — facts Phase 0 / Revision B must use:**
   - Tests run via `node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/<name>.test.mjs`;
     `@/*` → `frontend/*` (`tsconfig.json:17`). Node v22 strip-types allows erasable syntax only (no enum / namespace /
     parameter-properties / JSX) and needs `import type`; keep pure logic in `.ts` (not `.tsx`) so contract tests can load it.
   - **Red-first contract tests must NOT be wired raw into `test:ci` or `prebuild`** — a red `prebuild` freezes production
     and a red `test:ci` leaves the gate permanently red (`deploy.yml:104-107`). Add an "expected-red" runner that spawns
     each behavioural `T-*` and asserts it fails for the right reason; only **T-SCHEMA and T-IMPORT-BAN (which must pass)**
     join `test:ci`.
   - **T-IMPORT-BAN must be static** (parse imports; do not execute) with its own resolver: `ts-alias-loader` has no
     `/index` barrel resolution (`ts-alias-loader.mjs:11-15`), directory barrels exist (e.g. `lexicon-context.tsx:25-26`),
     and it must follow `@/*`→`frontend/*` transitively, including `import type` and dynamic `import()`.
   - **Type-level negatives** use `@ts-expect-error` in `.ts` contract files under `frontend/lib/architect-future/`
     (covered by `tsconfig.json:19`); an unused `@ts-expect-error` becomes `TS2578` and fails `tsc`, which is the assertion.
   - **Cloudflare runs the full `npm run build` (prebuild + next build + postbuild) on every branch and promotes only
     `main`** (`package.json:9,19,20`; `deploy.yml`). The feature branch gets its own preview address, so Phase-0 review can
     happen off a branch without shipping to production. The postbuild `stamp-count.mjs` enforces ≤1 `HH:MM CST` token.
   - **Feedback tooling** (`fx-template.mjs`/`buildFx`) is not in the repo yet (only in scratch); it or a Future adapter
     over it must be committed before the Phase-0 artifact is generated. `architect-screens.mjs` lacks the 768/1200
     viewports and clicks legacy selectors (`architect-screens.mjs:21,39-44`), and its CI job runs only after Verify Live
     on `main` — Phase 0 adds Future selectors + the two viewports.
   - **Gate/registry housekeeping:** `asks-persist.test.mjs` checks only `docs/asks` (so `docs/architect-future/**.sha256`
     is ungated — add a check); the projects registry (`docs/traceability/projects.r*`) Architect paths should learn the
     `/future` route; the Phase-0 page copy must avoid the architect-voice banned words (R-CORE / SSSES / SPIRAL /
     canonical / project_hash — `architect-voice.test.mjs:15-19`).

## 41 · Revision log

| Rev | Date | By | Change |
|---|---|---|---|
| R0 | 2026-11-08 | H.I. Thought Master / MoT | Final greenfield plan (verbatim in `source/`). |
| R1 | 2026-11-08 | Claude Code (MoT rewrite) | Structured into §0–§41 with tables; added §0 feedback path; §5 import-ban scope includes the route; §30 red tests kept out of `prebuild`/`test:ci`; §38 step 12 adds the pre-vote + captures; §40 repository verification. No doctrine changed. |

> Humanity decides. Technology assists. R-CORE remembers. SPIRAL verifies. SSSES qualifies. Trust must be proven.
