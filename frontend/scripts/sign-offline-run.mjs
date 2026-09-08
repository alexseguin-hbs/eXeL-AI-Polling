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
// the hosted site's answer: the create function does not exist (036 not applied)
await A.route('**/rest/v1/rpc/sign_envelope_create', (r) => r.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST202', message: 'Could not find the function public.sign_envelope_create in the schema cache' }) }));

const placeDrawSign = async (p, who, tapX) => {
  const page = p.getByTestId('pdf-page'); await page.locator('canvas').first().waitFor({ timeout: 60000 });
  await p.getByTestId('page-next').click(); await p.waitForTimeout(600);           // the signature block is on page 2
  const bb = await page.boundingBox(); await p.mouse.click(bb.x + bb.width * tapX, bb.y + bb.height * 0.545);
  await p.getByTestId('sig-box').waitFor(); step(who, `signature box placed (${(await p.getByTestId('sig-box').getAttribute('data-fit'))})`);
  await p.getByTestId('to-draw').click();
  const c = p.locator('canvas[aria-label]').first(); const b = await c.boundingBox();
  await p.mouse.move(b.x + 20, b.y + 80); await p.mouse.down(); for (let i = 1; i <= 24; i++) await p.mouse.move(b.x + 20 + i * 10, b.y + 80 + Math.sin(i * (who === 'alex' ? 1.3 : 0.9)) * 28, { steps: 2 }); await p.mouse.up();
  await p.waitForFunction(() => { const s = document.querySelector('[data-testid="sign-button"]'); return s && !s.disabled; }, null, { timeout: 5000 }); await p.getByTestId('sign-button').click(); step(who, 'Sign & save pressed');
};

// 1 · Alex: two signers, the create is refused by name → the envelope stays on the phone, the file is offered
await A.goto(BASE + '/soi-session/sign/', { waitUntil: 'domcontentloaded' }); await ready(A);
await A.getByPlaceholder(/Promissory/).fill('Promissory Note'); await A.getByTestId('file-input').setInputFiles(FIXTURE); await A.getByTestId('file-list').locator('li').first().waitFor({ timeout: 30000 });
await A.getByRole('button', { name: /who signs/ }).click();
await A.getByTestId('signer-name-0').fill('Alex Seguin'); await A.getByTestId('signer-contact-0').fill('explore@eXeL-AI.com');
await A.getByTestId('signer-name-1').fill('Daniel Vail'); await A.getByTestId('signer-contact-1').fill('512.808.8745');
await A.getByRole('button', { name: /place your signature/ }).click();
await placeDrawSign(A, 'alex', 0.28);
await A.getByTestId('offline-handoff').waitFor({ timeout: 60000 });
const off = await A.getByTestId('offline-handoff').innerText();
step('alex', 'no link minted → the OFFLINE hand-off block: 036 named, hand the file over, sms/mail carry the script', /036/.test(off) && /Daniel Vail/.test(off) && (await A.getByRole('link', { name: /Send by text/ }).count()) === 1, off.replace(/\s+/g, ' ').slice(0, 120));
step('alex', 'explainer says: signed on this phone, download and send', /Download the partly-signed file/.test(await A.getByTestId('explain').innerText()));
step('alex', 'the download is a Vision-2525 pill (↓, uppercase, rounded)', /↓/.test(await A.getByTestId('downloads-partly').innerText()) && /rounded-full/.test(await A.getByTestId('downloads-partly').locator('button').first().getAttribute('class')));
await shot(A, 'alex', '1-offline-handoff');
const [dl] = await Promise.all([A.waitForEvent('download'), A.getByTestId('downloads-partly').locator('button').first().click()]);
const partly = path.join(OUT, 'partly-signed.pdf'); await dl.saveAs(partly);
const pb = new Uint8Array(fs.readFileSync(partly));
step('alex', 'partly-signed PDF downloaded: 1 signature, 1 signatory row carrying the NAME', (await countSignatureImages(pb)) === 1 && (await codexRows(pb)).length === 1 && (await codexRows(pb))[0].name === 'Alex Seguin', JSON.stringify(await codexRows(pb)));

// 2 · Daniel receives the FILE, uploads it as his own document, signs alone (no backend needed at all)
await D.goto(BASE + '/soi-session/sign/', { waitUntil: 'domcontentloaded' }); await ready(D);
await D.getByPlaceholder(/Promissory/).fill('Promissory Note'); await D.getByTestId('file-input').setInputFiles(partly); await D.getByTestId('file-list').locator('li').first().waitFor({ timeout: 30000 });
await D.getByRole('button', { name: /who signs/ }).click();
await D.getByTestId('signer-name-0').fill('Daniel Vail'); await D.getByTestId('signer-contact-0').fill('512.808.8745');
const rm = D.getByRole('button', { name: /remove/i }); if (await rm.count()) await rm.first().click();
await D.getByRole('button', { name: /place your signature/ }).click();
await placeDrawSign(D, 'dan', 0.66);
await D.getByTestId('downloads').waitFor({ timeout: 60000 }); step('dan', 'COMPLETE on his phone');
await shot(D, 'dan', '2-complete');
const [dl2] = await Promise.all([D.waitForEvent('download'), D.getByTestId('downloads').locator('button').first().click()]);
const final = path.join(OUT, 'fully-signed.pdf'); await dl2.saveAs(final); const fb = new Uint8Array(fs.readFileSync(final));
const rows = await codexRows(fb);
step('dan', 'final PDF: 2 signatures, 2 signatory rows — Alex (row 0, kept by name) and Daniel (row 1)', (await countSignatureImages(fb)) === 2 && rows.length === 2 && rows[0].name === 'Alex Seguin' && rows[1].name === 'Daniel Vail', JSON.stringify(rows.map((r) => [r.rowIndex, r.name])));
const codex = await decodeCodexPdf(fb, (b) => new Uint8Array(zlib.inflateSync(b)));
const all = codex.find((c) => c.name === 'SoICodexAll')?.result?.messageForward || '';
step('dan', 'Light Codex ALL strip names both signatories', /^ALEX SEGUIN 2026\d{10} \. DANIEL VAIL 2026\d{10}$/.test(all), all);
const v = await verifySignedPdf('fully-signed.pdf', fb);
step('dan', 'offline verify: consistent, two envelopes (the file was carried by hand)', v.ok && v.envelopes === 2 && v.images === 2, JSON.stringify(v.issues));
fs.writeFileSync(OUT + '/log.txt', log.join('\n')); await browser.close(); console.log(`\nSIGN OFFLINE HAND-OFF RUN: ${log.length} steps, 0 failures`);
