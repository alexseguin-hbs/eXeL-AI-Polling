# Mode · R-CORE — Manual → Semi-Automated → Autonomous (operating-cadence spec)

**Status:** LIVE companion spec to the ledger block `mode.r-core` (§5 R-CORE) in
`docs/SOI_VISION2525_LIVING_DOCUMENT.html`. This file carries the implementable
detail (the per-cube metric families and the 11.1% gate arithmetic) so the paper
holds 77,777 — the same split used for the jurisdiction adapters (`docs/LIVELIHOOD_JURISDICTION_ADAPTERS.md`).

Operator directive (2026-08-20, MoT): "We are essentially operating in manual mode;
the future will have people and AI feedback to semi-automate updates of Vision-2525
toolsets. Full automated is people voting priorities and getting what they want
overnight via R-CORE Vision-2525 toolsets that are ultimately recursive after testing
per the 11.1% rule of metrics enhancements for cubes of code."

Converged from three external reviews (Grok ×2, eXeL AI), all endorsing the same shape.

---

## The one principle

**People set direction. Toolsets accelerate delivery. Metrics decide whether a cube
may recurse. Human Authority still owns meaning, money, and law.**

Autonomy never means the system pays, classifies, or rewrites the ontology by itself.
Autonomy means: *voted priorities become tested, metric-gated toolset updates.*

`More AI → More Authority` is **wrong**. The governing law is:

> **Autonomy increases as qualification increases** — more evidence + more testing +
> more qualification → greater *permitted* autonomy. Never more AI → more authority.

---

## The three modes

| Mode | Who authors | Who commits | What may move | What never goes autonomous |
|------|-------------|-------------|---------------|-----------------------------|
| **1 · Manual** (today) | Human + AI drafts | Human only | Nothing without a human append | Everything economic and canonical |
| **2 · Semi-Automated** | AI proposes; people + AI feedback | Human Authority commits | Drafts, tests, diffs, metric reports | Ledger meaning, money, adapters |
| **3 · Autonomous** | R-CORE executes the voted queue | Qualification gates + 11.1% rule | Qualified cube updates that already passed test | Classification, rails, ownership, ontology |

**Mode is earned per cube, not switched on for the whole framework at once.** QIS math
and the Off Switch can stay Manual while a translation cube goes Semi-Auto and a test
cube goes Auto.

### 1 · Manual (current state)
A person names the change; the machine may draft, test, and measure; a person reads,
trims to the sacred totals (3,333 / 9,999 / 77,777), and appends. Replay + gates are
human-triggered. Nothing ships because a model thought it was ready.
**Invariant:** no commit without a named Human-Authority event.

### 2 · Semi-Automated (next)
1. A human (or a vote) names a priority.
2. AI drafts the cube change **+ tests + metric delta + word-count + translation impact**.
3. People and AI review the same Replay-visible diff.
4. Human Authority **accepts / modifies / blocks**.
5. Only then does the cube land.
**Invariant:** proposal may be automatic; commitment may not. Classification-before-
delivery still applies to any economic side-effect (SETTLEMENT PENDING until a
qualified human/rail acts).

### 3 · Autonomous (future)
1. Priorities are **voted** (Human Authority at the queue, not at every line).
2. R-CORE selects the next cube work in vote order.
3. Toolsets generate, test, and measure.
4. Recursion is allowed **only if the 11.1% gate passes**.
5. The winning artifact is Replay-stamped and published as the new cube generation.
6. The next night may recurse on that result.

**"Overnight"** = the queue you voted yesterday is in Replay this morning, or it is not
shipped. Fail-closed. No silent merge.

**Forbidden overnight (always):** moving money · changing tax/securities/AML
classification · qualifying a jurisdiction adapter · vesting Bonus / Livelihood /
ownership · rewriting Seed / ♡ / 웃 / ◬ / 🏠 / QIS meaning · bypassing fail-closed or
default-deny.

---

## The 11.1% rule (the recursion gate)

11.1% = **1/9**. One-ninth measured improvement is the increment that authorizes another
recursive cycle on a cube.

For cube *c* at cycle *n*, on its declared metric *M*:

```
ΔM_c = ( M_c(n) − M_c(n−1) ) / | M_c(n−1) |
Ship the cycle  ⟺  ΔM_c ≥ 0.111  AND all tests pass  AND SSSES floors hold  AND no blocking risk
Otherwise       →  no recurse, no overnight ship  →  SETTLEMENT PENDING for that cube
```

Rules:
1. **Declare M_c before the cycle** (frozen basis — same discipline as QIS Basis).
2. **Do not change the metric after seeing the result.**
3. **11.1% is an enhancement gate, not a payment formula.** It mints no 웃 / Bonus / ownership.
4. **No average-across-cubes cheat.** Same roll-up law as QIS: aggregate the underlying
   absolutes, then test the gate; a tiny cube's +11.1% must not outweigh a large cube's regression.
5. **Constitutional cubes can require Manual** even if 11.1% is met.
6. **11.1% is the floor, not the purpose** — the purpose is qualified improvement; the
   floor stops infinite self-rewrites that don't get better.

### Per-cube metric families (declare one family per cube, before the cycle)

