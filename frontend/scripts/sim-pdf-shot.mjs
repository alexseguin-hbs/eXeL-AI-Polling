#!/usr/bin/env node
// ARCHITECT-2525 · capture the Simulate Download-as-PDF deck for the FX artifact (operator 2026-11-03). Opens the
// Simulate tab, clicks "Download as PDF" (window.print stubbed), emulates print media so the off-stage stack becomes
// visible, and screenshots each .sim-print-page in BOTH portrait and landscape viewports (the user-defined, responsive
// orientation). Also writes a real page.pdf() per orientation and reports its page count. Local static build only.
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE = (process.env.BASE || 'http://localhost:3100').replace(/\/$/, '');
const OUT = resolve(new URL('..', import.meta.url).pathname, 'shots/sim-pdf');
await mkdir(OUT, { recursive: true });
const { chromium } = await import('playwright');
const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium/chrome-linux/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean);
let exe; for (const x of cands) { try { await stat(x); exe = x; break; } catch {} }
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const shots = [];
const clickText = (page, t) => page.evaluate((txt) => { const b = [...document.querySelectorAll('button,a,[role=button],[role=tab]')].find((x) => (x.textContent || '').trim() === txt); if (b) { b.click(); return true; } return false; }, t);

async function run(name, w, h) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await page.addInitScript(() => { window.print = () => { /* stubbed so the off-stage stack stays mounted */ }; });
  await page.goto(BASE + '/Architect-2525/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1000);
  await clickText(page, 'Simulate'); await page.waitForTimeout(700);
  const clicked = await page.evaluate(() => { const b = document.querySelector('[data-arch-sim-print]'); if (b) { b.click(); return true; } return false; });
  await page.waitForTimeout(700);
  const mounted = await page.evaluate(() => !!document.querySelector('.sim-print-stack'));
  const pages = await page.evaluate(() => document.querySelectorAll('.sim-print-page').length);
  const envs = await page.evaluate(() => document.querySelectorAll('[data-arch-sim-env]').length);
  console.log(`${name}: print-clicked=${clicked} stackMounted=${mounted} pages=${pages} mockups=${envs}`);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(400);
  // screenshot each print page
  const handles = await page.$$('.sim-print-page');
  for (let i = 0; i < handles.length; i++) { const p = resolve(OUT, `${name}-page${i + 1}.png`); await handles[i].screenshot({ path: p }); shots.push(p); }
  // real PDF
  try { const pdf = resolve(OUT, `${name}.pdf`); await page.pdf({ path: pdf, printBackground: true, landscape: name === 'landscape', preferCSSPageSize: true }); shots.push(pdf); } catch (e) { console.log(`${name} pdf err: ${e.message}`); }
  await page.close();
  return { pages, envs };
}

try {
  await run('portrait', 816, 1056);   // US Letter portrait @96dpi
  await run('landscape', 1056, 816);  // US Letter landscape @96dpi
} catch (e) { console.log('capture err:', e.message); }
await browser.close();
console.log('SHOTS:', shots.map((s) => s.replace(resolve(new URL('..', import.meta.url).pathname) + '/', '')).join(' · '));
