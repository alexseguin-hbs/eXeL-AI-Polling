"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";
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
import { SUPPORTED_LANGUAGES } from "@/lib/constants";
import { LanguageLexicon } from "@/components/language-lexicon";

// ─── Theme Customizer Section ───────────────────────────────────

function ThemeCustomizer() {
  const { currentTheme, setTheme } = useTheme();

  return (
    <section>
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Color Scheme
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {THEME_PRESETS.map((preset) => {
          const isActive = currentTheme.id === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setTheme(preset.id)}
              className={`relative flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent/50 ${
                isActive
                  ? "border-primary bg-accent/30"
                  : "border-border"
              }`}
            >
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-border"
                style={{ backgroundColor: preset.swatch }}
              />
              <span className="text-sm font-medium">{preset.name}</span>
              {isActive && (
                <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              )}
            </button>
          );
        })}
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
}

export function ModeratorSettings({ open, onClose, userEmail }: ModeratorSettingsProps) {
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
          <ThemeCustomizer />
          <Separator />
          <SettingsLanguageSelector />
          <Separator />
          <LanguageLexicon userEmail={userEmail} />
        </div>
      </div>
    </>
  );
}
