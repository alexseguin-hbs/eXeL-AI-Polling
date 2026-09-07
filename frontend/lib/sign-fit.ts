/**
 * Fit the signature box to the SIGNATURE LINE under the thumb (operator, 2026-09-07): "default initial
 * size to the underline part if it exists, not taller than the bottom of the text above the signature
 * block". Works on the rendered page bitmap, so it fits a drawn rule, a run of underscores, or a line
 * in a scanned PDF alike — no PDF structure is assumed (a scan has none). Pure: takes RGBA pixels,
 * returns page fractions, or null when no line sits near the tap (the caller keeps the default box).
 */
export interface Bitmap { width: number; height: number; data: Uint8ClampedArray | number[] }
export interface FitBox { x: number; y: number; w: number; h: number; lineY: number }
export interface FitOpts {
  /** how far above/below the tap (page fraction) a line is looked for */ reach?: number;
  /** a line is at least this share of the page width */ minLineW?: number;
  /** the box is never taller than this (page fraction) when no text bounds it */ maxH?: number;
  /** default box height (page fraction) when no text sits above the line within maxH */ defaultH?: number;
  /** pixel darkness threshold (0-255 mean of RGB) */ dark?: number;
}
const D = { reach: 0.06, minLineW: 0.15, maxH: 0.12, defaultH: 0.08, dark: 200 };   // 200: an anti-aliased thin rule is grey, not black

export function fitToUnderline(bmp: Bitmap, tap: { x: number; y: number }, o: FitOpts = {}): FitBox | null {
  const { width: W, height: H, data } = bmp; const opt = { ...D, ...o };
  if (!W || !H) return null;
  const isDark = (x: number, y: number) => { const i = (y * W + x) * 4; return (data[i] + data[i + 1] + data[i + 2]) / 3 < opt.dark; };
  const tx = Math.min(W - 1, Math.max(0, Math.round(tap.x * W))), ty = Math.min(H - 1, Math.max(0, Math.round(tap.y * H)));
  const reach = Math.round(opt.reach * H), minW = Math.round(opt.minLineW * W);
  // the horizontal dark run through (x, y) — small gaps (≤ 3 px) bridge dashed rules and underscores
  const runAt = (x: number, y: number): [number, number] | null => {
    if (!isDark(x, y)) return null;
    let x0 = x, x1 = x, gap = 0;
    for (let i = x - 1; i >= 0; i--) { if (isDark(i, y)) { x0 = i; gap = 0; } else if (++gap > 3) break; }
    gap = 0;
    for (let i = x + 1; i < W; i++) { if (isDark(i, y)) { x1 = i; gap = 0; } else if (++gap > 3) break; }
    return [x0, x1];
  };
  // the nearest row to the tap whose run through the tap's column is a line (below the tap first — the thumb
  // lands on the words above a signature line more often than on the line itself)
  let best: { y: number; run: [number, number] } | null = null;
  for (let d = 0; d <= reach; d++) {
    for (const y of d === 0 ? [ty] : [ty + d, ty - d]) {
      if (y < 0 || y >= H) continue;
      // the line may not pass exactly under the thumb's column: probe a few columns either side
      for (const x of [tx, tx - 4, tx + 4, tx - 12, tx + 12]) {
        if (x < 0 || x >= W) continue;
        const r = runAt(x, y); if (r && r[1] - r[0] >= minW) { best = { y, run: r }; break; }
      }
      if (best) break;
    }
    if (best) break;
  }
  if (!best) return null;
  // the top edge of the rule (a 2-px line has two dark rows)
  let lineY = best.y; while (lineY > 0 && runAt(best.run[0] + 2, lineY - 1)) lineY--;
  const [x0, x1] = best.run;
  // the text above: the first row (scanning up from the rule) with ink inside the line's span
  const cap = Math.max(lineY - Math.round(opt.maxH * H), 0);
  let textBottom = -1;
  for (let y = lineY - 3; y >= cap; y--) {
    let ink = 0;
    for (let x = x0; x <= x1; x += 2) if (isDark(x, y)) { if (++ink >= 3) break; }
    if (ink >= 3) { textBottom = y; break; }
  }
  const top = textBottom >= 0 ? textBottom + 2 : Math.max(cap, lineY - Math.round(opt.defaultH * H));
  const bottom = lineY - 1;                                 // the ink of the signature sits ON the rule, not over it
  if (bottom - top < 4) return null;
  return { x: x0 / W, y: top / H, w: (x1 - x0 + 1) / W, h: (bottom - top) / H, lineY: lineY / H };
}
