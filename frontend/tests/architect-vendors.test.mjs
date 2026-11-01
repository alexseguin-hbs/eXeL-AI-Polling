// ARCHITECT-2525 · 3-VENDOR MATERIAL MANAGEMENT gate (operator 2026-11-01: "how we can use 3 vendor management systems to
// get best material at lowest cost"). lib/architect-vendors builds on the 웃-contract material rule (≥3-vendor average =
// the estimate basis) and adds the buyer view: the three quotes, the LOWEST, and the SAVINGS. Honesty: modeled quotes are
// flagged, never faked as real; < 3 vendors → NOT_CALCULATED (never invent a price so the card looks complete).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-vendors.test.mjs
import { modeledQuotes, vendorCompare, projectVendorSavings, VENDOR_SLOTS, MODELED_SPREAD, MODELED_ASOF } from "@/lib/architect-vendors";
import { MIN_VENDORS } from "@/lib/architect-labor";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ── modeled quotes meet the 3-vendor minimum and are flagged, not faked ──
{
  const q = modeledQuotes(100);
  ok(q.length === 3 && VENDOR_SLOTS.length === 3, "three vendor slots → three modeled quotes (meets the 3-vendor minimum)");
  ok(q.every((x) => x.asOf === MODELED_ASOF), "modeled quotes are flagged 'modeled' (never presented as real)");
  ok(q[0].amountUsd === 94 && q[1].amountUsd === 100 && q[2].amountUsd === 106, "the modeled spread is ±6% around the base (94 · 100 · 106)");
}

// ── compare: average = the ≥3-vendor estimate basis; lowest = best buy; savings = average − lowest ──
{
  const c = vendorCompare(modeledQuotes(100));
  ok(c.state === "QUOTED" && c.meetsMin, "≥3 vendors → a real compare");
  ok(c.average === 100, "the average (estimate basis) is the ≥3-vendor average (100)");
  ok(c.lowest === 94 && c.highest === 106 && c.lowestVendor === "Vendor A", "lowest 94 (Vendor A) · highest 106");
  ok(c.savingsVsAvg === 6 && c.savingsPct === 6, "buying at the lowest saves 6 vs the average (6%)");
  ok(c.spreadPct === 12, "the quote spread is 12% of the average");
  ok(c.lowest <= c.average && c.average <= c.highest, "lowest ≤ average ≤ highest (ordered)");
}

// ── fewer than 3 vendors → NOT_CALCULATED (contract §4: never invent a price) ──
{
  const two = vendorCompare([{ vendor: "A", amountUsd: 90, asOf: "modeled" }, { vendor: "B", amountUsd: 100, asOf: "modeled" }]);
  ok(two.state === "NOT_CALCULATED" && two.average === null && two.savingsVsAvg === null && !two.meetsMin, "two quotes → NOT_CALCULATED, no average, no savings (need ≥3)");
  ok(vendorCompare([]).state === "NOT_CALCULATED", "no quotes → NOT_CALCULATED");
}

// ── duplicate vendor names don't satisfy the minimum (anti-gaming) ──
{
  const dupe = vendorCompare([{ vendor: "A", amountUsd: 90, asOf: "modeled" }, { vendor: "a", amountUsd: 95, asOf: "modeled" }, { vendor: "A ", amountUsd: 100, asOf: "modeled" }]);
  ok(dupe.count === 1 && dupe.state === "NOT_CALCULATED", "three quotes from the SAME vendor are one vendor → still NOT_CALCULATED");
}

// ── project-level savings (the method applied to a material budget) ──
{
  const s = projectVendorSavings(100000);
  ok(s.average === 100000 && s.lowest < s.average && s.savingsUsd > 0, "the material budget is the 3-vendor average; buying at the lowest could save a positive amount");
  ok(s.savingsPct === 6 && s.modeled, "~6% modeled savings, flagged as a planning figure");
  ok(projectVendorSavings(0).savingsUsd === 0, "zero material → zero savings (no divide-by-zero)");
}

// ── determinism ──
ok(JSON.stringify(vendorCompare(modeledQuotes(100))) === JSON.stringify(vendorCompare(modeledQuotes(100))), "vendorCompare is deterministic");
ok(MIN_VENDORS === 3, "the 3-vendor minimum is the 웃-contract constant (one source)");

console.log(`\narchitect-vendors: ${pass} passed, ${fail} failed · 3-vendor average (estimate) vs lowest (best buy) + savings, honest when < 3`);
process.exit(fail ? 1 : 0);
