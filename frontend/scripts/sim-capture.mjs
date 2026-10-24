#!/usr/bin/env node
// Simulation capture for the ARCH-RUX report-out: Architect (restored designer), Security-2525 (Mission
// Planning map reference), Celestial-2525 (lighting reference). Local dev only.
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE = process.env.BASE || 'http://localhost:3100';
const OUT = resolve(new URL('..', import.meta.url).pathname, 'shots/sim');
const VPS = [{ w: 1440, h: 900, name: 'desktop' }, { w: 390, h: 844, name: 'phone' }];
const shots = [];
await mkdir(OUT, { recursive: true });
const { chromium } = await import('playwright');
const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean);
let exe; for (const x of cands) { try { await stat(x); exe = x; break; } catch {} }
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const clickText = async (page, txt) => page.evaluate((t) => { const b = [...document.querySelectorAll('button,a,[role=button],[role=tab]')].find((x) => (x.textContent || '').trim() === t); if (b) { b.click(); return true; } return false; }, txt);
const clickContains = async (page, re) => page.evaluate((src) => { const rx = new RegExp(src, 'i'); const b = [...document.querySelectorAll('button,a,[role=button],[role=tab]')].find((x) => rx.test((x.textContent || '').trim())); if (b) { b.click(); return (b.textContent||'').trim(); } return ''; }, re);

async function shoot(page, name) { const p = resolve(OUT, name + '.png'); await page.screenshot({ path: p, fullPage: true }); shots.push(p); }

for (const vp of VPS) {
  // ARCHITECT — Overview + Design/Model
  try {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
    await page.goto(BASE + '/Architect-2525/', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1200);
    await shoot(page, `arch-overview-${vp.name}`);
    await clickText(page, 'Design'); await page.waitForTimeout(900);
    await shoot(page, `arch-design-${vp.name}`);
    // Build tab (stage-gate / cost-time) for context
    const b = await clickText(page, 'Build'); await page.waitForTimeout(900);
    if (b) await shoot(page, `arch-build-${vp.name}`);
    console.log(`architect ${vp.name}: design-clicked, build=${b}`);
    await page.close();
  } catch (e) { console.log(`architect ${vp.name} err: ${e.message}`); }
  // SECURITY-2525 — landing + Mission Planning map
  try {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
    await page.goto(BASE + '/Security-2525/', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1200);
    await shoot(page, `security-landing-${vp.name}`);
    const hit = await clickContains(page, 'mission|planning|map'); await page.waitForTimeout(1000);
    if (hit) await shoot(page, `security-mission-${vp.name}`);
    console.log(`security ${vp.name}: mission-nav="${hit}"`);
    await page.close();
  } catch (e) { console.log(`security ${vp.name} err: ${e.message}`); }
  // CELESTIAL-2525 — lighting / sun-moon reference
  try {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
    await page.goto(BASE + '/Celestial-2525/', { waitUntil: 'networkidle', timeout: 45000 });
    await page.waitForTimeout(1500);
    await shoot(page, `celestial-${vp.name}`);
    console.log(`celestial ${vp.name}: captured`);
    await page.close();
  } catch (e) { console.log(`celestial ${vp.name} err: ${e.message}`); }
}
await browser.close();
console.log(`\nSHOTS (${shots.length}):`); for (const s of shots) console.log('  ' + s);
process.exit(shots.length ? 0 : 1);
