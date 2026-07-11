// Mission-Planning SPIRAL gate — forward + backward, human-style. Asserts the last-24h regression
// corpus so those bugs can never silently return. Run: cd frontend && npm run dev ; npm run e2e:spiral
import { chromium } from 'playwright';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:3000/main/Security-2525/';
// Known-benign, pre-existing warnings (float-precision style hydration on a positioned grid element).
const ALLOW = /404|did not match|hydrat|Prop .* did not match/i;
const GZD_RE = /^\d+[C-X]\s*·\s*[\d,]+\s*×\s*[\d,]+\s*km$/;

const results = [];
const rec = (name, pass, detail = '') => { results.push({ name, pass, detail }); };

const b = await chromium.launch({ headless: true, executablePath: EXE });

// helpers bound per page
const mk = async (seedFmt) => {
  const pg = await b.newPage({ viewport: { width: 1000, height: 820 } });
  const errs = [];
  pg.on('pageerror', e => errs.push('PE:' + e.message.slice(0, 90)));
  pg.on('console', m => { if (m.type() === 'error' && !ALLOW.test(m.text())) errs.push(m.text().slice(0, 90)); });
  if (seedFmt) await pg.addInitScript((f) => { try { localStorage.setItem('sec2525.coordFmt', f); } catch {} }, seedFmt);
  const clk = async (sel) => { const l = pg.locator(sel); const n = await l.count(); for (let i = 0; i < n; i++) { const el = l.nth(i); let v = false; try { v = await el.isVisible(); } catch {} if (!v) continue; try { await el.click({ timeout: 2500 }); return true; } catch {} try { await el.click({ force: true, timeout: 1500 }); return true; } catch {} } return false; };
  const gzd = () => pg.evaluate((re) => [...document.querySelectorAll('span')].some(e => new RegExp(re).test((e.innerText || '').replace(/\s+/g, ' ').trim())), GZD_RE.source);
  const violet = () => pg.evaluate(() => [...document.querySelectorAll('span')].filter(e => /^[C-X]$/.test((e.textContent || '').trim()) && getComputedStyle(e).color === 'rgb(181, 123, 255)').length);
  const readout = () => pg.evaluate((re) => { for (const e of document.querySelectorAll('span,div')) { const t = (e.innerText || '').replace(/\s+/g, ' ').trim(); if (new RegExp(re).test(t)) { const r = e.getBoundingClientRect(); return { t, left: Math.round(r.left), fs: getComputedStyle(e).fontSize }; } } return null; }, GZD_RE.source);
  await pg.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForTimeout(2200);
  return { pg, errs, clk, gzd, violet, readout };
};

// ── CORPUS #1: GZD grid stays in ALL 4 formats (the recurring "reverted grid") ──
for (const fmt of ['mgrs', 'dms', 'utm', 'ucrs']) {
  const { pg, errs, clk, gzd, violet } = await mk(fmt);
  await clk('button:has-text("EARTH"):visible'); await pg.waitForTimeout(700);
  await clk('button:has-text("GRID"):visible'); await pg.waitForTimeout(800);
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(800);
  const g = await gzd(), v = await violet();
  rec(`#1 grid GZD [${fmt}]`, g === true && v >= 10, `gzd=${g} violet=${v} errs=${errs.length}`);
  rec(`#13 console [${fmt}]`, errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── forward spiral on default (mgrs): EARTH→GRID→2D→3D readout parity→FPS ──
{
  const { pg, errs, clk, gzd, readout } = await mk(null);
  await clk('button:has-text("EARTH"):visible'); await pg.waitForTimeout(700);
  await clk('button:has-text("GRID"):visible'); await pg.waitForTimeout(700);
  // 3D readout (globe)
  const r3 = await readout();
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(700);
  const r2 = await readout();
  rec('#5 readout parity 2D/3D', !!r2 && !!r3 && r2.fs === r3.fs && GZD_RE.test(r2.t) && GZD_RE.test(r3.t), `2d=${r2 && r2.fs} 3d=${r3 && r3.fs}`);
  // #2 orbit works (touch drag on globe): back to 3D, drag, path changes
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(700);
  const h = await pg.evaluateHandle(() => { const gs = [...document.querySelectorAll('svg[aria-label^="Wireframe globe"]')]; let big = null, a = 0; for (const g of gs) { const r = g.getBoundingClientRect(); if (r.width * r.height > a) { a = r.width * r.height; big = g; } } if (big) big.setAttribute('data-tb', '1'); return big; });
  const box = await h.boundingBox();
  const pd = () => pg.evaluate(() => { const g = document.querySelector('svg[data-tb] path'); return g && g.getAttribute('d') ? g.getAttribute('d').slice(0, 40) : ''; });
  const before = await pd();
  if (box) { const cx = Math.round(box.x + box.width / 2), cy = Math.round(box.y + box.height / 2); await pg.evaluate(({ cx, cy }) => { const el = document.querySelector('svg[data-tb]'); el.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, pointerType: 'touch', clientX: cx, clientY: cy, bubbles: true })); for (let i = 1; i <= 15; i++) el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, pointerType: 'touch', clientX: cx - i * 8, clientY: cy + i * 4, bubbles: true })); el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, pointerType: 'touch', clientX: cx - 120, clientY: cy + 60, bubbles: true })); }, { cx, cy }); }
  await pg.waitForTimeout(500);
  const after = await pd();
  rec('#2 orbit responsive (no glitch)', !!before && before !== after, `moved=${before !== after}`);
  // FPS toggle (feature)
  await clk('button[title^="Settings"]'); await pg.waitForTimeout(300);
  await clk('button:has-text("OFF")'); await pg.waitForTimeout(900);
  const fps = await pg.locator('text=/\\d+\\s*FPS/').count();
  rec('FPS overlay toggles', fps >= 1, `overlay=${fps}`);
  // ── backward: FPS off, GRID off, EARTH off ──
  await clk('button[title^="Settings"]'); await pg.waitForTimeout(200);
  await clk('button:has-text("ON")'); await pg.waitForTimeout(300);
  await clk('button:has-text("GRID"):visible'); await pg.waitForTimeout(400);
  rec('backward console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

await b.close();
const passed = results.filter(r => r.pass).length, total = results.length;
console.log('SPIRAL ' + passed + '/' + total + ' passed');
results.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  (' + r.detail + ')' : '')));
process.exit(passed === total ? 0 : 1);
