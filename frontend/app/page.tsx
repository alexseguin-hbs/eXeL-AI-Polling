"use client";

import { useState, useEffect } from "react";
import { SessionCodeInput } from "@/components/session-code-input";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Zap } from "lucide-react";
import { useLexicon } from "@/lib/lexicon-context";
import { useTheme } from "@/lib/theme-context";
import { SoITrinity } from "@/components/soi-trinity";
import { TrinityColorPicker } from "@/components/trinity-color-picker";
import { TRINITY_COLORS } from "@/lib/trinity-palette";

// 12 preset Trinities — cycle through on inner click
// Labels use lexicon keys; resolved at render time via t()
const TRINITY_PRESETS: { keys: [string, string, string]; color: string; titleKey: string; master: string }[] = [
  // Spectrum cycle: Infrared → ROYGBIV → Ultraviolet → White (even hue steps,
  // Settings palette anchored). Default start is Consciousness (Cyan) at index 7;
  // center-click advances forward and wraps.
  { keys: ["trinity.human.top", "trinity.human.right", "trinity.human.left"],                     color: TRINITY_COLORS.human, titleKey: "trinity.human.title",          master: "Thor" },
  { keys: ["trinity.evolution.top", "trinity.evolution.right", "trinity.evolution.left"],          color: TRINITY_COLORS.evolution, titleKey: "trinity.evolution.title",      master: "Enki" },
  { keys: ["trinity.intelligence.top", "trinity.intelligence.right", "trinity.intelligence.left"], color: TRINITY_COLORS.intelligence, titleKey: "trinity.intelligence.title",  master: "Thoth" },
  { keys: ["trinity.temporal.top", "trinity.temporal.right", "trinity.temporal.left"],             color: TRINITY_COLORS.temporal, titleKey: "trinity.temporal.title",       master: "Odin" },
  { keys: ["trinity.abundance.top", "trinity.abundance.right", "trinity.abundance.left"],         color: TRINITY_COLORS.abundance, titleKey: "trinity.abundance.title",      master: "Pangu" },
  { keys: ["trinity.ooda.top", "trinity.ooda.right", "trinity.ooda.left"],                       color: TRINITY_COLORS.ooda, titleKey: "trinity.ooda.title",           master: "Enlil" },
  { keys: ["trinity.platonic.top", "trinity.platonic.right", "trinity.platonic.left"],            color: TRINITY_COLORS.platonic, titleKey: "trinity.platonic.title",       master: "Sofia" },
  { keys: ["trinity.consciousness.top", "trinity.consciousness.right", "trinity.consciousness.left"], color: TRINITY_COLORS.consciousness, titleKey: "trinity.consciousness.title", master: "Christo" },
  { keys: ["trinity.framework.top", "trinity.framework.right", "trinity.framework.left"],        color: TRINITY_COLORS.framework, titleKey: "trinity.framework.title",      master: "Asar" },
  { keys: ["trinity.wholeness.top", "trinity.wholeness.right", "trinity.wholeness.left"],        color: TRINITY_COLORS.wholeness, titleKey: "trinity.wholeness.title",      master: "Krishna" },
  { keys: ["trinity.family.top", "trinity.family.right", "trinity.family.left"],                 color: TRINITY_COLORS.family, titleKey: "trinity.family.title",         master: "Aset" },
  { keys: ["trinity.governance.top", "trinity.governance.right", "trinity.governance.left"],     color: TRINITY_COLORS.governance, titleKey: "trinity.governance.title",     master: "Athena" },
  { keys: ["trinity.blank.top", "trinity.blank.right", "trinity.blank.left"],                    color: TRINITY_COLORS.blank, titleKey: "trinity.blank.title",          master: "" },
];

// 8 preset color swatches — quick select, then fine-tune via expanded picker
// Order: red on the left → violet on the right
const COLOR_PALETTE = [
  { name: "Crimson Red",  swatch: "#FF0000" },
  { name: "Burnt Orange", swatch: "#F97316" },
  { name: "Sunset",       swatch: "#FFFF00" },
  { name: "Emerald",      swatch: "#10B981" },
  { name: "Green",        swatch: "#00FF00" },
  { name: "Cyan",         swatch: "#00FFFF" },
  { name: "Ocean Blue",   swatch: "#3B82F6" },
  { name: "Violet",       swatch: "#FF00FF" },
];

