// ARCHITECT-2525 · RED → VIOLET RAINBOW gate (operator 2026-11-01: "color order of visuals should be RED—> Violet ·
// rainbow order of trinity 13 · pick 6 colors where red is first and violet is last"). Every ordered colour sequence —
// the 6 build-timeline phases, the 11 Design phases, the 13 checks — runs red → violet from the one rainbow() source.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-rainbow.test.mjs
import fs from "node:fs";
import path from "node:path";
import { rainbow, hueOf } from "@/lib/architect-rainbow";
import { DEV_PHASES } from "@/lib/architect-phases";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");

// ── rainbow(n): red first, violet last, hue rises monotonically ──
for (const n of [6, 11, 13]) {
  const r = rainbow(n);
  ok(r.length === n && r.every((c) => /^#[0-9a-f]{6}$/i.test(c)), `rainbow(${n}) is ${n} hex colours`);
  ok(hueOf(r[0]) <= 8, `rainbow(${n}) starts RED (hue ${hueOf(r[0]).toFixed(0)}°)`);
  ok(hueOf(r[n - 1]) >= 270 && hueOf(r[n - 1]) <= 300, `rainbow(${n}) ends VIOLET (hue ${hueOf(r[n - 1]).toFixed(0)}°)`);
  let mono = true; for (let i = 1; i < n; i++) if (hueOf(r[i]) <= hueOf(r[i - 1])) mono = false;
  ok(mono, `rainbow(${n}) hue rises red → violet (no step goes backwards)`);
}
ok(rainbow(1)[0] && hueOf(rainbow(1)[0]) <= 8, "rainbow(1) is red");

// ── the 11 Design/Simulate phase colours ARE the rainbow, in build order (Foundation red … Interior violet) ──
const rb11 = rainbow(DEV_PHASES.length);
ok(DEV_PHASES.length === 12, "12 phases");
ok(DEV_PHASES.every((p, i) => p.color === rb11[i]), "every phase colour is the red→violet rainbow value for its build-order slot");
ok(hueOf(DEV_PHASES[0].color) <= 8 && DEV_PHASES[0].id === "foundation", "Foundation (phase 1) is RED");
ok(hueOf(DEV_PHASES[DEV_PHASES.length - 1].color) >= 270 && DEV_PHASES[DEV_PHASES.length - 1].id === "interior", "Interior Design (last phase) is VIOLET");

// ── the surfaces read from the one rainbow() source ──
const bi = read("../components/architect-2525/build-instructions.tsx");
ok(/from "@\/lib\/architect-rainbow"/.test(bi) && /rainbow\(BUILD_ORDER\.length\)/.test(bi), "the Build timeline colours come from rainbow(BUILD_ORDER.length)");
const ph = read("../lib/architect-phases.ts");
ok(/rainbow\(DEV_PHASES_SRC\.length\)/.test(ph), "the Design phase colours come from rainbow() over the build order");
const so = read("../components/architect-2525/simulate-options.tsx");
ok(/rainbow\(SIMS\.length\)/.test(so) && /SIM_RAINBOW\[i\]/.test(so), "the 13 check chips are coloured from rainbow(SIMS.length)");

console.log(`\narchitect-rainbow: ${pass} passed, ${fail} failed · red → violet, one source, 6 phases · 12 phases · 13 checks`);
process.exit(fail ? 1 : 0);
