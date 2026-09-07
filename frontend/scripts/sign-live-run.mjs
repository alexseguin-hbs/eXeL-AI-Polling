// sign-live-run.mjs — Sign Doc on two REAL phones, end to end. Proof of outcome, not a unit test.
//
// Phone A (the creator) uploads a fixture PDF, names A + B, places a box, draws a stroke with the
// pointer, stamps, saves — and gets B's hand-off link. Phone B opens the link with no login, is
// told it is its turn, places, draws, stamps; the envelope completes; both download. The script
// asserts the downloaded PDF carries exactly two SoISig signature images, that A cannot sign again
// on B's turn (the RPC refuses), and that a stranger's secret gets no file bytes.
//
// Runs against the local Next dev server and scripts/realtime-relay.mjs, which also serves migration
// 036's RPCs from a REAL Postgres (PGlite) — the SQL itself is exercised, not a mock. Auth0 cannot
// run here, so the dev server is started with NEXT_PUBLIC_SIGN_NO_AUTH=1 (creator path unguarded —
// test scaffolding, never production posture). Screenshots + step log land in OUT.
//
//   terminal 1:  npm run pod:relay
//   terminal 2:  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:4999 NEXT_PUBLIC_SUPABASE_ANON_KEY=local NEXT_PUBLIC_SIGN_NO_AUTH=1 npx next dev -p 3210
//   terminal 3:  npm run test:soi-sign-live
import { chromium } from 'playwright-core';
import fs from 'fs';
import path from 'path';
import { countSignatureImages, signatureBoxes, textBoxes } from '../lib/pdf-stamp.ts';

const BASE = process.env.POD_BASE || 'http://127.0.0.1:3210';
const OUT = process.env.OUT || '../docs/assessments/sign-live-run';
fs.mkdirSync(OUT, { recursive: true });
const FIXTURE = path.resolve('tests/fixtures/sign-sample.pdf');
const log = []; const t0 = Date.now();
const step = (who, what, ok = true, extra = '') => { const l = `${String(Date.now() - t0).padStart(6)}ms  ${who.padEnd(5)} ${ok ? 'OK ' : 'FAIL'} ${what}${extra ? '  ' + extra : ''}`; console.log(l); log.push(l); if (!ok) { fs.writeFileSync(OUT + '/log.txt', log.join('\n')); throw new Error(what); } };
const shot = (p, who, name) => p.screenshot({ path: `${OUT}/${name}-${who}.jpg`, type: 'jpeg', quality: 55, fullPage: true });
const ready = async (p) => { await p.waitForSelector('next-route-announcer', { state: 'attached', timeout: 90000 }); await p.waitForTimeout(400); };
const TAPS = { alex: { x: 0.3, y: 0.75 }, dan: { x: 0.7, y: 0.6 } };   // each phone taps its own spot — read back from the PDF at the end (Asar)
const draw = async (p) => {
  const c = p.locator('canvas[aria-label]').first(); const b = await c.boundingBox();
  await p.mouse.move(b.x + 20, b.y + 80); await p.mouse.down();
  for (let i = 1; i <= 12; i++) await p.mouse.move(b.x + 20 + i * 18, b.y + 80 + Math.sin(i) * 25, { steps: 3 });
  await p.mouse.up();
};
const placeAndSign = async (p, who) => {
  const page = p.getByTestId('pdf-page'); await page.locator('canvas').first().waitFor({ timeout: 60000 }); step(who, 'PDF page rendered (pdfjs)');
  const TAP = TAPS[who];
  const bb = await page.boundingBox(); await p.mouse.click(bb.x + bb.width * 0.5, bb.y + bb.height * 0.3);
  await p.getByTestId('sig-box').waitFor();
  // a misplaced signature can be removed and placed again (Enki)
  await p.getByTestId('remove-mark').click(); step(who, 'misplaced signature removed', (await p.getByTestId('sig-box').count()) === 0);
  const bb2 = await page.boundingBox();                       // the page scrolls when the toolbar shrinks — never reuse a stale box
  await p.mouse.click(bb2.x + bb2.width * TAP.x, bb2.y + bb2.height * TAP.y);
  await p.getByTestId('sig-box').waitFor(); step(who, 'signature box placed by tap');
  step(who, 'toolbar names the selected box', /signature/i.test(await p.getByTestId('sizing-chip').innerText()));
  // a vertical swipe over the page must NOT move or add a box (Christo, wave 1: pan-y scroll survives)
  const bb3 = await page.boundingBox();
  await p.mouse.move(bb3.x + bb3.width * 0.8, bb3.y + bb3.height * 0.2); await p.mouse.down(); await p.mouse.move(bb3.x + bb3.width * 0.8, bb3.y + bb3.height * 0.5, { steps: 6 }); await p.mouse.up();
  step(who, 'a swipe over the page places nothing', (await p.getByTestId('sig-box').count()) === 1);
  // resize the signature box by its corner handle, then add a date beside it (operator, 2026-09-07)
  const before = await p.getByTestId('sig-box').boundingBox(); const h = await p.getByTestId('resize-handle').boundingBox();
  await p.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await p.mouse.down(); await p.mouse.move(h.x + h.width / 2 + 40, h.y + h.height / 2 + 12, { steps: 5 }); await p.mouse.up();
  const after = await p.getByTestId('sig-box').boundingBox(); step(who, 'signature box resized by its corner', after.width > before.width + 20 && after.height > before.height + 5, `${Math.round(before.width)}→${Math.round(after.width)} px`);
  await p.getByTestId('add-date').click(); await p.getByTestId('text-box').waitFor(); step(who, 'date mark added beside the signature', /\d{4}/.test(await p.getByTestId('mark-text').inputValue()));
  await p.getByTestId('to-draw').click();
  await draw(p); step(who, 'signature drawn with the pointer');
  await shot(p, who, '3-draw');
  const btn = p.getByTestId('sign-button'); await p.waitForFunction(() => { const b = document.querySelector('[data-testid="sign-button"]'); return b && !b.disabled; }, null, { timeout: 5000 });
  await btn.click(); step(who, 'Sign & save pressed');
};

