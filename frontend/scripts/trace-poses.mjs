// trace-poses — the five firing positions as HIGH-RESOLUTION figures traced from the operator's own TC 3-22.9 pages
// (docs/asks/img/…shot3..7.jpg), not stick figures (operator 2026-10-12: "dont use stick figures; better high resolution modern images,
// make gun different color than person"). Chromium is the decoder, so this runs where Playwright runs; the carried PNGs are the record. Chromium decodes the JPEG; the pixels are classified (paper → transparent · the uniform's grey →
// the PERSON colour · thick dark = the RIFLE colour · thin dark = outline); the numbered callout rings are found and in-painted; the prone
// figures are mirrored so every rifle points right; the figure is fitted into a 256×256 cell by majority vote; Node writes a 2-bit palette
// PNG with stored deflate (deterministic bytes from the class array). Output: pose-N.png (+ a montage for review) and poses.v2.json (the recipe).
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright');
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const imgDir = process.argv[2] || path.join(ROOT, 'docs/asks/img'), outDir = process.argv[3] || path.join(ROOT, 'docs/drone-2525/poses'), recipePath = process.argv[4] || path.join(ROOT, 'docs/drone-2525/poses/poses.v2.json');
const R = JSON.parse(fs.readFileSync(recipePath, 'utf8')); // usage: node scripts/trace-poses.mjs [imgDir] [outDir] [recipe] — defaults to the repo's own
fs.mkdirSync(outDir, { recursive: true });
// ── PNG writer (palette, 2 bits per pixel, stored deflate, crc32/adler32 here) ─────────────────────────────────────────────────────
const crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); t[n] = c >>> 0; } return t; })();
const crc32 = (b) => { let c = 0xFFFFFFFF; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const adler = (b) => { let a = 1, d = 0; for (const x of b) { a = (a + x) % 65521; d = (d + a) % 65521; } return ((d << 16) | a) >>> 0; };
const u32 = (n) => Buffer.from([(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]);
const chunk = (type, data) => { const t = Buffer.from(type, 'latin1'); return Buffer.concat([u32(data.length), t, data, u32(crc32(Buffer.concat([t, data])))]); };
const stored = (raw) => { const parts = [Buffer.from([0x78, 0x01])]; for (let i = 0; i < raw.length; i += 65535) { const blk = raw.subarray(i, Math.min(raw.length, i + 65535)); const fin = i + 65535 >= raw.length ? 1 : 0; const L = blk.length; parts.push(Buffer.from([fin, L & 255, L >> 8, (~L) & 255, ((~L) >> 8) & 255]), blk); } parts.push(u32(adler(raw))); return Buffer.concat(parts); };
const hexRGB = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
function png2bit(cls, w, h, palette) { // cls: Uint8Array of 0..3; palette index 0 is transparent
  const rowB = Math.ceil(w / 4); const raw = Buffer.alloc((rowB + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (rowB + 1)] = 0; for (let x = 0; x < w; x++) { const v = cls[y * w + x] & 3; raw[y * (rowB + 1) + 1 + (x >> 2)] |= v << (6 - 2 * (x & 3)); } }
  const ihdr = Buffer.concat([u32(w), u32(h), Buffer.from([2, 3, 0, 0, 0])]);
  const plte = Buffer.from([0, 0, 0, ...hexRGB(palette[1]), ...hexRGB(palette[2]), ...hexRGB(palette[3])]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', plte), chunk('tRNS', Buffer.from([0, 255, 255, 255])), chunk('IDAT', stored(raw)), chunk('IEND', Buffer.alloc(0))]);
}
function pngRGB(px, w, h) { const raw = Buffer.alloc((w * 3 + 1) * h); for (let y = 0; y < h; y++) { raw[y * (w * 3 + 1)] = 0; px.copy(raw, y * (w * 3 + 1) + 1, y * w * 3, (y + 1) * w * 3); } const ihdr = Buffer.concat([u32(w), u32(h), Buffer.from([8, 2, 0, 0, 0])]); return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', stored(raw)), chunk('IEND', Buffer.alloc(0))]); }
// ── the classifier runs in the browser (it has the decoder); pure integer work, deterministic ───────────────────────────────────────
const CLASSIFY = ({ b64, p }) => {
  const radialFill = (cl, W, H, cx, cy, r, fallback) => { for (let yy = Math.max(0, cy - r - 1) | 0; yy <= Math.min(H - 1, cy + r + 1); yy++) for (let xx = Math.max(0, cx - r - 1) | 0; xx <= Math.min(W - 1, cx + r + 1); xx++) { const dd = Math.hypot(xx - cx, yy - cy); if (dd > r + 0.5) continue; let v = fallback; if (dd > 0.5) { const sx = Math.round(cx + (xx - cx) / dd * (r + 4)), sy = Math.round(cy + (yy - cy) / dd * (r + 4)); if (sx >= 0 && sy >= 0 && sx < W && sy < H) { v = cl[sy * W + sx]; if (v === 2) v = fallback; } } cl[yy * W + xx] = v; } };
  const img = new Image(); img.src = 'data:image/jpeg;base64,' + b64;
  return img.decode().then(() => {
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const [x0, y0, x1, y1] = p.crop; const W = x1 - x0, H = y1 - y0; const d = x.getImageData(x0, y0, W, H).data;
    // 0 paper · 1 body (grey) · 2 dark
    const cl = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) { const L = (d[i * 4] * 299 + d[i * 4 + 1] * 587 + d[i * 4 + 2] * 114) / 1000; cl[i] = L > p.white ? 0 : L < p.dark ? 2 : L < p.light ? 4 : 1; }
    // callout rings: connected dark components whose bbox is a small square with a mostly-light interior → erase + in-paint, with the digits inside
    const seen = new Uint8Array(W * H); const comps = []; const qx = new Int32Array(W * H), qy = new Int32Array(W * H);
    for (let s = 0; s < W * H; s++) { if (cl[s] !== 2 || seen[s]) continue; let n = 0, head = 0; qx[n] = s % W; qy[n] = (s / W) | 0; n++; seen[s] = 1; let minx = W, maxx = 0, miny = H, maxy = 0, cnt = 0; const px = [];
      while (head < n) { const cx = qx[head], cy = qy[head]; head++; cnt++; px.push(cy * W + cx); if (cx < minx) minx = cx; if (cx > maxx) maxx = cx; if (cy < miny) miny = cy; if (cy > maxy) maxy = cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (cl[j] === 2 && !seen[j]) { seen[j] = 1; qx[n] = nx; qy[n] = ny; n++; } } }
      comps.push({ minx, maxx, miny, maxy, cnt, px }); }
    const digits = comps.filter((k) => { const w = k.maxx - k.minx + 1, h = k.maxy - k.miny + 1; const digit = w >= p.digit[0] && w <= p.digit[1] && h >= p.digit[4] && h <= p.digit[2] && k.cnt <= p.digit[3]; const roundish = w >= 10 && w <= p.roundMax && h >= 10 && h <= p.roundMax && w <= 1.6 * h && h <= 1.6 * w && k.cnt <= p.roundCnt; return digit || roundish; });
    let erased = 0; const rings = digits; const dbg = [];
    for (const k of digits) { const cx = (k.minx + k.maxx) / 2, cy = (k.miny + k.maxy) / 2, r = p.disc; const band = p.band;
      const vote = [0, 0, 0, 0, 0]; for (let yy = Math.max(0, cy - r - band - 1) | 0; yy <= Math.min(H - 1, cy + r + band + 1); yy++) for (let xx = Math.max(0, cx - r - band - 1) | 0; xx <= Math.min(W - 1, cx + r + band + 1); xx++) { const dd = Math.hypot(xx - cx, yy - cy); if (dd > r + 1 && dd <= r + band) vote[cl[yy * W + xx]]++; }
      let fill = 0; for (const k of [1, 4]) if (vote[k] > vote[fill]) fill = k; dbg.push({ cx: Math.round(cx), cy: Math.round(cy), w: k.maxx - k.minx + 1, h: k.maxy - k.miny + 1, cnt: k.cnt, vote: vote.slice(), fill });
      radialFill(cl, W, H, cx, cy, r, fill);
      erased++; }
    // every callout has a WHITE interior enclosed by its ring: a small, round, enclosed paper component → the whole callout is painted over with the band's majority
    { const seenW = new Uint8Array(W * H); let found = 0;
      for (let s0 = 0; s0 < W * H; s0++) { if (cl[s0] !== 0 || seenW[s0]) continue; let n = 0, head = 0; qx[n] = s0 % W; qy[n] = (s0 / W) | 0; n++; seenW[s0] = 1; let minx = W, maxx = 0, miny = H, maxy = 0, cnt = 0, border = false;
        while (head < n) { const cx = qx[head], cy = qy[head]; head++; cnt++; if (cx === 0 || cy === 0 || cx === W - 1 || cy === H - 1) border = true; if (cx < minx) minx = cx; if (cx > maxx) maxx = cx; if (cy < miny) miny = cy; if (cy > maxy) maxy = cy;
          if (cnt > 4000) { border = true; } if (border && cnt > 4000) continue;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (cl[j] === 0 && !seenW[j]) { seenW[j] = 1; qx[n] = nx; qy[n] = ny; n++; } } }
        const w = maxx - minx + 1, h = maxy - miny + 1; if (border || w < p.hole[0] || w > p.hole[1] || h < p.hole[0] || h > p.hole[1] || Math.abs(w - h) > 8 || cnt < 0.4 * w * h) continue;
        const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2, r = Math.max(w, h) / 2 + p.hole[2]; const vote = [0, 0, 0, 0, 0];
        for (let yy = Math.max(0, cy - r - 11) | 0; yy <= Math.min(H - 1, cy + r + 11); yy++) for (let xx = Math.max(0, cx - r - 11) | 0; xx <= Math.min(W - 1, cx + r + 11); xx++) { const dd = Math.hypot(xx - cx, yy - cy); if (dd > r + 2 && dd <= r + 10) vote[cl[yy * W + xx]]++; }
        let fill = 0; for (const k of [1, 4]) if (vote[k] > vote[fill]) fill = k;
        radialFill(cl, W, H, cx, cy, r, fill); found++; }
      erased += found; }
    // the callout DISCS on the paper: small round blobs of the uniform's grey that stand alone → erased (on the body they merge with it and vanish anyway)
    { const seenD = new Uint8Array(W * H); let discs = 0;
      const grey = (i) => cl[i] === 1 || cl[i] === 4; for (let s0 = 0; s0 < W * H; s0++) { if (!grey(s0) || seenD[s0]) continue; let n = 0, head = 0; qx[n] = s0 % W; qy[n] = (s0 / W) | 0; n++; seenD[s0] = 1; let minx = W, maxx = 0, miny = H, maxy = 0, cnt = 0;
        while (head < n) { const cx = qx[head], cy = qy[head]; head++; cnt++; if (cx < minx) minx = cx; if (cx > maxx) maxx = cx; if (cy < miny) miny = cy; if (cy > maxy) maxy = cy;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (grey(j) && !seenD[j]) { seenD[j] = 1; qx[n] = nx; qy[n] = ny; n++; } } }
        const w = maxx - minx + 1, h = maxy - miny + 1; if (w >= p.discBox[0] && w <= p.discBox[1] && h >= p.discBox[0] && h <= p.discBox[1] && Math.abs(w - h) <= 8 && cnt >= 0.12 * w * h && cnt <= 0.92 * w * h) { const cx = (minx + maxx) / 2, cy = (miny + maxy) / 2, r = Math.max(w, h) / 2 + 2; const vote = [0, 0, 0, 0, 0]; for (let yy = Math.max(0, cy - r - 11) | 0; yy <= Math.min(H - 1, cy + r + 11); yy++) for (let xx = Math.max(0, cx - r - 11) | 0; xx <= Math.min(W - 1, cx + r + 11); xx++) { const dd = Math.hypot(xx - cx, yy - cy); if (dd > r + 2 && dd <= r + 10) vote[cl[yy * W + xx]]++; } let fill = 0; for (const k of [1, 4]) if (vote[k] > vote[fill]) fill = k; radialFill(cl, W, H, cx, cy, r, fill); discs++; } }
      erased += discs; }
    // thick dark = the rifle; thin dark = outline (erode r, then grow back)
    const rr = p.erode; const dark = (i) => cl[i] === 2 || cl[i] === 4; const black = (i) => cl[i] === 2; const seed = new Uint8Array(W * H);
    for (let y = rr; y < H - rr; y++) for (let x2 = rr; x2 < W - rr; x2++) { const i = y * W + x2; if (!dark(i)) continue; let ok = true; for (let dy = -rr; dy <= rr && ok; dy++) for (let dx = -rr; dx <= rr; dx++) { if (dx * dx + dy * dy > rr * rr) continue; if (!dark(i + dy * W + dx)) { ok = false; break; } } seed[i] = ok ? 1 : 0; }
    const thick = new Uint8Array(W * H); const g = rr + 1;
    for (let y = 0; y < H; y++) for (let x2 = 0; x2 < W; x2++) { const i = y * W + x2; if (!seed[i]) continue; for (let dy = -g; dy <= g; dy++) for (let dx = -g; dx <= g; dx++) { if (dx * dx + dy * dy > g * g) continue; const nx = x2 + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (dark(j)) thick[j] = 1; } }
    // components of the thick mask: the rifle is long and horizontal; a wall is tall and narrow (→ outline); the rest is the person's own dark (helmet, boots → person)
    const seen2 = new Uint8Array(W * H); const kind = new Uint8Array(W * H); const tc = []; // per gear pixel: 1 person · 2 outline · 3 rifle
    for (let s0 = 0; s0 < W * H; s0++) { if (!dark(s0) || seen2[s0]) continue; let n = 0, head = 0; qx[n] = s0 % W; qy[n] = (s0 / W) | 0; n++; seen2[s0] = 1; let minx = W, maxx = 0, miny = H, maxy = 0; const px = [];
      while (head < n) { const cx = qx[head], cy = qy[head]; head++; px.push(cy * W + cx); if (cx < minx) minx = cx; if (cx > maxx) maxx = cx; if (cy < miny) miny = cy; if (cy > maxy) maxy = cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (dark(j) && !seen2[j]) { seen2[j] = 1; qx[n] = nx; qy[n] = ny; n++; } } }
      let mid = 0; for (const i of px) if (cl[i] === 4) mid++; tc.push({ w: maxx - minx + 1, h: maxy - miny + 1, px, mid }); }
    for (const t of tc) { const rows = new Map(); for (const j of t.px) { const y = (j / W) | 0, x2 = j % W; let r0 = rows.get(y); if (!r0) { r0 = { minx: x2, maxx: x2, n: 0, mid: 0 }; rows.set(y, r0); } if (x2 < r0.minx) r0.minx = x2; if (x2 > r0.maxx) r0.maxx = x2; r0.n++; if (cl[j] === 4) r0.mid++; }
      const rifleRow = new Set(); for (const [y, r0] of rows) { const span = r0.maxx - r0.minx + 1; if (span >= p.gunMinW * W && r0.n >= 0.5 * span && r0.mid >= 0.5 * r0.n) rifleRow.add(y); }
      t.rifleRows = rifleRow.size; for (const j of t.px) { const y = (j / W) | 0; kind[j] = rifleRow.has(y) ? 3 : black(j) ? 2 : 1; } }
    // final classes: 0 transparent · 1 person · 2 outline · 3 rifle; mirror when asked; fit into S×S by majority vote
    const S = p.size; const out = new Uint8Array(S * S); const scale = Math.max(W, H) / (S - 2 * p.margin); const ox = (S - W / scale) / 2, oy = (S - H / scale) / 2;
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) { const vote = [0, 0, 0, 0]; const ax0 = (sx - ox) * scale, ay0 = (sy - oy) * scale, ax1 = ax0 + scale, ay1 = ay0 + scale;
      for (let yy = Math.floor(ay0); yy < ay1; yy++) for (let xx = Math.floor(ax0); xx < ax1; xx++) { if (xx < 0 || yy < 0 || xx >= W || yy >= H) { vote[0]++; continue; } const sxx = p.mirror ? (W - 1 - xx) : xx; const i = yy * W + sxx; const v = cl[i] === 0 ? 0 : cl[i] === 1 ? 1 : kind[i] || 1; vote[v]++; }
      let best = 0; for (let k = 1; k < 4; k++) if (vote[k] > vote[best]) best = k; out[sy * S + sx] = best; }
    let n1 = 0, n2 = 0, n3 = 0; for (const v of out) { if (v === 1) n1++; else if (v === 2) n2++; else if (v === 3) n3++; }
    const top = tc.sort((a, b) => b.px.length - a.px.length).slice(0, 5).map((t) => ({ w: t.w, h: t.h, n: t.px.length, mid: t.mid, rr: t.rifleRows }));
    const raw = new Uint8Array(S * S); for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) { const xx = Math.floor((sx - ox) * scale), yy = Math.floor((sy - oy) * scale); raw[sy * S + sx] = (xx < 0 || yy < 0 || xx >= W || yy >= H) ? 0 : cl[yy * W + (p.mirror ? W - 1 - xx : xx)]; }
    return { W, H, rings: rings.length, erased, comps: comps.length, cls: Array.from(out), n1, n2, n3, top, raw: Array.from(raw), dbg };
  });
};
const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const pg = await br.newPage();
const results = []; const S = R.size;
for (const p of R.poses) {
  const b64 = fs.readFileSync(path.join(imgDir, p.src)).toString('base64');
  const r = await pg.evaluate(CLASSIFY, { b64, p: { ...R, ...p, size: S } });
  const cls = Uint8Array.from(r.cls); const png = png2bit(cls, S, S, R.palette); fs.writeFileSync(path.join(outDir, `pose-${p.id}.png`), png);
  results.push({ id: p.id, word: p.word, src: p.src, crop: r.W + '×' + r.H, rings: r.rings, person: r.n1, outline: r.n2, rifle: r.n3, bytes: png.length, sha256: createHash('sha256').update(png).digest('hex'), cls });
  console.log(`pose-${p.id} ${p.word}: crop ${r.W}×${r.H} · ${r.comps} dark components · ${r.rings} callouts erased · person ${r.n1} · outline ${r.n2} · rifle ${r.n3} cells · ${png.length} B`);
  console.log('   thick components (w×h, px):', r.top.map((t) => t.w + '×' + t.h + ':' + t.n + '/mid' + t.mid + '/rifleRows' + t.rr).join('  ')); results[results.length - 1].raw = Uint8Array.from(r.raw);
}
await br.close();
// montage for review (2× on black)
{ const n = results.length, T = S, M = 8, mw = n * T + (n + 1) * M, mh = T + 2 * M; const px = Buffer.alloc(mw * mh * 3); const pal = [null, hexRGB(R.palette[1]), hexRGB(R.palette[2]), hexRGB(R.palette[3])];
  results.forEach((r, i) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const v = r.cls[y * S + x]; if (!v) continue; const o = ((M + y) * mw + (M + i * (T + M) + x)) * 3; px[o] = pal[v][0]; px[o + 1] = pal[v][1]; px[o + 2] = pal[v][2]; } });
  fs.writeFileSync(path.join(outDir, 'montage.png'), pngRGB(px, mw, mh)); }
{ const n = results.length, T = S, M = 8, mw = n * T + (n + 1) * M, mh = T + 2 * M; const px = Buffer.alloc(mw * mh * 3); const pal = [null, [232, 213, 176], [226, 75, 59], null, [201, 162, 39]];
  results.forEach((r, i) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const v = r.raw[y * S + x]; if (!v) continue; const o = ((M + y) * mw + (M + i * (T + M) + x)) * 3; px[o] = pal[v][0]; px[o + 1] = pal[v][1]; px[o + 2] = pal[v][2]; } });
  fs.writeFileSync(path.join(outDir, 'raw.png'), pngRGB(px, mw, mh)); }
fs.writeFileSync(path.join(outDir, 'POSES.sha256'), results.map((r) => `${r.sha256}  pose-${r.id}.png`).join('\n') + '\n');
