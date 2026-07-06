# WIREFRAME-CORE — Universal 2525 Substrate (U-WF)

> The shared drawing substrate beneath ALL X-2525 domains. A 2×4 wall stud and a
> THAAD canister are the SAME primitive (instanced line/box wireframe) with different
> metadata. SECURITY-2525 and ARCHITECTURE-2525 develop in parallel on this core;
> Manta-2525 / Drone-2525 / future domains inherit it. R-CORE modularity thesis applied:
> stable contract + capability-detected rendering + verified cross-impl determinism.

## CRS naming
Domain-scoped, standard two-digit format (never letters):
`U-WF-##` (this core) · `SEC-##.##` (SECURITY-2525) · `ARC-##.##` (ARCHITECTURE-2525).
Input/Output IDs: `SEC-##.##.IN` / `SEC-##.##.OUT` etc.

## U-WF Requirements

| ID | Requirement | SECURITY use | ARCHITECTURE use |
|---|---|---|---|
| **U-WF-01** | **Coordinate spine** — one engine, two unit modes: world (MGRS / UTM / DMS / lat-lon / elevation / AGL) and local site grid (ft-in + metric) | MGRS terrain + asset plots | lot grid, setbacks, room dims |
| **U-WF-02** | **Primitive set** — line, polyline, arc, box, cylinder, extrusion, and **instanced repeat** (N copies at fixed spacing) | depth ribs, canister clusters, grid | studs @ 16" OC, joists, rafters |
| **U-WF-03** | **Dual-mesh law** — primary mesh + reduced-density secondary mesh (cyan) | surface grid + subsurface/bathymetry | structure + finishes/utilities |
| **U-WF-04** | **Overlay law** — symbols/annotations are overlays, NEVER part of the mesh | MIL/eXeL-STD symbols | fixtures, dimensions, labels |
| **U-WF-05** | **Python visualization parity** — every model expressible as a matplotlib/OBJ line-wireframe generator; export quadruple `.py / .obj / .cs (Unity) / .cpp (Unreal)`. Reference pattern: `docs/security-2525/xbat-wireframe/` | asset wireframes | house model → Revit/Unity/Unreal chain |
| **U-WF-06** | **Replay bundle** — metadata packet per drawn element: ID, type, coords, elevation, source, confidence, timestamp, classification/policy, replay ID | engagement replay | design-iteration history |
| **U-WF-07** | **HAL budget** — full render on Raspberry-Pi-class compute, delivered via browser (Vision 2525 HAL, 6 hot-swap slots, auto-calibration) | field/edge command | on-site tablet walkthrough |
| **U-WF-08** | **Determinism** — identical input → identical wireframe → identical SHA-256 render hash (SSSES replay-verifiable) | sim reruns | cost re-estimates |
| **U-WF-09** | **LOD / fidelity scaling** — element density adapts to compute + zoom; silent caps forbidden (must report dropped detail) | 1M-track scenes | full-house frame views |
| **U-WF-10** | **Building primitive (SHARED)** — minimal structure: box footprint + wall height + door/window openings placed on faces. SECURITY consumes as-is; ARCHITECTURE refines into full construction | urban defense sim structures | starting point of every house |
| **U-WF-11** | **Color law** — R-CORE locked: red = hostile/boundary/critical only; gold = selected/AGL; risk flips gold→red; focus = user-set orange; domain palettes layer on top | 2525 affiliation colors | trade colors (framing/electrical/plumbing) |
| **U-WF-12** | **Version stamp** — `eXeL v#.###-YYYY.MM.DD-HH.MMCST` + short SHA, auto-stamped per release build | command UX footer | drawing title block |

## Parallel development protocol
1. Any primitive needed by BOTH domains is built ONCE in WIREFRAME-CORE, then consumed.
2. A change to a U-WF primitive must pass BOTH domains' verification sheets (spiral: forward SEC + ARC, backward to core).
3. Verification method: render real geometry → PNG in scratchpad → publish to Downloads for HI review (never push to GitHub mid-sim).
4. Pass criteria: determinism hash stable ×5 runs; renders within HAL budget; SSSES per pillar.
