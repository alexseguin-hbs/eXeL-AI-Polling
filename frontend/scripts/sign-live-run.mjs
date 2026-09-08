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
import { execFileSync } from 'child_process';
import zlib from 'zlib';
import { countSignatureImages, signatureBoxes, textBoxes, codexRows, pageCount as pageCountOf } from '../lib/pdf-stamp.ts';
import { decodeCodexPdf } from '../lib/codex-pdf.ts';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
const pdfText = async (bytes) => { const doc = await getDocument({ data: bytes.slice(), useWorkerFetch: false, isEvalSupported: false, standardFontDataUrl: path.resolve('node_modules/pdfjs-dist/standard_fonts/') + '/', verbosity: 0 }).promise; let t = ''; for (let i = 1; i <= doc.numPages; i++) t += (await (await doc.getPage(i)).getTextContent()).items.map((x) => x.str).join(' ') + '\n'; return t; };

const BASE = process.env.POD_BASE || 'http://127.0.0.1:3210';
const OUT = process.env.OUT || '../docs/assessments/sign-live-run';
fs.mkdirSync(OUT, { recursive: true });
const FIXTURE = path.resolve('tests/fixtures/sign-sample.pdf');
const log = []; const t0 = Date.now();
const step = (who, what, ok = true, extra = '') => { const l = `${String(Date.now() - t0).padStart(6)}ms  ${who.padEnd(5)} ${ok ? 'OK ' : 'FAIL'} ${what}${extra ? '  ' + extra : ''}`; console.log(l); log.push(l); if (!ok) { fs.writeFileSync(OUT + '/log.txt', log.join('\n')); throw new Error(what); } };
const shot = (p, who, name) => p.screenshot({ path: `${OUT}/${name}-${who}.jpg`, type: 'jpeg', quality: 55, fullPage: true });
const ready = async (p) => { await p.waitForSelector('next-route-announcer', { state: 'attached', timeout: 90000 }); await p.waitForTimeout(400); };
// Each phone taps ITS signature line — the box must fit the rule (operator, 2026-09-07). Rules are read from the
// rendered page's pixels in the browser: rows whose longest dark run spans ≥ 15 % of the width (a header rule too).
const rules = {};                                            // who → { page, y, x0, x1 } read back from the PDF at the end (Asar)
const findRules = (p) => p.evaluate(() => {
  const c = document.querySelector('[data-testid="pdf-page"] canvas'); const ctx = c.getContext('2d'); const W = c.width, H = c.height;
  const d = ctx.getImageData(0, 0, W, H).data; const dark = (x, y) => { const i = (y * W + x) * 4; return (d[i] + d[i + 1] + d[i + 2]) / 3 < 200; };
  const out = [];                                            // EVERY run ≥ 15 % of the width — two rules share a row in a two-column block
  for (let y = 0; y < H; y++) {
    let x0 = -1, gap = 0;
    for (let x = 0; x <= W; x++) {
      if (x < W && dark(x, y)) { if (x0 < 0) x0 = x; gap = 0; }
      else if (x0 >= 0 && (++gap > 3 || x === W)) { const x1 = x - gap; if (x1 - x0 >= 0.15 * W) out.push({ y: y / H, x0: x0 / W, x1: x1 / W }); x0 = -1; gap = 0; }
    }
  }
  const merged = []; for (const r of out) { if (merged.some((l) => r.y - l.y < 3 / H && Math.abs(r.x0 - l.x0) < 0.01)) continue; merged.push(r); }
  return merged;
});
// A thumb's scribble, not a sine: a looping cursive run with per-point jitter, a fast cross-stroke, a dot —
// a different seed per phone. Drawn with the pointer on the SignaturePad canvas, so the pad's own smoothing ships.
const scribble = async (p, who) => {
  const c = p.locator('canvas[aria-label]').first(); const b = await c.boundingBox();
  let seed = who === 'alex' ? 7 : 31; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 - 0.5; };
  const W = b.width - 30, mid = b.height * 0.55;
  const stroke = async (pts, steps = 2) => { await p.mouse.move(b.x + pts[0][0], b.y + pts[0][1]); await p.mouse.down(); for (const [x, y] of pts.slice(1)) await p.mouse.move(b.x + x, b.y + y, { steps }); await p.mouse.up(); };
  const run = []; for (let i = 0; i <= 44; i++) { const t = i / 44; const loop = Math.sin(t * Math.PI * 7) * (34 - 18 * t); const back = i % 11 === 5 ? -14 : 0; run.push([15 + t * W * 0.82 + back + rnd() * 5, mid + loop + rnd() * 6]); }
  await stroke(run);
  await stroke([[W * 0.28, mid + 26 + rnd() * 4], [W * 0.78, mid - 30 + rnd() * 4]], 1);            // the cross-stroke
  await stroke([[W * 0.86, mid + 8], [W * 0.87, mid + 11], [W * 0.85, mid + 12]], 1);                // the dot
};
/** Ink on the pad: share of pixels that are not paper, and the width the stroke spans — a blank pad never passes. */
const inkOnPad = (p) => p.locator('canvas[aria-label]').first().evaluate((c) => {
  const ctx = c.getContext('2d'); const d = ctx.getImageData(0, 0, c.width, c.height).data; let ink = 0, x0 = c.width, x1 = 0;
  for (let i = 0; i < d.length; i += 4) { const a = d[i + 3], lum = (d[i] + d[i + 1] + d[i + 2]) / 3; if (a > 40 && lum < 200) { ink++; const x = (i / 4) % c.width; if (x < x0) x0 = x; if (x > x1) x1 = x; } }
  return { share: ink / (c.width * c.height), span: (x1 - x0) / c.width };
});
const placeAndSign = async (p, who) => {
  const page = p.getByTestId('pdf-page'); await page.locator('canvas').first().waitFor({ timeout: 60000 }); step(who, 'PDF page rendered (pdfjs)');
  const bb = await page.boundingBox(); await p.mouse.click(bb.x + bb.width * 0.5, bb.y + bb.height * 0.3);
  await p.getByTestId('sig-box').waitFor();
  // a misplaced signature can be removed and placed again (Enki)
  await p.getByTestId('remove-mark').click(); step(who, 'misplaced signature removed', (await p.getByTestId('sig-box').count()) === 0);
  // find the signature lines: the lender's (left column) for Alex, the borrower's (right column) for Daniel;
  // the block sits in the lower half of the page — turn pages (› ) until a page has two rules on one row
  let pageNo = 1, pair = null;
  if (who === 'alex') {
    // the Divinity Guide reader's gesture, reused: a swipe left turns the page (R-CORE) — never from inside a mark
    const pb0 = await page.boundingBox();
    const touch = (type, x, y) => page.evaluate((el, [type, x, y]) => { const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y }); el.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true })); }, [type, x, y]);
    await touch('touchstart', pb0.x + pb0.width * 0.8, pb0.y + pb0.height * 0.2); await touch('touchend', pb0.x + pb0.width * 0.2, pb0.y + pb0.height * 0.22);
    await p.waitForFunction(() => /Page 2 \/ 2/.test(document.querySelector('[data-testid="pdf-page"]')?.previousElementSibling?.textContent || ''), null, { timeout: 10000 });
    step(who, 'swipe left turns the page (Divinity Guide gesture, reused)  Page 2 / 2'); pageNo = 2; await p.waitForTimeout(500);
  }
  let rule = null;
  for (let tries = 0; tries < 4 && !rule; tries++) {
    const all = (await findRules(p)).filter((r) => r.y > 0.3 && r.x1 - r.x0 < 0.6);
    if (who === 'dan' && rules.alex) {
      // Daniel's page already carries Alex's ink and caption on the lender's row — so the borrower's rule is
      // found by ROW (Alex's recorded y) and column (right of the lender's line), not by the clean-pair shape
      if (pageNo === rules.alex.page) rule = all.find((r) => Math.abs(r.y - rules.alex.y) < 0.006 && r.x0 > rules.alex.x1) ?? null;
    } else {
      // a signature rule stands alone — a table's borders come in stacks (the schedule on page 1)
      const rs = all.filter((r) => !all.some((o) => o !== r && Math.abs(o.y - r.y) > 0.002 && Math.abs(o.y - r.y) < 0.012));
      const byRow = new Map(); for (const r of rs) { const k = Math.round(r.y * 200); byRow.set(k, [...(byRow.get(k) ?? []), r]); }
      pair = [...byRow.values()].map((v) => v.sort((a, b) => a.x0 - b.x0)).find((v) => v.length >= 2 && v[1].x0 - v[0].x0 > 0.3) ?? null;
      if (pair) rule = pair[0];
    }
    if (!rule) { await p.getByTestId('page-next').click(); pageNo++; await p.waitForTimeout(600); }
  }
  step(who, who === 'alex' ? 'signature block found: two rules on one row (lender | borrower)' : "the borrower's rule found on the lender's row, right column (the page already carries Alex's ink)", !!rule, rule ? `page ${pageNo} y=${rule.y.toFixed(3)} x=[${rule.x0.toFixed(2)}–${rule.x1.toFixed(2)}]` + (pair ? ` | [${pair[1].x0.toFixed(2)}–${pair[1].x1.toFixed(2)}]` : '') : 'none');
  rules[who] = { page: pageNo, ...rule };
  const bb2 = await page.boundingBox();                       // the page scrolls when the toolbar shrinks — never reuse a stale box
  await p.mouse.click(bb2.x + bb2.width * (rule.x0 + rule.x1) / 2, bb2.y + bb2.height * (rule.y - 0.012));   // the thumb lands just above the rule
  await p.getByTestId('sig-box').waitFor(); step(who, 'signature box placed by tap');
  const fit = await p.getByTestId('sig-box').getAttribute('data-fit'); const sb = await p.getByTestId('sig-box').boundingBox(); const pb = await page.boundingBox();
  const bx0 = (sb.x - pb.x) / pb.width, bx1 = (sb.x + sb.width - pb.x) / pb.width, bBottom = (sb.y + sb.height - pb.y) / pb.height;
  step(who, 'box FITS the signature line: rule width, bottom on the rule, no taller than the text above', fit === 'underline' && Math.abs(bx0 - rule.x0) < 0.02 && Math.abs(bx1 - rule.x1) < 0.02 && Math.abs(bBottom - rule.y) < 0.012 && sb.height / pb.height < 0.12, `fit=${fit} x=[${bx0.toFixed(3)}–${bx1.toFixed(3)}] bottom=${bBottom.toFixed(3)} rule=[${rule.x0.toFixed(3)}–${rule.x1.toFixed(3)}] y=${rule.y.toFixed(3)} h=${(sb.height / pb.height).toFixed(3)}`);
  step(who, 'the hint says the box was sized to the line', /signature line/i.test(await p.locator('[data-testid="marks-toolbar"] + p').innerText()));
  await shot(p, who, '2b-placed');
  step(who, 'toolbar names the selected box', /signature/i.test(await p.getByTestId('sizing-chip').innerText()));
  // a vertical swipe over the page must NOT move or add a box (Christo, wave 1: pan-y scroll survives)
  const bb3 = await page.boundingBox();
  await p.mouse.move(bb3.x + bb3.width * 0.8, bb3.y + bb3.height * 0.2); await p.mouse.down(); await p.mouse.move(bb3.x + bb3.width * 0.8, bb3.y + bb3.height * 0.5, { steps: 6 }); await p.mouse.up();
  step(who, 'a swipe over the page places nothing', (await p.getByTestId('sig-box').count()) === 1);
  // resize the signature box by its corner handle, then add a date beside it (operator, 2026-09-07)
  const before = await p.getByTestId('sig-box').boundingBox(); const h = await p.getByTestId('resize-handle').boundingBox();
  step(who, 'the resize handle sits at the UPPER-right of the box', h.y < before.y + before.height / 2 && h.x + h.width / 2 > before.x + before.width - 20, `handle at (${Math.round(h.x)},${Math.round(h.y)}) box top ${Math.round(before.y)}`);
  await p.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await p.mouse.down(); await p.mouse.move(h.x + h.width / 2 + 14, h.y + h.height / 2 - 8, { steps: 5 }); await p.mouse.up();
  const after = await p.getByTestId('sig-box').boundingBox();
  step(who, 'upper-right drag grows the box up and right; the BASELINE (bottom edge) stays where it was', after.width > before.width + 6 && after.height > before.height + 2 && Math.abs((after.y + after.height) - (before.y + before.height)) < 2, `${Math.round(before.width)}×${Math.round(before.height)} → ${Math.round(after.width)}×${Math.round(after.height)} px, bottom ${Math.round(before.y + before.height)}→${Math.round(after.y + after.height)}`);
  // an accidental mark goes with one tap on the ✕ badge on the box itself (operator 00:40) — then the date is added for real
  await p.getByTestId('add-date').click(); await p.getByTestId('text-box').waitFor();
  await p.getByTestId('delete-badge').click(); step(who, 'an accidental date is deleted by the ✕ badge on the box', (await p.getByTestId('text-box').count()) === 0 && (await p.getByTestId('sig-box').count()) === 1);
  await p.getByTestId('add-date').click(); await p.getByTestId('text-box').waitFor(); step(who, 'date mark added beside the signature', /\d{4}/.test(await p.getByTestId('mark-text').inputValue()));
  step(who, 'the toolbar delete is labelled', /Delete/.test(await p.getByTestId('remove-mark').innerText()));
  const tb = await p.getByTestId('text-box').boundingBox(), sbb = await p.getByTestId('sig-box').boundingBox();
  step(who, 'the date SNAPS to the document\'s own "Date:" line under the signature (fitted, below the box, one text line tall)', (await p.getByTestId('text-box').getAttribute('data-fit')) === 'underline' && tb.y > sbb.y + sbb.height - 2 && tb.height < sbb.height, `date box ${Math.round(tb.width)}×${Math.round(tb.height)} px at +${Math.round(tb.y - (sbb.y + sbb.height))} px under the signature box`);
  await p.getByTestId('to-draw').click();
  if (who === 'dan' && fs.existsSync(path.join(OUT, 'alex-stroke.png'))) {
    // the OTHER way to sign: upload a signature image (Asar's gap) — Daniel uploads a PNG of a stroke
    await p.locator('input[type="file"][accept*="image/png"]').setInputFiles(path.join(OUT, 'alex-stroke.png'));
    await p.locator('img[src^="data:image/png"]').first().waitFor({ timeout: 10000 });
    step(who, 'signature UPLOADED as a PNG image (the second way to sign) — preview shown on the pad');
  } else {
    await scribble(p, who); const ink = await inkOnPad(p);
    step(who, 'signature SCRIBBLED with the pointer — ink on the pad, spanning it', ink.share > 0.015 && ink.span > 0.6, `ink ${(ink.share * 100).toFixed(1)} % of the pad, span ${(ink.span * 100).toFixed(0)} %`);
    if (who === 'alex') { const durl = await p.locator('canvas[aria-label]').first().evaluate((c) => c.toDataURL('image/png')); fs.writeFileSync(path.join(OUT, 'alex-stroke.png'), Buffer.from(durl.split(',')[1], 'base64')); }
  }
  await shot(p, who, '3-draw');
  // back to the page: the scribble previews inside the fitted box, on the rule (what the PDF will carry)
  await p.getByRole('button', { name: /Back/ }).click(); await p.getByTestId('sig-box').locator('img').waitFor({ timeout: 10000 });
  step(who, 'the scribble previews inside the box, on the signature line'); await shot(p, who, '3b-preview');
  await p.getByTestId('to-draw').click();
  if (who === 'alex') {
    // the draft survives a reload (and, on the live site, the Auth0 redirect at save) — Enki's gap, wave 3
    await p.reload({ waitUntil: 'domcontentloaded' }); await ready(p);
    await p.getByTestId('resumed').waitFor({ timeout: 60000 });
    const kept = (await p.getByTestId('stroke-kept').count()) === 1 && (await p.getByTestId('sign-button').isEnabled());
    step(who, 'reload mid-flow → draft restored (files, signers, boxes, stroke) at the draw step', kept);
  }
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
// the page diagnoses itself: "Why can't I sign?" → six live rows + one sentence (operator, "I still cannot sign")
await A.getByTestId('diag-toggle').click(); await A.getByTestId('diag-panel').waitFor();
await A.waitForFunction(() => !/checking/.test(document.querySelector('[data-testid="diag-todo"]')?.textContent || ''), null, { timeout: 30000 });
const diag = { rpc: await A.getByTestId('diag-rpc').innerText(), worker: await A.getByTestId('diag-worker').innerText(), auth: await A.getByTestId('diag-auth').innerText(), build: await A.getByTestId('diag-build').innerText(), todo: await A.getByTestId('diag-todo').innerText() };
step('alex', 'diag: 036 RPC answers · pdf worker loaded · login not required · build named', /036 is applied/.test(diag.rpc) && /loaded/.test(diag.worker) && /not required/.test(diag.auth) && diag.build.length >= 3 && /Everything this page depends on answers/.test(diag.todo), JSON.stringify(diag));
await shot(A, 'alex', '0-diag');
await A.getByTestId('diag-toggle').click();
await A.getByPlaceholder(/Promissory/).fill('Promissory Note');
await A.getByTestId('file-input').setInputFiles(FIXTURE);
await A.getByTestId('file-list').locator('li').first().waitFor({ timeout: 30000 }); step('alex', 'PDF uploaded, hashed, page-counted');
await shot(A, 'alex', '1-upload');
await A.getByRole('button', { name: /who signs/ }).click();
// the operator's real contacts (ask 23:05): the creator by e-mail, the second signer by phone
await A.getByTestId('signer-name-0').fill('Alex Seguin'); await A.getByTestId('signer-contact-0').fill('explore@eXeL-AI.com');
await A.getByTestId('signer-name-1').fill('Daniel Vail'); await A.getByTestId('signer-contact-1').fill('512.808.8745');
step('alex', 'two signers named (explore@eXeL-AI.com · 512.808.8745)');
await shot(A, 'alex', '2-signers');
await A.getByRole('button', { name: /place your signature/ }).click();

