"use client";

import { useState, useMemo, useRef, type TouchEvent } from "react";
import { X, Expand, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
import { getTheme2_6Positions, getHubPosition } from "@/lib/flower-geometry";
import type { ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";
import { ACCORD_SECTIONS_EN, getSection } from "@/lib/atlantis-accord-data";

// ─── Word tier → color ─────────────────────────────────────────
// The tier selector doubles as the flower's color theme, reusing the
// dashboard Theme1 palette: 33 = Red, 111 = Blue, 333 = Green.
type Tier = 33 | 111 | 333;
const TIER_COLORS: Record<Tier, { label: string; fill: string; stroke: string }> = {
  33: { label: "33 words", fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
  111: { label: "111 words", fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
  333: { label: "333 words", fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
};

// ─── Flower of Life · 6 petals + 1 hub ─────────────────────────
// Reuses the dashboard theme-results visualization (Theme 01 → 6 sub-themes):
// same overlapping-petal geometry, same ThemeCircle renderer. Sections 1–6
// (PILOT..EDUCATE) fill the six petals; section 7 (EXPAND) is the center hub.

const HEX_POSITIONS = getTheme2_6Positions();
const HUB_POSITION = getHubPosition();
const CENTER_IDX = 6; // EXPAND = center hub

// Adapt an accord section into the ThemeInfo shape ThemeCircle expects.
// No counts/confidence for the accords — the 7-word overview is the descriptor.
function sectionTheme(idx: number): ThemeInfo {
  const s = ACCORD_SECTIONS_EN[idx];
  return { label: s.tag, count: 0, avgConfidence: 0, summary33: s.content[7] };
}

function AccordFlower({
  activeIdx,
  onSelect,
  color,
}: {
  activeIdx: number;
  onSelect: (i: number) => void;
  color: { fill: string; stroke: string };
}) {
  const fillFor = (idx: number) =>
    idx === activeIdx ? color.stroke + "44" : color.fill;

  return (
    <svg
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      style={{ overflow: "visible", maxHeight: 520 }}
    >
      {/* Center hub — EXPAND (drawn first so petals overlap its edges) */}
      <ThemeCircle
        cx={HUB_POSITION.cx}
        cy={HUB_POSITION.cy}
        r={HUB_POSITION.r}
        theme={sectionTheme(CENTER_IDX)}
        fill={fillFor(CENTER_IDX)}
        stroke={color.stroke}
        onClick={() => onSelect(CENTER_IDX)}
        isHub
      />

      {/* 6 outer petals — PILOT..EDUCATE */}
      {HEX_POSITIONS.map((pos, i) => (
        <ThemeCircle
          key={i}
          cx={pos.cx}
          cy={pos.cy}
          r={pos.r}
          theme={sectionTheme(i)}
          fill={fillFor(i)}
          stroke={color.stroke}
          onClick={() => onSelect(i)}
          bloom
          bloomDelay={i * 80}
        />
      ))}
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
  const [tier, setTier] = useState<Tier>(33);

  const section = useMemo(() => getSection(activeIdx, langCode), [activeIdx, langCode]);
  const color = TIER_COLORS[tier];

  const totalPages = ACCORD_SECTIONS_EN.length;
  const goPrev = () => {
    if (activeIdx > 0) setActiveIdx(activeIdx - 1);
  };
  const goNext = () => {
    if (activeIdx < totalPages - 1) setActiveIdx(activeIdx + 1);
  };

  // Touch-swipe paging — same 50px threshold as the Divinity Guide reader
  const touchStartX = useRef(0);
  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) goNext();
    else if (delta > 50) goPrev();
  };

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
        {/* LEFT — Flower (reuses dashboard theme visualization) */}
        <div className="flex items-center justify-center min-h-0">
          <div className="w-full max-w-[560px]">
            <AccordFlower activeIdx={activeIdx} onSelect={setActiveIdx} color={color} />
          </div>
        </div>

        {/* RIGHT — Text */}
        <div
          className="flex flex-col min-w-0 min-h-0 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Header: "PILOT · Where Innovation Begins" — tag white, title grey.
              The page number lives in the bottom pager, not here. */}
          <h3 className="text-2xl font-bold tracking-tight mb-1">
            <span className="text-foreground">{section.tag}</span>{" "}
            <span className="font-normal text-muted-foreground">· {section.title}</span>
          </h3>
          <p className="mb-3 text-sm text-muted-foreground italic">
            {section.content[7]}
          </p>

          {/* Tier selector — colors the overview AND the flower (33 R / 111 B / 333 G) */}
          <div className="flex gap-2 mb-3">
            {([33, 111, 333] as Tier[]).map((n) => {
              const c = TIER_COLORS[n];
              const isActive = tier === n;
              return (
                <button
                  key={n}
                  onClick={() => setTier(n)}
                  className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
                  style={{
                    borderColor: c.stroke,
                    backgroundColor: isActive ? c.stroke : "transparent",
                    color: isActive ? "#fff" : c.stroke,
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div
            key={`${activeIdx}-${tier}`}
            className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line overflow-y-auto pr-2 flex-1 min-h-0 animate-in fade-in slide-in-from-right-2 duration-300"
          >
            {section.content[tier]}
          </div>

          {/* Bottom pager — reused from the Divinity Guide book reader.
              Arrows page through the 7 sections and stay in sync with the flower. */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t">
            <button
              onClick={goPrev}
              disabled={activeIdx === 0}
              aria-label="Previous section"
              className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
              style={{ borderColor: activeIdx > 0 ? color.stroke : undefined }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <p className="text-[10px] text-muted-foreground/40">
              {activeIdx + 1} / {totalPages}
            </p>
            <button
              onClick={goNext}
              disabled={activeIdx >= totalPages - 1}
              aria-label="Next section"
              className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
              style={{ borderColor: activeIdx < totalPages - 1 ? color.stroke : undefined }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
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
      {/* Bordered card row — matches the sibling settings rows (icon + title + action) */}
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-3">
          <ScrollText className="h-5 w-5 shrink-0 text-primary" />
          <div>
            <div className="text-sm font-semibold text-foreground">
              The Atlantis Accords
            </div>
            <div className="text-xs text-muted-foreground">
              Cambodia · Honduras · Austin, Texas
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted-foreground">7 sections</span>
          <Expand className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        </div>
      </button>

      {open && (
        <FullscreenViewer onClose={() => setOpen(false)} langCode={activeLocale} />
      )}
    </section>
  );
}
