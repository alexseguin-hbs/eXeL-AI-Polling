/**
 * ARCHITECT-2525 · 3-VENDOR MATERIAL MANAGEMENT (operator 2026-11-01: "how we can use 3 vendor management systems to get
 * best material at lowest cost").
 * ============================================================================================================
 * Built ON the 웃-contract material rule (lib/architect-labor): a material's ESTIMATE basis is the AVERAGE of ≥3 vendor
 * quotes (3-vendor minimum; fewer → NOT_CALCULATED). This layer adds the MANAGEMENT view a buyer needs: the three quotes
 * side by side, the LOWEST (the best price to buy at), and the SAVINGS if you buy at the lowest instead of the average.
 * Honesty (contract §4): until real quotes are entered, the three quotes are a MODELED spread marked ASSUMED — never a
 * fabricated vendor price presented as real.
 *
 * Pure + deterministic (no Date/random) → replayable and gate-checked (tests/architect-vendors.test.mjs).
 */
import { materialCost, MIN_VENDORS, type MaterialQuote } from "./architect-labor";

/** The three vendor SLOTS a buyer fills (generic until real vendors are named). */
export const VENDOR_SLOTS = ["Vendor A", "Vendor B", "Vendor C"] as const;
/** A ±6% MODELED spread around a base unit price — a planning placeholder, replaced by real quotes (ASSUMED). */
export const MODELED_SPREAD = [0.94, 1.0, 1.06] as const;
export const MODELED_ASOF = "modeled";

export interface VendorCompare {
  quotes: MaterialQuote[];
  count: number;
  average: number | null;    // the estimate basis (≥3-vendor average, via the 웃 contract rule); null if < MIN_VENDORS
  lowest: number | null;
  highest: number | null;
  lowestVendor: string | null;
  savingsVsAvg: number | null;   // average − lowest (what buying at the best price saves per unit)
  savingsPct: number | null;     // savings as % of the average
  spreadPct: number | null;      // (highest − lowest) / average
  meetsMin: boolean;             // ≥3 distinct vendors
  allModeled: boolean;           // every quote is a modeled placeholder (not a real quote yet)
  state: "QUOTED" | "NOT_CALCULATED";
}

/** Model three vendor quotes around a base unit price (a planning placeholder until real quotes replace them). */
export function modeledQuotes(baseUnitUsd: number): MaterialQuote[] {
  return MODELED_SPREAD.map((f, i) => ({ vendor: VENDOR_SLOTS[i], amountUsd: Math.round(baseUnitUsd * f * 100) / 100, asOf: MODELED_ASOF }));
}

/** Compare vendor quotes: the ≥3-vendor average (the estimate basis) vs the lowest (the best buy) + the savings. */
export function vendorCompare(quotes: MaterialQuote[]): VendorCompare {
  const valid = (quotes || []).filter((q) => q && Number.isFinite(q.amountUsd) && q.amountUsd >= 0 && q.vendor && q.asOf);
  const mc = materialCost(valid);
  const count = new Set(valid.map((q) => q.vendor.trim().toLowerCase())).size;
  if (mc.state !== "QUOTED" || mc.usd === null) {
    return { quotes: valid, count, average: null, lowest: null, highest: null, lowestVendor: null, savingsVsAvg: null, savingsPct: null, spreadPct: null, meetsMin: count >= MIN_VENDORS, allModeled: valid.every((q) => q.asOf === MODELED_ASOF), state: "NOT_CALCULATED" };
  }
  const low = valid.reduce((a, b) => (b.amountUsd < a.amountUsd ? b : a), valid[0]);
  const high = valid.reduce((a, b) => (b.amountUsd > a.amountUsd ? b : a), valid[0]);
  const average = mc.usd;
  const savings = Math.round((average - low.amountUsd) * 100) / 100;
  return {
    quotes: valid, count, average, lowest: low.amountUsd, highest: high.amountUsd, lowestVendor: low.vendor,
    savingsVsAvg: savings, savingsPct: average > 0 ? Math.round((savings / average) * 1000) / 10 : 0,
    spreadPct: average > 0 ? Math.round(((high.amountUsd - low.amountUsd) / average) * 1000) / 10 : 0,
    meetsMin: count >= MIN_VENDORS, allModeled: valid.every((q) => q.asOf === MODELED_ASOF), state: "QUOTED",
  };
}

export interface VendorSavings {
  materialUsd: number;        // the project material budget this is applied to
  average: number;            // = materialUsd (the estimate uses the 3-vendor average)
  lowest: number;             // buying every line at its lowest of 3
  savingsUsd: number;         // average − lowest
  savingsPct: number;
  modeled: boolean;
}
/** Project-level 3-vendor savings: the material budget is the ≥3-vendor AVERAGE (the honest estimate); buying each line
 *  at the lowest of three quotes could save ~spread/2. A planning figure (MODELED) until real quotes lock it. */
export function projectVendorSavings(materialUsd: number): VendorSavings {
  const cmp = vendorCompare(modeledQuotes(materialUsd));
  const lowest = cmp.lowest ?? materialUsd;
  const savings = Math.max(0, Math.round(materialUsd - lowest));
  return {
    materialUsd: Math.round(materialUsd), average: Math.round(materialUsd), lowest: Math.round(lowest),
    savingsUsd: savings, savingsPct: materialUsd > 0 ? Math.round((savings / materialUsd) * 1000) / 10 : 0, modeled: true,
  };
}
