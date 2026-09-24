# De-Risking Strategies
# Crisis + Resilience
## Canonical text source — Gate manuscript v0.4
### 23 September 2026

Human-authored strategy · AI-assisted synthesis by eXeL AI · cross-review informed by Grok · final authority: De-Risking Strategies

Status: Concept → Plan (G1/G2).  
This is the shared baseline after eXeL AI / Grok parity review.  
Every number is an **initial assessment for feedback**, not a validated price, savings claim, or forecast.

Relationship to CrisisCommand: **proposed / complementary integration hypothesis**. Not a signed partnership. Not an assumed API. Strategy / message / SITREP objects are a target interface until an object contract exists.

---

# Document control

| Item | Value |
|---|---|
| Program | De-Risking Strategies — Crisis + Resilience |
| Combines | Project Resilience (2023) + proposed CrisisCommand integration + R-CORE architecture (Vision 2525) |
| Template | eXeL AI Polling / Gate Review S1–S19 |
| Stage | G2 Plan |
| Decision requested | Approve G2. Release $280k of a $620k MVP 1 envelope. Target first paid design partner 2027-Q3. |
| Version | 0.4 canonical |
| Prior | v0.3 Grok writeup; eXeL parity memo 2026-09-23 |

Footer for every slide and page:  
`DRS Crisis + Resilience · v0.4 · IA for feedback · Human-authored strategy · AI-assisted synthesis by eXeL AI · cross-review informed by Grok · final authority: De-Risking Strategies`

---

# S1 — Executive summary

## Purpose

Help cities, critical infrastructure operators, healthcare systems, and campuses move from fragmented crisis response to verified, transparent, resource-aware coordination.

## One-sentence product

De-Risking Strategies is the human-directed coordination layer intended to sit beside CrisisCommand and specialist operational systems so leaders can verify who is in command, see real needs, allocate scarce resources, publish the current plan, and replay what happened.

## Core value proposition

For organizations responsible for people, infrastructure, and essential resources during high-consequence disruptions, De-Risking Strategies connects crisis command, validated leadership, community and field input, resources, and operational learning in one human-directed system — so leaders can see what is happening, adapt the plan, communicate changes, allocate scarce resources, and preserve what happened for the next event.

## What this is not

This is not a grid-management system, a hospital incident-command suite, a mass-notification product, or a replacement for CrisisCommand.

GridOS operates the grid.  
Veoci runs the hospital emergency program.  
Sentinel notifies and convenes the campus.  
CrisisCommand structures strategy, stakeholders, messages, and SITREPs.

DRS coordinates the human and resource crisis around those systems. The CrisisCommand interface is a **proposed integration**, not a live partnership.

## Initial needs-based segments

1. Utilities + petrochemical / manufacturing — one needs segment, two economic subcases.  
2. Healthcare / regional health disruption.  
3. Education + fixed-site campus safety.

## Pipeline — initial assessment

| Pursuit | Design-partner profile | NBA | Status | IA year-1 cash (WTP hypothesis) |
|---|---|---|---|---|
| DP-01 Campus | University or large district, 8–20k population | YUDU Sentinel | Hypothesis — no LOI | $42,000 |
| DP-02 Healthcare | Regional system, 3–8 hospitals | Veoci Vitals EM | Hypothesis — no LOI | $84,000 |
| DP-03 Utility community or industrial | 80k–400k meter IOU/muni, or large plant + community envelope | GE Vernova GridOS | Hypothesis — no LOI | $129,000 |
| Y1 book if all three sign | | | Target, not forecast | **$255,000 cash / $160,000 ARR** |

Further planning marks: Y2 ARR $0.62M · Y3 ARR $1.85M.  
Attach universe $268M · near-term SAM $67M · Y3 SOM $1.85M. See S17 for the corrected arithmetic.

## Differentiators we will defend

1. Verified authority roster with rank — public participants are not operators.  
2. Needs and resources as first-class objects, including across organizational boundaries, **with recipient / beneficiary traceability**: requester or recipient → entitlement or validation level → quantity → assignment → fulfillment → timestamp. Minimum necessary identity. Driver-license storage is not the default.  
3. Plan vN provenance: what changed, why, who authorized, what to do now.  
4. eXeL collective intake — concerns, priorities, emergent needs — advisory to command, never a vote.  
5. Conservative / Baseline / Aggressive resource plans with named switch triggers.  
6. Replay + Readiness module, powered by R-CORE: replay of assignments, fulfillment, and plan deltas into the next event.

We will not claim as unique: basic alerting, dashboards, incident logs, stakeholder messaging, generic simulations, or after-action report templates. We will not claim a responsive interface as a differentiator. We will not claim generic utility logistics (Storm Manager already activates crews, tracks GPS, lodging, expenses, and external participants). We will not claim generic healthcare coordination or AAR (Veoci already has HICS, operational pictures, 96-hour sustainability, timestamps, and AAR workflows). We will not claim notify, two-way safety check, video rooms, audit logs, or offline documents (Sentinel).

## Decision requested