export default function LandingPage() {
  const { t, pinyin } = useLexicon();
  const { currentTheme } = useTheme();
  const [trinityIndex, setTrinityIndex] = useState(7); // Start at Consciousness (Cyan, index 7 in ROYGBIV order)
  const [customMode, setCustomMode] = useState(false);
  const [customLabels, setCustomLabels] = useState<[string, string, string] | null>(null);
  const [customColor, setCustomColor] = useState("#10B981"); // Emerald for custom mode
  const [pickerOpen, setPickerOpen] = useState(false);
  // Center the SECURITY-2525 link at the MIDPOINT of the gap between the Give Feedback button (bottom-left)
  // and the eXeL AI badge (bottom-right) — not viewport centre, since the Give Feedback pill is wider.
  // Recomputes on resize / rotate so it stays proportional on phone AND landscape. Falls back to null
  // (viewport centre) if the icons aren't mounted yet.
  const [secLeft, setSecLeft] = useState<number | null>(null);
  useEffect(() => {
    const place = () => {
      const fb = document.querySelector("[data-feedback-fab]")?.getBoundingClientRect();
      const ex = document.querySelector("[data-exel-badge]")?.getBoundingClientRect();
      if (fb && ex && ex.left > fb.right) setSecLeft((fb.right + ex.left) / 2);
      else setSecLeft(null);
    };
    place();
    const raf = requestAnimationFrame(place); // badges mount after this page paints
    window.addEventListener("resize", place);
    window.addEventListener("orientationchange", place);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", place); window.removeEventListener("orientationchange", place); };
  }, []);

  const currentPreset = TRINITY_PRESETS[trinityIndex];
  const resolvedLabels: [string, string, string] = [t(currentPreset.keys[0]), t(currentPreset.keys[1]), t(currentPreset.keys[2])];
  // Custom mode: show user-typed words if edited, otherwise show translated placeholders
  // Order: [top, right, left] — YOUR (top), WORDS (left), HERE (right)
  const customDefaults: [string, string, string] = [t("trinity.custom.placeholder_1"), t("trinity.custom.placeholder_3"), t("trinity.custom.placeholder_2")];
  const displayLabels = customMode ? (customLabels ?? customDefaults) : resolvedLabels;
  // Consciousness (index 7): follows theme color. Others: preset rainbow colors. Custom: user-picked.
  const displayColor = customMode ? customColor : trinityIndex === 7 ? currentTheme.swatch : currentPreset.color;
  const displayTitle = customMode ? t("trinity.custom.title") : t(currentPreset.titleKey);

  const handleInnerClick = () => {
    if (customMode) return;
    setTrinityIndex((i) => (i + 1) % TRINITY_PRESETS.length);
  };

  const handleUnityClick = () => {
    if (customMode) { setCustomLabels(null); setPickerOpen(false); } // reset on exit
    setCustomMode(!customMode);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        {/* Hero */}
        <div className="flex flex-col items-center gap-6 text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <ruby className="text-primary">{t("shared.landing.hero_title_primary")}{pinyin("shared.landing.hero_title_primary") && <rp>(</rp>}{pinyin("shared.landing.hero_title_primary") && <rt className="text-xs font-normal">{pinyin("shared.landing.hero_title_primary")}</rt>}{pinyin("shared.landing.hero_title_primary") && <rp>)</rp>}</ruby>{" "}
            <ruby className="text-muted-foreground">{t("shared.landing.hero_title_secondary")}{pinyin("shared.landing.hero_title_secondary") && <rp>(</rp>}{pinyin("shared.landing.hero_title_secondary") && <rt className="text-xs font-normal">{pinyin("shared.landing.hero_title_secondary")}</rt>}{pinyin("shared.landing.hero_title_secondary") && <rp>)</rp>}</ruby>
          </h1>
          <p className="max-w-[600px] text-lg text-muted-foreground">
            {t("shared.landing.hero_subtitle")}
            {pinyin("shared.landing.hero_subtitle") && (
              <span className="block text-sm text-muted-foreground/60 mt-1 italic">{pinyin("shared.landing.hero_subtitle")}</span>
            )}
          </p>
        </div>

        {/* Session Code Input — same width as features grid */}
        <div className="w-full max-w-3xl mb-10">
          <SessionCodeInput />
        </div>

        {/* Features */}
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3 mb-10">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">{t("shared.landing.feature_ai")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("shared.landing.feature_ai_desc")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">{t("shared.landing.feature_scale")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("shared.landing.feature_scale_desc")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">{t("shared.landing.feature_governance")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("shared.landing.feature_governance_desc")}
            </p>
          </div>
        </div>

        {/* SoI Trinity — interactive */}
        <div className="flex flex-col items-center gap-2 mb-8 w-full max-w-xs">
          {/* Trinity SVG — inner click cycles, outer click unlocks custom */}
          <div className="relative w-full flex justify-center">
            {/* Inner rings clickable area (cycles presets) */}
            <div className="relative">
              <div className="pointer-events-none">
                <SoITrinity
                  labels={displayLabels}
                  color={displayColor}
                  size={240}
                  className="trinity-export-target"
                />
              </div>
              {/* Unity ring click zone — outer area (behind inner) */}
              <button
                onClick={handleUnityClick}
                className="absolute inset-0 rounded-full z-10 cursor-pointer"
                aria-label={customMode ? t("trinity.aria.exit_custom") : t("trinity.aria.create_custom")}
              />
              {/* Inner click zone — covers the 3 rings, on top of unity zone */}
              <button
                onClick={handleInnerClick}
                className="absolute top-[15%] left-[15%] w-[70%] h-[70%] rounded-full cursor-pointer z-20"
                aria-label={customMode ? t("trinity.aria.custom_active") : t("trinity.aria.next")}
              />
            </div>
          </div>

          {/* Title + master + words. Easter egg: when the white "Trinity Framework" preset is showing, the
              title text is a HIDDEN hyperlink to the Celestial-2525 sky reader — styled identically (no
              underline), so it isn't apparent. A little gift for whoever cycles to the Framework. */}
          <p className="text-sm font-semibold" style={{ color: displayColor }}>
            {!customMode && currentPreset.titleKey === "trinity.framework.title" ? (
              <a href="/main/Celestial-2525/" data-trinity-egg style={{ color: "inherit", textDecoration: "none" }}>
                {displayTitle}
              </a>
            ) : displayTitle}
          </p>
          {customMode && (
            <p className="text-[10px] text-muted-foreground">{t("trinity.custom.edit")}</p>
          )}

          {/* Custom mode: word inputs + color palette + download */}
          {customMode && (
            <div className="w-full space-y-3 animate-in fade-in duration-200">
              {/* Word inputs: Left, Top, Right (human reading order) */}
              {/* labels[0]=Top, labels[1]=Right, labels[2]=Left */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center">
                  <label className="text-[8px] text-muted-foreground mb-1">{t("trinity.custom.left")}</label>
                  <input type="text" value={displayLabels[2]} maxLength={12}
                    onChange={(e) => { const base = customLabels ?? [...customDefaults] as [string,string,string]; const n = [...base] as [string,string,string]; n[2] = e.target.value.toUpperCase(); setCustomLabels(n); }}
                    className="w-full text-center text-xs px-1 py-1 rounded border bg-background text-foreground" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="text-[8px] text-muted-foreground mb-1">{t("trinity.custom.top")}</label>
                  <input type="text" value={displayLabels[0]} maxLength={12}
                    onChange={(e) => { const base = customLabels ?? [...customDefaults] as [string,string,string]; const n = [...base] as [string,string,string]; n[0] = e.target.value.toUpperCase(); setCustomLabels(n); }}
                    className="w-full text-center text-xs px-1 py-1 rounded border bg-background text-foreground" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="text-[8px] text-muted-foreground mb-1">{t("trinity.custom.right")}</label>
                  <input type="text" value={displayLabels[1]} maxLength={12}
                    onChange={(e) => { const base = customLabels ?? [...customDefaults] as [string,string,string]; const n = [...base] as [string,string,string]; n[1] = e.target.value.toUpperCase(); setCustomLabels(n); }}
                    className="w-full text-center text-xs px-1 py-1 rounded border bg-background text-foreground" />
                </div>
              </div>

              {/* Color swatches — quick select */}
              <div className="flex flex-wrap justify-center gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button key={c.swatch} onClick={() => { setCustomColor(c.swatch); setPickerOpen(false); }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${customColor === c.swatch ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c.swatch }} title={c.name} />
                ))}
                {/* Toggle advanced picker */}
                <button
                  onClick={() => setPickerOpen((p) => !p)}
                  className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center text-[10px] ${pickerOpen ? "border-white bg-muted" : "border-muted-foreground/30 bg-muted/50 hover:border-muted-foreground"}`}
                  title={t("trinity.custom.custom_color")}
                  style={!COLOR_PALETTE.some((c) => c.swatch === customColor) ? { backgroundColor: customColor, borderColor: "white" } : {}}
                >
                  {COLOR_PALETTE.some((c) => c.swatch === customColor) ? "+" : ""}
                </button>
              </div>

              {/* Expanded color picker — Grid / Spectrum / Sliders */}
              {pickerOpen && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <TrinityColorPicker value={customColor} onChange={setCustomColor} />
                </div>
              )}

              {/* Download PNG (black/background → transparent) */}
              <button
                onClick={() => {
                  const svgEl = document.querySelector(".trinity-export-target");
                  if (!svgEl) return;
                  // Clone SVG and replace background color with transparent for export
                  const clone = svgEl.cloneNode(true) as SVGElement;
                  // Replace all var(--background) and dark bg strokes with transparent
                  clone.querySelectorAll("circle, rect, path").forEach((el) => {
                    const stroke = el.getAttribute("stroke") || "";
                    const fill = el.getAttribute("fill") || "";
                    if (stroke.includes("var(--background") || stroke.includes("#0a1628")) {
                      el.setAttribute("stroke", "transparent");
                    }
                    if (fill.includes("var(--background") || fill.includes("#0a1628")) {
                      el.setAttribute("fill", "transparent");
                    }
                  });
                  // Also handle inline styles
                  clone.querySelectorAll("[style]").forEach((el) => {
                    const s = (el as HTMLElement).style;
                    if (s.stroke?.includes("var(--background")) s.stroke = "transparent";
                    if (s.fill?.includes("var(--background")) s.fill = "transparent";
                  });
                  const svgData = new XMLSerializer().serializeToString(clone);
                  const canvas = document.createElement("canvas");
                  canvas.width = 960; canvas.height = 960;
                  const ctx = canvas.getContext("2d");
                  if (!ctx) return;
                  const img = new Image();
                  img.onload = () => {
                    ctx.clearRect(0, 0, 960, 960);
                    ctx.drawImage(img, 0, 0, 960, 960);
                    const a = document.createElement("a");
                    a.download = `trinity-${displayLabels.join("-").toLowerCase()}.png`;
                    a.href = canvas.toDataURL("image/png");
                    a.click();
                  };
                  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                }}
                className="w-full text-center text-xs py-1.5 rounded border hover:bg-accent transition-colors text-muted-foreground"
              >
                {t("trinity.custom.download")}
              </button>
            </div>
          )}
        </div>

        {/* Moderator CTA */}
        <div className="flex flex-col items-center gap-2 mb-12">
          <Separator className="w-24 mb-4" />
          <p className="text-sm text-muted-foreground">{t("shared.landing.facilitator_cta")}</p>
          <Button variant="outline" asChild>
            <a href="/dashboard/">{t("shared.landing.facilitator_button")}</a>
          </Button>
        </div>
      </main>
      {/* DIRECT access to SECURITY-2525 — bottom-centre, between the Give Feedback button (bottom-left)
          and the eXeL AI badge (bottom-right). NOT Easter-egg gated; lands on the PLANNING tab. */}
      <a href="/main/Security-2525/"
        className={`fixed bottom-6 z-50 -translate-x-1/2 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline ${secLeft == null ? "left-1/2" : ""}`}
        style={secLeft == null ? undefined : { left: secLeft }}>
        SECURITY-2525
      </a>
      {/* CELESTIAL-2525 is now reached ONLY via the hidden easter-egg link on the "Trinity Framework" title
          (below the white trinity emblem) — no visible footer link. A little gift for the curious. */}
    </div>
  );
}
