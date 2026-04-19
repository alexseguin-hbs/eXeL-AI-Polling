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
  /** Tint color applied to both the eagle emblem and the cuneiform glyphs.
   *  When undefined, renders with default palette (white emblem + gold cuneiform). */
  color?: string;
}

export function MasterOfThought({ size = 320, className = "", color }: MasterOfThoughtProps) {
  const uid = useId().replace(/:/g, "");
  const tintId = `${uid}-tint`;
  // When emblem is white (initial state), cuneiform stays gold for readability
  // + aesthetic. All other tint colors propagate through to the cuneiform.
  const isWhiteTint = color === "#FFFFFF" || color?.toLowerCase?.() === "white";
  const textFill = !color || isWhiteTint ? "gold" : color;

  const cx = 200;
  const cy = 200;

  // Radii calibrated via radial pixel scan of master-of-thought-bw.png
  // (measured distance from center of coin, normalized to 400×400 viewBox):
  //   Outer rope border edge: ~152   Rope inner edge: ~115
  //   Inner smooth circle edge: ~85  Eagle head top: ~50
  //   Rope mid-line (target visual center for all 5 outer arcs): ~123
  //
  // textPath glyph extension direction:
  //   clockwise: true  → glyphs extend OUTWARD (visual center = baseline + fontSize/2)
  //   clockwise: false → glyphs extend INWARD  (visual center = baseline − fontSize/2)
  // Baseline radius is calculated so the glyph visual center lands at r≈123 on every arc.
  const innerTextR = 65;   // inner cuneiform — tighter arc, sits in the gap between wing tips (~y=125) and top of head (~y=150); text center lands at y=135

  // Divinity Guide + Book of Thoth are LOCKED at r=130 (user-confirmed).
  // The other 3 outer arcs + inner arc use per-arc radii per user iterations.
  const outerArcs: CuneiformArc[] = [
    {
      label: "Humanity's Universal Challenge",
      cuneiform: "𒇽  𒈨 𒅗   𒋧  𒍠",
      startAngle: -90,    // 12 o'clock — top center
      span: 72,
      clockwise: true,
      radius: 123,        // +3px (120 → 123) to center glyphs between rope inner + outer edges
      fontSize: 14,
    },
    {
      label: "Divinity Guide",
      cuneiform: "𒂗 𒀭 𒁺",
      startAngle: 197,    // user 287° = SVG 197° (+2° CW toward 12 o'clock; mirrors Book of Thoth)
      span: 32,
      clockwise: false,
      radius: 130,
      fontSize: 14,
    },
    {
      label: "Book of Thoth",
      cuneiform: "𒁾  𒅗  𒋾",
      startAngle: -17,    // user 73° = SVG -17° (-2° CCW toward 12 o'clock; mirrors Divinity Guide)
      span: 40,
      clockwise: true,
      radius: 123,        // -4px (127 → 123) per user
      fontSize: 14,
    },
    {
      label: "Flower of Life",
      cuneiform: "𒄑 𒌑 𒀭 𒍣",
      startAngle: 132,    // user 222° (unchanged — 'start position is good')
      span: 48,
      clockwise: false,
      radius: 113,        // pulled back from 120: baseline now 2px inside rope inner edge (115);
                          // glyph tops at r=99 → 14px clear of inner smooth circle (85). Sits on bullet ring.
      fontSize: 14,
    },
    {
      label: "Emerald Tablets",
      cuneiform: "𒁾  𒄀  𒈾 𒈾",
      startAngle: 46,     // user 136° (unchanged — 'same position')
      span: 60,
      clockwise: false,
      radius: 113,        // mirror of Flower of Life (was 118, pulled back 5px off rope inner edge)
      fontSize: 14,
    },
  ];

  const innerArc: CuneiformArc = {
    label: "Master of Thought",
    cuneiform: "𒂗 𒊕  𒆠",
    startAngle: -90,     // top of inner area — centered above eagle head
    span: 50,            // slightly wider to fit 3 glyphs at the tighter r=65
    clockwise: true,
    radius: innerTextR,
    fontSize: 14,
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
        {color && (
          <filter id={tintId}>
            <feFlood floodColor={color} result="flood" />
            <feComposite in="flood" in2="SourceGraphic" operator="in" />
          </filter>
        )}
        {allArcs.map((arc, i) => (
          <path key={`def-${i}`} id={`${uid}-arc-${i}`} d={makeArc(arc)} fill="none" />
        ))}
      </defs>

      {/* Eagle emblem image */}
      <image
        href="/book-images/master-of-thought.png"
        x="0" y="0" width="400" height="400"
        preserveAspectRatio="xMidYMid meet"
        filter={color ? `url(#${tintId})` : undefined}
      />

      {/* Outer cuneiform text — between bullet dots */}
      {outerArcs.map((arc, i) => (
        <text key={`t-${i}`} fill={textFill} fontSize={arc.fontSize ?? defaultFontSize} fontWeight="bold"
          fontFamily="serif" letterSpacing={4} opacity={0.9}>
          <title>{arc.label}</title>
          <textPath href={`#${uid}-arc-${i}`} startOffset="50%" textAnchor="middle">
            {arc.cuneiform}
          </textPath>
        </text>
      ))}

      {/* Inner cuneiform — "Master of Thought" above eagle head */}
      <text fill={textFill} fontSize={innerArc.fontSize ?? defaultFontSize} fontWeight="bold"
        fontFamily="serif" letterSpacing={2} opacity={0.85}>
        <title>{innerArc.label}</title>
        <textPath href={`#${uid}-arc-${allArcs.length - 1}`} startOffset="50%" textAnchor="middle">
          {innerArc.cuneiform}
        </textPath>
      </text>
    </svg>
  );
}
