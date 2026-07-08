# SECURITY-2525 · The 6-Face Data Cube + R-CORE Resilience

*Architecture note for review (feed to Grok for enhancement). Author: Master of Thought,
autonomous run 2026-07-08. Goal: glitch-free zoom 10 m ↔ globe, pull-data-as-needed,
one-subsystem-offline-others-carry-the-mission, and a clean path to drone-swarm positioning.*

---

## 1. Why a cube (not a stack)

A traditional map stacks layers (raster on vector on grid). A **stack fails as a unit** —
one bad layer glitches the whole view, and you can't zoom faster than the slowest layer.

Instead, model each map view as a **cube with 6 independent faces**. Each face is a *stable
contract* (an interface), each has *hot-swappable implementations* ranked by fidelity/cost,
and each is *pulled and cached independently*. The view **composites whatever faces are
available right now** and degrades gracefully when one is missing. This is the same law as
the LIVE-FEED **Trinity Redundancy** (3 send paths × 4 receive channels — any one success =
delivered), generalized to spatial data.

### The 6 faces

| # | Face | Contract (stable) | Implementations (swappable, fidelity↓) | Fallback when offline |
|---|------|-------------------|----------------------------------------|-----------------------|
| 1 | **ELEVATION** | `sample(lat,lon)→m MSL` | GEBCO 2020 tile · USGS 3DEP · Copernicus GLO-30 · **synthetic** | synthetic terrain (`terrainMSL`) — contours still draw |
| 2 | **VECTOR** | `roads/water/borders in bbox` | OSM Overpass tile (Supabase-cached) · Natural Earth (coarse) | boundaries only (NE 50m) — always bundled |
| 3 | **IMAGERY** *(future)* | `raster tile(z,x,y)` | COG/WMTS satellite · none | omit — wireframe reads fine without it |
| 4 | **GRID** | `mgrs/utm/dms(lat,lon)` | pure math (`mgrs.ts`) | **never fails** — computed, no I/O |
| 5 | **TRACKS** | `entities()→{id,pos,hdg,spd,alt}` | live Supabase realtime · last-known cache | last-known + dead-reckoning |
| 6 | **GOVERNANCE (R-CORE)** | `meta(objId)→{lifecycle,authority,ssses}` | Supabase ledger · local session | local optimistic + reconcile later |

Face 4 (GRID) is the **keel** — it is pure computation with zero I/O, so a view is *never*
blank: you always have coordinates, scale, and MGRS lines even if every network face is down.

---

## 2. Pull-as-you-need: the tile pyramid (kills zoom glitches)

Data for faces 1–3 is addressed as **(face, zoom-band, tile-key)** and pulled on demand.

- **LOD selection** — pick the finest tile that *fully covers* the current view; else the
  coarsest tile over its centre. (Already shipped for ELEVATION: `DEM_INDEX` + `pickDemKey`.)
- **No blank flash on zoom** — keep the *current* tile rendered while the *next* LOD loads;
  swap only on arrival (optional cross-fade). Never tear down before the replacement is ready.
- **Prefetch the direction of travel** — on zoom-in, prefetch the finer child tile under the
  cursor; on pan, prefetch the neighbor tile you're heading toward; on zoom-out, the parent.
- **Progressive refine** — draw coarse immediately, replace with fine when it lands. Coarse
  is always instant (bundled NE + synthetic DEM), so the map is *never* empty mid-zoom.
- **Cache ladder** — `memory → localStorage → Supabase (shared team cache) → origin`
  (Overpass / opentopodata). A tile fetched once by any operator warms it for the whole team.

This is the "build-as-you-go, Google-Earth style" behavior: the world fills in as you explore,
and what you've seen stays cached. Supabase is the **shared middle tier** — big tiles never
touch git; they populate the bucket on first request and serve from CDN thereafter.

---

## 3. R-CORE: one subsystem offline, the mission continues

**R-CORE law:** every capability sits behind a stable contract with *N* ranked implementations;
each is health-checked; on failure the router **fails over to the next-best**, and the mission
set continues at *degraded fidelity* rather than stopping.

