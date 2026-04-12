"use client";

/**
 * SoI Trinity — Three Borromean rings with curved text.
 *
 * Matches the original Trinity_Logo.jpg exactly:
 *   1. Outer container: thick ring (annulus)
 *   2. Three overlapping rings in trefoil arrangement
 *   3. Borromean interlock: rings weave over/under each other
 *   4. Centers are transparent (background shows through)
 *   5. Consistent ring width across all circles
 *   6. Curved text in the ring band (labeled variations)
 *
 * The Borromean weave is achieved by drawing each ring in 3 layers:
 *   Layer 1: Bottom ring (full)
 *   Layer 2: Middle ring (clips over bottom)
 *   Layer 3: Top ring (clips over middle, but bottom clips over top)
 */

import { useId } from "react";

interface SoITrinityProps {
  labels?: [string, string, string];
  size?: number;
  color?: string;
  bgColor?: string;
  textColor?: string;
  ringWidth?: number;
  className?: string;
  onClick?: () => void;
}

export function SoITrinity({
  labels = ["H.I.", "A.I.", "S.I."],
  size = 400,
  color = "currentColor",
  bgColor = "transparent",
  textColor = "white",
  ringWidth = 16,
  className = "",
  onClick,
}: SoITrinityProps) {
  const uid = useId().replace(/:/g, "");

  const cx = 200;
  const cy = 200;

  // Outer container ring
  const outerR = 185;
  const outerInnerR = outerR - ringWidth;

  // Three inner rings — trefoil arrangement
  const ringR = 70; // Outer edge radius
  const ringMidR = ringR - ringWidth / 2; // Center of ring band (for stroke)
  const spread = 68; // Distance from center to each ring center

  // Ring centers: top, bottom-left, bottom-right
  const rings = [
    { cx: cx, cy: cy - spread, label: labels[0] },
    { cx: cx - spread * 0.866, cy: cy + spread * 0.5, label: labels[1] },
    { cx: cx + spread * 0.866, cy: cy + spread * 0.5, label: labels[2] },
  ];

  // Text path radius (middle of ring band)
  const textR = ringMidR;

  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      className={className}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      <defs>
        {/* Clip paths to create Borromean weave */}
        {/* Ring 0 (top) is clipped by ring 2 (bottom-right) — ring 2 passes OVER ring 0 at bottom-right intersection */}
        <clipPath id={`${uid}-clip0`}>
          <rect x="0" y="0" width="400" height="400" />
          {/* Cut out where ring 2 passes over ring 0 */}
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR + 1} fill="black" />
        </clipPath>

        {/* Ring 1 (bottom-left) is clipped by ring 0 (top) */}
        <clipPath id={`${uid}-clip1`}>
          <rect x="0" y="0" width="400" height="400" />
          <circle cx={rings[0].cx} cy={rings[0].cy} r={ringR + 1} fill="black" />
        </clipPath>

        {/* Ring 2 (bottom-right) is clipped by ring 1 (bottom-left) */}
        <clipPath id={`${uid}-clip2`}>
          <rect x="0" y="0" width="400" height="400" />
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringR + 1} fill="black" />
        </clipPath>

        {/* Text paths */}
        {rings.map((ring, i) => {
          const isTop = i === 0;
          return (
            <path
              key={`path-${i}`}
              id={`${uid}-text-${i}`}
              d={isTop
                ? `M ${ring.cx - textR} ${ring.cy} A ${textR} ${textR} 0 0 1 ${ring.cx + textR} ${ring.cy}`
                : `M ${ring.cx - textR} ${ring.cy} A ${textR} ${textR} 0 0 0 ${ring.cx + textR} ${ring.cy}`
              }
              fill="none"
            />
          );
        })}
      </defs>

      {/* Outer container ring */}
      <circle cx={cx} cy={cy} r={outerR} fill="none" stroke={color} strokeWidth={ringWidth} />
      <circle cx={cx} cy={cy} r={outerInnerR} fill="none" stroke={color} strokeWidth={1} />

      {/*
        Borromean weave — 6-layer rendering:
        Each ring is drawn twice:
          1. Full ring (background layer)
          2. Clipped ring (foreground — creates the "over" illusion)

        Weave pattern (circular chase):
          Ring 0 (top)          goes OVER ring 1 (bottom-left)
          Ring 1 (bottom-left)  goes OVER ring 2 (bottom-right)
          Ring 2 (bottom-right) goes OVER ring 0 (top)
      */}

      {/* Layer 1: All three rings (background — will be partially hidden) */}
      {rings.map((ring, i) => (
        <circle
          key={`bg-${i}`}
          cx={ring.cx} cy={ring.cy} r={ringMidR}
          fill="none" stroke={color} strokeWidth={ringWidth}
        />
      ))}

      {/* Layer 2: Background-colored arcs to create the "under" effect */}
      {/* Ring 0 passes UNDER ring 2 at their intersection */}
      {/* We draw a background-colored arc over ring 0 where ring 2 crosses it */}

      {/* Erase ring 0 where ring 2 crosses over it */}
      <g>
        <clipPath id={`${uid}-inter02`}>
          <circle cx={rings[2].cx} cy={rings[2].cy} r={ringR + 2} />
        </clipPath>
        <circle
          cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
          fill="none" stroke={bgColor === "transparent" ? "var(--background, #000)" : bgColor}
          strokeWidth={ringWidth + 2}
          clipPath={`url(#${uid}-inter02)`}
        />
        {/* Redraw ring 2 over the erased area */}
        <circle
          cx={rings[2].cx} cy={rings[2].cy} r={ringMidR}
          fill="none" stroke={color} strokeWidth={ringWidth}
          clipPath={`url(#${uid}-inter02)`}
        />
      </g>

      {/* Erase ring 1 where ring 0 crosses over it */}
      <g>
        <clipPath id={`${uid}-inter10`}>
          <circle cx={rings[0].cx} cy={rings[0].cy} r={ringR + 2} />
        </clipPath>
        <circle
          cx={rings[1].cx} cy={rings[1].cy} r={ringMidR}
          fill="none" stroke={bgColor === "transparent" ? "var(--background, #000)" : bgColor}
          strokeWidth={ringWidth + 2}
          clipPath={`url(#${uid}-inter10)`}
        />
        <circle
          cx={rings[0].cx} cy={rings[0].cy} r={ringMidR}
          fill="none" stroke={color} strokeWidth={ringWidth}
          clipPath={`url(#${uid}-inter10)`}
        />
      </g>

      {/* Erase ring 2 where ring 1 crosses over it */}
      <g>
        <clipPath id={`${uid}-inter21`}>
          <circle cx={rings[1].cx} cy={rings[1].cy} r={ringR + 2} />
        </clipPath>
        <circle
          cx={rings[2].cx} cy={rings[2].cy} r={ringMidR}
          fill="none" stroke={bgColor === "transparent" ? "var(--background, #000)" : bgColor}
          strokeWidth={ringWidth + 2}
          clipPath={`url(#${uid}-inter21)`}
        />
        <circle
          cx={rings[1].cx} cy={rings[1].cy} r={ringMidR}
          fill="none" stroke={color} strokeWidth={ringWidth}
          clipPath={`url(#${uid}-inter21)`}
        />
      </g>

      {/* Curved text labels */}
      {rings.map((ring, i) => (
        <text
          key={`text-${i}`}
          fill={textColor}
          fontSize={13}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="3"
        >
          <textPath
            href={`#${uid}-text-${i}`}
            startOffset="50%"
            textAnchor="middle"
          >
            {ring.label}
          </textPath>
        </text>
      ))}
    </svg>
  );
}
