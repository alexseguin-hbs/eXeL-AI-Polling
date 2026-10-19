# CRS + Sub-CRS Delta — 2026-10-19 Capital Lawn

> **First pass, closed.** This file is the source of truth for the Capital Lawn. Where `Drone-2525_Plan_Introductory_Mode_Build.md` or `Capital_Lawn_Architecture.md` still says the lawn drills are live, that Qual 40 is Advance, or that the swarm count is open, this file wins.
>
> **Scope.** Delta only. `docs/CRS_TRACEABILITY_2026-07-03.md` and the Cube docs are unchanged.
>
> **Deck.** r0.216 is live on the Range. r.217 is the toast and the share line only. Nothing in this CRS enters r.217. No station moves until this record is what the lawn is built from.

---

## What this pass closes

| Was open or wrong | Decision |
|---|---|
| CRS-CL.01–.03 marked Live on the lawn | Live on the **Range** only. The lawn cannot run them yet. |
| CRS-CL.07 swarm 9 vs 42 | **Decided.** Real-World swarm is 9 tracks, 3 groups of 3. Seat count is not 42. |
| Plan maps Qual 40 to Advance | Qual 40 is **Training**, on the Range. Advance is Mix, Leak, and Loss. |
| Plan lists six sentences as Asar's five lines | Five scored lines. "All threads complete" names beat 9. It is not a sixth line. |
| Bearings in degrees | UCRS-2525. 0000 and 3600 are north. 1800 is south. |

The ladder, in the only order that counts:

| Step | What it is | Opens the next only when |
|---|---|---|
| Training | The Range. Single shot. Train Up, then Train Down, then Qual 40 | All three finished. Hits, misses, rounds, and time stored. The magazine picture matches the rounds |
| Introductory | The lawn. The same three drills, one air track, single shot. Sentinel names it before Fire counts. Then one player, two on one system, 1v1, 3v3 | The three drills are finished on the lawn, no shot before the cue, and the player path in the key deliverable is green |
| Intermediate | The three, plus Pair. Single and a burst of 3. Air, then ground, each its own run | Both runs finished. A wrong-class shot fails. A held track that was fired on fails |
| Advance | Mix, Leak, and Loss. One air track, one ground threat, one incoming round. Not a swarm | All three finished. A friendly icon hit fails. A threat with no gun that can lock it fails. The five lines are stored, and the swarm line reads "not up" |
| Real-World | Nine beats. Three groups up. One gun lost. This is proficiency | Advance is complete. All five lines read complete. Only then does the X-BAT package load |

A link, a menu, or a query string cannot open a step whose line above is empty.

---

## Capital Lawn · Scene Contract

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.00** | CRS-CL.00.IN | CRS-CL.00.OUT | **Live** | 1 | Capital Lawn scene is true-scale (172.67 m E–W × 88.09 m N–S). Building presence is outside segment budget; detail follows fidelity dial. | Building outline remains visible at default fidelity; stage is not black. | Architecture §1. The scene being drawn is not the same as the drills being playable. |

## Capital Lawn · The three drills

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.01** | CRS-CL.01.IN | CRS-CL.01.OUT | **Range only** | 1 | TRAIN UP is live on the Range at r0.216. Targets come up; light WAIT until START; last target down stops the clock; TARGET amber, APPROVE red, FIRE. On the lawn this drill is Introductory, and it is not live. | On the Range, START and wall time are recorded and hit/miss match the glass. On the lawn, the same record does not yet exist. | Was marked Live. That was the Range. |
| **CRS-CL.02** | CRS-CL.02.IN | CRS-CL.02.OUT | **Range only** | 1 | TRAIN DOWN is live on the Range. All targets start down; START stands the lane. On the lawn it is Introductory, and it is not live. | Same split as CRS-CL.01. | Was marked Live. |
| **CRS-CL.03** | CRS-CL.03.IN | CRS-CL.03.OUT | **Range only** | 1 | QUAL 40 is Training, on the Range. 40 targets, 18 engagements, ranges 6/7/8/8/6/5, four phases, five positions, exposure 5/8/12/16 s; ends CEASE FIRE / UNLOAD / SHOW CLEAR / score / RANGE IS COLD. It is not Advance, and it is not a way onto the lawn. | Wall-clock and score match the engagement count, on the Range. | Plan row PLAN-D2525-ADV.01 is superseded for level placement. The drill itself stays. |

