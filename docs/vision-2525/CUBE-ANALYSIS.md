# Cube Analysis — 3×3×3 geometry for Vision • 2525
*Prepared for Master of Thought. 25 Jul 2026.*

---

## 1. The constraint

A project renders as a **3×3×3 cube — 27 cells**. Deliverables group into blocks;
blocks must tile the cube exactly. Three rules, all non-negotiable:

1. **Sum to 27.** No holes, no overlaps.
2. **Every block is face-connected.** A block in two disconnected halves would
   explode into floating fragments and misrepresent the work as separable.
3. **Solid at rest.** With the explode slider at zero, the cube reads as one
   object. That is what makes "solid cube = launched" legible at a glance.

The geometry is not decoration. It is a scope constraint: a project cannot
quietly grow past 27 deliverables without someone deciding what to cut.

---

## 2. The partition problem, and why it's solved

**Problem.** Split 27 cells into N connected polycubes, for any N from 1 to 27,
with sizes as even as possible. Hand-authoring this for every N is tedious and
error-prone — and eyeballing connectivity in 3D is exactly where mistakes hide.

**Solution — Hamiltonian path chop.** Walk a path through all 27 cells where
every step moves to a face-adjacent neighbor. Then cut that path into N
consecutive runs.

Why it always works:

- Every run is **connected**, because the walk never jumps.
- The runs **sum to 27**, because the walk visits each cell exactly once.
- It works for **every N**, with no search and no failure case.

**Side effect worth exploiting:** consecutive blocks come out spatially adjacent.
Block 1.1 touches 1.2 touches 1.3. Execution order becomes physical order — which
is precisely what you want in an exploded assembly diagram.

### The walk construction

Boustrophedon — a snake reversing direction each row and each layer:

```
for a in 0..2:                       # slow axis
    bs = [0,1,2] if a even else [2,1,0]
    for b in bs:                     # mid axis
        cs = [0,1,2] if (a+b) even else [2,1,0]
        for c in cs:                 # fast axis
            emit(a, b, c)
```

**This is correct only because 3 is odd.** With an odd edge length, each row and
each layer ends on the coordinate the next one begins at, so every transition is
a single-step move. Verified exhaustively for 3×3×3: all 26 transitions are
face-adjacent, all 27 cells visited once.

If the cube ever becomes 4×4×4, this construction still works — but the
verification must be re-run, not assumed.

---

## 3. Size distribution

```
base      = floor(27 / N)
remainder = 27 mod N
first `remainder` blocks get base+1 cells; the rest get base
```

| N blocks | Cell sizes |
|---|---|
| 2 | 14, 13 |
| 3 | 9, 9, 9 |
| 4 | 7, 7, 7, 6 |
| 5 | 6, 6, 6, 5, 4 → *(5,5,5,6,6 by formula: 6,6,5,5,5)* |
| 6 | 5, 5, 5, 4, 4, 4 |
| **7** | **4, 4, 4, 4, 4, 4, 3** |
| 8 | 4, 4, 4, 3, 3, 3, 3, 3 |
| 9 | 3 × 9 |
| 27 | 1 × 27 |

**N=7 is the operative case** — one block group per gate, G1 through G7.

---

## 4. Named configurations

Six path strategies, all valid for any N. Changing the strategy changes how the
split *looks* without ever touching the guarantee.

| Config | Character |
|---|---|
| `snake-y` | Climbs layer by layer. Most legible when opened. **Default.** |
| `snake-x` | Sweeps left to right. |
| `snake-z` | Sweeps front to back. |
| `spiral-y` | Coils inward to each layer's center, then back out. Reads as a vortex. |
| `spiral-x` | Same about the X axis. |
| `spiral-z` | Same about the Z axis. |

### Exact presets

Three counts land on the cube's own symmetry and beat the generic walk. These
are selected automatically unless a path is named explicitly.

| N | Preset | Structure |
|---|---|---|
| 3 | `slabs` | Three 3×3×1 layers, 9 cells each. The Rubik's face split. |
| 9 | `columns` | Nine vertical 1×3×1 columns, 3 cells each. Perfectly even. |
| 27 | `atoms` | One cell per block. |

