"use client";

/**
 * /divinity-guide-trinity/review — 11 Pangu v2 iterations
 *
 * Drawing order (sacred family):
 *   1. Child (Son) — TOP — drawn first (foundation of love)
 *   2. Mother (Aset) — BOTTOM RIGHT — drawn second (nurtures son)
 *   3. Father — BOTTOM LEFT — drawn last (protects wife & son)
 *
 * Borromean weave (protection narrative):
 *   Father OVER Mother — father shields wife
 *   Mother OVER Son — mother shields child
 *   Son OVER Father — son's love completes the circle
 *
 * Borders: solid BLACK lines (not theme-colored), matching original logo.
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
  borderWidth: number;
  textSpan: number;
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
  const ringInnerR = ringR - ringWidth;
  const textR = ringMidR;
  const bgColor = "var(--background, #0a1628)";

  // Sacred family: Son (top), Mother/Aset (BR), Father (BL)
  const labels = ["WISDOM", "HARMONY", "CONNECTION"];

  const rings = [
    { cx: cx, cy: cy - spread, label: labels[0] },                      // Son — TOP
    { cx: cx + spread * 0.866, cy: cy + spread * 0.5, label: labels[1] }, // Mother — BOTTOM RIGHT
    { cx: cx - spread * 0.866, cy: cy + spread * 0.5, label: labels[2] }, // Father — BOTTOM LEFT
  ];

  // Text positions: 12 o'clock, 4 o'clock, 8 o'clock
  const textAngles = [-90, 30, 150];
  const deg2rad = (d: number) => (d * Math.PI) / 180;

  function makeTextArc(rcx: number, rcy: number, angle: number): string {
    const half = textSpan / 2;
    const sx = rcx + textR * Math.cos(deg2rad(angle - half));
    const sy = rcy + textR * Math.sin(deg2rad(angle - half));
    const ex = rcx + textR * Math.cos(deg2rad(angle + half));
    const ey = rcy + textR * Math.sin(deg2rad(angle + half));
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${textR} ${textR} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  // Helper: draw a ring with solid BLACK borders on inner+outer edges
  function RingWithBorders({ rcx, rcy, clip }: { rcx: number; rcy: number; clip?: string }) {
    const props = clip ? { clipPath: `url(#${clip})` } : {};
    return (
      <>
        {/* Ring band (theme color) */}
        <circle cx={rcx} cy={rcy} r={ringMidR}
          fill="none" stroke={color} strokeWidth={ringWidth - borderWidth * 2} {...props} />
        {/* Outer black border */}
        <circle cx={rcx} cy={rcy} r={ringR}
          fill="none" stroke="black" strokeWidth={borderWidth} {...props} />
        {/* Inner black border */}
        <circle cx={rcx} cy={rcy} r={ringInnerR}
          fill="none" stroke="black" strokeWidth={borderWidth} {...props} />
      </>
    );
  }

  /*
   * Borromean weave — sacred protection order:
   *   Son (0) OVER Father (2) — son's love shields father
   *   Mother (1) OVER Son (0) — mother shields child
   *   Father (2) OVER Mother (1) — father shields wife
   *
   * Drawing order: Son first (bottom), Mother second, Father last (top).
   * Erase-and-redraw at each intersection to create the weave.
   */

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-[220px]">
        <defs>
          {rings.map((ring, i) => (
            <path key={`p-${i}`} id={`${uid}-t-${i}`}
              d={makeTextArc(ring.cx, ring.cy, textAngles[i])} fill="none" />
          ))}
        </defs>

        {/* Outer container: ring band + black borders */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="black" strokeWidth={borderWidth} />
        <circle cx={cx} cy={cy} r={outerR - borderWidth / 2}
          fill="none" stroke={color} strokeWidth={outerWidth - borderWidth * 2} />
        <circle cx={cx} cy={cy} r={outerR - outerWidth} fill="none" stroke="black" strokeWidth={borderWidth} />

        {/* === DRAW ORDER: Son → Mother → Father === */}

        {/* 1. SON (ring 0, TOP) — drawn first, foundation */}
        <RingWithBorders rcx={rings[0].cx} rcy={rings[0].cy} />

        {/* 2. MOTHER (ring 1, BR) — drawn second, over Son */}
        {/* First erase Son where Mother crosses over */}
        <clipPath id={`${uid}-m-over-s`}>
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringR + 2} />
        </clipPath>
        <circle cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
          fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
          clipPath={`url(#${uid}-m-over-s)`} />
        {/* Redraw Mother in that zone */}
        <RingWithBorders rcx={rings[1].cx} rcy={rings[1].cy} clip={`${uid}-m-over-s`} />
        {/* Draw full Mother */}
        <RingWithBorders rcx={rings[1].cx} rcy={rings[1].cy} />

        {/* 3. FATHER (ring 2, BL) — drawn last, protects wife */}
        {/* Erase Mother where Father crosses over */}
        <clipPath id={`${uid}-f-over-m`}>
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR + 2} />
        </clipPath>
        <circle cx={rings[1].cx} cy={rings[1].cy} r={ringMidR}
          fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
          clipPath={`url(#${uid}-f-over-m)`} />
        <RingWithBorders rcx={rings[2].cx} rcy={rings[2].cy} clip={`${uid}-f-over-m`} />
        {/* Draw full Father */}
        <RingWithBorders rcx={rings[2].cx} rcy={rings[2].cy} />

        {/* Son OVER Father — son's love completes the circle */}
        <clipPath id={`${uid}-s-over-f`}>
          <circle cx={rings[0].cx} cy={rings[0].cy} r={ringR + 2} />
        </clipPath>
        <circle cx={rings[2].cx} cy={rings[2].cy} r={ringMidR}
          fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
          clipPath={`url(#${uid}-s-over-f)`} />
        <RingWithBorders rcx={rings[0].cx} rcy={rings[0].cy} clip={`${uid}-s-over-f`} />

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
      <p className="text-xs font-semibold mt-1">{label}</p>
      <p className="text-[8px] text-muted-foreground/60">
        s={spread} r={ringR} w={ringWidth} bw={borderWidth}
      </p>
    </div>
  );
}