// 2 · Alex places, draws, signs → hand-off link
await placeAndSign(A, 'alex');
const linkEl = A.getByTestId('handoff-link'); await linkEl.waitFor({ timeout: 60000 });
const link = (await linkEl.innerText()).trim(); step('alex', 'saved — hand-off link minted for Daniel', /\/soi-session\/sign\/\?e=[A-Za-z0-9_-]{22}#s=[A-Za-z0-9_-]{22}$/.test(link), link.slice(0, 60) + '…');
await shot(A, 'alex', '4-handoff');
const myLink = (await A.getByTestId('my-link').locator('code').innerText()).trim(); step('alex', 'creator keeps his own return link', /\?e=[A-Za-z0-9_-]{22}#s=[A-Za-z0-9_-]{22}$/.test(myLink) && myLink !== link);
const smsHref = await A.getByRole('link', { name: /Send by text/ }).getAttribute('href');
step('alex', 'phone path: sms: composer prefilled to 512.808.8745 with the default script + the link', smsHref.startsWith('sms:5128088745') && /Alex%20Seguin%20asks%20you%20to%20sign/.test(smsHref) && smsHref.includes(encodeURIComponent(link)), smsHref.slice(0, 70) + '…');
const mailHref = await A.getByRole('link', { name: /Send by e-mail/ }).getAttribute('href');
step('alex', 'e-mail path (phone contact): mailto: composer carries the same script + link', mailHref.startsWith('mailto:?subject=') && mailHref.includes(encodeURIComponent(link)), mailHref.slice(0, 60) + '…');
// the roster masks the operator's contacts — a countersigner sees ex***@exel-ai.com / ***8745, never the whole address
const rosterA = await A.getByTestId('roster').innerText();
step('alex', 'contacts masked on the roster (ex***@… · ***8745)', /ex\*\*\*@/i.test(rosterA) && /\*\*\*8745/.test(rosterA), rosterA.replace(/\s+/g, ' ').slice(0, 90));

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
// geometry (Asar, wave 1 → 4): each stamp sits on ITS signature line — the lender's for Alex, the borrower's for
// Daniel — starting at the rule's left edge, bottom on the rule, widened by the corner drag (distinct boxes)
const boxes = await signatureBoxes(bytes);
const expect = [rules.alex, rules.dan];
step('dan', 'each stamp sits on ITS signature line (left edge + bottom on the rule), widened, distinct', boxes.length === 2 && boxes.every((b, i) => b.page === expect[i].page && Math.abs(b.x - expect[i].x0) < 0.03 && Math.abs(b.y + b.h - expect[i].y) < 0.012 && b.w > expect[i].x1 - expect[i].x0 + 0.02) && Math.abs(boxes[0].x - boxes[1].x) > 0.2, JSON.stringify(boxes.map((b) => [b.page, +b.x.toFixed(2), +b.y.toFixed(2), +b.w.toFixed(2)])));
const texts = await textBoxes(bytes); step('dan', 'two date marks stamped (one per signer)', texts.length === 2, `SoITxt count = ${texts.length}`);
// SHOW the result: the signed page, the signature rows and the signatory block rendered to PNG (pdfjs in Chromium)
const render = (name, env) => { execFileSync('node', ['scripts/render-pdf-page.mjs'], { env: { ...process.env, PDF: file, OUT: path.join(OUT, name), ...env }, stdio: 'pipe' }); return fs.existsSync(path.join(OUT, name)) && fs.statSync(path.join(OUT, name)).size > 800; };   // the bottom-edge crop is mostly paper
const pg = String(boxes[0]?.page ?? 2);
step('dan', 'signed page rendered to PNG (whole page · signature rows · signatory block)', render('signed-page.png', { PAGE: pg, SCALE: '1.4' }) && render('signed-block.png', { PAGE: pg, SCALE: '3', CROP: `0.08,${(expect[0].y - 0.045).toFixed(3)},0.84,0.10` }) && render('signed-codex.png', { PAGE: pg, SCALE: '3', CROP: '0.46,0.955,0.54,0.045' }));
const rows = await codexRows(bytes); step('dan', 'signatory rows recorded in the file (keywords): two, with time + hash', rows.length === 2 && rows[0].rowIndex === 0 && rows[1].rowIndex === 1 && rows.every((r) => /^\d{4}-\d{2}-\d{2}T/.test(r.isoDate)), JSON.stringify(rows.map((r) => [r.rowIndex, r.isoDate, r.hash])));
// offline verify (Pangu): the DONE block reads the downloaded file back — green; the unsigned fixture — "no signatures"
await D.getByTestId('verify-input').setInputFiles(file); await D.getByTestId('verify-result').waitFor({ timeout: 30000 });
const vr = D.getByTestId('verify-result'); step('dan', 'verify-a-signed-file: the downloaded PDF reads green (2 signatures, chain holds)', (await vr.getAttribute('data-ok')) === '1' && /2 signatures/.test(await vr.innerText()), (await vr.innerText()).replace(/\s+/g, ' ').slice(0, 120));
// the digital signature ALWAYS pairs with the physical one (operator 23:15): one "name · time · #hash" line per SoISig
const txt = await pdfText(bytes); const dl1 = (txt.match(/Alex Seguin · 2026-\d\d-\d\dT[^ ]+ · #[0-9a-f]{8}/g) || []).length, dl2 = (txt.match(/Daniel Vail · 2026-\d\d-\d\dT[^ ]+ · #[0-9a-f]{8}/g) || []).length;
step('dan', 'digital signature pairs with each physical one: 2 SoISig images ↔ 2 digital lines in the page text', n === 2 && dl1 === 1 && dl2 === 1, `Alex ×${dl1} · Daniel ×${dl2}`);
// the Light Codex strips read back from the PDF's own pixels: one per signatory + ALL signatories
const codex = await decodeCodexPdf(bytes, (b) => new Uint8Array(zlib.inflateSync(b))); const byName = Object.fromEntries(codex.map((c) => [c.name, c.result?.messageForward]));
step('dan', 'Light Codex from the PDF: the HIDDEN helix on the bottom edge decodes, reverse-verified, no box drawn', codex.length > 0 && codex.every((c) => c.result?.verified && c.result.style === 'Hidden Helix') && !/Signatories|Digitally signed/.test(txt), JSON.stringify(byName));
step('dan', 'Light Codex ALL strip carries every signatory in one line', /^ALEX SEGUIN 2026\d{10} \. DANIEL VAIL 2026\d{10}$/.test(byName.SoICodexAll || ''), byName.SoICodexAll);
const pagesWithCodex = [...new Set(codex.map((c) => c.page))].sort();
step('dan', 'the hidden Light Codex is on EVERY signed page, not just the last (operator 23:25)', pagesWithCodex.length === (await pageCountOf(bytes)) && codex.length === pagesWithCodex.length, `pages ${pagesWithCodex.join(',')} · ${codex.length} strips`);
step('dan', 'page 1 bottom-right rendered to PNG (initials; the codex line is invisible)', render('signed-codex-p1.png', { PAGE: '1', SCALE: '3', CROP: '0.46,0.955,0.54,0.045' }));
// initials, always bottom-right of EACH page (operator 2026-09-08): "AS   DV" on every page's text, below the block
{ const doc = await getDocument({ data: bytes.slice(), useWorkerFetch: false, isEvalSupported: false, standardFontDataUrl: path.resolve('node_modules/pdfjs-dist/standard_fonts/') + '/', verbosity: 0 }).promise; let np = 0; for (let i = 1; i <= doc.numPages; i++) { const t = (await (await doc.getPage(i)).getTextContent()).items.map((x) => x.str).join(' '); if (/AS\s+DV/.test(t)) np++; }
  step('dan', 'initials AS · DV at the bottom-right of EVERY page', np === doc.numPages && np === 2, `${np}/${doc.numPages} pages`); }
await D.getByTestId('verify-input').setInputFiles(FIXTURE); await D.waitForFunction(() => document.querySelector('[data-testid="verify-result"]')?.getAttribute('data-ok') === '0', null, { timeout: 30000 });
step('dan', 'verify-a-signed-file: the unsigned fixture reads "no signatures"', /No eXeL signatures/.test(await vr.innerText()));
await shot(D, 'dan', '6b-verify');

// 4b · the Light Codex page unlocks the signatories by UPLOADING THE PDF (PNG still works) — operator 23:15
await D.goto(BASE + '/light-codex/', { waitUntil: 'domcontentloaded' }); await ready(D);
await D.getByRole('button', { name: /^Decode$/ }).click(); await D.getByTestId('codex-decode-input').setInputFiles(file);
await D.getByTestId('codex-pdf-results').waitFor({ timeout: 30000 });
const allText = await D.getByTestId('codex-all').innerText(); const rowN = await D.getByTestId('codex-row').count();
step('dan', 'Light Codex page: uploading the signed PDF lists ALL signatories from the hidden line', /ALEX SEGUIN 2026\d{10} \. DANIEL VAIL 2026\d{10}/.test(allText) && /Hidden Helix/.test(allText) && rowN === 0, allText.replace(/\s+/g, ' ').slice(0, 110));
await shot(D, 'dan', '6c-codex-pdf');

// 5 · Alex reopens with HIS OWN link (kept from the hand-off) and sees the completed document
await A.goto(myLink, { waitUntil: 'domcontentloaded' }); await ready(A);
await A.getByTestId('downloads').waitFor({ timeout: 60000 }); step('alex', 'creator reopens with his own link → COMPLETE, downloads offered');
await shot(A, 'alex', '7-complete');

fs.writeFileSync(OUT + '/log.txt', log.join('\n'));
await browser.close(); console.log(`\nSIGN 2-PHONE LIVE RUN: ${log.length} steps, 0 failures`);
