# ARCHITECT-2525 — EXECUTION ADVISORY (eXeL ◬ + Grok + DeepSeek → Master of Thought)

> Operator-handed, 2026-10-23, during the Plan_Arch_003 A→E sprint. Persisted verbatim (PERSIST FIRST) before
> being acted on. **Not a new plan** — Plan_Arch_003 is FINAL and execution is underway; this note only
> improves judgment where execution creates choices the plan could not anticipate. Where repository evidence,
> tests, or the implementation path indicate a better answer, Master of Thought decides. MoT may ignore any
> item that does not improve the actual implementation.

Plan_Arch_003 is already FINAL and execution is underway. This is not another plan. Do not restart planning,
reopen requirements, reshuffle Blocks A–E, or pause implementation merely to satisfy this note. Use these
observations only where they improve execution.

## 1 · Treat concurrency as a variable, not an objective
Keep the full 48-agent intelligence fabric available; that does not require 48 simultaneous writers. The
highest-risk files are the shared contracts — canonical types · units · identity · serializer · revision/event
schema · Runtime construction · Runtime editing · package format. These benefit from many reviewers but few
authoritative writers. As contracts stabilize, broader parallelism becomes safer. If early integration
produces contract forks, repeated merge conflicts, test weakening, or semantic drift, reduce writer concurrency
without reducing review/adversarial capacity. Agent utilization is not the goal; integrated correctness is.

## 2 · Make the fleet prove what it checked
Avoid status such as "0 errors" (that only means no defect was reported). Prefer: the defect classes explicitly
challenged — canonical-state leakage · stale fixtures · timestamp regeneration · hash contamination ·
wrong-neighbor resize · HOLD mutation · false approval · legacy UI truth bleed · package nondeterminism — then
the result of those challenges. This converts fleet telemetry from activity into evidence.

## 3 · Preserve dissent
The Voting/Summarizer must not erase a technically specific dissent because two agents agree. Structure review
as: Consensus · Dissent · Evidence · Adjudication. If two agents agree generically while the third identifies a
concrete repository or test failure, preserve the dissent. The fleet is not majority voting; it increases the
probability that consequential failure modes are found before integration.

## 4 · Continue hunting "green-but-false"
Before a requirement is complete, ask: how could this code pass its tests while still lying to the user?
Examples: correct-looking UI sourced from a legacy fixture rather than canonical Runtime; project-hash tests
where production and reference paths share the same faulty canonicalization; Replay compared against output
from the same faulty logic; HOLD creating no revision but mutating Runtime in memory; ACCEPT committing
correctly but falsely producing HI_APPROVED; SYNC green without Runtime-hash = replay-hash proof; a shared-edge
test conserving area while altering the wrong Space; ZIP roundtrip succeeding while identity depends on archive
metadata; stale evidence still contributing to current metrics; a live tab exposing legacy 2,000-ft² / Baths-2
after canonical says 900 / 1. Close each new class with an executable assertion where practical. The planning
SPIRAL/SSSES reviews are not evidence that no further implementation defects exist.

## 5 · Keep planning evidence and Runtime evidence visibly separate
SPIRAL Plan Coherence = PASS and SSSES Planning Readiness = 88/100 evaluated the PLAN; they do not establish
Runtime state. Until actual product proof exists, do not let those values leak into the live Architect surface
as Runtime SPIRAL PASS / R-CORE SYNCED / SSSES qualified. Runtime earns those states through executable
evidence. Keep planning-score labels explicit enough that a reviewer cannot mistake them for product telemetry.

## 6 · Three small implementation traps with large consequences
- **Space elevation:** for the initial Storey, `Space.z_um = 0`; 3,048,000 µm is the Storey HEIGHT, not the Z
  origin of every Space.
- **Edit acceptance:** an ordinary accepted edit → `plan_state = REVIEWABLE`, not HI_APPROVED. Human acceptance
  of a revision and human approval of the Plan of Record are different acts.
- **Minimum dimension:** validate both the affected neighbor AND the edited Space itself. Any resulting
  dimension below 1,000,000 µm, non-positive, or unsafe blocks the proposal without mutation/revision/event. An
  exterior edge has no neighbor, but the edited Space's own minimum still applies.

## 7 · Keep R-CORE architecturally narrow
Financial-2525 may provide implementation patterns; do not let pattern reuse become semantic import. Architect
R-CORE stays about accepted Architect project history: append · verify · snapshot · replay · reverse · sync. Do
not pull in financial transaction semantics, rates, correctTx, unionRecords, financial MoT, or ledger
ownership. ARCHITECT and Financial-2525 interoperate by reference, not by becoming one domain.

## 8 · The live glass is part of the truth loop
A correct canonical subsystem under a fictional screen is not complete success. The surface must reflect the
canonical system: header from `portfolio_stage` (not the estimate gate); 900 ft² from canonical geometry; 1
Bath from canonical Space functions; project cost NOT CALCULATED unless a legitimate calculation exists;
R-CORE/SYNC/SPIRAL from executable state; unsupported G6 / Structural PASS / AI APPROVE / fake confidence /
Build-Day / Lifecycle claims disappear or are properly quarantined. This is the final projection of canonical
truth, not cosmetic polish.