```
request(face) → [impl A healthy?] → yes: serve (full fidelity)
                                   → no ↓
                 [impl B healthy?] → yes: serve (reduced fidelity)
                                   → no ↓
                 [local fallback]  → always serves (keel fidelity)
```

- Circuit breaker per implementation (already in `core/circuit_breaker.py` for AI providers —
  same pattern, now for spatial faces).
- **Graceful degradation is the default, not the exception.** DEM origin down → synthetic
  contours. Overpass down → boundaries only. Realtime down → last-known tracks. The operator
  keeps planning; nothing hard-stops.
- Every object still carries its **governance metadata** (lifecycle, human authority, SSSES) so
  a degraded render is still auditable and reconciles cleanly when the face comes back.

---

## 4. The compute-tier toggle (the "9→60 fps / M2" analogy)

The renderer targets a **frame/latency budget** (e.g. 16 ms for 60 fps). When it can't hold the
budget — weak device, huge view, swarm of tracks — it **toggles down a fidelity tier** instead
of dropping frames, then climbs back up when there's headroom. Measured, adaptive, automatic.

| Tier | Render | Contours | Tracks | Inference |
|------|--------|----------|--------|-----------|
| **T0 full** | textured + 3D tilt | high fidelity (72 grid) | all, animated | full model |
| **T1 standard** | wireframe + shading | med (48 grid) | all, stepped | distilled |
| **T2 lean** | wireframe only | low (32 grid) | clustered | cached |
| **T3 keel** | grid + labels + icons | off | last-known dots | heuristic |

This is exactly how an **Apple M-series chip** load-balances: the same workload migrates across
CPU / GPU / Neural Engine depending on what the current silicon can sustain. Here the "workload"
is *render + contour + inference*, and the "silicon slots" are the **Vision-2525 six hot-swap
slots** (CPU / GPU / Inference / Screen / Sensors / Mobility). On any hardware change the tier
controller re-benchmarks and re-picks — a Raspberry-Pi-class node runs T2/T3; a workstation runs
T0. **Same code, same mission, self-calibrating fidelity.**

---

## 5. Interlink to drone-swarm positioning

The 6-face cube *is* the swarm substrate — no second system:

- Each drone is a **TRACKS-face** entity (`pos,hdg,spd,alt`) on the shared cube.
- **ELEVATION + VECTOR** faces give terrain-aware, obstacle-aware pathing for every drone.
- The **GRID** face gives the swarm one common MGRS reference frame (pilot + laser-tag gunner,
  two operators, one grid — the low-fidelity-wireframe co-op game generalizes to real ops).
- **R-CORE** gives each drone its own lifecycle + authority + SSSES, so one drone (or the ground
  station) going offline drops *that node* to last-known + local sensing while the **formation
  holds the mission** on the remaining nodes — swarm-level Trinity Redundancy.
- The **compute-tier toggle** lets a cheap onboard chip fly at T2/T3 wireframe while a command
  node renders T0 — the same scene at the fidelity each node can afford.

---

## 6. Build order (proposed)

1. **(shipped)** ELEVATION face as a tile pyramid (`DEM_INDEX`/`pickDemKey`) + synthetic fallback.
2. **Supabase middle tier** — bucket + `map_tiles(face,key,payload,updated_at)`; cache ladder
   `memory→localStorage→Supabase→origin`; on-demand VECTOR tiles (100 km) land here, not git.
3. **Glitch-free swap** — keep-current-until-next-loads + prefetch + progressive refine, per face.
4. **Tier controller** — measure frame time, pick T0–T3, expose a manual override in Settings.
5. **TRACKS realtime** — Supabase realtime entities; last-known dead-reckoning fallback.
6. **Swarm mode** — many TRACKS entities + terrain-aware pathing on the same cube.

Each step is a stable contract with a working fallback, so the system is **deployable and
mission-capable at every step**, and any single face can be offline without stopping the fight.
