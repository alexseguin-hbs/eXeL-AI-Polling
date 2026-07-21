// ARCHITECT-2525 FRAMING TAKEOFF lock — generateFraming/rollup/cutList are pure + deterministic and drive the Build
// Framing tab (per-member 2×4/beam takeoff, cost/time, robot automation %, cut list + CSV). Pins a fixed 10×10×9 tiny
// wall at 16" o.c. so a refactor can't silently shift the takeoff. Run:
// node --experimental-strip-types tests/architect-framing.test.mjs
import { generateFraming, cutList, cutListCsv, fmtHrs, fmtUsd } from "../lib/architect-framing.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

const P = { widthFt: 10, lengthFt: 10, heightFt: 9, studSpacingIn: 16, crew: 2, laborRate: 50 };
const plan = generateFraming(P);
const r = plan.rollup;

// ── member generation ──
ok(plan.members.length === 71, "10×10×9 @16in → 71 members");
ok(plan.sequence.length === 7, "7 sequence steps (install phases)");
const types = [...new Set(plan.members.map((m) => m.type))].sort();
ok(JSON.stringify(types) === JSON.stringify(["beam", "column", "header", "joist", "plate", "rafter", "stud", "topplate"]), "all 8 member types present");
ok(plan.members.every((m) => Number.isFinite(m.lengthFt) && m.lengthFt > 0), "every member has a positive length");

// ── rollup — pinned totals ──
ok(r.count === 71, "rollup count = member count");
ok(r.totalMin === 333, "total install minutes = 333");
ok(r.totalCostUsd === 1265.73 && r.materialUsd === 1265.73, "material cost pinned $1,265.73");
ok(r.autoCount === 64 && r.autoPct === 90, "robot-automatable 64/71 = 90%");
ok(r.autoPct === Math.round((r.autoCount / r.count) * 100), "autoPct = round(autoCount/count)");
ok(r.crewDays === 0.35 && r.robotDays === 0.19, "crew 0.35 days · robot 0.19 days");
ok(r.crewDays >= r.robotDays && r.daysSaved >= 0, "robot never slower than crew; daysSaved ≥ 0");

// ── cut list — aggregates members by material + length; qty conserves ──
const cl = cutList(plan.members);
ok(cl.length === 8, "cut list has 8 distinct material/length rows");
ok(cl.reduce((a, c) => a + c.qty, 0) === plan.members.length, "cut-list quantities conserve total member count");
ok(cl[0].material === "SPF 2×4" && cl[0].lengthFt === 7.88 && cl[0].qty === 32, "first cut row: 32× SPF 2×4 @ 7.88 ft");
ok(cl.every((c) => c.totalCostUsd >= 0 && c.totalMin >= 0), "cut rows have non-negative cost + minutes");

// ── CSV export ──
const csv = cutListCsv(plan.members);
ok(csv.split("\n")[0] === "Material,Length(ft),Qty,Install(min),Cost(USD),Robot", "CSV header row");
ok(csv.split("\n").length === cl.length + 1, "CSV = header + one row per cut");

// ── formatting ──
ok(fmtHrs(90) === "1.5 h" && fmtHrs(0) === "0.0 h", "fmtHrs = minutes→hours");
ok(fmtUsd(1234.6) === "$1,235" && fmtUsd(0) === "$0", "fmtUsd rounds + thousands");

// ── determinism ──
ok(JSON.stringify(generateFraming(P)) === JSON.stringify(plan), "generateFraming is deterministic");

console.log(`\nARCHITECT-FRAMING ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
