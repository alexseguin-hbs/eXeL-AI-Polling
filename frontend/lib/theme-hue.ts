"use client";

/**
 * One hue for every new surface (operator, 2026-09-07: "use all cyan or the selected color scheme").
 * The theme's `--primary` is an HSL triple ("183 100% 45%" = AI Cyan by default; a Settings preset
 * or custom colour otherwise). Tones are alphas of that one hue, so the three rings, the rail and the
 * receipts read as one scheme and change together when the moderator picks another preset. The
 * strings are literal `hsl(...)` values so they also work as SVG stroke/fill attributes.
 */
import { useTheme } from "@/lib/theme-context";

export interface ThemeHue { bright: string; mid: string; dim: string; faint: string; ink: string }

export const DEFAULT_PRIMARY = "183 100% 45%";
export const hueFrom = (primary: string): ThemeHue => ({
  bright: `hsl(${primary})`,
  mid: `hsl(${primary} / 0.78)`,
  dim: `hsl(${primary} / 0.58)`,
  faint: `hsl(${primary} / 0.22)`,
  ink: "#04121a",            // dark ink on a bright band
});

export function useThemeHue(): ThemeHue {
  let primary = DEFAULT_PRIMARY;
  try { primary = useTheme().currentTheme?.colors?.primary || DEFAULT_PRIMARY; } catch { /* outside the provider — default cyan */ }
  return hueFrom(primary);
}
