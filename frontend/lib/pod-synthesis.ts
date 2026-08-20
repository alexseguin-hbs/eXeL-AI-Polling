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
 * Three paragraphs summing to ~333 words total (operator: the 3-paragraph summary
 * need NOT be exactly 111 words per paragraph — natural lengths are fine):
 *   1. Results     — what the pod produced.
 *   2. What changed — what changed because of it (the settled 웃 / ◬).
 *   3. What next    — where the outcome goes.
 *
 * Deterministically: data-driven core sentences first, then whole doctrine sentences
 * added to whichever paragraph is currently shortest until the TOTAL reaches ~333.
 * No sentence is reused, so the prose reads cleanly at any size of contribution.
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

const TOTAL_TARGET = 333;   // ~333 words across the three paragraphs (not per-paragraph)

const countWords = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** A first-letter-lowercased fragment (so it reads inside a sentence), trailing "." stripped. */
const frag = (s: string) => {
  const t = (s || "").trim().replace(/[.。]+$/, "");
  return t ? t.charAt(0).toLowerCase() + t.slice(1) : "";
};

/** First N words of a string (trailing sentence punctuation stripped, for a quoted excerpt). */
const firstWords = (s: string, n: number) => {
  const w = (s || "").trim().replace(/[.。!?！？]+$/, "").split(/\s+/).filter(Boolean);
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
  "Recognition is not money, and qualification is not conversion.",
  "Every hour that counted was witnessed by two other members before it settled.",
  "A self-attestation alone, unwitnessed, settles nothing here.",
  "Seed is membership, an entry credential beside the Trinity, never a paywall on contribution.",
  "Classification precedes settlement, always, so changing a destination never changes what a thing legally is.",
  "The append-only ledger keeps every correction visible, with the reason recorded at the time.",
  "No single government, bank, founder, or model is indispensable to it.",
  "The reward pool is sized by qualified growth after qualification, and it mints no token by itself.",
  "Human hands wield the tools, and the tools never replace the hands that wield them.",
  "This is coordination without capture, resilient by lawful portability rather than evasion.",
  "Value reaches the person first, and then flows through qualified rails to where they elect.",
  "Where a capability is not yet lawful in a place, it fails closed rather than falling over.",
  "Measurement of Time keeps the actual minutes on the record, separate from the tokens that settled.",
  "The whole session replays deterministically, so anyone can reconstruct exactly what happened.",
  "Human authority remains accountable for every consequential decision, and the sovereign layer stays closed to machines.",
];

/**
 * Build three paragraphs from their data cores, then top up to ~TOTAL_TARGET words
 * across all three by adding whole doctrine sentences (each used at most once) to
 * whichever paragraph is currently shortest. Natural paragraph lengths — no forced
 * per-paragraph count — deterministic, and it stops once the total is close enough.
 */
function assembleAll(cores: string[][]): string[] {
  const paras = cores.map((c) => c.filter(Boolean));
  const wc = (p: string[]) => p.reduce((n, s) => n + countWords(s), 0);
  let total = paras.reduce((n, p) => n + wc(p), 0);

  // doctrine sentences, largest first, each placed once
  const avail = [...POOL].sort((a, b) => countWords(b) - countWords(a));
  for (const sentence of avail) {
    if (total >= TOTAL_TARGET) break;
    const w = countWords(sentence);
    // place on the currently-shortest paragraph, if it keeps the total from overshooting badly
    let shortest = 0;
    for (let i = 1; i < paras.length; i++) if (wc(paras[i]) < wc(paras[shortest])) shortest = i;
    if (total + w <= TOTAL_TARGET + 8) { paras[shortest].push(sentence); total += w; }
  }
  return paras.map((p) => p.join(" "));
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

  const [results, changed, next] = assembleAll([resultsCore, changedCore, nextCore]);
  return { results, changed, next };
}
