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

// ─── Color utilities ────────────────────────────────────────────

/** Convert hex (#RRGGBB) to HSL "H S% L%" string */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** Generate a full theme from a custom accent hex color (background stays dark neutral) */
export function generateCustomTheme(accentHex: string): ThemePreset {
  const { h, s, l } = hexToHsl(accentHex);
  const hsl = `${h} ${s}% ${l}%`;
  const hslDim = `${h} 33% 17%`;
  const hslMutedFg = `${h} 11% 64%`;

  return {
    id: "custom",
    name: "Custom",
    swatch: accentHex,
    colors: {
      background: "220 25% 6%",
      foreground: "210 40% 98%",
      card: "220 25% 9%",
      "card-foreground": "210 40% 98%",
      popover: "220 25% 9%",
      "popover-foreground": "210 40% 98%",
      primary: hsl,
      "primary-foreground": "220 25% 6%",
      secondary: hslDim,
      "secondary-foreground": "210 40% 98%",
      muted: hslDim,
      "muted-foreground": hslMutedFg,
      accent: hslDim,
      "accent-foreground": "210 40% 98%",
      border: hslDim,
      input: hslDim,
      ring: hsl,
    },
  };
}

// ─── 8 Preset themes + Custom ───────────────────────────────────

// 3x3 grid order: Violet | Indigo | Cyan
//                  Blue   | Green  | Custom (handled in UI)
//                  Yellow  | Coral  | Red
export const THEME_PRESETS: ThemePreset[] = [
  // Row 1: Violet, Indigo, Cyan
  {
    id: "violet",
    name: "\uc6c3 Violet",
    swatch: "#8D516F",
    colors: {
      background: "330 27% 6%",
      foreground: "210 40% 98%",
      card: "330 27% 9%",
      "card-foreground": "210 40% 98%",
      popover: "330 27% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "330 27% 44%",
      "primary-foreground": "210 40% 98%",
      secondary: "330 20% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "330 20% 17%",
      "muted-foreground": "330 11% 64%",
      accent: "330 20% 17%",
      "accent-foreground": "210 40% 98%",
      border: "330 20% 17%",
      input: "330 20% 17%",
      ring: "330 27% 44%",
    },
  },
  {
    id: "indigo",
    name: "Indigo",
    swatch: "#6366F1",
    colors: {
      background: "239 30% 6%",
      foreground: "210 40% 98%",
      card: "239 30% 9%",
      "card-foreground": "210 40% 98%",
      popover: "239 30% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "239 84% 67%",
      "primary-foreground": "239 30% 6%",
      secondary: "239 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "239 33% 17%",
      "muted-foreground": "239 11% 64%",
      accent: "239 33% 17%",
      "accent-foreground": "210 40% 98%",
      border: "239 33% 17%",
      input: "239 33% 17%",
      ring: "239 84% 67%",
    },
  },
  {
    id: "exel-cyan",
    name: "\u25EC Cyan",
    swatch: "#00D7E4",
    colors: {
      background: "183 30% 6%",
      foreground: "210 40% 98%",
      card: "183 30% 9%",
      "card-foreground": "210 40% 98%",
      popover: "183 30% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "183 100% 45%",
      "primary-foreground": "183 30% 6%",
      secondary: "183 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "183 33% 17%",
      "muted-foreground": "183 11% 64%",
      accent: "183 33% 17%",
      "accent-foreground": "210 40% 98%",
      border: "183 33% 17%",
      input: "183 33% 17%",
      ring: "183 100% 45%",
    },
  },
  // Row 2: Blue, Green, Custom (custom is position 6 in UI grid)
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
  // (Custom color picker is position 6 — handled in moderator-settings.tsx UI)
  // Row 3: Yellow (♡ Sunset), Coral, Red
  {
    id: "sunset",
    name: "\u2661 Sunset",
    swatch: "#D3B20F",
    colors: {
      background: "50 30% 6%",
      foreground: "210 40% 98%",
      card: "50 30% 9%",
      "card-foreground": "210 40% 98%",
      popover: "50 30% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "50 87% 44%",
      "primary-foreground": "50 30% 6%",
      secondary: "50 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "50 33% 17%",
      "muted-foreground": "50 11% 64%",
      accent: "50 33% 17%",
      "accent-foreground": "210 40% 98%",
      border: "50 33% 17%",
      input: "50 33% 17%",
      ring: "50 87% 44%",
    },
  },
  {
    id: "coral",
    name: "Coral",
    swatch: "#F97316",
    colors: {
      background: "24 30% 6%",
      foreground: "210 40% 98%",
      card: "24 30% 9%",
      "card-foreground": "210 40% 98%",
      popover: "24 30% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "25 95% 53%",
      "primary-foreground": "24 30% 6%",
      secondary: "24 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "24 33% 17%",
      "muted-foreground": "24 11% 64%",
      accent: "24 33% 17%",
      "accent-foreground": "210 40% 98%",
      border: "24 33% 17%",
      input: "24 33% 17%",
      ring: "25 95% 53%",
    },
  },
  {
    id: "red",
    name: "Red",
    swatch: "#EF4444",
    colors: {
      background: "0 30% 6%",
      foreground: "210 40% 98%",
      card: "0 30% 9%",
      "card-foreground": "210 40% 98%",
      popover: "0 30% 9%",
      "popover-foreground": "210 40% 98%",
      primary: "0 84% 60%",
      "primary-foreground": "0 30% 6%",
      secondary: "0 33% 17%",
      "secondary-foreground": "210 40% 98%",
      muted: "0 33% 17%",
      "muted-foreground": "0 11% 64%",
      accent: "0 33% 17%",
      "accent-foreground": "210 40% 98%",
      border: "0 33% 17%",
      input: "0 33% 17%",
      ring: "0 84% 60%",
    },
  },
];

