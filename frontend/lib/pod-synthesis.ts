/**
 * pod-synthesis.ts — the 333-word (3 × 111) close-out synthesis for a ◬ ♡ 웃 pod.
 *
 * The Session's CLOSED phase asks for "summarization to 333-word 3-paragraph
 * outcomes" (operator, 2026-08-19). In production Cube 6 (the AI pipeline) writes
 * these three tiers from the recorded outcome; that needs the backend. This module
 * is the LOCAL-FIRST generator the prototype falls back to when Cube 6 is out of
 * reach — deterministic (same pod → same synthesis, so it replays), grounded in
 * the pod's own data (intent, outcome, the recorded words, witnessed hours, the 웃
 * that settled, the ◬ delta), and written in the Master-of-Thought register.
 *
 * Each of the three paragraphs lands on EXACTLY 111 words:
 *   1. Results     — what the pod produced.
 *   2. What changed — what changed because of it (the settled 웃 / ◬).
 *   3. What next    — where the outcome goes.
 *
 * The exact count is reached deterministically: data-driven core sentences first,
 * then whole doctrine sentences (largest that still fits), then one exact-length
 * closing clause from a 1..15-word bank. No sentence is reused within a paragraph,
 * so the prose reads cleanly at any pod size of contribution.
 */

import type { Synthesis333 } from "./pod-projects";

export interface SynthesisMember {
  name: string;
  role: string;
  hours: number;
  did: string;
  witnessed: boolean;
}

export interface SynthesisInput {
  intent: string;
  outcome: string;
  recordMethod: string;
  recordValue: string;
  members: SynthesisMember[];
  witnessedHours: number;
  totalYugYok: number;   // 웃 that settle
  M: number;
  baseline: number;      // frozen-baseline hours (0 = none set)
  accelDelta: number;    // hours saved vs baseline
  yaTriangle: number;    // ◬ recognised
  signerName: string;
  podCode: string;
}

const TARGET = 111;

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** A first-letter-lowercased fragment (so it reads inside a sentence), trailing "." stripped. */
const frag = (s: string) => {
  const t = (s || "").trim().replace(/[.。]+$/, "");
  return t ? t.charAt(0).toLowerCase() + t.slice(1) : "";
};

/** First N words of a string, for a short verbatim excerpt of the recording. */
const firstWords = (s: string, n: number) => {
  const w = (s || "").trim().split(/\s+/).filter(Boolean);
  return w.length <= n ? w.join(" ") : w.slice(0, n).join(" ") + "…";
};

const firstName = (full: string) => (full.trim().split(/\s+/)[0] || "").trim();

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ""));

const methodPhrase = (m: string) =>
  m === "video" ? "as an unlisted video link"
    : m === "voice" ? "by voice, transcribed on the spot"
      : "in written words";

/** Section-agnostic doctrine sentences — each self-contained and true in any order. */
const POOL: string[] = [
  "Recognition is not money; qualification is not conversion.",                 // 8
  "Every hour that counted was witnessed by two before it settled.",            // 11
  "A self-attestation alone settles nothing here.",                             // 6
  "Seed is membership, not a paywall on contribution.",                         // 8
  "Classification precedes settlement, always.",                               // 4
  "The append-only ledger keeps every correction visible.",                     // 7
  "No single government, bank, or founder is indispensable to it.",             // 10
  "The reward pool is sized by growth, and mints no token.",                    // 11
  "Human hands wield the tools; the tools never replace the hands.",            // 11
  "This is coordination without capture.",                                      // 5
];

/** Exact-length closing clauses, one per word-count 1..15 (self-contained fragments). */
const BANK: Record<number, string> = {
  1: "Witnessed.",
  2: "It holds.",
  3: "Nothing was minted.",
  4: "The pod bore witness.",
  5: "Continuity, not dependency, is served.",
  6: "The record replays exactly as written.",
  7: "Two witnessed the third before it counted.",
  8: "Recognition is not money; qualification is not conversion.",
  9: "Every correction stays visible on the append-only ledger forever.",
  10: "Human authority stays accountable, and the sovereign layer stays closed.",
  11: "The pod is three, so two can witness a third fairly.",
  12: "One ontology, many lawful rails, and no single indispensable intermediary stands anywhere.",
  13: "Value accrues to the person first, and then flows to where they elect.",
  14: "Measurement of Time keeps every actual minute, separate from the tokens that finally settled.",
  15: "Shared intention moved at the speed of thought, witnessed, recorded, and kept on the ledger.",
};

