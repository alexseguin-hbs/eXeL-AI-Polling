# De-Risking Strategies — Crisis + Resilience
# S1–S19 SLIDE MANUSCRIPT (text-only, slide density)
# v0.5 · 23 Sep 2026 · FREEZE for visual build
# Canonical parent: v0.4 writeup + eXeL freeze memo

Provenance footer (every slide):
Human-authored strategy · AI-assisted synthesis by eXeL AI · cross-review informed by Grok · final authority: De-Risking Strategies · v0.5 · IA for feedback

Deck rule:
- INTERNAL gate deck: show modeled-value vs price tension and CTS contribution.
- EXTERNAL / partner deck: omit internal price-tension table. Say “pricing under design-partner validation.” Show operational equation only.
This file is the INTERNAL gate manuscript. Bracketed [EXT: …] is the substitute line for the external variant.

G2 master question (repeat on S1 and S19):
Can DRS prove that verified authority + resource fulfillment + provenance + replay creates enough incremental value beside the customer’s existing NBA to support a paid attach product?

---

# S1 — Executive summary

**Title:** De-Risking Strategies — Crisis + Resilience

**One sentence**
The coordination layer beside CrisisCommand and specialist ops systems: verify command, see real needs, allocate scarce resources, publish the current plan, replay what happened.

**Thesis**
Do not replace GridOS, Veoci, Sentinel, or CrisisCommand. Coordinate across them.

**CrisisCommand status**
Proposed complementary integration. Not a signed partnership. Not an assumed API.

**Segments**
1. Utility + industrial (one need, two economic subcases)
2. Healthcare / regional
3. Campus / fixed site

**Pipeline IA**
| DP | NBA | Y1 cash hypothesis |
|---|---|---|
| Campus 8–20k pop | Sentinel | $42k |
| Health 3–8 hospitals | Veoci Vitals EM | $84k |
| Utility / plant | GridOS | $129k |
| Book if all three | | $255k cash / $160k ARR |

**Defend only these**
1. Verified authority roster + rank
2. Needs/resources as objects + recipient trace
3. Plan vN provenance
4. eXeL advisory intake (not a vote)
5. Conservative / Baseline / Aggressive plans
6. Replay + Readiness — powered by R-CORE

**Do not claim**
Alerts · dashboards · logs · generic messaging · generic AAR · UI · crew logistics · HICS · mass notify · offline docs

**Ask**
Approve G2. Release $280k of $620k MVP 1. First paid DP 2027-Q3. Not G6. Not 2026-Q2 revenue.

**Master question**
Can DRS prove that verified authority + resource fulfillment + provenance + replay creates enough incremental value beside the customer’s existing NBA to support a paid attach product?

---

# S2 — Overview

**Missing layer**
Who is accountable · who is qualified · what is needed · what exists · where it went · who may receive it · whether it was fulfilled · what changed · who authorized · what people should do now · what to learn

**Thesis (verbatim)**
Do not replace grid, hospital, notify, or CrisisCommand systems. Coordinate across them.

**Chips IA**
Stage G2 Plan  
MVP 1 envelope $620k · release now $280k  
NRE through MVP 3 $1.46M  
NPV $0.16M at 12% (2026=t0)  
IRR ~20%  
Payback ~36 months from G2  
Y3 GM 80–82%

Cash series: FY26 −260 · FY27 −765 · FY28 +120 · FY29 +1,410 ($k)

**Top risks**
Storm Manager collision · Veoci collision · DP price > modeled capture · degraded comms · integration burden

---

# S3 — Needs-based segmentation

**Axes**
X Operational impact · Y Human coordination · Z Replay / readiness  
WTP and CTS decide whether we want the job.

**Table IA**

