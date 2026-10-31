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
import { OBJECT_SPEC, ROOM_GRID, VARIANTS, STANDARD_LAYOUT_REV, standardLayoutFor, standardLayoutAt, sameArrangement, wallOfObject, alignedRot, footprintOf, clampFootprint, type PlacedObject, type ObjectKind, type Rot } from "./room-objects";

/** The most placements one 10×10 room may hold (a stored array of 50,000 was kept whole — AsM-caught, Thor). */
export const MAX_OBJECTS_PER_ROOM = 99;
/** The most room cells a stored layout may hold (the grid is 3×3; a stored 1,000,000 was kept whole — AsM-caught, Thor). */
export const MAX_CELLS = 99;

/** Whitelist a stored PlacedObject[] — keep only well-formed placements of OWN kinds, wall-aligned, with the WHOLE footprint
 * clamped inside the room; capped. Returns [] for an empty / all-invalid ARRAY (an emptied room stays empty — it used to come
 * back as the default), undefined only when nothing array-like was stored. */
function sanitizeObjects(raw: unknown): PlacedObject[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: PlacedObject[] = [];
  const seen = new Set<string>();
  for (const o of raw) {
    if (out.length >= MAX_OBJECTS_PER_ROOM) break;
    const r = asRecord(o);
    // R5b (Thor): OWN keys only — the `in` operator admitted "constructor" / "__proto__" / "toString" as kinds, and the first
    // one rendered crashed the Elements list on every reload.
    if (typeof r.id !== "string" || typeof r.kind !== "string" || !Object.hasOwn(OBJECT_SPEC, r.kind)) continue;
    const id = r.id.slice(0, 64);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const rot0 = ([0, 90, 180, 270] as const).includes(r.rot as Rot) ? (r.rot as Rot) : 0;
    // Preserve a size variant only if it's a known id for this kind (whitelist — untrusted stored value).
    const kind = r.kind as ObjectKind;
    const variant = typeof r.variant === "string" && VARIANTS[kind]?.some((v) => v.id === r.variant) ? r.variant : undefined;
    const elev = typeof r.elev === "number" && Number.isFinite(r.elev) ? boundNum(r.elev, ROOM_GRID) : undefined; // ft off floor (window sill etc.)
    // R5 / R5b: coordinates are finite numbers, NOT rounded (half-foot centres are the convention: a 5-ft bed centred in a
    // 10-ft room is gx 4.5); the legal window reaches −0.4 for a thin wall piece flush to the W/N wall, so the pre-clamp is
    // [−1, ROOM_GRID] and the WHOLE FOOTPRINT is then clamped inside (a stored bed at gx 9 spanned [7,12] through the wall).
    const gx0 = boundNum(r.gx, ROOM_GRID, -1), gy0 = boundNum(r.gy, ROOM_GRID, -1);
    // a stored wall object is normalised to its wall's alignment (a legacy window at rot 0 on the W wall → 90)
    const rot = OBJECT_SPEC[kind].onWall ? alignedRot(rot0, wallOfObject({ gx: gx0, gy: gy0, rot: rot0 })) : rot0;
    const fp = footprintOf({ id, kind, gx: gx0, gy: gy0, rot, ...(variant ? { variant } : {}) });
    const c = clampFootprint(gx0, gy0, fp.w, fp.d, rot, false);
    out.push({ id, kind, gx: c.gx, gy: c.gy, rot, ...(variant ? { variant } : {}), ...(elev !== undefined ? { elev } : {}) });
  }
  return out;
}
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

