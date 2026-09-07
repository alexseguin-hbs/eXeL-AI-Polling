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
  // Unconditional: every app page sits under ThemeProvider (components/providers.tsx wraps both the
  // Auth0 and the no-Auth0 branches). A try/catch here read as a conditional hook to the build's
  // lint gate and broke every production build after c5775b1 — the live site froze at 7938fab.
  const { currentTheme } = useTheme();
  return hueFrom(currentTheme?.colors?.primary || DEFAULT_PRIMARY);
}
