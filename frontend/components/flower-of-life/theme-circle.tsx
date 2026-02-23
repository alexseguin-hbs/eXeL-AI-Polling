"use client";

import type { ThemeInfo } from "@/lib/types";

export interface ThemeCircleProps {
  cx: number;
  cy: number;
  r: number;
  theme: ThemeInfo;
  fill: string;
  stroke: string;
  onClick?: () => void;
  className?: string;
  /** Animate entry with bloom effect */
  bloom?: boolean;
  bloomDelay?: number;
  /** Show as smaller hub circle */
  isHub?: boolean;
}

export function ThemeCircle({
  cx,
  cy,
  r,
  theme,
  fill,
  stroke,
  onClick,
  className = "",
  bloom,
  bloomDelay = 0,
  isHub,
}: ThemeCircleProps) {
  const fontSize = isHub ? 10 : Math.max(9, Math.min(14, r / 8));
  const countSize = isHub ? 12 : Math.max(12, Math.min(22, r / 5));
  const confSize = isHub ? 9 : Math.max(8, Math.min(12, r / 10));
  const summarySize = isHub ? 0 : r >= 80 ? Math.max(8, Math.min(10, r / 12)) : 0;

  // Text width clamped to fit inside the circle (inscribed rectangle ~r*1.4)
  const textWidth = Math.min(r * 1.5, r * 1.4);

  // Bloom animation style
  const animStyle: React.CSSProperties = bloom
    ? {
        transformOrigin: `${cx}px ${cy}px`,
        opacity: 0,
        animation: `flower-bloom 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${bloomDelay}ms forwards`,
      }
    : {};

  return (
    <g
      onClick={onClick}
      className={`${onClick ? "flower-circle-interactive" : ""} ${className}`}
      style={{ color: stroke, ...animStyle }}
    >
      {/* Glow ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r + 2}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeOpacity={0.15}
        className="flower-glow"
      />

      {/* Main circle */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
      />

      {/* Text content via foreignObject */}
      <foreignObject
        x={cx - textWidth / 2}
        y={cy - r * 0.8}
        width={textWidth}
        height={r * 1.6}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "4px",
            overflow: "hidden",
            color: "hsl(210, 40%, 98%)",
          }}
        >
          {/* Theme label */}
          <div
            style={{
              fontSize: `${fontSize}px`,
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "2px",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {theme.label}
          </div>

          {/* Response count */}
          <div
            style={{
              fontSize: `${countSize}px`,
              fontWeight: 800,
              lineHeight: 1.1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {theme.count.toLocaleString()}
          </div>

          {/* Confidence */}
          <div
            style={{
              fontSize: `${confSize}px`,
              opacity: 0.7,
              marginTop: "1px",
            }}
          >
            {theme.avgConfidence}% avg
          </div>

          {/* 33-word summary (hidden on hub) */}
          {!isHub && summarySize > 0 && (
            <div
              style={{
                fontSize: `${summarySize}px`,
                opacity: 0.55,
                lineHeight: 1.3,
                marginTop: "4px",
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
              }}
            >
              {theme.summary33}
            </div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}
