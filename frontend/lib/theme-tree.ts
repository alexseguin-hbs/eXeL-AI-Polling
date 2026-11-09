// t182 (2026-11-09): strict theme tree layout for the Flower of Life sub-theme view.
// Every level-3 theme keeps a FIXED slot (angle) and colour; at level 6 each splits into its 2 children and at
// level 9 into its 3, drawn inside that slot's sector in the parent's colour — so turning the dial reads as
// 1 → 2 → 3 per parent, not a reshuffle. Pure + unit-locked (tests/theme-tree.test.mjs). Coordinates share the
// viewBox(0 0 600 500) space of lib/flower-geometry.ts.
import type { ThemeInfo } from "@/lib/types";
import type { CirclePosition } from "@/lib/flower-geometry";

const CX = 300, CY = 250;
const SLOT_ANGLE = (i: number) => -90 + i * 120;
const RING: Record<3 | 6 | 9, { d: number; r: number; spread: number }> = {
  3: { d: 130, r: 100, spread: 0 },
  6: { d: 150, r: 68, spread: 28 },
  9: { d: 165, r: 52, spread: 38 },
};

export interface TreeBubble { theme: ThemeInfo; pos: CirclePosition; slot: number; parentPos: CirclePosition }

const at = (deg: number, d: number, r: number): CirclePosition => {
  const rad = (deg * Math.PI) / 180;
  return { cx: CX + d * Math.cos(rad), cy: CY + d * Math.sin(rad), r };
};

/** The level-3 slot position (fixed per parent index). */
export function slotPosition(slot: number): CirclePosition {
  return at(SLOT_ANGLE(slot), RING[3].d, RING[3].r);
}

/**
 * Lay out `themes` (the current level) under their level-3 parents. Returns null — caller falls back to the free
 * layout — when the tree is not usable: no parents, a parent without an id, or any non-empty child whose
 * parent_id does not resolve (directly, or through a level-6 parent in `allRows`) to one of the level-3 themes.
 */
export function buildTreeLayout(level3: ThemeInfo[], themes: ThemeInfo[], level: 3 | 6 | 9, allRows: ThemeInfo[] = []): TreeBubble[] | null {
  const parents = level3.filter((p) => !p.isEmpty);
  if (!parents.length || parents.length > 3 || parents.some((p) => !p.id)) return null;
  const slotOf = new Map(parents.map((p, i) => [p.id!, i] as const));
  if (level === 3) return parents.map((p, i) => ({ theme: p, pos: slotPosition(i), slot: i, parentPos: slotPosition(i) }));
  const byId = new Map(allRows.filter((r) => r.id).map((r) => [r.id!, r] as const));
  const rootOf = (t: ThemeInfo): number | undefined => {
    let pid = t.parentId ?? undefined;
    for (let hops = 0; pid && hops < 3; hops++) {
      if (slotOf.has(pid)) return slotOf.get(pid);
      pid = byId.get(pid)?.parentId ?? undefined;
    }
    return undefined;
  };
  const groups: ThemeInfo[][] = parents.map(() => []);
  for (const t of themes) {
    if (t.isEmpty) continue;
    const s = rootOf(t);
    if (s === undefined) return null;
    groups[s].push(t);
  }
  const { d, r, spread } = RING[level];
  const out: TreeBubble[] = [];
  groups.forEach((kids, slot) => {
    const sorted = [...kids].sort((a, b) => b.count - a.count);
    const n = sorted.length;
    sorted.forEach((t, k) => {
      const offset = n > 1 ? -spread + (2 * spread * k) / (n - 1) : 0;
      // three children: the middle one sits a little further out so the trio reads as a fan
      const dd = level === 9 && n === 3 && k === 1 ? d + 22 : d;
      out.push({ theme: t, pos: at(SLOT_ANGLE(slot) + offset, dd, r), slot, parentPos: slotPosition(slot) });
    });
  });
  return out;
}

/** A fixed colour per slot, derived from the category colour by rotating its hue (−32°, 0°, +32°). */
export function slotColor(hex: string, slot: number, alpha?: number): string {
  const m = hex.replace("#", "").match(/.{2}/g);
  if (!m) return hex;
  const [r, g, b] = m.map((x) => parseInt(x, 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, dlt = max - min;
  let h = 0;
  if (dlt) h = max === r ? ((g - b) / dlt) % 6 : max === g ? (b - r) / dlt + 2 : (r - g) / dlt + 4;
  const s = dlt ? dlt / (1 - Math.abs(2 * l - 1)) : 0;
  const hue = (((h * 60 + [-32, 0, 32][slot % 3]) % 360) + 360) % 360;
  const hs = `${Math.round(hue)}, ${Math.round(s * 100)}%, ${Math.round(Math.min(0.62, Math.max(0.45, l)) * 100)}%`;
  return alpha === undefined ? `hsl(${hs})` : `hsla(${hs}, ${alpha})`;
}
