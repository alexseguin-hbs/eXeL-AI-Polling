// sign-offline-run.mjs — the OFFLINE hand-off (operator 2026-09-08 00:39: "download of doc is needed; does not need to
// default save in Supabase"). The site's create RPC is blocked with PostgREST's "function not found" (= migration 036
// missing on the hosted Supabase, exactly what the live site answered). Phone A names two signers, signs — the
// envelope stays on the phone, the partly-signed PDF is offered for download with the file-hand-over script. Phone B
// receives that FILE, uploads it as its own document, signs alone — and the final PDF carries both signatures, both
// digital lines, both names in the signatory block and in the Light Codex ALL strip.
//   npm run test:soi-sign-offline   (dev server on :3210, see sign-live-run.mjs)
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { countSignatureImages, codexRows } from '../lib/pdf-stamp.ts';
import { decodeCodexPdf } from '../lib/codex-pdf.ts';
import { verifySignedPdf } from '../lib/sign-verify.ts';

const BASE = process.env.POD_BASE || 'http://127.0.0.1:3210';
const OUT = process.env.OUT || '../docs/assessments/sign-offline-run'; fs.mkdirSync(OUT, { recursive: true });
const FIXTURE = path.resolve('tests/fixtures/sign-sample.pdf');
const log = []; const t0 = Date.now();
const step = (who, what, ok = true, extra = '') => { const l = `${String(Date.now() - t0).padStart(6)}ms  ${who.padEnd(5)} ${ok ? 'OK ' : 'FAIL'} ${what}${extra ? '  ' + extra : ''}`; console.log(l); log.push(l); if (!ok) { fs.writeFileSync(OUT + '/log.txt', log.join('\n')); throw new Error(what); } };
const ready = async (p) => { await p.waitForSelector('next-route-announcer', { state: 'attached', timeout: 90000 }); await p.waitForTimeout(400); };
const shot = (p, who, name) => p.screenshot({ path: `${OUT}/${name}-${who}.jpg`, type: 'jpeg', quality: 55, fullPage: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const phones = {};
process.on('uncaughtException', async (e) => { console.log('FAILED:', e.message.split('\n')[0]); for (const [w, p] of Object.entries(phones)) await p.screenshot({ path: `${OUT}/FAIL-${w}.jpg`, type: 'jpeg', quality: 55, fullPage: true }).catch(() => {}); fs.writeFileSync(OUT + '/log.txt', log.join('\n')); process.exit(1); });
for (const who of ['alex', 'dan']) { const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, acceptDownloads: true }); phones[who] = await ctx.newPage(); phones[who].on('pageerror', (e) => step(who, 'pageerror ' + e.message, false)); }
const A = phones.alex, D = phones.dan;
// the hosted site's answer: the functions do not exist (036 not applied) — create AND the diag probe's get
const missing = (fn) => (r) => r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST202', message: `Could not find the function public.${fn} in the schema cache` }) });
await A.route('**/rest/v1/rpc/sign_envelope_create', missing('sign_envelope_create'));
await A.route('**/rest/v1/rpc/sign_envelope_get', missing('sign_envelope_get'));
// the 24-hour file store (Worker /api/tmp, KV) — mocked in memory on both phones: the dev server has no Worker
const TMP = new Map();
const tmpRoute = async (r) => {
  const u = new URL(r.request().url()); const m = /^\/api\/tmp\/([A-Za-z0-9_-]+)$/.exec(u.pathname);
  if (r.request().method() === 'POST') { const tok = 'T' + Math.random().toString(36).slice(2, 12).padEnd(21, 'x'); TMP.set(tok, { body: r.request().postDataBuffer(), name: r.request().headers()['x-file-name'] || 'doc.pdf' }); return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: tok, url: `${BASE}/soi-session/sign/?f=${tok}`, expires: new Date(Date.now() + 86400000).toISOString() }) }); }
  if (m && TMP.has(m[1])) { const e = TMP.get(m[1]); return r.fulfill({ status: 200, contentType: 'application/pdf', headers: { 'content-disposition': `inline; filename="${e.name}"` }, body: e.body }); }
  return r.fulfill({ status: 410, contentType: 'application/json', body: JSON.stringify({ error: 'gone' }) });
};
await A.route('**/api/tmp**', tmpRoute); await D.route('**/api/tmp**', tmpRoute);

