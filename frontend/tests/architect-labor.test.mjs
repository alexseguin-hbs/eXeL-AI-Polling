// ARCHITECT-2525 · 웃 / LABOR / PROJECT-COST CONTRACT gates (operator 2026-11-01, Thought Master). The contract's ten
// required test gates T1–T10, plus the cost method (material = ≥3-vendor average; labor = local min wage × M × hours).
// "Recognition is global. Settlement is local. Project cost remains project cost. Do not let one impersonate another."
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-labor.test.mjs
import {
  deriveM, recognitionU, materialCost, laborCostLocal, projectLaborCost, projectHeadline, settlementComparison,
  monthlyToHourly, localMinWageHourlyNative, LOCAL_WAGES, US_MIN_WAGE_USD_HR, REFERENCE_MULTIPLE, MIN_VENDORS,
  US_TRADE_REFERENCE, asOfAgeDays, isStale, FRESHNESS,
} from "@/lib/architect-labor";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, e = 0.01) => Math.abs(a - b) <= e;

// ── T1 · HOURS ≠ 웃 (M ≠ 1): 100 h × 4× = 400 웃; 4,060 h × 4× = 16,240 웃 ──
ok(recognitionU(100, 4) === 400, "T1 · 100 h × 4× = 400 웃");
ok(recognitionU(4060, 4) === 16240, "T1 · 4,060 h × 4× = 16,240 웃");
ok(recognitionU(100, 4) !== 100, "T1 · raw hours are never shown as 웃 when M ≠ 1 (400 ≠ 100)");

// ── T2 · JURISDICTION DOES NOT CHANGE RECOGNITION: same hours + same M = same 웃 across jurisdictions ──
{
  const m = deriveM("carpenter");
  const u = recognitionU(100, m.M);
  const refs = settlementComparison(100, m, ["US-AUSTIN", "NG", "BR", "MX", "CO"]);
  ok(refs.every((r) => r.uEarned === u), "T2 · 웃 earned is identical in every jurisdiction (recognition is global)");
  ok(new Set(refs.map((r) => r.localSettlementNative)).size > 1, "T2 · the LOCAL settlement reference differs by jurisdiction (settlement is local)");
}

// ── T3 · JURISDICTION DISPLAY DOES NOT CHANGE PROJECT COST ──
{
  // Austin project: accepted carpenter quote 80 h × $65/hr = $5,200
  const ev = { quotedUsd: 80 * 65 };
  const labor = projectLaborCost(ev);
  const m = deriveM("carpenter");
  const headAustin = projectHeadline(materialCost(threeQuotes(30000)), labor, 0);
  // switch the recognition/settlement comparison jurisdiction — Austin / Nigeria / Brazil
  const cmpA = settlementComparison(80, m, ["US-AUSTIN"]);
  const cmpNG = settlementComparison(80, m, ["NG"]);
  const cmpBR = settlementComparison(80, m, ["BR"]);
  const headNG = projectHeadline(materialCost(threeQuotes(30000)), projectLaborCost(ev), 0);
  const headBR = projectHeadline(materialCost(threeQuotes(30000)), projectLaborCost(ev), 0);
  ok(labor.laborUsd === 5200 && labor.authority === "QUOTED", "T3 · project labor = the accepted quote $5,200 (QUOTED)");
  ok(headAustin.headlineUsd === headNG.headlineUsd && headNG.headlineUsd === headBR.headlineUsd, "T3 · the project headline is identical across Austin/Nigeria/Brazil comparisons");
  ok(cmpA[0].localSettlementNative !== cmpNG[0].localSettlementNative && cmpNG[0].native_currency === "NGN", "T3 · only the informational settlement reference changes with jurisdiction");
  ok(projectLaborCost(ev).laborUsd === 5200, "T3 · projectLaborCost takes NO jurisdiction — it cannot be moved by the comparison (the firewall)");
}