## Capital Lawn · Ladder lock

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.10** | CRS-CL.10.IN | CRS-CL.10.OUT | **Decided** | 1 | The five steps above are the only path. Real-World is proficiency. The X-BAT package does not load on an empty record. | Opening Real-World, and loading the X-BAT package, with an empty record, both fail. | New. Key deliverable CRS-CL.INTRO.01–.04 is the player path inside Introductory, after Training is stored. |
| **CRS-CL.10.01** | CRS-CL.10.01.IN | CRS-CL.10.01.OUT | **Decided** | 1 | r.217 does not carry this CRS. Toast clears when the strip moves on. The share address is not broken mid-word. | Seven pass lines of r.217, and no lawn station moved. | Bound. |

## Capital Lawn · Real-World beats

Seat map and fire modes do not change from beat to beat. The three presses survive every beat. These beats are Real-World. They are not Introductory, Intermediate, or Advance.

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.04** | CRS-CL.04.IN | CRS-CL.04.OUT | **Designed** | 2 | Real-World is nine beats, Enki's Spark through Asar's Synthesis. The gate is the five lines, then the X-BAT package. | Each beat has stands-up, decision, and fails-on. The gate is scorable. | Shield + architecture §3.3. Locked until CRS-CL.10 is green. |
| **CRS-CL.04.01** | CRS-CL.04.01.IN | CRS-CL.04.01.OUT | **Designed** | 2 | Beat 1 Enki's Spark. Nothing is up. Sentinel sweeps. No shot before the cue. | A shot before the name is a recorded fail. | Beat table. |
| **CRS-CL.04.02** | CRS-CL.04.02.IN | CRS-CL.04.02.OUT | **Designed** | 2 | Beat 2 Thor's Shield. One low, slow unmanned track, bearing fixed. It is bait. | The missile seat is not spent on it. | Beat table. |
| **CRS-CL.04.03** | CRS-CL.04.03.IN | CRS-CL.04.03.OUT | **Designed** | 2 | Beat 3 Krishna's Thread. Several classes up, and one fast track. The high track is not a lawn seat's. | A lawn gun that takes the high track fails. | Beat table. |
| **CRS-CL.04.04** | CRS-CL.04.04.IN | CRS-CL.04.04.OUT | **Designed** | 2 | Beat 4 Odin's Eye. Do not chase the ghost. | A decoy chased while the real track runs fails. | Beat table. |
| **CRS-CL.04.05** | CRS-CL.04.05.IN | CRS-CL.04.05.OUT | **Designed** | 2 | Beat 5 Enlil's Order. A leaker at the ammunition point. The inner gun takes it. | A defended point hit fails. | Beat table. LPWS, not an Avenger. |
| **CRS-CL.04.06** | CRS-CL.04.06.IN | CRS-CL.04.06.OUT | **Designed** | 2 | Beat 6 Athena's Direction. A gun is lost and the southern seam opens. The next gun whose arc covers that ground takes the track. | A threat with no gun that can lock it fails. | A1's arc and A2's arc meet at 1800. A1 and A3 meet there too. |
| **CRS-CL.04.07** | CRS-CL.04.07.IN | CRS-CL.04.07.OUT | **Designed** | 2 | Beat 7 Sofia's Lens. One low from the southeast, two fast from the north, one observer standing off. The observer is held. | A held track that is fired on fails. A person is never a target. | NAS and human tracks are named so they can be held. |
| **CRS-CL.04.08** | CRS-CL.04.08.IN | CRS-CL.04.08.OUT | **Designed** | 2 | Beat 8 Aset's Echo. Restore the line, then one last low-fast contact. | A formation broken during the restore fails. | Beat table. |
| **CRS-CL.04.09** | CRS-CL.04.09.IN | CRS-CL.04.09.OUT | **Designed** | 2 | Beat 9 Asar's Synthesis. Score the five lines. Only then load the X-BAT package. | The package does not load on a partial score. | See CRS-CL.04.10. |
| **CRS-CL.04.10** | CRS-CL.04.10.IN | CRS-CL.04.10.OUT | **Decided** | 2 | The five lines are exactly these: (1) primary missile threat destroyed, (2) low-altitude attackers eliminated, (3) drone swarm neutralized, (4) joint network stable, (5) defended assets preserved. "All threads complete" is the name of the synthesis, not a sixth line. On Advance the swarm line is stored as "not up." | Five fields, no more. X-BAT waits on all five reading complete. | Closes the six-sentence list in the plan. |

