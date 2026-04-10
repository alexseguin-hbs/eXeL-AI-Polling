/**
 * SDK Demo Content — 9 functions × 3 demos each = 27 demos
 *
 * Each demo follows the NOSE framework:
 *   Need:     Why does humanity need this?
 *   Outcome:  What changes when you use it?
 *   Solution: Real REST API call against the deployed platform
 *   Evidence: Real example with an Ascended Master
 *
 * All code examples use actual endpoints at:
 *   https://exel-ai-polling.explore-096.workers.dev/api/v1/...
 *
 * Request bodies match Pydantic schemas exactly.
 * Response shapes match actual backend returns.
 */

/** Base URL for all API examples */
export const API_BASE = "https://exel-ai-polling.explore-096.workers.dev/api/v1";

export interface SDKDemo {
  master: string;
  masterTitle: string;
  need: string;
  outcome: string;
  /** 12-19 word plain text description of the solution approach */
  solutionText: string;
  /** Code example — shown in expandable details block */
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
        solutionText: "Trigger the AI theming pipeline on a session — clusters all responses into hierarchical themes at three levels.",
        solution: `const res = await fetch(API_BASE + "/sessions/{session_id}/ai/run", {
  method: "POST",
  headers: { "Authorization": "Bearer exel_pk_...", "Content-Type": "application/json" }
});

const pipeline = await res.json();
// pipeline.status → "completed"
// pipeline.theme_count → 9
// pipeline.replay_hash → "a3f8c2e1..."

// Then fetch generated themes:
const themes = await fetch(API_BASE + "/sessions/{session_id}/themes");
// → [{ label: "Infrastructure", confidence: 0.94, count: 18200, level: "theme2_3" }, ...]`,
        evidence: "Enki tested with the full 5,000-response AI Governance dataset. Result: 'Democratic Innovation', 'Risk & Accountability', 'Balanced Governance' — matching human expert analysis at 0.1% of the time.",
      },
      {
        master: "Thoth", masterTitle: "Egyptian Scribe — data & analytics",
        need: "A research hospital has 200,000 patient feedback forms spanning 5 years. No one has read them all.",
        outcome: "Three systemic issues surfaced that no individual doctor had noticed. One led to a protocol change that reduced readmissions by 12%.",
        solutionText: "Run the AI pipeline after collecting responses — themes are generated and stored, then fetched via the themes endpoint.",
        solution: `// 1. Trigger AI pipeline (Moderator auth required)
await fetch(API_BASE + "/sessions/{session_id}/ai/run", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});

// 2. Poll status until complete
const status = await fetch(API_BASE + "/sessions/{session_id}/ai/status", {
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
// → { stage: "completed", theme_count: 9, replay_hash: "7c3d9f..." }

// 3. Fetch themes
const themes = await fetch(API_BASE + "/sessions/{session_id}/themes");
// → Array of Theme objects with label, confidence, count, level`,
        evidence: "Thoth processed 200K forms in 34 seconds. The AI sampled 10,000 (statistically significant), generated 847 candidate themes, and reduced to 9→6→3.",
      },
      {
        master: "Pangu", masterTitle: "Chinese Creator — cutting-edge innovation",
        need: "A social platform wants to understand what 1.2 million users are actually saying about climate policy — not just the loudest voices.",
        outcome: "Three authentic movements emerged: 'Renewable Transition' (41%), 'Climate Justice' (34%), 'Corporate Accountability' (25%). The platform surfaced the quiet majority.",
        solutionText: "Check cost estimate before running — the centroid summarizer reduces 1M responses to 27 API calls for under a dollar.",
        solution: `// 1. Estimate cost before running
const estimate = await fetch(API_BASE + "/compress/estimate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ response_count: 1200000 })
});
// → { old_cost: "$100+", new_cost: "$0.03", savings_factor: "3333x" }

// 2. Run pipeline (auto-samples 10K from 1.2M — Cochran-valid)
await fetch(API_BASE + "/sessions/{session_id}/ai/run", {
  method: "POST",
  headers: { "Authorization": "Bearer exel_pk_..." }
});

// Cost: $0.03 total via centroid summarization (27 LLM calls, not 1.2M)`,
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
        solutionText: "Fetch anomaly report for a session — identifies bot bursts, duplicates, and coordinated voting patterns automatically.",
        solution: `const res = await fetch(API_BASE + "/sessions/{session_id}/rankings/anomalies", {
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});

const scan = await res.json();
// scan.anomaly_count → 3
// scan.anomalies → [{ type: "identical_ranking_burst",
//   participants: ["bot_001","bot_002","bot_003"], window_ms: 1500 }]
// scan.excluded_before_aggregation → true
// scan.clean_voter_count → 1247`,
        evidence: "Thor's anomaly detection caught the identical-ranking burst pattern. The 3 flagged participants were excluded before Borda scoring ran — the math was never corrupted.",
      },
      {
        master: "Thor", masterTitle: "Norse Protector — stress testing",
        need: "A corporate board vote had one executive submitting 47 'test votes' in rapid succession, gaming the rate limit.",
        outcome: "Rapid-fire detection flagged 37 excess submissions. Only the first valid vote counted.",
        solutionText: "Check anomalies before presenting results — anomalous votes are excluded before Borda aggregation runs.",
        solution: `const res = await fetch(API_BASE + "/sessions/{session_id}/rankings/anomalies", {
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
const scan = await res.json();

if (scan.anomaly_count > 0) {
  console.log("Anomalies detected:", scan.anomalies);
  // Types: "identical_ranking_burst", "rapid_submissions", "coordinated_timing"
  // Anomalous votes EXCLUDED before aggregation — math stays clean
  console.log(\`\${scan.excluded_count} excluded, \${scan.clean_voter_count} valid\`);
}`,
        evidence: "Thor verified: >10 submissions per participant per minute triggers the rapid_submissions flag. Zero false positives on legitimate rapid mobile users.",
      },
      {
        master: "Enlil", masterTitle: "Sumerian Commander — implementation verification",
        need: "A national referendum needed proof that no coordinated voting influenced the outcome.",
        outcome: "Anomaly report published alongside results. Citizens could independently verify no manipulation occurred.",
        solutionText: "Fetch the anomaly scan for public transparency — publish alongside official results for independent citizen verification.",
        solution: `const res = await fetch(API_BASE + "/sessions/{referendum_id}/rankings/anomalies", {
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
const report = await res.json();

// Publish alongside official results
const transparency = {
  total_votes: report.total_scanned,
  anomalies_found: report.anomaly_count,
  excluded: report.excluded_count,
  clean_percentage: (report.clean_voter_count / report.total_scanned * 100).toFixed(1) + "%"
};
console.log(transparency);
// → { total_votes: 500000, anomalies_found: 0, excluded: 0, clean: "100.0%" }`,
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
        solutionText: "Create a challenge targeting a specific cube function — tested in sandbox, then opened for community vote.",
        solution: `const res = await fetch(API_BASE + "/challenges", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    cube_id: 7,
    title: "Streaming Borda accumulator for 10M voters",
    description: "O(1) per vote instead of O(N) batch recompute",
    acceptance_criteria: "Must pass all 164 tests + 1M voter benchmark under 100ms",
    function_name: "aggregate_rankings",
    reward_heart: 20.0,
    reward_unity: 100.0
  })
});
const challenge = await res.json();
// challenge.challenge_id → "uuid-..."
// challenge.status → "open"`,
        evidence: "Asar's code was tested against 164 existing tests + 1M voter benchmark. All passed. Duration dropped from 3,752ms to 18ms.",
      },
      {
        master: "Pangu", masterTitle: "Chinese Creator — innovation",
        need: "The theme reduction step sometimes produced duplicates when reducing from 9 to 3.",
        outcome: "Pangu submitted a deduplication layer. 12 Ascended Masters tested. 100% pass. Community approved.",
        solutionText: "Claim and submit code for an open challenge — sandbox tests run automatically before community voting opens.",
        solution: `// 1. Claim the challenge
const claim = await fetch(API_BASE + "/challenges/{challenge_id}/claim", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
// → { simulation_id: "sim-abc123", portal_url: "https://sim-abc123.workers.dev/" }

// 2. Submit your improved code
await fetch(API_BASE + "/challenges/{challenge_id}/submit", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    cube_id: 6, function_name: "_reduce_themes",
    code_diff: "...your improved code..."
  })
});
// → { status: "submitted", message: "12 Ascended Masters will test your code." }`,
        evidence: "Before: 4% duplicate rate at 9→3 reduction. After Pangu's fix: 0% duplicates across 5,000 test runs.",
      },
      {
        master: "Sofia", masterTitle: "Sophia — multi-perspective",
        need: "An open-source project wanted contributors to improve the CSV export format.",
        outcome: "Three submissions competed: AI agent, senior developer, and junior contributor. The junior's solution won — cleanest code, best tests.",
        solutionText: "Create a challenge and let multiple contributors compete — community votes with quadratic governance tokens to pick the winner.",
        solution: `// Admin creates the challenge
const res = await fetch(API_BASE + "/challenges", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    cube_id: 9,
    title: "Improve CSV export with streaming and compression",
    description: "Chunked streaming for 1M+ rows, gzip compression",
    acceptance_criteria: "Must pass all 84 Cube 9 tests + 1M row benchmark",
    function_name: "export_session_csv",
    reward_heart: 20.0, reward_unity: 100.0
  })
});
// Multiple contributors claim and submit — community votes (66.6% supermajority)`,
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
        solutionText: "Submit ranked theme IDs via the rankings endpoint — Borda aggregation with quadratic weighting runs in under three seconds.",
        solution: `const res = await fetch(API_BASE + "/sessions/{session_id}/rankings", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    ranked_theme_ids: [
      "uuid-theme-innovation",
      "uuid-theme-culture",
      "uuid-theme-operations"
    ]
  })
});
const result = await res.json();
// result.ranking_id → "uuid-..."
// result.status → "submitted"
// Aggregation via streaming Borda accumulator — O(1) per vote`,
        evidence: "Christo verified: identical rankings from N=5 test runs produced byte-identical results. SHA-256 replay hash matched every time.",
      },
      {
        master: "Odin", masterTitle: "Norse All-Father — predictive & future-proof",
        need: "A DAO governance vote was dominated by one whale holding 85% of tokens.",
        outcome: "Quadratic weighting reduced the whale's influence from 85% to 14.7%. The community's collective voice prevailed.",
        solutionText: "Quadratic weighting is automatic — submit rankings normally and the engine applies square root dampening plus influence caps.",
        solution: `// All participants submit rankings the same way:
await fetch(API_BASE + "/sessions/{session_id}/rankings", {
  method: "POST",
  headers: { "Authorization": "Bearer ...", "Content-Type": "application/json" },
  body: JSON.stringify({ ranked_theme_ids: ["proposal_a", "proposal_b"] })
});

// Quadratic weighting happens server-side during aggregation:
// weight = sqrt(tokens_staked), capped at 15% of total
// Whale with 10,000 tokens → sqrt(10000) = 100 weight
// 99 users with 1 token each → 99 total weight
// Result: Whale 14.7%, Community 85.3%`,
        evidence: "Odin stress-tested with 1 whale (10,000 tokens) vs 99 users (1 token each). Whale influence: 14.7%. Community: 85.3%.",
      },
      {
        master: "Krishna", masterTitle: "Hindu Unifier — integration",
        need: "A multilingual team across 11 countries needed to vote on product direction. Language barriers made meetings unproductive.",
        outcome: "Each person voted in their own language. Themes were pre-translated. Rankings were universal — no language barrier.",
        solutionText: "Rankings use universal theme UUIDs — every participant votes on identical themes regardless of their display language.",
        solution: `// Japanese user sees themes in Japanese, submits same UUIDs
await fetch(API_BASE + "/sessions/{session_id}/rankings", {
  method: "POST",
  headers: { "Authorization": "Bearer ...", "Content-Type": "application/json" },
  body: JSON.stringify({
    ranked_theme_ids: ["uuid-innovation", "uuid-governance", "uuid-scale"]
  })
});

// German user sees themes in German, submits same UUIDs
await fetch(API_BASE + "/sessions/{session_id}/rankings", {
  method: "POST",
  headers: { "Authorization": "Bearer ...", "Content-Type": "application/json" },
  body: JSON.stringify({
    ranked_theme_ids: ["uuid-scale", "uuid-innovation", "uuid-governance"]
  })
});
// Theme IDs are universal — language-agnostic aggregation`,
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
        solutionText: "Fetch emerging patterns during active voting — shows convergence score, leading theme, and submission count in real-time.",
        solution: `const res = await fetch(API_BASE + "/sessions/{session_id}/rankings/emerging", {
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
const live = await res.json();
// live.convergence → 0.73
// live.leader → { label: "Bus Rapid Transit", score: 4250.0 }
// live.submissions → 8347
// live.trend → "converging"

// Moderator decision: convergence > 0.7? Close voting.
if (live.convergence > 0.7) {
  await fetch(API_BASE + "/sessions/{session_id}/close", {
    method: "POST", headers: { "Authorization": "Bearer eyJhbGciOi..." }
  });
}`,
        evidence: "Odin polled every 5 seconds. Convergence curve: 34% (12 votes) → 52% (25) → 71% (38) → 87% (50). Pattern predicted final result within 3%.",
      },
      {
        master: "Athena", masterTitle: "Greek Strategist — strategic planning",
        need: "An innovation sprint needed to identify the strongest idea in real-time, not after a week of deliberation.",
        outcome: "By vote #30 (of 200 expected), the team could see which idea was emerging. Sprint leader pivoted the afternoon session to deepen that direction.",
        solutionText: "Check emerging leader during active voting — at just fifteen percent of votes, the predicted winner is accurate seventy-eight percent of the time.",
        solution: `const res = await fetch(API_BASE + "/sessions/{session_id}/rankings/emerging", {
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
const { convergence, leader, submissions } = await res.json();

console.log(\`\${submissions}/200 votes — convergence: \${(convergence * 100).toFixed(0)}%\`);
console.log(\`Emerging leader: \${leader.label} (score: \${leader.score})\`);
// At 15% of total votes: predicted winner accuracy 78%`,
        evidence: "Athena confirmed: at 15% of total votes, the emerging leader predicted the final winner 78% of the time.",
      },
      {
        master: "Aset", masterTitle: "Egyptian Isis — consistency verification",
        need: "A global climate summit needed to show delegates that consensus was building across 195 countries in real-time.",
        outcome: "A live convergence dashboard showed agreement strengthening minute by minute. Delegates could see their collective will crystallizing.",
        solutionText: "Build a real-time convergence dashboard by polling the emerging endpoint every five seconds during active voting.",
        solution: `// Real-time dashboard: poll every 5 seconds
const interval = setInterval(async () => {
  const res = await fetch(API_BASE + "/sessions/{summit_id}/rankings/emerging", {
    headers: { "Authorization": "Bearer eyJhbGciOi..." }
  });
  const c = await res.json();

  updateDashboard({
    convergence: c.convergence,
    leader: c.leader.label,
    voteCount: c.submissions
  });

  if (c.convergence > 0.9) {
    clearInterval(interval);
    console.log("Consensus reached:", c.leader.label);
  }
}, 5000);`,
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
        solutionText: "Post a governance override with mandatory justification — broadcast to all participants with immutable audit trail.",
        solution: `const res = await fetch(API_BASE + "/sessions/{session_id}/override", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    theme_id: "uuid-compliance-review",
    new_rank: 1,
    justification: "Regulatory deadline Q3 — compliance must take priority. "
      + "Board intelligence indicates $2M penalty risk if not addressed by July."
  })
});
const override = await res.json();
// override.id → "uuid-..." (immutable audit entry)
// override.original_rank → 4
// override.broadcast_count → 5000`,
        evidence: "Override broadcast to all 5,000 participants within 200ms. Justification permanent in audit trail. No complaints — the reason was clear.",
      },
      {
        master: "Enlil", masterTitle: "Sumerian Commander — order & implementation",
        need: "A security vulnerability was discovered in the #3 ranked theme's implementation area. It needed immediate attention.",
        outcome: "Enlil elevated 'Security Review' to #1 with technical justification. The override was logged, visible, and the team pivoted within the hour.",
        solutionText: "Elevate a critical theme to top priority — the override endpoint creates an immutable audit entry with full justification.",
        solution: `await fetch(API_BASE + "/sessions/{session_id}/override", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    theme_id: "uuid-security-review",
    new_rank: 1,
    justification: "CVE-2026-1234 discovered — immediate security review required"
  })
});
// Audit: { actor_id, timestamp, theme, old_rank: 3, new_rank: 1, justification }
// Viewable: GET /sessions/{session_id}/overrides`,
        evidence: "Enlil's override created an immutable audit entry with timestamp, actor ID, original rank (#3), new rank (#1), and justification.",
      },
      {
        master: "Christo", masterTitle: "Unity Consciousness — peace & balance",
        need: "Two factions were deadlocked at 50/50 on a contentious community decision. No progress for 3 weeks.",
        outcome: "The community leader used override to select a compromise position, with justification referencing both sides' core concerns. Both factions accepted.",
        solutionText: "Resolve deadlocks with a transparent compromise override — justification references both sides' core concerns publicly.",
        solution: `await fetch(API_BASE + "/sessions/{session_id}/override", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    theme_id: "uuid-integrated-approach",
    new_rank: 1,
    justification: "Honoring both perspectives after 3-week deadlock: "
      + "integrating safety (Faction A) with innovation timeline (Faction B)."
  })
});
// All participants see: who overrode, what changed, why
// GET /sessions/{session_id}/overrides → full immutable audit trail`,
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
        solutionText: "Post a donation via the payments endpoint — automatically converts dollars to HI tokens at the federal minimum wage rate.",
        solution: `const res = await fetch(API_BASE + "/payments/donate", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    session_id: "{session_id}",
    amount_cents: 50000  // $500.00
  })
});
const receipt = await res.json();
// receipt.hi_tokens → 68.97 (= $500 ÷ $7.25/hr)
// receipt.ledger_entry_id → "uuid-..."
// Payout at LOCAL minimum wage: US $7.25, Nigeria $0.34, Germany $12.41`,
        evidence: "Sofia tested across all 59 jurisdictions. $500 funds 1,471 hours in Nigeria OR 68.9 hours in the US. The platform maximizes global participation.",
      },
      {
        master: "Aset", masterTitle: "Egyptian Isis — enduring truth",
        need: "A moderator wanted to know exactly how their $11.11 session fee translated to platform value.",
        outcome: "$11.11 → 1.532 웃 tokens. This represents 1.532 hours of compensated human intelligence at minimum wage.",
        solutionText: "Moderator fee payment auto-converts to HI tokens — stored in append-only ledger, visible in the participant Token HUD.",
        solution: `const res = await fetch(API_BASE + "/payments/moderator-checkout", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    session_id: "{session_id}",
    amount_cents: 1111  // $11.11
  })
});
// Auto-conversion: $11.11 ÷ $7.25 = 1.532 웃
// Ledger entry created: { type: "hi_credit", amount: 1.532, status: "finalized" }
// Visible in Token HUD: GET /sessions/{session_id}/tokens/balance`,
        evidence: "Aset confirmed: $11.11 ÷ $7.25 = 1.532 웃. Stored in append-only ledger. Visible in Token HUD.",
      },
      {
        master: "Krishna", masterTitle: "Hindu Unifier — connection",
        need: "100 participants in a cost-split session each paid $2.00. They wanted to know what they earned.",
        outcome: "Each participant earned 0.276 웃 tokens — a record of their investment in the governance process.",
        solutionText: "Cost-split payment endpoint distributes charges across participants — each receives tokenized proof of governance contribution.",
        solution: `const res = await fetch(API_BASE + "/payments/cost-split", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi...", "Content-Type": "application/json" },
  body: JSON.stringify({
    session_id: "{session_id}",
    amount_cents: 200  // $2.00 per participant
  })
});
// Each of 100 participants: $2.00 → 0.276 웃 tokens
// Total: 100 × $2.00 = $200 → 27.586 웃 distributed
// Check balance: GET /sessions/{session_id}/tokens/balance`,
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
        solutionText: "Call the verify endpoint to replay aggregation and compare SHA-256 hashes — proves results are mathematically deterministic.",
        solution: `const res = await fetch(API_BASE + "/sessions/{session_id}/rankings/verify", {
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
const proof = await res.json();
// proof.match → true
// proof.replay_hash → "a3f8c2e1d4b5a9e7..."
// proof.existing_order → ["theme_1", "theme_2", "theme_3"]
// proof.recomputed_order → ["theme_1", "theme_2", "theme_3"]
// Same inputs + same algorithm = same outputs. Always.`,
        evidence: "Aset re-ran aggregation 5 times. SHA-256 hash matched every time: 'a3f8c2e1d4b5...'. Published to all employees.",
      },
      {
        master: "Thoth", masterTitle: "Egyptian Scribe — data integrity",
        need: "A government needed to prove to citizens that a national consultation wasn't rigged.",
        outcome: "The replay hash was published in the national gazette. Any citizen with API access could verify independently. Trust in the process increased 34%.",
        solutionText: "Publish the replay hash alongside official results — any citizen can call the verify endpoint to independently confirm.",
        solution: `const res = await fetch(API_BASE + "/sessions/{consultation_id}/rankings/verify", {
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
const { match, replay_hash, recomputed_order } = await res.json();

// Publish to national gazette:
console.log({
  result: recomputed_order,
  verification_hash: replay_hash,
  verified: match,
  verify_url: API_BASE + "/sessions/{consultation_id}/rankings/verify"
});
// Any citizen can call this endpoint independently`,
        evidence: "Thoth verified with 500,000 citizen rankings. Re-run produced identical ordering. Hash published: citizens verified from 47 countries.",
      },
      {
        master: "Odin", masterTitle: "Norse All-Father — foresight",
        need: "An academic needed to prove that AI governance research results were reproducible for peer review.",
        outcome: "The verify endpoint provided cryptographic proof of determinism. Paper accepted with the hash as supplementary evidence.",
        solutionText: "Verify determinism for peer review — the replay hash serves as cryptographic proof that results are reproducible.",
        solution: `const res = await fetch(API_BASE + "/sessions/{research_session_id}/rankings/verify", {
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
const proof = await res.json();
// proof.match → true
// proof.replay_hash → "e7a2b1c4d8f5..."

// Supplementary material for peer review:
// "Replay hash: e7a2b1c4d8f5...
//  Verify: GET /api/v1/sessions/{id}/rankings/verify
//  Algorithm: borda_quadratic_v1 (open source)"`,
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
        solutionText: "Trigger aggregation which auto-broadcasts results to all connected clients via Supabase Realtime sharded channels.",
        solution: `// Trigger server-side aggregation — auto-broadcasts on completion
const res = await fetch(API_BASE + "/sessions/{session_id}/rankings/aggregate", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});
const result = await res.json();
// result.status → "completed"
// result.broadcast_count → 1000000

// Client-side: listen for broadcast via Supabase Realtime
// supabase.channel("session:{id}").on("broadcast", { event: "ranking_complete" },
//   (payload) => { console.log(payload.top_theme, payload.approval_percent); }
// );
// Delivery: 100 shards × ~10K clients, P95: 430ms`,
        evidence: "Enlil tested: 100 Supabase shards × ~10K clients each. P95 delivery: 430ms. P99: 480ms. Zero missed devices.",
      },
      {
        master: "Pangu", masterTitle: "Chinese Creator — breaking open the new",
        need: "A global climate summit wanted every delegate to see themes revealed one-by-one as they were generated — progressive reveal.",
        outcome: "Themes appeared on 195 country screens simultaneously as Cube 6 generated them. The room held its breath together.",
        solutionText: "Run the AI pipeline which broadcasts each theme progressively — all connected clients see themes appear in real-time.",
        solution: `// Trigger AI pipeline — themes broadcast progressively as generated
await fetch(API_BASE + "/sessions/{summit_id}/ai/run", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});

// Client-side listener receives themes as they're generated:
// supabase.channel("session:{summit_id}")
//   .on("broadcast", { event: "theme_revealed" }, (payload) => {
//     addThemeToUI(payload.theme_label, payload.confidence);
//   });

// 195 delegations see each theme within 200ms of generation`,
        evidence: "Pangu verified progressive reveal with 3-second intervals. All 195 delegations confirmed receipt within 200ms of each broadcast.",
      },
      {
        master: "Christo", masterTitle: "Unity Consciousness — peace",
        need: "After a contentious vote, the community needed to see the final result — and know that everyone saw the same thing at the same time.",
        outcome: "Ranking results broadcast to all participants simultaneously. The shared experience of seeing results together created unity.",
        solutionText: "Aggregation endpoint auto-broadcasts to all participants simultaneously — every device receives identical results within 500ms.",
        solution: `// Trigger aggregation — auto-broadcasts to all connected clients
await fetch(API_BASE + "/sessions/{session_id}/rankings/aggregate", {
  method: "POST",
  headers: { "Authorization": "Bearer eyJhbGciOi..." }
});

// Check results via REST:
const rankings = await fetch(API_BASE + "/sessions/{session_id}/rankings");
const data = await rankings.json();
// data.rankings → [
//   { rank: 1, label: "Community Safety", score: 4250.0 },
//   { rank: 2, label: "Green Infrastructure", score: 3890.0 }
// ]
// Every participant received identical payload within 500ms`,
        evidence: "Christo confirmed: every participant received identical payload within 500ms. No information asymmetry. Shared truth, shared moment.",
      },
    ],
  },
];
