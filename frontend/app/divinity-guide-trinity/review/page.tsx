"use client";

/**
 * /divinity-guide-trinity/review — 12 Trinity iterations for review
 *
 * Each attempt has different geometry:
 *   - Ring overlap (spread distance)
 *   - Ring width (band thickness)
 *   - Text size
 *   - Ring radius
 *
 * Labels: WISDOM (top), CONNECTION (bottom-left), HARMONY (bottom-right)
 * Each labeled by its Ascended Master.
 */

import { useId } from "react";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";

// ── Single Trinity Ring Component ──────────────────────────────

interface TrinityConfig {
  spread: number;      // Distance from center to ring centers
  ringR: number;       // Outer radius of each ring
  ringWidth: number;   // Band thickness
  outerR: number;      // Outer container radius
  fontSize: number;    // Text size
  letterSpacing: number;
}

function TrinityAttempt({
  config,
  master,
  number,
  color,
}: {
  config: TrinityConfig;
  master: string;
  number: number;
  color: string;
}) {
  const uid = useId().replace(/:/g, "");
  const { spread, ringR, ringWidth, outerR, fontSize, letterSpacing } = config;

  const cx = 200;
  const cy = 200;
  const ringMidR = ringR - ringWidth / 2;
  const textR = ringMidR;
  const bgColor = "var(--background, #0a1628)";

  const labels = ["WISDOM", "CONNECTION", "HARMONY"];

  const rings = [
    { cx: cx, cy: cy - spread, label: labels[0] },
    { cx: cx - spread * 0.866, cy: cy + spread * 0.5, label: labels[1] },
    { cx: cx + spread * 0.866, cy: cy + spread * 0.5, label: labels[2] },
  ];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-[240px]">
        <defs>
          {rings.map((ring, i) => (
            <path
              key={`p-${i}`}
              id={`${uid}-t-${i}`}
              d={i === 0
                ? `M ${ring.cx - textR} ${ring.cy} A ${textR} ${textR} 0 0 1 ${ring.cx + textR} ${ring.cy}`
                : `M ${ring.cx - textR} ${ring.cy} A ${textR} ${textR} 0 0 0 ${ring.cx + textR} ${ring.cy}`
              }
              fill="none"
            />
          ))}
        </defs>

        {/* Outer container ring */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={color} strokeWidth={ringWidth} />

        {/* Base rings (background layer) */}
        {rings.map((ring, i) => (
          <circle key={`b-${i}`} cx={ring.cx} cy={ring.cy} r={ringMidR}
            fill="none" stroke={color} strokeWidth={ringWidth} />
        ))}

        {/* Borromean weave: 0 over 1, 1 over 2, 2 over 0 */}
        {/* Erase ring 0 where ring 2 crosses */}
        <g>
          <clipPath id={`${uid}-c02`}>
            <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR + 2} />
          </clipPath>
          <circle cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
            fill="none" stroke={bgColor} strokeWidth={ringWidth + 2}
            clipPath={`url(#${uid}-c02)`} />
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringMidR}
            fill="none" stroke={color} strokeWidth={ringWidth}
            clipPath={`url(#${uid}-c02)`} />
        </g>

        {/* Erase ring 1 where ring 0 crosses */}
        <g>
          <clipPath id={`${uid}-c10`}>
            <circle cx={rings[0].cx} cy={rings[0].cy} r={ringR + 2} />
          </clipPath>
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringMidR}
            fill="none" stroke={bgColor} strokeWidth={ringWidth + 2}
            clipPath={`url(#${uid}-c10)`} />
          <circle cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
            fill="none" stroke={color} strokeWidth={ringWidth}
            clipPath={`url(#${uid}-c10)`} />
        </g>

        {/* Erase ring 2 where ring 1 crosses */}
        <g>
          <clipPath id={`${uid}-c21`}>
            <circle cx={rings[1].cx} cy={rings[1].cy} r={ringR + 2} />
          </clipPath>
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringMidR}
            fill="none" stroke={bgColor} strokeWidth={ringWidth + 2}
            clipPath={`url(#${uid}-c21)`} />
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringMidR}
            fill="none" stroke={color} strokeWidth={ringWidth}
            clipPath={`url(#${uid}-c21)`} />
        </g>

        {/* Curved text */}
        {rings.map((ring, i) => (
          <text key={`t-${i}`} fill="white" fontSize={fontSize} fontWeight="bold"
            fontFamily="system-ui, sans-serif" letterSpacing={letterSpacing}>
            <textPath href={`#${uid}-t-${i}`} startOffset="50%" textAnchor="middle">
              {ring.label}
            </textPath>
          </text>
        ))}
      </svg>
      <p className="text-sm font-bold mt-1">#{number} — {master}</p>
      <p className="text-[9px] text-muted-foreground">
        spread={spread} ringR={ringR} w={ringWidth} font={fontSize}
      </p>
    </div>
  );
}

