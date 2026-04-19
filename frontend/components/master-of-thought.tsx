"use client";

/**
 * Master of Thought — Eagle emblem with Sumerian cuneiform text
 * arcing in the gap between the inner circle and outer rope border.
 *
 * Clock-face positions (between bullet dots on the emblem):
 *   12 o'clock (top center):       Humanity's Universal Challenge — 𒇽  𒈨 𒅗  𒋧  𒍠
 *   10–11 o'clock (top left):      Divinity Guide — 𒂗 𒀭 𒁺
 *   1–2 o'clock (upper right):     Book of Thoth — 𒁾  𒅗  𒋾
 *   7–8 o'clock (bottom left):     Flower of Life — 𒄑 𒌑 𒀭 𒍣
 *   4–5 o'clock (bottom right):    Emerald Tablets — 𒁾  𒄀  𒈾 𒈾
 *
 * Inner (above eagle head): Master of Thought — 𒂗 𒊕  𒆠
 */

import { useId } from "react";

interface CuneiformArc {
  label: string;
  cuneiform: string;
  startAngle: number;  // degrees (0 = 3 o'clock, -90 = 12 o'clock)
  span: number;
  clockwise: boolean;
  radius: number;
  fontSize?: number;
}

export interface MasterOfThoughtProps {
  size?: number;
  className?: string;
}

export function MasterOfThought({ size = 320, className = "" }: MasterOfThoughtProps) {
  const uid = useId().replace(/:/g, "");

  const cx = 200;
  const cy = 200;

  // Radii calibrated to the eagle emblem PNG (400×400 viewBox):
  // Outer rope border edge: ~188    Inner rope edge: ~172
  // Inner smooth circle:    ~152    Eagle head top: ~115
  // Gap midpoint for outer cuneiform: ~162
  const textR = 162;       // outer cuneiform — centered in gap between circles
  const innerTextR = 118;  // inner cuneiform — above eagle head, below inner circle

  const outerArcs: CuneiformArc[] = [
    {
      label: "Humanity's Universal Challenge",
      cuneiform: "𒇽  𒈨 𒅗  𒋧  𒍠",
      startAngle: -90,    // 12 o'clock — top center
      span: 60,
      clockwise: true,
      radius: textR,
      fontSize: 13,
    },
    {
      label: "Divinity Guide",
      cuneiform: "𒂗 𒀭 𒁺",
      startAngle: -148,   // ~10–11 o'clock — top left between bullets
      span: 32,
      clockwise: false,
      radius: textR,
    },
    {
      label: "Book of Thoth",
      cuneiform: "𒁾  𒅗  𒋾",
      startAngle: -32,    // ~1–2 o'clock — upper right between bullets
      span: 32,
      clockwise: true,
      radius: textR,
    },
    {
      label: "Flower of Life",
      cuneiform: "𒄑 𒌑 𒀭 𒍣",
      startAngle: 212,    // ~7–8 o'clock — bottom left between bullets
      span: 42,
      clockwise: false,
      radius: textR,
    },
    {
      label: "Emerald Tablets",
      cuneiform: "𒁾  𒄀  𒈾 𒈾",
      startAngle: 128,    // ~4–5 o'clock — bottom right between bullets
      span: 42,
      clockwise: false,
      radius: textR,
    },
  ];

  const innerArc: CuneiformArc = {
    label: "Master of Thought",
    cuneiform: "𒂗 𒊕  𒆠",
    startAngle: -90,     // top of inner area — above eagle head
    span: 45,
    clockwise: true,
    radius: innerTextR,
    fontSize: 13,
  };

  const deg2rad = (d: number) => (d * Math.PI) / 180;

  function makeArc(arc: CuneiformArc): string {
    const half = arc.span / 2;
    const a1 = arc.startAngle - half;
    const a2 = arc.startAngle + half;
    const r = arc.radius;
    const sx = cx + r * Math.cos(deg2rad(a1));
    const sy = cy + r * Math.sin(deg2rad(a1));
    const ex = cx + r * Math.cos(deg2rad(a2));
    const ey = cy + r * Math.sin(deg2rad(a2));

    if (arc.clockwise) {
      return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r} ${r} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
    }
    return `M ${ex.toFixed(1)} ${ey.toFixed(1)} A ${r} ${r} 0 0 0 ${sx.toFixed(1)} ${sy.toFixed(1)}`;
  }

  const allArcs = [...outerArcs, innerArc];
  const defaultFontSize = 14;

  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Master of Thought — Eagle emblem with Sumerian cuneiform"
    >
      <defs>
        {allArcs.map((arc, i) => (
          <path key={`def-${i}`} id={`${uid}-arc-${i}`} d={makeArc(arc)} fill="none" />
        ))}
      </defs>

      {/* Eagle emblem image */}
      <image
        href="/book-images/master-of-thought.png"
        x="0" y="0" width="400" height="400"
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Outer cuneiform text — between bullet dots */}
      {outerArcs.map((arc, i) => (
        <text key={`t-${i}`} fill="gold" fontSize={arc.fontSize ?? defaultFontSize} fontWeight="bold"
          fontFamily="serif" letterSpacing={4} opacity={0.9}>
          <title>{arc.label}</title>
          <textPath href={`#${uid}-arc-${i}`} startOffset="50%" textAnchor="middle">
            {arc.cuneiform}
          </textPath>
        </text>
      ))}

      {/* Inner cuneiform — "Master of Thought" above eagle head */}
      <text fill="gold" fontSize={innerArc.fontSize ?? defaultFontSize} fontWeight="bold"
        fontFamily="serif" letterSpacing={6} opacity={0.85}>
        <title>{innerArc.label}</title>
        <textPath href={`#${uid}-arc-${allArcs.length - 1}`} startOffset="50%" textAnchor="middle">
          {innerArc.cuneiform}
        </textPath>
      </text>
    </svg>
  );
}