## Capital Lawn · Blockers

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.05** | CRS-CL.05.IN | CRS-CL.05.OUT | **Blocked** | 1 | Capitol façades D-CAP-S/N/E/W are not pop-up targets. A defended asset is not shootable. A friendly icon is not a target. | Zero façade IDs appear as pop-ups. "The asset is still there when it ends" can be scored. | Architecture §4. Still blocked on the deck. |
| **CRS-CL.06** | CRS-CL.06.IN | CRS-CL.06.OUT | **Planned** | 2 | Defended assets on the lawn, all non-shootable: command post (`DA-CP`), fuel farm (`DA-FF`), ammunition transfer point (`DA-ATP`), maintenance cluster (`DA-MC`). | Four present. "Defended assets preserved" can be scored. | Paper set. Not on the lawn yet. |
| **CRS-CL.07** | CRS-CL.07.IN | CRS-CL.07.OUT | **Decided** | 2 | The Real-World swarm is 9 tracks in 3 groups of 3: one down Congress as the distraction, one on an allée, one incoming round. The deck's 42 is the old even ring, not a gun count and not a swarm count. That ring remains a named option for one case only: a small unmanned track that can come from any direction. It is not the default and it is not built first. | One declared count: 9 tracks, 3 groups. No mode uses 42 as the number of guns. | Was Open. Closed here. |
| **CRS-CL.08** | CRS-CL.08.IN | CRS-CL.08.OUT | **Decided** | 2 | "Joint network stable" means the cue still reaches the gun that picks up a track after the gun that owned it is lost. It does not mean a new radio is drawn. | After A1 is down, A2 or A3 still receives the name of the Congress track. | Was undefined. This is the stand-in. |
| **CRS-CL.09** | CRS-CL.09.IN | CRS-CL.09.OUT | **Planned** | 3 | The spoof package is an effect inside a Real-World beat. The player does not operate it. FM 3-12. No new press. | The effect is in the beat data. The three presses are unchanged. | Not a fire mode. |
| **CRS-CL.14** | CRS-CL.14.IN | CRS-CL.14.OUT | **Blocked** | 2 | LPWS has no icon on Security-2525. The six marks are Avenger, Patriot, THAAD, Sentinel, X-BAT, and Autofoil. C1 and C2 stay words until a friendly LPWS mark exists. Do not borrow the Avenger icon. | No Avenger glyph is used for an incoming-round seat. | New blocker. M-SHORAD on that page is a label, not an icon. |

## Capital Lawn · UCRS-2525

Security-2525 already has the unit. A circle is 3600. 0000 and 3600 are north. 0900 is east. 1800 is south. 2700 is west. A pair is `AAAA.BBBB`, both sides UCRS. The short form is allowed only when the second number is an exact fraction of the circle: `1800.5` means `1800.1800`. A full circle is `0000.3600`, never `0000.1`, because `.1` is 0360.

A place is the other form on that page, and it is not invented in this file. When a point is dropped on the grounds the reader writes `UCRS {zone}{band}·E####·N####`. The bearing says which way the seat looks. The grid says where it sits. Grid cells stay blank until then.

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.11** | CRS-CL.11.IN | CRS-CL.11.OUT | **Decided** | 1 | Every arc in this CRS is UCRS-2525, written `AAAA.BBBB`, short form only under the rule above. Degrees are not the record. | A stored arc that is not four digits, a dot, and four digits fails the read-back. `1800.5` reads back as `1800.1800`. | New. |

