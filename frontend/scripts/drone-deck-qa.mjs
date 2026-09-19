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
const srv = createServer(async (req, res) => { let body; try { body = await readFile(join(PUB, decodeURIComponent(req.url.split('?')[0]))); } catch { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': 'text/html' }); res.end(body); }).listen(0);
const port = srv.address().port;
const candidates = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].filter(Boolean);
const exe = candidates.find((p) => existsSync(p));
let chromium;
try { ({ chromium } = await import('playwright')); } catch (e) { console.log('FAIL: playwright is not installed —', String(e).slice(0, 80)); console.log(`\ndrone-deck-qa: 0 passed, 1 failed`); process.exit(1); }
let browser;
try { browser = exe ? await chromium.launch({ executablePath: exe }) : await chromium.launch(); } catch (e) { console.log('FAIL: no Chromium could be launched —', String(e).slice(0, 120)); console.log(`\ndrone-deck-qa: 0 passed, 1 failed`); process.exit(1); }
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await page.goto(`http://127.0.0.1:${port}/drone-2525/play.html`, { waitUntil: 'load' });
try { await page.waitForFunction((n) => typeof state !== 'undefined' && state.qa && state.qa.total >= n, DECK_QA_ROWS.length, { timeout: 60000 }); }
catch { const qa = await page.evaluate(() => (typeof state !== 'undefined' && state.qa) ? state.qa : null); console.log('FAIL: the boot QA never published', DECK_QA_ROWS.length, 'rows —', JSON.stringify(qa)); }
await page.waitForTimeout(800);
const r = await page.evaluate(() => ({ rev: state.qa && state.qa.rev, rows: (state.outcomes || []).map((x) => ({ id: x.id, ok: !!x.ok, note: String(x.note || '') })), fps: state.fps || 0, drawDone: state.drawDone || 0, drawErr: state.drawErr || null, simDirect: !!state.simDirect, threw: state.qa && state.qa.threw }));
ok(r.rev === '0.' + DECK_REV, `the browser runs the revision the repo pins (0.${DECK_REV}); got ${r.rev}`);
const ids = new Set(r.rows.map((x) => x.id)), want = new Set(DECK_QA_ROWS);
const missing = DECK_QA_ROWS.filter((id) => !ids.has(id)), extra = [...ids].filter((id) => !want.has(id));
ok(missing.length === 0 && extra.length === 0, `the set of QA rows equals the manifest (${DECK_QA_ROWS.length}); missing=${missing.join(',')} extra=${extra.join(',')}`);
const red = r.rows.filter((x) => !x.ok).map((x) => x.id);
ok(red.every((id) => EXPECTED_RED.includes(id)), `every red row is expected: ${red.join(',') || 'none'}`);
ok(EXPECTED_RED.every((id) => red.includes(id)), `every expected-red row is actually red (a stale exemption would hide a regression): ${EXPECTED_RED.join(',')}`);
ok(errs.length === 0, `no page error: ${errs.join(' | ')}`);
ok(r.drawDone > 0 && !r.drawErr && !r.threw, `frames ran to their last line (${r.drawDone}) with no recorded render exception${r.drawErr ? ': ' + r.drawErr : ''}${r.threw ? ' · QA THREW ' + r.threw : ''}`);
for (const [id, re] of [['RANGE_HIT_50', /aimed/], ['RANGE_HIT_300', /aimed/], ['RANGE_HIT_50_OFF10', /dead=true/], ['TARGETN_HITS_THE_EXPOSED_PLATE', /lands/]]) { const row = r.rows.find((x) => x.id === id); ok(!!row && row.ok && re.test(row.note), `${id} is an AIMED hit: ${row ? row.note.slice(0, 80) : 'missing'}`); }
ok(!r.simDirect, 'simDirect is off when the QA is done (the range rows were never short-circuited)');
ok(r.fps >= 30, `fps ${r.fps.toFixed(1)} holds the 30 Hz reference`);
await mkdir(new URL('../perf', import.meta.url), { recursive: true });
await writeFile(new URL('../perf/deck-qa.json', import.meta.url), JSON.stringify({ rev: r.rev, rows: r.rows.length, red, fps: +r.fps.toFixed(1), drawDone: r.drawDone, t: new Date().toISOString() }, null, 1) + '\n');
await browser.close(); srv.close();
console.log(`\ndrone-deck-qa: ${pass} passed, ${fail} failed · r.${DECK_REV} boot QA ${r.rows.length - red.length}/${r.rows.length} in headless Chromium · red=${red.join(',') || 'none'}`);
process.exit(fail ? 1 : 0);
