# R-CORE Simulation Architecture — Manual SIM Mode • 2525

> Folds the eXeL AI custom-GPT "Master of Thought — R-CORE Simulation Architecture" memo
> + the Thought Master's refinements into the shipped design. Manual is built; Semi/Auto
> are scaffolded and **earned**, never toggled on.

## North star
The **Cube never changes; only the execution engine changes.** A cube is unplugged from one
engine and replugged into another without modifying cube logic:

```
Cube → Manual Engine   (human leads · AI assists)
     → Semi-Auto Engine (AI proposes · human selects)   [scaffold]
     → Autonomous Engine (AI executes · human governs)  [scaffold]
```

This is already the built `challenge_loop.decide_swap` 3-tier gate:
`manual = overall_passed AND human_approved` · `semi = AND human_selected` ·
`automated = AND tally_votes.approved AND verdict.equivalent`.

## The Manual workflow (audit-first — Thought Master)
`Select Cube → Select Level (3/6/9) → highlighted mini-cubes → Select Section → Read LIVE →
Edit Candidate → CHECK IN → SUBMIT TO SIMULATE → Compare → Verdict → Human Review →
Submit Contribution → Replay.`

Two **distinct** actions:
- **Check In** — versions the candidate + writes Replay evidence. Nothing runs (the audit anchor).
- **Submit to Simulate** — runs the checked-in candidate vs the current metrics + validators.

HI (웃) tokens finalize **only after ≥3 distinct SoI members validate the outcome** (anti-dishonesty).

## The visual — reuse the prior 3/6/9 language
- A cube = **3×3×3 = 27 mini-cubes** = its permanent identity fingerprint.
- 4 code **sections** (A/B/C/D) → the cube's real ordered functions.
- Pure `voxel_highlight(cube_id, level, section) → 0..26` — seeded by cube_id (unique per cube),
  the 4 sections partition the 27, `level ∈ {3,6,9}` scales density. Backend is the single
  source (`sections[].highlight`); the frontend renders it — no drift.
- Reuses the live theme viz's atom-orbit 3/6/9 dial + Flower-of-Life circle-packing language.

## Shared R-CORE vs polling-specific
| Shared (Vision-2525 reuse) | Polling-specific |
|---|---|
| `challenge_loop` (baseline↔candidate→verdict→3-tier swap) · `execution_modes` gate | the 9 cube harnesses (real logic) |
| `voxel_highlight` / `sections.py` (deterministic visual contract) | per-cube section labels + functions |
| `replay_against_dataset` (section-scoped, deterministic) | the 5000-row poll corpus |
| `core.audit.log_audit` + `GovernanceOverride` (Human Authority) | Borda / theming / token math |
| `SimulationRun` (versioned run store) · Cube Dashboard (compose `readiness_profile`) | — |

## Dependencies (Cube 2/3/4/7 ↔ sim)
Voice (3) → Text (2) pipeline → Collector (4) → … → Ranking (7). The sim replays **each cube's
own harness**; cross-cube order is preserved by the harness signatures. `core.universal.get_by_cube`
is the shared I/O-contract source feeding every cube's workbench diagram.

## Replay · SSSES · Human Authority · Knowledge Graph strategy
- **Replay** = operational memory. Every check-in/submit is `log_audit`'d; Replay stores only
  `{cube, level, section}` and regenerates the visual (small payloads, perfect reproducibility).
- **SSSES** = `compare_metrics` non-regression gate (tests ≥100% · duration ≤120% · no pillar
  decrease) + per-cube `metrics.py`. A measured per-pillar % engine is a convergence item.
- **Human Authority** = append-only `log_audit` + `GovernanceOverride` (mandatory justification);
  a Manual swap is human-approved and permanent-override-able (Thor).
- **Knowledge Graph** = backend ABSENT; scaffold/document only, never faked.

## Confidence · Maturity · Promotion (per-slice ledger)
Every slice reports: Replay · Human Authority · R-CORE Extraction · Knowledge · Tech Debt ·
Confidence · **Maturity L0→L5** (prototype → verified → replay-enabled → qualified →
shared-candidate → certified). **Promotion Rules bind existing thresholds** (`decide_swap`
tiers + `dispatch_execution_mode` guardrails + `compute_readiness` ready-gate) — automation is
earned via evidence, never manually enabled.

## Simulation Scenario Engine
The §6 workbench replay is the first instance of a reusable **Vision-2525 Simulation Scenario
Engine** — extract later for Architect-2525 / Security-2525 / Manta-2525 / Drone-2525 (the
renderer + engine never change; only the metadata does).

## Shipped (overnight sprint) vs deferred
**Shipped:** mock parity · all-9 I/O + metrics · deterministic sections + voxel_highlight ·
all-9 section-scoped replay · check-in + submit endpoints (SimulationRun wired) · the
Cube-Architecture fingerprint · the Manual workbench.
**Deferred (earned / needs infra):** Semi/Auto real execution · CRSRecord persistence ·
measured SSSES % · Knowledge-Graph backend · S2 sandboxed exec · full 3-member attestation flow.

## Commit sequence
§1 mock fix · §2 I/O+metrics · §3 sections+voxel · §4a replay-all-9 · §4b check-in+submit ·
§5 grid fingerprint · §6 workbench · §7 i18n · §8 docs+explainer · §9 convergence.
