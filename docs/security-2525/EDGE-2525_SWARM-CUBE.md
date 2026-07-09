# EDGE-2525 · SWARM-CUBE Interaction Law (concept seed — Thought Master, 2026-07-09)

## The law
Every cube (voxel / map tile / drone / sensor node) pulls detail from its **6 face-adjacent
neighbors simultaneously** — left, right, above, below, in front, behind — the way a drone
in a swarm hears the five craft around it at once. Neighbor state directly shapes the
node's **next travel distance, speed, and action**. The swarm shares as one; when an asset
is lost (shot down, offline, tile 404), the remaining neighbors **auto-adjust** — the mesh
re-balances with no coordinator round-trip.

## Why it matters (new-to-world CUBE interaction)
- One cube interfaces with another exactly as Cubes 1–10 interface in the SoI grid:
  stable contract per face, capability-detected fallback per face (R-CORE modularity law).
- This is the data-path spine for **CNN + sensor fusion updates** as EDGE-2525 lands:
  a node never waits on a central fetch — its 6 faces are its working set.

## Already implemented today (verified 2026-07-09)
- `frontend/lib/tile-cache.ts` — the 6-face "pull-as-you-need" ladder:
  memory → localStorage → **Supabase shared team cache (the digital buffer)** → origin,
  written back up the ladder. In-flight dedup: **two map panes zooming to the same tile
  = ONE network round-trip** (MAP + MINI share the fetch).
- `mission-planning.tsx` mapEngine `beta` — prefetches the zoom-in/zoom-out (finer/coarser)
  tiles through the ladder: the vertical (Z) pair of the 6 faces.
- `frontend/lib/voxel-grid.ts` — cubes are coordinate-addressed (UCRS·CELL E/N/Z), so the
  6 neighbors of any cube are pure arithmetic: E±1, N±1, Z±1. Drone-swarm ready.

## Next (EDGE-2525 / VISION-2525 spine)
1. Lateral prefetch: on pan momentum, warm the N/S/E/W neighbor tiles (4 remaining faces).
2. Loss auto-adjust: when a tile/node request fails, neighbors widen their face coverage
   (coarser tile substitution) instead of leaving a hole — mirror of swarm re-balance.
3. Same contract carried to drone/asset state over COMM/SYNC-2525 buses (HITL replay-safe).
