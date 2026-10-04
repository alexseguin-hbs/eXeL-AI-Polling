// Every lane, every mode: runs the served deck (public/drone-2525/play.html) headless and drives each of the 42 lanes
// through QUAL · 40 (Table VI: 18 engagements, 1–4 targets up together, 40 targets) and both training modes, with an
// aimed, approved shot at a near (50 m) and a far (300 m) silhouette on every lane. Operator 2026-10-04: "test they work for all lanes".
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
const PUB = new URL('../public', import.meta.url).pathname;
const srv = createServer(async (req, res) => { if (req.url.startsWith('/favicon')) { res.writeHead(204); return res.end(); } try { const b = await readFile(join(PUB, decodeURIComponent(req.url.split('?')[0]))); res.writeHead(200, { 'content-type': 'text/html' }); res.end(b); } catch { res.writeHead(404); res.end(); } }).listen(0);
const { chromium } = await import('playwright');
const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome'].find((p) => existsSync(p));
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
await page.goto(`http://127.0.0.1:${srv.address().port}/drone-2525/play.html`, { waitUntil: 'load' });
await page.waitForFunction(() => typeof state !== 'undefined' && state.qa && state.qa.total > 100, null, { timeout: 60000 });
// Open a round the way a player does: press the real PRACTICE button (the deck refuses to mark, approve or fire before it).
await page.evaluate(() => { const b = document.getElementById('btnPractice'); if (b) b.click(); });
const opened = await page.evaluate(() => roundOpen());
console.log('PRACTICE pressed · round open:', opened);
const out = await page.evaluate(() => {
  const res = [];
  const unitNow = () => units[state.unit] || units.T1;
  function shoot(q) { const u = unitNow(); aimUnitAt(u, q, -40, 40); state.tgtSlot = {}; state.desig = null; state.hiApproved = false;
    designate({ id: q.id, kind: 'pop', ref: q }, 'QA'); approveDesig('HI-2'); const red = !!(state.desig && state.desig.phase === 'red');
    if (state.mag && state.mag.rounds <= 0) magLoad('RESET'); fireN(1); return { red, hit: q.lifePct <= 0 || !!(state.lastShot && state.lastShot.dead) }; }
  for (let L = 0; L < 42; L++) {
    const r = { lane: L + 1, issues: [] }; if (!roundOpen()) r.issues.push('round not open');
    state.lane = L; state.rangeMode = 'qual40'; goRange(); state.lane = L; state.qualDone = false;
    if (typeof qualResetTower === 'function') qualResetTower(); rangeReset(); rangeRunReset(L);
    const mine = PLATES.filter((q) => q.lane === L);
    if (mine.length !== 11) r.issues.push('plates ' + mine.length);
    if (mine.some((q) => q.up)) r.issues.push('qual starts with a plate up');
    // QUAL: step the tower and record each engagement's standing set
    const engs = []; let guard = 0, last = -1;
    while (!state.qualDone && guard++ < 20000) {
      rangeTick(0.05);
      const R = rangeRun(L);
      if (R.phase === 'up' && R.eng && R.eng.n !== last) {
        last = R.eng.n;
        const up = PLATES.filter((q) => q.up).map((q) => q.id);
        const foreign = up.filter((id) => !id.endsWith('-' + LANES[L].id));
        engs.push({ n: R.eng.n, want: R.eng.bases.length, got: up.filter((id) => id.endsWith('-' + LANES[L].id)).length, foreign: foreign.length, sec: R.eng.sec, ids: up });
      }
      if (rangeRun(L).k >= 18 && rangeRun(L).phase !== 'up') break;
    }
    r.engagements = engs.length;
    r.targets = engs.reduce((a, e) => a + e.got, 0);
    r.sizes = engs.map((e) => e.got).join('');
    engs.forEach((e) => { if (e.got !== e.want) r.issues.push(`eng ${e.n}: ${e.got}/${e.want} up`); if (e.foreign) r.issues.push(`eng ${e.n}: ${e.foreign} plate(s) from another lane up`);
      const want = { 1: 5, 2: 8, 3: 12, 4: 16 }[e.want]; if (e.sec !== want) r.issues.push(`eng ${e.n}: ${e.sec}s not ${want}s`); });
    if (engs.length !== 18) r.issues.push('engagements ' + engs.length);
    if (r.targets !== 40) r.issues.push('targets ' + r.targets);
    if (!engs[0] || engs[0].ids.length !== 1 || !engs[0].ids[0].startsWith('C-50-')) r.issues.push('first is not the 50 R alone');
    // TRAINING · RESET: all up; an aimed hit at 50 m and 300 m drops it; it comes back after 3 s
    state.rangeMode = 'bounce'; goRange(); state.lane = L; rangeReset();
    const tr = PLATES.filter((q) => q.lane === L);
    if (tr.filter((q) => q.up).length !== 11) r.issues.push('RESET: ' + tr.filter((q) => q.up).length + '/11 up');
    for (const base of ['C-50', 'C-300']) {
      const q = plateOf(L, base); const s = shoot(q);
      if (!s.red) r.issues.push(`RESET ${base}: approve did not give a red box`);
      if (!s.hit) r.issues.push(`RESET ${base}: aimed shot did not hit`);
      for (let i = 0; i < 40; i++) rangeTick(0.05); // 2 s: fallen
      const down = !q.up; for (let i = 0; i < 60; i++) rangeTick(0.05); // +3 s: back
      if (!down) r.issues.push(`RESET ${base}: did not go down`); if (!q.up) r.issues.push(`RESET ${base}: did not come back`);
    }
    // TRAINING · DOWN: a hit stays down
    state.rangeMode = 'stay'; goRange(); state.lane = L; rangeReset();
    { const q = plateOf(L, 'C-150L') || plateOf(L, 'C-150R'); const s = shoot(q); for (let i = 0; i < 200; i++) rangeTick(0.05);
      if (!s.hit) r.issues.push('DOWN: aimed shot did not hit'); if (q.up) r.issues.push('DOWN: hit target came back'); }
    res.push(r);
  }
  return res;
});
let bad = 0;
for (const r of out) { if (r.issues.length) { bad++; console.log(`LANE ${String(r.lane).padStart(2)} FAIL ·`, r.issues.slice(0, 6).join(' | ')); } }
const sizes = [...new Set(out.map((r) => r.sizes))];
console.log(`\n42 lanes · QUAL engagements per lane: ${[...new Set(out.map((r) => r.engagements))].join(',')} · targets per lane: ${[...new Set(out.map((r) => r.targets))].join(',')} · size pattern: ${sizes.join(' / ')}`);
console.log(`page errors: ${errs.length}${errs.length ? ' — ' + errs[0] : ''}`);
console.log(`drone-range-all-lanes: ${42 - bad} lanes passed, ${bad} failed`);
await browser.close(); srv.close(); process.exit(bad || errs.length ? 1 : 0);
