"use client";

/**
 * Master of Thought — Eagle emblem with cuneiform text arcing
 * between the inner and outer circle radii.
 *
 * Clock-face cuneiform positions (outer ring):
 *   12 o'clock:  Humanity's Universal Challenge — 𒇽𒈨𒅗𒋧𒍠
 *   2–3 o'clock: Emerald Tablets — 𒁾𒄀𒈾𒈾
 *   4–5 o'clock: Book of Thoth — 𒁾𒅗𒋾
 *   6–8 o'clock: Flower of Life — 𒄑𒌑𒀭𒍣
 *   9–10 o'clock: Divinity Guide — 𒂗𒀭𒁺
 *
 * Inner (above eagle): Master of Thought — 𒂗𒊕𒆠
 */

import { useId } from "react";

interface CuneiformArc {
  label: string;       // English tooltip
  cuneiform: string;   // Cuneiform glyphs
  startAngle: number;  // degrees (0 = 3 o'clock, -90 = 12 o'clock)
  span: number;        // arc span in degrees
  clockwise: boolean;  // text direction
  radius: number;      // radius for text path (between inner & outer circle)
}

export interface MasterOfThoughtProps {
  size?: number;
  className?: string;
}

export function MasterOfThought({ size = 320, className = "" }: MasterOfThoughtProps) {
  const uid = useId().replace(/:/g, "");

  const cx = 200;
  const cy = 200;

  // Radii matching the eagle emblem's circle structure
  const outerR = 175;  // outer rope border
  const innerR = 140;  // inner circle
  const textR = 157;   // midpoint of the gap for outer cuneiform
  const innerTextR = 105; // inside, above the eagle head

  const outerArcs: CuneiformArc[] = [
    {
      label: "Humanity's Universal Challenge",
      cuneiform: "𒇽 𒈨 𒅗 𒋧 𒍠",
      startAngle: -90,  // 12 o'clock
      span: 50,
      clockwise: true,
      radius: textR,
    },
    {
      label: "Emerald Tablets",
      cuneiform: "𒁾 𒄀 𒈾 𒈾",
      startAngle: 30,   // 2–3 o'clock
      span: 40,
      clockwise: true,
      radius: textR,
    },
    {
      label: "Book of Thoth",
      cuneiform: "𒁾 𒅗 𒋾",
      startAngle: 105,  // 4–5 o'clock
      span: 40,
      clockwise: false,
      radius: textR,
    },
    {
      label: "Flower of Life",
      cuneiform: "𒄑 𒌑 𒀭 𒍣",
      startAngle: 190,  // 6–8 o'clock
      span: 50,
      clockwise: false,
      radius: textR,
    },
    {
      label: "Divinity Guide",
      cuneiform: "𒂗 𒀭 𒁺",
      startAngle: 260,  // 9–10 o'clock
      span: 40,
      clockwise: false,
      radius: textR,
    },
  ];

  const innerArc: CuneiformArc = {
    label: "Master of Thought",
    cuneiform: "𒂗 𒊕 𒆠",
    startAngle: -90,  // top of inner circle
    span: 60,
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
    // Counter-clockwise: swap start/end so text reads correctly
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

      {/* Outer cuneiform text */}
      {outerArcs.map((arc, i) => (
        <text key={`t-${i}`} fill="gold" fontSize={18} fontWeight="bold"
          fontFamily="serif" letterSpacing={6} opacity={0.9}>
          <title>{arc.label}</title>
          <textPath href={`#${uid}-arc-${i}`} startOffset="50%" textAnchor="middle">
            {arc.cuneiform}
          </textPath>
        </text>
      ))}

      {/* Inner cuneiform — "Master of Thought" above eagle */}
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
