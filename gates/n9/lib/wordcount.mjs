/**
 * Authoritative review-gate tokenizer for AsM-111 / MoT-333 (fleet contract).
 * Source: frontend/scripts/build-fleet48-review.mjs — whitespace split + filter(Boolean).
 * Distinct from: Vision lv-gate dash-exclusion; Python str.split(); pod soft ~333 band.
 */
export const ASM_MASTERS = Object.freeze([
  "Aset", "Asar", "Athena", "Christo", "Enki", "Enlil",
  "Krishna", "Odin", "Pangu", "Sofia", "Thoth", "Thor",
]);

export const ASM_LENSES = Object.freeze({
  Aset: "consistency",
  Asar: "synthesis/outcome",
  Athena: "strategic flow",
  Christo: "consensus/user-flow",
  Enki: "edge-cases/diversity",
  Enlil: "implementation/build",
  Krishna: "cross-module integration",
  Odin: "predictive/future-proof",
  Pangu: "cutting-edge",
  Sofia: "multi-perspective",
  Thoth: "data/geometry",
  Thor: "risk & security stress",
});

/** Fleet / AsM / MoT review word counter (exact gate). */
export function countWords(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function assertExactWords(text, n, label = "text") {
  const got = countWords(text);
  if (got !== n) {
    const err = new Error(`${label}: expected exactly ${n} words, got ${got}`);
    err.code = "WORD_COUNT";
    err.expected = n;
    err.actual = got;
    throw err;
  }
  return got;
}

export function validateAsm111Comments(comments, { requireAllTwelve = true } = {}) {
  const issues = [];
  if (!Array.isArray(comments)) {
    return { ok: false, issues: ["comments must be an array"], counts: {} };
  }
  const seen = new Set();
  const counts = {};
  for (const c of comments) {
    const master = c?.master;
    const text = c?.text ?? "";
    if (!ASM_MASTERS.includes(master)) {
      issues.push(`unknown or missing master: ${master}`);
      continue;
    }
    if (seen.has(master)) issues.push(`duplicate master: ${master}`);
    seen.add(master);
    const n = countWords(text);
    counts[master] = n;
    if (n !== 111) issues.push(`${master}: ${n} words, not 111`);
    if (c?.mode === "genuine-multi-author" && c?.author_label == null) {
      issues.push(`${master}: genuine-multi-author requires author_label`);
    }
  }
  if (requireAllTwelve) {
    for (const m of ASM_MASTERS) {
      if (!seen.has(m)) issues.push(`missing master: ${m}`);
    }
  }
  return { ok: issues.length === 0, issues, counts };
}

/** MoT synthesis: exactly three paragraphs, each exactly 111 words (fleet gate). */
export function validateMot333(paragraphs) {
  const issues = [];
  if (!Array.isArray(paragraphs)) {
    return { ok: false, issues: ["paragraphs must be an array of 3 strings"], counts: [] };
  }
  if (paragraphs.length !== 3) {
    issues.push(`expected 3 paragraphs, got ${paragraphs.length}`);
  }
  const counts = paragraphs.map((p) => countWords(p));
  paragraphs.forEach((p, i) => {
    if (counts[i] !== 111) issues.push(`paragraph ${i + 1}: ${counts[i]} words, not 111`);
  });
  const total = counts.reduce((a, b) => a + b, 0);
  if (paragraphs.length === 3 && total !== 333) {
    issues.push(`total ${total} words, not 333`);
  }
  return { ok: issues.length === 0, issues, counts, total };
}

/** Pod product soft band (NOT the fleet AsM/MoT gate). Documented for contrast only. */
export function inPodSoft333Band(total) {
  return total >= 300 && total <= 345;
}
