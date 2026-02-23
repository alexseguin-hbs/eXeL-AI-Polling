"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeCircle } from "./theme-circle";
import { RotaryKnob } from "./rotary-knob";
import { ResponseDrawer } from "./response-drawer";
import {
  getTheme1Positions,
  getHubPosition,
  getTheme2Positions,
  THEME1_INDEX,
} from "@/lib/flower-geometry";
import { generateSampleSessionData } from "@/lib/sample-session-data";
import type { Theme01Label, ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";

// ── Theme1 color config ──────────────────────────────────────────

const THEME1_COLORS: Record<
  Theme01Label,
  { fill: string; stroke: string }
> = {
  "Risk & Concerns": {
    fill: "rgba(239, 68, 68, 0.2)",
    stroke: "#EF4444",
  },
  "Supporting Comments": {
    fill: "rgba(16, 185, 129, 0.2)",
    stroke: "#10B981",
  },
  "Neutral Comments": {
    fill: "rgba(59, 130, 246, 0.2)",
    stroke: "#3B82F6",
  },
};

const THEME1_LABELS: Theme01Label[] = [
  "Risk & Concerns",
  "Neutral Comments",
  "Supporting Comments",
];

// ── State types ──────────────────────────────────────────────────

interface FlowerState {
  view: "theme1" | "theme2";
  selectedTheme1: Theme01Label | null;
  theme2Level: 3 | 6 | 9;
  selectedTheme2: string | null;
  animating: boolean;
}

// ── Component ────────────────────────────────────────────────────

interface FlowerVisualizationProps {
  sessionId: string;
  sessionTitle: string;
  isPaidTier?: boolean;
}

export function FlowerVisualization({
  sessionId,
  sessionTitle,
  isPaidTier = false,
}: FlowerVisualizationProps) {
  const data = useMemo(
    () => generateSampleSessionData(sessionId),
    [sessionId]
  );

  const [state, setState] = useState<FlowerState>({
    view: "theme1",
    selectedTheme1: null,
    theme2Level: 3,
    selectedTheme2: null,
    animating: false,
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPortrait, setIsPortrait] = useState(false);

  // Responsive: detect narrow containers for portrait mode
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsPortrait(entry.contentRect.width < 400);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Positions
  const theme1Positions = useMemo(() => getTheme1Positions(), []);
  const hubPosition = useMemo(() => getHubPosition(), []);
  const theme2Positions = useMemo(
    () => getTheme2Positions(state.theme2Level),
    [state.theme2Level]
  );

  // Animation lock
  const lockAnimation = useCallback((ms: number) => {
    setState((s) => ({ ...s, animating: true }));
    setTimeout(() => setState((s) => ({ ...s, animating: false })), ms);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────

  const handleTheme1Click = useCallback(
    (label: Theme01Label) => {
      if (state.animating) return;
      lockAnimation(600);
      setState((s) => ({
        ...s,
        view: "theme2",
        selectedTheme1: label,
        theme2Level: 3,
        selectedTheme2: null,
      }));
    },
    [state.animating, lockAnimation]
  );

  const handleBack = useCallback(() => {
    if (state.animating) return;
    lockAnimation(500);
    setState((s) => ({
      ...s,
      view: "theme1",
      selectedTheme1: null,
      selectedTheme2: null,
    }));
  }, [state.animating, lockAnimation]);

  const handleKnobChange = useCallback(
    (level: 3 | 6 | 9) => {
      if (state.animating) return;
      lockAnimation(450);
      setState((s) => ({ ...s, theme2Level: level, selectedTheme2: null }));
    },
    [state.animating, lockAnimation]
  );

  const handleTheme2Click = useCallback(
    (label: string) => {
      if (state.animating) return;
      setState((s) => ({
        ...s,
        selectedTheme2: s.selectedTheme2 === label ? null : label,
      }));
    },
    [state.animating]
  );

  const handleDrawerClose = useCallback(() => {
    setState((s) => ({ ...s, selectedTheme2: null }));
  }, []);

  // ── Derived data ─────────────────────────────────────────────

  const currentTheme2Themes: ThemeInfo[] = useMemo(() => {
    if (!state.selectedTheme1) return [];
    const t2 = data.theme2[state.selectedTheme1];
    switch (state.theme2Level) {
      case 3:
        return t2.level3;
      case 6:
        return t2.level6;
      case 9:
        return t2.level9;
    }
  }, [data.theme2, state.selectedTheme1, state.theme2Level]);

  const drawerResponses = useMemo(() => {
    if (!state.selectedTheme2 || !state.selectedTheme1) return [];
    const levelKey =
      state.theme2Level === 9
        ? "theme2_9"
        : state.theme2Level === 6
          ? "theme2_6"
          : "theme2_3";
    return data.responses.filter(
      (r) =>
        r.theme1 === state.selectedTheme1 &&
        r[levelKey as keyof typeof r] === state.selectedTheme2
    );
  }, [data.responses, state.selectedTheme1, state.selectedTheme2, state.theme2Level]);

  const selectedTheme2Info = useMemo(() => {
    if (!state.selectedTheme2) return null;
    return currentTheme2Themes.find((t) => t.label === state.selectedTheme2) ?? null;
  }, [currentTheme2Themes, state.selectedTheme2]);

  const selectedTheme1Color = state.selectedTheme1
    ? THEME1_COLORS[state.selectedTheme1]
    : null;

  // ── Transition animation helpers ─────────────────────────────

  // For the hub moving from its Theme1 triangle position to center
  const [hubTransform, setHubTransform] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (state.view === "theme2" && state.selectedTheme1) {
      const idx = THEME1_INDEX[state.selectedTheme1];
      const from = theme1Positions[idx];
      // Animate from original position to center
      setHubTransform({
        x: from.cx - hubPosition.cx,
        y: from.cy - hubPosition.cy,
      });
      // Trigger animation to center
      requestAnimationFrame(() => {
        setTimeout(() => setHubTransform({ x: 0, y: 0 }), 20);
      });
    }
  }, [state.view, state.selectedTheme1, theme1Positions, hubPosition]);

  // ── Render ───────────────────────────────────────────────────

  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {state.view === "theme2" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={state.animating}
                className="flower-fade-in"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <CardTitle className="text-base">
              {state.view === "theme1"
                ? "Theme Analysis"
                : `${state.selectedTheme1} — Sub-themes`}
            </CardTitle>
          </div>
          <div className="text-xs text-muted-foreground">
            {data.totalResponses.toLocaleString()} responses
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div ref={containerRef} style={{ position: "relative" }}>
          {/* SVG Canvas — portrait adjusts viewBox for vertical fit */}
          <svg
            ref={svgRef}
            viewBox={
              isPortrait
                ? state.view === "theme2" && state.theme2Level === 9
                  ? "20 -60 560 620"
                  : "30 0 540 520"
                : state.view === "theme2" && state.theme2Level === 9
                  ? "0 -60 600 580"
                  : "0 0 600 500"
            }
            preserveAspectRatio="xMidYMid meet"
            className="w-full"
            style={{ maxHeight: isPortrait ? 440 : 500, overflow: "visible" }}
          >
            {/* ── Theme1 View ─────────────────────────── */}
            {state.view === "theme1" &&
              THEME1_LABELS.map((label, i) => {
                const pos = theme1Positions[i];
                const colors = THEME1_COLORS[label];
                const info = data.theme1[label];

                return (
                  <ThemeCircle
                    key={label}
                    cx={pos.cx}
                    cy={pos.cy}
                    r={pos.r}
                    theme={info}
                    fill={colors.fill}
                    stroke={colors.stroke}
                    onClick={() => handleTheme1Click(label)}
                    bloom
                    bloomDelay={i * 100}
                  />
                );
              })}

            {/* ── Theme2 View ─────────────────────────── */}
            {state.view === "theme2" && state.selectedTheme1 && (
              <>
                {/* Hub circle (selected Theme1) */}
                <g
                  style={{
                    transform: `translate(${hubTransform.x}px, ${hubTransform.y}px)`,
                    transition:
                      "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                >
                  <ThemeCircle
                    cx={hubPosition.cx}
                    cy={hubPosition.cy}
                    r={hubPosition.r}
                    theme={data.theme1[state.selectedTheme1]}
                    fill={selectedTheme1Color!.fill}
                    stroke={selectedTheme1Color!.stroke}
                    isHub
                  />
                </g>

                {/* Theme2 circles */}
                {currentTheme2Themes.map((theme, i) => {
                  if (i >= theme2Positions.length) return null;
                  const pos = theme2Positions[i];
                  // Vary saturation based on confidence
                  const alpha = 0.12 + (theme.avgConfidence / 100) * 0.18;
                  const fill = selectedTheme1Color!.stroke
                    .replace("#", "")
                    .match(/.{2}/g);
                  const fillRgba = fill
                    ? `rgba(${parseInt(fill[0], 16)}, ${parseInt(fill[1], 16)}, ${parseInt(fill[2], 16)}, ${alpha})`
                    : selectedTheme1Color!.fill;

                  return (
                    <ThemeCircle
                      key={`${state.theme2Level}-${theme.label}`}
                      cx={pos.cx}
                      cy={pos.cy}
                      r={pos.r}
                      theme={theme}
                      fill={fillRgba}
                      stroke={selectedTheme1Color!.stroke}
                      onClick={() => handleTheme2Click(theme.label)}
                      bloom
                      bloomDelay={i * 80}
                    />
                  );
                })}
              </>
            )}

            {/* Center decorative Vesica Piscis lines (Theme1 only) */}
            {state.view === "theme1" && (
              <circle
                cx={300}
                cy={250}
                r={8}
                fill="none"
                stroke="hsl(183, 11%, 30%)"
                strokeWidth={1}
                strokeDasharray="2 2"
                className="flower-fade-in"
              />
            )}
          </svg>

          {/* Rotary Knob (Theme2 only) */}
          {state.view === "theme2" && (
            <div
              className="flower-fade-in"
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 8,
              }}
            >
              <RotaryKnob
                level={state.theme2Level}
                onChange={handleKnobChange}
                disabled={state.animating}
                accentColor={selectedTheme1Color?.stroke ?? "#00E5CC"}
              />
            </div>
          )}

          {/* Response Drawer */}
          {state.selectedTheme2 && selectedTheme2Info && (
            <ResponseDrawer
              theme={selectedTheme2Info}
              responses={drawerResponses}
              accentColor={selectedTheme1Color?.stroke ?? "#00E5CC"}
              onClose={handleDrawerClose}
              isPaidTier={isPaidTier}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
