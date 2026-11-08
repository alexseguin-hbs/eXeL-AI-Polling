// ARCHITECT-2525 / FUTURE · selectors/economics — read the four economic domains for display, each LABELLED by its
// own domain name (plan §19, FCRS-27). A bare "Project Cost" is never produced — every line names exactly one domain.
import type { ProjectEconomics } from "../domain/economics";

export interface EconLine {
  label: string;       // the domain name — never a generic "Project Cost"
  value: string;       // formatted for display
  evidence: string;    // the evidence state, shown beside the value
  note?: string;
}
export interface EconomicsView {
  baseline: EconLine;
  baselineSections: { name: string; value: string }[];
  perNetFt2: EconLine;
  labor: EconLine;
  recognition: EconLine;
  settlement: EconLine;
}

function usd(n: number | null): string {
  return n == null ? "Not calculated" : "$" + Math.round(n).toLocaleString("en-US");
}
function native(code: string, n: number | null): string {
  return n == null ? "Not calculated" : `${code} ${Math.round(n).toLocaleString("en-US")}`;
}

export function economicsView(economics: ProjectEconomics): EconomicsView {
  const b = economics.baseline;
  return {
    baseline: { label: "Baseline Build Estimate", value: usd(b.total_usd as number), evidence: b.total_evidence, note: "illustrative — not a quote" },
    baselineSections: b.sections.map((s) => ({ name: s.name, value: usd(s.usd as number) })),
    perNetFt2: { label: "Per net ft²", value: usd(b.per_net_ft2_usd) + " / net ft²", evidence: b.per_net_ft2_evidence, note: "derived from an assumed baseline" },
    labor: { label: "Project Labor Cost", value: usd(economics.labor.labor_usd as number | null), evidence: economics.labor.evidence },
    recognition: { label: "Global Recognition", value: economics.recognition.u_earned == null ? "Not calculated" : `${economics.recognition.u_earned} 웃`, evidence: economics.recognition.evidence },
    settlement: { label: "Local Settlement", value: native(economics.settlement.native_currency, economics.settlement.settlement_native as number | null), evidence: economics.settlement.evidence, note: economics.settlement.jurisdiction_id || "no jurisdiction set" },
  };
}
