# Drone-2525 · Plan + Sub-Plan — Levels Build
## Claude Code: fill Input and Output for each row (same format as CRS so gaps are caught)

**Project:** Drone-2525
**Date:** 2026-10-19
**Scope.** Build plan for all levels on Drone-2525. Training / Introduction must work before Intermediate, Advanced, or Real-World advance.
**Levels:** Training · Introduction · Intermediate · Advanced · Real-World.
**Path inside Introduction:** one player → two players on one system → mimic 1 drone vs 1 drone → 3v3 (6 systems, up to 12 HI).
**Format:** Matches `docs/CRS_TRACEABILITY_2026-07-03.md` and `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md`.
**Scene:** Capital Lawn (SCEN · CAPITAL 42) on the Drone-2525 deck.
**Sources of alignment:**
- `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md` (nine beats, Asar’s five lines, ATP 3-01.81 / FM 3-12 back matter)
- `docs/whitepaper/Capital_Lawn_Architecture.md` (live modes, beat table, blockers)
- FM 3-01 (U.S. Army Air and Missile Defense Operations — layered ADA, engagement doctrine)
- ATP 3-01.81 (Counter-Unmanned Aircraft System Techniques — counter-UAS, swarm)
- FM 3-12 (Cyberspace and Electronic Warfare Operations — jamming, sensing, EW as effect)

**Ask for Claude Code:** For every Sub-Plan row below, replace the placeholder Input and Output with the concrete I/O contract (what enters the step, what leaves it). Keep the column order. Note any gap in Gap / Delta if the I/O does not yet exist.

---

## Levels ladder (Drone-2525) — aligned to Shield + FM 3-01

| Level | Mode(s) | Doctrine / Shield anchor | Status | Gate to next |
|-------|---------|--------------------------|--------|--------------|
| **Training** | TRAIN UP / TRAIN DOWN (basic) | FM 3-01 engagement discipline; three-press loop | Live | Three-press reliable for one player; glass truth |
| **Introduction** | TRAIN UP / TRAIN DOWN + player scaling | Same loop; scale to 6 systems / 12 HI | Build | One → two on one system → 1v1 → 3v3 solid |
| **Intermediate** | Saturation, bait, high-track rule | Shield beats 2–4 (Thor bait, Krishna saturation, Odin decoy); FM 3-01 outer/inner ring | Planned | Introduction green; decoy not chased; high track not taken by lawn gun |
| **Advanced** | QUAL 40 + leakers / seams / restore | Shield beats 5–6 (Enlil leaker, Athena seam); ATP 3-01.81 low-altitude / leaker | Live (QUAL) / Planned (full) | Intermediate green; inner ring takes leaker; next gun covers dead ground |
| **Real-World** | Nine beats, Asar’s five lines gate | Full Shield sequence (Enki → Asar); FM 3-01 layered defense; FM 3-12 EW as effect | Designed | Advanced green; façades non-shootable; defended assets present; five lines score before X-BAT |

---

## Drone-2525 · Training (foundation)

| Sub-Plan | Input | Output | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-TRAIN.01** | *(Claude Code: input — player press, START)* | *(Claude Code: output — completed TRAIN UP/DOWN record)* | **Build** | 1 | One player completes full TRAIN UP and TRAIN DOWN. Three-press loop (TARGET amber → APPROVE red → FIRE) works. Glass colours match marks. Aligns to FM 3-01 engagement discipline. | Zero false colours; hit/miss match actions; START/time recorded. | Foundation for Introduction. |

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

## Drone-2525 · Intermediate (Shield beats 2–4; FM 3-01 outer/inner)

| Sub-Plan | Input | Output | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-INT.01** | *(Claude Code: input — low slow UAS bait, saturation, fast track, decoy)* | *(Claude Code: output — missile seat not spent on bait; high track not taken by lawn gun; decoy not chased)* | **Planned** | 2 | Saturation across classes; one fast track. High track is not a lawn seat’s. Do not chase every ghost. Aligns to Shield: Thor’s Shield (hostile until disproven — and it is bait; fail if missile seat spent), Krishna’s Thread (high track not a lawn seat’s; fail if lawn gun takes it), Odin’s Eye (do not chase every ghost; fail if decoy chased while real vector runs). FM 3-01 outer ring for highest consequence. | Fail if lawn gun takes high track or decoy chased while real vector runs or missile seat spent on bait. | Aligns to beats 2–4. Requires Introduction green. |

## Drone-2525 · Advanced (QUAL 40 + Shield beats 5–6; ATP 3-01.81)

