"use client";

/**
 * Seed membership — the entry credential. Moved verbatim out of app/soi-session/page.tsx
 * (2026-09-07) so the pod's first screen is the pod, not the coin. Collapsed by default;
 * nothing removed (Rule 6).
 */

import { useEffect, useState } from "react";
import { SeedCoin } from "@/components/seed-coin";
import { useLexicon } from "@/lib/lexicon-context";
import { detectRegion, DEFAULT_REGION, REGION_OPTIONS, type ResolvedRegion } from "@/lib/min-wage";

const fmtUsd = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`;

/**
 * Seed membership panel — entry credential beside the Trinity. Region is
 * auto-assigned from the visitor's IP (Cloudflare /api/geo) so the correct
 * minimum wage prices the Seed; purchase must first be enabled.
 */
export function SeedMembership({ open = false }: { open?: boolean }) {
  const { t } = useLexicon();
  const [region, setRegion] = useState<ResolvedRegion>(DEFAULT_REGION);
  const [detecting, setDetecting] = useState(true);
  const [manual, setManual] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    detectRegion(ac.signal).then((r) => {
      if (!ac.signal.aborted && !manual) setRegion(r);
    }).finally(() => { if (!ac.signal.aborted) setDetecting(false); });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <details open={open} className="rounded-xl border border-border bg-card">
      <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-5 py-3">
        <span className="text-base font-semibold">{t("soi.landing.seed.summary")}</span>
        <span className="rounded-full border border-cyan-500/40 px-3 py-1 text-xs uppercase tracking-wide text-cyan-500">
          entry credential
        </span>
      </summary>
      <div className="px-5 pb-5">

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-1">
          <SeedCoin size={200} />
          <span className="text-[11px] text-muted-foreground">tap the coin to flip</span>
        </div>

        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Seed is a one-time membership priced at <span className="font-medium text-foreground">one-seventh of your
            local minimum-wage hour</span> — the same formula everywhere; only the local hour changes by region.
            Non-transferable, no vote, no economic claim.
          </p>

          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your region</span>
              <span className="text-[11px] text-muted-foreground">
                {detecting ? "detecting…" : region.detected && !manual ? "auto-detected from your location" : manual ? "manually selected" : "default (detection unavailable)"}
              </span>
            </div>
            <div className="mt-1 text-sm font-medium">{region.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">local minimum wage {fmtUsd(region.minWage)}/hr</div>

            <label className="mt-3 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Change region</label>
            <select
              value={region.label}
              onChange={(e) => {
                const r = REGION_OPTIONS.find((o) => o.label === e.target.value)
                  ?? (e.target.value === DEFAULT_REGION.label ? DEFAULT_REGION : undefined);
                if (r) { setManual(true); setRegion(r); }
              }}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              {!REGION_OPTIONS.some((o) => o.label === region.label) && (
                <option value={region.label}>{region.label} (detected)</option>
              )}
              {REGION_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>{o.label} — {fmtUsd(o.minWage)}/hr</option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-2xl font-semibold text-cyan-500">
              {fmtUsd(region.seed)}<span className="ml-1 text-sm font-normal text-muted-foreground">/ year</span>
            </div>
            <div className="text-xs text-muted-foreground">= {fmtUsd(region.minWage)} ÷ 7</div>
          </div>

          {!enabled ? (
            <div className="mt-3">
              <button
                onClick={() => setEnabled(true)}
                className="rounded-md border border-cyan-500/50 px-4 py-2 text-sm font-medium text-cyan-500 hover:bg-cyan-500/10"
              >
                Enable Seed membership purchase
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Purchase is disabled until you enable it — a deliberate first step, so nobody buys by accident.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <button className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600">
                Buy Seed — {fmtUsd(region.seed)}
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Prototype — checkout wires into the Cube 8 payment service. Seed grants membership only; it mints no ◬ ♡ 웃.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </details>
  );
}
