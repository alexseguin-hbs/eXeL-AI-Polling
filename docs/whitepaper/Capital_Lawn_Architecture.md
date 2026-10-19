# Capital Lawn — Architecture & Gaming Modes
## For Claude Code (Drone-2525 / Security-2525)

**Context:** Live deck r0.216, SCEN · CAPITAL 42.
**Scene:** Texas Capitol lawn — “Today we protect the Capital of Texas.”
**Source of Real-World design:** Shield in the Sky paper (Asar’s five lines gate).
**Companion files:** `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md`, `Shield_in_the_Sky_Images.md`.

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
│   └── D-CAP-S / N / E / W  ← currently pop-up targets (BLOCKER)
├── Defended assets (required, not yet on lawn)
│   ├── Command post
│   ├── Fuel farm
│   ├── Ammunition transfer point
│   └── Maintenance cluster
├── Swarm (open count)
│   ├── Paper: 9 (3 groups of 3)
│   └── Deck record: 42 · 336/336 segs first
└── Seat map + 8 fire modes (unchanged across beats)
```

**Fidelity rule:** Detail follows fidelity dial; presence does not. Building must remain visible even at default fidelity.

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
- Seat: PILOT (primary).

---

## 3. Gaming Modes — Architecture

### 3.1 Range Modes (live on deck today)

| Mode | ID | Behavior | Clock | Pass / Fail notes |
|------|----|----------|-------|-------------------|
| TRAIN UP | `train_up` | Targets come up. Light WAIT until START. Hit/miss counters. Last target down stops clock. | Wall + record START/time | Basic three-press discipline |
| TRAIN DOWN | `train_down` | All targets start down. START stands lane + runs clock under lamps. Last down stops. | Wall + record START/time | Cold start |
| QUAL 40 | `qual_40` | IWQ-style. 40 targets, 18 engagements, ranges 6/7/8/8/6/5, four phases. Five positions (tactical standing, unsupported prone, supported prone, supported kneeling, supported standing). Exposure: 1=5s, 2=8s, 3=12s, 4=16s. 3s between eng, 10s between phases. Ends CEASE FIRE / UNLOAD / SHOW CLEAR / score / RANGE IS COLD. | Wall-clock | Qualification gate |

**Implementation note:** Range is frozen and proven by `tests/range-frozen.test.mjs`. SCEN · CAPITAL 42 opens the Capital without mutating the range.

### 3.2 Training Ladder (intro → intermediate → advanced → real-world)

```
Introductory  →  Intermediate  →  Advanced  →  Real-World
     │                │               │            │
  TRAIN UP      TRAIN UP/DOWN      QUAL 40     gated on
  low density   saturation +      positions +   Asar’s 5 lines
  three presses  bait / decoy     leakers /     then X-BAT
                 high-track rule  seams /       package loads
                                  restore
```

### 3.3 Real-World Mode (designed, not yet selectable)

**ID:** `real_world`
**Title:** Survivability, then the swarm
**Gate:** Asar’s five lines must score before X-BAT package loads.

| # | Beat | What stands up | Decision tested | Fails on |
|---|------|----------------|-----------------|----------|
| 1 | Enki’s Spark | Nothing yet — Sentinel sweeps | No shot before the cue | Firing before Sentinel names it |
| 2 | Thor’s Shield | One low, slow UAS, bearing fixed | Hostile until disproven — and it is bait | Spending the missile seat on it |
| 3 | Krishna’s Thread | Saturation across classes; one fast track | High track is not a lawn seat’s | Lawn gun takes the high track |
| 4 | Odin’s Eye | Primary engagement | “Do not chase every ghost” | Chasing the decoy while real vector runs |
| 5 | Enlil’s Order | Leaker over the wire at ammunition point | Inner ring takes it | A defended point is hit |
| 6 | Athena’s Direction | A gun is lost; southern seam opens | Next gun covering its dead ground takes the track | Threat left with no gun that can lock it |
| 7 | Sofia’s Lens | SE low, two fast from N, one standoff observer | Observer is held, not shot | A held track fired on |
| 8 | Aset’s Echo | Restore the line, then one last low-fast contact | Discipline in the quiet | Breaking formation during restore |
| 9 | Asar’s Synthesis | The five lines | — | Only then does X-BAT package load |

Seat map and eight fire modes carry unchanged. The three presses survive every beat.

---

## 4. Blockers (must fix before Real-World can score)

```javascript
const BLOCKERS = {
  defendedAssets: {
    status: "missing",
    required: ["command_post", "fuel_farm", "ammunition_transfer_point", "maintenance_cluster"],
    note: "Lawn has none. Paper names the set."
  },
  capitolFacades: {
    status: "shootable",
    ids: ["D-CAP-S", "D-CAP-N", "D-CAP-E", "D-CAP-W"],
    note: "Every building door is currently a pop-up target. Defended asset is shootable. Pass condition 'asset still there when it ends' cannot exist until fixed."
  },
  networkStable: {
    status: "undefined",
    note: "Has no meaning in a deck that fetches nothing. Needs definition or stand-in."
  },
  swarmCount: {
    status: "open",
    paper: 9,
    deck: 42,
    note: "Operator must settle."
  },
  spoofPackage: {
    status: "not_in_ladder",
    note: "EW is in the paper. Place at Real-World as an effect, not something the player operates."
  }
};
```

---

## 5. Suggested Mode Config Shape (for implementation)

```typescript
type ModeId = "train_up" | "train_down" | "qual_40" | "real_world";

