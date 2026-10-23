# SPECS / ARCHITECT-2525 — FINAL Master of Thought Handoff · v1.2

**Provenance (operator 2026-10-22).** This is the controlling specification for the ARCHITECT-2525 "truth loop"
implementation mission, converged by a Trinity of reviews — **DeepSeek** (systems/product/UX), **Grok** (code-grounded
adversarial), and **eXeL ◬** (product authority / architecture synthesis) — and cleared by the operator for
implementation. It is persisted here verbatim (PERSIST FIRST) as the governing SPECS that the code cites in doc comments
(e.g. `SPECS / ARCHITECT-2525 §14`). Part 1 is the controlling patch (v1.2, sections 01–27). Part 2 is the Master of
Thought execution prompt (sections I–XXXIV). **Status: CLEARED FOR IMPLEMENTATION.** Target: Claude Code / Fable /
Ultracode · Master of Thought. Window: 1–2 concentrated programming days / up to 48 hours. Demo due Monday 2026-10-26 EOD; this is
the operator's demo and interview prep for the ICON (3D-printed home) Senior Product Owner / Senior Product Manager role
(interview Thursday 2026-10-29).

The operator's one binding correction: a committed `HASH_PROOF.json` cannot contain the SHA of the same Git commit that
contains it. The closeout therefore uses an **implementation commit (A)** followed by a **proof/docs commit (B)**.

---

# PART 1 — v1.2 CONTROLLING PATCH TO THE 48-HOUR IMPLEMENTATION CONTRACT

This patch is additive and controlling. Everything in the prior v1.1 contract remains locked except where explicitly
modified below.

**Do not reopen:** integer micrometres · canonical nine-space program · Southwest datum · UUIDv7 entity identity · same
UUID bits for future IFC GlobalId · 1,000,000 μm minimum dimension guard · estimate-GATE firewall · existing shared
$7.25/hr economy implementation · `.arch2525` V2 ZIP · snapshot + delta R-CORE · STALE / SUPERSEDED semantics · glTF
then OpenUSD · no walls in V1 · no WALK in V1 · no photorealistic geometry · no engine direct write-back · Human
Authority over canonical commits.

## 01 · PRE-FLIGHT — NO CODE BEFORE THE SCHEMA
Before Runtime behavior changes, commit the canonical TypeScript domain contracts. At minimum create explicit source
files for: Project / Site / Building / Storey / Space · EvidenceState · AuthorityState · EvidenceValidity ·
RCoreEventGroup · RCoreSnapshot · portfolio stage · plan state · export manifest · canonical package manifest. Every
major interface/type carries a doc comment referencing its governing SPECS section, e.g.:
```
/** SPECS / ARCHITECT-2525 §14 — Authority and validity are orthogonal. */
export interface EvidenceState { ... }
```
If repository naming forces a materially different type/field name, do not silently drift. Report SPEC ID · CONFLICT ·
CODE EVIDENCE · PROPOSED CHANGE · UPSIDE · MIGRATION IMPACT before changing the domain contract.

## 02 · PRE-FLIGHT — SEED MUST BE ONE AUDITABLE FIXTURE
The canonical nine-space program lives in one dedicated fixture/module — preferred `seeds/tiny-home-v1.json` or a
dedicated immutable TS seed module. It must NOT be constructed inline in `useState(...)`, `useEffect(...)`, `render()`,
or component-local constants. The seed:
```
A1 Master Bedroom     BEDROOM  DRY
A2 Master Bath        BATH     WET
A3 Master Closet      CLOSET   DRY
B1 Living Room        LIVING   DRY
B2 Kitchen            KITCHEN  WET
B3 Dining Room        DINING   DRY
C1 Office             OFFICE   DRY
C2 Utility / Laundry  UTILITY  WET
C3 Entry · Porch      ENTRY    DRY
```
Seed properties: `portfolio_stage = G2_PLAN`, `plan_state = REVIEWABLE`, `authority_state = ASSUMED`, `revision = R0`.
The seed snapshot is GENERATED from this seed through the same canonical Runtime construction and serializer used by
production. **Never hand-write the R0 snapshot.**

## 03 · HEADER — REMOVE "DRAFT"
The canonical seed state is REVIEWABLE. Hero: `G2 · PLAN · REVIEWABLE · HI Review Required`. Secondary: `9 Spaces ·
900 ft² Net Program · 3 Wet · 1 Bath`; `Budget Target $66,800 · ASSUMED`; `Project Cost · NOT CALCULATED`. Do not
display `3×3 Draft` as a state label. "Draft" may appear in explanatory copy but DRAFT is not the canonical plan state.

## 04 · ACCEPT DOES NOT MEAN PLAN APPROVAL
An ACCEPT of a space resize / function change / wet-class change / other V1 plan edit means **commit this proposed
revision**, NOT **approve the entire Plan of Record**. After an ordinary edit ACCEPT: `plan_state = REVIEWABLE`. A
separate future action `PLAN_APPROVED` promotes `plan_state = HI_APPROVED` (not required in the 48-hour loop). If a
previously HI_APPROVED plan is materially edited: `plan_state → REVIEWABLE` and the prior approval becomes `validity =
STALE` with the invalidating revision recorded. Human acceptance of a change and human approval of the whole plan are
separate acts.