Approve G2 Plan work.

- Three-segment customer validation.  
- Three NBA teardowns (GridOS, Veoci Vitals EM, YUDU Sentinel).  
- MVP 1 architecture freeze (Coordinate layer + three viewports + last-authorized-plan cache).  
- Outcome and WTP experiments using design-partner prices as the WTP hypotheses.  
- First live or simulated resilience pilot.  
- Release **$280,000** of a **$620,000** MVP 1 envelope.

First paid design-partner target: **2027-Q3**.  
First repeatable revenue target: **2028-Q1**.  
Do not release Maximize-gate R&D. Do not hold a 2026-Q2 first-revenue date.

---

# S2 — Project overview

## Problem

Organizations already have emergency plans, communication tools, and specialist operational systems.

What they often lack is a shared layer showing:

- who is actually accountable  
- who is qualified to help  
- what people currently need  
- what resources actually exist  
- where those resources are going  
- who is entitled to receive them  
- whether they were fulfilled, when, and to whom  
- what changed from the previous plan  
- who authorized the change  
- what the public or workforce should know now  
- what should be learned afterward  

## Product thesis

Do not replace grid-management systems, hospital systems, emergency-notification products, or CrisisCommand.

Coordinate across them.

The CrisisCommand connection is a proposed complementary integration until an object contract exists.

## Stage and money — initial assessment

| Chip | IA |
|---|---|
| Stage | G1 complete → G2 Plan |
| MVP 1 envelope | $620,000 |
| Release now | $280,000 |
| Product NRE through MVP 3 | $1.46M |
| IA 4-year NPV at 12%, 2026 = t0, no terminal | **$0.16M** |
| IA IRR on the same series | **~20%** |
| IA payback from G2 start | ~36 months |
| Software gross margin at Y3 mix | 80–82% |

Cash series used for those chips: 2026 −$260k, 2027 −$765k, 2028 +$120k, 2029 +$1.41M. Dated cash-flow / XIRR, not a hand-waved 14%.

---

# S3 — Needs-based segmentation

## Axes

**X — Operational Impact.** Restoration, continuity, reduction of physical disruption.

**Y — Human Coordination.** Transparent communication, leadership, public and workforce participation, multi-party coordination.

**Z — Replay / Readiness Learning.** Traceability, reconstruction, simulation, improvement.

**WTP — Willingness to pay.** Hypothesis until interviews.

**CTS — Cost to serve.** Identity integration, event support, polling and SMS, data retention, insurance, degraded-mode operations.

Tom’s needs-based method is WTP versus CTS to maximize operating income. X/Y/Z explain the job. WTP/CTS decide whether we want the job.

## Segment table — initial assessment

| Segment | X | Y | Z | WTP | CTS | Economic buyer | Operating buyer | WTP hypothesis (DP price) | Future list aspiration |
|---|---|---|---|---|---|---|---|---|---|
| Utility / industrial — community envelope | 10 | 6 | 4 | High | High | COO / VP Grid Ops | EM + Storm Director | $84k Readiness | $140k |
| Utility / industrial — petrochem / manufacturing | 10 | 5 | 4 | High | High | Plant GM / VP Ops | Process safety + EM | $84k–$110k Readiness | $140k–$180k |
| Healthcare regional | 5 | 10 | 5 | Med-High | High | COO / CMO | EM / BCM | $54k Readiness | $90k |
| Campus / fixed site | 7* | 9* | 6* | Medium | Low-Med | VP Student Affairs / COO / Superintendent | Clery / EM / campus safety | $22k Readiness | $36k |

\*Campus X/Y/Z remain hypotheses until five to eight interviews.

Healthcare and campus future list prices sit above the 12% capture of currently modeled value. They stay labeled **aspiration pending validated additional value**. Design-partner prices are the WTP hypotheses that go to interviews.

## Two economic subcases under one utility / industrial needs segment

Same architecture. Different value equation.

**Community-facing utility.** Metrics: community-need fulfillment time during an OMS-recognized outage; unresolved shortages at T+24h; plan-cycle latency to city, PIO, and large customers.

**Petrochemical / manufacturing.** Metrics: minimum sustainable operating capacity; production-interruption exposure; backup-power duration versus required safe-state time; time-to-safe-restoration of the non-grid envelope (access, staffing, fuel, community offsite). This subcase may produce the strongest WTP. It does not get its own NBA. GridOS remains the paired alternative where the site depends on grid restoration; plant process-safety systems remain out of scope.

## Secondary segments — park

City / county OEM: channel, not first ICP.  
Sports and venues: only if fulfillment pull is explicit.

## NOSE

**Utility community.** Need: restore service and protect the surrounding community while GridOS does restoration math. Outcome: fewer unmanaged community failures during an already-counted SAIDI event. Solution: DRS beside GridOS, not inside the OMS. Evidence: time-to-assign non-grid resource; unresolved shortages; plan-revision latency; official acknowledgement rate.