| Segment | X | Y | Z | WTP | CTS | DP WTP hyp. | Future list | Annual CTS $ | Contrib. at DP $ |
|---|---|---|---|---|---|---|---|---|---|
| Utility community | 10 | 6 | 4 | High | High | $84k | $140k | $53k | +$31k |
| Industrial plant | 10 | 5 | 4 | High | High | $84–110k | $140–180k | $59k | +$25–51k |
| Healthcare regional | 5 | 10 | 5 | Med-High | High | $54k | $90k | $39k | +$15k |
| Campus | 7* | 9* | 6* | Medium | Low-Med | $22k | $36k | $16k | +$6k |

\*Campus X/Y/Z unvalidated.

**CTS formula (planning row)**
Annual CTS = cloud + messaging/polling + identity + support + insurance/compliance + included-event support + account success.

| CTS component | Campus | Health | Utility comm. | Industrial |
|---|---|---|---|---|
| Cloud | 2.4 | 4.5 | 5.5 | 5.5 |
| Messaging / polling | 1.8 | 4.0 | 6.0 | 5.0 |
| Identity | 0.8 | 2.0 | 3.0 | 3.0 |
| Support | 4.0 | 8.0 | 10.0 | 10.0 |
| Insurance / compliance | 1.5 | 6.0 | 8.0 | 10.0 |
| Event support (2 activations) | 3.0 | 8.0 | 12.0 | 14.0 |
| Account success | 2.5 | 6.0 | 8.0 | 11.0 |
| **CTS $k** | **16** | **39** | **53** | **59** |

**Two labels — keep both visible internally**
Modeled Value → Evidence-Based Capture Range  
versus  
Design-Partner WTP Hypothesis → To Be Tested

Contribution at DP price is **not** contribution at 12% of modeled value. At 12% of current formulas every segment is contribution-negative. That is a gate fact, not a slide to hide.

[EXT: Pricing is under design-partner validation. Segment choice follows operational need.]

**One need, two utility economies**
Community: fulfillment time, unresolved shortages, plan-cycle latency.  
Industrial: $/hour interruption, minimum sustainable output, safe-state time, backup duration, staff/access/fuel dependencies.

---

# S4 — CONOPS

**Before** Prepare · roster · resources · Conservative / Baseline / Aggressive  
**During** Sense → facts → command → needs → allocate → recipient fulfill → communicate → revise  
**Revision** Plan v1 → event → change → authority → Plan v2  
User card: What changed? Why? Who authorized? What do I do now?  
**After** Replay → measure → qualify → improve → simulate  
**Degraded** Cache last authorized plan + assignments. Bridge to SMS / Sentinel / equivalent. Do not rebuild Sentinel.

Owner column in speaker notes only (OMS senses · CrisisCommand strategy if present · Storm Manager crews · Veoci HICS · Sentinel notify · DRS roster/need/resource/recipient/plan).

---

# S5 — Problem

**Statement**
Authority, needs, resources, entitlements, and plan changes live in different systems and in memory.

**Outcomes**
Named authority · needs/resources as objects · recipient fulfillment · controlled transparency · replayable record

**Status quo map (one line each)**
GridOS restores electrons + Storm Manager crews.  
Veoci runs HICS / 96-hour / AAR.  
Sentinel notifies, checks in, convenes, works offline.  
CrisisCommand (if present) structures strategy and messages.  
None close requester → entitlement → quantity → assignment → fulfillment → timestamp across orgs for non-specialist resources.

---

# S6 — Product

**Four layers**
CrisisCommand — Think / Command — *proposed integration*  
DRS — Coordinate / Allocate — *SoR: roster, need, resource, recipient, assignment, plan, cache*  
eXeL — Listen — *advisory only*  
R-CORE — Architecture — *SKU name: Replay + Readiness — powered by R-CORE*

**Visual spine (center of slide)**
Requester → validation / entitlement → quantity → assignment → fulfillment → timestamp

**Do not clone**
SITREP composer · HICS 201 · OMS switching · mass-notify composer

---

# S7 — Personas + stories

