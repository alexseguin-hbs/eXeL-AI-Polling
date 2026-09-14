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

// ── Grounded theming (self-contained mode) ──────────────────────────────────
// The mock /ai/run + /themes handlers group the injected responses into the same
// Theme01 (Risk/Support/Neutral) × Theme02 (3/6/9) hierarchy the REAL Cube-6
// pipeline produces, with per-theme 33/111/333 summaries derived from the member
// responses. Pure + deterministic so a run replays byte-identically.

/** Signal phrases per stance (subset of the clause banks) for a light keyword classifier. */
const STANCE_SIGNALS: Record<Stance, string[]> = {
  risk: ["danger", "risk", "misuse", "bias", "fail", "erode", "lag", "opaque", "weapon", "manipulation", "outrunning", "displaced"],
  support: ["upside", "benefit", "efficien", "transparen", "amplif", "adoption", "underserved", "shared benefit", "free people", "many more voices"],
  neutral: ["depends", "mixed", "trade-off", "context", "pilot", "more data", "reasonable people", "credible arguments", "framing", "incremental"],
};

/** Classify a response's stance from its text; hash-buckets unknown text so grouping never empties. */
export function classifyStance(text: string): Stance {
  const t = (text || "").toLowerCase();
  const score: Record<Stance, number> = { risk: 0, support: 0, neutral: 0 };
  (Object.keys(STANCE_SIGNALS) as Stance[]).forEach((s) => {
    for (const sig of STANCE_SIGNALS[s]) if (t.includes(sig)) score[s]++;
  });
  const best = (Object.keys(score) as Stance[]).reduce((a, b) => (score[b] > score[a] ? b : a), "risk");
  if (score[best] > 0) return best;
  const order: Stance[] = ["risk", "support", "neutral"]; // hash fallback keeps the split non-empty
  return order[hashSeed(t) % 3];
}

const STANCE_ORDER: Stance[] = ["risk", "support", "neutral"];
const STANCE_TO_CATEGORY: Record<Stance, "risk" | "support" | "neutral"> = { risk: "risk", support: "support", neutral: "neutral" };
// Canonical Theme01 labels (mirror lib/adapt-live-themes.ts CATEGORY_TO_LABEL so the flower renders them).
const STANCE_PARENT_LABEL: Record<Stance, string> = { risk: "Risk & Concerns", support: "Supporting Comments", neutral: "Neutral Comments" };

function words(s: string): string[] { return String(s).trim().split(/\s+/).filter(Boolean); }
function clampWords(s: string, n: number): string { const w = words(s); return w.length <= n ? s : w.slice(0, n).join(" "); }

/** Grounded tier summary: round-robin the members' sentences up to `target` words, then clamp. */
function tierSummary(memberTexts: string[], target: number): string {
  const sentences: string[] = [];
  for (const t of memberTexts) for (const sent of String(t).split(/(?<=[.!?])\s+/)) { const s = sent.trim(); if (s) sentences.push(s); }
  if (sentences.length === 0) return "";
  let out = ""; let i = 0; const guard = sentences.length * 4;
  while (words(out).length < target && i < guard) { out += (out ? " " : "") + sentences[i % sentences.length]; i++; }
  return clampWords(out, target);
}

function titleCase(s: string): string { return s.replace(/\b\w/g, (c) => c.toUpperCase()); }
/** A content-grounded sub-theme label from a clause bank entry. */
function subLabel(stance: Stance, idx: number): string {
  const clause = CLAUSES[stance][idx % CLAUSES[stance].length];
  return titleCase(words(clause).slice(0, 4).join(" ")).replace(/[",.]/g, "");
}

/** One enriched theme row (matches lib/adapt-live-themes.ts LiveThemeRow / backend ThemeRead). */
export interface SimThemeRow {
  id: string;
  label: string;
  summary: string;            // 33-word tier
  summary_111: string;
  summary_333: string;
  confidence: number;         // 0-100
  response_count: number;
  theme01_category: "risk" | "support" | "neutral" | null;
  theme_level: string | null; // "3" | "6" | "9" | null(parent)
  parent_theme_id: string | null;
}

/**
 * Build the Theme01 × Theme02 (3/6/9) row set from injected responses, grounded in their text.
 * Same responses → identical rows. Plugs straight into adaptLiveThemes(sessionId, rows).
 */
export function buildSimThemeRows(responses: { id?: string; raw_text: string }[], seed = "sim"): SimThemeRow[] {
  const byStance: Record<Stance, string[]> = { risk: [], support: [], neutral: [] };
  for (const r of responses || []) byStance[classifyStance(r.raw_text)].push(r.raw_text);
  const rows: SimThemeRow[] = [];
  for (const stance of STANCE_ORDER) {
    const members = byStance[stance];
    if (members.length === 0) continue;
    const cat = STANCE_TO_CATEGORY[stance];
    const parentId = `th-${stance}`;
    const conf = (n: number, salt: string) => Math.min(97, 62 + n * 2 + (hashSeed(`${seed}:${salt}`) % 8));
    rows.push({
      id: parentId, label: STANCE_PARENT_LABEL[stance],
      summary: tierSummary(members, 33), summary_111: tierSummary(members, 111), summary_333: tierSummary(members, 333),
      confidence: conf(members.length, parentId), response_count: members.length, theme01_category: cat,
      theme_level: null, parent_theme_id: null,
    });
    for (const level of [3, 6, 9]) {
      // Partition members into `level` deterministic buckets (stable by hash).
      const buckets: string[][] = Array.from({ length: level }, () => []);
      members.forEach((m, i) => buckets[(hashSeed(`${seed}:${stance}:${level}:${i}`) % level)].push(m));
      buckets.forEach((bucket, b) => {
        rows.push({
          id: `${parentId}-l${level}-${b}`, label: subLabel(stance, b),
          summary: tierSummary(bucket, 33), summary_111: tierSummary(bucket, 111), summary_333: tierSummary(bucket, 333),
          confidence: conf(bucket.length, `${parentId}:${level}:${b}`), response_count: bucket.length,
          theme01_category: cat, theme_level: String(level), parent_theme_id: parentId,
        });
      });
    }
  }
  return rows;
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