## 05 · ORIGIN IS A FIXED DATUM
Canonical datum: Southwest corner of C1 at R0, `datum = [0,0,0]`. The project origin is established there at R0 and is a
permanent project datum; later geometry changes do not redefine or move it. An exterior-edge expansion west of C1 may
produce `x_um < 0` — valid. The datum never recenters. "Southwest corner of C1" describes where the datum was
established at R0, not a permanent requirement that C1's boundary remain coincident with it.

## 06 · HOLD AND REJECT WRITE NOTHING
V1: **ACCEPT** creates canonical Runtime change + revision + R-CORE event group. **HOLD** and **REJECT** create no
Runtime mutation, no revision, no R-CORE event group. `PROPOSAL_REJECTED` may remain in the enum for future audit use
but is UNUSED this cycle. Only ACCEPT commits project history. This prevents a second untested revision path.

## 07 · SHARED BOUNDARY DETERMINISM
V1 resize names an edge: NORTH / EAST / SOUTH / WEST. Interior edge: change propagates to the immediate geometric
neighbor sharing that edge (e.g. B2 Kitchen EAST → B3 Dining WEST); net area conserved. Exterior edge: no neighbor is
invented; net program area may change. Constraint: `minimum_dimension_um = 1_000_000`. If any affected Space would
become smaller: `BLOCKED · Neighbor dimension below minimum` → ACCEPT unavailable, Runtime unchanged, R-CORE gets no
revision.

## 08 · EVIDENCE STATE IS EXPLICITLY TWO-DIMENSIONAL
```
interface EvidenceState {
  authority_state: AuthorityState;
  validity: EvidenceValidity;
  source_revision_id: string;
  invalidated_by_revision_id: string | null;
  invalidated_reason: string | null;
}
```
Do not collapse SIMULATED and STALE into one state. `authority_state = SIMULATED` + `validity = STALE` means: this
evidence was produced by simulation but no longer applies to the current project revision. Validity: CURRENT · STALE
(invalidated; no replacement yet) · SUPERSEDED (newer equivalent evidence exists).

## 09 · CANONICAL SERIALIZER MUST BE ONE PURE FUNCTION
One production function `serializeCanonicalProject(project): string` — the only canonical Runtime serialization used to
compute `project_hash`. It enforces UTF-8 JSON · sorted object keys · deterministic array ordering · no insignificant
whitespace · NFC normalized strings · integer precision-bearing values · exclusion of volatile/UI fields. Test: serialize
→ modify only `updated_at` / camera / selection / transient UI → serialize again → assert byte-identical. If volatile
state changes `project_hash`, implementation fails.

## 10 · INDEPENDENT HASH VERIFICATION
The test suite verifies canonical hashing independently: production canonical serializer → production SHA-256; and a
test-reference path: an independent test canonicalizer → independent SHA-256. Both produce identical hex. The test
implementation must NOT simply call the production serializer internally. Purpose: detect a serializer+hasher that agree
with each other while jointly violating the spec.

## 11 · R0 SNAPSHOT MUST BE GENERATED
Do not commit a manually authored canonical R0 snapshot as source of truth. R0 path: `tiny-home-v1 seed → Runtime
constructor → canonical serializer → project hash → snapshot R0`. The same path initializes real projects. This ensures
`Runtime(seed) == Replay(R0)` from day one.

## 12 · PACKAGE HASH EXCLUDES ARCHIVE ACCIDENTS
`package_hash` covers canonical file contents, NOT ZIP entry timestamps / compression / ZIP ordering accidents / archive
metadata / OS metadata. Hash canonical contents in explicit deterministic path order, e.g. `/project.json`,
`/events/events.jsonl`, `/snapshots/R0.json`, `/snapshots/R10.json` … then hash the deterministic sequence of
`normalized_path` + `content_hash`. `manifest.seal.json` stays outside the data it seals.

## 13 · HASH_PROOF CLOSEOUT — TWO COMMITS
Do not put the SHA of a Git commit inside a file in the same commit. **Commit A (IMPLEMENTATION):** product code, tests,
canonical schemas, migration, completion-loop test; record `IMPLEMENTATION_SHA = git rev-parse HEAD`. **Commit B (PROOF
/ DOCS):** adds `HASH_PROOF.json`, `SPEC_TRACEABILITY.md`, `MIGRATION_NOTES.md`, `ASSUMPTION_REGISTER.md`.
`HASH_PROOF.json` records `{ implementation_commit: <A SHA>, current_revision_id, project_hash, package_hash,
canonical_serialization_byte_count, schema_version, generated_by_test: true }`.

