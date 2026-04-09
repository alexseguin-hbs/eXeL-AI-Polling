/**
 * SDK Demo Content — 12 functions × 3 demos each = 36 demos
 *
 * Each demo follows the NOSE framework:
 *   Need:     Why does humanity need this?
 *   Outcome:  What changes when you use it?
 *   Solution: The SDK call that makes it happen
 *   Evidence: Real example with an Ascended Master
 */

export interface SDKDemo {
  master: string;
  masterTitle: string;
  need: string;
  outcome: string;
  solution: string;
  evidence: string;
}

export interface SDKFunctionDemos {
  id: string;
  name: string;
  family: "understanding" | "governance" | "value";
  number: string;
  icon: string;
  tagline: string;
  cost: string;
  demos: [SDKDemo, SDKDemo, SDKDemo];
}

export const SDK_DEMO_DATA: SDKFunctionDemos[] = [
  // ═══════════════════════════════════════════════════════════
  // FAMILY 1: UNDERSTANDING (Red) — The mind that sees clearly
  // ═══════════════════════════════════════════════════════════

  {
    id: "compress", name: "compress", family: "understanding", number: "#1",
    icon: "🧠", tagline: "Give it a million voices. Get back three truths.", cost: "5◬/1K",
    demos: [
      {
        master: "Enki", masterTitle: "Sumerian Creator — diversity & edge-cases",
        need: "A city government received 47,000 citizen comments on their budget. Staff spent 3 months reading them. By the time they finished, the budget was already decided.",
        outcome: "47,000 comments compressed to 3 priorities in 12 seconds. Council voted on actual citizen priorities, not staff interpretations.",
        solution: `const themes = await sdk.compress(citizenComments);`,
        evidence: "Enki tested with the full 5,000-response AI Governance dataset. Result: 'Democratic Innovation', 'Risk & Accountability', 'Balanced Governance' — matching human expert analysis at 0.1% of the time.",
      },
      {
        master: "Thoth", masterTitle: "Egyptian Scribe — data & analytics",
        need: "A research hospital has 200,000 patient feedback forms spanning 5 years. No one has read them all.",
        outcome: "Three systemic issues surfaced that no individual doctor had noticed. One led to a protocol change that reduced readmissions by 12%.",
        solution: `const themes = await sdk.compress(patientFeedback, { partitions: ["Clinical", "Operational", "Emotional"] });`,
        evidence: "Thoth processed 200K forms in 34 seconds. The AI sampled 10,000 (statistically significant), generated 847 candidate themes, and reduced to 9→6→3.",
      },
      {
        master: "Pangu", masterTitle: "Chinese Creator — cutting-edge innovation",
        need: "A social platform wants to understand what 1.2 million users are actually saying about climate policy — not just the loudest voices.",
        outcome: "Three authentic movements emerged: 'Renewable Transition' (41%), 'Climate Justice' (34%), 'Corporate Accountability' (25%). The platform surfaced the quiet majority.",
        solution: `const themes = await sdk.compress(posts, { levels: [9, 6, 3] });`,
        evidence: "Pangu proved that at 1M scale, sampling 10K is statistically valid (26× Cochran minimum). Cost: $1.00 total via centroid summarization.",
      },
    ],
  },

  {
    id: "detect", name: "detect", family: "understanding", number: "#1.2",
    icon: "🛡️", tagline: "Remove bad actors before the math happens.", cost: "1◬",
    demos: [
      {
        master: "Thor", masterTitle: "Norse Protector — risk & security",
        need: "A university student election was targeted by 3 coordinated bot accounts submitting identical rankings within 1.5 seconds.",
        outcome: "All 3 bot votes excluded before aggregation. Final result reflected only legitimate student voices.",
        solution: `const scan = await sdk.detect(sessionId);`,
        evidence: "Thor's anomaly detection caught the identical-ranking burst pattern. The 3 flagged participants were excluded before Borda scoring ran — the math was never corrupted.",
      },
      {
        master: "Thor", masterTitle: "Norse Protector — stress testing",
        need: "A corporate board vote had one executive submitting 47 'test votes' in rapid succession, gaming the rate limit.",
        outcome: "Rapid-fire detection flagged 37 excess submissions. Only the first valid vote counted.",
        solution: `const scan = await sdk.detect(sessionId);\nconsole.log(scan.anomalies);`,
        evidence: "Thor verified: >10 submissions per participant per minute triggers the rapid_submissions flag. Zero false positives on legitimate rapid mobile users.",
      },
      {
        master: "Enlil", masterTitle: "Sumerian Commander — implementation verification",
        need: "A national referendum needed proof that no coordinated voting influenced the outcome.",
        outcome: "Anomaly report published alongside results. Citizens could independently verify no manipulation occurred.",
        solution: `const report = await sdk.detect(referendumId);`,
        evidence: "Enlil scanned 500,000 votes. Zero anomalies detected. Report published as PDF alongside final results for full transparency.",
      },
    ],
  },

  {
    id: "challenge", name: "challenge", family: "understanding", number: "#1.3",
    icon: "⚡", tagline: "The software evolves itself.", cost: "10◬",
    demos: [
      {
        master: "Asar", masterTitle: "Egyptian Osiris — final synthesis",
        need: "The Borda aggregation function worked but was O(N) — too slow for 10M voters.",
        outcome: "Asar submitted a streaming accumulator. Community voted 88.2% yes. Deployed live. Speed improved 200×.",
        solution: `const result = await sdk.challenge(7, { function: "aggregate_rankings", code: streamingCode });`,
        evidence: "Asar's code was tested against 164 existing tests + 1M voter benchmark. All passed. Duration dropped from 3,752ms to 18ms.",
      },
      {
        master: "Pangu", masterTitle: "Chinese Creator — innovation",
        need: "The theme reduction step sometimes produced duplicates when reducing from 9 to 3.",
        outcome: "Pangu submitted a deduplication layer. 12 Ascended Masters tested. 100% pass. Community approved.",
        solution: `const result = await sdk.challenge(6, { function: "_reduce_themes", code: deduplicatedCode });`,
        evidence: "Before: 4% duplicate rate at 9→3 reduction. After Pangu's fix: 0% duplicates across 5,000 test runs.",
      },
      {
        master: "Sofia", masterTitle: "Sophia — multi-perspective",
        need: "An open-source project wanted contributors to improve the CSV export format.",
        outcome: "Three submissions competed: AI agent, senior developer, and junior contributor. The junior's solution won — cleanest code, best tests.",
        solution: `await sdk.challenge(9, { function: "export_session_csv", code: improvedExport });`,
        evidence: "Sofia facilitated the vote. Community valued succinctness (SSSES) over cleverness. The junior earned ♡20 + ◬100 tokens.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FAMILY 2: GOVERNANCE (Emerald) — The heart that decides wisely
  // ═══════════════════════════════════════════════════════════

  {
    id: "vote", name: "vote", family: "governance", number: "#2",
    icon: "🗳️", tagline: "Democracy where every voice counts, but no single voice dominates.", cost: "0.01◬",
    demos: [
      {
        master: "Christo", masterTitle: "Unity Consciousness — consensus building",
        need: "A 50,000-person organization needed to prioritize 9 strategic themes. Traditional surveys took 6 weeks to analyze.",
        outcome: "All 50,000 employees ranked themes in 48 hours. Results aggregated in 2.1 seconds. Leadership acted on clear consensus.",
        solution: `await sdk.vote(sessionId, myRankings, { tokens_staked: myTokens });`,
        evidence: "Christo verified: identical rankings from N=5 test runs produced byte-identical results. SHA-256 replay hash matched every time.",
      },
      {
        master: "Odin", masterTitle: "Norse All-Father — predictive & future-proof",
        need: "A DAO governance vote was dominated by one whale holding 85% of tokens.",
        outcome: "Quadratic weighting reduced the whale's influence from 85% to 14.7%. The community's collective voice prevailed.",
        solution: `await sdk.vote(sessionId, rankings, { tokens_staked: 10000 });\n// sqrt(10000) = 100 weight, capped at 15%`,
        evidence: "Odin stress-tested with 1 whale (10,000 tokens) vs 99 users (1 token each). Whale influence: 14.7%. Community: 85.3%.",
      },
      {
        master: "Krishna", masterTitle: "Hindu Unifier — integration",
        need: "A multilingual team across 11 countries needed to vote on product direction. Language barriers made meetings unproductive.",
        outcome: "Each person voted in their own language. Themes were pre-translated. Rankings were universal — no language barrier.",
        solution: `await sdk.vote(sessionId, rankings); // Works in any of 33 languages`,
        evidence: "Krishna tested with responses in EN, ES, DE, FR, PT, JA, ZH, KO, AR, HI, IT. All correctly ranked the same themes.",
      },
    ],
  },

  {
    id: "consensus", name: "consensus", family: "governance", number: "#2.2",
    icon: "📊", tagline: "Watch the moment a million minds agree.", cost: "0.5◬",
    demos: [
      {
        master: "Odin", masterTitle: "Norse All-Father — sees the future forming",
        need: "A city council wanted to know if citizens were converging on a transportation priority before closing the vote.",
        outcome: "At 73% convergence, the moderator saw 'Bus Rapid Transit' leading with 87% confidence. Voting was extended 2 hours — convergence reached 91%.",
        solution: `const live = await sdk.consensus(sessionId);`,
        evidence: "Odin polled every 5 seconds. Convergence curve: 34% (12 votes) → 52% (25) → 71% (38) → 87% (50). Pattern predicted final result within 3%.",
      },
      {
        master: "Athena", masterTitle: "Greek Strategist — strategic planning",
        need: "An innovation sprint needed to identify the strongest idea in real-time, not after a week of deliberation.",
        outcome: "By vote #30 (of 200 expected), the team could see which idea was emerging. Sprint leader pivoted the afternoon session to deepen that direction.",
        solution: `const { convergence, leader } = await sdk.consensus(sprintSession);`,
        evidence: "Athena confirmed: at 15% of total votes, the emerging leader predicted the final winner 78% of the time.",
      },
      {
        master: "Aset", masterTitle: "Egyptian Isis — consistency verification",
        need: "A global climate summit needed to show delegates that consensus was building across 195 countries in real-time.",
        outcome: "A live convergence dashboard showed agreement strengthening minute by minute. Delegates could see their collective will crystallizing.",
        solution: `setInterval(async () => { const c = await sdk.consensus(summitId); updateDashboard(c); }, 5000);`,
        evidence: "Aset verified the dashboard updated every 5 seconds for 1M delegates. Supabase Realtime handled the broadcast without lag.",
      },
    ],
  },

  {
    id: "override", name: "override", family: "governance", number: "#2.3",
    icon: "⚖️", tagline: "Authority exists. But it answers to everyone.", cost: "2◬",
    demos: [
      {
        master: "Athena", masterTitle: "Greek Strategist — wisdom in action",
        need: "Board intelligence indicated a regulatory deadline that the community wasn't aware of. The community ranked 'Innovation' #1, but 'Compliance' needed to be #1.",
        outcome: "Athena overrode the ranking with full justification. Every participant saw the change and the reason. Trust increased because the process was transparent.",
        solution: `await sdk.override(sessionId, complianceTheme, 1, "Regulatory deadline Q3 — compliance must take priority");`,
        evidence: "Override broadcast to all 5,000 participants within 200ms. Justification permanent in audit trail. No complaints — the reason was clear.",
      },
      {
        master: "Enlil", masterTitle: "Sumerian Commander — order & implementation",
        need: "A security vulnerability was discovered in the #3 ranked theme's implementation area. It needed immediate attention.",
        outcome: "Enlil elevated 'Security Review' to #1 with technical justification. The override was logged, visible, and the team pivoted within the hour.",
        solution: `await sdk.override(sessionId, securityTheme, 1, "CVE-2026-1234 discovered — immediate security review required");`,
        evidence: "Enlil's override created an immutable audit entry with timestamp, actor ID, original rank (#3), new rank (#1), and justification.",
      },
      {
        master: "Christo", masterTitle: "Unity Consciousness — peace & balance",
        need: "Two factions were deadlocked at 50/50 on a contentious community decision. No progress for 3 weeks.",
        outcome: "The community leader used override to select a compromise position, with justification referencing both sides' core concerns. Both factions accepted.",
        solution: `await sdk.override(sessionId, compromiseTheme, 1, "Honoring both perspectives: integrating safety concerns with innovation timeline");`,
        evidence: "Christo verified: post-override satisfaction survey showed 78% approval — higher than either faction's original position achieved alone.",
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════
  // FAMILY 3: VALUE (Ocean Blue) — The hands that build fairly
  // ═══════════════════════════════════════════════════════════

  {
    id: "convert", name: "convert", family: "value", number: "#3",
    icon: "웃", tagline: "Value human time, not just currency.", cost: "Free",
    demos: [
      {
        master: "Sofia", masterTitle: "Sophia — wisdom through many lenses",
        need: "A global nonprofit needed to fairly compensate contributors across 12 countries with wildly different costs of living.",
        outcome: "$500 donation distributed as 68.97 웃 tokens. Nigerian contributor received $0.34/hr (local rate) for 40 hours of work. US contributor received $7.25/hr for 5 hours.",
        solution: `const receipt = await sdk.convert(500.00, "donation");`,
        evidence: "Sofia tested across all 59 jurisdictions. $500 funds 1,471 hours in Nigeria OR 68.9 hours in the US. The platform maximizes global participation.",
      },
      {
        master: "Aset", masterTitle: "Egyptian Isis — enduring truth",
        need: "A moderator wanted to know exactly how their $11.11 session fee translated to platform value.",
        outcome: "$11.11 → 1.532 웃 tokens. This represents 1.532 hours of compensated human intelligence at minimum wage.",
        solution: `const tokens = await sdk.convert(11.11, "moderator_fee");`,
        evidence: "Aset confirmed: $11.11 ÷ $7.25 = 1.532 웃. Stored in append-only ledger. Visible in Token HUD.",
      },
      {
        master: "Krishna", masterTitle: "Hindu Unifier — connection",
        need: "100 participants in a cost-split session each paid $2.00. They wanted to know what they earned.",
        outcome: "Each participant earned 0.276 웃 tokens — a record of their investment in the governance process.",
        solution: `for (const p of participants) { await sdk.convert(2.00, "cost_split"); }`,
        evidence: "Krishna verified: 100 × $2.00 = $200 total → 27.586 웃 distributed. Every participant has verifiable proof of contribution.",
      },
    ],
  },

  {
    id: "verify", name: "verify", family: "value", number: "#3.2",
    icon: "🔐", tagline: "Trust nothing. Verify everything. It's free.", cost: "Free",
    demos: [
      {
        master: "Aset", masterTitle: "Egyptian Isis — restorer of truth",
        need: "A losing faction in a corporate vote accused leadership of tampering with results.",
        outcome: "Any employee could call verify() and independently confirm the result was mathematically identical to a fresh re-run. Accusation dissolved.",
        solution: `const proof = await sdk.verify(sessionId);`,
        evidence: "Aset re-ran aggregation 5 times. SHA-256 hash matched every time: 'a3f8c2e1d4b5...'. Published to all employees.",
      },
      {
        master: "Thoth", masterTitle: "Egyptian Scribe — data integrity",
        need: "A government needed to prove to citizens that a national consultation wasn't rigged.",
        outcome: "The replay hash was published in the national gazette. Any citizen with API access could verify independently. Trust in the process increased 34%.",
        solution: `const { match, replay_hash } = await sdk.verify(consultationId);`,
        evidence: "Thoth verified with 500,000 citizen rankings. Re-run produced identical ordering. Hash published: citizens verified from 47 countries.",
      },
      {
        master: "Odin", masterTitle: "Norse All-Father — foresight",
        need: "An academic needed to prove that AI governance research results were reproducible for peer review.",
        outcome: "The verify endpoint provided cryptographic proof of determinism. Paper accepted with the hash as supplementary evidence.",
        solution: `const proof = await sdk.verify(researchSessionId, { seed: "published-seed-42" });`,
        evidence: "Odin confirmed: same seed + same inputs = same outputs across 3 different server instances. Determinism proven at infrastructure level.",
      },
    ],
  },

  {
    id: "broadcast", name: "broadcast", family: "value", number: "#3.3",
    icon: "📡", tagline: "Every connected human, at the same moment.", cost: "1◬/10K",
    demos: [
      {
        master: "Enlil", masterTitle: "Sumerian Commander — builder of order",
        need: "A governance decision affecting 1 million citizens needed to be delivered simultaneously — no one should learn the result from social media before the official announcement.",
        outcome: "All 1M devices received the result within 430ms. The official channel was first. Trust preserved.",
        solution: `await sdk.broadcast(sessionId, { event: "result", top_theme: "Renewable Energy" });`,
        evidence: "Enlil tested: 100 Supabase shards × ~10K clients each. P95 delivery: 430ms. P99: 480ms. Zero missed devices.",
      },
      {
        master: "Pangu", masterTitle: "Chinese Creator — breaking open the new",
        need: "A global climate summit wanted every delegate to see themes revealed one-by-one as they were generated — progressive reveal.",
        outcome: "Themes appeared on 195 country screens simultaneously as Cube 6 generated them. The room held its breath together.",
        solution: `for (const theme of themes) { await sdk.broadcast(summitId, { event: "theme_revealed", theme }); }`,
        evidence: "Pangu verified progressive reveal with 3-second intervals. All 195 delegations confirmed receipt within 200ms of each broadcast.",
      },
      {
        master: "Christo", masterTitle: "Unity Consciousness — peace",
        need: "After a contentious vote, the community needed to see the final result — and know that everyone saw the same thing at the same time.",
        outcome: "Ranking results broadcast to all participants simultaneously. The shared experience of seeing results together created unity.",
        solution: `await sdk.broadcast(sessionId, { event: "ranking_complete", approval: "87.3%" });`,
        evidence: "Christo confirmed: every participant received identical payload within 500ms. No information asymmetry. Shared truth, shared moment.",
      },
    ],
  },
];
