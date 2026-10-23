# ARCHITECT-2525 v1.2 — Assumption register

> Every value the demo presents that is **ASSUMED** — not observed, not calculated from canonical state, not imported
> — is listed here with where it lives, why it is assumed, its AuthorityState, and what evidence would move it off
> ASSUMED. The central outcome of the truth loop is that *every visible claim traces to canonical Runtime state, a
> declared assumption, a derived calculation, a recorded human decision, or explicit illustrative data — never an
> unsupported assertion.* This file is the home of the "declared assumption" branch. `command-ux1.tsx:198` cites it by
> name (§16).
>
> AuthorityState legend (the 9-value provenance axis): ILLUSTRATIVE · OBSERVED · IMPORTED · **ASSUMED** · CALCULATED ·
> SIMULATED · AI_PROPOSED · HI_APPROVED · QUALIFIED. ASSUMED is honest: it says "a human put this in as a working
> figure", distinct from a number the system measured or derived.

## The assumptions, each declared

| # | value | where | authority | why assumed | what moves it off ASSUMED |
|---|---|---|---|---|---|
| A1 | **Storey height = 3,048,000 µm (10 ft)** | `seeds/tiny-home-v1.ts` `storey_height_um: E` | ASSUMED | the tiny-home seed needs a storey height to be a complete `StoreyEntity`; 10 ft is a plausible residential clear-plus-assembly figure, not a surveyed one | a real section / a CALCULATED assembly stack, stamped CALCULATED |
| A2 | **Budget Target = $66,800 USD** (rendered `$66,800.00` via `fmtUsd`, two fraction digits) | `components/architect-2525/command-ux1.tsx:198` `BUDGET_TARGET_USD` | ASSUMED (presentation constant, **not** canonical state) | a demo needs a target to anchor against; it is a UI figure shown as "ASSUMED", not a field in the canonical model. The canonical `financial_record_id`/`financial_record_hash` are **null/reserved** — Architect never computes money (§3.3/§3.4) | a Financial-2525 record referenced by `financial_record_id`, read as IMPORTED/CALCULATED from that engine — not computed in Architect |
| A3 | **The nine-space program** (A1 BEDROOM · A2 BATH · A3 CLOSET · B1 LIVING · B2 KITCHEN · B3 DINING · C1 OFFICE · C2 UTILITY · C3 ENTRY; wet = A2/B2/C2; one BATH) | `seeds/tiny-home-v1.ts` | ASSUMED | this is a template tiny home (`actor: template:TINY_HOME`), a worked example, not a client's brief | a real brief → the program becomes OBSERVED (what the client stated) or AI_PROPOSED then HI_APPROVED |
| A4 | **Each space 3,048,000 × 3,048,000 µm (10 × 10 ft = 100.0 ft²)** → **900.0 ft² total** | `seeds/tiny-home-v1.ts` (all `width_um`/`depth_um` = `E`) | ASSUMED (seed geometry) | a uniform 3×3 bay grid is the simplest geometry that proves the area math exactly (100 ft²/space, integer-µm, no float) | an edited plan → the geometry stays canonical (CALCULATED area) but is no longer the seed's assumed grid |
| A5 | **Portfolio stage G2_PLAN, plan_state REVIEWABLE, project authority ASSUMED, R0** | `canonical/runtime.ts` (`buildProjectFromSeed`) | ASSUMED | the seed enters the life cycle at "planning, reviewable" — nothing has been approved or built | an HI decision advances the stage; plan_state only leaves REVIEWABLE by a recorded approval verb (not implemented in V1 — a declared non-goal) |
| A6 | **Datum [0,0,0] at C1's SW corner; +X East, +Y North, +Z Up; never recenters** | `canonical/runtime.ts` `datum: [0,0,0]` | ASSUMED (a chosen convention) | a fixed origin makes negative coordinates valid and keeps the hash stable across edits that grow the building westward | it is a convention, not a measurement; it does not move off ASSUMED — it is declared and invariant |

## What is explicitly NOT asserted (the honest NOT-x values the surface shows)

These are shown on the live Architect surface as a refusal to claim, which is itself the truthful state — they are
**not** assumptions, they are absences:

| shown as | why |
|---|---|
| **Project Cost · NOT CALCULATED** | Architect does not compute construction cost; the economy figure is a time-value rate, not a build cost (§XI). The old `$325,970` claim is removed |
| **Gross Building Area · NOT CALCULATED** | only net program area (900 ft²) is derived from canonical state; gross requires wall assemblies the model deliberately does not carry (no-walls hard stop) |
| **SPIRAL · NOT_RUN / R-CORE · NOT_RUN / SSSES · NOT_RUN** | the live surface has not run the loop; it must read NOT_RUN until the Runtime proves it, never the planning scores (SPIRAL PASS / SSSES 88 live only in the plan, advisory #5) |
| **Build · BLOCKED · Lifecycle · Actual NOT STARTED** | nothing has been built; the fabricated "Day 1 / Concrete / Footings+Slab" and synced-twin claims are quarantined |

## Illustrative demo data on the ribbon (not assumptions, not canonical state)

Two labels on the project ribbon are **explicit illustrative data** (the §16 branch) — demo scaffolding, not
evidentiary building-state claims. They are named here so the register is complete and a reviewer is never misled
into reading them as traced values:

| label | where | what it is | the honest note |
|---|---|---|---|
| **PROJECT `V2525-000842`** | `command-ux1.tsx:277` (hardcoded) | an illustrative human-friendly project number for the demo | it is **not** the canonical `project_id`; the canonical id is the seed UUID `0192f000-0000-7000-8000-000000000001` (`seeds/tiny-home-v1.ts:46`). A real deployment would derive the shown number from, or map it to, the canonical id |
| **Human Authority `Homeowner`** | `command-ux1.tsx:283` (hardcoded) | the illustrative HI role who authorizes edits in this demo | the truth loop's "human-authorized" actor; a real project names the actual signer. The ribbon's SSSES / SPIRAL / R-CORE / Replay / Iteration all correctly read NOT_RUN / `— / 33` beside it |

These are the only two ribbon literals that trace to neither canonical state, a declared assumption (A1–A6), a
derived calculation, nor a NOT_x — hence this section. Nothing on the ribbon claims a measured building fact it
cannot back.

## The firewall (assumptions that must NOT be edited this cycle)

The shared, non-Architect defaults are byte-unchanged — this project's 900 ft² / 1 bath come from the canonical seed,
**not** from these:
- `lib/room-program.ts` `DEFAULT_PROGRAM.bathrooms = 2` — unchanged.
- `lib/architect-project.ts` `DEFAULT_PARAMS.areaSqft = 2000` — unchanged.

Gated by `test:architect-product-truth` (the header shows 1 bath / 900 ft² from canonical; the shared defaults stay 2 / 2000).
