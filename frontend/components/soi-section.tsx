"use client";

/**
 * SoI Section — the published System-of-Intelligence framework on the logged-in dashboard (Sprint 6).
 * ===================================================================================================
 * Reads the PUBLISHED SoI (edited + published from Architect-2525) and reflects it here — so an edit in
 * Architect flows through to the main app via the shared store + storage event. Lives inside the
 * dashboard's <AuthGuard>, so it renders only when logged in. Reuses the SoITrinity widget + theme accent.
 */
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { SoITrinity } from "@/components/soi-trinity";
import { useTheme } from "@/lib/theme-context";
import { loadPublishedSoI, subscribeSoI, type SoiFramework } from "@/lib/soi-framework";

const COIN_C: Record<string, string> = { SI: "#ef4444", HI: "#22c55e", AI: "#19c8cf" };

export function SoISection() {
  const { currentTheme } = useTheme();
  const [soi, setSoi] = useState<SoiFramework>(() => loadPublishedSoI());
  useEffect(() => subscribeSoI(() => setSoi(loadPublishedSoI())), []);
  const accent = currentTheme?.swatch || "#19c8cf";

  return (
    <Card data-soi-section className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">System of Intelligence <span className="text-xs font-normal text-muted-foreground">· ◬ ♡ 웃 Tri-Coin</span></CardTitle>
        <CardDescription>{soi.thesis}</CardDescription>
      </CardHeader>
      <CardContent className="grid items-center gap-6 md:grid-cols-[180px_1fr]">
        <div className="mx-auto"><SoITrinity labels={["A.I.", "S.I.", "H.I."]} color={accent} textColor="#0a1628" size={168} /></div>
        <div className="grid gap-3 sm:grid-cols-3">
          {soi.coins.map((c) => (
            <div key={c.key} data-soi-section-coin className="rounded-lg border p-3">
              <div className="font-semibold" style={{ color: COIN_C[c.key] }}>{c.sym} {c.key} <span className="text-foreground">· {c.name}</span></div>
              <div className="mt-1 text-xs text-muted-foreground">{c.law}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.purpose}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
