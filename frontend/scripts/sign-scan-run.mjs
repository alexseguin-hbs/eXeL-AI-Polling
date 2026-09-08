// sign-scan-run.mjs — a SCANNED contract on one phone: the fixture's signature page is rendered, tilted 0.4°,
// laid on a grey ground and wrapped back into a PDF as an image page (no PDF structure at all — what a
// flatbed or a phone photo produces). One signer uploads it, taps near the lender's line, and the box must
// still FIT the rule (lib/sign-fit reads pixels), draws, signs, downloads; the stamp must sit on that rule.
//   npm run test:soi-sign-scan   (dev server on :3210, see sign-live-run.mjs)
import { chromium } from 'playwright-core';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { signatureBoxes, countSignatureImages } from '../lib/pdf-stamp.ts';

const BASE = process.env.POD_BASE || 'http://127.0.0.1:3210';
const OUT = process.env.OUT || '../docs/assessments/sign-scan-run'; fs.mkdirSync(OUT, { recursive: true });
const FIXTURE = path.resolve('tests/fixtures/sign-sample.pdf');
const log = []; const t0 = Date.now();
const step = (what, ok = true, extra = '') => { const l = `${String(Date.now() - t0).padStart(6)}ms  ${ok ? 'OK ' : 'FAIL'} ${what}${extra ? '  ' + extra : ''}`; console.log(l); log.push(l); if (!ok) { fs.writeFileSync(OUT + '/log.txt', log.join('\n')); throw new Error(what); } };

// 1 · make the scan: page 2 at 150 dpi-ish (scale 2), tilted 0.4°, grey ground → PNG → image-only PDF
const scanPng = path.join(OUT, 'scan-page.png');
execFileSync('node', ['scripts/render-pdf-page.mjs'], { env: { ...process.env, PDF: FIXTURE, PAGE: '2', SCALE: '2', ROTATE: '0.4', BG: '#e9e6e0', OUT: scanPng }, stdio: 'pipe' });
const doc = await PDFDocument.create(); const png = await doc.embedPng(fs.readFileSync(scanPng)); const pg = doc.addPage([612, 792]); pg.drawImage(png, { x: 0, y: 0, width: 612, height: 792 });
const scanPdf = path.join(OUT, 'scan.pdf'); fs.writeFileSync(scanPdf, await doc.save());
step('scan built: one image page, tilted 0.4°, grey ground, no text objects', fs.statSync(scanPdf).size > 50000, `${Math.round(fs.statSync(scanPdf).size / 1024)} kB`);