**Command** IC, city, utility exec, plant GM, hospital exec, campus leader  
**Ops** EM, facilities, medical, maintenance, security, logistics, qualified volunteers  
**Population** role-limited view · no command authority · minimum necessary identity  
**Principle** AI recommends. Humans command.

**Stories on-slide**
1.0 Verified roster so unofficial helpers cannot issue orders  
1.1 Needs/resources as objects  
1.2 Current plan card for PIO  
1.4 Recipient trace so water is not issued twice  
1.5 Cached last plan when broadband dies  
1.6 Bridge onto customer notify channel  
2.0 eXeL polling  
2.1 Replay vs inbox reconstruction  
3.0 Three-plan pre-season sim

---

# S8 — Utility / industrial vs GridOS

**NBA does** OMS/ADMS · FLISR · SAIDI/SAIFI/CMI · Storm Manager crews, GPS, lodging, expenses, external participants · Disruption Prepare ~72h

**DRS adds** community + plant envelope Storm Manager does not hold: shelter, heat/cool, water, non-store fuel, medical dependence, civic identity, recipient trace, public/large-customer plan card

**Do not claim** SAIDI · crews · lodging · switching · DER · generic logistics

**Line** GridOS operates the grid. DRS coordinates the crisis around it.

**Industrial interview — force these five numbers**
$/hour production interruption  
Minimum sustainable output  
Safe-state time requirement  
Backup-generation duration  
Staff / access / fuel dependencies  
One verified hour can rewrite Waterfall B. Current industrial $s are C-grade.

**Modeled value IA (formula: vol × unit × delta × freq × conf)**
Community $158k · Industrial $150k · Combined site less 20% overlap $246k

**Labels**
Evidence-based 12% capture: $19k / $18k / $30k  
DP WTP hypothesis: $84k ($84–110k industrial) — to be tested  
Future list aspiration: $140k ($140–180k industrial)

---

# S9 — Healthcare vs Veoci Vitals EM

**NBA does** one-click activation · ~30s departmental report · HICS · partner COP inside its deployments · shortage tracking · 96-hour · HVA · JC/CMS/DNV AAR

**DRS wedge (narrow)**
Regional non-clinical resource exchange  
+ affected-population transparency  
+ verified cross-organizational authority  
+ Replay + Readiness across events

**Do not claim** HICS · accreditation packet · PHI SoR · generic “beyond one org” · generic AAR

**Line** Veoci runs the hospital emergency program. DRS coordinates regional non-clinical exchange and the public card under named authority.

**Modeled value IA** $49k  
Evidence-based 12% capture $6k  
DP WTP hypothesis $54k — to be tested (~110% of modeled value)  
Future list aspiration $90k

[EXT: omit 110% line]

---

# S10 — Campus vs YUDU Sentinel

**NBA does** <60s multi-channel notify · two-way check · video rooms · audit · lockbox · offline docs · independent comms  
Anchor only: G-Cloud **£5,000/licence/year** (historical floor ~£4,500)

**DRS adds** fulfillment + account-for + recipient trace + plan provenance + three resource plans + cache/bridge

**Do not claim** blast · check-in · video · offline app · out-of-band tenancy

**Line** Sentinel notifies and convenes. DRS fulfills and accounts.

**Winter freeze (on-slide)**
Who lacks heat? Which building has capacity? Who has blankets? Who is qualified? Who approved relocation? Who received assistance?

**Modeled value IA** $24k  
Evidence-based 12% capture $3k  
DP WTP hypothesis $22k — to be tested (~92% of modeled value)  
Future list aspiration $36k

[EXT: omit 92% line]

---

# S11 — R-CORE

**Logo:** R-CORE logo (not DRS logo)

**R-CORE is architecture. Not the app. Not the SKU.**  
SKU: Replay + Readiness — powered by R-CORE

**Horizons — verbatim**
Baseline 2027 — coordination, allocation, provenance, recipient trace, degraded-mode cache  
2030 — cross-system replay, simulation, qualification, multi-event memory  
2525 — recursive continuity across institutions and generations

