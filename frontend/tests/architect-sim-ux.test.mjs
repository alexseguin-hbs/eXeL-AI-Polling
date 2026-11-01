// ARCHITECT-2525 · SIMULATE UX (operator 2026-10-31: "see simulate all; should be defaulted" · "use: Red to Green for
// 1-5 star"). Source gate on the Simulate card: SIMULATE ALL is the default state, every 1–5 rating is coloured on one
// red → green scale, and COMPARE is live at load (not hard-disabled behind "run all 3 first").
// Run: node tests/architect-sim-ux.test.mjs
import fs from "node:fs";
import path from "node:path";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const so = fs.readFileSync(path.resolve(HERE, "../components/architect-2525/simulate-options.tsx"), "utf8");

// SIMULATE ALL by default — the matrix opens scored for all three forms
ok(/useState<Set<string>>\(\(\) => new Set\(SIM_MODELS\.map\(\(m\) => m\.id\)\)\)/.test(so), "simulated initialises to ALL forms (SIMULATE ALL by default)");

// RED → GREEN for a 1–5 rating — one scale, applied to the matrix number, the matrix stars, the column avg, the ratings strip, the card Energy/Carbon
ok(/const scoreColor = \(n: number\) => SCORE_COLORS\[/.test(so) && /const SCORE_COLORS = \["#ef4444", "#ef4444", "#f59e0b", "#eab308", "#84cc16", "#22c55e"\]/.test(so), "one red→green scale: 1 red · 2 orange · 3 amber · 4 lime · 5 green");
ok((so.match(/scoreColor\(/g) || []).length >= 6, `scoreColor is applied in every star/score site (got ${(so.match(/scoreColor\(/g) || []).length})`);
ok(/color: !shown \? C\.dim : scoreColor\(c\.score\)/.test(so), "the matrix cell number is red→green by score");
ok(/style=\{\{ color: scoreColor\(c\.stars\) \}\}>\{stars\(c\.stars\)\}/.test(so), "the matrix cell stars are red→green by score");
ok(/scoreColor\(m\.energyScore\)/.test(so) && /scoreColor\(carbonFor\(m, opt\)\)/.test(so), "the card Energy/Carbon stars are red→green");

// COMPARE live at load (SIMULATE ALL default means allSimulated is true at open) — the button is not permanently gated
ok(/const allSimulated = SIM_MODELS\.every\(\(m\) => simulated\.has\(m\.id\)\)/.test(so), "allSimulated still gates COMPARE, but with SIMULATE ALL default it is true at load");

console.log(`\narchitect-sim-ux: ${pass} passed, ${fail} failed · SIMULATE ALL by default · red→green 1–5 stars`);
process.exit(fail ? 1 : 0);
