"use client";

/**
 * /divinity-guide-trinity/review — 12 Trinity iterations (3 masters × 4 variations)
 *
 * Row 1: Thoth (original + 3 variations)
 * Row 2: Pangu (original + 3 variations)
 * Row 3: Christo (original + 3 variations)
 *
 * Key fixes from original logo analysis:
 *   - Text at 12 o'clock (top), 4 o'clock (BR), 8 o'clock (BL) — faces outward
 *   - Gap between outer container inner edge and top ring = ring band width
 *   - Thin black border on inner and outer edges of each ring
 *   - Borromean weave with proper over/under
 */

import { useId } from "react";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";

interface TrinityConfig {
  spread: number;
  ringR: number;
  ringWidth: number;
  outerR: number;
  outerWidth: number;
  fontSize: number;
  letterSpacing: number;
  borderWidth: number;  // Thin black border around each ring
  textSpan: number;     // Angular span for text arc (degrees)
}

function TrinityAttempt({
  config,
  label,
  color,
}: {
  config: TrinityConfig;
  label: string;
  color: string;
}) {
  const uid = useId().replace(/:/g, "");
  const { spread, ringR, ringWidth, outerR, outerWidth, fontSize, letterSpacing, borderWidth, textSpan } = config;

  const cx = 200;
  const cy = 200;
  const ringMidR = ringR - ringWidth / 2;
  const textR = ringMidR;
  const bgColor = "var(--background, #0a1628)";

  const labels = ["WISDOM", "CONNECTION", "HARMONY"];

  // Ring centers: top, bottom-left, bottom-right
  const rings = [
    { cx: cx, cy: cy - spread, label: labels[0] },
    { cx: cx - spread * 0.866, cy: cy + spread * 0.5, label: labels[1] },
    { cx: cx + spread * 0.866, cy: cy + spread * 0.5, label: labels[2] },
  ];

  // Text angular positions (SVG angles: 0° = 3 o'clock, clockwise)
  // Top ring: 12 o'clock = -90°
  // BR ring: 4 o'clock = +30°  (120° clockwise from 12)
  // BL ring: 8 o'clock = +150° (240° clockwise from 12)
  const textAngles = [-90, 30, 150]; // degrees, SVG convention

  const deg2rad = (d: number) => (d * Math.PI) / 180;

  // Build arc paths for text — arc centered at each angle, spanning ±textSpan degrees
  function makeTextArc(ringCx: number, ringCy: number, angle: number): string {
    const halfSpan = textSpan / 2;
    const startAngle = angle - halfSpan;
    const endAngle = angle + halfSpan;

    const sx = ringCx + textR * Math.cos(deg2rad(startAngle));
    const sy = ringCy + textR * Math.sin(deg2rad(startAngle));
    const ex = ringCx + textR * Math.cos(deg2rad(endAngle));
    const ey = ringCy + textR * Math.sin(deg2rad(endAngle));

    // Sweep flag 1 = clockwise
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${textR} ${textR} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  // Outer container inner ring radius (gap = ringWidth)
  const outerInnerR = outerR - outerWidth;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-[220px]">
        <defs>
          {rings.map((ring, i) => (
            <path
              key={`p-${i}`}
              id={`${uid}-t-${i}`}
              d={makeTextArc(ring.cx, ring.cy, textAngles[i])}
              fill="none"
            />
          ))}
        </defs>

        {/* Outer container: thick ring + thin inner border */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={color} strokeWidth={outerWidth} />
        <circle cx={cx} cy={cy} r={outerInnerR} fill="none" stroke={color} strokeWidth={1} />

        {/* === RING RENDERING (3 layers) === */}

        {/* Layer 1: Base rings with black borders */}
        {rings.map((ring, i) => (
          <g key={`ring-${i}`}>
            {/* Outer black border */}
            <circle cx={ring.cx} cy={ring.cy} r={ringR}
              fill="none" stroke={color} strokeWidth={borderWidth} />
            {/* Ring band */}
            <circle cx={ring.cx} cy={ring.cy} r={ringMidR}
              fill="none" stroke={color} strokeWidth={ringWidth - borderWidth * 2} />
            {/* Inner black border */}
            <circle cx={ring.cx} cy={ring.cy} r={ringR - ringWidth}
              fill="none" stroke={color} strokeWidth={borderWidth} />
          </g>
        ))}

        {/* Layer 2: Borromean weave — 0 over 1, 1 over 2, 2 over 0 */}

        {/* Erase ring 0 where ring 2 passes OVER */}
        <g>
          <clipPath id={`${uid}-c02`}>
            <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR + 2} />
          </clipPath>
          {/* Erase */}
          <circle cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
            fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
            clipPath={`url(#${uid}-c02)`} />
          {/* Redraw ring 2 with borders */}
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR}
            fill="none" stroke={color} strokeWidth={borderWidth}
            clipPath={`url(#${uid}-c02)`} />
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringMidR}
            fill="none" stroke={color} strokeWidth={ringWidth - borderWidth * 2}
            clipPath={`url(#${uid}-c02)`} />
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR - ringWidth}
            fill="none" stroke={color} strokeWidth={borderWidth}
            clipPath={`url(#${uid}-c02)`} />
        </g>

        {/* Erase ring 1 where ring 0 passes OVER */}
        <g>
          <clipPath id={`${uid}-c10`}>
            <circle cx={rings[0].cx} cy={rings[0].cy} r={ringR + 2} />
          </clipPath>
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringMidR}
            fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
            clipPath={`url(#${uid}-c10)`} />
          <circle cx={rings[0].cx} cy={rings[0].cy} r={ringR}
            fill="none" stroke={color} strokeWidth={borderWidth}
            clipPath={`url(#${uid}-c10)`} />
          <circle cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
            fill="none" stroke={color} strokeWidth={ringWidth - borderWidth * 2}
            clipPath={`url(#${uid}-c10)`} />
          <circle cx={rings[0].cx} cy={rings[0].cy} r={ringR - ringWidth}
            fill="none" stroke={color} strokeWidth={borderWidth}
            clipPath={`url(#${uid}-c10)`} />
        </g>

        {/* Erase ring 2 where ring 1 passes OVER */}
        <g>
          <clipPath id={`${uid}-c21`}>
            <circle cx={rings[1].cx} cy={rings[1].cy} r={ringR + 2} />
          </clipPath>
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringMidR}
            fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
            clipPath={`url(#${uid}-c21)`} />
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringR}
            fill="none" stroke={color} strokeWidth={borderWidth}
            clipPath={`url(#${uid}-c21)`} />
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringMidR}
            fill="none" stroke={color} strokeWidth={ringWidth - borderWidth * 2}
            clipPath={`url(#${uid}-c21)`} />
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringR - ringWidth}
            fill="none" stroke={color} strokeWidth={borderWidth}
            clipPath={`url(#${uid}-c21)`} />
        </g>

        {/* Curved text — centered at 12, 4, and 8 o'clock positions */}
        {rings.map((ring, i) => (
          <text key={`t-${i}`} fill="white" fontSize={fontSize} fontWeight="bold"
            fontFamily="system-ui, sans-serif" letterSpacing={letterSpacing}>
            <textPath href={`#${uid}-t-${i}`} startOffset="50%" textAnchor="middle">
              {ring.label}
            </textPath>
          </text>
        ))}
      </svg>
      <p className="text-xs font-semibold mt-1">{label}</p>
      <p className="text-[8px] text-muted-foreground/60">
        s={spread} r={ringR} w={ringWidth} bw={borderWidth}
      </p>
    </div>
  );
}

