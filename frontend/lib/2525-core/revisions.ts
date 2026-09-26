// Vision • 2525 — R-CORE revision model + adapters (Stage 1).
// ============================================================================================
// One normalized shape for EVERY 2525 surface's revision record, and one deterministic compare
// built on the SHARED version-diff engine (lib/version-diff.ts) — the same word-level LCS that
// the living document, the CRS matrix and the SoI slide history already use. Reuse before rebuild.
//
// Two source shapes exist today and both normalize into RCoreRevision:
//   · a traceability LEDGER  ({section,route,entries:[{rev,date,kind,text,commit}]})  → fromLedgerJson
//   · a DRS revisions[]      ([{revision,date,kind,why,commit}])                       → fromDrsRevisions
//
// Pure + deterministic + no I/O: a compare is a property of the two revisions, never of when it ran.
// Viewing a comparison NEVER mutates the record — there is no writer in this module.

import { diffText, sideBySide, escHtml, type Op } from "@/lib/version-diff";

// ── Model-identifier redaction (operator 2026-09-26: "redact at render, keep the record") ────────
// The append-only ledgers keep their exact words (a factual AAR note names the model that produced a
// round); but nothing model-named ever reaches the glass. Applied in the adapters below, so the
// revision-history panel — its list, its A/B word diff and its HTML download — never renders a model
// identifier, on any surface, while the source files are untouched (fleet 2026-09-26, Christo/Thor/MoT).
const MODEL_ID_RE = /\b(?:Claude\s+)?(?:Opus|Sonnet|Haiku)\s*\d+(?:\.\d+)?|\bGrok\b(?:\s*\d+(?:\.\d+)?)?|\bGemini\b(?:\s*\d+(?:\.\d+)?)?|\bGPT-?\s*\d+(?:\.\d+)?/gi;
export function redactModelIds(s: string): string {
  return String(s ?? "").replace(MODEL_ID_RE, "an external model");
}

// ── The normalized shape every surface's history collapses into ──────────────────────────────
export interface RCoreRevision {
  /** Revision id as a string — "0.034" (DRS) or "47" (ledger). Normalized so both sort/compare alike. */
  rev: string;
  date: string;
  /** ask | decision | release | correction (free-form; unknown kinds are carried, not dropped). */
  kind?: string;
  /** A compact, single-line title derived from the detail — for the revision list. */
  title: string;
  /** The full revision text (the "why" / the ledger entry) — the body of the word diff. */
  detail?: string;
  /** The shipping commit sha when known ("PENDING" is kept verbatim, so the panel can say so). */
  commit?: string;
}

export interface RCoreHistory {
  surface: string;
  route: string;
  /** rev of the newest revision (VMAX), for the default "selected → current" comparison. */
  current: string;
  /** Chronological, oldest-first — the panel reverses for display. */
  revisions: RCoreRevision[];
}

// ── Source shapes (all fields optional so a malformed row degrades rather than throws) ───────
export interface LedgerEntryInput { rev?: number | string; date?: string; kind?: string; text?: string; commit?: string; }
export interface LedgerInput { section?: string; route?: string; note?: string; entries?: LedgerEntryInput[]; }
export interface DrsRevisionInput { revision?: string; date?: string; kind?: string; why?: string; commit?: string; }

// A commit that is not yet a sha ("", "PENDING") should not read as a shipped commit.
const commitOf = (c?: string): string | undefined => {
  const s = String(c ?? "").trim();
  return s ? s : undefined;
};

// Compact a long revision body into a one-line title: the first sentence, capped, ellipsized.
export function firstSentence(text: string, max = 100): string {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  const stop = s.search(/[.!?](\s|$)/);
  let head = stop >= 0 ? s.slice(0, stop + 1) : s;
  if (head.length > max) head = head.slice(0, max - 1).trimEnd() + "…";
  return head;
}

// ── Adapters ─────────────────────────────────────────────────────────────────────────────────
/** Normalize a traceability ledger ({section,route,entries}) into a full RCoreHistory. */
export function fromLedgerJson(json: LedgerInput | null | undefined): RCoreHistory {
  const entries = Array.isArray(json?.entries) ? json!.entries! : [];
  const revisions: RCoreRevision[] = entries.map((e) => {
    const text = redactModelIds(String(e.text ?? "")); // render-redact model ids; the source ledger keeps its words
    return {
      rev: String(e.rev ?? ""),
      date: String(e.date ?? ""),
      kind: e.kind ? String(e.kind) : undefined,
      title: firstSentence(text),
      detail: text,
      commit: commitOf(e.commit),
    };
  });
  return {
    surface: String(json?.section ?? ""),
    route: String(json?.route ?? ""),
    current: revisions.length ? revisions[revisions.length - 1].rev : "",
    revisions,
  };
}

