"use client";

interface SeedOfLifeLogoProps {
  size?: number;
  accentColor: string;
  className?: string;
  onClick?: () => void;
  animate?: boolean;
  /** Audio intensity 0.0–1.0 from analyser — drives glow/scale/opacity */
  audioIntensity?: number;
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
  audioIntensity = 0,
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

  // Audio-reactive values (only when intensity > 0)
  const glowRadius = 4 + audioIntensity * 16;
  const scale = 1.0 + audioIntensity * 0.06;
  const strokeBoost = audioIntensity * 0.4;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`${animate ? "flower-bloom" : ""} ${className ?? ""}`}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : undefined,
        filter:
          audioIntensity > 0
            ? `drop-shadow(0 0 ${glowRadius}px ${accentColor})`
            : undefined,
        transform: audioIntensity > 0 ? `scale(${scale})` : undefined,
        transition: "filter 0.05s, transform 0.05s",
      }}
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
          strokeOpacity={Math.min(1, 0.6 + i * 0.05 + strokeBoost)}
        />
      ))}
    </svg>
  );
}
