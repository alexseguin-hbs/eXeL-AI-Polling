"use client";

/**
 * SoI Trinity — Reusable three-ring component with curved text.
 *
 * Users can create their own Trinity with custom words and colors.
 *
 * Draw order (sacred family narrative):
 *   1. Son (top) — foundation
 *   2. Mother Aset (bottom-right) — nurtures son
 *   3. Father Asar (bottom-left) — protects wife + child
 *   4. Unity ring — encircles all
 *   5. Words — ABSOLUTE LAST (always fully visible)
 *
 * Props:
 *   labels: [top, bottomRight, bottomLeft] — 3 words
 *   color: ring band color (CSS color string)
 *   textColor: word color (default "black")
 *   size: SVG pixel size (default 400)
 *   spread, ringR, ringWidth, gap, outerWidth: geometry overrides
 *   fontSize, letterSpacing, borderWidth, textSpan: text overrides
 */

import { useId } from "react";

export interface SoITrinityProps {
  labels?: [string, string, string];
  colors?: [string, string, string];   // optional per-ring colour [top, bottom-right, bottom-left] — default: monochrome `color`
  color?: string;
  textColor?: string;
  size?: number;
  spread?: number;
  ringR?: number;
  ringWidth?: number;
  gap?: number;
  outerWidth?: number;
  fontSize?: number;
  letterSpacing?: number;
  borderWidth?: number;
  textSpan?: number;
  /** Text radial offset: - inward toward Unity center, + outward toward Unity ring */
  topTextOffset?: number;
  /** Text radial offset for bottom-left (CONNECTION) */
  leftTextOffset?: number;
  /** Text radial offset for bottom-right (HARMONY) */
  rightTextOffset?: number;
  className?: string;
  onClick?: () => void;
}

export function SoITrinity({
  labels = ["WISDOM", "HARMONY", "CONNECTION"],
  colors,
  color = "currentColor",
  textColor = "black",
  size = 400,
  spread = 39,
  ringR = 72,
  ringWidth = 21,
  gap = 21,
  outerWidth = 21,
  fontSize = 11,
  letterSpacing = 2,
  borderWidth = 1.5,
  textSpan = 90,
  topTextOffset = -2,     // - inward, + outward
  leftTextOffset = 2,     // CONNECTION: +2 outward (corrected)
  rightTextOffset = 2,    // HARMONY: +2 outward (corrected)
  className = "",
  onClick,
}: SoITrinityProps) {
  const uid = useId().replace(/:/g, "");

  const cx = 200;
  const cy = 200;
  const outerR = spread + ringR + gap + outerWidth;
  const ringMidR = ringR - ringWidth / 2;
  // Per-ring text radius: ringMidR + offset (- inward toward Unity center, + outward)
  const textRadii = [
    ringMidR + topTextOffset,    // [0] WISDOM (top)
    ringMidR + rightTextOffset,  // [1] HARMONY (bottom-right)
    ringMidR + leftTextOffset,   // [2] CONNECTION (bottom-left)
  ];
  const bgColor = "var(--background, #0a1628)";

  // Ring centers: Son (top), Mother Aset (BR), Father Asar (BL)
  // Three decimals: server and client stringify long floats differently, which React reports
  // as a hydration mismatch on every page that draws the mark (three-phone live run, 2026-09-03).
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const rings = [
    { cx: r3(cx), cy: r3(cy - spread), label: labels[0] },
    { cx: r3(cx + spread * 0.866), cy: r3(cy + spread * 0.5), label: labels[1] },
    { cx: r3(cx - spread * 0.866), cy: r3(cy + spread * 0.5), label: labels[2] },
  ];

  // Text at 0° (12 o'clock), 120° (4 o'clock), 240° (8 o'clock)
  const textAngles = [-90, 30, 150];
  const deg2rad = (d: number) => (d * Math.PI) / 180;

  // Top ring (i=0): clockwise arc — text reads L→R, right-side up at 12 o'clock
  // Bottom rings (i=1,2): counter-clockwise arc — text reads L→R, right-side up at 4/8 o'clock
  // Counter-clockwise flips which side of the arc the text sits on,
  // making letters upright when the arc is on the lower half of a ring.
  function makeTextArc(rcx: number, rcy: number, angle: number, r: number, isBottom: boolean): string {
    const half = textSpan / 2;
    const a1 = angle - half;
    const a2 = angle + half;
    const sx = rcx + r * Math.cos(deg2rad(a1));
    const sy = rcy + r * Math.sin(deg2rad(a1));
    const ex = rcx + r * Math.cos(deg2rad(a2));
    const ey = rcy + r * Math.sin(deg2rad(a2));
    if (isBottom) {
      return `M ${ex.toFixed(1)} ${ey.toFixed(1)} A ${r} ${r} 0 0 0 ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    }
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  function RingBand({ rcx, rcy, clip, ringColor }: { rcx: number; rcy: number; clip?: string; ringColor?: string }) {
    const p = clip ? { clipPath: `url(#${clip})` } : {};
    return (
      <>
        {/* Black band underneath at FULL width; color drawn narrower on top of it.
            The color sits directly on the black, so the black shows as an edge of
            exactly borderWidth on each side with ZERO background pixels between the
            color and its border (verified via resvg render harness). */}
        <circle cx={rcx} cy={rcy} r={ringMidR}
          fill="none" stroke="black" strokeWidth={ringWidth} {...p} />
        <circle cx={rcx} cy={rcy} r={ringMidR}
          fill="none" stroke={ringColor ?? color} strokeWidth={ringWidth - borderWidth * 2} {...p} />
      </>
    );
  }

  const pad = 8;
  const vbSize = (outerR + pad) * 2;
  const vbOffset = cx - outerR - pad;
  const viewBox = `${vbOffset} ${vbOffset} ${vbSize} ${vbSize}`;

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      <defs>
        {rings.map((ring, i) => (
          <path key={`p-${i}`} id={`${uid}-t-${i}`}
            d={makeTextArc(ring.cx, ring.cy, textAngles[i], textRadii[i], i !== 0)}
            fill="none" />
        ))}
      </defs>

      {/* Solid stacked draw order (how a human draws it): top circle first, then
          bottom-right, then bottom-left LAST so it reads as on top. Each band is
          opaque (black border + cyan), so a later ring cleanly covers earlier ones
          at the overlaps and its black border separates them. No masks, no clips
          through the cyan → NO trace lines behind the solid fill. */}
      <RingBand rcx={rings[0].cx} rcy={rings[0].cy} ringColor={colors?.[0]} />
      <RingBand rcx={rings[1].cx} rcy={rings[1].cy} ringColor={colors?.[1]} />
      <RingBand rcx={rings[2].cx} rcy={rings[2].cy} ringColor={colors?.[2]} />

      {/* 4. UNITY ring — black band underneath, color narrower on top (zero seam) */}
      <circle cx={cx} cy={cy} r={outerR - outerWidth / 2}
        fill="none" stroke="black" strokeWidth={outerWidth} />
      <circle cx={cx} cy={cy} r={outerR - outerWidth / 2}
        fill="none" stroke={color} strokeWidth={outerWidth - borderWidth * 2} />

      {/* 5. WORDS — ABSOLUTE LAST */}
      {rings.map((ring, i) => (
        <text key={`t-${i}`} fill={textColor} fontSize={fontSize} fontWeight="bold"
          fontFamily="system-ui, sans-serif" letterSpacing={letterSpacing}>
          <textPath href={`#${uid}-t-${i}`} startOffset="50%" textAnchor="middle">
            {ring.label}
          </textPath>
        </text>
      ))}
    </svg>
  );
}
