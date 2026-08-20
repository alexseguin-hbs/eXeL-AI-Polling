"use client";

import { useState } from "react";
import { SeedOfLifeLogo } from "./seed-of-life-logo";

/**
 * SeedCoin — a two-sided Seed token you can flip.
 *
 *  FRONT  the site's own Seed of Life (<SeedOfLifeLogo>, the exact mark from
 *         /main and /vision-2525 — thin translucent cyan strokes on a dark
 *         ground) with a circle drawn around it and a little spacing, the way
 *         the Trinity logo rings its inner marks (operator, 2026-08-13).
 *  BACK   the operator's clean Alvar cyan raster — /architect/alvar-ai-cyan.png,
 *         the same emblem as White Paper block 33. The whole face links to §ALVAR.
 *
 * Click / Enter / Space flips it. Pure CSS 3D (transform-style: preserve-3d),
 * self-contained, theme-agnostic.
 */

const CYAN = "#19c8cf";
const CYAN_DK = "#0b3d40";
// The EXACT Alvar image from White Paper block 33 (operator) — extracted from the
// living document's front.alvar block, not the larger /architect raster.
const ALVAR_CYAN = "/architect/alvar-block33.png";

export interface SeedCoinProps {
  size?: number;
  className?: string;
  /** Start showing the Alvar (back) face. */
  defaultFlipped?: boolean;
  /** Notified whenever the coin flips. */
  onFlip?: (flipped: boolean) => void;
}

export function SeedCoin({ size = 220, className, defaultFlipped = false, onFlip }: SeedCoinProps) {
  const [flipped, setFlipped] = useState(defaultFlipped);
  const toggle = () => {
    const next = !flipped;
    setFlipped(next);
    onFlip?.(next);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={flipped ? "Seed token — Alvar face. Flip to the Seed of Life." : "Seed token — Seed of Life face. Flip to the Alvar."}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
      }}
      className={className}
      style={{
        width: size, height: size, perspective: size * 4,
        cursor: "pointer", display: "inline-block", userSelect: "none",
      }}
    >
      <div
        style={{
          position: "relative", width: "100%", height: "100%",
          transformStyle: "preserve-3d",
          transition: "transform 0.7s cubic-bezier(0.4, 0.2, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* FRONT — the site's Seed of Life, ringed by a circle with a gap ──── */}
        <CoinFace>
          <div style={{
            position: "relative",
            width: "100%", height: "100%", borderRadius: "50%",
            background: "radial-gradient(circle at 42% 34%, #17223400 0%, #0d152400 70%, #0a112000 100%)",
            backgroundColor: "#0e1727",
            display: "grid", placeItems: "center", overflow: "hidden",
            boxShadow: `inset 0 0 22px ${CYAN}18`,
          }}>
            {/* The exact site mark — thin translucent cyan strokes on dark. Sized
                to nearly fill so the ring sits just outside it (little spacing). */}
            <SeedOfLifeLogo accentColor={CYAN} size={size * 0.9} />
            {/* The circle drawn around it, with a little spacing (Trinity-style). */}
            <svg viewBox="0 0 100 100" aria-hidden="true"
                 style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
              <circle cx="50" cy="50" r="47" fill="none" stroke={CYAN} strokeWidth="1.1" strokeOpacity="0.7" />
            </svg>
          </div>
        </CoinFace>

        {/* BACK — clean Alvar cyan raster (same as White Paper block 33) ───── */}
        <CoinFace back>
          <div style={{
            position: "relative",
            width: "100%", height: "100%", borderRadius: "50%",
            background: "radial-gradient(circle at 38% 34%, #0b2b2c 0%, #041718 70%, #020c0d 100%)",
            display: "grid", placeItems: "center", overflow: "hidden",
            boxShadow: `inset 0 0 0 2px ${CYAN_DK}, inset 0 0 22px ${CYAN}44`,
          }}>
            {/* The clean Alvar (same emblem as White Paper block 33 — no added
                marks). Tapping the Alvar face flips the coin back to the Seed of
                Life; it does NOT navigate to the White Paper (operator). */}
            <div
              aria-label="Alvar face — tap to flip back to the Seed of Life"
              style={{
                position: "absolute", inset: 0, display: "grid", placeItems: "center",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ALVAR_CYAN}
                alt="Alvar — ouroboros dragon and tree of life framing the Lone Star (cyan)"
                width={size} height={size}
                style={{ width: "86%", height: "86%", objectFit: "contain", filter: `drop-shadow(0 0 8px ${CYAN}66)` }}
              />
            </div>
          </div>
        </CoinFace>
      </div>
    </div>
  );
}

/** One face of the coin — absolutely positioned, back-face hidden, back pre-rotated. */
function CoinFace({ children, back = false }: { children: React.ReactNode; back?: boolean }) {
  return (
    <div
      style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden",
        transform: back ? "rotateY(180deg)" : undefined,
        borderRadius: "50%",
        boxShadow: "0 8px 24px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.25)",
      }}
    >
      {children}
    </div>
  );
}