// ── T4 · 9,999 DOES NOT CAP PROJECT AGGREGATE ──
{
  const m = deriveM("carpenter");
  const agg = recognitionU(50000, m.M);  // a big project's aggregate recognized hours
  ok(agg > 9999, `T4 · aggregate recognition may exceed 9,999 웃 (got ${agg})`);
  // the project labor cost from evidence is the full amount, never capped by the 9,999 per-person boundary
  const labor = projectLaborCost({ prevailingUsd: 220000 });
  ok(labor.laborUsd === 220000, "T4 · project labor cost remains the full calculated amount (9,999 never caps it)");
}

// ── T5 · QUOTE OVERRIDES NORMALIZED REFERENCE ──
{
  const labor = projectLaborCost({ quotedUsd: 5200, usResearchUsd: 9999, hiNormalizedUsd: 8000 });
  ok(labor.laborUsd === 5200 && labor.authority === "QUOTED", "T5 · an accepted quote ($5,200) overrides every lower reference; authority QUOTED");
}

// ── T6 · M IS DERIVED (recomputes when the US trade reference changes) ──
{
  const base = deriveM("carpenter");
  ok(base.state === "DERIVED" && near(base.M, 28.54 / 7.25), `T6 · carpenter M is DERIVED = 28.54 ÷ 7.25 = ${base.M}`);
  const bumped = deriveM("carpenter", 33.0);   // a newer US reference rate
  ok(near(bumped.M, 33.0 / 7.25) && bumped.M !== base.M, "T6 · changing the US trade reference recomputes M with updated provenance");
  ok(base.derivation.includes("÷") && base.source === "BLS OES", "T6 · M carries its derivation + source provenance");
}

// ── T7 · MISSING HOURS → NOT CALCULATED (never fabricate hours) ──
{
  const m = deriveM("carpenter");
  ok(recognitionU(null, m.M) === null, "T7 · no hours → 웃 NOT CALCULATED (null)");
  const labor = laborCostLocal(null, m, LOCAL_WAGES["US-AUSTIN"]);
  ok(labor.costNative === null, "T7 · no hours → labor cost NOT CALCULATED (null), hours never invented");
}

// ── T8 · MONTHLY → HOURLY REQUIRES DERIVATION (divisor + source + date) ──
{
  ok(monthlyToHourly(1423500, undefined, "src", "2025-01-01") === null, "T8 · a monthly wage without a divisor cannot become hourly");
  ok(monthlyToHourly(1423500, 230, undefined, "2025-01-01") === null, "T8 · without a source it cannot become hourly");
  ok(monthlyToHourly(1423500, 230, "Colombia SMMLV", "2025-01-01") !== null, "T8 · with divisor + source + date it derives");
  // the Nigeria worked reference is ASSUMED, not statute
  ok(LOCAL_WAGES["NG"].evidence_state === "ASSUMED", "T8/§10 · the Nigeria $0.34 worked value is ASSUMED, not a literal statute");
}

// ── T9 · FX DOES NOT CHANGE 웃 (nor project cost based on an unchanged quote) ──
{
  const m = deriveM("carpenter");
  const jd = { ...LOCAL_WAGES["NG"] };
  const uBefore = recognitionU(100, m.M);
  const laborBefore = projectLaborCost({ quotedUsd: 5200 });
  jd.fx_rate = 2000;   // FX moves
  const uAfter = recognitionU(100, m.M);
  const laborAfter = projectLaborCost({ quotedUsd: 5200 });
  ok(uBefore === uAfter, "T9 · an FX change leaves 웃 earned unchanged");
  ok(laborBefore.laborUsd === laborAfter.laborUsd, "T9 · an FX change leaves the project cost (unchanged quote) unchanged");
}

// ── T10 · COMPARISON REMAINS NON-CANONICAL (pure, side-effect free; no project_hash / revision touched) ──
{
  const m = deriveM("carpenter");
  const a = settlementComparison(100, m, ["US-AUSTIN", "NG", "BR"]);
  const b = settlementComparison(100, m, ["US-AUSTIN", "NG", "BR"]);
  ok(JSON.stringify(a) === JSON.stringify(b), "T10 · settlementComparison is pure + deterministic (no canonical state)");
  ok(!("project_hash" in a[0]) && !("revision" in a[0]), "T10 · a comparison result carries no canonical fields (project_hash / revision)");
}

