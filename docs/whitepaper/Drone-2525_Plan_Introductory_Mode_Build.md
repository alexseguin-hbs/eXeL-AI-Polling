# Drone-2525 · Plan + Sub-Plan — Introductory Mode Build
## Claude Code must build upon this (same format as CRS so gaps are caught)

**Project:** Drone-2525
**Date:** 2026-10-19
**Scope.** Build plan for the key deliverable on Drone-2525: Introductory mode must work before Intermediate, Advanced, or Real-World advance.
**Path:** one player → two players on one system → mimic 1 drone vs 1 drone → 3v3 in introductory mode.
**Format:** Matches `docs/CRS_TRACEABILITY_2026-07-03.md` and `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` so gaps between plan and CRS are visible.
**Scene:** Capital Lawn (SCEN · CAPITAL 42) on the Drone-2525 deck.

---

## Drone-2525 · Introductory · One Player (build first)

| Sub-Plan | Input ID | Output ID | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-INTRO.01** | PLAN-D2525-INTRO.01.IN | PLAN-D2525-INTRO.01.OUT | **Build** | 1 | One player completes full TRAIN UP and TRAIN DOWN on Capital Lawn in Drone-2525. Three-press loop (TARGET amber → APPROVE red → FIRE) works. Glass colours match marks. | Zero false colours; hit/miss match actions; START and wall time recorded. | Aligns to CRS-CL.INTRO.01. Gap if glass lies or press fails. |
| **PLAN-D2525-INTRO.01.01** | PLAN-D2525-INTRO.01.01.IN | PLAN-D2525-INTRO.01.01.OUT | **Build** | 1 | TRAIN UP: targets come up; light WAIT until START; last target down stops clock. | START/time on record. | Matches CRS-CL.01. |
| **PLAN-D2525-INTRO.01.02** | PLAN-D2525-INTRO.01.02.IN | PLAN-D2525-INTRO.01.02.OUT | **Build** | 1 | TRAIN DOWN: all targets start down; START stands lane and runs clock under lamps. | START/time on record. | Matches CRS-CL.02. |
| **PLAN-D2525-INTRO.01.03** | PLAN-D2525-INTRO.01.03.IN | PLAN-D2525-INTRO.01.03.OUT | **Build** | 1 | Magazine, RELOAD, and stance behave as drawn. | Visual match to reference picture. | Gap if magazine state desyncs from count. |

## Drone-2525 · Introductory · Two Players, One System

| Sub-Plan | Input ID | Output ID | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-INTRO.02** | PLAN-D2525-INTRO.02.IN | PLAN-D2525-INTRO.02.OUT | **Build** | 1 | Two players operate one system on Drone-2525. Presses from either player are accepted. No double-fire on the same mark. | Record shows both players; single system state. | Aligns to CRS-CL.INTRO.02. Gap if second player’s press is ignored or double-fires. |
| **PLAN-D2525-INTRO.02.01** | PLAN-D2525-INTRO.02.01.IN | PLAN-D2525-INTRO.02.01.OUT | **Build** | 1 | Shared seat or split controls on one platform. | Both inputs map to the same three-press loop. | Gap if inputs collide without arbitration. |

## Drone-2525 · Introductory · Mimic 1 Drone vs 1 Drone

| Sub-Plan | Input ID | Output ID | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-INTRO.03** | PLAN-D2525-INTRO.03.IN | PLAN-D2525-INTRO.03.OUT | **Build** | 2 | Each player owns one platform. Each can TARGET/APPROVE/FIRE the other. Two independent tracks. | No cross-talk on presses. | Aligns to CRS-CL.INTRO.03. Gap if one player’s press affects the other platform. |
| **PLAN-D2525-INTRO.03.01** | PLAN-D2525-INTRO.03.01.IN | PLAN-D2525-INTRO.03.01.OUT | **Build** | 2 | Two platforms visible on Capital Lawn. | Both tracks render; seat map holds two. | Gap if second platform is not drawn or not addressable. |

## Drone-2525 · Introductory · 3v3 (6 systems, 12 HI players possible)

| Sub-Plan | Input ID | Output ID | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-INTRO.04** | PLAN-D2525-INTRO.04.IN | PLAN-D2525-INTRO.04.OUT | **Build** | 2 | 3v3 = 6 systems. Up to 12 HI players possible (2 per system). Same three-press loop. No mode escalation. | Seat map holds six systems; record shows HI player per press; all presses remain TARGET/APPROVE/FIRE. | Aligns to CRS-CL.INTRO.04. Gap if system count ≠ 6 or HI capacity < 12. |
| **PLAN-D2525-INTRO.04.01** | PLAN-D2525-INTRO.04.01.IN | PLAN-D2525-INTRO.04.01.OUT | **Build** | 2 | Team assignment (3 vs 3) is declared before START. Each system may carry 1 or 2 HI players. | Record shows team, system, and HI player(s) for each press. | Gap if team or HI player is not recorded. |

---

## Order of build (Claude Code) — Drone-2525 only

1. **PLAN-D2525-INTRO.01** — one player TRAIN UP/DOWN solid on Drone-2525.
2. **PLAN-D2525-INTRO.02** — two players on one system.
3. **PLAN-D2525-INTRO.03** — 1v1 drone mimic.
4. **PLAN-D2525-INTRO.04** — 3v3 (6 systems, up to 12 HI players) in introductory.
5. Only after 01–04 are green: advance Intermediate, Advanced, Real-World on Drone-2525.

---

## Gap check (plan vs CRS) — Drone-2525

| Plan row | CRS row | Match? | Gap if any |
|----------|---------|--------|------------|
| PLAN-D2525-INTRO.01 | CRS-CL.INTRO.01 | Yes | — |
| PLAN-D2525-INTRO.02 | CRS-CL.INTRO.02 | Yes | — |
| PLAN-D2525-INTRO.03 | CRS-CL.INTRO.03 | Yes | — |
| PLAN-D2525-INTRO.04 | CRS-CL.INTRO.04 | Yes | Note: 6 systems, 12 HI players possible. |
| (none) | CRS-CL.05 façades | No | Façade blocker is later; does not block introductory basic run. |
| (none) | CRS-CL.06 defended assets | No | Assets are later; does not block introductory basic run. |

---

## Change summary — 2026-10-19

**Docs (Drone-2525):**
- `docs/whitepaper/Drone-2525_Plan_Introductory_Mode_Build.md` — this file
- `docs/whitepaper/Key_Deliverable_Introductory_Mode.md` — the rule
- `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` — CRS rows this plan implements against
- `docs/whitepaper/Capital_Lawn_Architecture.md` — scene + modes

**Rule:** This plan is specific to Drone-2525. Claude Code builds upon this plan. Same format as CRS so any gap between plan and CRS is visible in the table.

**3v3 note:** 6 systems, up to 12 HI players possible (2 per system).

---

*Drone-2525 · Plan + Sub-Plan. Introductory first. Same format as CRS. Gaps are caught by comparing columns.*
