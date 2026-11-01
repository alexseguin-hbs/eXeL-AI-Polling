/**
 * ARCHITECT-2525 · RED → VIOLET RAINBOW (operator 2026-11-01: "color order of visuals should be RED—> Violet · rainbow
 * order of trinity 13. Use colors from Red to violet. pick 6 colors where red is first and violet is [last]").
 * ============================================================================================================
 * ONE source for every ORDERED colour sequence in Architect-2525 — the build phases (6 on the timeline, 11 in the Design
 * phase bar) and the 13 checks. `rainbow(n)` returns n hex colours across a curated ROYGBV spectrum: the first colour is
 * red, the last is violet, and the hue rises monotonically in between.
 *
 * D1f (operator 2026-11-01 D1d feedback, B1 + A1): a plain linear hue sweep 0°→285° lands two neighbours in the cyan
 * band (green ~114° next to cyan ~171°) — "Green and cyan are too close." So the spectrum now runs through CURATED
 * anchors RED · ORANGE · YELLOW · GREEN · BLUE · VIOLET (cyan skipped), evenly across the n slots: for n=6 the six
 * colours ARE those six distinct bands ("color two is orange, then yellow then green"), each clearly different from
 * red (first) and violet (last). (This is the ORDERED-sequence palette; a 1–5 RATING uses the separate red→green
 * SCORE_COLORS scale — "no color mix, use Red→Green for 1-5", A2.) Hex so an "+66" alpha append stays valid.
 * Pure + deterministic → gate-checked (tests/architect-rainbow.test.mjs).
 */
const HUE_RED = 0;
const HUE_VIOLET = 285;
const SAT = 72;   // %
const LIGHT = 58; // %
// the curated spectrum anchors (hue°): red · orange · yellow · green · blue · violet — cyan (≈180°) deliberately skipped
// so no two ordered neighbours read as "too close" (operator D1d · A1). Strictly increasing → hue rises monotonically.
const ANCHOR_HUES = [HUE_RED, 32, 52, 125, 222, HUE_VIOLET];
/** The hue at position t∈[0,1] along the curated ROYGBV anchor path (piecewise-linear). */
function hueAtFraction(t: number): number {
  const span = ANCHOR_HUES.length - 1;              // 5 segments
  const seg = Math.max(0, Math.min(span, span * t));
  const i = Math.min(span - 1, Math.floor(seg));
  const f = seg - i;
  return ANCHOR_HUES[i] + (ANCHOR_HUES[i + 1] - ANCHOR_HUES[i]) * f;
}

/** HSL (h in degrees, s/l in %) → #rrggbb. Pure. */
export function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100, lN = l / 100;
  const a = sN * Math.min(lN, 1 - lN);
  const f = (n: number): string => {
    const k = (n + h / 30) % 12;
    const c = lN - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** The hue (0..360) of a #rrggbb colour — for gates that prove a sequence runs red → violet. */
export function hueOf(hex: string): number {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return NaN;
  const r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

/** n colours across the curated ROYGBV spectrum, red first, violet last, hue rising monotonically. n=1 → red.
 *  n=6 → red · orange · yellow · green · blue · violet (the operator's six evenly-distinct bands, no cyan). */
export function rainbow(n: number): string[] {
  if (n <= 1) return [hslToHex(HUE_RED, SAT, LIGHT)];
  return Array.from({ length: n }, (_, i) => hslToHex(hueAtFraction(i / (n - 1)), SAT, LIGHT));
}