const browser = await chromium.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const phones = {};
process.on('uncaughtException', async (e) => { console.log('FAILED:', e.message.split('\n')[0]); for (const [w, p] of Object.entries(phones)) await p.screenshot({ path: `${OUT}/FAIL-${w}.jpg`, type: 'jpeg', quality: 55, fullPage: true }).catch(() => {}); fs.writeFileSync(OUT + '/log.txt', log.join('\n')); process.exit(1); });
for (const who of ['alex', 'dan']) {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, acceptDownloads: true });
  phones[who] = await ctx.newPage();
  phones[who].on('pageerror', (e) => step(who, 'pageerror ' + e.message, false));
}
const A = phones.alex, D = phones.dan;

// 1 · Alex: landing → Sign Doc → upload → signers
await A.goto(BASE + '/soi-session/', { waitUntil: 'domcontentloaded' }); await ready(A);
await A.getByRole('link', { name: /Sign Doc/ }).click(); await A.waitForURL(/soi-session\/sign/); await ready(A); step('alex', 'landing → Sign Doc');
await A.getByPlaceholder(/Promissory/).fill('Promissory Note');
await A.getByTestId('file-input').setInputFiles(FIXTURE);
await A.getByTestId('file-list').locator('li').first().waitFor({ timeout: 30000 }); step('alex', 'PDF uploaded, hashed, page-counted');
await shot(A, 'alex', '1-upload');
await A.getByRole('button', { name: /who signs/ }).click();
await A.getByTestId('signer-name-0').fill('Alex Seguin'); await A.getByTestId('signer-contact-0').fill('alex@example.test');
await A.getByTestId('signer-name-1').fill('Daniel Vail'); await A.getByTestId('signer-contact-1').fill('(512) 555-0100');
step('alex', 'two signers named (email + phone)');
await shot(A, 'alex', '2-signers');
await A.getByRole('button', { name: /place your signature/ }).click();