const placeDrawSign = async (p, who, tapX) => {
  const page = p.getByTestId('pdf-page'); await page.locator('canvas').first().waitFor({ timeout: 60000 });
  if (await p.getByTestId('page-next').isEnabled()) { await p.getByTestId('page-next').click(); await p.waitForTimeout(600); }   // the signature block is on page 2 (a pre-placed file already opens there)
  if ((await p.getByTestId('sig-box').count()) === 1) step(who, `landed on the placeholders the partly-signed file carries (${await p.getByTestId('sig-box').getAttribute('data-fit')})`, (await p.getByTestId('sig-box').getAttribute('data-fit')) === 'holder' && (await p.getByTestId('text-box').count()) === 1);
  else { const bb = await page.boundingBox(); await p.mouse.click(bb.x + bb.width * tapX, bb.y + bb.height * 0.545); await p.getByTestId('sig-box').waitFor(); step(who, `signature box placed (${(await p.getByTestId('sig-box').getAttribute('data-fit'))})`); }
  await p.getByTestId('to-draw').click();
  const c = p.locator('canvas[aria-label]').first(); const b = await c.boundingBox();
  await p.mouse.move(b.x + 20, b.y + 80); await p.mouse.down(); for (let i = 1; i <= 24; i++) await p.mouse.move(b.x + 20 + i * 10, b.y + 80 + Math.sin(i * (who === 'alex' ? 1.3 : 0.9)) * 28, { steps: 2 }); await p.mouse.up();
  const ci = p.locator('canvas[aria-label="Draw your initials"]'); const bi = await ci.boundingBox();
  await p.mouse.move(bi.x + 20, bi.y + 60); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(bi.x + 20 + i * 9, bi.y + 60 + (i % 2 ? -22 : 18), { steps: 2 }); await p.mouse.up();
  await p.waitForFunction(() => { const s = document.querySelector('[data-testid="sign-button"]'); return s && !s.disabled; }, null, { timeout: 5000 }); await p.getByTestId('sign-button').click(); step(who, 'Sign & save pressed (signature + initials drawn)');
};

// 1 · Alex: two signers, the create is refused by name → the envelope stays on the phone, the file is offered
await A.goto(BASE + '/soi-session/sign/', { waitUntil: 'domcontentloaded' }); await ready(A);
// "Why can't I sign?" on a site without 036: the sentence says download works, and THE FIX is one tap away (operator 00:15)
await A.getByTestId('diag-toggle').click(); await A.getByTestId('diag-fix').waitFor({ timeout: 30000 });
const todo = await A.getByTestId('diag-todo').innerText(); const sqlHref = await A.getByTestId('diag-open-sql').getAttribute('href');
const sql = await (await A.request.get(BASE + sqlHref)).text();
step('alex', 'diag on a 036-less site: "signing works … downloads" + Copy migration SQL + Open the SQL (served, 20 kB, holds the create function)', /036/.test(todo) && /downloads/.test(todo) && (await A.getByTestId('diag-copy-sql').count()) === 1 && /create or replace function[\s\S]*sign_envelope_create/i.test(sql) && sql.length > 15000, `${sqlHref} · ${sql.length} bytes`);
await shot(A, 'alex', '0-diag-fix'); await A.getByTestId('diag-toggle').click();
await A.getByPlaceholder(/Promissory/).fill('Promissory Note'); await A.getByTestId('file-input').setInputFiles(FIXTURE); await A.getByTestId('file-list').locator('li').first().waitFor({ timeout: 30000 });
await A.getByRole('button', { name: /who signs/ }).click();
await A.getByTestId('signer-name-0').fill('Alex Seguin'); await A.getByTestId('signer-contact-0').fill('explore@eXeL-AI.com');
await A.getByTestId('signer-name-1').fill('Daniel Vail'); await A.getByTestId('signer-contact-1').fill('512.808.8745');
await A.getByRole('button', { name: /place your signature/ }).click();
await placeDrawSign(A, 'alex', 0.28);
await A.getByTestId('offline-handoff').waitFor({ timeout: 60000 });
const off = await A.getByTestId('offline-handoff').innerText();
step('alex', 'no link minted → the OFFLINE hand-off block: 036 named, hand the file over, one "Send the file" action', /036/.test(off) && /Daniel Vail/.test(off) && (await A.getByTestId('share-file').count()) === 1, off.replace(/\s+/g, ' ').slice(0, 120));
// the file travels WITH the message (operator 01:10): the share sheet on a phone; here (no Web Share) the fallback —
// the partly-signed PDF downloads and the composer opens with the script
const [dlS] = await Promise.all([A.waitForEvent('download'), A.getByTestId('share-file').click()]);
await A.getByTestId('share-fallback').waitFor({ timeout: 10000 });
step('alex', 'Send the file: the partly-signed PDF is handed over with the message, named with the initials of who signed (…-partly-signed-AS.pdf)', /partly-signed-AS\.pdf$/.test(dlS.suggestedFilename()), dlS.suggestedFilename());
step('alex', 'explainer says: signed on this phone, download and send', /Download the partly-signed file/.test(await A.getByTestId('explain').innerText()));
step('alex', 'the download is a Vision-2525 pill (↓, uppercase, rounded)', /↓/.test(await A.getByTestId('downloads-partly').innerText()) && /rounded-full/.test(await A.getByTestId('downloads-partly').locator('button').first().getAttribute('class')));
await shot(A, 'alex', '1-offline-handoff');
const partly = path.join(OUT, 'partly-signed.pdf'); await dlS.saveAs(partly);   // the very file the message carried
// the 24-hour LINK (operator 01:25): the store took the file, the script carries the link, the token is the key
await A.getByTestId('tmp-link').waitFor({ timeout: 10000 }); const tmpUrl = (await A.getByTestId('tmp-url').innerText()).trim();
step('alex', 'a 24-hour file link was minted for the partly-signed file (…/soi-session/sign/?f=<token>)', /\/soi-session\/sign\/\?f=[A-Za-z0-9_-]{22}$/.test(tmpUrl) && TMP.size === 1, tmpUrl.slice(-40));
const pb = new Uint8Array(fs.readFileSync(partly));
step('alex', 'partly-signed PDF downloaded: 1 signature, 1 signatory row carrying the NAME', (await countSignatureImages(pb)) === 1 && (await codexRows(pb)).length === 1 && (await codexRows(pb))[0].name === 'Alex Seguin', JSON.stringify(await codexRows(pb)));

