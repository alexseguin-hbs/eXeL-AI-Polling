/**
 * A.B..C — Base-3600 tokenomics notation (Master of Thought spec, 2026-08-19).
 *
 * Every tokenomics quantity, detail and calculation is expressed in A.B..C:
 *   A = hour (whole units)
 *   B = minute-EQUIVALENT (NOT minutes) — a sub-unit, 0..3599
 *   C = second-EQUIVALENT (NOT seconds) — a sub-sub-unit, 0..3599
 * Uniform Base-3600, exactly like the celestial UCRS-2525 (lib/ucrs-2525.ts):
 *   1 A = 3600 B · 1 B = 3600 C · 1 A = 12,960,000 C.
 *
 * DISPLAY: `A.BBBB..CCCC` — single dot before B, double dot before C; B and C are
 * ALWAYS 4-digit zero-padded integers (0000..3599). e.g. 0.0190239726 A → "0.0068..1751".
 *
 * DECIMAL AUTO-ADJUST (input shorthand): a fractional sub-unit is auto-expanded to its
 * Base-3600 integer — the fraction times the scale. So `.5` → 0.5 × 3600 = 1800:
 *   "A.5"    → B = 1800  → "A.1800..0000"
 *   "A.B.5"  → C = 1800
 * A 4-digit token is taken literally (e.g. "0068" → 68); a fraction (contains ".",
 * or is < 1) is multiplied by the scale.
 *
 * POSITION SCALE: for radar / artillery / sniper / drone position measurements the scale
 * doubles to 7200 (2 × 3600), giving finer angular resolution while keeping the same grammar.
 */

export const SUB = 3600;              // canonical Base-3600 sub-unit count (time / tokenomics)
export const POSITION_SCALE = 7200;   // 2 × 3600 — radar / artillery / sniper / drone position

export interface ABC { a: number; b: number; c: number; }

const pad4 = (n: number) => String(Math.max(0, Math.trunc(n))).padStart(4, "0");

/** Decompose a decimal A-value (e.g. hours, or 웃) into { a, b, c } in Base-`scale`. */
export function toABC(value: number, scale: number = SUB): ABC {
  if (!isFinite(value)) return { a: 0, b: 0, c: 0 };
  const neg = value < 0;
  let v = Math.abs(value);
  let a = Math.trunc(v);
  let frac = v - a;
  const bFloat = frac * scale;
  let b = Math.trunc(bFloat);
  let c = Math.round((bFloat - b) * scale);
  // carry on rounding overflow
  if (c >= scale) { c -= scale; b += 1; }
  if (b >= scale) { b -= scale; a += 1; }
  return { a: neg ? -a : a, b, c };
}

/** Format an ABC as the canonical `A.BBBB..CCCC` (B, C zero-padded to 4 digits). */
export function fmtABC({ a, b, c }: ABC): string {
  const sign = a < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.trunc(a))}.${pad4(b)}..${pad4(c)}`;
}

/** Decimal A-value → canonical `A.BBBB..CCCC` string. The one call all displays use. */
export function format(value: number, scale: number = SUB): string {
  return fmtABC(toABC(value, scale));
}

/** True decimal A-value of an ABC (inverse of toABC), for round-tripping / math. */
export function abcToValue({ a, b, c }: ABC, scale: number = SUB): number {
  const sign = a < 0 ? -1 : 1;
  return sign * (Math.abs(a) + b / scale + c / (scale * scale));
}

/**
 * Resolve one sub-unit token to its Base-`scale` integer, applying the decimal
 * auto-adjust: a 4-digit integer token is literal; anything fractional (contains a
 * ".", or parses to < 1) is multiplied by the scale. Clamped to [0, scale-1]... except
 * position scale allows the full [0, scale].  ".5" → 1800.
 */
export function resolveSubUnit(token: string, scale: number = SUB): number {
  const t = String(token).trim();
  if (t === "") return 0;
  // literal 4-digit integer (canonical form)
  if (/^\d{4}$/.test(t)) return Math.min(scale, parseInt(t, 10));
  // decimal fraction shorthand: ".5", "0.5", "5" (bare < 4 digits) → 0.<digits> × scale
  let frac: number;
  if (t.includes(".")) {
    frac = parseFloat(t);                 // "0.5" → 0.5
  } else {
    frac = parseFloat("0." + t);          // "5" → 0.5 ; "25" → 0.25 ; "125" → 0.125
  }
  if (!isFinite(frac)) return 0;
  if (frac >= 1) return Math.min(scale, Math.round(frac));   // e.g. an out-of-band integer
  return Math.round(frac * scale);        // ".5" → 1800
}

/**
 * Parse an A.B..C string (canonical `A.BBBB..CCCC`, or shorthand `A.5`, `A.B.5`) into ABC,
 * applying the decimal auto-adjust. Accepts `..` or a second `.` before C.
 */
export function parseABC(input: string, scale: number = SUB): ABC {
  const s = String(input).trim();
  // split off C on the double-dot first, else a second single dot
  let head = s, cTok = "0000";
  if (s.includes("..")) { const [h, c] = s.split(".."); head = h; cTok = c ?? "0000"; }
  const parts = head.split(".");
  const aTok = parts[0] ?? "0";
  const bTok = parts[1] ?? "0000";
  if (!s.includes("..") && parts.length >= 3) { cTok = parts[2]; }  // "A.B.5" form
  const a = parseInt(aTok, 10) || 0;
  const b = resolveSubUnit(bTok, scale);
  const c = resolveSubUnit(cTok, scale);
  return { a, b, c };
}

/** Canonical full reference at one whole A: `1.3600..3600` semantics — mirror of UCRS FULL_ORBIT. */
export const FULL_UNIT_ABC = `${SUB}.${SUB}..${SUB}`;

// ── Spatial / drone-swarm coordinates (Master of Thought spec, 2026-08-19; FUTURE use) ────────
// Radial positioning on the same Base-3600 system as celestial UCRS-2525.
// GENERAL directional coordinate = Azimuth.Elevation..Radius = A.B..C, each a 4-digit integer:
//   A = Azimuth        0000..3600  (full circle)
//   B = Elevation      0000..1800  (NADIR 0000 · EQUATOR 0900 · ZENITH 1800)
//   C = Radius/Altitude 0000..(max) (e.g. 3333 on the equator plane, or 1111 for a bounded sphere)
// DETAILED (e.g. solar-system-scale) location nests three triplets: A.B..C • A.B..C • A.B..C
//   (coarse frame • mid frame • fine frame) — one origin, one frame, total swarm control.
export const AZIMUTH_MAX = 3600;
export const ELEVATION_NADIR = 0, ELEVATION_EQUATOR = 900, ELEVATION_ZENITH = 1800, ELEVATION_MAX = 1800;

/** A spatial coordinate: azimuth (A), elevation (B), radius/altitude (C) — 4-digit Base-3600 integers. */
export interface Coord { a: number; b: number; c: number; }

/** Format ONE spatial coordinate as `AAAA.BBBB..CCCC` (all three zero-padded to 4 digits). */
export function fmtCoord({ a, b, c }: Coord): string {
  return `${pad4(a)}.${pad4(b)}..${pad4(c)}`;
}

/** Format a DETAILED (nested) location as `A.B..C • A.B..C • A.B..C` (coarse → fine). */
export function fmtDetailed(frames: Coord[]): string {
  return frames.map(fmtCoord).join(" • ");
}

/** Parse `AAAA.BBBB..CCCC` (or the `.5` shorthand) into a spatial Coord. */
export function parseCoord(input: string, scale: number = SUB): Coord {
  return parseABC(input, scale);
}
