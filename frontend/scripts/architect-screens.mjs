#!/usr/bin/env node
/**
 * ARCHITECT SCREENS — serve the operator a REAL screenshot of the deployed Architect-2525 surface for a
 * design decision (the R-UX screenshot program). Captures the Overview (the already-live truthful surface,
 * for before/after context) and the Design tab (the three-panel canonical workspace) at desktop + phone,
 * against the LIVE Cloudflare route by default, so the picture is exactly what a visitor sees. Writes PNGs
 * to frontend/shots/architect/. Runs in CI (needs playwright + chromium); the sandbox cannot reach the live
 * site, so a GitHub Action captures and uploads the PNGs and they are served to the operator.
 *
 *   ARCH_URL=https://exel-ai-polling.explore-096.workers.dev node scripts/architect-screens.mjs
 */
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE = (process.env.ARCH_URL || 'https://exel-ai-polling.explore-096.workers.dev').replace(/\/$/, '');
const ROUTE = process.env.ARCH_ROUTE || '/Architect-2525/';
const OUTDIR = resolve(new URL('..', import.meta.url).pathname, 'shots/architect');
const VPS = [{ w: 1440, h: 900, name: 'desktop' }, { w: 390, h: 844, name: 'phone' }];

const shots = [];
try {
  await mkdir(OUTDIR, { recursive: true });
  const { chromium } = await import('playwright');
  const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean);
  let executablePath; for (const x of cands) { try { await stat(x); executablePath = x; break; } catch {} }
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  for (const vp of VPS) {
    try {
      const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
      await page.goto(BASE + ROUTE, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500); // let the SPA hydrate
      // Overview (default tab) — the already-live, truthful surface, for before/after context.
      const ov = resolve(OUTDIR, `overview-${vp.name}.png`);
      await page.screenshot({ path: ov, fullPage: true }); shots.push(ov);
      // Switch to the Design tab (the top nav button whose text is exactly "Design").
      const clicked = await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => (x.textContent || '').trim() === 'Design');
        if (b) { b.click(); return true; } return false;
      });
      await page.waitForTimeout(400);
      try { await page.waitForSelector('[data-arch-canonical-tree]', { timeout: 8000 }); } catch {}
      await page.waitForTimeout(700);
      const dz = resolve(OUTDIR, `design-${vp.name}.png`);
      await page.screenshot({ path: dz, fullPage: true }); shots.push(dz);
      // The three-panel workspace element, tightly cropped, if present.
      const ws = page.locator('[data-arch-design-ws]').first();
      if (await ws.count()) { try { const p = resolve(OUTDIR, `design-ws-${vp.name}.png`); await ws.screenshot({ path: p }); shots.push(p); } catch {} }
      const tree = await page.locator('[data-arch-canonical-tree]').count();
      console.log(`${vp.name}: design-tab clicked=${clicked} · canonical-tree=${tree}`);
      await page.close();
    } catch (e) {
      console.log(`${vp.name}: capture error — ${e.message}`);
    }
  }
  await browser.close();
} catch (e) {
  console.log('architect-screens FAILED to launch:', e.message);
  process.exit(1);
}
console.log('\nSHOTS (' + shots.length + '):');
for (const s of shots) console.log('  ' + s);
process.exit(shots.length ? 0 : 1);
