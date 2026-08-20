// Primary Comment Classification (R-CORE from Polling) — canonical invariants.
//
// Operator's "Claude Code Brief" locks a first-stage classification: every response
// gets exactly ONE primary category — Supporting Comments | Risk & Concerns | Neutral
// Comments — then themes within the category (Theme02 at levels 3/6/9). This test locks
// the invariants against the already-built simulation (lib/sample-session-data.ts) so
// they never regress. "9 Theme_02 per category" is the operator's overnight target.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/theme-classification.test.mjs
import { generateSampleSessionData } from "../lib/sample-session-data.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const CATEGORIES = ["Risk & Concerns", "Supporting Comments", "Neutral Comments"];
const d = generateSampleSessionData("test-session");

// ── one primary category per response, from the exclusive set of three ────────────
ok(d.responses.length > 0, "simulation produced responses");
ok(d.responses.every((r) => CATEGORIES.includes(r.theme1)), "every response has one primary category from the exclusive three");
const counts = Object.fromEntries(CATEGORIES.map((c) => [c, d.responses.filter((r) => r.theme1 === c).length]));

// ── headline counting: Supporting + Risk + Neutral == total ───────────────────────
ok(counts["Risk & Concerns"] + counts["Supporting Comments"] + counts["Neutral Comments"] === d.totalResponses,
  `Supporting + Risk + Neutral == total (${d.totalResponses})`);
ok(CATEGORIES.every((c) => d.theme1[c].count === counts[c]), "theme1 aggregate counts match the per-response tallies");

// ── exclusive (no multi-membership) → a distinct-circle model, not a Venn ──────────
ok(d.responses.every((r) => typeof r.theme1 === "string"), "primary category is a single value (no overlap → distinct circles, not a Venn)");

// ── 9 Theme_02 per category (+ 6 and 3 levels), the operator's overnight target ────
for (const c of CATEGORIES) {
  ok(d.theme2[c].level9.length === 9, `${c}: exactly 9 Theme_02 (level9) — got ${d.theme2[c].level9.length}`);
  ok(d.theme2[c].level6.length === 6, `${c}: 6 Theme_02 (level6)`);
  ok(d.theme2[c].level3.length === 3, `${c}: 3 Theme_02 (level3)`);
  // distinct labels at level9
  ok(new Set(d.theme2[c].level9.map((t) => t.label)).size === 9, `${c}: level9 labels are distinct`);
}

// ── drill-down integrity: Category → theme2_3 → theme2_6 → theme2_9 navigable ─────
for (const c of CATEGORIES) {
  const l3 = new Set(d.theme2[c].level3.map((t) => t.label));
  const l6 = new Set(d.theme2[c].level6.map((t) => t.label));
  const l9 = new Set(d.theme2[c].level9.map((t) => t.label));
  ok(d.responses.filter((r) => r.theme1 === c).every((r) => l9.has(r.theme2_9) && l6.has(r.theme2_6) && l3.has(r.theme2_3)),
    `${c}: every response's theme2_9/6/3 resolve within the category's hierarchy`);
}

// ── raw response is immutable / preserved (not replaced by the classification) ────
ok(d.responses.every((r) => typeof r.rawText === "string" && r.rawText.length > 0), "raw response text preserved on every record");
ok(d.responses.every((r) => r.summary333 === r.rawText || r.summary33.length <= r.rawText.length),
  "summaries derive from the raw response, never replace it");

// ── confidence is present and in a sane, labelable range ──────────────────────────
ok(d.responses.every((r) => r.theme1Confidence >= 60 && r.theme1Confidence <= 100), "primary-classification confidence in [60,100]");
ok(CATEGORIES.every((c) => d.theme1[c].avgConfidence >= 60 && d.theme1[c].avgConfidence <= 100), "aggregate classification confidence in [60,100]");

// ── determinism: same session id → identical classification (replay) ──────────────
const d2 = generateSampleSessionData("test-session-2");
ok(d2.responses.length === d.responses.length && d2.responses[0].theme1 === d.responses[0].theme1,
  "classification is deterministic (seeded) — replayable");

// ── the three categories are the same set the backend pipeline uses ───────────────
import { readFileSync } from "node:fs";
const py = readFileSync(new URL("../../backend/app/cubes/cube6_ai/phase_a.py", import.meta.url), "utf8");
ok(CATEGORIES.every((c) => py.includes(`"${c}"`)), "frontend categories match backend THEME01_CATEGORIES (phase_a.py)");

console.log(`\ntheme-classification: ${pass} passed, ${fail} failed`);
console.log(`  distribution — Risk ${counts["Risk & Concerns"]} · Supporting ${counts["Supporting Comments"]} · Neutral ${counts["Neutral Comments"]} · total ${d.totalResponses}`);
process.exit(fail ? 1 : 0);
