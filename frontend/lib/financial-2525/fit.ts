/**
 * Financial-2525 · THE ACCRUAL UNITS FIGURES FIT THEIR ROW (r.071 — addendum 158, operator 2026-10-02: "and fix this", with his photo of
 * "Available: −$2,309.48" beside "Accrual Rate $2.0900 /hr", sent after r.070's note listed "a large negative Available runs into the Accrual
 * Rate"; addendum 159 fixes the negative itself — escrow drops — and this keeps a long figure from ever running into its neighbour). His
 * r.044 rule stands: the two figures share one line and one size. That
 * size is now fitted to the row: the figures are monospace, so their width is exactly characters × advance, and the row is a CSS size
 * container, so `100cqw` is its width. The size never grows past 1.5rem (the r.044 size) and never drops below 0.875rem; past that floor
 * the rate wraps under the Available figure — the two never overlap. Pure: a string for a style, no measuring, no clock.
 */
/** The monospace advance, a little above the 0.60 em of SF Mono / Menlo / DejaVu Sans Mono so a figure never touches its neighbour. */
export const FIG_ADVANCE_EM = 0.62;
/** Room the row keeps for what is not a figure: the gap between the blocks, the rate's unit picker and its gap, and a margin. */
export const FIG_RESERVE_PX = 96;
/** r.071 AsM fold (Enki): the unit picker beside the rate is as wide as its widest unit word — English "/sec" · "/min" · "/day" are four
 *  characters. Each extra character widens it ~7 px (its 12 px type), an East Asian wide character counts twice, so a longer translated unit
 *  keeps the same room between the figures instead of eating it. */
export const FIG_UNIT_BASE_CHARS = 4;
export const FIG_UNIT_PX_PER_CHAR = 7;
const WIDE_CHAR = /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6]/;
const labelChars = (s: string): number => Array.from(s).reduce((n, ch) => n + (WIDE_CHAR.test(ch) ? 2 : 1), 0);
/** The row's reserve for the unit words actually shown (the picker's option labels). */
export function figReserve(unitLabels: readonly string[], reservePx: number = FIG_RESERVE_PX): number {
  const widest = unitLabels.reduce((m, l) => Math.max(m, labelChars(l)), 0);
  return reservePx + FIG_UNIT_PX_PER_CHAR * Math.max(0, widest - FIG_UNIT_BASE_CHARS);
}
/** One font size for every figure on the row, from the number of characters they show together. */
export function fitFigures(chars: number, reservePx: number = FIG_RESERVE_PX): string {
  const em = (Math.max(1, Math.round(chars)) * FIG_ADVANCE_EM).toFixed(2);
  return `min(1.5rem, max(0.875rem, calc((100cqw - ${Math.max(0, Math.round(reservePx))}px) / ${em})))`;
}
/** r.071 AsM fold (Enki — the same defect one row down): In Escrow · Released · Spent share one size, fitted so the widest of the three fits
 *  its third of the row (the card's 0.875rem when it fits, never below 0.6875rem); past that floor a figure wraps inside its own cell, never
 *  over its neighbour. Pure: a string for a style. */
export function fitGrid(maxChars: number, cols: number = 3, gapPx: number = 12): string {
  const em = (Math.max(1, Math.round(maxChars)) * FIG_ADVANCE_EM).toFixed(2);
  return `min(0.875rem, max(0.6875rem, calc(((100cqw - ${Math.max(0, cols - 1) * gapPx}px) / ${Math.max(1, cols)} - 4px) / ${em})))`;
}
/** r.071 AsM fold (Sofia): the gear's one line — elapsed · $/min · $/sec, his r.043 rule — fitted to the card the same way: the card's
 *  0.75rem when it fits, never below 0.5625rem; past that floor the $/sec part wraps under it, never off the card or the page (it was cut
 *  off at 390 px and scrolled the page sideways at 320). `chars` counts the three parts; the row keeps 8 px for the two gaps. */
export function fitLine(chars: number): string {
  const em = (Math.max(1, Math.round(chars)) * FIG_ADVANCE_EM).toFixed(2);
  return `min(0.75rem, max(0.5625rem, calc((100cqw - 8px) / ${em})))`;
}
