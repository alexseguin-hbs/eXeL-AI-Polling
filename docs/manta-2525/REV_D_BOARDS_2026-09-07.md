# Manta-2525 — the Rev D boards (received 2026-09-07), transcribed and reconciled

> **This output is for conceptual critique only.** It is not a design baseline, safety case, certification
> approval, procurement authority, construction authorization, operational doctrine, hurricane-safety advice,
> or human-test plan. All safety-critical domains remain 🔴 Red until validated by qualified human experts.

Five boards, persisted verbatim in `images/` (commit 924d5e4): `manta-99-66-rev-d-board.png`,
`manta-99-66-rev-d-exploded.png`, `manta-mini-66-33-board.png`, `manta-mini-66-33-exploded.png`,
`ark-sail-33-board.png`. Every number below is as printed; marketing lines are ⟦quoted⟧.

## 1 · What Rev D fixes — the naming rule now holds
Ruling R-B: **NN-DD = NN km range, DD m depth.** Every Rev D board obeys it.

| Board | Name | Range | Depth | People | Endurance | Cabin |
|---|---|---|---|---|---|---|
| Manta 99-66 Rev D | 99-66 | 99 km | 66 m | 5 occupants | seven-day life-support **target** | surface-pressure, ≈1 atm |
| Manta Mini 66-33 | 66-33 | 66 km | 33 m | 5 people total | 72 h maximum incl. reserve | surface-pressure |
| Ark Sail 33 | — | 999+ km battery-only **target** | 0 (surface carrier) | — | — | carries one Mini 66-33 |

The v1.7.1 "Mini 99-33" (33 m / 350 kWh) is superseded by **Mini 66-33** — same depth class, range now
66 km. The earlier "99-66" board whose rail read 33 m is superseded by the Rev D 99-66 whose rail reads
66 m. The identity collision Grok flagged is closed on paper.

## 2 · Transcript — as printed

**Manta 99-66 Rev D** — ⟦quoted⟧ "BRING YOUR CAR. EXPLORE BEYOND THE SHORE." Rear loading (stationary at
dock). Design targets: 99 km range · 66 m depth · 5 occupants. Footer: "BOM Rev D concept. Surface-pressure
cabin. Seven-day life-support target unvalidated."

**99-66 exploded assembly** — A02 upper outer fairing (with fin, lifted) · B03 upward-opening stern visor,
surface loading only · D03 bow viewport, retained (one installed) · port propulsion unit (low, below deck) ·
rear ramp (open) · B vehicle bay (car deck with tie-downs) · closable bulkhead · C sleeping + living quarters
(two berths, lounge, storage) · D front cabin (captain seat, 3-screen console, clear forward view) · A03 lower
equipment assembly · F01 batteries (lithium, with BMS) · F05 purified-water electrolyzer · **F03 — 50 kg
usable stored O₂ target: 35 kg mission allowance + 15 kg reserve; 5 adults × 7 days × 1 kg/day; cylinder
capacity and full life support unvalidated** · E07/E08 drive controllers + cooling · F07/F08 atmosphere
system, CO₂ removal + ventilation (sizing pending). Footer: "Sealed cabin approximately 1 atm absolute.
Outside at 66 m approximately 7.65 bar absolute. Life support unvalidated near normal air levels." "Illustrative
concept, not fabrication CAD. Sanitation, extra berths and emergency systems unresolved."

**Manta Mini 66-33** — ⟦quoted⟧ "YOUR CAR. YOUR CABIN." "EXPLORE FURTHER BELOW A BRIGHTER WORLD." Rear loading ·
glazed cabin separation · clear forward view. Rear loading: upward-opening stern visor with separate ramp;
two low electric propulsion units. Driver's view: from car, through first airlock door, second glazed door,
to the open ocean. Design targets: 66 km range · 33 m depth · 5 people total · 72 hours maximum including
reserve. Footer: "Surface-pressure cabin concept. Fit, glazing, pressure integrity and life-support endurance
unvalidated."

