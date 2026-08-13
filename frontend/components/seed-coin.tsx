"use client";

import { useState } from "react";

/**
 * SeedCoin — a two-sided Seed token you can flip.
 *
 *  FRONT  a CYAN Seed of Life (7 circles: 1 centre + 6 at 60°, identical
 *         geometry to <SeedOfLifeLogo>) ringed by a LARGER enclosing circle so
 *         the whole mark reads as a struck coin — raised rim, milled edge,
 *         radial metallic-cyan face.
 *  BACK   the operator's clean Alvar cyan raster (ouroboros dragon + Yggdrasil
 *         framing the Texas outline + Lone Star) — /architect/alvar-ai-cyan.png,
 *         the same emblem as White Paper block 33. The whole face links to §ALVAR.
 *
 * Click / Enter / Space flips it. Pure CSS 3D (transform-style: preserve-3d),
 * self-contained, theme-agnostic.
 */

// AI Cyan — the Seed of Life face (operator: cyan, not green).
const CYAN = "#19c8cf";
const CYAN_LT = "#5ee7ec";
const CYAN_DK = "#0b3d40";
const ALVAR_CYAN = "/architect/alvar-ai-cyan.png";
/** The White Paper ALVAR section — the clean Alvar links here (R-Core usage, as block 33). */
const ALVAR_SECTION = "https://exel-ai-polling.explore-096.workers.dev/whitepaper/vision-2525#alvar";

// Seed of Life geometry — matches SeedOfLifeLogo (cx=cy=50, R=20).
const CX = 50, CY = 50, R = 20;
const PETALS = Array.from({ length: 6 }, (_, i) => {
  const a = (i * 60 * Math.PI) / 180;
  return { x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) };
});
// The "milled" edge — short ticks around the rim, the way a coin's edge is knurled.
const MILL = Array.from({ length: 72 }, (_, i) => (i * 360) / 72);

export interface SeedCoinProps {
  size?: number;
  className?: string;
  /** Start showing the Alvar (back) face. */
  defaultFlipped?: boolean;
  /** Notified whenever the coin flips. */
  onFlip?: (flipped: boolean) => void;
  /** Where the Alvar runes link. Defaults to the White Paper ALVAR section (#alvar). */
  alvarHref?: string;
}

export function SeedCoin({ size = 220, className, defaultFlipped = false, onFlip, alvarHref = ALVAR_SECTION }: SeedCoinProps) {
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
        {/* FRONT — CYAN Seed-of-Life coin ──────────────────────────────── */}
        <CoinFace>
          <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true">
            <defs>
              <radialGradient id="seedFace" cx="38%" cy="34%" r="75%">
                <stop offset="0%" stopColor={CYAN_LT} />
                <stop offset="55%" stopColor={CYAN} />
                <stop offset="100%" stopColor={CYAN_DK} />
              </radialGradient>
              <radialGradient id="seedRim" cx="50%" cy="50%" r="50%">
                <stop offset="82%" stopColor={CYAN_DK} stopOpacity="0" />
                <stop offset="90%" stopColor="#072b2e" />
                <stop offset="100%" stopColor="#041a1c" />
              </radialGradient>
            </defs>

            {/* Coin body + raised rim */}
            <circle cx={CX} cy={CY} r={49} fill="url(#seedFace)" />
            <circle cx={CX} cy={CY} r={49} fill="url(#seedRim)" />
            {/* Milled edge */}
            {MILL.map((deg, i) => {
              const a = (deg * Math.PI) / 180;
              const r1 = 46.5, r2 = 49;
              return (
                <line
                  key={i}
                  x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)}
                  x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)}
                  stroke="#072b2e" strokeWidth={0.7} strokeOpacity={0.6}
                />
              );
            })}
            {/* The LARGER enclosing circle around all 7 circles (operator ask) */}
            <circle cx={CX} cy={CY} r={44} fill="none" stroke="#eafff2" strokeOpacity={0.55} strokeWidth={1} />
            <circle cx={CX} cy={CY} r={41} fill="none" stroke="#eafff2" strokeOpacity={0.28} strokeWidth={0.6} />

            {/* Seed of Life — 7 circles, bright on the cyan face */}
            <circle cx={CX} cy={CY} r={R} fill="#ffffff10" stroke="#eafff2" strokeWidth={1.4} strokeOpacity={0.95} />
            {PETALS.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={R} fill="none" stroke="#eafff2" strokeWidth={1.4} strokeOpacity={0.9} />
            ))}

            {/* Struck legend */}
            <text x={CX} y={13} textAnchor="middle" fontSize={5.2} fill="#eafff2" fillOpacity={0.85}
                  fontFamily="ui-monospace, monospace" letterSpacing={0.5}>SEED</text>
            <text x={CX} y={92} textAnchor="middle" fontSize={4.4} fill="#eafff2" fillOpacity={0.75}
                  fontFamily="ui-monospace, monospace" letterSpacing={0.4}>1&frasl;7 HOUR</text>
          </svg>
        </CoinFace>

        {/* BACK — Alvar cyan raster ────────────────────────────────────── */}
        <CoinFace back>
          <div style={{
            position: "relative",
            width: "100%", height: "100%", borderRadius: "50%",
            background: "radial-gradient(circle at 38% 34%, #0b2b2c 0%, #041718 70%, #020c0d 100%)",
            display: "grid", placeItems: "center", overflow: "hidden",
            boxShadow: `inset 0 0 0 2px ${CYAN_DK}, inset 0 0 22px ${CYAN}44`,
          }}>
            {/* The clean Alvar (same emblem as White Paper block 33 — no added
                marks). The whole face is the R-Core link to §ALVAR; stopPropagation
                so tapping it opens the section instead of flipping the coin back. */}
            <a
              href={alvarHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Read the ALVAR section of the White Paper"
              title="ALVAR — read §ALVAR in the White Paper"
              style={{
                position: "absolute", inset: 0, display: "grid", placeItems: "center",
                textDecoration: "none", cursor: "pointer",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ALVAR_CYAN}
                alt="Alvar — ouroboros dragon and tree of life framing the Lone Star (cyan)"
                width={size} height={size}
                style={{ width: "86%", height: "86%", objectFit: "contain", filter: `drop-shadow(0 0 8px ${CYAN}66)` }}
              />
            </a>
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
