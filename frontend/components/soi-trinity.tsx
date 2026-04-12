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
  className?: string;
  onClick?: () => void;
}

export function SoITrinity({
  labels = ["WISDOM", "HARMONY", "CONNECTION"],
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
  className = "",
  onClick,
}: SoITrinityProps) {
  const uid = useId().replace(/:/g, "");

  const cx = 200;
  const cy = 200;
  const outerR = spread + ringR + gap + outerWidth;
  const ringMidR = ringR - ringWidth / 2;
  const ringInnerR = ringR - ringWidth;
  const textR = ringMidR - 2; // 2px inward from band center — sits between inner + outer borders
  const bgColor = "var(--background, #0a1628)";

  // Ring centers: Son (top), Mother Aset (BR), Father Asar (BL)
  const rings = [
    { cx: cx, cy: cy - spread, label: labels[0] },
    { cx: cx + spread * 0.866, cy: cy + spread * 0.5, label: labels[1] },
    { cx: cx - spread * 0.866, cy: cy + spread * 0.5, label: labels[2] },
  ];

  // Text at 0° (12 o'clock), 120° (4 o'clock), 240° (8 o'clock)
  const textAngles = [-90, 30, 150];
  const deg2rad = (d: number) => (d * Math.PI) / 180;

  // Top ring (i=0): clockwise arc — text reads L→R, right-side up at 12 o'clock
  // Bottom rings (i=1,2): counter-clockwise arc — text reads L→R, right-side up at 4/8 o'clock
  // Counter-clockwise flips which side of the arc the text sits on,
  // making letters upright when the arc is on the lower half of a ring.
  function makeTextArc(rcx: number, rcy: number, angle: number, isBottom: boolean): string {
    const half = textSpan / 2;
    const a1 = angle - half;
    const a2 = angle + half;
    const sx = rcx + textR * Math.cos(deg2rad(a1));
    const sy = rcy + textR * Math.sin(deg2rad(a1));
    const ex = rcx + textR * Math.cos(deg2rad(a2));
    const ey = rcy + textR * Math.sin(deg2rad(a2));
    if (isBottom) {
      // Counter-clockwise: swap start/end, sweep=0 — text right-side up on bottom arcs
      return `M ${ex.toFixed(1)} ${ey.toFixed(1)} A ${textR} ${textR} 0 0 0 ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    }
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${textR} ${textR} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  function RingBand({ rcx, rcy, clip }: { rcx: number; rcy: number; clip?: string }) {
    const p = clip ? { clipPath: `url(#${clip})` } : {};
    return (
      <>
        <circle cx={rcx} cy={rcy} r={ringMidR}
          fill="none" stroke={color} strokeWidth={ringWidth - borderWidth * 2} {...p} />
        <circle cx={rcx} cy={rcy} r={ringR}
          fill="none" stroke="black" strokeWidth={borderWidth} {...p} />
        <circle cx={rcx} cy={rcy} r={ringInnerR}
          fill="none" stroke="black" strokeWidth={borderWidth} {...p} />
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
            d={makeTextArc(ring.cx, ring.cy, textAngles[i], i !== 0)}
            fill="none" />
        ))}
      </defs>

      {/* 1. SON (top) */}
      <RingBand rcx={rings[0].cx} rcy={rings[0].cy} />

      {/* 2. MOTHER ASET (BR) — over Son */}
      <clipPath id={`${uid}-ms`}>
        <circle cx={rings[1].cx} cy={rings[1].cy} r={ringR + 2} />
      </clipPath>
      <circle cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
        fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
        clipPath={`url(#${uid}-ms)`} />
      <RingBand rcx={rings[1].cx} rcy={rings[1].cy} clip={`${uid}-ms`} />
      <RingBand rcx={rings[1].cx} rcy={rings[1].cy} />

      {/* 3. FATHER ASAR (BL) — over both */}
      <clipPath id={`${uid}-fm`}>
        <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR + 2} />
      </clipPath>
      <circle cx={rings[1].cx} cy={rings[1].cy} r={ringMidR}
        fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
        clipPath={`url(#${uid}-fm)`} />
      <RingBand rcx={rings[2].cx} rcy={rings[2].cy} clip={`${uid}-fm`} />
      <clipPath id={`${uid}-fs`}>
        <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR + 2} />
      </clipPath>
      <circle cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
        fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
        clipPath={`url(#${uid}-fs)`} />
      <RingBand rcx={rings[2].cx} rcy={rings[2].cy} clip={`${uid}-fs`} />
      <RingBand rcx={rings[2].cx} rcy={rings[2].cy} />

      {/* 4. UNITY ring */}
      <circle cx={cx} cy={cy} r={outerR - outerWidth / 2}
        fill="none" stroke={color} strokeWidth={outerWidth - borderWidth * 2} />
      <circle cx={cx} cy={cy} r={outerR}
        fill="none" stroke="black" strokeWidth={borderWidth} />
      <circle cx={cx} cy={cy} r={outerR - outerWidth}
        fill="none" stroke="black" strokeWidth={borderWidth} />

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
