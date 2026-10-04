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
// r.154 · THE QUAL · 40 CLOCK COUNTS REAL SECONDS (operator 2026-10-04: "make sure times for multiple targets on qual40 are accurate").
// Lane 21 (index 20) in a fresh page, driven by the real frame loop: the first 3 s gap and engagement 1 (5 s) are timed with
// performance.now(). Once at the normal frame rate, once with every frame slowed to ~120 ms (an init script busy-waits inside each
// requestAnimationFrame callback) — below 20 fps r.153 stretched the windows (5 s → 16.58 s at ~160 ms frames). Each must land within
// ±0.35 s of the program value.
async function timeQual(slowMs) {
  const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const pe = []; p.on('pageerror', (e) => pe.push(String(e).slice(0, 160)));
  await p.addInitScript((ms) => {
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((t) => { if (ms > 0) { const e = performance.now() + ms; while (performance.now() < e) { /* a slow phone */ } }
      cb(performance.now()); window.__frames = (window.__frames || 0) + 1; if (window.__probe) window.__probe(); });
  }, slowMs);
  await p.goto(`http://127.0.0.1:${srv.address().port}/drone-2525/play.html`, { waitUntil: 'load' });
  await p.waitForFunction(() => typeof state !== 'undefined' && state.qa && state.qa.total > 100, null, { timeout: 120000, polling: 250 });
  // the deck's deferred boot rows (TARGET button at 1.5 s, the AI mark at 1.9 s, the first drawn frame) reset the range when they land — wait them out
  await p.waitForFunction(() => ['TARGET_BUTTON_FOLLOWS_THE_EYE', 'ASM_MARKED_BY_THE_LOOP', 'DRAW_COMPLETES'].every((id) => (state.outcomes || []).some((x) => x.id === id)), null, { timeout: 120000, polling: 250 });
  await p.evaluate(() => { const b = document.getElementById('btnPractice'); if (b) b.click(); });
  const start = await p.evaluate(() => {
    const lp = document.getElementById('lanePick'); lp.value = '20'; lp.dispatchEvent(new Event('change'));
    const rm = document.getElementById('rngMode'); rm.value = 'qual40'; rm.dispatchEvent(new Event('change'));
    const R0 = rangeRun(20); const t0 = performance.now(); window.__marks = [{ t: t0, phase: R0.phase, k: R0.k, f: window.__frames || 0 }];
    window.__probe = () => { const R = rangeRun(state.lane | 0); const m = window.__marks[window.__marks.length - 1]; if (R.phase !== m.phase || R.k !== m.k) window.__marks.push({ t: performance.now(), f: window.__frames || 0, phase: R.phase, k: R.k, n: R.eng && R.eng.n, sec: R.eng && R.eng.sec }); };
    return { lane: state.lane, mode: state.rangeMode, phase: R0.phase, k: R0.k, t: R0.t };
  });
  await p.waitForFunction(() => (window.__marks || []).length >= 3, null, { timeout: 60000, polling: 200 });
  const res = await p.evaluate(() => ({ marks: window.__marks, fps: state.fps || 0, gap: ENG_GAP_S, phaseGap: PHASE_GAP_S, rev: BUILD.revision }));
  await p.close();
  const [m0, m1, m2] = res.marks;
  const gap = (m1.t - m0.t) / 1000, eng1 = (m2.t - m1.t) / 1000;
  return { slowMs, start, rev: res.rev, fps: +((m2.f - m0.f) / ((m2.t - m0.t) / 1000)).toFixed(1), deckFps: +res.fps.toFixed(1), gap: +gap.toFixed(2), eng1: +eng1.toFixed(2), eng1Sec: m1.sec, upOk: m1.phase === 'up' && m1.n === 1 && m2.phase === 'gap' && m2.k === 1, phaseGap: res.phaseGap, errs: pe };
}
let timingBad = 0;
for (const ms of [0, 120]) {
  const r = await timeQual(ms);
  const okGap = Math.abs(r.gap - 3) <= 0.35, okEng = Math.abs(r.eng1 - 5) <= 0.35 && r.eng1Sec === 5;
  const good = okGap && okEng && r.upOk && r.start.lane === 20 && r.start.mode === 'qual40' && r.start.phase === 'gap' && r.start.k === 0 && !r.errs.length;
  if (!good) timingBad++;
  console.log(`${good ? 'TIMING OK  ' : 'TIMING FAIL'} · r${r.rev} · lane 21 · ${ms ? 'slow frames (' + ms + ' ms busy-wait)' : 'normal frames'} · real fps ${r.fps} (deck reads ${r.deckFps}) · first gap ${r.gap} s (program 3) · engagement 1 ${r.eng1} s (program ${r.eng1Sec}) · tolerance ±0.35 s · phase gap const ${r.phaseGap} s${r.errs.length ? ' · page error ' + r.errs[0] : ''}`);
}

let bad = 0;
for (const r of out) { if (r.issues.length) { bad++; console.log(`LANE ${String(r.lane).padStart(2)} FAIL ·`, r.issues.slice(0, 6).join(' | ')); } }
const sizes = [...new Set(out.map((r) => r.sizes))];
console.log(`\n42 lanes · QUAL engagements per lane: ${[...new Set(out.map((r) => r.engagements))].join(',')} · targets per lane: ${[...new Set(out.map((r) => r.targets))].join(',')} · size pattern: ${sizes.join(' / ')}`);
console.log(`page errors: ${errs.length}${errs.length ? ' — ' + errs[0] : ''}`);
console.log(`drone-range-all-lanes: ${42 - bad} lanes passed, ${bad} failed`);
console.log(`QUAL · 40 timing (lane 21, normal + slow frames): ${timingBad ? timingBad + ' FAILED' : 'both within ±0.35 s'}`);
await browser.close(); srv.close(); process.exit(bad || errs.length || timingBad ? 1 : 0);
