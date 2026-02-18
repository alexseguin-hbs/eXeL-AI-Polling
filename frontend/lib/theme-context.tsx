"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// CSS variable map — keys match globals.css :root variables (HSL values)
export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  "card-foreground": string;
  popover: string;
  "popover-foreground": string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  muted: string;
  "muted-foreground": string;
  accent: string;
  "accent-foreground": string;
  border: string;
  input: string;
  ring: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  /** A hex color shown as the swatch preview */
  swatch: string;
  colors: ThemeColors;
}

// ─── Preset themes ──────────────────────────────────────────────

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "exel-cyan",
    name: "eXeL Cyan",
    swatch: "#19C8CF",
    colors: {
      background: "213 29% 6%",
      foreground: "210 40% 98%",
      card: "213 29% 9%",
      "card-foreground": "210 40% 98%",
      popover: "213 29% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "182 78% 45%",
      "primary-foreground": "213 29% 6%",
      secondary: "183 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "183 33% 17%",
      "muted-foreground": "210 11% 64%",
      accent: "183 33% 17%",
      "accent-foreground": "210 40% 98%",
      border: "183 33% 17%",
      input: "183 33% 17%",
      ring: "182 78% 45%",
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    swatch: "#3B82F6",
    colors: {
      background: "222 47% 6%",
      foreground: "210 40% 98%",
      card: "222 47% 9%",
      "card-foreground": "210 40% 98%",
      popover: "222 47% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "217 91% 60%",
      "primary-foreground": "222 47% 6%",
      secondary: "217 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "217 33% 17%",
      "muted-foreground": "215 20% 65%",
      accent: "217 33% 17%",
      "accent-foreground": "210 40% 98%",
      border: "217 33% 17%",
      input: "217 33% 17%",
      ring: "217 91% 60%",
    },
  },
  {
    id: "emerald",
    name: "Emerald",
    swatch: "#10B981",
    colors: {
      background: "160 30% 6%",
      foreground: "210 40% 98%",
      card: "160 30% 9%",
      "card-foreground": "210 40% 98%",
      popover: "160 30% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "160 84% 39%",
      "primary-foreground": "160 30% 6%",
      secondary: "160 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "160 33% 17%",
      "muted-foreground": "160 11% 64%",
      accent: "160 33% 17%",
      "accent-foreground": "210 40% 98%",
      border: "160 33% 17%",
      input: "160 33% 17%",
      ring: "160 84% 39%",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    swatch: "#F59E0B",
    colors: {
      background: "30 30% 6%",
      foreground: "210 40% 98%",
      card: "30 30% 9%",
      "card-foreground": "210 40% 98%",
      popover: "30 30% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "38 92% 50%",
      "primary-foreground": "30 30% 6%",
      secondary: "35 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "35 33% 17%",
      "muted-foreground": "35 11% 64%",
      accent: "35 33% 17%",
      "accent-foreground": "210 40% 98%",
      border: "35 33% 17%",
      input: "35 33% 17%",
      ring: "38 92% 50%",
    },
  },
];

const STORAGE_KEY = "exel-theme-id";

// ─── Context ────────────────────────────────────────────────────

interface ThemeContextValue {
  currentTheme: ThemePreset;
  setTheme: (id: string) => void;
  presets: ThemePreset[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemePreset) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--${key}`, value);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<string>("exel-cyan");

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && THEME_PRESETS.find((p) => p.id === stored)) {
      setThemeId(stored);
    }
  }, []);

  // Apply CSS variables whenever themeId changes
  useEffect(() => {
    const preset = THEME_PRESETS.find((p) => p.id === themeId) ?? THEME_PRESETS[0];
    applyTheme(preset);
  }, [themeId]);

  const setTheme = useCallback((id: string) => {
    setThemeId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const currentTheme =
    THEME_PRESETS.find((p) => p.id === themeId) ?? THEME_PRESETS[0];

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, presets: THEME_PRESETS }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