// ── 3 Masters × 4 Variations ──────────────────────────────────

const ROWS: { master: string; configs: { label: string; config: TrinityConfig }[] }[] = [
  {
    master: "Thoth",
    configs: [
      { label: "Thoth Original", config: { spread: 43, ringR: 67, ringWidth: 16, outerR: 180, outerWidth: 18, fontSize: 10, letterSpacing: 2, borderWidth: 1.5, textSpan: 80 } },
      { label: "Thoth v2 — tighter", config: { spread: 40, ringR: 67, ringWidth: 16, outerR: 178, outerWidth: 18, fontSize: 10, letterSpacing: 2, borderWidth: 1.5, textSpan: 85 } },
      { label: "Thoth v3 — wider band", config: { spread: 43, ringR: 70, ringWidth: 19, outerR: 182, outerWidth: 19, fontSize: 11, letterSpacing: 2, borderWidth: 2, textSpan: 80 } },
      { label: "Thoth v4 — thin border", config: { spread: 41, ringR: 65, ringWidth: 15, outerR: 176, outerWidth: 16, fontSize: 10, letterSpacing: 3, borderWidth: 1, textSpan: 90 } },
    ],
  },
  {
    master: "Pangu",
    configs: [
      { label: "Pangu Original", config: { spread: 50, ringR: 75, ringWidth: 18, outerR: 185, outerWidth: 18, fontSize: 11, letterSpacing: 3, borderWidth: 1.5, textSpan: 75 } },
      { label: "Pangu v2 — closer", config: { spread: 45, ringR: 72, ringWidth: 18, outerR: 183, outerWidth: 18, fontSize: 11, letterSpacing: 2, borderWidth: 1.5, textSpan: 80 } },
      { label: "Pangu v3 — thick borders", config: { spread: 48, ringR: 74, ringWidth: 20, outerR: 186, outerWidth: 20, fontSize: 11, letterSpacing: 2, borderWidth: 2.5, textSpan: 75 } },
      { label: "Pangu v4 — compact", config: { spread: 44, ringR: 70, ringWidth: 17, outerR: 180, outerWidth: 17, fontSize: 10, letterSpacing: 3, borderWidth: 1.5, textSpan: 85 } },
    ],
  },
  {
    master: "Christo",
    configs: [
      { label: "Christo Original", config: { spread: 45, ringR: 68, ringWidth: 16, outerR: 176, outerWidth: 16, fontSize: 11, letterSpacing: 3, borderWidth: 1.5, textSpan: 80 } },
      { label: "Christo v2 — overlap+", config: { spread: 42, ringR: 68, ringWidth: 16, outerR: 176, outerWidth: 16, fontSize: 10, letterSpacing: 2, borderWidth: 1.5, textSpan: 85 } },
      { label: "Christo v3 — bold band", config: { spread: 45, ringR: 72, ringWidth: 20, outerR: 180, outerWidth: 20, fontSize: 12, letterSpacing: 2, borderWidth: 2, textSpan: 78 } },
      { label: "Christo v4 — elegant", config: { spread: 43, ringR: 66, ringWidth: 14, outerR: 174, outerWidth: 15, fontSize: 10, letterSpacing: 3, borderWidth: 1, textSpan: 90 } },
    ],
  },
];

