"use client";

/**
 * API Flower of Life — 9 SDK functions as 3 families of 3.
 *
 * Grouping:
 *   Family 1 (◬ Cyan — Understanding):  #1 compress → #1.2 detect → #1.3 challenge
 *   Family 2 (♡ Yellow — Governance):    #2 vote → #2.2 consensus → #2.3 override
 *   Family 3 (웃 Violet — Value):        #3 convert → #3.2 verify → #3.3 broadcast
 *
 * Level 3: Shows #1, #2, #3 (parents only)
 * Level 6: Shows #1, #1.2, #2, #2.2, #3, #3.2
 * Level 9: Shows all — full bloom
 *
 * SDK name shown below each circle.
 */

import { useState, useMemo } from "react";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
import {
  getTheme2Positions,
  getHubPosition,
} from "@/lib/flower-geometry";
import type { ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";

// ── 3 Families of 3 ────────────────────────────────────────────

interface SDKEntry {
  id: string;
  family: 1 | 2 | 3;
  number: string;      // "#1", "#1.2", "#1.3"
  name: string;        // "compress"
  icon: string;
  tagline: string;
  cost: string;
  theme: ThemeInfo;
  color: { fill: string; stroke: string };
}

// Same colors as Theme Analysis: Red (top), Emerald (bottom-left), Ocean Blue (bottom-right)
const FAMILY_COLORS = {
  1: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },         // Red — top
  2: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },      // Emerald — bottom-left
  3: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },      // Ocean Blue — bottom-right
};

// Ordered for each level: parents first, then children interleaved
const ALL_SDK: SDKEntry[] = [
  // === Level 3: Parents ===
  { id: "compress", family: 1, number: "#1", name: "compress", icon: "🧠", tagline: "Understand anything", cost: "5◬/1K",
    theme: { label: "🧠 compress", count: 5, avgConfidence: 0.95, summary33: "Any text → 9→6→3 themes" },
    color: FAMILY_COLORS[1] },
  { id: "vote", family: 2, number: "#2", name: "vote", icon: "🗳️", tagline: "Govern fairly", cost: "0.01◬",
    theme: { label: "🗳️ vote", count: 0.01, avgConfidence: 0.92, summary33: "Quadratic governance" },
    color: FAMILY_COLORS[2] },
  { id: "convert", family: 3, number: "#3", name: "convert", icon: "웃", tagline: "Value human time", cost: "Free",
    theme: { label: "웃 convert", count: 0, avgConfidence: 0.88, summary33: "$ → 웃 tokens" },
    color: FAMILY_COLORS[3] },

  // === Level 6: +Children .2 ===
  { id: "detect", family: 1, number: "#1.2", name: "detect", icon: "🛡️", tagline: "Clean before counting", cost: "1◬",
    theme: { label: "🛡️ detect", count: 1, avgConfidence: 0.90, summary33: "Anomaly exclusion" },
    color: FAMILY_COLORS[1] },
  { id: "consensus", family: 2, number: "#2.2", name: "consensus", icon: "📊", tagline: "Watch agreement form", cost: "0.5◬",
    theme: { label: "📊 consensus", count: 0.5, avgConfidence: 0.87, summary33: "Live convergence" },
    color: FAMILY_COLORS[2] },
  { id: "verify", family: 3, number: "#3.2", name: "verify", icon: "🔐", tagline: "Prove it's real", cost: "Free",
    theme: { label: "🔐 verify", count: 0, avgConfidence: 0.93, summary33: "SHA-256 proof" },
    color: FAMILY_COLORS[3] },

  // === Level 9: +Children .3 ===
  { id: "challenge", family: 1, number: "#1.3", name: "challenge", icon: "⚡", tagline: "Build the future", cost: "10◬",
    theme: { label: "⚡ challenge", count: 10, avgConfidence: 0.85, summary33: "Self-evolving code" },
    color: FAMILY_COLORS[1] },
  { id: "override", family: 2, number: "#2.3", name: "override", icon: "⚖️", tagline: "Lead transparently", cost: "2◬",
    theme: { label: "⚖️ override", count: 2, avgConfidence: 0.82, summary33: "Transparent authority" },
    color: FAMILY_COLORS[2] },
  { id: "broadcast", family: 3, number: "#3.3", name: "broadcast", icon: "📡", tagline: "Reach everyone", cost: "1◬/10K",
    theme: { label: "📡 broadcast", count: 1, avgConfidence: 0.91, summary33: "1M+ instantly" },
    color: FAMILY_COLORS[3] },
];

interface ApiFlowerProps {
  onSelectFunction?: (id: string) => void;
}