interface ModeConfig {
  id: ModeId;
  label: string;
  scene: "capital_lawn" | "range";
  targets: TargetSpec[];
  clock: "wall" | "segment";
  presses: ["target", "approve", "fire"];
  gate?: "asar_five_lines";
  failsOn?: string[];
}

interface Beat {
  id: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  name: string;
  standsUp: string;
  decision: string;
  failsOn: string;
}

const REAL_WORLD_BEATS: Beat[] = [
  { id: 1, name: "Enki’s Spark", standsUp: "nothing yet — Sentinel sweeps", decision: "no shot before the cue", failsOn: "firing before Sentinel names it" },
  { id: 2, name: "Thor’s Shield", standsUp: "one low, slow UAS, bearing fixed", decision: "hostile until disproven — and it is bait", failsOn: "spending the missile seat on it" },
  { id: 3, name: "Krishna’s Thread", standsUp: "saturation across classes; one fast track", decision: "high track is not a lawn seat’s", failsOn: "lawn gun takes the high track" },
  { id: 4, name: "Odin’s Eye", standsUp: "the primary engagement", decision: "do not chase every ghost", failsOn: "chasing the decoy while the real vector runs" },
  { id: 5, name: "Enlil’s Order", standsUp: "leaker over the wire at the ammunition point", decision: "inner ring takes it", failsOn: "a defended point is hit" },
  { id: 6, name: "Athena’s Direction", standsUp: "a gun is lost; southern seam opens", decision: "next gun covering its dead ground takes the track", failsOn: "threat left with no gun that can lock it" },
  { id: 7, name: "Sofia’s Lens", standsUp: "SE low, two fast from N, one standoff observer", decision: "observer is held, not shot", failsOn: "a held track fired on" },
  { id: 8, name: "Aset’s Echo", standsUp: "restore the line, then one last low-fast contact", decision: "discipline in the quiet", failsOn: "breaking formation during restore" },
  { id: 9, name: "Asar’s Synthesis", standsUp: "the five lines", decision: "—", failsOn: "and only then does the X-BAT package load" },
];
```

---

## 6. Cross-references

| Item | Location |
|------|----------|
| This architecture | `docs/whitepaper/Capital_Lawn_Architecture.md` |
| Shield text-only | `docs/whitepaper/Shield_in_the_Sky_ADA_Briefing.md` |
| Images companion | `docs/whitepaper/Shield_in_the_Sky_Images.md` |
| Original verbatim | `docs/asks/2026.10.19_Shield_in_the_Sky_ADA_Briefing.md` |
| VISION-2525.pdf (Supabase) | https://ppgfjplawtlrfqpnszyb.supabase.co/storage/v1/object/public/whitepaper/VISION-2525.pdf |
| Live deck | https://exel-ai-polling.explore-096.workers.dev/drone-2525/play.html |

---

*Ready for Claude Code. Real-World is gated; range modes are live. Fix the Capitol façades and add defended assets before scoring Asar’s lines.*