/** Normalize a DRS revisions[] into RCoreRevision[] — caller wraps it in an RCoreHistory with a surface/route. */
export function fromDrsRevisions(revisions: readonly DrsRevisionInput[] | null | undefined): RCoreRevision[] {
  return (Array.isArray(revisions) ? revisions : []).map((r) => {
    const why = redactModelIds(String(r.why ?? "")); // render-redact model ids; the source revisions[] keeps its words
    return {
      rev: String(r.revision ?? ""),
      date: String(r.date ?? ""),
      kind: r.kind ? String(r.kind) : undefined,
      title: firstSentence(why),
      detail: why,
      commit: commitOf(r.commit),
    };
  });
}

/** Build an RCoreHistory around a bare revision list (the DRS path). */
export function historyOf(surface: string, route: string, revisions: RCoreRevision[]): RCoreHistory {
  return { surface, route, current: revisions.length ? revisions[revisions.length - 1].rev : "", revisions };
}

// ── Deterministic classification (rule-based; mirrors COMPARE_UX_SPEC's ladder, no AI) ───────
export type RCoreImpact = "L1" | "L2" | "L3" | "L4" | "L5";
const IMPACT_RANK: Record<RCoreImpact, number> = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };

// Highest-impact wording is constitutional/ontological; correction/release/decision/ask ladder below it.
export function impactOfRevision(r: RCoreRevision): RCoreImpact {
  const t = `${r.detail ?? ""}`.toLowerCase();
  if (/\binvariant\b|\bauthority\b|\bgovernance\b|\bconstitution|\bontolog|never fires|human approv/.test(t)) return "L5";
  if (r.kind === "correction") return "L4";
  if (/\beconomic|\bfunding\b|\bescrow\b|\blegal\b|\bquote\b/.test(t)) return "L4";
  if (r.kind === "release") return "L3";
  if (r.kind === "decision") return "L2";
  return "L1";
}

// Category tags by keyword — deterministic, small, order-stable.
const CATEGORY_RULES: [RegExp, string][] = [
  [/\bgovernance\b|\bauthority\b|\bapprov|\bhuman\b/, "governance"],
  [/\beconomic|\bfunding\b|\bcost\b|\bbudget\b|\bnpv\b|\brevenue\b/, "economics"],
  [/\bsecurity\b|\bsybil\b|\bpii\b/, "security"],
  [/\bgate\b|\bqualif|\bpilot\b|\brisk\b/, "qualification"],
  [/\bdeterminism\b|\breplay\b|\bhash\b|\bseed\b/, "determinism"],
  [/\blexicon\b|\bi18n\b|\blanguage\b|\btranslat/, "translation"],
];
function tagsOf(revs: RCoreRevision[]): string[] {
  const text = revs.map((r) => r.detail ?? "").join(" ").toLowerCase();
  const out: string[] = [];
  for (const [re, tag] of CATEGORY_RULES) if (re.test(text)) out.push(tag);
  if (revs.some((r) => r.kind === "correction")) out.push("correction");
  return Array.from(new Set(out));
}

// The single dominant category of ONE revision (for the per-improvement chips). "other" when none match.
export function categoryOf(r: RCoreRevision): string {
  return tagsOf([r])[0] ?? "other";
}

/** One crossed revision, enriched for the compare panel's KEY IMPROVEMENTS + Details (Vision-2525 mirror). */
export interface RCoreCrossed {
  rev: string;
  title: string;
  kind: string;
  impact: RCoreImpact;
  category: string;
}