export default function TrinityReviewPage() {
  const { currentTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/divinity-guide-trinity" className="flex items-center gap-2 hover:opacity-80">
          <span className="text-sm font-bold" style={{ color: currentTheme.swatch }}>eXeL</span>
          <span className="text-sm font-light" style={{ color: currentTheme.swatch, opacity: 0.7 }}>AI</span>
          <span className="text-xs text-muted-foreground ml-2">/ Trinity Review</span>
        </Link>
      </div>

      <div className="text-center pt-6 pb-2 px-6">
        <h1 className="text-2xl font-bold" style={{ color: currentTheme.swatch }}>
          A.I. + H.I. — Trinity Refinement
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          WISDOM (12 o&apos;clock) / CONNECTION (8 o&apos;clock) / HARMONY (4 o&apos;clock)
        </p>
        <p className="text-[9px] text-muted-foreground/50 mt-0.5">
          Each row: original left, 3 variations right. Black borders on inner rings. Gap = ring width.
        </p>
      </div>

      {ROWS.map((row, ri) => (
        <div key={ri} className="mb-6">
          <p className="text-sm font-bold text-center mb-2" style={{ color: currentTheme.swatch }}>
            {row.master}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto px-6">
            {row.configs.map((c, ci) => (
              <TrinityAttempt
                key={ci}
                config={c.config}
                label={c.label}
                color={currentTheme.swatch}
              />
            ))}
          </div>
        </div>
      ))}

      <div className="text-center pb-8">
        <p className="text-[9px] text-muted-foreground/40 italic">
          Where Shared Intention moves at the Speed of Thought
        </p>
      </div>
    </div>
  );
}