## Capital Lawn · Seats

Nine lines. Not forty-two. A ground seat is in the record because Intermediate cannot finish without one. Sentinel cues and has no fire mode. THAAD is off the grounds. Patriot is optional, off the grounds, same center as T1, arc `1500.2100`, width 0600, and it is not required for the first build.

| Seat | Faces | Arc, full | Short | Class | First step |
|---|---|---|---|---|---|
| A1 | 1800, down Congress. Weight two | 1500.2100 | none | Air | Introductory |
| A2 | East allée, covering A1's east side | 0900.1800 | 0900.5 | Air | Intermediate |
| A3 | West allée, covering A1's west side | 1800.2700 | 1800.75 | Air | Intermediate |
| A4 | 0000, the north grounds. Crosses north | 3150.0450 | none | Air | Advance |
| S1, S2 | The whole circle, behind the south guns | 0000.3600 | none | Cue only | Introductory |
| C1 | Southwest of the building | 1800.2700 | 1800.75 | Incoming round | Advance |
| C2 | Northeast of the building | 0000.0900 | 0000.25 | Incoming round | Advance |
| G1 | 1800, on the Great Walk | 1500.2100 | none | Ground | Intermediate |
| T1 | 1800, off the grounds. Width 0900 | 1350.2250 | none | High track | Real-World |

What a seat may take does not change. An Avenger takes the air track. An LPWS takes the incoming round. G1 takes ground. T1 and Patriot take the high track. A large aircraft, a medium unmanned track, a Group 2 or Group 3 track, a small unmanned track, and the X-BAT swarm are air. They are not five new seats. A boat is not this map.

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.12** | CRS-CL.12.IN | CRS-CL.12.OUT | **Decided** | 1 | The seat table above is the record. Each line carries place (grid, when placed), arc, class, the fire modes it is allowed, and the step where it first appears. | A1 and A2 both cover 1800. A1 and A3 both cover 1800. C1 and C2 between them cover the building. A lawn built from any other count fails this row. | New. Closes "42 new turrets." |

## Capital Lawn · Fire modes

The three presses stay in front of every mode. The mode is chosen before the approval. A ripple's second round is already committed. It is not an unapproved shot. Every round that leaves changes the picture by one step. A ripple that moves the picture once has failed.

Range selector, and only on the Range: Single, Burst 3, Auto, Salvo. Default is Single. Burst with fewer than 3 left does not fire. Salvo is refused on Lane 21.

Lawn modes: Hold, Cue, Single, Shoot-look-shoot, Ripple, Salvo, Sector, Layer.

| Mode | One approval allows | Refused when |
|---|---|---|
| Hold | Nothing | Outside the arc, or not this seat's class |
| Cue | The optic slews. No round leaves until Fire | No sensor has named it |
| Single | One round, or one interceptor | Empty |
| Shoot-look-shoot | One round. A second needs a new Approve | The track is already down |
| Ripple | Two rounds, the second already committed | Fewer than two left |
| Salvo | Two interceptors together | Not a Patriot or a THAAD seat |
| Sector | Fire only inside the recorded arc | In the sight, outside the arc |
| Layer | This seat's class only | An Avenger is offered a mortar, or an LPWS is offered a high track |

The strip names the mode and the refusal in one line. `HOLD · NOT IN ARC`. `HOLD · OTHER SEAT`. `RIPPLE · NEED 2`. It does not recite the three presses after the shot.

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.13** | CRS-CL.13.IN | CRS-CL.13.OUT | **Decided** | 2 | The two selectors above. The lawn does not use the Range's mode control. Using that control is what sends the player back to the Range. | A mode change on the lawn does not change the scene. A ripple spends two and the picture moves two steps. | New. Not in r.217. |

## Capital Lawn · Modular interfaces