## 14 · REQUIRED ARTIFACT — SPEC_TRACEABILITY.md
Block E produces `SPEC_TRACEABILITY.md`: for every controlling SPECS section implemented, a row `Spec | Requirement |
Implementation | Test | Status` (e.g. §08 Integer μm … PASS; §14 EvidenceState … PASS). A missing implementation path
means not implemented; a missing test means not proven unless explicitly marked MANUAL / NONEXECUTABLE with
justification. Deferred sections marked `DEFERRED · per §48`. Do not quietly omit.

## 15 · REQUIRED ARTIFACT — MIGRATION_NOTES.md
Document: fixture cleanup (for every previous Runtime-looking fixture: old value, old location, new disposition ∈
SANDBOX / REMOVED / LEGACY ONLY / DEFERRED — e.g. G6 hardcode, 20/33, $325,970, $0.12/min, confidence percentages,
structural PASS, AI approve, Build Day 1, synced Lifecycle twins, 2,000 ft², Baths 2); shared modules (record whether
`architect-economy.ts`, `architect-estimate.ts`, `room-layout.ts` changed, and distinguish logic changed from
presentation only); renamed fields (old → new, compatibility). This file prevents removed bad semantics reappearing.

## 16 · REQUIRED ARTIFACT — ASSUMPTION_REGISTER.md
Record every initial `authority_state = ASSUMED`: at minimum the Tiny Home seed program (source `template:TINY_HOME`;
promotion: human Plan approval or explicit design decision), Storey height `3,048,000 μm` (promotion: human/professional
confirmation), Budget target `$66,800` (promotion: human budget confirmation / later controlled source). Each lists ID,
value, meaning, source, authority state, introduced revision, promotion condition, current validity.

## 17 · REQUIRED ARTIFACT — HASH_PROOF.json
Generated by the automated completion test against Commit A. Minimum: implementation_commit, schema_version,
current_revision_id, project_hash, package_hash, canonical_serialization_byte_count, entity_count, event_count,
snapshot_count. Do not manually type the hashes — the test writes the artifact.

## 18 · COMPLETION LOOP MUST BE AUTOMATED
An executable test (`tests/completion-loop.spec.ts` or the repo equivalent). The proof must not depend on a manual
walkthrough. One command (as close as tooling permits to `npm test -- completion-loop`): PASS or FAIL.

## 19 · COMPLETION LOOP RUNS TWICE
Prove persistence beyond a single save/load boundary. **Iteration one (exterior edge):** start R0; EXTERIOR edge edit
(e.g. C1 WEST Δ = 304,800 μm); preview; ACCEPT; R1; area changes; R-CORE event group exists; SPIRAL passes; Replay
reconstructs R1; save `.arch2525`; reload; identity/hash preserved. **Iteration two (shared edge):** on the RELOADED
project, SHARED edge edit (e.g. B2 Kitchen EAST Δ = 304,800 μm) → Kitchen width +Δ, Dining width −Δ, Net Program Area
unchanged; preview; ACCEPT; R2; one multi-entity event group; invalidated evidence → STALE where applicable; SPIRAL
passes; Replay reconstructs R2; save; reload; identity/hash preserved. R1 and R2 hashes naturally differ; the
requirement is that the hash before save and after reload of the same revision is identical.

## 20 · COMPLETION LOOP ALSO PROVES BLOCKED GEOMETRY
Exercise a shared-edge proposal that would cause `neighbor_dimension < 1_000_000 μm` → BLOCKED; verify no ACCEPT
control/state, no Runtime mutation, no new revision, no event group, previous project hash unchanged.

## 21 · HARD STOP — NO WALK
Do not add WALK mode, even as a demonstration. WALK implies openings, collision, camera-height assumptions, circulation
semantics, more BIM maturity — outside G2/V1. Only PLAN and VECTOR 3D.

## 22 · HARD STOP — NO VISUAL WALL GEOMETRY
The Vector Glass may visually produce boundary lines that resemble walls; they remain derived Space boundary lines. They
must not become Wall entities, extruded wall meshes, structural/collision geometry, implied openings or assemblies. No
"temporary" wall objects for the demo. Walls begin at G3. This protects the parametric-primary contract.

## 23 · TEST REVISION NUMBERS ARE SYNTHETIC
Tests discussing R31/R32/R33 for STALE/SUPERSEDED are synthetic harness fixtures only. The live seed begins R0; first
ACCEPT R1; second ACCEPT R2. Do not seed fake revision history into Runtime to satisfy stale-evidence tests.

## 24 · SAFE INTEGER RULE
V1 geometry/area fits within JS safe integers for the 3×3 project. Before every canonical integer write or multiplication
feeding canonical state/hash: `Number.isSafeInteger(value)` must hold. Do not serialize precision-bearing canonical
integers greater than `2^53 − 1`. A future model approaching the boundary migrates deliberately to canonical bigint /
string-integer — never floats as a shortcut.