**Industrial plant.** Need: hold minimum sustainable operating capacity and reach a safe state when power, access, or staffing breaks. Outcome: shorter unsafe-exposure window and less consequential interruption from the non-process envelope. Solution: same DRS objects, plant-specific resource classes. Evidence: hours of production exposure avoided; hours of backup-power gap closed; time-to-safe-restoration of access and staffing.

**Healthcare.** Need: exchange non-clinical regional resources and speak with one authorized public voice without amplifying panic. Outcome: faster cross-org authority map; fewer conflicting public messages; traceable non-clinical resource movement. Solution: regional layer around Veoci / HICS, not a second HICS. Evidence: minutes to multi-org authority picture; public-message version count; non-clinical resource fulfillment time.

**Campus.** Need: account for a known population and fulfill welfare, shelter, and supply needs. Outcome: minutes-to-accounted-for; minutes-to-sheltered; supplies issued versus requested, to named recipients. Solution: resource layer beside Sentinel. Evidence: accountability completion; need-to-fulfillment; duplicate labor hours; drill versus live.

---

# S4 — Customer CONOPS

## Before

Prepare plans → validate rosters → identify resources → simulate Conservative / Baseline / Aggressive response.

Today this is split across CrisisCommand Plan and Simulate modes (if the customer has it), GridOS Disruption Prepare, Veoci HVAs and drills, and Sentinel playbooks. DRS adds three resource plans with costs, reserves, change triggers, and recipient entitlement rules.

## During

Sense event → establish authoritative facts → activate command → gather concerns → prioritize needs → allocate resources → record recipient fulfillment → communicate → monitor → revise.

| Step | Who owns it today | DRS increment |
|---|---|---|
| Sense event | OMS, weather, CAD, campus SOC, NWS | Pointer in. Do not compete on sensing. |
| Facts and command | CrisisCommand if present; ICS / HICS; utility EOC | Verified roster and authority map. If CrisisCommand is absent, facts stay in the customer’s existing command tool. |
| Gather needs | Calls, 211, departmental forms, two-way alert replies | Need objects plus eXeL polling |
| Allocate and fulfill | Storm Manager for crews; hospital inventory; ad-hoc campus caches | Cross-boundary non-specialist assignment plus recipient traceability |
| Communicate current plan | CrisisCommand comms if present; Sentinel or Everbridge blast; PIO | Plan vN card |
| Degraded comms | Sentinel offline docs and independent channels; radio | Cache last authorized plan and assignments; defined bridge into SMS / partner out-of-band. Do not rebuild Sentinel. |
| Revise | Verbal EOC updates | Forced provenance |

## Every revision

Plan v1 → Event → Change → Authority → Plan v2.

What changed? Why? Who authorized it? What should I do now?

## After

Replay → measure → qualify → improve → simulate the next event.

## Future capabilities — not MVP 1

Deep OMS / HICS / CAD ingest. Automated volunteer-skill qualification. Multi-event memory across seasons. Cross-institution recursive continuity (2525 horizon).

---

# S5 — Customer problem

During disruption, authority, needs, resources, entitlements, and plan changes live in different systems and in human memory. Leaders cannot reliably answer who may act, what is needed, what is available, who is entitled to receive it, whether it was fulfilled, who changed the plan, and what people should do now.

That fragmentation creates uncertain authority, poor need visibility, double-issued or hoarded resources, panic, unofficial responders, weak plan traceability, and lost learning.

Project Resilience (6 December 2023) named real-time information gaps, inefficient resource coordination, and limited public communications. The 2023 CONOPS opened with alerts. That job is now owned by NWS, OMS, Sentinel, and Everbridge. DRS keeps roster, needs, resources, recipient fulfillment, the public plan card, and replay.

Status-quo map: GridOS restores electrons and Storm Manager coordinates restoration crews. Veoci runs intra-system HICS and AAR. Sentinel notifies and convenes, including offline documents. CrisisCommand, where present, structures strategy and messages. None of those close requester → entitlement → quantity → assignment → fulfillment → timestamp across organizational boundaries for non-specialist resources.

---

# S6 — Product summary

**CRISISCOMMAND — Think / Command** *(proposed complementary integration)*  
Facts. Objectives. Stakeholders. Strategy. SITREPs. Communications.  
Boundary: DRS would consume a locked strategy object if and when the contract exists. DRS does not rewrite strategy. If CrisisCommand is not present, DRS still runs against ICS / HICS / EOC notes.

**DE-RISKING STRATEGIES — Coordinate / Allocate**  
Verified roster. Responders. Volunteers. Needs. Resources. Facilities. Supplies. Recipient / entitlement record. Public and workforce interface. Last-authorized-plan cache for degraded comms.

**eXeL COLLECTIVE INTELLIGENCE — Listen**  
Polling, concerns, priorities, feedback, emergent needs. Advisory only.

**R-CORE — architecture, not the SKU**  
Authority, version history, operational truth, replay, simulation, qualification.  
Commercial module name: **Replay + Readiness — powered by R-CORE.**

## Objects