// ── THE COST METHOD — material = ≥3-vendor average; labor = local min wage × M × hours (region-consistent) ──
function threeQuotes(center) { return [{ vendor: "A", amountUsd: center - 1000, asOf: "2026-11-01" }, { vendor: "B", amountUsd: center, asOf: "2026-11-01" }, { vendor: "C", amountUsd: center + 1000, asOf: "2026-11-01" }]; }
ok(materialCost(threeQuotes(30000)).usd === 30000 && materialCost(threeQuotes(30000)).vendorCount === 3, "MATERIAL · the average of 3 vendor quotes");
ok(materialCost([{ vendor: "A", amountUsd: 30000, asOf: "2026-11-01" }, { vendor: "B", amountUsd: 31000, asOf: "2026-11-01" }]).state === "NOT_CALCULATED", `MATERIAL · < ${MIN_VENDORS} vendors → NOT CALCULATED (no single-source price passed off as the cost)`);
ok(materialCost([{ vendor: "A", amountUsd: 30000, asOf: "2026-11-01" }, { vendor: "A", amountUsd: 31000, asOf: "2026-11-01" }, { vendor: "A", amountUsd: 29000, asOf: "2026-11-01" }]).state === "NOT_CALCULATED", "MATERIAL · 3 quotes from ONE vendor is not 3 vendors");
{
  // region-consistency: the SAME M everywhere; the native labor rate scales by the local minimum wage
  const m = deriveM("carpenter");
  const austin = laborCostLocal(100, m, LOCAL_WAGES["US-AUSTIN"]);
  const lagos = laborCostLocal(100, m, LOCAL_WAGES["NG"]);
  ok(austin.M === lagos.M, "LABOR · the trade multiple M is consistent region to region (same method)");
  ok(near(austin.ratePerHrNative, 7.25 * m.M), "LABOR · Austin labor rate = local min wage 7.25 × M (native USD)");
  ok(lagos.ratePerHrNative != null && lagos.native_currency === "NGN" && lagos.ratePerHrNative !== austin.ratePerHrNative, "LABOR · Lagos labor rate = local min wage (NGN) × M — same method, local currency, different amount");
}
// the reference constant
ok(near(REFERENCE_MULTIPLE, 9999 / 2080, 0.001) && near(REFERENCE_MULTIPLE, 4.807, 0.001), "REFERENCE_MULTIPLE = 9,999 ÷ 2,080 ≈ 4.807");
ok(US_MIN_WAGE_USD_HR === 7.25, "US base minimum-wage reference = $7.25");

// ── R-WU3 HARDENING (48-AsM fleet 2026-11-01: Thor security + Enki edge cases + Odin foresight) ──
// Thor: reference tables are frozen (no in-place mutation / provenance lie)
ok(Object.isFrozen(US_TRADE_REFERENCE) && Object.isFrozen(LOCAL_WAGES), "reference tables are frozen (US_TRADE_REFERENCE + LOCAL_WAGES)");
ok(Object.isFrozen(US_TRADE_REFERENCE.carpenter) && Object.isFrozen(LOCAL_WAGES["US-TX"]), "each reference row is frozen (deep)");
{ let threw = false; try { "use strict"; US_TRADE_REFERENCE.carpenter.usRefRateUsdHr = 999; } catch { threw = true; }
  ok(US_TRADE_REFERENCE.carpenter.usRefRateUsdHr === 28.54, "a mutation of a frozen rate does not take (stays 28.54)"); }