| Sub-Plan | Input | Output | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-ADV.01** | *(Claude Code: input — QUAL 40 positions and engagements)* | *(Claude Code: output — score, RANGE IS COLD)* | **Live** | 1 | QUAL 40: 40 targets, 18 engagements, ranges 6/7/8/8/6/5, four phases, five positions (tactical standing, unsupported prone, supported prone, supported kneeling, supported standing). Exposure 5/8/12/16 s. Ends CEASE FIRE / UNLOAD / SHOW CLEAR / score / RANGE IS COLD. | Wall-clock; score matches engagement count. | Matches CRS-CL.03. |
| **PLAN-D2525-ADV.02** | *(Claude Code: input — leaker at ammunition point, gun loss, southern seam)* | *(Claude Code: output — inner ring takes leaker; next gun covers dead ground; formation holds on restore)* | **Planned** | 2 | Leakers over the wire; gun loss and seam coverage; restore-the-line discipline. Aligns to Shield: Enlil’s Order (leaker over the wire at ammunition point; inner ring takes it; fail if defended point hit), Athena’s Direction (a gun is lost; southern seam opens; next gun covering its dead ground takes the track; fail if threat left with no gun that can lock it). ATP 3-01.81 low-altitude / leaker techniques. | Fail if defended point hit or threat left with no gun that can lock it. | Aligns to beats 5–6. Requires Intermediate green. |

## Drone-2525 · Real-World (nine beats; Asar’s five lines; FM 3-01 / FM 3-12)

| Sub-Plan | Input | Output | Status | MVP | Requirement | System Metric | Gap / Delta |
|---|---|---|---|:-:|---|---|---|
| **PLAN-D2525-RW.01** | *(Claude Code: input — nine beats sequence, Asar gate)* | *(Claude Code: output — five lines scored; X-BAT package loads only after)* | **Designed** | 2 | Real-World: nine beats. Seat map and eight fire modes unchanged. Three presses survive every beat. Gate is Asar’s five lines before X-BAT package loads. Aligns to full Shield sequence and FM 3-01 layered defense. | Each beat has stands-up / decision / fails-on; gate is scorable. | Aligns to CRS-CL.04. Requires Advanced green + façades non-shootable + defended assets. |
| **PLAN-D2525-RW.01.01** | *(Claude Code: input)* | *(Claude Code: output)* | **Designed** | 2 | Beat 1 Enki’s Spark: nothing yet — Sentinel sweeps. No shot before the cue. Fail if fire before Sentinel names it. | Fail recorded if premature fire. | Beat table. |
| **PLAN-D2525-RW.01.02** | *(Claude Code: input)* | *(Claude Code: output)* | **Designed** | 2 | Beat 2 Thor’s Shield: one low, slow UAS, bearing fixed. Hostile until disproven — and it is bait. Fail if missile seat spent on it. | Fail recorded if missile seat spent. | Beat table. |
| **PLAN-D2525-RW.01.03** | *(Claude Code: input)* | *(Claude Code: output)* | **Designed** | 2 | Beat 3 Krishna’s Thread: saturation across classes; one fast track. High track is not a lawn seat’s. Fail if lawn gun takes the high track. | Fail recorded if lawn gun takes high track. | Beat table. |
| **PLAN-D2525-RW.01.04** | *(Claude Code: input)* | *(Claude Code: output)* | **Designed** | 2 | Beat 4 Odin’s Eye: primary engagement. Do not chase every ghost. Fail if decoy chased while real vector runs. | Fail recorded if decoy chased. | Beat table. |
| **PLAN-D2525-RW.01.05** | *(Claude Code: input)* | *(Claude Code: output)* | **Designed** | 2 | Beat 5 Enlil’s Order: leaker over the wire at ammunition point. Inner ring takes it. Fail if a defended point is hit. | Fail recorded if defended point hit. | Beat table. |
| **PLAN-D2525-RW.01.06** | *(Claude Code: input)* | *(Claude Code: output)* | **Designed** | 2 | Beat 6 Athena’s Direction: a gun is lost; southern seam opens. Next gun covering its dead ground takes the track. Fail if threat left with no gun that can lock it. | Fail recorded if threat left unlocked. | Beat table. |
| **PLAN-D2525-RW.01.07** | *(Claude Code: input)* | *(Claude Code: output)* | **Designed** | 2 | Beat 7 Sofia’s Lens: SE low, two fast from N, one standoff observer. Observer is held, not shot. Fail if a held track is fired on. | Fail recorded if held track fired. | Beat table. |
| **PLAN-D2525-RW.01.08** | *(Claude Code: input)* | *(Claude Code: output)* | **Designed** | 2 | Beat 8 Aset’s Echo: restore the line, then one last low-fast contact. Discipline in the quiet. Fail if formation broken during restore. | Fail recorded if formation broken. | Beat table. |
| **PLAN-D2525-RW.01.09** | *(Claude Code: input)* | *(Claude Code: output)* | **Designed** | 2 | Beat 9 Asar’s Synthesis: the five lines. Only then does the X-BAT package load. Five lines (from Shield): All threads complete. Primary missile threat destroyed. Low-altitude attackers eliminated. Drone swarm neutralized. Joint network stable. Defended assets preserved. | Gate passes only after five lines score. | Beat table. |
| **PLAN-D2525-RW.02** | *(Claude Code: input — façade IDs)* | *(Claude Code: output — façades not pop-up)* | **Blocked** | 1 | Capitol façades D-CAP-S/N/E/W are not pop-up targets. Defended asset is not shootable. Pass condition “asset still there when it ends” cannot exist until fixed. | Zero façade IDs as pop-up targets. | Aligns to CRS-CL.05. |
| **PLAN-D2525-RW.03** | *(Claude Code: input — asset set)* | *(Claude Code: output — four non-shootable assets on lawn)* | **Planned** | 2 | Defended assets exist on lawn: command post (`DA-CP`), fuel farm (`DA-FF`), ammunition transfer point (`DA-ATP`), maintenance cluster (`DA-MC`). All non-shootable. Paper names the set. | Four assets present; “defended assets preserved” scorable. | Aligns to CRS-CL.06. |
| **PLAN-D2525-RW.04** | *(Claude Code: input — EW / spoof effect)* | *(Claude Code: output — effect appears in beat data; no new press)* | **Planned** | 3 | Spoof package (EW) is an effect at Real-World, not an operator-controlled control. Aligns to FM 3-12 (jamming, sensing, EW pressure). Paper has it; ladder does not. | Effect appears in beat data; no new press. | Aligns to CRS-CL.09. |

