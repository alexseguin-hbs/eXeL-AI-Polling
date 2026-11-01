/**
 * ARCHITECT-2525 · 웃 / LABOR / PROJECT-COST CONTRACT (operator 2026-11-01, Thought Master; aggregated with eXeL AI,
 * Grok, DeepSeek). The canonical, gate-locked core of the labor model.
 * ============================================================================================================
 * THE PERMANENT DOCTRINE (do not let one impersonate another):
 *   · Actual time stays time.           · Trade multiple expresses qualified labor value.
 *   · 웃 expresses recognition.          · Local wage expresses local settlement basis.
 *   · Project cost remains project cost.
 *
 * ONE LINE FOR THE RECORD — "Recognition is global. Settlement is local. Project cost remains project cost."
 *
 * THE COST METHOD (operator 2026-11-01): Project cost = Material + Labor, consistent region to region —
 *   · Material = the AVERAGE of ≥3 vendor quotes (3-vendor minimum; fewer → NOT_CALCULATED).
 *   · Labor   = local minimum wage (in LOCAL CURRENCY) × trade multiple M × hours — the SAME method everywhere.
 *   · M       = US trade reference rate ÷ US minimum wage ($7.25) — DERIVED, from BLS OES May 2024 (with provenance).
 *
 * THE FIREWALL (the critical Architect invariant): a trade multiple, a foreign settlement display, an FX change, or the
 * 9,999 boundary may NEVER alter the project-cost (house-price) headline. The headline changes only when the
 * project/scenario construction-cost evidence changes (quote · stored project wage · materials · markup · hours).
 *
 * Pure + deterministic (no Date.now / Math.random) → replay-safe + gate-tested (tests/architect-labor.test.mjs, T1–T10).
 * This is the ENGINE only (no React, no canonical mutation) — the Assembly Compare UI consumes it read-only.
 */

// ── CONSTANTS ────────────────────────────────────────────────────────────────────────────────────────────────────
/** 1 웃 (base) = one hour at 1× the contributor's local minimum-wage value. */
export const U_BASE_HOURS = 1;
/** The US base minimum-wage reference (federal FLSA / Texas), the denominator for every DERIVED trade multiple. */
export const US_MIN_WAGE_USD_HR = 7.25;
export const US_MIN_WAGE_SOURCE = "US federal FLSA / Texas statutory minimum (29 U.S.C. §206)";
/** 9,999 웃 reached across a 2,080-hour reference year — reference arithmetic ONLY. Not a per-trade multiple, not a cap
 *  on project labor. (contract §11) */
export const REFERENCE_YEAR_HOURS = 2080;
export const REFERENCE_U_CEILING = 9999;
export const REFERENCE_MULTIPLE = Math.round((REFERENCE_U_CEILING / REFERENCE_YEAR_HOURS) * 1000) / 1000; // ≈ 4.807

export type EvidenceState =
  | "QUOTED"            // accepted project vendor / contractor quote
  | "PREVAILING"        // verified project-region prevailing / trade rate
  | "STORED"            // stored project-region wage reference
  | "HI_NORMALIZED"     // H.I.-normalized reference estimate
  | "US_RESEARCH"       // US research reference (BLS etc.)
  | "ASSUMED"           // a worked/illustrative reference (e.g. the VISION Nigeria worked value) — not measured statute
  | "NOT_CALCULATED";   // no defensible value

/** The construction-cost authority order (contract §8) — higher supersedes lower for the PROJECT-cost calculation. */
export const COST_AUTHORITY_ORDER: EvidenceState[] = ["QUOTED", "PREVAILING", "STORED", "HI_NORMALIZED", "US_RESEARCH", "NOT_CALCULATED"];

// ── US TRADE REFERENCE (BLS OES May 2024 median hourly, via sources citing BLS OES) — the M numerators ───────────────
export interface TradeReference { trade: string; usRefRateUsdHr: number; source: string; geography: string; vintage: string; statistic: string; }
export const US_TRADE_REFERENCE: Record<string, TradeReference> = {
  carpenter:  { trade: "Carpenter",            usRefRateUsdHr: 28.54, source: "BLS OES", geography: "US", vintage: "May 2024", statistic: "median hourly" },
  electrician:{ trade: "Electrician",          usRefRateUsdHr: 31.16, source: "BLS OES", geography: "US", vintage: "May 2024", statistic: "median hourly" },
  plumber:    { trade: "Plumber/Pipefitter",   usRefRateUsdHr: 30.72, source: "BLS OES", geography: "US", vintage: "May 2024", statistic: "median hourly" },
  laborer:    { trade: "Construction Laborer", usRefRateUsdHr: 23.03, source: "BLS OES", geography: "US", vintage: "May 2024", statistic: "median hourly" },
  roofer:     { trade: "Roofer",               usRefRateUsdHr: 24.50, source: "BLS OES", geography: "US", vintage: "May 2024", statistic: "median annual ÷ 2080" },
};

