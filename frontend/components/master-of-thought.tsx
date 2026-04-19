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

export const DEFAULT_CENTER = { cx: 201, cy: 189 };

/** Vertical-stretch factor for the eagle emblem PNG. 1.0 = no stretch;
 *  1.05 = 5% taller. Content extends 2.5% above and 2.5% below the 400×400
 *  viewBox and is clipped at both edges. The PNG file itself stays 1024×1024. */
export const DEFAULT_VERTICAL_STRETCH = 1.05;

export const DEFAULT_OUTER_ARCS: CuneiformArc[] = [
  {
    label: "Humanity's Universal Challenge",
    cuneiform: "𒇽  𒈨 𒅗   𒋧  𒍠",
    startAngle: -90,    // user 0° — 12 o'clock, top center
    span: 91,
    clockwise: true,
    radius: 120,
    fontSize: 16,
  },
  {
    label: "Divinity Guide",
    cuneiform: "𒂗 𒀭 𒁺",
    startAngle: 194,    // user 284° (≡ SVG -166)
    span: 54,
    clockwise: true,
    radius: 118,
    fontSize: 16,
  },
  {
    label: "Book of Thoth",
    cuneiform: "𒁾  𒅗  𒋾",
    startAngle: -13,    // user 77°
    span: 54,
    clockwise: true,
    radius: 116,
    fontSize: 16,
  },
  {
    label: "Flower of Life",
    cuneiform: "𒄑 𒌑 𒀭 𒍣",
    startAngle: 128,    // user 218°
    span: 72,
    clockwise: false,
    radius: 127,
    fontSize: 16,
  },
  {
    label: "Emerald Tablets",
    cuneiform: "𒁾  𒄀  𒈾 𒈾",
    startAngle: 53,     // user 143°
    span: 72,
    clockwise: false,
    radius: 129,
    fontSize: 16,
  },
];

export const DEFAULT_INNER_ARC: CuneiformArc = {
  label: "Master of Thought",
  cuneiform: "𒂗 𒊕  𒆠",
  startAngle: -90,    // user 0°
  span: 79,
  clockwise: true,
  radius: 58,
  fontSize: 14,
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
  /** Render a crosshair X + alignment rings (for edit mode). */
  showGuides?: boolean;
  /** Optional center override in viewBox coords. Defaults to DEFAULT_CENTER. */
  center?: { cx: number; cy: number };
  /** Vertical stretch factor for the eagle emblem. Defaults to
   *  DEFAULT_VERTICAL_STRETCH. Non-uniform scale so content can stretch
   *  without affecting horizontal layout. */
  verticalStretch?: number;
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
  center,
  verticalStretch,
}: MasterOfThoughtProps) {
  const uid = useId().replace(/:/g, "");
  const tintId = `${uid}-tint`;
  // When emblem is white (initial state), cuneiform stays gold for readability
  // + aesthetic. All other tint colors propagate through to the cuneiform.
  const isWhiteTint = color === "#FFFFFF" || color?.toLowerCase?.() === "white";
  const textFill = !color || isWhiteTint ? "gold" : color;

  const cx = center?.cx ?? DEFAULT_CENTER.cx;
  const cy = center?.cy ?? DEFAULT_CENTER.cy;

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

      {/* Eagle emblem image — stretched vertically by verticalStretch (default
          5% taller). PNG file itself stays 1024×1024; the stretch is applied
          only during SVG render via a non-uniform scale. */}
      {(() => {
        const stretch = verticalStretch ?? DEFAULT_VERTICAL_STRETCH;
        const h = 400 * stretch;
        const yOffset = (400 - h) / 2;  // negative when stretch > 1
        return (
          <image
            href="/book-images/master-of-thought.png"
            x={0}
            y={yOffset}
            width={400}
            height={h}
            preserveAspectRatio="none"
            filter={color ? `url(#${tintId})` : undefined}
          />
        );
      })()}

      {/* Edit-mode guides: crosshair X spanning inner radius → outer radius,
          reference rings, and dashed baseline paths for each arc. */}
      {showGuides && (
        <g pointerEvents="none">
          {/* Reference rings: inner smooth circle, rope inner edge, rope outer edge */}
          <circle cx={cx} cy={cy} r={85} fill="none" stroke="#00e0ff" strokeWidth={0.6} strokeDasharray="2 3" opacity={0.55} />
          <circle cx={cx} cy={cy} r={115} fill="none" stroke="#ff7a00" strokeWidth={0.6} strokeDasharray="2 3" opacity={0.55} />
          <circle cx={cx} cy={cy} r={152} fill="none" stroke="#ff7a00" strokeWidth={0.6} strokeDasharray="2 3" opacity={0.55} />
          {/* X crosshair spanning inner radius to outer radius (plus short inner segments) */}
          {/* Horizontal arms */}
          <line x1={cx - 152} y1={cy} x2={cx - 85} y2={cy} stroke="#00e0ff" strokeWidth={0.8} opacity={0.8} />
          <line x1={cx + 85} y1={cy} x2={cx + 152} y2={cy} stroke="#00e0ff" strokeWidth={0.8} opacity={0.8} />
          {/* Vertical arms */}
          <line x1={cx} y1={cy - 152} x2={cx} y2={cy - 85} stroke="#00e0ff" strokeWidth={0.8} opacity={0.8} />
          <line x1={cx} y1={cy + 85} x2={cx} y2={cy + 152} stroke="#00e0ff" strokeWidth={0.8} opacity={0.8} />
          {/* Inner short crosshair at center so user can verify alignment */}
          <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke="#00ff88" strokeWidth={1} />
          <line x1={cx} y1={cy - 14} x2={cx} y2={cy + 14} stroke="#00ff88" strokeWidth={1} />
          <circle cx={cx} cy={cy} r={2.5} fill="#00ff88" />
          {/* Visualize each arc baseline */}
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
