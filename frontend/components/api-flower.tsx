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
import { useTheme } from "@/lib/theme-context";
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

/**
 * SDK entries stored in logical family order (not position order).
 * Position mapping handles placement per level.
 *
 * Family 1 (Red — top):       compress, detect, challenge
 * Family 2 (Emerald — BL):    vote, consensus, override
 * Family 3 (Blue — BR):       convert, verify, broadcast
 */
const SDK_BY_ID: Record<string, SDKEntry> = {
  compress:  { id: "compress",  family: 1,name: "compress",  icon: "🧠", tagline: "Understand anything",     cost: "5◬/1K",  theme: { label: "Understand Anything",      count: 0, avgConfidence: 0, summary33: "sdk.compress()" }, color: FAMILY_COLORS[1] },
  detect:    { id: "detect",    family: 1,name: "detect",    icon: "🛡️", tagline: "Clean before counting",   cost: "1◬",     theme: { label: "Clean The Data",           count: 0, avgConfidence: 0, summary33: "sdk.detect()" },   color: FAMILY_COLORS[1] },
  challenge: { id: "challenge", family: 1,name: "challenge", icon: "⚡",  tagline: "Build the future",        cost: "10◬",    theme: { label: "Build The Future",         count: 0, avgConfidence: 0, summary33: "sdk.challenge()" }, color: FAMILY_COLORS[1] },
  vote:      { id: "vote",      family: 2,name: "vote",      icon: "🗳️", tagline: "Govern fairly",           cost: "0.01◬",  theme: { label: "Govern With Fairness",     count: 0, avgConfidence: 0, summary33: "sdk.vote()" },      color: FAMILY_COLORS[2] },
  consensus: { id: "consensus", family: 2,name: "consensus", icon: "📊",  tagline: "Watch agreement form",    cost: "0.5◬",   theme: { label: "See Minds Align",          count: 0, avgConfidence: 0, summary33: "sdk.consensus()" },  color: FAMILY_COLORS[2] },
  override:  { id: "override",  family: 2,name: "override",  icon: "⚖️",  tagline: "Lead transparently",      cost: "2◬",     theme: { label: "Lead With Transparency",   count: 0, avgConfidence: 0, summary33: "sdk.override()" },   color: FAMILY_COLORS[2] },
  convert:   { id: "convert",   family: 3,name: "convert",   icon: "웃",   tagline: "Value human time",        cost: "Free",   theme: { label: "Value Human Time",         count: 0, avgConfidence: 0, summary33: "sdk.convert()" },    color: FAMILY_COLORS[3] },
  verify:    { id: "verify",    family: 3,name: "verify",    icon: "🔐",  tagline: "Prove it's real",          cost: "Free",   theme: { label: "Prove It's Real",          count: 0, avgConfidence: 0, summary33: "sdk.verify()" },     color: FAMILY_COLORS[3] },
  broadcast: { id: "broadcast", family: 3,name: "broadcast", icon: "📡",  tagline: "Reach everyone",           cost: "1◬/10K", theme: { label: "Reach Every Soul",         count: 0, avgConfidence: 0, summary33: "sdk.broadcast()" },  color: FAMILY_COLORS[3] },
};

/**
 * Position-to-SDK mapping per level.
 * Ensures families cluster geographically:
 *   Red at top, Emerald at bottom-left, Blue at bottom-right.
 *
 * Geometry (getTheme2_*Positions):
 *   3: [top, BR, BL]
 *   6: [TL, TR, R, BR, BL, L]
 *   9: [TL, TR, R, BR, BL, L, outerTop, outerBR, outerBL]
 */
const POSITION_MAP: Record<3 | 6 | 9, string[]> = {
  3: ["compress", "convert", "vote"],
  //   top=Red    BR=Blue   BL=Green
  6: [
    "compress",  // [0] TL = Red
    "detect",    // [1] TR = Red
    "convert",   // [2] R  = Blue
    "verify",    // [3] BR = Blue
    "consensus", // [4] BL = Green
    "vote",      // [5] L  = Green
  ],
  9: [
    "compress",  // [0] TL = Red
    "detect",    // [1] TR = Red
    "convert",   // [2] R  = Blue
    "verify",    // [3] BR = Blue
    "consensus", // [4] BL = Green
    "vote",      // [5] L  = Green
    "challenge", // [6] outer-Top = Red
    "broadcast", // [7] outer-BR = Blue
    "override",  // [8] outer-BL = Green
  ],
};

