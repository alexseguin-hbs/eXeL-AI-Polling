// Mission-Planning SPIRAL gate — forward + backward, human-style. Asserts the last-24h regression
// corpus so those bugs can never silently return. Run: cd frontend && npm run dev ; npm run e2e:spiral
import { chromium } from 'playwright';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:3000/main/Security-2525/';
// Known-benign, pre-existing warnings (float-precision style hydration on a positioned grid element).
// Applies to BOTH console errors and pageerrors — dev-only hydration text/prop mismatches on the
// grid readout (`left:` px precision) are not app defects and must not fail the gate.
const ALLOW = /404|does not match|did not match|hydrat|server-rendered|Prop .* did not match/i;
const GZD_RE = /^\d+[C-X]\s*·\s*[\d,]+\s*×\s*[\d,]+\s*km$/;

const results = [];
const rec = (name, pass, detail = '') => { results.push({ name, pass, detail }); };

const b = await chromium.launch({ headless: true, executablePath: EXE });

// helpers bound per page
const mk = async (seedFmt, vp) => {
  const pg = await b.newPage({ viewport: vp ?? { width: 1000, height: 820 } });
  const errs = [];
  pg.on('pageerror', e => { if (!ALLOW.test(e.message)) errs.push('PE:' + e.message.slice(0, 90)); });
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

// ── CORPUS #14: DROP a new asset (2D) → HEADING+ALTITUDE entry packet auto-opens with SAVE ──
// Guards the "lost AGL entry on desktop" regression — altitude/heading must be settable on the
// map itself, independent of the right rail, for both mouse and touch (both converge at place()).
{
  const { pg, errs, clk } = await mk(null);
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(500);
  // palette item is a draggable <div class="cursor-grab"> (not a button)
  const armed = await clk('div.cursor-grab:has-text("AVENGER")'); await pg.waitForTimeout(400);
  // tap empty map centre (mouse down+up, no movement = place)
  await pg.mouse.click(560, 470); await pg.waitForTimeout(600);
  const panel = await pg.evaluate(() => {
    const hasSet = [...document.querySelectorAll('span')].some(e => /·\s*SET$/.test((e.textContent || '').trim()));
    const hasHdg = [...document.querySelectorAll('div')].some(e => /HEADING\s*0.?360/i.test((e.textContent || '')));
    const hasSave = [...document.querySelectorAll('button')].some(e => /save/i.test((e.textContent || '')));
    return { hasSet, hasHdg, hasSave };
  });
  rec('#14 drop → HEADING+ALT entry packet', armed && panel.hasSet && panel.hasHdg && panel.hasSave, `armed=${armed} set=${panel.hasSet} hdg=${panel.hasHdg} save=${panel.hasSave}`);
  rec('#14 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #15: Fix A — aspect-aware AUTO voxel size (landscape cell < portrait cell) ──
// Same AO/span at two viewports; the standalone 3×3 lattice's on-screen cell (data-cellpx) must be
// SMALLER in landscape than portrait (frames at the phone 9:16 proportion). Guards the "landscape
// voxel too big / column top clipped" regression.
const cellPxAt = async (w, h) => {
  const { pg, errs, clk } = await mk(null, { width: w, height: h });
  // The ▦ VOXEL lattice is ON by default — just enter 3D and it renders (do NOT click VOXEL: that hides it).
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(700);
  // Zoom IN so the AUTO cell rises above the 16px floor — the aspect factor is only observable when
  // the cell is unclamped (the operator's actual working view is zoomed in, not the default overview).
  await pg.mouse.move(Math.round(w / 2), Math.round(h / 2));
  for (let i = 0; i < 10; i++) { await pg.mouse.wheel(0, -320); await pg.waitForTimeout(70); }
  await pg.waitForTimeout(500);
  // Two lattices can exist (main map + mini-map). The mini floors to the 16px minimum, so take the
  // MAX cellpx = the MAIN map's cell (the one that must shrink in landscape).
  const cp = await pg.evaluate(() => { const els = [...document.querySelectorAll('[data-voxel-lattice]')]; if (!els.length) return null; return Math.max(...els.map(e => parseInt(e.getAttribute('data-cellpx') || '0', 10))); });
  await pg.close();
  return { cp, errs: errs.length };
};
{
  // Both ≥1000px wide so the map command bar (EARTH/2D/3D/VOXEL) is reliably clickable; the aspect
  // factor is width-independent, so tall-portrait vs wide-landscape isolates the aspect behaviour.
  const port = await cellPxAt(1000, 1400);   // portrait (aspect ~0.71)
  const land = await cellPxAt(1400, 500);    // landscape (aspect ~2.80)
  rec('#15 voxel aspect-aware (land < port)', !!port.cp && !!land.cp && land.cp < port.cp, `port=${port.cp} land=${land.cp}`);
  rec('#15 console clean', port.errs === 0 && land.errs === 0, `p=${port.errs} l=${land.errs}`);
}

// ── CORPUS #16: Fix B — maximize the PLANNING map hides the TABS row, keeps the eXeL-AI top line ──
{
  const { pg, errs, clk } = await mk(null);
  const tabsBefore = await pg.locator('button:has-text("SENSORS")').count();
  await clk('button[title="Maximize"]'); await pg.waitForTimeout(700);
  const st = await pg.evaluate(() => ({
    sensors: [...document.querySelectorAll('button')].filter(e => /SENSORS/.test(e.textContent || '')).some(e => e.offsetParent !== null),
    exel: /eXeL/.test(document.body.innerText),
  }));
  rec('#16 maximize hides tabs, keeps top line', tabsBefore > 0 && !st.sensors && st.exel, `before=${tabsBefore} sensorsAfter=${st.sensors} exel=${st.exel}`);
  rec('#16 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #17: country names on 2D match the 3D globe (declutter parity) ──
// 2D flat used a coarser span metric than the globe, so gated countries were filtered out on 2D.
// At the same AO the 2D country-label count must now be within 1 of the 3D count (and non-trivial).
{
  const NAMES = ['UNITED STATES','CANADA','MEXICO','GREENLAND','GUATEMALA','HONDURAS','CUBA','NICARAGUA','PANAMA','COLOMBIA','VENEZUELA','BRAZIL','ARGENTINA','PERU','FRANCE','SPAIN','GERMANY','ALGERIA','THAILAND','VIETNAM','JAPAN','INDONESIA','AUSTRALIA'];
  const { pg, clk } = await mk(null);
  const cnt = () => pg.evaluate((names) => { const t = new Set([...document.querySelectorAll('text')].map(e => (e.textContent || '').trim())); return names.filter(k => t.has(k)).length; }, NAMES);
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(800);
  const c2 = await cnt();
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(1000);
  const c3 = await cnt();
  rec('#17 country names 2D≈3D parity', c2 >= 3 && Math.abs(c2 - c3) <= 1, `2D=${c2} 3D=${c3}`);
  await pg.close();
}

// ── CORPUS #18: flat EARTH map wheel-zoom works + clicking the GZD label frames the cell ──
// Guards the useWheel regression (listener never bound to the conditionally-mounted flat SVG) and
// the click-to-frame feature (30N/48N label → zoom to that grid cell).
{
  const { pg, errs, clk } = await mk(null);
  await clk('button:has-text("EARTH"):visible'); await pg.waitForTimeout(700);
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(600);
  await clk('button:has-text("GRID"):visible'); await pg.waitForTimeout(500);
  const vbw = () => pg.evaluate(() => { const s = document.querySelector('svg[aria-label^="World context map"]'); return s ? parseFloat(s.getAttribute('viewBox').split(/\s+/)[2]) : null; });
  const box = await pg.locator('svg[aria-label^="World context map"]').boundingBox();
  const w0 = await vbw();
  if (box) { await pg.mouse.move(box.x + box.width / 2, box.y + box.height / 2); for (let i = 0; i < 4; i++) { await pg.mouse.wheel(0, -300); await pg.waitForTimeout(90); } }
  const w1 = await vbw();
  // R9 whole-cell TAP: a real mouse click at the map centre hits the cell tap-rect → drills to the cell.
  if (box) { await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await pg.waitForTimeout(500); }
  const w2 = await vbw();
  rec('#18 flat wheel-zoom works', !!w0 && !!w1 && w1 < w0, `w0=${w0 && w0.toFixed(0)} w1=${w1 && w1.toFixed(0)}`);
  // FX-43: whole-cell tap now SMOOTH-SCROLLS into the tactical AO (never a flat frame) → the flat
  // "World context map" svg unmounts, so vbw() goes null. That IS the drill (was: w2 < w1 flat frame).
  rec('#18 whole-cell tap → tactical AO (not flat)', !!w1 && w2 === null, `w1=${w1 && w1.toFixed(0)} w2=${w2}`);
  rec('#18 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #19: aerial corner markers GOLD (new/unapproved) → GREY (approved via SAVE) ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(400);
  await clk('div.cursor-grab:has-text("AVENGER")'); await pg.waitForTimeout(300);
  const box = await pg.locator('div.touch-none.overflow-hidden.rounded-md').first().boundingBox();
  if (box) { await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); } await pg.waitForTimeout(500);
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(900);
  const corners = () => pg.evaluate(() => [...document.querySelectorAll('button[title]')].filter(b => /^(NW|NE|SE|SW) ·/.test(b.getAttribute('title') || '')).map(b => getComputedStyle(b).borderTopColor));
  const before = await corners();
  const saved = await clk('button:has-text("Save")'); await pg.waitForTimeout(600);
  const after = await corners();
  const gold = before.length > 0 && before.every(c => c === 'rgb(255, 212, 0)');
  const grey = after.length > 0 && after.every(c => c === 'rgb(156, 163, 175)');
  rec('#19 corner GOLD(new)→GREY(approved)', gold && saved && grey, `before=${before[0]} saved=${saved} after=${after[0]}`);
  rec('#19 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #20: PLAY TEST runs the FULL scripted replay (Camp Blanding + asset placement). NOTE: the
// scripted replay now lives under PLAY TEST; SPEED TEST runs the Edge-2525 cap sweep (see #22). ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('button[title^="Settings"]'); await pg.waitForTimeout(400);
  const started = await clk('button:has-text("PLAY TEST")');
  let secs = [];
  for (let i = 0; i < 40; i++) {
    await pg.waitForTimeout(1000);
    secs = await pg.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.children.length === 0).map(e => (e.textContent || '').trim()).filter(t => /^(Switch to Camp Blanding|Place AVENGER|Add \+ remove SENTINEL|Pan to Capitol|Place AUTO-FOIL|Mirror mini-map)/.test(t)));
    if ([...new Set(secs)].length >= 6) break;
  }
  const uniq = [...new Set(secs)];
  rec('#20 PLAY TEST replay = full mission (assets+Camp Blanding)', started && uniq.length >= 6, `sections=${uniq.length} started=${started}`);
  rec('#20 replay console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #21: MIL-STD-2525 — friendly aerial aircraft (top) cube is BLUE (cyan), not red ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(400);
  await clk('div.cursor-grab:has-text("AVENGER")'); await pg.waitForTimeout(300);
  const box = await pg.locator('div.touch-none.overflow-hidden.rounded-md').first().boundingBox();
  if (box) { await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); } await pg.waitForTimeout(500);
  await pg.locator('input[placeholder="0"]').first().fill('12000'); await clk('button:has-text("Save")'); await pg.waitForTimeout(300);
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(900);
  const topColor = await pg.evaluate(() => { const el = document.querySelector('[data-voxtop]'); return el ? getComputedStyle(el).borderTopColor : null; });
  // friendly (default aff) top cube must be cyan rgb(25, 200, 207), NOT red
  rec('#21 friendly aerial top cube = BLUE (cyan)', topColor === 'rgb(25, 200, 207)', `topColor=${topColor}`);
  rec('#21 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #22: SPEED TEST cap sweep (Edge-2525 calibration) — per-cap fps rows + FPS/TIME chart, cap restored ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('button[title^="Settings"]'); await pg.waitForTimeout(400);
  const capBefore = await pg.evaluate(() => Number(localStorage.getItem('sec2525.fpsCap') || '0'));
  const started = await clk('button:has-text("SPEED TEST")');
  // poll for the cap rows to render (sweep runs a few globe-orbit seconds then streams rows)
  let rows = 0;
  for (let i = 0; i < 40; i++) {
    await pg.waitForTimeout(1000);
    rows = await pg.evaluate(() => [...document.querySelectorAll('*')].filter(e => e.children.length === 0).map(e => (e.textContent || '').trim()).filter(t => /^(MAX \(uncapped\)|Cap \d+ fps)$/.test(t)).length);
    if (rows >= 5) break;
  }
  rec('#22 SPEED TEST cap sweep = per-cap rows (3·6·9·33·MAX)', started && rows >= 5, `rows=${rows} started=${started}`);
  // chart toggle → FPS/TIME svg with a polyline
  const toggled = await clk('button:has-text("SHOW CHART")'); await pg.waitForTimeout(400);
  const chart = await pg.evaluate(() => { const s = document.querySelector('svg[aria-label="FPS over time"]'); return !!(s && s.querySelector('polyline')); });
  rec('#22 chart toggle = FPS(Y)/TIME(X) with series', toggled && chart, `toggled=${toggled} chart=${chart}`);
  // BACKWARD: the user's cap must be RESTORED after the sweep (never left throttled)
  const capAfter = await pg.evaluate(() => Number(localStorage.getItem('sec2525.fpsCap') || '0'));
  rec('#22 user FPS cap restored after sweep', capAfter === capBefore, `before=${capBefore} after=${capAfter}`);
  rec('#22 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #23: voxel CENTER tap pops the coord call-up for AERIAL (FX-48) and never freezes (FX-45) ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('div.cursor-grab:has-text("AVENGER")'); await pg.waitForTimeout(250);
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(300);
  const box = await pg.locator('div.touch-none.overflow-hidden.rounded-md').first().boundingBox();
  if (box) await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await pg.waitForTimeout(400);
  try { await pg.locator('input[placeholder="0"]').first().fill('12000'); } catch {}
  await clk('button:has-text("Save")'); await pg.waitForTimeout(300);
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(900);
  const tgt = pg.locator('button[title="TARGET — cube centre coordinate"]');
  const has = await tgt.count();
  if (has) await tgt.first().dispatchEvent('pointerup'); await pg.waitForTimeout(400);
  const callUp = () => pg.evaluate(() => [...document.querySelectorAll('span')].some(e => /COORDINATE/.test(e.textContent || '')));
  const aerialCoord = await callUp();
  // no-freeze proof: close, reopen — app still responds
  await clk('button:has-text("✕")'); await pg.waitForTimeout(250);
  if (has) await tgt.first().dispatchEvent('pointerup'); await pg.waitForTimeout(300);
  const reopened = await callUp();
  rec('#23 aerial CENTER tap → coord call-up + no freeze', has > 0 && aerialCoord && reopened, `target=${has} coord=${aerialCoord} reopened=${reopened}`);
  rec('#23 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #24: aerial tower = thin SOLID corner posts (FX-53), width == voxel edge (1px), not stacked cubes ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('div.cursor-grab:has-text("AUTO-FOIL")'); await pg.waitForTimeout(250);
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(300);
  const box = await pg.locator('div.touch-none.overflow-hidden.rounded-md').first().boundingBox();
  if (box) await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await pg.waitForTimeout(400);
  try { await pg.locator('input[placeholder="0"]').first().fill('9000'); } catch {}
  await clk('button:has-text("Save")'); await pg.waitForTimeout(300);
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(900);
  const posts = await pg.evaluate(() => { const e = [...document.querySelectorAll('[data-aedge]')]; return { n: e.length, w: e[0] ? getComputedStyle(e[0]).width : null }; });
  // exactly 4 posts per aerial column, each 1px wide (== edgeFineW, matches the voxel edge)
  rec('#24 aerial tower = 4 thin 1px corner posts (FX-53)', posts.n === 4 && posts.w === '1px', `posts=${posts.n} w=${posts.w}`);
  rec('#24 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #25: off-view aerial base = chevron + name only, NO base box/coord (FX-39) ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('div.cursor-grab:has-text("AUTO-FOIL")'); await pg.waitForTimeout(250);
  await clk('button:text-is("2D"):visible'); await pg.waitForTimeout(300);
  const M = pg.locator('div.touch-none.overflow-hidden.rounded-md').first();
  let box = await M.boundingBox();
  if (box) await pg.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await pg.waitForTimeout(400);
  try { await pg.locator('input[placeholder="0"]').first().fill('12000'); } catch {}
  await clk('button:has-text("Save")'); await pg.waitForTimeout(300);
  // pan the base OFF-view (drag content up) so the off-aerial edge marker appears
  box = await M.boundingBox();
  for (let p = 0; p < 3; p++) { await pg.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8); await pg.mouse.down(); await pg.mouse.move(box.x + box.width / 2, box.y + box.height * 0.1, { steps: 10 }); await pg.mouse.up(); await pg.waitForTimeout(250); }
  await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => { const e = document.querySelector('[data-offaerial]'); return { on: !!e, chevron: e ? /➤/.test(e.textContent || '') : false, name: e ? /AUTO-FOIL/.test(e.textContent || '') : false }; });
  rec('#25 off-view aerial = chevron + name (no base box)', r.on && r.chevron && r.name, `on=${r.on} chevron=${r.chevron} name=${r.name}`);
  rec('#25 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #26: 📱 tilt toggle sits UPPER-RIGHT of the map and opens the tilt slider (FX-54) ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(800);
  const M = pg.locator('div.touch-none.overflow-hidden.rounded-md').first();
  const mb = await M.boundingBox();
  const pb = await pg.locator('[data-tiltphone]').first().boundingBox();
  const upperRight = !!(pb && mb && (pb.x + pb.width - mb.x) / mb.width > 0.9 && (pb.y - mb.y) / mb.height < 0.1);
  await pg.locator('[data-tiltphone]').first().dispatchEvent('click'); await pg.waitForTimeout(300);
  const sliderOpen = (await pg.locator('input[type=range]').count()) > 0;
  rec('#26 phone tilt toggle upper-right + opens slider (FX-54)', upperRight && sliderOpen, `upperRight=${upperRight} slider=${sliderOpen}`);
  rec('#26 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #27: top bar single-line — fixed title L, fixed LINK R, no CLEARANCE/PRELIMINARY overlap @375 (FX-52) ──
{
  const { pg, errs } = await mk(null, { width: 390, height: 844 });
  const r = await pg.evaluate(() => {
    const spans = [...document.querySelectorAll('span')];
    const bb = (el) => el ? el.getBoundingClientRect() : null;
    const e = bb(spans.find(s => /^eXeL AI$/.test((s.textContent || '').trim())));
    const l = bb(spans.find(s => /LINK: SECURE/.test(s.textContent || '')));
    const c = bb(spans.find(s => /CLEARANCE/.test(s.textContent || '')));
    const p = bb(spans.find(s => /PRELIMINARY/.test(s.textContent || '')));
    const overlap = (a, b) => !!(a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom);
    return { titleLeft: e ? e.left < 90 : false, linkRight: l ? l.right > 250 : false, noOverlap: !overlap(c, p) };
  });
  rec('#27 top bar single line: fixed title L + LINK R, no bunching @375 (FX-52)', r.titleLeft && r.linkRight && r.noOverlap, `titleL=${r.titleLeft} linkR=${r.linkRight} noOverlap=${r.noOverlap}`);
  rec('#27 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #28: SPEED TEST chart reflects the SELECTED limiter — cap 3 → title/attr + cap restored (FX-34) ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('button[title^="Settings"]'); await pg.waitForTimeout(400);
  await clk('button:text-is("3")'); await pg.waitForTimeout(200);       // select cap 3
  await clk('button:has-text("SPEED TEST")');
  let ok = false;
  for (let i = 0; i < 30; i++) { await pg.waitForTimeout(1000); ok = await pg.evaluate(() => [...document.querySelectorAll('*')].some(e => e.children.length === 0 && /^Cap 3 fps$/.test((e.textContent || '').trim()))); if (ok) break; }
  await clk('button:has-text("SHOW CHART")'); await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => { const s = document.querySelector('svg[aria-label="FPS over time"]'); return { attr: s ? s.getAttribute('data-sweepcap') : null, cap: Number(localStorage.getItem('sec2525.fpsCap') || '0') }; });
  rec('#28 chart reflects selected cap 3 + cap restored (FX-34)', ok && r.attr === '3' && r.cap === 3, `rows3=${ok} attr=${r.attr} cap=${r.cap}`);
  rec('#28 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #29: grid label drill from EARTH → smooth into a tactical AO, NEVER the flat map (FX-43) ──
{
  const { pg, errs, clk } = await mk(null);
  const AO_RE = /CAMP BLANDING|TEXAS CAPITOL|FORT WORTH|MABRY|JBLM|JACKSONVILLE|CAPITOL|DALLAS|HOUSTON|AUSTIN|SAN ANTONIO/i;
  const mapEarth = () => pg.evaluate(() => [...document.querySelectorAll('*')].some(e => e.children.length === 0 && /^MAP · EARTH$/.test((e.textContent || '').trim())));
  await clk('button:has-text("EARTH"):visible'); await pg.waitForTimeout(800);
  await clk('button:has-text("GRID"):visible'); await pg.waitForTimeout(700);
  const earthBefore = await mapEarth();
  const label = pg.locator('svg text').filter({ hasText: /^\d{1,2}[C-X]$/ });
  const ln = await label.count(); let clicked = false;
  for (let i = 0; i < ln; i++) { try { await label.nth(i).click({ force: true, timeout: 1500 }); clicked = true; break; } catch {} }
  await pg.waitForTimeout(1800);
  const earthAfter = await mapEarth();
  // entered a tactical AO ⇒ left EARTH ("MAP · EARTH" gone) AND the flat world-context svg is gone
  const flatGone = await pg.evaluate(() => !document.querySelector('svg[aria-label^="World context map"]'));
  const aoBread = await pg.evaluate((re) => [...document.querySelectorAll('*')].some(e => e.children.length === 0 && new RegExp(re, 'i').test((e.textContent || '').trim())), AO_RE.source);
  rec('#29 grid drill → tactical AO (not flat) (FX-43)', earthBefore && clicked && !earthAfter && flatGone && aoBread, `earthBefore=${earthBefore} clicked=${clicked} earthAfter=${earthAfter} flatGone=${flatGone} ao=${aoBread}`);
  rec('#29 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #30: VOXEL·CUBE·BASE packet is draggable (⠿ grip) like the coord call-up (FX-55) ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(900);
  const lattice = await pg.evaluate(() => !!document.querySelector('[data-voxel-lattice]'));
  await pg.evaluate(() => { const lat = document.querySelector('[data-voxel-lattice]'); const c = lat && lat.querySelector('div[title]'); if (c) c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 })); });
  await pg.waitForTimeout(500);
  const present = (await pg.locator('[data-voxelpacket]').count()) > 0;
  const t0 = await pg.evaluate(() => { const e = document.querySelector('[data-voxelpacket]'); return e ? getComputedStyle(e).transform : null; });
  let moved = false;
  if (present) { const grip = pg.locator('[data-voxelpacket] span').filter({ hasText: /VOXEL·CUBE/ }).first(); try { const gb = await grip.boundingBox(); if (gb) { await pg.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2); await pg.mouse.down(); await pg.mouse.move(gb.x - 120, gb.y + 100, { steps: 8 }); await pg.mouse.up(); await pg.waitForTimeout(250); const t1 = await pg.evaluate(() => { const e = document.querySelector('[data-voxelpacket]'); return e ? getComputedStyle(e).transform : null; }); moved = t0 !== t1 && t1 !== 'none' && t1 !== null; } } catch {} }
  rec('#30 voxel base packet draggable (FX-55)', lattice && present && moved, `lattice=${lattice} present=${present} moved=${moved}`);
  rec('#30 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── CORPUS #31: voxel-grid dimensions + altitude honor the UNIT toggle (km↔mi / m↔ft) (FX-56) ──
{
  const { pg, errs, clk } = await mk(null);
  await clk('button:text-is("3D"):visible'); await pg.waitForTimeout(900);
  await pg.evaluate(() => { const lat = document.querySelector('[data-voxel-lattice]'); const c = lat && lat.querySelector('div[title]'); if (c) c.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 7 })); });
  await pg.waitForTimeout(500);
  const rowOf = (lbl) => pg.evaluate((l) => { const p = document.querySelector('[data-voxelpacket]'); if (!p) return null; const s = [...p.querySelectorAll('span')]; const i = s.findIndex(x => (x.textContent || '').trim() === l); return i >= 0 && s[i + 1] ? s[i + 1].textContent.trim() : null; }, lbl);
  const colKm = await rowOf('COLUMN'), terrKm = await rowOf('TERRAIN');
  await pg.evaluate(() => { const p = document.querySelector('[data-voxelpacket]'); const mi = [...p.querySelectorAll('button')].find(b => /^mi$/i.test((b.textContent || '').trim())); if (mi) mi.click(); });
  await pg.waitForTimeout(400);
  const colMi = await rowOf('COLUMN'), terrMi = await rowOf('TERRAIN');
  const dimUnit = /km/.test(colKm || '') && /mi/.test(colMi || '');   // grid dimension follows km→mi
  const altUnit = /m MSL/.test(terrKm || '') && /ft MSL/.test(terrMi || ''); // altitude follows m→ft
  rec('#31 voxel dims + altitude honor unit toggle (FX-56)', dimUnit && altUnit, `colKm=${colKm} colMi=${colMi} terrKm=${terrKm} terrMi=${terrMi}`);
  rec('#31 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

await b.close();
const passed = results.filter(r => r.pass).length, total = results.length;
console.log('SPIRAL ' + passed + '/' + total + ' passed');
results.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  (' + r.detail + ')' : '')));
process.exit(passed === total ? 0 : 1);
