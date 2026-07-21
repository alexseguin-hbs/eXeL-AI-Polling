// ROOM PROGRAM lock — programMetrics feeds the Architect metric strip (FX-54: rooms · baths · sqft · windows · doors ·
// outlets) and the Building Program panel. Pure + deterministic; tiny homes are pinned to the 900 ft² TINY_HOME truth.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/room-program.test.mjs
import { programMetrics, deriveProgram, DEFAULT_PROGRAM, TINY_HOME } from "../lib/room-program.ts";
import { DEFAULT_PARAMS } from "../lib/architect-project.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// ── defaults ──
ok(DEFAULT_PROGRAM.bedrooms === 3 && DEFAULT_PROGRAM.bathrooms === 2 && DEFAULT_PROGRAM.ceilingFt === 9 && DEFAULT_PROGRAM.kitchens === 1, "DEFAULT_PROGRAM 3bd/2ba/9ft/1kitchen");
ok(TINY_HOME.grossSqft === 900 && TINY_HOME.footprintFt === 30 && TINY_HOME.rooms === 9, "TINY_HOME truth: 900 ft² · 30 ft · 9 rooms");
ok(TINY_HOME.bedrooms === 1 && TINY_HOME.bathrooms === 1 && TINY_HOME.windows === 8 && TINY_HOME.doors === 9, "TINY_HOME 1bd/1ba/8win/9door");

// ── full home metrics (metric-strip counts) ──
const full = programMetrics(DEFAULT_PARAMS, DEFAULT_PROGRAM, "full");
ok(full.grossSqft === 2000, "full grossSqft = params area (2000)");
ok(full.bathrooms === 2, "full baths = program baths");
ok(JSON.stringify(full.counts) === JSON.stringify({ rooms: 9, windows: 11, doors: 8, outlets: 36 }), "full counts pinned rooms9/win11/door8/outlets36");
ok(full.usableSqft > 0 && full.usableSqft <= full.grossSqft, "usable ≤ gross");
ok(full.counts.outlets >= full.counts.rooms, "≥1 outlet worth per room (code floor)");
ok(full.bedroomVolumeFt3 > 0 && full.perBedroomSqft > 0, "derived bedroom sqft + volume positive");

// ── tiny home is pinned to the fixed TINY_HOME truth ──
const tiny = programMetrics(DEFAULT_PARAMS, DEFAULT_PROGRAM, "tiny");
ok(tiny.grossSqft === TINY_HOME.grossSqft, "tiny grossSqft locks to TINY_HOME (900)");
ok(tiny.counts.windows === TINY_HOME.windows && tiny.counts.doors === TINY_HOME.doors, "tiny window/door counts lock to TINY_HOME");
ok(tiny.grossSqft < full.grossSqft, "tiny is smaller than full");

// ── deriveProgram — bounded, deterministic ──
const dp = deriveProgram(DEFAULT_PARAMS);
ok(dp.bedrooms >= 1 && dp.bathrooms >= 1 && dp.ceilingFt >= 7, "deriveProgram returns sane bounded program");
ok(JSON.stringify(deriveProgram(DEFAULT_PARAMS)) === JSON.stringify(dp), "deriveProgram deterministic");

// ── programMetrics determinism ──
ok(JSON.stringify(programMetrics(DEFAULT_PARAMS, DEFAULT_PROGRAM, "full")) === JSON.stringify(full), "programMetrics deterministic");

console.log(`\nROOM-PROGRAM ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
