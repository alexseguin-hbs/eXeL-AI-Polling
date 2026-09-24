// THE DECK'S OWN QA, RUN IN CI (fleet lens 12A, 2026-09-19: "the deck's rows run only by hand"). Serves the SERVED bytes
// (public/drone-2525/play.html — drone-playable holds them byte-identical to the carried HEAD), opens them in headless
// Chromium, waits for the boot QA AND the deferred DRAW_COMPLETES row, and holds: the revision is HEAD; the set of row ids
// equals the checked-in manifest (a deleted row cannot hide behind a new one); every failing row is in EXPECTED_RED and
// every EXPECTED_RED row is actually red (a stale exemption fails loudly); no page error; frames ran to their last line;
// the range rows fired AIMED shots and simDirect is off at the end; fps holds the 30 Hz reference. A gate that cannot
// fail is not a gate — a missing browser is a failure, never a skip.
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DECK_REV } from '../tests/deck-head.mjs';
import { DECK_QA_ROWS, EXPECTED_RED } from '../tests/deck-qa-manifest.mjs';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const PUB = new URL('../public', import.meta.url).pathname;
const srv = createServer(async (req, res) => { if (req.url.startsWith('/favicon')) { res.writeHead(204); return res.end(); } let body; try { body = await readFile(join(PUB, decodeURIComponent(req.url.split('?')[0]))); } catch { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/html' }); res.end(body); }).listen(0);
const port = srv.address().port;
const candidates = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
const exe = candidates.find((p) => existsSync(p));
let chromium;
try { ({ chromium } = await import('playwright')); } catch (e) { console.log('FAIL: playwright is not installed —', String(e).slice(0, 80)); console.log(`\ndrone-deck-qa: 0 passed, 1 failed`); process.exit(1); }
let browser;
try { browser = exe ? await chromium.launch({ executablePath: exe }) : await chromium.launch(); } catch (e) { console.log('FAIL: no Chromium could be launched —', String(e).slice(0, 120)); console.log(`\ndrone-deck-qa: 0 passed, 1 failed`); process.exit(1); }
/* r.139: BOTH orientations, the way Mission Planning's harness runs both panes — a phone in landscape is a phone, FULL fills the picture in each. */
const VIEWPORTS = [{ name: 'portrait', width: 390, height: 844 }, { name: 'landscape', width: 844, height: 390 }];
const results = {};
for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(process.env.DECK_URL || `http://127.0.0.1:${port}/drone-2525/play.html`, { waitUntil: 'load' });
  try { await page.waitForFunction((n) => typeof state !== 'undefined' && state.qa && state.qa.total >= n, DECK_QA_ROWS.length, { timeout: 60000 }); }
  catch { const qa = await page.evaluate(() => (typeof state !== 'undefined' && state.qa) ? state.qa : null); console.log(`FAIL: [${vp.name}] the boot QA never published`, DECK_QA_ROWS.length, 'rows —', JSON.stringify(qa)); }
  /* r.141: wait for the frame loop to be RUNNING (a frame drawn, an fps measured, the deferred rows landed) before reading — Deploy #939
     read a slow runner's page 800 ms after the rows and saw fps 0.0 and DRAW_COMPLETES still pending; a timeout here is a real failure. */
  /* r.146: the deck's own deferred rows now decide on evidence (a frame; the loop's mark) up to a declared ceiling — Deploy #950 had a cold
     runner judged 'no frame completed' by the row's fixed 1.5 s timer. Proven under a 30× CPU throttle on ONE cloud-sandbox runner (scripts/drone-deck-slow-probe.mjs: OK after 3.8 s) — one machine, not a population (Thoth, fleet r.147). */
  try { await page.waitForFunction(() => typeof state !== 'undefined' && (state.drawDone || 0) > 0 && (state.fps || 0) > 0 && (state.outcomes || []).some((x) => x.id === 'DRAW_COMPLETES'), null, { timeout: 30000 }); }
  catch { console.log(`FAIL: [${vp.name}] the frame loop never reported a drawn frame with a measured fps within 30 s`); }
  /* W1 (fleet r.147, Enlil/MoT 2): a render error AFTER the first frame was invisible — DRAW_COMPLETES decides on frame 1. Soak 2 s and read the error COUNT. */
  await page.waitForTimeout(2000);
  const r = await page.evaluate(() => ({ rev: state.qa && state.qa.rev, drawErrN: state.drawErrN || 0, rows: (state.outcomes || []).map((x) => ({ id: x.id, ok: !!x.ok, note: String(x.note || '') })), fps: state.fps || 0, drawDone: state.drawDone || 0, drawErr: state.drawErr || null, simDirect: !!state.simDirect, threw: state.qaThrew || null, cls: document.getElementById('app').className }));
  const T = `[${vp.name} ${vp.width}×${vp.height}]`;
  ok(r.rev === '0.' + DECK_REV, `${T} the browser runs the revision the repo pins (0.${DECK_REV}); got ${r.rev}`);
  const ids = new Set(r.rows.map((x) => x.id)), want = new Set(DECK_QA_ROWS);
  const missing = DECK_QA_ROWS.filter((id) => !ids.has(id)), extra = [...ids].filter((id) => !want.has(id));
  ok(missing.length === 0 && extra.length === 0, `${T} the set of QA rows equals the manifest (${DECK_QA_ROWS.length}); missing=${missing.join(',')} extra=${extra.join(',')}`);
  const red = r.rows.filter((x) => !x.ok).map((x) => x.id);
  ok(red.every((id) => EXPECTED_RED.includes(id)), `${T} every red row is expected: ${red.join(',') || 'none'}`);
  ok(EXPECTED_RED.every((id) => red.includes(id)), `${T} every expected-red row is actually red (a stale exemption would hide a regression): ${EXPECTED_RED.join(',')}`);
  ok(errs.length === 0, `${T} no page error: ${errs.join(' | ')}`);
  ok(r.drawDone > 0 && !r.drawErr && !r.threw && r.drawErrN === 0, `${T} frames ran to their last line (${r.drawDone}) with no recorded render exception${r.drawErr ? ': ' + r.drawErr : ''}${r.threw ? ' · QA THREW ' + r.threw : ''} (render errors after 2 s soak: ${r.drawErrN})`);
  /* W1: a row that SAYS it was not exercised is red, whatever its ok flag — a probe that cannot go red is not evidence (MoT 11). */
  const notEx = r.rows.filter((x) => /not exercised/i.test(x.note)).map((x) => x.id);
  ok(notEx.length === 0, `${T} no row passes by saying it was not exercised: ${notEx.join(',') || 'none'}`);
  for (const [id, re] of [['RANGE_HIT_50', /aimed/], ['RANGE_HIT_300', /aimed/], ['RANGE_HIT_50_OFF2', /dead=true/], ['TARGETN_HITS_THE_EXPOSED_PLATE', /lands/], ['FULL_FILLS_THE_STAGE', /whole screen/], ['FULL_BEATS_DESK', /full width/], ['TOP_LINES_NEVER_OVERLAP', vp.name === 'landscape' ? /side by side/ : /stacked/], ['DEVICE_CLASS_BY_SHORT_SIDE', /this window is phone/],
    /* r.147 */ ['LOCK_IS_NEAREST_TO_THE_PIP', /LOCK C-\d+[LRC]?(-L\d+)? at \d+ px/], ['TARGET_MARKS_THE_PIP', /TARGET marks C-\d+[LRC]?(-L\d+)? and the head moves \d+\.\d+° onto it/], ['CAP_LOCK_IS_THE_PIP', /→ LOCK D-/],
    /* r.148 */ ['TARGET_FOLLOWS_THE_EYE', /TARGET marks C-\d+[LRC]?(-L\d+)? and the head moves \d+\.\d+° \(not back to the old mark\); the unfinished 100 C released on the record: true/], ['TARGET_ON_OWN_MARK_KEEPS_PHASE', /keeps it red and writes no row/], ['KEYS_2_3_OBEY_THE_REACH', /key 2 and key 3 refuse like key 1/], ['ASM_SPOTS_THE_PIP_AND_NEVER_MOVES_IT', /the AI marks C-\d+[LRC]?(-L\d+)? .*head moves 0\.000°/], ['TARGET_OVER_AI_AMBER_MARKS_THE_PIP', /TARGET marks C-\d+[LRC]?(-L\d+)? by me, head \d+\.\d+°; the AI's box keeps its author/], ['REJECT_NEVER_NAMES_AN_UNMARKED_TARGET', /refused against NONE \(NONE NO_RED_BOX\)/], ['BOARD_NEVER_OVER_THE_STRIP', /do not overlap \(\d+-\d+ vs \d+-\d+\)/], ['PEER_HIT_NEEDS_RED_ON_RECORD', /leaves it standing \(C-\S+ up=true life=100\)/], ['AI_WAITS_FOR_THE_HIT_TO_BE_READ', /marks nothing \(none\); after it, the plate under the bullseye \(C-/],
    /* r.149 */ ['VOXEL_BOX_FOLLOWS_THE_MARK', /one 12-edge voxel in amber around C-\S+; APPROVE → the same box red/], ['NO_BRACKET_UNLESS_TARGETED', /the marked ones get the T-box and the voxel/],
    /* r.150 — the fire gate reads the picture */ ['FIRE_SAYS_WHERE', /REJECT TARGET_OFF_PICTURE · rounds unchanged \((\d+)→\1\) · the box is still red on C-/], ['FIRE_ON_THE_BOX_STILL_HITS', /FIRE → HIT · rounds (\d+)→(\d+)/], ['FIRE_FROM_MAP_REFUSED', /TARGET_OFF_PICTURE via MAP · rounds unchanged/], ['ONE_ROW_PER_PULL', /2 pulls → 2 rows · 1 APPROVE \(2 MISS rows, approvals (\d+)→\1, box red\)/], ['TAG_NEEDS_RED_BOX', /REJECT TAG_NEEDS_RED_BOX · score unchanged .* no TAG row/], ['PENDING_DIES_WITH_THE_SCENE', /null after RESET \(null\) and after a RELEASE \(null\)/], ['PEER_APPROVE_OF_A_DEAD_PLATE_REFUSED', /HOLD TARGET_DOWN ×2 \(2\), nothing red/], ['APPROVE_LOOKS_AT_THE_MARK', /pan -?\d+\.\d°→-?\d+\.\d° · under the bullseye true/], ['AI_MARK_NEVER_TURNS_THE_SEAT', /the seated head moves 0\.000°/], ['AI_RESUMES_AFTER_RELOAD', /REJECT EMPTY_MAGAZINE then RELOAD then FIRE \(fired\)/], ['FORGED_RED_NEVER_HITS_THE_RING', /REJECT NOT_A_RANGE_TARGET · BULL-1 untouched \((\d+)→\1\) · rounds unchanged/], ['KEY1_REFUSES_THE_GRASS', /key 1 refused · NO TARGET UNDER THE BULLSEYE · nothing marked/], ['TARGET_BUTTON_FOLLOWS_THE_EYE', /the TARGET button marks C-150R(-L\d+)? and the head moves [01]\.\d+° · slots C-150R/], ['RANGE_MISS_300_OFF20', /TARGET_OFF_PICTURE · rounds unchanged/],
    /* r.146 deferred rows decide on evidence — the note carries the evidence */ ['ASM_MARKED_BY_THE_LOOP', /the frame loop itself marked .* by ASM@/], ['DRAW_COMPLETES', /frames ran to their last line: \d+ · segs=\d+ dropped=\d+ · after \d+ ms/]]) { const row = r.rows.find((x) => x.id === id); ok(!!row && row.ok && re.test(row.note), `${T} ${id} is measured, not asserted: ${row ? row.note.slice(0, 120) : 'missing'}`); }
  ok(/\bphone\b/.test(r.cls), `${T} a phone is a phone in this orientation (classes: ${r.cls})`);
  ok(!r.simDirect, `${T} simDirect is off when the QA is done (the range rows were never short-circuited)`);
  ok(r.fps >= 30, `${T} fps ${r.fps.toFixed(1)} holds the 30 Hz reference`);
  results[vp.name] = { rev: r.rev, rows: r.rows.length, red, fps: +r.fps.toFixed(1), drawDone: r.drawDone };
  await page.close();
}
const r = results.portrait, red = r.red;
await mkdir(new URL('../perf', import.meta.url), { recursive: true });
await writeFile(new URL('../perf/deck-qa.json', import.meta.url), JSON.stringify({ ...results, t: new Date().toISOString() }, null, 1) + '\n');
await browser.close(); srv.close();
console.log(`\ndrone-deck-qa${process.env.DECK_URL ? ' (LIVE ' + process.env.DECK_URL + ')' : ''}: ${pass} passed, ${fail} failed · r.${DECK_REV} boot QA ${r.rows - red.length}/${r.rows} in headless Chromium, portrait AND landscape · red=${red.join(',') || 'none'}`);
process.exit(fail ? 1 : 0);