export function ApiFlower({ onSelectFunction }: ApiFlowerProps) {
  const [level, setLevel] = useState<3 | 6 | 9>(3);
  const [selectedFamily, setSelectedFamily] = useState<1 | 2 | 3 | null>(null);
  const [selectedSdk, setSelectedSdk] = useState<string | null>(null);

  // When a circle is clicked at level 3: zoom into that family
  // When a circle is clicked at level 6/9: show detail card
  const handleCircleClick = (sdk: SDKEntry) => {
    if (level === 3) {
      // Zoom into family: show its 3 members
      setSelectedFamily(sdk.family);
      setLevel(9); // Show all so family members are visible
      setSelectedSdk(null);
    } else if (selectedFamily && sdk.family === selectedFamily) {
      // Already in family view — show individual detail
      setSelectedSdk(selectedSdk === sdk.id ? null : sdk.id);
      onSelectFunction?.(sdk.id);
    } else {
      // Clicked different family — switch
      setSelectedFamily(sdk.family);
      setSelectedSdk(null);
    }
  };

  const handleBack = () => {
    if (selectedSdk) {
      setSelectedSdk(null);
    } else if (selectedFamily) {
      setSelectedFamily(null);
      setLevel(3);
    }
  };

  const hub = getHubPosition();
  const positions = useMemo(() => getTheme2Positions(level), [level]);
  const visible = ALL_SDK.slice(0, level);

  return (
    <div className="w-full">
      {/* Level Selector */}
      <div className="flex items-center justify-center gap-3 mb-4">
        {([3, 6, 9] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-4 py-1.5 text-xs rounded-full transition-all ${
              level === l
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {l === 3 ? "3 — Core" : l === 6 ? "6 — Expand" : "9 — Full Bloom"}
          </button>
        ))}
      </div>

      {/* SVG Flower */}
      <svg
        viewBox="0 0 600 540"
        className="w-full max-w-lg mx-auto"
        style={{ overflow: "visible" }}
      >
        {/* Connecting lines */}
        {positions.map((pos, i) => {
          if (i >= visible.length) return null;
          return (
            <line
              key={`line-${i}`}
              x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
              stroke={visible[i].color.stroke} strokeOpacity={0.15} strokeWidth={1.5}
            />
          );
        })}

        {/* Family connection lines (parent → children) */}
        {level >= 6 && positions.length >= 6 && (
          <>
            {/* Family 1: #1 → #1.2 */}
            <line x1={positions[0].cx} y1={positions[0].cy} x2={positions[3].cx} y2={positions[3].cy}
              stroke={FAMILY_COLORS[1].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
            {/* Family 2: #2 → #2.2 */}
            <line x1={positions[1].cx} y1={positions[1].cy} x2={positions[4].cx} y2={positions[4].cy}
              stroke={FAMILY_COLORS[2].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
            {/* Family 3: #3 → #3.2 */}
            <line x1={positions[2].cx} y1={positions[2].cy} x2={positions[5].cx} y2={positions[5].cy}
              stroke={FAMILY_COLORS[3].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
          </>
        )}
        {level >= 9 && positions.length >= 9 && (
          <>
            {/* Family 1: #1 → #1.3 */}
            <line x1={positions[0].cx} y1={positions[0].cy} x2={positions[6].cx} y2={positions[6].cy}
              stroke={FAMILY_COLORS[1].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
            {/* Family 2: #2 → #2.3 */}
            <line x1={positions[1].cx} y1={positions[1].cy} x2={positions[7].cx} y2={positions[7].cy}
              stroke={FAMILY_COLORS[2].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
            {/* Family 3: #3 → #3.3 */}
            <line x1={positions[2].cx} y1={positions[2].cy} x2={positions[8].cx} y2={positions[8].cy}
              stroke={FAMILY_COLORS[3].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
          </>
        )}

        {/* Hub */}
        <ThemeCircle
          cx={hub.cx} cy={hub.cy} r={hub.r}
          theme={{ label: "eXeL", count: level, avgConfidence: 1.0, summary33: "SDK" }}
          fill="rgba(var(--primary), 0.1)"
          stroke="hsl(var(--primary))"
          isHub
        />

        {/* SDK circles + name labels */}
        {positions.map((pos, i) => {
          if (i >= visible.length) return null;
          const sdk = visible[i];
          return (
            <g key={sdk.id}>
              <ThemeCircle
                cx={pos.cx} cy={pos.cy} r={pos.r}
                theme={sdk.theme}
                fill={selectedFamily && sdk.family !== selectedFamily ? "rgba(128,128,128,0.05)" : sdk.color.fill}
                stroke={selectedFamily && sdk.family !== selectedFamily ? "#555" : sdk.color.stroke}
                bloom bloomDelay={i * 120}
                onClick={() => handleCircleClick(sdk)}
                className={selectedSdk === sdk.id ? "ring-2 ring-primary" : ""}
              />
              {/* SDK name below circle */}
              <text
                x={pos.cx}
                y={pos.cy + pos.r + 14}
                textAnchor="middle"
                className="fill-muted-foreground"
                fontSize={10}
                fontFamily="monospace"
              >
                {sdk.number} {sdk.name}
              </text>
              {/* Cost badge */}
              <text
                x={pos.cx}
                y={pos.cy + pos.r + 26}
                textAnchor="middle"
                fontSize={8}
                className="fill-primary"
                opacity={0.6}
              >
                {sdk.cost}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Back button */}
      {(selectedFamily || selectedSdk) && (
        <div className="flex justify-center mt-2">
          <button
            onClick={handleBack}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            ← {selectedSdk ? "Back to family" : "Back to overview"}
          </button>
        </div>
      )}

      {/* Selected SDK detail card */}
      {selectedSdk && (() => {
        const sdk = ALL_SDK.find((s) => s.id === selectedSdk);
        if (!sdk) return null;
        return (
          <div className="mt-4 rounded-xl border bg-card p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{sdk.icon}</span>
              <div>
                <p className="font-semibold">sdk.{sdk.name}()</p>
                <p className="text-xs text-muted-foreground">{sdk.tagline}</p>
              </div>
              <span className="ml-auto text-xs text-primary font-mono">{sdk.cost}</span>
            </div>
            <p className="text-sm text-foreground/70">{sdk.number} — {sdk.theme.summary33}</p>
          </div>
        );
      })()}

      {/* Legend — matches Theme Analysis colors */}
      <div className="flex justify-center gap-6 mt-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#FF0000" }} />
          Understanding
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#10B981" }} />
          Governance
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
          Value
        </span>
      </div>
    </div>
  );
}
