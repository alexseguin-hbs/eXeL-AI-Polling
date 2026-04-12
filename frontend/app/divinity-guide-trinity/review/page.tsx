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
  ringWidth: number;  // = outerWidth = gap (all three equal)
  fontSize: number;
  letterSpacing: number;
  borderWidth: number;
  textSpan: number;
}

// Derived: outerR = spread + ringR + 2 * ringWidth
function getOuterR(c: TrinityConfig): number {
  return c.spread + c.ringR + 2 * c.ringWidth;
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
  const { spread, ringR, ringWidth, fontSize, letterSpacing, borderWidth, textSpan } = config;

  const cx = 200;
  const cy = 200;
  const outerR = getOuterR(config);
  const outerWidth = ringWidth; // EQUAL to ring width and gap
  const ringMidR = ringR - ringWidth / 2;
  const ringInnerR = ringR - ringWidth;
  const textR = ringMidR;
  const bgColor = "var(--background, #0a1628)";

  // Verify the constraint
  const gap = (outerR - outerWidth) - (spread + ringR);
  // gap should equal ringWidth (and outerWidth)

  const labels = ["WISDOM", "HARMONY", "CONNECTION"];

  // Son (top), Mother Aset (BR), Father Asar (BL)
  const rings = [
    { cx: cx, cy: cy - spread, label: labels[0] },
    { cx: cx + spread * 0.866, cy: cy + spread * 0.5, label: labels[1] },
    { cx: cx - spread * 0.866, cy: cy + spread * 0.5, label: labels[2] },
  ];

  // Text at 12 o'clock (top), 4 o'clock (BR), 8 o'clock (BL)
  const textAngles = [-90, 30, 150];
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

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 400 400" className="w-full max-w-[220px]">
        <defs>
          {rings.map((ring, i) => (
            <path key={`p-${i}`} id={`${uid}-t-${i}`}
              d={makeTextArc(ring.cx, ring.cy, textAngles[i], i !== 0)}
              fill="none" />
          ))}
        </defs>

        {/* Outer Unity circle: band + black borders (width = ringWidth = gap) */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="black" strokeWidth={borderWidth} />
        <circle cx={cx} cy={cy} r={outerR - borderWidth / 2}
          fill="none" stroke={color} strokeWidth={outerWidth - borderWidth * 2} />
        <circle cx={cx} cy={cy} r={outerR - outerWidth} fill="none" stroke="black" strokeWidth={borderWidth} />

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

        {/* Curved text — top normal, bottom two inverted for right-side up */}
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
        s={spread} r={ringR} w={ringWidth} outer={outerR.toFixed(0)} gap={gap.toFixed(0)}
      </p>
    </div>
  );
}

// ── 12 Pangu v2 iterations with equal-delta constraint ─────────

function v(spread: number, ringR: number, ringWidth: number, extras?: Partial<TrinityConfig>): TrinityConfig {
  return {
    spread, ringR, ringWidth,
    fontSize: 11, letterSpacing: 2, borderWidth: 1.5, textSpan: 80,
    ...extras,
  };
}

// Base: #11 narrow text on #3 wider band
// (spread=45, ringR=72, ringWidth=21, textSpan=60, fontSize=12, letterSpacing=3)
// outerR = 45 + 72 + 2*21 = 159. Son width = gap = Unity width = 21px.
const B = { textSpan: 60, fontSize: 12, letterSpacing: 3 }; // #11 text settings
const ITERATIONS: { label: string; config: TrinityConfig }[] = [
  { label: "#1 base (#11)",        config: v(45, 72, 21, B) },
  { label: "#2 tighter",           config: v(42, 72, 21, B) },
  { label: "#3 very tight",        config: v(39, 72, 21, B) },
  { label: "#4 wider band=24",     config: v(45, 72, 24, B) },
  { label: "#5 slimmer band=18",   config: v(45, 72, 18, B) },
  { label: "#6 big rings r=76",    config: v(45, 76, 21, B) },
  { label: "#7 small rings r=68",  config: v(45, 68, 21, B) },
  { label: "#8 tight+big",         config: v(40, 76, 21, { ...B, borderWidth: 2 }) },
  { label: "#9 bold border",       config: v(45, 72, 21, { ...B, borderWidth: 2.5 }) },
  { label: "#10 font=13",          config: v(45, 72, 21, { ...B, fontSize: 13 }) },
  { label: "#11 font=11 ls=4",     config: v(45, 72, 21, { ...B, fontSize: 11, letterSpacing: 4 }) },
  { label: "#12 proportional",     config: v(43, 74, 21, { ...B, borderWidth: 1.8 }) },
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
          #11 Narrow Text — 12 Equal-Delta Iterations
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
