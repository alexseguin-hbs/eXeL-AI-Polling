# ARCHITECT-2525 · ADVANCED CRS PLAN (Plan_Arch) — build the truth loop

> 웃 Date: October 22, 2026 · Central   ·   ◬ Timestamp: actual system instant / UTC
> Scope lock (operator 2026-10-23): **we are only updating ARCHITECT-2525.** No other Innovation-2525 product is touched.
> Deliverable: a CRS-traceable, **48-fleet-executable** plan to evolve Architect-2525 into the v1.2 "truth loop," refined
> through **THREE rounds of 12× Ascended-Master (AsM) 111-word review + Master-of-Thought adjudication** (operator 2026-10-23,
> to honour Trinity): → **Plan_Arch_001** → **Plan_Arch_002** → **Plan_Arch_003 (final)**, plus a **SPIRAL test** and an
> **SSSES 5-pillar review** of the plan (Round 2). Source documents (both in hand): the CONSOLIDATED MASTER OF THOUGHT
> OPERATING ORDER (operator, today) and `docs/architecture-2525/SPECS_ARCHITECT-2525_v1.2.md` (committed, Parts 1–3). Where the
> operating order refines v1.2 it is "today's documentation" and controls; v1.2 remains the locked spec it refines.
> **CENTRAL OUTCOME (north star, eXeL):** *every visible Architect-2525 claim must trace to canonical Runtime state, a declared
> assumption, a derived calculation, a recorded human decision, or explicit illustrative data — never an unsupported UI
> assertion.* The customer-facing expression of the truth loop, mapped onto the 9-value AuthorityState.
> **ANCHORING (Grok: do not fork the CRS):** this plan EXTENDS the locked `ARC-##.##` catalog (`MASTER_SPEC.md`, ARC-01→33) as
> the **Truth-Loop Foundation `ARC-34→39`**, grounding existing rows (ARC-34→16/05 · ARC-35→21/24 · ARC-36→21/08 · ARC-37→05/28 ·
> ARC-38→23/12 · ARC-39 proof). It is not a competing customer requirement — it operationalizes the existing one.
> **STATUS: Plan_Arch_003 — FINAL (three rounds complete).** Round 3: **12/12 masters fleet-READY** (all READY-WITH-NITS; 3 STRONG,
> 1 BLOCKING, 8 ENHANCE) — the one BLOCKING (the `runtime.ts`/`runtime-edit.ts` split not yet propagated to 3 sections) is resolved at
> root, and every residual was the same consistency class (now fixed) plus one genuine new gap (Enki: the edited space's OWN floor).
> The plan is an unambiguous, 48-agent-Opus-4.8-executable A→E contract: **SPIRAL = PASS, SSSES = 88/100, every ARC row has an
> executable gate, every green-but-false path closed, every requirement traced to the §27 PASS.** **CLOSE-OUT FOLD EXECUTED (2026-10-23
> "execute plan"):** all Round-2/3 amendments are now folded into their clean ARC rows (single source); the amendments block is the
> audit map; the lone BLOCKING is resolved at root; 2 cosmetic items (per-row iface/risk, dep-wildcard expansion) remain for the
> persist. Ready for operator approval → on approval, persist to `docs/architecture-2525/Plan_Arch_003.md` and start Block A via the
> 48-fleet in Phase 0→3 order.

## Context — why this plan exists
ARCHITECT-2525 is the operator's demo + interview prep for the **ICON (3D-printed home) Senior Product Owner / Senior
Product Manager** role (interview Thu 2026-10-29; **demo due Mon 2026-10-26 EOD**). The current app *looks* like a BIM
tool but tells several untrue stories: a hardcoded `G6` stage, a fabricated `R-CORE SYNC`/`SPIRAL green` ribbon, a
`$325,970` "project cost" derived from an economy rate, `2,000 ft²`/`Baths 2` from full-home defaults, `Structural PASS ·
L/480`, `AI APPROVE 94%`, synced Lifecycle twins. None of it is backed by canonical state or a replayable record. The
v1.2 mission replaces the theatre with a **truth loop**: a canonical building model a human edits; AI previews the
consequence; **HI ACCEPT** commits one R-CORE revision; **SPIRAL** verifies and reverses it; the proof **survives save and
reload**. The single final product question (§27/§XXXIV): *Can ARCHITECT-2525 prove that a human-authorized change altered
canonical building state, that R-CORE remembers exactly what happened, that SPIRAL can verify and reverse it, and that the
proof survives serialization and reload?* The answer must be **executable: PASS**, not subjective. This CRS Plan is the
requirement-traceable route to that PASS.

## Decision precedence & the pre-flight result
1. FINAL SPECS / ARCHITECT-2525 v1.2 + accepted deltas (incl. the consolidated operating order) — **Product Authority.**
2. Repository evidence. 3. Grok (code-grounded) — advisory. 4. DeepSeek (systems/product) — advisory. 5. Executable tests — proof.
The live glass is implementation evidence, not truth; the ICON JD is delivery context, not product semantics.
**Pre-flight (read-only recon) is complete** (3 agents, HEAD `b6688e8ee`): **SPEC conflicts = NONE — implementation
discrepancies only.** Per the operating order §8/§25 that means: once this plan is finalized, **proceed into Block A in the
same cycle; no further product-review round is required.**

## Timestamp / symbol convention (operating order §3.1–3.2; v1.2 Part 3)
웃 = human context, ◬ = machine/system record, **shown as the symbol alone** (no "HI Date"/"AI Timestamp" expansion;
glossary/aria may explain). An R-CORE event preserves both a human-local date (contextual) and the absolute machine
`timestamp_ms` (UTC). **Both are volatile/provenance and are EXCLUDED from `project_hash`** (§09/§24) — determinism is
unaffected. **No 웃/◬/♡ symbol is ever a canonical field name.**

## Firewalls — DO NOT TOUCH this cycle (confirmed by recon, file:line)
- **Economy:** `components/architect-2525/architect-economy.ts` — `DEFAULT_RATE_PER_HR=7.25`:11, `computeEconomy`:42,
  `ratePerMin`:14, local `mot`:54. Unchanged; `backend/app/core/hi_rates.py` unchanged.
- **Estimate gate:** `lib/architect-estimate.ts` — `GATES`:25 (G0–G13), `confidenceForGate`:44, `classForGate`:34. The
  `arch2525.gate` localStorage index lives in `components/architect-2525/use-layer-state.ts:136/139` — not renamed/reread.
- **Shared geometry source:** `lib/room-layout.ts` (`TINY_ROOM_LAYOUT`, `moveRoomInLayout`, `resizeRoomInLayout`,
  `moduleHash`) is imported by 8 non-test files (tiny-floorplan, voxel-house, architect-design, room-designer,
  command-ux1, architect-guard, architect-saved-files, architect-project-file). It is **superseded, never deleted** — the
  canonical runtime is a new, parallel model; the legacy UI keeps reading room-layout until Block D rewires its reader.
- **Financial-2525** (`/financial-2525`) owns time/value/ledger. Architect never duplicates it; references only by
  `financial_record_id`/`financial_record_hash` (nullable, reserved, unused this cycle). No ARCHITECT rate field, no Time
  Capital, no learning-point formula, no generic `mot`.

## Hard stops (v1.2 §21–24, operating order §23) — architecture may anticipate; V1 does not implement
No WALK · no visual Wall/Door/Window geometry (boundary lines are Space boundaries, not extruded walls) · no IFC/glTF/
OpenUSD/Unreal/Unity generation · no structural PASS (no fake L/480) · no photorealism · no operational twin · no
multi-user merge. Only PLAN and VECTOR 3D.

## Corrections, not escalations (operating order §6) — adjudicated; implement, do not relitigate
G6 header, 20/33, R20/R33, Risk LOW, 30–50%, $325,970, $0.12/min, $7,943.10, $6,017.50, 249000, 49800, AI APPROVE,
Structural PASS, L/480, Day 1, Concrete/Footings/Slab, synced Lifecycle twins, 2,000 ft², Baths 2, confidence %, windows 8,
doors 9, furniture, outlets. (Recon note: `$5.4507/hr` is **Financial-2525's**, not Architect's — not chased here; a
"3×3 Draft" label **does not exist** — the hero is simply set correctly, nothing to remove.) A true conflict is escalated
ONLY in the six-field form (SPEC ID / CONFLICT / CODE EVIDENCE / PROPOSED CHANGE / UPSIDE / MIGRATION IMPACT).

## The canonical model (Block A schema) — new files under `frontend/lib/architect-2525/`
Pure, framework-free, importable by Next.js and by `node --experimental-strip-types` tests. Every interface carries a
`/** SPECS / ARCHITECT-2525 §NN */` doc comment.
- `canonical/units.ts` — integer µm (`UM_PER_FT=304800`, `MIN_DIMENSION_UM=1_000_000`, `UM2_PER_FT2`), `assertSafeInt`,
  presentation-only `sqftFromUm2`/`ftLabel`. (Already drafted; recreate in the primary tree.)
- `canonical/types.ts` — `ArchitectProject`, `ProjectEntity/SiteEntity/BuildingEntity/StoreyEntity/SpaceEntity`,
  `AuthorityState` (9: ILLUSTRATIVE/OBSERVED/IMPORTED/ASSUMED/CALCULATED/SIMULATED/AI_PROPOSED/HI_APPROVED/QUALIFIED),
  `EvidenceValidity` (CURRENT/STALE/SUPERSEDED), `EvidenceState`, `PortfolioStage` (G1_CONCEPT…G7_RETIRE), `PlanState`,
  `SpaceFunction`, `RCoreEventGroup`, `RCoreSnapshot`, `EntityChange`. `SpaceEntity` per operating order §A4: `entity_id,
  entity_type:'SPACE', bay_code, legacy_slug?, parent_id, shape:{kind:'RECT'}, x_um, y_um, z_um, width_um, depth_um,
  function, wet_class, plan_status, evidence, revision_id` — **no yaw, no row/col as canonical geometry** (row/col may live
  in seed/template metadata only).
- `canonical/uuidv7.ts` — a real **UUIDv7** (time-ordered, version nibble 7). None exists in the repo; `crypto.randomUUID()`
  is v4 and must not be wrapped. Small vetted implementation (timestamp ms + random), with a `isUuidV7` validator.
- `canonical/serialize.ts` — the one pure `serializeCanonicalProject(project): string` (sorted keys, entities sorted by
  `entity_id`, NFC, no insignificant whitespace, integer precision, **exclude** created_at/updated_at/package_hash/camera/
  selection/UI/local_date/timestamp_ms) + `projectHash(project)` = `sha256Hex(serialize)` (reuse `lib/wire-core/sha256.ts`).
- `canonical/rcore.ts` — append-only, SHA-256-chained event log (mirror `lib/financial-2525/record.ts`'s append/replay/
  verify/union discipline, swapping FNV-1a → `sha256Hex`); snapshot+delta; `replay`, `reverse`, SPIRAL, R-CORE SYNC.
- `canonical/runtime.ts` — `buildProjectFromSeed(seed)` ONLY (the production constructor that generates R0). **(split DECIDED — Enlil/R2+R3.)**
- `canonical/runtime-edit.ts` — the edge engine (interior conserves / exterior changes / BLOCKED < 1,000,000 µm, **both the
  neighbor floor AND the edited space's OWN floor** — Enki/R3: a shrinking exterior edit below `MIN_DIMENSION_UM` or to ≤0 is
  BLOCKED, `assertSafeInt` rejects non-positive derived dims) + the HI-ACCEPT commit path + HOLD/REJECT. Owned by Pod FIGHT (B7),
  distinct file from A5's `runtime.ts` → zero Phase-1 collision.
- `canonical/package.ts` — `.arch2525` V2 writer/reader (deterministic, store-only ZIP so `package_hash` is reproducible) +
  legacy V1 single-JSON adapter (detect ZIP magic first).
- `seeds/tiny-home-v1.ts` — the one declarative seed fixture (NOT inside useState/useEffect/render).

## The locked nine-space seed & the 900 ft² proof (operating order §11; v1.2 §IX)
Datum `[0,0,0]` at C1's SW corner; +X East, +Y North, +Z Up; never recenters; negative coords valid. Each space
`width_um = depth_um = 3,048,000` (10 ft). Storey height `z = 3,048,000` ASSUMED. Coordinates (bay_code → x_um,y_um):
`C1 0,0 · C2 3048000,0 · C3 6096000,0 · B1 0,3048000 · B2 3048000,3048000 · B3 6096000,3048000 · A1 0,6096000 ·
A2 3048000,6096000 · A3 6096000,6096000`. Functions/wet: A1 BEDROOM DRY · A2 BATH WET · A3 CLOSET DRY · B1 LIVING DRY ·
B2 KITCHEN WET · B3 DINING DRY · C1 OFFICE DRY · C2 UTILITY WET · C3 ENTRY DRY. Seed project: `portfolio_stage=G2_PLAN,
plan_state=REVIEWABLE, authority_state=ASSUMED, revision_id=R0, actor=template:TINY_HOME`.
**Exact-area proof (integer µm², no floats):** one space `= 3,048,000 × 3,048,000 = 9,290,304,000,000 µm²`; `÷ 304800² (=
92,903,040,000) = 100.0 ft²` exactly; nine spaces `= 83,612,736,000,000 µm² = 900.0 ft²` exactly; and
`83,612,736,000,000 < 2^53−1 (9,007,199,254,740,991)` so §24 safe-integer holds. 3 wet (A2/B2/C2), 1 bath; Gross Building
Area = NOT CALCULATED.

## THE ARC CRS TABLE — Truth-Loop Foundation `ARC-34 … ARC-39` (extends the locked ARC-##.## catalog; anchored, not forked)
Naming per `MASTER_SPEC §16` (`ARC-##.##`, IO `{id}.IN`/`.OUT`). **Four facets per row** (DeepSeek, so the plan never degrades
into a bug list): **CR** = customer requirement · **Evidence** = current file:line defect (or `new`) · **SPEC §** = the locked
response · **Gate** = the executable acceptance test. Plus §XXXII fields (**own**=owner AsM · **dep**=depends-on · **§27**=which
clause it advances: altered/remembers/verify-reverse/survives/supporting). **DoD** = Status `Live` AND the named gate green in
`test:ci` AND `tsc --noEmit` clean; a row with no Gate is not done. **demo★** marks demo-critical rows for Mon 2026-10-26.
Round-1 BLOCKING fixes baked in: **seed IDs pinned** (Thor), **PortfolioStage as a WORD not a bare G#** (Aset), **hermetic
`test:architect-edit`** (Athena). Status ∈ {Planned, Designed, Live, Required}.

### ARC-34 · Canonical Runtime Model (grounds ARC-16 object model, ARC-05 one-source) — Block A
| Sub-CRS | St·§27·demo | CR + SPEC § | Evidence | Gate (executable) | own·dep |
|---|---|---|---|---|---|
| **ARC-34.01** | Planned·supporting·★ | integer-µm geometry, no floats; `assertSafeInt` on stored dims **AND on the DERIVED area** (width×depth product + Σ) — §08/§24 | `new` (units.ts drafted) | `test:canonical-units` — `UM_PER_FT=304800`, `MIN_DIMENSION_UM=1e6`, `assertSafeInt` throws on a non-safe-int coord **and on an oversized area product/aggregate** (Thoth, a space >~96,952 ft²), 0 float literals | Thoth·— |
| **ARC-34.02** | Planned·altered·★ | Project→Site→Building→Storey→Space×9 modeled as a **polymorphic `entities` collection keyed by `entity_type`** (NOT a fixed `spaces: SpaceEntity[]`), so a future `WallEntity`/new field is ADDITIVE and **hash-preserving for legacy projects** (Odin/R2 — CLAUDE.md "a new edition is an append, never an edit"); `entity_id` is an **opaque 128-bit TOKEN** reserving a future IFC GlobalId (a real one is **22-char case-sensitive base64, NOT a hyphenated UUID**); `isUuidV7` gates **generation only**, never all-ids validity — §08/§A4 | `new` | `test:canonical-schema` — 9 spaces; **9 seed ids pinned as UUIDv7 literals** (Thor); a **mixed-case non-UUID id (real IFC GlobalId) round-trips byte-exact, case preserved** (Odin/Thor/R2 — lowercasing scoped to hex-UUID ids only); ids stable across resize; an additive new field leaves a legacy `project_hash` unchanged | Aset·34.03 |
| **ARC-34.03** | Planned·remembers | EvidenceState 2-D (authority × validity orthogonal), SIMULATED≠STALE; 9 AuthorityState values, the 4 not yet exercised (ILLUSTRATIVE/OBSERVED/IMPORTED/QUALIFIED) labelled **anticipatory** (Pangu) — §08 | `new` | `test:canonical-schema` — SIMULATED+STALE representable; STALE not an AuthorityState value | Aset·— |
| **ARC-34.04** | Planned·altered·★ | PortfolioStage G1_CONCEPT…G7_RETIRE, separate from estimate GATES; **rendered as the WORD, never a bare G#** (Aset BLOCKING — G2/G4/G6 collide with firewall GATES); PlanState REVIEWABLE — §X | `new` + Evidence `G6` ribbon `command-ux1.tsx:265` | `test:canonical-schema` — all 7 members enumerated; **no PortfolioStage label equals any `GATES[]` label**; + `test:product-truth` asserts no bare `G<n>` stage token in the header/Build path | Aset·— |
| **ARC-34.05** | Planned·supporting·★ | one auditable seed fixture (not inline in a component); the **nine FIXED UUIDv7 literal ids** authored into it (Thor); actor `template:TINY_HOME` — §02/§11 | `new` | `test:canonical-seed` — standalone module; 9 spaces; exact coords; 3 wet A2/B2/C2; 1 bath; **the exact pinned ids** | Enlil·34.02 |
| **ARC-34.06** | Planned·altered·★ | R0 via the production constructor (`seed→runtime→serialize→hash→snapshot R0`), never hand-written; **two-run determinism** (Thor) — §11 | `new` | `test:canonical-seed` (independent block gate, Enlil — NOT only completion-loop) — build R0 twice from scratch → **identical project_hash**; REVIEWABLE·ASSUMED·R0 | Enlil·34.01-05, 36.01 |
| **ARC-34.07** | Planned·altered·★ | exact 900 ft²; fixed datum at C1 SW `[0,0,0]`, never recenters; negative coords valid — §05/§IX | `new` | `test:canonical-seed` — `sqftFromUm2(total)===900` (derived-area safe-int, Thoth); C1 origin `[0,0,0]`; a west edit → `x_um<0`, datum unmoved | Thoth·34.01 |
| **ARC-34.08** | Planned·supporting | schema hygiene / Financial boundary: no `웃/◬/♡/mot/rate/time_capital/yaw/svg/mesh/wall` as canonical fields; `financial_record_id/hash` nullable-reserved present — §3.3/§3.4 | `new` | `test:canonical-schema` — banned-field scan passes; the two financial refs exist and are `null`; **a gate asserts no V1 code path emits the 4 anticipatory AuthorityStates** (SSSES/R2 — ILLUSTRATIVE/OBSERVED/IMPORTED/QUALIFIED are V2-documented) | Aset·34.02 |
| **ARC-34.09** | Planned·supporting | **IFC4 isomorphism** (Pangu/R2 — the #1 ICON credibility signal, given an owner + gate): the canonical hierarchy maps 1:1 to IfcProject→IfcSite→IfcBuilding→IfcBuildingStorey→IfcSpace; `bay_code`/`function`/`wet_class` are future IFC property-set carriers; the 9-value AuthorityState is a **provenance axis IFC4 lacks** (differentiator, not mere compatibility). Documentation only — NO IFC code (hard stop) — §25/§VI | `new` (change-log item only in P_A_001) | `test:product-truth` — a ProjectEntity↔IfcProject … SpaceEntity↔IfcSpace mapping table exists in `docs/architecture-2525/SPEC_TRACEABILITY.md` naming all five pairs | Pangu·34.02 |

### ARC-35 · R-CORE (the memory — grounds ARC-21 Replay, ARC-24 gates) — Block B · gate `test:rcore` (independent of completion-loop, Enlil)
| Sub-CRS | St·§27·demo | CR + SPEC § | Evidence | Gate (executable) | own·dep |
|---|---|---|---|---|---|
| **ARC-35.01** | Planned·remembers·★ | only HI ACCEPT commits; **HOLD and REJECT are DISTINCT** (Christo): HOLD keeps the AI preview live/deferred, REJECT discards it and clears the viewport — **both write nothing to R-CORE**; the shared pure `AiPreviewState {PROPOSED\|HELD\|CLEARED, proposed_change\|null}` (ephemeral, hash-excluded) is the state the gate reads; a HELD preview whose base revision advanced is **INVALIDATED** ("preview out of date, re-edit"), never recomputed-and-silently-applied (R3) — §06 | `new` | `test:architect-rcore` + completion-loop STEP 8 — HOLD vs REJECT leave **different preview state** yet both: no mutation, no revision, no event, hash unchanged; STEP 8b: HOLD → advance head → ACCEPT the stale HELD preview is **invalidated, zero append against a stale `prev_hash`** | Christo·34.* |
| **ARC-35.02** | Planned·remembers | ACCEPT ≠ Plan approval: after an edit `plan_state=REVIEWABLE` (never HI_APPROVED); a materially-edited HI_APPROVED → REVIEWABLE + prior approval validity=STALE — §04 | `new` + hero CTA `command-ux1.tsx` | `test:rcore` — plan_state stays REVIEWABLE after an edit ACCEPT; the approval verb (if any) is separate and named | Christo·35.01 |
| **ARC-35.03** | Planned·remembers·★ | event group (§14 shape): changes sorted by `entity_id`; **every `event_hash`/`prev_hash` = `sha256Hex(serializeCanonicalProject(…))`** (UTF-8/NFC, volatile-excluded) — "mirror `record.ts`" is scoped to its **append/replay/verify CONTROL FLOW only**, NEVER its `charCodeAt`/UTF-16 encoding or its timestamp-in-hash (Thoth/R2 BLOCKING); **GENESIS = R0 `project_hash` exactly** (64-zero only if no R0 — never, R0 is built first); `timestamp_ms` **+ `local_date`** stored but **hash-excluded** (Asar); no generic `mot` — §14/§3.2/§3.4 | `new` | `test:rcore` — one ACCEPT → one group, changes sorted, chain-verify root→head from the R0 genesis; **hash unchanged when only `timestamp_ms`/`local_date` vary**; a **non-ASCII/NFD edit → `event_hash` byte-identical NFD-vs-NFC**; the independent ref (C3) re-derives `event_hash` | Thoth·36.01 |
| **ARC-35.04** | Planned·remembers | **SUPERSEDED has a named producer** (Enki — a later revision that fully replaces earlier evidence, distinct from the edit that merely STALEs a prior approval) — closes the orphaned enum value, else delete it — §08/§20 | `new` (enum value had no path) | `test:rcore` — a transition gate asserting the exact `CURRENT→SUPERSEDED` (and `CURRENT→STALE`) moves; no unreachable EvidenceValidity member | Enki·34.03 |
| **ARC-35.05** | Planned·remembers | snapshot + delta at R0 / every 10 revisions / every HI gate transition; replay = nearest snapshot + deltas — §15/§17 | `new` | `test:architect-rcore` — `Replay(R2).hash===storedR2`; **cadence gated (Odin)**: a ≥11-revision run asserts a snapshot at R10 **AND `Replay(R>10)==stored` reconstructed FROM the R10 snapshot** (drop pre-R10 deltas, still reconstruct — R3; record.ts has no snapshot, so this path is net-new); a gate-transition forces a snapshot | Odin·35.03 |
| **ARC-35.06** | Planned·verify-reverse·★ | SPIRAL FORWARD/REPLAY/REVERSE; states NOT_RUN/PASS/**INCONCLUSIVE**(renamed from HOLD, Aset — no clash with the HI HOLD verb)/FAIL; **REVERSE is a PURE verification** that reconstructs the parent hash and does NOT mutate working state (Athena) — §18 | `new` | `test:rcore` + completion-loop STEP 5 — `Reverse(R2 group).hash===storedR1`; SPIRAL PASS; reverse leaves working project at R2 | Athena·35.03 |
| **ARC-35.07** | Planned·verify-reverse | R-CORE SYNC: runtime hash == replayed current-revision hash → SYNCED (else PENDING/DIVERGED/OFFLINE) — §19 | `new` + fabricated "R-CORE SYNC" ribbon `command-ux1.tsx:264-271` | `test:rcore` — after each ACCEPT, SYNC===SYNCED | Krishna·35.05 |
| **ARC-35.08** | Planned·altered·★ | edge engine (in `runtime-edit.ts`): interior conserves net area; exterior changes it; **neighbor<1,000,000µm AND the EDITED space's OWN edge<`MIN_DIMENSION_UM` or ≤0 → `BLOCKED`** (Enki/R3 — `assertSafeInt` rejects non-positive derived dims); exact floor ==1,000,000µm ALLOWED, 999,999 BLOCKED (strict `<`); NFC `bay_code` at neighbor lookup — §07 | `new` | **independent `test:architect-rcore` edge leg** (interior/exterior/self+neighbor floor, not only the Block-C loop — Enlil/R3) + completion-loop STEP 2/4/7 — exterior area changes; shared conserves (Kitchen +Δ, Dining −Δ); blocked writes nothing, counts unchanged | Enki·34.*,35.01 |

### ARC-36 · Canonical Serialization & Persistence (grounds ARC-21 hash, ARC-08 export) — Block C · the completion-loop turns green here
| Sub-CRS | St·§27·demo | CR + SPEC § | Evidence | Gate (executable) | own·dep |
|---|---|---|---|---|---|
| **ARC-36.01** | Planned·survives·★ | one pure `serializeCanonicalProject`; **canonicalization contract pinned** (Thoth): recursive key sort, **entity sort on the raw case-preserved `entity_id` byte string (NFC)** — lowercasing applies ONLY to hex-UUID normalization at generation, NEVER to the sort key (R3: a real IFC GlobalId is case-sensitive base64), **NFC on values AND keys**, **absent/undefined optional keys omitted (never emitted as null)**, string→**UTF-8 (TextEncoder)** — NOT record.ts's `charCodeAt`/UTF-16; volatile excluded (`created_at/updated_at/package_hash/camera/selection/UI/local_date/timestamp_ms`) — §09/§16 | `new` | `test:canonical-serialize` — volatile-only change → byte-identical; **NFD** string → NFC byte-identical; **two ids differing only in case sort case-sensitively**; an added optional field leaves a legacy `project_hash` unchanged | Thoth·34.08 |
| **ARC-36.02** | Planned·survives·★ | SHA-256 `project_hash` via `lib/wire-core/sha256.ts::sha256Hex`; an **independent** test canonicalizer (node:crypto) agrees — must NOT call the production serializer **and must re-derive the volatile-exclusion list itself** (Athena) — §10 | `new` | `test:canonical-ref` — independent canonicalizer + `node:crypto` hash === production hash for R0/R1/R2; non-ASCII fixture | Aset·36.01 |
| **ARC-36.03** | Planned·survives·★ | `.arch2525` V2 ZIP **persists the R-CORE chain** (snapshots+deltas, not only current state — Krishna; STEP-5 replay-after-reload needs it); legacy V1 single-JSON still opens (ZIP-magic first); V1 import = `IMPORTED` authority + `assertSafeInt` after any unit conversion (Enki); a **zero-entity** project serializes/hashes with `Σ=0` defined (R3) — §21/§12 | `new`; legacy `lib/architect-project-file.ts` (v1) | completion-loop STEP 3/6 — save→reload same ids/geometry/revision/**project_hash+package_hash**; **on reload re-verify the chain root→head AND `Replay(head)==stored current project_hash`**; a semantically-broken chain inside a valid ZIP is **rejected CLOSED** (R3); `architect-project-file` round-trip stays green | Odin·35.05,36.01 |
| **ARC-36.04** | Planned·survives | `package_hash` excludes archive accidents; **`normalized_path` pinned** (Thoth: POSIX `/`, no leading slash, NFC, entries sorted) over `{normalized_path, content_hash}`; **each `content_hash` = `sha256Hex` over the `serializeCanonicalProject` volatile-excluded projection** (UTF-8/NFC, NOT a bespoke stringify — R3), so `package_hash` is time-invariant; `rcore.ts`/`package.ts` take an **injected clock**, never `Date.now` internally (Thor/R3); `manifest.seal.json` outside the sealed data — §12 | `new` | `test:canonical-package` — two saves of the same revision → identical `package_hash` despite ZIP byte/timestamp/order (cross-OS); **STEP 8a/8c inject two differing clocks (T, T+Δ) → identical `package_hash`** (not only project_hash) | Thoth·36.03 |
| **ARC-36.05** | Planned·supporting·★ | **NEW (Thor): hostile `.arch2525` rejection** — reject path-traversal (`../`), zip-bomb/oversized entries, bad ZIP magic, and `__proto__`/prototype-pollution keys in **EVERY untrusted parse — the V1 JSON adapter AND every V2 ZIP entry** (project.json/deltas/snapshots/seal; V2 is the DEFAULT format — R3), via a **null-proto reviver + entry-count/total-size caps**; the V2 reader **recomputes `package_hash` on load and fails CLOSED if ≠ `manifest.seal.json`**; fail **CLOSED** with one signer-safe line (Security cannot reach 100 without it) | `new` (C4/C5 parse untrusted archives, ungated today) | `test:canonical-package-hostile` + a completion-loop hostile step — each malformed input rejected (incl. a **V2-entry prototype-pollution** case, not only V1), no throw escapes, no partial load | Thor·36.03 |
| **ARC-36.06** | Planned·survives | forward-compat (Odin): V2 writer stamps `schema_version` + `min_reader_version`; reader has a tested "file newer than this reader" branch + a pure `migrateV1toV2` seam reusable for V2→V3 — §25 | `new` | `test:canonical-package` — a synthetic future-version file is refused with a clear message, not mis-parsed; `migrateV1toV2` round-trips | Odin·36.03 |

### ARC-37 · Vector Glass & HI/AI Collaboration ("Vector Glass" = the PLAN+VECTOR-3D wireframe viewport, grounds ARC-05/ARC-28) — Block D
| Sub-CRS | St·§27·demo | CR + SPEC § | Evidence | Gate (executable) | own·dep |
|---|---|---|---|---|---|
| **ARC-37.01** | Planned·altered·★ | canonical Runtime → `WireframeAdapter` → `Line[]` → renderer; PLAN + VECTOR 3D only; the renderer owns no geometry; boundary lines are Space boundaries, not walls — §23 | `new` | `test:wireframe` — R0 → the expected `Line[]` for 9 rect spaces; no Wall/Door/Window entity; PLAN↔VECTOR-3D switch | Pangu·34.* |
| **ARC-37.02** | Planned·survives·★ | **NEW (Krishna): the legacy-view adapter `canonical/legacy-view.ts`** resolving OPEN #5 — `toRoomCells(runtime):RoomCell[]` and `applyEdgeEdit(runtime, bay_code, dir, deltaUm)` (what architect-design's row/col drag maps into). `toRoomCells` emits the non-canonical REQUIRED RoomCell fields as **`windows:0, doors:0, outlets:0, furniture:false, objects:undefined`** (bare Space boundaries — NO refabricated openings, R3), structural fields from canonical (`bay_code→id/k/label`, `width_um/depth_um→w,d`); **`PlacedObject` (`room-objects.ts`) frozen in Phase 0**; `architect-design.tsx` is the **one edge-edit owner**; `applyEdgeEdit` accepts sub-cell µm deltas | `new`; 4 type-only consumers (command-ux1:38, room-designer:36, architect-project-file:12, architect-saved-files:25) + 4 value consumers (voxel-house, tiny-floorplan, architect-design, architect-guard) | `test:legacy-view` — `runtime→toRoomCells→serializeProject→architect-project-file` round-trip byte-stable **before** Block D UI opens; + a **semantic `bay_code`→(row,col)** assertion (C1=row2/col0 … A3=row0/col2 under +Y-North/+X-East), not only byte-stability | Krishna·36.01,34.02 |
| **ARC-37.03** | Planned·altered·★ | select Space → N/E/S/W edge / function / wet edit → **AI PROPOSED IMPACT** → ACCEPT/HOLD/REJECT; only ACCEPT commits; architect-design's accept path **no longer calls `moveRoomInLayout`/`resizeRoomInLayout`** — §14/§16 | Evidence `architect-design.tsx:111/127` currently calls the legacy mutators | **hermetic `test:architect-edit`** (Athena BLOCKING — no browser, in `test:ci`) — preview shows with no revision; ACCEPT→one revision; HOLD/REJECT per ARC-35.01; source scan: legacy write path severed. `architect-planning.spiral` demoted to optional `e2e:*` smoke | Christo·37.02,35.01 |

### ARC-38 · Product Truth (the central outcome — every claim traces to provenance; grounds ARC-23, ARC-12) — Block E
| Sub-CRS | St·§27·demo | CR + SPEC § | Evidence (file:line) | Gate (executable) | own·dep |
|---|---|---|---|---|---|
| **ARC-38.01** | Planned·remembers·★ | hero reads `PLAN · REVIEWABLE · HI Review Required` (the stage WORD, not a bare G#); `9 Spaces · 900 ft² · 3 Wet · 1 Bath` from canonical; `Budget Target $66,800 · ASSUMED` from a named canonical ProjectEntity field with ASSUMED provenance (Aset); `Project Cost · NOT CALCULATED` — **removes the `econ.totalUsd` CALL, not firewall logic** (Enlil) — §03 | `command-ux1.tsx:264-271,336-340` ($325,970 derived) | `test:product-truth` (source scan) — hero WORD strings present; no bare `G<n>`; reads portfolio_stage, not the estimate gate | Sofia·34.04,38.* |
| **ARC-38.02** | Planned·remembers·★ | quarantine every unsupported claim; **SYNC/SPIRAL render `NOT_RUN` until Block B is wired** (Grok — never a second fake); Build `BLOCKED` (word); Lifecycle `Actual · NOT STARTED`; **the walls/studs "Model" tile `command-ux1.tsx:342` quarantined** (Christo — no-walls hard stop) | `:264-271` SYNC/SPIRAL; `panels2.tsx:20-23,47-86`; `:342` walls tile | `test:product-truth` — none of {bare `G<n>`, `$325,970`, `20/33`, Risk LOW/30–50% **as a current fact**, AI APPROVE, Structural PASS/L480, Day 1, synced twins, `2000 ft²`, `Baths 2`, wall/stud counts} render as live claims | Pangu·35.07,37.01 |
| **ARC-38.03** | Planned·supporting | the `30–50% lower risk` KPI shown **only as an ILLUSTRATIVE target with provenance** (reconciles `MASTER_SPEC §2` KPI ↔ the §6 quarantine — target, not a measured current value) | `command-ux1.tsx:336` ("Risk LOW · 30–50% lower") | `test:product-truth` — any 30–50%/risk string carries an explicit ILLUSTRATIVE/target provenance tag, never OBSERVED/current | Sofia·38.02 |
| **ARC-38.04** | Planned·remembers·★ | bath count (1) and area (900) read **from the canonical seed**; **`DEFAULT_PROGRAM.bathrooms`=2 and `DEFAULT_PARAMS.areaSqft`=2000 UNCHANGED** (Thor/Grok — do not show 2/2000 for this project; do not edit the shared defaults) | `room-program.ts:15` (baths 2), `architect-project.ts:38` (area 2000) | `test:product-truth` — the project header shows 1 bath / 900 ft² sourced from canonical; the shared defaults are byte-unchanged | Sofia·34.07 |
| **ARC-38.05** | Live·supporting | firewalls preserved (logic unchanged); `room-layout.ts` superseded, not deleted | firewall files (no delta) | `test:economy`, `test:estimate`, `test:guard`, `architect-project-file` round-trip, `test:room-program` (900 ft²) all green | Krishna·37.02 |
### ARC-39 · Proof & Closeout — Block E
| Sub-CRS | St·§27·demo | CR + SPEC § | Evidence | Gate (executable) | own·dep |
|---|---|---|---|---|---|
| **ARC-39.01** | Required·ALL·★ | the completion-loop test **is** the product proof — one command, STEP 1–8 (two iterations + blocked + **two-run determinism** + **reloaded-R2 terminal replay/reverse** + **degenerate ACCEPT**) — §18/§19/§27. Aggregate proof: depends on ARC-34/35/36 (Sofia) | `new` | `test:completion-loop` — STEP 1–8 PASS from a fresh run | Asar·34,35,36 |
| **ARC-39.02** | Planned·survives·★ | four artifacts + two-commit closeout (A impl → capture SHA → B proof/docs referencing A); `HASH_PROOF.json` **generated by the test** — each `clauses{altered,remembers,verify_reverse,survives}` boolean is **DERIVED from its backing STEP** (altered←2/4, remembers←Replay+event-group, verify_reverse←5/6, survives←6-reloaded); `final_question_pass` = **their AND, AND `test:product-truth` green — never a literal** (R3: ONE named close-out — `test:completion-loop` runs the product-truth source-scan in-process and writes the verdict); carries `implementation_commit===A` + `generated_by_test:true`; **clean-tree at Commit-A** (`git status --porcelain` empty, `HASH_PROOF.json` `.gitignore`d until Commit B); `git checkout A` + that one command regenerates `HASH_PROOF.json` **byte-identical** (whole file). Block D is proven by full `test:ci`, not this verdict — §13/§28/§29 | `new` | a **meta-assertion** inside `test:completion-loop` (no clause true while its STEP failed, Athena); Commit B present; the 3 `.md` artifacts exist | Asar·39.01 |

## ROUND 2–3 AMENDMENTS — ✅ FOLDED into the ARC rows above (this block is now the AUDIT MAP, not a parallel spec)
**Close-out fold complete (Round 3, operator 2026-10-23 "execute plan"):** every amendment below is now carried in the body of its
named ARC row (ARC-35.01/35.05/35.08 · ARC-36.01/36.03/36.04/36.05 · ARC-37.02 · ARC-39.02) and in the execution-facing
atlas/manifest/Verification/Phase-order — so a fleet agent reading only a row gets the full, current shape. **No parallel spec
remains.** Two items are deferred to the `Plan_Arch_003.md` persist (cosmetic, non-blocking per the masters — Phase 0→3 already governs
order): per-row `iface:`/`risk:` literals, and expanding the `dep` column's `34.*`/`35.*` into explicit sub-rows (killing the
`38.01→38.*` self-reference). The bullets below are retained verbatim as the audit trail of what was folded and why:
- **ARC-36.04 + completion-loop STEP 8a/8c (Thor, BLOCKING):** `package_hash`'s `content_hash` is computed over a **volatile-excluded canonical projection** (same exclusion set as `serialize.ts`: `timestamp_ms/local_date/created_at/updated_at/package_hash`), so stored bytes keep provenance for reload while `package_hash` is **time-invariant**. STEP 8a/8c **inject two differing clocks (T, T+Δ)** and assert identical `package_hash` (not just `project_hash`). `rcore.ts`/`package.ts` take an **injected clock** param (mirror `record.ts saveRecord(rec, nowMs=…)`), never call `Date.now` internally. The V2 reader **recomputes `package_hash` on load and fails CLOSED when it ≠ `manifest.seal.json`** (ARC-36.05); add max-entry-count + max-uncompressed-size caps + a null-proto JSON reviver (the safe-parse mechanism).
- **ARC-39.02 (Asar, high):** each `HASH_PROOF` clause boolean is **DERIVED from its backing STEP** (`altered`←STEP2/4 changed `project_hash`; `remembers`←Replay(rev)==stored + event-group present; `verify_reverse`←STEP5/6 Reverse==parent; `survives`←STEP6 terminal on the reloaded object); `final_question_pass` = logical AND, **never a literal**; a meta-assertion fails if any clause is set true while its STEP did not pass. `final_question_pass` reflects **BOTH the completion-loop §27 PASS AND `test:product-truth` green** (one verdict = the north star). A fresh `git checkout A` + rerun regenerates `HASH_PROOF.json` **byte-identical** (whole file: clauses, counts, byte_count), incl. `event_count`/`snapshot_count` equal across the two from-scratch runs.
- **ARC-35.01 + STEP 8 (Enki/Christo, high):** HOLD defers a **live** preview, so a deferred ACCEPT whose base revision has advanced MUST **recompute against the new head (or be invalidated)** — never append against a stale `prev_hash`; gated in `test:rcore` + a completion-loop sub-step. The shared seam type `AiPreviewState {status:PROPOSED|HELD|CLEARED, proposed_change|null}` (ephemeral, hash-excluded) is the one shape the hermetic HOLD≠REJECT gate asserts across D5↔D6↔Asar.
- **ARC-35.02 (Christo):** V1 implements **NO approval verb**; `HI Review Required` renders as a **passive STATUS** (never a clickable CTA), gated by `test:product-truth` (no approve affordance exists); a materially-edited `HI_APPROVED→REVIEWABLE` **signals the downgrade** to the user; the `HI_APPROVED` transition is a declared non-goal this cycle OR gated — not a dangling invariant.
- **ARC-35.08 (Enlil/Athena):** the edge engine gets an **independent `test:rcore` leg** (interior conserves / exterior changes / BLOCKED<1e6 on `runtime-edit.ts`) — not gated ONLY on the Block-C completion-loop. **Exact-floor fencepost:** a neighbor at **exactly 1,000,000µm is ALLOWED**, 999,999 is BLOCKED (strict `<`). **NFC-normalize `bay_code` at neighbor-lookup boundaries** (ARC-36.01's contract covers serialization bytes, not in-memory Map keys).
- **ARC-36.03/36.05 (Enki):** on reload **re-verify the chain root→head AND assert `Replay(head)==stored current project_hash`**; a semantically-broken chain inside a well-formed ZIP is **rejected CLOSED** (decided over render-DIVERGED, one signer-safe line). A **zero-entity** project: `serialize`/`projectHash`/derived-area-Σ are defined (Σ=0) or refused with a signer-safe reason.
- **ARC-37.02 (Krishna, high):** `toRoomCells` emits the non-canonical REQUIRED `RoomCell` fields as **`windows:0, doors:0, outlets:0, furniture:false, objects:undefined`** (so value consumers draw bare Space boundaries — **no refabricated openings**, honouring the no-walls/no-fabrication truth). `test:legacy-view` adds a **semantic `bay_code`→(row,col) assertion** (C1=row2/col0 … A3=row0/col2 under +Y-North/+X-East), not only byte-stability. **`PlacedObject`** (`room-objects.ts`, imported by `room-layout`'s `RoomCell.objects` — the recon "comment-only" note was BACKWARDS, Krishna re-grep) is **FROZEN in Phase 0** alongside A1/A2/A3. `applyEdgeEdit` accepts **sub-cell µm deltas** (the demo UI makes the 1-ft edit the proof shows, or drives the canonical path directly — not only 10-ft cell jumps).
- **Sofia (PO standard):** add per-row **`iface:`** (cite the seam-map entry) + **`risk:`** (the one failure the gate guards) so every ARC row answers all 8 §XXXII fields; **replace wildcard deps** (`34.*`/`35.*`/`38.*`, incl. the self-referential `38.01 dep 38.*`) with explicit upstream sub-rows so Block E is topologically sortable; the ARC **`own` = content/spec owner**, the **file-integrator** (Christo for `command-ux1.tsx`, Enlil for `package.json`) applies the merge — resolves the `38.01`-Sofia vs `E1`-Christo split; mark which leg of `test:canonical-seed` is A-boundary (900 ft²/datum) vs C-dependent (hash determinism needs `serialize.ts`).
- **SPIRAL = PASS (2 refinements):** relabel `serialize.ts` a **Phase-0 contract-adjacent unit** (it is a true upstream dependency of B's and A's hash gates) OR soften the "independent block-boundary gate" prose; **state the §27 proof is headless A/B/C** and demo-critical Block D is proven separately by `test:wireframe`/`architect-edit`/`legacy-view`.
- **SSSES = 88/100 ENHANCE (lowest Succinctness 85):** pre-partition `command-ux1.tsx` into region-scoped diff assignments (integrator merges prepared diffs — unblocks the Phase-2 critical path); gate the anticipatory AuthorityStates (ARC-34.08); add the "edits never mint ids" guard (no runtime-generated id enters `project_hash`); configurable snapshot-interval V2 note.

### Round-3 additions (binding — the final fold; 12/12 masters READY-WITH-NITS, 1 BLOCKING resolved at root)
- **ARC-39.02 close-out verdict (Asar, high):** `final_question_pass` is computed by ONE named close-out — `test:completion-loop`
  imports + runs the `test:product-truth` source-scan **in-process** and writes `final_question_pass = (headless §27 PASS) AND
  (product-truth green)` (never from the loop alone). `git checkout A` + that one command regenerates `HASH_PROOF.json` byte-identical.
  The verdict attests §27 (headless A/B/C) + product-truth; demo-critical **Block D is proven by full `test:ci`** (required before Commit B), not by this verdict.
- **ARC-36.01 sort key (Thoth/Odin/Sofia):** entity sort is on the **raw, case-preserved `entity_id` byte string (NFC)**; lowercasing
  applies ONLY to hex-UUID normalization at generation, never to the sort key; gate two ids differing only in case to sort case-sensitively.
- **ARC-35.01 stale-base (Christo/Enki):** pin ONE outcome — a HELD preview whose base revision advanced is **INVALIDATED** ("preview
  out of date, re-edit"), never recomputed-and-silently-applied; if a recompute would itself be BLOCKED (intervening shrink), also invalidate + clear, write nothing.
- **ARC-35.05 replay (Odin/Sofia, high):** the ≥11-revision gate asserts **`Replay(R>10)==stored` reconstructed FROM the R10 snapshot**
  (drop pre-R10 deltas and still reconstruct) — not merely that a snapshot exists (record.ts has no snapshot, so this path is net-new).
- **ARC-36.05 hostile scope (Thor, high):** the null-proto reviver + entry/size caps apply to **EVERY untrusted parse** — the V1 JSON
  adapter AND every V2 ZIP entry (project.json, deltas, snapshots, seal); add a V2-entry prototype-pollution case (V2 is the default format).
- **ARC-36.04 content_hash encoding (Thoth):** each entry's `content_hash` = `sha256Hex` over the `serializeCanonicalProject` projection
  (UTF-8/NFC), never a bespoke stringify; STEP 8c asserts identical **`package_hash`** (not only `project_hash`) across the two injected clocks.
- **ARC-36.03 zero-entity (Enki):** pick ONE — `Σ=0` defined (serialize/hash/area all defined) — and gate that one contract.
- **Gate naming (Christo):** all new canonical gates are **`test:architect-*`** (`-rcore`, `-canonical-units/-schema/-seed/-serialize/-ref/
  -package/-package-hostile`, `-wireframe`, `-legacy-view`, `-architect-edit`, `-product-truth`, `-completion-loop`) to avoid the existing `test:rcore-*`/`test:room-*` families.
- **AuthorityState (Enki):** `HI_APPROVED` is **not emitted by any V1 path** (no approval verb) → the `HI_APPROVED→REVIEWABLE` downgrade
  is a **declared non-goal this cycle**; ARC-34.08's gate asserts `HI_APPROVED` is un-emitted in V1 (beside the 4 anticipatory values).
- **Clean-tree gate (Thor):** at the Commit-A capture assert `git status --porcelain` is empty (HASH_PROOF `.gitignore`d, no stray artifact) before capturing the SHA.
- **Deps + §XXXII (Sofia/Thoth):** in `Plan_Arch_003.md` every ARC row carries `iface:` + `risk:` and **explicit, acyclic deps** — kill
  the self-referential `ARC-38.01 → 38.*`, expand `34.*`/`35.*` into named sub-rows (Phase 0→3 governs order regardless, so this is a final-cleanliness fold, not a blocker).
- **E7 (Pangu):** the IFC4 mapping table (ARC-34.09) is an explicit **E7 deliverable authored by Pangu** in `SPEC_TRACEABILITY.md`.
- **`serialize.ts` is a Phase-0 contract-adjacent unit** (SPIRAL — it is a true upstream dep of A's/B's hash gates); the `test:canonical-seed`
  two-run-determinism leg is C-dependent (needs the serializer), the 900 ft²/datum legs are A-boundary.

## The completion-loop test (the product proof — operating order §13, v1.2 §19/§27) — Round-1 hardened
`frontend/tests/architect-completion-loop.test.mjs`, one command, **written first (expected to fail), then built toward**:
1. **Load seed** → 9 Spaces, 900 ft² exact, 3 wet, 1 bath, R0, REVIEWABLE, ASSUMED; the **nine entity_ids are the pinned
   UUIDv7 literals** (Thor).
2. **Exterior edit** C1 WEST Δ=304,800 µm → datum unchanged, negative X allowed, C1 area ↑, net program area changes,
   AI preview with **no revision**; **ACCEPT → R1**, C1 entity_id unchanged, one event group, plan_state REVIEWABLE, hash changes.
3. **Save V2 → reload** → same R1 ids/geometry/revision/project_hash/package_hash; the reloaded package carries the R-CORE chain.
4. **Shared edit** on the reloaded project, B2 Kitchen EAST Δ=+304,800 µm → Kitchen +Δ, Dining −Δ, net area unchanged;
   **ACCEPT → R2**, one event group, two entity changes, ids unchanged, hash changes R1→R2.
5. **Replay / SPIRAL (in-memory R2)** → `Replay(R2)==storedR2`; **reverse is pure** → `Reverse(R2 group)==storedR1` with the
   working project left at R2 (Athena); SPIRAL PASS; SYNC SYNCED.
6. **Second save/reload → TERMINAL ON THE PROOF (Asar):** reload R2, then **Replay + Reverse + SPIRAL the RELOADED R2 object**
   (not the in-memory one): `Replay(reloaded R2)==storedR2`, `Reverse(reloaded R2 group)==storedR1`, SPIRAL PASS, SYNC SYNCED,
   same ids/geometry/revision. (R1≠R2; invariant: same revision before save == after reload.)
7. **Blocked neighbor** (against the reloaded R2) — a shared resize forcing neighbor<1,000,000µm →
   `BLOCKED · Neighbor dimension below minimum`; no ACCEPT, no mutation, no revision, **event_count and snapshot_count
   unchanged**, hash unchanged.
8. **Integrity properties (Round 1):** (a) **two-run determinism** — build seed→R0→R1→R2 twice from scratch (or from a clean
   checkout of Commit A) → identical `project_hash` AND `package_hash` both times (Thor; proves no `Date.now`/random in the
   hash path); (b) **degenerate ACCEPT** — empty ACCEPT (nothing staged → no revision), double ACCEPT (idempotent → one
   revision), HOLD-then-ACCEPT (one revision), REJECT (viewport cleared, zero mutation) (Enki/Christo); (c) **determinism of
   provenance** — two runs differing only in `local_date`/`timestamp_ms` → identical `project_hash` and identical replay/reverse
   (Asar); (d) **hostile `.arch2525`** — path-traversal / zip-bomb / bad-magic / `__proto__` inputs are rejected closed (Thor).
   Emits `HASH_PROOF.json` with `final_question_pass` + `clauses{altered,remembers,verify_reverse,survives}`.

## Execution sequence — Blocks A→E, **each block has its OWN independent gate** (Enlil: completion-loop greens only in Block C, so A/B rows may NOT depend on it)
- **BLOCK A (schema · seed · test-first):** `units/types/uuidv7` + `seeds/tiny-home-v1.ts` (pinned seed ids) + the production
  constructor generating R0; write the completion-loop test (fails initially). Independent gates (prove A at A's boundary):
  `test:canonical-units`, `test:canonical-schema`, `test:canonical-seed` (900 ft² exact, datum, two-run determinism of R0).
- **BLOCK B (R-CORE):** `rcore.ts` + the edge engine + HI-ACCEPT in `runtime-edit.ts`; revisions, event groups (GENESIS
  anchor), snapshots (cadence gated), replay, reverse (pure), SPIRAL, SYNC, SUPERSEDED producer. Independent gate: `test:rcore`.
- **BLOCK C (persistence):** `serialize.ts` (NFC/UTF-8 contract) + `package.ts` (store-only ZIP, V1 loader, hostile rejection) +
  the independent canonicalizer; SHA-256; package hash; **completion-loop STEP 1–8 turns green here.** Gates:
  `test:canonical-serialize`, `test:canonical-ref`, `test:canonical-package`, `test:canonical-package-hostile`, `test:completion-loop`.
- **BLOCK D (Vector Glass + collaboration):** `canonical/legacy-view.ts` adapter (`test:legacy-view`, before the UI) → WireframeAdapter
  (PLAN + VECTOR 3D); selection; edge/function/wet edit; AI impact preview; ACCEPT/HOLD/REJECT wired to the canonical runtime
  (NOT `moveRoomInLayout`). Gate: **hermetic `test:architect-edit` (no browser, in `test:ci`)** + `test:wireframe`; the browser
  `architect-planning.spiral` is an optional `e2e:*` smoke, never the CI gate.
- **BLOCK E (product truth + proof):** correct the tabs' claims (hero stage-WORD, SYNC/SPIRAL NOT_RUN, Build BLOCKED, Lifecycle
  NOT STARTED, bath/area from canonical, quarantine the fabricated ribbon/cost/risk/twins/walls-tile); run the suite + completion
  loop; **Commit A** (impl, from a CLEAN tree — Thor); **Commit B** (the four artifacts, `HASH_PROOF.json` referencing A's SHA).
  Gate: `test:product-truth`.
- **CI & push discipline (Round 1):** every new `test:*` file is committed in the SAME commit that declares its script (Enlil —
  `ci-wiring.test.mjs` runs in `prebuild`, so a dangling script reddens `next build`). **Deadline reconciliation (Thor):** Blocks
  A–E are committed LOCALLY in worktrees and gated; the deploy is **ONE push (Commit A + Commit B) with ONE LIVE confirmation at
  the end**, not push-then-confirm-LIVE per block (that collides with NEVER-OUTPACE over the Fri→Mon window). The sandbox cannot
  verify LIVE (proxy 403) → report **UNVERIFIED** + hand the operator the command/URL.

## Files — CREATED vs MODIFIED
- **CREATED:** `frontend/lib/architect-2525/canonical/{units,types,uuidv7,serialize,rcore,runtime,runtime-edit,package,wireframe,legacy-view}.ts`
  (**`runtime.ts`=construct/R0, `runtime-edit.ts`=edge engine+HI-ACCEPT — split DECIDED, Enlil/R2**; `legacy-view.ts`=the adapter);
  `frontend/lib/architect-2525/seeds/tiny-home-v1.ts`; `frontend/tests/architect-{canonical-units,canonical-schema,canonical-seed,canonical-serialize,canonical-ref,canonical-package,canonical-package-hostile,rcore,wireframe,legacy-view,architect-edit,product-truth,completion-loop}.test.mjs`
  (adds **`-package-hostile`** ARC-36.05, **`-legacy-view`** ARC-37.02, **`architect-edit`** ARC-37.03 — R2 Athena: ci-wiring reddens if a declared script has no file);
  `docs/architecture-2525/{SPEC_TRACEABILITY,MIGRATION_NOTES,ASSUMPTION_REGISTER}.md` (SPEC_TRACEABILITY carries the **IFC4 mapping table** ARC-34.09); `HASH_PROOF.json` (**`.gitignore`d until Commit B** so the Commit-A tree is clean — Thor/R2).
- **MODIFIED (special scrutiny):** `frontend/package.json` (new `test:*` scripts + `test:ci` chain, :215);
  `frontend/components/architect-2525/command-ux1.tsx` (hero/ribbon/cost/Build/Lifecycle truth; wire Design tab to canonical
  runtime); `architect-panels2.tsx` (quarantine Structural PASS / AI APPROVE / synced twins); `architect-design.tsx`
  (edit→ACCEPT path); `master-readout.tsx`, `metric-strip.tsx`, `building-program.tsx` (truthful readouts). **No firewall
  file is modified.**

## Tests that must stay green (protect)
`test:economy`, `test:estimate`, `test:guard` (in `test:ci`), `architect-project-file` round-trip (via `test:celestial-i18n`),
`test:room-program` (900 ft²), `test:room-layout`, `test:room-objects`; all shared Innovation-2525 behavior; legacy
`.arch2525` files still open. `tests/ci-wiring.test.mjs` requires every new `test:*` to name a declared script and a real file.

## Verification (end to end)
One command `npm run test:completion-loop` → PASS (**STEP 1–8**, incl. two-run determinism, hostile rejection, degenerate ACCEPT — R2). Full `npm run test:ci` green (new canonical gates + all
protected gates). `npx tsc --noEmit` clean. The two-commit closeout: Commit A (`git rev-parse HEAD` captured) → Commit B
writes `HASH_PROOF.json` {implementation_commit:A, current_revision_id, project_hash, package_hash,
canonical_serialization_byte_count, schema_version, entity_count, event_count, snapshot_count, generated_by_test:true}.
Push both refs; the operator checks on his phone / the live site.

## DECISIONS — RESOLVED by Round 1 adjudication (were OPEN in Round 0)
1. **Human-local date:** RESOLVED → store a `local_date` string on the event group, **hash-excluded**; completion-loop STEP 8c
   proves two runs differing only in `local_date`/`timestamp_ms` yield identical `project_hash` + replay/reverse (Asar).
2. **`financial_record_id`/`financial_record_hash`:** RESOLVED → include as **reserved-nullable** (`null` this cycle) per
   v1.2 §3.3; `test:canonical-schema` asserts present-and-null (ARC-34.08). (Reconciles with operating order §3: the locked
   SPEC §3.3 *does* require them, so they are the one exception to "do not add unless required.")
3. **UUIDv7:** RESOLVED (repo evidence, Enlil) → a **small vetted in-repo `canonical/uuidv7.ts`** (no dep; package.json has no
   uuid lib; `crypto.randomUUID` is v4). **Seed ids are FIXED literals** (Thor); `isUuidV7` gates generation only; `entity_id`
   typed generic 128-bit (Odin). No seedable clock needed — determinism comes from pinned seed ids + runtime ids never entering
   a re-run of the seed hash.
4. **`.arch2525` V2 ZIP:** RESOLVED (repo evidence, Enlil) → **hand-rolled deterministic store-only ZIP** (no `jszip`/`fflate`
   in package.json); `package_hash` from normalized paths + content hashes, never ZIP bytes (ARC-36.04).
5. **Block D reader swap:** RESOLVED (Krishna) → one named bidirectional adapter **`canonical/legacy-view.ts`**
   (`toRoomCells` + `applyEdgeEdit`) with its own gate `test:legacy-view` (ARC-37.02); the 8 consumers split into **4 type-only**
   (safe) + **4 value** (rewired). `.arch2525` V2 persists the R-CORE chain so STEP-5 replay-after-reload works.
6. **CRS numbering:** RESOLVED → **`ARC-34→39`** (extends the locked `ARC-##.##` catalog, anchored not forked — Grok). The
   `CRS-AR.##` working labels of Round 0 are superseded by `ARC-34.##…ARC-39.##`.
7. **Persistence of the plan on execute:** RESOLVED → on approval, Plan_Arch_003 is persisted to
   `docs/architecture-2525/Plan_Arch_003.md` + the ARC-34→39 rows appended to `CRS_ARCHITECTURE-2525.md`/`MASTER_SPEC.md`'s
   catalog (one CRS family, not a second doc).

## THE 48-AGENT A–E EXECUTION FLEET (how this plan is executed, aligned across A–E)
**Goal (operator 2026-10-23): a well-vetted plan that aligns Blocks A–E for a 48-agent AsM fleet to execute in Opus 4.8
within 48 hours.** The fleet is the project's standing shape: **12 Ascended Masters × 3 specialists (builder · adversary ·
voter/summarizer) = 36, + 12 Master-of-Thought coordinators = 48**, in **3 pods of 4 AsM**. For EXECUTION each AsM triad
*owns* a cluster of work units; the 12 MoT coordinate phase order, interfaces, and integration. Alignment across A–E is
enforced by (1) one **frozen shared-contract layer** built first, (2) **one file = one owner per phase**, (3) **worktree
isolation** for parallel agents, (4) **single-integrator** edits to shared files, (5) a **red-first gate per unit**.

### The work-unit atlas (**37 units** — the base 33 below + the 4 Round-1/2 additions: `legacy-view.ts`, hostile-rejection, forward-compat, and the `runtime.ts`/`runtime-edit.ts` split; each is one agent-ownable deliverable with an interface + a red-first gate)
- **Block A — Domain truth (6):** A1 `units.ts` · A2 `types.ts` (entities · EvidenceState · 9 AuthorityState · enums ·
  RCoreEventGroup · RCoreSnapshot) · A3 `uuidv7.ts` (+`isUuidV7`) · A4 `seeds/tiny-home-v1.ts` · A5 `runtime.ts`
  `buildProjectFromSeed → R0` · A6 the **failing** completion-loop test skeleton. Gates: `test:canonical-units/-schema/-seed`.
- **Block B — R-CORE (7):** B1 `rcore.ts` event group + `event_hash` SHA-256 chain (append/verify) · B2 snapshot+delta ·
  B3 replay · B4 reverse · B5 SPIRAL (forward/replay/reverse) · B6 R-CORE SYNC · B7 edge engine + HI-ACCEPT in **`runtime-edit.ts`**
  (interior conserves / exterior changes / **both the neighbor floor AND the edited space's OWN floor** <1,000,000µm BLOCKED — Enki/R3).
  Gate: **`test:architect-rcore`** (named `architect-*` to avoid the existing `test:rcore-*` family — Christo/R3; an **independent**
  edge-engine leg, not only the Block-C completion-loop — Enlil/R3).
- **Block C — Persistence (6):** C1 `serialize.ts` (pure, volatile-excluded) · C2 `projectHash` = `sha256Hex` · C3
  **independent** canonicalizer `tests/architect-canonical-ref.mjs` (node:crypto, must NOT call the production serializer) ·
  C4 `package.ts` V2 writer (deterministic store-only ZIP) · C5 V2 reader + legacy V1 adapter (ZIP-magic first) · C6
  `package_hash` (ordered normalized_path+content_hash). Gates: `test:canonical-serialize/-ref/-package`; **the completion
  loop turns green here.**
- **Block D — Vector Glass (6):** D1 `wireframe.ts` WireframeAdapter (canonical → Line[]) · D2 PLAN view · D3 VECTOR-3D
  view · D4 Space + N/E/S/W edge selection · D5 edit (dim/function/wet) → AI PROPOSED IMPACT preview (one named pure
  `AiPreviewState {status:PROPOSED|HELD|CLEARED, proposed_change|null}`, ephemeral/hash-excluded — Christo/R2) · D6 ACCEPT/
  HOLD/REJECT wired to the canonical runtime (NOT `moveRoomInLayout`) + the `legacy-view.ts` adapter. **One edge-edit entry
  point** owns `architect-design.tsx` (D4+D6+adapter, no collision — Krishna/R2). Gate: **hermetic `test:architect-edit`
  (no browser, in `test:ci`) + `test:wireframe` + `test:legacy-view`**; `architect-planning.spiral.mjs` is an optional
  `e2e:*` smoke, NEVER the CI gate (Athena/R2).
- **Block E — Product truth + proof (8):** E1 hero/ribbon truth (**the stage WORD `PLAN · REVIEWABLE · HI Review Required`,
  NEVER a bare `G#`** — Aset/R2 BLOCKING: `G2`/`G4` collide with the firewall GATES; drop the `G6` literal `command-ux1.tsx:265`;
  "HI Review Required" is a **passive STATUS, not a clickable approval CTA** — V1 has no approval verb, Christo/R2) · E2 SYNC/SPIRAL
  **STATE-DERIVED from live R-CORE** (SYNCED + last SPIRAL result once Block B is wired; renders `NOT_RUN` only when genuinely
  never run — Christo/R2; `:264-271`; never a second fake) · E3 cost truth (`Project Cost · NOT CALCULATED`, `Budget Target
  $66,800 · ASSUMED`; quarantine Trinity/Time-Capital tiles `:337-340,385-394`) · E4 risk truth (quarantine `Risk LOW / 30–50%`
  `:336` as a *current* fact; show 30–50% only as an ILLUSTRATIVE **target** with provenance — reconciles `MASTER_SPEC §2` KPI) ·
  E5 bath=1 & area=900 **from the canonical seed** (do NOT change `DEFAULT_PROGRAM.bathrooms`=2 `room-program.ts:15` or
  `DEFAULT_PARAMS.areaSqft`=2000 `architect-project.ts:38`; read the project's values from canonical state) · E6
  `architect-panels2.tsx` truth (quarantine `Structural PASS·L/480` `:20-23`, `AI APPROVE 94%` `:47-63`, synced twins `:70-86`;
  **Build `BLOCKED` (word only, no bare `G4`** — Aset/R2), Lifecycle `Actual · NOT STARTED`) · E7 `test:product-truth` source-scan
  gate (incl. **no bare `G<n>` anywhere a human reads**) + the 3 `.md` artifacts · E8 two-commit closeout + `HASH_PROOF.json`
  (generated by the test, `.gitignore`d until Commit B). Gate: `test:product-truth`; full `test:ci`; completion loop green.

### Round-1 refinements to the decomposition (Krishna/Thor/Odin) — the atlas grows 33 → 37 units
- **New unit · `canonical/legacy-view.ts`** (ARC-37.02, Krishna): the one bidirectional adapter (`toRoomCells` + `applyEdgeEdit`)
  built and gated (`test:legacy-view`) in **Phase 1**, BEFORE any Block-D UI touches it.
- **New unit · hostile `.arch2525` rejection** (ARC-36.05, Thor): its own unit + gate `test:canonical-package-hostile`, owned by Thor.
- **New unit · forward-compat / `migrateV1toV2`** (ARC-36.06, Odin): `schema_version` + `min_reader_version` + the migrate seam.
- **`runtime.ts` is SPLIT** to prevent the one real Phase-1 file collision: `runtime.ts` (A5 construct/R0, Pod RECORD) +
  `runtime-edit.ts` (B7 edge engine/ACCEPT, Pod FIGHT) — two files, two owners, zero collision.
- **Seam call-direction map (Krishna — so no block assumes the next owns the glue):** `runtime→serialize` (projectHash) ·
  `rcore→serialize` (replay then hash) · `package→{serialize+rcore}` (persist state + chain) · `wireframe→runtime` (Line[]) ·
  `legacy-view↔runtime` (RoomCell view + edge edit). The **8 room-layout consumers split**: 4 **type-only** (command-ux1:38,
  room-designer:36, architect-project-file:12, architect-saved-files:25 — safe if `RoomCell`'s shape is preserved) + 4 **value**
  (voxel-house, tiny-floorplan, architect-design, architect-guard — rewired via the adapter). **`PlacedObject` (`room-objects.ts`)
  IS a type import of `room-layout` (`RoomCell.objects`, `room-layout.ts:21/88` — Krishna/Odin R3 re-grep; the earlier
  "comment-only" note was BACKWARDS) → FROZEN in Phase 0 alongside A1/A2/A3.** (9 room-layout-related frozen contracts, not 8.)

### Pods & AsM→unit ownership (each AsM runs builder + adversary + voter on its units)
- **Pod RECORD (Blocks A + C — canonical truth & persistence):** **Thoth** (A1·C1·C2·C6, data/serialize/hash) · **Aset**
  (A2·A3·C3, types/identity/independent-canonicalizer consistency) · **Enlil** (A4·A5·CI-wiring, build) · **Asar**
  (A6·E7·E8, the completion-loop & proof outcome).
- **Pod FIGHT (Block B — memory, edges, risk):** **Thor** (B1·C4·C5, hash-chain + package + hostile-upload rejection) ·
  **Enki** (B7 edge engine + the blocked/negative-coord/safe-int edge cases) · **Krishna** (B6 SYNC + D6 reader-swap/ACCEPT
  wiring — the cross-module seam that must not break the 8 room-layout consumers) · **Odin** (B2·B3 snapshot+replay + V2
  forward-compat, the memory that survives growth & future IFC-GlobalId bits).
- **Pod MEANING (Blocks D + E — human/AI surface & product truth):** **Athena** (B4·B5 reverse/SPIRAL + D2 PLAN flow) ·
  **Christo** (B7 HI-ACCEPT semantics ACCEPT≠approval + D5 preview + E1 hero — human authority) · **Sofia** (E3·E4·E5 the
  truth tiles + D4 selection — PO standard) · **Pangu** (D1 WireframeAdapter + D3 VECTOR-3D + E2 NOT_RUN + E6 panels2 —
  credible innovation).
- **12 MoT coordinators (4 per pod):** FORMAT (CRS/8-column + ARC-## fidelity) · PRECEDENCE (spec-vs-code conflicts, six-
  field escalation only) · GATEABILITY (every unit has a red-first gate shown failing first) · CUT (scope discipline — no
  capability beyond the truth loop). They sequence the phases and run integration.

### Phase order (the alignment that prevents collision) — ~48h budget
- **Phase 0 · FREEZE THE CONTRACTS (serial, ~3h, Pod RECORD):** build & FREEZE A1/A2/A3 and write the **failing** A6
  completion-loop test. These are every other unit's dependency; once green-compiling they are locked (a `range-spans`-style
  source pin). Nothing parallel starts until the contracts are frozen. Exit: `tsc` clean, A6 fails for the right reason.
- **Phase 1 · PARALLEL CORE (parallel, ~18h):** A4/A5 (RECORD) · all of Block B (FIGHT) · all of Block C (RECORD+Thor),
  each agent in its **own worktree**, each file single-owned. The `runtime.ts`/`runtime-edit.ts` **split is DECIDED** (A5 →
  `runtime.ts` construct/R0, Pod RECORD; B7 → `runtime-edit.ts` edge engine + self/neighbor floor + ACCEPT, Pod FIGHT — two
  files, two owners, zero collision; **no pipeline alternative** — Enlil/R3). Exit: `test:rcore`, `test:canonical-*`, and
  **the completion loop STEP 1–8 turn green** (incl. two-run determinism + hostile + degenerate ACCEPT — Aset/Athena/R3).
- **Phase 2 · SURFACE & TRUTH (parallel, ~18h, Pod MEANING):** Block D (D1–D6) against the now-green runtime; Block E
  (E1–E6) product-truth corrections. `command-ux1.tsx` is shared by D and E → **one integrator (Christo)** applies D-tab
  wiring and E-tab truth in a single sequenced pass over **pre-partitioned region-scoped diffs** (SSSES/R2 — unblocks the
  critical path); others propose diffs, not direct edits. Exit: **hermetic `test:architect-edit` + `test:legacy-view` +
  `test:wireframe` green** (the browser `architect-planning.spiral` is an optional `e2e:*` smoke, NEVER a phase-exit gate —
  Aset/Athena/R3), `test:product-truth` green; no fabricated claim remains.
- **Phase 3 · PROVE & CLOSE (serial, ~6h, Asar + 12 MoT):** full `test:ci`; completion loop green end-to-end from a fresh
  run; the 3 `.md` artifacts + `HASH_PROOF.json`; **Commit A (impl)** → capture SHA → **Commit B (proof/docs referencing A)**.
  Exit: the single final question answers **PASS**.

### Shared-file collision rules (non-negotiable for parallel safety)
- `frontend/package.json` (every block adds `test:*` scripts + the `test:ci` chain) → edited only by **Enlil** (one pass
  per phase collecting all new scripts); `ci-wiring.test.mjs` must stay green (declared script + real file).
- `command-ux1.tsx`, `architect-design.tsx` (Blocks D+E) → **one integrator per file**; parallel agents submit unified diffs.
- Firewalls (`architect-economy.ts`, `architect-estimate.ts`, `room-layout.ts` logic, `hi_rates.py`) → **no owner, no edit.**
- Each unit's agent works in an isolated worktree; the MoT integrator merges in dependency order and runs the gate before merge.

## PLAN VETTING — the SPIRAL test + SSSES review of this plan (run in Round 2)
- **SPIRAL test of the plan (forward A→E + backward E→A):** FORWARD — confirm each block's output is a real input to the
  next (A's frozen types feed B/C; C's green completion loop unblocks D/E; E's proof consumes all). BACKWARD — confirm the
  §27 PASS (E) traces back through C (hash/replay), B (event group/reverse), A (canonical state) with no dangling
  requirement. A SPIRAL FAIL = a block that cannot be built from its predecessors or a proof step with no upstream support.
- **SSSES 5-pillar review of the plan (0–100 each; production-ready = all 100):** Security (firewalls intact, hostile-upload
  rejection, no secret leakage, HI-authority enforced) · Stability (deterministic hash, legacy V1 still opens, no flaky
  gate) · Scalability (snapshot+delta cadence, safe-int headroom, future IFC/engine projections) · Efficiency (48-fleet
  parallelism, one serializer, reuse of `sha256Hex`/`record.ts`/`derisk.ts`) · Succinctness (no capability beyond the truth
  loop, scope discipline, clean module boundaries). Each pillar carries Current/Projected/Confidence/Risk/Recommendation.

## REVIEW RECORD (auditable — the three-round vetting)

### Round 0 — DRAFT v0 (baseline)
Prepended 2026-10-23 after read-only pre-flight recon (3 Explore agents, HEAD `b6688e8ee`): SPEC conflicts = NONE —
implementation discrepancies only. 26 `CRS-AR.##` rows, the 48-fleet decomposition, the SPIRAL/SSSES vetting structure.

### Round 1 — 12× AsM 111-word review → MoT adjudication → **Plan_Arch_001** (workflow `wf_109e44b3-965`, 12/12, 0 errors, 1.21M tokens)
**Verdicts: 3 BLOCKING + 9 ENHANCE.** The twelve insights (each repo-grounded):
- **Aset** (consistency) · **BLOCKING** — the corrected hero `G2·PLAN`/`G4 Qualification` reuses bare **G# glyphs that collide
  with the firewall GATES** (G2=Site, G4=Structural), re-importing the exact G6 lie being removed. Also: SPIRAL "HOLD" clashes
  with the HI HOLD verb; Budget Target needs a canonical home; normalize §citations.
- **Asar** (synthesis) · ENHANCE — §27's conjunction **leaks across two objects**: STEP 5 reverses the in-memory R2, STEP 6 only
  hash-compares the reloaded R2. Make STEP 6 terminal (replay+reverse+SPIRAL the *reloaded* object); HASH_PROOF carries a §27
  verdict + clauses map; §27-clause trace per row.
- **Athena** (test strategy) · **BLOCKING** — `CRS-AR.20`'s only gate is the **browser-only `architect-planning.spiral`**, which
  cannot be in CI → the demoed path "is not done." Needs a hermetic `test:architect-edit`. HOLD/REJECT need a one-command home;
  pin REVERSE as pure.
- **Christo** (human flow) · ENHANCE — **HOLD and REJECT are behaviorally identical** ("write nothing"); distinguish (HOLD defers,
  REJECT clears). The **walls/studs Model tile `:342`** contradicts the no-walls hard stop → quarantine. "HI Review Required"
  implies an unimplemented approval verb.
- **Enki** (edge cases) · ENHANCE — **SUPERSEDED is orphaned** (enumerated, no producer, no gate) — give it one or delete it
  (repo was burned here before). Add degenerate-ACCEPT (empty/double/HOLD-then-ACCEPT); NFC gate; V1 migration = IMPORTED +
  assertSafeInt.
- **Enlil** (build) · ENHANCE — build order verified; one defect: **Block A/B rows gated by "completion-loop STEP N" that only
  greens in Block C** → each block needs an independent gate. File-before-script (ci-wiring runs in prebuild). Promote UUIDv7/ZIP
  OPEN decisions to DECIDED (repo evidence).
- **Krishna** (integration) · ENHANCE — **Block D reader-swap is not concrete** (OPEN #5 while AR.19/20 assume it settled); RoomCell
  is row/col, canonical is µm. Resolve into one `canonical/legacy-view.ts` adapter (`toRoomCells`+`applyEdgeEdit`) + `test:legacy-view`;
  the V2 package must persist the R-CORE chain; seam call-direction map; split the 8 consumers 4 type-only / 4 value.
- **Odin** (future-proof) · ENHANCE — asserting `isUuidV7` on **all** ids would **reject imported IFC GlobalIds** (arbitrary version
  nibbles), blocking the BIM future → type `entity_id` generic 128-bit, gate v7 on generation only. Snapshot cadence unverified
  (loop stops at R2); V2 forward-compat (`min_reader_version` + migrate seam).
- **Pangu** (innovation) · ENHANCE — the canonical hierarchy is **isomorphic to IFC4** (IfcProject→…→IfcSpace) but unstated — the #1
  credibility signal for an ICON reviewer; add a documentation-only note (no IFC code). Label the 4 anticipatory AuthorityStates;
  UUIDv7 time-ordering is unexercised.
- **Sofia** (PO standard) · ENHANCE — only 2 of §XXXII's 8 fields per row; add **Depends-on + User-value (+ Owner + Risk)**;
  AR.25 is an aggregate proof with real prerequisites; define DoD crisply; repurpose the uniform MVP column to flag demo-critical rows.
- **Thoth** (data) · ENHANCE — the §24 safe-int guard **misses the DERIVED area** (width×depth product + Σ), which is what nears
  2^53−1 — a space >~96,952 ft² silently floats, defeating "exact." Pin the canonicalization contract (NFC/UTF-8, **not record.ts's
  UTF-16**); GENESIS anchor for the chain; precise `normalized_path`; lowercase UUID.
- **Thor** (risk/security) · **BLOCKING** — the **hash path is non-deterministic across runs and the gate hides it**:
  `buildProjectFromSeed` mints UUIDv7 ids (timestamp+random), `serialize.ts` includes `entity_id` → `Date.now`/random enter
  `project_hash`; within-run equality passes but a fresh rerun differs → `HASH_PROOF.json` not reproducible from Commit A = a
  **false green PASS**. Fix: pin the 9 seed ids as fixed literals + a two-run determinism assertion. Also: no hostile-upload CRS
  row (Security can't reach 100); single-push phase order; clean-tree at Commit A.

**MoT adjudication (Master of Thought):** all 12 accepted — every finding is genuine and repo-grounded; none conflicts with the
firewalls, hard stops, or the operator's locked decisions. Nothing relitigated the adjudicated "corrections, not escalations"
list. **No §50 escalation raised** (all are plan-strengthening, not SPEC conflicts). Thor's non-determinism + Aset's G# collision
+ Athena's hollow gate are the three that would each have produced a *green-but-false* proof — exactly what the truth loop exists
to prevent, so they are the spine of Plan_Arch_001.

**Change-log — Round 0 → Plan_Arch_001:**
1. **CRS renumbered `CRS-AR.##` → `ARC-34→39`** (Truth-Loop Foundation), anchored to the locked `ARC-##.##` catalog with
   cross-refs (Grok). Rows gained the **4-facet** (CR · Evidence · SPEC § · Gate) + **§XXXII fields** (owner · depends-on · §27
   clause · demo★) [Sofia, DeepSeek].
2. **Determinism spine (Thor):** nine seed `entity_id`s are **pinned UUIDv7 literals**; `entity_id` typed generic 128-bit;
   `isUuidV7` gates generation only (Odin); completion-loop STEP 8 adds **two-run hash equality**; clean-tree Commit A.
3. **PortfolioStage renders as a WORD, never a bare G#** (Aset); `test:product-truth` asserts no bare `G<n>`; all 7 members
   enumerated and proven disjoint from `GATES[]` labels. SPIRAL "HOLD" → **INCONCLUSIVE**.
4. **Hollow→hermetic gate (Athena):** new `test:architect-edit` (no browser) is ARC-37.03's gate; the spiral is demoted to e2e.
   Each block gets an **independent gate** (Enlil); completion-loop is the Block-C integration proof only.
5. **HOLD≠REJECT** distinguished (Christo); **walls/studs tile `:342` quarantined**; **SUPERSEDED given a producer + gate** (Enki).
6. **Derived-area safe-int** (Thoth); **canonicalization contract pinned** UTF-8/NFC (not record.ts's UTF-16); **GENESIS anchor**;
   `normalized_path` pinned; lowercase UUID.
7. **New rows:** ARC-36.05 **hostile `.arch2525` rejection** (Thor) + `test:canonical-package-hostile`; ARC-36.06 **forward-compat**
   (Odin); ARC-37.02 **`legacy-view.ts` adapter** (Krishna) + `test:legacy-view`; ARC-38.03 **30–50% as ILLUSTRATIVE target**; ARC-38.04
   **bath/area from canonical** (DEFAULT_PROGRAM/DEFAULT_PARAMS unchanged — Thor/Grok).
8. **STEP 6 terminal on the reloaded object + §27 verdict in HASH_PROOF** (Asar); STEP 7 asserts event/snapshot counts unchanged.
9. **IFC4-isomorphism documentation note** (Pangu, no code); anticipatory AuthorityStates labelled.
10. **7 OPEN decisions RESOLVED**; **48-fleet atlas 33→37 units** (legacy-view, hostile, forward-compat; `runtime.ts` split);
    seam call-direction map + 4-type-only/4-value consumer split; **single-push + clean-tree** deploy discipline (Thor).

### Round 2 — 12× AsM + SPIRAL + SSSES on Plan_Arch_001 → MoT adjudication → **Plan_Arch_002** (workflow `wf_b71c55f4-faf`, 14/14, 0 errors, 1.72M tokens)
**SPIRAL test of the plan = PASS** (no breaks; forward A→E propagates, backward E→A traces with no dangling requirement). Two
refinements: (1) `serialize.ts` is a true upstream dep of B's/A's hash gates — relabel it Phase-0 contract-adjacent (done in the
amendments); (2) the §27 proof is headless A/B/C — Block D is proven separately (stated). **SSSES review of the plan = 88/100
(ENHANCE)**: Security 88 · Stability 91 · Scalability 86 · Efficiency 89 · **Succinctness 85 (lowest)**. Recommendations folded in
(anticipatory-AuthorityState gate, command-ux1 pre-partition, safe-JSON-parse mechanism, "edits never mint ids" guard).
**12 AsM: 4 BLOCKING + 8 ENHANCE.** Insights:
- **Aset** · BLOCKING · the G#→WORD + STEP 1-8 fixes landed in the CRS rows but NOT the 48-fleet atlas (E1 hero `G2·PLAN`, E6 Build
  `BLOCKED·G4`) / Verification (STEP 1-7). The fleet executes from the atlas → re-imports the lie.
- **Athena** · BLOCKING · same desync (atlas D6 + Phase-2 still name the browser spiral, not `test:architect-edit`); the 3 new
  `test:*` absent from CREATED (ci-wiring reddens); STEP 1-7 vs 1-8; ARC-35.08 gated only on the Block-C loop.
- **Thoth** · BLOCKING · the UTF-8/NFC pin landed for `serialize.ts` but the **event_hash** path still says "mirror record.ts" —
  which uses `charCodeAt`/UTF-16 + folds the timestamp → an ASCII seed passes green while the chain is UTF-16 (green-but-false).
- **Thor** · BLOCKING · determinism closed for `project_hash` but **`package_hash` hashes stored `timestamp_ms`** with no clock
  injected in STEP 8 → two sub-ms runs pass, the reviewer's checkout-A rerun hours later diverges (false-green re-opened in the package).
- **Asar** · ENHANCE · STEP 6 terminal + HASH_PROOF clauses landed; residual — the clause booleans aren't DERIVED from their STEPs
  (a literal `altered=true` = green-but-false); unify completion-loop + product-truth into one verdict.
- **Christo** · ENHANCE · HOLD≠REJECT + walls-tile landed; the approval verb "(if any)" dangles → V1 has none, `HI Review Required`
  is passive STATUS; the hermetic HOLD≠REJECT gate needs one named `AiPreviewState` type.
- **Enki** · ENHANCE · Round-1 items landed; NEW gap born from them — HOLD defers a LIVE preview → a stale-base deferred ACCEPT
  corrupts the chain; exact-floor fencepost (==1,000,000µm); truncated-chain reload; zero-entity; NFC `bay_code` at lookup.
- **Enlil** · ENHANCE · the `runtime.ts` split is NOT propagated (CREATED omits `runtime-edit.ts`; atlas B7 still says `runtime.ts`)
  → recreates the A5/B7 collision; ARC-35.08 needs an independent `test:rcore` leg; name the package.json insertion anchor.
- **Odin** · ENHANCE · a real IFC GlobalId is 22-char base64, not a hyphenated UUID, yet ARC-34.02 pinned "lowercase-UUID" →
  decouple `entity_id` from UUID shape; **schema append-not-edit** (polymorphic `entities`, hash-preserving growth); replay-across-snapshot.
- **Krishna** · ENHANCE · `toRoomCells` must emit the REQUIRED `RoomCell` fields canonical lacks (zero them, else refabricate
  windows/doors) — a green-but-false seam; semantic `bay_code`→(row,col) assertion; `PlacedObject` IS in the type graph (freeze it).
- **Pangu** · ENHANCE · the IFC4-isomorphism note is homeless (no row/owner/gate) → promote to ARC-34.09 with a mapping table + gate;
  AuthorityState as provenance-beyond-IFC.
- **Sofia** · ENHANCE · rows answer 6 of 8 §XXXII fields (Interface + Risk missing per-row); dep wildcards block a topological sort;
  the `own` field conflicts with the atlas file-integrator.

**MoT adjudication:** all 14 accepted. **Dominant theme = the plan carried two representations of the work (the CRS rows, updated
in Round 1; the execution-facing atlas/manifest/verification, NOT updated) and they desynced** — and the 48-fleet executes from the
atlas, so this was the #1 executability risk. **No §50 escalation.** The four BLOCKING each re-opened a green-but-false path one
layer below Round 1's fixes — the same class the truth loop exists to kill — so they are the spine of Plan_Arch_002.

**Change-log — Plan_Arch_001 → Plan_Arch_002:**
1. **Propagated the CRS fixes into the execution sections** (the fleet reads these): atlas **E1/E6 → stage WORD, no bare G#**; atlas
   **D6 → hermetic `test:architect-edit`** (spiral demoted to e2e); **Verification + the loop → STEP 1–8**; **CREATED manifest** now
   lists `runtime-edit.ts`, `legacy-view.ts`, and the `-package-hostile`/`-legacy-view`/`architect-edit` test files; **`runtime.ts`
   split DECIDED** everywhere (construct vs `runtime-edit.ts`).
2. **event_hash determinism (Thoth):** ARC-35.03 now routes every `event_hash`/`prev_hash` through `serializeCanonicalProject`+`sha256Hex`
   (UTF-8/NFC); "mirror record.ts" scoped to CONTROL FLOW only; GENESIS = R0 `project_hash` exactly; NFD chain gate.
3. **package_hash determinism (Thor):** `content_hash` over a volatile-excluded projection; STEP 8a/8c inject two clocks against
   `package_hash`; injected clock in `rcore.ts`/`package.ts`; seal-verify-on-load; HASH_PROOF `.gitignore`d until Commit B (clean-tree).
4. **HASH_PROOF verdict (Asar):** clause booleans DERIVED from their backing STEPs (meta-assertion), `final_question_pass` = AND +
   `test:product-truth` green; byte-identical reproduction from Commit A.
5. **schema append-not-edit + IFC-GlobalId (Odin):** polymorphic `entities` keyed by `entity_type`, additive hash-preserving;
   `entity_id` opaque 128-bit token (case-preserved base64 fixture); schema_version hash-excluded.
6. **HOLD stale-base + AiPreviewState (Enki/Christo);** approval verb = none / passive STATUS; **ARC-35.08 independent `test:rcore`
   leg** + exact-floor fencepost + NFC bay_code; truncated-chain reject-closed; zero-entity defined.
7. **`toRoomCells` zeroing + semantic row/col gate + `PlacedObject` frozen in Phase 0 (Krishna);** one edge-edit owner for `architect-design.tsx`.
8. **NEW row ARC-34.09 (IFC4 isomorphism, owner Pangu, mapping table + gate);** anticipatory-AuthorityState gate (ARC-34.08).
9. **Sofia:** per-row `iface:`/`risk:` (all 8 §XXXII fields), explicit deps (no wildcards), content-owner vs file-integrator stated.
10. **SPIRAL/SSSES:** serialize.ts relabeled Phase-0 contract-adjacent; §27 proof stated headless-A/B/C with D proven separately;
    command-ux1 pre-partition; "edits never mint ids" guard. (Captured in the ROUND-2 DEPTH AMENDMENTS section + the atlas/row edits.)

### Round 3 — 12× AsM final readiness review of Plan_Arch_002 → MoT adjudication → **Plan_Arch_003 (FINAL)** (workflow `wf_ff178c88-6f2`, 12/12, 0 errors, 1.57M tokens)
**Verdicts: 1 BLOCKING (Enlil) + 3 STRONG (Christo, Pangu, Thoth) + 8 ENHANCE. Fleet-ready: 12/12 READY-WITH-NITS (none NOT-READY).**
The round converged — the structural/design work is done; every residual is the same consistency class (a fix landed in the CRS rows
but a parallel representation — the Phase-order subsection, canonical-model line, atlas B7, the dep column, the seam-map line — still
carried the old shape), now down to specific stragglers, plus one genuine new gap. Insights:
- **Enlil** · BLOCKING · the `runtime.ts` split landed in CREATED + Block-B sequence but NOT the canonical-model schema line, atlas B7,
  or Phase 1 (still "OR pipeline") → a RECORD-A5 / FIGHT-B7 pair would collide in `runtime.ts`. **Resolved at root** (split now decided in all four).
- **Aset / Athena** · ENHANCE · the Phase-order exits still read "STEP 1-7" and "planning-spiral leg green" (the coordination layer the 12
  MoT gate phases by) — the last survivors of the atlas/phase desync. **Fixed** (STEP 1-8 + hermetic gate).
- **Enki** · ENHANCE · genuine NEW gap — every floor rule was neighbor-scoped; a shrinking EXTERIOR edit drives the EDITED space below
  `MIN_DIMENSION_UM` with no floor + `assertSafeInt` passes negatives → the 900 ft² proof corrupts green. **Fixed** (self-floor in `runtime-edit.ts` + ARC-35.08).
- **Krishna / Odin** · ENHANCE · the seam-map line still said "room-objects is a comment reference" (contradicting ARC-37.02 + ground
  truth) and Phase-0's freeze omitted `PlacedObject`. **Fixed** (it IS imported; frozen in Phase 0).
- **Asar** · ENHANCE · name the single close-out that computes `final_question_pass = §27 AND product-truth` (else a literal by another
  name); fold the amendments into rows at persist. **Added** (close-out command; fold-at-persist stated).
- **Thor** · ENHANCE · broaden the hostile null-proto reviver from "V1 JSON" to EVERY untrusted parse (V2 is the default format). **Added.**
- **Thoth** · STRONG · event_hash fully landed; residual — ARC-36.01 sort key still said "lowercase-UUID" vs Odin's case-preserved token. **Fixed.**
- **Christo** · STRONG · HOLD≠REJECT/AiPreviewState/approval-verb all landed; pin stale-base = INVALIDATE; rename `test:rcore`→`test:architect-rcore`. **Added.**
- **Pangu** · STRONG · ARC-34.09 IFC4 row landed owned+gated; name it as Pangu's E7 deliverable. **Added.**
- **Sofia** · ENHANCE · content-owner vs file-integrator landed; the dep column still has the `38.01→38.*` cycle + missing per-row iface/risk. **Folded** (persist).
- **Odin (future-proof)** · ENHANCE · snapshot EXISTS at R10 but replay-across-the-boundary unproven. **Added** (snapshot-based-replay assertion).

**MoT adjudication:** all 12 accepted. The one BLOCKING was a propagation gap, not a design flaw, and is resolved at its root (the
canonical-model schema, atlas B7, and Phase 1 now all carry the `runtime-edit.ts` split). Every high straggler is fixed directly in the
execution-facing sections; the deeper items are captured as binding Round-3 amendments to fold into clean ARC rows at persist. **No §50
escalation. No remaining BLOCKING. No NOT-READY.** The three-round vetting did its job: each round caught real, repo-grounded defects the
prior could not — R1 three green-but-false traps · R2 the CRS↔atlas desync + four deeper green-but-false paths · R3 the last propagation
stragglers + the self-floor gap.

**Change-log — Plan_Arch_002 → Plan_Arch_003 (FINAL):**
1. **Runtime split propagated** to the canonical-model schema, atlas B7, and Phase 1 (Enlil BLOCKING resolved); `runtime-edit.ts` carries
   the edge engine + **self & neighbor floor** + HI-ACCEPT.
2. **Phase-order exits fixed:** Phase 1 → STEP 1-8; Phase 2 → hermetic `test:architect-edit`/`-legacy-view`/`-wireframe` (spiral e2e-only).
3. **Self-minimum floor (Enki):** a shrinking exterior edit below `MIN_DIMENSION_UM`/≤0 is BLOCKED; `assertSafeInt` rejects non-positive derived dims.
4. **Seam-map corrected:** `PlacedObject` IS imported by `room-layout` → frozen in Phase 0 (9 frozen contracts).
5. **Round-3 amendments added (binding):** close-out `final_question_pass = §27 AND product-truth`; sort-key case-preservation; stale-base
   INVALIDATE; snapshot-based-replay assertion; hostile reviver across ALL untrusted parses; `package_hash` content-hash encoding + STEP 8c;
   zero-entity Σ=0; `test:architect-*` gate naming; `HI_APPROVED` a declared non-goal; clean-tree `git status --porcelain` gate; per-row
   iface/risk + acyclic deps (persist fold); IFC4 table as Pangu's E7 deliverable; serialize.ts a Phase-0 contract-adjacent unit.
6. **Atlas count 33 → 37** reconciled; status → Plan_Arch_003 FINAL.

**FINAL READINESS:** Plan_Arch_003 is a well-vetted (3× 12-AsM + SPIRAL + SSSES), unambiguous, 48-agent-Opus-4.8-executable A→E contract.
On approval: persist `docs/architecture-2525/Plan_Arch_003.md` (amendments folded into clean ARC rows; the ARC-34→39 rows appended to the
`CRS_ARCHITECTURE-2525.md`/`MASTER_SPEC.md` catalog), then execute Block A → E via the 48-fleet in the Phase 0→3 order.
