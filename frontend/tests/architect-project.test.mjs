// ARCHITECT-2525 PROJECT engine lock — paramScale / styleEquivalence / gateRef / projectRollup are pure + deterministic
// and drive the global-params recalc (#115), the standard-vs-stylized equivalent-sqft feature (#129), and gate status.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-project.test.mjs
import { DEFAULT_PARAMS, styleEquivalence, paramScale, gateRef, projectRollup } from "../lib/architect-project.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── defaults + scale ──
ok(DEFAULT_PARAMS.areaSqft === 2000 && DEFAULT_PARAMS.stories === 1 && DEFAULT_PARAMS.finish === "standard", "DEFAULT_PARAMS 2000/1/standard");
ok(paramScale(DEFAULT_PARAMS) === 1, "default params = reference scale 1");
ok(paramScale({ areaSqft: 4000, stories: 2, finish: "luxury", style: "standard" }) === 5.92, "bigger/luxury scales up (5.92×)");
ok(paramScale({ areaSqft: 4000, stories: 1, finish: "standard" }) > 1, "more area → larger scale");

// ── style equivalence (#129: stylized packs more usable + equivalent standard sqft) ──
const sty = styleEquivalence({ areaSqft: 2000, stories: 1, finish: "standard", style: "stylized" });
const std = styleEquivalence({ areaSqft: 2000, stories: 1, finish: "standard", style: "standard" });
ok(std.equivalentStandardGross === std.gross, "standard style: equivalent == gross (baseline)");
ok(sty.usable > std.usable, "stylized yields MORE usable area than standard");
ok(sty.equivalentStandardGross > sty.gross, "stylized is worth MORE equivalent standard gross sqft");
ok(sty.usable === 1840 && sty.equivalentStandardGross === 2244, "stylized pinned: 1840 usable · 2244 equiv");
ok(std.usable === 1640, "standard pinned: 1640 usable");

// ── gateRef status by current gate ──
ok(gateRef(3, 5).status === "passed", "gate behind current → passed");
ok(gateRef(3, 3).status === "in_progress", "gate == current → in_progress");
ok(gateRef(3, 1).status === "not_started", "gate ahead of current → not_started");
ok(gateRef(3).sequence === 3 && typeof gateRef(3).gateId === "string", "gateRef carries sequence + gateId");

// ── projectRollup — shape + scale link + determinism ──
const r = projectRollup([], 3, DEFAULT_PARAMS);
ok(["count", "costUsd", "aaceClass", "confidencePct", "costBand", "gate", "ssses", "scale"].every((k) => k in r), "projectRollup has the expected fields");
ok(r.scale === paramScale(DEFAULT_PARAMS), "rollup scale = paramScale");
ok(JSON.stringify(projectRollup([], 3, DEFAULT_PARAMS)) === JSON.stringify(r), "projectRollup deterministic");

console.log(`\nARCHITECT-PROJECT ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
