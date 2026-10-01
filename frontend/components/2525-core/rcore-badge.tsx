"use client";

/**
 * 2525-CORE · R-CORE Badge — the bottom-centre revision-tracking affordance (a toggle, then the panel) (Stage 1).
 * ====================================================================================================
 * Grew out of the Powered Badge's two-stage pattern (components/powered-badge.tsx), for EVERY Innovation
 * 2525 surface (operator 2026-09-25: "Smaller logo is in bottom center of all Innovation 2525 projects.
 * When clicked, R-CORE with icon pops up, and when clicked again we are taken to version history and
 * compare tool.").
 *
 *   REST     → the "⊕ R-CORE" wordmark pill, centred at the BOTTOM of the page (normal flow, mounted last).
 *   TAP      → the single reticle icon MAXIMIZES beneath it; a second tap on R-CORE MINIMIZES it again — a toggle
 *              (operator 2026-09-30: "dont show single R-CORE icon. Instead; have where R-CORE IS clicked, single
 *              Icon appears, then if clicked again, disappears in same way maximize shrinks to minimize").
 *   ICON TAP → opens that surface's VERSION HISTORY + COMPARE panel (RCoreRevisionPanel); close minimizes the icon.
 *
 * In NORMAL FLOW — a full-width, centred row mounted LAST on the page (never a fixed overlay on the
 * image/slide, operator 2026-09-25), pointer-events on the control only; small and
 * dismissable (Escape collapses the pill; Escape closes the panel). Keyboard + ARIA accessible.
 * Theme-agnostic — the accent colour comes in as a prop.
 */

import { useCallback, useEffect, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { RCORE_LOGO_H, type RCoreHistory } from "@/lib/2525-core/revisions";
import { RCoreRevisionPanel } from "@/components/2525-core/rcore-revision-panel";

// Operator 2026-09-25 ("just use icons provided exactly as is"): render the supplied R-CORE raster artwork
// verbatim — the R-CORE wordmark pill at rest, the framed reticle on a tap — never a CSS/glyph/text
// recreation. Both are used as-is (docs/asks/2026-09-25_rcore_exact_icons.md).
const ICON = "/r-core/r-core-icon.png";        // image 1 — the framed reticle (shown on a tap; opens the panel)
const WORDMARK = "/r-core/r-core-wordmark.png"; // image 3 — the "R-CORE" wordmark pill (REST; the toggle)
const H = RCORE_LOGO_H;                          // display height for both, natural width — the SAME size the panel header uses (operator 2026-09-27)

export function RCoreBadge({ history, accent = "#22d3ee" }: { history: RCoreHistory; accent?: string }) {
  const { t } = useLexicon();
  // THE TOGGLE (operator 2026-09-30 "dont show single R-CORE icon. Instead; have where R-CORE IS clicked, single Icon appears,
  // then if clicked again, disappears in same way maximize shrinks to minimize"): REST = the R-CORE wordmark, centred;
  // a tap on it MAXIMIZES the single icon beneath (grows from nothing); a second tap MINIMIZES it (shrinks back to nothing);
  // the icon, when shown, opens the panel; closing the panel minimizes the icon again.
  const [showIcon, setShowIcon] = useState(false);
  const [open, setOpen] = useState(false);

  const toggleIcon = useCallback(() => setShowIcon((v) => !v), []);   // R-CORE tapped: maximize ↔ minimize
  const openPanel = useCallback(() => setOpen(true), []);              // the icon tapped: the panel
  const close = useCallback(() => { setOpen(false); setShowIcon(false); }, []);

  // Escape is the dismiss: it closes the panel if open, else minimizes the icon.
  useEffect(() => {
    if (!open && !showIcon) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (open) setOpen(false);
      else setShowIcon(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, showIcon]);

  return (
    <>
      {/* Operator 2026-09-25: the R-CORE target sits at the BOTTOM OF THE PAGE, in normal flow, below the
          content — never a fixed overlay on top of the image/slide. Mounted last in each surface, so it lands
          at the page bottom. Operator 2026-09-30: R-CORE and its icon on the page's centre line. */}
      <div
        data-rcore-badge
        data-rcore-icon-shown={showIcon ? "1" : "0"}
        className="flex w-full flex-col items-center justify-center"
        style={{ padding: "18px 16px", pointerEvents: "auto", gap: showIcon ? 10 : 0 }}
      >
        <button
          data-rcore-pill
          type="button"
          onClick={toggleIcon}
          aria-expanded={showIcon}
          aria-label={t("rcore.icon_aria")}
          title={t("rcore.icon_aria")}
          className="block bg-transparent p-0 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 rounded-full"
          style={{ border: 0, lineHeight: 0 }}
        >
          {/* The operator's exact "R-CORE" wordmark artwork, as-is — no glyph, no text recreation. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={WORDMARK} alt={t("rcore.brand")} style={{ height: H, width: "auto", display: "block" }} />
        </button>
        {/* The single icon: mounted always so it can grow (maximize) and shrink (minimize) the same way; inert while hidden. */}
        <button
          data-rcore-icon
          type="button"
          onClick={openPanel}
          aria-label={t("rcore.open_aria")}
          title={t("rcore.open_aria")}
          aria-hidden={!showIcon}
          tabIndex={showIcon ? 0 : -1}
          className="block bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 rounded-lg"
          style={{
            border: 0, lineHeight: 0, overflow: "hidden",
            height: showIcon ? H : 0, transform: showIcon ? "scale(1)" : "scale(0)", opacity: showIcon ? 1 : 0,
            pointerEvents: showIcon ? "auto" : "none",
            transition: "transform 180ms ease, opacity 180ms ease, height 180ms ease",
          }}
        >
          {/* The operator's exact reticle artwork, as-is. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ICON} alt="R-CORE" style={{ height: H, width: "auto", display: "block" }} />
        </button>
      </div>

      {open && <RCoreRevisionPanel history={history} accent={accent} onClose={close} />}
    </>
  );
}
