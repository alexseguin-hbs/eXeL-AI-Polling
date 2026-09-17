# Operator engineering constraints + vision (2026-09-17)

Persisted verbatim (persist-first). These are HARD sim rules, not lore.

## Hard rules
1. "VTOL FOIL (not two objects) this is fixed wing" — the FOIL platform (D1F) is ONE fixed-wing VTOL body,
   never a hull+wing / two-object split. (Our airframe is already one model; keep it one.)
2. "Mass-AI CANT GO THROUGH WALLS AND NEITHER CAN DRONES" — building walls are colliders. MASS-AI (ground
   robot) body-translate and every flying drone's motion are blocked by building footprints; a drone bounces,
   the robot stops. r.076 implements this: WALLS[] + inWall(x,z,y); a blocked move returns true (rejected),
   drones reflect (vx,vz *= -1), toast "WALL".
3. "ARK SAIL and Mini can only be in water around austin (use bathymetry data from security-2525)" — ARK
   (kind 'ark') and MINI (kind 'sub') are WATER-ONLY, gated by Austin bathymetry wet-cells from Security-2525.
   r.076 implements a WATER box + inWater(x,z); outside water is rejected, toast "WATER ONLY". Full depth rules
   in ARK-MINI-WIREFRAME.json: legal_ark = depth > draft (foil-draft if deployed); legal_mini_surface =
   depth > MINI_draft; legal_mini_dive = depth >= keel && keel <= 33; dry/street/dam-face reject, no clipping
   banks. Bathymetry SOURCE = Security-2525 (Lake Travis is the only water >33 m for the Mini dive).
4. "remember we are far from having 7MB FILE THAT CAN BE USED FOR ON DEMAND GAMING (that lives on phone or PC
   HTML file)" — the north-star deliverable is a SINGLE STANDALONE HTML FILE ≤ 7.77 MB (FILE_BUDGET=7770000 in
   the deck) that runs on a phone or PC with no server, for on-demand gaming. Our /drone-2525 Next route is the
   dev surface; the ≤7 MB self-contained HTML export is the shippable artifact and a first-class budget target.

## Data provided
- ARK SAIL 33 + MANTA MINI 66-33 wireframe spec (one rigid body each; OBB primitives; ARK twin-ama + stern
  garage carrying one Mini; Mini 5 people, 33 m depth rating, surface-loading, car-is-cargo-only). Stored
  verbatim at frontend/public/drone-2525/ARK-MINI-WIREFRAME.json (sha256 63c2e53b…a75c). Water-only, Austin
  bathymetry is the legal domain. 7 MB proxy = 20–40-triangle hulls + 4 boxes, no car interior, posters out.

## Vision (preparing for the future — record, not build now)
- "Shield in the Sky" book: call sign Thought Master (MoT) leads twelve commanders — Enki, Thor, Krishna,
  Odin, Enlil, Athena, Sofia, Aset, Pangu, Christo, Thoth, Asar — through layered Air Defense Artillery against
  drones, cruise missiles, jamming and saturation; the TOC as the mind of the battlefield; "ADA protects
  tomorrow"; ends loading a FULL X-BAT SWARM SCENARIO. This IS the twelve-AsM / MoT fleet, in doctrine form —
  the game's story and the SSSES fleet are one frame. Layered rings (outer = highest consequence, inner =
  leakers, guns = affordability), defended-asset priority (fuel/ammo/C2), and named-HI-before-AI-fire are the
  doctrinal echo of our amber→red two-step and the winners-circle/authority ladder.
- PDFs carried to docs/drone-2525/vision/: UAS_Situational_Awareness.pdf, The_Future_of_Drone_Swarms.pdf,
  The_Future_of_Warfare.pdf. Doctrine references (FM 3-01, ATP 3-01.81 counter-UAS, JADC2, Shield AI X-BAT).
  "perfect; we are preparing for this day in the future."

## r.076 (HEAD)
drone-2525_v.00.00_r.076.html sha256 6a327b62…7898 — adds WALLS/inWall (rule 2), WATER/inWater (rule 3),
ARK twin-ama draw, repositions MINI/ARK into the water region. HEAD moved r.075 → r.076.
