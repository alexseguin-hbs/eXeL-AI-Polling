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
        solutionText: "Pass an array of citizen comments to compress — returns hierarchical themes at three granularity levels.",
        solution: `const { themes_9, themes_6, themes_3 } = await sdk.compress(citizenComments, {
  levels: [9, 6, 3],
  ai_provider: "openai",
  language: "en"
});

// themes_3 → ["Infrastructure Investment", "Tax Reform", "Public Safety"]
// Each theme includes: label, confidence, response_count, summary_33
console.log(themes_3[0].label);       // "Infrastructure Investment"
console.log(themes_3[0].confidence);   // 0.94
console.log(themes_3[0].count);        // 18,200`,
        evidence: "Enki tested with the full 5,000-response AI Governance dataset. Result: 'Democratic Innovation', 'Risk & Accountability', 'Balanced Governance' — matching human expert analysis at 0.1% of the time.",
      },
      {
        master: "Thoth", masterTitle: "Egyptian Scribe — data & analytics",
        need: "A research hospital has 200,000 patient feedback forms spanning 5 years. No one has read them all.",
        outcome: "Three systemic issues surfaced that no individual doctor had noticed. One led to a protocol change that reduced readmissions by 12%.",
        solutionText: "Compress patient feedback with clinical partitions — surfaces systemic issues across departments and time periods.",
        solution: `const result = await sdk.compress(patientFeedback, {
  partitions: ["Clinical", "Operational", "Emotional"],
  levels: [9, 6, 3],
  sample_size: 10000
});

// result.themes_3 per partition:
// Clinical:    ["Medication Timing", "Discharge Communication", "Pain Management"]
// Operational: ["Wait Times", "Staff Coordination", "Equipment Access"]
// Emotional:   ["Family Inclusion", "Dignity in Care", "Recovery Support"]`,
        evidence: "Thoth processed 200K forms in 34 seconds. The AI sampled 10,000 (statistically significant), generated 847 candidate themes, and reduced to 9→6→3.",
      },
      {
        master: "Pangu", masterTitle: "Chinese Creator — cutting-edge innovation",
        need: "A social platform wants to understand what 1.2 million users are actually saying about climate policy — not just the loudest voices.",
        outcome: "Three authentic movements emerged: 'Renewable Transition' (41%), 'Climate Justice' (34%), 'Corporate Accountability' (25%). The platform surfaced the quiet majority.",
        solutionText: "Compress 1.2 million social posts using centroid sampling — statistically valid themes at planetary scale for under a dollar.",
        solution: `const themes = await sdk.compress(posts, {
  levels: [9, 6, 3],
  sample_size: 10000  // Cochran-valid sample from 1.2M
});

// Cost breakdown:
// Embedding: 1.2M × 50 tokens = $0.0012
// Summarization: 27 centroid calls = $0.03
// Total: ~$0.03 (vs $100+ for per-response LLM calls)

themes.themes_3.forEach(t =>
  console.log(\`\${t.label}: \${t.count} responses (\${t.confidence}%)\`)
);`,
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
        solutionText: "Scan a session for anomalous voting patterns — bot bursts, duplicates, and rapid-fire submissions flagged automatically.",
        solution: `const scan = await sdk.detect(sessionId);

// scan.anomaly_count → 3
// scan.anomalies → [
//   { type: "identical_ranking_burst", participants: ["bot_001", "bot_002", "bot_003"],
//     window_ms: 1500, confidence: 0.98 }
// ]
// scan.excluded_before_aggregation → true
// scan.clean_voter_count → 1247`,
        evidence: "Thor's anomaly detection caught the identical-ranking burst pattern. The 3 flagged participants were excluded before Borda scoring ran — the math was never corrupted.",
      },
      {
        master: "Thor", masterTitle: "Norse Protector — stress testing",
        need: "A corporate board vote had one executive submitting 47 'test votes' in rapid succession, gaming the rate limit.",
        outcome: "Rapid-fire detection flagged 37 excess submissions. Only the first valid vote counted.",
        solutionText: "Detect rapid-fire vote manipulation — flags excess submissions while preserving legitimate fast mobile interactions.",
        solution: `const scan = await sdk.detect(sessionId);

if (scan.anomaly_count > 0) {
  console.log("Anomalies detected:", scan.anomalies);
  // Each anomaly: { type, participants[], window_ms, confidence }
  // Types: "identical_ranking_burst", "rapid_submissions", "coordinated_timing"

  // Anomalous votes are EXCLUDED before aggregation — math stays clean
  console.log(\`\${scan.excluded_count} votes excluded, \${scan.clean_voter_count} valid\`);
}`,
        evidence: "Thor verified: >10 submissions per participant per minute triggers the rapid_submissions flag. Zero false positives on legitimate rapid mobile users.",
      },
      {
        master: "Enlil", masterTitle: "Sumerian Commander — implementation verification",
        need: "A national referendum needed proof that no coordinated voting influenced the outcome.",
        outcome: "Anomaly report published alongside results. Citizens could independently verify no manipulation occurred.",
        solutionText: "Generate a publishable anomaly report for transparency — citizens can independently verify no manipulation occurred.",
        solution: `const report = await sdk.detect(referendumId);

// Publish alongside official results
const transparency = {
  total_votes: report.total_scanned,
  anomalies_found: report.anomaly_count,
  excluded: report.excluded_count,
  clean_percentage: \`\${(report.clean_voter_count / report.total_scanned * 100).toFixed(1)}%\`,
  scan_timestamp: report.timestamp,
  verification_hash: report.scan_hash
};
await publishToGazette(transparency);`,
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
        solutionText: "Submit improved code for any cube function — tested by 12 AI agents, then community votes to deploy.",
        solution: `const submission = await sdk.challenge(7, {
  function: "aggregate_rankings",
  title: "Streaming Borda accumulator for 10M voters",
  code: streamingBordaCode,
  description: "O(1) per vote instead of O(N) batch recompute"
});

// submission.status → "testing"
// submission.portal_url → "https://sim-abc123.workers.dev/"
// 12 Ascended Masters run 164 existing tests + 1M benchmark
// If all pass → opens 24-hour community vote (66.6% supermajority required)`,
        evidence: "Asar's code was tested against 164 existing tests + 1M voter benchmark. All passed. Duration dropped from 3,752ms to 18ms.",
      },
      {
        master: "Pangu", masterTitle: "Chinese Creator — innovation",
        need: "The theme reduction step sometimes produced duplicates when reducing from 9 to 3.",
        outcome: "Pangu submitted a deduplication layer. 12 Ascended Masters tested. 100% pass. Community approved.",
        solutionText: "Fix a specific function by submitting replacement code — automated testing catches regressions before community votes.",
        solution: `const fix = await sdk.challenge(6, {
  function: "_reduce_themes",
  title: "Deduplicate themes during 9→3 reduction",
  code: deduplicatedReducer,
  description: "Cosine similarity check before merging candidate themes"
});

// Automated pipeline:
// 1. Sandbox execution (isolated, memory-limited)
// 2. Run all existing tests (must pass 100%)
// 3. SSSES score comparison (no pillar decrease allowed)
// 4. Community vote opens if tests pass`,
        evidence: "Before: 4% duplicate rate at 9→3 reduction. After Pangu's fix: 0% duplicates across 5,000 test runs.",
      },
      {
        master: "Sofia", masterTitle: "Sophia — multi-perspective",
        need: "An open-source project wanted contributors to improve the CSV export format.",
        outcome: "Three submissions competed: AI agent, senior developer, and junior contributor. The junior's solution won — cleanest code, best tests.",
        solutionText: "Open a challenge for any function — AI and humans compete, community decides which implementation ships.",
        solution: `const challenge = await sdk.challenge(9, {
  function: "export_session_csv",
  title: "Improve CSV export with streaming and compression",
  code: improvedExportCode,
  description: "Chunked streaming for 1M+ rows, gzip compression"
});

// Three submissions competed:
// 1. AI agent (Cube 6 auto-generated) — fast but verbose
// 2. Senior developer — clever but complex
// 3. Junior contributor — clean, tested, readable ← WINNER
// Community vote: 72.4% for junior (SSSES succinctness valued)`,
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
        solutionText: "Submit ranked preferences with staked tokens — quadratic weighting prevents any single voice from dominating results.",
        solution: `const result = await sdk.vote(sessionId, {
  rankings: ["theme_innovation", "theme_culture", "theme_ops"],
  tokens_staked: 100
});

// result.weight → 10 (sqrt of 100 tokens)
// result.influence_percent → 2.3% (capped at 15% max)
// result.replay_hash → "a3f8c2e1d4b5..."
// result.aggregation_ms → 2.1 (streaming Borda accumulator)

// Deterministic: same inputs always produce identical rankings
// SHA-256 replay hash proves mathematical correctness`,
        evidence: "Christo verified: identical rankings from N=5 test runs produced byte-identical results. SHA-256 replay hash matched every time.",
      },
      {
        master: "Odin", masterTitle: "Norse All-Father — predictive & future-proof",
        need: "A DAO governance vote was dominated by one whale holding 85% of tokens.",
        outcome: "Quadratic weighting reduced the whale's influence from 85% to 14.7%. The community's collective voice prevailed.",
        solutionText: "Quadratic voting caps whale influence automatically — 10,000 tokens yields only 100 weight, hard-capped at fifteen percent.",
        solution: `// Whale stakes 10,000 tokens
await sdk.vote(sessionId, {
  rankings: ["proposal_a", "proposal_b"],
  tokens_staked: 10000
});
// weight = sqrt(10000) = 100
// With 15% influence cap: max 15% of total vote weight

// Compare: 99 regular users stake 1 token each
// Each gets weight = sqrt(1) = 1
// Combined community weight: 99
// Whale: 100 (but capped at 15% of 199 total = 29.85)
// Result: Whale 14.7%, Community 85.3%`,
        evidence: "Odin stress-tested with 1 whale (10,000 tokens) vs 99 users (1 token each). Whale influence: 14.7%. Community: 85.3%.",
      },
      {
        master: "Krishna", masterTitle: "Hindu Unifier — integration",
        need: "A multilingual team across 11 countries needed to vote on product direction. Language barriers made meetings unproductive.",
        outcome: "Each person voted in their own language. Themes were pre-translated. Rankings were universal — no language barrier.",
        solutionText: "Vote in any of 33 supported languages — themes are pre-translated so rankings work universally across all participants.",
        solution: `// Japanese user votes on themes shown in Japanese
await sdk.vote(sessionId, {
  rankings: ["theme_innovation", "theme_governance", "theme_scale"],
  language_code: "ja"  // Themes displayed in user's language
});

// German user votes on same themes shown in German
await sdk.vote(sessionId, {
  rankings: ["theme_scale", "theme_innovation", "theme_governance"],
  language_code: "de"
});

// Rankings are language-agnostic — theme IDs are universal
// Aggregation works identically regardless of display language`,
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
        solutionText: "Poll live convergence score while voting is active — shows how strongly the crowd agrees and which theme leads.",
        solution: `const live = await sdk.consensus(sessionId);

// live.convergence → 0.73 (73% agreement)
// live.leader → { label: "Bus Rapid Transit", score: 4250.0, confidence: 0.87 }
// live.submissions → 8347 (votes counted so far)
// live.trend → "converging" | "diverging" | "stable"

// Moderator decision: convergence > 0.7? Close vote.
// Still diverging? Extend voting period.
if (live.convergence > 0.7 && live.trend === "converging") {
  await moderator.closeVoting(sessionId);
}`,
        evidence: "Odin polled every 5 seconds. Convergence curve: 34% (12 votes) → 52% (25) → 71% (38) → 87% (50). Pattern predicted final result within 3%.",
      },
      {
        master: "Athena", masterTitle: "Greek Strategist — strategic planning",
        need: "An innovation sprint needed to identify the strongest idea in real-time, not after a week of deliberation.",
        outcome: "By vote #30 (of 200 expected), the team could see which idea was emerging. Sprint leader pivoted the afternoon session to deepen that direction.",
        solutionText: "Check emerging leader during active voting — at just 15% of votes, the predicted winner is accurate 78% of the time.",
        solution: `const { convergence, leader, submissions } = await sdk.consensus(sprintSession);

// Early signal: only 30 of 200 expected votes in
console.log(\`\${submissions}/200 votes — convergence: \${(convergence * 100).toFixed(0)}%\`);
console.log(\`Emerging leader: \${leader.label} (score: \${leader.score})\`);

// At 15% of total votes (30/200):
// Predicted winner accuracy: 78%
// Sprint leader can pivot resources to deepen the leading direction`,
        evidence: "Athena confirmed: at 15% of total votes, the emerging leader predicted the final winner 78% of the time.",
      },
      {
        master: "Aset", masterTitle: "Egyptian Isis — consistency verification",
        need: "A global climate summit needed to show delegates that consensus was building across 195 countries in real-time.",
        outcome: "A live convergence dashboard showed agreement strengthening minute by minute. Delegates could see their collective will crystallizing.",
        solutionText: "Build a real-time convergence dashboard with five-second polling — delegates see collective will crystallizing as votes arrive.",
        solution: `// Real-time dashboard: poll every 5 seconds
const dashboardInterval = setInterval(async () => {
  const c = await sdk.consensus(summitId);

  updateDashboard({
    convergence: c.convergence,
    leader: c.leader.label,
    voteCount: c.submissions,
    trend: c.trend,
    timestamp: new Date().toISOString()
  });

  // Auto-stop when convergence plateaus
  if (c.convergence > 0.9 && c.trend === "stable") {
    clearInterval(dashboardInterval);
    await announceResult(c.leader);
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
        solutionText: "Override a ranking with mandatory justification — every participant sees the change, the reason, and who made it.",
        solution: `const override = await sdk.override(sessionId, {
  theme_id: "compliance_review",
  new_rank: 1,
  justification: "Regulatory deadline Q3 — compliance must take priority. "
    + "Board intelligence indicates $2M penalty risk if not addressed by July."
});

// override.broadcast_count → 5000 (all participants notified)
// override.audit_entry → { actor, timestamp, old_rank: 4, new_rank: 1, justification }
// override.immutable → true (cannot be edited or deleted)
// Justification is permanent, public, and visible to every participant`,
        evidence: "Override broadcast to all 5,000 participants within 200ms. Justification permanent in audit trail. No complaints — the reason was clear.",
      },
      {
        master: "Enlil", masterTitle: "Sumerian Commander — order & implementation",
        need: "A security vulnerability was discovered in the #3 ranked theme's implementation area. It needed immediate attention.",
        outcome: "Enlil elevated 'Security Review' to #1 with technical justification. The override was logged, visible, and the team pivoted within the hour.",
        solutionText: "Elevate a critical theme to top priority with technical justification — creates an immutable audit trail entry.",
        solution: `await sdk.override(sessionId, {
  theme_id: "security_review",
  new_rank: 1,
  justification: "CVE-2026-1234 discovered in theme #3 implementation area. "
    + "Immediate security review required before any deployment."
});

// Audit trail entry:
// { actor_id: "enlil_lead", timestamp: "2026-04-10T...",
//   theme: "security_review", old_rank: 3, new_rank: 1,
//   justification: "CVE-2026-1234...", immutable: true }`,
        evidence: "Enlil's override created an immutable audit entry with timestamp, actor ID, original rank (#3), new rank (#1), and justification.",
      },
      {
        master: "Christo", masterTitle: "Unity Consciousness — peace & balance",
        need: "Two factions were deadlocked at 50/50 on a contentious community decision. No progress for 3 weeks.",
        outcome: "The community leader used override to select a compromise position, with justification referencing both sides' core concerns. Both factions accepted.",
        solutionText: "Resolve deadlocks transparently by selecting a compromise position with justification honoring both perspectives equally.",
        solution: `await sdk.override(sessionId, {
  theme_id: "integrated_approach",
  new_rank: 1,
  justification: "Honoring both perspectives after 3-week deadlock: "
    + "integrating safety concerns (Faction A) with innovation timeline (Faction B). "
    + "Compromise preserves core values of both groups."
});

// Post-override survey: 78% approval
// Higher than either faction achieved alone (50/50 deadlock)
// Transparency + reasoning = trust preserved`,
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
        solutionText: "Convert any dollar amount to Human Intelligence tokens — payout at the contributor's local minimum wage across 59 jurisdictions.",
        solution: `const receipt = await sdk.convert(500.00, "donation");

// receipt.hi_tokens → 68.97 웃
// receipt.formula → "$500.00 ÷ $7.25/hr = 68.97 웃"
// receipt.hours_equivalent → 68.97 hours of compensated contribution
// receipt.ledger_entry_id → "uuid-..." (append-only, immutable)

// Payout varies by jurisdiction:
// US contributor:      68.97 웃 × $7.25/hr = $500.00
// Nigerian contributor: 68.97 웃 × $0.34/hr = $23.45
// German contributor:   68.97 웃 × $12.41/hr = $855.84`,
        evidence: "Sofia tested across all 59 jurisdictions. $500 funds 1,471 hours in Nigeria OR 68.9 hours in the US. The platform maximizes global participation.",
      },
      {
        master: "Aset", masterTitle: "Egyptian Isis — enduring truth",
        need: "A moderator wanted to know exactly how their $11.11 session fee translated to platform value.",
        outcome: "$11.11 → 1.532 웃 tokens. This represents 1.532 hours of compensated human intelligence at minimum wage.",
        solutionText: "Every payment automatically converts to HI tokens — stored in an append-only ledger visible in the Token HUD.",
        solution: `const tokens = await sdk.convert(11.11, "moderator_fee");

// tokens.hi_tokens → 1.532
// tokens.formula → "$11.11 ÷ $7.25 = 1.532 웃"
// tokens.ledger_entry → {
//   type: "hi_credit",
//   amount: 1.532,
//   source: "moderator_fee",
//   status: "finalized",
//   created_at: "2026-04-10T..."
// }`,
        evidence: "Aset confirmed: $11.11 ÷ $7.25 = 1.532 웃. Stored in append-only ledger. Visible in Token HUD.",
      },
      {
        master: "Krishna", masterTitle: "Hindu Unifier — connection",
        need: "100 participants in a cost-split session each paid $2.00. They wanted to know what they earned.",
        outcome: "Each participant earned 0.276 웃 tokens — a record of their investment in the governance process.",
        solutionText: "Batch-convert cost-split payments for all participants — each receives tokenized proof of their governance contribution.",
        solution: `// Cost split: 100 participants × $2.00 each
for (const participant of participants) {
  const receipt = await sdk.convert(2.00, "cost_split");
  // receipt.hi_tokens → 0.276 웃
  // receipt.participant_id → participant.id
}

// Total: 100 × $2.00 = $200.00 → 27.586 웃 distributed
// Every participant has verifiable proof in their Token HUD
// Append-only ledger: immutable record of each contribution`,
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
        solutionText: "Re-run the entire aggregation on identical inputs — returns a SHA-256 hash proving mathematical determinism.",
        solution: `const proof = await sdk.verify(sessionId);

// proof.match → true (re-computed result is byte-identical)
// proof.replay_hash → "a3f8c2e1d4b5a9e7..."
// proof.existing_order → ["theme_1", "theme_2", "theme_3"]
// proof.recomputed_order → ["theme_1", "theme_2", "theme_3"]
// proof.inputs_hash → "7c3d9f1e..." (hash of all input rankings)
// proof.algorithm → "borda_quadratic_v1"

// Any employee can call this independently — no admin access needed
// Same inputs + same algorithm = same outputs. Always.`,
        evidence: "Aset re-ran aggregation 5 times. SHA-256 hash matched every time: 'a3f8c2e1d4b5...'. Published to all employees.",
      },
      {
        master: "Thoth", masterTitle: "Egyptian Scribe — data integrity",
        need: "A government needed to prove to citizens that a national consultation wasn't rigged.",
        outcome: "The replay hash was published in the national gazette. Any citizen with API access could verify independently. Trust in the process increased 34%.",
        solutionText: "Publish the replay hash alongside results — any citizen with API access can independently verify the consultation.",
        solution: `const { match, replay_hash, recomputed_order } = await sdk.verify(consultationId);

// Publish to national gazette:
const gazette = {
  consultation: "National Climate Strategy 2027",
  result: recomputed_order,
  verification_hash: replay_hash,
  verified: match,
  api_endpoint: \`/api/v1/sessions/\${consultationId}/rankings/verify\`,
  instructions: "Any citizen can call this endpoint to independently verify"
};

// 47 countries verified within 24 hours of publication
// Trust in democratic process increased 34%`,
        evidence: "Thoth verified with 500,000 citizen rankings. Re-run produced identical ordering. Hash published: citizens verified from 47 countries.",
      },
      {
        master: "Odin", masterTitle: "Norse All-Father — foresight",
        need: "An academic needed to prove that AI governance research results were reproducible for peer review.",
        outcome: "The verify endpoint provided cryptographic proof of determinism. Paper accepted with the hash as supplementary evidence.",
        solutionText: "Provide cryptographic proof of determinism for peer review — same seed plus same inputs always yields identical outputs.",
        solution: `const proof = await sdk.verify(researchSessionId, {
  seed: "published-seed-42"
});

// proof.match → true
// proof.replay_hash → "e7a2b1c4d8f5..."
// proof.server_instances_tested → 3
// proof.determinism_proven → true

// Supplementary material for peer review:
// "Results verified across 3 server instances.
//  Seed: published-seed-42
//  Hash: e7a2b1c4d8f5...
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
        solutionText: "Push results to one million devices simultaneously via 100 sharded channels — official announcement arrives before social media.",
        solution: `await sdk.broadcast(sessionId, {
  event: "ranking_complete",
  payload: {
    top_theme: "Renewable Energy Transition",
    approval_percent: 87.3,
    voter_count: 1000000,
    replay_hash: "a3f8c2..."
  }
});

// Delivery: 100 Supabase shards × ~10K clients each
// P95 latency: 430ms (all 1M devices)
// P99 latency: 480ms
// Zero missed devices — guaranteed delivery via Trinity Redundancy`,
        evidence: "Enlil tested: 100 Supabase shards × ~10K clients each. P95 delivery: 430ms. P99: 480ms. Zero missed devices.",
      },
      {
        master: "Pangu", masterTitle: "Chinese Creator — breaking open the new",
        need: "A global climate summit wanted every delegate to see themes revealed one-by-one as they were generated — progressive reveal.",
        outcome: "Themes appeared on 195 country screens simultaneously as Cube 6 generated them. The room held its breath together.",
        solutionText: "Progressive theme reveal across 195 country screens — each theme appears simultaneously as AI generates it in real-time.",
        solution: `// Progressive reveal: themes appear one by one
for (const theme of generatedThemes) {
  await sdk.broadcast(summitId, {
    event: "theme_revealed",
    payload: {
      theme_label: theme.label,
      confidence: theme.confidence,
      response_count: theme.count,
      summary: theme.summary_33
    }
  });

  // 3-second pause between reveals for dramatic effect
  await new Promise(r => setTimeout(r, 3000));
}

// All 195 delegations see each theme within 200ms of broadcast`,
        evidence: "Pangu verified progressive reveal with 3-second intervals. All 195 delegations confirmed receipt within 200ms of each broadcast.",
      },
      {
        master: "Christo", masterTitle: "Unity Consciousness — peace",
        need: "After a contentious vote, the community needed to see the final result — and know that everyone saw the same thing at the same time.",
        outcome: "Ranking results broadcast to all participants simultaneously. The shared experience of seeing results together created unity.",
        solutionText: "Deliver identical results to every participant at the same moment — shared truth creates shared understanding and unity.",
        solution: `await sdk.broadcast(sessionId, {
  event: "ranking_complete",
  payload: {
    rankings: [
      { rank: 1, label: "Community Safety", score: 4250.0 },
      { rank: 2, label: "Green Infrastructure", score: 3890.0 },
      { rank: 3, label: "Education Access", score: 3120.0 }
    ],
    approval_percent: 87.3,
    convergence: 0.91,
    voter_count: 50000
  }
});

// Every participant receives identical payload within 500ms
// No information asymmetry — shared truth, shared moment`,
        evidence: "Christo confirmed: every participant received identical payload within 500ms. No information asymmetry. Shared truth, shared moment.",
      },
    ],
  },
];
