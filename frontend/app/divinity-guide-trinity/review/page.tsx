"use client";

/**
 * /divinity-guide-trinity/review — 12 Pangu v2 iterations
 *
 * Sacred draw order: Son → Mother (Aset) → Father (Asar)
 *
 * KEY CONSTRAINTS (from original logo):
 *   1. Bottom-left and bottom-right text INVERTED (reads right-side up)
 *   2. Three deltas must be EQUAL:
 *      - Son ring width = ringR - ringInnerR = ringWidth
 *      - Gap = Unity inner radius - (spread + ringR)
 *      - Unity ring width = outerWidth
 *      Formula: outerR = spread + ringR + 2 * ringWidth
 *   3. Black solid borders on all rings
 */

import { useId } from "react";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";

interface TrinityConfig {
  spread: number;
  ringR: number;
  ringWidth: number;
  gap: number;          // Space between Unity inner edge and Son outer edge
  outerWidth: number;   // Unity ring band width
  fontSize: number;
  letterSpacing: number;
  borderWidth: number;
  textSpan: number;
  wisdomAngle: number;     // Top text center angle (SVG degrees)
  connectionAngle: number; // BL text center angle
  harmonyAngle: number;    // BR text center angle
}

// outerR = spread + ringR + gap + outerWidth
function getOuterR(c: TrinityConfig): number {
  return c.spread + c.ringR + c.gap + c.outerWidth;
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
  const { spread, ringR, ringWidth, gap: gapSize, outerWidth, fontSize, letterSpacing, borderWidth, textSpan,
    wisdomAngle, connectionAngle, harmonyAngle } = config;

  const cx = 200;
  const cy = 200;
  const outerR = getOuterR(config);
  const ringMidR = ringR - ringWidth / 2;
  const ringInnerR = ringR - ringWidth;
  const textR = ringMidR;
  const bgColor = "var(--background, #0a1628)";

  const labels = ["WISDOM", "HARMONY", "CONNECTION"];

  // Son (top), Mother Aset (BR), Father Asar (BL)
  const rings = [
    { cx: cx, cy: cy - spread, label: labels[0] },
    { cx: cx + spread * 0.866, cy: cy + spread * 0.5, label: labels[1] },
    { cx: cx - spread * 0.866, cy: cy + spread * 0.5, label: labels[2] },
  ];

  // Per-ring text angles (configurable)
  const textAngles = [wisdomAngle, harmonyAngle, connectionAngle];
  const deg2rad = (d: number) => (d * Math.PI) / 180;

  // Build text arc paths
  // Top ring: clockwise arc (text reads naturally)
  // Bottom rings: REVERSED arc (counter-clockwise) so text reads RIGHT-SIDE UP
  function makeTextArc(rcx: number, rcy: number, angle: number, invert: boolean): string {
    const half = textSpan / 2;
    const a1 = angle - half;
    const a2 = angle + half;
    const sx = rcx + textR * Math.cos(deg2rad(a1));
    const sy = rcy + textR * Math.sin(deg2rad(a1));
    const ex = rcx + textR * Math.cos(deg2rad(a2));
    const ey = rcy + textR * Math.sin(deg2rad(a2));

    if (invert) {
      // Reversed: end→start, sweep=0 (counter-clockwise) → text reads right-side up
      return `M ${ex.toFixed(1)} ${ey.toFixed(1)} A ${textR} ${textR} 0 0 0 ${sx.toFixed(1)} ${sy.toFixed(1)}`;
    }
    // Normal: start→end, sweep=1 (clockwise)
    return `M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${textR} ${textR} 0 0 1 ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  }

  // Ring helper with solid BLACK borders
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

  // Tight viewBox — auto-fit to outer circle with small padding
  const pad = 8;
  const vbSize = (outerR + pad) * 2;
  const vbOffset = cx - outerR - pad;
  const viewBox = `${vbOffset} ${vbOffset} ${vbSize} ${vbSize}`;

  // Outer container radii (same structure as inner rings)

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={viewBox} className="w-full max-w-[220px]">
        <defs>
          {rings.map((ring, i) => (
            <path key={`p-${i}`} id={`${uid}-t-${i}`}
              d={makeTextArc(ring.cx, ring.cy, textAngles[i], i !== 0)}
              fill="none" />
          ))}
        </defs>

        {/* Outer Unity ring: band + black borders (same structure as inner rings) */}
        <circle cx={cx} cy={cy} r={outerR - outerWidth / 2}
          fill="none" stroke={color} strokeWidth={outerWidth - borderWidth * 2} />
        <circle cx={cx} cy={cy} r={outerR}
          fill="none" stroke="black" strokeWidth={borderWidth} />
        <circle cx={cx} cy={cy} r={outerR - outerWidth}
          fill="none" stroke="black" strokeWidth={borderWidth} />

        {/*
          Z-ORDER (protection narrative):
            1. Son drawn FIRST — underneath both parents
            2. Mother Aset drawn SECOND — over Son, under Father
            3. Father Asar drawn LAST — over both (protects wife + child)
        */}

        {/* 1. SON (ring 0, TOP) — drawn first, foundation */}
        <RingBand rcx={rings[0].cx} rcy={rings[0].cy} />

        {/* 2. MOTHER ASET (ring 1, BR) — erase Son, draw Mother over him */}
        <clipPath id={`${uid}-mom-over-son`}>
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringR + 2} />
        </clipPath>
        <circle cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
          fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
          clipPath={`url(#${uid}-mom-over-son)`} />
        <RingBand rcx={rings[1].cx} rcy={rings[1].cy} clip={`${uid}-mom-over-son`} />
        <RingBand rcx={rings[1].cx} rcy={rings[1].cy} />

        {/* 3. FATHER ASAR (ring 2, BL) — erase both Son + Mother, draw Father on top */}
        {/* Father over Mother */}
        <clipPath id={`${uid}-dad-over-mom`}>
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR + 2} />
        </clipPath>
        <circle cx={rings[1].cx} cy={rings[1].cy} r={ringMidR}
          fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
          clipPath={`url(#${uid}-dad-over-mom)`} />
        <RingBand rcx={rings[2].cx} rcy={rings[2].cy} clip={`${uid}-dad-over-mom`} />

        {/* Father over Son */}
        <clipPath id={`${uid}-dad-over-son`}>
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR + 2} />
        </clipPath>
        <circle cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
          fill="none" stroke={bgColor} strokeWidth={ringWidth + 4}
          clipPath={`url(#${uid}-dad-over-son)`} />
        <RingBand rcx={rings[2].cx} rcy={rings[2].cy} clip={`${uid}-dad-over-son`} />

        {/* Full Father ring (top of everything) */}
        <RingBand rcx={rings[2].cx} rcy={rings[2].cy} />

        {/* TEXT LAST — rendered on top of all rings, never clipped */}
        {rings.map((ring, i) => (
          <text key={`t-${i}`} fill="black" fontSize={fontSize} fontWeight="bold"
            fontFamily="system-ui, sans-serif" letterSpacing={letterSpacing}
            style={{ pointerEvents: "none" }}>
            <textPath href={`#${uid}-t-${i}`} startOffset="50%" textAnchor="middle">
              {ring.label}
            </textPath>
          </text>
        ))}
      </svg>
      <p className="text-xs font-semibold mt-1">{label}</p>
      <p className="text-[8px] text-muted-foreground/60">
        s={spread} r={ringR} w={ringWidth} gap={gapSize} oW={outerWidth} oR={outerR}
      </p>
    </div>
  );
}