// 2 · one phone, one signer
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await (await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, acceptDownloads: true })).newPage();
process.on('uncaughtException', async (e) => { console.log('FAILED:', e.message.split('\n')[0]); await p.screenshot({ path: `${OUT}/FAIL.jpg`, type: 'jpeg', quality: 55, fullPage: true }).catch(() => {}); fs.writeFileSync(OUT + '/log.txt', log.join('\n')); process.exit(1); });
await p.goto(BASE + '/soi-session/sign/', { waitUntil: 'domcontentloaded' }); await p.waitForSelector('next-route-announcer', { state: 'attached', timeout: 90000 }); await p.waitForTimeout(400);
await p.getByTestId('file-input').setInputFiles(scanPdf); await p.getByTestId('file-list').locator('li').first().waitFor({ timeout: 30000 }); step('scan uploaded');
await p.getByRole('button', { name: /who signs/ }).click();
await p.getByTestId('signer-name-0').fill('Alex Seguin'); await p.getByTestId('signer-contact-0').fill('explore@eXeL-AI.com');
await p.locator('[aria-label]').filter({ hasText: '✕' }).nth(0).click().catch(() => {});   // solo: remove signer 2 if present
const remove = p.getByRole('button', { name: /remove/i }); if (await remove.count()) await remove.first().click();
await p.getByRole('button', { name: /place your signature/ }).click();
const page = p.getByTestId('pdf-page'); await page.locator('canvas').first().waitFor({ timeout: 60000 }); step('scan page rendered (pdfjs, image page)');
// the rules, from pixels — the lender's line is the left one on the row with two isolated runs
const rules = await p.evaluate(() => {
  const c = document.querySelector('[data-testid="pdf-page"] canvas'); const ctx = c.getContext('2d'); const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data; const dark = (x, y) => { const i = (y * W + x) * 4; return (d[i] + d[i + 1] + d[i + 2]) / 3 < 200; };
  const out = [];
  for (let y = 0; y < H; y++) { let x0 = -1, gap = 0; for (let x = 0; x <= W; x++) { if (x < W && dark(x, y)) { if (x0 < 0) x0 = x; gap = 0; } else if (x0 >= 0 && (++gap > 3 || x === W)) { const x1 = x - gap; if (x1 - x0 >= 0.15 * W) out.push({ y: y / H, x0: x0 / W, x1: x1 / W }); x0 = -1; gap = 0; } } }
  return out;
});
const cand = rules.filter((r) => r.y > 0.3 && r.x1 - r.x0 < 0.6 && r.x1 - r.x0 > 0.2 && r.x0 < 0.3);
const lender = cand.find((r) => !rules.some((o) => o !== r && Math.abs(o.y - r.y) > 0.004 && Math.abs(o.y - r.y) < 0.012 && Math.abs(o.x0 - r.x0) < 0.05));
step('the lender\'s line is still found on the tilted scan', !!lender, lender ? `y=${lender.y.toFixed(3)} x=[${lender.x0.toFixed(2)}–${lender.x1.toFixed(2)}]` : JSON.stringify(cand.slice(0, 3)));
const bb = await page.boundingBox(); await p.mouse.click(bb.x + bb.width * (lender.x0 + lender.x1) / 2, bb.y + bb.height * (lender.y - 0.012));
await p.getByTestId('sig-box').waitFor();
const fit = await p.getByTestId('sig-box').getAttribute('data-fit'); const sb = await p.getByTestId('sig-box').boundingBox(); const pb = await page.boundingBox();
const bBottom = (sb.y + sb.height - pb.y) / pb.height, bx0 = (sb.x - pb.x) / pb.width, bw = sb.width / pb.width;
step('box FITS the scanned line (pixels, not PDF structure): bottom on it, width ≈ its run', fit === 'underline' && Math.abs(bBottom - lender.y) < 0.015 && Math.abs(bx0 - lender.x0) < 0.03 && bw > 0.2, `fit=${fit} bottom=${bBottom.toFixed(3)} rule=${lender.y.toFixed(3)} w=${bw.toFixed(2)}`);
await p.screenshot({ path: `${OUT}/1-fitted.jpg`, type: 'jpeg', quality: 55, fullPage: true });
await p.getByTestId('to-draw').click();
const c = p.locator('canvas[aria-label]').first(); const b = await c.boundingBox();
await p.mouse.move(b.x + 20, b.y + 80); await p.mouse.down(); for (let i = 1; i <= 24; i++) await p.mouse.move(b.x + 20 + i * 10, b.y + 80 + Math.sin(i * 1.3) * 28, { steps: 2 }); await p.mouse.up();
{ const ci = p.locator('canvas[aria-label="Draw your initials"]'); const bi = await ci.boundingBox(); await p.mouse.move(bi.x + 20, bi.y + 60); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(bi.x + 20 + i * 9, bi.y + 60 + (i % 2 ? -22 : 18), { steps: 2 }); await p.mouse.up(); }
await p.waitForFunction(() => { const s = document.querySelector('[data-testid="sign-button"]'); return s && !s.disabled; }, null, { timeout: 5000 }); await p.getByTestId('sign-button').click();
await p.getByTestId('downloads').waitFor({ timeout: 60000 }); step('solo signature saved on the scan (no backend needed)');
const [dl] = await Promise.all([p.waitForEvent('download'), p.getByTestId('downloads').locator('button').first().click()]);
const file = path.join(OUT, 'scan-signed.pdf'); await dl.saveAs(file); const bytes = new Uint8Array(fs.readFileSync(file));
const boxes = await signatureBoxes(bytes);
step('the stamp sits on the scanned line in the file', (await countSignatureImages(bytes)) === 1 && boxes.length === 1 && Math.abs(boxes[0].y + boxes[0].h - lender.y) < 0.015, JSON.stringify(boxes.map((x) => [x.page, +x.x.toFixed(2), +(x.y + x.h).toFixed(3), +x.w.toFixed(2)])));
execFileSync('node', ['scripts/render-pdf-page.mjs'], { env: { ...process.env, PDF: file, PAGE: '1', SCALE: '3', CROP: `0.06,${(lender.y - 0.05).toFixed(3)},0.5,0.1`, OUT: path.join(OUT, 'scan-signed-block.png') }, stdio: 'pipe' });
step('signed scan rendered to PNG', fs.existsSync(path.join(OUT, 'scan-signed-block.png')));
fs.writeFileSync(OUT + '/log.txt', log.join('\n')); await browser.close(); console.log(`\nSIGN SCAN RUN: ${log.length} steps, 0 failures`);
