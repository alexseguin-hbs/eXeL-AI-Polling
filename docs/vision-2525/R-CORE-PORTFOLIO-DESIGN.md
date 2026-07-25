# R-Core portfolio — G1–G9, risk markets, and time as the master variable

I read the AMTS template and the FLIR artifacts directly — the PDF text extracted
cleanly and the slides were legible, so no OCR was needed. The template is the
right gift. It closes questions I'd otherwise have had to guess at, and it
corrects one thing I proposed earlier.

---

## 1. What the AMTS template settles

**The requirement ID grammar already exists.** The Design Traceability Matrix
uses `CRS-01.IN.SRS.001 → CRS-01.OUT.SRS.001`, then `DR-YYYY.MM.DD-DR.###`,
`TR-YYYY.MM.DD-TR.###`, `TR.###_YYYY.MM.DD_IS.###`, `DT.###_YYYY.MM.DD_PRS.###`,
`DC.###_YYYY.MM.DD_PRS.###`.

That's a complete traceability chain: customer requirement → design input →
design output → design review → test run → test issue → design transfer →
design change. **Use this, not the `CRS-##.##` scheme I sketched earlier.**
Mine was a reasonable invention; yours is already in use, already carries
input/output polarity, and already threads verification. I've corrected the
governance plan.

**The tolerance ladder already exists.** The BC Development slide sets estimate
confidence by stage: ±60% at Concept, ±40% at Architecture, ±20% at
Development, ±10% at ATS, ±5% at Market Monitoring. That is exactly the
"accuracy improves as we approach launch" behavior you described — it doesn't
need designing, it needs enforcing. A financial figure entered at S1 should
render with its band, and a figure that never tightens as its project advances
is a flag.

**The DACI table already assigns gate authority.** D/A/C/I per function per
gate, plus Approver vs Reviewer. That is the permission model for gate
transitions, ready to encode as-is.

---

## 2. G1–G7 on the cube

Seven gates, 27 cells. `partition(7)` splits them **4, 4, 4, 4, 4, 4, 3** —
six gates of four deliverables and one of three, every piece connected, the
whole tiling the cube exactly. No hand-authoring; it falls out of the
partitioner already built.

A project at G5 has five gate-groups lit and two dark. Launch is a solid cube.

The geometry makes one demand: **27 deliverable slots across the seven gates.**
You have 18 (S1–S18), unevenly spread — Concept carries five, Develop carries
two. The remaining nine come from material the template already contains:

- The **Recommended** items currently sitting outside the numbered slides —
  Manufacturing Strategy, Supply Chain Risk Assessment, Performance Tracking
  with Finance/BD and with Mfg/Ops.
- The **traceability artifacts** from the Design Matrix — Design Review, Test
  Run, Design Transfer, Design Change — which are real gate deliverables that
  never got slide numbers.

That's the rebalance: promote what's already required into the numbered set,
and the thin stages fill themselves. Nothing new to invent.

---

## 3. The risk market — the actually novel part

Everything above is reorganization. This is the piece that doesn't exist
elsewhere, and it's what makes polling load-bearing rather than decorative.

**Mechanic:** anyone — not just the assigned reviewer — can submit a risk
prediction against any project, gate, or item. AI theming clusters the
submissions. The cluster becomes a visible risk on the project. Rewards go to
predictions that proved correct *and* were actioned to de-risk.

### The prevention paradox

This design has a trap in it that will break the incentive if left alone.

If a prediction is correct and the team acts on it, the bad outcome **doesn't
happen**. Scored naively against outcomes, the best predictions look wrong.
The people who saved the project score zero; the people who predicted doom on
projects nobody bothered to fix score highest. Within two cycles you've trained
the population to predict failures on projects they know will be ignored.

**Resolution:** score against *validation*, not *occurrence*.

A prediction resolves when a designated resolver (not the predictor, not the
person who actioned it) records one of:

