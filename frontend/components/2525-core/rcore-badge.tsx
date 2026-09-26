"use client";

/**
 * 2525-CORE · R-CORE Badge — the bottom-centre, two-click revision-tracking affordance (Stage 1).
 * ====================================================================================================
 * Mirrors the Powered Badge's two-stage pattern (components/powered-badge.tsx), for EVERY Innovation
 * 2525 surface (operator 2026-09-25: "Smaller logo is in bottom center of all Innovation 2525 projects.
 * When clicked, R-CORE with icon pops up, and when clicked again we are taken to version history and
 * compare tool.").
 *
 *   REST     → a small R-CORE reticle icon at the BOTTOM of the page (normal flow, mounted last), unobtrusive.
 *   CLICK 1  → it expands to the "⊕ R-CORE" wordmark pill (a labelled affordance).
 *   CLICK 2  → opens that surface's VERSION HISTORY + COMPARE panel (RCoreRevisionPanel).
 *
 * In NORMAL FLOW — a full-width, centred row mounted LAST on the page (never a fixed overlay on the
 * image/slide, operator 2026-09-25), pointer-events on the control only; small and
 * dismissable (Escape collapses the pill; Escape closes the panel). Keyboard + ARIA accessible.
 * Theme-agnostic — the accent colour comes in as a prop.
 */

import { useCallback, useEffect, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import type { RCoreHistory } from "@/lib/2525-core/revisions";
import { RCoreRevisionPanel } from "@/components/2525-core/rcore-revision-panel";

// Operator 2026-09-25 ("just use icons provided exactly as is"): render the supplied R-CORE raster artwork
// verbatim — the framed reticle at rest, the R-CORE wordmark pill on the first click — never a CSS/glyph/text
// recreation. Both are used as-is (docs/asks/2026-09-25_rcore_exact_icons.md).
const ICON = "/r-core/r-core-icon.png";        // image 1 — the framed reticle (REST)
const WORDMARK = "/r-core/r-core-wordmark.png"; // image 3 — the "R-CORE" wordmark pill (CLICK 1)
const H = 42;                                    // display height for both, natural width

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
      {/* Operator 2026-09-25: the R-CORE target sits at the BOTTOM OF THE PAGE, in normal flow, below the
          content — never a fixed overlay on top of the image/slide. Mounted last in each surface, so it lands
          at the page bottom. (The version-history panel below is still a click-to-open modal.) */}
      <div
        data-rcore-badge
        className="flex w-full justify-center"
        style={{ padding: "18px 16px", pointerEvents: "auto" }}
      >
        {stage === 0 ? (
          <button
            data-rcore-icon
            type="button"
            onClick={expand}
            aria-label={t("rcore.icon_aria")}
            title={t("rcore.icon_aria")}
            className="block bg-transparent p-0 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 rounded-lg"
            style={{ border: 0, lineHeight: 0 }}
          >
            {/* The operator's exact reticle artwork, as-is. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ICON} alt="R-CORE" style={{ height: H, width: "auto", display: "block" }} />
          </button>
        ) : (
          <button
            data-rcore-pill
            type="button"
            onClick={openPanel}
            aria-label={t("rcore.open_aria")}
            title={t("rcore.open_aria")}
            className="block bg-transparent p-0 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 rounded-full"
            style={{ border: 0, lineHeight: 0 }}
          >
            {/* The operator's exact "R-CORE" wordmark artwork, as-is — no glyph, no text recreation. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={WORDMARK} alt={t("rcore.brand")} style={{ height: H, width: "auto", display: "block" }} />
          </button>
        )}
      </div>

      {open && <RCoreRevisionPanel history={history} accent={accent} onClose={close} />}
    </>
  );
}
