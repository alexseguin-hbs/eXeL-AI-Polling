# Manta-2525 — feedback to eXeL AI on the three boards (2026-09-07)

> **This output is for conceptual critique only.** It is not a design baseline, safety case, certification
> approval, procurement authority, construction authorization, operational doctrine, hurricane-safety advice,
> or human-test plan. All safety-critical domains remain 🔴 Red until validated by qualified human experts.

**Purpose.** The operator asked for the corrections that would make the boards true to the numbers, so the
next edition of the art is not the source of a second contradiction. The findings below reconcile the two
infographics in `images/`, the Sentinel 800 BE board Grok reviewed (not in this repository), the handoff
v1.7.1, and `REVIEW_GROK_2026-09-03.md` (verbatim). Ruling R-B (`docs/decisions/2026-09-03_operator_rulings.md`)
fixes the name: **Manta Mini NN-DD = NN km range, DD m depth.** The operator's word on 2026-09-07:
**99-33 is the first pilot we collectively build in simulation.**

## The naming rule, applied

| Name | Range | Depth | Battery (handoff v1.7.1) |
|---|---|---|---|
| Mini **99-33** | 99 km | 33 m | 350 kWh |
| Mini **99-66** | 99 km | 66 m | 420 kWh |

## Board 1 — "MANTA MINI 99-66" infographic

| Where on the board | What it says | What is true | Correction for the artist |
|---|---|---|---|
| Title | 99-66 | The spec rail reads 99 km · 33 m · 350 kWh — that is **99-33** | Retitle **MANTA MINI 99-33**, or change the rail to 66 m / 420 kWh and keep 99-66. One or the other. |
| Length | 12.4 m | The Sentinel board's Mini callout says 12.8 m | Pick one length across every board; the handoff carries none. |
| Propulsion | "2× electric pods (rear) · 2× electric (trim)" and "Thrusters 2–4" | Two counts on one board | State one count: 2 propulsion pods + 2 trim thrusters = 4, or delete the "2–4" line. |
| Vehicle bay | 5.6 × 2.6 × 2.0 m | A Model 3-class car is ~4.7 × 1.85 × 1.44 m | Length is generous; drive-in height and ramp angle are the tight ones — draw the ramp angle, not just the door. |
| "Design safety depth 50–60 m" | marketing margin | No class collapse calculation exists | Delete the line until a naval architect writes one. |
| Refuge "12–24 h" | O₂ only in the handoff | CO₂, heat and fire are not modelled | Say "O₂ budget for 12–24 h; CO₂/thermal not yet modelled." |
| Copy | ⟦quoted⟧ "safe submergence", "perfect balance", "peace of mind", "mission-ready", "engineered for real oceans", "auto-stabilization", "stealth" | Language that outruns every Red gate | Strip all seven phrases. |

## Board 2 — "SAIL ARK 22" infographic

| Where | What it says | What is true | Correction |
|---|---|---|---|
| Displacement | ~35–40 t | The Mini it carries is bounded at 45–52 t in the handoff | A 40 t carrier cannot lift a 45 t Mini. Either the Ark grows past Mini + margin, or it is a tow boat, not a carrier — say which. |
| Speed | 35–50 kn sail-assist, 80+ kn foil concept | No seakeeping, slam or latch analysis exists for a 12 m hull on deck | Drop "80+ kn"; keep "concept" on every speed. |
| Solar | 120–180 kW | Needs an array layout against a 21.5 m wing | Draw the array or drop the number. |
| Interface | "carry, protect, charge, support" | The only interface that survives critique is at the surface | Add one line: "Ark ↔ Mini only at the surface; Mini depth = 0 while docked." |
| Copy | ⟦quoted⟧ "Designed for safety, efficiency, and comfort" | Red gates | Strip. |

## Board 3 — "SENTINEL 800 BE" (Grok's review; board not in this repository)

| Where | What it says | What is true | Correction |
|---|---|---|---|
| Dimensions | 10.8 × 7.0 × 3.9 m | Shorter and lower than the Mini it is meant to dock (12.4 × 5.2 × 3.5 m) | This box is a **module**, not the ship. Split the file: the 800 m vessel is a different drawing. |
| Battery "Ark pods" | 1,200–1,800 kWh | Handoff v1.7.1 Sentinel 800 bank: 250–375 MWh | Two orders of magnitude apart — label the pods as swap modules and keep the bank figure. |
| Propulsion | 250–380 kW | Yacht scale for an 800 m vessel | Remove or re-derive. |
| Hot-swap "7–60 min at depth" | contradicts doctrine | Ship must be at Mini-certified depth before any dock | Draw the depth interlock as a rule, not a GIF. |
| Cost | $1.1–2.6 B | Handoff forbids cost as quote | Delete from every public board. |
| Copy | ⟦quoted⟧ "storm-avoidance", "comfort" for 14–21 days | Evacuation and certified shelters remain the only authorized path | Delete "storm-avoidance" on any public or investor board. |

## What survives, in order

```
Sentinel 800   DEFER  — dimensions vs Mini do not close; Ark-pod energy two orders off
  └─ Sail Ark 22   DEFER  — 35–40 t cannot carry a 45 t Mini
       └─ Mini 99-33   ACTIVE GATE — the first pilot, in simulation, once 33 vs 66, 12.4 vs 12.8 and the thruster count are fixed
            └─ Model 3-class box (dimensional only; the car is a 1.8 t sliding weight, not a partner)
```

Interfaces to freeze on paper now: bay opening ≥ Mini beam + fender · sill height · latch grid · comms/power
wet-mate at the surface · the depth interlock rule. Do not freeze 800 m door kinematics.

## What to hand a naval architect (Mini 99-33 only)
The three boards as styling reference stamped CONCEPT · the single name 99-33 · one LOA/beam/height ·
the vehicle as 1.8 t at a stated CG range · the door-open RO/RO case · deliverable: a signed hydrostatic
booklet plus a weighing/inclining plan · banner: not certified, not for storm use, not for build.
See `MINI_99-33_HYDROSTATICS_SCOPING.md`.

*Humanity decides. Technology assists. Wisdom guides. Trust must be proven.*
