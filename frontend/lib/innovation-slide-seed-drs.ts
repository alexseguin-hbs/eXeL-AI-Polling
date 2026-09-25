// v1.0 ONE PLATFORM (operator 2026-09-24 · docs/asks/2026-09-24_prj34_asm_review_single_platform.md + the twelve-lens review, docs/assessments/2026-09-24_prj34_asm_business_case_review.md):
// the future state is ONE platform — CrisisCommand.ai carries every aspect of the benchmark's critical-event job (Everbridge 360 AI / Bridge) inside the governed
// leadership record, absorbed by qualification (2027 reachable · 2030 native, function by function, one-ninth gate, alerting last and certified · 2525 humanity's
// shared crisis memory). The v0.9 text below is read under that decision; "layer above, replace none" is retired on every slide.
/**
 * SLIDE_SEED_DRS — the S1–S18 deck for PRJ-34 · Project 34 — CrisisCommand Future State.
 * ======================================================================================
 * HUMAN-AUTHORED STRATEGY. Slide source of record: `CC_Future_State_S1-S19_v0.9_eXeL.md` (the eXeL AI gate manuscript v0.9
 * FUTURE-STATE CLEAN, 23 Sep 2026); meaning parent: `CC_Future_State_NARRATIVE_v0.9.md` (Grok); S16 / S19 detail from v0.8.2
 * where a slide needs the full matrix. All three persisted in docs/drs/sources/PRJ-34_drop/canonical/ (sha256 recorded); the
 * decisions where the two v0.9 inputs disagree are in docs/asks/2026-09-24_prj34_v09_final_inputs.md. The v0.4 / v0.5 DRS-attach
 * exploration is RETIRED and archived; nothing from it is carried here.
 *
 * Deck build rules (v0.9): future-state first; current state only to avoid re-selling an existing capability as new or to set
 * the boundary versus the NBA; EXACTLY these primary NBA pairings on the main slides — EDU → Rave Mobile Safety / Rave Alert ·
 * FOOD → Everbridge 360 AI / Bridge · TECH → PagerDuty (composite stacks belong in speaker notes — the `ai` cells — and interview
 * discovery); never Utility / GridOS, Healthcare / Veoci, Campus / Sentinel as the primary three; no old DRS pricing or financials;
 * no Coordinate SKU; no universal physical-resource fulfillment; never claim CrisisCommand saves technical restoration minutes;
 * $/minute internal until customer inputs validate it; R-CORE is architecture, not a SKU; human authority explicit on every
 * governance / AI slide. `hi` = the v0.9 text; `ai` = hi + a speaker-note line — a superset, never a reinterpretation.
 *
 * Commercial spine and live sectors: v0.8.2 and the Grok narrative (live-product verification 23 Sep 2026) say Pro Team → Pro
 * Enterprise and six live Industry Knowledge Bases; the eXeL v0.9 manuscript reads CORE / PRO / ENTERPRISE and three live PRO
 * sectors. The sandbox cannot re-verify, so the deck carries the verified reading and says CONFIRM before external use.
 *
 * Provenance footer on every slide (rendered by the deck from `Project.provenance`):
 *   Human-authored strategy · AI-assisted synthesis by eXeL AI · cross-review informed by Grok · final authority:
 *   De-Risking Strategies / Human Intelligence · v0.9
 */
import type { SlideSeed } from "./innovation-data";

const MOTTO = "Humanity decides. Technology assists. Trust must be proven.";
const MASTER_Q = "Master question (G2): can CrisisCommand prove that ONE human-governed platform — the leadership record plus, by qualification, every aspect of the benchmark's critical-event job — creates measurable incremental value above Everbridge 360 AI / Bridge in FOOD, Rave in EDU and PagerDuty in TECH, on a pre-registered clock, with a named human on every consequence?";
const LOOP = "Operational truth in → human judgment → approved action out → evidence back → learning compounds.";
const CONFIRM = "CONFIRM with CrisisCommand before external use: v0.8.2 and the Grok narrative read Pro Team → Pro Enterprise with six live Industry Knowledge Bases (EDU · FOOD · TECH · RETAIL · HEALTH · FIN); the eXeL v0.9 manuscript reads CORE / PRO / ENTERPRISE with EDU · FOOD · TECH live and Healthcare / Retail / Manufacturing / Finance upcoming.";
const PROV = "Human-authored strategy · AI-assisted synthesis by eXeL AI · cross-review informed by Grok · twelve-lens review 2026-09-24 · final authority: De-Risking Strategies / Human Intelligence · v1.0 · rev 0.058";

