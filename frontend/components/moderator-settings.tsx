"use client";

import { useState } from "react";
import { X, Check, Pipette, Mic, Shield, ChevronDown, ChevronUp, DollarSign, Sparkles, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useTheme, THEME_PRESETS } from "@/lib/theme-context";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { useLexicon } from "@/lib/lexicon-context";
import { LanguageLexicon } from "@/components/language-lexicon";
import { AtlantisAccordViewer } from "@/components/atlantis-accord-viewer";
import { LightCodexSettingsRow } from "@/components/light-codex-cube";
import { CubeArchitectureStatus } from "@/components/cube-status";
import { FeedbackWidget } from "@/components/feedback-widget";
import { PoweredBadge } from "@/components/powered-badge";
import { TrinityColorPicker } from "@/components/trinity-color-picker";
import { getSortedLanguages } from "@/lib/language-utils";

// ─── Theme Customizer Section ───────────────────────────────────

// Default accent seeded when Custom is first activated (AI Cyan — the pre-auth default).
const DEFAULT_CUSTOM_ACCENT = "#19C8CF";

function ThemeCustomizer({ disabled }: { disabled?: boolean }) {
  const {
    currentTheme,
    setTheme,
    setSessionTheme,
    setCustomAccent,
    customAccentColor,
  } = useTheme();
  const { registerThemeClick, enterSimulationMode } = useEasterEgg();
  const { t } = useLexicon();

  const handlePresetSelect = (id: string) => {
    // Feed every theme click into Easter egg sequence detector (always active)
    const unlocked = registerThemeClick(id);
    if (unlocked) {
      enterSimulationMode();
    }
    // Only moderators can change theme — guarded by both disabled prop and theme context
    if (disabled) return;
    setTheme(id);
    setSessionTheme(id);
  };

  const handleCustomColorChange = (hex: string) => {
    if (disabled) return;
    setCustomAccent(hex);
    setSessionTheme("custom");
  };

  // Clicking the Custom tile activates custom mode (seeding a default accent if
  // none is set yet) and reveals the Trinity color picker below the grid.
  const handleCustomTileClick = () => {
    if (disabled) return;
    handleCustomColorChange(customAccentColor ?? DEFAULT_CUSTOM_ACCENT);
  };

  const isCustomActive = currentTheme.id === "custom";

  return (
    <section>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {t("cube1.settings.color_scheme")}
      </h3>
      {disabled ? (
        <p className="text-xs text-muted-foreground mb-3">
          {t("cube1.settings.color_set_by_mod")}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mb-3">
          {t("cube1.settings.color_applies_all")}
        </p>
      )}
      <div
        className="grid grid-cols-3 gap-2"
        style={disabled ? { opacity: 0.4 } : undefined}
      >
        {/* 8 preset themes */}
        {THEME_PRESETS.map((preset) => {
          const isActive = currentTheme.id === preset.id;
          return (
            <button
              key={preset.id}
              // Test hook only — the easter-egg gate has to drive the REAL sequence
              // (exel-cyan → sunset → violet), and it cannot click what it cannot address.
              data-theme-preset={preset.id}
              onClick={() => handlePresetSelect(preset.id)}
              className={`relative flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors hover:bg-accent/50 ${
                isActive
                  ? "border-primary bg-accent/30"
                  : "border-border"
              }`}
            >
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: preset.swatch }}
              />
              <span className="text-xs font-medium text-center leading-tight">
                {preset.name}
              </span>
              {isActive && (
                <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-primary" />
              )}
            </button>
          );
        })}

        {/* 9th slot: Custom — activates the Trinity color picker below the grid */}
        <button
          onClick={handleCustomTileClick}
          className={`relative flex flex-col items-center gap-1.5 rounded-lg border p-2.5 transition-colors hover:bg-accent/50 ${
            isCustomActive
              ? "border-primary bg-accent/30"
              : "border-border"
          }`}
        >
          <span
            className="h-8 w-8 shrink-0 rounded-full border border-border flex items-center justify-center"
            style={{
              backgroundColor: isCustomActive && customAccentColor
                ? customAccentColor
                : "transparent",
            }}
          >
            {!(isCustomActive && customAccentColor) && (
              <Pipette className="h-4 w-4 text-muted-foreground" />
            )}
          </span>
          <span className="text-xs font-medium text-center leading-tight">
            {t("cube1.settings.custom")}
          </span>
          {isCustomActive && (
            <Check className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-primary" />
          )}
        </button>
      </div>

      {/* Trinity color picker — the same Grid / Spectrum / Sliders tool used by
          the home-page Trinity logo creator. Shown once Custom is active so the
          moderator can dial in any hex; onChange applies to the live session. */}
      {isCustomActive && !disabled && (
        <div className="mt-3 rounded-lg border border-border p-3">
          <TrinityColorPicker
            value={customAccentColor ?? DEFAULT_CUSTOM_ACCENT}
            onChange={handleCustomColorChange}
          />
        </div>
      )}
    </section>
  );
}

