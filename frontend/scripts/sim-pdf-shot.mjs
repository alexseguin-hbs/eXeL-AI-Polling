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
// PROOF thresholds (px @96dpi inside 0.5in margins): portrait printable ≈960 (10in); landscape printable ≈720
// (7.5in) but we PROVE ≤680 so the per-home page keeps ~40px slack after the 13-CHECKS right-rail fix (operator
// 2026-11-03 "landscape still has errors"). A page over its threshold fails the script (exit 1) — a real clip proof.
const PROOF_H = { portrait: 960, landscape: 680 };
let FAIL = 0;
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
  // measure each .sim-print-page content height against the printable page height for THIS orientation
  // (portrait printable ≈ 10in=960px tall; landscape ≈ 7.5in=720px tall, at 96dpi minus 0.5in margins)
  const printableH = PROOF_H[name];
  const heights = await page.evaluate(() => [...document.querySelectorAll('.sim-print-page')].map((el) => Math.round(el.getBoundingClientRect().height)));
  const over = heights.filter((h) => h > printableH);
  if (over.length) FAIL += over.length;
  console.log(`${name} page content heights(px): ${heights.join(', ')} · proof≤${printableH} · ${over.length ? `OVERFLOW ⚠ (${over.join(', ')})` : 'ALL FIT ✓'}`);
  // screenshot each print page
  const handles = await page.$$('.sim-print-page');
  for (let i = 0; i < handles.length; i++) { const p = resolve(OUT, `${name}-page${i + 1}.png`); await handles[i].screenshot({ path: p }); shots.push(p); }
  // real PDF — force the TRUE page box per orientation (explicit dims so landscape is actually landscape-shaped)
  try { const pdf = resolve(OUT, `${name}.pdf`); const dims = name === 'landscape' ? { width: '11in', height: '8.5in' } : { width: '8.5in', height: '11in' }; await page.pdf({ path: pdf, printBackground: true, preferCSSPageSize: false, ...dims }); const { readFile } = await import('node:fs/promises'); const bytes = await readFile(pdf); const pc = (bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length; const mb = (bytes.toString('latin1').match(/MediaBox\s*\[[^\]]*\]/) || ['?'])[0]; console.log(`${name}.pdf: ${pc} PDF pages · ${mb}`); shots.push(pdf); } catch (e) { console.log(`${name} pdf err: ${e.message}`); }
  await page.close();
  return { pages, envs };
}

try {
  await run('portrait', 720, 960);    // US Letter portrait printable @96dpi (7.5in × 10in inside 0.5in margins)
  await run('landscape', 960, 720);   // US Letter landscape printable @96dpi (10in × 7.5in inside 0.5in margins)
} catch (e) { console.log('capture err:', e.message); FAIL++; }
await browser.close();
console.log('SHOTS:', shots.map((s) => s.replace(resolve(new URL('..', import.meta.url).pathname) + '/', '')).join(' · '));
console.log(FAIL ? `\nsim-pdf-shot: FAIL — ${FAIL} page(s) over the one-page proof threshold` : `\nsim-pdf-shot: PASS — every page fits one printed page (portrait ≤${PROOF_H.portrait} · landscape ≤${PROOF_H.landscape})`);
process.exit(FAIL ? 1 : 0);