// A small, stable fingerprint of a comparison (FNV-1a 32) — same inputs → same hash, for cache keys.
function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export interface RCoreCompare {
  fromRev: string;
  toRev: string;
  from: RCoreRevision | null;
  to: RCoreRevision | null;
  /** Entries strictly after the common floor, up to and including `to` (chronological). */
  crossed: RCoreRevision[];
  /** release-kind entries among the crossed set. */
  releasesCrossed: number;
  /** crossed asks + releases (new editions introduced between the two picks). */
  added: number;
  /** crossed decisions + corrections (prior state revised between the two picks). */
  revised: number;
  /** entries at or before the common floor — the unchanged history carried into `to`. */
  carried: number;
  /** word-level diff of from.detail → to.detail (null if either side exceeds the LCS cap). */
  ops: Op[] | null;
  /** old-side / new-side HTML fragments (del/ins) for a Before/After view. */
  sideBySide: { left: string; right: string } | null;
  /** highest impact among the crossed set (L1..L5); L1 when nothing crossed. */
  impact: RCoreImpact;
  impactTags: string[];
  /** crossed.length — the number of changes (new editions) between the two picks. */
  changes: number;
  /** every crossed revision, enriched (rev·title·kind·impact·category) — chronological. */
  perCrossed: RCoreCrossed[];
  /** the top crossed improvements, impact desc then newest-first, capped at 7 (KEY IMPROVEMENTS). */
  top: RCoreCrossed[];
  /** distinct categories among the crossed set (alias of impactTags, for the summary line). */
  sectionsAffected: string[];
  /** the categories of the L4/L5 crossed revisions (the summary's "highest impact"), capped at 4. */
  highestImpactAreas: string[];
  compareHash: string;
}

/**
 * Compare two revisions of one surface. `a`/`b` are rev ids; order is resolved by position in the
 * (chronological) history, so `from` is always the earlier pick and `to` the later — the diff reads
 * old → new whichever way they were selected. Pure and deterministic.
 */
export function compareRevisions(a: string, b: string, history: RCoreHistory): RCoreCompare {
  const revs = history?.revisions ?? [];
  const idx = (rev: string) => revs.findIndex((r) => r.rev === rev);
  let ia = idx(a);
  let ib = idx(b);
  // Fall back to the ends when a pick is unknown, so the panel always has a valid window.
  if (ia < 0) ia = 0;
  if (ib < 0) ib = revs.length - 1;
  const lo = Math.min(ia, ib);
  const hi = Math.max(ia, ib);
  const from = revs[lo] ?? null;
  const to = revs[hi] ?? null;

  const crossed = revs.slice(lo + 1, hi + 1); // strictly after `from`, through `to`
  const releasesCrossed = crossed.filter((r) => r.kind === "release").length;
  const added = crossed.filter((r) => r.kind === "ask" || r.kind === "release").length;
  const revised = crossed.filter((r) => r.kind === "decision" || r.kind === "correction").length;
  const carried = lo + 1; // `from` and everything before it are carried forward unchanged

  const ops = from && to ? diffText(from.detail ?? "", to.detail ?? "") : null;
  const sbs = sideBySide(ops, escHtml);

  const impact = crossed.length
    ? crossed.reduce<RCoreImpact>((acc, r) => {
        const i = impactOfRevision(r);
        return IMPACT_RANK[i] > IMPACT_RANK[acc] ? i : acc;
      }, "L1")
    : "L1";

  // Enriched crossed set for KEY IMPROVEMENTS + Details (deterministic; no existing field changed).
  const perCrossedFull = crossed.map((r, i) => ({
    rev: r.rev, title: r.title, kind: r.kind ?? "", impact: impactOfRevision(r), category: categoryOf(r), i,
  }));
  const stripI = ({ i: _i, ...rest }: (typeof perCrossedFull)[number]): RCoreCrossed => rest;
  const perCrossed = perCrossedFull.map(stripI);
  const top = [...perCrossedFull]
    .sort((a, b) => IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact] || b.i - a.i) // impact desc, then newest-first
    .slice(0, 7)
    .map(stripI);
  const sectionsAffected = tagsOf(crossed);
  const highestImpactAreas = Array.from(
    new Set(perCrossedFull.filter((c) => c.impact === "L4" || c.impact === "L5").map((c) => c.category)),
  ).slice(0, 4);

  const compareHash = fnv1a(`${from?.rev ?? ""}->${to?.rev ?? ""}|${crossed.length}|${releasesCrossed}|${ops ? ops.length : -1}`);

  return {
    fromRev: from?.rev ?? "",
    toRev: to?.rev ?? "",
    from,
    to,
    crossed,
    releasesCrossed,
    added,
    revised,
    carried,
    ops,
    sideBySide: sbs,
    impact,
    impactTags: tagsOf(crossed),
    changes: crossed.length,
    perCrossed,
    top,
    sectionsAffected,
    highestImpactAreas,
    compareHash,
  };
}
