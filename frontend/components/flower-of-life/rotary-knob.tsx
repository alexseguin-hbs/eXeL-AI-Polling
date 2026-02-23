"use client";

import { useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RotaryKnobProps {
  level: 3 | 6 | 9;
  onChange: (level: 3 | 6 | 9) => void;
  disabled?: boolean;
  accentColor?: string;
}

const LEVELS: (3 | 6 | 9)[] = [3, 6, 9];
/** Angle positions in degrees for the indicator dot: 3→8 o'clock, 6→12 o'clock, 9→4 o'clock */
const LEVEL_ANGLES: Record<number, number> = { 3: 240, 6: 0, 9: 120 };

export function RotaryKnob({
  level,
  onChange,
  disabled,
  accentColor = "#00E5CC",
}: RotaryKnobProps) {
  const size = 80;
  const center = size / 2;
  const outerR = 34;
  const innerR = 22;
  const dotR = 5;
  const detentR = 4;
  const detentDistance = outerR + 2;

  const indicatorAngle = LEVEL_ANGLES[level];
  const currentIndex = LEVELS.indexOf(level);

  const handleStep = useCallback(
    (direction: 1 | -1) => {
      if (disabled) return;
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= LEVELS.length) return;
      onChange(LEVELS[nextIndex]);
    },
    [disabled, currentIndex, onChange]
  );

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-2">
        {/* Step left (counter-clockwise) */}
        <button
          onClick={() => handleStep(-1)}
          disabled={disabled || currentIndex === 0}
          className="rounded-full p-1 transition-colors hover:bg-accent/50 disabled:opacity-30 disabled:cursor-default"
          aria-label="Previous level"
        >
          <ChevronLeft className="h-4 w-4" style={{ color: accentColor }} />
        </button>

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="select-none"
        >
          {/* Outer track ring */}
          <circle
            cx={center}
            cy={center}
            r={outerR}
            fill="none"
            stroke="hsl(183, 33%, 17%)"
            strokeWidth={2}
          />

          {/* Inner filled circle */}
          <circle
            cx={center}
            cy={center}
            r={innerR}
            fill="hsl(183, 30%, 9%)"
            stroke="hsl(183, 33%, 17%)"
            strokeWidth={1.5}
          />

          {/* Current level number in center */}
          <text
            x={center}
            y={center + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fill={accentColor}
            fontSize="16"
            fontWeight="800"
            fontFamily="monospace"
          >
            {level}
          </text>

          {/* Detent dots (visual indicators, no click-to-jump) */}
          {LEVELS.map((l) => {
            const deg = LEVEL_ANGLES[l];
            const rad = (deg * Math.PI) / 180;
            const dx = center + detentDistance * Math.cos(rad - Math.PI / 2);
            const dy = center + detentDistance * Math.sin(rad - Math.PI / 2);
            const isActive = l === level;

            return (
              <g key={l}>
                <circle
                  cx={dx}
                  cy={dy}
                  r={detentR}
                  fill={isActive ? accentColor : "hsl(183, 33%, 25%)"}
                  stroke={isActive ? accentColor : "hsl(183, 33%, 17%)"}
                  strokeWidth={1}
                />
                {/* Label next to detent */}
                <text
                  x={dx + (deg === 0 ? 0 : deg === 240 ? -10 : 10)}
                  y={dy + (deg === 0 ? -10 : 14)}
                  textAnchor="middle"
                  fill="hsl(183, 11%, 64%)"
                  fontSize="9"
                  fontWeight="600"
                >
                  {l}
                </text>
              </g>
            );
          })}

          {/* Rotating indicator dot */}
          <g
            style={{
              transform: `rotate(${indicatorAngle}deg)`,
              transformOrigin: `${center}px ${center}px`,
              transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <circle
              cx={center}
              cy={center - innerR + dotR + 2}
              r={dotR}
              fill={accentColor}
            />
          </g>
        </svg>

        {/* Step right (clockwise) */}
        <button
          onClick={() => handleStep(1)}
          disabled={disabled || currentIndex === LEVELS.length - 1}
          className="rounded-full p-1 transition-colors hover:bg-accent/50 disabled:opacity-30 disabled:cursor-default"
          aria-label="Next level"
        >
          <ChevronRight className="h-4 w-4" style={{ color: accentColor }} />
        </button>
      </div>
      <span
        className="text-xs font-medium"
        style={{ color: "hsl(183, 11%, 64%)" }}
      >
        Theme Level
      </span>
    </div>
  );
}