// ─── Language Selector Section — wired to Language Lexicon ───────
// Uses shared getSortedLanguages() from language-utils.ts (same source as navbar Globe)

function SettingsLanguageSelector() {
  const { activeLocale, setActiveLocale, languages, t } = useLexicon();
  const { sorted, pinnedCount } = getSortedLanguages(languages);

  return (
    <section>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        {t("cube1.join.select_language")}
      </h3>
      <p className="text-xs text-muted-foreground mb-2">
        {t("cube1.join.select_language_desc")}
      </p>
      <Select value={activeLocale} onValueChange={setActiveLocale}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder={t("cube1.join.select_language")} />
        </SelectTrigger>
        <SelectContent>
          {sorted.map((lang, i) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.nameNative}</span>
                <span className="text-muted-foreground">({lang.nameEn})</span>
              </span>
              {i === pinnedCount - 1 && sorted.length > pinnedCount && (
                <Separator className="mt-1" />
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </section>
  );
}

// ─── Cost Estimation Table ──────────────────────────────────────

/**
 * AI cost estimates for 1000 users × 1 response × 111 words.
 * 500 type / 500 voice (when V2T is enabled by Moderator).
 * Summary = Phase A (single-prompt JSON) + Phase B (theming ~30% overhead).
 * V2T = 500 voice users × 0.74 min audio each = 370 min total.
 */
const COST_COMBOS = [
  { summary: "OpenAI",  v2t: "Whisper",   sumCost: 0.33,  v2tCost: 2.22,  isDefault: true },
  { summary: "Gemini",  v2t: "Gemini",    sumCost: 0.22,  v2tCost: 0.06,  isDefault: false },
  { summary: "Gemini",  v2t: "Whisper",   sumCost: 0.22,  v2tCost: 2.22,  isDefault: false },
  { summary: "Grok",    v2t: "Whisper",   sumCost: 5.25,  v2tCost: 2.22,  isDefault: false },
  { summary: "Claude",  v2t: "Whisper",   sumCost: 7.87,  v2tCost: 2.22,  isDefault: false },
  { summary: "Claude",  v2t: "Azure",     sumCost: 7.87,  v2tCost: 5.92,  isDefault: false },
  { summary: "Claude",  v2t: "AWS",       sumCost: 7.87,  v2tCost: 8.88,  isDefault: false },
] as const;

function CostEstimateTable() {
  const { t } = useLexicon();
  const [showCosts, setShowCosts] = useState(false);

  return (
    <section>
      <button
        onClick={() => setShowCosts(!showCosts)}
        className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{t("cube1.settings.cost_estimate_heading")}</span>
        </div>
        {showCosts ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {showCosts && (
        <div className="mt-3 rounded-lg border border-border overflow-hidden">
          {/* Header */}
          <div className="bg-muted/50 px-3 py-2">
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              1,000 users &times; 1 response &times; 111 words &nbsp;|&nbsp; 500 type / 500 voice
            </p>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-4 gap-0 px-3 py-1.5 border-b border-border bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span>{t("cube1.settings.cost_combo")}</span>
            <span className="text-right">{t("cube1.settings.cost_summary")}</span>
            <span className="text-right">{t("cube1.settings.cost_v2t")}</span>
            <span className="text-right">{t("cube1.settings.cost_total")}</span>
          </div>

          {/* Rows */}
          {COST_COMBOS.map((c, i) => {
            const total = c.sumCost + c.v2tCost;
            const label = `${c.summary} + ${c.v2t}`;
            return (
              <div
                key={i}
                className={`grid grid-cols-4 gap-0 px-3 py-2 border-b border-border/50 last:border-b-0 ${
                  c.isDefault ? "bg-primary/5" : ""
                }`}
              >
                <span className="text-xs font-medium flex items-center gap-1">
                  {label}
                  {c.isDefault && (
                    <span className="text-[8px] bg-primary/20 text-primary rounded px-1 py-0.5 uppercase font-semibold">
                      {t("cube1.settings.cost_default")}
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground text-right font-mono">
                  ${c.sumCost.toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground text-right font-mono">
                  ${c.v2tCost.toFixed(2)}
                </span>
                <span className={`text-xs text-right font-mono font-semibold ${
                  total < 1 ? "text-green-500" : total < 5 ? "text-foreground" : "text-orange-400"
                }`}>
                  ${total.toFixed(2)}
                </span>
              </div>
            );
          })}

          {/* Footer note */}
          <div className="px-3 py-2 bg-muted/30 space-y-1">
            <p className="text-[9px] text-muted-foreground">
              {t("cube1.settings.cost_note_formula")}
            </p>
            <p className="text-[9px] text-muted-foreground">
              {t("cube1.settings.cost_note_free")}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── V2T Provider Selector Section ───────────────────────────────

/** STT providers available at MVP launch with circuit breaker failover */
const V2T_PROVIDERS = [
  { id: "whisper", label: "OpenAI Whisper", langCount: 57, ratePerMin: 0.006, est1k: "$2.22" },
  { id: "gemini", label: "Gemini (Google)", langCount: 33, ratePerMin: 0.00016, est1k: "$0.06" },
  { id: "grok", label: "Grok (xAI)", langCount: 57, ratePerMin: 0.006, est1k: "$2.22" },
  { id: "aws", label: "AWS Transcribe", langCount: 23, ratePerMin: 0.024, est1k: "$8.88" },
] as const;

function V2TProviderSelector() {
  const { t } = useLexicon();
  const [selectedProvider, setSelectedProvider] = useState("whisper");
  const [expanded, setExpanded] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const activeProvider = V2T_PROVIDERS.find((p) => p.id === selectedProvider) ?? V2T_PROVIDERS[0];

  if (!expanded) {
    return (
      <section>
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("cube3.settings.v2t_provider")}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {activeProvider.label}
          </span>
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Mic className="h-4 w-4" />
          {t("cube3.settings.v2t_provider")}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => setExpanded(false)}
        >
          {t("cube1.settings.collapse")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("cube3.settings.v2t_desc")}
      </p>

      <div className="space-y-2">
        {V2T_PROVIDERS.map((provider) => {
          const isActive = selectedProvider === provider.id;
          return (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-accent/50 ${
                isActive
                  ? "border-primary bg-accent/30"
                  : "border-border"
              }`}
            >
              <div className="flex items-center gap-2">
                {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                <span className="text-sm font-medium">{provider.label}</span>
              </div>
              <div className="flex items-center gap-3">
                {showPricing && (
                  <span className="text-[10px] text-primary font-mono">
                    {provider.est1k}/1k
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {provider.langCount} {t("cube3.settings.v2t_languages")}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Pricing toggle */}
      <button
        onClick={() => setShowPricing(!showPricing)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <DollarSign className="h-3 w-3" />
        {showPricing ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {t("cube3.settings.v2t_pricing")}
      </button>

      {showPricing && (
        <div className="rounded-md border border-border/50 bg-muted/30 px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            {t("cube3.settings.v2t_estimate_title")}
          </p>
          <div className="space-y-1">
            {V2T_PROVIDERS.map((p) => (
              <div key={p.id} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-mono text-foreground">{p.est1k}</span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground pt-1 border-t border-border/50">
            {t("cube3.settings.v2t_estimate_note")}
          </p>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2">
        <Shield className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t("cube3.settings.v2t_fallback")}
        </p>
      </div>
    </section>
  );
}

// ─── Settings Panel ─────────────────────────────────────────────

interface ModeratorSettingsProps {
  open: boolean;
  onClose: () => void;
  userEmail?: string;
  isPollingUser?: boolean;
}

export function ModeratorSettings({ open, onClose, userEmail, isPollingUser }: ModeratorSettingsProps) {
  const { t } = useLexicon();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l bg-background shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold">
            {isPollingUser ? t("cube1.settings.title") : t("cube1.settings.moderator_title")}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ⚠ THE `pb-20` THAT USED TO BE HERE WAS RESERVING 80px FOR A BADGE THAT WAS NOT THERE.
            It said "so the last row clears the floating eXeL badge", but the badge stopped floating when
            `providers.tsx` moved it to a docked page footer — behind this z-50 panel, where scrolling can
            never reach it. That stale reservation is exactly what made the defect invisible: the panel
            looked like it had a badge slot, so nobody checked whether a badge was in it. The badge is now a
            real row at the foot of this list, so the padding it was standing in for is gone with it. */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-6 space-y-6">
          {/* All users see language + theme; moderators also see admin sections */}
          <SettingsLanguageSelector />
          <Separator />
          <ThemeCustomizer disabled={isPollingUser} />
          {!isPollingUser && (
            <>
              <Separator />
              <CostEstimateTable />
              <Separator />
              <V2TProviderSelector />
              <Separator />
              <CubeArchitectureStatus />
              <Separator />
              <LanguageLexicon userEmail={userEmail} />
              <Separator />
              <AtlantisAccordViewer />
              {/* ⚠ VISION 2525 LIVES HERE NOW, NOT BEHIND THE EASTER EGG (operator: "Place Vision 2525
                  link under Atlantis Accords in settings and remove from easter egg"). It is the public
                  manifesto — Humanity's Coordination Framework — so gating it behind a theme-click sequence
                  hid the one page that explains what the whole product is for. The matching VISION HUB tile
                  was deleted from the easter-egg launcher in the same commit; a lock holds that it exists in
                  exactly one place, so this is a MOVE and never becomes two entry points that drift. */}
              <Separator />
              <a
                data-vision-2525-link
                href="/vision-2525/"
                className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Vision &bull; 2525</div>
                    <div className="text-xs text-muted-foreground">Humanity&apos;s Coordination Framework</div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </a>
              {/* EXECUTIVE SUMMARY DEEP DIVE (operator: "the Executive summary to place in settings as a
                  deep dive ... under the QR code link"). Sits directly beneath the Vision • 2525 entry —
                  the framework link — and opens the standalone, self-contained deep-dive page served at
                  /whitepaper/vision-2525-executive-summary.html. Content is the operator-frozen eXeL text,
                  verbatim ("don't change anything"). */}
              <a
                data-executive-summary-link
                href="/whitepaper/vision-2525-executive-summary.html"
                className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <div className="text-sm font-semibold text-foreground">Executive Summary to Humanity</div>
                    <div className="text-xs text-muted-foreground">A deep dive &mdash; Vision &bull; 2525</div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">→</span>
              </a>
              {/* Light Codex — hidden until the Easter-egg unlock; the row
                  renders null otherwise, so no Separator artifact when locked. */}
              <LightCodexSettingsRow />
            </>
          )}
          {/* ⚠ FEEDBACK + eXeL AI AT THE VERY BOTTOM, BELOW ATLANTIS ACCORD (operator, verbatim).
              WHY IT HAD TO MOVE: these two live in the global page footer (`providers.tsx` SiteFooter),
              which is normal-flow content sitting BEHIND this `fixed … z-50` panel. With Settings open there
              was no amount of scrolling that could reach the eXeL badge — and the badge is the second half
              of the easter egg (theme sequence arms it, clicking it enters Simulation Mode), so the unlock
              was effectively dead from this screen.
              SAME TWO COMPONENTS, NOT COPIES: `FeedbackWidget` and `PoweredBadge` are the exact ones the
              footer renders, in the same `docked` mode — one implementation, so a fix lands in both places.
              `badgeOnly` keeps the footer instance the sole owner of the Simulation overlay (see its prop
              doc); without it the egg would mount two launchers at once.
              OUTSIDE the `!isPollingUser` block ON PURPOSE: `registerThemeClick` fires before the
              `disabled` guard in ThemeCustomizer, so a polling user can arm the egg too and must be able to
              reach the badge. Feedback is for everyone by definition. */}
          <Separator />
          <div data-settings-footer className="flex items-center justify-end gap-3 pt-1">
            <FeedbackWidget screen="settings" docked />
            <PoweredBadge docked badgeOnly />
          </div>
        </div>
      </div>
    </>
  );
}
