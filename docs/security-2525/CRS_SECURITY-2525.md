# SECURITY-2525 — CRS Specification

> Level 3 domain on WIREFRAME-CORE (`docs/2525-core/WIREFRAME-CORE.md`).
> Developed in PARALLEL with ARCHITECTURE-2525 — shared substrate, shared building
> primitive, shared Python visualization pattern. Training simulation, generic/simulated
> data only. Naming: `SEC-##.##`, IO as `SEC-##.##.IN/.OUT`.

## SEC CRS Catalog

| CRS | Requirement | Status |
|---|---|---|
| **SEC-01** | **Command UX shell** — tab nav (OVERVIEW · SENSORS · THREAT VIEW · PLANNING · SIMULATION · ENGAGEMENT · LOGISTICS · MISSION HEALTH · TRAINING & VR · AFTER ACTION), 3-dot collapse rails (L/R/bottom), fusion-map maximize with critical-info overlay, version stamp (U-WF-12), CLEARANCE footer w/ Seed-of-Life seal | Prototype live |
| SEC-01.01 | Critical strip always shows abort authority — ABORT never hidden by any collapse/maximize state | Done |
| **SEC-02** | **MGRS terrain wireframe** — dual-mesh (U-WF-03): surface grid, reduced-density cyan subsurface, sparse vertical depth ribs, heightfield queries; coordinate spine (U-WF-01) | v0.4 prototype |
| **SEC-03** | **Symbology engine** — TWO iconologies, NEVER mixed: (a) MIL-STD-2525E Change 1 DOCTRINE-EXACT (`docs/security-2525/MIL-STD-2525.pdf` + `eXeL-STD-2525.md`): equipment circle/diamond frames, air frames, canister+bars launcher family, radar zig-zag, quantity amplifier; (b) eXeL-STD-2525 platform silhouettes (operator-reviewed likenesses) | Done (5 assets) |
| SEC-03.01 | Affiliation NEVER decided by renderer — trusted input / operator / scenario config only | Spec'd |
| **SEC-04** | **Asset catalog** — Sentinel, THAAD, Patriot, Avenger + spec'd: M-SHORAD, TPY-2, C-RAM, NASAMS, Coyote/LIDS; future UCRS-2525: jets, bombers, submarines, surface, rotary, space | 4 drawn + catalog spec'd |
| **SEC-05** | **Threat layer** — X-BAT single + swarm (eXeL 3-ship echelon; MIL count amplifier), tracks with confidence, metadata packets (U-WF-06) | X-BAT done |
| **SEC-06** | **PLANNING tab** — scenario authoring: place assets/threats on wireframe, sensor coverage envelopes, corridors, ROE gates | Tab stub |
| **SEC-07** | **SIMULATION tab (Security Mission Planning)** — deterministic scenario reruns (U-WF-08), 12 Ascended Masters parallel runs, metric compare, outcome videos | Tab stub |
| SEC-07.01 | **Scenario library — civilian-to-military brainstorm ladder:** ① **PRISON** (fixed perimeter, layered interior control) ② **CAPITOL — Austin, TX** (public landmark, mixed access, crowd flows) ③ **SMALL NEIGHBORHOOD** (community self-security, resident-owned sensors). Sensors dialed into community self-security first; lessons promote upward into MILITARY mission planning | Planned |
| SEC-07.02 | Scenario structures built from U-WF-10 building primitive (box + doors + windows minimum) | Planned |
| **SEC-08** | **ENGAGEMENT** — kill chain status, AI recommendation w/ confidence, engagement priority, human approval gates (APPROVE / REVISE / SIMULATE / HUMAN REVIEW / ABORT) | UX done |
| **SEC-09** | **LOGISTICS + MISSION HEALTH** — interceptor inventory, readiness, sensor fusion health | UX stub |
| **SEC-10** | **TRAINING & VR + AFTER ACTION** — replay bundles (U-WF-06) → scrubbable playback → outcome video export | Planned |
| **SEC-11** | **Building add** — generic structures for urban/site defense sim via U-WF-10; refined models importable from ARCHITECTURE-2525 | Planned (shared) |
| **SEC-12** | **Clearance & export modes** — Public (generic training) / Training / Internal / Restricted; certified export BLOCKED when source/classification/policy unknown; clearance levels 1–7 (Atlantis Seed-of-Life seal, Trinity master colors) | Footer done; gates planned |
| **SEC-13** | **HAL compliance** — full command UX + wireframe on Raspberry-Pi-class browser delivery (U-WF-07) | Constraint |

## Simulation pass criteria
Must EXCEED existing System, User, and Business/Outcome metrics; determinism hash stable ×5;
SSSES all pillars scored evidence-based; Language Lexicon `t()` audit at productionization.
