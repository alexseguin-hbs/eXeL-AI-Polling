/**
 * Where marks go on a page, read from its pixels (operator 2026-09-08 00:50): the initials slot at the
 * bottom-right that never covers text, and the OTHER party's signature line on the same row as the first
 * signer's — the standard two-signatory layout. Pure; the browser hands in an RGBA bitmap of the page.
 */
import { fitToUnderline, type Bitmap, type FitBox } from "@/lib/sign-fit";

/** Height (as a page fraction from the TOP) at which an initials group of `hFrac` fits in the right `colFrac` of the
 *  page without covering ink: first the bottom margin below the lowest ink, else the lowest clear gap above it.
 *  `colFrac` is the band scanned, as a fraction of the page width from the RIGHT edge (default 0.45 — two 36-pt slots
 *  on a Letter page); with 3+ signers the row reaches further left, so pass `initialsRowFrac(widths, pageWidthPt)`
 *  from lib/pdf-stamp and the scan covers what the row actually spans (reviewer 2026-09-08). */
export function initialsSlotTop(bmp: Bitmap, o: { colFrac?: number; hFrac?: number; padFrac?: number; dark?: number } = {}): number {
  const { width: W, height: H, data } = bmp;
  const col = Math.round(W * (1 - (o.colFrac ?? 0.45))), h = Math.max(4, Math.round(H * (o.hFrac ?? 0.018))), pad = Math.max(2, Math.round(H * (o.padFrac ?? 0.004))), dark = o.dark ?? 200;
  const inkRow = (y: number): boolean => { for (let x = col; x < W - 2; x += 2) { const i = (y * W + x) * 4; if ((data[i] + data[i + 1] + data[i + 2]) / 3 < dark) return true; } return false; };
  // the lowest ink row in the right column (a footer rule, a page number, the last table row)
  let lowest = -1; for (let y = H - 1; y >= 0; y--) { if (inkRow(y)) { lowest = y; break; } }
  const bottomMargin = 3;                                                  // stays above the hidden codex line on the very edge
  if (lowest < 0 || H - 1 - lowest >= h + pad + bottomMargin) return (H - bottomMargin - h) / H;
  // no room under the lowest ink: the lowest clear gap of h + 2·pad rows above it
  let clear = 0;
  for (let y = lowest; y >= 0; y--) {
    if (inkRow(y)) { clear = 0; continue; }
    if (++clear >= h + 2 * pad) return (y + pad) / H;
  }
  return (H - bottomMargin - h) / H;                                       // a page with ink to the very edge: the margin anyway
}

/** The other party's signature line on the same row as `sig` (a box fitted to a rule): probes to the right, then to
 *  the left, for a rule whose run does not overlap the first signer's. */
export function partnerRule(bmp: Bitmap, sig: { x: number; y: number; w: number; h: number }): FitBox | null {
  const ruleY = sig.y + sig.h; const probeY = ruleY - 0.012;
  const tryAt = (x: number): FitBox | null => { const f = fitToUnderline(bmp, { x, y: probeY }); return f && Math.abs(f.lineY - ruleY) < 0.01 && (f.x >= sig.x + sig.w - 0.02 || f.x + f.w <= sig.x + 0.02) ? f : null; };
  for (let x = sig.x + sig.w + 0.06; x < 0.97; x += 0.03) { const f = tryAt(x); if (f) return f; }
  for (let x = sig.x - 0.06; x > 0.03; x -= 0.03) { const f = tryAt(x); if (f) return f; }
  return null;
}
