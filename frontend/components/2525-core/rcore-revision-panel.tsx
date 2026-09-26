"use client";

/**
 * 2525-CORE · R-CORE Revision Panel — version history + A/B compare, mirroring the Vision-2525
 * living-document "WHAT CHANGED" compare EXACTLY (operator 2026-09-26: "Mirror Vision-2525
 * implementation exactly … include html download / and all features for Vision-2525 … make all
 * revisions the same format as vision-2525").
 * ====================================================================================================
 * ONE shared component mounted on every 2525 surface (SoI-2525 · Drone · Security · Settings ·
 * easter-egg · Architect · Celestial), so reaching Vision-2525 parity here renders EVERY surface's
 * revision history in the identical format. Built on the SHARED engine: compareRevisions (revisions.ts)
 * over lib/version-diff. Read-only — viewing a comparison never mutates the record.
 *
 * Mirrors the living doc's renderCompare: two SCRUBBER sliders (Before/After) with impact-coloured
 * tick marks + ‹/› steppers, "vs previous" / "v1 vs latest" presets, the exact stat chips
 * (added · revised · [removed] · carried unchanged · N releases crossed) that double as filters, the
 * summary line ("N changes across M sections · highest impact: … · removed 0 — append-only"), a
 * numbered KEY IMPROVEMENTS list with per-item impact chips (L1–L5), a Unified↔Side-by-side word diff
 * with a change navigator, a collapsed Details table, a per-revision latest/historical badge, and a
 * self-contained HTML download (the living doc's ↓). Dark ground, mobile-first (390px), theme-agnostic
 * `accent`. Meaning(AI) + Evolution modes are labelled FUTURE, never faked (COMPARE_UX_SPEC.md).
 */

