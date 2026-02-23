"use client";

interface SeedOfLifeLogoProps {
  size?: number;
  accentColor: string;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
}

/**
 * Seed of Life — 7 equal circles (1 center + 6 surrounding at 60° intervals).
 * Each surrounding circle is placed at distance R from center, so all circles
 * pass through the center point, creating the classic overlapping petal pattern.
 */
export function SeedOfLifeLogo({
  size = 56,
  accentColor,
  className,
  onClick,
  animate = false,
}: SeedOfLifeLogoProps) {
  const cx = 50;
  const cy = 50;
  const R = 20;

  // 6 surrounding circle centers at 60° intervals
  const surroundingCircles = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 * Math.PI) / 180;
    return {
      x: cx + R * Math.cos(angle),
      y: cy + R * Math.sin(angle),
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${animate ? "flower-bloom" : ""} ${className ?? ""}`}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : undefined }}
    >
      {/* Center circle — filled with low-alpha accent */}
      <circle
        cx={cx}
        cy={cy}
        r={R}
        fill={`${accentColor}15`}
        stroke={accentColor}
        strokeWidth={1.5}
        strokeOpacity={0.9}
      />
      {/* 6 surrounding circles */}
      {surroundingCircles.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={R}
          fill="none"
          stroke={accentColor}
          strokeWidth={1.5}
          strokeOpacity={0.6 + i * 0.05}
        />
      ))}
    </svg>
  );
}
