# Drone-2525 · Plan + Sub-Plan — Levels Build
## Claude Code: fill Input and Output for each row (same format as CRS so gaps are caught)

**Project:** Drone-2525
**Date:** 2026-10-19
**Scope.** Build plan for all levels on Drone-2525. Introductory / Training must work before Intermediate, Advanced, or Real-World advance.
**Levels:** Training · Introduction · Intermediate · Advanced · Real-World.
**Path inside Introduction:** one player → two players on one system → mimic 1 drone vs 1 drone → 3v3 (6 systems, up to 12 HI).
**Format:** Matches `docs/CRS_TRACEABILITY_2026-07-03.md` and `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` so gaps between plan and CRS are visible.
**Scene:** Capital Lawn (SCEN · CAPITAL 42) on the Drone-2525 deck.

**Ask for Claude Code:** For every Sub-Plan row below, replace the placeholder Input and Output with the concrete I/O contract (what enters the step, what leaves it). Keep the column order. Note any gap in Gap / Delta if the I/O does not yet exist.

---

## Levels ladder (Drone-2525)

| Level | Mode(s) | Status | Gate to next |
|-------|---------|--------|--------------|
| **Training** | TRAIN UP / TRAIN DOWN (basic) | Live | Three-press loop reliable for one player |
| **Introduction** | TRAIN UP / TRAIN DOWN + player scaling | Build | One player → two on one system → 1v1 → 3v3 (6 systems, 12 HI) solid |
| **Intermediate** | Saturation, bait, high-track rule | Planned | Introduction green; decoy vs real vector held |
| **Advanced** | QUAL 40 + leakers / seams / restore | Live (QUAL) / Planned (full) | Intermediate green; positions and seam coverage hold |
| **Real-World** | Nine beats, Asar’s five lines gate | Designed | Advanced green; façades non-shootable; defended assets present |

---

## Drone-2525 · Training (foundation)

| Sub-Plan | Input | Output | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-TRAIN.01** | *(Claude Code: input — player press, START)* | *(Claude Code: output — completed TRAIN UP/DOWN record)* | **Build** | 1 | One player completes full TRAIN UP and TRAIN DOWN. Three-press loop works. Glass colours match marks. | Zero false colours; hit/miss match actions; START/time recorded. | Foundation for Introduction. |

## Drone-2525 · Introduction (player scaling)

| Sub-Plan | Input | Output | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-INTRO.01** | *(Claude Code: define input — e.g. player press events, START)* | *(Claude Code: define output — e.g. completed run record, hit/miss, glass state)* | **Build** | 1 | One player completes full TRAIN UP and TRAIN DOWN on Capital Lawn. Three-press loop works. Glass colours match marks. | Zero false colours; hit/miss match actions; START and wall time recorded. | Aligns to CRS-CL.INTRO.01. |
| **PLAN-D2525-INTRO.01.01** | *(Claude Code: input)* | *(Claude Code: output)* | **Build** | 1 | TRAIN UP: targets come up; light WAIT until START; last target down stops clock. | START/time on record. | Matches CRS-CL.01. |
| **PLAN-D2525-INTRO.01.02** | *(Claude Code: input)* | *(Claude Code: output)* | **Build** | 1 | TRAIN DOWN: all targets start down; START stands lane and runs clock under lamps. | START/time on record. | Matches CRS-CL.02. |
| **PLAN-D2525-INTRO.01.03** | *(Claude Code: input)* | *(Claude Code: output)* | **Build** | 1 | Magazine, RELOAD, and stance behave as drawn. | Visual match to reference picture. | Gap if magazine state desyncs from count. |
| **PLAN-D2525-INTRO.02** | *(Claude Code: input — two player press streams)* | *(Claude Code: output — single system state, both players recorded)* | **Build** | 1 | Two players operate one system. Presses from either player accepted. No double-fire on the same mark. | Record shows both players; single system state. | Aligns to CRS-CL.INTRO.02. |
| **PLAN-D2525-INTRO.02.01** | *(Claude Code: input)* | *(Claude Code: output)* | **Build** | 1 | Shared seat or split controls on one platform. | Both inputs map to the same three-press loop. | Gap if inputs collide without arbitration. |
| **PLAN-D2525-INTRO.03** | *(Claude Code: input — two independent platforms)* | *(Claude Code: output — two tracks, no cross-talk)* | **Build** | 2 | Each player owns one platform. Each can TARGET/APPROVE/FIRE the other. Two independent tracks. | No cross-talk on presses. | Aligns to CRS-CL.INTRO.03. |
| **PLAN-D2525-INTRO.03.01** | *(Claude Code: input)* | *(Claude Code: output)* | **Build** | 2 | Two platforms visible on Capital Lawn. | Both tracks render; seat map holds two. | Gap if second platform is not drawn or not addressable. |
| **PLAN-D2525-INTRO.04** | *(Claude Code: input — 6 systems, up to 12 HI)* | *(Claude Code: output — seat map of 6, HI per press recorded)* | **Build** | 2 | 3v3 = 6 systems. Up to 12 HI players possible (2 per system). Same three-press loop. No mode escalation. | Seat map holds six systems; record shows HI player per press. | Aligns to CRS-CL.INTRO.04. Note: 6 systems, 12 HI possible. |
| **PLAN-D2525-INTRO.04.01** | *(Claude Code: input — team assignment before START)* | *(Claude Code: output — team + system + HI on record)* | **Build** | 2 | Team assignment (3 vs 3) declared before START. Each system may carry 1 or 2 HI players. | Record shows team, system, and HI player(s) for each press. | Gap if team or HI player is not recorded. |

