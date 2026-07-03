# 3D Home Design Framework — First Level-3 Domain Play Prototype

> **Purpose.** Prototype the Level 3 substrate against the **Architect-2525** domain using the cheapest possible visualization pipeline. The goal is to prove that a homeowner anywhere in the world can iterate their design on a Raspberry Pi through a phone browser — Blizzard-Games-style universal reach — before ever touching Revit or Unity.
>
> **Aesthetic reference.** Star Wars arcade (1983) vector edges — but better. Cheap to compute, cheap to transmit, expressive enough to convey spatial truth.
>
> **Status.** DESIGN — no code shipped. This doc is the scope contract for the future build.

**Anchoring contract:** `L3-2026-07-03.7` (see `docs/CUBE_19_27_LEVEL_3_FRAMEWORK.md`)
**Anchoring commit:** `3afa3c2` on `main`

---

## 1 · Pipeline (four stages, decreasing compute demand LEFT → RIGHT is inverted here)

```
   PYTHON EDGE          REVIT / DXF        UNITY 3D          UNREAL 5
   (Low tier)           (Medium tier)      (Medium tier)     (High tier)
   ─────────────        ─────────────      ─────────────     ─────────────
   Wireframe            Architect-grade    Walkthrough       Photorealistic
   on Pi                CAD export         VR                cinematic
   ─────────────        ─────────────      ─────────────     ─────────────
   PLAY EVERYWHERE      SEND TO ARCHITECT  CLIENT REVIEW     PRESENTATION
```

The **Python edge tier is the primary contract.** Revit / Unity / Unreal are opt-in fidelity upgrades that never gate the design loop.

---

## 2 · The Python edge visualization

### 2.1 · Geometry primitive

A house is a **graph of vertices + edges** in a `UCRS-2525` coordinate frame (Universal Coordinate Reference System — see Level 3 framework §14):

```python
@dataclass(frozen=True)
class Vertex:
    id: str            # e.g. "V001"
    a: float           # UCRS-2525 azimuth (0000-3600)
    b: float           # UCRS-2525 elevation (0000-3600)
    c: float           # UCRS-2525 radius / height (metres from origin)

@dataclass(frozen=True)
class Edge:
    id: str            # e.g. "E001"
    v0: str            # vertex id
    v1: str            # vertex id
    kind: Literal["wall", "roof", "door", "window", "floor", "structural"]
    material_id: str   # references Materials API entry

@dataclass(frozen=True)
class House:
    slug: str          # spec slug — e.g. "V2525-TinyHome-042"
    vertices: list[Vertex]
    edges: list[Edge]
    iteration: int     # 1..33
    replay_hash: str   # SHA-256 of sorted vertices + edges
```

### 2.2 · Renderer

Pure Python + `numpy` + `PIL` on the Pi baseline; escalates to `pygame` / `WebGL` on Medium tier; escalates to Unity/Unreal on High tier — but the **same edge graph** feeds every renderer.

**Frame rate targets** (auto-calibrated per HAL tier — see §6):

| Tier | Baseline hardware | Target FPS | Renderer |
|:-:|---|:-:|---|
| Low | Raspberry Pi 4 + phone browser | 15-30 | Python edge wireframe → PNG stream OR SVG DOM |
| Medium | Laptop / mid-tier phone | 30-60 | Python edge + textured shading via WebGL |
| High | Workstation | 60-120 | Unity / Unreal 5 photorealistic |

**Substrate rule (from §4 HAL):** Cube 21 MUST accept the Python edge wireframe as a valid model source. No domain can require pre-modeled CAD.

### 2.3 · Stereoscopic sensor path (upgrade)

Cube 21 also accepts **2+ camera stereoscopic pair** input → dimensioned 3D wireframe via classical disparity or (upgrade) event-camera / neuromorphic sensor. Homeowner points a phone pair at an existing space; substrate produces a first-draft edge graph. Next-gen edge-generation devices plug into the same slot.

---

## 3 · The 33-iteration design loop

Anchored on the Vision 2525 Architect narrative: **20 to 33 iterations before construction**, refining across the 11 axes below.

### 3.1 · Estimator axes (Cube 24 config for Architect-2525)

Every iteration reduces uncertainty on **at least one** axis:

1. Owner goals
2. Layouts
3. Structure
4. Systems (HVAC / electrical / plumbing)
5. Cost
6. Zoning
7. Energy performance
8. Architect feedback
9. Compliance
10. Approval records
11. Local permit readiness

**Convergence rule:** exit the loop when uncertainty drops below threshold across ALL 11 axes, hard-capped at 33 iterations. Uncertainty per axis is a scalar 0-100 (0 = fully known, 100 = untouched).

### 3.2 · Loop shape

```
Iteration i → Cube 20 (concept input) → Cube 21 (edge model)
           → Cube 24 (estimator per axis) → Cube 22 (aggregate)
           → Cube 10 SIM checkout (replay + variant compare)
           → Cube 23 De-Risk gate (advance / retire variants)
           → Cube 7 L1 Polling session (homeowner + review board vote)
           → back to iteration i+1
```

