"use client";

/**
 * 2525-CORE · R-CORE Badge — the bottom-centre, two-click revision-tracking affordance (Stage 1).
 * ====================================================================================================
 * Mirrors the Powered Badge's two-stage pattern (components/powered-badge.tsx), for EVERY Innovation
 * 2525 surface (operator 2026-09-25: "Smaller logo is in bottom center of all Innovation 2525 projects.
 * When clicked, R-CORE with icon pops up, and when clicked again we are taken to version history and
 * compare tool.").
 *
 *   REST     → a small R-CORE reticle icon, fixed at the bottom centre, unobtrusive.
 *   CLICK 1  → it expands to the "⊕ R-CORE" wordmark pill (a labelled affordance).
 *   CLICK 2  → opens that surface's VERSION HISTORY + COMPARE panel (RCoreRevisionPanel).
 *
 * Fixed + centred + high z, pointer-events on the control only, so it never blocks the page; small and
 * dismissable (Escape collapses the pill; Escape closes the panel). Keyboard + ARIA accessible.
 * Theme-agnostic — the accent colour comes in as a prop.
 */

import { useCallback, useEffect, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import type { RCoreHistory } from "@/lib/2525-core/revisions";
import { RCoreRevisionPanel } from "@/components/2525-core/rcore-revision-panel";

const ICON = "/r-core/r-core-icon.png";

export function RCoreBadge({ history, accent = "#22d3ee" }: { history: RCoreHistory; accent?: string }) {
  const { t } = useLexicon();
  // Two stages, exactly like the Powered Badge: 0 = icon at rest, 1 = ⊕ R-CORE pill. `open` = panel.
  const [stage, setStage] = useState<0 | 1>(0);
  const [open, setOpen] = useState(false);

  const expand = useCallback(() => setStage(1), []);           // CLICK 1
  const openPanel = useCallback(() => setOpen(true), []);       // CLICK 2
  const close = useCallback(() => { setOpen(false); setStage(0); }, []);

  // Escape is the dismiss: it closes the panel if open, else collapses the pill back to the icon.
  useEffect(() => {
    if (!open && stage === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (open) setOpen(false);
      else setStage(0);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, stage]);

  return (
    <>
      <div
        data-rcore-badge
        className="fixed left-1/2 z-[60] -translate-x-1/2"
        style={{ bottom: 12, pointerEvents: "auto" }}
      >
        {stage === 0 ? (
          <button
            data-rcore-icon
            type="button"
            onClick={expand}
            aria-label={t("rcore.icon_aria")}
            title={t("rcore.icon_aria")}
            className="flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2"
            style={{ background: "rgba(6,18,26,0.72)", borderColor: `${accent}66`, boxShadow: `0 0 10px ${accent}33` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON} alt="R-CORE" width={22} height={22} style={{ display: "block" }} />
          </button>
        ) : (
          <button
            data-rcore-pill
            type="button"
            onClick={openPanel}
            aria-label={t("rcore.open_aria")}
            title={t("rcore.open_aria")}
            className="flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold backdrop-blur transition-colors focus:outline-none focus-visible:ring-2"
            style={{ background: "rgba(6,18,26,0.82)", borderColor: accent, color: accent, boxShadow: `0 0 14px ${accent}44` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON} alt="" width={18} height={18} style={{ display: "block" }} />
            <span aria-hidden>⊕</span>
            <span className="tracking-wider">{t("rcore.brand")}</span>
          </button>
        )}
      </div>

      {open && <RCoreRevisionPanel history={history} accent={accent} onClose={close} />}
    </>
  );
}
