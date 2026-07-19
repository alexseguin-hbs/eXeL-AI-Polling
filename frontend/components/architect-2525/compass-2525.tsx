"use client";

/**
 * COMPASS-2525 — the shared Vision-2525 compass rose, identical to Security-2525 Mission-Planning
 * (mission-planning.tsx:3831): a ringed rose with a RED north arrow + dim south, N·E·S·W ticks, that rotates
 * with the current bearing; click snaps north-up. One component so every 2525 surface shows the SAME compass
 * (operator: "reuse same compass as Mission Planning"). Bearing is in RADIANS.
 */
import type { CSSProperties } from "react";

const C = { border: "#1e2b3a", dim: "#5f7186", red: "#f87171", cyan: "#19c8cf" };

export function Compass2525({ bearing, onNorth, size = 34, className, style }: {
  bearing: number; onNorth?: () => void; size?: number; className?: string; style?: CSSProperties;
}) {
  const deg = ((-bearing * 180) / Math.PI % 360 + 360) % 360;
  return (
    <button type="button" data-arch-compass onClick={onNorth} title="Snap north-up"
      className={className} style={{ background: "#0a0f16cc", borderRadius: 9999, lineHeight: 0, ...style }}>
      <svg width={size} height={size} viewBox="-23 -23 46 46" aria-label="Compass">
        <circle r="21" fill="none" stroke={C.border} strokeWidth="1" />
        <g transform={`rotate(${(bearing * 180 / Math.PI).toFixed(1)})`}>
          <path d="M0 -18 L4.5 -4 L0 -7 L-4.5 -4 Z" fill={C.red} />
          <path d="M0 18 L3 6 L0 8 L-3 6 Z" fill={C.dim} />
          <text x="0" y="-9" fontSize="6" fill={C.red} textAnchor="middle" fontWeight="bold">N</text>
          <text x="14.5" y="2" fontSize="5" fill={C.dim} textAnchor="middle">E</text>
          <text x="0" y="15" fontSize="5" fill={C.dim} textAnchor="middle">S</text>
          <text x="-14.5" y="2" fontSize="5" fill={C.dim} textAnchor="middle">W</text>
        </g>
      </svg>
      <span className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 font-mono text-[7px]" style={{ color: C.cyan }}>
        {String(Math.round(deg)).padStart(3, "0")}°
      </span>
    </button>
  );
}