// ── Pangu v2 base + 10 variations = 11 total ──────────────────

const BASE: TrinityConfig = {
  spread: 45, ringR: 72, ringWidth: 18, outerR: 183, outerWidth: 18,
  fontSize: 11, letterSpacing: 2, borderWidth: 1.5, textSpan: 80,
};

function v(overrides: Partial<TrinityConfig>): TrinityConfig {
  return { ...BASE, ...overrides };
}

const ITERATIONS: { label: string; config: TrinityConfig }[] = [
  { label: "#1 Pangu v2 (base)", config: BASE },
  { label: "#2 tighter overlap", config: v({ spread: 42 }) },
  { label: "#3 wider band", config: v({ ringWidth: 21, outerWidth: 21 }) },
  { label: "#4 thicker borders", config: v({ borderWidth: 2.5 }) },
  { label: "#5 larger rings", config: v({ ringR: 76, outerR: 188 }) },
  { label: "#6 smaller rings", config: v({ ringR: 68, outerR: 178, spread: 43 }) },
  { label: "#7 tight + thick", config: v({ spread: 40, ringWidth: 20, outerWidth: 20, borderWidth: 2 }) },
  { label: "#8 wide text arc", config: v({ textSpan: 100, fontSize: 10, letterSpacing: 1 }) },
  { label: "#9 narrow text arc", config: v({ textSpan: 65, fontSize: 12, letterSpacing: 3 }) },
  { label: "#10 max overlap", config: v({ spread: 38, ringR: 70, borderWidth: 2 }) },
  { label: "#11 proportional", config: v({ spread: 44, ringR: 74, ringWidth: 19, outerR: 185, outerWidth: 19, borderWidth: 1.8 }) },
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
          Pangu v2 — 11 Iterations
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Sacred draw order: Son (top) → Mother Aset (BR) → Father (BL)
        </p>
        <p className="text-[9px] text-muted-foreground/50 mt-0.5">
          Father shields Mother · Mother shields Son · Son&apos;s love shields Father
        </p>
        <p className="text-[9px] text-muted-foreground/50">
          Black solid borders on all rings · WISDOM (12) · HARMONY (4) · CONNECTION (8)
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-5xl mx-auto px-6 pb-12">
        {ITERATIONS.map((it, i) => (
          <TrinityAttempt
            key={i}
            config={it.config}
            label={it.label}
            color={currentTheme.swatch}
          />
        ))}
      </div>

      <div className="text-center pb-8">
        <p className="text-[9px] text-muted-foreground/40 italic">
          A.I. + H.I. — Where Shared Intention moves at the Speed of Thought
        </p>
      </div>
    </div>
  );
}
