# Manta / Mantis Trinity v1.7.1 — Critique
### From the Master of Thought · 2026-09-03 · for conceptual critique, HI feedback and expert pre-review scoping

> **This output is for conceptual critique only.** It is not a design baseline, safety case, certification
> approval, procurement authority, construction authorization, operational doctrine, hurricane-safety advice,
> or human-test plan. All safety-critical domains remain 🔴 Red until validated by qualified human experts.

**What was reviewed.** The v1.7.1 Claude Code handoff (`MANTA_TRINITY_HANDOFF_v1.7.1.md`, sha256
`5b6099ec…2671e8`) and the two attached infographics (transcribed in `INFOGRAPHIC_TRANSCRIPT.md`).
The full v1.7.1 package is not in hand; where the handoff cites it, this critique can only check the
handoff against itself and against the images. Every number below was **recomputed**, not copied —
`node scripts/manta-bounds.mjs --reproduce` is the receipt.

---

## 1 · The handoff is unusually honest, and that is its strength

Before the findings: the package's posture is the right one. Every gate defaults Red; the decision rule
("all eight lanes Green before build, procurement or human testing on any platform") is unambiguous; the
first gate is the smallest, shallowest platform's hydrostatics, which is exactly where a naval architect
would start; the equations are labelled as arithmetic bounds and the list of what they *do not* cover
(collapse, buckling, stiffeners, endcaps, penetrations, welds, fatigue, class rules) is complete and
correct; the "Family Protector" line is quarantined with the reason stated. The critique below is the
kind this posture invites. Nothing in it changes the status of any gate: all remain 🔴.

## 2 · The infographics contradict the handoff — the documents disagree with each other

This is the most consequential finding, because these images are the ones people will share.

| Claim | Handoff v1.7.1 | Infographic | Consequence |
|---|---|---|---|
| **Mini 99-66 depth** | 66 m | **33 m** ("99 KM RANGE \| 33 M DEPTH"; operating depth 33 m) | The image labelled 99-66 depicts the 99-33's envelope. Either the artwork is mislabelled, or the naming scheme (99-33 / 99-66 = range-depth) has already drifted. |
| **Mini 99-66 battery** | 420 kWh LFP | **350 kWh** LFP Marine | Same drift — the 99-66 image carries the 99-33's pack. |
| **Sail Ark 22 displacement** | 220 t target, 180 t dry, ~40 t payload | **~35–40 tonnes (est.)** | A **5–6× disagreement** on the most basic hydrostatic number. A 22 m foiling catamaran at 35–40 t and one at 220 t are different vessels; a 45 t Mini cannot sit in the cradle of a 40 t carrier. |
| **Sail Ark certification target** | ABS / DNV / class pre-consultant (review lane 8) | **RINA (Concept)** | Not wrong — RINA is a class society — but the handoff names a different pathway. Pick one before any pre-consultation. |
| **Mini "design safety depth"** | not stated | **50–60 m** on a 33 m pod | Introduces a second depth number with no definition (collapse depth? test depth? design pressure?). Undefined depth vocabulary is how depth doctrine (§15) gets violated. |

**Action:** decide which document is canonical for each number, correct the other, and put the six
platform specs under `manta-trinity.v1.7.1.json` so an infographic is *rendered from* the data rather
than drawn beside it. Until then `RISK_MATRIX.md` carries this as R11, *Certain*.

## 3 · Two rows of the handoff's own tables do not reproduce from the handoff's own equations

`scripts/manta-bounds.mjs --reproduce` recomputes every table from the stated equations and constants.

1. **Sentinel 1600 hydrostatics do not sum.** 11,500 t dry + 1,200 t payload + 2,000 t ballast =
   **14,700 t**, against a stated displacement of **15,000 t**. 300 t is unaccounted. Every other row closes
   exactly (Mini 33: 33 + 1.8 + 10.2 = 45 ✓; Sentinel 800: 6,200 + 800 + 1,000 = 8,000 ✓).
2. **The 800 m hull thickness is 161 mm, not ~163 mm.** With P = ρ·g·h = 8.04 MPa, R 4 m, SF 2.5,
   σ 500 MPa: t = 160.9 mm. The stated 8.0 MPa gives 160 mm exactly. 163 mm would need 8.15 MPa. The
   other four depths reproduce to within rounding (33 m → 6.6 vs ~6.5; 1,600 m → 321.9 vs ~322).
3. **Sail Ark 22's sum closes to zero ballast.** 220 t displacement − 180 t dry − 40 t payload leaves
   **0 t** for the ballast the table calls "variable". Not a drift the tool flags (the row cannot be
   summed), but a number that cannot be right for a foiling catamaran — and it sits beside the
   infographic's 35–40 t (§2), so this row is wrong in *two* directions at once.

