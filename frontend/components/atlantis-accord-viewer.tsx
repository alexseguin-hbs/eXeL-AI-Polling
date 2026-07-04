"use client";

import { useState, useMemo, useRef, type TouchEvent } from "react";
import { X, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
import {
  getTheme2_6Positions,
  getHubPosition,
  getTheme1Positions,
} from "@/lib/flower-geometry";
import type { ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";
import {
  ACCORD_SECTIONS_EN,
  SIGNATORIES_EN,
  TARGET_COUNTRIES_EN,
  getSection,
  getSignatory,
  getTargetCountry,
} from "@/lib/atlantis-accord-data";

// ─── Word tier → color ─────────────────────────────────────────
// The tier selector doubles as the flower's color theme, reusing the
// dashboard Theme1 palette: 33 = Red, 111 = Blue, 333 = Green.
type Tier = 33 | 111 | 333;
const TIER_COLORS: Record<Tier, { label: string; fill: string; stroke: string }> = {
  33: { label: "33 words", fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
  111: { label: "111 words", fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
  333: { label: "333 words", fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
};

// Region palette for the triangle flower (mirrors the Theme1 Risk/Neutral/Support
// UX by position: top = Red, bottom-left = Blue, bottom-right = Green).
const REGION_COLORS = [
  { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" }, // Austin — top
  { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" }, // Honduras — bottom-left
  { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" }, // Cambodia — bottom-right
];

// ─── Flower geometry (reused dashboard theme-viz primitives) ────
const HEX_POSITIONS = getTheme2_6Positions();
const HUB_POSITION = getHubPosition();
const TRIAD_POSITIONS = getTheme1Positions();
const CENTER_IDX = 6; // EXPAND = center hub

function sectionTheme(idx: number): ThemeInfo {
  const s = ACCORD_SECTIONS_EN[idx];
  return { label: s.tag, count: 0, avgConfidence: 0, summary33: s.content[7] };
}

// ── Accord flower: 6 petals (PILOT..EDUCATE) + EXPAND hub ────────
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

// ── Triangle flower: 3 regions (Austin top / Honduras BL / Cambodia BR) ──
// Shared by Proposed Approvals and Target Countries.
function TriangleFlower({
  items,
  activeIdx,
  onSelect,
}: {
  items: { label: string; subtitle: string }[];
  activeIdx: number;
  onSelect: (i: number) => void;
}) {
  return (
    <svg
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="w-full"
      style={{ overflow: "visible", maxHeight: 520 }}
    >
      {items.map((it, i) => {
        const pos = TRIAD_POSITIONS[i];
        const c = REGION_COLORS[i] ?? REGION_COLORS[0];
        return (
          <ThemeCircle
            key={it.label}
            cx={pos.cx}
            cy={pos.cy}
            r={pos.r}
            theme={{ label: it.label, count: 0, avgConfidence: 0, summary33: it.subtitle }}
            fill={i === activeIdx ? c.stroke + "44" : c.fill}
            stroke={c.stroke}
            onClick={() => onSelect(i)}
            bloom
            bloomDelay={i * 100}
          />
        );
      })}
    </svg>
  );
}

// ─── Full-screen viewer ────────────────────────────────────────

type View = "accord" | "approvals" | "countries";

const TABS: { id: View; label: string }[] = [
  { id: "accord", label: "The Accords" },
  { id: "approvals", label: "Proposed Approvals" },
  { id: "countries", label: "Target Countries" },
];

function FullscreenViewer({
  onClose,
  langCode,
}: {
  onClose: () => void;
  langCode: string;
}) {
  const [view, setView] = useState<View>("accord");
  const [activeIdx, setActiveIdx] = useState(0);
  const [tier, setTier] = useState<Tier>(33);

  const section = useMemo(() => getSection(activeIdx, langCode), [activeIdx, langCode]);
  const region = getSignatory(activeIdx, langCode);
  const country = getTargetCountry(activeIdx, langCode);

  const totalPages =
    view === "accord"
      ? ACCORD_SECTIONS_EN.length
      : view === "approvals"
        ? SIGNATORIES_EN.length
        : TARGET_COUNTRIES_EN.length;
  const color =
    view === "accord"
      ? TIER_COLORS[tier]
      : REGION_COLORS[Math.min(activeIdx, REGION_COLORS.length - 1)];

  const switchView = (v: View) => {
    setView(v);
    setActiveIdx(0);
  };
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

  // Triangle-flower subtitles per view
  const approvalItems = SIGNATORIES_EN.map((s) => ({
    label: s.region,
    subtitle: `${s.slots.filter((x) => x.verified).length} / ${s.slots.length} signatures`,
  }));
  const countryItems = TARGET_COUNTRIES_EN.map((c) => ({
    label: c.region,
    subtitle: c.rotationStage,
  }));

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
        {/* LEFT — mode tabs + flower (Sacred Library idiom) */}
        <div className="flex flex-col items-center justify-center min-h-0 gap-4">
          <div className="flex flex-wrap justify-center gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => switchView(t.id)}
                className={`px-3 py-1 text-[11px] rounded-full transition-all ${
                  view === t.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="w-full max-w-[560px]">
            {view === "accord" ? (
              <AccordFlower activeIdx={activeIdx} onSelect={setActiveIdx} color={color} />
            ) : view === "approvals" ? (
              <TriangleFlower items={approvalItems} activeIdx={activeIdx} onSelect={setActiveIdx} />
            ) : (
              <TriangleFlower items={countryItems} activeIdx={activeIdx} onSelect={setActiveIdx} />
            )}
          </div>
        </div>

        {/* RIGHT — reader */}
        <div
          className="flex flex-col min-w-0 min-h-0 overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {view === "accord" ? (
            <>
              {/* "PILOT · Where Innovation Begins" — tag white, title grey */}
              <h3 className="text-2xl font-bold tracking-tight mb-1">
                <span className="text-foreground">{section.tag}</span>{" "}
                <span className="font-normal text-muted-foreground">· {section.title}</span>
              </h3>
              <p className="mb-3 text-sm text-muted-foreground italic">
                {section.content[7]}
              </p>

              {/* Tier selector — colors the overview AND the flower */}
              <div className="flex gap-2 mb-3">
                {([33, 111, 333] as Tier[]).map((n) => {
                  const c = TIER_COLORS[n];
                  const active = tier === n;
                  return (
                    <button
                      key={n}
                      onClick={() => setTier(n)}
                      className="text-xs px-3 py-1.5 rounded-full border font-medium transition-colors"
                      style={{
                        borderColor: c.stroke,
                        backgroundColor: active ? c.stroke : "transparent",
                        color: active ? "#fff" : c.stroke,
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>

              <div
                key={`${activeIdx}-${tier}`}
                className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line overflow-y-auto pr-2 flex-1 min-h-0 animate-in fade-in slide-in-from-right-2 duration-300"
              >
                {section.content[tier]}
              </div>
            </>
          ) : view === "approvals" ? (
            <>
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                <span className="text-foreground">{region.region}</span>{" "}
                <span className="font-normal text-muted-foreground">· Proposed Approvals</span>
              </h3>
              {/* Professional overview at top */}
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                {region.preamble}
              </p>

              <div
                key={activeIdx}
                className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0 animate-in fade-in slide-in-from-right-2 duration-300"
              >
                {region.slots.map((slot) => (
                  <div key={slot.role} className="rounded-lg border border-border p-3">
                    <div className="flex items-start justify-between gap-3 mb-1.5">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                          {slot.role}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {slot.representative}
                        </div>
                      </div>
                      <span
                        className="text-xs shrink-0"
                        style={{ color: slot.verified ? color.stroke : undefined }}
                      >
                        {slot.verified ? "✓ Signed" : "○ Pending"}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                      {slot.attestation}
                    </p>
                    <div className="mt-2 pt-2 border-t border-border/50 text-[11px] text-muted-foreground italic">
                      Signature: {slot.name}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                <span className="text-foreground">{country.region}</span>{" "}
                <span className="font-normal text-muted-foreground">· Target Country</span>
              </h3>

              <div
                key={activeIdx}
                className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0 animate-in fade-in slide-in-from-right-2 duration-300"
              >
                {/* Professional overview at top */}
                <p className="text-sm text-foreground/90 leading-relaxed">
                  {country.overview}
                </p>
                <div className="space-y-2">
                  {[
                    { label: "Primary Language", value: country.language },
                    { label: "Rotation Stage", value: country.rotationStage },
                    { label: "Unique Contribution", value: country.contribution },
                  ].map((f) => (
                    <div key={f.label} className="rounded-lg border border-border p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {f.label}
                      </div>
                      <div className="mt-0.5 text-sm text-foreground/90">{f.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Bottom pager — reused from the Divinity Guide book reader */}
          <div className="flex items-center justify-between pt-4 mt-4 border-t">
            <button
              onClick={goPrev}
              disabled={activeIdx === 0}
              aria-label="Previous"
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
              aria-label="Next"
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
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-3">
          <ScrollText className="h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm font-semibold text-foreground">
            The Atlantis Accords
          </div>
        </div>
        <span className="text-xs text-muted-foreground">7 sections</span>
      </button>

      {open && (
        <FullscreenViewer onClose={() => setOpen(false)} langCode={activeLocale} />
      )}
    </section>
  );
}