// Build the ordered array for a given level
function getSDKsForLevel(level: 3 | 6 | 9): SDKEntry[] {
  return POSITION_MAP[level].map((id) => SDK_BY_ID[id]);
}

interface ApiFlowerProps {
  onSelectFunction?: (id: string) => void;
}

export function ApiFlower({ onSelectFunction }: ApiFlowerProps) {
  const { currentTheme } = useTheme();
  const [level, setLevel] = useState<3 | 6 | 9>(3);
  const [selectedFamily, setSelectedFamily] = useState<1 | 2 | 3 | null>(null);
  const [selectedSdk, setSelectedSdk] = useState<string | null>(null);

  // Any click selects the function and fires callback (detail shown in parent page)
  // Level 3 also expands to 6, level 6 expands to 9
  const handleCircleClick = (sdk: SDKEntry) => {
    onSelectFunction?.(sdk.id);
    setSelectedSdk(selectedSdk === sdk.id ? null : sdk.id);
    if (level === 3) {
      setSelectedFamily(sdk.family);
      setLevel(6);
    } else if (level === 6) {
      setLevel(9);
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
  const visible = useMemo(() => getSDKsForLevel(level), [level]);

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
            {l === 3 ? "Core" : l === 6 ? "Expand" : "Full Bloom"}
          </button>
        ))}
      </div>

      {/* SVG Flower */}
      <svg
        viewBox="-20 -40 640 580"
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

        {/* Family connection lines — connect same-family circles via POSITION_MAP */}
        {level >= 6 && positions.length >= 6 && (
          <>
            {/* Red family: compress[0] → detect[1] */}
            <line x1={positions[0].cx} y1={positions[0].cy} x2={positions[1].cx} y2={positions[1].cy}
              stroke={FAMILY_COLORS[1].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
            {/* Emerald family: vote[5] → consensus[4] */}
            <line x1={positions[5].cx} y1={positions[5].cy} x2={positions[4].cx} y2={positions[4].cy}
              stroke={FAMILY_COLORS[2].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
            {/* Ocean Blue family: convert[2] → verify[3] */}
            <line x1={positions[2].cx} y1={positions[2].cy} x2={positions[3].cx} y2={positions[3].cy}
              stroke={FAMILY_COLORS[3].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
          </>
        )}
        {level >= 9 && positions.length >= 9 && (
          <>
            {/* Red family: compress[0] → challenge[6] */}
            <line x1={positions[0].cx} y1={positions[0].cy} x2={positions[6].cx} y2={positions[6].cy}
              stroke={FAMILY_COLORS[1].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
            {/* Emerald family: vote[5] → override[8] */}
            <line x1={positions[5].cx} y1={positions[5].cy} x2={positions[8].cx} y2={positions[8].cy}
              stroke={FAMILY_COLORS[2].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
            {/* Ocean Blue family: convert[2] → broadcast[7] */}
            <line x1={positions[2].cx} y1={positions[2].cy} x2={positions[7].cx} y2={positions[7].cy}
              stroke={FAMILY_COLORS[3].stroke} strokeOpacity={0.2} strokeWidth={1} strokeDasharray="4 4" />
          </>
        )}

        {/* Hub — eXeL AI with circle count in theme color */}
        <ThemeCircle
          cx={hub.cx} cy={hub.cy} r={hub.r}
          theme={{ label: "eXeL AI", count: level, avgConfidence: 0, summary33: "" }}
          fill={currentTheme.swatch + "1A"}
          stroke={currentTheme.swatch}
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
                {sdk.name}
              </text>
              {/* Cost badge */}
              <text
                x={pos.cx}
                y={pos.cy + pos.r + 26}
                textAnchor="middle"
                fontSize={8}
                className="fill-muted-foreground"
                opacity={0.5}
              >
                {sdk.cost}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Back button */}
      {selectedFamily && (
        <div className="flex justify-center mt-2">
          <button
            onClick={handleBack}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            ← Back to overview
          </button>
        </div>
      )}
    </div>
  );
}
