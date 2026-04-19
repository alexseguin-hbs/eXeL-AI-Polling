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

export interface CuneiformArc {
  label: string;
  cuneiform: string;
  /** SVG angle convention: 0° = 3 o'clock, -90° = 12 o'clock (top). */
  startAngle: number;
  span: number;
  clockwise: boolean;
  radius: number;
  fontSize?: number;
}

export const DEFAULT_OUTER_ARCS: CuneiformArc[] = [
  {
    label: "Humanity's Universal Challenge",
    cuneiform: "𒇽  𒈨 𒅗   𒋧  𒍠",
    startAngle: -90,    // 12 o'clock — top center
    span: 72,
    clockwise: true,
    radius: 123,
    fontSize: 14,
  },
  {
    label: "Divinity Guide",
    cuneiform: "𒂗 𒀭 𒁺",
    startAngle: 197,    // user 287°
    span: 32,
    clockwise: true,    // CW so text flows CCW→CW around coin (left-center → top → right-top) reading L→R upright
    radius: 116,        // 130 → 116 to match Book of Thoth; CW-outward now puts visual center at r+7=123 (was r-7=123 under CCW)
    fontSize: 14,
  },
  {
    label: "Book of Thoth",
    cuneiform: "𒁾  𒅗  𒋾",
    startAngle: -17,    // user 73°
    span: 40,
    clockwise: true,
    radius: 116,
    fontSize: 14,
  },
  {
    label: "Flower of Life",
    cuneiform: "𒄑 𒌑 𒀭 𒍣",
    startAngle: 132,    // user 222°
    span: 48,
    clockwise: false,
    radius: 113,
    fontSize: 14,
  },
  {
    label: "Emerald Tablets",
    cuneiform: "𒁾  𒄀  𒈾 𒈾",
    startAngle: 46,     // user 136°
    span: 60,
    clockwise: false,
    radius: 117,
    fontSize: 14,
  },
];

export const DEFAULT_INNER_ARC: CuneiformArc = {
  label: "Master of Thought",
  cuneiform: "𒂗 𒊕  𒆠",
  startAngle: -90,
  span: 50,
  clockwise: true,
  radius: 68,
  fontSize: 13,
};

export interface MasterOfThoughtProps {
  size?: number;
  className?: string;
  /** Tint color applied to both the eagle emblem and the cuneiform glyphs.
   *  When undefined, renders with default palette (white emblem + gold cuneiform). */
  color?: string;
  /** Optional override for the 5 outer arcs (used by the edit panel). */
  outerArcs?: CuneiformArc[];
  /** Optional override for the inner "Master of Thought" arc. */
  innerArc?: CuneiformArc;
  /** Index of the selected arc (0–4 for outer, 5 for inner). null = none. */
  selectedIndex?: number | null;
  /** Invoked when an arc is clicked in edit mode. */
  onSelectArc?: (index: number | null) => void;
  /** Render a small center crosshair + alignment rings (for edit mode). */
  showGuides?: boolean;
}

export function MasterOfThought({
  size = 320,
  className = "",
  color,
  outerArcs: outerArcsProp,
  innerArc: innerArcProp,
  selectedIndex = null,
  onSelectArc,
  showGuides = false,
}: MasterOfThoughtProps) {
  const uid = useId().replace(/:/g, "");
  const tintId = `${uid}-tint`;
  // When emblem is white (initial state), cuneiform stays gold for readability
  // + aesthetic. All other tint colors propagate through to the cuneiform.
  const isWhiteTint = color === "#FFFFFF" || color?.toLowerCase?.() === "white";
  const textFill = !color || isWhiteTint ? "gold" : color;

  const cx = 200;
  const cy = 200;

  const outerArcs = outerArcsProp ?? DEFAULT_OUTER_ARCS;
  const innerArc = innerArcProp ?? DEFAULT_INNER_ARC;

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
  const interactive = typeof onSelectArc === "function";

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

      {/* Edit-mode guides: center crosshair + reference rings (inner circle + rope) */}
      {showGuides && (
        <g pointerEvents="none">
          <circle cx={cx} cy={cy} r={85} fill="none" stroke="#00e0ff" strokeWidth={0.5} strokeDasharray="2 3" opacity={0.55} />
          <circle cx={cx} cy={cy} r={115} fill="none" stroke="#ff7a00" strokeWidth={0.5} strokeDasharray="2 3" opacity={0.55} />
          <circle cx={cx} cy={cy} r={152} fill="none" stroke="#ff7a00" strokeWidth={0.5} strokeDasharray="2 3" opacity={0.55} />
          <line x1={cx - 10} y1={cy} x2={cx + 10} y2={cy} stroke="#00e0ff" strokeWidth={0.8} />
          <line x1={cx} y1={cy - 10} x2={cx} y2={cy + 10} stroke="#00e0ff" strokeWidth={0.8} />
          <circle cx={cx} cy={cy} r={2} fill="#00e0ff" />
          {/* Visualize the arc baselines in edit mode */}
          {allArcs.map((arc, i) => {
            const isSel = i === selectedIndex;
            return (
              <path
                key={`guide-${i}`}
                d={makeArc(arc)}
                fill="none"
                stroke={isSel ? "#00ff88" : "#00e0ff"}
                strokeWidth={isSel ? 1.2 : 0.6}
                strokeDasharray="3 2"
                opacity={isSel ? 0.95 : 0.5}
              />
            );
          })}
        </g>
      )}

      {/* Outer cuneiform text — between bullet dots */}
      {outerArcs.map((arc, i) => {
        const isSel = selectedIndex === i;
        return (
          <text
            key={`t-${i}`}
            fill={isSel && interactive ? "#00ff88" : textFill}
            fontSize={arc.fontSize ?? defaultFontSize}
            fontWeight="bold"
            fontFamily="serif"
            letterSpacing={4}
            opacity={0.9}
            onClick={interactive ? () => onSelectArc!(i) : undefined}
            style={interactive ? { cursor: "pointer" } : undefined}
          >
            <title>{arc.label}</title>
            <textPath href={`#${uid}-arc-${i}`} startOffset="50%" textAnchor="middle">
              {arc.cuneiform}
            </textPath>
          </text>
        );
      })}

      {/* Inner cuneiform — "Master of Thought" above eagle head */}
      <text
        fill={selectedIndex === outerArcs.length && interactive ? "#00ff88" : textFill}
        fontSize={innerArc.fontSize ?? defaultFontSize}
        fontWeight="bold"
        fontFamily="serif"
        letterSpacing={2}
        opacity={0.85}
        onClick={interactive ? () => onSelectArc!(outerArcs.length) : undefined}
        style={interactive ? { cursor: "pointer" } : undefined}
      >
        <title>{innerArc.label}</title>
        <textPath href={`#${uid}-arc-${allArcs.length - 1}`} startOffset="50%" textAnchor="middle">
          {innerArc.cuneiform}
        </textPath>
      </text>
    </svg>
  );
}
