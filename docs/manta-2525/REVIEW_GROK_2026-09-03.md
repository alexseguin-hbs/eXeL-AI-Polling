# Second review — Grok, on the three concept boards (received 2026-09-03, verbatim)

> **This output is for conceptual critique only.** It is not a design baseline, safety case, certification
> approval, procurement authority, construction authorization, operational doctrine, hurricane-safety advice,
> or human-test plan. All safety-critical domains remain 🔴 Red until validated by qualified human experts.
>
> Provenance: pasted by the Thought Master as "Manta updates — grok says". Grok reviewed THREE boards — the
> two in `images/` plus a **Manta Sentinel 800 BE** board this repository does not have. Text unedited.
> Reconciliation with the MoT critique is in `CRITIQUE_v1.7.1.md` §10. Language quoted from the boards is
> the finding, not the copy ⟦quoted⟧.

Concept-art expansion — still Red. These boards are arrangement posters, not a hydrostatic booklet. Every number below is transcribed from the art or called out as a conflict. Not a design baseline, safety case, quote, or storm plan.

Identity collision on the first board
The title says MANTA MINI 99-66. The spec rail says 99 km / 33 m / 350 kWh. v1.7.1 defined 99-33 = 33 m / 350 kWh and 99-66 = 66 m / 420 kWh.
Treat this poster as Mini 99-33 geometry wearing a 99-66 name, or freeze one naming rule before any NA package.

A. Manta Mini (poster "99-66" / numbers = 33 m class)
Mission (as drawn)
Coastal travel pod: carry 2–4 people plus one Model 3-class dimensional vehicle, surface / semi-sub / shallow transit, 12–24 h refuge. Tesla is a box, not a partner.
Envelope (poster)

| Item | Poster | Engineering note |
|---|---|---|
| LOA | 12.4 m | Sentinel Mini callout shows 12.8 m — pick one |
| Beam | 5.2 m | Wide for 33 m coastal; docking and trailer/legal road move are unstated |
| Height | 3.5 m overall / 2.6 m bay | Interior 2.0 m bay height |
| Vehicle bay | 5.6 × 2.6 × 2.0 m | Model 3 is ~4.7 × 1.85 × 1.44 m — bay is generous in length, tight on drive-in height + ramp angle |
| Operating depth | 33 m | Name "66" contradicts |
| "Design safety depth" | 50–60 m | Marketing margin ≠ class collapse depth |
| Range | 99 km | No current, sea state, reserve, hotel load |
| Battery | 350 kWh LFP marine | Vehicle pack is a second fire case |
| Power | 60–120 kW cont. / 200–300 kW peak | Need hotel vs prop split |
| Speed | 8–12 kn surface / 3–5 kn submerged | Drag unknown until lines exist |
| Propulsion | 2× rear pods + 2× trim thrusters | "2–4 thrusters" also listed — count conflict |
| Crew | 2–4 | Hatch/egress count not shown |
| Refuge | 12–24 h | O₂ only in v1.7.1; CO₂/heat/fire missing |

Zones (left → right)
1. Forward control lounge — 2 seats drawn, "360° visibility." Windows / viewports are pressure-hull penetrations (class-critical).
2. Vehicle bay — drive-through volume; vehicle is a sliding weight (~1.8 t class in v1.7.1).
3. Ark / power module — batteries, LS, "emergency refuge." Co-locating energy + people is a separation problem.
4. Stern RO/RO — hydraulic clamshell + ramp. Free-surface + downflooding when the door is open.

Modes (poster)
Surface · semi-submerged (low profile) · submerged transit · deploy & return.
Best-practice translation: each mode is a separate loading condition (weight, VCG, freeboard, hatch state). "Auto-stabilization" and "perfect balance" are claims to delete. ⟦quoted⟧

Deployment 1–6 (poster)
Approach/align on surface → ramp down → drive in → secure & seal → systems on → depart.
Missing for an NA: chock loads, parking brake, HV isolation of the car, ramp angle vs. 2.0 m lintel, door-open stability, abort if the car is half in.

Language to strip before public use
"Safe submergence," "perfect balance," "peace of mind," "mission-ready," "engineered for real oceans." ⟦quoted⟧

B. Sail Ark 22
Mission (as drawn)
Surface carrier: one Mini in a cradle. Sail + solar + electric + hydrofoil catamaran. Charge / protect / extend range.
Envelope (poster)

| Item | Poster | Conflict |
|---|---|---|
| LOA / beam | 22.0 / 9.5 m | Plausible carrier size |
| Wing height | 21.5 m | Air draft, lightning, marina, bridges |
| Draft | 1.2 m foils up / 3.0 m down | Recovery in shallow unstated |
| Disp. (est.) | 35–40 t | v1.7.1 Mini bound was 45–52 t. A 40 t Ark cannot pick up a 45 t Mini. This is the largest number error on the wall |
| Mini capacity | 1 | Matches drawing |
| Crew | 2–4 | Plus Mini occupants? Unclear |
| Range | 1,200+ km | Energy model absent |
| Speed | 35–50 kn sail-assist; 80+ kn foil concept | 80 kn with a 12 m sub on deck is a seakeeping / slam / latch problem, not a spec |
| Solar | 120–180 kW | Area vs. 21.5 m wing — needs array layout, not a sticker |
| Pods | 60–90 kW ×2 | |
| Battery | 400–800 kWh LiFePO₄ | |
| Class target | RINA (concept) | Fine as intent; not a notation |