const STORAGE_KEY = "exel-theme-id";
const SESSION_THEME_KEY = "exel-session-theme-id";
const CUSTOM_ACCENT_KEY = "exel-custom-accent";

/** Valid preset theme IDs */
export const VALID_THEME_IDS = [...THEME_PRESETS.map((p) => p.id), "custom"];

// ─── Context ────────────────────────────────────────────────────

interface ThemeContextValue {
  currentTheme: ThemePreset;
  /** Set theme by preset ID (saved to localStorage) */
  setTheme: (id: string) => void;
  /** Set the session-level theme — cascades to all participants. When set, overrides local preference. */
  setSessionTheme: (id: string | null) => void;
  /** The active session theme ID (null if no session context) */
  sessionThemeId: string | null;
  /** Set a custom accent hex color (triggers "custom" theme) */
  setCustomAccent: (hex: string) => void;
  /** Current custom accent hex (null if not set) */
  customAccentColor: string | null;
  presets: ThemePreset[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: ThemePreset) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--${key}`, value);
  }
}

function resolveTheme(
  id: string,
  customAccent: string | null
): ThemePreset {
  if (id === "custom" && customAccent) {
    return generateCustomTheme(customAccent);
  }
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [localThemeId, setLocalThemeId] = useState<string>("exel-cyan");
  const [sessionThemeId, setSessionThemeIdState] = useState<string | null>(null);
  const [customAccentColor, setCustomAccentColor] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedLocal = localStorage.getItem(STORAGE_KEY);
    if (storedLocal && VALID_THEME_IDS.includes(storedLocal)) {
      setLocalThemeId(storedLocal);
    }
    const storedSession = localStorage.getItem(SESSION_THEME_KEY);
    if (storedSession && VALID_THEME_IDS.includes(storedSession)) {
      setSessionThemeIdState(storedSession);
    }
    const storedAccent = localStorage.getItem(CUSTOM_ACCENT_KEY);
    if (storedAccent && /^#[0-9A-Fa-f]{6}$/.test(storedAccent)) {
      setCustomAccentColor(storedAccent);
    }
  }, []);

  // Session theme overrides local preference
  const effectiveThemeId = sessionThemeId ?? localThemeId;

  // Apply CSS variables whenever effective theme changes
  useEffect(() => {
    applyTheme(resolveTheme(effectiveThemeId, customAccentColor));
  }, [effectiveThemeId, customAccentColor]);

  const setTheme = useCallback((id: string) => {
    setLocalThemeId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const setSessionTheme = useCallback((id: string | null) => {
    setSessionThemeIdState(id);
    if (id) {
      localStorage.setItem(SESSION_THEME_KEY, id);
    } else {
      localStorage.removeItem(SESSION_THEME_KEY);
    }
  }, []);

  const setCustomAccent = useCallback(
    (hex: string) => {
      setCustomAccentColor(hex);
      localStorage.setItem(CUSTOM_ACCENT_KEY, hex);
      // Auto-select "custom" theme when a custom accent is picked
      setLocalThemeId("custom");
      localStorage.setItem(STORAGE_KEY, "custom");
    },
    []
  );

  const currentTheme = resolveTheme(effectiveThemeId, customAccentColor);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        setSessionTheme,
        sessionThemeId,
        setCustomAccent,
        customAccentColor,
        presets: THEME_PRESETS,
      }}
    >
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
