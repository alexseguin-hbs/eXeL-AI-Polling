/**
 * Architect-2525 · $/min Economy (MASTER_SPEC §7) — first-class, live, client-side.
 * ============================================================================
 * Domain-NEUTRAL by design: pure functions, no React, no domain vocabulary — so the
 * same module informs Manta-2525 / Drone-2525 / Atlantis / Vision-2525 (modularity
 * mandate). Mirrors the backend contract (`core/hi_rates.py` default 7.25/hr,
 * `Token_Governance_Math.md` Trinity formulas). Client = optimistic preview; the
 * audited Cube 5/8 ledger is the source of truth and reconciles on sync.
 */

export const DEFAULT_RATE_PER_HR = 7.25; // matches backend hi_rates default
export const DEFAULT_FEE_USD = 25;       // transparent, minimal (per the concept infographics)

export const ratePerMin = (perHr = DEFAULT_RATE_PER_HR) => perHr / 60;

export type AllocationMode = "single" | "spread";

export interface EconomyInput {
  laborMin: number;      // construction labor minutes (framing/plumbing/electrical/…)
  reviewMin: number;     // expert review minutes (Global Architect Network)
  donatedMin: number;    // donated / volunteer / learning minutes
  ratePerHr?: number;    // jurisdiction rate (resolve_human_rate analog)
  materialsUsd?: number; // materials cost
  aiMultiplier?: number; // ◬ = ♡ × multiplier
  feeUsd?: number;       // transparent minimal fee
  impact?: number;       // MoT impact factor (default 1)
  quality?: number;      // MoT quality factor (default 1)
}

export interface EconomyResult {
  perMin: number;
  laborUsd: number; reviewUsd: number; donatedUsd: number; materialsUsd: number; feeUsd: number;
  totalUsd: number;                                  // billed total (donated is value-in-kind, not billed)
  trinity: { heart: number; human: number; unity: number }; // ♡ 웃 ◬
  timeCapitalUsd: number;                            // Time Capital = MoT × $/min
  learningPoints: number;                            // volunteer/learning points (build-learning)
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Compute the full $/min economy from time + materials inputs. Pure + deterministic. */
export function computeEconomy(i: EconomyInput): EconomyResult {
  const perMin = ratePerMin(i.ratePerHr);
  const laborUsd = round2(i.laborMin * perMin);
  const reviewUsd = round2(i.reviewMin * perMin);
  const donatedUsd = round2(i.donatedMin * perMin);   // valued the same; contributed, not billed
  const materialsUsd = round2(i.materialsUsd ?? 0);
  const feeUsd = round2(i.feeUsd ?? DEFAULT_FEE_USD);
  const totalUsd = round2(laborUsd + reviewUsd + materialsUsd + feeUsd);
  const activeMin = i.laborMin + i.reviewMin + i.donatedMin;
  const heart = Math.ceil(activeMin);                 // ♡ = ceil(active minutes)
  const human = round2(activeMin * perMin);           // 웃 = min-wage/min value
  const unity = Math.round(heart * (i.aiMultiplier ?? 1)); // ◬ = ♡ × multiplier
  const mot = activeMin * (i.impact ?? 1) * (i.quality ?? 1);
  const timeCapitalUsd = round2(mot * perMin);        // Time Capital = MoT × $/min
  const learningPoints = Math.floor(i.donatedMin);    // 1 point / donated minute of build-learning
  return { perMin, laborUsd, reviewUsd, donatedUsd, materialsUsd, feeUsd, totalUsd, trinity: { heart, human, unity }, timeCapitalUsd, learningPoints };
}

/** Allocate a total across the project: single-day up-front, or spread evenly over `days`. */
export function allocate(totalUsd: number, days: number, mode: AllocationMode): number[] {
  if (mode === "single" || days <= 1) return [round2(totalUsd)];
  return Array.from({ length: days }, () => round2(totalUsd / days));
}

export const fmtUsd = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
