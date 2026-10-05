#!/usr/bin/env node
/**
 * LAYOUT SMOKE — the Sensor Fusion labeler never hides its own controls (SF rev 43, round 2 of the 19 review rounds).
 *
 * Rev 42 shipped behind green source gates while the built page could not be used: the labeler pane had overflow: hidden, so on a
 * phone held upright rows 4-6 of his six-object card sat under the footer and the film strip shrank from 48 px to 0, and on a phone
 * held sideways SAVE BOX sat at y 534 on a 390 px screen with no way down (Asar, Athena, Enki, Pangu). Settings and the model list
 * ignored Escape although rev 42's ledger said every dialog closes with it (Aset, Athena, Enlil). A regex cannot see a layout; a
 * browser can. This serves the built export, skips sign-in (guest), opens the Image labeler, adds two pictures from this device (his
 * Austin card and the logo — no camera needed), saves the six objects of his card as six boxes, and at 390×844 and 844×390 asserts:
 *   - the film strip is at least 40 px tall;
 *   - SAVE BOX is on the screen and is what a finger at its centre touches; with the picture scrolled to the top of the
 *     pane, the whole picture and SAVE BOX are in one view;
 *   - a user's wheel scroll moves the pane, and then the last row's Fix is on the screen and touchable; a scroll back up
 *     brings SAVE BOX into reach again;
 *   - a second SAVE BOX with nothing moved adds no box;
 *   - each row names its box ("Box 6 · traffic light · labeled") and each outline carries its number;
 *   - Escape closes Settings and the model list.
 * A probe that cannot go red is not evidence: each state is asserted as reached (six rows, the dialogs open) before it is measured.
 *
 *   node scripts/sf-layout-smoke.mjs               (needs `next build` first; reads out/, or SF_SMOKE_OUT=<dir>)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const OUT = process.env.SF_SMOKE_OUT ? resolve(process.env.SF_SMOKE_OUT) : join(ROOT, 'out');
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon' };
const srv = createServer(async (req, res) => {
  try {
    let f = join(OUT, decodeURIComponent(req.url.split('?')[0]));
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); } catch { f = extname(f) ? f : join(f, 'index.html'); }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
  } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${srv.address().port}`;
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
// The six objects on his card, in % of the picture (sf.ts INFO_STILL boxes / 1254, rounded).
const SIX = [['person', 8, 47, 18, 80], ['person', 38, 56, 48, 70], ['bicycle', 36, 61, 52, 71], ['car', 64, 58, 94, 72], ['dog', 15, 66, 28, 80], ['traffic light', 84, 17, 88, 26]];
const PICS = [join(ROOT, 'public/sensor-fusion/info-default.webp'), join(ROOT, 'public/sensor-fusion/sensor_fusion_logo_001.png')];
const errors = [];
let browser;
try {
  const { chromium } = await import('playwright');
  const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean);
  let executablePath; for (const x of cands) { try { await stat(x); executablePath = x; break; } catch {} }
  browser = await chromium.launch(executablePath ? { executablePath } : {});
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // Is the element on the screen, and is it what a finger at its centre touches?
  const touchable = (loc) => loc.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const onScreen = r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
    const hit = document.elementFromPoint(x, y);
    return { onScreen, hits: Boolean(hit && (hit === el || el.contains(hit))), top: Math.round(r.top), bottom: Math.round(r.bottom), h: window.innerHeight };
  });
  for (const [w, h] of [[390, 844], [844, 390]]) {
    const tag = `${w}×${h}`;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { try { localStorage.setItem('sf2525-guest', '1'); delete window.showDirectoryPicker; } catch {} });
    await ctx.route('**/*', (route) => (route.request().url().startsWith(BASE) ? route.continue() : route.abort()));
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
    await p.goto(`${BASE}/SensorFusion-2525/`, { waitUntil: 'networkidle', timeout: 30000 });
    // With no sign-in configured (the gate build has no secrets) the page waits on the login screen: SKIP, as a guest does.
    const skip = p.getByRole('button', { name: 'SKIP TO SENSOR FUSION' });
    await p.getByRole('button', { name: 'Sensor Fusion' }).or(skip).first().waitFor({ timeout: 15000 });
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await p.getByRole('button', { name: 'Sensor Fusion' }).first().waitFor({ timeout: 15000 });
    // Escape closes Settings (menu screen).
    await p.getByRole('button', { name: 'Settings' }).click();
    ok(await p.locator('[role=dialog][aria-label=Settings]').count() === 1, `${tag}: Settings opens`);
    await p.keyboard.press('Escape'); await sleep(150);
    ok(await p.locator('[role=dialog][aria-label=Settings]').count() === 0, `${tag}: Escape closes Settings`);
    if (await p.locator('[role=dialog][aria-label=Settings]').count()) await p.getByRole('button', { name: 'Close settings' }).click();
    // Escape closes the model list (camera screen; the camera stays off).
    await p.getByRole('button', { name: /Sensor Fusion/ }).first().click();
    await p.getByRole('button', { name: 'Run Live' }).click();
    ok(await p.locator('[role=listbox]').count() === 1, `${tag}: the model list opens`);
    await p.keyboard.press('Escape'); await sleep(150);
    ok(await p.locator('[role=listbox]').count() === 0, `${tag}: Escape closes the model list`);
    if (await p.locator('[role=listbox]').count()) await p.getByRole('button', { name: 'Run Live' }).click();
    // The labeler with two pictures and six boxes.
    await p.getByRole('button', { name: 'Annotate Images' }).click();
    await p.locator('main input[type=file]').setInputFiles(PICS);
    await p.locator('[class*=filmOn]').waitFor({ timeout: 15000 });
    await p.locator('[class*=filmItem], [class*=filmOn]').first().click();
    await p.waitForFunction(() => { const i = document.querySelector('[class*=labelFrame] img'); return Boolean(i && i.naturalWidth >= 800); }, null, { timeout: 15000 });
    const details = p.locator('details');
    if (!(await details.evaluate((el) => el.open))) await p.locator('details summary').click();
    const nums = p.locator('details input[type=number]');
    for (const [label, l, t, r, b] of SIX) {
      await p.locator('main input[type=text]').fill(label);
      await nums.nth(0).fill(String(l)); await nums.nth(1).fill(String(t)); await nums.nth(2).fill(String(r)); await nums.nth(3).fill(String(b));
      await p.getByRole('button', { name: 'SAVE BOX' }).click(); await sleep(120);
    }
    // The same box again, nothing moved.
    await nums.nth(0).fill('84'); await nums.nth(1).fill('17'); await nums.nth(2).fill('88'); await nums.nth(3).fill('26');
    await p.getByRole('button', { name: 'SAVE BOX' }).click(); await sleep(150);
    await p.locator('details summary').click();
    const rows = p.locator('[class*=boxRow], [class*=boxOn]');
    ok(await rows.count() === 6, `${tag}: six boxes saved, and a second SAVE BOX with nothing moved added none (${await rows.count()} rows)`);
    const rowText = (await rows.allInnerTexts()).map((t) => t.split('\n')[0]);
    ok(rowText[5] === 'Box 6 · traffic light · labeled' && rowText[0] === 'Box 1 · person · labeled', `${tag}: each row names its box (${rowText[0]} … ${rowText[5]})`);
    const tags = await p.locator('[class*=markOld]').allInnerTexts();
    ok(tags.length === 6 && tags[2] === '3 bicycle', `${tag}: each outline carries its number and name (${tags.join(' | ')})`);
    const film = await p.locator('[class*=film]').first().evaluate((el) => el.getBoundingClientRect().height);
    ok(film >= 40, `${tag}: the film strip keeps its height (${Math.round(film)} px)`);
    // The picture scrolled to the top of the pane: the whole picture and SAVE BOX are in one view (Athena, Pangu).
    const oneView = await p.evaluate(() => {
      const pane = document.querySelector('[class*=labelFill]');
      const fit = document.querySelector('[class*=labelFit]');
      const img = document.querySelector('[class*=labelFrame] img');
      const dock = document.querySelector('[class*=labelDock]');
      if (!pane || !fit || !img || !dock) return null;
      pane.scrollTop = fit.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
      const pr = pane.getBoundingClientRect(), ir = img.getBoundingClientRect(), dr = dock.getBoundingClientRect();
      return { top: Math.round(ir.top - pr.top), gap: Math.round(dr.top - ir.bottom), img: Math.round(ir.height) };
    });
    await sleep(100);
    const saveOne = await touchable(p.getByRole('button', { name: 'SAVE BOX' }));
    ok(oneView && oneView.top >= 0 && oneView.gap >= 0 && saveOne.onScreen && saveOne.hits, `${tag}: the whole picture and SAVE BOX are in one view (picture ${oneView && oneView.img} px, ${oneView && oneView.gap} px above the buttons)`);
    await p.evaluate(() => document.querySelector('[class*=labelFill]')?.scrollTo(0, 0)); await sleep(100);
    const save = await touchable(p.getByRole('button', { name: 'SAVE BOX' }));
    ok(save.onScreen && save.hits, `${tag}: SAVE BOX is on the screen and touchable (top ${save.top}, bottom ${save.bottom} of ${save.h})`);
    // A user's scroll (the wheel, as a person does it) moves the pane down to the last row.
    const pane = p.locator('[class*=labelFill]');
    const pb = await pane.boundingBox();
    await p.mouse.move(pb.x + pb.width / 2, pb.y + Math.min(pb.height - 20, 120));
    const before = await pane.evaluate((el) => el.scrollTop);
    for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 250); await sleep(60); }
    const after = await pane.evaluate((el) => el.scrollTop);
    ok(after > before, `${tag}: a user's scroll moves the labeler (${before} → ${after})`);
    const fix = await touchable(rows.last().getByRole('button', { name: 'Fix' }));
    ok(fix.onScreen && fix.hits, `${tag}: after scrolling, the last row's Fix is on the screen and touchable (top ${fix.top} of ${fix.h})`);
    // And back up: the rows sit under the buttons, so a scroll back brings SAVE BOX into reach again.
    for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, -250); await sleep(60); }
    const saveAfter = await touchable(p.getByRole('button', { name: 'SAVE BOX' }));
    ok(saveAfter.onScreen && saveAfter.hits, `${tag}: a scroll back up brings SAVE BOX into reach (top ${saveAfter.top} of ${saveAfter.h})`);
    await ctx.close();
  }
} catch (e) {
  fail++; console.log('FAIL: the smoke could not run —', e && e.message ? e.message.split('\n')[0] : e);
} finally {
  if (browser) await browser.close();
  srv.close();
}
ok(errors.length === 0, `no page error (${errors.slice(0, 2).join(' | ')})`);
console.log(`sf-layout-smoke: ${fail ? `${pass} passed, ${fail} failed` : `${pass} passed`}`);
process.exit(fail ? 1 : 0);