// ── Structural guards for untrusted persisted records (localStorage / Supabase restore) — block wrong-type payloads
//    and prototype pollution at the trust boundary WITHOUT dropping legitimate inner fields (SEC-B). ──
const DANGER_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Keep only plain-object members of an array (drop primitives/arrays/null); optionally cap to the last `max`. */
export function objArray(raw: unknown, max?: number): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return [];
  const out = raw.filter((e): e is Record<string, unknown> => !!e && typeof e === "object" && !Array.isArray(e));
  return typeof max === "number" ? out.slice(-max) : out;
}
/** A plain-object map (string key → object value); strips dangerous keys (prototype pollution) + non-object values. */
export function objMap(raw: unknown): Record<string, Record<string, unknown>> {
  const out: Record<string, Record<string, unknown>> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (DANGER_KEYS.has(k)) continue;
    if (v && typeof v === "object" && !Array.isArray(v)) out[k] = v as Record<string, unknown>;
  }
  return out;
}
/** A single plain-object record or null (e.g. a persisted manifest) — blocks arrays/primitives/injection. */
export function objOrNull(raw: unknown): Record<string, unknown> | null {
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : null;
}

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
  const seenCell = new Set<string>();
  for (const r of raw) {
    if (cells.length >= MAX_CELLS) break;
    const c = asRecord(r);
    if (typeof c.id !== "string" || typeof c.k !== "string" || typeof c.label !== "string") continue;
    // R5b (Thor): the cells array is bounded like the objects — capped count, capped strings, one cell per id.
    const id = c.id.slice(0, 64), k = c.k.slice(0, 8), label = c.label.slice(0, 120);
    if (!id || !k || seenCell.has(id)) continue;
    seenCell.add(id);
    cells.push({
      id, k, label,
      row: boundInt(c.row, 0, TINY_GRID - 1),
      col: boundInt(c.col, 0, TINY_GRID - 1),
      w: boundInt(c.w ?? 1, 1, TINY_GRID),
      d: boundInt(c.d ?? 1, 1, TINY_GRID),
      windows: boundInt(c.windows, 0, ELEMENT_MAX),
      doors: boundInt(c.doors, 0, ELEMENT_MAX),
      outlets: boundInt(c.outlets, 0, ELEMENT_MAX),
      furniture: c.furniture === true,
      // R5b — the standard-layout edition. A room with a DECIDED layout is re-seated to the current edition ONLY when what is
      // stored is an UNTOUCHED prior edition (edition 0 = the packer, never a decision; edition 1 = Layout A exactly) — so
      // "stop reverting" reaches every device. A room the user ARRANGED is kept and stamped with the current edition: a seed
      // merges into a saved copy, it never replaces it (AsM-caught, Krishna). A stamp above the current edition is clamped
      // (a forged 9999 can never opt out of a future edition — Thor/Krishna).
      ...(() => {
        const std = standardLayoutFor(k);
        const objects = sanitizeObjects(c.objects);
        if (!std) return objects !== undefined ? { objects } : {};
        const rev = Math.min(boundInt(c.layoutRev ?? 0, 0, 9999), STANDARD_LAYOUT_REV);
        if (rev < STANDARD_LAYOUT_REV) {
          const prior = rev > 0 ? sanitizeObjects(standardLayoutAt(k, rev)) : undefined;
          const untouched = objects === undefined || rev === 0 || (prior !== undefined && sameArrangement(objects, prior));
          if (untouched) return { objects: std, layoutRev: STANDARD_LAYOUT_REV };
        }
        return { ...(objects !== undefined ? { objects } : {}), layoutRev: STANDARD_LAYOUT_REV };
      })(),
    });
  }
  return cells.length ? cells : cloneLayout();
}

/** Whitelist a whole workspace snapshot (localStorage restore or Supabase row). Arrays coerced to arrays,
 * code ids filtered to known standards, params/program clamped, gate 0..13, replay bounded to 200. */
export function sanitizeSnapshot(raw: unknown): ArchitectSnapshot {
  const s = asRecord(raw);
  return {
    // R5b (Thor): every list is bounded — 500 strings, codes de-duplicated, replay entries are objects only.
    houseSpec: strList(s.houseSpec).slice(0, 500),
    layerHidden: strList(s.layerHidden).slice(0, 500),
    layerLocked: strList(s.layerLocked).slice(0, 500),
    // R5b (AsM-caught, Thor/Sofia): the snapshot now uses its own SEC-B helpers — primitives/arrays in `unclassified` reached
    // bim-io as objects, an array could pose as the manifest, and own `__proto__`/`constructor` keys rode in assetOverrides.
    unclassified: objArray(s.unclassified, 500),
    bimManifest: objOrNull(s.bimManifest),
    assetOverrides: objMap(s.assetOverrides),
    gate: boundInt(s.gate ?? 3, 0, 13),
    globalParams: sanitizeParams(s.globalParams),
    program: sanitizeProgram(s.program),
    codes: [...new Set(strList(s.codes).filter((id) => Object.hasOwn(STANDARD_BY_ID, id)))].slice(0, 500),
    replay: objArray(s.replay, 200),
    savedAt: boundNum(s.savedAt, Number.MAX_SAFE_INTEGER),
  };
}
