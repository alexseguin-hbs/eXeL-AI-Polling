// ONE SEAT OF THE AsM TEAM TEST (operator 2026-09-19: "test entire drone-2525 as 38 ASM team"). An agent runs this with a
// seat assignment; the deck is driven ONLY by clicks, key presses, stick drags and select changes on the SERVED bytes, and
// the run reports what the seat saw as JSON (hits, misses, lapses, refusals, toasts, page errors, captures). Seats:
//   solo    — PRACTICE on a lane: TARGET/APPROVE/FIRE through N exposures in a range mode
//   ai      — AsM SPOT on: the AI member marks, the human approves and fires
//   team    — two isolated contexts over WebRTC: host marks, joiner approves, host fires (the two-phone gate, per lane)
//   capitol — a Capitol channel (CH1..CH5) with the craft named: designate the LOCK, approve, fire
// Usage: node scripts/asm-play.mjs '{"seat":"solo","lane":7,"mode":"qual40","shots":6,"tag":"Aset"}'
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
const A = Object.assign({ seat: 'solo', lane: 20, mode: 'bounce', shots: 4, challenge: 0, craft: 'turret', tag: 'seat', width: 390, height: 844, doubleFire: false, asmPress: 0 }, JSON.parse(process.argv[2] || '{}'));
// doubleFire: press FIRE a second time inside the same red exposure (the ONE ROUND PER EXPOSURE refusal path) · asmPress: how many times to press the AsM button (0 = press until the deck says SPOT, the default; a count presses that many times from OFF: 1 = SPOT, 2 = FIRE, 3 = OFF)
const PUB = process.env.ASM_PUB || new URL('../public', import.meta.url).pathname, /* ASM_PUB: serve another folder (a candidate deck) without touching the served bytes */ OUT = new URL('../perf/asm/', import.meta.url).pathname; mkdirSync(OUT, { recursive: true });
const srv = createServer(async (req, res) => { let body; try { body = await readFile(join(PUB, decodeURIComponent(req.url.split('?')[0]))); } catch { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/html' }); res.end(body); }).listen(0);
const PORT = srv.address().port;
const { chromium } = await import('playwright');
const exe = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => existsSync(p));
const b = exe ? await chromium.launch({ executablePath: exe }) : await chromium.launch();
const R = { seat: A, toasts: [], errors: [], steps: [], hits: 0, misses: 0, refusals: 0, lapsed: 0, captures: [] };
const open = async (ctx, tag) => { const p = await ctx.newPage(); p.on('pageerror', (e) => R.errors.push(tag + ': ' + String(e).slice(0, 160))); await p.goto(`http://127.0.0.1:${PORT}/drone-2525/play.html`, { waitUntil: 'load' }); await p.waitForFunction(() => typeof state !== 'undefined' && state.qa && state.qa.total > 0, null, { timeout: 60000 }); await p.waitForTimeout(1700); return p; };
const hud = (p) => p.evaluate(() => ({ des: (document.getElementById('phDes') || {}).textContent, score: (document.getElementById('phScore') || {}).textContent, toast: document.getElementById('toast').textContent, desig: state.desig && { id: state.desig.id, phase: state.desig.phase, how: state.desig.how }, up: (typeof platesHere === 'function' ? platesHere().filter((q) => q.up).map((q) => q.base) : []), lane: state.lane, mode: state.rangeMode, ch: state.challenge, unit: state.unit, hash: replayHash(), lobby: state.lobby && state.lobby.phase, rangeHit: state.rangeHit | 0, rangeMiss: state.rangeMiss | 0, rangeLapsed: state.rangeLapsed | 0, qual: state.rangeMode === 'qual40' ? { R: state.qualR | 0, H: state.qualH | 0, eng: state.qualEng | 0, ph: state.qualPh | 0, expired: state.qualExpired | 0 } : null }));
const step = async (p, name, fn) => { try { await fn(); } catch (e) { R.errors.push(name + ': ' + String(e).slice(0, 120)); } const h = await hud(p); R.steps.push({ name, ...h }); if (h.toast) R.toasts.push(h.toast); return h; };
const waitUp = (p) => (A.challenge > 0 ? p.waitForFunction(() => (pops || []).some((q) => q.up) || (drones || []).some((d) => d.up) || (typeof foils !== 'undefined' && foils.some((d) => d.up)), null, { timeout: 20000 }) : p.waitForFunction(() => typeof platesHere === 'function' && platesHere().some((q) => q.up && (q.fall || 0) < 0.25 && q.lifePct > 0), null, { timeout: 15000 })).catch(() => null);
const cap = async (p, name) => { const f = OUT + `${A.tag}-${name}.png`; await p.screenshot({ path: f }); R.captures.push(f); };
const intro = async (p, practice) => { await p.click('#sc0 button[data-next="sc1"]'); await p.click('#sc1 button[data-next="sc2"]'); await p.click(`#sc2 button[data-craft="${A.craft}"]`).catch(() => null); await p.click('#sc2 button[data-next="sc3"]'); await p.click(`#sc3 button[data-ch="${A.challenge}"]`).catch(() => null); await p.click(practice ? '#sc3 #btnPractice' : '#sc3 #btnIntro'); await p.waitForTimeout(400); };
const seatLane = async (p) => { if (A.lane != null) { await p.selectOption('#lanePick', String(A.lane)).catch(() => null); await p.waitForTimeout(300); } if (A.mode && A.challenge === 0) { await p.selectOption('#rngMode', A.mode).catch(() => null); await p.waitForTimeout(400); } };
const engage = async (p, approver) => { await waitUp(p); const t = A.challenge > 0 ? await step(p, 'TARGET (button: LOCK → mark)', () => p.click('#fTgt')) : await step(p, 'TARGET (key 1: aim + mark)', async () => { await p.bringToFront(); await p.keyboard.press('Digit1'); }); if (!t.desig) { R.refusals++; return; } const a = await step(approver || p, 'APPROVE', () => (approver || p).click('#fAppr')); if (approver) await p.waitForTimeout(700); const f = await step(p, 'FIRE', () => p.click('#fFire')); if (/HIT/.test(f.toast)) R.hits++; else if (/MISS|DOWN|SPENT/.test(f.toast)) R.misses++; else R.refusals++;
  const ov = await p.evaluate(() => { const a = document.getElementById('approve'); return a && a.classList.contains('show') ? a.textContent.slice(0, 80) : null; }); if (ov) { R.ch5Overlays = R.ch5Overlays || []; R.ch5Overlays.push(ov); const g = await step(p, 'CH5 overlay APPROVE', () => p.click('#btnYes')); if (/HIT/.test(g.toast)) { R.hits++; R.refusals--; } }
  if (A.doubleFire) { const g = await step(p, 'FIRE AGAIN (same exposure)', () => p.click('#fFire')); R.secondPulls = R.secondPulls || []; R.secondPulls.push(g.toast); } };

try {
  if (A.seat === 'solo' || A.seat === 'ai') {
    const ctx = await b.newContext({ viewport: { width: A.width, height: A.height } }); const p = await open(ctx, A.tag);
    await intro(p, true); await seatLane(p); await cap(p, '01-start');
    /* r.147: the deck's default is AsM OFF (r.133: OFF → SPOT → FIRE → OFF), so the AI seat presses the button until the deck SAYS SPOT — a state, not a
       count — unless asmPress names a count (1 = one press from wherever the deck is). The old default of 0 presses left the AI member off and the seat
       reported "AI never marked" against every deck since r.133. */
    if (A.seat === 'ai') { await step(p, 'MORE', () => p.click('#btnMore'));
      if (A.asmPress > 0) { for (let k = 0; k < A.asmPress; k++) await step(p, 'AsM button press ' + (k + 1), () => p.click('#btnAsm')); }
      else { for (let k = 0; k < 3; k++) { const on = await p.evaluate(() => !!state.asmSpot && !state.asmFire); if (on) break; await step(p, 'AsM button press until SPOT ' + (k + 1), () => p.click('#btnAsm')); } }
      await step(p, 'MORE close', () => p.click('#btnMore')); }
    if (A.seat === 'ai') R.asm = await p.evaluate(() => ({ spot: state.asmSpot, fire: state.asmFire, label: (document.getElementById('btnAsm') || {}).textContent }));
    for (let i = 0; i < A.shots; i++) {
      if (A.seat === 'ai') { await p.waitForFunction(() => state.desig && state.desig.phase === 'amber', null, { timeout: 20000 }).catch(() => null); const d = await hud(p); if (!d.desig) { R.refusals++; R.steps.push({ name: 'AI never marked', ...d }); continue; } await step(p, 'APPROVE', () => p.click('#fAppr')); const f = await step(p, 'FIRE', () => p.click('#fFire')); if (/HIT/.test(f.toast)) R.hits++; else R.misses++; }
      else if (A.seat === 'capitol') { await step(p, 'TARGET', () => p.click('#fTgt')); await step(p, 'APPROVE', () => p.click('#fAppr')); const f = await step(p, 'FIRE', () => p.click('#fFire')); if (/HIT/.test(f.toast)) R.hits++; else if (/MISS|DOWN|NO EDGE/.test(f.toast)) R.misses++; else R.refusals++; await p.waitForTimeout(1500); }
      else await engage(p);
      if (i === 0) await cap(p, '02-first-shot');
    }
    const h = await hud(p); R.final = h; R.lapsed = h.rangeLapsed; await cap(p, '03-end');
  } else if (A.seat === 'team' || A.seat === 'capitol') { /* capitol: the same room at CH1..CH5 (A.challenge) — the deck refuses CH>0 without a room */
    const cH = await b.newContext({ viewport: { width: A.width, height: A.height } }), cJ = await b.newContext({ viewport: { width: A.width, height: A.height } });
    const H = await open(cH, A.tag + '-host'), J = await open(cJ, A.tag + '-join');
    await intro(H, false); await intro(J, false);
    await step(H, 'HOST', () => H.click('#wrHost')); await step(H, 'OFFER', () => H.click('#wrOffer'));
    await H.waitForFunction(() => ((document.getElementById('wrLink') || {}).value || '').length > 100 || ((document.getElementById('linkBox') || {}).value || '').length > 100, null, { timeout: 30000 }).catch(() => null);
    const offer = await H.evaluate(() => document.getElementById('wrLink').value || document.getElementById('linkBox').value);
    const codes = await H.evaluate(() => state.lobby.teamCodes || {});
    await J.click('#wrRed').catch(() => null); await J.fill('#wrJoinCode', String(codes.RED || '')); await J.fill('#wrLink', offer); await step(J, 'JOIN', () => J.click('#wrJoin'));
    await J.waitForFunction(() => { const v = (document.getElementById('wrLink') || {}).value || '', w = (document.getElementById('linkBox') || {}).value || ''; return (v.length > 100 && /peerPub/.test(atob(v))) || (w.length > 100 && /peerPub/.test(atob(w))); }, null, { timeout: 30000 }).catch(() => null);
    const answer = await J.evaluate(() => { const v = document.getElementById('wrLink').value, w = document.getElementById('linkBox').value; return /peerPub/.test(atob(v || 'e30=')) ? v : w; });
    await H.fill('#wrLink', answer); await step(H, 'APPLY', () => H.click('#wrApply')); await H.waitForFunction(() => state.com.path === 'DIRECT', null, { timeout: 15000 }).catch(() => null); await J.waitForFunction(() => state.com.path === 'DIRECT' && state.codex.authenticated, null, { timeout: 15000 }).catch(() => null); await H.waitForTimeout(1200);
    await cap(H, '01-host-room'); await cap(J, '01-join-room');
    await step(J, 'READY', () => J.click('#wrReady')); await step(H, 'READY', () => H.click('#wrReady')); await H.waitForTimeout(500); await step(H, 'START', () => H.click('#wrLaunch')); await H.waitForTimeout(1500);
    R.live = { H: (await hud(H)).lobby, J: (await hud(J)).lobby };
    for (const p of [H, J]) if (A.lane != null) { await p.selectOption('#lanePick', String(A.lane)).catch(() => null); await p.waitForTimeout(300); }
    for (let i = 0; i < A.shots; i++) { await engage(H, J); if (i === 0) { await cap(H, '02-host-red'); await cap(J, '02-join-red'); } }
    const hh = await H.evaluate(() => replayHash()), hj = await J.evaluate(() => replayHash());
    R.final = { host: await hud(H), join: await hud(J), hashMatch: hh === hj, syncH: await H.evaluate(() => state.sync), syncJ: await J.evaluate(() => state.sync) };
    await cap(H, '03-host-end'); await cap(J, '03-join-end');
  }
} catch (e) { R.errors.push('RUN: ' + String(e).slice(0, 200)); }
await b.close(); srv.close();
R.toasts = [...new Set(R.toasts)];
console.log(JSON.stringify(R, null, 1));