Every iteration produces a Cube 25 draft quote-lock candidate — the final commit at iteration ≤33 is the buildable design + timeline + assigned architect.

---

## 4 · Web browser delivery

### 4.1 · Same substrate as eXeL Polling

The frontend already ships the Flower of Life visualization + Trinity Redundancy broadcast layer + `useSessionBroadcast` hook + `/sim` split-screen. All are reused verbatim; the Architect-2525 domain adds:

- `frontend/app/design/[slug]/page.tsx` (new route) — homeowner design canvas
- `<HouseWireframe />` component — SVG-DOM renderer (Low tier default)
- `<IterationTimeline />` — 1..33 stepper with per-axis uncertainty bars
- `<ArchitectMarketplace />` (Cube 26 UI) — global routing to bidding architects

### 4.2 · Bandwidth budget

**Edge graph payload target: ≤ 100 KB** for a full house. Wireframes serialize as JSON `{vertices:[…], edges:[…]}` — a 1,200-edge house is ~80 KB pre-gzip.

Users on 3G phones anywhere in the world get a full house on-screen in ≤ 2 seconds.

---

## 5 · Sample slug — "V2525-TinyHome-042"

Following the Level 3 Spec Slug Convention (Manta-2525 pattern):

- `V2525` — Vision 2525 domain prefix
- `TinyHome` — sub-type (also `Renovation`, `CustomHome`, `Accessory`)
- `042` — sequence number within the sub-type

The slug encodes the top defining specs. Full metadata lives in the Domain Play YAML.

---

## 6 · HAL profile (Architect-2525)

Copies the HAL profile from `docs/CUBE_19_27_LEVEL_3_FRAMEWORK.md` §4:

```yaml
hal_profile:
  baseline:
    cpu: arm_cortex_a72
    gpu: broadcom_videocore_vi
    inference: tflite
    screen: 1080p
    sensors: [camera_pair_stereoscopic, imu]
    mobility: static
  upgrades:
    screen: [4k, 8k]                         # auto-calibrate FPS
    inference: [onnx, cuda, edge_tpu]
    sensors: [lidar, structured_light, event_camera]
    renderer: [webgl_textured, unity3d, unreal5_photoreal]
```

---

## 7 · What ships when

**Phase A · Python edge prototype (weeks, not months):**
- `backend/app/cubes/level3/architect_2525/geometry.py` — Vertex / Edge / House dataclasses + replay hash
- `backend/app/cubes/level3/architect_2525/estimator.py` — 11-axis stub estimator (starts as heuristic; grows with real data)
- `frontend/components/design/house-wireframe.tsx` — SVG-DOM renderer
- `frontend/app/design/[slug]/page.tsx` — canvas + iteration stepper
- 1 sample TinyHome (`V2525-TinyHome-042`) hardcoded for demo

**Phase B · Real polling loop:**
- Wire the design canvas to L1 Cube 4 (Collector) + Cube 7 (Ranking) so homeowner + review board can vote on iteration variants
- Cube 23 De-Risk Gateway calendar (recurring weekly polls per project)

**Phase C · Marketplace + external export:**
- Cube 26 Execution Marketplace UI — architect bidding
- Revit `.rvt` and DXF export from the same edge graph (write-once, multi-format)

**Phase D · High-fidelity tiers:**
- Unity3D walkthrough
- Unreal 5 photorealistic renders
- All same edge graph, no re-modeling

---

## 8 · Success criteria (when is Architect-2525 "shipped"?)

Aligns with the L3 framework §11:

1. A homeowner on a phone browser in a low-bandwidth country can seed a design from a stereoscopic phone photo pair, iterate through 20-33 rounds, and receive a locked quote with an assigned architect — **without ever leaving the browser.**
2. All 4 Vision 2525 Principles (Humanity / Trust / Quality / Earth) are testably enforced.
3. Cube 27 Delivery & Actuals feedback improves Cube 24 estimator accuracy measurably project-over-project.
4. Architect-2525 runs concurrently with Manta-2525, Drone-2525, Security-2525 on the same substrate with zero cross-contamination.
5. Every quote is blockchain-anchored via Cube 11 for years-long re-verification.
6. Python edge tier at 15-30 FPS on a Raspberry Pi 4 through a phone browser.

---

## 9 · Non-goals

- Not building a Revit competitor at Phase A. Revit is an EXPORT target.
- Not shipping Unity/Unreal integrations until edge tier is proven.
- Not implementing a full BIM standard — we serialize enough for buildability, not enough to replace IFC.
- Not solving structural analysis in Phase A — Cube 24 estimator ships heuristic values, then binds to third-party solvers as they become available.

---

## 10 · Handoff to Vision 2525 self-update loop

Once Phase A ships, Architect-2525 becomes the reference domain the entire Level 3 self-update loop is validated against. Every project's Cube 27 actuals sharpen Cube 24's world model; the framework proves itself by delivering better estimates for the 100th home than the 1st.

**Star Wars arcade edge — but better — is not nostalgia. It is the design's proof that the cheapest possible visualization is enough to run society-scale innovation loops.**
