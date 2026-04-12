"use client";

import { useState } from "react";
import { SessionCodeInput } from "@/components/session-code-input";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Zap } from "lucide-react";
import { useLexicon } from "@/lib/lexicon-context";
import { SoITrinity } from "@/components/soi-trinity";

// 12 preset Trinities — cycle through on inner click
const TRINITY_PRESETS: { labels: [string, string, string]; color: string; title: string }[] = [
  { labels: ["WISDOM",     "HARMONY",     "CONNECTION"],  color: "#10B981", title: "Consciousness" },
  { labels: ["LEADERSHIP", "INTEGRATION", "ADAPTATION"],  color: "#F59E0B", title: "Governance" },
  { labels: ["LOVE",       "SAFETY",      "LOSS"],        color: "#EF4444", title: "Human" },
  { labels: ["ACTION",     "FEELING",     "THOUGHT"],     color: "#6366F1", title: "Intelligence" },
  { labels: ["H.I.",       "S.I.",        "A.I."],        color: "#3B82F6", title: "Core Trinity" },
  { labels: ["TRUTH",      "BEAUTY",      "GOODNESS"],    color: "#14B8A6", title: "Platonic" },
  { labels: ["TRANSFORM",  "SUSTAIN",     "CREATE"],      color: "#EC4899", title: "Evolution" },
  { labels: ["SPIRIT",     "BODY",        "MIND"],        color: "#8B5CF6", title: "Wholeness" },
  { labels: ["PRESENT",    "FUTURE",      "PAST"],        color: "#F97316", title: "Temporal" },
  { labels: ["SON",        "MOTHER",      "FATHER"],      color: "#A855F7", title: "Sacred Family" },
  { labels: ["ACT",        "DECIDE",      "OBSERVE"],     color: "#84CC16", title: "OODA Loop" },
  { labels: ["SHARE",      "GIVE",        "RECEIVE"],     color: "#22D3EE", title: "Abundance" },
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
  const [trinityIndex, setTrinityIndex] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customLabels, setCustomLabels] = useState<[string, string, string]>(["YOUR", "WORDS", "HERE"]);
  const [customColor, setCustomColor] = useState("#10B981");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const currentPreset = TRINITY_PRESETS[trinityIndex];
  const displayLabels = customMode ? customLabels : currentPreset.labels;
  const displayColor = customMode ? customColor : currentPreset.color;
  const displayTitle = customMode ? "Your Trinity" : currentPreset.title;

  const handleInnerClick = () => {
    if (customMode) return;
    setTrinityIndex((i) => (i + 1) % TRINITY_PRESETS.length);
  };

  const handleUnityClick = () => {
    setCustomMode(!customMode);
    setShowColorPicker(false);
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
              <SoITrinity
                labels={displayLabels}
                color={displayColor}
                size={240}
              />
              {/* Inner click zone — covers the 3 rings area */}
              <button
                onClick={handleInnerClick}
                className="absolute top-[15%] left-[15%] w-[70%] h-[70%] rounded-full cursor-pointer z-10"
                aria-label={customMode ? "Custom mode active" : `Next Trinity (${trinityIndex + 1}/12)`}
              />
              {/* Unity ring click zone — outer ring only */}
              <button
                onClick={handleUnityClick}
                className="absolute inset-0 rounded-full z-0"
                style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
                aria-label={customMode ? "Exit custom mode" : "Create your own Trinity"}
              />
            </div>
          </div>

          {/* Title + counter */}
          <p className="text-sm font-semibold" style={{ color: displayColor }}>
            {displayTitle}
          </p>
          {!customMode && (
            <p className="text-[9px] text-muted-foreground/50">
              {trinityIndex + 1}/12 — tap center to explore
            </p>
          )}

          {/* Custom mode: word inputs + color palette */}
          {customMode && (
            <div className="w-full space-y-3 animate-in fade-in duration-200">
              {/* Word inputs */}
              <div className="grid grid-cols-3 gap-2">
                {(["Top", "Left", "Right"] as const).map((pos, i) => (
                  <div key={pos} className="flex flex-col items-center">
                    <label className="text-[8px] text-muted-foreground mb-1">{pos}</label>
                    <input
                      type="text"
                      value={customLabels[i]}
                      onChange={(e) => {
                        const next = [...customLabels] as [string, string, string];
                        next[i] = e.target.value.toUpperCase();
                        setCustomLabels(next);
                      }}
                      maxLength={12}
                      className="w-full text-center text-xs px-1 py-1 rounded border bg-background text-foreground"
                    />
                  </div>
                ))}
              </div>

              {/* Color palette */}
              <div className="flex flex-wrap justify-center gap-2">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.swatch}
                    onClick={() => setCustomColor(c.swatch)}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      customColor === c.swatch ? "border-white scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c.swatch }}
                    title={c.name}
                  />
                ))}
                {/* Custom color input */}
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-6 h-6 rounded-full cursor-pointer border-0 p-0"
                  title="Custom color"
                />
              </div>

              <p className="text-[8px] text-muted-foreground/40 text-center">
                Click the outer ring to exit custom mode
              </p>
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
