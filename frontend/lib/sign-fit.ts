/**
 * Fit the signature box to the SIGNATURE LINE under the thumb (operator, 2026-09-07): "default initial
 * size to the underline part if it exists, not taller than the bottom of the text above the signature
 * block". Works on the rendered page bitmap, so it fits a drawn rule, a run of underscores, or a line
 * in a scanned PDF alike — no PDF structure is assumed (a scan has none). Pure: takes RGBA pixels,
 * returns page fractions, or null when no line sits near the tap (the caller keeps the default box).
 */
export interface Bitmap { width: number; height: number; data: Uint8ClampedArray | number[] }
export interface FitBox {
  x: number; y: number; w: number; h: number; lineY: number;
  /** the document's own text size next to the line (page fraction): the ink height of the label left of the rule
   *  ("Date:", "Lender") or, failing that, of the text line above it — so a typed date or note starts at the
   *  document's size, not a default (operator 2026-09-08: "match pdf doc size for date and text") */
  textH?: number;
}
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
  // pixel constants follow the bitmap's scale (a 2× render of the same page must fit the same fractions): u = 1 at 400 px
  const u = Math.max(1, W / 400), MIN_INK = Math.round(4 * u), P4 = Math.round(4 * u), P12 = Math.round(12 * u), U2 = Math.round(2 * u), U3 = Math.round(3 * u), U6 = Math.round(6 * u);
  // the dashed-rule bridge stays 3 px at ANY scale: scaled to 5 px at a 2× render it bridged the spaces of an 11-pt printed
  // name and turned "Alex Michael Seguin" into a rule the snap climbed to (live run, 2026-09-08)
  const GAP = 3;
  // the horizontal dark run through (x, y) — small gaps (≤ 3 px) bridge dashed rules and underscores, and the
  // run may drift one row up or down as it goes (a scanned or photographed page is never perfectly level)
  const runAt = (x: number, y: number): [number, number] | null => {
    if (!isDark(x, y)) return null;
    let x0 = x, x1 = x, gap = 0, yy = y;
    const follow = (i: number): boolean => { if (isDark(i, yy)) return true; if (yy > 0 && isDark(i, yy - 1)) { yy--; return true; } if (yy < H - 1 && isDark(i, yy + 1)) { yy++; return true; } return false; };
    for (let i = x - 1; i >= 0; i--) { if (follow(i)) { x0 = i; gap = 0; } else if (++gap > GAP) break; }
    gap = 0; yy = y;
    for (let i = x + 1; i < W; i++) { if (follow(i)) { x1 = i; gap = 0; } else if (++gap > GAP) break; }
    return [x0, x1];
  };
  // the nearest row to the tap whose run through the tap's column is a line (below the tap first — the thumb
  // lands on the words above a signature line more often than on the line itself)
  let best: { y: number; run: [number, number] } | null = null;
  for (let d = 0; d <= reach; d++) {
    for (const y of d === 0 ? [ty] : [ty + d, ty - d]) {
      if (y < 0 || y >= H) continue;
      // the line may not pass exactly under the thumb's column: probe a few columns either side
      for (const x of [tx, tx - P4, tx + P4, tx - P12, tx + P12]) {
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
  for (let y = lineY - U3; y >= cap; y--) {
    let ink = 0;
    for (let x = x0; x <= x1; x += 2) if (isDark(x, y)) { if (++ink >= 3) break; }
    if (ink >= 3) { textBottom = y; break; }
  }
  const top = textBottom >= 0 ? textBottom + U2 : Math.max(cap, lineY - Math.round(opt.defaultH * H));
  const bottom = lineY - 1;                                 // the ink of the signature sits ON the rule, not over it
  if (bottom - top < MIN_INK) return null;
  // the document's text size: the ink rows of the label LEFT of the rule on the same baseline (x0 − 25 % of the page
  // up to the rule, rows from maxH above the rule down to 3 px below it), else the text line above the rule
  const inkRows = (xa: number, xb: number, ya: number, yb: number): [number, number] | null => {
    let t = -1, b = -1;
    for (let y = ya; y <= yb; y++) { let ink = 0; for (let x = xa; x <= xb; x += 2) if (isDark(x, y) && ++ink >= 2) break; if (ink >= 2) { if (t < 0) t = y; b = y; } }
    return t >= 0 ? [t, b] : null;
  };
  const label = x0 > U6 ? inkRows(Math.max(0, x0 - Math.round(W * 0.25)), x0 - U2, cap, Math.min(H - 1, lineY + U3)) : null;
  let textH: number | undefined;
  if (label && label[1] - label[0] >= MIN_INK && label[1] - label[0] <= Math.round(opt.maxH * H)) textH = (label[1] - label[0] + 1) / H;
  else if (textBottom >= 0) { let t = textBottom; while (t > cap && inkRows(x0, x1, t - 1, t - 1)) t--; if (textBottom - t >= MIN_INK) textH = (textBottom - t + 1) / H; }
  return { x: x0 / W, y: top / H, w: (x1 - x0 + 1) / W, h: (bottom - top) / H, lineY: lineY / H, ...(textH ? { textH } : {}) };
}

export interface CheckHit { x: number; y: number; w: number; h: number }

/**
 * The empty square under a finger. A checkbox is a small outline, about one line tall, nearly square,
 * with a white inside and a label to its right. The square itself is what comes back. A tap inside,
 * or just outside the stroke, walks into that white and returns the printed box. A long rule is not
 * a square. A filled mark is not a square. The word beside the box is not a square.
 */
export function findCheckbox(bmp: Bitmap, tap: { x: number; y: number }): CheckHit | null {
  const { width: W, height: H, data } = bmp;
  if (!W || !H) return null;
  const darkAt = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false;
    const i = (y * W + x) * 4;
    return (data[i] + data[i + 1] + data[i + 2]) / 3 < 170;
  };
  const tx = Math.min(W - 1, Math.max(0, Math.round(tap.x * W)));
  const ty = Math.min(H - 1, Math.max(0, Math.round(tap.y * H)));
  const minSide = Math.max(4, Math.round(W * 0.011));
  const maxSide = Math.max(minSide + 2, Math.round(W * 0.045));
  const reach = Math.max(Math.round(14 * Math.max(1, W / 400)), Math.round(W * 0.04));
  const enclose = (sx: number, sy: number): { x0: number; y0: number; w: number; h: number } | null => {
    if (darkAt(sx, sy)) return null;
    let L = sx, R = sx, T = sy, B = sy;
    while (L > 0 && sx - L < maxSide && !darkAt(L - 1, sy)) L--;
    while (R < W - 1 && R - sx < maxSide && !darkAt(R + 1, sy)) R++;
    while (T > 0 && sy - T < maxSide && !darkAt(sx, T - 1)) T--;
    while (B < H - 1 && B - sy < maxSide && !darkAt(sx, B + 1)) B++;
    if (!(L > 0 && darkAt(L - 1, sy) && R < W - 1 && darkAt(R + 1, sy) && T > 0 && darkAt(sx, T - 1) && B < H - 1 && darkAt(sx, B + 1))) return null;
    let x0 = L - 1, x1 = R + 1, y0 = T - 1, y1 = B + 1;
    for (let k = 0; k < 2; k++) {
      if (x0 > 0 && darkAt(x0 - 1, Math.round((y0 + y1) / 2))) x0--;
      if (x1 < W - 1 && darkAt(x1 + 1, Math.round((y0 + y1) / 2))) x1++;
      if (y0 > 0 && darkAt(Math.round((x0 + x1) / 2), y0 - 1)) y0--;
      if (y1 < H - 1 && darkAt(Math.round((x0 + x1) / 2), y1 + 1)) y1++;
    }
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    if (w < minSide || h < minSide || w > maxSide + 4 || h > maxSide + 4) return null;
    const aspect = w / h;
    if (aspect < 0.7 || aspect > 1.4) return null;
    let edge = 0, edgeN = 0;
    const step = Math.max(1, Math.round(Math.min(w, h) / 6));
    for (let x = x0; x <= x1; x += step) { edgeN += 2; if (darkAt(x, y0)) edge++; if (darkAt(x, y1)) edge++; }
    for (let y = y0; y <= y1; y += step) { edgeN += 2; if (darkAt(x0, y)) edge++; if (darkAt(x1, y)) edge++; }
    if (edgeN < 4 || edge / edgeN < 0.55) return null;
    let light = 0, inn = 0;
    for (let y = T; y <= B; y += step) for (let x = L; x <= R; x += step) { inn++; if (!darkAt(x, y)) light++; }
    if (inn < 1 || light / inn < 0.7) return null;
    return { x0, y0, w, h };
  };
  let best: { x0: number; y0: number; w: number; h: number; d: number } | null = null;
  const consider = (sx: number, sy: number) => {
    const box = enclose(sx, sy);
    if (!box) return;
    const d = Math.hypot(tx - (box.x0 + box.w / 2), ty - (box.y0 + box.h / 2));
    if (!best || d < best.d) best = { ...box, d };
  };
  consider(tx, ty);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
    let seen = false;
    for (let s = 1; s <= reach; s++) {
      const x = tx + dx * s, y = ty + dy * s;
      if (x < 0 || y < 0 || x >= W || y >= H) break;
      if (darkAt(x, y)) seen = true;
      else if (seen) { consider(x, y); break; }
    }
  }
  if (!best) return null;
  return { x: best.x0 / W, y: best.y0 / H, w: best.w / W, h: best.h / H };
}