| Object | Owner | DRS relation |
|---|---|---|
| Strategy, objectives, stakeholder map, locked messages, SITREP | CrisisCommand, if present | Proposed ingest / pointer |
| Switching order, device, crew restoration | GridOS OMS / Storm Manager | Pointer |
| HICS, departmental assessment, HVA, accreditation AAR | Veoci | Pointer |
| Mass alert, two-way ping, video room, offline document | Sentinel or Everbridge | Trigger / acknowledge / comms bridge |
| Verified roster and rank | DRS | System of record |
| Need object | DRS | System of record |
| Non-specialist resource object | DRS | System of record |
| Entitlement / recipient record | DRS | System of record |
| Assignment and fulfillment timestamp | DRS | System of record |
| Plan version card | DRS | System of record |
| Last-authorized plan and assignment cache | DRS | System of record |
| eXeL poll cluster | eXeL → DRS | Advisory |
| Replay tape and readiness score | Replay + Readiness module / R-CORE | System of record |

---

# S7 — Workflow, personas, user stories

Command: incident commander, city official, utility executive, plant manager, hospital executive, campus leader. Live in ICS / HICS, EOC, and CrisisCommand if purchased.

Responders: EM, facilities, medical, maintenance, security, logistics, qualified volunteers. Live in OMS, CMMS, Veoci, Sentinel, radio.

Population: residents, employees, families, students, parents. Role-limited view. No command authority. Recipient records use minimum necessary identity.

Integrator: IdP, SIEM, out-of-band comms owner.

System principle: public participants do not receive operational authority. AI recommends. Humans command.

User stories 1.0–3.0 unchanged from v0.3, plus:

- MVP 1.4 — As logistics lead, I want requester → entitlement → quantity → assignment → fulfillment → timestamp, so the same case of water cannot be issued twice.  
- MVP 1.5 — As operator on a degraded link, I want the last authorized plan and assignments cached on device, so I am not blind when broadband dies.  
- MVP 1.6 — As PIO, I want a defined bridge to the customer’s Sentinel or equivalent channel, so the plan card can ride an independent path.

---

# S8 — Utility / industrial versus GridOS

## NBA

GE Vernova GridOS: ADMS, Enterprise OMS, Outage Assist, Disruption Prepare, Storm Manager.

Storm Manager already activates internal and contract crews, lodging, expenses, GPS, and external participants (DoT, fire, adjusters, FEMA-adjacent). Disruption Prepare claims impact assessment up to 72 hours pre-event. Vendor claims, treated as vendor claims: 38% outage reduction in one European case; 112 million CMI avoided in Alabama in 2025.

## Do not claim

FLISR, OMS accuracy, SAIDI / SAIFI / CMI improvement by DRS, crew lodging, switching orders, DER dispatch, mutual-aid crew logistics, generic “utility logistics.”

## Wedge

Community envelope and plant envelope that Storm Manager does not hold: medical dependence, shelter, warming / cooling, water, fuel that is not a utility store, civic and volunteer identity, recipient fulfillment, public and large-customer plan card, eXeL building-level concerns that must not enter the OMS.

Positioning: GridOS operates the electrical grid. DRS coordinates the human, organizational, and resource crisis surrounding the disruption.

## Waterfall A — community-facing utility  
Formula on every line: volume × unit × delta × frequency × confidence.

| Line | Formula | Grade | IA $ |
|---|---|---|---|
| Community coordination labor saved | 15 people × 10 days × 12 h × $90/h × 0.35 delta vs phone/spreadsheet × 2 major events × 0.70 | B | $79,000 |
| Unresolved welfare logistics avoided | 40 priority needs × $1,200 incremental cost of late fulfillment × 0.40 delta × 2 events × 0.55 | C | $21,000 |
| Plan-change latency to city / PIO / large customers | $400,000 comms-and-credit slush × 0.12 attributable × 2 events × 0.45 | C | $43,000 |
| Double-issue / hoard / unofficial-helper waste | 25 scarce-unit cycles × $800 waste × 0.50 delta × 2 events × 0.50 | C | $10,000 |
| Next-season reconstruction labor | 120 hours × $95/h × 0.60 delta × 1 season × 0.70 | B | $5,000 |
| **Customer value** | | | **$158,000** |
| 8 / 12 / 18% capture | | | $13k / $19k / $28k |

This community-only stack **does not support** an $84k or $140k price at 12% capture. Either the industrial subcase must carry the price, additional validated value must appear, or the utility WTP hypothesis must fall. Print that tension on the slide.

## Waterfall B — petrochemical / manufacturing subcase

| Line | Formula | Grade | IA $ |
|---|---|---|---|
| Production-interruption exposure shortened | 1 unit × $80,000/h × 3 h delta × 1 event/year × 0.35 | C | $84,000 |
| Backup-power duration vs safe-state requirement | 6 h gap × $25,000/h envelope cost × 0.40 delta × 1 × 0.40 | C | $24,000 |
| Time-to-safe-restoration of access / staffing / fuel | 8 h × $18,000/h × 0.35 delta × 1 × 0.45 | C | $23,000 |
| Minimum sustainable operating capacity held | 0.5 day × $200,000/day avoided curtailment × 0.30 delta × 1 × 0.35 | C | $11,000 |
| Recipient-traceable emergency stocks | 200 issues × $150 waste avoided × 0.50 × 1 × 0.55 | C | $8,000 |
| **Customer value** | | | **$150,000** |
| 8 / 12 / 18% | | | $12k / $18k / $27k |