---

## 5. Gate mapping — the operative configuration

**G1–G7 → 4, 4, 4, 4, 4, 4, 3.**

| Gate | Stage | Cells |
|---|---|---|
| G1 | Concept | 4 |
| G2 | Plan | 4 |
| G3 | Develop | 4 |
| G4 | Qualify | 4 |
| G5 | Launch | 4 |
| G6 | Maximize | 4 |
| G7 | Retire / EOL | 3 |
| | **Total** | **27** |

### The deliverable inventory gap

The AMTS template supplies **18 numbered deliverables (S1–S18)**, unevenly
distributed — Concept carries five, Develop carries two. The cube demands 27
slots. The missing nine are already in your material, just unnumbered:

**From the Recommended tier:**
- Manufacturing Strategy Documentation
- Supply Chain Risk Assessment
- Performance Tracking with Finance + BD
- Performance Tracking with Mfg/Ops

**From the Design Traceability Matrix:**
- Design Review (DR)
- Test Run (TR)
- Test Issue resolution (IS)
- Design Transfer (DT)
- Design Change (DC)

That is exactly nine. **The rebalance requires no invention — only promotion of
material the template already requires into the numbered set.**

### ⚠️ Current imbalance

The Vision • 2525 CRS series (CRS-75 → 93) loads G2 heavily — the risk-market
requirements cluster there. G2 has four cells. **This needs redistribution before
the cube map is locked,** or G2 overflows while G6 and G7 sit near-empty.

---

## 6. Validation — enforced, not assumed

Every partition, presets included, is checked before it renders:

| Check | Rule | Failure mode caught |
|---|---|---|
| Total | Cells = exactly 27 | Holes or overlaps |
| Uniqueness | No cell claimed twice | Silent double-assignment |
| Bounds | All coordinates in 0..2 | Off-grid cells |
| Non-empty | Every block has ≥1 cell | Phantom blocks |
| Connectivity | Face-adjacency flood fill reaches every cell in the block | A block that would explode into fragments |

Connectivity uses **6-neighbour face adjacency**. Diagonal touching does *not*
count — two cells meeting at an edge or corner are not one solid.

A failed check **throws rather than renders**. This is deliberate: a
wrong-but-plausible cube is worse than no cube, because it ships as if correct.

---

## 7. Render states

| State | Meaning | Appearance |
|---|---|---|
| `locked` | Prerequisite gate not passed | Dim wireframe, no fill |
| `available` | Prerequisites met, not started | Outlined, slow pulse |
| `active` | Function called, work in flight | Filled, low opacity |
| `submitted` | Complete, awaiting approval | Solid, amber edge |
| `approved` | Reviewer signed off | Solid, full block color |

**Explode mechanics.** One slider drives spread, camera dolly, and tilt. Blocks
push radially from the grid center, preserving relative lateral position, with a
golden-angle fallback direction so a block sitting at dead center still moves.
Each block trails a dashed leader line back to its socket, so the eye can
reassemble the cube at any slider position.

---

## 8. Open decisions

1. **G2 redistribution.** See §5. First thing to settle.
2. **Which nine deliverables get promoted**, and to which gates. My proposal in
   §5 is a starting point, not a conclusion.
3. **Real block shapes.** Everything above is correct geometry applied to
   generated partitions. If specific deliverables should occupy specific
   physical positions — a spatial mnemonic rather than an arbitrary split —
   that's a design opportunity not yet taken.
4. **4×4×4 for large projects?** 64 cells would suit a program-level view. The
   partition construction survives; the connectivity verification does not
   transfer automatically and would need re-running.

---

## 9. Implementation

`cube-partitions.js` — partitioner, presets, validator.
`explode-view.js` — geometry, labels, leader lines, camera.
`explode-slider.html` — control markup and wiring.

Blocks without explicit `cells` receive them from the partitioner
automatically. The system throws rather than renders if the result would not
tile all 27.
