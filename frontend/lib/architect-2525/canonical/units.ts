// SPECS / ARCHITECT-2525 §VIII, §24 — canonical units are INTEGER MICROMETRES. No canonical floats,
// no feet-inch strings as data. Every precision-bearing integer that feeds canonical state or the
// project_hash — a stored dimension AND a derived area product/aggregate — passes assertSafeInt first
// (§24: never serialize a canonical integer greater than 2^53 − 1). sqftFromUm2/ftLabel are
// PRESENTATION ONLY and never written back into canonical data.
//
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-canonical-units.test.mjs

/** SPECS / ARCHITECT-2525 §VIII — 1 mm = 1,000 µm. */
export const UM_PER_MM = 1_000;
/** SPECS / ARCHITECT-2525 §VIII — 1 in = 25,400 µm. */
export const UM_PER_IN = 25_400;
/** SPECS / ARCHITECT-2525 §VIII — 1 ft = 304,800 µm. */
export const UM_PER_FT = 304_800;
/** SPECS / ARCHITECT-2525 §VIII — 10 ft = 3,048,000 µm (one seed Space edge). */
export const UM_PER_10FT = 3_048_000;
/** µm² in one ft² = 304,800² = 92,903,040,000. The exact divisor behind the 900 ft² proof (§IX). */
export const UM2_PER_FT2 = UM_PER_FT * UM_PER_FT;
/** SPECS / ARCHITECT-2525 §07/§XV — minimum Space dimension; a resize below it is BLOCKED. */
export const MIN_DIMENSION_UM = 1_000_000;

/**
 * SPECS / ARCHITECT-2525 §24 — assert a canonical integer is a SAFE integer before it feeds
 * canonical state or the hash. Throws (never floats as a shortcut) on a non-integer or a magnitude
 * past 2^53 − 1. Called on every stored dimension/coordinate AND on every derived area product and
 * aggregate (an oversized space — side beyond ~311 ft — would otherwise silently float past the bound).
 */
export function assertSafeInt(value: number, context?: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`ARCHITECT §24: non-integer canonical value${context ? " @ " + context : ""}: ${String(value)}`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new Error(`ARCHITECT §24: canonical integer exceeds 2^53-1${context ? " @ " + context : ""}: ${String(value)}`);
  }
  return value;
}

/**
 * SPECS / ARCHITECT-2525 §24 — the area of one rectangular Space in µm², with the product checked for
 * safe-integer overflow (Thoth: the product is what nears 2^53, not the edge). width_um × depth_um.
 */
export function areaUm2(widthUm: number, depthUm: number): number {
  assertSafeInt(widthUm, "areaUm2.width");
  assertSafeInt(depthUm, "areaUm2.depth");
  return assertSafeInt(widthUm * depthUm, "areaUm2.product");
}

/** SPECS / ARCHITECT-2525 §24 — a running sum of canonical µm² areas, each addition safe-int checked. */
export function sumAreaUm2(areas: number[]): number {
  let total = 0;
  for (const a of areas) {
    assertSafeInt(a, "sumAreaUm2.term");
    total = assertSafeInt(total + a, "sumAreaUm2.running");
  }
  return total;
}

/** PRESENTATION ONLY — µm² → ft² for a card. Never stored as canonical data. */
export function sqftFromUm2(um2: number): number {
  return um2 / UM2_PER_FT2;
}

/** PRESENTATION ONLY — µm → a human foot measure (a Number of feet). Never canonical. */
export function ftFromUm(um: number): number {
  return um / UM_PER_FT;
}
