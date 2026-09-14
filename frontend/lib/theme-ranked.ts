// Ranked-themes + tier selection — pure, deterministic core for the default "see these
// themes, ranked, with a 33/111/333 description" panel (operator 2026-09-14). Kept UI-free
// and unit-locked (tests/theme-ranked.test.mjs) so ranking + tier gating can't drift.
import type { ThemeInfo } from "@/lib/types";

export type DescTier = "33" | "111" | "333";
export const DESC_TIERS: DescTier[] = ["33", "111", "333"];

/**
 * Rank themes for display. Default order is by response count (desc) — the natural
 * "priority" when no live aggregated Cube-7 ranking is supplied. When `order` (a list of
 * theme labels, e.g. from GET /sessions/{id}/rankings) is given, it wins; unranked themes
 * fall to the end by count. Empty/padded placeholder slots are dropped. Deterministic:
 * ties break by label so the same inputs always render the same order.
 */
export function rankThemes(themes: ThemeInfo[], order?: string[]): ThemeInfo[] {
  const real = (themes || []).filter((t) => t && !t.isEmpty && (t.count ?? 0) > 0 && (t.label ?? "").trim() !== "");
  if (order && order.length) {
    const pos = new Map(order.map((l, i) => [l, i]));
    return [...real].sort((a, b) => {
      const pa = pos.has(a.label) ? (pos.get(a.label) as number) : Infinity;
      const pb = pos.has(b.label) ? (pos.get(b.label) as number) : Infinity;
      if (pa !== pb) return pa - pb;
      if ((b.count ?? 0) !== (a.count ?? 0)) return (b.count ?? 0) - (a.count ?? 0);
      return a.label.localeCompare(b.label);
    });
  }
  return [...real].sort((a, b) => {
    if ((b.count ?? 0) !== (a.count ?? 0)) return (b.count ?? 0) - (a.count ?? 0);
    return a.label.localeCompare(b.label);
  });
}

/**
 * Pick a theme's description at the requested tier, applying the SAME paid gate as the
 * response drawer: 33 is always free; 111/333 require `isPaidTier`. Falls back gracefully
 * (333→111→33) so the panel never renders blank, and never leaks a paid tier to a free tier.
 */
export function pickTier(theme: ThemeInfo, tier: DescTier, isPaidTier: boolean): string {
  const s33 = theme.summary33 || "";
  if (tier === "33" || !isPaidTier) return s33;
  if (tier === "111") return theme.summary111 || s33;
  return theme.summary333 || theme.summary111 || s33;
}

/** Whether a tier is available to this viewer (free=33 only unless paid). Drives the toggle's
 *  disabled state, mirroring response-drawer gating. */
export function tierAvailable(tier: DescTier, isPaidTier: boolean): boolean {
  return tier === "33" || isPaidTier;
}
