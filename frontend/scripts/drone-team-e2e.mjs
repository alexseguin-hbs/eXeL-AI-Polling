// THE TWO-PHONE MATCH GATE (the qualification the r.093→r.102 arc, the r.128 notes and the fleet review all named as
// "the next R-CORE step"): two ISOLATED browser contexts (no shared BroadcastChannel — two phones) over a real WebRTC data
// channel, driven only by clicks and by carrying the offer/answer text between them the way two humans would. Host offer →
// joiner answer → DIRECT → team auth → READY → START → LIVE → the host marks, the host's self-approve is refused TWO HUMANS,
// the joiner approves, red on both, the host fires, HIT, and both peers hold ONE replay hash and report MATCH.
// Needs Chromium (fails closed without it). ICE gathering waits for the STUN timeout when no network is reachable (~40 s).
import { existsSync } from 'node:fs';
import { DECK_REV } from '../tests/deck-head.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
const PUB = new URL('../public', import.meta.url).pathname; const OUT = new URL('../perf/', import.meta.url).pathname;
import { mkdirSync } from 'node:fs'; mkdirSync(OUT, { recursive: true });
const srv = createServer(async (req, res) => { let body; try { body = await readFile(join(PUB, decodeURIComponent(req.url.split('?')[0]))); } catch { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/html' }); res.end(body); }).listen(0); const PORT = srv.address().port;
let chromium; try { ({ chromium } = await import('playwright')); } catch (e) { console.log('FAIL: playwright is not installed'); console.log('\ndrone-team-e2e: 0 passed, 1 failed'); process.exit(1); }
const exe = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean).find((p) => existsSync(p));
let b; try { b = exe ? await chromium.launch({ executablePath: exe }) : await chromium.launch(); } catch (e) { console.log('FAIL: no Chromium could be launched —', String(e).slice(0, 100)); console.log('\ndrone-team-e2e: 0 passed, 1 failed'); process.exit(1); }
const ctxH = await b.newContext({ viewport: { width: 390, height: 844 } }), ctxJ = await b.newContext({ viewport: { width: 390, height: 844 } }); /* two contexts = two phones: no shared BroadcastChannel */
const note = (k, v) => console.log(k.padEnd(30), '·', (typeof v === 'string' ? v : JSON.stringify(v)).slice(0, 420));
const open = async (tag) => { const p = await (tag === 'H' ? ctxH : ctxJ).newPage(); p.on('pageerror', (e) => note(tag + ':PAGEERROR', String(e).slice(0, 160))); await p.goto(`http://127.0.0.1:${PORT}/drone-2525/play.html`, { waitUntil: 'load' }); await p.waitForFunction(() => typeof state !== 'undefined' && state.qa && state.qa.total > 0, null, { timeout: 60000 }); await p.waitForTimeout(1700); return p; };
const room = (p) => p.evaluate(() => ({ room: document.getElementById('wrRoom').textContent, role: document.getElementById('wrRole').textContent, path: document.getElementById('wrPath').textContent, roster: document.getElementById('wrRoster').textContent, auth: document.getElementById('wrAuth').textContent, myCode: (document.getElementById('wrMyCode') || {}).textContent, team: state.lobby.team, phase: state.lobby.phase, comPath: state.com.path, toast: document.getElementById('toast').textContent, launch: document.getElementById('wrLaunch').textContent }));
const hud = (p) => p.evaluate(() => ({ des: (document.getElementById('phDes') || {}).textContent, toast: document.getElementById('toast').textContent, desig: state.desig && { id: state.desig.id, phase: state.desig.phase, by: state.desig.by, how: state.desig.how }, slots: Object.keys(state.tgtSlot || {}).map((k) => k + ':' + state.tgtSlot[k].id + ':' + state.tgtSlot[k].phase), lobby: state.lobby.phase, lane: state.lane, up: platesHere().filter((q) => q.up).map((q) => q.base), hash: replayHash(), sync: state.sync, events: (state.events || []).length }));
const toRoom = async (p) => { await p.click('#sc0 button[data-next="sc1"]'); await p.click('#sc1 button[data-next="sc2"]'); await p.click('#sc2 button[data-craft="turret"]'); await p.click('#sc2 button[data-next="sc3"]'); await p.click('#sc3 button[data-ch="0"]'); await p.click('#sc3 #btnIntro'); await p.waitForTimeout(300); };

const H = await open('H'), J = await open('J');
await toRoom(H); await toRoom(J);
await H.click('#wrHost'); await H.waitForTimeout(400); note('H hosted', await room(H));
await H.click('#wrOffer'); const t0 = Date.now(); await H.waitForFunction(() => ((document.getElementById('wrLink') || {}).value || '').length > 100 || ((document.getElementById('linkBox') || {}).value || '').length > 100, null, { timeout: 90000 }).catch(() => null);
const offer = await H.evaluate(() => document.getElementById('wrLink').value || document.getElementById('linkBox').value); note('H offer wait ms', Date.now() - t0); note('H offer', 'len ' + offer.length + ' · ' + (await room(H)).toast);
const codes = await H.evaluate(() => ({ BLU: state.lobby.teamCodes && state.lobby.teamCodes.BLU, RED: state.lobby.teamCodes && state.lobby.teamCodes.RED }));
note('H team codes (host tells each team its own)', codes);
await J.click('#wrRed').catch(() => null); await J.waitForTimeout(150);
await J.fill('#wrJoinCode', String(codes.RED || codes.BLU || '')); await J.fill('#wrLink', offer); await J.click('#wrJoin');
const t1 = Date.now(); await J.waitForFunction(() => { const v = (document.getElementById('wrLink') || {}).value || ''; const w = (document.getElementById('linkBox') || {}).value || ''; return (v.length > 100 && /peerPub/.test(atob(v))) || (w.length > 100 && /peerPub/.test(atob(w))); }, null, { timeout: 90000 }).catch(() => null);
await J.waitForTimeout(500); const answer = await J.evaluate(() => { const v = document.getElementById('wrLink').value, w = document.getElementById('linkBox').value; return /peerPub/.test(atob(v || 'e30=')) ? v : w; }); note('J answer wait ms', Date.now() - t1); note('J answer', 'len ' + answer.length + ' · ' + JSON.stringify(await room(J)));
await H.fill('#wrLink', answer); await H.click('#wrApply'); await H.waitForTimeout(2500);
note('H after apply', await room(H)); note('J after apply', await room(J));
await H.waitForFunction(() => state.com.path === 'DIRECT', null, { timeout: 15000 }).catch(() => null); await J.waitForFunction(() => state.com.path === 'DIRECT' && state.codex.authenticated, null, { timeout: 15000 }).catch(() => null);
await H.waitForTimeout(1500); const rH = await room(H), rJ = await room(J); note('H direct?', rH); note('J direct+auth?', rJ);
await H.screenshot({ path: OUT + 't-01-host-room.png' }); await J.screenshot({ path: OUT + 't-02-join-room.png' });
await J.click('#wrReady'); await J.waitForTimeout(400); await H.click('#wrReady'); await H.waitForTimeout(600);
note('after READY', { H: await room(H), J: await room(J) });
await H.click('#wrLaunch'); await H.waitForTimeout(1500);
const sH = await hud(H), sJ = await hud(J); note('after START', { H: sH, J: sJ }); const hostSid = await H.evaluate(() => SID);
await H.screenshot({ path: OUT + 't-03-host-live.png' }); await J.screenshot({ path: OUT + 't-04-join-live.png' });
// engage: A marks (on its lane), B approves, both red, A fires
await H.waitForFunction(() => platesHere().some((q) => q.up && (q.fall || 0) < 0.25 && q.lifePct > 0), null, { timeout: 15000 }).catch(() => null);
await H.click('#fTgt'); await H.waitForTimeout(700); const tH = await hud(H), tJ = await hud(J); note('H TARGET', { H: tH, J: tJ });
await H.click('#fAppr'); await H.waitForTimeout(300); const selfToast = (await hud(H)).toast; note('H self-approve (must be refused in LIVE)', selfToast);
await J.click('#fAppr'); await J.waitForTimeout(900); const aH = await hud(H), aJ = await hud(J); note('J APPROVE', { H: aH, J: aJ });
await H.screenshot({ path: OUT + 't-05-host-red.png' }); await J.screenshot({ path: OUT + 't-06-join-red.png' });
await H.click('#fFire'); await H.waitForTimeout(900); const fH = await hud(H), fJ = await hud(J); note('H FIRE', { H: fH, J: fJ });
const hh = await H.evaluate(() => replayHash()), hj = await J.evaluate(() => replayHash());
const syncH = await H.evaluate(() => state.sync), syncJ = await J.evaluate(() => state.sync); note('HASH', { H: hh, J: hj, match: hh === hj, syncH, syncJ });
const evs = (p) => p.evaluate(() => (state.events || []).filter((e) => e.committed !== false).sort((a, b) => (a.orderKey < b.orderKey ? -1 : 1)).map((e) => e.verb + ':' + e.id + ':' + String(e.peerId || '').slice(-3) + ':' + (e.result || '').slice(0, 12) + ':S' + e.sessionSeq));
note('H events', await evs(H)); note('J events', await evs(J));
await H.screenshot({ path: OUT + 't-07-host-after-fire.png' });
// ── the gate ──
const revH = await H.evaluate(() => state.qa && state.qa.rev);
ok(revH === '0.' + DECK_REV, `both phones run HEAD r.${DECK_REV} (got ${revH})`);
ok(rH.path === 'DIRECT' && rJ.path === 'DIRECT' && rH.auth === 'AUTHORIZED' && rJ.auth === 'AUTHORIZED', 'DIRECT + AUTHORIZED on both phones');
ok(sH.lobby === 'LIVE' && sJ.lobby === 'LIVE', 'the room went LIVE on both phones');
ok(tJ.desig && tJ.desig.phase === 'amber' && tJ.desig.by === hostSid, `the host's mark reached the joiner as amber, by the host (${tJ.desig && tJ.desig.by})`);
ok(/TWO HUMANS/.test(selfToast), `the host's self-approve was refused: ${selfToast}`);
ok(aH.desig && aH.desig.phase === 'red' && aJ.desig && aJ.desig.phase === 'red' && aH.desig.how === 'PEER HI-2', 'the joiner\'s approval turned the box red on BOTH phones as PEER HI-2');
ok(fH.des && /DOWN/.test(fH.des) && !fH.desig && !fJ.desig, 'the host fired, the target went down, the box cleared on both');
ok(hh === hj && syncH === 'MATCH' && syncJ === 'MATCH', `one replay hash on both phones (${hh} / ${hj}) and MATCH on both`);
await b.close(); srv.close();
console.log(`\ndrone-team-e2e: ${pass} passed, ${fail} failed · two isolated contexts over WebRTC · hash ${hh} ${hh === hj ? '==' : '!='} ${hj}`);
process.exit(fail ? 1 : 0);
