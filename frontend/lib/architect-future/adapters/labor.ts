// ARCHITECT-2525 / FUTURE · adapters/labor — wraps the audited donor architect-labor.ts (plan §19, FCRS-23..25).
// ONLY an adapter may import a donor (plan §22). The donor is self-contained and imports nothing banned, so this does
// not reach a DO_NOT_IMPORT module (T-IMPORT-BAN). The donor's own evidence vocabulary is aliased LaborEvidenceState
// and mapped — never merged — into the Future evidence vocabulary at the boundary.
import type { ProjectLaborCost, LocalSettlement, GlobalRecognition } from "../domain/economics";
import type { EvidenceState } from "../domain/evidence";
import { tagUsd } from "../domain/economics";
import {
  projectLaborCost as donorProjectLaborCost,
  recognitionU,
  LOCAL_WAGES,
  localMinWageHourlyNative,
} from "../../architect-labor";

/** Labour's own evidence vocabulary (the donor's COST_AUTHORITY_ORDER members), kept separate from the general one. */
export type LaborEvidenceState =
  | "QUOTED" | "PREVAILING" | "STORED" | "HI_NORMALIZED" | "US_RESEARCH" | "NOT_CALCULATED";

/** Map the donor's labour authority to the GENERAL evidence vocabulary at the boundary (never a fabricated state). */
function toGeneralEvidence(a: LaborEvidenceState): EvidenceState {
  switch (a) {
    case "QUOTED": return "QUOTED";
    case "NOT_CALCULATED": return "NOT_CALCULATED";
    case "HI_NORMALIZED": return "DERIVED";
    case "PREVAILING":
    case "STORED":
    case "US_RESEARCH": return "REFERENCE";
  }
}

/** The jurisdictions the Future UI offers → the donor's frozen LOCAL_WAGES key (provenance of record). */
export const JURISDICTIONS: ReadonlyArray<{ id: string; donor_key: string; label: string }> = [
  { id: "us-tx-austin", donor_key: "US-AUSTIN", label: "Austin, Texas · US" },
  { id: "us-tx", donor_key: "US-TX", label: "Texas · US" },
  { id: "ng-lagos", donor_key: "NG", label: "Lagos · Nigeria" },
  { id: "mx", donor_key: "MX", label: "Mexico" },
  { id: "co", donor_key: "CO", label: "Colombia" },
  { id: "br", donor_key: "BR", label: "Brazil" },
];

/** Evidence the caller can supply for the project's own labour cost — highest available wins (the firewall input). */
export interface ProjectLaborEvidenceInput {
  quotedUsd?: number | null;
  prevailingUsd?: number | null;
  storedWageUsd?: number | null;
  hiNormalizedUsd?: number | null;
  usResearchUsd?: number | null;
}

/** Project Labor Cost as a Future domain value, wrapping the donor's authority-ordered projectLaborCost. */
export function projectLabor(evidence: ProjectLaborEvidenceInput): ProjectLaborCost {
  const r = donorProjectLaborCost(evidence);
  return {
    kind: "ProjectLaborCost",
    labor_usd: r.laborUsd == null ? null : tagUsd("labor", r.laborUsd),
    evidence: toGeneralEvidence(r.authority as LaborEvidenceState),
  };
}

/** Global Recognition (웃) from hours × a trade multiple — jurisdiction-INDEPENDENT (FCRS-24). */
export function recognitionFor(hours: number | null, multiple: number | null): GlobalRecognition {
  const u = multiple == null ? null : recognitionU(hours, multiple);
  return { kind: "GlobalRecognition", u_earned: u, evidence: u == null ? "NOT_CALCULATED" : "DERIVED" };
}

/**
 * The Local Settlement for a jurisdiction: local min-wage hourly (native) × recognition (웃), native currency
 * authoritative. Returns NOT_CALCULATED when recognition is unknown or the jurisdiction/rate cannot be derived.
 * The native value is branded Usd<"settlement"> so it can never be assigned to a labour input (the firewall).
 */
export function settlementForJurisdiction(jurisdictionId: string, uEarned: number | null): LocalSettlement {
  const j = JURISDICTIONS.find((x) => x.id === jurisdictionId);
  const jd = j ? LOCAL_WAGES[j.donor_key] : undefined;
  if (!jd) return { kind: "LocalSettlement", jurisdiction_id: jurisdictionId, native_currency: "?", settlement_native: null, evidence: "NOT_CALCULATED" };
  const rate = localMinWageHourlyNative(jd);
  const native = rate != null && uEarned != null ? Math.round(rate * uEarned * 100) / 100 : null;
  return {
    kind: "LocalSettlement",
    jurisdiction_id: jurisdictionId,
    native_currency: jd.native_currency,
    settlement_native: native == null ? null : tagUsd("settlement", native),
    evidence: native == null ? "NOT_CALCULATED" : "REFERENCE",
  };
}