## 25 · FINAL 48-HOUR BUILD ORDER
- **BLOCK A — SCHEMA + SEED** (before Runtime modification): commit canonical domain types, evidence types, R-CORE event
  types, seed fixture; generate R0 through the production constructor; prove exact 900 ft²; prove canonical datum.
- **BLOCK B — RUNTIME + R-CORE:** UUIDv7 entities; μm geometry; portfolio stage; REVIEWABLE plan state; deterministic
  editing; HI ACCEPT; revision generation; event groups; snapshots; replay; reverse; SPIRAL; R-CORE SYNC.
- **BLOCK C — FILE + HASH:** canonical serializer; independent test canonicalizer; SHA-256; V2 `.arch2525`; V1 loader;
  deterministic package hash; round-trip tests.
- **BLOCK D — VECTOR GLASS + PRODUCT TRUTH:** WireframeAdapter; PLAN; VECTOR 3D; Space selection; edge editing;
  function/wet edit; AI impact preview; ACCEPT/HOLD/REJECT; all tab truth cleanup.
- **BLOCK E — PROOF + DOCUMENTATION:** complete acceptance suite; two-iteration completion loop (exterior edge, shared
  edge, blocked neighbor); implementation commit; proof/docs commit; SPEC_TRACEABILITY.md; MIGRATION_NOTES.md;
  ASSUMPTION_REGISTER.md; HASH_PROOF.json.

## 26 · DEFINITION OF DONE
Done only when: nine canonical Spaces exist independently of SVG; every entity has stable UUIDv7 identity; integer μm
geometry is canonical; AI/system can propose but only HI ACCEPT commits; edit ACCEPT does not falsely mark Plan
HI_APPROVED; committed revisions are reconstructable; SPIRAL forward/replay/reverse pass; save/reload preserves canonical
state and hashes; exterior and shared edges both work; invalid shared-edge proposals block cleanly; Vector Glass derives
from Runtime; no unsupported G6/PASS/APPROVE/Build/Lifecycle claims remain; every implemented requirement maps to code
and proof; the automated completion test passes from a fresh checkout against the recorded implementation commit.

## 27 · FINAL MASTER OF THOUGHT DIRECTIVE
Cleared to execute. Before changing product behavior: (1) write the schema; (2) write the seed; (3) make the completion
loop executable as a test; (4) then implement toward that test. Do not optimize for visual completion. Do not add extra
product capabilities to make the demonstration more impressive. Do not reinterpret fixture data as project truth. Do not
silently repair a spec conflict. Do not treat current UI implementation as canonical product meaning. Leave behind
something another engineer, AI, or Product Owner can inspect and independently prove. The single final product question:
**Can ARCHITECT-2525 prove that a human-authorized change altered canonical building state, that R-CORE remembers exactly
what happened, that SPIRAL can verify and reverse it, and that the proof survives serialization and reload?** The answer
must be executable: PASS, not subjective. Build the truth loop. Humanity decides · Technology assists · R-CORE remembers
· SPIRAL verifies · SSSES qualifies · Trust must be proven.

**Final verdict: YES — CLEARED FOR IMPLEMENTATION.** (Grok's four corrections are binding; DeepSeek's pre-flight, proof
artifacts, serializer hardening, two-pass completion loop and hard stops improve the handoff; the only modified
recommendation was the Git-SHA artifact mechanism, so the proof remains logically possible and reproducible.)

---

# PART 2 — MASTER OF THOUGHT EXECUTION PROMPT (Claude Code / Fable / Ultracode)

ARCHITECT-2525 · 48-Hour Execution Mission. This is a code-grounded execution mission, not an ideation session. Three
independent intelligence inputs: **Grok** (code-grounded adversarial review) · **DeepSeek** (systems/product/UX review) ·
**eXeL ◬** (product authority & architecture synthesis — controlling interpretation of VISION • 2525, R-CORE, SPIRAL,
SSSES, Trinity, Human Authority, ARCHITECT-2525 semantics, and the consolidated spec). All three matter; they are not
votes; do not average or choose two against one. Use them as a Trinity of perspective reconciled against (1) the locked
eXeL product specification, (2) the actual repository, (3) executable evidence. Authority chain: **VISION / Product
Intent → SPECS / ARCHITECT-2525 → Repository Evidence → Executable Tests → Implementation.**

**I · TRINITY OPERATING MODEL** — Consciousness: WISDOM (understand what a state means before implementing it; distinguish
fact / assumption / calculation / simulation / proposal / human acceptance / qualification) · CONNECTION (every material
object keeps its relationships across Design, R-CORE, Replay, cost, simulation, future BIM, future Unity/Unreal, Build,
Lifecycle — no isolated screens telling different stories) · HARMONY (UI state, Runtime state, replayed state and saved
state describe the same project revision).

**II · INTELLIGENCE FRAMEWORK** — H.I. (judgment, acceptance, responsibility, authority, final consequential decision) ·
A.I. (observation, organization, calculation, simulation, comparison, impact analysis, recommendation) · S.I.
(principles, wisdom, conscience, human dignity, long-horizon stewardship). In software: **AI PREPARES · HI DECIDES ·
R-CORE REMEMBERS.** AI must never silently convert a proposal into project truth.