Combined community + industrial at one site, if both apply and overlap is stripped at 20%: about **$246,000** value · 12% = **$30,000**. Still below DP price.

**Implication, print it:** current audited formulas do not yet justify $84k–$140k at 12% capture. The $84k design-partner price is a **WTP hypothesis to test**, not a conclusion from the waterfall. The $140k / $189k figures are **future list aspiration pending validated additional value** — likely additional industrial-exposure hours or multi-event years. Do not hide this.

ORNL context, not DRS savings: average annual major-outage costs above $67B over 2018–2024; $121B in 2024; C&I about $6,031 per outage in 2024; major-outage count +40%; duration 9.6 → 11.8 hours.

---

# S9 — Healthcare versus Veoci Vitals EM

## NBA

Veoci Vitals EM: one-click activation, ~30-second departmental report, digital HICS, intra-system and partner operational pictures, shortage tracking, 96-hour sustainability, timestamps, Kaiser-format HVAs, Joint Commission / CMS / DNV oriented AARs, committee toolkit. Government deployments also use Veoci for resource inventory, requests, deployments, and costs. 40-plus healthcare clients claimed.

## Do not claim

Better HICS. Accreditation packet. Intra-facility tasking. PHI system of record. Generic “coordination beyond one organization.” Generic replay / AAR. Shared operational picture inside Veoci’s tenant world.

## Wedge — narrowed

Regional **non-clinical** resource exchange  
\+ affected-population transparency  
\+ verified **cross-organizational** authority  
\+ Replay + Readiness across events  

Not “demand-to-resource coordination beyond one healthcare organization” as a blanket claim. Veoci already connects teams and partners inside its deployments.

CrisisCommand HEALTH, if present, drafts strategy and messages. Confirm with CrisisCommand before any external statement about PHI handling or certifications. DRS holds no clinical record.

## Waterfall — initial assessment

| Line | Formula | Grade | IA $ |
|---|---|---|---|
| Regional non-clinical resource exchange time | 6 incidents × 8 people × 4 h saved × $140/h × 0.60 | B | $16,000 |
| Conflicting public-message / family load | 6 incidents × $8,000 incremental PIO and call-center load × 0.40 delta × 0.50 | C | $10,000 |
| Cross-org authority-map latency | 6 × 3 h of senior time × $220/h × 0.50 × 0.55 | C | $1,000 |
| Volunteer / assistance qualification outside badge | 40 people × 2 h × $45 × 4 incidents × 0.60 | B | $9,000 |
| Recipient double-issue of non-clinical stocks | 150 issues × $80 × 0.40 × 4 × 0.50 | C | $10,000 |
| Replay across seasons vs reconstructed AAR | 80 h × $120 × 0.50 × 1 × 0.60 | B | $3,000 |
| **Customer value** | | | **$49,000** |
| 8 / 12 / 18% | | | $4k / $6k / $9k |

$54k DP price is about **110% of modeled value**, not 12% capture. $90k list is aspiration. Healthcare price must be sold as risk transfer and accreditation-adjacent transparency, or the price comes down toward $18–24k, or the waterfall must gain clinician-endorsed diversion and reputation lines. Print the tension.

---

# S10 — Campus versus YUDU Sentinel

## NBA

YUDU Sentinel: multi-channel notification, two-way safety check, video crisis rooms, audit logs, document lockbox, offline documents, independent-comms resilience. Education scenarios include fire, lockdown, extreme weather, closure, field trips, parent comms.

Pricing anchor, context only: historical vendor-supplied floor about £4,500/year on G2/Capterra; **current UK G-Cloud listing £5,000 per licence/year**, education discounts available. Not a DRS price determinant.

## Do not claim

Blast speed, two-way check-in, video room, offline document app, out-of-band tenancy. Integrate to those channels. Do not rebuild them.

## Wedge

Fulfillment and account-for. Winter freeze: who lacks heat, which building has capacity, who has blankets, who is qualified, who approved relocation, who received assistance (named recipient, timestamp). Twins: lockdown reunification resources; heat-wave cooling and water.

Positioning: Sentinel notifies and convenes. DRS fulfills and accounts.

## Waterfall — initial assessment

| Line | Formula | Grade | IA $ |
|---|---|---|---|
| Account-for and shelter labor | 35 staff × 12 h OT × $50/h × 0.30 delta × 3 events × 0.65 | B | $14,000 |
| Supply fulfillment vs RA runs | 80 trips × $90 × 0.40 × 3 × 0.60 | B | $5,000 |
| Double-issued caches | 120 issues × $25 × 0.35 × 3 × 0.55 | C | $2,000 |
| Parent-trust / Clery-quality record | $20,000 comms-and-legal buffer × 0.25 attributable × 1 × 0.35 | C | $2,000 |
| Drill-to-live lift | 40 h × $65 × 0.40 × 2 drills × 0.60 | B | $1,000 |
| **Customer value** | | | **$24,000** |
| 8 / 12 / 18% | | | $2k / $3k / $4k |