**Loop**
LIVE → COORDINATE → OPERATIONAL TRUTH → REPLAY → SIMULATE (C/B/A) → QUALIFY → NEXT EVENT

**Statement**
Every crisis becomes evidence. Every replay improves readiness. Every cycle strengthens resilience.

2525 is vision. Not this year’s product.

---

# S12 — Competition

**Clusters**
Deep ops: GridOS, hospital systems, CMMS  
CEM / crisis: Veoci, Sentinel (Everbridge et al. in notes)  
Cognitive command: CrisisCommand

**DRS** High Y · High Z · rising X  
Not superior on GridOS ops, Veoci compliance, or Sentinel notify. Win only where those stop.

---

# S13 — Value equation

**Formula**
Σ (volume × unit × Δ vs NBA × frequency × confidence A/B/C) = Modeled Value  
Modeled Value × tested capture = Evidence-Based Capture Range  
Design-Partner price = WTP Hypothesis, To Be Tested  
Higher list = Future aspiration pending validated additional value

**Internal table — required on this slide**

| Segment | Modeled value | 12% capture | DP hyp. | Capture at DP | CTS | Contrib. at DP | Contrib. at 12% |
|---|---|---|---|---|---|---|---|
| Utility comm. | 158 | 19 | 84 | 53% | 53 | +31 | −34 |
| Industrial | 150 | 18 | 84–110 | 56–73% | 59 | +25–51 | −41 |
| Combined site | 246 | 30 | 84 | 34% | ~55 | +29 | −25 |
| Healthcare | 49 | 6 | 54 | 110% | 39 | +15 | −33 |
| Campus | 24 | 3 | 22 | 92% | 16 | +6 | −13 |

At evidence-based 12% capture, contribution is negative in every row. Gate question stands.

[EXT: replace table with “Pricing under design-partner validation. Value from measured fulfillment, provenance, and replay beside the NBA.”]

---

# S14 — WTP + commercial model

**SKUs**
Readiness — roster, needs, resources, assignments, recipient trace, plan versions, 3 viewports, last-plan cache, **2 major activations included**  
WTP hyp. $22k / $54k / $84k · aspiration $36k / $90k / $140k

Surge-capacity pack — pre-purchased extra activations. Price known before the event. **No crisis-time % surcharge.**  
$8k / $12k / $18k per pack of two

Replay + Readiness — powered by R-CORE  
+20% on DP Readiness in Y1 · +35% aspiration later

Integration one-time  
DP $20k / $30k / $45k

**Targets IA**
Utility: assignment ≤2h · unresolved T+24h ≤15% · ack ≥80% in 30 min  
Industrial: get the five Plant GM numbers  
Health: multi-org authority ≤25 min · ≤2 public versions / 12h  
Campus: 90% accounted-for ≤40 min · supply ≤90 min

---

# S15 — Three resource plans

| | Conservative | Baseline | Aggressive |
|---|---|---|---|
| Assumption | Low-end demand | Last comparable | Tail event |
| Reserve | High / slow | Normal | Thin / forward |
| Trigger | Need < forecast N hours | ≈ forecast | Need > forecast or life-safety |
| User sees | Plan · assumptions · burn · reserve · who can switch · **who may receive** | same | same |

Switch = new plan version.

---

# S16 — Validation matrix

NBA stays. DRS runs beside it. Measure the gap.

**Columns**
segment → NBA → hypothesis → metric → NBA baseline → target Δ → $ weight → customer source → result → pursue / pivot / pass

