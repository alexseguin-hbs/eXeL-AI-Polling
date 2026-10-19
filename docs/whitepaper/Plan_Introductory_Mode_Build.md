# Plan + Sub-Plan — Introductory Mode Build
## Claude Code must build upon this (same format as CRS so gaps are caught)

**Date:** 2026-10-19
**Scope.** Build plan for the key deliverable: Introductory mode must work before Intermediate, Advanced, or Real-World advance.
**Path:** one player → two players on one system → mimic 1 drone vs 1 drone → 3v3 in introductory mode.
**Format:** Matches `docs/CRS_TRACEABILITY_2026-07-03.md` and `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` so gaps between plan and CRS are visible.

---

## Introductory · One Player (build first)

| Sub-Plan | Input ID | Output ID | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-INTRO.01** | PLAN-INTRO.01.IN | PLAN-INTRO.01.OUT | **Build** | 1 | One player completes full TRAIN UP and TRAIN DOWN on Capital Lawn. Three-press loop (TARGET amber → APPROVE red → FIRE) works. Glass colours match marks. | Zero false colours; hit/miss match actions; START and wall time recorded. | Aligns to CRS-CL.INTRO.01. Gap if glass lies or press fails. |
| **PLAN-INTRO.01.01** | PLAN-INTRO.01.01.IN | PLAN-INTRO.01.01.OUT | **Build** | 1 | TRAIN UP: targets come up; light WAIT until START; last target down stops clock. | START/time on record. | Matches CRS-CL.01. |
| **PLAN-INTRO.01.02** | PLAN-INTRO.01.02.IN | PLAN-INTRO.01.02.OUT | **Build** | 1 | TRAIN DOWN: all targets start down; START stands lane and runs clock under lamps. | START/time on record. | Matches CRS-CL.02. |
| **PLAN-INTRO.01.03** | PLAN-INTRO.01.03.IN | PLAN-INTRO.01.03.OUT | **Build** | 1 | Magazine, RELOAD, and stance behave as drawn. | Visual match to reference picture. | Gap if magazine state desyncs from count. |

## Introductory · Two Players, One System

| Sub-Plan | Input ID | Output ID | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-INTRO.02** | PLAN-INTRO.02.IN | PLAN-INTRO.02.OUT | **Build** | 1 | Two players operate one system. Presses from either player are accepted. No double-fire on the same mark. | Record shows both players; single system state. | Aligns to CRS-CL.INTRO.02. Gap if second player’s press is ignored or double-fires. |
| **PLAN-INTRO.02.01** | PLAN-INTRO.02.01.IN | PLAN-INTRO.02.01.OUT | **Build** | 1 | Shared seat or split controls on one platform. | Both inputs map to the same three-press loop. | Gap if inputs collide without arbitration. |

## Introductory · Mimic 1 Drone vs 1 Drone

| Sub-Plan | Input ID | Output ID | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-INTRO.03** | PLAN-INTRO.03.IN | PLAN-INTRO.03.OUT | **Build** | 2 | Each player owns one platform. Each can TARGET/APPROVE/FIRE the other. Two independent tracks. | No cross-talk on presses. | Aligns to CRS-CL.INTRO.03. Gap if one player’s press affects the other platform. |
| **PLAN-INTRO.03.01** | PLAN-INTRO.03.01.IN | PLAN-INTRO.03.01.OUT | **Build** | 2 | Two platforms visible on Capital Lawn. | Both tracks render; seat map holds two. | Gap if second platform is not drawn or not addressable. |

## Introductory · 3v3

| Sub-Plan | Input ID | Output ID | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-INTRO.04** | PLAN-INTRO.04.IN | PLAN-INTRO.04.OUT | **Build** | 2 | Six platforms, three vs three, same three-press loop. No mode escalation. | Seat map holds six; all presses remain TARGET/APPROVE/FIRE. | Aligns to CRS-CL.INTRO.04. Gap if any press changes mode or seat map breaks. |
| **PLAN-INTRO.04.01** | PLAN-INTRO.04.01.IN | PLAN-INTRO.04.01.OUT | **Build** | 2 | Team assignment (3 vs 3) is declared before START. | Record shows team and platform for each press. | Gap if team is not recorded. |

---

## Order of build (Claude Code)

1. **PLAN-INTRO.01** — one player TRAIN UP/DOWN solid.
2. **PLAN-INTRO.02** — two players on one system.
3. **PLAN-INTRO.03** — 1v1 drone mimic.
4. **PLAN-INTRO.04** — 3v3 in introductory.
5. Only after 01–04 are green: advance Intermediate, Advanced, Real-World.

---

## Gap check (plan vs CRS)

| Plan row | CRS row | Match? | Gap if any |
|----------|---------|--------|------------|
| PLAN-INTRO.01 | CRS-CL.INTRO.01 | Yes | — |
| PLAN-INTRO.02 | CRS-CL.INTRO.02 | Yes | — |
| PLAN-INTRO.03 | CRS-CL.INTRO.03 | Yes | — |
| PLAN-INTRO.04 | CRS-CL.INTRO.04 | Yes | — |
| (none) | CRS-CL.05 façades | No | Façade blocker is later; does not block introductory basic run. |
| (none) | CRS-CL.06 defended assets | No | Assets are later; does not block introductory basic run. |

---

## Change summary — 2026-10-19

**Docs:**
- `docs/whitepaper/Key_Deliverable_Introductory_Mode.md` — the rule
- `docs/whitepaper/Plan_Introductory_Mode_Build.md` — this file
- `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` — CRS rows this plan implements against
- `docs/whitepaper/Capital_Lawn_Architecture.md` — scene + modes

**Rule:** Claude Code builds upon this plan. Same format as CRS so any gap between plan and CRS is visible in the table.

---

*Plan + Sub-Plan. Introductory first. Same format as CRS. Gaps are caught by comparing columns.*
