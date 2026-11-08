// ARCHITECT-2525 / FUTURE · simulation/compare — benchmarks as SEPARATE axes (plan §19, FCRS-28). Each has its own
// UNIT; the UI shows them side by side and NEVER multiplies one by another to reach the baseline (plan §19: "No UI may
// imply $34 × something = $240,000"). Values are re-declared here (Future-owned), never imported from a banned module.
import { BASELINE_TOTAL_USD } from "../domain/economics";
import { CLEAR_FT2 } from "../domain/geometry";

export interface Benchmark {
  id: string;
  label: string;
  value: number;
  unit: string;        // the distinct axis — $/wall ft² ≠ total USD ≠ $/net floor ft²
  evidence: string;
  note: string;
}

export function benchmarks(): Benchmark[] {
  return [
    { id: "wall_system", label: "Wall system", value: 34, unit: "$/wall ft²", evidence: "REFERENCE",
      note: "ICON wall-system reference (deck received 2026-11-02) — its own axis, never multiplied into the estimate" },
    { id: "baseline_total", label: "Baseline Build Estimate", value: BASELINE_TOTAL_USD, unit: "total USD", evidence: "DERIVED",
      note: "the ten assumed rows — illustrative, not a quote" },
    { id: "net_build", label: "Net build metric", value: Math.round(BASELINE_TOTAL_USD / CLEAR_FT2), unit: "$/net floor ft²", evidence: "DERIVED",
      note: `$${BASELINE_TOTAL_USD.toLocaleString("en-US")} ÷ ${CLEAR_FT2} net ft² — a different axis from the wall benchmark` },
  ];
}
