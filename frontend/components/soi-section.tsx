"use client";

/**
 * SoI Section — the published System-of-Intelligence framework on the logged-in dashboard (Sprint 6).
 * ===================================================================================================
 * Reads the PUBLISHED SoI (edited + published from Architect-2525) and reflects it here — so an edit in
 * Architect flows through to the main app via the shared store + storage event. Lives inside the
 * dashboard's <AuthGuard>, so it renders only when logged in. Reuses the SoITrinity widget + theme accent.
 *
 * Layout (operator): LEFT-JUSTIFIED with full detail — the Trinity glyph sits top-left, the three coins to
 * its right, and the Value·Flow + Need/Outcome/Solution/Evidence (NOSE) frame from the Architect Overview
 * render beneath, so the Settings "SoI Framework" modal shows the same depth as the Overview tab. All rings
 * are the ONE theme selection accent (cyan) — no per-ring colours (operator: "rings all same colour as the
 * selection cyan"). User-facing section labels flow through t() (Lexicon gate).
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { SoITrinity } from "@/components/soi-trinity";
import { useTheme } from "@/lib/theme-context";
import { TRINITY_COLORS } from "@/lib/trinity-palette";
import { useLexicon } from "@/lib/lexicon-context";
import { loadPublishedSoI, subscribeSoI, DEFAULT_SOI, type SoiFramework } from "@/lib/soi-framework";

// SoI Tri-Coin colours (operator + 13-Trinity): ♡ S.I. = sunset yellow · 웃 H.I. = violet · ◬ A.I. = cyan.
// These stay distinct on the COIN CARDS (they carry AI/SI/HI meaning) — only the RINGS are unified to cyan.
const COIN_C: Record<string, string> = { SI: TRINITY_COLORS.temporal, HI: TRINITY_COLORS.family, AI: TRINITY_COLORS.consciousness };

export function SoISection() {
  const { currentTheme } = useTheme();
  const { t } = useLexicon();
  const [soi, setSoi] = useState<SoiFramework>(() => loadPublishedSoI());
  useEffect(() => subscribeSoI(() => setSoi(loadPublishedSoI())), []);
  const accent = currentTheme?.swatch || "#19c8cf";
  // Translate the DEFAULT framework text (all 33 langs via t()); show operator-published CUSTOM text verbatim.
  const tr = (cur: string, def: string | undefined, key: string) => (def !== undefined && cur === def ? t(key) : cur);
  const slug = (k: string) => k.trim().toLowerCase();

  return (
    <Card data-soi-section className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">System of Intelligence <span className="text-xs font-normal text-muted-foreground">· ◬ ♡ 웃 Tri-Coin</span></CardTitle>
        <CardDescription>{tr(soi.thesis, DEFAULT_SOI.thesis, "soi.thesis")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trinity glyph (left) + the three coins — LEFT-justified (items-start, no mx-auto). All rings = the
            single theme accent (cyan); the SoITrinity falls back to `color` when no per-ring `colors` are given. */}
        <div className="grid items-start gap-6 md:grid-cols-[180px_1fr]">
          <div><SoITrinity labels={["웃", "♡", "◬"]} color={accent} textColor="#0a1628" size={168} /></div>
          <div className="grid gap-3 sm:grid-cols-3">
            {soi.coins.map((c) => {
              const dc = DEFAULT_SOI.coins.find((x) => x.key === c.key);
              return (
                <div key={c.key} data-soi-section-coin className="rounded-lg border p-3">
                  <div className="font-semibold" style={{ color: COIN_C[c.key] }}>{c.sym} {c.key} <span className="text-foreground">· {tr(c.name, dc?.name, `soi.coin.${c.key}.name`)}</span></div>
                  <div className="mt-1 text-xs text-muted-foreground">{tr(c.law, dc?.law, `soi.coin.${c.key}.law`)}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{tr(c.purpose, dc?.purpose, `soi.coin.${c.key}.purpose`)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Value & Flow — how contribution converts to real value (from the Architect Overview). */}
        {soi.flow.length > 0 && (
          <div data-soi-section-flow>
            <div className="mb-2 text-sm font-semibold text-foreground">{t("soi.section.flow")}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {soi.flow.map((f, i) => {
                const df = DEFAULT_SOI.flow[i]; const s = slug(df?.k ?? f.k);
                return (
                  <div key={f.k} className="rounded-lg border p-2 text-xs">
                    <span className="font-semibold text-foreground">{tr(f.k, df?.k, `soi.flow.${s}.k`)}</span> <span className="text-muted-foreground">— {tr(f.d, df?.d, `soi.flow.${s}.d`)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Why it matters — Need · Outcome · Solution · Evidence (the NOSE frame, from the Overview). */}
        {soi.nose.length > 0 && (
          <div data-soi-section-nose>
            <div className="mb-2 text-sm font-semibold text-foreground">{t("soi.section.nose")}</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {soi.nose.map((n, i) => {
                const dn = DEFAULT_SOI.nose[i]; const s = slug(dn?.k ?? n.k);
                return (
                  <div key={n.k} className="rounded-lg border p-2 text-xs">
                    <span className="font-semibold" style={{ color: accent }}>{tr(n.k, dn?.k, `soi.nose.${s}.k`)}</span> <span className="text-muted-foreground">— {tr(n.d, dn?.d, `soi.nose.${s}.d`)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
