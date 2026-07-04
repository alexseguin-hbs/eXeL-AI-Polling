"use client";

import { useState, useMemo } from "react";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import {
  ACCORD_SECTIONS_EN,
  MOOD_PALETTE,
  WORD_LEVELS,
  getSection,
  type MoodTheme,
  type WordLevel,
} from "@/lib/atlantis-accord-data";

// ─── Flower of Life · 7-petal visualization ─────────────────────
// Center hub + 6 outer petals in hexagonal arrangement + 1 upper petal
// symbolising the 7 sections of the accord. The active petal pulses.

function AccordFlower({
  activeIdx,
  onSelect,
  mood,
  compact = false,
}: {
  activeIdx: number;
  onSelect: (i: number) => void;
  mood: MoodTheme;
  compact?: boolean;
}) {
  const palette = MOOD_PALETTE[mood];
  const cx = 100;
  const cy = 100;
  const r = compact ? 14 : 18;
  const orbit = compact ? 55 : 65;

  // 7 outer petals arranged on hexagon + top (12, 2, 4, 6, 8, 10 o'clock) +
  // 6th and 7th packed in. Simplest: 6 around + 1 center (=7 total including hub).
  // We choose to use 7 outer petals evenly around center for a 7-fold accord.
  const petals = Array.from({ length: 7 }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 7;
    return {
      idx: i,
      x: cx + orbit * Math.cos(angle),
      y: cy + orbit * Math.sin(angle),
    };
  });

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" style={{ overflow: "visible" }}>
      {/* connecting lines hub → petal */}
      {petals.map((p) => (
        <line
          key={`l-${p.idx}`}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          stroke={palette.stroke}
          strokeOpacity={p.idx === activeIdx ? 0.5 : 0.15}
          strokeWidth={1.5}
        />
      ))}

      {/* hub */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={palette.fill}
        stroke={palette.hub}
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize={compact ? 9 : 11}
        fill={palette.hub}
        fontWeight={600}
      >
        ✦
      </text>

      {/* 7 outer petals */}
      {petals.map((p) => {
        const section = ACCORD_SECTIONS_EN[p.idx];
        const isActive = p.idx === activeIdx;
        return (
          <g
            key={`p-${p.idx}`}
            onClick={() => onSelect(p.idx)}
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={isActive ? palette.stroke + "40" : palette.fill}
              stroke={palette.stroke}
              strokeWidth={isActive ? 2.5 : 1.5}
              style={{
                transition: "all 300ms ease",
                filter: isActive ? `drop-shadow(0 0 6px ${palette.stroke})` : undefined,
              }}
            />
            <text
              x={p.x}
              y={p.y + 3}
              textAnchor="middle"
              fontSize={compact ? 7 : 8}
              fill={palette.stroke}
              fontWeight={isActive ? 700 : 500}
              style={{ pointerEvents: "none" }}
            >
              {section.tag.slice(0, 4)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Viewer content (shared by inline + fullscreen) ─────────────

function ViewerBody({
  activeIdx,
  setActiveIdx,
  level,
  setLevel,
  mood,
  setMood,
  langCode,
  fullscreen,
}: {
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  level: WordLevel;
  setLevel: (l: WordLevel) => void;
  mood: MoodTheme;
  setMood: (m: MoodTheme) => void;
  langCode: string;
  fullscreen?: boolean;
}) {
  const section = useMemo(() => getSection(activeIdx, langCode), [activeIdx, langCode]);

  return (
    <div
      className={`grid gap-4 ${
        fullscreen ? "grid-cols-[1fr_1.2fr] h-full" : "grid-cols-1"
      }`}
    >
      {/* LEFT · Flower */}
      <div
        className={`flex flex-col items-center justify-start ${
          fullscreen ? "" : ""
        }`}
      >
        <div className={fullscreen ? "w-full max-w-md aspect-square" : "w-full aspect-square max-w-[220px]"}>
          <AccordFlower
            activeIdx={activeIdx}
            onSelect={setActiveIdx}
            mood={mood}
            compact={!fullscreen}
          />
        </div>

        {/* mood theme selector */}
        <div className="mt-3 flex gap-1.5">
          {(Object.keys(MOOD_PALETTE) as MoodTheme[]).map((m) => {
            const p = MOOD_PALETTE[m];
            const isActive = m === mood;
            return (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                  isActive ? "text-white" : "text-muted-foreground hover:bg-accent/50"
                }`}
                style={{
                  borderColor: p.stroke,
                  backgroundColor: isActive ? p.stroke : "transparent",
                }}
                title={p.label}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT · Text */}
      <div className="flex flex-col min-w-0">
        {/* section header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground">
              Page {section.page} of 7
            </div>
            <div className={`font-semibold ${fullscreen ? "text-lg" : "text-sm"}`}>
              {section.tag} <span className="text-muted-foreground">•</span> {section.title}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveIdx((activeIdx + 6) % 7)}
              className="p-1 rounded hover:bg-accent/50"
              aria-label="Previous section"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setActiveIdx((activeIdx + 1) % 7)}
              className="p-1 rounded hover:bg-accent/50"
              aria-label="Next section"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* word-level selector */}
        <div className="flex gap-1 mb-2">
          {WORD_LEVELS.map((n) => (
            <button
              key={n}
              onClick={() => setLevel(n)}
              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                level === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-accent/50"
              }`}
            >
              {n} words
            </button>
          ))}
        </div>

        {/* text body */}
        <div
          className={`text-foreground/90 leading-relaxed whitespace-pre-line ${
            fullscreen ? "text-sm overflow-y-auto pr-2" : "text-xs"
          }`}
          style={fullscreen ? { maxHeight: "calc(100vh - 260px)" } : undefined}
        >
          {section.content[level]}
        </div>
      </div>
    </div>
  );
}

// ─── Fullscreen modal ───────────────────────────────────────────

function FullscreenModal({
  onClose,
  activeIdx,
  setActiveIdx,
  level,
  setLevel,
  mood,
  setMood,
  langCode,
}: {
  onClose: () => void;
  activeIdx: number;
  setActiveIdx: (i: number) => void;
  level: WordLevel;
  setLevel: (l: WordLevel) => void;
  mood: MoodTheme;
  setMood: (m: MoodTheme) => void;
  langCode: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-sm p-4 md:p-8 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">The Atlantis Accords</h2>
          <p className="text-[11px] text-muted-foreground">
            Cambodia · Honduras · Austin, Texas — A promise signed by visionaries
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 min-h-0">
        <ViewerBody
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          level={level}
          setLevel={setLevel}
          mood={mood}
          setMood={setMood}
          langCode={langCode}
          fullscreen
        />
      </div>
    </div>
  );
}

// ─── Public component ──────────────────────────────────────────

export function AtlantisAccordViewer() {
  const { activeLocale } = useLexicon();
  const [activeIdx, setActiveIdx] = useState(0);
  const [level, setLevel] = useState<WordLevel>(7); // default 7 words as requested
  const [mood, setMood] = useState<MoodTheme>("neutral");
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">
          The Atlantis Accords{" "}
          <span className="text-[10px] text-muted-foreground font-normal">
            Viewer
          </span>
        </h3>
        <button
          onClick={() => setFullscreen(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Expand"
          title="Expand to full screen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      <ViewerBody
        activeIdx={activeIdx}
        setActiveIdx={setActiveIdx}
        level={level}
        setLevel={setLevel}
        mood={mood}
        setMood={setMood}
        langCode={activeLocale}
      />

      {fullscreen && (
        <FullscreenModal
          onClose={() => setFullscreen(false)}
          activeIdx={activeIdx}
          setActiveIdx={setActiveIdx}
          level={level}
          setLevel={setLevel}
          mood={mood}
          setMood={setMood}
          langCode={activeLocale}
        />
      )}
    </section>
  );
}
