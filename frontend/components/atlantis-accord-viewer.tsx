"use client";

import { useState, useMemo } from "react";
import { X, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import {
  ACCORD_SECTIONS_EN,
  MOOD_PALETTE,
  getSection,
  type MoodTheme,
  type WordLevel,
} from "@/lib/atlantis-accord-data";

// ─── Flower of Life · 6-outer + 1-center visualization ─────────
// Mirrors the Cube 7 / Divinity Guide flower: hex arrangement, one hub.
// Sections 1–6 (PILOT..EDUCATE) sit on the outer ring; section 7 (EXPAND)
// sits at the center as the "Humanity" core — the 7th theme that
// sustains and expands the accord across generations.

const FLOWER_LAYOUT = [
  { idx: 0, angle: -Math.PI / 2 },            // PILOT top
  { idx: 1, angle: -Math.PI / 2 + Math.PI / 3 },   // REPLAY upper-right
  { idx: 2, angle: -Math.PI / 2 + 2 * Math.PI / 3 }, // QUALIFY lower-right
  { idx: 3, angle: -Math.PI / 2 + 3 * Math.PI / 3 }, // CERTIFY bottom
  { idx: 4, angle: -Math.PI / 2 + 4 * Math.PI / 3 }, // ADOPT lower-left
  { idx: 5, angle: -Math.PI / 2 + 5 * Math.PI / 3 }, // EDUCATE upper-left
];
const CENTER_IDX = 6; // EXPAND = center = "Humanity"

function AccordFlower({
  activeIdx,
  onSelect,
  mood,
}: {
  activeIdx: number;
  onSelect: (i: number) => void;
  mood: MoodTheme;
}) {
  const palette = MOOD_PALETTE[mood];
  const cx = 200;
  const cy = 200;
  const r = 42;
  const orbit = 110;

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-full"
      style={{ overflow: "visible" }}
    >
      {/* connecting lines hub → outer petals */}
      {FLOWER_LAYOUT.map((p) => {
        const x = cx + orbit * Math.cos(p.angle);
        const y = cy + orbit * Math.sin(p.angle);
        const isActive = p.idx === activeIdx;
        return (
          <line
            key={`l-${p.idx}`}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={palette.stroke}
            strokeOpacity={isActive ? 0.5 : 0.15}
            strokeWidth={isActive ? 2 : 1.5}
          />
        );
      })}

      {/* Center petal = EXPAND / Humanity (7th core theme) */}
      {(() => {
        const section = ACCORD_SECTIONS_EN[CENTER_IDX];
        const isActive = activeIdx === CENTER_IDX;
        return (
          <g onClick={() => onSelect(CENTER_IDX)} style={{ cursor: "pointer" }}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={isActive ? palette.stroke + "40" : palette.fill}
              stroke={palette.hub}
              strokeWidth={isActive ? 3 : 2}
              style={{
                transition: "all 300ms ease",
                filter: isActive ? `drop-shadow(0 0 10px ${palette.stroke})` : undefined,
              }}
            />
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fontSize={13}
              fill={palette.hub}
              fontWeight={700}
              style={{ pointerEvents: "none" }}
            >
              {section.tag}
            </text>
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              fontSize={9}
              fill="#9CA3AF"
              fontWeight={500}
              style={{ pointerEvents: "none" }}
            >
              Humanity
            </text>
          </g>
        );
      })()}

      {/* 6 outer petals */}
      {FLOWER_LAYOUT.map((p) => {
        const section = ACCORD_SECTIONS_EN[p.idx];
        const x = cx + orbit * Math.cos(p.angle);
        const y = cy + orbit * Math.sin(p.angle);
        const isActive = p.idx === activeIdx;
        return (
          <g
            key={`p-${p.idx}`}
            onClick={() => onSelect(p.idx)}
            style={{ cursor: "pointer" }}
          >
            <circle
              cx={x}
              cy={y}
              r={r}
              fill={isActive ? palette.stroke + "40" : palette.fill}
              stroke={palette.stroke}
              strokeWidth={isActive ? 3 : 1.5}
              style={{
                transition: "all 300ms ease",
                filter: isActive ? `drop-shadow(0 0 10px ${palette.stroke})` : undefined,
              }}
            />
            <text
              x={x}
              y={y - 2}
              textAnchor="middle"
              fontSize={12}
              fill={palette.stroke}
              fontWeight={isActive ? 700 : 600}
              style={{ pointerEvents: "none" }}
            >
              {section.tag}
            </text>
            <text
              x={x}
              y={y + 12}
              textAnchor="middle"
              fontSize={8}
              fill="#9CA3AF"
              fontWeight={500}
              style={{ pointerEvents: "none" }}
            >
              {section.page}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Full-screen viewer ────────────────────────────────────────

function FullscreenViewer({
  onClose,
  langCode,
}: {
  onClose: () => void;
  langCode: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [level, setLevel] = useState<Exclude<WordLevel, 7>>(33); // default 33
  const [mood, setMood] = useState<MoodTheme>("neutral");

  const section = useMemo(() => getSection(activeIdx, langCode), [activeIdx, langCode]);

  return (
    <div className="fixed inset-0 z-[70] bg-background/98 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">The Atlantis Accords</h2>
          <p className="text-[11px] text-muted-foreground">
            Cambodia · Honduras · Austin, Texas — A promise signed by visionaries
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Body: two columns */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 px-6 py-6 overflow-hidden">
        {/* LEFT — Flower */}
        <div className="flex flex-col items-center justify-center min-h-0">
          <div className="w-full max-w-[520px] aspect-square">
            <AccordFlower activeIdx={activeIdx} onSelect={setActiveIdx} mood={mood} />
          </div>

          {/* Mood palette */}
          <div className="mt-4 flex gap-2">
            {(Object.keys(MOOD_PALETTE) as MoodTheme[]).map((m) => {
              const p = MOOD_PALETTE[m];
              const isActive = m === mood;
              return (
                <button
                  key={m}
                  onClick={() => setMood(m)}
                  className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                    isActive ? "text-white" : "text-muted-foreground hover:bg-accent/50"
                  }`}
                  style={{
                    borderColor: p.stroke,
                    backgroundColor: isActive ? p.stroke : "transparent",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT — Text */}
        <div className="flex flex-col min-w-0 min-h-0 overflow-hidden">
          {/* Section tag (large) + 7-word summary (grey, secondary) */}
          <div className="mb-3">
            <div className="text-[11px] text-muted-foreground">
              Page {section.page} of 7 · {section.title}
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-foreground">
              {section.tag}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground italic">
              {section.content[7]}
            </p>
          </div>

          {/* Tier selector: 33 / 111 / 333 (7 is now the grey subtitle) */}
          <div className="flex gap-1 mb-3">
            {([33, 111, 333] as const).map((n) => (
              <button
                key={n}
                onClick={() => setLevel(n)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${
                  level === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-accent/50"
                }`}
              >
                {n === 33 ? "33 words" : n === 111 ? "111 · 1 paragraph" : "333 · 3 paragraphs"}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line overflow-y-auto pr-2 flex-1 min-h-0">
            {section.content[level]}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public component (Settings row) ────────────────────────────

export function AtlantisAccordViewer() {
  const { activeLocale } = useLexicon();
  const [open, setOpen] = useState(false);

  return (
    <section>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-between w-full text-left group"
      >
        <div>
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            The Atlantis Accords{" "}
            <span className="text-[10px] text-muted-foreground/70 normal-case tracking-normal">
              Viewer
            </span>
          </h3>
          <p className="text-xs text-muted-foreground/80 mt-1">
            Cambodia · Honduras · Austin, Texas — 7 sections · 33 languages
          </p>
        </div>
        <Expand className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </button>

      {open && (
        <FullscreenViewer
          onClose={() => setOpen(false)}
          langCode={activeLocale}
        />
      )}
    </section>
  );
}
