#!/usr/bin/env node
/**
 * ICON WALL SHOT — real 390px capture of the HOUSE BUILD SPEC master's ICON Wall System section
 * (the $/sq-ft composition, $34 vs $35, the ratings, Carbon X, and the Phoenix "printed walls $25/ft²" line)
 * against the LOCAL static build (out/), served over http. The sandbox cannot reach the live site, so we
 * capture the exact bytes `next build` produced for this SHA. Writes PNGs to shots/icon-wall/.
 */
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const OUTDIR = resolve(new URL('..', import.meta.url).pathname, 'shots/icon-wall');
const OUT = resolve(new URL('..', import.meta.url).pathname, 'out');
const PORT = 4788;
const BASE = `http://127.0.0.1:${PORT}`;
const ROUTE = process.env.ARCH_ROUTE || '/Architect-2525/';

const srv = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: OUT, stdio: 'ignore' });
const shots = [];
const log = [];
try {
  await mkdir(OUTDIR, { recursive: true });
  await new Promise((r) => setTimeout(r, 1200));
  const { chromium } = await import('playwright');
  const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean);
  let executablePath; for (const x of cands) { try { await stat(x); executablePath = x; break; } catch {} }
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(BASE + ROUTE, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);

  // Click the Design tab.
  const clickedDesign = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Design');
    if (b) { b.click(); return true; } return false;
  });
  await page.waitForTimeout(900);

  // The HOUSE BUILD SPEC panel is the workspace bottomPanel — expand it if collapsed, then scroll it into view.
  const expanded = await page.evaluate(() => {
    // try clicking any header/button that names the build spec
    const cand = [...document.querySelectorAll('button, [role="button"], summary, h2, h3, div')]
      .find((x) => /HOUSE BUILD SPEC|BUILD SPEC/i.test((x.textContent || '').slice(0, 60)));
    if (cand) { try { cand.click(); } catch {} }
    const wall = document.querySelector('[data-arch-icon-wall]');
    if (wall) wall.scrollIntoView({ block: 'center' });
    return { foundHeader: !!cand, foundWall: !!wall };
  });
  await page.waitForTimeout(700);

  // Whole-screen capture (context).
  const whole = resolve(OUTDIR, 'design-whole-390.png');
  await page.screenshot({ path: whole, fullPage: true }); shots.push(whole);

  // The ICON Wall System section, tightly cropped (the before/after evidence card).
  const wall = page.locator('[data-arch-icon-wall]').first();
  const wc = await wall.count();
  if (wc) { try { const p = resolve(OUTDIR, 'icon-wall-section-390.png'); await wall.screenshot({ path: p }); shots.push(p); } catch (e) { log.push('wall crop err ' + e.message); } }

  // The whole HOUSE BUILD SPEC master block, if present.
  const spec = page.locator('[data-arch-house-spec]').first();
  if (await spec.count()) { try { const p = resolve(OUTDIR, 'house-spec-390.png'); await spec.screenshot({ path: p }); shots.push(p); } catch (e) { log.push('spec crop err ' + e.message); } }

  // Pull the ICON wall text so we can PROVE $25 renders (read-back, not a drawing).
  const wallText = wc ? (await wall.innerText()).replace(/\s+/g, ' ').trim() : '(no [data-arch-icon-wall] element found)';

  console.log(JSON.stringify({ clickedDesign, expanded, wallCount: wc, shots: shots.length, errs, log, wallText }, null, 2));
  await browser.close();
} catch (e) {
  console.log('icon-wall-shot FAILED:', e.message);
} finally {
  srv.kill('SIGKILL');
}
console.log('\nSHOTS (' + shots.length + '):');
for (const s of shots) console.log('  ' + s);
process.exit(shots.length ? 0 : 1);
