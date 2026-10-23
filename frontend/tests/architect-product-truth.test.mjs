// ARC-38 — product truth: the live Architect surface (command-ux1.tsx) renders no unsupported claim. Every
// front-page value traces to canonical Runtime state or a declared ASSUMPTION; SPIRAL/SYNC/SSSES read NOT_RUN,
// never the planning scores (advisory §5); the economy is not presented as a construction cost (§XI); the
// stage renders as the WORD, never a bare G# (§X). The shared defaults (DEFAULT_PROGRAM.bathrooms=2,
// DEFAULT_PARAMS.areaSqft=2000) stay UNCHANGED (firewall) — this project's 900 ft²/1 Bath come from canonical.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-product-truth.test.mjs
import { readFileSync } from "node:fs";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };
const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const ux = read("../components/architect-2525/command-ux1.tsx");

// ── the Architect surface reads from canonical Runtime (§08/§III) ──
ok(/buildProjectFromSeed\(TINY_HOME_V1\)/.test(ux), "command-ux1 builds the canonical R0 project");
ok(/canonStageWord/.test(ux) && /netProgramAreaUm2/.test(ux), "stage word + net program area are canonical-sourced");

// ── the stage renders as the WORD, never a bare G# (§X, Aset) ──
ok(!/>\s*G6\s*</.test(ux), "no bare 'G6' rendered on the surface");
ok(!/>\s*G\d+\s*</.test(ux.replace(/G\d+\s+\w/g, "")), "no bare G<n> stage token rendered (GATES labels like 'G2 Site' excluded)");
ok(/\{canonStageWord\} · \{canonPlanState\}/.test(ux), "the stage reads the canonical WORD · plan state");

// ── SPIRAL / R-CORE / SSSES / Replay read NOT_RUN, never a fabricated green/SYNC (advisory §5) ──
ok(!/SPIRAL <span[^>]*>green</.test(ux) && !/>\s*green\s*<\/span>/.test(ux), "SPIRAL does not render a fabricated 'green'");
ok(!/R-CORE <span[^>]*>SYNC</.test(ux), "R-CORE does not render a fabricated 'SYNC'");
ok(/SPIRAL <span[^>]*>NOT_RUN</.test(ux) && /R-CORE <span[^>]*>NOT_RUN</.test(ux), "SPIRAL and R-CORE read NOT_RUN");

// ── project cost is NOT CALCULATED; the economy is not presented as a construction cost (§XI) ──
ok(!/Project Cost" value=\{fmtUsd\(econ\.totalUsd\)/.test(ux), "Project Cost tile no longer reads econ.totalUsd");
ok(/Project Cost" value="NOT CALCULATED"/.test(ux), "Project Cost reads NOT CALCULATED");
ok(!/MoT × \$\/min/.test(ux), "no 'MoT × $/min' claim (§3.4)");
ok(!/Time Capital" value=\{fmtUsd\(econ\.timeCapitalUsd\)/.test(ux), "the fabricated Time Capital tile is quarantined");

// ── risk + walls are quarantined ──
ok(!/Risk" value="LOW"/.test(ux), "no 'Risk LOW' claim");
ok(!/30.50% lower/.test(ux), "no '30–50% lower' risk claim");
ok(!/designMetrics\.walls/.test(ux), "the Model tile no longer reads designMetrics.walls (no-walls hard stop)");

// ── the truthful canonical values are present ──
ok(/\$\{canonSqft\} ft²/.test(ux), "Net Program reads the canonical 900 ft²");
ok(/Budget Target/.test(ux) && /ASSUMED/.test(ux), "Budget Target is shown as ASSUMED");

// ── firewall: the shared defaults are UNCHANGED (this project's 900/1 come from canonical, not the defaults) ──
const prog = read("../lib/room-program.ts");
ok(/bathrooms:\s*2\b/.test(prog), "DEFAULT_PROGRAM.bathrooms stays 2 (firewall unchanged)");
const proj = read("../lib/architect-project.ts");
ok(/areaSqft:\s*2000\b/.test(proj), "DEFAULT_PARAMS.areaSqft stays 2000 (firewall unchanged)");

console.log(`\narchitect-product-truth: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