/** A DERIVED trade multiple — M = US trade reference ÷ US minimum wage, carrying its full provenance. Never frozen,
 *  never relabeled a canonical whitepaper band (contract §3). Recomputes when the US reference changes (T6). */
export interface TradeMultiple {
  trade: string; M: number; usRefRateUsdHr: number; usMinWageUsdHr: number;
  source: string; geography: string; vintage: string; statistic: string;
  derivation: string; state: "DERIVED";
}
const r3 = (n: number) => Math.round(n * 1000) / 1000;
/** Derive M for a trade from the US reference (default table) or an explicit reference rate (T6). */
export function deriveM(tradeKey: string, usRefRateUsdHr?: number, usMinWage = US_MIN_WAGE_USD_HR): TradeMultiple | null {
  const ref = US_TRADE_REFERENCE[tradeKey];
  const rate = typeof usRefRateUsdHr === "number" ? usRefRateUsdHr : ref?.usRefRateUsdHr;
  if (typeof rate !== "number" || !(usMinWage > 0)) return null;   // no defensible rate → caller shows NOT CALCULATED
  return {
    trade: ref?.trade ?? tradeKey, M: r3(rate / usMinWage), usRefRateUsdHr: rate, usMinWageUsdHr: usMinWage,
    source: ref?.source ?? "custom", geography: ref?.geography ?? "US", vintage: ref?.vintage ?? "n/a",
    statistic: ref?.statistic ?? "median hourly",
    derivation: `${rate} ÷ ${usMinWage} = ${r3(rate / usMinWage)}×`, state: "DERIVED",
  };
}

// ── RECOGNITION (웃) — GLOBAL. 웃 earned = M × actual hours. Independent of jurisdiction (contract §1–§2) ─────────────
/** 웃 earned = M × actual hours. Null hours → null (never fabricate hours so a 웃 line can appear — contract §5, T7). */
export function recognitionU(hours: number | null, M: number): number | null {
  if (hours == null || !Number.isFinite(hours)) return null;
  return r3(M * hours);
}

// ── LOCAL WAGE DEFINITIONS — provenance per jurisdiction. Native currency is authoritative (contract §9) ─────────────
export type StatutoryBasis = "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "REGIONAL" | "SECTORAL" | "COLLECTIVE" | "GLOBAL_AGREED_STANDARD";
export interface LocalWageDefinition {
  jurisdiction_id: string;
  native_currency: string;
  statutory_basis: StatutoryBasis;
  statutory_value: number;             // in native currency, at the statutory_basis cadence
  derived_hourly_native?: number;      // native/hour (requires hours_conversion_basis if derived from a non-hourly basis)
  hours_conversion_basis?: number;     // the divisor used to convert a non-hourly statutory value to hourly (contract §9, T8)
  usd_equivalent_hourly?: number;      // informational USD only (contract §2) — never the project-cost input
  fx_rate?: number;                    // native→USD, with a date
  fx_date?: string;
  source: string;
  effective_date: string;
  evidence_state: EvidenceState;
}