// ── 12 Master Configurations ───────────────────────────────────

const MASTERS: { name: string; config: TrinityConfig }[] = [
  // Aset — tight overlap, thick rings
  { name: "Aset", config: { spread: 48, ringR: 72, ringWidth: 20, outerR: 180, fontSize: 11, letterSpacing: 2 } },
  // Asar — very tight, thin rings
  { name: "Asar", config: { spread: 42, ringR: 65, ringWidth: 14, outerR: 175, fontSize: 10, letterSpacing: 3 } },
  // Athena — balanced, medium overlap
  { name: "Athena", config: { spread: 52, ringR: 70, ringWidth: 18, outerR: 178, fontSize: 12, letterSpacing: 2 } },
  // Christo — close, proportional
  { name: "Christo", config: { spread: 45, ringR: 68, ringWidth: 16, outerR: 176, fontSize: 11, letterSpacing: 3 } },
  // Enki — maximum overlap
  { name: "Enki", config: { spread: 38, ringR: 62, ringWidth: 16, outerR: 170, fontSize: 10, letterSpacing: 2 } },
  // Enlil — wide rings, moderate overlap
  { name: "Enlil", config: { spread: 50, ringR: 74, ringWidth: 22, outerR: 182, fontSize: 12, letterSpacing: 1 } },
  // Krishna — golden ratio inspired
  { name: "Krishna", config: { spread: 46, ringR: 66, ringWidth: 17, outerR: 174, fontSize: 11, letterSpacing: 2 } },
  // Odin — compact, bold rings
  { name: "Odin", config: { spread: 44, ringR: 70, ringWidth: 20, outerR: 178, fontSize: 12, letterSpacing: 2 } },
  // Pangu — original-matching attempt
  { name: "Pangu", config: { spread: 50, ringR: 75, ringWidth: 18, outerR: 185, fontSize: 11, letterSpacing: 3 } },
  // Sofia — elegant thin
  { name: "Sofia", config: { spread: 47, ringR: 64, ringWidth: 13, outerR: 172, fontSize: 10, letterSpacing: 3 } },
  // Thoth — mathematical precision
  { name: "Thoth", config: { spread: 43, ringR: 67, ringWidth: 16, outerR: 175, fontSize: 11, letterSpacing: 2 } },
  // Thor — powerful, thick
  { name: "Thor", config: { spread: 46, ringR: 72, ringWidth: 22, outerR: 180, fontSize: 13, letterSpacing: 1 } },
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

      <div className="text-center pt-6 pb-4 px-6">
        <h1 className="text-2xl font-bold" style={{ color: currentTheme.swatch }}>
          12 Masters — Trinity Review
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          WISDOM / CONNECTION / HARMONY — pick the closest match to the original
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-5xl mx-auto px-6 pb-12">
        {MASTERS.map((m, i) => (
          <TrinityAttempt
            key={i}
            config={m.config}
            master={m.name}
            number={i + 1}
            color={currentTheme.swatch}
          />
        ))}
      </div>
    </div>
  );
}