import { useCallback, useMemo, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import {
  compareRevisions, impactOfRevision, categoryOf,
  type RCoreHistory, type RCoreRevision, type RCoreImpact,
} from "@/lib/2525-core/revisions";
import { escHtml, escAttr, unified } from "@/lib/version-diff";

const PAL = {
  scrim: "rgba(3,10,13,0.72)",
  bg: "#0a1518",
  panel: "#101e22",
  raised: "#132428",
  ink: "#e2ecec",
  muted: "#8fa3a6",
  line: "#22363a",
} as const;

const KIND_COLOR: Record<string, string> = {
  ask: "#f0b429",
  decision: "#a78bfa",
  release: "#34d399",
  correction: "#fb7185",
};
const kindColor = (k?: string) => (k && KIND_COLOR[k]) || PAL.muted;

// Impact-ladder colours (blueprint E): L5 purple · L4 gold · L3 accent(cyan) · L2/L1 gray.
const impactColor = (impact: RCoreImpact, accent: string) =>
  impact === "L5" ? "#a78bfa" : impact === "L4" ? "#f0b429" : impact === "L3" ? accent : PAL.muted;

function revLabel(r: RCoreRevision): string {
  return `r${r.rev}${r.date ? " · " + r.date : ""}${r.kind ? " · " + r.kind : ""}`;
}

// Max traceability (operator 2026-09-26): every decision a revision cites, from its own record text.
const D_RE = /\bD\d+\b/g;
function decisionsOf(r: RCoreRevision): string[] {
  return Array.from(new Set(String(r.detail ?? "").match(D_RE) ?? []));
}

export function RCoreRevisionPanel({
  history,
  onClose,
  accent = "#22d3ee",
}: {
  history: RCoreHistory;
  onClose: () => void;
  accent?: string;
}) {
  const { t } = useLexicon();
  const impactLabel = (impact: string) => t(`rcore.impact.${impact.toLowerCase()}`);
  const revs = history?.revisions ?? [];
  const n = revs.length;
  const display = useMemo(() => revs.map((r, i) => ({ r, i })).reverse(), [revs]);

  // The compare is driven by INDICES into the chronological array (the scrubber domain), with the
  // guardrail aIdx < bIdx. Default: Before = previous, After = latest (the operator's "vs previous").
  const [aIdx, setAIdx] = useState(n >= 2 ? n - 2 : 0);
  const [bIdx, setBIdx] = useState(n >= 1 ? n - 1 : 0);
  const [diffMode, setDiffMode] = useState<"unified" | "side">("unified");
  const [filter, setFilter] = useState<"added" | "revised" | "removed" | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [navIdx, setNavIdx] = useState(0);

  const clampA = useCallback((i: number) => Math.max(0, Math.min(i, n - 2)), [n]);
  const clampB = useCallback((i: number) => Math.max(1, Math.min(i, n - 1)), [n]);
  const setA = useCallback((i: number) => { const a = clampA(i); setAIdx(a); setBIdx((b) => Math.max(b, a + 1)); setNavIdx(0); }, [clampA]);
  const setB = useCallback((i: number) => { const b = clampB(i); setBIdx(b); setAIdx((a) => Math.min(a, b - 1)); setNavIdx(0); }, [clampB]);

  const aRev = revs[aIdx]?.rev ?? "";
  const bRev = revs[bIdx]?.rev ?? "";
  const cmp = useMemo(() => compareRevisions(aRev, bRev, history), [aRev, bRev, history]);
  const same = cmp.fromRev === cmp.toRev;

  // The crossed revisions are our "changed sections"; the filter narrows them by kind-class.
  const crossedShown = useMemo(() => {
    let list = cmp.perCrossed;
    if (filter === "added") list = list.filter((c) => c.kind === "ask" || c.kind === "release");
    else if (filter === "revised") list = list.filter((c) => c.kind === "decision" || c.kind === "correction");
    else if (filter === "removed") list = [];
    return list;
  }, [cmp.perCrossed, filter]);

  const uni = useMemo(() => (diffMode === "unified" ? unified(cmp.ops, escHtml) : null), [diffMode, cmp.ops]);

  const toggleFilter = (f: "added" | "revised" | "removed") => setFilter((cur) => (cur === f ? null : f));

  // Clicking a revision in the timeline makes it After and shifts the old After down to Before.
  const pick = (rev: string) => { const i = revs.findIndex((r) => r.rev === rev); if (i <= 0) { setA(0); return; } setB(i); };

  const surfaceSlug = String(history.surface || "surface").replace(/[^A-Za-z0-9_-]+/g, "-");
  const vmax = revs[n - 1]?.rev ?? "";
  const dlDate = revs[n - 1]?.date ?? "";

  const download = useCallback(() => {
    const html = buildDownloadHtml(history, cmp, accent, impactLabel);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `R-CORE_${surfaceSlug}_r${vmax}${dlDate ? "_" + dlDate : ""}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [history, cmp, accent, surfaceSlug, vmax, dlDate]);

  const changeWord = (k: number) => (k === 1 ? t("rcore.change_one") : t("rcore.change_many"));
  const sectionWord = (k: number) => (k === 1 ? t("rcore.section_one") : t("rcore.section_many"));
  const releaseWord = (k: number) => (k === 1 ? t("rcore.release_one") : t("rcore.release_many"));

  return (
    <div
      data-rcore-panel
      role="dialog"
      aria-modal="true"
      aria-label="R-CORE · Version History"
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: PAL.scrim, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 8px" }}
      className="sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", background: PAL.bg, color: PAL.ink, border: `1px solid ${PAL.line}`, borderRadius: 14, boxShadow: `0 0 40px ${accent}22`, fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
      >
        {/* Header */}
        <div style={{ position: "sticky", top: 0, background: PAL.bg, borderBottom: `1px solid ${PAL.line}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/r-core/r-core-icon.png" alt="" width={20} height={20} style={{ display: "block" }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", color: accent }}>
              <span aria-hidden>⊕ </span>{t("rcore.brand")} · {t("rcore.version_history")}
            </div>
            <div style={{ fontSize: 11, color: PAL.muted, fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {history.surface || "—"}{history.route ? " · " + history.route : ""} · {n} {t("rcore.rev_short")}
            </div>
          </div>
          {/* Self-contained HTML download — the living document's ↓ (operator 2026-09-26). */}
          <button
            data-rcore-download
            type="button"
            onClick={download}
            aria-label={t("rcore.download")}
            title={t("rcore.download")}
            style={{ flexShrink: 0, height: 30, width: 30, borderRadius: 8, border: `1px solid ${PAL.line}`, background: PAL.panel, color: accent, cursor: "pointer", display: "grid", placeItems: "center" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>
          </button>
          <button
            data-rcore-close
            type="button"
            onClick={onClose}
            aria-label={t("rcore.close")}
            style={{ flexShrink: 0, height: 30, width: 30, borderRadius: 8, border: `1px solid ${PAL.line}`, background: PAL.panel, color: PAL.muted, cursor: "pointer", fontSize: 16, lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {n < 2 ? (
          <p style={{ padding: 16, fontSize: 13, color: PAL.muted }}>{t("rcore.fewer_than_two")}</p>
        ) : (
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Version badge of the After pick — latest vs historical (mirrors the living doc's tag). */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, borderRadius: 999, border: `1px solid ${bIdx === n - 1 ? accent : PAL.line}`, color: bIdx === n - 1 ? accent : PAL.muted, padding: "2px 10px", fontFamily: "ui-monospace, monospace" }}>
                {revLabel(revs[bIdx])} · {bIdx === n - 1 ? t("rcore.latest_release") : t("rcore.historical_release")}
              </span>
            </div>

            {/* Pick block — two scrubbers with impact-coloured ticks + steppers, and the presets. */}
            <div style={{ border: `1px solid ${PAL.line}`, borderRadius: 10, background: PAL.panel, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 10 }}>
              <Scrubber
                side="a" testid="rcore-select-a" label={`${t("rcore.before")} · r${revs[aIdx].rev}${revs[aIdx].title ? " · " + revs[aIdx].title : ""}`}
                revs={revs} value={aIdx} min={0} max={n - 2} accent={accent} onChange={setA}
                onStep={(d) => setA(aIdx + d)}
              />
              <Scrubber
                side="b" testid="rcore-select-b" label={`${t("rcore.after")} · r${revs[bIdx].rev}${revs[bIdx].title ? " · " + revs[bIdx].title : ""}${bIdx === n - 1 ? " (current)" : ""}`}
                revs={revs} value={bIdx} min={1} max={n - 1} accent={accent} onChange={setB}
                onStep={(d) => setB(bIdx + d)}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <PresetBtn hook="prev" label={t("rcore.vs_previous")} onClick={() => { setAIdx(n - 2); setBIdx(n - 1); setNavIdx(0); }} accent={accent} />
                <PresetBtn hook="first" label={t("rcore.first_vs_latest")} onClick={() => { setAIdx(0); setBIdx(n - 1); setNavIdx(0); }} accent={accent} />
              </div>
            </div>

            {same ? (
              <p style={{ fontSize: 12, color: PAL.muted, margin: 0 }}>{t("rcore.same_rev")}</p>
            ) : (
              <>
                {/* Stat chips — the exact Vision labels; added/revised/[removed] double as filters. */}
                <div data-rcore-sum style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11 }}>
                  {cmp.added > 0 && <StatChip stat="added" label={t("rcore.added")} value={cmp.added} color="#34d399" active={filter === "added"} onClick={() => toggleFilter("added")} />}
                  {cmp.revised > 0 && <StatChip stat="revised" label={t("rcore.revised")} value={cmp.revised} color="#f0b429" active={filter === "revised"} onClick={() => toggleFilter("revised")} />}
                  {/* removed is always 0 in the append-only record; the chip appears only if it ever isn't. */}
                  {0 > 0 && <StatChip stat="removed" label={t("rcore.removed")} value={0} color="#fb7185" active={filter === "removed"} onClick={() => toggleFilter("removed")} />}
                  <StatChip stat="carried" label={t("rcore.carried_unchanged")} value={cmp.carried} color={PAL.muted} />
                  <StatChip stat="releases" label={releaseWord(cmp.releasesCrossed) + " " + t("rcore.crossed_suffix")} value={cmp.releasesCrossed} color={PAL.muted} valueFirst />
                </div>

                {/* Summary line — N changes across M sections · highest impact: … · removed 0 — append-only. */}
                <div data-rcore-summary style={{ fontSize: 12, color: PAL.ink, lineHeight: 1.5 }}>
                  <b style={{ color: accent }}>{cmp.changes}</b> {changeWord(cmp.changes)} {t("rcore.across")} <b>{cmp.sectionsAffected.length}</b> {sectionWord(cmp.sectionsAffected.length)}
                  {cmp.highestImpactAreas.length > 0 && (
                    <> · {t("rcore.highest_impact")}: <span style={{ color: "#f0b429" }}>{cmp.highestImpactAreas.join(", ")}</span></>
                  )}
                  {" · "}{t("rcore.removed")} 0 — {t("rcore.append_only")}
                </div>

                {/* KEY IMPROVEMENTS — numbered, per-item impact chip. */}
                {cmp.top.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: PAL.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {t("rcore.key_improvements")} · r{cmp.fromRev} → r{cmp.toRev}
                    </div>
                    <ul data-rcore-keyimp style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                      {cmp.top.map((it, k) => (
                        <li key={it.rev} data-rcore-keyimp-item data-impact={it.impact} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: PAL.muted, minWidth: 18 }}>{String(k + 1).padStart(2, "0")}</span>
                          <span style={{ flex: 1, minWidth: 0, color: PAL.ink }}>{it.title || `r${it.rev}`}</span>
                          <span title={it.category} style={{ fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "1px 6px", border: `1px solid ${impactColor(it.impact, accent)}`, color: impactColor(it.impact, accent) }}>{it.impact}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* What changed — Unified ↔ Side-by-side over the from→to word diff. */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: PAL.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("rcore.what_changed")}</span>
                    <span role="group" style={{ display: "inline-flex", border: `1px solid ${PAL.line}`, borderRadius: 8, overflow: "hidden" }}>
                      <ModeBtn hook="cmpVU" label={t("rcore.unified")} active={diffMode === "unified"} onClick={() => setDiffMode("unified")} accent={accent} />
                      <ModeBtn hook="cmpVS" label={t("rcore.side_by_side")} active={diffMode === "side"} onClick={() => setDiffMode("side")} accent={accent} />
                    </span>
                  </div>
                  {cmp.ops === null ? (
                    <p style={{ fontSize: 12, color: PAL.muted, margin: 0 }}>{t("rcore.too_large")}</p>
                  ) : diffMode === "unified" ? (
                    <div style={{ border: `1px solid ${PAL.line}`, borderRadius: 8, background: PAL.raised, padding: "8px 10px" }}>
                      <p
                        className="[&_del]:rounded [&_del]:bg-red-500/20 [&_del]:px-0.5 [&_del]:text-red-300 [&_del]:line-through [&_ins]:rounded [&_ins]:bg-emerald-500/20 [&_ins]:px-0.5 [&_ins]:text-emerald-300 [&_ins]:no-underline"
                        style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: PAL.ink }}
                        dangerouslySetInnerHTML={{ __html: uni || "&mdash;" }}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div style={{ border: `1px solid ${PAL.line}`, borderRadius: 8, background: PAL.raised, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: PAL.muted, marginBottom: 4, fontFamily: "ui-monospace, monospace" }}>{t("rcore.before")} · r{cmp.fromRev}</div>
                        <p className="[&_del]:rounded [&_del]:bg-red-500/20 [&_del]:px-0.5 [&_del]:text-red-300 [&_del]:line-through" style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: PAL.ink }} dangerouslySetInnerHTML={{ __html: cmp.sideBySide?.left || "&mdash;" }} />
                      </div>
                      <div style={{ border: `1px solid ${PAL.line}`, borderRadius: 8, background: PAL.raised, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: PAL.muted, marginBottom: 4, fontFamily: "ui-monospace, monospace" }}>{t("rcore.after")} · r{cmp.toRev}</div>
                        <p className="[&_ins]:rounded [&_ins]:bg-emerald-500/20 [&_ins]:px-0.5 [&_ins]:text-emerald-300 [&_ins]:no-underline" style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: PAL.ink }} dangerouslySetInnerHTML={{ __html: cmp.sideBySide?.right || "&mdash;" }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Change navigator over the crossed revisions (our "changes"), shown when there is > 1. */}
                {cmp.perCrossed.length > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 12, color: PAL.muted }}>
                    <button data-rcore-nav="prev" type="button" onClick={() => setNavIdx((i) => Math.max(0, i - 1))} disabled={navIdx <= 0} style={navBtn(PAL, accent, navIdx <= 0)}>‹ {t("rcore.prev_change")}</button>
                    <span style={{ fontFamily: "ui-monospace, monospace" }}>{navIdx + 1} / {cmp.perCrossed.length}</span>
                    <button data-rcore-nav="next" type="button" onClick={() => setNavIdx((i) => Math.min(cmp.perCrossed.length - 1, i + 1))} disabled={navIdx >= cmp.perCrossed.length - 1} style={navBtn(PAL, accent, navIdx >= cmp.perCrossed.length - 1)}>{t("rcore.next_change")} ›</button>
                  </div>
                )}

                {/* Details — the crossed revisions as a table (collapsed). Respects the active filter. */}
                <details data-rcore-details>
                  <summary style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: PAL.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {t("rcore.details")}{filter ? ` · ${t("rcore.filtered")}: ${t("rcore." + filter)}` : ""}
                  </summary>
                  <div style={{ overflowX: "auto", marginTop: 8 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ color: PAL.muted, textAlign: "left" }}>
                          <th style={thTd(PAL)}>{t("rcore.revision_col")}</th>
                          <th style={thTd(PAL)}>{t("rcore.kind_col")}</th>
                          <th style={thTd(PAL)}>{t("rcore.impact_col")}</th>
                          <th style={thTd(PAL)}>{t("rcore.date_col")}</th>
                          <th style={thTd(PAL)}>{t("rcore.reason_col")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {crossedShown.map((c) => (
                          <tr key={c.rev}>
                            <td style={{ ...thTd(PAL), fontFamily: "ui-monospace, monospace", color: accent }}>r{c.rev}</td>
                            <td style={{ ...thTd(PAL), color: kindColor(c.kind) }}>{c.kind || "—"}</td>
                            <td style={{ ...thTd(PAL) }}><span style={{ color: impactColor(c.impact, accent), fontWeight: 700 }}>{c.impact}</span></td>
                            <td style={{ ...thTd(PAL), color: PAL.muted, fontFamily: "ui-monospace, monospace" }}>{revs.find((r) => r.rev === c.rev)?.date || ""}</td>
                            <td style={{ ...thTd(PAL), color: PAL.ink }}>{c.title || ""}</td>
                          </tr>
                        ))}
                        {crossedShown.length === 0 && (
                          <tr><td colSpan={5} style={{ ...thTd(PAL), color: PAL.muted }}>—</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </details>
              </>
            )}

            {/* Revision timeline — newest first; tap to set After. Keeps the D#/commit traceability line. */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: PAL.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("rcore.history")}</div>
              <ol data-rcore-list style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {display.map(({ r }) => {
                  const isB = r.rev === bRev;
                  const isA = r.rev === aRev;
                  const ds = decisionsOf(r);
                  return (
                    <li key={r.rev}>
                      <button
                        type="button"
                        onClick={() => pick(r.rev)}
                        title={revLabel(r)}
                        style={{ display: "block", width: "100%", textAlign: "left", cursor: "pointer", borderRadius: 8, border: `1px solid ${isB ? accent : isA ? `${accent}66` : PAL.line}`, background: isB ? `${accent}14` : PAL.panel, padding: "8px 10px" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, fontWeight: 700, color: accent }}>r{r.rev}</span>
                          {r.kind && (
                            <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", borderRadius: 4, padding: "1px 6px", border: `1px solid ${kindColor(r.kind)}`, color: kindColor(r.kind) }}>{r.kind}</span>
                          )}
                          <span style={{ fontSize: 10, color: PAL.muted, fontFamily: "ui-monospace, monospace" }}>{r.date}</span>
                          {(isA || isB) && (
                            <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: accent }}>{(isB ? t("rcore.after") : t("rcore.before")).toUpperCase()}</span>
                          )}
                        </div>
                        <div style={{ marginTop: 3, fontSize: 12, color: PAL.ink, lineHeight: 1.45 }}>{r.title}</div>
                        {(ds.length > 0 || r.commit) && (
                          <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 5 }}>
                            {ds.map((d) => (
                              <span key={d} style={{ fontSize: 9, fontFamily: "ui-monospace, monospace", color: "#a78bfa", border: "1px solid #a78bfa55", borderRadius: 4, padding: "0 5px", lineHeight: "15px" }}>{d}</span>
                            ))}
                            {r.commit && (
                              <span style={{ fontSize: 10, color: "#34d399", fontFamily: "ui-monospace, monospace" }} title={t("rcore.rev_short")}><span aria-hidden>⎇ </span>{r.commit}</span>
                            )}
                          </div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* The compare's impact chip kept for the data-rcore-impact hook (test + at-a-glance). */}
            {!same && (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <span data-rcore-impact style={{ fontSize: 10, fontWeight: 600, borderRadius: 6, border: `1px solid ${impactColor(cmp.impact, accent)}55`, color: impactColor(cmp.impact, accent), padding: "2px 7px" }}>
                  {impactLabel(cmp.impact)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small presentational helpers ─────────────────────────────────────────────────────────────────
function Scrubber({ side, testid, label, revs, value, min, max, accent, onChange, onStep }: {
  side: "a" | "b"; testid: string; label: string; revs: RCoreRevision[]; value: number; min: number; max: number; accent: string; onChange: (i: number) => void; onStep: (d: number) => void;
}) {
  const n = revs.length;
  return (
    <div data-rcore-scrub={side}>
      <div style={{ fontSize: 11, color: PAL.muted, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button data-rcore-step={`${side}-prev`} type="button" onClick={() => onStep(-1)} disabled={value <= min} aria-label="step back" style={stepBtn(value <= min)}>‹</button>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            data-testid={testid}
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            aria-label={side === "a" ? "Before release" : "After release"}
            style={{ width: "100%", accentColor: accent }}
          />
          <div data-rcore-ticks={side} aria-hidden style={{ position: "relative", height: 6, marginTop: 2 }}>
            {revs.map((r, i) => (
              <i key={r.rev} style={{ position: "absolute", left: `${n > 1 ? (i / (n - 1)) * 100 : 0}%`, top: 0, width: 2, height: 6, transform: "translateX(-1px)", background: impactOfRevision(r) === "L5" || impactOfRevision(r) === "L4" ? "#f0b429" : PAL.line }} />
            ))}
          </div>
        </div>
        <button data-rcore-step={`${side}-next`} type="button" onClick={() => onStep(1)} disabled={value >= max} aria-label="step forward" style={stepBtn(value >= max)}>›</button>
      </div>
    </div>
  );
}

function PresetBtn({ hook, label, onClick, accent }: { hook: string; label: string; onClick: () => void; accent: string }) {
  return (
    <button data-rcore-preset={hook} type="button" onClick={onClick} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 999, border: `1px solid ${PAL.line}`, background: PAL.raised, color: accent, cursor: "pointer" }}>{label}</button>
  );
}

function ModeBtn({ hook, label, active, onClick, accent }: { hook: string; label: string; active: boolean; onClick: () => void; accent: string }) {
  return (
    <button data-rcore-mode={hook} type="button" aria-pressed={active} onClick={onClick} style={{ fontSize: 11, padding: "4px 10px", border: 0, background: active ? `${accent}22` : PAL.panel, color: active ? accent : PAL.muted, cursor: "pointer" }}>{label}</button>
  );
}

function StatChip({ stat, label, value, color, active, onClick, valueFirst }: { stat: string; label: string; value: number; color: string; active?: boolean; onClick?: () => void; valueFirst?: boolean }) {
  const inner = valueFirst ? (
    <><span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color }}>{value}</span><span style={{ color: PAL.muted }}>{label}</span></>
  ) : (
    <><span style={{ color: PAL.muted }}>{label}</span><span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color }}>{value}</span></>
  );
  const style = { display: "inline-flex", alignItems: "baseline", gap: 4, borderRadius: 6, border: `1px solid ${active ? color : PAL.line}`, background: active ? `${color}18` : "transparent", padding: "2px 8px", cursor: onClick ? "pointer" : "default" } as const;
  return onClick ? (
    <button data-rcore-stat={stat} type="button" aria-pressed={!!active} onClick={onClick} style={style}>{inner}</button>
  ) : (
    <span data-rcore-stat={stat} style={style}>{inner}</span>
  );
}

const stepBtn = (disabled: boolean) => ({ height: 24, width: 24, flexShrink: 0, borderRadius: 6, border: `1px solid ${PAL.line}`, background: PAL.raised, color: disabled ? PAL.line : PAL.ink, cursor: disabled ? "default" : "pointer", fontSize: 13, lineHeight: 1 } as const);
const navBtn = (pal: typeof PAL, accent: string, disabled: boolean) => ({ fontSize: 11, padding: "3px 8px", borderRadius: 6, border: `1px solid ${pal.line}`, background: pal.panel, color: disabled ? pal.line : accent, cursor: disabled ? "default" : "pointer" } as const);
const thTd = (pal: typeof PAL) => ({ borderBottom: `1px solid ${pal.line}`, padding: "4px 8px", verticalAlign: "top" } as const);

// ── Self-contained HTML download (deterministic; no clock/random) ────────────────────────────────
function buildDownloadHtml(history: RCoreHistory, cmp: ReturnType<typeof compareRevisions>, accent: string, impactLabel: (i: string) => string): string {
  const revs = history.revisions ?? [];
  const surface = escHtml(history.surface || "surface");
  const vmax = revs[revs.length - 1]?.rev ?? "";
  const rowsLedger = revs.slice().reverse().map((r) => {
    const ds = (String(r.detail ?? "").match(/\bD\d+\b/g) ?? []).filter((v, i, a) => a.indexOf(v) === i).join(" ");
    return `<tr><td class=m>r${escHtml(r.rev)}</td><td>${escHtml(r.date || "")}</td><td>${escHtml(r.kind || "")}</td><td>${escHtml(r.title || "")}</td><td class=d>${escHtml(ds)}</td><td class=m>${escHtml(r.commit || "")}</td></tr>`;
  }).join("");
  const keyimp = cmp.top.map((it, k) => `<li><span class=rk>${String(k + 1).padStart(2, "0")}</span> ${escHtml(it.title || ("r" + it.rev))} <span class="imp ${it.impact}">${it.impact}</span></li>`).join("");
  const diff = unified(cmp.ops, escHtml) || "—";
  const hi = cmp.highestImpactAreas.length ? ` · highest impact: ${escHtml(cmp.highestImpactAreas.join(", "))}` : "";
  const summary = `${cmp.changes} change${cmp.changes === 1 ? "" : "s"} across ${cmp.sectionsAffected.length} section${cmp.sectionsAffected.length === 1 ? "" : "s"}${hi} · removed 0 — append-only`;
  return `<!doctype html><html lang=en><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>R-CORE · ${surface} · Version History (r${escAttr(vmax)})</title>
<style>
:root{color-scheme:dark}
body{margin:0;background:#0a1518;color:#e2ecec;font:14px/1.6 ui-sans-serif,system-ui,sans-serif;padding:24px 16px}
.wrap{max-width:820px;margin:0 auto}
h1{font-size:16px;letter-spacing:.06em;color:${escAttr(accent)};margin:0 0 4px}
.sub{color:#8fa3a6;font-size:12px;font-family:ui-monospace,monospace;margin-bottom:18px}
h2{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#8fa3a6;margin:20px 0 8px;border-bottom:1px solid #22363a;padding-bottom:4px}
table{width:100%;border-collapse:collapse;font-size:12px}
th,td{border-bottom:1px solid #22363a;padding:5px 8px;text-align:left;vertical-align:top}
th{color:#8fa3a6}
.m{font-family:ui-monospace,monospace}
td.m{color:${escAttr(accent)}}
td.d{color:#a78bfa;font-family:ui-monospace,monospace}
.cmp{border:1px solid #22363a;border-radius:8px;background:#101e22;padding:10px 12px}
.sum{color:#e2ecec;margin:0 0 8px}
ol.ki{list-style:none;margin:0;padding:0}
ol.ki li{display:flex;align-items:center;gap:8px;padding:2px 0}
.rk{font-family:ui-monospace,monospace;color:#8fa3a6;font-size:11px}
.imp{font-size:10px;font-weight:700;border:1px solid;border-radius:4px;padding:1px 5px;margin-left:auto}
.imp.L5{color:#a78bfa;border-color:#a78bfa}.imp.L4{color:#f0b429;border-color:#f0b429}.imp.L3{color:${escAttr(accent)};border-color:${escAttr(accent)}}.imp.L2,.imp.L1{color:#8fa3a6;border-color:#8fa3a6}
.diff{background:#132428;border-radius:8px;padding:8px 10px;line-height:1.7}
.diff del{background:rgba(251,113,133,.2);color:#fca5b5;border-radius:3px;padding:0 2px}
.diff ins{background:rgba(52,211,153,.2);color:#6ee7b7;text-decoration:none;border-radius:3px;padding:0 2px}
.foot{color:#8fa3a6;font-size:11px;margin-top:24px;border-top:1px solid #22363a;padding-top:10px}
</style></head><body><div class=wrap>
<h1>⊕ R-CORE · Version History</h1>
<div class=sub>${surface}${history.route ? " · " + escHtml(history.route) : ""} · ${revs.length} revisions · HEAD r${escHtml(vmax)}</div>
<h2>Current comparison — r${escHtml(cmp.fromRev)} → r${escHtml(cmp.toRev)}</h2>
<div class=cmp>
<p class=sum>${escHtml(summary)}</p>
<ol class=ki>${keyimp}</ol>
</div>
<h2>What changed — r${escHtml(cmp.fromRev)} → r${escHtml(cmp.toRev)}</h2>
<div class=diff>${diff}</div>
<h2>Full record — every revision, newest first (append-only)</h2>
<table><thead><tr><th>Revision</th><th>Date</th><th>Kind</th><th>What changed</th><th>Decisions</th><th>Commit</th></tr></thead><tbody>${rowsLedger}</tbody></table>
<div class=foot>R-CORE revision record · one self-contained file · read offline · nothing here executes. Impact ladder L1 editorial · L2 clarification · L3 functional · L4 governance/economic · L5 constitutional.</div>
</div></body></html>`;
}