export const SLIDE_SEED_DRS: SlideSeed = {
  "PRJ-34": {
    // ── Pod S1 Executive Summary ← v0.9 S1 + S3 one sentence ─────────────────────────────────────────────
    S1: {
      oneline: {
        // 0.008 (D10) · the linked value proposition above this cell already prints the master sentence (D6); this line adds the loop and the ladder — no cell repeats another on the same slide.
        hi: "The operating loop: operational truth → executive judgment → approved decision → named action → evidence → stakeholder response → replay → improvement. The ladder: govern first (2027) · absorb by the one-ninth gate — a function goes native only after it removes at least a ninth (11.1 %) of the benchmark's baseline on its clock, a floor to qualify (2030) · humanity's shared crisis memory (2525).",
        ai: "The operating loop: operational truth → executive judgment → approved decision → named action → evidence → stakeholder response → replay → improvement. The ladder: govern first (2027) · absorb by the one-ninth gate — a function goes native only after it removes at least a ninth (11.1 %) of the benchmark's baseline on its clock, a floor to qualify (2030) · humanity's shared crisis memory (2525). The one sentence above (the linked value proposition, D6) is the master statement, printed once on this slide: CrisisCommand.ai is the one human-governed crisis platform where an institution's leaders see the facts, decide with named authority, alert and act, hold every stakeholder to one approved posture, prove what was done, and learn — so the next crisis begins from the last one's record, never from a blank page. " + MOTTO,
      },
      segment: {
        hi: "Benchmark: Everbridge 360 AI / Bridge.",
        ai: "Three needs-based segments, one primary NBA (Next Best Alternative) each: EDU → Rave Mobile Safety / Rave Alert · FOOD → Everbridge 360 AI / Bridge · TECH → PagerDuty. Validation sequence EDU → FOOD → TECH — not a TAM ranking. Speaker note — the customer's broader stack still matters in interviews: EDU Rave / Everbridge + emergency plans + cabinet process + Teams / email + external counsel · FOOD Everbridge / CEM + recall / quality / ERP + legal counsel + PR agency + manual cross-functional work · TECH PagerDuty + observability / security / status + Slack / Teams + manual exec / comms layer. Sentinel is discovery-only on EDU unless a named buyer has it in the stack.",
      },
      market: {
        hi: [
          ["1 · Trust & Governance Under Pressure", "EDU — first proof", "Rave", "Rave protects and communicates; CrisisCommand decides, approves, owns"],
          ["2 · Product Safety & Recall", "FOOD — second proof", "Everbridge 360 AI / Bridge", "Everbridge coordinates the event; CrisisCommand governs the judgment"],
          ["3 · Digital Trust Under Technical Pressure", "TECH — scale-potential", "PagerDuty", "PagerDuty runs the incident; CrisisCommand runs leadership's response"],
        ],
        ai: [
          ["1 · Distributed Institutional Trust & Governance Under Pressure", "EDU — first proof", "Rave Mobile Safety / Rave Alert", "Rave coordinates campus safety and emergency communication; CrisisCommand governs executive judgment, posture, approval, stakeholder strategy, learning"],
          ["2 · Product Safety, Recall & Consumer Trust Under Pressure", "FOOD — second proof", "Everbridge 360 AI / Bridge", "Everbridge coordinates critical-event response and continuity; CrisisCommand governs enterprise judgment across brand, legal, regulatory, customer, franchisee, employee, investor consequences"],
          ["3 · Digital Revenue & Trust Under Technical Pressure", "TECH — scale-potential", "PagerDuty", "PagerDuty runs the technical incident; CrisisCommand governs the executive / business response to what it means"],
          ["Market model (S17 reset)", "per needs-based segment", "reachable accounts × validated annual value × realistic conversion = serviceable opportunity", "no old DRS prices, SAM, SOM, NPV, IRR or CTS"],
        ],
      },
      strategy: {
        hi: [
          "Thesis: ONE platform. CrisisCommand.ai carries every aspect of the benchmark's critical-event job — alert, workflow, continuity, risk feed — inside the governed leadership record.",
          "Validate ten deltas: decision rights · approval state · action ownership · acknowledgement · evidence · current-plan state · cross-system context · outcome-linked replay · time-to-coherence · simulation. The economic lens stays internal (S14 / S15).",
        ],
        ai: [
          "Thesis: ONE platform — CrisisCommand.ai carries every aspect of the benchmark's critical-event job (Everbridge 360 AI / Bridge: risk intelligence, emergency communications, incident workflow, coordinated action, continuity) inside the governed leadership record, absorbed by qualification: govern first (2027), absorb function by function only after each beats the benchmark on its pre-registered clock by the one-ninth gate (2030), life-safety alerting last and certified.",
          "Delta to validate: explicit decision rights · approval state · action ownership linked to approved decisions · acknowledgement · execution evidence · formal current-plan state · selected operational context from specialist systems · outcome-linked replay · time-to-coherence measurement · risk / outcome simulation.",
          "Economic lens stays internal: time-to-coherence is the metric; the $/minute formula lives in S14 / S15 — never a savings claim on this slide. Do not claim CrisisCommand saves technical restoration minutes.",
          "Not a second DRS application. Do not reintroduce the retired DRS-attach trio (utility / healthcare / campus beside their operational NBAs) as the primary three, old DRS pricing or financials, a Coordinate SKU, or universal physical-resource fulfillment.",
        ],
      },
      ask: {
        hi: "G2 ask (G2 · G3 are the two validation gates — G2 approves the measurement design, G3 runs the instrumented A/B): approve the three segment teardowns — an NBA is a segment's Next Best Alternative, the primary competitor a buyer would use instead, shown in the market table — with buyer interviews, the EDU measurement-design tabletop, workflow prototypes, segment value equations, CTS discovery — CTS is what CrisisCommand spends to serve a customer, the cost a validated price must clear — and S16 evidence tracking; G3 A/B simulation only after the G2 measurement design is credible.",
        ai: "G2 ask (G2 · G3 are the two De-Risking Strategies validation gates — G2 approves the measurement design, G3 runs the instrumented A/B): approve 1 EDU / Rave teardown + buyer interviews + measurement-design tabletop · 2 FOOD / Everbridge 360 AI / Bridge teardown + buyer interviews · 3 TECH / PagerDuty teardown + buyer interviews · 4 future-state workflow prototypes · 5 segment-specific value equations · 6 CrisisCommand-specific CTS (cost-to-serve) discovery · 7 S16-style evidence tracking · 8 G3 A/B simulation only after the G2 measurement design is credible. " + MASTER_Q + " G2 exit: buyer confirms the need · primary NBA confirmed · current-state baseline confirmed · at least two future-state deltas survive comparison · measurable clock defined · economic weight can be sourced · CTS path understood · pilot willingness exists.",
      },
    },
    // ── Pod S2 Project Overview ← v0.9 S2 + S18 ──────────────────────────────────────────────────────────
    S2: {
      status: {
        hi: "G2 / future-state validation · customer-facing product CrisisCommand.ai · internal innovation method De-Risking Strategies / Project 34 · edition v1.0 ONE PLATFORM (operator 2026-09-24 + the twelve-lens review) over the v0.9 gate manuscript (eXeL) and the v0.9 narrative (Grok); v0.8.2 for S16 / S19 detail; v0.4 / v0.5 retired · rev 0.058 · decision register D1–D60 and the iteration ledger in docs/drs (append-only).",
        ai: "G2 / future-state validation · customer-facing product CrisisCommand.ai · internal innovation method De-Risking Strategies / Project 34 · edition v1.0 ONE PLATFORM (operator 2026-09-24 + the twelve-lens review) over the v0.9 gate manuscript (eXeL) and the v0.9 narrative (Grok); v0.8.2 for S16 / S19 detail; v0.4 / v0.5 retired · rev 0.058 · decision register D1–D60 and the iteration ledger in docs/drs (append-only). " + PROV,
      },
      roadmap: {
        hi: [
          "Today: Understand → Structure → Align → Communicate → Manage → Prepare / Simulate.",
          "Future extension: Understand → Judge → Align → Approve → Assign → Acknowledge → Communicate → Observe → Replay → Improve.",
          "Horizon 1 (2027) Governed Leadership State, native · Horizon 2 (→ 2030) the critical-event surface absorbed under the one-ninth (11.1 %) gate, alerting last · Horizon 3 Enterprise Decision Graph · Horizon 4 Recursive Readiness (2525).",
          "Gates: G2 validates the measurement design (interviews, NBA teardown, prototype, one pre-registered EDU tabletop) · G3 runs the instrumented A/B.",
        ],
        ai: [
          "Today: Understand → Structure → Align → Communicate → Manage → Prepare / Simulate.",
          "Future extension: Understand → Judge → Align → Approve → Assign → Acknowledge → Communicate → Observe → Replay → Improve.",
          "Horizon 1 (2027) Governed Leadership State, native, with every benchmark function reachable from inside the platform · Horizon 2 (→ 2030) the critical-event surface absorbed function by function under the one-ninth (11.1 %) gate, alerting last · Horizon 3 Enterprise Decision Graph · Horizon 4 Recursive Readiness (2525).",
          "Gates: G2 validates the measurement design (interviews, NBA teardown, prototype, one pre-registered EDU tabletop) · G3 runs the instrumented A/B.",
          "Validation sequence 1 EDU · 2 FOOD · 3 TECH — a sequence, not a market-size ranking.",
        ],
      },
      toprisks: {
        hi: [
          "Absorbing the benchmark's surface before the leadership proof (Everbridge-lite); life-safety alerting liability inside one platform.",
          "Existing CrisisCommand features are presented as future.",
          "$/minute becomes false precision; simulation becomes theater.",
          "Old DRS resource thesis returns; a new SKU invented before WTP (willingness to pay) evidence.",
          "AI appears to command once the platform sends and tasks; single-platform concentration during the event; segment sprawl.",
        ],
        ai: [
          "Absorbing the benchmark's surface before the leadership proof — govern first, absorb function by function only after each beats the benchmark on its clock by the one-ninth gate; life-safety alerting absorbed last, delivery-guaranteed and certified, partnered rails under a named human until then.",
          "Existing CrisisCommand features are presented as future — separate current foundation from future-state deltas.",
          "$/minute becomes false precision — buyer-verified inputs and attribution; simulation becomes theater — pre-register timing, risk and outcome metrics.",
          "Old DRS resource thesis returns — physical-resource workflow only if segment evidence proves it; a new SKU invented before WTP (willingness to pay — what a buyer will actually pay) evidence — preserve the current commercial spine until validated.",
          "AI appears to command — every outbound action carries its decision right, a named approver and a timestamp, Manual cadence by default; single-platform concentration — a degraded mode where the approved posture and record survive on any phone and a completed approval is never discarded; segment sprawl — validate EDU / FOOD / TECH first.",
        ],
      },
    },
    // ── Pod S3 Financial — Return ← v0.9 S17 reset + S14 ─────────────────────────────────────────────────
    S3: {
      fincomment: {
        hi: [
          "Financial RESET (v0.9 S17): do not reuse old DRS prices, SAM, SOM, NPV (net present value), IRR or CTS. New market model: reachable accounts × validated annual value × realistic conversion = serviceable opportunity.",
          "Financial model — DECLARED (IA — an internal assumption, not buyer-validated): one Pro Enterprise institution (EDU beachhead; FOOD / TECH analogous) · verified 250 $/min (IA) × 90 leadership-delay minutes removed × 4 events a year = 90 k time value · 30 k discrete avoided cost · 60 k risk-adjusted outcome (range midpoint) → 180 k modeled value per customer-year · 33 % capture (the Pod's default capture fraction) → 60 k annual price.",
          "Ramp (IA): 6 paying accounts in 2027 → 15 · 30 · 60 (2030) → 640 by 2036 (≈ one tenth of the benchmark's installed base) at 60 k, then 120 k a year once the benchmark's functions are native (2031+) = 2,121 account-years, 248 M ten-year revenue, 3-year CAGR (compound annual growth rate) 2027 → 2030 = 115 % — a 10× rise in three years. Resources every year 2026–2036: 11.2 M in total (build 2027–2029, then platform R&D, knowledge base and customer success) — resources exist for the full eleven years (IA). NPV proxy +1.0 M at the G2 weighting (tech med × comm high = 0.18) — positive and non-zero, the Pod's demo model, stated as such; a G3 pass roughly doubles it. The return profile, S10 and S14 derive from this eleven-year record.",
          "Value equation (S14): Verified $/min = direct time-dependent cost ÷ elapsed minutes · Time Value = verified $/min × leadership-delay minutes reduced · Risk-Adjusted Value = (P(loss) (the probability of a loss) before − P(loss) after) × consequence value, ranges only · Modeled Value = Time Value + Discrete Avoided Cost + Risk-Adjusted Outcome Value · Contribution = validated WTP − CrisisCommand-specific CTS.",
          "No price is supported until a buyer validates baseline, delta, economic weight, attribution and willingness to pay.",
        ],
        ai: [
          "Financial RESET (v0.9 S17): do not reuse old DRS prices, SAM, SOM, NPV (net present value), IRR or CTS. New market model: reachable accounts × validated annual value × realistic conversion = serviceable opportunity.",
          "Financial model — DECLARED (IA — an internal assumption, not buyer-validated): one Pro Enterprise institution (EDU beachhead; FOOD / TECH analogous) · verified 250 $/min (IA) × 90 leadership-delay minutes removed × 4 events a year = 90 k time value · 30 k discrete avoided cost · 60 k risk-adjusted outcome (range midpoint) → 180 k modeled value per customer-year · 33 % capture (the Pod's default capture fraction) → 60 k annual price.",
          "Ramp (IA): 6 paying accounts in 2027 → 15 · 30 · 60 (2030) → 640 by 2036 (≈ one tenth of the benchmark's installed base) at 60 k, then 120 k a year once the benchmark's functions are native (2031+) = 2,121 account-years, 248 M ten-year revenue, 3-year CAGR (compound annual growth rate) 2027 → 2030 = 115 % — a 10× rise in three years. Resources every year 2026–2036: 11.2 M in total (build 2027–2029, then platform R&D, knowledge base and customer success) — resources exist for the full eleven years (IA). NPV proxy +1.0 M at the G2 weighting (tech med × comm high = 0.18) — positive and non-zero, the Pod's demo model, stated as such; a G3 pass roughly doubles it. The return profile, S10 and S14 derive from this eleven-year record.",
          "Value equation (S14): Verified $/min = direct time-dependent cost ÷ elapsed minutes · Time Value = verified $/min × leadership-delay minutes reduced · Risk-Adjusted Value = (P(loss) (the probability of a loss) before − P(loss) after) × consequence value, ranges only · Modeled Value = Time Value + Discrete Avoided Cost + Risk-Adjusted Outcome Value · Contribution = validated WTP − CrisisCommand-specific CTS.",
          "No price is supported until a buyer validates baseline, delta, economic weight, attribution and willingness to pay.",
          "Customer-supported inputs only: executive / legal / communications labor · external advisor burn · contact-center surge · directly attributable revenue / transaction exposure · contractual / SLA exposure · incremental operating expense. Never present modeled risk reduction as guaranteed savings.",
        ],
      },
    },
    // ── Pod S4 Customer CONOPS ← v0.9 S5 EDU future-state CONOPS (first proof) ───────────────────────────
    S4: {
      conops: {
        hi: [
          "Event → operational facts.",
          "Strategic exposure.",
          "Objectives.",
          "Leadership options.",
          "Cabinet alignment.",
          "Approved posture — under explicit decision rights.",
          "Named action owners.",
          "Stakeholder strategy → communications → the community answers back.",
          "Acknowledgement / evidence.",
          "Current-plan update.",
        ],
        ai: [
          "Before — institutional context → stakeholder map → governance constraints → decision rights → escalation thresholds → scenario rehearsal.",
          "Event → operational facts (today from Rave / Everbridge; in the one platform, sensed and recorded inside CrisisCommand.ai — the community that receives the alert also answers, and its answers become operational truth).",
          "Strategic exposure — cross-domain.",
          "Objectives.",
          "Leadership options.",
          "Cabinet alignment.",
          "Approved posture — under explicit decision rights.",
          "Named action owners.",
          "Stakeholder strategy → communications synchronized to the approved posture → the community answers back, and its answers enter the record as operational truth (S7; for a public body, through the eXeL Polling API).",
          "Acknowledgement / evidence → current-plan update. After — replay → decisions vs outcomes → stakeholder response → governance lesson → policy / playbook update → next simulation.",
        ],
      },
      future: {
        hi: [
          "Signature outcome (EDU): time from event recognition to one approved institutional posture.",
          "Signature outcome (FOOD): time from material product fact to approved enterprise severity and stakeholder posture.",
          "Signature outcome (TECH): time from technical severity established to approved executive / customer / regulator posture.",
        ],
        ai: [
          "Signature outcome (EDU): time from event recognition to one approved institutional posture.",
          "FOOD CONOPS: operational / quality fact → enterprise severity judgment → cross-domain exposure → objectives → regulator / customer / franchisee / employee / investor posture → executive approval → named actions → synchronized communications → evidence / acknowledgement → current-plan update. Signature: time from material product fact to approved enterprise severity and stakeholder posture.",
          "TECH CONOPS: PagerDuty / security fact → business exposure → objectives → legal / regulatory / customer / investor implications → executive options → approved posture → named non-technical actions → stakeholder communications → evidence / acknowledgement → plan update as technical state changes. Signature: time from technical severity established to approved executive / customer / regulator posture.",
          "Do not claim CrisisCommand reduces technical outage duration unless causality is proven.",
          "Worked event (IA, EDU — derived from the S3 inputs, re-derived when they move; D13): A — benchmark alone: minute 0 event recognised · 3 campus alert out · 20 cabinet convened · 55 facts agreed · 95 objectives · 130 approved posture · 150 first stakeholder release. B — the one platform: minute 0 · 10 facts on the record · 20 objectives · 40 approved posture under a named decision right · 45 release with a named owner · 50 acknowledgement. 90 leadership-delay minutes removed × 250 $/min = 22.5 k time value an event; four events a year = the 90 k on S3. An assumption until the G2 tabletop stamps real clocks — never a promise.",
          "Stop rule for the worked event (IA, pre-registered before the G2 tabletop; D14): the null is no delta beyond the one-ninth gate on the primary clock — fewer than 15 of the benchmark's 130 minutes removed — and a failed null withdraws the example from the deck; whatever the independent timekeeper stamps, more or fewer than the assumed 90, replaces it on S3 and the ramp re-reads the result (D13). The gate is a floor for claiming any delta, never a target.",
          "Worked event (IA, FOOD — the single-customer baseline (D13) on a second clock, the same declared inputs read again, not a second number; D15): on FOOD's clock — material product fact → approved enterprise severity / recall posture — benchmark alone reaches an approved posture at minute 130, the one platform at minute 40; 90 leadership-delay minutes removed × 250 $/min = 22.5 k an event, four events the same 90 k on S3. The method, not the outcome: one baseline, two clocks (EDU and FOOD), each re-derived when the inputs move and held to the same null and stop rule (D14). An assumption until the FOOD buyer interview stamps real clocks, never a promise.",
          "Worked event (IA, TECH — the single-customer baseline (D13) on a third clock, the same declared inputs read again, not a third number; D16 closes the per-segment set): on TECH's clock — technical severity established → approved executive / customer / regulator posture (never technical outage duration) — benchmark alone reaches an approved posture at minute 130, the one platform at minute 40; 90 leadership-delay minutes removed × 250 $/min = 22.5 k an event, four events the same 90 k on S3. The method across all three primary segments: one baseline, three clocks (EDU, FOOD and TECH), each re-derived when the inputs move (D13) and held to the same null and stop rule (D14). An assumption until the TECH buyer interview stamps real clocks, never a promise.",
          "Claim boundary of the worked events (IA, D17): each specimen (EDU · FOOD · TECH) demonstrates the time-value leg only — 90 k of the 180 k modeled value on S3 (250 $/min × 90 leadership-delay minutes × 4 events). The other two legs — 30 k discrete avoided cost and 60 k risk-adjusted outcome — are declared, not worked, and only the buyer interview sizes them. So the 60 k price is not covered by the worked leg alone: 33 % capture of 90 k is ≈ 30 k; the price depends on the two un-worked legs being validated. The deck never presents the worked minutes as the full modeled value or the price — the worked minute is a floor on time value, never the whole case.",
          "Sizing the two un-worked legs (IA, D18): the worked minute sizes only the time-value leg; the discrete avoided cost (30 k) is sized from the buyer's directly-attributable avoided-cost inputs on S14 — advisor burn, message / recall-coordination rework, contact-center / support surge — confirmed in the interview; the risk-adjusted outcome (60 k) is sized from the buyer's (P before − P after) × consequence ranges (S14 / S15), always ranges, never guaranteed savings; both enter through the S11 / S16 validation matrix and the G3 A/B. So the path from the worked ≈ 30 k time-value capture to the full 60 k price is the interview sizing these two legs — the deck names the method, not a new number. An assumption until the buyer stamps it, never a promise.",
          "The financial derivation, closed in one reading (IA, D19): the worked minute is a floor on the time-value leg (D13–D16); that leg captures ≈ 30 k of the 60 k price (D17); the two un-worked legs — discrete avoided cost and risk-adjusted outcome — are sized only by the buyer interview, through the S11 / S16 validation matrix, always as ranges (D18); and no further number, specimen or model line enters the deck until a buyer stamps real clocks and sizes those legs. So the whole S3 model stands as a declared model whose only remaining move is one interview — the reader who wants the case in a sentence needs no more than this line. An assumption until the buyer stamps it, never a promise.",
        ],
      },
    },
    // ── Pod S5 Customer Problem ← v0.9 S3 customer value + S10 competitive whitespace ─────────────────────
    S5: {
      problem: {
        hi: "In a high-pressure incident, leaders across reputation, operations, legal, regulatory, financial, safety and stakeholder domains have no governed layer that turns incident context into aligned executive decisions, governed action, coherent stakeholder response and reusable learning: operational truth lives in specialist systems, judgment happens in meetings, and the record of who decided what, why, who owned it and what happened next is reconstructed afterwards. Two systems — one to respond, one to decide — split the record; the future state is one platform.",
        ai: "In a high-pressure incident, leaders across reputation, operations, legal, regulatory, financial, safety and stakeholder domains have no governed layer that turns incident context into aligned executive decisions, governed action, coherent stakeholder response and reusable learning: operational truth lives in specialist systems, judgment happens in meetings, and the record of who decided what, why, who owned it and what happened next is reconstructed afterwards. Two systems — one to respond, one to decide — split the record; the future state is one platform. The leadership layer answers: what do we know · what does it mean · what matters most now · who has authority to decide · what decision was made · why · who owns the next action · has it been acknowledged or completed · what should each stakeholder hear · what changed · what did the organization learn. A public body steering a public project meets the same governed-decision gap: the people it serves answer through the eXeL Polling API, their answers enter the record as operational truth, and every approved posture and its outcome is replayable by the body that owns it — the same crisis-leadership loop steering strategy → game plan → execution → delivered results, transparent and accountable (IA, after G3, D12 · D27).",
      },
      outcomes: {
        hi: [
          "Establish one strategic picture; define objectives and tradeoffs; know who has authority to decide.",
          "Approve one current posture; assign consequential actions; confirm those actions were accepted or completed.",
          "Keep communications synchronized to the approved posture; understand what changed and why.",
          "Compare decisions with outcomes; improve the next event.",
        ],
        ai: [
          "Establish one strategic picture; define objectives and tradeoffs; know who has authority to decide.",
          "Approve one current posture; assign consequential actions; confirm those actions were accepted or completed.",
          "Keep communications synchronized to the approved posture; understand what changed and why.",
          "Compare decisions with outcomes; improve the next event.",
          "The outcome is not merely faster communication — it is faster time to coherent, approved leadership action with a traceable record.",
        ],
      },
      whys: {
        hi: [
          "EDU: leadership must align safety, governance, legal, communications, reputation, student, parent, faculty, trustee, donor, athletics and community expectations while facts keep changing.",
          "FOOD: a product, quality, contamination, recall, supplier, workforce or brand event rapidly crosses operations, legal, regulatory, customer, franchisee, employee, investor and reputation domains.",
          "TECH: a technical outage, cyber event, data breach, product failure, AI failure or platform incident becomes an enterprise crisis when it creates customer, legal, regulatory, investor, employee, financial and reputation consequences.",
          "Alerts, incident workflows and status pages do not create executive alignment; consequential message and action forks are the symptom.",
        ],
        ai: [
          "EDU: leadership must align safety, governance, legal, communications, reputation, student, parent, faculty, trustee, donor, athletics and community expectations while facts keep changing.",
          "FOOD: a product, quality, contamination, recall, supplier, workforce or brand event rapidly crosses operations, legal, regulatory, customer, franchisee, employee, investor and reputation domains.",
          "TECH: a technical outage, cyber event, data breach, product failure, AI failure or platform incident becomes an enterprise crisis when it creates customer, legal, regulatory, investor, employee, financial and reputation consequences.",
          "Alerts, incident workflows and status pages do not create executive alignment; consequential message and action forks are the symptom.",
          "A crisis has multiple clocks: event → leadership activation · activation → objectives · objectives → approved posture · posture → named action owner · approval → stakeholder release · material change → revised approved posture.",
        ],
      },
      statusquo: {
        hi: [
          "EDU — Rave is strong at alert → safety communication → responder / community coordination; CrisisCommand future state: judge → align → approve → govern posture → learn.",
          "FOOD — Everbridge 360 AI / Bridge is strong at risk intelligence → continuity → response workflow → coordinated action → operational improvement; CrisisCommand: enterprise judgment → stakeholder tradeoffs → executive approval → governed posture → outcome-linked replay.",
          "TECH — PagerDuty is strong at detect / mobilize → remediate → status → technical stakeholder updates; CrisisCommand: interpret business consequence → align executives → approve enterprise posture → govern external stakeholder strategy → learn.",
          "Not unique by themselves: better decisions · AI advisor · continuous improvement · crisis management · executive dashboards · alerts · tasks · locked plans.",
        ],
        ai: [
          "EDU — Rave is strong at alert → safety communication → responder / community coordination; CrisisCommand future state: judge → align → approve → govern posture → learn.",
          "FOOD — Everbridge 360 AI / Bridge is strong at risk intelligence → continuity → response workflow → coordinated action → operational improvement; CrisisCommand: enterprise judgment → stakeholder tradeoffs → executive approval → governed posture → outcome-linked replay.",
          "TECH — PagerDuty is strong at detect / mobilize → remediate → status → technical stakeholder updates; CrisisCommand: interpret business consequence → align executives → approve enterprise posture → govern external stakeholder strategy → learn.",
          "Not unique by themselves: better decisions · AI advisor · continuous improvement · crisis management · executive dashboards · alerts · tasks · locked plans.",
          "Fences (speaker note): 'Our NBA is Everbridge' — for EDU and FOOD Everbridge is part of the stack; the rest of the job is cabinet, counsel, QMS or recall. 'Our NBA is PagerDuty' — only for the TECH need and only the technical half. 'Our NBA is Sentinel' — only if that campus runs Sentinel. 'Lead with the utility / healthcare operational systems' — that was the retired DRS physical-coordination thesis, not this future state.",
        ],
      },
    },
    // ── Pod S6 Product Summary ← v0.9 S11 architecture + S3 product boundary + S2 foundation ─────────────
    S6: {
      problem: {
        hi: [
          "Product boundary, future state: ONE platform. CrisisCommand.ai carries every aspect of the benchmark's critical-event job inside the governed leadership record, absorbed by qualification (2027 reachable · 2030 native, alerting last and certified). Not a recall, clinical-record or physical-resource system: those facts arrive by pointer and never become the platform's.",
          "Current foundation (do not re-sell as new): the live crisis workflow — facts / objectives · stakeholder analysis · message development · SITREPs (situation reports) · planning · sector intelligence · organization-specific context · continuous learning.",
        ],
        ai: [
          "Product boundary, future state: ONE platform. CrisisCommand.ai carries every aspect of the benchmark's critical-event job — risk intelligence, emergency communications, incident workflow, coordinated action, continuity — inside the governed leadership record, absorbed by qualification (2027 reachable from inside the platform · 2030 native, function by function, alerting last and certified). Not a recall / quality system, a clinical-record system or a physical-resource system: those facts arrive by pointer and never become the platform's.",
          "Current foundation (do not re-sell as new): structured crisis workflow · facts / intake · objectives · stakeholder analysis · message development · pressure testing · SITREPs (situation reports) · near-term planning · sector intelligence · case / scenario libraries · organization-specific enterprise context · historical / continuous learning.",
          "Also live per the narrative: Ongoing Management · Action Checklist · crisis-team roles · Escalation Watchpoints · decision tracking · Document & Version Management · Plan Mode · Simulate Mode · Organizational Context · institutional memory. HEALTH is not a PHI / HIPAA system of record (current-state external boundary). " + CONFIRM,
        ],
      },
      conops: {
        hi: [
          "Architecture — 1 Operational Context (INPUT): selected facts / status from the operational systems of record (Rave · Everbridge · PagerDuty), absorbed by qualification → 2 CrisisCommand (LEADERSHIP GOVERNANCE): decision rights · approvals · rationale · action owners · current-plan state → 3 Execution (OUTPUT): approved actions route to operational systems, tools and human owners → 4 Evidence + Learning (RETURN): acknowledgement · evidence · outcome · replay.",
          LOOP,
        ],
        ai: [
          "Architecture — 1 Operational Context (INPUT): selected facts / status from Rave in EDU, Everbridge / quality / recall systems in FOOD, PagerDuty / security / status systems in TECH, approved human inputs — the operational systems of record today, absorbed into the platform by qualification → 2 CrisisCommand (LEADERSHIP GOVERNANCE) owns: strategic picture · objectives · exposure analysis · stakeholder priorities · executive options · decision rights · approvals · rationale · action owners · current-plan state · communications posture · escalation watchpoints → 3 Execution (OUTPUT): approved actions route to operational systems, collaboration tools, human owners, external communications systems → 4 Evidence + Learning (RETURN): acknowledgement · execution evidence · stakeholder response · outcome · plan revision · replay · readiness implication.",
          LOOP,
          "Future-state objects to validate: decision right · required approver / sign-off · action owner · action acknowledgement · evidence pointer · current-plan state · authority-linked rationale · outcome link · replay result · readiness implication.",
          "Data model of the seven Horizon-1 objects (for builders and integrators): decision right — scope · holder · delegate · succession, written at governance setup · approval — decision id · approver identity (step-up) · timestamp · state, written by the approver · action — owner · due · linked decision, written by the approver · acknowledgement — accepted / started / completed / escalated · timestamp, written by the owner · evidence pointer — source system · reference · classification, written by the owner or an inbound feed · current-plan state — version · approved posture · what changed, written by the platform on approval · replay — decision → outcome link · lesson, written after the event. Sensitive facts arrive as pointers; nothing in the shape is crisis-specific.",
          "Interface shape of the same objects (for integrators, IA — validated in Horizon 1): every object is an addressable, versioned resource — id · event · version · writer (a named human or an inbound feed) · timestamp — read by id or by event, written only by append; a correction is a new version and the earlier one stays readable; the citizen's answer enters through the eXeL Polling API as an evidence pointer, a partner's fact the same way, and neither becomes the platform's data; the export (S18) is the whole record in an open format.",
          "AI recommends and organizes. Humans approve and own consequences.",
        ],
      },
    },
    // ── Pod S7 Customer Workflow ← v0.9 S4 / S6 / S8 needs + narrative buyers ─────────────────────────────
    S7: {
      personas: {
        hi: [
          ["EDU — President / Chancellor / COO / CCO · operating: comms, GC, chief of staff, EM leadership · primary NBA Rave", "One approved institutional posture: what the institution will do, why, who owns it, how it stays coherent as the crisis changes."],
          ["FOOD — COO / CCO / GC / Quality · operating: crisis team, comms, quality, regulatory · primary NBA Everbridge 360 AI / Bridge", "One enterprise posture from unit / product fact to customer and regulator trust decisions."],
          ["TECH — COO / CCO / CISO / CIO / GC · operating: incident leadership, comms, security · primary NBA PagerDuty", "Translate technical incident state into coherent enterprise judgment; named non-technical actions outside the technical response."],
          ["Citizen / recipient — student, parent, customer, employee, community (all segments)", "Hears one human-approved voice in their language, can answer back, and their need enters the record as operational truth (a CASPER-shaped intake — a standard community-assessment record: who · where · what is lacking · severity · who is responsible · time)."],
          ["Principle (all)", "AI recommends and organizes. Humans approve and own consequences."],
        ],
        ai: [
          ["EDU — President / Chancellor / COO / CCO · operating: comms, GC, chief of staff, EM leadership · primary NBA Rave", "One approved institutional posture: what the institution will do, why, who owns it, how it stays coherent as the crisis changes. Broader stack (discovery): Rave / Everbridge + emergency plans + cabinet process + Teams / email + external counsel."],
          ["FOOD — COO / CCO / GC / Quality · operating: crisis team, comms, quality, regulatory · primary NBA Everbridge 360 AI / Bridge", "One enterprise posture from unit / product fact to customer and regulator trust decisions. Broader stack: Everbridge / CEM + recall / quality / ERP + legal counsel + PR agency + manual cross-functional work."],
          ["TECH — COO / CCO / CISO / CIO / GC · operating: incident leadership, comms, security · primary NBA PagerDuty", "Translate technical incident state into coherent enterprise judgment; named non-technical actions outside the technical response. Broader stack: PagerDuty + observability / security / status + Slack / Teams + manual exec / comms layer."],
          ["Citizen / recipient — student, parent, customer, employee, community (all segments)", "Hears one human-approved voice in their language, can answer back, and their need enters the record as operational truth (a CASPER-shaped intake — a standard community-assessment record: who · where · what is lacking · severity · who is responsible · time); stakeholder posture in every language, data resident in the customer's region."],
          ["Principle (all)", "AI recommends and organizes. Humans approve and own consequences. " + MOTTO],
          ["Measure per segment", "Need intensity · frequency · NBA satisfaction · leadership consequence · WTP · CTS · integration burden · sales cycle · repeatability — after interviews, replace hypotheses with evidence."],
        ],
      },
      desired: {
        hi: "Every approved decision carries who may decide it, its sign-off state, the named owner, an acknowledgement (accepted / started / completed / escalated), an evidence pointer and the versioned current-plan state — so the record answers what changed, why, who approved, and what happened next.",
        ai: "Every approved decision carries who may decide it, its sign-off state, the named owner, an acknowledgement (accepted / started / completed / escalated), an evidence pointer and the versioned current-plan state — so the record answers what changed, why, who approved, and what happened next. Understand → Judge → Align → Approve → Assign → Acknowledge → Communicate → Observe → Replay → Improve.",
      },
    },
    // ── Pod S8 Competition + Value ← v0.9 S3 value prop + S4 / S6 / S8 NBAs + S10 + S13 ──────────────────
    S8: {
      vprop: {
        hi: "CrisisCommand.ai is the one human-governed crisis platform where an institution's leaders see the facts, decide with named authority, alert and act, hold every stakeholder to one approved posture, prove what was done, and learn — so the next crisis begins from the last one's record, never from a blank page.",
        ai: "CrisisCommand.ai is the one human-governed crisis platform where an institution's leaders see the facts, decide with named authority, alert and act, hold every stakeholder to one approved posture, prove what was done, and learn — so the next crisis begins from the last one's record, never from a blank page. Positioning per segment — Rave helps the institution protect and communicate with the campus; CrisisCommand helps leadership decide what the institution will do, why, who owns it, and how that posture stays coherent as the crisis evolves. · Everbridge coordinates the critical event and continuity response; CrisisCommand governs the leadership judgment around what the event means for the enterprise and its stakeholders. · PagerDuty runs the technical incident; CrisisCommand runs leadership's response to what that incident means for the enterprise.",
      },
      nba: {
        hi: "Platform benchmark: Everbridge 360 AI / Bridge — the only alternative whose surface spans the whole event; the future state carries every aspect of it inside CrisisCommand.ai. Segment comparators: EDU — Rave Mobile Safety / Rave Alert · TECH — PagerDuty (inbound feeds of the platform).",
        ai: "Platform benchmark: Everbridge 360 AI / Bridge (eleven of twelve reviewer lenses; the widest surface, present in the EDU and FOOD stacks, its buyer already believes in one platform). Segment comparators, one per segment. EDU — Rave Mobile Safety / Rave Alert (mass notification · campus emergency communication · safety applications · status / help reporting · emergency coordination · first-responder information · campus-wide warning). FOOD — Everbridge 360 AI / Bridge (risk intelligence · emergency communications · incident-response workflows · coordinated action · business-continuity planning · impact / dependency context · AI-assisted guidance · preparedness-to-response feedback). TECH — PagerDuty (technical incident response · on-call mobilization · response workflows · technical / business-service status · stakeholder incident updates · service visibility · remediation coordination). Speaker note — composite stacks for interview discovery: EDU Rave / Everbridge + emergency plans + cabinet process + Teams / email + external counsel · FOOD Everbridge / CEM + recall / quality / ERP + legal counsel + PR agency + manual cross-functional work · TECH PagerDuty + observability / security / status + Slack / Teams + manual exec / comms layer. Sentinel: discovery-only on EDU unless a named buyer has it in the stack.",
      },
      benefits: {
        hi: [
          "Whitespace EDU (above Rave): executive decision rights · cabinet alignment · governance interpretation · outcome-linked replay.",
          "Whitespace FOOD (above Everbridge): enterprise severity judgment · brand / legal / regulatory tradeoffs · executive decision rights · outcome-linked replay.",
          "Whitespace TECH (above PagerDuty): enterprise meaning of the technical event · reputation / legal / regulatory / financial exposure · executive options and tradeoffs · outcome-linked replay.",
          "Priced as a DECLARED single-customer baseline (IA): 180 k modeled value per customer-year, 60 k captured — rebuilt from buyer-verified inputs at G3 (S14 / S15); no old DRS dollar table is carried.",
        ],
        ai: [
          "Whitespace EDU (above Rave): executive decision rights · cabinet alignment · governance interpretation · stakeholder tradeoffs · approved institutional posture · action ownership · approval / rationale provenance · board / parent / faculty / donor strategy · outcome-linked replay.",
          "Whitespace FOOD (above Everbridge): enterprise severity judgment · brand / legal / regulatory tradeoffs · executive decision rights · stakeholder strategy across customers / regulators / franchisees / employees / investors · approval provenance · one approved enterprise posture · action / message synchronization · outcome-linked replay.",
          "Whitespace TECH (above PagerDuty): enterprise meaning of the technical event · reputation / legal / regulatory / financial exposure · executive options and tradeoffs · decision rights · approval provenance · customer / regulator / investor posture · board-ready current strategy · action ownership outside the technical response · outcome-linked replay.",
          "Priced as a DECLARED single-customer baseline (IA): 180 k modeled value per customer-year, 60 k captured — rebuilt from buyer-verified inputs at G3 (S14 / S15); no old DRS dollar table is carried.",
          "Future-state territory across all three: human-curated sector precedent applied to live judgment · organization-specific context · cross-domain executive exposure · leadership decision rights · approval state · stakeholder strategy · action ownership / acknowledgement · evidence-linked plan state · time-to-coherence · outcome-linked replay. Thought Master test: how many minutes change · what is each verified minute worth · which risk changes as time passes · which observable outcome improves.",
        ],
      },
      features: {
        hi: [
          "1 Explicit decision-right governance.",
          "2 Visible approval / sign-off state.",
          "3 Action ownership tied to approved decisions.",
          "4 Action acknowledgement.",
          "5 Execution evidence.",
          "6 Formal current-plan state.",
          "7 Selected cross-system operational context.",
          "8 Outcome-linked replay · 9 time-to-coherence measurement · 10 risk / outcome simulation.",
        ],
        ai: [
          "1 Explicit decision-right governance.",
          "2 Visible approval / sign-off state.",
          "3 Action ownership tied to approved decisions.",
          "4 Action acknowledgement.",
          "5 Execution evidence.",
          "6 Formal current-plan state.",
          "7 Selected cross-system operational context.",
          "8 Outcome-linked replay · 9 time-to-coherence measurement · 10 risk / outcome simulation.",
          "Preserve, never present as new: structured crisis workflow · facts / objectives · human-curated precedent intelligence · stakeholder mapping · message development · pressure testing · SITREPs · planning · sector knowledge · organization-specific enterprise context · historical / continuous learning.",
        ],
      },
    },
    // ── Pod S11 Prelim Feedback / Validation ← v0.8.2 S16 matrix with the v0.9 primary NBAs ───────────────
    S11: {
      voc: {
        hi: [
          ["0 — EDU · President / CCO / GC", "Alerts ≠ cabinet alignment (primary NBA Rave)", "Minutes event → approved objectives · baseline TBD · target: improve · result empty", "Pursue / pivot / pass"],
          ["0 — EDU · CCO", "Stakeholder rework", "# consequential strategy / message revisions · baseline TBD · target: reduce", "Pursue / pivot / pass"],
          ["0 — FOOD · COO / Quality / CCO", "Facts ≠ enterprise posture (primary NBA Everbridge 360 AI / Bridge)", "Minutes to agreed severity · baseline TBD · target: improve", "Pursue / pivot / pass"],
          ["0 — FOOD · CCO / GC", "Multi-unit forks", "# conflicting approved versions · baseline TBD · target: reduce", "Pursue / pivot / pass"],
          ["0 — TECH · CISO / CCO", "Technical state ≠ business judgment (primary NBA PagerDuty)", "Time severity → approved executive posture · baseline TBD · target: improve", "Pursue / pivot / pass"],
          ["0 — TECH · CCO / GC", "Posture forks", "# contradictory versions · baseline TBD · target: reduce", "Pursue / pivot / pass"],
          ["ALL — economic buyer", "Spoken WTP above CTS + hurdle", "Target: above CTS + hurdle", "Pursue / pivot / pass"],
        ],
        ai: [
          ["0 — EDU · President / CCO / GC", "Alerts ≠ cabinet alignment (primary NBA Rave)", "Minutes event → approved objectives · baseline TBD · target: improve · result empty", "Pursue / pivot / pass"],
          ["0 — EDU · CCO", "Stakeholder rework", "# consequential strategy / message revisions · baseline TBD · target: reduce", "Pursue / pivot / pass"],
          ["0 — FOOD · COO / Quality / CCO", "Facts ≠ enterprise posture (primary NBA Everbridge 360 AI / Bridge)", "Minutes to agreed severity · baseline TBD · target: improve", "Pursue / pivot / pass"],
          ["0 — FOOD · CCO / GC", "Multi-unit forks", "# conflicting approved versions · baseline TBD · target: reduce", "Pursue / pivot / pass"],
          ["0 — TECH · CISO / CCO", "Technical state ≠ business judgment (primary NBA PagerDuty)", "Time severity → approved executive posture · baseline TBD · target: improve", "Pursue / pivot / pass"],
          ["0 — TECH · CCO / GC", "Posture forks", "# contradictory versions · baseline TBD · target: reduce", "Pursue / pivot / pass"],
          ["ALL — economic buyer", "Spoken WTP above CTS + hurdle", "Target: above CTS + hurdle", "Pursue / pivot / pass"],
          ["Also record, every row", "baseline minutes · CC-assisted minutes · Δ minutes · verified $/min · risk at T+15 / 30 / 60 / 120 · observed outcome · attribution confidence", "A = the benchmark alone · B = the one platform", "—"],
        ],
      },
      exp: {
        hi: [
          ["G2 · EDU tabletop (pre-registered)", "The measurement design works: timing, risk and outcome can be measured", "Metrics captured end-to-end; the tabletop does NOT prove economic value", "Empty"],
          ["G3 · A/B", "Same scenario twice — A the benchmark alone (Everbridge 360 AI / Bridge; Rave in EDU, PagerDuty in TECH) vs B the one platform × Conservative / Baseline / Severe; pre-registered hypothesis, null and stop rule; run order counterbalanced; an independent timekeeper stamps every clock", "Measurable delta in timing, risk or outcome: minute-zero trigger, facts available, minutes to objectives / posture / ownership / release, forks, unowned actions, residual risk at T+30 / 60 / 120, hard-dollar time exposure, outcome, replay lesson", "Empty"],
          ["Interviews · all", "Buyer confirms the need and the primary NBA", "Current-state baseline confirmed; at least two future-state deltas survive; measurable clock defined; economic weight sourced", "Empty"],
        ],
        ai: [
          ["G2 · EDU tabletop (pre-registered)", "The measurement design works: timing, risk and outcome can be measured", "Metrics captured end-to-end; the tabletop does NOT prove economic value", "Empty"],
          ["G3 · A/B", "Same scenario twice — A the benchmark alone (Everbridge 360 AI / Bridge; Rave in EDU, PagerDuty in TECH) vs B the one platform × Conservative / Baseline / Severe; pre-registered hypothesis, null and stop rule; run order counterbalanced; an independent timekeeper stamps every clock", "Measurable delta in timing, risk or outcome: minute-zero trigger, facts available, minutes to objectives / posture / ownership / release, forks, unowned actions, residual risk at T+30 / 60 / 120, hard-dollar time exposure, outcome, replay lesson", "Empty"],
          ["Interviews · all", "Buyer confirms the need and the primary NBA", "Current-state baseline confirmed; at least two future-state deltas survive; measurable clock defined; economic weight sourced", "Empty"],
          ["Simulation as proof", "A simulation counts as evidence only if it shows a measurable difference in timing, risk, or outcome", "Pre-registered metrics; no theater", "Empty"],
        ],
      },
      comments: {
        hi: [
          "No differentiator graduates until: the customer names the need · confirms the primary NBA · baseline observed · measurable delta · economic buyer assigns value.",
          "Change-control: future edits require customer, competitive, cost, implementation, or pilot evidence; they enter through this validation matrix, not through another model rewrite.",
        ],
        ai: [
          "No differentiator graduates until: the customer names the need · confirms the primary NBA · baseline observed · measurable delta · economic buyer assigns value.",
          "Change-control: future edits require customer, competitive, cost, implementation, or pilot evidence; they enter through this validation matrix, not through another model rewrite.",
          "Primary clocks: EDU event → president / cabinet approved posture (do not monetize student or public safety itself) · FOOD material product fact → enterprise severity / recall posture approved · TECH technical severity established → executive / customer / regulator posture approved (never technical outage duration).",
        ],
      },
    },
    // ── Pod S12 Go-To-Market ← v0.9 S17 commercial + S18 sequence ────────────────────────────────────────
    S12: {
      l90: {
        hi: [
          "Preserve the current commercial spine: Pro Team → Pro Enterprise (per the 23 Sep 2026 live-product verification). Do not invent a new named Project 34 SKU before evidence.",
          "Commercial forms follow the ladder: the governed leadership state inside the existing tiers first; each absorbed function priced only after it beats the benchmark on its clock and a buyer validates WTP above CTS.",
        ],
        ai: [
          "Preserve the current commercial spine: Pro Team → Pro Enterprise (per the 23 Sep 2026 live-product verification). Do not invent a new named Project 34 SKU before evidence.",
          CONFIRM,
          "Pro Team — one centralized crisis team / one instance, Live / Plan / Simulate, Organizational Context, sector Knowledge Base. Pro Enterprise — multiple teams / instances, expanded Organizational Context, sector Knowledge Bases by instance, Enterprise Crisis Dashboard announced as coming.",
        ],
      },
      l60: {
        hi: [
          "Future commercial forms to test (customer WTP + CTS determine the form): capability expansion · enterprise integration package · and more — the five candidate forms are itemised in the note.",
          "CTS to measure — the ten cost-to-serve items are itemised on S14 (Resourcing): model / inference · sector intelligence · integrations · support · customer success, and more; measure actual CTS per segment.",
        ],
        ai: [
          "Future commercial forms to test (customer WTP + CTS determine the form): capability expansion in the enterprise tier · enterprise integration package · additional organizational instance · advisor / consultant operating model · event / usage construct.",
          "CTS to measure: model / inference · sector intelligence maintenance · case / scenario maintenance · enterprise context onboarding · security / isolation · integrations · support · customer success · simulation / tabletop support · expert review if included.",
          "'EDU has the lowest CTS' is not a fact — measure actual CTS.",
        ],
      },
      l30: {
        hi: [
          "Validation sequence: 1 EDU — first proof · 2 FOOD — second proof · 3 TECH — scale-potential (per-segment NBA teardown + buyer interviews, the EDU measurement-design tabletop — detail in note).",
          "This is a validation sequence, not a TAM (total addressable market) ranking.",
        ],
        ai: [
          "Validation sequence: 1 EDU — first proof (Rave teardown, buyer interviews, measurement-design tabletop) · 2 FOOD — second proof (Everbridge 360 AI / Bridge teardown, buyer interviews) · 3 TECH — scale-potential (PagerDuty teardown, buyer interviews).",
          "This is a validation sequence, not a TAM (total addressable market) ranking.",
          "Sequence is not TAM. RETAIL, HEALTH and FIN live editions are not in the first validation wave; Utility is archived from the DRS-attach study.",
          "4 PUBLIC BODY — after G3 (IA, D12): the fourth step in the sequence — one government owner, one project through the same loop, its people asked through the eXeL Polling API, the approved posture and the delivered result replayable by the body and by the people who answered; never a claimed customer.",
        ],
      },
      l0: {
        hi: [
          "Financial reset: reachable accounts × validated annual value × realistic conversion = serviceable opportunity; no old DRS prices, SAM, SOM, NPV, IRR or CTS.",
          "Design-partner path for the strongest validated segment; no price until a buyer validates baseline, delta, economic weight, attribution and willingness to pay.",
        ],
        ai: [
          "Financial reset: reachable accounts × validated annual value × realistic conversion = serviceable opportunity; no old DRS prices, SAM, SOM, NPV, IRR or CTS.",
          "Design-partner path for the strongest validated segment; no price until a buyer validates baseline, delta, economic weight, attribution and willingness to pay.",
          "Source trail (v0.9): crisiscommand.ai/products · crisiscommand.ai · Rave / Motorola campus safety and Rave Alert pages · everbridge.com critical-event-management and Bridge · pagerduty.com stakeholder communication and business services.",
          "Public bodies (R-CORE already runs in this repo — decision record, replay, the one-ninth gate, a named human before any machine action): the eXeL Polling API is how a government asks its people and shows them what was decided and why; the citizen's answer enters the record (S4 · S7) and every approved posture and its outcome is replayable by the public body that owns it (S13 · S16 · S17) — strategy → game plan → execution → delivered results, transparent and accountable.",
        ],
      },
    },
    // ── Pod S13 Risk Highlights ← v0.9 S19 risks + gate ──────────────────────────────────────────────────
    S13: {
      tech: {
        hi: [
          ["High", "Single-platform concentration — the platform's own outage during the event it serves", "Degraded mode: the approved posture and the record survive on any phone; a completed approval is never discarded; no AI required to read the plan", "Open"],
          ["Med", "AI appears to command once the platform sends, tasks and releases", "Every outbound action carries its decision right, a named approver and a timestamp; Manual cadence by default, Semi-Automated earned per capability (R-CORE)", "Mitigating"],
          ["Med", "Data / PHI (protected health information) boundary erodes under one platform", "Classify at intake; sensitive facts arrive by pointer and never become the platform's; HEALTH stays outside PHI", "Mitigating"],
          ["Med", "Simulation becomes theater", "Pre-registered hypothesis, null and stop rule; timing, risk and outcome metrics declared before G3", "Mitigating"],
        ],
        ai: [
          ["High", "Single-platform concentration — the platform's own outage during the event it serves", "Degraded mode: the approved posture and the record survive on any phone; a completed approval is never discarded; no AI required to read the plan", "Open"],
          ["Med", "AI appears to command once the platform sends, tasks and releases", "Every outbound action carries its decision right, a named approver and a timestamp; Manual cadence by default, Semi-Automated earned per capability (R-CORE)", "Mitigating"],
          ["Med", "Data / PHI (protected health information) boundary erodes under one platform", "Classify at intake; sensitive facts arrive by pointer and never become the platform's; HEALTH stays outside PHI", "Mitigating"],
          ["Med", "Simulation becomes theater", "Pre-registered hypothesis, null and stop rule; timing, risk and outcome metrics declared before G3", "Mitigating"],
          ["Low", "HEALTH PHI / HIPAA (current-state external boundary)", "Not a PHI / HIPAA system of record; clinical records stay out — never a future feature", "Mitigated"],
        ],
      },
      comm: {
        hi: [
          ["High", "Absorbing the benchmark's surface before the leadership proof (Everbridge-lite)", "Govern first; absorb function by function only after each beats the benchmark on its pre-registered clock by the one-ninth (11.1 %) gate", "Mitigating"],
          ["High", "Life-safety alerting liability inside one platform", "Alerting absorbed last, delivery-guaranteed and certified; partnered rails under a named human until then", "Open"],
          ["Med", "Incumbent retaliation — pointer access cut, a bundled 'leadership module'", "Sell to the C-suite door the incumbents do not hold; own the decision record; partnered rails are optional channels", "Mitigating"],
          ["Med", "New SKU invented before WTP evidence", "Preserve the current commercial spine until validated", "Mitigating"],
          ["Med", "Segment sprawl", "Validate EDU / FOOD / TECH first", "Mitigating"],
        ],
        ai: [
          ["High", "Absorbing the benchmark's surface before the leadership proof (Everbridge-lite)", "Govern first; absorb function by function only after each beats the benchmark on its pre-registered clock by the one-ninth (11.1 %) gate", "Mitigating"],
          ["High", "Life-safety alerting liability inside one platform", "Alerting absorbed last, delivery-guaranteed and certified; partnered rails under a named human until then", "Open"],
          ["Med", "Incumbent retaliation — pointer access cut, a bundled 'leadership module'", "Sell to the C-suite door the incumbents do not hold; own the decision record; partnered rails are optional channels", "Mitigating"],
          ["Med", "New SKU invented before WTP evidence", "Preserve the current commercial spine until validated", "Mitigating"],
          ["Med", "Segment sprawl", "Validate EDU / FOOD / TECH first", "Mitigating"],
          ["Med", "Commercial spine / live-sector list disagree across the v0.9 inputs", "Confirm with CrisisCommand before external use", "Mitigating"],
        ],
      },
      biz: {
        hi: [
          ["High", "Existing CrisisCommand features are presented as future", "Separate current foundation from future-state deltas", "Open"],
          ["Med", "$/minute becomes false precision", "Use buyer-verified inputs and attribution", "Mitigating"],
          ["Med", "Old DRS resource thesis returns", "Physical-resource workflow only if segment evidence proves it", "Mitigating"],
          ["Med", "The record is discoverable — a written rationale is what plaintiffs and regulators subpoena", "Privilege-aware fields and counsel-marked entries as Horizon-1 objects; succession of decision rights and step-up identity for approvers", "Mitigating"],
        ],
        ai: [
          ["High", "Existing CrisisCommand features are presented as future", "Separate current foundation from future-state deltas", "Open"],
          ["Med", "$/minute becomes false precision", "Use buyer-verified inputs and attribution", "Mitigating"],
          ["Med", "Old DRS resource thesis returns", "Physical-resource workflow only if segment evidence proves it", "Mitigating"],
          ["Med", "The record is discoverable — a written rationale is what plaintiffs and regulators subpoena", "Privilege-aware fields and counsel-marked entries as Horizon-1 objects; succession of decision rights and step-up identity for approvers", "Mitigating"],
          ["Low", "Unverified certification language externally", "No SOC 2 date, HIPAA, FERPA, FedRAMP, ISO 27001 or PHI claims unless confirmed with CrisisCommand", "Mitigated"],
        ],
      },
      deps: {
        hi: [
          "G2 exit: buyer confirms the need · primary NBA confirmed · current-state baseline confirmed · at least two future-state deltas survive comparison · measurable clock defined · economic weight can be sourced · CTS path understood · pilot willingness exists.",
          MASTER_Q,
        ],
        ai: [
          "G2 exit: buyer confirms the need · primary NBA confirmed · current-state baseline confirmed · at least two future-state deltas survive comparison · measurable clock defined · economic weight can be sourced · CTS path understood · pilot willingness exists.",
          MASTER_Q,
          "Dependencies: the live CrisisCommand product as the baseline; the benchmark teardown (Everbridge 360 AI / Bridge) and pointer-level access to Rave, quality / recall and PagerDuty / status / security; an EDU buyer for the G2 tabletop.",
          "Public-body dependency (IA, after G3): one government owner for a project steered through the loop — its citizens' answers by the eXeL Polling API, its approved posture and delivered result replayable by the body and by the people it serves; nothing in the record's shape is crisis-specific.",
        ],
      },
    },
    // ── Pod S14 Resourcing ← v0.9 S17 CTS + S15 segment clocks + S18 horizons (no dollars) ───────────────
    S14: {
      fte: {
        hi: [
          ["CTS (CC-specific)", "model / inference", "sector intelligence upkeep", "case / scenario upkeep", "enterprise context onboarding"],
          ["CTS (CC-specific)", "security / isolation · integrations", "support · customer success", "simulation / tabletop support", "expert review if included"],
          ["Rule", "CTS is product-finance evidence", "not an old DRS import", "no price until WTP clears CTS + hurdle", "measure actual CTS per segment"],
        ],
        ai: [
          ["CTS to measure (CC-specific)", "model / inference", "sector intelligence maintenance", "case / scenario maintenance", "enterprise context onboarding"],
          ["CTS to measure (CC-specific)", "security / isolation · integrations", "support · customer success", "simulation / tabletop support", "expert review if included"],
          ["Rule", "CTS is product-finance evidence", "not an old DRS import", "no price until WTP clears CTS + hurdle", "measure actual CTS per segment"],
          ["Team (DECLARED, not in v0.9)", "product + design", "engineering (light-integration pointers)", "sector knowledge-base curation", "customer success / tabletop facilitation"],
          ["Build calendar (IA — reads the eleven-year spend, D13)", "2026 · 0.6 M — measurement design, the G2 tabletop", "2027 · 1.2 M — the seven objects native, the G3 A/B, the first six accounts", "2028–2030 · 1.2 → 1.0 M a year — absorb function by function under the one-ninth gate, alerting last", "2031–2036 · 1.0 M a year — platform tier, knowledge base, customer success"],
        ],
      },
      ftedollar: {
        hi: [
          ["EDU clock", "event → approved president / cabinet posture", "inputs: leadership / legal / comms labor · advisors · message rework · stakeholder load", "do not monetize student or public safety itself"],
          ["FOOD clock", "material product fact → approved enterprise severity / recall posture", "inputs: leadership / legal / comms labor · advisor burn · recall rework · attributable exposure", "ranges, never guaranteed savings"],
          ["TECH clock", "technical severity established → approved executive / customer / regulator posture", "inputs: leadership / legal / comms labor · support surge · advisor burn · attributable / SLA (service-level agreement) exposure", "never technical restoration minutes"],
        ],
        ai: [
          ["EDU clock", "event → approved president / cabinet posture", "inputs: executive / legal / communications labor · advisor cost · message rework · parent / stakeholder response load · operational disruption tied to leadership delay", "do not monetize student or public safety itself"],
          ["FOOD clock", "material product fact → approved enterprise severity / recall posture", "inputs: leadership / legal / communications labor · advisor burn · recall coordination rework · franchisee / customer-support load · attributable unit / line / store exposure", "ranges, never guaranteed savings"],
          ["TECH clock", "technical severity established → approved executive / customer / regulator posture", "inputs: executive / legal / communications labor · support surge · advisor burn · directly attributable transaction / revenue exposure · contractual / SLA (service-level agreement) exposure where leadership delay matters", "never technical restoration minutes"],
          ["Time-to-coherence clocks (all)", "event → leadership activation · activation → objectives · objectives → approved posture · posture → named action owner · approval → stakeholder release · material change → revised approved posture", "Time Value = verified $/min × leadership-delay minutes reduced", "Risk-Adjusted Value = (P before − P after) × consequence, ranges"],
        ],
      },
      notes: {
        hi: [
          "Horizon 1 — Governed Leadership State: decision rights · approval state · action ownership · acknowledgement · evidence · governed current-plan state · outcome-linked replay.",
          "Horizon 2 — Absorb by qualification: every benchmark function reachable from inside the platform first, then native function by function only after each beats the benchmark on its pre-registered clock by the one-ninth (11.1 %) gate; alerting last and certified.",
        ],
        ai: [
          "Horizon 1 — Governed Leadership State: decision rights · approval state · action ownership · acknowledgement · evidence · governed current-plan state · outcome-linked replay.",
          "Horizon 2 — Absorb by qualification: every benchmark function reachable from inside the platform first (link, selected structured facts, status, action reference), then native function by function only after each beats Everbridge 360 AI / Bridge on its pre-registered clock by the one-ninth (11.1 %) gate; Rave and PagerDuty facts flow in as inbound feeds; alerting last and certified.",
          "Horizon 3 — Enterprise Decision Graph: decision relationships · shared authority across teams · stakeholder patterns · executive action ownership · recurring crisis themes · multi-instance outcome replay (extends the announced Enterprise Crisis Dashboard, never a claim that cross-instance visibility is new). Horizon 4 — Recursive Readiness: multi-event learning · simulation · qualification · institutional continuity.",
          "Horizon 1 also ships the approver threat model (S13): step-up identity on every consequential sign-off, succession of decision rights when an approver is unreachable, privilege-aware fields for counsel-marked entries — a named human on every consequence is only as strong as the proof of who signed.",
        ],
      },
    },
    // ── Pod S15 BETA Feedback ← v0.9 S16 per-NBA A/B + S18 horizons + S14 ────────────────────────────────
    S15: {
      voc: {
        hi: [
          ["0 — EDU G2 tabletop (pre-registered)", "Decision rights + approval state + action ownership vs Rave", "Minutes event → approved objectives; # consequential revisions — measurement design proven, value not yet", "Pursue — hypothesized"],
          ["0 — FOOD", "Enterprise severity judgment + approval provenance vs Everbridge 360 AI / Bridge", "Minutes to agreed severity; # conflicting approved versions", "Pursue — hypothesized"],
          ["0 — TECH", "Business-consequence interpretation + board-ready current posture vs PagerDuty", "Time severity → approved executive posture; # contradictory versions", "Pursue — hypothesized"],
          ["0 — all", "Outcome-linked replay", "Facts → decision → rationale → action → stakeholder / business outcome, replayed", "Pursue — hypothesized"],
        ],
        ai: [
          ["0 — EDU G2 tabletop (pre-registered)", "Decision rights + approval state + action ownership vs Rave", "Minutes event → approved objectives; # consequential revisions — measurement design proven, value not yet", "Pursue — hypothesized"],
          ["0 — FOOD", "Enterprise severity judgment + approval provenance vs Everbridge 360 AI / Bridge", "Minutes to agreed severity; # conflicting approved versions", "Pursue — hypothesized"],
          ["0 — TECH", "Business-consequence interpretation + board-ready current posture vs PagerDuty", "Time severity → approved executive posture; # contradictory versions", "Pursue — hypothesized"],
          ["0 — all", "Outcome-linked replay", "Facts → decision → rationale → action → stakeholder / business outcome, replayed", "Pursue — hypothesized"],
          ["0 — all", "Time-to-coherence measurement", "Baseline minutes · CC-assisted minutes · Δ · attribution confidence", "Pursue — hypothesized"],
        ],
      },
      prio: {
        hi: [
          ["1", "Horizon 1 — Governed Leadership State", "G2 measurement-design tabletop → G3 instrumented A/B"],
          ["2", "Horizon 2 — Absorb the benchmark's surface by qualification (one-ninth (11.1 %) gate), alerting last", "After the leadership-layer wedge is proven; each function on its own clock"],
          ["3", "Horizon 3 — Enterprise Decision Graph", "2030 horizon"],
          ["4", "Horizon 4 — Recursive Readiness (R-CORE-informed)", "2030 → 2525"],
        ],
        ai: [
          ["1", "Horizon 1 — Governed Leadership State", "G2 measurement-design tabletop → G3 instrumented A/B"],
          ["2", "Horizon 2 — Absorb the benchmark's surface by qualification (one-ninth (11.1 %) gate), alerting last", "After the leadership-layer wedge is proven; each function on its own clock"],
          ["3", "Horizon 3 — Enterprise Decision Graph", "2030 horizon"],
          ["4", "Horizon 4 — Recursive Readiness (R-CORE-informed)", "2030 → 2525"],
          ["5", "Segment-specific workflows (e.g. physical resources) only where segment evidence proves them", "Never universal"],
        ],
      },
      impact: {
        hi: "No price is supported until a buyer validates baseline, delta, economic weight, attribution and willingness to pay. Contribution = validated WTP − CrisisCommand-specific CTS. Old DRS prices are not evidence; customer WTP + CTS determine the commercial form.",
        ai: "No price is supported until a buyer validates baseline, delta, economic weight, attribution and willingness to pay. Contribution = validated WTP − CrisisCommand-specific CTS. Old DRS prices are not evidence; customer WTP + CTS determine the commercial form. Modeled Value = Time Value + Discrete Avoided Cost + Risk-Adjusted Outcome Value, with risk shown as ranges — never as guaranteed savings.",
      },
    },
    // ── Pod S16 Market Performance ← v0.9 S16 simulation as proof + S18 gates ────────────────────────────
    S16: {
      saydo: {
        hi: [
          ["EDU — minutes event → approved objectives / posture (vs Rave)", "S16 A/B", "Measurable delta vs primary NBA", "Empty — no tabletop yet"],
          ["FOOD — minutes to agreed severity / posture (vs Everbridge 360 AI / Bridge)", "S16 A/B", "Measurable delta vs primary NBA", "Empty"],
          ["TECH — time severity → approved executive posture (vs PagerDuty)", "S16 A/B", "Measurable delta vs primary NBA", "Empty"],
          ["ALL — decision / message forks, unowned actions, residual risk at T+30 / 60 / 120", "S16 A/B", "Measurable delta", "Empty"],
          ["ALL — spoken WTP", "S16 matrix", "Above CTS + hurdle", "Empty"],
        ],
        ai: [
          ["EDU — minutes event → approved objectives / posture (vs Rave)", "S16 A/B", "Measurable delta vs primary NBA", "Empty — no tabletop yet"],
          ["FOOD — minutes to agreed severity / posture (vs Everbridge 360 AI / Bridge)", "S16 A/B", "Measurable delta vs primary NBA", "Empty"],
          ["TECH — time severity → approved executive posture (vs PagerDuty)", "S16 A/B", "Measurable delta vs primary NBA", "Empty"],
          ["ALL — decision / message forks, unowned actions, residual risk at T+30 / 60 / 120", "S16 A/B", "Measurable delta", "Empty"],
          ["ALL — spoken WTP", "S16 matrix", "Above CTS + hurdle", "Empty"],
          ["ALL — hard-dollar time exposure, outcome, replay lesson", "S16 A/B", "Recorded per scenario and envelope", "Empty"],
        ],
      },
      plc: {
        hi: [
          ["G2 — measurement-design tabletop (EDU)", "2026-Q4 target (IA)"],
          ["G3 — instrumented benchmark-alone vs one-platform A/B (three institutions per segment, or it is a pilot)", "2027-H1 target (IA)"],
          ["Horizon 1 — Governed Leadership State", "2027"],
          ["Horizons 3 / 4 — Enterprise Decision Graph · Recursive Readiness", "2030"],
        ],
        ai: [
          ["G2 — measurement-design tabletop (EDU)", "2026-Q4 target (IA) — derived from the row's first revenue 2027-Q3 and six paying accounts in 2027 (D12); the date is an assumption until an EDU institution is named"],
          ["G3 — instrumented benchmark-alone vs one-platform A/B (three institutions per segment, or it is a pilot)", "2027-H1 target (IA) — closes before first revenue 2027-Q3 (D12); pre-registered before it starts, or it is not evidence"],
          ["Horizon 1 — Governed Leadership State", "2027"],
          ["Horizons 3 / 4 — Enterprise Decision Graph · Recursive Readiness", "2030"],
          ["2525 — recursive continuity of institutional learning", "vision"],
        ],
      },
      risks: {
        hi: [
          "$/minute false precision — modeled exposure is not a guaranteed saving; buyer-verified inputs and attribution only.",
          "Simulation becomes theater unless timing, risk and outcome metrics are pre-registered and the A/B shows a measurable difference.",
        ],
        ai: [
          "$/minute false precision — modeled exposure is not a guaranteed saving; buyer-verified inputs and attribution only.",
          "Simulation becomes theater unless timing, risk and outcome metrics are pre-registered and the A/B shows a measurable difference.",
          "Attribution: never attribute technical restoration minutes to CrisisCommand without evidence.",
        ],
      },
      counter: {
        hi: [
          "Simulation as a measurement instrument: run the same scenario twice — A the benchmark alone versus B the one platform — across Conservative, Baseline and Severe, pre-registered with a hypothesis, a null and a stop rule.",
          "G2 validates the measurement design; G3 proves the measurable timing / risk / outcome delta.",
        ],
        ai: [
          "Simulation as a measurement instrument: run the same scenario twice — A the benchmark alone versus B the one platform — across Conservative, Baseline and Severe, pre-registered with a hypothesis, a null and a stop rule.",
          "G2 validates the measurement design; G3 proves the measurable timing / risk / outcome delta.",
          "Track minute-zero trigger · facts available · minutes to objectives · minutes to approved posture · minutes to action ownership · minutes to stakeholder release · decision / message forks · unowned actions · residual risk at T+30 / 60 / 120 · hard-dollar time exposure · outcome · replay lesson.",
          "For a public body the same instrument rehearses a policy posture before adoption — its people asked through the eXeL Polling API, the posture approved under named authority, the outcome replayable by the body and by the citizens who answered (IA, after G3, D12); the decision record and replay it needs already run in this repo (R-CORE).",
          "The instrument's null and stop rule, stated (IA, D14): null — no delta beyond the one-ninth gate on the segment's primary clock (S14); stop — a run the independent timekeeper cannot stamp, or whose approver is unreachable beyond the succession of decision rights, is void: recorded with its reason, never averaged into a mean. The S4 worked event is the first example held to this rule.",
        ],
      },
    },
    // ── Pod S17 Post-Launch Development ← v0.9 S12 R-CORE + Thought Master test ──────────────────────────
    S17: {
      voc: {
        hi: [
          ["Post-proof · all segments", "Outcome-linked replay", "Decisions compared with stakeholder / business outcomes across events", "Pursue — hypothesized"],
          ["Post-proof · enterprise tier", "Enterprise Decision Graph", "Extends the announced Enterprise Crisis Dashboard; multi-instance outcome replay", "Pursue — hypothesized"],
        ],
        ai: [
          ["Post-proof · all segments", "Outcome-linked replay", "Decisions compared with stakeholder / business outcomes across events", "Pursue — hypothesized"],
          ["Post-proof · enterprise tier", "Enterprise Decision Graph", "Extends the announced Enterprise Crisis Dashboard; multi-instance outcome replay", "Pursue — hypothesized"],
          ["Post-proof · all", "Risk / outcome simulation", "Primary NBA vs CC under Conservative / Baseline / Severe as the evidence mechanism", "Pursue — hypothesized"],
        ],
      },
      prio: {
        hi: [
          ["2027", "Governed leadership state native — decision rights · approval state · action ownership · acknowledgement · evidence · current-plan state · replay — and every benchmark function reachable from inside the platform: one login, one record", "Horizon 1"],
          ["2030", "The whole critical-event surface native, absorbed function by function under the one-ninth (11.1 %) gate, alerting last and certified; multi-event learning · simulation · readiness qualification · the Enterprise Decision Graph", "Horizons 2–4"],
          ["2525", "Humanity's shared, human-governed crisis memory: every institution's decisions, evidence and outcomes replayable across people, systems and generations in an open record; the affected community a participant, not only a recipient", "Vision"],
        ],
        ai: [
          ["2027", "Governed leadership state native — decision rights · approval state · action ownership · acknowledgement · evidence · current-plan state · replay — and every benchmark function reachable from inside the platform: one login, one record", "Horizon 1"],
          ["2030", "The whole critical-event surface native, absorbed function by function under the one-ninth (11.1 %) gate, alerting last and certified; multi-event learning · simulation · readiness qualification · the Enterprise Decision Graph", "Horizons 2–4"],
          ["2525", "Humanity's shared, human-governed crisis memory: every institution's decisions, evidence and outcomes replayable across people, systems and generations in an open record; the affected community a participant, not only a recipient", "Vision"],
          ["Thought Master test", "How many minutes change? What is each verified minute worth? Which risk changes as time passes? Which observable outcome improves?", "Internal, S14 / S15"],
        ],
      },
      obs: {
        hi: [
          "R-CORE is an architectural influence, not a CrisisCommand SKU. Loop: LIVE EVENT → OBSERVE → LEADERSHIP JUDGMENT → APPROVE → ACT → RECORD → REPLAY → SIMULATE → QUALIFY → IMPROVE.",
          "Absorption is a ladder, not a launch: pilot → replay → qualify → certify → adopt → educate → expand; autonomy is earned per capability, never granted; coordination without domination.",
          "AI recommends and organizes. Humans approve and own consequences. " + MOTTO,
        ],
        ai: [
          "R-CORE is an architectural influence, not a CrisisCommand SKU. Loop: LIVE EVENT → OBSERVE → LEADERSHIP JUDGMENT → APPROVE → ACT → RECORD → REPLAY → SIMULATE → QUALIFY → IMPROVE.",
          "Absorption is a ladder, not a launch: pilot → replay → qualify → certify → adopt → educate → expand; autonomy is earned per capability, never granted; coordination without domination.",
          "AI recommends and organizes. Humans approve and own consequences. " + MOTTO,
          "The future-state operating loop: operational truth → executive judgment → approved decision → named action → evidence → stakeholder response → replay → improvement. Learning compounds.",
          "Public bodies (R-CORE as it already runs here): a government steers a public project through the same loop — strategy → game plan → execution → delivered results — asks its people through the eXeL Polling API, decides with named authority, and shows them what was decided and why; every approved posture and its outcome replayable by the body that owns it and by the citizens it serves. After G3, one public-body pilot on the same record (IA, D12).",
        ],
      },
    },
    // ── Pod S18 End-of-Life — template slide, not in v0.9 — DECLARED under the same boundary ─────────────
    S18: {
      e120: {
        hi: [
          "DECLARED (not in v0.9): retire a governance-state capability only after its successor keeps decision rights, approval state, action ownership, evidence and replay on the record.",
          "Export the decision history, plan versions, evidence and outcome-linked replay to the customer in an open format.",
        ],
        ai: [
          "DECLARED (not in v0.9): retire a governance-state capability only after its successor keeps decision rights, approval state, action ownership, evidence and replay on the record.",
          "Export the decision history, plan versions, evidence and outcome-linked replay to the customer in an open format.",
          "Every absorbed function's data leaves with the customer in the same open export; partnered rails (Rave, PagerDuty, quality / recall, legal) hand back cleanly — the record is the customer's, never the vendor's.",
          "For a public body the export is its citizens' record: opened through the eXeL Polling API so the people who answered can replay what was decided, by whom and why — transparency and accountability outlive the vendor.",
        ],
      },
      e90: {
        hi: [
          "Tier notice; Organizational Context and institutional memory handed over intact.",
          "Absorbed functions and partnered rails retired in the reverse order of absorption; nothing life-critical is switched off without a named successor channel.",
        ],
        ai: [
          "Tier notice; Organizational Context and institutional memory handed over intact.",
          "Absorbed functions and partnered rails retired in the reverse order of absorption; nothing life-critical is switched off without a named successor channel.",
          "Decision rights and approval history exported so authority never reverts to memory.",
        ],
      },
      e60: {
        hi: [
          "Final replay package delivered; the last approved current-plan state archived as a version.",
          "Escalation watchpoints and stakeholder posture closed with a named successor channel.",
        ],
        ai: [
          "Final replay package delivered; the last approved current-plan state archived as a version.",
          "Escalation watchpoints and stakeholder posture closed with a named successor channel.",
          "Data handling per the customer's legal review; no PHI was ever a system of record.",
        ],
      },
      e0: {
        hi: [
          "End-of-life communication to leadership, crisis team and stakeholders through the approved posture.",
          "The last event's replay carried into the successor: the next crisis does not restart from a blank page.",
          "The decision register (D1–D60) and the iteration ledger travel with the record — every key decision, its revision and its author, replayable.",
        ],
        ai: [
          "End-of-life communication to leadership, crisis team and stakeholders through the approved posture.",
          "The last event's replay carried into the successor: the next crisis does not restart from a blank page.",
          "The decision register (D1–D60) and the iteration ledger travel with the record — every key decision, its revision and its author, replayable.",
          PROV,
        ],
      },
    },
  },
};
