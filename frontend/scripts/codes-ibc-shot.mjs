#!/usr/bin/env node
// ARCHITECT-2525 · IBC / building-code capture (operator 2026-11-02: "Place download of 2024 IBC in … building code
// section"). Navigates Design tab → the Codes panel (bottomPanel2), selects the 2024 IBC, and captures the panel +
// the always-visible "Official code library" row. Local static build only; LIVE is proven by Verify Live.
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE = (process.env.BASE || 'http://localhost:3100').replace(/\/$/, '');
const OUT = resolve(new URL('..', import.meta.url).pathname, 'shots/codes-ibc');
await mkdir(OUT, { recursive: true });
const { chromium } = await import('playwright');
const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium/chrome-linux/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean);
let exe; for (const x of cands) { try { await stat(x); exe = x; break; } catch {} }
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const shots = [];
const clickText = (page, t) => page.evaluate((txt) => { const b = [...document.querySelectorAll('button,a,[role=button],[role=tab]')].find((x) => (x.textContent || '').trim() === txt); if (b) { b.click(); return true; } return false; }, t);

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 1600 }, deviceScaleFactor: 2 });
  await page.goto(BASE + '/Architect-2525/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);
  await clickText(page, 'Design'); await page.waitForTimeout(900);
  // the Codes panel (Approvals · Codes) is the b2 bottom expandable — collapsed by default, children mount on open.
  const opened = await page.evaluate(() => { const b = document.querySelector('[data-bpanel-toggle="b2"]'); if (b) { b.scrollIntoView({ block: 'center' }); b.click(); return true; } return false; });
  console.log('b2-opened:', opened);
  await page.waitForTimeout(600);
  await page.evaluate(() => { const el = document.querySelector('[data-arch-codes]'); if (el) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(400);
  // select the 2024 IBC chip so its requirements + source link show
  const sel = await page.evaluate(() => { const b = document.querySelector('[data-code-toggle="usa-ibc-2024"]'); if (b) { b.click(); return true; } return false; });
  await page.waitForTimeout(500);
  console.log('ibc-chip-selected:', sel);
  const panel = await page.$('[data-arch-codes]');
  if (panel) { const p = resolve(OUT, 'codes-panel-ibc.png'); await panel.screenshot({ path: p }); shots.push(p); console.log('codes-panel captured'); }
  const lib = await page.$('[data-arch-code-library]');
  if (lib) { const p = resolve(OUT, 'code-library-row.png'); await lib.screenshot({ path: p }); shots.push(p); console.log('code-library captured'); }
  // the IBC detail card (requirements + the source link)
  const detail = await page.$('[data-code-detail="usa-ibc-2024"]');
  if (detail) { const p = resolve(OUT, 'ibc-detail.png'); await detail.screenshot({ path: p }); shots.push(p); console.log('ibc-detail captured'); }
  if (!panel) { const p = resolve(OUT, 'design-fallback.png'); await page.screenshot({ path: p, fullPage: true }); shots.push(p); console.log('FALLBACK full-page (no [data-arch-codes] found)'); }
  await page.close();
} catch (e) { console.log('capture err:', e.message); }
await browser.close();
console.log('SHOTS:', shots.map((s) => s.replace(resolve(new URL('..', import.meta.url).pathname) + '/', '')).join(' · '));