$22k DP Readiness is about **92% of modeled value**. That is a seat tax, not 12% capture. Either attach at $8–12k, add validated value, or admit campus is a beachhead at thin contribution. Print the tension. $36k list is aspiration only.

---

# S11 — R-CORE relationship

Use the **R-CORE logo**, not the DRS logo, on this slide.

R-CORE is the architecture. It is not the crisis application and not the SKU name.

Commercial module: **Replay + Readiness — powered by R-CORE.**

Definition: R-CORE is the recursive operational architecture that connects live coordination to a durable operational truth, then forces replay, simulation, qualification, and improvement without removing human command.

## Horizon — restore this frame

| Horizon | Meaning | Promise class |
|---|---|---|
| **Baseline 2027** | Coordinate + allocate + provenance + recipient trace + last-authorized-plan cache | Near-term product |
| **2030** | Cross-system replay + simulation + qualification + multi-event memory | Product roadmap, gated |
| **2525** | Recursive operational continuity across institutions and generations | Vision 2525 — not a near-term SKU |

## Loop

LIVE EVENT → COORDINATE → SYNC / OPERATIONAL TRUTH → REPLAY → SIMULATE (Conservative / Baseline / Aggressive) → QUALIFY → NEXT EVENT

Core statement: Every crisis becomes evidence. Every replay improves readiness. Every cycle strengthens resilience.

---

# S12 — Competition and value

Three clusters unchanged: deep operational systems; crisis-management / CEM systems; cognitive crisis command.

DRS target: high human coordination, high replay and readiness, increasing operational impact. Not immediately superior on GridOS ops, Veoci intra-hospital compliance, or Sentinel notify.

Speaker note only: Everbridge, OnSolve, Noggin, D4H, WebEOC, Juvare. If the buyer has Everbridge — CEM notifies and tasks; it rarely allocates community resources under verified authority with recipient trace.

---

# S13 — Value equation rules

NBA outcome cost  
\+ Σ (volume × unit × delta versus NBA × frequency × confidence)  
= customer value  
× tested capture  
= WTP range  

Confidence grades: A observed at this customer · B analogue with named source · C constructed hypothesis.

If a line cannot name a measurable delta versus the NBA, it does not enter.

Current modeled value versus WTP hypothesis:

| Segment | Modeled value | 12% of value | WTP hypothesis (DP Readiness) | Future list aspiration | Implied capture at DP price |
|---|---|---|---|---|---|
| Utility community only | $158k | $19k | $84k | $140k | 53% |
| Industrial only | $150k | $18k | $84–110k | $140–180k | 56–73% |
| Combined utility site, 20% overlap stripped | $246k | $30k | $84k | $140k | 34% |
| Healthcare | $49k | $6k | $54k | $90k | 110% |
| Campus | $24k | $3k | $22k | $36k | 92% |

The deck must show this table. Design-partner prices are interview hypotheses. Future list prices are aspirations pending additional validated value. Do not publish list as if it sat inside 8/12/18% of current formulas.

---

# S14 — Outcome-based WTP and commercial model

## SKUs

| SKU | Content | WTP hypothesis | Future list aspiration |
|---|---|---|---|
| Readiness | Roster, needs, resources, assignments, recipient trace, plan versions, three viewports, last-authorized-plan cache, **annual incident allowance of two major activations** | Campus $22k · Health $54k · Utility $84k | $36k / $90k / $140k |
| Surge-capacity pack | Pre-purchased additional activations and polling concurrency. Price known before the event. Not an 18% surprise bill when the tornado hits. | $8k campus / $12k health / $18k utility per extra pack of two activations | Same |
| Replay + Readiness — powered by R-CORE | Replay, three-plan simulation, readiness score, multi-event memory | +20% on DP Readiness in year one | +35% on future list |
| Integration, one-time | IdP + one NBA pointer + roster load + comms-bridge definition | $20k / $30k / $45k | $35k / $55k / $80k |

No crisis-time surge surcharge as a percentage of list. Customers know the price before the freeze, outbreak, or storm.

## Outcome targets — initial assessment

Utility community: need-open to assignment ≤ 2.0 h; unresolved priority needs at T+24h ≤ 15%; plan-card acknowledgement ≥ 80% in 30 minutes.  
Industrial: hours of production exposure in the non-process envelope; backup-power gap versus safe-state requirement; time-to-safe-restoration of access and staffing.  
Healthcare: minutes to multi-org authority picture ≤ 25; public-message versions in 12 h ≤ 2; non-clinical resource fulfillment time.  
Campus: 90% accounted-for ≤ 40 minutes; heat / water / blanket fulfillment ≤ 90 minutes median; duplicate labor −25%.

