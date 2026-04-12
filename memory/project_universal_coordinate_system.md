---
name: Universal coordinate system (SA/EA/HU/SR)
description: Base-3600 hierarchical addressing for planetary, drone swarm, and galaxy-scale positioning — replaces AU
type: project
---

**System:** 3600 radial units → .3600 sub-units → .3600 sub-sub-units (recursive subdivision)
- SA (Sun Angular Units) — star-centric angle
- EA (Earth Angular Units) — planet-centric offset (e.g., 230.1584)
- HU (Horizontal Angular Units) — 0-3600 orbital position
- SR (Star Radius) — distance in meters at given orbital position
- SP-OTU (Star Planetary-Orbital Time Unit) — fraction of orbit (0.0 to 1.0)

**Why:** Replaces AU. Works for ANY star system, not just Sol. Enables galaxy-wide metric conversion.

**How to apply in codebase:**
1. **Theme compression parallel:** 3600→sub→sub mirrors 99→9→6→3→1 Flower of Life narrowing
2. **Drone swarm positioning:** Relative positions within a swarm use HU-style angular addressing instead of GPS
3. **Cube grid addressing:** 3×3×2 cube positions already use (layer, row, col) — can extend to radial
4. **Session scoping:** Project→Differentiator→Specification maps to SA→EA→HU hierarchy
5. **MASS-AI sensor fusion:** R2D2 robots use relative positioning within industrial environments

**Future products:** eXeL AI (kids), MASS-AI (industrial R2D2), drone competitions, laser tag simulation
