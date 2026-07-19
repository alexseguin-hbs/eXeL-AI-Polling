/**
 * ARCHITECT-2525 · WireGuard trust-boundary guard (Vision 2525 · Security).
 * =================================================================================================
 * The platform's WireGuard doctrine (backend cube routers + tests/test_wireguard_whitelist*.py)
 * is: WHITELIST the exact allowed shape, coerce/clamp/drop everything else, never trust raw input. The
 * backend enforces it with Pydantic `@field_validator`s on every endpoint. Architect-2525 has no endpoints,
 * so the same doctrine lands here as ONE pure sanitizer consumed at EVERY client trust boundary — the raw
 * `JSON.parse` localStorage reads and the Supabase snapshot restore. R-Core: build once, consume many.
 *
 * Every function is PURE, DETERMINISTIC, and NEVER throws — a corrupted/tampered/oversized store or cloud
 * row can only ever produce a safe, clamped, whitelist-conformant value (never a crash, never garbage state).
 * Valid data round-trips byte-identical: the guards only touch malformed input.
 */
import { DEFAULT_PARAMS, type FinishTier, type GlobalParams, type HouseStyle } from "./architect-project";
import { DEFAULT_PROGRAM, type RoomProgram } from "./room-program";
import { cloneLayout, ELEMENT_MAX, TINY_GRID, type RoomCell } from "./room-layout";
import { STANDARD_BY_ID } from "./building-codes";
import type { ArchitectSnapshot } from "./architect-saved-files";

// ── Primitives ──────────────────────────────────────────────────────────────────────────────────
/** Coerce to a finite number clamped to [min, max]; non-numeric/NaN/±Infinity → min. */
export function boundNum(n: unknown, max: number, min = 0): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : min;
}
/** Coerce to a finite integer clamped to [min, max]; invalid → min. */
export function boundInt(n: unknown, min: number, max: number): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? Math.max(min, Math.min(max, Math.round(v))) : min;
}
/** Keep only the string members of an array (drops objects/numbers/injections that aren't strings). */
export function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}
const asRecord = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const FINISH_TIERS: readonly FinishTier[] = ["standard", "premium", "luxury"];
const HOUSE_STYLES: readonly HouseStyle[] = ["standard", "stylized"];

// ── Domain sanitizers (reuse the existing clamp ranges) ───────────────────────────────────────────
/** Whitelist GlobalParams — area 200..100000 · stories 1..60 · finish/style from the fixed enums. */
export function sanitizeParams(raw: unknown): GlobalParams {
  const p = asRecord(raw);
  const finish = FINISH_TIERS.includes(p.finish as FinishTier) ? (p.finish as FinishTier) : DEFAULT_PARAMS.finish;
  const style = HOUSE_STYLES.includes(p.style as HouseStyle) ? (p.style as HouseStyle) : DEFAULT_PARAMS.style;
  return {
    areaSqft: boundNum(p.areaSqft ?? DEFAULT_PARAMS.areaSqft, 100000, 200),
    stories: boundInt(p.stories ?? DEFAULT_PARAMS.stories, 1, 60),
    finish,
    style,
  };
}

/** Whitelist RoomProgram — bedrooms 1..12 · bathrooms 1..10 · ceiling 7..16 · kitchens 0..6. */
export function sanitizeProgram(raw: unknown): RoomProgram {
  const p = asRecord(raw);
  return {
    bedrooms: boundInt(p.bedrooms ?? DEFAULT_PROGRAM.bedrooms, 1, 12),
    bathrooms: boundInt(p.bathrooms ?? DEFAULT_PROGRAM.bathrooms, 1, 10),
    ceilingFt: boundInt(p.ceilingFt ?? DEFAULT_PROGRAM.ceilingFt, 7, 16),
    kitchens: boundInt(p.kitchens ?? DEFAULT_PROGRAM.kitchens ?? 1, 0, 6),
  };
}

/** Whitelist a stored RoomCell[] — keep only well-formed cells, clamp grid/size/element counts; the
 * clamps in room-layout.ts only guard MUTATIONS, so a maliciously-seeded stored array needs this at the
 * trust boundary. Empty / not-an-array / all-invalid → the default TINY_ROOM_LAYOUT. */
export function sanitizeRoomLayout(raw: unknown): RoomCell[] {
  if (!Array.isArray(raw)) return cloneLayout();
  const cells: RoomCell[] = [];
  for (const r of raw) {
    const c = asRecord(r);
    if (typeof c.id !== "string" || typeof c.k !== "string" || typeof c.label !== "string") continue;
    cells.push({
      id: c.id, k: c.k, label: c.label,
      row: boundInt(c.row, 0, TINY_GRID - 1),
      col: boundInt(c.col, 0, TINY_GRID - 1),
      w: boundInt(c.w ?? 1, 1, TINY_GRID),
      d: boundInt(c.d ?? 1, 1, TINY_GRID),
      windows: boundInt(c.windows, 0, ELEMENT_MAX),
      doors: boundInt(c.doors, 0, ELEMENT_MAX),
      outlets: boundInt(c.outlets, 0, ELEMENT_MAX),
      furniture: c.furniture === true,
    });
  }
  return cells.length ? cells : cloneLayout();
}

/** Whitelist a whole workspace snapshot (localStorage restore or Supabase row). Arrays coerced to arrays,
 * code ids filtered to known standards, params/program clamped, gate 0..13, replay bounded to 200. */
export function sanitizeSnapshot(raw: unknown): ArchitectSnapshot {
  const s = asRecord(raw);
  return {
    houseSpec: strList(s.houseSpec),
    layerHidden: strList(s.layerHidden),
    layerLocked: strList(s.layerLocked),
    unclassified: asArray(s.unclassified),
    bimManifest: s.bimManifest && typeof s.bimManifest === "object" ? s.bimManifest : null,
    assetOverrides: asRecord(s.assetOverrides),
    gate: boundInt(s.gate ?? 3, 0, 13),
    globalParams: sanitizeParams(s.globalParams),
    program: sanitizeProgram(s.program),
    codes: strList(s.codes).filter((id) => id in STANDARD_BY_ID),
    replay: asArray(s.replay).slice(-200),
    savedAt: boundNum(s.savedAt, Number.MAX_SAFE_INTEGER),
  };
}
