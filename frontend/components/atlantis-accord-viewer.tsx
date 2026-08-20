"use client";

import { useState, useMemo, useRef, useEffect, type TouchEvent } from "react";
import { createPortal } from "react-dom";
import { X, ScrollText, ChevronDown, Globe, Download, Link2, Check, Copy, Maximize2, Minimize2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  buildAtlantisPackageHtml, buildAtlantisLink, generateSealCode, formatSealCode, SEAL_STRENGTHS,
  CLEARANCE_COLORS, MAX_CLEARANCE, ATLANTIS_PAGE_URL,
} from "@/lib/atlantis-package";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import { useEasterEgg } from "@/lib/easter-egg-context";
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
  ACCORD_TRANSLATIONS,
  ACCORD_LANG_NAMES,
  SIGNATORIES_EN,
  TARGET_COUNTRIES_EN,
  getSection,
  getSignatory,
  getTargetCountry,
} from "@/lib/atlantis-accord-data";

// ─── Word tier → color ─────────────────────────────────────────
// The tier selector doubles as the flower's color theme, reusing the
// dashboard Theme1 palette: 33 = Red, 111 = Blue, 333 = Green.
type Tier = 33 | 111 | 333 | 999;
const TIER_COLORS: Record<Tier, { label: string; fill: string; stroke: string }> = {
  33: { label: "33 words", fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
  111: { label: "111 words", fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
  333: { label: "333 words", fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
  // 999 — the deepest tier, drawn from the white paper. Trinity violet (H.I. 웃).
  999: { label: "999 words", fill: "rgba(139, 92, 246, 0.2)", stroke: "#8B5CF6" },
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

// A soft halo ring marking the ACTIVE section on the flower (operator 2026-08-20:
// the selected accord — e.g. CERTIFY — should read visibly in the visual, not only
// in the text below). Drawn AFTER the petals so overlapping circles never cover it;
// pointer-events off so clicks still pass through to the circles beneath.
function ActiveHalo({ cx, cy, r, stroke }: { cx: number; cy: number; r: number; stroke: string }) {
  return (
    <g pointerEvents="none" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r + 7} fill="none" stroke={stroke} strokeWidth={1.5} strokeOpacity={0.35} />
      <circle cx={cx} cy={cy} r={r + 3.5} fill="none" stroke={stroke} strokeWidth={2.5} className="accord-halo" />
    </g>
  );
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
      {(() => {
        const pos = activeIdx === CENTER_IDX ? HUB_POSITION : HEX_POSITIONS[activeIdx];
        return pos ? <ActiveHalo cx={pos.cx} cy={pos.cy} r={pos.r} stroke={color.stroke} /> : null;
      })()}
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
      {TRIAD_POSITIONS[activeIdx] && items[activeIdx] && (
        <ActiveHalo
          cx={TRIAD_POSITIONS[activeIdx].cx}
          cy={TRIAD_POSITIONS[activeIdx].cy}
          r={TRIAD_POSITIONS[activeIdx].r}
          stroke={(REGION_COLORS[activeIdx] ?? REGION_COLORS[0]).stroke}
        />
      )}
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
  forceUnlocked = false,
}: {
  onClose: () => void;
  langCode: string;
  forceUnlocked?: boolean;
}) {
  const { t, activeLocale, setActiveLocale, languages } = useLexicon();
  // The 7-level "Clearance Levels" picker + seal-strength tiers are an unlocked
  // (Easter-egg) power feature. The default public share is a single-circle
  // Level 1 seal with a standard code — File or Link. Deep-linking in via the
  // /atlantis QR forces the unlocked view (forceUnlocked).
  const { easterEggUnlocked } = useEasterEgg();
  const unlocked = easterEggUnlocked || forceUnlocked;
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

  // ── Downloadable clearance package (offline HTML, code-gated) ──
  const [pkgOpen, setPkgOpen] = useState(false);
  const [pkgClearance, setPkgClearance] = useState(1); // 1 = Red (default)
  const [pkgSender, setPkgSender] = useState("");
  const [pkgCode, setPkgCode] = useState<string | null>(null);
  const [pkgBusy, setPkgBusy] = useState(false);
  const [pkgStrength, setPkgStrength] = useState(0); // index into SEAL_STRENGTHS
  const [pkgMode, setPkgMode] = useState<"file" | "link">("file");
  const [pkgLink, setPkgLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrMax, setQrMax] = useState(false); // QR blown up to full screen
  const [qrCopied, setQrCopied] = useState(false);
  const copyAtlantisUrl = async () => {
    try {
      await navigator.clipboard.writeText(ATLANTIS_PAGE_URL);
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    } catch {
      /* clipboard blocked — URL stays visible for manual copy */
    }
  };
  const closeQr = () => {
    setShowQr(false);
    setQrMax(false);
  };

  // mode 'file' = self-contained offline .html (Android/PC). mode 'link' =
  // universal link that opens the hosted reader on ANY device incl. iPhone.
  const generatePackage = async (level: number, mode: "file" | "link", strengthIdx = pkgStrength) => {
    setPkgBusy(true);
    setLinkCopied(false);
    try {
      const gen = generateSealCode(SEAL_STRENGTHS[strengthIdx]);
      if (mode === "file") {
        const html = await buildAtlantisPackageHtml(ACCORD_TRANSLATIONS, ACCORD_LANG_NAMES, activeLocale, gen, level, pkgSender);
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        // Filename carries only the level number — never the color-name (e.g. "RED").
        a.download = `Atlantis-Accords-Clearance-${level}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
        setPkgLink(null);
      } else {
        const link = await buildAtlantisLink(ACCORD_TRANSLATIONS, ACCORD_LANG_NAMES, activeLocale, gen, level, pkgSender);
        setPkgLink(link);
        try {
          await navigator.clipboard.writeText(link);
          setLinkCopied(true);
        } catch {
          /* clipboard blocked — link still shown for manual copy */
        }
      }
      setPkgMode(mode);
      setPkgClearance(level);
      setPkgCode(gen);
    } finally {
      setPkgBusy(false);
    }
  };

  // Scroll icon → open the share panel where the sender picks File or Link.
  // Public default is always Level 1 + Standard strength; the Clearance Levels
  // and seal-strength pickers only appear once the Easter-egg feature is unlocked.
  const handleQuickPackage = () => {
    setPkgCode(null);
    setPkgLink(null);
    setLinkCopied(false);
    setPkgStrength(0);
    if (!unlocked) setPkgClearance(1);
    setPkgOpen(true);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background/98 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Scroll icon — download a shareable, 4-digit-gated offline package */}
          <button
            onClick={handleQuickPackage}
            title="Download sealed package — Clearance: Level 1, random 4-digit code"
            aria-label="Download sealed package"
            className="rounded-md border border-border p-2 text-primary hover:bg-accent/50 transition-colors"
          >
            <ScrollText className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-lg font-semibold">The Atlantis Accords</h2>
            <p className="text-[11px] text-muted-foreground">
              {t("shared.atlantis.tagline")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* QR to the website — same icon + QRCodeSVG method as the Divinity
              Guide ARX. Sits between the scroll share icon and the language selector. */}
          <button
            onClick={() => setShowQr(true)}
            className="p-2 rounded-md hover:bg-accent/50 transition-colors"
            title="Scan / share the website QR"
            aria-label="Website QR code"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-primary">
              <rect x="1" y="1" width="6" height="6" rx="1" strokeWidth="0" />
              <rect x="9" y="1" width="6" height="6" rx="1" strokeWidth="0" />
              <rect x="1" y="9" width="6" height="6" rx="1" strokeWidth="0" />
              <rect x="10" y="10" width="2" height="2" strokeWidth="0" />
              <rect x="13" y="10" width="2" height="2" strokeWidth="0" />
              <rect x="10" y="13" width="2" height="2" strokeWidth="0" />
              <rect x="13" y="13" width="2" height="2" strokeWidth="0" />
              <rect x="3" y="3" width="2" height="2" fill="var(--background, #000)" />
              <rect x="11" y="3" width="2" height="2" fill="var(--background, #000)" />
              <rect x="3" y="11" width="2" height="2" fill="var(--background, #000)" />
            </svg>
          </button>
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

      {/* Body: responsive split — SAME engine as the Divinity Guide book reader.
          Phone portrait (<md): flex-col, the whole body scrolls vertically.
          Phone landscape + desktop (>=md): flex-row two-pane split, each pane
          scrolls internally. Extra bottom padding keeps the pager clear of the
          floating eXeL badge (fixed bottom-6 right-6) when scrolled to the bottom. */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-6 pt-6 md:pt-8 pb-16 md:pb-16 [@media(max-height:600px)]:pt-2 [@media(max-height:600px)]:pb-2 [@media(max-height:600px)]:gap-3 overflow-y-auto md:overflow-hidden">
        {/* LEFT (md+) / TOP (mobile) — mode tabs (pinned top) + flower */}
        <div className="w-full md:w-1/2 shrink-0 flex flex-col items-center gap-3 md:min-h-0">
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
          <div className="w-full max-w-[560px] aspect-square md:aspect-auto md:flex-1 md:min-h-0 flex items-center justify-center">
            {view === "accord" ? (
              <AccordFlower activeIdx={activeIdx} onSelect={setActiveIdx} color={color} sevenLabels={sevenLabels} />
            ) : view === "approvals" ? (
              <TriangleFlower items={approvalItems} activeIdx={activeIdx} onSelect={setActiveIdx} />
            ) : (
              <TriangleFlower items={countryItems} activeIdx={activeIdx} onSelect={setActiveIdx} />
            )}
          </div>
        </div>

        {/* RIGHT (md+) / BOTTOM (mobile) — reader */}
        <div
          className="w-full md:w-1/2 flex flex-col min-w-0 md:min-h-0 md:overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {view === "accord" ? (
            <>
              {/* "PILOT · Where Innovation Begins" — tag white, title grey */}
              <h3 className="shrink-0 text-xl md:text-2xl font-bold tracking-tight mb-1 [@media(max-height:600px)]:text-base [@media(max-height:600px)]:mb-0.5">
                <span className="text-foreground">{section.tag}</span>{" "}
                <span className="font-normal text-muted-foreground">
                  · {t(`shared.atlantis.title.${section.id}`)}
                </span>
              </h3>
              <p className="shrink-0 mb-3 text-sm text-muted-foreground italic [@media(max-height:600px)]:mb-1.5 [@media(max-height:600px)]:text-xs">
                {t(`shared.atlantis.seven.${section.id}`)}
              </p>

              {/* Tier selector — colors the overview AND the flower */}
              <div className="shrink-0 flex gap-2 mb-3 [@media(max-height:600px)]:mb-1.5">
                {([33, 111, 333, 999] as Tier[])
                  // 999 pill appears only once the deepest tier has content (English source),
                  // so the selector never offers a tier that would fall back to 333.
                  .filter((n) => n !== 999 || !!ACCORD_SECTIONS_EN[activeIdx]?.content[999])
                  .map((n) => {
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
                className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line md:overflow-y-auto pr-2 md:flex-1 md:min-h-0 animate-in fade-in slide-in-from-right-2 duration-300"
              >
                {section.content[tier] ?? ACCORD_SECTIONS_EN[activeIdx]?.content[tier] ?? section.content[333]}
              </div>
            </>
          ) : view === "approvals" ? (
            <>
              <h3 className="shrink-0 text-xl md:text-2xl font-bold tracking-tight mb-2 [@media(max-height:600px)]:text-base [@media(max-height:600px)]:mb-0.5">
                <span className="text-foreground">{region.region}</span>{" "}
                <span className="font-normal text-muted-foreground">· {t("shared.atlantis.tab_approvals")}</span>
              </h3>
              {/* 33-word overview: why all three signatures are required */}
              <p className="shrink-0 mb-4 text-sm text-muted-foreground leading-relaxed [@media(max-height:600px)]:mb-2 [@media(max-height:600px)]:text-xs">
                {region.rationale}
              </p>

              <div
                key={activeIdx}
                className="space-y-3 md:overflow-y-auto pr-2 md:flex-1 md:min-h-0 animate-in fade-in slide-in-from-right-2 duration-300"
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
              <h3 className="shrink-0 text-xl md:text-2xl font-bold tracking-tight mb-2 [@media(max-height:600px)]:text-base [@media(max-height:600px)]:mb-0.5">
                <span className="text-foreground">{country.region}</span>{" "}
                <span className="font-normal text-muted-foreground">· {t("shared.atlantis.country_suffix")}</span>
              </h3>

              <div
                key={activeIdx}
                className="space-y-4 md:overflow-y-auto pr-2 md:flex-1 md:min-h-0 animate-in fade-in slide-in-from-right-2 duration-300"
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
          <div className="shrink-0 flex items-center justify-between pt-4 mt-4 border-t [@media(max-height:600px)]:pt-2 [@media(max-height:600px)]:mt-2">
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

      {/* ── Shareable clearance package dialog ── */}
      {pkgOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
             onClick={() => setPkgOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-background p-5 shadow-2xl"
               onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">Shareable Package</h3>
              <button onClick={() => setPkgOpen(false)} aria-label="Close"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>

            {pkgCode === null ? (
              <>
                {/* Sender is signed into the Light Codex (audit: sent when / by whom) — not shown on the cover. */}
                <label className="mb-1 block text-[11px] text-muted-foreground">Sender</label>
                <input
                  value={pkgSender}
                  onChange={(e) => setPkgSender(e.target.value)}
                  placeholder="eXeL AI"
                  className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                {unlocked ? (
                  <>
                    {/* ── Unlocked feature: Clearance Levels (1–7) ── */}
                    <p className="mb-2 text-xs text-muted-foreground">
                      <b>Clearance Levels</b> — pick how many Seed-of-Life circles the seal shows. Only the unlocked content is written into the file.
                    </p>
                    <div className="mb-4 grid grid-cols-7 gap-1.5">
                      {Array.from({ length: MAX_CLEARANCE }, (_, i) => i + 1).map((lvl) => {
                        const c = CLEARANCE_COLORS[lvl];
                        const active = pkgClearance === lvl;
                        return (
                          <button key={lvl} onClick={() => setPkgClearance(lvl)}
                            title={`Clearance: Level ${lvl}`}
                            className="flex flex-col items-center gap-1 rounded-md border p-1.5 transition-all"
                            style={{ borderColor: active ? c : "hsl(215 15% 25%)", background: active ? `${c}22` : "transparent" }}>
                            <span className="h-4 w-4 rounded-full" style={{ background: c }} />
                            <span className="text-[9px] font-mono" style={{ color: active ? c : "hsl(215 12% 55%)" }}>{lvl}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mb-3 text-[11px]" style={{ color: CLEARANCE_COLORS[pkgClearance] }}>
                      Clearance: Level {pkgClearance} — {pkgClearance} of {MAX_CLEARANCE} circles
                    </p>
                    <p className="mb-2 text-xs text-muted-foreground">
                      Select a <b>seal strength</b> — how hard the code is to break.
                    </p>
                    <div className="mb-2 grid grid-cols-3 gap-1.5">
                      {SEAL_STRENGTHS.map((s, i) => {
                        const active = pkgStrength === i;
                        const c = CLEARANCE_COLORS[pkgClearance];
                        return (
                          <button key={s.id} onClick={() => setPkgStrength(i)}
                            title={`${s.label} — ${s.len} ${s.numeric ? "digits" : "glyphs"} (~${s.bits} bits)`}
                            className="flex flex-col items-center gap-0.5 rounded-md border p-1.5 transition-all"
                            style={{ borderColor: active ? c : "hsl(215 15% 25%)", background: active ? `${c}18` : "transparent" }}>
                            <span className="text-[11px] font-semibold" style={{ color: active ? c : "hsl(215 12% 65%)" }}>
                              {s.numeral} · {s.label}
                            </span>
                            <span className="text-[9px] font-mono text-muted-foreground">
                              {s.len} {s.numeric ? "digits" : "glyphs"} · {s.share}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mb-3 text-[10px] leading-snug text-muted-foreground/80">
                      {SEAL_STRENGTHS[pkgStrength].honest}
                    </p>
                  </>
                ) : (
                  <p className="mb-3 text-xs text-muted-foreground">
                    Sealed at <b style={{ color: CLEARANCE_COLORS[1] }}>Clearance: Level 1</b> with a random 4-digit code you share separately.
                  </p>
                )}
                <p className="mb-2 text-xs text-muted-foreground">Choose how to share:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => generatePackage(pkgClearance, "file")} disabled={pkgBusy}
                    title="Self-contained .html — opens directly on Android, Edge & computers"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border border-border px-3 py-3 text-sm font-semibold hover:bg-accent/50 disabled:opacity-50">
                    <Download className="h-5 w-5 text-primary" />
                    <span>{pkgBusy ? "Sealing…" : "Download File"}</span>
                    <span className="text-[9px] font-normal text-muted-foreground">Android · Edge · Computer</span>
                  </button>
                  <button onClick={() => generatePackage(pkgClearance, "link")} disabled={pkgBusy}
                    title="Universal link — opens on any device, including iPhone & iPad"
                    className="flex flex-col items-center justify-center gap-1 rounded-lg border px-3 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                    style={{ background: CLEARANCE_COLORS[pkgClearance], borderColor: CLEARANCE_COLORS[pkgClearance] }}>
                    <Link2 className="h-5 w-5" />
                    <span>{pkgBusy ? "Sealing…" : "Copy Link"}</span>
                    <span className="text-[9px] font-normal opacity-90">Any device · iPhone</span>
                  </button>
                </div>
                <p className="mt-3 text-[10px] leading-snug text-muted-foreground/70">
                  Best-effort exclusivity: the one-time-view seal is soft (a saved copy can be reopened after clearing browser storage). Hides in plain sight; not certified secrecy.
                </p>
              </>
            ) : (
              <div className="text-center">
                <p className="mb-1 text-xs text-muted-foreground">
                  {pkgMode === "link" ? "Link copied. Share it privately, then share this code separately" : "Downloaded. Share this code privately"} ({SEAL_STRENGTHS[pkgStrength].share}):
                </p>
                <div
                  className={`my-3 font-bold ${pkgCode.length <= 4 ? "text-4xl tracking-[0.3em]" : pkgCode.length <= 8 ? "font-mono text-2xl tracking-[0.12em]" : "font-mono text-lg tracking-[0.08em]"}`}
                  style={{ color: CLEARANCE_COLORS[pkgClearance] }}>
                  {formatSealCode(pkgCode)}
                </div>
                <p className="mb-2 text-[11px] font-semibold" style={{ color: CLEARANCE_COLORS[pkgClearance] }}>
                  Clearance: Level {pkgClearance}
                </p>
                {pkgMode === "link" && pkgLink ? (
                  <>
                    <div className="mb-2 flex items-stretch gap-1.5">
                      <input readOnly value={pkgLink} onFocus={(e) => e.currentTarget.select()}
                        className="flex-1 min-w-0 rounded-md border border-border bg-background px-2 py-1.5 text-[10px] text-muted-foreground" />
                      <button
                        onClick={async () => { try { await navigator.clipboard.writeText(pkgLink); setLinkCopied(true); } catch { /* blocked */ } }}
                        title="Copy link"
                        className="flex items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-accent/50">
                        {linkCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="mb-4 text-[10px] leading-snug text-muted-foreground/80">
                      Opens on <b>any device — including iPhone &amp; iPad</b>. Only the encrypted message is stored (never the 4-digit code). It <b>opens once</b>, then the link seals itself. The recipient taps the link, then enters the code.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-3 text-[11px] text-muted-foreground">
                      The reader enters this code to open. The copy <b>seals after it is closed</b> and cannot be reopened — send a fresh copy to share again.
                    </p>
                    <p className="mb-4 text-[10px] leading-snug text-muted-foreground/70">
                      This document is sealed under the Atlantis Accords. Access is granted to the intended recipient alone, by the key entrusted to them.
                    </p>
                  </>
                )}
                <button onClick={() => setPkgOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent/50">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Website QR — QRCodeSVG (same method as Divinity Guide ARX).
          Direct deep-link to /atlantis (the Accords), shown with a Copy button;
          the Maximize icon blows the QR up to full screen for room-scale scans. */}
      {showQr && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={closeQr}>
          {qrMax ? (
            <div className="flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="rounded-2xl bg-white p-4 shadow-2xl">
                <QRCodeSVG
                  value={ATLANTIS_PAGE_URL}
                  size={512}
                  level="Q"
                  fgColor="#000000"
                  bgColor="#ffffff"
                  className="rounded-lg"
                  style={{ width: "min(86vw, 72vh)", height: "min(86vw, 72vh)" }}
                />
              </div>
              <p className="text-sm text-white/90">Scan to open The Atlantis Accords</p>
              <button
                onClick={() => setQrMax(false)}
                className="flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2 text-sm text-white hover:bg-white/10"
                aria-label="Exit full screen QR"
              >
                <Minimize2 className="h-4 w-4" /> Exit full screen
              </button>
            </div>
          ) : (
            <div className="w-full max-w-xs rounded-xl border border-border bg-background p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">The Atlantis Accords</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setQrMax(true)}
                    title="Full screen QR"
                    aria-label="Full screen QR"
                    className="rounded-md p-1 hover:bg-accent/50"
                  >
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={closeQr} aria-label="Close" className="rounded-md p-1 hover:bg-accent/50">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div className="mx-auto mb-3 w-fit rounded-2xl bg-white p-4 shadow-inner">
                <QRCodeSVG value={ATLANTIS_PAGE_URL} size={220} level="Q" fgColor="#000000" bgColor="#ffffff" className="rounded-lg" />
              </div>
              <p className="text-xs text-muted-foreground">Scan to open The Atlantis Accords</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="break-all text-[10px] text-muted-foreground/60">{ATLANTIS_PAGE_URL}</span>
                <button
                  onClick={copyAtlantisUrl}
                  title="Copy link"
                  aria-label="Copy Atlantis Accords link"
                  className="shrink-0 rounded-md border border-border p-1.5 hover:bg-accent/50"
                >
                  {qrCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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

      {/* Portal to <body> so the z-[70] fullscreen overlay escapes the Settings
          panel's z-50 stacking context and paints ABOVE the root PoweredBadge
          (fixed bottom-6 right-6 z-50) — otherwise the eXeL badge covers the
          pager's > arrow in landscape. */}
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <FullscreenViewer onClose={() => setOpen(false)} langCode={activeLocale} />,
          document.body,
        )}
    </section>
  );
}

// ─── Standalone page (/atlantis) ──────────────────────────────────────────────
// EXACT copy of the Settings → The Atlantis Accords master: same FullscreenViewer,
// same scroll-share, same public Level-1 default (advanced Clearance Levels still
// appear only after the Easter-egg unlock). The QR points here. Closing → home.
export function AtlantisAccordsStandalone() {
  const { activeLocale } = useLexicon();
  return (
    <FullscreenViewer
      onClose={() => {
        if (typeof window !== "undefined") window.location.href = "/";
      }}
      langCode={activeLocale}
    />
  );
}
