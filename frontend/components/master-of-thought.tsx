"use client";

/**
 * Master of Thought — Eagle emblem with Sumerian cuneiform text
 * arcing between the inner and outer circle radii.
 *
 * Clock-face positions (between bullet dots on the emblem):
 *   12 o'clock (top center):       Humanity's Universal Challenge — 𒇽 𒈨 𒅗 𒋧 𒍠
 *   10–11 o'clock (top left):      Divinity Guide — 𒂗 𒀭 𒁺
 *   1–2 o'clock (upper right):     Book of Thoth — 𒁾 𒅗 𒋾
 *   7–8 o'clock (bottom left):     Flower of Life — 𒄑 𒌑 𒀭 𒍣
 *   4–5 o'clock (bottom right):    Emerald Tablets — 𒁾 𒄀 𒈾 𒈾
 *
 * Inner (above eagle head): Master of Thought — 𒂗 𒊕 𒆠
 */

import { useId } from "react";

interface CuneiformArc {
  label: string;
  cuneiform: string;
  startAngle: number;  // degrees (0 = 3 o'clock, -90 = 12 o'clock)
  span: number;
  clockwise: boolean;
  radius: number;
}

export interface MasterOfThoughtProps {
  size?: number;
  className?: string;
}

export function MasterOfThought({ size = 320, className = "" }: MasterOfThoughtProps) {
  const uid = useId().replace(/:/g, "");

  const cx = 200;
  const cy = 200;

  // Radii matching the eagle emblem's circle gaps
  const textR = 157;     // midpoint between inner circle and outer rope border
  const innerTextR = 105; // inside, above the eagle head

  const outerArcs: CuneiformArc[] = [
    {
      label: "Humanity's Universal Challenge",
      cuneiform: "𒇽  𒈨  𒅗  𒋧  𒍠",
      startAngle: -90,   // 12 o'clock — top center
      span: 55,
      clockwise: true,
      radius: textR,
    },
    {
      label: "Divinity Guide",
      cuneiform: "𒂗 𒀭 𒁺",
      startAngle: -145,   // ~10–11 o'clock — top left between bullets
      span: 35,
      clockwise: false,
      radius: textR,
    },
    {
      label: "Book of Thoth",
      cuneiform: "𒁾 𒅗 𒋾",
      startAngle: -35,    // ~1–2 o'clock — upper right between bullets
      span: 35,
      clockwise: true,
      radius: textR,
    },
    {
      label: "Flower of Life",
      cuneiform: "𒄑 𒌑 𒀭 𒍣",
      startAngle: 215,    // ~7–8 o'clock — bottom left between bullets
      span: 45,
      clockwise: false,
      radius: textR,
    },
    {
      label: "Emerald Tablets",
      cuneiform: "𒁾  𒄀  𒈾  𒈾",
      startAngle: 125,    // ~4–5 o'clock — bottom right between bullets
      span: 45,
      clockwise: false,
      radius: textR,
    },
  ];

  const innerArc: CuneiformArc = {
    label: "Master of Thought",
    cuneiform: "𒂗 𒊕 𒆠",
    startAngle: -90,    // top of inner circle — above eagle head
    span: 50,
    clockwise: true,
    radius: innerTextR,
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
    // Counter-clockwise: swap start/end so text reads L→R upright
    return `M ${ex.toFixed(1)} ${ey.toFixed(1)} A ${r} ${r} 0 0 0 ${sx.toFixed(1)} ${sy.toFixed(1)}`;
  }

  const allArcs = [...outerArcs, innerArc];

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
        <text key={`t-${i}`} fill="gold" fontSize={18} fontWeight="bold"
          fontFamily="serif" letterSpacing={6} opacity={0.9}>
          <title>{arc.label}</title>
          <textPath href={`#${uid}-arc-${i}`} startOffset="50%" textAnchor="middle">
            {arc.cuneiform}
          </textPath>
        </text>
      ))}

      {/* Inner cuneiform — "Master of Thought" above eagle head */}
      <text fill="gold" fontSize={16} fontWeight="bold"
        fontFamily="serif" letterSpacing={8} opacity={0.85}>
        <title>{innerArc.label}</title>
        <textPath href={`#${uid}-arc-${allArcs.length - 1}`} startOffset="50%" textAnchor="middle">
          {innerArc.cuneiform}
        </textPath>
      </text>
    </svg>
  );
}