None of this matters to safety — every row is Red anyway — but a package whose thesis is
*trust must be proven* should have its arithmetic close. All are one-line fixes; the `--reproduce` run
is the standing check, and it reports exactly the two drifts above (the Sentinel 1600 life-support row
differs from the computed value by 0.1 % because the handoff rounds litres before multiplying — that is
rounding, and the tool's tolerance now says so).

## 4 · The pressure-hull bound is doing more work than it can bear

`t = P·R·SF/σ` is the thin-walled hoop-stress formula for **internal** pressure. External-pressure
hulls fail by **buckling** at stresses far below yield, so this equation is not merely incomplete — for
the Sentinels it bounds the wrong failure mode. Three consequences the handoff should state outright:

- **322 mm of steel at 1,600 m is not a hull, it is a red flag.** Real deep hulls at that depth use
  high-strength steel, titanium or composites with ring stiffeners, precisely because a monocoque shell
  this thick cannot be rolled, welded, inspected or afforded. The bound is useful only as a proof that
  the simplified approach fails at depth.
- **A 4 m radius is asserted, not derived.** For the Minis (12.4 × 5.2 × 3.5 m) a 4 m radius exceeds
  the hull's own beam. The Mini bound should be re-run at a radius the geometry can actually contain
  (~1.75–2.6 m), which *reduces* the thickness estimate — the number in the table is conservative for
  the Minis and meaningless for the Sentinels.
- **Payload and hull are the same tonnes.** At 45 t displacement, a 33 t dry mass already consumes
  73%; 10.2 t of ballast leaves 1.8 t for a 1.8 t vehicle — **zero margin for a second occupant's bag**.
  This is the number the first gate exists to test.

## 5 · The Mini's life support is bounded by the wrong quantity

The O₂ table reproduces exactly with 16.8 L/person/h and 5.2 kWh/m³ (×2). Those constants are
*inferred*; the handoff does not state them. Two points for the life-support specialist:

- 16.8 L/h is a **resting** figure. A 24-hour refuge with 2–4 frightened people, an EV in the bay, and
  a humid sealed volume of roughly 40 m³ is not resting. **CO₂ is the binding constraint, not O₂** — at
  4 persons in ~40 m³ with no scrubbing, CO₂ passes 1% in under three hours. The handoff lists CO₂
  under "not solved"; it should be moved to "governs endurance".
- The O₂ energy (16.8 kWh) is **4.8% of the 350 kWh pack** — small, which is the right takeaway, but the
  pack is also the propulsion pack, the hotel-load pack, and (per §13) sits next to a second, separate
  hazard: the vehicle's own traction battery. Endurance should be quoted *after* isolation losses.

## 6 · Doctrine consistency — where the package contradicts itself

- **§15 depth doctrine vs §5 platform roles.** The Sentinel 400 pairs with the Mini 99-66 (66 m); the
  doctrine says the Sentinel must ascend to Mini-certified depth for any dock operation. So every deep
  expedition's dock cycle happens at ≤ 66 m — in the wave-affected zone. The dock-transition lane (§14)
  should explicitly model sea-state at 33–66 m, because that is where the doctrine forces the operation.
- **§16 egress hierarchy vs §12 endurance.** Step 2 ("mothership ascends to shallow rescue condition")
  assumes the mothership *can* ascend. The 14- and 30-day refuge durations only make sense if it
  cannot. The rescue lane needs a time-to-rescue budget against endurance for the *stuck-at-depth* case,
  not just the ascend-and-exit case.
- **"Hurricane resilience concept" in the platform names.** §6 correctly quarantines the storm line, but
  §3 still titles two Sentinels "hurricane resilience concept" and one "maximum protection concept".
  The name carries the claim the body retracts. Recommend "expedition concept" until an emergency-
  management authority is in the room (R8).

## 7 · Language that outruns the gates (§20.7)

`node scripts/manta-language-gate.mjs` scans this folder. The handoff itself is clean. The infographics
are not: **"safe"** appears three times on the Mini ("safe submergence to 33 meters", "safe, easy ⟦quoted⟧
vehicle deployment", "SAFE & COMFORTABLE") and once on the Ark ("Designed for safety"); the Mini also ⟦quoted⟧
says **"Engineered for real oceans. Designed for peace of mind."** and offers a **"stealth"** mode. None
of these survive a single Red gate. Recommend the infographics carry the same boundary line the handoff
carries, and that "stealth" be removed — it invites a reading the project does not want.

## 8 · What is genuinely well-bounded

- The nested stack and the depth interlock rule are the best ideas in the package: a hardware interlock
  that makes the dangerous dock operation *physically impossible* is exactly the "unexpressible, not
  merely forbidden" pattern that Cube 23's de-risk gate uses.
- The EV-battery-as-separate-hazard handling list (§13) is complete and correctly ordered.
- The first-gate choice (Mini 99-33 hydrostatics) is right, and `MINI_99-33_HYDROSTATICS_SCOPING.md`
  is the checklist to hand a naval architect tomorrow.

## 9 · Recommended next moves (critique-side only — nothing physical)

1. Reconcile the images with the handoff (§2); make the JSON the single source and render from it.
2. Fix the two arithmetic rows (§3); keep `--reproduce` in the pre-commit chain for this folder.
3. Re-run the Mini hull bound at a radius the geometry can contain; state that the formula is internal-
   pressure hoop stress and does not bound buckling.
4. Move CO₂ from "not solved" to "governs endurance" and bound it.
5. Rename the Sentinels' "hurricane resilience" roles until an emergency-management authority signs.
6. Put the boundary line on the infographics; remove "safe" ×4 and "stealth". ⟦quoted⟧
7. Open the eXeL poll on exactly the questions above so the public critique lands on the real gaps.

*Humanity decides. Technology assists. Wisdom guides. Trust must be proven.*
