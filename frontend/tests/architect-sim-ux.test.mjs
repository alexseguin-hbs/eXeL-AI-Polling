// ARCHITECT-2525 · SIMULATE UX (operator 2026-10-31: "use: Red to Green for 1-5 star" · 2026-11-01 R-UX6: "remove
// simulate button … comparison should always be live"). Source gate on the Simulate surface: there is NO run state —
// every design is scored live at load; the per-card EXPAND toggle only shows/hides detail; every 1–5 rating is coloured
// on one red → green scale; COMPARE is always live (never hard-disabled).
// Run: node tests/architect-sim-ux.test.mjs
import fs from "node:fs";
import path from "node:path";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const so = fs.readFileSync(path.resolve(HERE, "../components/architect-2525/simulate-options.tsx"), "utf8");
const code = so.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");   // source with comments stripped

// NO run state — every design is scored live at load (the 'simulated' Set + SIMULATE button are gone; only EXPAND toggles detail)
ok(/const \[expanded, setExpanded\] = useState<Set<string>>\(new Set\(\)\)/.test(so), "the only per-card toggle is EXPAND (detail show/hide) — no run state");
ok(!/\bsimulated\b/.test(code), "no 'simulated' run gate remains in the code (comments aside)");
ok(!/data-arch-sim-run|◉ SIMULATE|NOT_RUN|run all 3 first/.test(so), "the SIMULATE button, NOT_RUN and 'run all 3 first' are gone");
ok(/data-arch-sim-expand=\{m\.id\}/.test(so), "each card has an EXPAND control (See details / Hide details)");

// RED → GREEN for a 1–5 rating — one scale, applied to the matrix number, the matrix stars, the column avg, the ratings strip, the card Energy/Carbon
ok(/const scoreColor = \(n: number\) => SCORE_COLORS\[/.test(so) && /const SCORE_COLORS = \["#ef4444", "#ef4444", "#f59e0b", "#eab308", "#84cc16", "#22c55e"\]/.test(so), "one red→green scale: 1 red · 2 orange · 3 amber · 4 lime · 5 green");
ok((so.match(/scoreColor\(/g) || []).length >= 6, `scoreColor is applied in every star/score site (got ${(so.match(/scoreColor\(/g) || []).length})`);
ok(/style=\{\{ color: scoreColor\(c\.score\) \}\}/.test(so) && !/!shown/.test(so), "the matrix cell number is red→green by score, always shown (no run gate)");
ok(/style=\{\{ color: scoreColor\(c\.stars\) \}\}>\{stars\(c\.stars\)\}/.test(so), "the matrix cell stars are red→green by score");
ok(/scoreColor\(m\.energyScore\)/.test(so) && /scoreColor\(carbonFor\(m, opt\)\)/.test(so), "the card Energy/Carbon stars are red→green");

// COMPARE always live — never hard-disabled behind a run gate
ok(!/disabled=\{!allSimulated\}/.test(so) && /data-arch-sim-compare onClick/.test(so), "COMPARE is always live (not disabled behind 'run all 3 first')");

console.log(`\narchitect-sim-ux: ${pass} passed, ${fail} failed · no run state · live scoring · red→green 1–5 · EXPAND for detail`);
process.exit(fail ? 1 : 0);