**III · EVOLUTION FRAMEWORK** — CREATE (canonical objects + human intent) · TRANSFORM (controlled revisions, simulation,
iteration) · SUSTAIN (replay, traceability, qualification, lifecycle, retained knowledge). Support all three without
confusing them.

**IV · VISION • 2525 DOCTRINE** — Humanity decides · Technology assists · Trust must be proven. For ARCHITECT-2525: Human
proposes/directs → AI assists & exposes consequences → HI accepts/holds/rejects → R-CORE commits the accepted reality →
SPIRAL verifies propagation & reconstruction → SSSES later qualifies readiness. Do not collapse these roles.

**V · EXISTING INNOVATION-2525 REFERENCES** — study for interaction patterns and shared language before inventing:
Drone-2525/Range (lightweight mission glass, human confirmation, action gating, replay, state visibility, 1983-inspired
vector character — inherit the spirit, not copyrighted Star Wars assets) · SensorFusion-2525 (edge-first behavior,
truthful degradation, machine assistance without pretending unavailable capability exists) · Security-2525 (human
authority, prepared vs autonomous actions, status language, coordination) · ARCHITECT-2525 (the app being corrected) ·
`/experiences/docs/`. Do not refactor other 2525 apps this cycle unless a shared utility must be safely reused.

**VI · PRODUCT CONTEXT** — ARCHITECT-2525 demonstrates the intersection of software · systems engineering · automation ·
physical construction · product leadership · human-machine coordination. It may be viewed externally as evidence of
capability relevant to companies across software, robotics, manufacturing, engineering and construction. Do not insert
job-seeking language into the product; make the software itself credible. A technical reviewer should see requirements
discipline, interface discipline, human authority, systems thinking, testability, deterministic state, replay,
interoperability planning, product judgment, scope control.

**VII · CONTROLLING SPECIFICATION** — SPECS / ARCHITECT-2525 v1.2 (Part 1) is Product Authority. Grok and DeepSeek are
supporting intelligence. Where either conflicts with v1.2, v1.2 controls unless the repository proves a permitted
exception. Challenge the controlling spec only for (1) genuine technical impossibility, (2) an existing canonical eXeL
contract that directly conflicts, (3) a materially safer architecture preserving the same product semantics. Never
silently modify; report SPEC ID / CONFLICT / CODE EVIDENCE / PROPOSED CHANGE / UPSIDE / MIGRATION IMPACT and continue
unaffected portions.

**VIII · NON-NEGOTIABLE ARCHITECTURE** — (1) `.arch2525` is project truth, not SVG/React/canvas/mesh/IFC/glTF/USD/
Unreal/Unity (all representations). (2) Parametric/semantic first: Project→Site→Building→Storey→Space×9; no canonical
Walls/Doors/Windows/Roofs/Furniture/MEP/structural in V1 (Walls begin at G3 DEVELOP). (3) Canonical units = integer
micrometres (1mm=1,000μm, 1in=25,400μm, 1ft=304,800μm, 10ft=3,048,000μm); no canonical floats, no feet-inch strings as
data. (4) Canonical coords right-handed (+X East, +Y North, +Z Up); datum `[0,0,0]` at SW corner of C1 at R0, never
recenters; negative coords after edits are valid. (5) Identity = UUIDv7 per entity; survives rename/move/resize/
revision/export; future IFC GlobalId encodes the same UUID bits; no second BIM identity.

**IX · LOCKED NINE-SPACE SEED** — as §02; each Space `3,048,000 μm × 3,048,000 μm` = 100 ft² → 900 ft² exact; wet A2/B2/
C2; bath count 1; seed state G2_PLAN / REVIEWABLE / ASSUMED / R0; hero `G2 · PLAN · REVIEWABLE · HI Review Required`; do
not mark the seed HI_APPROVED.

**X · EXISTING GATE FIREWALL** — the repo has an existing estimate/construction gate system. Do not rename/rewrite/
reinterpret GATES, `architect-estimate.ts`, `arch2525.gate`, `confidenceForGate(...)`. Portfolio stage is separate:
G1_CONCEPT · G2_PLAN · G3_DEVELOP · G4_QUALIFY · G5_BUILD · G6_MAXIMIZE · G7_RETIRE. The ARCHITECT header reads the
portfolio stage, never the estimate gate index.

**XI · ECONOMY FIREWALL** — do not modify shared hi_rates / computeEconomy semantics this cycle; shared rate behavior
stays whatever current shared code requires, including the existing $7.25/hr implementation. ARCHITECT Runtime must not
display a rate as construction cost. Current Runtime: `Budget Target · $66,800 · ASSUMED`, `Project Cost · NOT
CALCULATED`. Remove/quarantine unsupported: $325,970 · $0.12/min · $5.4507/hr · $7,943.10 · $6,017.50 · 249000 · 49800.
MoT = Master of Thought; do not display `MoT × $/min`. Do not rename shared internal variables merely because legacy
shared economy code uses `mot`.