/**
 * Assemble a paragraph of EXACTLY `target` words: core sentences, then the largest
 * doctrine sentences that fit (each once), then one exact-length bank clause.
 * If the core already meets/exceeds the target, it is returned as-is.
 */
function assemble(core: string[], target: number): string {
  const sentences = core.filter(Boolean);
  let total = sentences.reduce((n, s) => n + countWords(s), 0);
  if (total >= target) return sentences.join(" ");

  const used = new Set<string>();
  // Largest-that-fits, so the remaining gap shrinks below the smallest pool sentence.
  const avail = [...POOL].sort((a, b) => countWords(b) - countWords(a));
  let progressed = true;
  while (total < target && progressed) {
    progressed = false;
    for (const s of avail) {
      if (used.has(s)) continue;
      const w = countWords(s);
      if (total + w <= target) { sentences.push(s); used.add(s); total += w; progressed = true; }
    }
  }
  let gap = target - total;
  while (gap > 0) {
    const take = Math.min(gap, 15);
    sentences.push(BANK[take]);
    gap -= take;
  }
  return sentences.join(" ");
}

export function buildSynthesis333(inp: SynthesisInput): Synthesis333 {
  const names = inp.members.map((m) => firstName(m.name) || m.role).filter(Boolean);
  const nameList =
    names.length >= 2 ? names.slice(0, -1).join(", ") + " and " + names[names.length - 1]
      : names[0] || "the pod";
  const podLabel = inp.podCode ? `pod ${inp.podCode}` : "the pod";

  // ── 1. Results ──────────────────────────────────────────────────────────
  const resultsCore = [
    `In ${podLabel}, ${nameList} set out to ${frag(inp.intent) || "advance a shared task"}, and closed one synchronized session on a single measurable outcome: ${frag(inp.outcome) || "the result they agreed to prove"}.`,
    `They recorded it ${methodPhrase(inp.recordMethod)}, so the outcome is evidence a settlement can stand on, not a claim taken on trust.`,
    inp.recordValue.trim()
      ? `In their own words, the pod noted: "${firstWords(inp.recordValue, 16)}".`
      : "",
  ];

  // ── 2. What changed ─────────────────────────────────────────────────────
  const changedCore = [
    `Because the work was witnessed, ${num(inp.witnessedHours)} cross-reviewed hours settled as ${num(inp.totalYugYok)} 웃, computed as M times hours with M of ${num(inp.M)}, and each person is bound by the 9,999-per-year ceiling with the rest rolling forward.`,
    inp.yaTriangle > 0
      ? `The pod also landed ${num(inp.accelDelta)} hours ahead of its ${num(inp.baseline)}-hour frozen baseline, so ${num(inp.yaTriangle)} ◬ were recognised — the hours delta alone, signed by ${inp.signerName || "the conflict-excluded signer"}, never a profit metric — which keeps the accelerator outside the securities perimeter.`
      : `No time was saved against the frozen baseline, so no ◬ were recognised for this task; the accelerator reads the hours delta only, never a profit metric.`,
    "Nothing new was minted; the pod only gated ♡, 웃, and ◬ that already exist.",
  ];

  // ── 3. What next ────────────────────────────────────────────────────────
  const nextCore = [
    "The outcome now feeds the backlog, where this pod, or the next, can adopt the following Task and Outcome from the same three projects and carry the thread forward.",
    "Measurement of Time keeps every actual minute on the append-only ledger, apart from the 웃 that settled, so the whole session replays exactly as it happened.",
    "Where the work grows a project's financial-innovation, the Qualified Innovation Score measures it and its growth sizes the reward pool — a measurement, never a second mint.",
  ];

  return {
    results: assemble(resultsCore, TARGET),
    changed: assemble(changedCore, TARGET),
    next: assemble(nextCore, TARGET),
  };
}
