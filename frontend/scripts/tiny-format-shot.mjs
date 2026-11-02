#!/usr/bin/env node
// ARCHITECT-2525 · Tiny-Home-format FX capture (operator 2026-11-02: "fix the Tiny home format … to match exactly").
// Captures the Simulate compare cards at phone width (390) against the LOCAL static build served on BASE, so the FX
// artifact shows the REAL rendered Tiny card now matching Cube/Eco (Area·Cost·Build·Energy·Carbon + footer), plus the
// Tiny's "See details" open (the honest catalog detail moved there). Local build only; LIVE is proven by Verify Live.
import { mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const BASE = (process.env.BASE || 'http://localhost:3100').replace(/\/$/, '');
const OUT = resolve(new URL('..', import.meta.url).pathname, 'shots/tiny-format');
await mkdir(OUT, { recursive: true });
const { chromium } = await import('playwright');
const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium/chrome-linux/chrome', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean);
let exe; for (const x of cands) { try { await stat(x); exe = x; break; } catch {} }
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const shots = [];
const clickText = (page, t) => page.evaluate((txt) => { const b = [...document.querySelectorAll('button,a,[role=button],[role=tab]')].find((x) => (x.textContent || '').trim() === txt); if (b) { b.click(); return true; } return false; }, t);

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 1400 }, deviceScaleFactor: 2 });
  await page.goto(BASE + '/Architect-2525/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1200);
  // open the Simulate tab
  const sim = await clickText(page, 'Simulate');
  await page.waitForTimeout(900);
  console.log('simulate-clicked:', sim);
  // 1) the three compare cards — whole-screen context (the Tiny now matches the format)
  const whole = resolve(OUT, 'simulate-cards-390.png');
  await page.screenshot({ path: whole, fullPage: true }); shots.push(whole);
  // 2) crop to the three cards row (the AFTER — Tiny matches Cube/Eco)
  const row = await page.$('[data-arch-sim-options] .grid');
  if (row) { const p = resolve(OUT, 'simulate-cards-row.png'); await row.screenshot({ path: p }); shots.push(p); console.log('cards-row captured'); }
  // 3) the Tiny card alone (collapsed) — the matched labeled rows
  const tiny = await page.$('[data-arch-sim-model="tiny"]');
  if (tiny) { const p = resolve(OUT, 'tiny-card-collapsed.png'); await tiny.screenshot({ path: p }); shots.push(p); console.log('tiny-card captured'); }
  // 4) open the Tiny's See details → the honest catalog detail (moved there)
  const exp = await page.evaluate(() => { const b = document.querySelector('[data-arch-sim-expand="tiny"]'); if (b) { b.click(); return true; } return false; });
  await page.waitForTimeout(700);
  const tiny2 = await page.$('[data-arch-sim-model="tiny"]');
  if (exp && tiny2) { const p = resolve(OUT, 'tiny-card-details.png'); await tiny2.screenshot({ path: p }); shots.push(p); console.log('tiny-details captured'); }
  await page.close();
} catch (e) { console.log('capture err:', e.message); }
await browser.close();
console.log('SHOTS:', shots.map((s) => s.replace(resolve(new URL('..', import.meta.url).pathname) + '/', '')).join(' · '));