| Cube type | Metric family M (examples — pre-declared, absolute, Replay-able) |
|-----------|------------------------------------------------------------------|
| QIS / finance | regression-pass count, or ΔQIS at a project boundary — **never a second growth formula** |
| R-CORE / Replay | determinism proof (identical hashes), gate-green rate |
| Translations | stale-block count ↓, glossary-lock hold, coverage ↑ |
| Tooling / UX | task time ↓, error rate ↓, test coverage ↑ |
| Code cube | tests passed, defect density ↓, latency ↓ (declared before the cycle) |

---

## Invariants (lock these)

1. Vision-2525 operates in **Manual** until a VERSION explicitly qualifies Mode 2.
2. Mode 2: AI may propose; only **Human Authority** commits.
3. Mode 3: votes set the queue; R-CORE may recurse **only after test and ΔM ≥ 11.1%**.
4. No mode may autonomously **classify, transmit, or rewrite canonical meaning**.
5. **Fail-closed** is the default when the gate is not met.
6. QIS stays **measurement, not payment**; 웃 stays **M × qualified time**; incentive
   policy stays **downstream** of measurement.
7. Autonomy **of the toolset** never becomes autonomy **of settlement**.

---

## Relationship to `rcore.modes` (the per-write ladder)

`rcore.modes` (§5) governs **who may approve a single write** — the seven execution
modes with the `DEFAULT_MAX_RISK = 0.30` / `DEFAULT_MIN_CONFIDENCE = 0.70` guardrails
and `live → ALWAYS requires human authority`. That is per-write approval.

`mode.r-core` (this spec) governs the **cadence at which the framework's own toolsets
improve** — Manual → Semi-Auto → Autonomous, gated by the 11.1% rule. The two compose:
a write in Autonomous cadence still passes the per-write ladder, and `live` still
requires a human. Autonomy of cadence never loosens the per-write gate.

---

## The recursive spine

```
Human priorities → POLLING → Collective Intelligence → R-CORE → Cube(s)
  → Build → Test → 11.1% qualification → SSSES → Release → Replay → (feeds the next priorities)
```

People set priorities · R-CORE coordinates · Cubes implement · Metrics qualify ·
Replay remembers · **Humanity decides what matters.**

---

## The five pillars (the five systems) and their learnings

R-CORE's five systems are Vision • 2525 §III–VII by another name. Each now carries the
learning every 2525 project has paid for (operator 2026-10-23: *"update R-CORE 5 pillars
per all learnings of all 2525 projects"*). The canonical copy is
`frontend/lib/2525-core/controls.ts` → `RCORE_PILLARS` (gated by
`frontend/tests/controls-schema.test.mjs`); `RCORE_SYS` keeps the bare name→code map. A
learning is a law the work proved, and it is **append-only** like every other record —
add to it, do not rewrite it. Drone-2525 evidence cites the current revision only.

- **COMM-2525 (§III) — the signal fabric.** Redundancy is counted in **independent
  providers**, not code paths. The live-response Trinity was three send paths × four
  receive channels that all terminated at one vendor — one provider wearing three coats,
  so one outage was a total outage while the sender was told "delivered." Genuine
  redundancy adds providers in different failure domains and gates the count; nothing is
  swallowed, and a fallback announces its lateness instead of lying by silence.
- **LINK-2525 (§IV) — coordination continuity.** A message addressed to one system never
  lands on another's mark, and a retry carries its context. The two-phone lawn room
  (Drone-2525 r.229, H03) is LINK in miniature: each system drives only its own track, a
  peer's row for the other is record-only, one replay hash on both. Link 16 is 512×3
  (A–B); LINK-2525 evolves to 3600×7 (A–G) — the UCRS bearing circle × seven levels
  (DD-150) — kept as the forward spec, not retrofitted onto a shipped rung.
- **EDGE-2525 (§V) — the point of need.** The device holds the work when the centre is
  gone. The operator deck is one self-contained file that fetches nothing and plays
  offline; a completed signature lives on the signer's phone and is never discarded; a
  screen a person can reach never names a database, a migration or an RPC.
- **SYNC-2525 (§VI) — operational truth.** The record is itself a redundancy mechanism —
  what live delivery loses, replay reconstructs. Append-only ledger, chain-hashed
  register, replay hash, the deck's embedded record carried through the revision before
  its own (lag exactly one). A new edition is an append, never an edit. Drone-2525's
  training record is SYNC: **Train Down** (a start button and a timer to knock every
  target down) and **Qual-40** (the military-grade annual qualification) write START/TIME
  and hits, misses and rounds as rows; **Train Up** — the default on the Range and every
  training location, all targets up with no start, a hit knocking a target down and it
  popping back up for endless practice — is infinite and writes no scored run.
- **UCRS-2525 (§VII) — one spatial language.** Every bearing is UCRS-2525, written
  `AAAA.BBBB` — 0000 and 3600 are north, 1800 is south, `1800.5` reads `1800.1800`. The
  Capital-lawn seats each carry a UCRS arc; targeting and the lawn siting record speak one
  coordinate language, so no system translates another's grid.

**The fidelity law, across all five:** a shot is scored from the **shared state** —
position, time, and TARGET → APPROVE → FIRE — **never from the picture**. A low-fidelity
wire client and a high-resolution client read the same truth, so the 1983 wireframe view
ships and richer engines attach later as views over the same record. Silence is never
consent; humanity remains the authority.
