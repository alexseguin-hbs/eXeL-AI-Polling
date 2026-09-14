"use client";

import { useState } from "react";
import type { ThemeInfo } from "@/lib/types";
import { rankThemes, pickTier, tierAvailable, DESC_TIERS, type DescTier } from "@/lib/theme-ranked";
import { useLexicon } from "@/lib/lexicon-context";

export interface RankedThemesProps {
  themes: ThemeInfo[];
  isPaidTier?: boolean;
  accentColor?: string;
  /** Optional live Cube-7 aggregated order (theme labels); default ranks by count. */
  order?: string[];
}

/**
 * Default results panel: the current level's themes, RANKED (live Cube-7 order when supplied,
 * else by response count), each with a 33/111/333 description toggle (operator 2026-09-14).
 * Pure ranking/tier logic lives in lib/theme-ranked.ts (unit-locked); this is the view.
 */
export function RankedThemes({ themes, isPaidTier = false, accentColor = "#00E5CC", order }: RankedThemesProps) {
  const { t } = useLexicon();
  const [tier, setTier] = useState<DescTier>("33");
  const ranked = rankThemes(themes, order);
  if (ranked.length === 0) return null;
  const effectiveTier: DescTier = tierAvailable(tier, isPaidTier) ? tier : "33";

  return (
    <div className="flower-fade-in" data-testid="ranked-themes" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--foreground)" }}>{t("pollui.ranked_themes")}</h3>
        {/* 33 / 111 / 333 description-length toggle */}
        <div role="group" aria-label={t("pollui.desc_length")} style={{ display: "inline-flex", border: `1px solid ${accentColor}55`, borderRadius: 8, overflow: "hidden" }}>
          {DESC_TIERS.map((d) => {
            const avail = tierAvailable(d, isPaidTier);
            const active = effectiveTier === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => avail && setTier(d)}
                disabled={!avail}
                aria-pressed={active}
                title={avail ? `${d}` : t("pollui.tier_locked")}
                style={{
                  padding: "3px 10px",
                  fontSize: 12,
                  fontVariantNumeric: "tabular-nums",
                  cursor: avail ? "pointer" : "not-allowed",
                  opacity: avail ? 1 : 0.45,
                  background: active ? accentColor : "transparent",
                  color: active ? "#04121a" : "var(--muted-foreground)",
                  border: "none",
                }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {!isPaidTier && (
        <p style={{ fontSize: 11, color: "var(--muted-foreground)", margin: "0 0 8px" }}>{t("pollui.tier_locked")}</p>
      )}

      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {ranked.map((th, i) => (
          <li
            key={`${th.label}-${i}`}
            style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", gap: 10, alignItems: "start", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8 }}
          >
            <span style={{ fontWeight: 700, color: accentColor, fontVariantNumeric: "tabular-nums" }}>{i + 1}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{th.label}</div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 2, lineHeight: 1.45, whiteSpace: "pre-wrap" }}>
                {pickTier(th, effectiveTier, isPaidTier)}
              </div>
            </div>
            <div style={{ textAlign: "right", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{(th.count ?? 0).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{th.avgConfidence}%</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
