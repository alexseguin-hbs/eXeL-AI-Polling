/**
 * SLIDE_SEED_DRS — the S1–S18 deck for PRJ-34 · De-Risking Strategies — Crisis + Resilience.
 * ==========================================================================================
 * HUMAN-AUTHORED STRATEGY, FROZEN. Built from the ONLY slide source — `DRS_Crisis_Resilience_S1-S19_Slide_Manuscript
 * v0.5` (docs/drs/sources/PRJ-34_drop/canonical/, sha256 in PRJ-34_drop.sha256) — mapped onto the Pod's own S1–S18 gate
 * template (the manuscript's nineteen slides fold into the template's eighteen; the mapping is named on every cell group
 * below). `hi` is the manuscript text; `ai` is the same text plus a supporting line the v0.4 canonical parent or the
 * S1–S19 build brief allows in speaker notes — a superset, never a competing edit, never a reinterpretation.
 *
 * Numbers: every figure is an initial assessment (IA) for feedback. The ledger's corrections are the ones printed
 * (NPV $0.16M · IRR ~20% · universe $268M · near-term SAM $67M; the 14% IRR and $220M SAM are retired). CrisisCommand is
 * a proposed complementary integration, never a partner. R-CORE is architecture; the SKU is
 * "Replay + Readiness — powered by R-CORE". Industrial is an economic subcase of Utility / Industrial, not a fourth segment.
 * The [EXT:] substitutions of the external twin are carried in the source and are NOT applied here (INTERNAL deck).
 * The R-CORE logo the brief names for S11 (IMG_9301(2).jpeg) did not reach the session; the S17 cell says so.
 *
 * Provenance footer on every slide (rendered by the deck from `Project.provenance`):
 *   Human-authored strategy · AI-assisted synthesis by eXeL AI · cross-review informed by Grok · final authority:
 *   De-Risking Strategies · v0.5 · IA for feedback
 * Change rule (frozen): no new strategy from model commentary; changes enter through the S16 validation matrix with
 * customer, competitive, cost, implementation or pilot evidence. If a reviewer moves a number, keep the row and strike
 * the old figure — never return a field to blank.
 */
import type { SlideSeed } from "./innovation-data";

const IA = "Initial assessment (IA) for feedback — not a validated price, savings claim, or forecast.";
const MASTER_Q = "Master G2 question: Can DRS prove that verified authority + resource fulfillment + provenance + replay creates enough incremental value beside the customer's existing NBA to support a paid attach product?";
const PROV = "Human-authored strategy · AI-assisted synthesis by eXeL AI · cross-review informed by Grok · final authority: De-Risking Strategies · v0.5 · IA for feedback";