**XII · AUTHORITY + VALIDITY** — orthogonal, per §08. Examples: SIMULATED+CURRENT · SIMULATED+STALE · HI_APPROVED+STALE ·
CALCULATED+SUPERSEDED. STALE is not an authority state.

**XIII · HUMAN COMMIT SEMANTICS** — per §04. An ordinary edit ACCEPT = commit this revision, not approve the plan; after
resize/function/wet edit `plan_state = REVIEWABLE`; full `PLAN_APPROVED` is a separate future action, not required this
cycle; a materially modified HI_APPROVED plan → REVIEWABLE and prior approval → STALE.

**XIV · V1 EDITING** — select Space · select N/E/S/W edge · enter dimension adjustment · change function · change wet
class · preview impact · ACCEPT · HOLD · REJECT · local undo. Only ACCEPT commits; HOLD/REJECT write nothing. No wall
tool, no door/window tool, no freeform CAD.

**XV · EDGE ENGINE** — per §07. Interior edge affects the immediate neighbor sharing it (net area conserved); exterior
edge has no neighbor (net area may change); minimum 1,000,000 μm; a neighbor that would shrink below it → `BLOCKED ·
Neighbor dimension below minimum`, no ACCEPT, no mutation, no revision, same project hash.

**XVI · AI / HI DESIGN COLLABORATION** — before ACCEPT, show AI PROPOSED IMPACT (edge Δ, widths, net program area,
entities affected, prior results invalidated). AI may detect/calculate/explain/recommend; AI must not commit/approve/
qualify.

**XVII · R-CORE** — only committed human decisions produce canonical revisions. Event groups with at minimum event_id,
revision_id, parent_revision_id, event_type, actor_id, actor_role, timestamp_ms, reason, changes[], invalidated_entities[],
invalidated_metrics[], invalidated_evidence[], invalidated_exports[], event_hash. Snapshot + delta: snapshots at R0,
every 10 committed revisions, every HI-approved gate transition. Replay loads nearest prior snapshot and applies event
groups.

**XVIII · SPIRAL** — V1 checks: FORWARD (accepted change propagates) · REPLAY (R-CORE reconstructs exact canonical
state/hash) · REVERSE (inverse of complete latest event group reconstructs exact parent hash). States NOT_RUN · PASS ·
HOLD · FAIL.

**XIX · R-CORE SYNC** — Runtime canonical hash equals Replay-reconstructed current revision hash → SYNCED. Other states
PENDING · DIVERGED · OFFLINE.

**XX · STALE EVIDENCE** — never erase prior evidence; never let stale evidence count as current. R31 evidence invalidated
by R32: authority_state unchanged, validity=STALE, source_revision_id=R31, invalidated_by_revision_id=R32. A new
equivalent at R33: old R31 → SUPERSEDED, new R33 → CURRENT. Applies later to simulation, cost, SSSES, risk, professional
approval, IFC, glTF, USD.

**XXI · .ARCH2525 V2** — new saves use a ZIP container: `/project.json`, `/manifest.json`, `/manifest.seal.json`,
`/events/events.jsonl`, `/snapshots/`, `/requirements.json`, `/assets/`, `/exports/`. Existing single-JSON `.arch2525`
must still open through a legacy adapter; new saves use V2.

**XXII · CANONICAL HASHING** — one production pure `serializeCanonicalProject(project): string` (UTF-8, sorted keys,
deterministic array ordering, NFC strings, no insignificant whitespace, precision-bearing numbers as safe integers,
exclude volatile/UI). SHA-256. project_hash must not depend on camera/selection/updated timestamp/React state/ZIP
metadata. package_hash must not include ZIP timestamps/compression bytes/archive ordering; it covers deterministic
normalized paths + canonical content hashes.

**XXIII · VECTOR GLASS** — the first visualization is deliberately lightweight: 1983-inspired vector technical/targeting
computer in the spirit of the eXeL Range; not photorealistic, not a Star Wars copy. Dark field, neutral luminous lines,
grid, north indicator, minimal vector labels, selection halo, limited state colors, fast PLAN / VECTOR 3D switching.
Pipeline: canonical Runtime → WireframeAdapter → Line[] → renderer. The renderer never owns geometry. SVG may remain
temporarily if it consumes the derived line list.

**XXIV · HARD STOPS** — no WALK (not even a PoC); no visual wall geometry (boundary lines are Space boundaries, not
extruded walls); no IFC / glTF / OpenUSD generation; no Unreal/Unity plugins; no structural simulation (no fake L/480);
no photorealism. All future architecture only.

**XXV · FUTURE INTEROPERABILITY** — architect now, implement later: one canonical `.arch2525`, many projections
(Wireframe · Quantity/Cost · IFC 4.3 · glTF/GLB · OpenUSD · Unreal/Unity). Future engine objects resolve to
`arch_entity_id` + `arch_revision_id`; Unreal/Unity never directly mutate Runtime; engine-originated edits become
proposals returned to ARCHITECT for HI disposition.

