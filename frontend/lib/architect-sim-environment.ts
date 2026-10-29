/**
 * ARCHITECT-2525 · SIMULATE — ENVIRONMENT GENERATOR (operator 2026-10-27/28).
 * ============================================================================================================
 * Pressing a form's SIMULATE "creates that environment": this produces, deterministically, WHERE each room (and
 * therefore its furniture) lands in each form:
 *   • Cube        — the nine rooms on a 3×3 grid (900 ft²).
 *   • Tiny Home   — a REAL standard 8.5 × 40 ft THOW (~340 ft²): a long single-level plan with a realistic SUBSET of
 *                   rooms (an open Living·Kitchen·Dining great room up front, Bath + Bedroom/loft at the rear). A tiny
 *                   home genuinely has fewer rooms — so, unlike the two full-size forms, it does NOT carry all nine
 *                   (operator FX-01: "Tiny home is usually 20 or 40 ft rectangular; look up standard size and pick one").
 *   • Eco-Sphere  — the nine rooms merged into seven hexagons (1 centre + 6) under a hex-panel dome (900 ft²).
 *
 * CONSERVATION (the operator's earlier law) now holds across the two FULL-SIZE forms — Cube and Eco-Sphere each carry
 * all nine room keys + all 46 real furniture pieces (from defaultObjectsForRoom — nothing invented). The Tiny Home is
 * the compact standard-size alternative with its own realistic placed set, every piece in-bounds.
 *
 * Pure + deterministic (no Date.now / Math.random) → replay-safe + gate-tested.
 */
import { TINY_ROOM_LAYOUT } from "@/lib/room-layout";
import { defaultObjectsForRoom, type PlacedObject } from "@/lib/room-objects";

export type FormId = "3x3-grid" | "tiny" | "eco-sphere";
export interface Rect { x: number; y: number; w: number; h: number; }
export interface RoomPlacement { roomKey: string; label: string; rect: Rect; open?: boolean; }   // open = part of the open great room (no interior divider)
export interface EnvHex { cx: number; cy: number; r: number; roomKeys: string[]; }
export interface SimEnvironment {
  formId: FormId;
  view: number;                 // square viewBox side (svg units)
  shell: "grid" | "tiny" | "hex";
  placements: RoomPlacement[];  // the rooms this form carries; furniture = defaultObjectsForRoom(roomKey)
  shellRect?: Rect;             // the Tiny Home's long-rectangle outline (the renderer draws the shell here)
  hexes?: EnvHex[];             // Eco-Sphere only — the seven hexagons to draw (with the rooms they hold)
  dome?: boolean;               // Eco-Sphere draws a hex-panel dome
}

const ROOMS = TINY_ROOM_LAYOUT.map((r) => ({ key: r.k, label: r.label, row: r.row, col: r.col }));
/** The nine real room keys the FULL-SIZE home carries, in 3×3 order. */
export const ALL_ROOM_KEYS: string[] = ROOMS.map((r) => r.key);
const labelOf = (k: string): string => ROOMS.find((r) => r.key === k)?.label ?? k;

export const VIEW = 120;   // exported so the renderer shares the layout constants, never re-derives them (Krishna)
export const MARGIN = 6;

// ── Cube — the nine rooms on a 3×3 grid (the standard, full-size home) ──────────────────────────────────────────────
export function gridEnvironment(): SimEnvironment {
  const side = VIEW - 2 * MARGIN;
  const cell = side / 3;
  const placements = ROOMS.map((r) => ({
    roomKey: r.key, label: r.label,
    rect: { x: MARGIN + r.col * cell, y: MARGIN + r.row * cell, w: cell, h: cell },
  }));
  return { formId: "3x3-grid", view: VIEW, shell: "grid", placements };
}

// ── Tiny Home — a real standard 8.5 × 40 ft THOW (~340 ft²), drawn as a long horizontal rectangle (true proportion).
//    A realistic THOW layout front→rear: an OPEN great room (Living · Kitchen · Dining nook), then Bath + Bedroom/loft. ─
// 8.5 × 24 ft — the standard THOW size (industry consensus across ~30 builds: 8.5 ft road-legal width, 24 ± ~5 ft length).
const TINY_LEN_FT = 24, TINY_WID_FT = 8.5;
const TINY_ZONES: { key: string; ft: number; open?: boolean }[] = [
  { key: "L", ft: 7, open: true },   // Living (front)
  { key: "K", ft: 5, open: true },   // Kitchen
  { key: "D", ft: 3, open: true },   // Dining nook
  { key: "B", ft: 4 },               // Bath
  { key: "M", ft: 5 },               // Bedroom / loft (rear)
];  // Σ = 24 ft
export function tinyEnvironment(): SimEnvironment {
  const drawW = VIEW - 2 * MARGIN;          // 108
  const sx = drawW / TINY_LEN_FT;           // svg units per foot along the length (2.7)
  const bandH = TINY_WID_FT * sx;           // true-proportion height (~22.95) → reads as a long THOW
  const y0 = (VIEW - bandH) / 2;            // vertically centred
  let cum = 0;
  const placements: RoomPlacement[] = TINY_ZONES.map((z) => {
    const rect = { x: MARGIN + cum * sx, y: y0, w: z.ft * sx, h: bandH };
    cum += z.ft;
    return { roomKey: z.key, label: labelOf(z.key), rect, open: z.open };
  });
  const shellRect = { x: MARGIN, y: y0, w: drawW, h: bandH };
  return { formId: "tiny", view: VIEW, shell: "tiny", placements, shellRect };
}

// ── Eco-Sphere — 7 hexagons (1 centre + 6), the nine rooms merged into seven, under a hex-panel dome ─────────────────
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
/** An axis-aligned box that stays INSIDE a flat-top hexagon of circumradius R (so furniture never spills past the
 *  hexagon outline — Krishna/Odin). */
function hexBox(cx: number, cy: number, R: number): Rect {
  const w = R * 1.3, h = R * 0.9;
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
      const n = hx.roomKeys.length, gap = 1;
      const w = (box.w - gap * (n - 1)) / n;
      hx.roomKeys.forEach((k, j) => placements.push({
        roomKey: k, label: labelOf(k),
        rect: { x: box.x + j * (w + gap), y: box.y, w, h: box.h },
      }));
    }
  }
  return { formId: "eco-sphere", view: VIEW, shell: "hex", placements, hexes, dome: true };
}

/** The environment for a form id. */
export function environmentFor(formId: FormId): SimEnvironment {
  if (formId === "tiny") return tinyEnvironment();
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
/** Total furniture pieces across the whole environment (Cube == Eco == 46; the Tiny carries its own smaller set). */
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
