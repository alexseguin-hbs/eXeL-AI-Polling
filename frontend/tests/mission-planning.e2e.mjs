// Mission-Planning self-test harness — 3 outcome-metric tests (Thought Master standing gate).
// Run: cd frontend && npm run dev (bg) ; npm run e2e:map
// WIP: selectors still need main-vs-mini map scoping + the 2D grid zoom-out gate — finish before
// treating a green run as authoritative. Default target route: /main/Security-2525.
import { chromium } from 'playwright';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:3000/main/Security-2525/';
const shot = (pg, n) => pg.screenshot({ path: `tests/__shots__/${n}.png` }).catch(()=>{});
const sleep = (pg, ms) => pg.waitForTimeout(ms);
const READOUT_RE = /(\d+)\s*([C-X])\s*·\s*([\d,]+)\s*×\s*([\d,]+)\s*km/;

const readReadout = (pg) => pg.evaluate(() => {
  const els = [...document.querySelectorAll('span,div')];
  for (const e of els) {
    const t = (e.innerText||'').replace(/\s+/g,' ').trim();
    if (/^\d+[C-X]\s*·\s*[\d,]+\s*×\s*[\d,]+\s*km$/.test(t)) {
      const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return { text: t, left: Math.round(r.left), bottom: Math.round(window.innerHeight - r.bottom), fs: cs.fontSize };
    }
  }
  return null;
});
const countViolet = (pg) => pg.evaluate(() => [...document.querySelectorAll('span')]
  .filter(e => /^[C-X]$/.test((e.textContent||'').trim()) && getComputedStyle(e).color === 'rgb(181, 123, 255)').length);
const countZoneNums = (pg) => pg.evaluate(() => [...document.querySelectorAll('svg text')]
  .filter(t => /^\d{1,2}$/.test((t.textContent||'').trim())).length);

const clickSel = async (pg, sel) => {
  const loc = pg.locator(sel); const n = await loc.count();
  for (let i=0;i<n;i++){ const el = loc.nth(i); if (!(await el.isVisible().catch(()=>false))) continue;
    try { await el.click({ timeout: 3000 }); return true; } catch {}
    try { await el.click({ force: true, timeout: 2000 }); return true; } catch {} }
  throw new Error('no clickable match: '+sel);
};

const b = await chromium.launch({ headless: true, executablePath: EXE });
const pg = await b.newPage({ viewport: { width: 430, height: 900 } });
const errs = [];
pg.on('console', m => { if (m.type()==='error' && !/404|did not match|hydrat/i.test(m.text())) errs.push(m.text().slice(0,140)); });
pg.on('pageerror', e => errs.push('PAGEERR: '+e.message.slice(0,140)));

const M = { tests: {}, consoleErrors: [] };
try {
  await pg.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(pg, 2500);
  await clickSel(pg, 'button:has-text("EARTH"):visible');  // main map → WorldStrip EARTH world view
  await sleep(pg, 1200);
  await clickSel(pg, 'button:has-text("GRID"):visible');   // turn the GZD grid overlay ON
  await sleep(pg, 1200);
  await shot(pg, '0-earth-grid');

  // TEST 1 — GRID renders in 2D
  await clickSel(pg, 'button:text-is("2D"):visible'); await sleep(pg, 1400);
  const t1 = { zoneNums: await countZoneNums(pg), violet: await countViolet(pg), readout: await readReadout(pg) };
  t1.pass = t1.zoneNums > 0 && t1.violet > 0 && !!t1.readout && READOUT_RE.test(t1.readout.text);
  M.tests.grid2D = t1; await shot(pg, '1-grid-2d');

  // TEST 2 — 2D↔3D readout parity
  const r2d = await readReadout(pg);
  await clickSel(pg, 'button:text-is("3D"):visible'); await sleep(pg, 1600);
  const r3d = await readReadout(pg);
  const t2 = { r2d, r3d,
    parity: !!r2d && !!r3d && READOUT_RE.test(r2d.text) && READOUT_RE.test(r3d.text)
            && r2d.fs === r3d.fs && Math.abs(r2d.left - r3d.left) <= 4 && Math.abs(r2d.bottom - r3d.bottom) <= 4 };
  t2.pass = t2.parity; M.tests.readoutParity = t2; await shot(pg, '2-readout-3d');

  // TEST 3 — 3D orbit, no glitch
  const before = await readReadout(pg);
  const globes = await pg.$$('svg[aria-label^="Wireframe globe"]');
  let box=null; for (const g of globes){ const bb=await g.boundingBox(); if (bb && (!box || bb.width*bb.height>box.width*box.height)) box=bb; }
  const errsBefore = errs.length;
  const cx = box.x + box.width/2, cy = box.y + box.height/2;
  await pg.mouse.move(cx, cy); await pg.mouse.down();
  for (let i=1;i<=8;i++){ await pg.mouse.move(cx - i*10, cy + i*6); await sleep(pg, 30); }
  await pg.mouse.up(); await sleep(pg, 300);
  await pg.mouse.move(cx, cy); await pg.mouse.down();
  for (let i=1;i<=6;i++){ await pg.mouse.move(cx + i*12, cy - i*4); await sleep(pg, 30); }
  await pg.mouse.up(); await sleep(pg, 500);
  const after = await readReadout(pg);
  const t3 = { before: before?.text, after: after?.text,
    errorsDuring: errs.length - errsBefore, readoutPersists: !!after,
    viewChanged: !!before && !!after && before.text !== after.text };
  t3.pass = t3.errorsDuring === 0 && t3.readoutPersists && t3.viewChanged; M.tests.orbit3D = t3; await shot(pg, '3-orbit-3d');
} catch (e) { M.fatal = String(e).slice(0, 200); }
M.consoleErrors = errs.slice(0, 8);
M.allPass = Object.values(M.tests).every(t => t.pass);
console.log('METRICS ' + JSON.stringify(M, null, 1));
await b.close();
process.exit(M.allPass ? 0 : 1);