/** Seed jurisdictions (local currency authoritative; USD informational). The worked Nigeria value is ASSUMED, not statute. */
export const LOCAL_WAGES: Record<string, LocalWageDefinition> = {
  "US-TX":   { jurisdiction_id: "US-TX", native_currency: "USD", statutory_basis: "HOURLY", statutory_value: 7.25, derived_hourly_native: 7.25, usd_equivalent_hourly: 7.25, fx_rate: 1, fx_date: "2026-11-01", source: US_MIN_WAGE_SOURCE, effective_date: "2009-07-24", evidence_state: "STORED" },
  "US-AUSTIN": { jurisdiction_id: "US-AUSTIN", native_currency: "USD", statutory_basis: "HOURLY", statutory_value: 7.25, derived_hourly_native: 7.25, usd_equivalent_hourly: 7.25, fx_rate: 1, fx_date: "2026-11-01", source: "US federal FLSA (TX has no higher state minimum)", effective_date: "2009-07-24", evidence_state: "STORED" },
  "NG":      { jurisdiction_id: "NG", native_currency: "NGN", statutory_basis: "MONTHLY", statutory_value: 70000, derived_hourly_native: Math.round((70000 / 173.33) * 100) / 100, hours_conversion_basis: 173.33, usd_equivalent_hourly: 0.34, fx_rate: 1600, fx_date: "2026-11-01", source: "VISION•2525 worked Nigeria reference ($0.34/hr); native NGN 70,000/mo statutory", effective_date: "2024-07-29", evidence_state: "ASSUMED" },
  "MX":      { jurisdiction_id: "MX", native_currency: "MXN", statutory_basis: "DAILY", statutory_value: 278.80, derived_hourly_native: Math.round((278.80 / 8) * 100) / 100, hours_conversion_basis: 8, usd_equivalent_hourly: Math.round((278.80 / 8 / 17) * 100) / 100, fx_rate: 17, fx_date: "2026-11-01", source: "CONASAMI 2025 general daily minimum", effective_date: "2025-01-01", evidence_state: "STORED" },
  "CO":      { jurisdiction_id: "CO", native_currency: "COP", statutory_basis: "MONTHLY", statutory_value: 1423500, derived_hourly_native: Math.round((1423500 / 230) * 100) / 100, hours_conversion_basis: 230, usd_equivalent_hourly: Math.round((1423500 / 230 / 4400) * 100) / 100, fx_rate: 4400, fx_date: "2026-11-01", source: "Colombia 2025 SMMLV monthly minimum", effective_date: "2025-01-01", evidence_state: "STORED" },
  "BR":      { jurisdiction_id: "BR", native_currency: "BRL", statutory_basis: "MONTHLY", statutory_value: 1412, derived_hourly_native: Math.round((1412 / 220) * 100) / 100, hours_conversion_basis: 220, usd_equivalent_hourly: Math.round((1412 / 220 / 5.4) * 100) / 100, fx_rate: 5.4, fx_date: "2026-11-01", source: "Brazil 2024 salário mínimo monthly", effective_date: "2024-01-01", evidence_state: "STORED" },
};

/** Convert a non-hourly statutory wage to hourly — REQUIRES a divisor, source and date (contract §9, T8). Null otherwise. */
export function monthlyToHourly(value: number, divisorHours: number | undefined, source?: string, date?: string): number | null {
  if (!(typeof divisorHours === "number" && divisorHours > 0) || !source || !date) return null;
  return Math.round((value / divisorHours) * 100) / 100;
}

/** The local minimum hourly wage in NATIVE currency (the settlement anchor). Null if it cannot be derived with provenance. */
export function localMinWageHourlyNative(jd: LocalWageDefinition): number | null {
  if (jd.statutory_basis === "HOURLY") return jd.statutory_value;
  if (typeof jd.derived_hourly_native === "number" && typeof jd.hours_conversion_basis === "number") return jd.derived_hourly_native;
  return null;   // a non-hourly basis with no recorded divisor cannot become hourly (T8)
}

// ── LABOR COST — region-consistent: local min wage (native) × M × hours (the one method, contract cost-method) ───────
export interface LaborLocal { jurisdiction_id: string; native_currency: string; ratePerHrNative: number | null; hours: number | null; costNative: number | null; M: number; state: EvidenceState; }
/** Labor cost in LOCAL currency = local min-wage hourly × M × hours. Same method every region → pay rate consistent. */
export function laborCostLocal(hours: number | null, m: TradeMultiple | null, jd: LocalWageDefinition): LaborLocal {
  const rateBase = localMinWageHourlyNative(jd);
  const M = m?.M ?? NaN;
  const ratePerHrNative = rateBase != null && m ? Math.round(rateBase * M * 100) / 100 : null;
  const costNative = ratePerHrNative != null && hours != null && Number.isFinite(hours) ? Math.round(ratePerHrNative * hours * 100) / 100 : null;
  return { jurisdiction_id: jd.jurisdiction_id, native_currency: jd.native_currency, ratePerHrNative, hours, costNative, M, state: ratePerHrNative == null ? "NOT_CALCULATED" : jd.evidence_state };
}

// ── MATERIAL COST — the ≥3-vendor average (operator 2026-11-01) ──────────────────────────────────────────────────────
export interface MaterialQuote { vendor: string; amountUsd: number; asOf: string; }
export interface MaterialResult { usd: number | null; vendorCount: number; state: EvidenceState; note: string; }
export const MIN_VENDORS = 3;
/** Material cost = the average of the vendor quotes, but ONLY with ≥3 defensible vendors; fewer → NOT_CALCULATED. */
export function materialCost(quotes: MaterialQuote[]): MaterialResult {
  const valid = (quotes || []).filter((q) => q && typeof q.amountUsd === "number" && Number.isFinite(q.amountUsd) && q.amountUsd >= 0 && q.vendor && q.asOf);
  const uniqueVendors = new Set(valid.map((q) => q.vendor.trim().toLowerCase())).size;
  if (uniqueVendors < MIN_VENDORS) {
    return { usd: null, vendorCount: uniqueVendors, state: "NOT_CALCULATED", note: `need ≥${MIN_VENDORS} vendor quotes to average (have ${uniqueVendors})` };
  }
  const usd = Math.round((valid.reduce((s, q) => s + q.amountUsd, 0) / valid.length) * 100) / 100;
  return { usd, vendorCount: uniqueVendors, state: "QUOTED", note: `average of ${valid.length} quotes across ${uniqueVendors} vendors` };
}

