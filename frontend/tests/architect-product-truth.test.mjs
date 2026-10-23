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

// ════════════════════════════════════════════════════════════════════════════════════════════════════════
// Block E (2/n) — the remaining tabs tell the truth too (Simulate/Review/Twin/Replay, Build, Iterate/Share/Qualify).
// Every fabricated status claim is quarantined; the honest NOT_RUN / NOT STARTED / BLOCKED / NO-record states are
// present. See docs/architecture-2525/PRODUCT_TRUTH_MIGRATION.md for old→new with reasons.
const p2 = read("../components/architect-2525/architect-panels2.tsx");
const bd = read("../components/architect-2525/architect-build.tsx");
const pn = read("../components/architect-2525/architect-panels.tsx");

// ── SimulatePanel / ReviewPanel / TwinPanel / ReplayPanel: no fabricated PASS / approval % / synced twin / decision ──
ok(!/deflection L\/480/.test(p2), "Simulate: no fabricated 'Structural PASS · deflection L/480'");
ok(!/c: 0\.94/.test(p2) && !/v: "approve"/.test(p2), "Review: no fabricated AI approval % / vote");
ok(!/· synced/.test(p2) && !/synchronized/.test(p2), "Twin: no fabricated 'synced'/'synchronized' twin");
ok(!/2025-05-1[0-9]/.test(p2), "Replay: no fabricated decision-log dates");
ok(/Actual · NOT STARTED/.test(p2), "Twin reads 'Actual · NOT STARTED'");
ok(/NOT_RUN/.test(p2) && /NO HUMAN REVIEWS RECORDED/.test(p2), "Simulate/Review read NOT_RUN / no reviews recorded");

// ── Build: BLOCKED, and the 4D sequence is labelled illustrative — no 'actual progress' claim ──
ok(/BUILD · BLOCKED · G4 Qualification required/.test(bd), "Build reads 'BLOCKED · G4 Qualification required'");
ok(!/TODAY · DAY/.test(bd) && !/Day \{day\}\/\{TOTAL\}/.test(bd), "Build no longer claims actual day-by-day progress");
ok(/illustrative/i.test(bd), "the Build sequence is labelled illustrative");

// ── Iterate / Share / Qualify: nothing approved/certified/on-chain that did not happen ──
ok(!/· APPROVED/.test(pn), "Iterate: no fabricated 'APPROVED' iteration");
ok(/— \/ 33 · not started/.test(pn), "Iterate reads '— / 33 · not started'");
ok(!/VERIFIED · IMMUTABLE · TRUSTED/.test(pn) && !/current = 6/.test(pn), "Qualify: no fabricated on-chain approval / G6-reached");
ok(/NO APPROVAL RECORDED/.test(pn) && /NOT RUN/.test(pn), "Qualify reads NO APPROVAL RECORDED / checks NOT RUN");
ok(!/Rotate great-room/.test(pn), "Share: no seeded fabricated comments");

console.log(`\narchitect-product-truth: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