---

# S15 — Three resource plans

Unchanged structure. Add entitlement rule to “what the user sees”: who may receive this resource class, at what validation level, remaining quantity, already-fulfilled recipients.

Every switch is a plan version. Provenance is the product.

---

# S16 — Validation matrix

Pilot beside the NBA. Measure the gap. Suggestions logged as suggestions.

For every differentiator:

segment → NBA → hypothesis → operational metric → NBA baseline → target delta → dollar weight → customer source → result → pursue / pivot / pass

Starter rows:

| Segment | NBA | Hypothesis | Metric | NBA baseline IA | Target | $ weight IA | Source needed | Result | Decision |
|---|---|---|---|---|---|---|---|---|---|
| Utility comm. | GridOS | Community needs are invisible to OMS | Hours need → assignment | 8–18 h | ≤ 2 h | see S8 labor line | Storm director interview | empty | |
| Utility comm. | GridOS | Scarce non-grid stocks are double-issued | Duplicate issue rate | unknown | −50% | S8 waste line | Logistics lead | empty | |
| Industrial | GridOS + plant systems | Envelope delays extend unsafe exposure | Hours to safe restoration | site-specific | −3 h | S8 B production line | Plant GM | empty | |
| Healthcare | Veoci | Regional non-clinical exchange is still phone | Hours to fulfillment across orgs | 6–24 h | ≤ 3 h | S9 exchange line | System EM | empty | |
| Healthcare | Veoci | Public messages fork | Versions in 12 h | 4+ | ≤ 2 | S9 comms line | PIO | empty | |
| Campus | Sentinel | Notify ≠ fulfilled | Minutes to issued supply | 3–6 h | ≤ 90 min | S10 fulfillment | Campus EM | empty | |
| Campus | Sentinel | Last plan dies with broadband | Cache used in tabletop | 0 | 1 successful degraded drill | CTS, not value | IT | empty | |
| All | — | DP price is payable | Spoken WTP | — | ≥ DP price | — | Economic buyer | empty | |

A differentiator is real only after one design partner, one segment, one pre-registered metric, versus NBA-only control.

---

# S17 — Financial model

Value created from audited formulas.  
Value captured as a hypothesis, currently **not** 12% at proposed DP prices.  
Commercial model: annual Readiness with incident allowance + pre-purchased surge packs + Replay + Readiness module + integration.

## Four-year sketch — initial assessment

Same operating series as v0.3, corrected chips.

| | 2026 t0 | 2027 | 2028 | 2029 |
|---|---|---|---|---|
| Revenue | $0 | $95k | $0.94M | $2.39M |
| Cash contribution | −$260k | −$765k | +$120k | +$1.41M |

NPV at 12%, 2026 = t0, no terminal: **$156k ≈ $0.16M**.  
IRR on that series: **20%**.  
Payback: about 36 months from G2.  
Do not print 14% or $0.2M.

Revenue path still assumes DP prices convert and mix grows to 22 accounts by 2029. That path is **more aggressive than the current waterfalls justify**. Flag it as a conversion hypothesis, not as formula output.

## Market arithmetic — corrected

| Layer | Figure | Method |
|---|---|---|
| Account universe | 6,700 | 1,800 utilities + 900 multi-hospital systems + 4,000 campuses / districts that already buy notify or EM |
| Blended attach ACV | $40,000 | Planning blend |
| Full attach universe | **$268M** | 6,700 × $40k |
| Near-term SAM | **$67M** | 25% filter on that universe |
| Y3 SOM | **$1.85M ARR** | 2.8% of near-term SAM |

v0.3’s $220M SAM is retired. It does not reconcile to the stated counts.

Texas beachhead unchanged: about 40 utilities, 25 health systems, 80 campuses in range of Austin.

## Analogue anchors

Veoci: Livermore EM renewal $38,250 (2021); Irvine ~$22k SaaS + $10k impl.  
Everbridge: Vendr median ~$49k; SpendHound SMB ~$13k, enterprise ~$194k; GSA CEM floor ~$150k / 1,000 contacts.  
Sentinel: historical ~£4,500; current G-Cloud **£5,000 per licence/year**.  
GridOS OMS: $0.5–2M+ class. DRS does not price into it.

---

# S18 — MVP and roadmap

**MVP 1 Coordinate — Baseline 2027**  
In: React; phone portrait, phone landscape, desktop landscape; verified roster; needs; inventory; assignments; recipient trace; plan versioning; **last-authorized-plan and assignment cache**; defined bridge into the customer’s SMS / Sentinel / equivalent.  
Out: polling sophistication; simulation engine; deep OMS / HICS ingest; autonomous agents; rebuilt mass-notify.  
Envelope: $620,000. First release $280,000.

**MVP 2 Learn — toward 2030**  
Polling, three-plan scenarios, operational record, replay, readiness metrics.  
$360,000 IA.