Systems called out
Automated wing sail · MPPT solar · vibration-isolated cradle "snug" on Mini · twin electric pods · foil cat · fire suppression · life raft · climate deck · energy/health monitoring.
Engineering stack the poster skipped
- Launch/recovery in a stated sea state (not "optional deploy")
- Cradle loads at foil-borne slam
- One-compartment stability with Mini on / Mini off (two ships)
- Wing-sail failure + Mini mass = capsize case
- Foil retraction + Mini dock in the same 30 seconds
Interface freeze: Ark talks to Mini only at surface + certified Mini depth = 0 for this carrier. No 33 m operations from the Ark until both float models exist.

C. Manta Sentinel 800 BE (poster)
What the art is selling
800 m mothership, spherical dual-layer bow door, Mini in a floodable ark dock, family refuge suite, hot-swap battery "Ark pods," cost $1.1–2.6B.
Specs on the board — treat as inconsistent concept labels

| Line | Poster | Problem |
|---|---|---|
| Depth | 800 m | v1.7.1 Sentinel 800 was ~8,000 t class. This drawing's hull reads yacht-scale |
| "Dimensions" | 10.8 × 7.0 × 3.9 m | Shorter and lower than the Mini (12.4 × 5.2 × 3.5). Cannot contain the Mini as drawn unless this box is a module, not the ship |
| Tesla bay on Sentinel card | 5.1 × 2.05 × 1.65 m | Smaller than Mini bay 5.6 × 2.6 × 2.0 — car does not fit both |
| Mini on same board | 12.8 m LOA, 3.6 m high, bay 5.6 × 2.6 × 2.0 | Conflicts with 10.8 m ship |
| Battery Ark pods | 1,200–1,800 kWh | v1.7.1 Sentinel 800 bank was 250–375 MWh (two orders of magnitude) |
| Propulsion | 250–380 kW | Yacht, not 800 m expedition ship |
| LS | 10–12 O₂ tanks + "MEM-2525 electrolyzer" | Electrolyzer = H₂ + O₂ + power + heat — not a label |
| Hot-swap | 7–60 min | At 800 m? Only at Mini-certified depth / surface per your own doctrine |
| Thermal | Aerogel + VIP + syntactic foam | Materials list ≠ thermal design |
| Solar tender | 12–14 m, 150 kW | Separate craft |
| Cost | $1.1B–$2.6B | Do not use — v1.7.1 forbade cost as quote |

Door sequence (useful as a storyboard, not a mechanism)
Closed → unlock → rotate → open. Dual spherical clamshell "mouth."
NA/class issues the art hides: two pressure boundaries, floodable dock, free surface, latch loads, trapped air, Mini at 33/66 m vs ship at 800 m. Doctrine already said: ship must be at Mini depth before dock. Hardware interlock is a requirement, not a GIF.
Family suite copy
4 individual pods + master, 4.20 × 6.60 m, 14–21 day "comfort," "storm-avoidance." ⟦quoted⟧
Kill "storm-avoidance" in any public or investor board. Evacuation and certified shelters remain the only authorized path. ⟦quoted⟧

D. Nested stack — only the interfaces that survive critique

    Sentinel 800   [DEFER — dimensions vs Mini do not close]
        └── Sail Ark 22   [DEFER — 35–40 t vs Mini 45 t+]
            └── Mini      [ACTIVE GATE — float this first]
                └── Model 3-class box (dimensional only)

Shared interface to freeze now (paper only): Bay opening ≥ Mini beam + fender; sill height; latch grid; comms/power wet-mate at surface; depth interlock rule.
Do not freeze 800 m door kinematics.

E. Best-practice overlay on this art
1. One lines plan for the Mini from 12.4 m × 5.2 m × 3.5 m — then displacement from volume, not from a 45 t cell.
2. Four loading conditions: lightship · people only · people+vehicle · door-open RO/RO.
3. Viewports and stern door go on the penetration register day one.
4. Two batteries: 350 kWh ship LFP + vehicle HV pack isolated.
5. Delete safety-depth 50–60 m until a class collapse calculation exists.
6. Ark displacement must exceed Mini + margin, or the Ark is a tow boat, not a carrier.
7. Sentinel poster numbers look like a second Mini relabeled 800 BE. Split the files.

F. What to send a naval architect (Mini only)
- These three posters as styling reference, stamped CONCEPT
- Single name: 99-33 or 99-66
- Agreed LOA/beam/height
- Vehicle as 1.8 t @ stated CG range
- Door-open case required
- Deliverable: signed hydrostatic booklet + weighing/inclining plan
- Banner: not certified, not for storm use, not for build

Bottom line: The art is a strong Vision / SoI comprehension plane. As engineering, the Mini is the only object with a closed-enough box to start hydrostatics — after you fix 33 vs 66, 12.4 vs 12.8, and Ark 40 t vs Mini 45 t. Sentinel 800 on this sheet is not an 800 m mothership; it is a Mini-scale rendering with mothership copy. Keep it Red.