---

## Order of build (Claude Code) — Drone-2525 only

1. **Training** — PLAN-D2525-TRAIN.01 solid.
2. **Introduction** — PLAN-D2525-INTRO.01 → .02 → .03 → .04 (one player → two on one system → 1v1 → 3v3 with 6 systems / 12 HI).
3. **Intermediate** — PLAN-D2525-INT.01 (Shield beats 2–4) only after Introduction green.
4. **Advanced** — PLAN-D2525-ADV.01 (QUAL 40 live) then .02 (beats 5–6) only after Intermediate green.
5. **Real-World** — PLAN-D2525-RW.01 (nine beats + Asar five lines) only after Advanced green and RW.02 / RW.03 resolved. RW.04 (EW effect) after gate is scorable.

---

## Gap check (plan vs CRS) — Drone-2525

| Plan row | CRS row | Match? | Gap if any |
|----------|---------|--------|------------|
| PLAN-D2525-TRAIN.01 | CRS-CL.01 / .02 | Yes | — |
| PLAN-D2525-INTRO.01–.04 | CRS-CL.INTRO.01–.04 | Yes | 3v3 = 6 systems, 12 HI possible |
| PLAN-D2525-INT.01 | beats 2–4 | Partial | Intermediate not yet a selectable mode |
| PLAN-D2525-ADV.01 | CRS-CL.03 | Yes | QUAL 40 live |
| PLAN-D2525-ADV.02 | beats 5–6 | Partial | Full advanced seam not yet selectable |
| PLAN-D2525-RW.01 | CRS-CL.04 | Yes | Designed; gated on Asar five lines |
| PLAN-D2525-RW.02 | CRS-CL.05 | Yes | Blocked (façades shootable) |
| PLAN-D2525-RW.03 | CRS-CL.06 | Yes | Planned (assets missing) |
| PLAN-D2525-RW.04 | CRS-CL.09 | Yes | EW as effect, not operator control |

---

## Change summary — 2026-10-19

**Docs (Drone-2525):**
- `docs/whitepaper/Drone-2525_Plan_Introductory_Mode_Build.md` — this file (levels + Shield / FM 3-01 specifics)
- `docs/whitepaper/Key_Deliverable_Introductory_Mode.md` — the rule
- `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` — CRS rows this plan implements against
- `docs/whitepaper/Capital_Lawn_Architecture.md` — scene + modes
- `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md` — nine beats, Asar five lines, doctrine back matter

**Ask for Claude Code:** Fill the Input and Output columns for every Sub-Plan row. Keep the format. Note any gap in Gap / Delta.

**Levels:** Training · Introduction · Intermediate · Advanced · Real-World.
**3v3 note:** 6 systems, up to 12 HI players possible (2 per system).
**Asar’s five lines (Shield):** All threads complete. Primary missile threat destroyed. Low-altitude attackers eliminated. Drone swarm neutralized. Joint network stable. Defended assets preserved.
**Doctrine anchors:** FM 3-01 (layered ADA), ATP 3-01.81 (counter-UAS), FM 3-12 (EW as effect).

---

*Drone-2525 · Plan + Sub-Plan. All five levels. Specified from Shield in the Sky and FM 3-01 alignment. Introduction first. Same format as CRS. Claude Code fills I/O. Gaps are caught by comparing columns.*
