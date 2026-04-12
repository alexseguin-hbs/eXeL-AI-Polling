"use client";

/**
 * SoI Trinity — Three overlapping rings with curved text.
 *
 * Structure (from reference images):
 *   - Outer containing circle (thick stroke)
 *   - 3 overlapping circles in Borromean/trefoil arrangement:
 *     - Top:          H.I. (Human Intelligence)        / configurable
 *     - Bottom-Left:  A.I. (Artificial Intelligence)   / configurable
 *     - Bottom-Right: S.I. (Shared Intent)             / configurable
 *   - Each circle has inner ring + outer ring
 *   - Curved text flows between inner and outer ring of each circle
 *   - Vesica Piscis intersection at center
 *
 * Props:
 *   labels: [topText, bottomLeftText, bottomRightText]
 *   size: SVG dimension (default 400)
 *   color: stroke/fill color (default currentColor)
 *   textColor: curved text color (default white)
 */

import { useId } from "react";

interface SoITrinityProps {
  labels?: [string, string, string];
  size?: number;
  color?: string;
  textColor?: string;
  strokeWidth?: number;
  className?: string;
  onClick?: () => void;
}

export function SoITrinity({
  labels = ["H.I.", "A.I.", "S.I."],
  size = 400,
  color = "currentColor",
  textColor = "white",
  strokeWidth = 12,
  className = "",
  onClick,
}: SoITrinityProps) {
  const id = useId().replace(/:/g, "");

  // Geometry
  const cx = 200; // Center of viewBox
  const cy = 200;
  const outerR = 180; // Outer containing circle
  const outerInnerR = 165; // Inner edge of outer containing circle

  // Ring circles — trefoil arrangement
  const ringR = 68; // Outer radius of each ring circle
  const ringInnerR = 52; // Inner radius of each ring circle
  const textR = (ringR + ringInnerR) / 2; // Midpoint for text path
  const spread = 72; // Distance from center to each ring center

  // Circle centers (top, bottom-left, bottom-right)
  const rings = [
    { cx: cx, cy: cy - spread, label: labels[0] },              // Top
    { cx: cx - spread * 0.866, cy: cy + spread * 0.5, label: labels[1] }, // Bottom-left
    { cx: cx + spread * 0.866, cy: cy + spread * 0.5, label: labels[2] }, // Bottom-right
  ];

  // Curved text needs arc paths for textPath
  // For top circle: text curves along the top arc
  // For bottom circles: text curves along the bottom arc

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
        {/* Text paths — arcs between inner and outer ring of each circle */}
        {rings.map((ring, i) => {
          // Create circular arc path at textR radius from ring center
          // Top ring: text on top half (sweeps clockwise from left to right)
          // Bottom rings: text on bottom half
          const isTop = i === 0;
          const arcCx = ring.cx;
          const arcCy = ring.cy;

          if (isTop) {
            // Top arc: start at left, sweep clockwise to right
            return (
              <path
                key={`path-${i}`}
                id={`${id}-ring-${i}`}
                d={`M ${arcCx - textR} ${arcCy} A ${textR} ${textR} 0 0 1 ${arcCx + textR} ${arcCy}`}
                fill="none"
              />
            );
          } else {
            // Bottom arcs: start at right, sweep clockwise to left (text reads left-to-right on bottom)
            return (
              <path
                key={`path-${i}`}
                id={`${id}-ring-${i}`}
                d={`M ${arcCx - textR} ${arcCy} A ${textR} ${textR} 0 0 0 ${arcCx + textR} ${arcCy}`}
                fill="none"
              />
            );
          }
        })}
      </defs>

      {/* Outer containing circle — double ring */}
      <circle
        cx={cx} cy={cy} r={outerR}
        fill="none" stroke={color} strokeWidth={strokeWidth}
      />
      <circle
        cx={cx} cy={cy} r={outerInnerR}
        fill="none" stroke={color} strokeWidth={2}
      />

      {/* Three overlapping ring circles */}
      {rings.map((ring, i) => (
        <g key={`ring-${i}`}>
          {/* Outer ring */}
          <circle
            cx={ring.cx} cy={ring.cy} r={ringR}
            fill={color} fillOpacity={0.9}
            stroke={color} strokeWidth={2}
          />
          {/* Inner ring (creates the "band" between inner and outer) */}
          <circle
            cx={ring.cx} cy={ring.cy} r={ringInnerR}
            fill="none"
            stroke={textColor} strokeWidth={1.5} strokeOpacity={0.3}
          />
        </g>
      ))}

      {/* Vesica Piscis center — intersection highlight */}
      <circle
        cx={cx} cy={cy + 6} r={18}
        fill={color} fillOpacity={0.95}
      />

      {/* Curved text labels */}
      {rings.map((ring, i) => (
        <text
          key={`text-${i}`}
          fill={textColor}
          fontSize={14}
          fontWeight="bold"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="2"
        >
          <textPath
            href={`#${id}-ring-${i}`}
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