// 2 · Daniel opens the LINK: the file arrives by token with his places marked, he signs alone (no backend needed at all)
await D.goto(tmpUrl, { waitUntil: 'domcontentloaded' }); await ready(D);
await D.getByTestId('file-list').locator('li').first().waitFor({ timeout: 30000 }); step('dan', 'the 24-hour link opened the partly-signed file on his phone (no upload, no account)');
await D.getByPlaceholder(/Promissory/).fill('Promissory Note');
await D.getByRole('button', { name: /who signs/ }).click();
await D.getByTestId('signer-name-0').fill('Daniel Vail'); await D.getByTestId('signer-contact-0').fill('512.808.8745');
const rm = D.getByRole('button', { name: /remove/i }); if (await rm.count()) await rm.first().click();
await D.getByRole('button', { name: /place your signature/ }).click();
await placeDrawSign(D, 'dan', 0.66);
await D.getByTestId('downloads').waitFor({ timeout: 60000 }); step('dan', 'COMPLETE on his phone');
await shot(D, 'dan', '2-complete');
const [dl2] = await Promise.all([D.waitForEvent('download'), D.getByTestId('downloads').locator('button').first().click()]);
step('dan', 'the final file is named with BOTH initials from the rows the file carries (…-signed-AS-DV.pdf)', /-signed-AS-DV\.pdf$/.test(dl2.suggestedFilename()), dl2.suggestedFilename());
const final = path.join(OUT, 'fully-signed.pdf'); await dl2.saveAs(final); const fb = new Uint8Array(fs.readFileSync(final));
const rows = await codexRows(fb);
step('dan', 'final PDF: 2 signatures, 2 signatory rows — Alex (row 0, kept by name) and Daniel (row 1)', (await countSignatureImages(fb)) === 2 && rows.length === 2 && rows[0].name === 'Alex Seguin' && rows[1].name === 'Daniel Vail', JSON.stringify(rows.map((r) => [r.rowIndex, r.name])));
const codex = await decodeCodexPdf(fb, (b) => new Uint8Array(zlib.inflateSync(b)));
const all = codex.find((c) => c.name === 'SoICodexAll')?.result?.messageForward || '';
step('dan', 'the hidden Light Codex names both signatories', /^ALEX SEGUIN 2026\d{10} \. DANIEL VAIL 2026\d{10}$/.test(all), all);
const v = await verifySignedPdf('fully-signed.pdf', fb);
step('dan', 'offline verify: consistent, two envelopes (the file was carried by hand)', v.ok && v.envelopes === 2 && v.images === 2, JSON.stringify(v.issues));
fs.writeFileSync(OUT + '/log.txt', log.join('\n')); await browser.close(); console.log(`\nSIGN OFFLINE HAND-OFF RUN: ${log.length} steps, 0 failures`);