export const SLIDE_SEED_DRS: SlideSeed = {
  "PRJ-34": {
    // ── Pod S1 Executive Summary ← manuscript S1 ───────────────────────────────────────────────────────────────
    S1: {
      oneline: {
        hi: "The coordination layer beside CrisisCommand and specialist ops systems: verify command, see real needs, allocate scarce resources, publish the current plan, replay what happened.",
        ai: "The coordination layer beside CrisisCommand and specialist ops systems: verify command, see real needs, allocate scarce resources, publish the current plan, replay what happened. Thesis: do not replace GridOS, Veoci, Sentinel, or CrisisCommand — coordinate across them. CrisisCommand status: proposed complementary integration, not a signed partnership, not an assumed API.",
      },
      segment: {
        hi: "1. Utility + industrial (one need, two economic subcases) · 2. Healthcare / regional · 3. Campus / fixed site. NBA pairs: GridOS · Veoci Vitals EM · YUDU Sentinel.",
        ai: "1. Utility + industrial (one need, two economic subcases: utility community envelope · petrochemical / manufacturing plant) · 2. Healthcare / regional · 3. Campus / fixed site. NBA pairs: GridOS · Veoci Vitals EM · YUDU Sentinel. Do not create a fourth industrial segment; do not change segment definitions or NBA pairings.",
      },
      market: {
        hi: [
          ["DP-01 Campus · 8–20k population", "Campus / district", "NBA YUDU Sentinel", "Y1 cash hypothesis $42k (IA)"],
          ["DP-02 Health · 3–8 hospitals", "Regional health system", "NBA Veoci Vitals EM", "Y1 cash hypothesis $84k (IA)"],
          ["DP-03 Utility / plant", "IOU / muni or large plant + community envelope", "NBA GE Vernova GridOS", "Y1 cash hypothesis $129k (IA)"],
          ["Book if all three sign", "Target, not forecast", "First paid DP 2027-Q3 / Q4", "$255k cash / $160k ARR (IA)"],
        ],
        ai: [
          ["DP-01 Campus · 8–20k population", "Campus / district", "NBA YUDU Sentinel", "Y1 cash hypothesis $42k (IA)"],
          ["DP-02 Health · 3–8 hospitals", "Regional health system", "NBA Veoci Vitals EM", "Y1 cash hypothesis $84k (IA)"],
          ["DP-03 Utility / plant", "IOU / muni or large plant + community envelope", "NBA GE Vernova GridOS", "Y1 cash hypothesis $129k (IA)"],
          ["Book if all three sign", "Target, not forecast", "First paid DP 2027-Q3 / Q4", "$255k cash / $160k ARR (IA)"],
          ["Market corrected (IA)", "6,700 accounts × $40k = $268M universe", "× 25% = $67M near-term SAM", "Y3 SOM $1.85M = 2.8% of SAM · $220M retired"],
        ],
      },
      strategy: {
        hi: [
          "Thesis: do not replace GridOS, Veoci, Sentinel, or CrisisCommand. Coordinate across them.",
          "Defend only these six: 1 verified authority roster + rank · 2 needs / resources as objects + recipient trace · 3 Plan vN provenance · 4 eXeL advisory intake (not a vote) · 5 Conservative / Baseline / Aggressive plans · 6 Replay + Readiness — powered by R-CORE.",
          "Do not claim: alerts · dashboards · logs · generic messaging · generic AAR · UI · crew logistics · HICS · mass notify · offline docs.",
          "CrisisCommand: proposed complementary integration. Not a signed partnership. Not an assumed API.",
        ],
        ai: [
          "Thesis: do not replace GridOS, Veoci, Sentinel, or CrisisCommand. Coordinate across them.",
          "Defend only these six: 1 verified authority roster + rank · 2 needs / resources as objects + recipient trace · 3 Plan vN provenance · 4 eXeL advisory intake (not a vote) · 5 Conservative / Baseline / Aggressive plans · 6 Replay + Readiness — powered by R-CORE.",
          "Do not claim: alerts · dashboards · logs · generic messaging · generic AAR · UI · crew logistics · HICS · mass notify · offline docs.",
          "CrisisCommand: proposed complementary integration. Not a signed partnership. Not an assumed API. Allowed words: 'proposed complementary integration', 'target interface', 'if present', 'locked strategy / message / SITREP pointer'.",
          "Recipient chain (minimum necessary identity, no driver-license storage by default): requester → validation / entitlement → quantity → assignment → fulfillment → timestamp.",
          "Two economic statements stay separate: Modeled Value → Evidence-Based Capture Range · Design-Partner WTP Hypothesis → To Be Tested. Internal deck shows the tension; the external twin does not.",
        ],
      },
      ask: {
        hi: "Approve G2. Release $280k of $620k MVP 1. First paid DP 2027-Q3. Not G6. Not 2026-Q2 revenue. " + MASTER_Q,
        ai: "Approve G2. Release $280k of $620k MVP 1. First paid DP 2027-Q3 / Q4; first repeatable revenue target 2028-Q1. Not G6. Not 2026-Q2 revenue. " + MASTER_Q + " Do not present this as G6 / Maximize, imply 2026-Q2 first revenue, change segment definitions, NBA pairings or architecture, invent new pricing or value, or replace IA assumptions with fake precision. " + IA,
      },
    },
    // ── Pod S2 Project Overview ← manuscript S2 + S18 dates ───────────────────────────────────────────────────
    S2: {
      status: {
        hi: "G2 Plan — strategy frozen (v0.5, 23 Sep 2026). Chips (IA): MVP 1 envelope $620k · release now $280k · NRE through MVP 3 $1.46M · NPV $0.16M at 12% (2026 = t0) · IRR ~20% · payback ~36 months from G2 · Y3 GM 80–82%.",
        ai: "G2 Plan — strategy frozen (v0.5, 23 Sep 2026). Chips (IA): MVP 1 envelope $620k · release now $280k · NRE through MVP 3 $1.46M · NPV $0.16M at 12% (2026 = t0) · IRR ~20% · payback ~36 months from G2 · Y3 GM 80–82%. Cash series ($k): FY26 −260 · FY27 −765 · FY28 +120 · FY29 +1,410. Canonical strategy parent v0.4; slide source v0.5; ledger PRJ-34_Contribution_Ledger. " + PROV,
      },
      roadmap: {
        hi: [
          "G2 Plan 2027-Q1.",
          "Tabletop pilot 2027-Q3.",
          "First paid design partner 2027-Q3 / Q4.",
          "8 paying accounts 2028-Q4.",
        ],
        ai: [
          "G2 Plan 2027-Q1.",
          "Tabletop pilot 2027-Q3.",
          "First paid design partner 2027-Q3 / Q4.",
          "8 paying accounts 2028-Q4.",
          "Baseline 2027 MVP 1 Coordinate · toward 2030 MVP 2 Learn · 2030 gate MVP 3 · 2525 vision, not this release.",
        ],
      },
      toprisks: {
        hi: [
          "Storm Manager collision.",
          "Veoci collision.",
          "DP price > modeled capture.",
          "Degraded comms.",
          "Integration burden.",
        ],
        ai: [
          "Storm Manager collision — demo objects it does not hold.",
          "Veoci collision — hold the narrowed regional non-clinical wedge.",
          "DP price > modeled capture (score 20) — show the tension; test spoken WTP.",
          "Degraded comms (16) — cache the last authorized plan + assignments; bridge to SMS / Sentinel.",
          "Integration burden (16) — one NBA, pointer + CSV.",
        ],
      },
    },
    // ── Pod S3 Financial — Return ← manuscript S17 (internal) + S2 chips ──────────────────────────────────────
    S3: {
      fincomment: {
        hi: [
          IA,
          "Model: value from audited formulas. Capture unproven. Price is hypothesis. Readiness + incident allowance + pre-bought surge packs + Replay + Readiness + integration.",
          "Path (IA, $k): FY26 rev 0 · cash −260 · FY27 rev 95 · cash −765 · FY28 rev 940 · cash +120 · FY29 rev 2,390 · cash +1,410. NPV $0.16M · IRR ~20% · payback ~36 months from G2 — path more aggressive than the waterfalls justify.",
          "Market corrected: 6,700 accounts × $40k = $268M universe · × 25% = $67M near-term SAM · Y3 SOM $1.85M = 2.8% of SAM. The $220M SAM, 14% IRR and $0.2M NPV figures are retired.",
          "The Pod's 10-year return profile above is the tool's own derivation from NRE ($1.46M through MVP 3) and a DECLARED 10-year revenue extrapolation of the four-year IA path; the frozen four-year IA is the figure of record for the gate.",
        ],
        ai: [
          IA,
          "Model: value from audited formulas. Capture unproven. Price is hypothesis. Readiness + incident allowance + pre-bought surge packs + Replay + Readiness + integration.",
          "Path (IA, $k): FY26 rev 0 · cash −260 · FY27 rev 95 · cash −765 · FY28 rev 940 · cash +120 · FY29 rev 2,390 · cash +1,410. NPV $0.16M · IRR ~20% · payback ~36 months from G2 — path more aggressive than the waterfalls justify.",
          "Market corrected: 6,700 accounts × $40k = $268M universe · × 25% = $67M near-term SAM · Y3 SOM $1.85M = 2.8% of SAM. The $220M SAM, 14% IRR and $0.2M NPV figures are retired.",
          "The Pod's 10-year return profile above is the tool's own derivation from NRE ($1.46M through MVP 3) and a DECLARED 10-year revenue extrapolation of the four-year IA path; the frozen four-year IA is the figure of record for the gate.",
          "Envelopes (IA): MVP 1 $620k (release $280k now) · MVP 2 $360k · MVP 3 $480k. Contribution at DP price (IA, $k): Utility community +31 · Industrial +25–51 · Healthcare +15 · Campus +6; at evidence-based 12% capture every row is negative — the gate question stands. INTERNAL slide; the external twin omits the cash path, NPV, capture table and SAM method.",
        ],
      },
    },
    // ── Pod S4 Customer CONOPS ← manuscript S4 ────────────────────────────────────────────────────────────────
    S4: {
      conops: {
        hi: [
          "Sense — the event (OMS, weather, CAD, campus SOC, NWS sense; DRS opens the incident record).",
          "Facts — authoritative facts (CrisisCommand strategy if present).",
          "Command — activate the verified roster and authority map.",
          "Needs — gather needs and concerns as objects.",
          "Allocate — assign non-specialist scarce resources across boundaries.",
          "Recipient fulfill — requester → validation / entitlement → quantity → assignment → fulfillment → timestamp.",
          "Communicate — publish the plan card: what changed, why, who authorized, what do I do now.",
          "Revise — Plan v1 → event → change → authority → Plan v2.",
        ],
        ai: [
          "Before — prepare · roster · resources · Conservative / Baseline / Aggressive plans.",
          "Sense — the event (OMS, weather, CAD, campus SOC, NWS sense; DRS opens the incident record).",
          "Facts — authoritative facts (CrisisCommand strategy if present).",
          "Command — activate the verified roster and authority map.",
          "Needs — gather needs and concerns as objects.",
          "Allocate — assign non-specialist scarce resources across boundaries (Storm Manager keeps crews; Veoci keeps HICS; Sentinel keeps notify).",
          "Recipient fulfill — requester → validation / entitlement → quantity → assignment → fulfillment → timestamp.",
          "Communicate — publish the plan card: what changed, why, who authorized, what do I do now.",
          "Revise — Plan v1 → event → change → authority → Plan v2.",
          "After — replay → measure → qualify → improve → simulate the next event.",
        ],
      },
      future: {
        hi: [
          "Degraded: cache the last authorized plan + assignments. Bridge to SMS / Sentinel / equivalent. Do not rebuild Sentinel.",
          "After: replay → measure → qualify → improve → simulate.",
        ],
        ai: [
          "Degraded: cache the last authorized plan + assignments. Bridge to SMS / Sentinel / equivalent. Do not rebuild Sentinel. React does not assume broadband.",
          "After: replay → measure → qualify → improve → simulate.",
          "Owner column (speaker notes): OMS senses · CrisisCommand strategy if present · Storm Manager crews · Veoci HICS · Sentinel notify · DRS roster / need / resource / recipient / plan.",
          "Not MVP 1: simulation engine, deep OMS / HICS ingest, agents, rebuilt notification.",
        ],
      },
    },
    // ── Pod S5 Customer Problem ← manuscript S5 (+ v0.4 S5 for the whys) ──────────────────────────────────────
    S5: {
      problem: {
        hi: "Authority, needs, resources, entitlements, and plan changes live in different systems and in memory.",
        ai: "Authority, needs, resources, entitlements, and plan changes live in different systems and in memory. Leaders cannot reliably answer who may act, what is needed, what is available, who is entitled to receive it, whether it was fulfilled, who changed the plan, and what people should do now (v0.4). That fragmentation creates uncertain authority, poor need visibility, double-issued or hoarded resources, panic, unofficial responders, weak plan traceability, and lost learning.",
      },
      outcomes: {
        hi: [
          "Named authority.",
          "Needs / resources as objects.",
          "Recipient fulfillment.",
          "Controlled transparency.",
          "Replayable record.",
        ],
        ai: [
          "Named authority.",
          "Needs / resources as objects.",
          "Recipient fulfillment — requester → entitlement → quantity → assignment → fulfillment → timestamp.",
          "Controlled transparency — role-limited views; the public card is a subset of the ops card.",
          "Replayable record — replay rather than inbox reconstruction.",
        ],
      },
      whys: {
        hi: [
          "Uncertain authority and unofficial responders.",
          "Double-issued or hoarded resources.",
          "Panic and poor need visibility.",
          "Weak plan traceability and lost learning.",
        ],
        ai: [
          "Uncertain authority and unofficial responders.",
          "Double-issued or hoarded resources.",
          "Panic and poor need visibility.",
          "Weak plan traceability and lost learning.",
          "Lineage: Project Resilience (6 December 2023) named real-time information gaps, inefficient resource coordination, and limited public communications; the 2023 CONOPS opened with alerts — that job is now owned by NWS, OMS, Sentinel, and Everbridge. DRS keeps roster, needs, resources, recipient fulfillment, the public plan card, and replay.",
        ],
      },
      statusquo: {
        hi: [
          "GridOS restores electrons + Storm Manager crews.",
          "Veoci runs HICS / 96-hour / AAR.",
          "Sentinel notifies, checks in, convenes, works offline.",
          "CrisisCommand (if present) structures strategy and messages.",
          "None close requester → entitlement → quantity → assignment → fulfillment → timestamp across orgs for non-specialist resources.",
        ],
        ai: [
          "GridOS restores electrons + Storm Manager crews.",
          "Veoci runs HICS / 96-hour / AAR.",
          "Sentinel notifies, checks in, convenes, works offline.",
          "CrisisCommand (if present) structures strategy and messages.",
          "None close requester → entitlement → quantity → assignment → fulfillment → timestamp across orgs for non-specialist resources.",
          "Everbridge, OnSolve, Noggin, D4H, WebEOC, Juvare — notify-and-task CEM, in speaker notes only.",
        ],
      },
    },
    // ── Pod S6 Product Summary ← manuscript S6 (diagram: four layers + the recipient spine) + S2 missing layer ──
    S6: {
      problem: {
        hi: [
          "Missing layer: who is accountable · who is qualified · what is needed · what exists · where it went · who may receive it · whether it was fulfilled · what changed · who authorized · what people should do now · what to learn.",
          "Do not clone: SITREP composer · HICS 201 · OMS switching · mass-notify composer.",
        ],
        ai: [
          "Missing layer: who is accountable · who is qualified · what is needed · what exists · where it went · who may receive it · whether it was fulfilled · what changed · who authorized · what people should do now · what to learn.",
          "Do not clone: SITREP composer · HICS 201 · OMS switching · mass-notify composer.",
          "Thesis (verbatim): do not replace grid, hospital, notify, or CrisisCommand systems. Coordinate across them.",
        ],
      },
      conops: {
        hi: [
          "Four layers — CrisisCommand: Think / Command (proposed integration) → DRS: Coordinate / Allocate (system of record: roster, need, resource, recipient, assignment, plan, cache) → eXeL: Listen (advisory only) → R-CORE: Architecture (SKU: Replay + Readiness — powered by R-CORE).",
          "Visual spine, centre of the slide: Requester → validation / entitlement → quantity → assignment → fulfillment → timestamp.",
        ],
        ai: [
          "Four layers — CrisisCommand: Think / Command (proposed integration) → DRS: Coordinate / Allocate (system of record: roster, need, resource, recipient, assignment, plan, cache) → eXeL: Listen (advisory only) → R-CORE: Architecture (SKU: Replay + Readiness — powered by R-CORE).",
          "Visual spine, centre of the slide: Requester → validation / entitlement → quantity → assignment → fulfillment → timestamp. Make the recipient-trace chain visually dominant.",
          "CrisisCommand target objects: locked strategy · objectives · messages · SITREP pointer. DRS system of record: verified roster and rank · need object · non-specialist resource object · entitlement / recipient record · assignment · fulfillment timestamp · plan version · last-authorized-plan cache.",
          "Applications: community + plant envelope around a GridOS-managed outage · regional non-clinical exchange around Veoci · campus freeze, lockdown or heat-wave fulfillment beside Sentinel.",
        ],
      },
    },
    // ── Pod S7 Customer Workflow ← manuscript S7 personas + stories ───────────────────────────────────────────
    S7: {
      personas: {
        hi: [
          ["Command — IC, city, utility exec, plant GM, hospital exec, campus leader", "One current plan with named authority and named deputies; no surprise spokespeople."],
          ["Ops — EM, facilities, medical, maintenance, security, logistics, qualified volunteers", "Clean assignments, inventory truth, fewer collisions; recipient trace so water is not issued twice."],
          ["Population — residents, employees, patients and families, students and parents", "Role-limited view · no command authority · minimum necessary identity · honest status and a way to request help."],
          ["Principle", "AI recommends. Humans command."],
        ],
        ai: [
          ["Command — IC, city, utility exec, plant GM, hospital exec, campus leader", "One current plan with named authority and named deputies; no surprise spokespeople."],
          ["Ops — EM, facilities, medical, maintenance, security, logistics, qualified volunteers", "Clean assignments, inventory truth, fewer collisions; recipient trace so water is not issued twice."],
          ["Population — residents, employees, patients and families, students and parents", "Role-limited view · no command authority · minimum necessary identity · honest status and a way to request help."],
          ["Integrator — IT, identity, dispatch", "A source of truth for identity, uptime, audit; no shadow AI (v0.4)."],
          ["Principle", "AI recommends. Humans command. Public participants never receive operational authority."],
        ],
      },
      desired: {
        hi: "Stories on-slide: 1.0 verified roster so unofficial helpers cannot issue orders · 1.1 needs / resources as objects · 1.2 current plan card for PIO · 1.4 recipient trace so water is not issued twice · 1.5 cached last plan when broadband dies · 1.6 bridge onto the customer notify channel · 2.0 eXeL polling · 2.1 replay vs inbox reconstruction · 3.0 three-plan pre-season sim.",
        ai: "Stories on-slide: 1.0 verified roster so unofficial helpers cannot issue orders · 1.1 needs / resources as objects · 1.2 current plan card for PIO · 1.4 recipient trace so water is not issued twice · 1.5 cached last plan when broadband dies · 1.6 bridge onto the customer notify channel · 2.0 eXeL polling · 2.1 replay vs inbox reconstruction · 3.0 three-plan pre-season sim. Every revision answers four questions: What changed? Why? Who authorized? What do I do now? Any UI visual must support phone portrait, phone landscape and desktop landscape — a design requirement, never a claimed differentiator.",
      },
    },
    // ── Pod S8 Competition + Value ← manuscript S8 / S9 / S10 (three NBA slides) + S12 + S13 (internal table) ──
    S8: {
      vprop: {
        hi: "GridOS operates the grid. DRS coordinates the crisis around it. · Veoci runs the hospital emergency program. DRS coordinates regional non-clinical exchange and the public card under named authority. · Sentinel notifies and convenes. DRS fulfills and accounts. · Not superior on GridOS ops, Veoci compliance, or Sentinel notify — win only where those stop.",
        ai: "GridOS operates the grid. DRS coordinates the crisis around it. · Veoci runs the hospital emergency program. DRS coordinates regional non-clinical exchange and the public card under named authority. · Sentinel notifies and convenes. DRS fulfills and accounts. · Not superior on GridOS ops, Veoci compliance, or Sentinel notify — win only where those stop. Competition clusters: deep ops (GridOS, hospital systems, CMMS) · CEM / crisis (Veoci, Sentinel; Everbridge et al. in notes) · cognitive command (CrisisCommand). DRS target: high Human Coordination · high Replay / Readiness · rising Operational Impact.",
      },
      nba: {
        hi: "Utility / industrial ↔ GE Vernova GridOS (OMS / ADMS · FLISR · SAIDI / SAIFI / CMI · Storm Manager crews, GPS, lodging, expenses, external participants · Disruption Prepare ~72h) · Healthcare ↔ Veoci Vitals EM (one-click activation · ~30 s departmental report · HICS · partner COP · shortage tracking · 96-hour · HVA · JC / CMS / DNV AAR) · Campus ↔ YUDU Sentinel (<60 s multi-channel notify · two-way check · video rooms · audit · lockbox · offline docs · independent comms; anchor only: G-Cloud £5,000 / licence / year).",
        ai: "Utility / industrial ↔ GE Vernova GridOS (OMS / ADMS · FLISR · SAIDI / SAIFI / CMI · Storm Manager crews, GPS, lodging, expenses, external participants · Disruption Prepare ~72h) · Healthcare ↔ Veoci Vitals EM (one-click activation · ~30 s departmental report · HICS · partner COP · shortage tracking · 96-hour · HVA · JC / CMS / DNV AAR) · Campus ↔ YUDU Sentinel (<60 s multi-channel notify · two-way check · video rooms · audit · lockbox · offline docs · independent comms; anchor only: G-Cloud £5,000 / licence / year, historical floor ~£4,500). Do not claim: SAIDI · crews · lodging · switching · DER · generic logistics · HICS · accreditation packet · PHI SoR · generic 'beyond one org' · generic AAR · blast · check-in · video · offline app · out-of-band tenancy.",
      },
      benefits: {
        hi: [
          IA + " Internal value-equation table (all $k): Σ (volume × unit × Δ vs NBA × frequency × confidence A / B / C) = Modeled Value; × tested capture = Evidence-Based Capture Range; DP price = WTP Hypothesis, To Be Tested; higher list = future aspiration.",
          "Utility community — modeled value 158 · 12% capture 19 · DP hypothesis 84 · capture at DP 53% · CTS 53 · contribution at DP +31 · contribution at 12% −34.",
          "Industrial — 150 · 18 · 84–110 · 56–73% · 59 · +25–51 · −41. Combined site (less 20% overlap) — 246 · 30 · 84 · 34% · ~55 · +29 · −25.",
          "Healthcare — 49 · 6 · 54 · 110% · 39 · +15 · −33. Campus — 24 · 3 · 22 · 92% · 16 · +6 · −13.",
          "At evidence-based 12% capture, contribution is negative in every row. Gate question stands.",
        ],
        ai: [
          IA + " Internal value-equation table (all $k): Σ (volume × unit × Δ vs NBA × frequency × confidence A / B / C) = Modeled Value; × tested capture = Evidence-Based Capture Range; DP price = WTP Hypothesis, To Be Tested; higher list = future aspiration.",
          "Utility community — modeled value 158 · 12% capture 19 · DP hypothesis 84 · capture at DP 53% · CTS 53 · contribution at DP +31 · contribution at 12% −34.",
          "Industrial — 150 · 18 · 84–110 · 56–73% · 59 · +25–51 · −41. Combined site (less 20% overlap) — 246 · 30 · 84 · 34% · ~55 · +29 · −25.",
          "Healthcare — 49 · 6 · 54 · 110% · 39 · +15 · −33. Campus — 24 · 3 · 22 · 92% · 16 · +6 · −13.",
          "At evidence-based 12% capture, contribution is negative in every row. Gate question stands.",
          "DRS adds beside GridOS: the community + plant envelope Storm Manager does not hold — shelter, heat / cool, water, non-store fuel, medical dependence, civic identity, recipient trace, public / large-customer plan card. Industrial interview must force five numbers: $/hour production interruption · minimum sustainable output · safe-state time requirement · backup-generation duration · staff / access / fuel dependencies — one verified hour can rewrite Waterfall B; current industrial $ are C-grade.",
          "Confidence grades: A = observed at customer · B = analogue with named source · C = constructed hypothesis. INTERNAL slide — the external twin replaces the table with 'Pricing under design-partner validation. Value from measured fulfillment, provenance, and replay beside the NBA.' and omits the 110% / 92% lines.",
        ],
      },
      features: {
        hi: [
          "1 Verified authority roster + rank.",
          "2 Needs / resources as objects + recipient trace.",
          "3 Plan vN provenance.",
          "4 eXeL advisory intake (not a vote).",
          "5 Conservative / Baseline / Aggressive plans.",
          "6 Replay + Readiness — powered by R-CORE.",
        ],
        ai: [
          "1 Verified authority roster + rank.",
          "2 Needs / resources as objects + recipient trace.",
          "3 Plan vN provenance.",
          "4 eXeL advisory intake (not a vote).",
          "5 Conservative / Baseline / Aggressive plans.",
          "6 Replay + Readiness — powered by R-CORE.",
          "Beside Sentinel DRS adds fulfillment + account-for + recipient trace + plan provenance + three resource plans + cache / bridge. Winter freeze: Who lacks heat? Which building has capacity? Who has blankets? Who is qualified? Who approved relocation? Who received assistance?",
          "Beside Veoci the wedge is narrow: regional non-clinical resource exchange + affected-population transparency + verified cross-organizational authority + Replay + Readiness across events.",
        ],
      },
    },
    // ── Pod S11 Prelim Feedback / Validation ← manuscript S16 validation matrix + S3 labels ───────────────────
    S11: {
      voc: {
        hi: [
          ["0 — target one utility DP", "Community needs invisible beside GridOS (hours need → assign)", "NBA baseline 8–18 h · target ≤ 2 h · result empty", "Pursue — hypothesized"],
          ["0 — target one utility DP", "Double-issue (duplicate rate)", "Baseline unknown · target −50% · result empty", "Pursue — hypothesized"],
          ["0 — target one industrial site", "Envelope delays beside GridOS + plant (hours to safe restore)", "Baseline site-specific · target −3 h · result empty", "Pursue — hypothesized"],
          ["0 — target one regional health DP", "Non-clinical exchange still by phone (hours cross-org)", "Baseline 6–24 h · target ≤ 3 h · result empty", "Pursue — hypothesized"],
          ["0 — target one regional health DP", "Messages fork (versions in 12 h)", "Baseline 4+ · target ≤ 2 · result empty", "Pursue — hypothesized"],
          ["0 — target one campus DP", "Notify ≠ fulfilled (minutes to issued supply)", "Baseline 3–6 h · target ≤ 90 min · result empty", "Pursue — hypothesized"],
          ["0 — target one campus DP", "Plan dies with broadband (degraded drill)", "Baseline 0 · target 1 pass · result empty", "Pursue — hypothesized"],
          ["All segments", "DP price payable (spoken WTP)", "Target ≥ DP hypothesis · result empty", "Pursue — decide at the gate"],
        ],
        ai: [
          ["0 — target one utility DP", "Community needs invisible beside GridOS (hours need → assign)", "NBA baseline 8–18 h · target ≤ 2 h · result empty", "Pursue — hypothesized"],
          ["0 — target one utility DP", "Double-issue (duplicate rate)", "Baseline unknown · target −50% · result empty", "Pursue — hypothesized"],
          ["0 — target one industrial site", "Envelope delays beside GridOS + plant (hours to safe restore)", "Baseline site-specific · target −3 h · result empty", "Pursue — hypothesized"],
          ["0 — target one regional health DP", "Non-clinical exchange still by phone (hours cross-org)", "Baseline 6–24 h · target ≤ 3 h · result empty", "Pursue — hypothesized"],
          ["0 — target one regional health DP", "Messages fork (versions in 12 h)", "Baseline 4+ · target ≤ 2 · result empty", "Pursue — hypothesized"],
          ["0 — target one campus DP", "Notify ≠ fulfilled (minutes to issued supply)", "Baseline 3–6 h · target ≤ 90 min · result empty", "Pursue — hypothesized"],
          ["0 — target one campus DP", "Plan dies with broadband (degraded drill)", "Baseline 0 · target 1 pass · result empty", "Pursue — hypothesized"],
          ["All segments", "DP price payable (spoken WTP)", "Target ≥ DP hypothesis · result empty", "Pursue — decide at the gate"],
          ["Industrial interview", "Five Plant GM numbers ($/hour interruption · minimum sustainable output · safe-state time · backup duration · staff / access / fuel)", "One verified hour can rewrite Waterfall B · result empty", "Pursue — C-grade until observed"],
        ],
      },
      exp: {
        hi: [
          ["S16-1 Utility / GridOS", "Verified authority + recipient trace cuts hours from need to assignment beside the NBA", "≤ 2 h against an 8–18 h NBA-only baseline, pre-registered", "Empty — pursue / pivot / pass after the DP"],
          ["S16-2 Health / Veoci", "Regional non-clinical exchange cuts cross-org hours and message versions", "≤ 3 h cross-org · ≤ 2 public versions in 12 h", "Empty"],
          ["S16-3 Campus / Sentinel", "Fulfillment + account-for beats notify alone", "≤ 90 min to issued supply · one successful degraded drill", "Empty"],
          ["S16-4 All", "DP price is payable", "Spoken WTP ≥ DP hypothesis ($22k / $54k / $84k)", "Empty"],
        ],
        ai: [
          ["S16-1 Utility / GridOS", "Verified authority + recipient trace cuts hours from need to assignment beside the NBA", "≤ 2 h against an 8–18 h NBA-only baseline, pre-registered", "Empty — pursue / pivot / pass after the DP"],
          ["S16-2 Health / Veoci", "Regional non-clinical exchange cuts cross-org hours and message versions", "≤ 3 h cross-org · ≤ 2 public versions in 12 h", "Empty"],
          ["S16-3 Campus / Sentinel", "Fulfillment + account-for beats notify alone", "≤ 90 min to issued supply · one successful degraded drill", "Empty"],
          ["S16-4 All", "DP price is payable", "Spoken WTP ≥ DP hypothesis ($22k / $54k / $84k)", "Empty"],
          ["S16-5 Industrial", "Envelope coordination shortens time to safe restore", "−3 h on a site-specific baseline; the five Plant GM numbers observed (grade A)", "Empty"],
        ],
      },
      comments: {
        hi: [
          "NBA stays. DRS runs beside it. Measure the gap. Columns: segment → NBA → hypothesis → metric → NBA baseline → target Δ → $ weight → customer source → result → pursue / pivot / pass.",
          "Real ≠ hypothesized until one DP · one segment · one pre-registered metric measured versus the NBA-only condition.",
          "Two labels, both visible internally: Modeled Value → Evidence-Based Capture Range versus Design-Partner WTP Hypothesis → To Be Tested. At 12% of current formulas every segment is contribution-negative — a gate fact, not a slide to hide.",
        ],
        ai: [
          "NBA stays. DRS runs beside it. Measure the gap. Columns: segment → NBA → hypothesis → metric → NBA baseline → target Δ → $ weight → customer source → result → pursue / pivot / pass.",
          "Real ≠ hypothesized until one DP · one segment · one pre-registered metric measured versus the NBA-only condition.",
          "Two labels, both visible internally: Modeled Value → Evidence-Based Capture Range versus Design-Partner WTP Hypothesis → To Be Tested. At 12% of current formulas every segment is contribution-negative — a gate fact, not a slide to hide.",
          "Change control: strategy is frozen. Next edits come from interviews into this matrix — replace B / C confidence with observed evidence, revise WTP, then the gate decision. If a reviewer moves a number, keep the row and strike the old figure.",
          "[EXT: Pricing is under design-partner validation. Segment choice follows operational need.]",
        ],
      },
    },
    // ── Pod S12 Go-To-Market ← manuscript S14 commercial model + S3 segmentation + S18 dates ──────────────────
    S12: {
      l90: {
        hi: [
          "Readiness SKU — roster, needs, resources, assignments, recipient trace, plan versions, 3 viewports, last-plan cache, 2 major activations included. WTP hypothesis $22k / $54k / $84k (campus / health / utility) · aspiration $36k / $90k / $140k (IA).",
          "WTP and CTS decide whether we want the job. Segments (IA): Utility community X10 Y6 Z4 · WTP High · CTS High · DP $84k · list $140k · CTS $53k · contribution at DP +$31k. Industrial plant X10 Y5 Z4 · DP $84–110k · list $140–180k · CTS $59k · +$25–51k. Healthcare regional X5 Y10 Z5 · Med-High · CTS High · DP $54k · list $90k · CTS $39k · +$15k. Campus X7* Y9* Z6* · Medium · Low-Med · DP $22k · list $36k · CTS $16k · +$6k (*unvalidated).",
        ],
        ai: [
          "Readiness SKU — roster, needs, resources, assignments, recipient trace, plan versions, 3 viewports, last-plan cache, 2 major activations included. WTP hypothesis $22k / $54k / $84k (campus / health / utility) · aspiration $36k / $90k / $140k (IA).",
          "WTP and CTS decide whether we want the job. Segments (IA): Utility community X10 Y6 Z4 · WTP High · CTS High · DP $84k · list $140k · CTS $53k · contribution at DP +$31k. Industrial plant X10 Y5 Z4 · DP $84–110k · list $140–180k · CTS $59k · +$25–51k. Healthcare regional X5 Y10 Z5 · Med-High · CTS High · DP $54k · list $90k · CTS $39k · +$15k. Campus X7* Y9* Z6* · Medium · Low-Med · DP $22k · list $36k · CTS $16k · +$6k (*unvalidated).",
          "Annual CTS ($k, IA) = cloud + messaging / polling + identity + support + insurance / compliance + event support (2 activations) + account success: Campus 2.4 + 1.8 + 0.8 + 4.0 + 1.5 + 3.0 + 2.5 = 16 · Health 4.5 + 4.0 + 2.0 + 8.0 + 6.0 + 8.0 + 6.0 = 39 · Utility community 5.5 + 6.0 + 3.0 + 10.0 + 8.0 + 12.0 + 8.0 = 53 · Industrial 5.5 + 5.0 + 3.0 + 10.0 + 10.0 + 14.0 + 11.0 = 59.",
        ],
      },
      l60: {
        hi: [
          "Surge-capacity pack — pre-purchased extra activations, price known before the event, no crisis-time % surcharge: $8k / $12k / $18k per pack of two (IA).",
          "Replay + Readiness — powered by R-CORE: +20% on DP Readiness in Y1 · +35% aspiration later. Integration one-time, DP: $20k / $30k / $45k (IA).",
        ],
        ai: [
          "Surge-capacity pack — pre-purchased extra activations, price known before the event, no crisis-time % surcharge: $8k / $12k / $18k per pack of two (IA).",
          "Replay + Readiness — powered by R-CORE: +20% on DP Readiness in Y1 · +35% aspiration later. Integration one-time, DP: $20k / $30k / $45k (IA).",
          "CrisisCommand remains a separate seat under a proposed complementary integration; combined offer language (v0.4): CrisisCommand unlocks in 30 minutes, DRS keeps the next 30 hours coherent.",
        ],
      },
      l30: {
        hi: [
          "Targets (IA): Utility — assignment ≤ 2 h · unresolved at T+24h ≤ 15% · acknowledgement ≥ 80% in 30 min. Industrial — get the five Plant GM numbers. Health — multi-org authority ≤ 25 min · ≤ 2 public versions per 12 h. Campus — 90% accounted-for ≤ 40 min · supply ≤ 90 min.",
          "Three NBA teardowns with the buyer in the room; dual quotes ready (DP hypothesis vs future list).",
        ],
        ai: [
          "Targets (IA): Utility — assignment ≤ 2 h · unresolved at T+24h ≤ 15% · acknowledgement ≥ 80% in 30 min. Industrial — get the five Plant GM numbers. Health — multi-org authority ≤ 25 min · ≤ 2 public versions per 12 h. Campus — 90% accounted-for ≤ 40 min · supply ≤ 90 min.",
          "Three NBA teardowns with the buyer in the room; dual quotes ready (DP hypothesis vs future list).",
          "Pricing anchors are context, never WTP: Veoci, Everbridge, Sentinel (G-Cloud £5,000 / licence / year), GridOS analogues. DRS prices as an attach, not an OMS replacement.",
        ],
      },
      l0: {
        hi: [
          "G2 2027-Q1 · tabletop 2027-Q3 · first paid DP 2027-Q3 / Q4 · 8 paying accounts 2028-Q4.",
          "Market (IA, corrected): 6,700 accounts × $40k = $268M universe · × 25% = $67M near-term SAM · Y3 SOM $1.85M = 2.8% of SAM.",
        ],
        ai: [
          "G2 2027-Q1 · tabletop 2027-Q3 · first paid DP 2027-Q3 / Q4 · 8 paying accounts 2028-Q4.",
          "Market (IA, corrected): 6,700 accounts × $40k = $268M universe · × 25% = $67M near-term SAM · Y3 SOM $1.85M = 2.8% of SAM. The $220M SAM is retired.",
          "Texas and adjacent beachhead (v0.4 supporting note): utilities, health systems and campuses in driving range of Austin.",
        ],
      },
    },
    // ── Pod S13 Risk Highlights ← manuscript S19 risk table (scores I × L) ────────────────────────────────────
    S13: {
      tech: {
        hi: [
          ["High", "Integration burden (16)", "One NBA, pointer + CSV", "Open"],
          ["High", "Degraded comms (16)", "Cache the last authorized plan + assignments; bridge to SMS / Sentinel", "Open"],
          ["High", "Identity / unofficial responders (15)", "IdP + rank; public cannot write command objects", "Open"],
        ],
        ai: [
          ["High", "Integration burden (16)", "One NBA, pointer + CSV", "Open"],
          ["High", "Degraded comms (16)", "Cache the last authorized plan + assignments; bridge to SMS / Sentinel", "Open"],
          ["High", "Identity / unofficial responders (15)", "IdP + rank; public cannot write command objects", "Open"],
          ["Low", "PHI / FERPA / CIP bleed (v0.4)", "No clinical records, no education records, no BES cyber assets as payload", "Mitigated"],
        ],
      },
      comm: {
        hi: [
          ["High", "DP price > 12% modeled value (20)", "Show the tension; test spoken WTP", "Open"],
          ["High", "Storm Manager collision (15)", "Demo objects it does not hold", "Open"],
          ["High", "Healthcare wedge collapses into Veoci (15)", "Hold the narrowed wedge", "Open"],
          ["High", "Procurement cycle (15)", "DP MSA", "Open"],
        ],
        ai: [
          ["High", "DP price > 12% modeled value (20)", "Show the tension; test spoken WTP", "Open"],
          ["High", "Storm Manager collision (15)", "Demo objects it does not hold", "Open"],
          ["High", "Healthcare wedge collapses into Veoci (15)", "Hold the narrowed wedge", "Open"],
          ["High", "Procurement cycle (15)", "DP MSA", "Open"],
          ["Med", "Campus stacks on a Sentinel bill (v0.4)", "Sell fulfillment hours, not seats; year-one ask is the $22k attach", "Mitigating"],
        ],
      },
      biz: {
        hi: [
          ["Med", "Panic via transparency (12)", "Role views; the public card is a subset of the ops card", "Mitigating"],
          ["Low", "CrisisCommand called 'partner' (9)", "Proposed integration only", "Mitigated"],
          ["Low", "Unverified CC certification language (9)", "Confirm before external use — no SOC 2 date, HIPAA, FERPA, FedRAMP, ISO 27001 or PHI statements externally", "Mitigated"],
        ],
        ai: [
          ["Med", "Panic via transparency (12)", "Role views; the public card is a subset of the ops card", "Mitigating"],
          ["Low", "CrisisCommand called 'partner' (9)", "Proposed integration only", "Mitigated"],
          ["Low", "Unverified CC certification language (9)", "Confirm before external use — no SOC 2 date, HIPAA, FERPA, FedRAMP, ISO 27001 or PHI statements externally", "Mitigated"],
          ["Low", "AI treated as commander (v0.4)", "Recommend only; human commit; logged rationale — AI recommends, authorized humans retain command", "Mitigated"],
        ],
      },
      deps: {
        hi: [
          "Proposed CrisisCommand object contract (locked strategy · objectives · messages · SITREP pointer).",
          "Partner IdP · one NBA in MVP 1 · legal review · out-of-band channel owner · SOC 2 path for DRS itself.",
          MASTER_Q,
        ],
        ai: [
          "Proposed CrisisCommand object contract (locked strategy · objectives · messages · SITREP pointer).",
          "Partner IdP · one NBA in MVP 1 · legal review · out-of-band channel owner · SOC 2 path for DRS itself.",
          MASTER_Q,
          "Gate exit: named buyer · need in their words · NBA teardown in the room · two differentiators survive · one measured outcome · spoken WTP · pilot beside the NBA · S16 matrix row filled.",
        ],
      },
    },
    // ── Pod S14 Resourcing ← manuscript S17 path + S18 envelopes + S3 CTS ─────────────────────────────────────
    S14: {
      fte: {
        hi: [
          ["Revenue (IA, $k)", "0 (FY26)", "95 (FY27)", "940 (FY28)", "2,390 (FY29)"],
          ["Cash contribution (IA, $k)", "−260", "−765", "+120", "+1,410"],
          ["Program envelope (IA)", "G2 Plan", "MVP 1 Coordinate $620k · $280k now", "MVP 2 Learn $360k", "MVP 3 $480k (2030 gate)"],
        ],
        ai: [
          ["Revenue (IA, $k)", "0 (FY26)", "95 (FY27)", "940 (FY28)", "2,390 (FY29)"],
          ["Cash contribution (IA, $k)", "−260", "−765", "+120", "+1,410"],
          ["Program envelope (IA)", "G2 Plan", "MVP 1 Coordinate $620k · $280k now", "MVP 2 Learn $360k", "MVP 3 $480k (2030 gate)"],
          ["Team shape (v0.3 supporting note, DECLARED)", "PM or founder-split 1 · product and design 1", "full-stack 2", "security contractor 0.5", "emergency-management domain 0.5 — not a twelve-person program"],
        ],
      },
      ftedollar: {
        hi: [
          ["Annual CTS Campus (IA, $k)", "cloud 2.4 · messaging 1.8 · identity 0.8", "support 4.0 · insurance 1.5", "event support 3.0 · account success 2.5 = 16"],
          ["Annual CTS Health (IA, $k)", "4.5 · 4.0 · 2.0", "8.0 · 6.0", "8.0 · 6.0 = 39"],
          ["Annual CTS Utility community (IA, $k)", "5.5 · 6.0 · 3.0", "10.0 · 8.0", "12.0 · 8.0 = 53"],
          ["Annual CTS Industrial (IA, $k)", "5.5 · 5.0 · 3.0", "10.0 · 10.0", "14.0 · 11.0 = 59"],
        ],
        ai: [
          ["Annual CTS Campus (IA, $k)", "cloud 2.4 · messaging 1.8 · identity 0.8", "support 4.0 · insurance 1.5", "event support 3.0 · account success 2.5 = 16"],
          ["Annual CTS Health (IA, $k)", "4.5 · 4.0 · 2.0", "8.0 · 6.0", "8.0 · 6.0 = 39"],
          ["Annual CTS Utility community (IA, $k)", "5.5 · 6.0 · 3.0", "10.0 · 8.0", "12.0 · 8.0 = 53"],
          ["Annual CTS Industrial (IA, $k)", "5.5 · 5.0 · 3.0", "10.0 · 10.0", "14.0 · 11.0 = 59"],
          ["Contribution = WTP − CTS (IA, $k)", "at DP: +31 · +25–51 · +15 · +6", "at 12% capture: −34 · −41 · −33 · −13", "gate fact, not a slide to hide"],
        ],
      },
      notes: {
        hi: [
          IA,
          "Baseline 2027 — MVP 1 Coordinate: React · 3 viewports · roster · needs · inventory · assignments · recipient trace · plan versions · last-plan cache · notify-channel bridge. Out: sim engine · deep OMS / HICS ingest · agents · rebuilt notify. $620k envelope · $280k now.",
        ],
        ai: [
          IA,
          "Baseline 2027 — MVP 1 Coordinate: React · 3 viewports · roster · needs · inventory · assignments · recipient trace · plan versions · last-plan cache · notify-channel bridge. Out: sim engine · deep OMS / HICS ingest · agents · rebuilt notify. $620k envelope · $280k now.",
          "Toward 2030 — MVP 2 Learn: polling · three plans · record · replay · readiness metrics · $360k IA. 2030 gate — MVP 3: cross-system ingest · simulation · qualification · memory · $480k IA. 2525: vision, not this release.",
          "NRE through MVP 3 $1.46M (IA). Do not import PRJ-31 financials.",
        ],
      },
    },
    // ── Pod S15 BETA Feedback ← manuscript S14 targets + S18 priorities + S13 tension line ─────────────────────
    S15: {
      voc: {
        hi: [
          ["0 — tabletop 2027-Q3, utility DP", "Verified authority + recipient trace", "Assignment ≤ 2 h · unresolved at T+24h ≤ 15% · acknowledgement ≥ 80% in 30 min (IA)", "Pursue — hypothesized"],
          ["0 — industrial site", "Plant envelope coordination", "The five Plant GM numbers observed", "Pursue — C-grade until observed"],
          ["0 — regional health DP", "Regional non-clinical exchange + verified cross-org authority", "Multi-org authority ≤ 25 min · ≤ 2 public versions / 12 h (IA)", "Pursue — hypothesized"],
          ["0 — campus DP", "Fulfillment + account-for beside Sentinel", "90% accounted-for ≤ 40 min · supply ≤ 90 min (IA)", "Pursue — hypothesized"],
        ],
        ai: [
          ["0 — tabletop 2027-Q3, utility DP", "Verified authority + recipient trace", "Assignment ≤ 2 h · unresolved at T+24h ≤ 15% · acknowledgement ≥ 80% in 30 min (IA)", "Pursue — hypothesized"],
          ["0 — industrial site", "Plant envelope coordination", "The five Plant GM numbers observed", "Pursue — C-grade until observed"],
          ["0 — regional health DP", "Regional non-clinical exchange + verified cross-org authority", "Multi-org authority ≤ 25 min · ≤ 2 public versions / 12 h (IA)", "Pursue — hypothesized"],
          ["0 — campus DP", "Fulfillment + account-for beside Sentinel", "90% accounted-for ≤ 40 min · supply ≤ 90 min (IA)", "Pursue — hypothesized"],
          ["All DPs", "Replay + Readiness — powered by R-CORE", "Replay versus inbox reconstruction at the first debrief; degraded drill passes once", "Pursue — hypothesized"],
        ],
      },
      prio: {
        hi: [
          ["1", "MVP 1 Coordinate — roster, needs, inventory, assignments, recipient trace, plan versions, last-plan cache, notify bridge", "Baseline 2027 · G3 2027-Q2 to Q3 · tabletop 2027-Q3"],
          ["2", "MVP 2 Learn — polling, three plans, record, replay, readiness metrics", "Toward 2030 · G4 2028-Q1 to Q2"],
          ["3", "MVP 3 — cross-system ingest, simulation, qualification, memory", "2030 gate"],
        ],
        ai: [
          ["1", "MVP 1 Coordinate — roster, needs, inventory, assignments, recipient trace, plan versions, last-plan cache, notify bridge", "Baseline 2027 · G3 2027-Q2 to Q3 · tabletop 2027-Q3"],
          ["2", "MVP 2 Learn — polling, three plans, record, replay, readiness metrics", "Toward 2030 · G4 2028-Q1 to Q2"],
          ["3", "MVP 3 — cross-system ingest, simulation, qualification, memory", "2030 gate"],
          ["4", "2525 — recursive continuity across institutions and generations", "Vision only, not this release"],
        ],
      },
      impact: {
        hi: "Price is a hypothesis until the buyer speaks a WTP: DP hypothesis $22k / $54k / $84k against future list $36k / $90k / $140k (IA). Contribution at DP price is not contribution at 12% of modeled value — at 12% of current formulas every segment is contribution-negative. Gate question stands.",
        ai: "Price is a hypothesis until the buyer speaks a WTP: DP hypothesis $22k / $54k / $84k against future list $36k / $90k / $140k (IA). Contribution at DP price is not contribution at 12% of modeled value — at 12% of current formulas every segment is contribution-negative. Gate question stands. Implied capture at DP (INTERNAL ONLY): healthcare ~110% of modeled value, campus ~92%, utility community 53%, industrial 56–73%, combined site 34%. " + IA,
      },
    },
    // ── Pod S16 Market Performance ← manuscript S14 targets + S17 path + S15 three plans ──────────────────────
    S16: {
      saydo: {
        hi: [
          ["Utility — hours from community-need open to assignment", "S16 matrix (IA)", "≤ 2 h (NBA baseline 8–18 h)", "Empty — no DP yet"],
          ["Health — minutes to multi-org authority", "S16 matrix (IA)", "≤ 25 min", "Empty"],
          ["Campus — minutes to 90% accounted-for", "S16 matrix (IA)", "≤ 40 min", "Empty"],
          ["Paying accounts, end of year (IA)", "S17 path", "8 (2028-Q4)", "Empty"],
          ["Revenue (IA, $k)", "S17 path", "95 (FY27) · 940 (FY28) · 2,390 (FY29)", "Empty"],
        ],
        ai: [
          ["Utility — hours from community-need open to assignment", "S16 matrix (IA)", "≤ 2 h (NBA baseline 8–18 h)", "Empty — no DP yet"],
          ["Health — minutes to multi-org authority", "S16 matrix (IA)", "≤ 25 min", "Empty"],
          ["Campus — minutes to 90% accounted-for", "S16 matrix (IA)", "≤ 40 min", "Empty"],
          ["Paying accounts, end of year (IA)", "S17 path", "8 (2028-Q4)", "Empty"],
          ["Revenue (IA, $k)", "S17 path", "95 (FY27) · 940 (FY28) · 2,390 (FY29)", "Empty"],
          ["Spoken WTP versus DP hypothesis", "S16 matrix", "≥ $22k / $54k / $84k", "Empty"],
        ],
      },
      plc: {
        hi: [
          ["G2 Plan", "2027-Q1"],
          ["Tabletop pilot", "2027-Q3"],
          ["First paid design partner", "2027-Q3 / Q4"],
          ["8 paying accounts", "2028-Q4"],
        ],
        ai: [
          ["G2 Plan", "2027-Q1"],
          ["Tabletop pilot", "2027-Q3"],
          ["First paid design partner", "2027-Q3 / Q4"],
          ["8 paying accounts", "2028-Q4"],
          ["MVP 3 — 2030 gate", "2030"],
        ],
      },
      risks: {
        hi: [
          "Value from audited formulas; capture unproven; price is hypothesis — the path is more aggressive than the waterfalls justify.",
          "Three resource plans: Conservative (low-end demand · high / slow reserve · trigger need < forecast N hours) · Baseline (last comparable · normal reserve · ≈ forecast) · Aggressive (tail event · thin / forward reserve · need > forecast or life-safety). The user sees plan · assumptions · burn · reserve · who can switch · who may receive.",
        ],
        ai: [
          "Value from audited formulas; capture unproven; price is hypothesis — the path is more aggressive than the waterfalls justify.",
          "Three resource plans: Conservative (low-end demand · high / slow reserve · trigger need < forecast N hours) · Baseline (last comparable · normal reserve · ≈ forecast) · Aggressive (tail event · thin / forward reserve · need > forecast or life-safety). The user sees plan · assumptions · burn · reserve · who can switch · who may receive.",
          "Switch = new plan version. Labels are not the product; provenance is.",
        ],
      },
      counter: {
        hi: [
          "NBA stays. DRS runs beside it. Measure the gap.",
          "Real ≠ hypothesized until one DP · one segment · one pre-registered metric.",
        ],
        ai: [
          "NBA stays. DRS runs beside it. Measure the gap.",
          "Real ≠ hypothesized until one DP · one segment · one pre-registered metric.",
          "Every plan switch is a plan version with authority: Plan v1 → event → change → authority → Plan v2.",
        ],
      },
    },
    // ── Pod S17 Post-Launch Development ← manuscript S11 R-CORE (diagram; logo not received) + horizons ──────
    S17: {
      voc: {
        hi: [
          ["Design partners (post-launch, IA)", "Replay + Readiness — powered by R-CORE", "Replay versus inbox reconstruction; readiness score across events", "Pursue — hypothesized"],
          ["Design partners (post-launch, IA)", "Three-plan pre-season simulation", "Reserves pre-committed with named triggers; who may receive on every plan", "Pursue — hypothesized"],
        ],
        ai: [
          ["Design partners (post-launch, IA)", "Replay + Readiness — powered by R-CORE", "Replay versus inbox reconstruction; readiness score across events", "Pursue — hypothesized"],
          ["Design partners (post-launch, IA)", "Three-plan pre-season simulation", "Reserves pre-committed with named triggers; who may receive on every plan", "Pursue — hypothesized"],
          ["Design partners (post-launch, IA)", "eXeL advisory intake", "Emergent needs surface before they become 911 load; advisory, never a vote", "Pursue — hypothesized"],
        ],
      },
      prio: {
        hi: [
          ["Baseline 2027", "Coordination, allocation, provenance, recipient trace, degraded-mode cache", "MVP 1"],
          ["2030", "Cross-system replay, simulation, qualification, multi-event memory", "MVP 2 → MVP 3 (2030 gate)"],
          ["2525", "Recursive continuity across institutions and generations", "Vision — not this year's product"],
        ],
        ai: [
          ["Baseline 2027", "Coordination, allocation, provenance, recipient trace, degraded-mode cache", "MVP 1"],
          ["2030", "Cross-system replay, simulation, qualification, multi-event memory", "MVP 2 → MVP 3 (2030 gate)"],
          ["2525", "Recursive continuity across institutions and generations", "Vision — not this year's product"],
          ["Upside, stated as vision not forecast", "A $/minute Vision • 2525-inspired future: readiness metered on measured minutes of coordination, the replay tape as the settlement record, humanity as the authority", "Beyond MVP 3"],
        ],
      },
      obs: {
        hi: [
          "R-CORE is architecture. Not the app. Not the SKU. SKU: Replay + Readiness — powered by R-CORE. (Diagram slide; the R-CORE logo belongs here — the file named in the brief did not reach the session.)",
          "Loop: LIVE → COORDINATE → OPERATIONAL TRUTH → REPLAY → SIMULATE (C / B / A) → QUALIFY → NEXT EVENT.",
          "Every crisis becomes evidence. Every replay improves readiness. Every cycle strengthens resilience. 2525 is vision — not this year's product.",
        ],
        ai: [
          "R-CORE is architecture. Not the app. Not the SKU. SKU: Replay + Readiness — powered by R-CORE. (Diagram slide; the R-CORE logo belongs here — the file named in the brief did not reach the session.)",
          "Loop: LIVE → COORDINATE → OPERATIONAL TRUTH → REPLAY → SIMULATE (C / B / A) → QUALIFY → NEXT EVENT.",
          "Every crisis becomes evidence. Every replay improves readiness. Every cycle strengthens resilience. 2525 is vision — not this year's product.",
          "Horizons, verbatim: Baseline 2027 — coordination, allocation, provenance, recipient trace, degraded-mode cache · 2030 — cross-system replay, simulation, qualification, multi-event memory · 2525 — recursive continuity across institutions and generations.",
          "Vision • 2525 / R-CORE doctrine: AI recommends; authorized humans retain command. R-CORE coordinates; it does not dominate.",
        ],
      },
    },
    // ── Pod S18 End-of-Life ← not in the manuscript (a template slide) — DECLARED lines under the frozen rules ─
    S18: {
      e120: {
        hi: [
          "DECLARED (not in v0.5): retire a DRS increment only after its successor carries the same six defended differentiators on the record.",
          "Freeze the replay tapes — roster, needs, assignments, recipient fulfillment, plan deltas — and export them to the design partner in an open format.",
        ],
        ai: [
          "DECLARED (not in v0.5): retire a DRS increment only after its successor carries the same six defended differentiators on the record.",
          "Freeze the replay tapes — roster, needs, assignments, recipient fulfillment, plan deltas — and export them to the design partner in an open format.",
          "Name the successor per segment beside the NBA that stays in place (GridOS, Veoci Vitals EM, YUDU Sentinel).",
        ],
      },
      e90: {
        hi: [
          "Design-partner MSA notice; readiness scores and plan-version history handed over with provenance intact.",
          "Pointer integrations (CrisisCommand object contract, IdP, the one NBA) retired in the reverse order they were added.",
        ],
        ai: [
          "Design-partner MSA notice; readiness scores and plan-version history handed over with provenance intact.",
          "Pointer integrations (CrisisCommand object contract, IdP, the one NBA) retired in the reverse order they were added.",
          "Verified roster and rank exported to the partner's IdP so authority never reverts to memory.",
        ],
      },
      e60: {
        hi: [
          "Final replay-to-drill package delivered; the last Conservative / Baseline / Aggressive plan set archived as plan versions.",
          "Public plan card set to a final 'what do I do now' with a named successor channel.",
        ],
        ai: [
          "Final replay-to-drill package delivered; the last Conservative / Baseline / Aggressive plan set archived as plan versions.",
          "Public plan card set to a final 'what do I do now' with a named successor channel.",
          "Data destruction per the partner's public-data and volunteer-credentialing legal review; minimum necessary identity throughout.",
        ],
      },
      e0: {
        hi: [
          "End-of-life communication to command, ops, and the population through their role-limited views.",
          "The last event's tape replayed once more into the successor: the next storm does not restart from zero.",
        ],
        ai: [
          "End-of-life communication to command, ops, and the population through their role-limited views.",
          "The last event's tape replayed once more into the successor: the next storm does not restart from zero.",
          PROV,
        ],
      },
    },
  },
};
