"use client";

import { useRef, useState } from "react";
import { X, Check, Pipette } from "lucide-react";
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
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { LanguageLexicon } from "@/components/language-lexicon";
import { CubeArchitectureStatus } from "@/components/cube-status";

// Easter egg sequence: exel-cyan → sunset → violet within 3 seconds
const EASTER_EGG_SEQUENCE = ["exel-cyan", "sunset", "violet"];

// ─── Theme Customizer Section ───────────────────────────────────

function ThemeCustomizer({ disabled }: { disabled?: boolean }) {
  const {
    currentTheme,
    setTheme,
    setSessionTheme,
    setCustomAccent,
    customAccentColor,
  } = useTheme();
  const { activated: easterEggActivated, activate: activateEasterEgg } = useEasterEgg();
  const colorInputRef = useRef<HTMLInputElement>(null);

  // Track last 3 theme selections with timestamps for easter egg
  const selectionsRef = useRef<{ id: string; time: number }[]>([]);

  const handlePresetSelect = (id: string) => {
    if (disabled) return;
    setTheme(id);
    setSessionTheme(id);

    // Easter egg detection
    if (!easterEggActivated) {
      const now = Date.now();
      selectionsRef.current.push({ id, time: now });
      // Keep only last 3
      if (selectionsRef.current.length > 3) {
        selectionsRef.current = selectionsRef.current.slice(-3);
      }
      // Check sequence
      if (selectionsRef.current.length === 3) {
        const [first, second, third] = selectionsRef.current;
        const withinTime = third.time - first.time < 3000;
        const correctSequence =
          first.id === EASTER_EGG_SEQUENCE[0] &&
          second.id === EASTER_EGG_SEQUENCE[1] &&
          third.id === EASTER_EGG_SEQUENCE[2];
        if (withinTime && correctSequence) {
          activateEasterEgg();
        }
      }
    }
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
        Session Color Scheme
      </h3>
      {disabled ? (
        <p className="text-xs text-muted-foreground mb-3">
          Color scheme is set by your session moderator.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground mb-3">
          Applies to all participants in this session.
        </p>
      )}
      <div
        className="grid grid-cols-3 gap-2"
        style={disabled ? { pointerEvents: "none", opacity: 0.4 } : undefined}
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
            Custom
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

// ─── Language Selector Section (placeholder for UI locale) ──────

function SettingsLanguageSelector() {
  const [locale, setLocale] = useState("en");

  return (
    <section>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Interface Language
      </h3>
      <p className="text-xs text-muted-foreground mb-2">
        Sets the display language for the moderator dashboard. Full locale
        switching coming soon.
      </p>
      <Select value={locale} onValueChange={setLocale}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.native}</span>
                <span className="text-muted-foreground">({lang.name})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <ThemeCustomizer disabled={isPollingUser} />
          <Separator />
          <CubeArchitectureStatus />
          <Separator />
          <SettingsLanguageSelector />
          <Separator />
          <LanguageLexicon userEmail={userEmail} />
        </div>
      </div>
    </>
  );
}
