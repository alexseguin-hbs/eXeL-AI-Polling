"use client";

import { useState, useMemo, useRef, type TouchEvent } from "react";
import { X, ScrollText, ChevronDown, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import { getSortedLanguages } from "@/lib/language-utils";
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
  111: { label: "111 words", fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
  333: { label: "333 words", fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
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

// The 7-word petal descriptor is passed in (localized via the Lexicon).
function sectionTheme(idx: number, seven: string): ThemeInfo {
  const s = ACCORD_SECTIONS_EN[idx];
  return { label: s.tag, count: 0, avgConfidence: 0, summary33: seven };
}

// ── Accord flower: 6 petals (PILOT..EDUCATE) + EXPAND hub ────────
function AccordFlower({
  activeIdx,
  onSelect,
  color,
  sevenLabels,
}: {
  activeIdx: number;
  onSelect: (i: number) => void;
  color: { fill: string; stroke: string };
  sevenLabels: string[];
}) {
  const fillFor = (idx: number) =>
    idx === activeIdx ? color.stroke + "44" : color.fill;

  return (
    <svg
      viewBox="0 0 600 500"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ overflow: "visible", maxHeight: "100%" }}
    >
      <ThemeCircle
        cx={HUB_POSITION.cx}
        cy={HUB_POSITION.cy}
        r={HUB_POSITION.r}
        theme={sectionTheme(CENTER_IDX, sevenLabels[CENTER_IDX])}
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
          theme={sectionTheme(i, sevenLabels[i])}
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
      className="w-full h-full"
      style={{ overflow: "visible", maxHeight: "100%" }}
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

const TABS: { id: View; tKey: string }[] = [
  { id: "accord", tKey: "shared.atlantis.tab_accords" },
  { id: "countries", tKey: "shared.atlantis.tab_countries" },
  { id: "approvals", tKey: "shared.atlantis.tab_approvals" },
];

function FullscreenViewer({
  onClose,
  langCode,
}: {
  onClose: () => void;
  langCode: string;
}) {
  const { t, activeLocale, setActiveLocale, languages } = useLexicon();
  const roleLabel = (role: string) => t(`shared.atlantis.role_${role.toLowerCase()}`);
  const [langOpen, setLangOpen] = useState(false);
  const [view, setView] = useState<View>("accord");
  const [activeIdx, setActiveIdx] = useState(0);
  const [tier, setTier] = useState<Tier>(33);
  // Which approval block is expanded — keyed by page + role so it auto-collapses
  // when you turn to another country.
  const [openKey, setOpenKey] = useState<string | null>(null);

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
    subtitle: `${s.slots.filter((x) => x.verified).length} / ${s.slots.length}`,
  }));
  const countryItems = TARGET_COUNTRIES_EN.map((c) => ({
    label: c.region,
    subtitle: c.rotationStage,
  }));
  // 7-word overviews, localized — used by the flower petals + grey subtitle.
  const sevenLabels = ACCORD_SECTIONS_EN.map((s) =>
    t(`shared.atlantis.seven.${s.id}`)
  );

  return (
    <div className="fixed inset-0 z-[70] bg-background/98 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">The Atlantis Accords</h2>
          <p className="text-[11px] text-muted-foreground">
            {t("shared.atlantis.tagline")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {/* Language selector — globe + 2-letter code, same as the home navbar */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLangOpen((p) => !p)}
              title={t("cube1.join.select_language")}
              className="flex items-center gap-1"
            >
              <Globe className="h-4 w-4" />
              <span className="text-xs uppercase">{activeLocale}</span>
            </Button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 max-h-80 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                  {(() => {
                    const { sorted, pinnedCount } = getSortedLanguages(languages);
                    return sorted.map((lang, i) => (
                      <div key={lang.code}>
                        <button
                          onClick={() => {
                            setActiveLocale(lang.code);
                            setLangOpen(false);
                          }}
                          className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent ${
                            activeLocale === lang.code ? "bg-accent font-medium" : ""
                          }`}
                        >
                          <span>{lang.nameNative}</span>
                          <span className="text-muted-foreground text-xs">({lang.nameEn})</span>
                        </button>
                        {i === pinnedCount - 1 && sorted.length > pinnedCount && (
                          <div className="my-1 border-t" />
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Body: two columns. Extra bottom padding keeps the pager clear of the
          floating eXeL badge (fixed bottom-6 right-6) when scrolled to the bottom. */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6 px-6 pt-10 pb-20 overflow-hidden">
        {/* LEFT — mode tabs (pinned top) + flower (fills remaining space) */}
        <div className="flex flex-col items-center min-h-0 gap-3">
          <div className="flex flex-wrap justify-center gap-2 shrink-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchView(tab.id)}
                className={`px-3 py-1 text-[11px] rounded-full transition-all ${
                  view === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {t(tab.tKey)}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 w-full max-w-[560px] flex items-center justify-center">
            {view === "accord" ? (
              <AccordFlower activeIdx={activeIdx} onSelect={setActiveIdx} color={color} sevenLabels={sevenLabels} />
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
                <span className="font-normal text-muted-foreground">
                  · {t(`shared.atlantis.title.${section.id}`)}
                </span>
              </h3>
              <p className="mb-3 text-sm text-muted-foreground italic">
                {t(`shared.atlantis.seven.${section.id}`)}
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
                      {n} {t("shared.atlantis.words")}
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
                <span className="font-normal text-muted-foreground">· {t("shared.atlantis.tab_approvals")}</span>
              </h3>
              {/* 33-word overview: why all three signatures are required */}
              <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
                {region.rationale}
              </p>

              <div
                key={activeIdx}
                className="space-y-3 overflow-y-auto pr-2 flex-1 min-h-0 animate-in fade-in slide-in-from-right-2 duration-300"
              >
                {region.slots.map((slot) => {
                  const key = `${activeIdx}:${slot.role}`;
                  const isOpen = openKey === key;
                  return (
                    <div
                      key={slot.role}
                      className="rounded-lg border border-border overflow-hidden"
                    >
                      {/* Header row — click to expand the office's description */}
                      <button
                        onClick={() => setOpenKey(isOpen ? null : key)}
                        aria-expanded={isOpen}
                        className="flex w-full items-start justify-between gap-3 p-3 text-left transition-colors hover:bg-accent/40"
                      >
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-foreground">
                            {roleLabel(slot.role)}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {slot.representative}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-xs"
                            style={{ color: slot.verified ? color.stroke : undefined }}
                          >
                            {slot.verified ? `✓ ${t("shared.atlantis.signed")}` : `○ ${t("shared.atlantis.pending")}`}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-muted-foreground transition-transform ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {/* Expanded description */}
                      {isOpen && (
                        <div className="px-3 pb-3 border-t border-border/50">
                          <p className="pt-2 text-xs text-foreground/80 leading-relaxed">
                            {slot.attestation}
                          </p>
                          <div className="mt-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground italic">
                            {t("shared.atlantis.signature")}: {slot.name}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-bold tracking-tight mb-2">
                <span className="text-foreground">{country.region}</span>{" "}
                <span className="font-normal text-muted-foreground">· {t("shared.atlantis.country_suffix")}</span>
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
                    { label: t("shared.atlantis.field_language"), value: country.language },
                    { label: t("shared.atlantis.field_stage"), value: country.rotationStage },
                    { label: t("shared.atlantis.field_contribution"), value: country.contribution },
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
  const { activeLocale, t } = useLexicon();
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
        <span className="text-xs text-muted-foreground">
          {ACCORD_SECTIONS_EN.length} {t("shared.atlantis.sections")}
        </span>
      </button>

      {open && (
        <FullscreenViewer onClose={() => setOpen(false)} langCode={activeLocale} />
      )}
    </section>
  );
}