// ── 12 Pangu v2 iterations with equal-delta constraint ─────────


// LOCKED: Winner outer ring (gap=21, outerWidth=21, spread=39, ringR=72, ringWidth=21)
// outerR = 39 + 72 + 21 + 21 = 153. This is CORRECT — do not shrink.
// This round: ONLY iterate text (angles, span, font). Text rendered LAST (not clipped).
const D: Omit<TrinityConfig, 'spread' | 'ringR' | 'ringWidth'> = {
  gap: 18, outerWidth: 21,  // gap=18 per Thought Master, outerWidth locked
  fontSize: 12, letterSpacing: 3, borderWidth: 1.5, textSpan: 60,
  wisdomAngle: -90, connectionAngle: 160, harmonyAngle: 20,
};

function c(overrides?: Partial<TrinityConfig>): TrinityConfig {
  return { spread: 39, ringR: 72, ringWidth: 21, ...D, ...overrides };
}

const ITERATIONS: { label: string; config: TrinityConfig }[] = [
  { label: "#1 base",              config: c() },
  { label: "#2 conn=170 harm=10",  config: c({ connectionAngle: 170, harmonyAngle: 10 }) },
  { label: "#3 conn=180 harm=0",   config: c({ connectionAngle: 180, harmonyAngle: 0 }) },
  { label: "#4 conn=150 harm=30",  config: c({ connectionAngle: 150, harmonyAngle: 30 }) },
  { label: "#5 wisdom=-80",        config: c({ wisdomAngle: -80 }) },
  { label: "#6 span=75 f=11",      config: c({ textSpan: 75, fontSize: 11 }) },
  { label: "#7 span=50 f=13",      config: c({ textSpan: 50, fontSize: 13 }) },
  { label: "#8 span=80 f=10",      config: c({ textSpan: 80, fontSize: 10, letterSpacing: 2 }) },
  { label: "#9 ls=2 f=12",         config: c({ letterSpacing: 2 }) },
  { label: "#10 ls=4 f=11",        config: c({ letterSpacing: 4, fontSize: 11 }) },
  { label: "#11 conn=165 harm=15", config: c({ connectionAngle: 165, harmonyAngle: 15, wisdomAngle: -85 }) },
  { label: "#12 best guess",       config: c({ connectionAngle: 165, harmonyAngle: 15, textSpan: 65, fontSize: 11, letterSpacing: 3 }) },
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
          #3 Very Tight — 12 Equal-Delta Iterations
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Son (top) → Mother Aset (BR) → Father Asar (BL)
        </p>
        <p className="text-[9px] text-muted-foreground/50 mt-0.5">
          Asar over Aset · Parents over Son · Unity width = Gap = Ring width (all equal)
        </p>
        <p className="text-[9px] text-muted-foreground/50">
          Bottom text inverted (right-side up) · outerR = spread + ringR + 2×ringWidth
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
