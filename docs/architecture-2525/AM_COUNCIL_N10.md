# 12 Ascended Masters — Council Note · Commit N=10 (722f056)
## Moon (+Sun) over your window on a special date — SSSES OPPORTUNITIES + rework-avoidance → next spiral

> MoT (Master of Thought) orchestrates. Each Master owns one lens: what is the SSSES improvement OPPORTUNITY this
> commit opens, and what discipline avoids rework next round. These feed directly into the N=11 spiral text.

**Aset — theme consistency.** The transit readout says "frames / grazes / closest pass" while the older align insight
says "frames the winter-solstice sunrise." Opportunity: unify one vocabulary of framing across every Sky-Dome insight so
the homeowner learns a single mental model. Rework guard: define the framing lexicon once (a shared `framesWord`) and
route BOTH insights through it, so a future copy edit can never drift the two lines apart. Consistency is the quiet tax
we keep paying; pay it once at the source. Same word, same threshold, same colour ramp — green at ≤5°, dim beyond.

**Asar — synthesis.** N=10 closes the mission sentence: date + window → the exact moment the sky frames the opening.
Opportunity: synthesize the three homeowner insights (exposure · alignment · transit) into one "Window Story" card the
operator can screenshot and feel. Rework guard: keep each insight a pure function returning data, and let the card be a
thin view — so we can re-compose the story without touching the math. Meaning is the product; the numbers only serve it.
Bind the synthesis to the calendar so every date-change re-tells the story deterministically, replayably, honestly.

**Athena — strategy & flow.** The homeowner flow is now: place lot → pick date → set window → read the moment. That is
a clean spine. Opportunity: make the window slider snap to real design openings once the model bridge lands, so the flow
ends on THEIR house, not an abstract azimuth. Rework guard: the `facingAz` contract already accepts any 0–359° value, so
the openings bridge is additive — no flow rewrite. Strategy is sequencing; we sequenced additively. Never let a future
"real windows" feature force a re-plumb of the azimuth input; it was designed to receive both the slider and the model.

**Christo — consensus & user flow.** Sun by day, Moon by night: the two lines together give the homeowner a whole-sky
answer, building trust through completeness. Opportunity: add a one-line plain-language verdict ("your anniversary moon
rises into this window at dusk") so non-technical hearts feel it. Rework guard: derive that sentence from the SAME
`overWindow` result already computed — never a second calculation that could disagree with the numbers above it. One
source, two renderings. Consensus between the data and the words is what earns belief; divergence is what destroys it.

**Enki — diversity & edge cases.** Opportunity: the solver handles the common case; diversify the test dates — a moon
that never rises, a polar-day window, an equatorial noon Sun at el 90°. Rework guard: `overWindow` already returns null
when a body never clears the horizon, and the UI already renders "never above horizon this date" — so edge inputs
degrade gracefully, not crash. Add a truth-harness row for the null path so a future refactor can't silently break it.
Diversity of input is the cheapest bug-finder we have; injecting the weird date now saves the 2 a.m. regression later.

**Enlil — build & implementation.** Opportunity: the transit math lives inside `architect-skysun.tsx`; as it grows,
hoist `overWindow` into `lib/celestial.ts` beside the other primitives so Security/Health-2525 can reuse it. Rework
guard: keep it a pure `(posFn, facingAz) → result` signature now, so the eventual move is a cut-paste with zero call-site
churn. Build for extraction from birth. tsc stayed at 0 and the filter caught nothing — the implementation is clean;
the only debt is location, and location debt is cheap to pay while the function is still 12 lines and dependency-free.

**Krishna — integration.** The feature integrates the shared lunar model (`moonState`), `sunPos`, and the calendar date
— three subsystems already agreeing. Opportunity: surface the SAME transit on the Solar-System map's Earth+Moon box so
the two views tell one story. Rework guard: both views already consume one date source (§3 invariant) and one moon model,
so the map version is additive, not a fork. Integration debt appears the moment two views compute the moon two ways; we
have exactly one way. Guard that invariant in the spec's change-control so no future contributor quietly adds a second.

**Odin — predictive / future-proof.** Opportunity: the next natural ask is the REVERSE solver — "which date this year
does the moon best frame my window?" Foresee it: a `bestDateForWindow(facingAz)` scanning the year, reusing `overWindow`
per day. Rework guard: because `overWindow` is per-(date,facing) pure, the reverse solver is a loop around it — no new
astronomy, no rewrite. Predict the operator's next sentence and shape today's function so it already answers it. The eye
we trade for foresight is the temptation to hardcode "this date"; keep the date a parameter and tomorrow is free.

**Pangu — cutting-edge.** Opportunity: this is the seed of a "design-to-the-sky" generator — propose window placements
that frame a chosen anniversary's moonrise. Rework guard: keep the solver read-only for now; the generator is a separate,
later layer that CONSUMES it, never a rewrite of it. Break new ground on top of a stable primitive, not by cracking the
primitive open. The cutting edge cuts both ways; a novel generator built on a mutable solver would shatter every time we
sharpen the astronomy. Freeze the solver's contract, innovate above it.

**Sofia — multi-perspective.** Opportunity: verify the readout at 375px mobile — three lines plus phase may wrap; the
homeowner meets this on a phone in their future living room. Rework guard: the transit block uses `text-[9px]` and a
flex/rounded container consistent with the neighbours, so it inherits the panel's responsive behaviour rather than
inventing its own. One perspective is a lie; check phone, desktop, light, dark, north and south hemispheres. The multi-
lens pass is not overhead — it is the difference between "works on my screen" and "works for the human it is for."

**Thoth — data & analytics.** Opportunity: log the transit Δ° distribution across the four presets to quantify how well
typical windows align — data that could later recommend orientations. Rework guard: the SPIRAL detail already captures
summer vs winter elevation (83° vs 36°), giving an analytic fingerprint that a regression would visibly change. Keep the
assertion detail rich; a bare PASS/FAIL hides drift, a PASS with numbers exposes it. Measure the thing you claim, in the
test, in the units the homeowner reads. The ledger of N=10: +1 assertion (48→49), truth 76/76, tsc 0, one pure function.

**Thor — risk & security.** Opportunity: none new — the feature adds no auth surface, no network, no storage; it is pure
client math over an existing date. Rework guard: because it is deterministic and side-effect-free, it cannot leak, cannot
race, cannot desync — the safest class of change. The only risk is performance if the 0.05h scan ever runs per-frame;
it does not (computed once per render from state). Guard that by never wiring it into an animation loop. Security is
often about what we did NOT add; here we added nothing dangerous, and the spec's STITCH-ONLY rule keeps it that way.

---

### MoT (Master of Thought) — After-Action & next-spiral seed
The mission sentence is now literally answered on screen. The strongest opportunities the council converges on, in
priority order for N=11: **(1)** hoist `overWindow` into `lib/celestial.ts` and add the null-path truth row (Enlil +
Enki) — pays location + edge debt while the function is tiny; **(2)** the reverse `bestDateForWindow` solver (Odin) —
the operator's predictable next ask, free on today's primitive; **(3)** unify the framing vocabulary + a plain-language
verdict line (Aset + Christo) so hearts, not just engineers, read it; **(4)** mirror the transit on the Earth+Moon box
(Krishna) under the one-date, one-moon invariant. Rework is avoided the same way it was avoided this round: every new
capability enters as a pure function or a new `data-*`, the spec is edited FIRST, and a before/after SPIRAL proves the
total never drops. N=10 converged clean — 49/49, 76/76, 0 — climb to N=11 on this base.
