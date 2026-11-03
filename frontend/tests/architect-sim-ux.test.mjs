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
ok(/const scoreColor = \(n: number\) => SCORE_COLORS\[/.test(so) && /const SCORE_COLORS = \["#ef4444", "#ef4444", "#f97316", "#eab308", "#22c55e", "#15803d"\]/.test(so), "one red→green scale: 1 red · 2 orange · 3 amber · 4 green · 5 deep green (operator 2026-11-01: 1 red, 4–5 green)");
// 1-star must be RED and 4/5-star GREEN (operator 2026-11-01) — assert by hue, not just the literal
{ const grp = so.match(/SCORE_COLORS = \[([^\]]*)\]/); const cols = grp ? grp[1].split(",").map((x) => x.replace(/[^#0-9a-f]/gi, "")) : [];
  const hue = (hex) => { const m = /#(..)(..)(..)/.exec(hex); if (!m) return NaN; const r = parseInt(m[1],16)/255,g=parseInt(m[2],16)/255,b=parseInt(m[3],16)/255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn; if(!d)return 0; let h = mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4; h*=60; return h<0?h+360:h; };
  ok(cols.length === 6 && (hue(cols[1]) <= 20 || hue(cols[1]) >= 340), `1-star is red (hue ${hue(cols[1]).toFixed(0)}°)`);
  ok(hue(cols[4]) >= 90 && hue(cols[4]) <= 160 && hue(cols[5]) >= 90 && hue(cols[5]) <= 160, `4-star and 5-star are green (hues ${hue(cols[4]).toFixed(0)}° / ${hue(cols[5]).toFixed(0)}°)`); }
ok((so.match(/scoreColor\(/g) || []).length >= 6, `scoreColor is applied in every star/score site (got ${(so.match(/scoreColor\(/g) || []).length})`);
ok(/fontVariantNumeric: "tabular-nums", color: scoreColor\(c\.score\)/.test(so) && !/!shown/.test(so), "the matrix cell number is red→green by score, always shown (no run gate) — in the aligned ✦-slot cell (tabular-nums + scoreColor)");
ok(/style=\{\{ color: scoreColor\(c\.stars\) \}\}>\{stars\(c\.stars\)\}/.test(so), "the matrix cell stars are red→green by score");
ok(/scoreColor\(m\.energyScore\)/.test(so) && /scoreColor\(carbonFor\(m, opt\)\)/.test(so), "the card Energy/Carbon stars are red→green");

// COMPARE always live — never hard-disabled behind a run gate
ok(!/disabled=\{!allSimulated\}/.test(so) && /data-arch-sim-compare onClick/.test(so), "COMPARE is always live (not disabled behind 'run all 3 first')");

console.log(`\narchitect-sim-ux: ${pass} passed, ${fail} failed · no run state · live scoring · red→green 1–5 · EXPAND for detail`);
process.exit(fail ? 1 : 0);