**Mini 66-33 exploded** — A01 upper outer fairing · B01 upward-opening stern visor, surface loading only · D01
bow viewport (one installed) · port + starboard propulsion units (low, below deck) · rear ramp (down) · B rear
car bay (full-size Model 3 shown) · C glazed airlock (two-door vestibule) · D forward helm · A02 lower
equipment assembly · E01 batteries (lithium, BMS) · E02 stored O₂ and full 72-hour life support: sizing
pending · E03 purified-water electrolyzer (backup) · E04 drive controllers + cooling · E05 atmosphere system
(sizing pending). "Car-based passenger seating; captain chair is an alternate station, not a sixth occupant."

**Ark Sail 33** — ⟦quoted⟧ "SAIL FURTHER. EXPLORE BEYOND THE SHORE." "Bring your Mini. Discover your next
horizon." "RETURN TO YOUR ARK" · "THE HORIZON IS YOURS". Design targets: 33 m length · 13 m beam · one Manta
Mini 66-33 · 999+ km battery-only range target. "Concept visualization. Dimensions and range are targets;
engineering validation pending."

## 3 · Reconciliation — what holds, what moved, what is still open

| Item | Rev D says | Check | State |
|---|---|---|---|
| Naming | 99-66 · 66-33 | matches R-B | ✅ closed |
| Outside pressure at 66 m | ≈7.65 bar absolute | 1.013 + 66 × 0.1006 = 7.65 | ✅ arithmetic holds |
| O₂ for 7 days, 5 adults | 35 kg + 15 kg reserve = 50 kg | 5 × 7 × 1.0 = 35; 1 kg/day/adult is a resting-plus allowance (≈0.84 kg/day at rest) | ✅ arithmetic holds; **cylinder mass/volume, CO₂ scrubbing and thermal still unsized** — the board says so |
| Occupants | 5 (Mini: car seats; captain chair not a sixth) | v1.7.1 crew 2–4 | ⚠ moved up; refuge 12–24 h (v1.7.1) → 72 h (Mini) / 7 days (99-66) |
| Mini range | 66 km (was 99) | consistent with the smaller pack implied | ⚠ battery kWh no longer printed on either Mini board |
| Length / beam / height | not printed on any Rev D board | v1.7.1 and the earlier board disagreed (12.4 vs 12.8 m) | ⚠ **still open** — the first thing a naval architect needs |
| Displacement | not printed | earlier Sail Ark 22 (35–40 t) could not carry a 45–52 t Mini | ⚠ **still open**; Ark Sail 33 states length and beam only |
| Ark Sail 33 range | 999+ km battery-only | no pack size printed | ⚠ energy model absent |
| Propulsion | 2 units below deck (both Minis) | the earlier "2–4 thrusters" conflict | ✅ resolved to two |
| Bow viewport | one installed (both) | a pressure-hull penetration | ⚠ penetration register still to write |
| Stern visor | surface loading only (both) | matches the door-open RO/RO condition | ✅ stated |
| Disclaimers | every board carries "unvalidated / targets / pending" | language gate | ✅ Rev D copy passes the gate on its own |

## 4 · Inputs for the ◬ ♡ 웃 session (Manta-2525 Domain Play)
Three pod tasks, each with a measurable outcome, now seeded in `frontend/lib/pod-projects.ts`:
1. **Reconcile Rev D into one number register** (S.I.) — every printed number on the five boards in one
   table with its source; conflicts listed; the two Minis and the Ark on one sheet.
2. **Bound the life-support budget** (A.I. estimate, H.I. review) — 5 people × 72 h (Mini) and 5 × 7 d
   (99-66): O₂ mass, CO₂ scrubbing, thermal, hotel load, in kg and kWh, using `scripts/manta-bounds.mjs`.
3. **Can Ark Sail 33 carry a Mini 66-33?** (H.I. decision) — bound the Mini's mass from its stated volume
   envelope and compare with a 33 × 13 m catamaran's plausible displacement; write the answer as a gate.

*Humanity decides. Technology assists. Wisdom guides. Trust must be proven.*
