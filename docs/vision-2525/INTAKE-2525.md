# Vision • 2525 — Handoff Intake & Execution Log
*Intake of the parallel-session (Opus 5) handoff package into the eXeL-AI-Polling repo. — Master of Thought, 2026-07-25*

This records what arrived, what was **executed**, what is **parked** (and why), and closes
the one genuine gap the handoff flagged.

## Executed now
- **Donate flow hardening** — folded the two real fixes from `donate-worker.js` into the live
  edge Checkout function (`frontend/functions/api/donate.js`): `Idempotency-Key` (a mobile
  double-tap can't create two Checkout Sessions) + `submit_type=donate` (Stripe renders a
  "Donate" button + framing). Amount is already validated server-side in cents, the exact
  root-cause the runbook names ("sending 1.11 instead of 111").
- **Design docs preserved in-repo** — `CRS-GOVERNANCE-PLAN.md`, `PROJECT-UNLOCK-DESIGN.md`
  (source-of-truth for the requirements/unlock model), + `reference/explode-view.js` (Three.js
  exploded-cube reference, kept under `docs/` so it is NOT compiled — it imports the
  not-yet-attached `cube-partitions.js`).
- **Project Innovation UNLOCK tab already shipped** (`42971d5`): `/innovation`, gated `369963`,
  implements CRS-36→93 core (RACK+STACK funding line, derived financial model, 3×3×3 gate cube,
  risk market, upside pool, AI·SI·HI load). The handoff's CRS extraction is its spec.

## Gap closed — "What is SI?" (handoff §6.1 · CRS-93)
The handoff calls this "the only genuine hole." It is resolvable from this repo's own
`CLAUDE.md` (SoI Trinity): **SI = Shared Intent** — the middle of the three intelligences
**A.I. (Artificial ◬) · S.I. (Shared Intent ♡) · H.I. (Human 웃)**.

**Measurement rule for CRS-93 (proposed sub CRS-93.01):** per team, per window,
- **AI load** = share of cell-advancing events executed by an automated/model agent.
- **HI load** = share executed by individual human cognitive effort — *this is the
  burnout-guarded axis*; sustained HI above threshold withholds upside (CRS-93 as written).
- **SI load** = share of cell-advancing events whose payload is a **closed collective-decision
  artifact** — a themed poll outcome, a quorum/consensus vote, or a DACI alignment. Formally:
  `SI = (cell-advancing events resolved by a closed poll/consensus artifact) / (all cell-advancing events)`.

SI is the healthy relief valve: work moved by *shared intent* (the polling loop) offloads HI
without being pure AI. The burnout guard triggers on **HI**, never on SI or AI — so a team that
converts individual load into collective decision *lowers* its burnout exposure. That gives SI a
definable, testable measurement rule, which is what CRS-93 was missing.

## Parked — awaiting inputs (cannot execute yet, flagged not dropped)
- **`cube-partitions.js`** not attached → `explode-view.js` can't be wired (imports `assignCells`).
  Park until the partitioner arrives; then it can replace the CSS gate-cube on `/innovation`.
- **`Innovation_Project_CRS_v2.xlsx`** — needs the xlsx reader to extract the live incentive model;
  the incentive math (11.1% pool vs burn-avoided) is already reflected in `/innovation`.
- **4-sheet gap-analysis Excel** — the governance triage (Part 2) needs it to produce the ordered
  backlog + `crs.yaml`. Not attached.
- **`crs.yaml` source-of-truth** (governance §1.1) — recommend generating from CRS-36→93 next;
  large (58 records) but mechanical. Deferred to a dedicated pass.
- **Egress-blocked** items unchanged: authoritative OSM/GEBCO Paris pull; real-provider MT.

## Decisions surfaced to the operator (from handoff §6, unchanged — need human calls)
1. Incentive rate vs 11.1% (bank cash vs pull-forward). 2. Cube-6 clustering ADRs (embeddings+KMeans
vs per-row LLM; provider order; sampling). 3. Which 9 deliverables fill 18→27 cells. 4. One-cube-per-
project vs ten (unlock §8.1). 5. Reconcile Series 1–8 vs CRS-01→35. 6. Legal clearance on Series 1–8
(FLIR-derived provenance).

## Competitive notes to honor in any pitch (handoff §4)
Sopheon → **Wellspring Accolade** (acq. Feb 2024). "Stage-Gate"® is trademarked — use **G1–G7**.
Drop NetSuite/SAP-PS from the comparison (feed SAP, don't fight it). The defensible claim is
**"mitigated pays the same as materialized"** — that specific rule has no prior art.