## Drone-2525 · Intermediate

| Sub-Plan | Input | Output | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-INT.01** | *(Claude Code: input — saturation contacts, bait track)* | *(Claude Code: output — decoy ignored, real vector engaged)* | **Planned** | 2 | Saturation across classes; one fast track. High track is not a lawn seat’s. Do not chase every ghost. | Fail if lawn gun takes high track or decoy chased while real vector runs. | Aligns to beats 3–4. Requires Introduction green. |

## Drone-2525 · Advanced

| Sub-Plan | Input | Output | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-ADV.01** | *(Claude Code: input — QUAL 40 positions and engagements)* | *(Claude Code: output — score, RANGE IS COLD)* | **Live** | 1 | QUAL 40: 40 targets, 18 engagements, ranges 6/7/8/8/6/5, four phases, five positions. Ends CEASE FIRE / UNLOAD / SHOW CLEAR / score / RANGE IS COLD. | Wall-clock; score matches engagement count. | Matches CRS-CL.03. |
| **PLAN-D2525-ADV.02** | *(Claude Code: input — leaker, gun loss, seam)* | *(Claude Code: output — inner ring takes leaker; next gun covers dead ground)* | **Planned** | 2 | Leakers over the wire; gun loss and seam coverage; restore-the-line discipline. | Fail if defended point hit or threat left with no gun that can lock it. | Aligns to beats 5–6. Requires Intermediate green. |

## Drone-2525 · Real-World

| Sub-Plan | Input | Output | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-RW.01** | *(Claude Code: input — nine beats, Asar gate)* | *(Claude Code: output — five lines scored; X-BAT package loads only after)* | **Designed** | 2 | Real-World: nine beats (Enki’s Spark → Asar’s Synthesis). Seat map and eight fire modes unchanged. Three presses survive every beat. Gate is Asar’s five lines before X-BAT load. | Each beat has stands-up / decision / fails-on; gate is scorable. | Aligns to CRS-CL.04. Requires Advanced green + façades non-shootable + defended assets. |
| **PLAN-D2525-RW.02** | *(Claude Code: input — façade IDs)* | *(Claude Code: output — façades not pop-up)* | **Blocked** | 1 | Capitol façades D-CAP-S/N/E/W are not pop-up targets. Defended asset is not shootable. | Zero façade IDs as pop-up targets. | Aligns to CRS-CL.05. |
| **PLAN-D2525-RW.03** | *(Claude Code: input — asset set)* | *(Claude Code: output — four non-shootable assets on lawn)* | **Planned** | 2 | Defended assets exist: command post, fuel farm, ammunition transfer point, maintenance cluster. All non-shootable. | Four assets present; “defended assets preserved” scorable. | Aligns to CRS-CL.06. |

---

## Order of build (Claude Code) — Drone-2525 only

1. **Training** — PLAN-D2525-TRAIN.01 solid.
2. **Introduction** — PLAN-D2525-INTRO.01 → .02 → .03 → .04 (one player → two on one system → 1v1 → 3v3 with 6 systems / 12 HI).
3. **Intermediate** — PLAN-D2525-INT.01 only after Introduction green.
4. **Advanced** — PLAN-D2525-ADV.01 (QUAL 40 live) then .02 only after Intermediate green.
5. **Real-World** — PLAN-D2525-RW.01 only after Advanced green and RW.02 / RW.03 resolved.

---

## Gap check (plan vs CRS) — Drone-2525

| Plan row | CRS row | Match? | Gap if any |
|----------|---------|--------|------------|
| PLAN-D2525-TRAIN.01 | CRS-CL.01 / .02 | Yes | — |
| PLAN-D2525-INTRO.01–.04 | CRS-CL.INTRO.01–.04 | Yes | 3v3 = 6 systems, 12 HI possible |
| PLAN-D2525-INT.01 | beats 3–4 | Partial | Intermediate not yet a selectable mode |
| PLAN-D2525-ADV.01 | CRS-CL.03 | Yes | QUAL 40 live |
| PLAN-D2525-ADV.02 | beats 5–6 | Partial | Full advanced seam not yet selectable |
| PLAN-D2525-RW.01 | CRS-CL.04 | Yes | Designed; gated |
| PLAN-D2525-RW.02 | CRS-CL.05 | Yes | Blocked (façades shootable) |
| PLAN-D2525-RW.03 | CRS-CL.06 | Yes | Planned (assets missing) |

---

## Change summary — 2026-10-19

**Docs (Drone-2525):**
- `docs/whitepaper/Drone-2525_Plan_Introductory_Mode_Build.md` — this file (levels explicit)
- `docs/whitepaper/Key_Deliverable_Introductory_Mode.md` — the rule
- `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` — CRS rows this plan implements against
- `docs/whitepaper/Capital_Lawn_Architecture.md` — scene + modes

**Ask for Claude Code:** Fill the Input and Output columns for every Sub-Plan row. Keep the format. Note any gap in Gap / Delta.

**Levels:** Training · Introduction · Intermediate · Advanced · Real-World.
**3v3 note:** 6 systems, up to 12 HI players possible (2 per system).

---

*Drone-2525 · Plan + Sub-Plan. All five levels. Introduction first. Same format as CRS. Claude Code fills I/O. Gaps are caught by comparing columns.*
