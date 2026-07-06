# ARCHITECTURE-2525 — CRS Specification

> Level 3 domain on WIREFRAME-CORE (`docs/2525-core/WIREFRAME-CORE.md`), developed in
> PARALLEL with SECURITY-2525. Why parallel: drawing a 2×4 wall in pixel wireframe is
> the same critical primitive as drawing security forces — one substrate, two domains,
> and SECURITY's sim consumes ARCHITECTURE's buildings. Vision chain:
> Python → Revit → Unity/Unreal home modeling, 33-iteration eXeL polling design loop,
> cost + time visualization, sendable to any architect worldwide.
> Naming: `ARC-##.##`, IO as `ARC-##.##.IN/.OUT`.

## ARC CRS Catalog

| CRS | Requirement | Shared with |
|---|---|---|
| **ARC-01** | **Site/lot grid** — local coordinate spine (ft-in + metric), lot lines, setbacks, north arrow, optional world-anchor (lat-lon of lot corner) | U-WF-01 |
| **ARC-02** | **Framing primitives** — 2×4 / 2×6 stud walls via instanced repeat @ 16"/24" OC, top/bottom plates, headers, jack/king studs, joists, rafters/trusses | U-WF-02 |
| ARC-02.01 | Every framing member = wireframe primitive + metadata packet (dimension lumber size, length, grade, count) | U-WF-06 |
| **ARC-03** | **Openings** — doors + windows with rough openings (header sizing guidance), placed on wall faces | U-WF-10 (same primitive SECURITY consumes) |
| **ARC-04** | **Assembly** — rooms → floors → roof; plates/sheathing as dual-mesh secondary layer (structure vs finishes) | U-WF-03 |
| **ARC-05** | **2D ⇄ 3D one-source** — pixel-wireframe floor plan extrudes to 3D; edits in either view mutate the same model | U-WF-05 |
| **ARC-06** | **Cost + time estimation** — live rollup from primitive counts (studs, sheets, labor units); re-estimate deterministic | U-WF-08 |
| **ARC-07** | **33-iteration eXeL polling design loop** — stakeholders (family, clients) vote on design iterations through the core polling engine; theme clustering on feedback; iteration history as replay bundles | Core Cubes 1–9 |
| **ARC-08** | **Export** — architect-ready quadruple `.py / .obj / .cs / .cpp` (X-BAT generator pattern) feeding Revit / Unity / Unreal | U-WF-05 |
| **ARC-09** | **Code-guidance layer** — general guidance only (egress window sizing, door widths, stair rise/run) — explicitly NOT certified plan approval | — |
| **ARC-10** | **HAL compliance** — full house model navigable on Raspberry-Pi-class browser delivery | U-WF-07 |
| **ARC-11** | **Building export to SECURITY-2525** — any ARC model downgrades gracefully to the U-WF-10 minimal building (box + doors + windows) for security simulation (PRISON / CAPITOL / NEIGHBORHOOD scenarios) | SEC-07.01, SEC-11 |

## Development order
1. U-WF-10 minimal building (unlocks SECURITY scenarios immediately)
2. ARC-01 site grid + ARC-03 openings
3. ARC-02 framing primitives (the 2×4 moment) + ARC-05 2D⇄3D
4. ARC-06 cost/time → ARC-07 polling loop → ARC-08 export
