// Admin Simulation Console core (operator 2026-09-14: the easter-egg SIM should simulate the
// features with actual API usage — "create responses 100-400 words long around a question, then
// test that set and question … test 5000 responses or new actual questions grouping theme01
// theme02 and simulating priorities in the ranking round").
//
// Pure + deterministic (seeded) so a run is reproducible and unit-lockable. The generator is the
// "AI + HI supplemented inputs" option: it fabricates realistic, question-referencing responses of
// 100-400 words that the REAL Cube-6 pipeline then themes and the REAL Cube-7 round then ranks.
// This module produces the inputs; the driver (sim-console driver / mock handlers) runs them
// through the endpoints. AI-authored text is labelled by the caller ("AI-written").

export type Stance = "risk" | "support" | "neutral";

/** Deterministic RNG (mulberry32) — same family as lib/sample-session-data.ts so runs are stable. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h = (h ^ s.charCodeAt(i)) >>> 0; h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

// Stance-flavoured clause banks (generic across domains; the question is woven in by the opener).
const CLAUSES: Record<Stance, string[]> = {
  risk: [
    "the pace of change is outrunning the safeguards we have in place",
    "without clear accountability, mistakes will be hard to trace back to a decision",
    "bias in the underlying data can quietly harden into unfair outcomes at scale",
    "surveillance and misuse are real dangers once the capability exists",
    "concentrating this much power in a few hands invites manipulation",
    "the failure modes are opaque, so a small error can propagate before anyone notices",
    "regulation lags far behind the technology it is meant to govern",
    "people displaced by automation deserve a plan, not an afterthought",
    "security holes become weapons the moment they are discovered",
    "trust erodes fast when a system cannot explain why it did what it did",
  ],
  support: [
    "the upside for people who have been underserved is genuinely large",
    "done well, this compresses months of coordination into days",
    "transparency and auditability can be designed in from the start rather than bolted on",
    "shared benefit is possible when the governance keeps humans in the loop",
    "the efficiency gains free people to do the work only humans can do",
    "open participation lets many more voices shape the outcome",
    "measurable results let us keep what works and drop what does not",
    "when incentives are aligned, adoption follows because it earns its place",
    "small teams can now attempt what once needed an institution",
    "the tools amplify intent rather than replace judgement",
  ],
  neutral: [
    "the answer depends heavily on how the details are implemented",
    "there are credible arguments on more than one side of this",
    "it is worth piloting narrowly before drawing broad conclusions",
    "the evidence so far is mixed and still early",
    "context matters more than any single principle here",
    "the same mechanism can help or harm depending on who controls it",
    "reasonable people weigh the trade-offs differently",
    "more data would settle several of these open questions",
    "the framing of the question shapes the answer we get",
    "incremental steps with review gates seem more defensible than a leap",
  ],
};

const CONNECTORS = [
  "In my experience,", "To be candid,", "Looking at it practically,", "From where I sit,",
  "On balance,", "If I am honest,", "Speaking for my team,", "Weighing it carefully,",
  "Having thought about this,", "For what it is worth,",
];

/** Distribution mirrors the showcase (Risk 50% / Support 35% / Neutral 15%) so grouping is realistic. */
const STANCE_PICK: [Stance, number][] = [["risk", 0.5], ["support", 0.85], ["neutral", 1.0]];
function pickStance(r: number): Stance {
  for (const [s, cut] of STANCE_PICK) if (r <= cut) return s;
  return "neutral";
}

export interface SimResponse {
  id: string;
  participant_id: string;
  raw_text: string;
  stance: Stance;
  language_code: string;
  word_count: number;
}

/**
 * Generate `count` deterministic responses of 100-400 words each, woven around `question`.
 * Same (question, count, seed) → byte-identical set, so a run is reproducible.
 */
export function generateSimResponses(question: string, count: number, seed = "sim"): SimResponse[] {
  const rand = mulberry32(hashSeed(`${seed}:${question}:${count}`));
  const q = (question || "this question").trim().replace(/\s+/g, " ");
  const qShort = q.length > 120 ? q.slice(0, 117) + "…" : q;
  const out: SimResponse[] = [];
  for (let i = 0; i < count; i++) {
    const stance = pickStance(rand());
    const target = 100 + Math.floor(rand() * 301); // 100..400 words
    const bank = CLAUSES[stance];
    const opener = `${CONNECTORS[Math.floor(rand() * CONNECTORS.length)]} on "${qShort}" — my honest read is that `;
    let text = opener + bank[Math.floor(rand() * bank.length)] + ".";
    // Keep adding stance clauses (varied, non-repeating where possible) until we clear the target.
    const used = new Set<number>();
    let guard = 0;
    while (text.split(/\s+/).length < target && guard++ < 200) {
      let idx = Math.floor(rand() * bank.length);
      if (used.size < bank.length) { while (used.has(idx)) idx = Math.floor(rand() * bank.length); }
      used.add(idx);
      const conn = CONNECTORS[Math.floor(rand() * CONNECTORS.length)];
      text += ` ${conn} ${bank[idx]}.`;
      if (used.size >= bank.length) used.clear();
    }
    // Trim to the 100..400 band (never exceed 400).
    const words = text.split(/\s+/);
    if (words.length > 400) text = words.slice(0, 400).join(" ");
    out.push({
      id: `sim-${i}`,
      participant_id: `sim-p-${i}`,
      raw_text: text,
      stance,
      language_code: "en",
      word_count: text.split(/\s+/).length,
    });
  }
  return out;
}

/**
 * Simulate a ranking round: `voters` deterministic ballots over `themeIds`. Each voter has a
 * seeded preference permutation (a light bias toward the given order) so the aggregate has real
 * structure rather than noise — the Cube-7 round then produces stable priorities.
 */
export function simulateBallots(themeIds: string[], voters: number, seed = "sim"): string[][] {
  const rand = mulberry32(hashSeed(`${seed}:ballots:${themeIds.join(",")}:${voters}`));
  const ballots: string[][] = [];
  for (let v = 0; v < voters; v++) {
    // weight each theme by (base priority + noise); sort desc → this voter's ranking.
    const weighted = themeIds.map((id, i) => ({ id, w: (themeIds.length - i) + rand() * themeIds.length }));
    weighted.sort((a, b) => b.w - a.w);
    ballots.push(weighted.map((x) => x.id));
  }
  return ballots;
}