**XXVI · PRE-FLIGHT BEFORE PRODUCT CODE** — (1) SCHEMA AS FILES (canonical TS types with SPECS references in doc
comments); (2) SEED AS FIXTURE (one auditable tiny-home seed module/file, not inside a component); (3) COMPLETION LOOP AS
TEST (the integration/e2e test before building toward it — the test is the product proof).

**XXVII · COMPLETION TEST** — repo equivalent of `tests/completion-loop.spec.ts`, executable from one command, run twice.
PASS ONE (exterior edge): from R0, move C1 WEST exterior edge by 304800 μm → datum unchanged, negative X permitted, C1
area increases, net program area changes, AI previews impact, HI ACCEPT, exactly one event group, R1, SPIRAL PASS, R-CORE
SYNCED, Replay reconstructs identical R1 hash, save, reload, same entity IDs/geometry/R1 project hash. PASS TWO (shared
edge): on the reloaded project, move B2 Kitchen EAST edge by 304800 μm → Kitchen width increases, Dining width decreases,
net area conserved, one event group, two entity changes, R2, affected prior evidence → STALE, SPIRAL PASS, R-CORE SYNCED,
Replay reconstructs identical R2 hash, save, reload, same IDs/geometry/R2 hash. BLOCKED: a shared resize causing neighbor
dimension < 1,000,000 μm → BLOCKED, no ACCEPT, no revision, no event, hash unchanged. This loop is the final product
acceptance test.

**XXVIII · REQUIRED NON-CODE ARTIFACTS** — `SPEC_TRACEABILITY.md` (spec → code → test → status) · `MIGRATION_NOTES.md`
(fixtures removed/moved to Sandbox, legacy retained, field renames, shared modules deliberately unchanged, compatibility)
· `ASSUMPTION_REGISTER.md` (Tiny Home template program, 3,048,000 μm assumed storey height, $66,800 budget target, every
other ASSUMED seed value, with promotion conditions) · `HASH_PROOF.json` (generated by test; implementation_commit,
schema_version, current_revision_id, project_hash, package_hash, canonical_serialization_byte_count, entity_count,
event_count, snapshot_count; do not hand-type hashes).

**XXIX · TWO-COMMIT CLOSEOUT** — Commit A (IMPLEMENTATION): code, schema, tests, migration, completion-loop test; capture
`git rev-parse HEAD`. Commit B (PROOF/DOCS): the four artifacts; `HASH_PROOF.json` references Commit A.

**XXX · REPOSITORY ENTRY POINTS** — inspect immediately: `frontend/components/architect-2525/tiny-floorplan.tsx`,
`frontend/lib/room-layout.ts`, `frontend/lib/architect-estimate.ts`, `frontend/components/architect-2525/
architect-economy.ts`, `architect-project-file.ts`, `use-layer-state.ts`, `command-ux1.tsx`, `MASTER_SPEC.md`. Search:
TINY_ROOM_LAYOUT, RoomCell, DEFAULT_PARAMS.areaSqft, GATES, confidenceForGate, arch2525.gate, moveRoomInLayout,
resizeRoomInLayout, moduleHash, DEFAULT_RATE_PER_HR, computeEconomy. Do not assume these names are complete; trace
imports and consumers before editing shared code.

**XXXI · 48-HOUR EXECUTION SEQUENCE** — BLOCK A (DOMAIN TRUTH): schema, seed, entity hierarchy, UUIDv7, μm geometry,
fixed datum, 900 ft² derivation, portfolio stage, plan state, EvidenceState → exit: a canonical G2 project exists
independently of the current SVG. BLOCK B (R-CORE): R0, revision IDs, HI commit, event groups, snapshots, replay,
reverse, SPIRAL, R-CORE SYNC → exit: the project can prove how it changed. BLOCK C (PERSISTENCE): canonical serializer,
independent test canonicalizer, SHA-256, V2 ZIP, legacy V1 loader, package hashing, round-trip → exit: project truth
survives process boundaries. BLOCK D (VECTOR GLASS): canonical geometry → WireframeAdapter → PLAN / VECTOR 3D; selection,
edge editing, function/wet edit, impact preview, ACCEPT/HOLD/REJECT → exit: human and AI collaborate without making the
renderer authoritative. BLOCK E (TRUTHFUL PRODUCT): correct Overview/Design/Simulate/Review/Build/Lifecycle; remove/
quarantine hardcoded G6, 20/33, fake project cost/risk/confidence, AI approve, Structural PASS, Day 1, synced Lifecycle
twins, 2,000 ft², Baths 2, unsupported rates; run the suite + completion loop; implementation commit; proof artifacts;
documentation commit.

**XXXII · PRODUCT OWNER STANDARD** — every implemented item answerable as Requirement · User value · Owner · Dependency ·
Interface · Acceptance test · Risk · Definition of done. If a feature cannot answer these, do not expand the cycle to
include it. Scope discipline is part of the product.