**MVP 3 Replay + Readiness enabled — 2030 gate**  
Cross-system ingest, simulation, qualification, persistent memory.  
$480,000 IA.  
2525 remains vision, not this release.

Dates unchanged from v0.3: G2 2027-Q1 · first tabletop 2027-Q3 · first paid DP 2027-Q3/Q4 · eight paying 2028-Q4.

Degraded-comms requirement is in MVP 1 as cache + bridge, not as a Sentinel clone.

---

# S19 — Risks, dependencies, gate

| Risk | I | L | Score | Control |
|---|---|---|---|---|
| Integration burden | 4 | 4 | 16 | Pointer + CSV, one NBA |
| Identity / unofficial responders | 5 | 3 | 15 | IdP + manual verify + rank |
| Procurement cycle | 3 | 5 | 15 | DP MSA |
| Storm Manager “we already do this” | 5 | 3 | 15 | Demo objects Storm Manager does not hold |
| DP price exceeds 12% of modeled value | 4 | 5 | 20 | Show the tension; test spoken WTP; do not hide capture math |
| Panic via transparency | 4 | 3 | 12 | Role views |
| Degraded comms / no broadband | 4 | 4 | 16 | Cache last plan; bridge to Sentinel / SMS; do not assume React reaches the field |
| Healthcare wedge collapses into Veoci | 5 | 3 | 15 | Hold the narrowed wedge |
| CrisisCommand described as partner | 3 | 3 | 9 | “Proposed integration” only |
| PHI / FERPA / CIP bleed | 5 | 2 | 10 | No clinical, education, or BES payload |
| AI treated as commander | 5 | 2 | 10 | Recommend-only |
| Certification claims about CrisisCommand | 3 | 3 | 9 | Confirm SOC 2, HIPAA-eligible, FERPA statements directly before any external use |

Dependencies: proposed CrisisCommand object contract; partner IdP; one NBA; legal review; out-of-band channel owner; SOC 2 path for DRS itself.

## Decision requested

1. Three-segment validation, with industrial as an economic subcase of utility, not a fourth segment.  
2. Three NBA benchmarks.  
3. MVP 1 architecture including cache + comms bridge.  
4. WTP experiments using DP prices as hypotheses and future list as aspiration.  
5. First pilot.  
6. Release $280k of $620k.

## Gate exit

Named buyer. Need in their words. NBA teardown with them in the room. Two differentiators survive. One measured outcome. Spoken WTP. Pilot willing to run beside the NBA. Validation-matrix row filled for that differentiator.

---

# Appendix A — CrisisCommand language rules

Say: proposed complementary integration. Target objects: locked strategy, SITREP pointer, messages.  
Do not say: partnered, partnership, API exists, we ingest their object today.

Confirm directly with CrisisCommand before external publication:

- SOC 2 Type II status and any report date  
- “HIPAA-eligible” versus permission to handle PHI  
- FERPA, FedRAMP, ISO 27001 claims  
- How GPT / model-provider processing works versus “no training”

v0.3’s “report expected H1 2027” and “HEALTH refuses PHI” are **unverified for external use**. Internal working assumption only until confirmed.

CrisisCommand Inc. as a Texas corporation may be used if still accurate on current legal pages.

---

# Appendix B — Interview probes

1. Storm Manager already does crews. Community waterfall models $158k value. $84k DP price is 53% capture. Wrong object, or missing industrial hours?  
2. Plant GM: what is one hour of unsafe-exposure or lost minimum sustainable capacity worth here?  
3. Veoci already connects partners. Regional non-clinical exchange plus public card — buy at $54k, $24k, or no?  
4. Sentinel already blasts and works offline. $22k attach for fulfillment — buy, $10k, or no?  
5. Pre-purchased surge pack versus any event-time invoice — acceptable?  
6. $280k now versus $2.6M Maximize — right gate?

---

# Appendix C — Provenance of v0.4 versus v0.3

Accepted from eXeL parity memo:

1. CrisisCommand labeled proposed integration.  
2. R-CORE logo on S11; SKU renamed Replay + Readiness — powered by R-CORE.  
3. Baseline 2027 / 2030 / 2525 horizon restored.  
4. WTP and CTS columns on S3.  
5. Industrial economic subcase under the same needs segment.  
6. Recipient / beneficiary traceability on differentiator 2.  
7. Degraded-comms cache + partner-channel bridge in MVP 1 and risks.  
8. Healthcare wedge narrowed.  
9. Waterfalls rebuilt as volume × unit × delta × frequency × confidence with A/B/C grades.  
10. DP prices = WTP hypotheses; higher prices = future list aspiration. Capture math shown, not hidden.  
11. NPV $0.16M, IRR ~20%, SAM $67M near-term / $268M universe. $220M and 14% retired.  
12. Sentinel G-Cloud £5,000 current versus £4,500 historical.  
13. Event burst replaced by pre-purchased surge pack and annual incident allowance.  
14. S16 validation matrix.  
Plus: CrisisCommand certification language quarantined pending confirmation. ORNL $121B in 2024 added as context only.

---

End of v0.4 canonical writeup.