Adding any of these does not change the three presses, the seat table, or the nine beats.

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.M01** | CRS-CL.M01.IN | CRS-CL.M01.OUT | **Scaffold** | 3 | HIL. A physical controller, gimbal, trigger, or magazine sensor may emit TARGET, APPROVE, and FIRE. | Press events match the glass colours. Latency is recorded. | Hardware-in-the-loop. |
| **CRS-CL.M02** | CRS-CL.M02.IN | CRS-CL.M02.OUT | **Scaffold** | 3 | SIL. An EO/IR, radar, or ESM feed may inject a track into a beat. | The track stands up. The three presses are still required. | Sensor-in-the-loop. |
| **CRS-CL.M03** | CRS-CL.M03.IN | CRS-CL.M03.OUT | **Planned** | 3 | Edge. A sensor-fusion add-in attaches without changing the mode config. Its output is a track source only. | No change to the press loop or the seat table. | Not a new seat. |
| **CRS-CL.M04** | CRS-CL.M04.IN | CRS-CL.M04.OUT | **Future** | 4 | Robotics. A simulated or real platform may occupy a seat. Laser-tag play stays inside the same presses. No seat settles itself. | Same presses. No autonomous fire. | Future. |

## Capital Lawn · R-Core

| Sub-CRS | Input ID | Output ID | Status | MVP | Requirement | System Metric | Delta |
|---|---|---|---|:-:|---|---|---|
| **CRS-CL.R01** | CRS-CL.R01.IN | CRS-CL.R01.OUT | **Planned** | 3 | Manual. A person writes and a person commits. Nothing ships without a named Human-Authority event. | No autonomous commit. | `docs/MODE_R-CORE_SPEC.md`. |
| **CRS-CL.R02** | CRS-CL.R02.IN | CRS-CL.R02.OUT | **Planned** | 3 | Semi-auto. The system may propose a mode or beat delta, a test, and a metric. A person accepts, modifies, or blocks. | The proposal can be automatic. The commit cannot. | Mode 2. |
| **CRS-CL.R03** | CRS-CL.R03.IN | CRS-CL.R03.OUT | **Planned** | 4 | Autonomous cadence only after the tests pass, the measured gain is at least 11.1%, the SSSES floors hold, and no risk is blocking. Otherwise fail closed. | A failed floor does not ship. | 11.1% rule. |

---

## Change summary — first pass closed

**This file**
- CRS-CL.01, .02, .03 are Range only. They are not live on the lawn.
- CRS-CL.07 is decided: 9 tracks, 3 groups of 3. Forty-two is not a gun count.
- CRS-CL.08 has a stand-in: the cue still reaches the gun that picks up the track.
- CRS-CL.04.10 locks Asar's five lines at five.
- CRS-CL.10 locks the ladder and keeps r.217 out of the lawn.
- CRS-CL.11 and CRS-CL.12 are the UCRS arcs and the nine seats.
- CRS-CL.13 is the fire-mode split.
- CRS-CL.14 is the missing LPWS mark.

**Still blocked, and not waived**
- Façades are still pop-ups (CRS-CL.05).
- The four defended assets are still missing (CRS-CL.06).
- LPWS still has no icon (CRS-CL.14).

**Build against**
- This CRS, then `Drone-2525_Plan_Introductory_Mode_Build.md` for the Input and Output columns.
- Where the plan and this file disagree, fill the plan to match this file. Do not fill this file to match the plan.
- Introductory first, and only after Training is on the record. Real-World stays locked.

**Companion files, unchanged by this pass except where a later commit says so**
- `docs/whitepaper/Capital_Lawn_Architecture.md`
- `docs/whitepaper/Drone-2525_Plan_Introductory_Mode_Build.md`
- `docs/whitepaper/Drone-2525_Ladder_Export.txt`
- `docs/whitepaper/Key_Deliverable_Introductory_Mode.md`
- `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md`
- `docs/whitepaper/Shield_in_the_Sky_Images.md`
- Shield PDF: https://ppgfjplawtlrfqpnszyb.supabase.co/storage/v1/object/public/whitepaper/Shield-in-the-Sky.pdf

---

*Delta only. Existing polling CRS rows unchanged. Format matches `docs/CRS_TRACEABILITY_2026-07-03.md`.*
