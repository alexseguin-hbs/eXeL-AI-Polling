"use client";

/**
 * 2525-CORE · R-CORE Revision Panel — version history + A/B compare, in the Vision-2525 method.
 * ====================================================================================================
 * Titled "R-CORE · Version History" so it never blurs with the R-CORE capability-lane concept. Templated
 * from soi-slide-compare.tsx (the working A/B compare): a revision list, two selectors (default latest vs
 * previous), the deterministic "What changed" word diff (reusing lib/version-diff via compareRevisions),
 * the releases-crossed count and impact tags. Single column, dark ground by default, mobile-first (390px),
 * theme-agnostic colours via the `accent` prop. Read-only — viewing a comparison never mutates the record.
 */

import { useMemo, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { compareRevisions, type RCoreHistory, type RCoreRevision } from "@/lib/2525-core/revisions";

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

function revLabel(r: RCoreRevision): string {
  return `r${r.rev}${r.date ? " · " + r.date : ""}${r.kind ? " · " + r.kind : ""}`;
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
  // Newest-first for the list; the underlying array stays chronological.
  const display = useMemo(() => revs.map((r, i) => ({ r, i })).reverse(), [revs]);

  // Defaults: A = previous, B = latest (the operator's "vs previous").
  const [aRev, setARev] = useState(n >= 2 ? revs[n - 2].rev : n ? revs[0].rev : "");
  const [bRev, setBRev] = useState(n ? revs[n - 1].rev : "");

  const cmp = useMemo(() => compareRevisions(aRev, bRev, history), [aRev, bRev, history]);
  const same = cmp.fromRev === cmp.toRev;

  // Clicking a revision in the list makes it B and shifts the old B down to A (the polling-history idiom).
  const pick = (rev: string) => { setARev(bRev); setBRev(rev); };

  return (
    <div
      data-rcore-panel
      role="dialog"
      aria-modal="true"
      aria-label="R-CORE · Version History"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: PAL.scrim,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 8px",
      }}
      className="sm:items-center"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 620,
          maxHeight: "90vh",
          overflowY: "auto",
          background: PAL.bg,
          color: PAL.ink,
          border: `1px solid ${PAL.line}`,
          borderRadius: 14,
          boxShadow: `0 0 40px ${accent}22`,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
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
            {/* Compare selectors */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12, color: PAL.muted }}>
              <span style={{ fontWeight: 600, color: PAL.ink }}>{t("rcore.compare")}</span>
              <RevSelect testid="rcore-select-a" value={aRev} onChange={setARev} revs={revs} />
              <span aria-hidden>→</span>
              <RevSelect testid="rcore-select-b" value={bRev} onChange={setBRev} revs={revs} />
            </div>

            {/* Difference overview */}
            <div style={{ border: `1px solid ${PAL.line}`, borderRadius: 10, background: PAL.panel, padding: "10px 12px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: accent, fontWeight: 700 }}>
                  r{cmp.fromRev} → r{cmp.toRev}
                </span>
                <span data-rcore-impact style={{ fontSize: 10, fontWeight: 600, borderRadius: 6, border: `1px solid ${accent}55`, color: accent, padding: "2px 7px" }}>
                  {impactLabel(cmp.impact)}
                </span>
              </div>
              {same ? (
                <p style={{ fontSize: 12, color: PAL.muted, margin: 0 }}>{t("rcore.same_rev")}</p>
              ) : (
                <>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11 }}>
                    <Stat label={t("rcore.releases_crossed")} value={cmp.releasesCrossed} color="#34d399" />
                    <Stat label={t("rcore.added")} value={cmp.added} color="#34d399" />
                    <Stat label={t("rcore.revised")} value={cmp.revised} color="#f0b429" />
                    <Stat label={t("rcore.carried")} value={cmp.carried} color={PAL.muted} />
                  </div>
                  {cmp.impactTags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {cmp.impactTags.map((tag) => (
                        <span key={tag} style={{ fontSize: 10, borderRadius: 999, border: `1px solid ${PAL.line}`, color: PAL.muted, padding: "1px 8px" }}>{tag}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* What changed — deterministic word diff (reuses version-diff via compareRevisions) */}
            {!same && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: PAL.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("rcore.what_changed")}</div>
                {cmp.sideBySide ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div style={{ border: `1px solid ${PAL.line}`, borderRadius: 8, background: PAL.raised, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: PAL.muted, marginBottom: 4, fontFamily: "ui-monospace, monospace" }}>{t("rcore.before")} · r{cmp.fromRev}</div>
                      <p
                        className="[&_del]:rounded [&_del]:bg-red-500/20 [&_del]:px-0.5 [&_del]:text-red-300 [&_del]:line-through"
                        style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: PAL.ink }}
                        dangerouslySetInnerHTML={{ __html: cmp.sideBySide.left || "&mdash;" }}
                      />
                    </div>
                    <div style={{ border: `1px solid ${PAL.line}`, borderRadius: 8, background: PAL.raised, padding: "8px 10px" }}>
                      <div style={{ fontSize: 10, color: PAL.muted, marginBottom: 4, fontFamily: "ui-monospace, monospace" }}>{t("rcore.after")} · r{cmp.toRev}</div>
                      <p
                        className="[&_ins]:rounded [&_ins]:bg-emerald-500/20 [&_ins]:px-0.5 [&_ins]:text-emerald-300 [&_ins]:no-underline"
                        style={{ margin: 0, fontSize: 12, lineHeight: 1.6, color: PAL.ink }}
                        dangerouslySetInnerHTML={{ __html: cmp.sideBySide.right || "&mdash;" }}
                      />
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: PAL.muted, margin: 0 }}>{t("rcore.too_large")}</p>
                )}
              </div>
            )}

            {/* Revision timeline — newest first; tap to set the "after" side */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: PAL.muted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("rcore.history")}</div>
              <ol data-rcore-list style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
                {display.map(({ r }) => {
                  const isB = r.rev === bRev;
                  const isA = r.rev === aRev;
                  return (
                    <li key={r.rev}>
                      <button
                        type="button"
                        onClick={() => pick(r.rev)}
                        title={revLabel(r)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          cursor: "pointer",
                          borderRadius: 8,
                          border: `1px solid ${isB ? accent : isA ? `${accent}66` : PAL.line}`,
                          background: isB ? `${accent}14` : PAL.panel,
                          padding: "8px 10px",
                        }}
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
                        {r.commit && (
                          <div style={{ marginTop: 2, fontSize: 10, color: "#34d399", fontFamily: "ui-monospace, monospace" }}>{r.commit}</div>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RevSelect({ testid, value, onChange, revs }: { testid: string; value: string; onChange: (v: string) => void; revs: RCoreRevision[] }) {
  return (
    <select
      data-testid={testid}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${PAL.line}`, background: PAL.panel, color: PAL.ink, fontFamily: "ui-monospace, monospace" }}
    >
      {revs.map((r) => (
        <option key={r.rev} value={r.rev}>{`r${r.rev}${r.date ? " · " + r.date : ""}`}</option>
      ))}
    </select>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "baseline", gap: 4, borderRadius: 6, border: `1px solid ${PAL.line}`, padding: "2px 8px" }}>
      <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700, color }}>{value}</span>
      <span style={{ color: PAL.muted }}>{label}</span>
    </span>
  );
}