// ── PROJECT COST — the FIREWALL. Governed ONLY by project-region construction-cost evidence, in authority order.
//    Takes NO recognition/settlement jurisdiction — so a 웃/FX/comparison change can never move the headline (§6–§8). ──
export interface ProjectLaborEvidence {
  quotedUsd?: number | null;           // 1. accepted project vendor/contractor quote (e.g. 80h × $65 = 5200)
  prevailingUsd?: number | null;       // 2. verified project-region prevailing/trade rate total
  storedWageUsd?: number | null;       // 3. stored project-region wage reference total
  hiNormalizedUsd?: number | null;     // 4. H.I.-normalized reference estimate
  usResearchUsd?: number | null;       // 5. US research reference total
}
export interface ProjectCostResult { laborUsd: number | null; authority: EvidenceState; }
/** The project LABOR cost + its authority — highest available evidence wins; no jurisdiction/FX/웃 input exists here. */
export function projectLaborCost(ev: ProjectLaborEvidence): ProjectCostResult {
  if (ev.quotedUsd != null && Number.isFinite(ev.quotedUsd))         return { laborUsd: ev.quotedUsd, authority: "QUOTED" };
  if (ev.prevailingUsd != null && Number.isFinite(ev.prevailingUsd)) return { laborUsd: ev.prevailingUsd, authority: "PREVAILING" };
  if (ev.storedWageUsd != null && Number.isFinite(ev.storedWageUsd)) return { laborUsd: ev.storedWageUsd, authority: "STORED" };
  if (ev.hiNormalizedUsd != null && Number.isFinite(ev.hiNormalizedUsd)) return { laborUsd: ev.hiNormalizedUsd, authority: "HI_NORMALIZED" };
  if (ev.usResearchUsd != null && Number.isFinite(ev.usResearchUsd)) return { laborUsd: ev.usResearchUsd, authority: "US_RESEARCH" };
  return { laborUsd: null, authority: "NOT_CALCULATED" };
}

/** The whole project headline = material (≥3-vendor avg) + labor (authority-ordered) + markup. All three are
 *  construction-cost evidence; nothing here reads a recognition/settlement jurisdiction (the firewall). */
export interface ProjectHeadline { materialUsd: number | null; laborUsd: number | null; markupPct: number; headlineUsd: number | null; laborAuthority: EvidenceState; materialState: EvidenceState; }
export function projectHeadline(material: MaterialResult, labor: ProjectCostResult, markupPct = 0): ProjectHeadline {
  const base = material.usd != null && labor.laborUsd != null ? material.usd + labor.laborUsd : null;
  const headlineUsd = base != null ? Math.round(base * (1 + markupPct / 100) * 100) / 100 : null;
  return { materialUsd: material.usd, laborUsd: labor.laborUsd, markupPct, headlineUsd, laborAuthority: labor.authority, materialState: material.state };
}

// ── SETTLEMENT COMPARISON — INFORMATIONAL only. Same 웃 everywhere; the local wage basis is the settlement anchor.
//    This NEVER feeds projectHeadline (contract §2, §6, firewall). Pure → no canonical state touched (T10). ───────────
export interface SettlementRef { jurisdiction_id: string; native_currency: string; uEarned: number | null; localWageHourlyNative: number | null; localSettlementNative: number | null; usdInformational: number | null; }
/** For a given recognition (hours × M), show each jurisdiction's local settlement reference — informational, local
 *  currency authoritative, USD informational. Changing the jurisdiction list changes only THIS, never the headline. */
export function settlementComparison(hours: number | null, m: TradeMultiple | null, jurisdictionIds: string[]): SettlementRef[] {
  const uEarned = m ? recognitionU(hours, m.M) : null;
  return jurisdictionIds.map((id) => {
    const jd = LOCAL_WAGES[id];
    if (!jd) return { jurisdiction_id: id, native_currency: "?", uEarned, localWageHourlyNative: null, localSettlementNative: null, usdInformational: null };
    const rate = localMinWageHourlyNative(jd);
    const localSettlementNative = rate != null && uEarned != null ? Math.round(rate * uEarned * 100) / 100 : null; // 웃 settled at 1× local min wage
    const usdInformational = localSettlementNative != null && jd.fx_rate ? Math.round((localSettlementNative / jd.fx_rate) * 100) / 100 : null;
    return { jurisdiction_id: id, native_currency: jd.native_currency, uEarned, localWageHourlyNative: rate, localSettlementNative, usdInformational };
  });
}
