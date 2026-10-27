/**
 * ARCHITECT-2525 · SIMULATE — ENVIRONMENT GENERATOR (operator 2026-10-27).
 * ============================================================================================================
 * Pressing a form's SIMULATE "creates that environment": this produces, deterministically, WHERE each of the home's
 * nine rooms (and therefore all its furniture) lands in each of the three forms — Cube (3×3 grid) · Tiny Home (open
 * 900 ft²) · Eco-Sphere (7 hexagons under a hex dome). The operator's law: "all rooms furniture of 3x3 should be
 * placed somewhere in Tiny home and Hex Ecosphere." So EVERY form places all nine room keys (M/B/C/L/K/D/O/S/E);
 * the Eco-Sphere merges the nine rooms into seven hexagons (1 centre + 6). Furniture itself is the REAL set from
 * defaultObjectsForRoom() — nothing invented — projected into each room's rectangle by the renderer (projectPlaced).
 *
 * Pure + deterministic (no Date.now / Math.random) → replay-safe + gate-tested. Conservation is provable:
 * the set of placed room keys == the nine real keys, for all three forms.
 */
import { TINY_ROOM_LAYOUT } from "@/lib/room-layout";
import { defaultObjectsForRoom, type PlacedObject } from "@/lib/room-objects";

export type FormId = "3x3-grid" | "tiny" | "eco-sphere";
export interface Rect { x: number; y: number; w: number; h: number; }
export interface RoomPlacement { roomKey: string; label: string; rect: Rect; }
export interface EnvHex { cx: number; cy: number; r: number; roomKeys: string[]; }
export interface SimEnvironment {
  formId: FormId;
  view: number;                 // square viewBox side (svg units)
  shell: "grid" | "open" | "hex";
  placements: RoomPlacement[];  // ALL nine rooms (conserved); furniture = defaultObjectsForRoom(roomKey)
  hexes?: EnvHex[];             // Eco-Sphere only — the seven hexagons to draw (with the rooms they hold)
  dome?: boolean;               // Eco-Sphere draws a hex dome
}

const ROOMS = TINY_ROOM_LAYOUT.map((r) => ({ key: r.k, label: r.label, row: r.row, col: r.col }));
/** The nine real room keys the home carries, in 3×3 order. */
export const ALL_ROOM_KEYS: string[] = ROOMS.map((r) => r.key);
const labelOf = (k: string): string => ROOMS.find((r) => r.key === k)?.label ?? k;

const VIEW = 120;
const MARGIN = 6;

// ── Cube — the nine rooms on a 3×3 grid (the standard) ─────────────────────────────────────────────────────────
export function gridEnvironment(): SimEnvironment {
  const side = VIEW - 2 * MARGIN;
  const cell = side / 3;
  const placements = ROOMS.map((r) => ({
    roomKey: r.key, label: r.label,
    rect: { x: MARGIN + r.col * cell, y: MARGIN + r.row * cell, w: cell, h: cell },
  }));
  return { formId: "3x3-grid", view: VIEW, shell: "grid", placements };
}

// ── Tiny Home — the same nine rooms' furniture in ONE open 900 ft² volume (same zones, no interior walls) ───────
export function openEnvironment(): SimEnvironment {
  const g = gridEnvironment();
  return { formId: "tiny", view: VIEW, shell: "open", placements: g.placements.map((p) => ({ ...p })) };
}

// ── Eco-Sphere — 7 hexagons (1 centre + 6), the nine rooms merged into seven, under a hex dome ─────────────────
// 9 → 7: the centre hex is the Living hub; two pairs merge (Dining+Entry, Bath+Closet) so all nine are placed.
const HEX_ROOMS: string[][] = [
  ["L"],        // 0 — centre hub (Living)
  ["K"],        // 1
  ["D", "E"],   // 2 — Dining + Entry
  ["M"],        // 3
  ["B", "C"],   // 4 — Bath + Closet (master suite)
  ["O"],        // 5
  ["S"],        // 6
];
/** Largest useful axis-aligned box inside a flat-top hexagon of circumradius R, centred on the hex. */
function hexBox(cx: number, cy: number, R: number): Rect {
  const w = R * 1.4, h = R * 1.25;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}
export function hexEnvironment(): SimEnvironment {
  const cx0 = VIEW / 2, cy0 = VIEW / 2;
  const R = 18;                         // hex circumradius
  const ring = Math.sqrt(3) * R;        // centre-to-centre for edge-sharing flat-top hexes
  const hexes: EnvHex[] = HEX_ROOMS.map((roomKeys, i) => {
    if (i === 0) return { cx: cx0, cy: cy0, r: R, roomKeys };
    const deg = 30 + 60 * (i - 1);      // flat-top neighbours at 30,90,150,210,270,330
    const rad = (deg * Math.PI) / 180;
    return { cx: cx0 + ring * Math.cos(rad), cy: cy0 + ring * Math.sin(rad), r: R, roomKeys };
  });
  const placements: RoomPlacement[] = [];
  for (const hx of hexes) {
    const box = hexBox(hx.cx, hx.cy, hx.r);
    if (hx.roomKeys.length === 1) {
      placements.push({ roomKey: hx.roomKeys[0], label: labelOf(hx.roomKeys[0]), rect: box });
    } else {
      // merged hex — split the box top/bottom, one room each (both rooms' furniture conserved)
      const half = (box.h - 1) / 2;
      hx.roomKeys.forEach((k, j) => placements.push({
        roomKey: k, label: labelOf(k),
        rect: { x: box.x, y: box.y + j * (half + 1), w: box.w, h: half },
      }));
    }
  }
  return { formId: "eco-sphere", view: VIEW, shell: "hex", placements, hexes, dome: true };
}

/** The environment for a form id. */
export function environmentFor(formId: FormId): SimEnvironment {
  if (formId === "tiny") return openEnvironment();
  if (formId === "eco-sphere") return hexEnvironment();
  return gridEnvironment();
}

/** The sorted set of room keys actually placed in an environment (for the conservation gate). */
export function conservedKeys(env: SimEnvironment): string[] {
  return [...new Set(env.placements.map((p) => p.roomKey))].sort();
}
/** Each placement's REAL furniture (the single source, defaultObjectsForRoom) — nothing invented. */
export function environmentObjects(env: SimEnvironment): { roomKey: string; rect: Rect; objects: PlacedObject[] }[] {
  return env.placements.map((p) => ({ roomKey: p.roomKey, rect: p.rect, objects: defaultObjectsForRoom(p.roomKey) }));
}
/** Total conserved furniture pieces across the whole environment (== the home's object count in every form). */
export function totalObjectCount(env: SimEnvironment): number {
  return environmentObjects(env).reduce((s, r) => s + r.objects.length, 0);
}

/** Vertices of a flat-top hexagon (for the renderer). */
export function hexPoints(cx: number, cy: number, R: number): Array<[number, number]> {
  return Array.from({ length: 6 }, (_, k) => {
    const rad = (60 * k * Math.PI) / 180;
    return [cx + R * Math.cos(rad), cy + R * Math.sin(rad)] as [number, number];
  });
}
