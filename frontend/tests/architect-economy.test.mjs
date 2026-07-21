// ARCHITECT-2525 $/min ECONOMY lock — computeEconomy is pure + deterministic and drives the SoI live values, the
// Overview cost tiles, and the Build Cost·Time tab. Pins the exact formulas (Trinity ♡/웃/◬, Time Capital, allocation)
// + the backend rate anchor so a refactor can't silently shift money/token math. Run:
// node --experimental-strip-types tests/architect-economy.test.mjs
import { computeEconomy, allocate, fmtUsd, ratePerMin, DEFAULT_RATE_PER_HR, DEFAULT_FEE_USD } from "../components/architect-2525/architect-economy.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL", m); } };

// backend contract anchor (core/hi_rates.py default)
ok(DEFAULT_RATE_PER_HR === 7.25, "default rate = $7.25/hr (backend anchor)");
ok(DEFAULT_FEE_USD === 25, "default fee = $25");
ok(ratePerMin(7.25) === 7.25 / 60, "ratePerMin = perHr/60");

// concrete case — every field pinned
const i = { laborMin: 60, reviewMin: 30, donatedMin: 30, ratePerHr: 7.25, materialsUsd: 1000, aiMultiplier: 5, feeUsd: 25 };
const r = computeEconomy(i);
ok(r.perMin === 7.25 / 60, "perMin");
ok(r.laborUsd === 7.25, "laborUsd = 60min @ 7.25/hr");
ok(r.reviewUsd === 3.63 && r.donatedUsd === 3.63, "review/donated round2 (3.625→3.63)");
ok(r.materialsUsd === 1000 && r.feeUsd === 25, "materials + fee pass through");
ok(r.totalUsd === 1035.88, "totalUsd = labor+review+materials+fee (donated NOT billed)");
ok(r.trinity.heart === 120, "♡ heart = ceil(active minutes)");
ok(r.trinity.human === 14.5, "웃 human = active × $/min");
ok(r.trinity.unity === 600, "◬ unity = heart × aiMultiplier");
ok(r.timeCapitalUsd === 14.5, "Time Capital = MoT(active×impact×quality) × $/min");
ok(r.learningPoints === 30, "learning points = floor(donatedMin)");

// donated is value-in-kind, never in the billed total
ok(computeEconomy({ laborMin: 0, reviewMin: 0, donatedMin: 100, ratePerHr: 7.25, feeUsd: 0, materialsUsd: 0 }).totalUsd === 0, "pure-donated project bills $0 (donation is in-kind)");

// defaults: fee=25, materials=0, multiplier=1 → unity==heart
const d = computeEconomy({ laborMin: 10, reviewMin: 0, donatedMin: 0 });
ok(d.feeUsd === 25 && d.materialsUsd === 0, "defaults fee 25 / materials 0");
ok(d.trinity.unity === d.trinity.heart, "default aiMultiplier 1 → ◬ == ♡");

// determinism — identical input → byte-identical output
ok(JSON.stringify(computeEconomy(i)) === JSON.stringify(computeEconomy(i)), "computeEconomy is deterministic");

// allocation
ok(JSON.stringify(allocate(100, 4, "spread")) === JSON.stringify([25, 25, 25, 25]), "spread over 4 days = 4×25");
ok(JSON.stringify(allocate(100, 4, "single")) === JSON.stringify([100]), "single mode = one up-front payment");
ok(JSON.stringify(allocate(100, 1, "spread")) === JSON.stringify([100]), "spread with 1 day = single payment");

// currency formatting
ok(fmtUsd(1035.88) === "$1,035.88", "fmtUsd thousands + 2 decimals");
ok(fmtUsd(7.25) === "$7.25" && fmtUsd(0) === "$0.00", "fmtUsd small + zero");

console.log(`\nARCHITECT-ECONOMY ${pass}/${pass + fail} passed`);
if (fail > 0) process.exit(1);
