# Mini 99-33 — Hydrostatics Scoping Checklist for a Licensed Naval Architect
### The first gate. Nothing else proceeds until this is signed.

> **This output is for conceptual critique only.** It is not a design baseline, safety case, certification
> approval, procurement authority, construction authorization, operational doctrine, hurricane-safety advice,
> or human-test plan. All safety-critical domains remain 🔴 Red until validated by qualified human experts.
>
> This is a *scoping* checklist — what to hand a naval architect so the engagement is well-defined. It is
> not the hydrostatic model. The required output of the gate is a **signed** mass, displacement, trim,
> reserve-buoyancy and stability model, by a licensed naval architect.

## A · What the architect receives (the inputs, all 🔴 placeholders)

| Input | Value in v1.7.1 | Source | Confidence |
|---|---|---|---|
| Principal dimensions | L 12.4 m · B 5.2 m · H 3.5 m | infographic | placeholder |
| Target displacement | 45 t | handoff §10 | placeholder |
| Dry mass estimate | 33 t | handoff §10 | placeholder — **no weight breakdown exists** |
| Payload | 1.8 t (one Tesla Model 3-class vehicle, dimensional reference only) | handoff §10 | vehicle mass is public; occupants + stores not included |
| Ballast estimate | 10.2 t | handoff §10 | derived (45 − 33 − 1.8) |
| Operating depth target | 33 m | handoff §3 | placeholder |
| Vehicle bay | 5.6 × 2.6 × 2.0 m, rear roll-on/roll-off ramp | infographic | placeholder |
| Propulsion / trim | 2× rear electric pods, 2× trim thrusters | infographic | placeholder |
| Battery | 350 kWh LFP marine (mass **not stated**) | handoff §3 | placeholder |
| Crew / passengers | 2–4 | handoff §12 | placeholder |
| Seawater density | 1,025 kg/m³ | JSON | standard |

**Known holes to declare on day one:** no weight breakdown; battery mass unknown (350 kWh LFP is
roughly 2.5–3.5 t by itself); hull material and scantlings unknown; ballast type (solid/water/trim
tanks) unknown; vehicle bay floodable or dry unknown; buoyancy-foam volume unknown.

## B · Deliverables that close the gate (Green requires all)

1. **Weight estimate** — itemised lightship by system (hull, structure, battery, propulsion, life
   support, ballast, outfit), with margins stated, and **VCG / LCG for every item**.
2. **Hydrostatic curves** — displacement, KB, BM, KM, LCB, LCF, TPC, MTC over the draft range, surfaced
   and submerged.
3. **Loading conditions** — at minimum: lightship; lightship + battery; + vehicle (in bay, doors shut);
   + vehicle + 2 pax; + vehicle + 4 pax + stores; each surfaced and submerged.
4. **Trim** — for every condition; the vehicle is ~1.8 t on a 12.4 m hull with a *rear* ramp, so
   longitudinal trim with the vehicle aft-of-centre is the first thing to check.
5. **Intact stability, surfaced** — GM, GZ curve, range of stability, against a stated criterion
   (state which: IMO IS Code, or class small-craft rules — the architect chooses and records why).
6. **Submerged stability** — BG (metacentric height submerged: B above G, and by how much); the
   vehicle bay's free surface if it is floodable.
7. **Reserve buoyancy** — surfaced freeboard and reserve-buoyancy volume; **ballast-blow ascent**
   margin (what is the positive buoyancy after emergency ballast release, and does it lift the pod with
   a flooded bay?).
8. **Free-surface effects** — trim tanks and any floodable bay, quantified as GM loss.
9. **Depth-envelope statement** — the architect's view of what 33 m operating depth implies for the
   hull the *next* gate (Mini Submersion) will assess; hydrostatics do not certify the hull, but they
   fix the geometry it must have.
10. **Signed statement** of assumptions, methods, software and criteria used, with the architect's
    licence/registration number.

## C · Questions the architect will ask that the package cannot yet answer

- Is the vehicle bay **dry** (sealed, part of the pressure volume) or **floodable** (vehicle sits in a
  wet dock)? The two designs have different displacement, different stability, and different depth
  ratings. The infographic's "secure & seal" implies dry; the drive-in ramp at the waterline implies a
  door in the pressure boundary — which is the single hardest thing in the hull.
- Where is the **battery**? ~3 t low in the hull is ballast that also moves the CG; 3 t high is a
  stability problem. Its position drives every stability number.
- What holds the **vehicle** in a seaway? A 1.8 t mass free to shift 0.5 m changes trim by a measurable
  amount on a 12.4 m hull; the tie-down scheme is a hydrostatics input, not a detail.
- What is the **emergency-ascent** doctrine's buoyancy budget? §16 step 1 ("vehicle ascends to surface")
  assumes positive buoyancy on demand — that is a hydrostatics deliverable (B.7), not a doctrine.

## D · What this gate does NOT decide (so nobody reads a Green here as more than it is)

Pressure-hull adequacy (lane 4) · battery safety (lane 6) · dock transition with a carrier (lane 2) ·
rescue (lane 7) · certification (lane 8). A Green hydrostatics gate means: **it floats, trims, and is
stable on paper, signed.** It does not mean it can dive, carry a live EV, or be rescued.

## E · Engagement scope (for the ask to the architect)

- **Ask:** "A preliminary hydrostatics and intact-stability assessment of a 12.4 m coastal pod concept
  carrying one ~1.8 t road vehicle, surfaced and submerged to 33 m, from the inputs in section A, with the
  deliverables in section B, signed."
- **Not asked:** structural design, hull scantlings, class submission, cost.
- **Expected outcome:** a signed model *or* a signed statement that the inputs are insufficient and what
  is needed — either closes this scoping step honestly.

*Humanity decides. Technology assists. Wisdom guides. Trust must be proven.*