| Resolution | Meaning | Payout |
|---|---|---|
| `materialized` | Risk occurred as described | Full |
| `mitigated` | Risk was real, countermeasure prevented it | **Full — same as materialized** |
| `superseded` | Real but overtaken by a larger change | Partial |
| `not-borne-out` | Evidence showed the risk wasn't real | Zero, no penalty |
| `unresolvable` | Project cancelled or gate skipped | Void, stake returned |

`mitigated` paying the same as `materialized` is the load-bearing choice. It is
what makes prediction and action allies instead of competitors.

### Scoring dimensions

- **Lead time.** A risk called at G2 that resolves at G6 is worth far more than
  the same call made at G5. Weight by gates of advance notice, not days.
- **Specificity.** "Schedule risk" is unfalsifiable. A prediction must name the
  item, the mechanism, and the observable that would confirm it — otherwise it
  can't be resolved and doesn't score.
- **Actionability.** A prediction linked to a countermeasure that was adopted
  earns a multiplier. This is your "actioned to de-risk."
- **Independence.** Weight down predictions that duplicate an existing cluster;
  the value is in the first sighting, not the pile-on.

### Gaming to close before launch

- **Self-fulfilment.** Anyone with authority to cause a slip must not be able to
  score on predicting it. Predictor, actioner, and resolver are three distinct
  roles, enforced.
- **Shotgunning.** Unlimited free predictions means someone submits everything
  and harvests the hits. Either stake tokens per prediction (lost on
  `not-borne-out`) or cap open predictions per person per gate. Staking is
  better — it prices confidence.
- **Resolver capture.** Whoever resolves controls all payouts. Resolution should
  require the gate's DACI Approver, and every resolution is logged and
  contestable.

---

## 4. MoT — time as the master variable

The principle you're describing is that **time is the only truly independent
variable in the model.** Everything else is a function of it.

### The cascade rule

When a date moves right, everything downstream moves right. Not "should" —
mechanically does, without anyone re-keying a spreadsheet. This is the single
most valuable behavior in the whole platform, because it's the thing every
portfolio spreadsheet in existence fails to do.

Concretely: date of first revenue is not an input field. It is derived from the
launch item's `t_stop`. Move the launch, and the revenue curve, the R&D burn
schedule, the FTE ramp, the NPV, the IRR, and the budget calendar all shift with
it. Your Growth Model simulator already knows the revenue-to-date relationship;
this makes the relationship live rather than re-entered.

### Cost of a slip, to the minute

Two components, and the second is usually an order of magnitude larger:

1. **Burn** — loaded FTE cost per minute × slip duration. Straightforward from
   the Functional Resource Alignment table.
2. **Displacement** — the revenue curve shifts right, so you lose the tail. On a
   product with a defined life, a month of slip doesn't cost a month of burn; it
   costs a month of peak-year revenue that never gets recovered.

Reporting both is what makes `$/min` meaningful rather than a slogan. A team
looking at "this decision has been open 11 days = $47k" behaves differently
from a team looking at a Gantt bar.

### The 9-to-7 case, in numbers

Nine projects, $9M, nine months each. Portfolio burn is **$1M/month**. On 21
working days at 8 hours:

| Unit | Rate |
|---|---|
| Portfolio | ~$47.6k/day · **~$99/min** |
| Per project | ~$5.3k/day · **~$11/min** |

Compressing all nine from nine months to seven avoids two months of portfolio
burn: **$2M**. And that's only the smaller half — two months of revenue pulled
forward is typically the larger number, because it's two months added at the
front of the curve and never given back at the end.

**But the $2M is only real if you compress wait, not work.**

This is the distinction the whole framework lives or dies on. Compressing by
adding people raises cost and, past a point, raises duration too. Compressing
by removing queue time is close to free. So the honest question for the demo
isn't "can we go faster" — it's **how much of the nine months is not work?**

Decompose it before claiming the number:

- **Gate review latency.** Seven gates. If each waits an average of two weeks
  for a review meeting and a quorum of approvers, that's ~3.5 months of the
  nine spent waiting to be looked at. This is the single largest recoverable
  block, and it's exactly what "official source of record" removes — a gate
  resolves when its approvers approve in the tool, not when the calendar
  permits a meeting.
