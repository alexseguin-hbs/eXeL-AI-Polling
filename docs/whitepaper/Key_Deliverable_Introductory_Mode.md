# Key Deliverable — Introductory / Training Mode Must Work First

**Date:** 2026-10-19
**Purpose:** Introductory (TRAIN UP / TRAIN DOWN) must be solid for one player so the other three modes can advance.
**Path:** one player → two players operating one system → mimic 1 drone vs 1 drone → 3v3 in introductory mode.

---

## The rule

Introductory mode is the foundation. Nothing in Intermediate, Advanced, or Real-World advances until Introductory works for the player counts below.

---

## Progression (all in Introductory mode)

| Step | Players | Systems | What must work | Gate to next |
|------|---------|---------|----------------|--------------|
| 1 | 1 | 1 | Single player, three-press loop, TRAIN UP / TRAIN DOWN, hit/miss, magazine, glass truth | Player can complete a full TRAIN UP run without broken presses or false colours |
| 2 | 2 | 1 | Two players operating one system (shared seat or split controls on one platform) | Both players can issue presses; no double-fire; record shows both |
| 3 | 2 | 2 | Mimic 1 drone vs 1 drone (each player owns one platform) | Two independent tracks; each can TARGET/APPROVE/FIRE the other; no cross-talk |
| 4 | 6 | 6 | 3v3 in introductory mode | Three vs three; seat map holds; presses remain three; no mode change |

---

## What “Introductory works” means

- Three-press loop is reliable: TARGET (amber) → APPROVE (red) → FIRE.
- Glass tells the truth: button colour matches mark.
- TRAIN UP and TRAIN DOWN both complete a full cycle (START to last target down).
- Magazine, RELOAD, and stance behave as drawn.
- Record captures START, time, hits, misses, and who pressed.
- No façade or defended-asset collision blocks the basic run (those are later blockers).

---

## Sub-CRS for the key deliverable

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.INTRO.01** | CRS-CL.INTRO.01.IN | CRS-CL.INTRO.01.OUT | **Required** | 1 | One player completes a full TRAIN UP and TRAIN DOWN run on Capital Lawn with three-press loop and correct glass colours. | Zero false colours; hit/miss match actions; START/time recorded. | Foundation. |
| **CRS-CL.INTRO.02** | CRS-CL.INTRO.02.IN | CRS-CL.INTRO.02.OUT | **Required** | 1 | Two players operate one system. Presses from either player are accepted; no double-fire on the same mark. | Record shows both players; single system state. | Shared control. |
| **CRS-CL.INTRO.03** | CRS-CL.INTRO.03.IN | CRS-CL.INTRO.03.OUT | **Required** | 2 | Mimic 1 drone vs 1 drone. Each player owns one platform. Each can target the other. | Two independent tracks; no cross-talk on presses. | First multi-platform. |
| **CRS-CL.INTRO.04** | CRS-CL.INTRO.04.IN | CRS-CL.INTRO.04.OUT | **Required** | 2 | 3v3 in introductory mode. Six platforms, three vs three, same three-press loop. | Seat map holds; all presses remain TARGET/APPROVE/FIRE; no mode escalation. | Scale test. |

---

## Order of advance

1. Lock Introductory for one player (CRS-CL.INTRO.01).
2. Add two players on one system (CRS-CL.INTRO.02).
3. Add 1v1 drone mimic (CRS-CL.INTRO.03).
4. Add 3v3 in introductory (CRS-CL.INTRO.04).
5. Only then advance Intermediate, Advanced, and Real-World.

---

*Key deliverable. Introductory must work before the other three modes advance. Path is one player → two on one system → 1v1 → 3v3, all inside introductory mode.*