## 9 · MIGRATION_NOTES should preserve reasons
Disposition + cause, not disposition alone. e.g. `Structural PASS · L/480 → REMOVED — WHY: no structural
engineering model or evidence can produce this qualification — REPLACEMENT: no qualification until supported
evidence exists.` $325,970 = the wrong SOURCE OF AUTHORITY for project cost; Risk LOW = no canonical risk
evidence; AI APPROVE 94% = violated authority semantics + calibrated-confidence; 2,000 ft² / Baths 2 = a
different project/default model, not the canonical nine-space Runtime. Reasons make regression less likely.

## 10 · Keep the two-commit proof logically clean
Commit A = implementation + executable tests → capture its SHA. Commit B = proof/docs incl. `HASH_PROOF.json`
referencing Commit A. Refinement: **do NOT make the Commit-A completion-loop test depend on `HASH_PROOF.json`**
(it does not exist yet at Commit A). Verify the Git relationship with a dedicated closeout/proof validator
AFTER Commit B: `HASH_PROOF.implementation_commit == Commit_A_SHA` and `!= Commit_B_SHA`. Two separate proofs:
completion loop → product behavior; closeout validator → provenance of the proof artifact.

## 11 · Protect the second iteration
The first edit proves canonical state can change. The second edit (after reload) proves persistence/identities/
revision-history survived, canonical state keeps evolving, shared-edge geometry is correct, multi-entity R-CORE
events work, Replay reconstructs R2, Reverse reconstructs R1. If R1 passes and R2 fails, the loop is not
complete. Do not trade away iteration two for cosmetic demo time.

## 12 · Priority when trading off
canonical truth → accepted transition → R-CORE → replay/reverse → deterministic persistence → truthful live
projection → proof artifacts → cosmetic refinement. UI is not skippable; embellishment cannot compensate for an
unproven loop. A simple interface telling the truth beats an impressive one displaying unsupported claims.

## 13 · One authoritative compiled copy
If an earlier agent drafted canonical files outside the primary tree, do not maintain two implementations. The
authoritative modules live where the running app and CI compile them. One contract · one implementation · many
consumers.

## 14 · Think modularly without building future modules
Establish the pattern: Canonical Runtime → Controlled Human-Authorized Change → R-CORE Revision → Verification →
Persistence → Replaceable Projections. That foundation later supports IFC / glTF / OpenUSD / Unreal / Unity /
simulation / costing / construction / lifecycle / Financial-2525 references. Do not implement those now; protect
the seams. Future modularity comes from stable ownership, stable identity, deterministic state, and explicit
interfaces — not from prematurely implementing every future adapter.

## eXeL ◬ architectural view
One canonical truth · many projections · explicit authority · retained provenance · independent verification.
ARCHITECT knows what it owns; Financial-2525 knows what it owns; future simulation/construction know what they
own. Systems connect through stable identities, revisions, evidence, and references rather than by copying one
another's internal models.

## Final standard
The strongest outcome is not "48 agents completed their assignments." It is: a skeptical engineer can inspect
the implementation, run the proof, reproduce the hashes, replay the history, reverse the accepted revision,
reload the package, and see the live Architect surface telling the same story.

Humanity decides · Technology assists · R-CORE remembers · SPIRAL verifies · SSSES qualifies · Trust must be proven.

---

## MoT reconciliation — where the sprint already stands against this advisory (2026-10-23)
Recorded so the advisory is actioned, not just filed. Blocks A/B/C are built, gated, and LIVE (ab3502fe5 → 03db0b672):
- **#6 traps — already honored:** seed `z_um = 0` with StoreyEntity `height_um = 3,048,000` (tiny-home-v1.ts);
  `acceptEdit` sets `plan_state = REVIEWABLE`, never HI_APPROVED (runtime-edit.ts §04); the edge engine blocks on
  BOTH neighbor and self below 1,000,000 µm / ≤0 / unsafe (runtime-edit.ts, gated in architect-rcore).
- **#7 R-CORE narrow — honored:** rcore.ts mirrors only append/replay/verify CONTROL FLOW; no correctTx,
  unionRecords, rates, or financial MoT; financial refs are reserved-null only.
- **#4 green-but-false — honored so far:** two-run determinism (timestamp/local_date hash-excluded), an
  INDEPENDENT node:crypto canonicalizer that does not call the production serializer (architect-canonical-ref),
  reverse proven pure, package identity from content not ZIP bytes, HOLD/REJECT proven to write nothing.
- **#13 one copy — honored:** the only canonical modules live at frontend/lib/architect-2525/canonical/; no second tree.
- **To action in Block D/E:** #5 (live SYNC/SPIRAL/SSSES must read NOT_RUN until Runtime proves them — never the
  planning 88/PASS); #8 (truthful live projection); #9 (MIGRATION_NOTES disposition + WHY); #10 (completion-loop
  must not depend on HASH_PROOF.json; add a separate closeout validator checking impl_commit == A != B); #11
  (iteration two already in the completion-loop — keep it); #2/#3 (fleet reports challenged defect classes +
  preserves dissent: Consensus · Dissent · Evidence · Adjudication).