- **Dependency wait.** Time blocked on another project's deliverable. Visible
  in the constellation (§5), and often the wait is on the wrong thing — a
  dependency assumed hard that was soft.
- **Rework from late risk discovery.** What the risk market (§3) is for. A risk
  caught at G2 costs a revision; the same risk caught at G5 costs a stage.

Recovering the review latency alone gets most of the two months without adding
a single dollar of resource. That's the SoI argument in its concrete form:
**the contradiction is "faster costs more," and the resolution is that most of
the elapsed time was never purchased in the first place.** The platform's job
is to make that decomposition visible per project, so acceleration is a
scheduling decision with a price tag rather than a demand.

For the demo, the compelling screen is: pick a project, drag its gate-review
latency down, and watch $2M and two months move across all nine — with the
constellation showing which dependencies actually permitted it.

### Tolerance carried through

Every duration and cost carries its stage band (§1). A projection at G2 renders
as a range, not a number. Two consequences worth accepting deliberately:

- Portfolio roll-ups must sum distributions, not point estimates. Summing
  midpoints across 400 projects produces a total with false precision — the
  classic portfolio lie.
- A project whose band doesn't tighten on schedule is itself a risk signal, and
  should be automatically surfaced to the risk market.

---

## 5. Dependency constellation with propagation

Your existing constellation is a picture. This version is the propagation
graph, and the picture is a rendering of it.

- **Node:** project (portfolio view) or deliverable (project view).
- **Edge:** directed dependency, pointing down toward the primary dependency at
  the bottom — your existing convention, kept.
- **Size:** NPV or 3-year revenue, as today.
- **Border:** above/below the line, as today.
- **New — edges carry slip.** When a node's `t_stop` moves, every downstream
  node moves. The constellation shows the blast radius before the decision is
  made, not after.

For nine projects sharing $9M this matters more than it would at nine
independent projects: a slip on a shared dependency doesn't just move one
schedule, it re-prices the whole envelope. The constellation is where you see
that a $200k decision on project 3 has a $1.4M downstream consequence.

**Critical path across projects** falls out of the same graph, and is worth
surfacing as its own view. It's the answer to "of 400 projects, which twenty
actually determine the portfolio date."

---

## 6. Scaling 9 → 400

The nine-project case is the demo. The 400-project case is the claim, and three
things break between them:

1. **You can't render 400 cubes.** Portfolio view is the constellation;
   cubes are a drill-down. A 400-node constellation needs clustering by
   division/BU with expand-on-demand.
2. **Roll-up arithmetic** — see the distribution point in §4. This is where a
   demo quietly becomes wrong.
3. **The polling target finally has a reason.** 400 projects × stakeholders
   each submitting risk predictions is where the million-responses-in-60-seconds
   requirement stops being aspirational and becomes the actual load. Cube 6 is
   the thing standing between this design and the demo.

---

## 7. Two things I need from you

1. **What is R-Core?** I've treated it as a project class the tool filters on.
   If it's a product line, a funding category, or something else, it changes
   whether it's a tag, a portfolio, or a separate cube type.

2. **What does the eXeL SoI Framework already specify?** I've reconstructed the
   acceleration logic in §4 from first principles — contradiction between speed
   and cost, resolved by separating wait from work. If SoI already defines the
   moves, I should be building to those rather than deriving my own.

3. **What's your real gate-review latency?** The $2M in §4 rests on it. If
   reviews already turn around in days, the two months has to come from
   dependency wait and rework instead, and the demo argument changes shape.

---

## 8. Corrections applied

- CRS ID scheme replaced with the AMTS grammar (`CRS-##.IN.SRS.###`).
  `CRS-GOVERNANCE-PLAN.md` §1.2 updated.
- Gate count in `PROJECT-UNLOCK-DESIGN.md` reads G1–G7; the nine-gate column
  mapping in §2 above supersedes it.
- The open decision from that doc — one cube per project, or ten — is now
  answered by the portfolio framing: **one cube per project.** The ten-cube
  architecture view stays a separate internal diagram, not the user-facing
  object.
