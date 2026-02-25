"use client";

import { useRef, useState } from "react";
import { X, Check, Pipette, Mic, Shield } from "lucide-react";
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
import { CubeArchitectureStatus } from "@/components/cube-status";

// ─── Theme Customizer Section ───────────────────────────────────

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
  const colorInputRef = useRef<HTMLInputElement>(null);

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

        {/* 9th slot: Custom color picker */}
        <button
          onClick={() => !disabled && colorInputRef.current?.click()}
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
          <input
            ref={colorInputRef}
            type="color"
            value={customAccentColor ?? "#19C8CF"}
            onChange={(e) => handleCustomColorChange(e.target.value)}
            className="sr-only"
            aria-label="Pick custom accent color"
          />
        </button>
      </div>
    </section>
  );
}

// ─── Language Selector Section — wired to Language Lexicon ───────

/** Languages pinned to top of dropdown for quick access */
const PINNED_CODES = ["en", "es"];

function SettingsLanguageSelector() {
  const { activeLocale, setActiveLocale, languages, t } = useLexicon();

  const approved = languages.filter((l) => l.status === "approved");
  const pinned = PINNED_CODES.map((c) => approved.find((l) => l.code === c)).filter(Boolean) as typeof approved;
  const rest = approved.filter((l) => !PINNED_CODES.includes(l.code)).sort((a, b) => a.nameNative.localeCompare(b.nameNative));
  const sortedLangs = [...pinned, ...rest];

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
          {sortedLangs.map((lang, i) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.nameNative}</span>
                <span className="text-muted-foreground">({lang.nameEn})</span>
              </span>
              {i === pinned.length - 1 && rest.length > 0 && (
                <Separator className="mt-1" />
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </section>
  );
}

// ─── V2T Provider Selector Section ───────────────────────────────

/** STT providers available at MVP launch with circuit breaker failover */
const V2T_PROVIDERS = [
  { id: "whisper", label: "OpenAI Whisper", langCount: 57 },
  { id: "grok", label: "Grok (xAI)", langCount: 57 },
  { id: "gemini", label: "Gemini (Google)", langCount: 33 },
  { id: "aws", label: "AWS Transcribe", langCount: 23 },
] as const;

function V2TProviderSelector() {
  const { t } = useLexicon();
  const [selectedProvider, setSelectedProvider] = useState("whisper");

  return (
    <section>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <Mic className="h-4 w-4" />
        {t("cube3.settings.v2t_provider")}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
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
              <span className="text-xs text-muted-foreground">
                {provider.langCount} {t("cube3.settings.v2t_languages")}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* All users see language + theme; moderators also see admin sections */}
          <SettingsLanguageSelector />
          <Separator />
          <ThemeCustomizer disabled={isPollingUser} />
          {!isPollingUser && (
            <>
              <Separator />
              <V2TProviderSelector />
              <Separator />
              <CubeArchitectureStatus />
              <Separator />
              <LanguageLexicon userEmail={userEmail} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