// Enki/Thor: deriveM override stamps custom-UNVERIFIED provenance, never the stale BLS source; ≤0 rate → null
{ const ov = deriveM("carpenter", 50); ok(ov && ov.source === "custom-UNVERIFIED" && ov.statistic === "override" && ov.M === Math.round((50 / 7.25) * 1000) / 1000, "deriveM(override) is custom-UNVERIFIED / override, not BLS provenance");
  const tbl = deriveM("carpenter"); ok(tbl && tbl.source === "BLS OES" && tbl.statistic === "median hourly", "deriveM(table) keeps its BLS provenance");
  ok(deriveM("carpenter", 0) === null && deriveM("carpenter", -5) === null, "deriveM with a ≤0 rate → null (no defensible rate)"); }
// Thor/Enki: a ≤0 or non-finite quote NEVER takes cost authority; a lower positive tier wins over a 0 higher tier
ok(projectLaborCost({ quotedUsd: 0 }).authority === "NOT_CALCULATED", "a $0 quote does not become the headline (NOT_CALCULATED)");
ok(projectLaborCost({ quotedUsd: -100 }).authority === "NOT_CALCULATED", "a negative quote is refused");
ok(projectLaborCost({ quotedUsd: 0, storedWageUsd: 5200 }).authority === "STORED" && projectLaborCost({ quotedUsd: 0, storedWageUsd: 5200 }).laborUsd === 5200, "a 0 top-tier falls through to the next positive tier");
ok(projectLaborCost({ quotedUsd: 5200 }).authority === "QUOTED", "a real positive quote still takes QUOTED (regression)");
// Thor: a negative markup never yields a signer-facing headline
ok(projectHeadline({ usd: 1000, state: "QUOTED" }, { laborUsd: 1000, authority: "QUOTED" }, -50).headlineUsd === null, "a negative markup → headline NOT_CALCULATED");
ok(projectHeadline({ usd: 1000, state: "QUOTED" }, { laborUsd: 1000, authority: "QUOTED" }, 10).headlineUsd === 2200, "a valid markup still prices (10% → 2200)");
// Enki: malformed hours / M in laborCostLocal → NOT_CALCULATED, not a priced cost
{ const M = deriveM("carpenter"); const jd = LOCAL_WAGES["US-TX"];
  ok(laborCostLocal(-5, M, jd).state === "NOT_CALCULATED" && laborCostLocal(-5, M, jd).costNative === null, "negative hours → NOT_CALCULATED");
  ok(laborCostLocal(100, null, jd).state === "NOT_CALCULATED", "null multiple → NOT_CALCULATED");
  ok(laborCostLocal(100, M, jd).costNative > 0, "valid hours + M → a real cost (regression)"); }
// Thor: material average is per-VENDOR (a vendor's extra quotes don't over-weight it)
{ const q = [{ vendor: "A", amountUsd: 100, asOf: "x" }, { vendor: "A", amountUsd: 100, asOf: "x" }, { vendor: "A", amountUsd: 100, asOf: "x" }, { vendor: "B", amountUsd: 200, asOf: "x" }, { vendor: "C", amountUsd: 300, asOf: "x" }];
  const mc = materialCost(q); ok(mc.state === "QUOTED" && mc.vendorCount === 3 && mc.usd === 200, "per-vendor average = (100+200+300)/3 = 200, not the 6-quote mean (150)"); }
// Odin: freshness helpers (pure, today passed in; unknown age is fail-safe stale)
ok(asOfAgeDays("2026-01-01", "2026-01-31") === 30, "asOfAgeDays counts calendar days");
ok(isStale("2026-01-01", "2026-12-01", FRESHNESS.FX_MAX_DAYS) === true && isStale("2026-11-01", "2026-11-15", FRESHNESS.WAGE_MAX_DAYS) === false, "isStale flags an old FX, not a fresh wage");
ok(isStale("not-a-date", "2026-11-01", 90) === true, "an unparseable as-of is treated as stale (fail-safe)");

console.log(`\narchitect-labor: ${pass} passed, ${fail} failed · T1–T10 + R-WU3 hardening · material ≥3-vendor avg · labor = local min wage × M × hours · recognition global, settlement local, project cost firewalled`);
process.exit(fail ? 1 : 0);
