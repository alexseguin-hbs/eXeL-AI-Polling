# Capital Lawn — Architecture & Gaming Modes
## For Claude Code (Drone-2525 / Security-2525)

**Context:** Live deck r0.216, scene drawn as SCEN · CAPITAL. The 42 on that scene is the old ring, not the gun count.
**Scene:** Texas Capitol lawn — "Today we protect the Capital of Texas."
**Source of truth:** `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md`. Where this file disagrees with that CRS, the CRS wins.
**Source of Real-World design:** Shield in the Sky (Asar's five lines).
**Companion files:** `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md`, `Shield_in_the_Sky_Images.md`.
**Shield PDF:** https://ppgfjplawtlrfqpnszyb.supabase.co/storage/v1/object/public/whitepaper/Shield-in-the-Sky.pdf

---

## 1. Scene Architecture

```
Capital Lawn (UCRS-2525 · Capitol lawn)
├── Building (true scale)
│   ├── 172.67 m E–W × 88.09 m N–S
│   ├── Drum, ribbed shell, lantern
│   ├── Goddess of Liberty + star @ 92.24 m
│   ├── South steps, Great Walk (25 ft)
│   ├── Allee + north lawn trees (canopies)
│   ├── Bounding streets + rotunda circle
│   └── Drawn outside segment budget (presence ≠ detail)
├── Door / façade targets (current)
│   └── D-CAP-S / N / E / W  ← currently pop-up targets (BLOCKER, CRS-CL.05)
├── Defended assets (required, not yet on lawn, CRS-CL.06)
│   ├── Command post
│   ├── Fuel farm
│   ├── Ammunition transfer point
│   └── Maintenance cluster
├── Swarm (decided, CRS-CL.07)
│   ├── Real-World: 9 tracks, 3 groups of 3
│   └── 42 is the retired ring, not a gun count and not a swarm count
└── Seats: the nine lines in CRS-CL.12, arcs in UCRS-2525
```

**Fidelity rule:** Detail follows fidelity dial; presence does not. Building must remain visible even at default fidelity.

**Bearings:** 0000 and 3600 are north. 1800 is south. Pairs are `AAAA.BBBB`. Short form `1800.5` means `1800.1800`. Grid cells are filled when a point is placed, as `UCRS {zone}{band}·E####·N####`. Do not invent them here.

---

## 2. Core Interaction Loop (all modes)

```
TARGET (amber) → APPROVE (red) → FIRE
```

- No colour without a mark.
- Buttons follow the bullseye.
- Dark button does nothing.
- Mark that ends takes its colour with it.
- Glass tells the truth about every target.
- Magazine / RELOAD / stance / light are rasters from the reference picture.
- The lawn does not use the Range mode control. That control is what sends the player home.

---

## 3. Gaming Modes — Architecture

### 3.1 Range modes (live on the Range, not on the lawn)

| Mode | ID | Behavior | Clock | Where it is live |
|------|----|----------|-------|------------------|
| TRAIN UP | `train_up` | Targets come up. Light WAIT until START. Last target down stops the clock. | Wall + record START/time | Range, r0.216. Lawn copy is Introductory and is not live |
| TRAIN DOWN | `train_down` | All targets start down. START stands the lane. Last down stops. | Wall + record START/time | Range only |
| QUAL 40 | `qual_40` | 40 targets, 18 engagements, four phases, five positions. Ends CEASE FIRE / UNLOAD / SHOW CLEAR / score / RANGE IS COLD. | Wall-clock | Training, on the Range. Not Advance |

**Implementation note:** The Range stays frozen. Opening the Capital scene must not mutate it, and must not be treated as those three drills already working on the lawn.

### 3.2 Ladder

The order is Training, then Introductory, then Intermediate, then Advance, then Real-World. Real-World is proficiency. The words and the gates are CRS-CL.10. This diagram is only a reminder:

```
Training → Introductory → Intermediate → Advance → Real-World
(Range)    (lawn, one         (Pair, air     (Mix, Leak,   (nine beats,
            air track,         then ground)   Loss)         five lines,
            then 1→2→1v1→3v3)                            then X-BAT)
```

### 3.3 Real-World (designed, not selectable)

**ID:** `real_world`
**Gate:** the five lines in CRS-CL.04.10, then the X-BAT package. "All threads complete" names the synthesis. It is not a sixth line.

| # | Beat | What stands up | Decision tested | Fails on |
|---|------|----------------|-----------------|----------|
| 1 | Enki's Spark | Nothing yet — Sentinel sweeps | No shot before the cue | Firing before Sentinel names it |
| 2 | Thor's Shield | One low, slow UAS, bearing fixed | It is bait | Spending the missile seat on it |
| 3 | Krishna's Thread | Several classes up; one fast track | The high track is not a lawn seat's | A lawn gun takes the high track |
| 4 | Odin's Eye | Primary engagement | Do not chase the ghost | Chasing the decoy while the real track runs |
| 5 | Enlil's Order | Leaker at the ammunition point | The inner gun takes it | A defended point is hit |
| 6 | Athena's Direction | A gun is lost; the southern seam opens | The next gun whose arc covers that ground takes the track | A threat left with no gun that can lock it |
| 7 | Sofia's Lens | SE low, two fast from N, one observer | The observer is held | A held track is fired on |
| 8 | Aset's Echo | Restore the line, then one last low-fast contact | Discipline in the quiet | Formation broken during the restore |
| 9 | Asar's Synthesis | The five lines | — | The X-BAT package loads only after they score |

---

## 4. Blockers

```javascript
const BLOCKERS = {
  defendedAssets: {
    status: "missing",
    required: ["command_post", "fuel_farm", "ammunition_transfer_point", "maintenance_cluster"],
    crs: "CRS-CL.06"
  },
  capitolFacades: {
    status: "shootable",
    ids: ["D-CAP-S", "D-CAP-N", "D-CAP-E", "D-CAP-W"],
    crs: "CRS-CL.05"
  },
  networkStable: {
    status: "decided",
    standIn: "After A1 is lost, the cue still reaches the gun that picks up the Congress track.",
    crs: "CRS-CL.08"
  },
  swarmCount: {
    status: "decided",
    tracks: 9,
    groups: 3,
    not: "42 guns",
    crs: "CRS-CL.07"
  },
  lpwsIcon: {
    status: "missing",
    note: "Do not borrow the Avenger mark. C1 and C2 stay words until a friendly LPWS icon exists.",
    crs: "CRS-CL.14"
  },
  spoofPackage: {
    status: "effect_only",
    note: "Real-World beat data. Not a player control. No new press.",
    crs: "CRS-CL.09"
  }
};
```

---

## 5. Mode config

Claude Code fills the Input and Output columns in `docs/whitepaper/Drone-2525_Plan_Introductory_Mode_Build.md`. Keep the CRS ids. Do not add a lawn station in r.217.

Seat arcs, classes, and fire modes are CRS-CL.12 and CRS-CL.13. Copy them. Do not redesign them in this file.

---

## 6. Cross-references

| Item | Location |
|------|----------|
| CRS, first pass | `docs/whitepaper/CRS_Capital_Lawn_2026-10-19.md` |
| Ladder export | `docs/whitepaper/Drone-2525_Ladder_Export.txt` |
| Plan for Input / Output | `docs/whitepaper/Drone-2525_Plan_Introductory_Mode_Build.md` |
| Key deliverable | `docs/whitepaper/Key_Deliverable_Introductory_Mode.md` |
| Shield text | `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md` |
| Shield PDF | https://ppgfjplawtlrfqpnszyb.supabase.co/storage/v1/object/public/whitepaper/Shield-in-the-Sky.pdf |
| Live deck | https://exel-ai-polling.explore-096.workers.dev/drone-2525/play.html |

---

*The lawn drills are not live. The swarm count is decided. Real-World stays locked. Façades and the four defended assets are still blockers.*
