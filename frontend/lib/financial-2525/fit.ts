/**
 * Financial-2525 · THE ACCRUAL UNITS FIGURES FIT THEIR ROW (r.071 — addendum 158, operator 2026-10-02: "and fix this", with his photo of
 * "Available: −$2,309.48" crowding "Accrual Rate $2.0900 /hr"). His r.044 rule stands: the two figures share one line and one size. That
 * size is now fitted to the row: the figures are monospace, so their width is exactly characters × advance, and the row is a CSS size
 * container, so `100cqw` is its width. The size never grows past 1.5rem (the r.044 size) and never drops below 0.875rem; past that floor
 * the rate wraps under the Available figure — the two never overlap. Pure: a string for a style, no measuring, no clock.
 */
/** The monospace advance, a little above the 0.60 em of SF Mono / Menlo / DejaVu Sans Mono so a figure never touches its neighbour. */
export const FIG_ADVANCE_EM = 0.62;
/** Room the row keeps for what is not a figure: the gap between the blocks, the rate's unit picker and its gap, and a margin. */
export const FIG_RESERVE_PX = 96;
/** One font size for every figure on the row, from the number of characters they show together. */
export function fitFigures(chars: number, reservePx: number = FIG_RESERVE_PX): string {
  const em = (Math.max(1, Math.round(chars)) * FIG_ADVANCE_EM).toFixed(2);
  return `min(1.5rem, max(0.875rem, calc((100cqw - ${Math.max(0, Math.round(reservePx))}px) / ${em})))`;
}
