// render-pdf-page.mjs — one PDF page to a PNG through pdfjs in headless Chromium (no poppler in the
// sandbox). Used by the live run to SHOW the signed result, not just count its stamps.
//   PDF=file PAGE=2 SCALE=1.4 OUT=out.png [CROP=x,y,w,h page fractions] node scripts/render-pdf-page.mjs
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const scale = Number(process.env.SCALE || 1.4), n = Number(process.env.PAGE || 1);
const b = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: Math.ceil(612 * scale) + 20, height: Math.ceil(792 * scale) + 20 } });
const pdfB64 = fs.readFileSync(process.env.PDF).toString('base64');
const pdfjs = fs.readFileSync(path.join(root, 'node_modules/pdfjs-dist/build/pdf.mjs'), 'utf8');
const worker = fs.readFileSync(path.join(root, 'node_modules/pdfjs-dist/build/pdf.worker.mjs'), 'utf8');
await p.setContent(`<body style="margin:0;background:#fff"><canvas id="c" style="display:block"></canvas></body>`);
const size = await p.evaluate(async ({ pdfB64, pdfjs, worker, n, scale }) => {
  const mod = await import(URL.createObjectURL(new Blob([pdfjs], { type: 'text/javascript' })));
  mod.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([worker], { type: 'text/javascript' }));
  const bytes = Uint8Array.from(atob(pdfB64), (c) => c.charCodeAt(0));
  const doc = await mod.getDocument({ data: bytes }).promise; const page = await doc.getPage(n);
  const vp = page.getViewport({ scale }); const c = document.getElementById('c'); c.width = vp.width; c.height = vp.height;
  await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  return { w: vp.width, h: vp.height };
}, { pdfB64, pdfjs, worker, n, scale });
await p.setViewportSize({ width: Math.ceil(size.w), height: Math.ceil(size.h) });
if (process.env.CROP) {
  const [x, y, w, h] = process.env.CROP.split(',').map(Number);
  await p.screenshot({ path: process.env.OUT, clip: { x: x * size.w, y: y * size.h, width: w * size.w, height: h * size.h } });
} else await p.locator('#c').screenshot({ path: process.env.OUT });
await b.close(); console.log('rendered', process.env.OUT, `${Math.round(size.w)}×${Math.round(size.h)}`);