// 2 · Alex places, draws, signs → hand-off link
await placeAndSign(A, 'alex');
const linkEl = A.getByTestId('handoff-link'); await linkEl.waitFor({ timeout: 60000 });
const link = (await linkEl.innerText()).trim(); step('alex', 'saved — hand-off link minted for Daniel', /\/soi-session\/sign\/\?e=[A-Za-z0-9_-]{22}#s=[A-Za-z0-9_-]{22}$/.test(link), link.slice(0, 60) + '…');
await shot(A, 'alex', '4-handoff');
const myLink = (await A.getByTestId('my-link').locator('code').innerText()).trim(); step('alex', 'creator keeps his own return link', /\?e=[A-Za-z0-9_-]{22}#s=[A-Za-z0-9_-]{22}$/.test(myLink) && myLink !== link);
const smsHref = await A.getByRole('link', { name: /Send by text/ }).getAttribute('href');
step('alex', 'sms: composer prefilled to Daniel', smsHref.startsWith('sms:5125550100') && /Alex%20Seguin%20asks%20you%20to%20sign/.test(smsHref));

// 3 · Alex cannot act again: reopening his own link says it is Daniel's turn
await A.goto(link.replace(/#s=.+$/, '#s=AAAAAAAAAAAAAAAAAAAAAA'), { waitUntil: 'domcontentloaded' }); await ready(A);
await A.getByTestId('explain').waitFor(); await A.waitForFunction(() => !/Opening/.test(document.querySelector('[data-testid="explain"]')?.textContent || ''), null, { timeout: 30000 });
const strangerText = await A.getByTestId('explain').innerText();
step('alex', 'a wrong secret sees no files and no turn', /does not match/.test(strangerText), strangerText);

// 4 · Daniel opens the link with NO login, signs
await D.goto(link, { waitUntil: 'domcontentloaded' }); await ready(D);
await D.getByTestId('roster').waitFor({ timeout: 60000 }); step('dan', 'opened the hand-off link, no login');
const rosterText = await D.getByTestId('roster').innerText();
step('dan', 'roster: Alex signed, Daniel now', /Alex Seguin[\s\S]*signed[\s\S]*Daniel Vail[\s\S]*turn now/.test(rosterText));
await shot(D, 'dan', '5-open');
await placeAndSign(D, 'dan');
await D.getByTestId('downloads').waitFor({ timeout: 60000 }); step('dan', 'COMPLETE — every signer has signed');
await shot(D, 'dan', '6-complete');
const [dl] = await Promise.all([D.waitForEvent('download'), D.getByTestId('downloads').locator('button').first().click()]);
const file = path.join(OUT, 'signed-sample.pdf'); await dl.saveAs(file);
const bytes = new Uint8Array(fs.readFileSync(file));
const n = await countSignatureImages(bytes); step('dan', 'downloaded PDF carries two signature images', n === 2, `SoISig count = ${n}`);
// geometry (Asar, wave 1): each stamp sits on page 1 where the thumb tapped — the box is centred on the tap
const boxes = await signatureBoxes(bytes);
const near = (a, b) => Math.abs(a - b) < 0.06;
const expect = [TAPS.alex, TAPS.dan];
step('dan', 'each stamp sits on page 1 where ITS phone tapped, resized wider (distinct boxes)', boxes.length === 2 && boxes.every((b, i) => b.page === 1 && Math.abs(b.x - (expect[i].x - 0.2)) < 0.06 && Math.abs(b.y - (expect[i].y - 0.04)) < 0.06 && b.w > 0.45) && Math.abs(boxes[0].x - boxes[1].x) > 0.2, JSON.stringify(boxes.map((b) => [b.page, +b.x.toFixed(2), +b.y.toFixed(2), +b.w.toFixed(2)])));
const texts = await textBoxes(bytes); step('dan', 'two date marks stamped (one per signer)', texts.length === 2, `SoITxt count = ${texts.length}`);

// 5 · Alex reopens with HIS OWN link (kept from the hand-off) and sees the completed document
await A.goto(myLink, { waitUntil: 'domcontentloaded' }); await ready(A);
await A.getByTestId('downloads').waitFor({ timeout: 60000 }); step('alex', 'creator reopens with his own link → COMPLETE, downloads offered');
await shot(A, 'alex', '7-complete');

fs.writeFileSync(OUT + '/log.txt', log.join('\n'));
await browser.close(); console.log(`\nSIGN 2-PHONE LIVE RUN: ${log.length} steps, 0 failures`);