**Starter rows (result empty)**
Utility / GridOS / community needs invisible / hours need→assign / 8–18h / ≤2h  
Utility / GridOS / double-issue / duplicate rate / unk / −50%  
Industrial / GridOS+plant / envelope delays / hours to safe restore / site / −3h  
Health / Veoci / non-clinical exchange still phone / hours cross-org / 6–24h / ≤3h  
Health / Veoci / messages fork / versions in 12h / 4+ / ≤2  
Campus / Sentinel / notify ≠ fulfilled / min to issued supply / 3–6h / ≤90m  
Campus / Sentinel / plan dies with broadband / degraded drill / 0 / 1 pass  
All / — / DP price payable / spoken WTP / — / ≥ DP hyp.

Real ≠ hypothesized until one DP · one segment · one pre-registered metric.

---

# S17 — Financials (internal)

**Model**
Value from audited formulas. Capture unproven. Price is hypothesis.  
Readiness + incident allowance + pre-bought surge packs + Replay + Readiness + integration.

**Path IA**
FY26 rev 0 cash −260  
FY27 rev 95 cash −765  
FY28 rev 940 cash +120  
FY29 rev 2,390 cash +1,410  
NPV $0.16M · IRR ~20% · path more aggressive than waterfalls justify

**Market corrected**
6,700 accounts × $40k = $268M universe  
× 25% = **$67M near-term SAM**  
Y3 SOM $1.85M = 2.8% of SAM  
$220M figure retired

[EXT: omit cash path, NPV, capture table, SAM method]

---

# S18 — MVP / roadmap

**Baseline 2027 — MVP 1 Coordinate**
React · 3 viewports · roster · needs · inventory · assignments · recipient trace · plan versions · last-plan cache · notify-channel bridge  
Out: sim engine · deep OMS/HICS ingest · agents · rebuilt notify  
$620k envelope · $280k now

**Toward 2030 — MVP 2 Learn**
Polling · three plans · record · replay · readiness metrics · $360k IA

**2030 gate — MVP 3**
Cross-system ingest · simulation · qualification · memory · $480k IA

**2525** Vision. Not this release.

G2 2027-Q1 · tabletop 2027-Q3 · first paid DP 2027-Q3/Q4 · 8 paying 2028-Q4

---

# S19 — Risks + decision

| Risk | Score | Control |
|---|---|---|
| DP price > 12% modeled value | 20 | Show tension; test spoken WTP |
| Integration burden | 16 | One NBA, pointer + CSV |
| Degraded comms | 16 | Cache + bridge |
| Identity / unofficial responders | 15 | IdP + rank |
| Storm Manager collision | 15 | Demo objects it does not hold |
| Healthcare wedge collapses into Veoci | 15 | Hold narrowed wedge |
| Procurement cycle | 15 | DP MSA |
| Panic via transparency | 12 | Role views |
| CrisisCommand called “partner” | 9 | Proposed integration only |
| Unverified CC certification language | 9 | Confirm before external use |

**Ask**
1. Three-segment validation; industrial = subcase not fourth segment  
2. Three NBA teardowns  
3. MVP 1 including cache + bridge  
4. WTP tests using DP prices as hypotheses  
5. First pilot  
6. $280k of $620k

**Exit**
Named buyer · need in their words · NBA teardown in the room · two differentiators survive · one measured outcome · spoken WTP · pilot beside NBA · matrix row filled

**Master question (repeat)**
Can DRS prove that verified authority + resource fulfillment + provenance + replay creates enough incremental value beside the customer’s existing NBA to support a paid attach product?

---

# Build notes for Claude Code / slides

1. Build INTERNAL 19-slide deck from this file only.  
2. Produce EXTERNAL 19-slide twin by applying every [EXT:] substitution and dropping S13 tension table, S17 cash path, and S9/S10 capture-percent callouts.  
3. S6 and S11 are diagram slides. Recipient-trace chain is visually central on S6. Horizons on S11 are verbatim. R-CORE logo on S11.  
4. No PRJ-31 financials. No SAIDI claims. No SITREP composer. No HICS form. No notify composer.  
5. Every numeric block labeled IA.  
6. Stop iterating strategy. Next edits come from interviews into the S16 matrix.

End of slide manuscript.
