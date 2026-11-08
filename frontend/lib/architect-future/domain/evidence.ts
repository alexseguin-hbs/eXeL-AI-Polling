// ARCHITECT-2525 / FUTURE · domain/evidence — the one human-facing evidence vocabulary (plan §21, FCRS-02).
// Every consequential value carries provenance. A number without an evidence state is a defect.
// Node strip-types: const-array + union (no enum), pure types only.

/** The general evidence vocabulary (plan §21). Specific domains may use narrower unions (e.g. labour). */
export const EVIDENCE_STATES = [
  "USER_STATED",     // the person said so (e.g. a stated budget) — never cost authority on its own
  "ASSUMED",         // an illustrative/baseline assumption (e.g. the ten baseline rows)
  "REFERENCE",       // external reference material (an ICON deck, a benchmark)
  "DERIVED",         // computed deterministically from other evidence (a total, a $/ft²)
  "QUOTED",          // a real accepted quote
  "QUALIFIED",       // project-specific evidence + an authenticated human (plan §20, FCRS-31/32)
  "NOT_CALCULATED",  // deliberately not computed this cycle
  "UNVERIFIED",      // a claim whose source could not be verified (plan §20)
] as const;
export type EvidenceState = (typeof EVIDENCE_STATES)[number];

/** A value paired with where it came from. The shape every surfaced number should carry. */
export interface Evidenced<T> {
  value: T;
  evidence: EvidenceState;
  /** optional free-text provenance (a file, a vendor, a source note) — never a fabricated quote. */
  source?: string;
}

export function isEvidenceState(x: unknown): x is EvidenceState {
  return typeof x === "string" && (EVIDENCE_STATES as readonly string[]).includes(x);
}