**XXXIII · OUTPUT BACK TO eXeL ◬** — on completion, one concise Master of Thought report, exactly: (1) EXECUTIVE RESULT
(PASS / PASS WITH EXCEPTIONS / BLOCKED); (2) IMPLEMENTED (completed SPECS sections); (3) CODE CHANGES (file → purpose);
(4) TEST RESULT (total tests, pass/fail, completion-loop result, R1 project hash, R2 project hash, package hash,
legacy-file test, estimate-gate regression, economy regression); (5) SPEC EXCEPTIONS (only genuine, with SPEC ID /
CONFLICT / CODE EVIDENCE / DECISION); (6) REQUIRED ARTIFACTS (paths to the four); (7) DEFERRED (WAIT items remain
unimplemented); (8) NEXT BUILD (≤5 recommendations; do not redesign; recommend the next highest-value dependencies
unlocked).

**XXXIV · FINAL STANDARD** — success is not "the dashboard looks better." It is: ARCHITECT-2525 can prove that a
human-authorized change altered canonical building state, that AI exposed its consequences before commitment, that R-CORE
remembers exactly what happened, that SPIRAL can reconstruct and reverse it, and that the proof survives save and reload.
That is the foundation from which BIM, IFC, Unity, Unreal, simulations, qualification, construction and Lifecycle grow,
and the pattern all Innovation-2525 products should share. HI directs · AI assists · SI keeps capability aligned with
purpose. Create · Transform · Sustain. Humanity decides · Technology assists · Trust must be proven.

**MASTER OF THOUGHT: inspect the repository · build the truth loop · prove it · leave the evidence behind.**

---

# PART 3 — eXeL ◬ INTEGRATION CLARIFICATION (v1.2 addendum, operator 2026-10-22)

Additive and controlling, on top of Parts 1–2. Shapes the canonical schema (Block A); honors the Financial-2525 and economy firewalls.

## 3.1 · Symbol convention (Innovation-2525, connects to Financial-2525)
웃 carries the **human-context** interpretation; ◬ carries the **machine/system-context** record. Display them as the
symbol alone — e.g. `웃 Date: October 22, 2026 · Central` and `◬ Timestamp: 2026-10-23T01:01:00Z`. Do NOT expand them
visibly into "HI Date", "AI Timestamp", "웃 HI Date", or "◬ AI Timestamp"; the symbol carries the meaning. Accessibility
text or a glossary may explain the symbol non-visually, but the visible interface attaches no redundant acronym.

## 3.2 · R-CORE time representation — carry both
When an Architect event needs human context and machine provenance, preserve BOTH: a **웃 Date** (contextual, local —
`October 22, 2026 · Central`) and a **◬ Timestamp** (the absolute system instant, UTC — `2026-10-23T01:01:00Z`). The
first is contextual; the second is absolute. The ◬ absolute timestamp is a volatile/provenance field and is EXCLUDED
from the canonical project_hash (§09/§24); determinism is unaffected.

## 3.3 · Financial-2525 boundary — reference, never duplicate
ARCHITECT-2525 must not invent a second financial/time ledger. **Financial-2525** (/financial-2525) is the canonical
Innovation-2525 surface for time/value/transaction semantics (Measure of Time, transaction records, local day/time,
Length (MoT), transaction hash, real-time financial state).
- **Architect owns:** building/project state · project revisions · design decisions · human authority · project
  assumptions · project **budget target** (ASSUMED) · R-CORE design history.
- **Financial-2525 owns:** canonical time/value semantics · financial accrual/ledger · transaction records · financial
  rates · financial hashes/provenance.
- Architect **references** a financial record by identity/provenance — `financial_record_id`, `financial_record_hash`
  (nullable, reserved; unused this cycle) — and never copies Financial-2525 calculations into Architect Runtime to
  populate a card. Future chain: ARCHITECT event → R-CORE revision → Financial-2525 reference (where applicable) →
  independently auditable financial/time record.

## 3.4 · MoT namespace boundary (schema-critical)
"Master of Thought" (authorship / disciplined reasoning / a human-intelligence concept) and Financial-2525's "MoT"
(a Financial-2525-defined measure in its ledger/time model) are DISTINCT and must not be silently merged or either
product redefined this cycle. In new ARCHITECT canonical types use explicit, source-qualified names — `master_of_thought`
and (reserved) `financial2525_mot` — and **never a generic `mot` field**. Existing shared legacy economy code using `mot`
stays untouched (the economy firewall); it is not refactored this cycle.

## 3.5 · This 48-hour cycle — boundary only
Do NOT integrate Financial-2525 transactions · do NOT change shared financial rates · do NOT redesign Financial-2525 ·
do NOT add new financial calculations to Architect. Preserve the architectural boundary and avoid any field that makes
future integration ambiguous. Principle: **Architect remembers what changed · Financial-2525 remembers the associated
time/value record · R-CORE preserves the evidence connecting them.**
