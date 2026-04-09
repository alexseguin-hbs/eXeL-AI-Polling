"use client";

/**
 * API Flower of Life — The 9 SDK functions visualized as a Flower of Life.
 *
 * Reuses the SAME geometry + ThemeCircle components as the Theme Analysis
 * visualization on the dashboard. 3→6→9 progressive discovery:
 *
 *   3 Core: compress, vote, convert (the trinity)
 *   6 Expansion: + detect, consensus, verify
 *   9 Full Bloom: + challenge, override, broadcast
 *
 * Each circle is clickable → navigates to function detail.
 */

import { useState, useMemo } from "react";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
import { RotaryKnob } from "@/components/flower-of-life/rotary-knob";
import {
  getTheme2Positions,
  getHubPosition,
} from "@/lib/flower-geometry";
import type { ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";

// ── SDK Functions mapped to Flower of Life positions ────────────

// Level 3: The Trinity (core — most essential)
const SDK_3: ThemeInfo[] = [
  { label: "🧠 compress()", count: 5, avgConfidence: 0.95, summary33: "Any text → 9→6→3 themes" },
  { label: "🗳️ vote()", count: 0.01, avgConfidence: 0.92, summary33: "Quadratic governance at scale" },
  { label: "웃 convert()", count: 0, avgConfidence: 0.88, summary33: "$ → 웃 tokens (value time)" },
];

// Level 6: +3 Intelligence Layer
const SDK_6: ThemeInfo[] = [
  ...SDK_3,
  { label: "🛡️ detect()", count: 1, avgConfidence: 0.90, summary33: "Anomaly exclusion pipeline" },
  { label: "📊 consensus()", count: 0.5, avgConfidence: 0.87, summary33: "Live convergence score" },
  { label: "🔐 verify()", count: 0, avgConfidence: 0.93, summary33: "SHA-256 determinism proof" },
];

// Level 9: Full Bloom — The Complete Engine
const SDK_9: ThemeInfo[] = [
  ...SDK_6,
  { label: "⚡ challenge()", count: 10, avgConfidence: 0.85, summary33: "Self-evolving code system" },
  { label: "⚖️ override()", count: 2, avgConfidence: 0.82, summary33: "Transparent authority" },
  { label: "📡 broadcast()", count: 1, avgConfidence: 0.91, summary33: "Reach 1M+ instantly" },
];

// Colors for each partition (reuse Theme01 pattern)
const SDK_COLORS = {
  core: { fill: "rgba(0, 255, 255, 0.15)", stroke: "#00FFFF" },      // Cyan — AI
  intelligence: { fill: "rgba(255, 255, 0, 0.15)", stroke: "#FFFF00" }, // Yellow — SI
  evolution: { fill: "rgba(255, 0, 255, 0.15)", stroke: "#FF00FF" },   // Violet — HI
};

function getColorForIndex(index: number, level: number) {
  if (level === 3) return SDK_COLORS.core;
  if (index < 3) return SDK_COLORS.core;
  if (index < 6) return SDK_COLORS.intelligence;
  return SDK_COLORS.evolution;
}

// ── Component ───────────────────────────────────────────────────

interface ApiFlowerProps {
  onSelectFunction?: (label: string) => void;
}

export function ApiFlower({ onSelectFunction }: ApiFlowerProps) {
  const [level, setLevel] = useState<3 | 6 | 9>(3);

  const hub = getHubPosition();
  const positions = useMemo(() => getTheme2Positions(level), [level]);
  const sdkFunctions = level === 3 ? SDK_3 : level === 6 ? SDK_6 : SDK_9;

  return (
    <div className="w-full">
      {/* Level Selector — same RotaryKnob as Theme Analysis */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="text-xs text-muted-foreground">Explore:</span>
        <div className="flex gap-1">
          {([3, 6, 9] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                level === l
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {l === 3 ? "3 Core" : l === 6 ? "6 Intelligence" : "9 Full Bloom"}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Flower of Life */}
      <svg
        viewBox="0 0 600 500"
        className="w-full max-w-lg mx-auto"
        style={{ overflow: "visible" }}
      >
        {/* Connecting lines from hub to each circle */}
        {positions.map((pos, i) => (
          <line
            key={`line-${i}`}
            x1={hub.cx}
            y1={hub.cy}
            x2={pos.cx}
            y2={pos.cy}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        ))}

        {/* Hub circle — eXeL logo position */}
        <ThemeCircle
          cx={hub.cx}
          cy={hub.cy}
          r={hub.r}
          theme={{
            label: "eXeL SDK",
            count: level,
            avgConfidence: 1.0,
            summary33: "Governance Engine",
          }}
          fill="rgba(var(--primary), 0.1)"
          stroke="hsl(var(--primary))"
          isHub
        />

        {/* SDK Function circles */}
        {positions.map((pos, i) => {
          if (i >= sdkFunctions.length) return null;
          const fn = sdkFunctions[i];
          const colors = getColorForIndex(i, level);
          return (
            <ThemeCircle
              key={`sdk-${i}`}
              cx={pos.cx}
              cy={pos.cy}
              r={pos.r}
              theme={fn}
              fill={colors.fill}
              stroke={colors.stroke}
              bloom
              bloomDelay={i * 100}
              onClick={() => onSelectFunction?.(fn.label)}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#00FFFF" }} />
          ◬ Core (AI)
        </span>
        {level >= 6 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FFFF00" }} />
            ♡ Intelligence (SI)
          </span>
        )}
        {level >= 9 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FF00FF" }} />
            웃 Evolution (HI)
          </span>
        )}
      </div>
    </div>
  );
}
