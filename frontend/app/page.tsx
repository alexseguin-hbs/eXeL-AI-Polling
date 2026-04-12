"use client";

import { useState } from "react";
import { SessionCodeInput } from "@/components/session-code-input";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Zap } from "lucide-react";
import { useLexicon } from "@/lib/lexicon-context";
import { useTheme } from "@/lib/theme-context";
import { SoITrinity } from "@/components/soi-trinity";

// 12 preset Trinities — cycle through on inner click
const TRINITY_PRESETS: { labels: [string, string, string]; color: string; title: string; master: string }[] = [
  // Consciousness = theme color (index 0). Then Violet → Red rainbow (ROYGBIV reversed).
  { labels: ["WISDOM",     "HARMONY",     "CONNECTION"],  color: "#00FFFF", title: "Consciousness",     master: "Christo" },
  { labels: ["CHILD",      "MOTHER",      "FATHER"],      color: "#A855F7", title: "Sacred Family",     master: "Aset" },
  { labels: ["SPIRIT",     "BODY",        "MIND"],        color: "#8B5CF6", title: "Wholeness",         master: "Krishna" },
  { labels: ["ACTION",     "FEELING",     "THOUGHT"],     color: "#6366F1", title: "Intelligence",      master: "Thoth" },
  { labels: ["H.I.",       "S.I.",        "A.I."],        color: "#3B82F6", title: "Trinity Framework",  master: "Asar" },
  { labels: ["TRUTH",      "BEAUTY",      "GOODNESS"],    color: "#14B8A6", title: "Platonic",          master: "Sofia" },
  { labels: ["ACT",        "DECIDE",      "OBSERVE"],     color: "#84CC16", title: "OODA Loop",         master: "Enlil" },
  { labels: ["SHARE",      "GIVE",        "RECEIVE"],     color: "#F59E0B", title: "Abundance",         master: "Pangu" },
  { labels: ["LEADERSHIP", "INTEGRATION", "ADAPTATION"],  color: "#F97316", title: "Governance",        master: "Athena" },
  { labels: ["PRESENT",    "FUTURE",      "PAST"],        color: "#F97316", title: "Temporal",          master: "Odin" },
  { labels: ["TRANSFORM",  "SUSTAIN",     "CREATE"],      color: "#EC4899", title: "Evolution",         master: "Enki" },
  { labels: ["LOVE",       "SAFETY",      "LOSS"],        color: "#EF4444", title: "Human",             master: "Thor" },
];

// Color palette (matches settings panel)
const COLOR_PALETTE = [
  { name: "Violet",       swatch: "#FF00FF" },
  { name: "Ocean Blue",   swatch: "#3B82F6" },
  { name: "Cyan",         swatch: "#00FFFF" },
  { name: "Green",        swatch: "#00FF00" },
  { name: "Emerald",      swatch: "#10B981" },
  { name: "Sunset",       swatch: "#FFFF00" },
  { name: "Burnt Orange", swatch: "#F97316" },
  { name: "Crimson Red",  swatch: "#FF0000" },
];

export default function LandingPage() {
  const { t } = useLexicon();
  const { currentTheme } = useTheme();
  const [trinityIndex, setTrinityIndex] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customLabels, setCustomLabels] = useState<[string, string, string]>(["YOUR", "WORDS", "HERE"]);
  const [customColor, setCustomColor] = useState("#10B981"); // Emerald for custom mode

  const currentPreset = TRINITY_PRESETS[trinityIndex];
  const displayLabels = customMode ? customLabels : currentPreset.labels;
  // Consciousness (index 0): follows theme color. Others: preset colors. Custom: user-picked.
  const displayColor = customMode ? customColor : trinityIndex === 0 ? currentTheme.swatch : currentPreset.color;
  const displayTitle = customMode ? "Your Trinity" : currentPreset.title;

  const handleInnerClick = () => {
    if (customMode) return;
    setTrinityIndex((i) => (i + 1) % TRINITY_PRESETS.length);
  };

  const handleUnityClick = () => {
    setCustomMode(!customMode);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        {/* Hero */}
        <div className="flex flex-col items-center gap-6 text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-primary">{t("shared.landing.hero_title_primary")}</span>{" "}
            <span className="text-muted-foreground">{t("shared.landing.hero_title_secondary")}</span>
          </h1>
          <p className="max-w-[600px] text-lg text-muted-foreground">
            {t("shared.landing.hero_subtitle")}
          </p>
        </div>

        {/* Session Code Input */}
        <div className="w-full max-w-xs mb-10">
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
                aria-label={customMode ? "Exit custom mode" : "Create your own Trinity"}
              />
              {/* Inner click zone — covers the 3 rings, on top of unity zone */}
              <button
                onClick={handleInnerClick}
                className="absolute top-[15%] left-[15%] w-[70%] h-[70%] rounded-full cursor-pointer z-20"
                aria-label={customMode ? "Custom mode active" : `Next Trinity`}
              />
            </div>
          </div>

          {/* Title + master + words */}
          <p className="text-sm font-semibold" style={{ color: displayColor }}>
            {displayTitle}
          </p>
          {customMode && (
            <p className="text-[10px] text-muted-foreground">Edit</p>
          )}

          {/* Custom mode: word inputs + color palette + download */}
          {customMode && (
            <div className="w-full space-y-3 animate-in fade-in duration-200">
              {/* Word inputs: Left, Top, Right (human reading order) */}
              {/* labels[0]=Top, labels[1]=Right, labels[2]=Left */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center">
                  <label className="text-[8px] text-muted-foreground mb-1">Left</label>
                  <input type="text" value={customLabels[2]} maxLength={12}
                    onChange={(e) => { const n = [...customLabels] as [string,string,string]; n[2] = e.target.value.toUpperCase(); setCustomLabels(n); }}
                    className="w-full text-center text-xs px-1 py-1 rounded border bg-background text-foreground" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="text-[8px] text-muted-foreground mb-1">Top</label>
                  <input type="text" value={customLabels[0]} maxLength={12}
                    onChange={(e) => { const n = [...customLabels] as [string,string,string]; n[0] = e.target.value.toUpperCase(); setCustomLabels(n); }}
                    className="w-full text-center text-xs px-1 py-1 rounded border bg-background text-foreground" />
                </div>
                <div className="flex flex-col items-center">
                  <label className="text-[8px] text-muted-foreground mb-1">Right</label>
                  <input type="text" value={customLabels[1]} maxLength={12}
                    onChange={(e) => { const n = [...customLabels] as [string,string,string]; n[1] = e.target.value.toUpperCase(); setCustomLabels(n); }}
                    className="w-full text-center text-xs px-1 py-1 rounded border bg-background text-foreground" />
                </div>
              </div>

              {/* Color palette */}
              <div className="flex flex-wrap justify-center gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button key={c.swatch} onClick={() => setCustomColor(c.swatch)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${customColor === c.swatch ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c.swatch }} title={c.name} />
                ))}
                <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)}
                  className="w-6 h-6 rounded-full cursor-pointer border-0 p-0" title="Custom color" />
              </div>

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
                Download PNG
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
    </div>
  );
}
