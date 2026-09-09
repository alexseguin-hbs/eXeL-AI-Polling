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
  const c = p.locator('canvas[aria-label]').first(); await c.waitFor({ state: 'visible' }); await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(200); const b = await c.boundingBox();  // the pad on screen and hydrated before the pointer draws (a first run after a recompile once drew 0 % ink)
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
/** The physical initials, drawn on the second pad. */
const drawInitials = async (p, who) => {
  const c = p.locator('canvas[aria-label="Draw your initials"]'); await c.waitFor(); const b = await c.boundingBox();
  await p.mouse.move(b.x + 20, b.y + 60); await p.mouse.down(); for (let i = 1; i <= 10; i++) await p.mouse.move(b.x + 20 + i * 9, b.y + 60 + (i % 2 ? -22 : 18), { steps: 2 }); await p.mouse.up();
  step(who, 'initials DRAWN on the second pad (physical initials, operator 00:50)');
};
const placeAndSign = async (p, who) => {
  const page = p.getByTestId('pdf-page'); await page.locator('canvas').first().waitFor({ timeout: 60000 }); step(who, 'PDF page rendered (pdfjs)');
  if (who === 'dan' && (await p.getByTestId('sig-box').count()) === 1) {
    // Daniel LANDS on the placeholders Alex left: signature on the borrower's line, date on its Date line (operator 00:50)
    const sb = await p.getByTestId('sig-box').boundingBox(); const pb = await page.boundingBox(); const tb = await p.getByTestId('text-box').boundingBox();
    const fit = await p.getByTestId('sig-box').getAttribute('data-fit'); const x0 = (sb.x - pb.x) / pb.width, bottom = (sb.y + sb.height - pb.y) / pb.height;
    rules.dan = { page: 2, y: bottom, x0, x1: (sb.x + sb.width - pb.x) / pb.width };
    step(who, 'placeholders pre-placed: signature on the BORROWER line (right column, same row as Alex), date under it', fit === 'holder' && x0 > rules.alex.x1 && Math.abs(bottom - rules.alex.y) < 0.01 && tb && tb.y > sb.y + sb.height - 2, `sig x=${x0.toFixed(3)} bottom=${bottom.toFixed(3)} (Alex's rule y=${rules.alex.y.toFixed(3)})`);
    await shot(p, who, '2b-placed');
    await p.getByTestId('to-draw').click();
    await scribble(p, who); const ink = await inkOnPad(p);
    step(who, 'signature SCRIBBLED with the pointer — ink on the pad, spanning it', ink.share > 0.015 && ink.span > 0.6, `ink ${(ink.share * 100).toFixed(1)} % of the pad, span ${(ink.span * 100).toFixed(0)} %`);
    await drawInitials(p, who);
    // the record's time zone (operator 2026-09-09): Central (Austin) by default, changeable here, the device's zone one tap away, no location read
  step(who, 'the draw step offers the record\'s time zone: Central (Austin, Texas) by default, spelled now in CDT/CST, with the device option and the disclaimer', (await p.getByTestId('tz-select').inputValue()) === 'America/Chicago' && /C[DS]T · \d{4}\.\d\d\.\d\d \d\d:\d\d:\d\d C[DS]T/.test(await p.getByTestId('tz-now').innerText()) && (await p.getByTestId('tz-device').count()) === 1 && /never from your location/.test(await p.getByTestId('tz-box').innerText()), await p.getByTestId('tz-now').innerText());
  const btn = p.getByTestId('sign-button'); await p.waitForFunction(() => { const b = document.querySelector('[data-testid="sign-button"]'); return b && !b.disabled; }, null, { timeout: 5000 });
    await btn.click(); step(who, 'Sign & save pressed'); return;
  }
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
    await p.waitForFunction(() => /(^|[^0-9])2 \/ 2/.test(document.querySelector('[data-testid="pdf-scroller"]')?.previousElementSibling?.textContent || ''), null, { timeout: 10000 });
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
  if (who === 'alex') {
    // AI placement (operator 01:25): the model (mocked here) is asked, the box lands on the lender's rule, then it is removed so the thumb path is proven too
    await p.getByTestId('ai-find').click(); await p.getByTestId('sig-box').waitFor({ timeout: 15000 });
    const ab = await p.getByTestId('sig-box').boundingBox(); const apb = await page.boundingBox(); const ax0 = (ab.x - apb.x) / apb.width, aBottom = (ab.y + ab.height - apb.y) / apb.height;
    step(who, 'AI: find my line → the box lands on the lender\'s rule (provider answered through /api/ai)', (await p.getByTestId('sig-box').getAttribute('data-fit')) === 'ai' && Math.abs(ax0 - rule.x0) < 0.02 && Math.abs(aBottom - rule.y) < 0.012 && /AI placed it/.test(await p.locator('[data-testid="marks-toolbar"] + p').innerText()), `x=${ax0.toFixed(3)} bottom=${aBottom.toFixed(3)} rule=${rule.x0.toFixed(3)}/${rule.y.toFixed(3)}`);
    await p.getByTestId('remove-mark').click(); await p.waitForTimeout(200);
  }
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
  await p.getByTestId('remove-mark').click(); step(who, 'an accidental date is deleted by the red Delete under the page (nothing sits on the box)', (await p.getByTestId('text-box').count()) === 0 && (await p.getByTestId('sig-box').count()) === 1 && (await p.getByTestId('delete-badge').count()) === 0);
  await p.getByTestId('add-date').click(); await p.getByTestId('text-box').waitFor(); step(who, 'date mark added beside the signature', /\d{4}/.test(await p.getByTestId('mark-text').inputValue()));
  step(who, 'the toolbar delete names what it deletes', /Delete · date/.test(await p.getByTestId('remove-mark').innerText()));
  // ⌶ Same size (operator 2026-09-08 22:40): a second text mark, made taller, then every text mark to ONE height with its bottom kept
  { await p.getByTestId('add-text').click(); await p.waitForTimeout(150);
    // + Text lands BELOW the last entry (the date): same left edge, same size, one line down (operator 2026-09-08 22:55)
    { const bx = await p.getByTestId('text-box').evaluateAll((ns) => ns.map((n) => ({ l: parseFloat(n.style.left), t: parseFloat(n.style.top), h: parseFloat(n.style.height) })));
      step(who, '+ Text goes below the last entered date: same left edge, one line down, same size', bx.length === 2 && Math.abs(bx[1].l - bx[0].l) < 0.6 && bx[1].t > bx[0].t + bx[0].h - 0.05 && bx[1].t < bx[0].t + bx[0].h * 2.5 && Math.abs(bx[1].h - bx[0].h) < 0.05, `date at (${bx[0]?.l.toFixed(1)}%, ${bx[0]?.t.toFixed(1)}%) h ${bx[0]?.h.toFixed(2)} · text at (${bx[1]?.l.toFixed(1)}%, ${bx[1]?.t.toFixed(1)}%) h ${bx[1]?.h.toFixed(2)}`); }
    const bigger = p.getByTestId('marks-toolbar').locator('button', { hasText: /^\+$/ }); await bigger.click(); await bigger.click(); await p.waitForTimeout(100);
    const hs0 = await p.getByTestId('text-box').evaluateAll((ns) => ns.map((n) => [parseFloat(n.style.height), parseFloat(n.style.top) + parseFloat(n.style.height)]));
    await p.getByTestId('text-same-size').click(); await p.waitForTimeout(150);
    const hs1 = await p.getByTestId('text-box').evaluateAll((ns) => ns.map((n) => [parseFloat(n.style.height), parseFloat(n.style.top) + parseFloat(n.style.height)]));
    step(who, '⌶ Same size: two text marks of different heights become one height, each bottom where it was', hs0.length === 2 && Math.abs(hs0[0][0] - hs0[1][0]) > 0.3 && Math.abs(hs1[0][0] - hs1[1][0]) < 0.05 && hs1.every((h, i) => Math.abs(h[1] - hs0[i][1]) < 0.05), `heights ${hs0.map((h) => h[0].toFixed(2)).join('/')}% → ${hs1.map((h) => h[0].toFixed(2)).join('/')}%`);
    await p.getByTestId('remove-mark').click(); await p.waitForTimeout(100); }   // the extra text goes; the date stays for the steps that follow
  // with NOTHING to follow, + Text lands in the centre of the CURRENT VIEW (zoom + scroll), not the page centre: page 1 holds no mark
  if (who === 'alex') { await p.getByTestId('page-prev').click(); await p.waitForTimeout(700); await p.getByTestId('zoom-in').click(); await p.waitForTimeout(600);
    await p.getByTestId('pdf-scroller').evaluate((sc) => { sc.scrollTop = 90; sc.scrollLeft = 40; }); await p.waitForTimeout(150);
    const want = await p.evaluate(() => { const h = document.querySelector('[data-testid="pdf-page"]').getBoundingClientRect(), s = document.querySelector('[data-testid="pdf-scroller"]').getBoundingClientRect(); const l = Math.max(h.left, s.left, 0), t = Math.max(h.top, s.top, 0), r = Math.min(h.right, s.right, innerWidth), b = Math.min(h.bottom, s.bottom, innerHeight); return { x: ((l + r) / 2 - h.left) / h.width, y: ((t + b) / 2 - h.top) / h.height }; });
    await p.getByTestId('add-text').click(); await p.waitForTimeout(150);
    const got = await p.getByTestId('text-box').first().evaluate((n) => ({ x: (parseFloat(n.style.left) + parseFloat(n.style.width) / 2) / 100, y: (parseFloat(n.style.top) + parseFloat(n.style.height) / 2) / 100 }));
    step(who, '+ Text with no entry on the page lands at the centre of the current view (zoomed and scrolled), not the page centre', Math.abs(got.x - want.x) < 0.08 && Math.abs(got.y - want.y) < 0.08 && Math.hypot(got.x - 0.5, got.y - 0.5) > 0.03, `view centre (${want.x.toFixed(2)}, ${want.y.toFixed(2)}) · mark centre (${got.x.toFixed(2)}, ${got.y.toFixed(2)})`);
    await p.getByTestId('remove-mark').click(); await p.getByTestId('zoom-reset').click(); await p.waitForTimeout(400); await p.getByTestId('page-next').click(); await p.waitForTimeout(700); }
  const tb = await p.getByTestId('text-box').boundingBox(), sbb = await p.getByTestId('sig-box').boundingBox();
  step(who, 'the date SNAPS to the document\'s own "Date:" line under the signature (fitted, below the box, one text line tall)', (await p.getByTestId('text-box').getAttribute('data-fit')) === 'underline' && tb.y > sbb.y + sbb.height - 2 && tb.height < sbb.height, `date box ${Math.round(tb.width)}×${Math.round(tb.height)} px at +${Math.round(tb.y - (sbb.y + sbb.height))} px under the signature box`);
  // ZOOM (operator 2026-09-08): + zooms the page 1.5× inside the scroller; the marks keep their page fractions (they scale
  // with the page), a drag at zoom moves finer, ⌖ snaps the selected mark onto its line, and the reset returns to 100 %
  const fr = async (id) => { const el = p.getByTestId(id); return { x: parseFloat(await el.evaluate((n) => n.style.left)), w: parseFloat(await el.evaluate((n) => n.style.width)) }; };
  const f0 = await fr('sig-box'), w0 = (await page.boundingBox()).width;
  const probe = async (id, label) => { const b = await p.getByTestId(id).boundingBox(); const r = await p.evaluate(([x, y, id]) => { const c = document.querySelector('[data-testid="pdf-page"] canvas'); const box = document.querySelector(`[data-testid="${id}"]`); const before = box.style.top + '/' + box.style.left; const ev = (t, X, Y, el) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: X, clientY: Y, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: t === 'pointerup' ? 0 : 1 })); ev('pointerdown', x, y, c); ev('pointermove', x + 5, y - 6, document); ev('pointermove', x + 9, y - 11, document); ev('pointerup', x + 9, y - 11, document); const after = document.querySelector(`[data-testid="${id}"]`); return { before, after: after.style.top + '/' + after.style.left }; }, [b.x + b.width / 2, b.y + b.height / 2, id]); console.log('PROBE', label, JSON.stringify(r)); };
  await p.getByTestId('zoom-in').click(); await p.waitForTimeout(700);
  const w1 = (await page.boundingBox()).width, f1 = await fr('sig-box');
  step(who, 'zoom + renders the page 1.5× wide inside a scroller; the signature keeps its page fractions', Math.abs(w1 / w0 - 1.5) < 0.05 && Math.abs(f1.x - f0.x) < 0.01 && Math.abs(f1.w - f0.w) < 0.01 && (await p.getByTestId('pdf-scroller').getAttribute('data-zoom')) === '1.5', `page ${Math.round(w0)}→${Math.round(w1)} px, box left ${f0.x.toFixed(2)}%→${f1.x.toFixed(2)}%, ${await p.getByTestId('zoom-reset').innerText()}`);
  await shot(p, who, '2c-zoom');
  // nudge the date off its line, then ⌖ snaps it back — bottom on the rule again, centred on it
  await p.getByTestId('text-box').scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
  const tb0 = await p.getByTestId('text-box').boundingBox(); const sc0 = await p.getByTestId('pdf-scroller').boundingBox();
  const under = await p.evaluate(([x, y]) => document.elementFromPoint(x, y)?.getAttribute('data-testid') || document.elementFromPoint(x, y)?.tagName, [tb0.x + tb0.width / 2, tb0.y + tb0.height / 2]);
  await p.mouse.move(tb0.x + tb0.width / 2, tb0.y + tb0.height / 2); await p.mouse.down(); await p.mouse.move(tb0.x + tb0.width / 2 + 9, tb0.y + tb0.height / 2 - 11, { steps: 4 }); await p.mouse.up();
  const tb1 = await p.getByTestId('text-box').boundingBox();
  step(who, 'at zoom the date box is on screen inside the scroller and a drag moves it', tb1.y < tb0.y - 6, `box (${Math.round(tb0.x)},${Math.round(tb0.y)}) scroller (${Math.round(sc0.x)},${Math.round(sc0.y)} ${Math.round(sc0.width)}×${Math.round(sc0.height)}) under pointer: ${under}`);
  await p.getByTestId('snap-line').click(); await p.waitForTimeout(200);
  const tb2 = await p.getByTestId('text-box').boundingBox();
  step(who, '⌖ snaps the moved date back onto its "Date:" line (bottom back on the rule, fit = underline)', Math.abs(tb1.y - tb0.y) > 6 && Math.abs((tb2.y + tb2.height) - (tb0.y + tb0.height)) < 3 && (await p.getByTestId('text-box').getAttribute('data-fit')) === 'underline', `bottom ${Math.round(tb0.y + tb0.height)} → moved ${Math.round(tb1.y + tb1.height)} → snapped ${Math.round(tb2.y + tb2.height)} px`);
  // a FINGER drag (pointer events of type touch, as iOS sends them) moves the signature box too — the mouse path is not the only proven one
  { const sb = await p.getByTestId('sig-box').boundingBox(); const y0 = sb.y;
    await p.evaluate(([x, y]) => { const c = document.querySelector('[data-testid="pdf-page"] canvas'); const ev = (t, X, Y, el) => el.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: X, clientY: Y, pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0, buttons: t === 'pointerup' ? 0 : 1 })); ev('pointerdown', x, y, c); ev('pointermove', x + 4, y - 5, document); ev('pointermove', x + 8, y - 12, document); ev('pointerup', x + 8, y - 12, document); }, [sb.x + sb.width * 0.3, sb.y + sb.height * 0.7]);
    await p.waitForTimeout(250); const sb1 = await p.getByTestId('sig-box').boundingBox();
    step(who, 'a finger drag (touch pointer) moves the signature box at zoom', sb1.y < y0 - 6 && Math.abs((sb1.y + sb1.height) - (y0 + sb.height) + 12) < 4, `top ${Math.round(y0)} → ${Math.round(sb1.y)} px`);
    // ⌖ on the SIGNATURE box: back onto the rule it was fitted to (bottom where it was, fit = underline)
    await p.getByTestId('snap-line').click(); await p.waitForTimeout(250); const sb2 = await p.getByTestId('sig-box').boundingBox();
    step(who, '⌖ snaps the signature box back onto its rule', Math.abs((sb2.y + sb2.height) - (y0 + sb.height)) < 3 && (await p.getByTestId('sig-box').getAttribute('data-fit')) === 'underline', `bottom ${Math.round(y0 + sb.height)} → ${Math.round(sb1.y + sb1.height)} → ${Math.round(sb2.y + sb2.height)} px`);
    // the snap refits the box to the rule's width — widen it again by the handle (the stamp geometry step expects Alex's wider than the rule)
    const hh = await p.getByTestId('resize-handle').boundingBox(); await p.mouse.move(hh.x + hh.width / 2, hh.y + hh.height / 2); await p.mouse.down(); await p.mouse.move(hh.x + hh.width / 2 + 24, hh.y + hh.height / 2 - 6, { steps: 5 }); await p.mouse.up(); await p.waitForTimeout(150); }
  // a REAL finger (CDP touch events, what iOS Safari and Chrome send): a drag that starts on a mark moves ONLY the mark — the
  // page and the scroller do not pan (operator 2026-09-08 18:30: "PDF moves at same time"); a drag on empty page still pans
  { const cdp = await p.context().newCDPSession(p);
    const touch = async (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    const drag = async (x, y, dx, dy) => { await touch('touchStart', x, y); for (let i = 1; i <= 5; i++) { await touch('touchMove', x + dx * i / 5, y + dy * i / 5); await p.waitForTimeout(20); } await touch('touchEnd', x + dx, y + dy); await p.waitForTimeout(250); };
    const scrollState = () => p.evaluate(() => { const sc = document.querySelector('[data-testid="pdf-scroller"]'); return { y: window.scrollY, st: sc.scrollTop, sl: sc.scrollLeft }; });
    const ta = await p.getByTestId('text-box').evaluate((n) => getComputedStyle(n).touchAction + '/' + getComputedStyle(n).pointerEvents);
    await p.getByTestId('text-box').scrollIntoViewIfNeeded(); await p.waitForTimeout(150);
    const tb = await p.getByTestId('text-box').boundingBox(); const s0 = await scrollState();
    await drag(tb.x + tb.width * 0.3, tb.y + tb.height / 2, 0, -40);
    const tb2 = await p.getByTestId('text-box').boundingBox(); const s1 = await scrollState();
    step(who, 'a REAL finger drag on the date box moves ONLY the box — page and scroller do not pan (touch-action none on the mark)', ta === 'none/auto' && tb2.y < tb.y - 20 && s1.y === s0.y && s1.st === s0.st && s1.sl === s0.sl, `touch-action ${ta} · box top ${Math.round(tb.y)}→${Math.round(tb2.y)} · scroll ${JSON.stringify(s0)}→${JSON.stringify(s1)}`);
    await p.getByTestId('snap-line').click(); await p.waitForTimeout(200);   // back onto its line for the steps that follow
    // …and a real finger on EMPTY page at 150 % still pans the scroller (the page is not frozen)
    const sc = await p.getByTestId('pdf-scroller').boundingBox(); const before = await scrollState();
    let after = before;   // sideways: at 150 % the page is wider than the scroller, so this pan is always possible — a synthetic touch occasionally misses, so up to three tries
    for (let k = 0; k < 3 && !(after.sl > before.sl + 5); k++) { await drag(sc.x + sc.width * 0.6, sc.y + sc.height * (0.5 + 0.15 * k), -100, 0); after = await scrollState(); }
    step(who, 'a real finger on empty page at 150 % pans the scroller sideways (only marks are pinned)', after.sl > before.sl + 5, `scroll ${JSON.stringify(before)}→${JSON.stringify(after)}`);
    await cdp.detach(); }
  await p.getByTestId('zoom-reset').click(); await p.waitForTimeout(600);
  step(who, 'zoom reset returns the page to 100 %', Math.abs((await page.boundingBox()).width - w0) < 2 && (await p.getByTestId('zoom-reset').innerText()) === '100%');
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
  await drawInitials(p, who);
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
const creatorMails = []; await D.route('**/api/notify', async (route) => { creatorMails.push(route.request().postDataJSON()); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sent: true, id: 'em_creator' }) }); });

// the AI route (Worker /api/ai) mocked on Alex's phone: "openai configured"; placement answers the lender's rule
await A.route('**/api/ai', (r) => { if (r.request().method() === 'GET') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: { openai: true, gemini: false, grok: false } }) });
  const body = JSON.parse(r.request().postData() || '{}'); const rl = rules.alex; return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ provider: 'openai', model: 'gpt-4o-mini', result: rl && body.task === 'place' ? { x: rl.x0, y: rl.y - 0.035, w: rl.x1 - rl.x0, h: 0.034, date: null, confidence: 0.9 } : null }) }); });
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
// the globe (same method as Settings and Vision 2525): Spanish on, the page reads Spanish, then back (operator 01:55)
await A.locator('[data-testid="soi-globe"] button').first().click(); await A.locator('[data-testid="soi-globe"] [role="option"]', { hasText: 'Español' }).click(); await A.waitForTimeout(300);
const esLine = await A.getByTestId('explain').innerText(); await shot(A, 'alex', '0b-spanish');
await A.locator('[data-testid="soi-globe"] button').first().click(); await A.locator('[data-testid="soi-globe"] [role="option"]', { hasText: '(English)' }).click(); await A.waitForTimeout(300);
step('alex', 'globe → Español: the page reads Spanish ("Añade el o los PDF a firmar."), then English again', /Añade el o los PDF/.test(esLine) && /Add the PDF/.test(await A.getByTestId('explain').innerText()), esLine);
// a THIRD language, fetched on demand the first time the Globe selects it (operator 2026-09-09: all UX strings in 33 languages)
await A.locator('[data-testid="soi-globe"] button').first().click(); await A.locator('[data-testid="soi-globe"] [role="option"]', { hasText: 'Français' }).click();
await A.waitForFunction(() => !/Add the PDF/.test(document.querySelector('[data-testid="explain"]')?.textContent || ''), null, { timeout: 15000 }).catch(() => {});
const frLine = await A.getByTestId('explain').innerText();
await A.locator('[data-testid="soi-globe"] button').first().click(); await A.locator('[data-testid="soi-globe"] [role="option"]', { hasText: '(English)' }).click(); await A.waitForTimeout(300);
step('alex', 'globe → Français: the Sign Doc strings arrive on demand and the page reads French, then English again', !/Add the PDF/.test(frLine) && /PDF/.test(frLine) && /Add the PDF/.test(await A.getByTestId('explain').innerText()), frLine);
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
step('alex', 'the hand-off says three placeholders were left for Daniel', /Daniel Vail/.test(await A.getByTestId('holders-left').innerText()));
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
await D.waitForFunction(() => document.querySelector('[data-testid="creator-mail"]')?.getAttribute('data-state') === 'sent', null, { timeout: 15000 }).catch(() => {});
step('dan', "the creator is told: Dan's phone mailed the finished file to Alex through the site's mail, PDF attached (037 creator_contact)", creatorMails.length === 1 && creatorMails[0].to.toLowerCase() === 'explore@exel-ai.com' && creatorMails[0].final === true && /-signed-AS-DV\.pdf$/.test(creatorMails[0].attachment?.name || '') && (await D.getByTestId('creator-mail').getAttribute('data-state')) === 'sent', `${creatorMails[0]?.to} · ${creatorMails[0]?.attachment?.name}`);
step('dan', "037: the finished file's send row is prefilled with the CREATOR's contact, so it goes straight back to Alex", (await D.getByTestId('send-email-to').inputValue()).toLowerCase() === 'explore@exel-ai.com', await D.getByTestId('send-email-to').inputValue());
await shot(D, 'dan', '6-complete');
const [dl] = await Promise.all([D.waitForEvent('download'), D.getByTestId('downloads').locator('button').first().click()]);
const file = path.join(OUT, 'signed-sample.pdf'); await dl.saveAs(file);
const bytes = new Uint8Array(fs.readFileSync(file));
const n = await countSignatureImages(bytes); step('dan', 'downloaded PDF carries two signature images', n === 2, `SoISig count = ${n}`);
// geometry (Asar, wave 1 → 4): each stamp sits on ITS signature line — the lender's for Alex, the borrower's for
// Daniel — starting at the rule's left edge, bottom on the rule, widened by the corner drag (distinct boxes)
const boxes = await signatureBoxes(bytes);
const expect = [rules.alex, rules.dan];
step('dan', "each stamp sits on ITS signature line (Alex widened his; Daniel's is the placeholder, rule-wide), distinct", boxes.length === 2 && boxes.every((b, i) => b.page === expect[i].page && Math.abs(b.x - expect[i].x0) < 0.03 && Math.abs(b.y + b.h - expect[i].y) < 0.012 && (i === 0 ? b.w > expect[i].x1 - expect[i].x0 + 0.02 : Math.abs(b.w - (expect[i].x1 - expect[i].x0)) < 0.03)) && Math.abs(boxes[0].x - boxes[1].x) > 0.2, JSON.stringify(boxes.map((b) => [b.page, +b.x.toFixed(2), +b.y.toFixed(2), +b.w.toFixed(2)])));
const texts = await textBoxes(bytes); step('dan', 'two date marks stamped (one per signer)', texts.length === 2, `SoITxt count = ${texts.length}`);
{ const { initialledBy, holders } = await import('../lib/pdf-stamp.ts'); const ib = await initialledBy(bytes); const hs = await holders(bytes);
  // C2 (operator 2026-09-08): the first signer's initials hold the RIGHT edge, each additional signer starts LEFT of the previous
  { const { PDFDocument } = await import('pdf-lib'); const { initialsSlot, INIT_SLOT } = await import('../lib/pdf-stamp.ts');
    const d = await PDFDocument.load(bytes, { updateMetadata: false }); const kws = (d.getKeywords() || '').split(/\s+/);
    const ws = [0, 1].map((k) => Number((kws.find((x) => x.startsWith(`SoIInitW:${k}:`)) || '').split(':')[2]) || INIT_SLOT.w);
    const s0 = initialsSlot(612, 100, 0, ws), s1 = initialsSlot(612, 100, 1, ws);
    step('dan', 'Light Codex row: Alex (first) at the right edge, Daniel (additional) starts LEFT of him', Math.abs(s0.x + s0.w - (612 - INIT_SLOT.right)) < 0.01 && Math.abs(s1.x + s1.w + INIT_SLOT.gap - s0.x) < 0.01 && s1.x < s0.x, `alex ${s0.x.toFixed(1)}–${(s0.x + s0.w).toFixed(1)} pt · daniel ${s1.x.toFixed(1)}–${(s1.x + s1.w).toFixed(1)} pt`); }
  step('dan', 'both signers INITIALLED every page (drawn initials, SoIInit0 + SoIInit1) and the placeholders were recorded for signer 2', JSON.stringify(ib) === '[0,1]' && hs.length === 2 && hs.every((h) => h.idx === 1) && hs.map((h) => h.kind).sort().join() === 'date,sig', `initialled ${JSON.stringify(ib)} · holders ${JSON.stringify(hs.map((h) => [h.idx, h.kind]))}`); }
// SHOW the result: the signed page, the signature rows and the signatory block rendered to PNG (pdfjs in Chromium)
const render = (name, env) => { execFileSync('node', ['scripts/render-pdf-page.mjs'], { env: { ...process.env, PDF: file, OUT: path.join(OUT, name), ...env }, stdio: 'pipe' }); return fs.existsSync(path.join(OUT, name)) && fs.statSync(path.join(OUT, name)).size > 800; };   // the bottom-edge crop is mostly paper
const pg = String(boxes[0]?.page ?? 2);
step('dan', 'signed page rendered to PNG (whole page · signature rows · signatory block)', render('signed-page.png', { PAGE: pg, SCALE: '1.4' }) && render('signed-block.png', { PAGE: pg, SCALE: '3', CROP: `0.08,${(expect[0].y - 0.045).toFixed(3)},0.84,0.10` }) && render('signed-codex.png', { PAGE: pg, SCALE: '3', CROP: '0.46,0.955,0.54,0.045' }));
const rows = await codexRows(bytes); step('dan', 'signatory rows recorded in the file (keywords): two, with time + hash', rows.length === 2 && rows[0].rowIndex === 0 && rows[1].rowIndex === 1 && rows.every((r) => /^\d{4}-\d{2}-\d{2}T/.test(r.isoDate)), JSON.stringify(rows.map((r) => [r.rowIndex, r.isoDate, r.hash])));
// offline verify (Pangu): the DONE block reads the downloaded file back — green; the unsigned fixture — "no signatures"
await D.getByTestId('verify-input').setInputFiles(file); await D.getByTestId('verify-result').waitFor({ timeout: 30000 });
const vr = D.getByTestId('verify-result'); step('dan', 'verify-a-signed-file: the downloaded PDF reads green (2 signatures, chain holds)', (await vr.getAttribute('data-ok')) === '1' && /2 signatures/.test(await vr.innerText()), (await vr.innerText()).replace(/\s+/g, ' ').slice(0, 120));
// the digital signature ALWAYS pairs with the physical one (operator 23:15): one "name · time · #hash" line per SoISig
const txt = await pdfText(bytes); const dl1 = (txt.match(/Alex Seguin · 2026\.\d\d\.\d\d \d\d:\d\d:\d\d [A-Z]{2,5} · #[0-9a-f]{8}/g) || []).length, dl2 = (txt.match(/Daniel Vail · 2026\.\d\d\.\d\d \d\d:\d\d:\d\d [A-Z]{2,5} · #[0-9a-f]{8}/g) || []).length;   // the caption prints the receipt's cacStamp form, one rendering of the instant (fleet pass 2)
step('dan', 'digital signature pairs with each physical one: 2 SoISig images ↔ 2 digital lines in the page text', n === 2 && dl1 === 1 && dl2 === 1, `Alex ×${dl1} · Daniel ×${dl2}`);
// the Light Codex strips read back from the PDF's own pixels: one per signatory + ALL signatories
const codex = await decodeCodexPdf(bytes, (b) => new Uint8Array(zlib.inflateSync(b))); const byName = Object.fromEntries(codex.map((c) => [c.name, c.result?.messageForward]));
step('dan', 'Light Codex from the PDF: the HIDDEN helix on the bottom edge decodes, reverse-verified, no box drawn', codex.length > 0 && codex.every((c) => c.result?.verified && c.result.style === 'Hidden Helix') && !/Signatories|Digitally signed/.test(txt), JSON.stringify(byName));
step('dan', 'Light Codex ALL strip carries every signatory in one line', /^ALEX SEGUIN 2026\.\d\d\.\d\d_\d\d:\d\d[A-Z]{2,5} • DANIEL VAIL 2026\.\d\d\.\d\d_\d\d:\d\d[A-Z]{2,5}$/.test(byName.SoICodexAll || ''), byName.SoICodexAll);
const pagesWithCodex = [...new Set(codex.map((c) => c.page))].sort();
step('dan', 'the hidden Light Codex is on EVERY signed page, not just the last (operator 23:25)', pagesWithCodex.length === (await pageCountOf(bytes)) && codex.length === pagesWithCodex.length, `pages ${pagesWithCodex.join(',')} · ${codex.length} strips`);
step('dan', 'page 1 bottom-right rendered to PNG (initials; the codex line is invisible)', render('signed-codex-p1.png', { PAGE: '1', SCALE: '3', CROP: '0.46,0.955,0.54,0.045' }));
// PHYSICAL initials (operator 00:50): both signers' drawn initials images sit on EVERY page, and no "Initial" placeholder is left
{ const { PDFDocument: PD, PDFName: PN } = await import('pdf-lib'); const d = await PD.load(bytes); const per = d.getPages().map((pg) => { const xo = pg.node.Resources()?.lookup(PN.of('XObject')); return xo ? xo.keys().map((k) => k.toString()).filter((k) => k.startsWith('/SoIInit')).sort().join(',') : ''; });
  const doc = await getDocument({ data: bytes.slice(), useWorkerFetch: false, isEvalSupported: false, standardFontDataUrl: path.resolve('node_modules/pdfjs-dist/standard_fonts/') + '/', verbosity: 0 }).promise; let left = 0; for (let i = 1; i <= doc.numPages; i++) { const t = (await (await doc.getPage(i)).getTextContent()).items.map((x) => x.str).join(' '); if (/\bInitial\b|Sign here/.test(t)) left++; }
  // the placeholder labels stay in the text layer under white paint (pdf-lib cannot delete drawn text) — the render proves they are covered
  step('dan', 'both signers\' DRAWN initials on EVERY page (SoIInit0 + SoIInit1)', per.length === 2 && per.every((k) => k === '/SoIInit0,/SoIInit1'), `${JSON.stringify(per)} · placeholder labels under paint on ${left} pages`); }
await D.getByTestId('verify-input').setInputFiles(FIXTURE); await D.waitForFunction(() => document.querySelector('[data-testid="verify-result"]')?.getAttribute('data-ok') === '0', null, { timeout: 30000 });
step('dan', 'verify-a-signed-file: the unsigned fixture reads "no signatures"', /No eXeL signatures/.test(await vr.innerText()));
await shot(D, 'dan', '6b-verify');

// 4b · the Light Codex page unlocks the signatories by UPLOADING THE PDF (PNG still works) — operator 23:15
await D.goto(BASE + '/light-codex/', { waitUntil: 'domcontentloaded' }); await ready(D);
await D.getByRole('button', { name: /^Decode$/ }).click(); await D.getByTestId('codex-decode-input').setInputFiles(file);
await D.getByTestId('codex-pdf-results').waitFor({ timeout: 30000 });
const allText = await D.getByTestId('codex-all').innerText(); const rowN = await D.getByTestId('codex-row').count();
step('dan', 'Light Codex page: uploading the signed PDF lists ALL signatories from the hidden line', /ALEX SEGUIN 2026\.\d\d\.\d\d_\d\d:\d\d[A-Z]{2,5} • DANIEL VAIL 2026\.\d\d\.\d\d_\d\d:\d\d[A-Z]{2,5}/.test(allText) && /Hidden Helix/.test(allText) && rowN === 0, allText.replace(/\s+/g, ' ').slice(0, 110));
await shot(D, 'dan', '6c-codex-pdf');

// 5 · Alex reopens with HIS OWN link (kept from the hand-off) and sees the completed document
await A.goto(myLink, { waitUntil: 'domcontentloaded' }); await ready(A);
await A.getByTestId('downloads').waitFor({ timeout: 60000 }); step('alex', 'creator reopens with his own link → COMPLETE, downloads offered');
// the END on a PHONE (operator 2026-09-09): Download · Text · E-mail · Copy on the Done panel — Text hands the PDF to the share sheet,
// E-mail sends it through the site's own mail WITH THE FILE ATTACHED
{ await A.evaluate(() => { window.__shared = []; navigator.canShare = () => true; navigator.share = async (d) => { window.__shared.push({ n: d.files?.length || 0, names: (d.files || []).map((f) => f.name), text: d.text || '' }); }; });
  await A.getByTestId('send-text').click(); await A.waitForTimeout(400);
  const sh = await A.evaluate(() => window.__shared);
  step('alex', 'Text on the Done panel hands the signed PDF (with its initials in the name) and the message to the share sheet', sh.length === 1 && sh[0].n === 1 && /-signed-AS-DV\.pdf$/.test(sh[0].names[0]) && /signed/i.test(sh[0].text) && (await A.getByTestId('send-state').getAttribute('data-state')) === 'shared', JSON.stringify(sh));
  await A.evaluate(() => { navigator.canShare = () => false; });
  const notified = []; await A.route('**/api/notify', async (route) => { notified.push(route.request().postDataJSON()); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sent: true, id: 'em_test' }) }); });
  await A.getByTestId('send-email-to').fill('daniel@example.test'); await A.getByTestId('send-email-file').click(); await A.getByTestId('send-state').waitFor({ timeout: 10000 });
  const n0 = notified[0];
  step('alex', "E-mail on the Done panel sends through the site's mail WITH the signed PDF attached (base64, named with the initials, final)", !!n0 && n0.to === 'daniel@example.test' && n0.final === true && /-signed-AS-DV\.pdf$/.test(n0.attachment?.name || '') && (n0.attachment?.base64 || '').length > 1000 && /^JVBERi0/.test(n0.attachment.base64) && (await A.getByTestId('send-state').getAttribute('data-state')) === 'sent', `to ${n0?.to} · ${n0?.attachment?.name} · ${(n0?.attachment?.base64 || '').length} b64 chars`);
  // the message carries the RECORD link (no secret — Thor) and the chain hash; the saved link is shown to its holder only (operator 2026-09-09)
  const tok = /\?e=([A-Za-z0-9_-]{22})/.exec(myLink)[1];
  step('alex', 'the outgoing message names the record (?e=token) WITHOUT any secret, and ends with the chain hash line', sh[0].text.includes(`/soi-session/sign/?e=${tok}`) && !/#s=|&file=/.test(sh[0].text) && /⧉ [0-9a-f]{8}$/m.test(sh[0].text) && Array.isArray(n0.attachments) && n0.attachments.length === 0, sh[0].text.slice(-60));
  await A.unroute('**/api/notify'); }
await shot(A, 'alex', '7-complete');
// ── the SAVED LINK to one file (operator 2026-09-09: "Saved link to specific file must be possible") ─────────────────────────────
{ await A.getByTestId('saved-links').waitFor({ timeout: 20000 });
  const fileUrl = (await A.getByTestId('file-link-url-1').innerText()).trim();
  const tok = /\?e=([A-Za-z0-9_-]{22})/.exec(myLink)[1];
  step('alex', 'Done panel: one saved link per file — token + own key + &file=<sha8> in the fragment', new RegExp(`\\?e=${tok}#s=[A-Za-z0-9_-]{22}&file=[0-9a-f]{8}$`).test(fileUrl) && (await A.getByTestId('file-link-copy-1').count()) === 1, fileUrl.slice(-40));
  const { sha256Hex } = await import('../lib/sign-envelope.ts'); const sha8 = (await sha256Hex(new Uint8Array(fs.readFileSync(file)))).slice(0, 8);
  step('alex', "the link's file key IS the downloaded file's sha256 (first 8 hex) — the receipt's number", fileUrl.endsWith(`&file=${sha8}`), sha8);
  const dlF = A.waitForEvent('download', { timeout: 20000 });                        // armed BEFORE navigation (Athena)
  await A.goto(fileUrl, { waitUntil: 'domcontentloaded' }); await ready(A); await A.getByTestId('downloads').waitFor({ timeout: 60000 });
  const gotF = await dlF.then((d) => d.suggestedFilename()).catch(() => '');
  step('alex', 'opening the saved file link later: the record opens complete, THAT file is focused and downloads by itself', /-signed-AS-DV\.pdf$/.test(gotF) && (await A.getByTestId('file-link-1').getAttribute('data-focus')) === '1', gotF);
  const again = A.waitForEvent('download', { timeout: 4000 }).then(() => true).catch(() => false);
  await A.reload({ waitUntil: 'domcontentloaded' }); await ready(A); await A.getByTestId('downloads').waitFor({ timeout: 60000 });
  step('alex', 'reopening the same file link does not download it again (once per device), the file stays focused', !(await again) && (await A.getByTestId('file-link-1').getAttribute('data-focus')) === '1');
  await A.goto(myLink.replace(/&file=.*$/, '') + '&file=zzzzzzzz', { waitUntil: 'domcontentloaded' }); await ready(A); await A.getByTestId('downloads').waitFor({ timeout: 60000 });
  step('alex', 'a malformed or unknown file key is ignored: the record still opens complete, nothing focused', (await A.locator('[data-testid^="file-link-"][data-focus="1"]').count()) === 0);
  await shot(A, 'alex', '7b-saved-link');
  // the signature LOOP (operator 21:09 CDT): a draft whose envelope already landed opens the record, never the draw step again
  const P = await A.context().newPage();
  await P.goto(`${BASE}/soi-session/sign/`, { waitUntil: 'domcontentloaded' }); await ready(P);
  const secret = /#s=([A-Za-z0-9_-]{22})/.exec(myLink)[1];
  await P.evaluate(({ tok, secret, b64 }) => { sessionStorage.setItem('exel-sign-draft', JSON.stringify({ title: 'Promissory Note', files: [{ name: 'sign-sample.pdf', base64: b64 }], signers: [{ name: 'Alex Seguin', contact: 'explore@exel-ai.com' }, { name: 'Daniel Vail', contact: '5128088745' }], marks: {}, png: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', initialsPng: null, token: tok, secret })); }, { tok, secret, b64: fs.readFileSync(FIXTURE).toString('base64') });
  await P.goto(`${BASE}/soi-session/sign/`, { waitUntil: 'domcontentloaded' }); await P.waitForURL((u) => u.search.includes(`e=${tok}`), { timeout: 30000 }).catch(() => {}); await ready(P);
  await P.getByTestId('downloads').waitFor({ timeout: 60000 });
  step('alex', 'a kept draft whose token already LANDED opens the completed record instead of asking for the signature again', P.url().includes(`e=${tok}`) && (await P.getByTestId('sign-button').count()) === 0 && (await P.evaluate(() => sessionStorage.getItem('exel-sign-draft'))) === null);
  await P.close();
  // the pads keep their strokes (D2): a restored draft (reload on the draw step) paints the ink it holds — never a blank pad asking again
  const Q = await A.context().newPage();
  await Q.goto(`${BASE}/soi-session/sign/`, { waitUntil: 'domcontentloaded' }); await ready(Q);
  await Q.evaluate(({ b64 }) => { const c = document.createElement('canvas'); c.width = 60; c.height = 24; const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(4, 4, 52, 16); const png = c.toDataURL('image/png');
    sessionStorage.setItem('exel-sign-draft', JSON.stringify({ title: 'Loop check', files: [{ name: 'sign-sample.pdf', base64: b64 }], signers: [{ name: 'Alex Seguin', contact: 'explore@exel-ai.com' }], marks: { 0: [{ id: 'sig', kind: 'sig', page: 1, x: 0.1, y: 0.8, w: 0.3, h: 0.05 }] }, png, initialsPng: png, token: '', secret: '' })); }, { b64: fs.readFileSync(FIXTURE).toString('base64') });
  await Q.goto(`${BASE}/soi-session/sign/`, { waitUntil: 'domcontentloaded' }); await ready(Q); await Q.getByTestId('sign-button').waitFor({ timeout: 30000 });
  const ink = await Q.evaluate(() => Array.from(document.querySelectorAll('canvas')).filter((c) => c.getAttribute('aria-label')).map((c) => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let k = 3; k < d.length; k += 4) if (d[k] > 30) n++; return n; }));
  step('alex', 'a restored draft comes back on the draw step with BOTH pads painted (signature + initials) and Sign & save lit', ink.length === 2 && ink.every((n) => n > 50) && (await Q.getByTestId('sign-button').isEnabled()), `ink px ${ink.join('/')}`);
  await shot(Q, 'alex', '7c-restored-draft'); await Q.close();
}

fs.writeFileSync(OUT + '/log.txt', log.join('\n'));
// ── remove a field and redo (operator 2026-09-08 22:40) — the LAST signer opens his own signed file, removes a text mark, types another,
// saves: the glyphs leave the file, the new text is bound to the SAME pass, signature · initials · codex row · hidden strip unchanged
{
  const E = await D.context().newPage(); await E.goto(`${BASE}/soi-session/sign/`, { waitUntil: 'domcontentloaded' }); await E.getByText('Sign Doc', { exact: true }).first().waitFor({ timeout: 60000 });
  await E.getByPlaceholder(/Promissory/).fill('Promissory Note'); await E.getByTestId('file-input').setInputFiles(file); await E.getByTestId('carried').waitFor({ timeout: 20000 });
  step('dan', 'the finished file says who signed it and offers "I am Daniel Vail: fix my text"', /Daniel Vail/.test(await E.getByTestId('carried').innerText()) && (await E.getByTestId('carried-i-am').count()) === 1, (await E.getByTestId('carried').innerText()).replace(/\s+/g, ' '));
  await E.getByTestId('carried-i-am').click(); await E.getByTestId('save-edits').waitFor({ timeout: 20000 });
  await E.locator('[data-testid="text-box"][data-fit="stamped"]').first().waitFor({ timeout: 20000 }).catch(() => {});   // the page view opens on the page that holds the mark once pdfjs has the document
  const stamped = await E.locator('[data-testid="text-box"][data-fit="stamped"]').count();
  step('dan', "Daniel's own text marks load back as stamped marks; the explainer names the mode", stamped >= 1 && /own signed file/.test(await E.getByTestId('explain').innerText()), `${stamped} stamped mark(s)`);
  const wasText = (await E.locator('[data-testid="text-box"][data-fit="stamped"]').first().innerText()).trim();
  await E.locator('[data-testid="text-box"][data-fit="stamped"]').first().click(); await E.getByTestId('remove-mark').click(); await E.waitForTimeout(100);
  await E.getByTestId('add-text').click(); await E.getByTestId('mark-text').fill('Redo: Cozumel'); await E.waitForTimeout(100);
  await E.getByTestId('save-edits').click(); await E.getByTestId('downloads').waitFor({ timeout: 30000 });
  const dl2 = E.waitForEvent('download'); await E.getByTestId('downloads').locator('button').first().click(); const file2 = path.join(OUT, 'signed-sample-redo.pdf'); await (await dl2).saveAs(file2);
  const b2 = new Uint8Array(fs.readFileSync(file2));
  const { textBoxes: tbx, codexRows: cr2, countSignatureImages: csi2 } = await import('../lib/pdf-stamp.ts');
  const tb2 = await tbx(b2); const txt2 = await pdfText(b2);
  step('dan', 'saved: the removed text is gone from the file (keyword and glyphs), the new text is there, bound to pass 1', !tb2.some((m) => m.signerIdx === 1 && m.text === wasText) && tb2.some((m) => m.text === 'Redo: Cozumel' && m.signerIdx === 1) && txt2.split(wasText).length - 1 === 1 && /Redo: Cozumel/.test(txt2), /* Alex's own date (same text) stays: exactly one copy left in the page text */ `was "${wasText}" · marks: ${tb2.map((m) => `${m.signerIdx}:${m.text}`).join(' | ')}`);
  step('dan', 'signatures, codex rows and initials unchanged after the redo', (await csi2(b2)) === 2 && (await cr2(b2)).filter((r) => r.rowIndex >= 0).length === 2, `sigs ${await csi2(b2)} rows ${(await cr2(b2)).length}`);
  await E.getByTestId('verify-input').setInputFiles(file2); await E.getByTestId('verify-result').waitFor({ timeout: 30000 });
  step('dan', 'the redone file still reads green in the verifier', (await E.getByTestId('verify-result').getAttribute('data-ok')) === '1', (await E.getByTestId('verify-result').innerText()).replace(/\s+/g, ' ').slice(0, 100));
  await shot(E, 'dan', '8-redo');
}
// the END on a COMPUTER (operator 2026-09-09: "from phone or computer"): a desktop browser — no share sheet, no sms: — Text downloads the
// file and copies the message; E-mail sends it through the site's mail with the PDF attached
{ const ctxC = await browser.newContext({ viewport: { width: 1280, height: 800 }, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  const C = await ctxC.newPage(); await C.goto(`${BASE}/soi-session/sign/`, { waitUntil: 'domcontentloaded' }); await C.getByText('Sign Doc', { exact: true }).first().waitFor({ timeout: 60000 });
  await C.getByPlaceholder(/Promissory/).fill('Promissory Note'); await C.getByTestId('file-input').setInputFiles(file); await C.getByTestId('carried-i-am').waitFor({ timeout: 20000 }); await C.getByTestId('carried-i-am').click();
  await C.getByTestId('save-edits').waitFor({ timeout: 20000 }); await C.getByTestId('save-edits').click(); await C.getByTestId('downloads').waitFor({ timeout: 30000 });
  const dlC = C.waitForEvent('download', { timeout: 10000 }).then((d) => d.suggestedFilename()).catch(() => '');
  await C.getByTestId('send-text').click(); await C.getByTestId('send-state').waitFor({ timeout: 10000 });
  const clip = await C.evaluate(() => navigator.clipboard.readText()).catch(() => '');
  step('dan', 'COMPUTER · Text: the signed file downloads and the message is on the clipboard (a desktop has no text composer)', /-signed-AS-DV\.pdf$/.test(await dlC) && /signed/i.test(clip) && (await C.getByTestId('send-state').getAttribute('data-state')) === 'copied' && C.url().startsWith('http'), `download ${await dlC} · clipboard "${clip.slice(0, 60)}…"`);
  const sentC = []; await C.route('**/api/notify', async (route) => { sentC.push(route.request().postDataJSON()); await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sent: true, id: 'em_c' }) }); });
  await C.getByTestId('send-email-to').fill('alex@example.test'); await C.getByTestId('send-email-file').click(); await C.waitForFunction(() => document.querySelector('[data-testid="send-state"]')?.getAttribute('data-state') === 'sent', null, { timeout: 10000 });
  step('dan', "COMPUTER · E-mail: the site's mail carries the signed PDF as an attachment", sentC.length === 1 && sentC[0].to === 'alex@example.test' && /-signed-AS-DV\.pdf$/.test(sentC[0].attachment?.name || '') && /^JVBERi0/.test(sentC[0].attachment?.base64 || ''), `${sentC[0]?.attachment?.name} · ${(sentC[0]?.attachment?.base64 || '').length} b64 chars`);
  await shot(C, 'dan', '9-computer-send'); await ctxC.close(); }
// the database refuses at CREATE (operator 2026-09-09 04:02 CDT, build 9779def: "Creating the document: Saving failed" — 42883 from inside the
// RPC, 038 not pasted): the signature is already stamped, so the record stays on the phone and Download · Text · E-mail are THERE — never a
// red line and blank pads again
{ const F = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, acceptDownloads: true }); const P = await F.newPage();
  await P.route('**/rest/v1/rpc/sign_envelope_create', (route) => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: '42883', message: 'function digest(bytea, unknown) does not exist', details: null, hint: 'No function matches the given name and argument types.' }) }));
  await P.goto(`${BASE}/soi-session/sign/`, { waitUntil: 'domcontentloaded' }); await ready(P);
  await P.getByPlaceholder(/Promissory/).fill('Refused at create'); await P.getByTestId('file-input').setInputFiles(FIXTURE); await P.getByRole('button', { name: /who signs/ }).waitFor({ timeout: 20000 }); await P.getByRole('button', { name: /who signs/ }).click();
  await P.getByTestId('signer-name-0').fill('Alex Seguin'); await P.getByTestId('signer-contact-0').fill('explore@exel-ai.com'); await P.locator('button[aria-label]:has-text("✕")').first().click();
  await P.getByRole('button', { name: /place your signature/ }).click();
  const pg = P.getByTestId('pdf-page'); await pg.locator('canvas').first().waitFor({ timeout: 60000 });
  const bb = await pg.boundingBox(); await P.mouse.click(bb.x + bb.width * 0.5, bb.y + bb.height * 0.3); await P.getByTestId('sig-box').waitFor();
  await P.getByTestId('to-draw').click(); await scribble(P, 'alex'); await drawInitials(P, 'alex');
  await P.waitForFunction(() => { const b = document.querySelector('[data-testid="sign-button"]'); return b && !b.disabled; }, null, { timeout: 5000 }); await P.getByTestId('sign-button').click();
  await P.getByTestId('downloads').waitFor({ timeout: 60000 });
  const why = await P.getByTestId('local-why').innerText().catch(() => '');
  step('alex', 'the database refused at create → the record stays on the phone: Done panel, LOCAL ONLY, the reason named, Download · Text · E-mail offered', (await P.getByTestId('send-download').count()) === 1 && (await P.getByTestId('send-text').count()) === 1 && (await P.getByTestId('send-email-file').count()) === 1 && /migration|paste/i.test(why), why.slice(0, 80));
  const dlR = P.waitForEvent('download', { timeout: 15000 }); await P.getByTestId('send-download').first().click(); const gotR = await dlR.then((d) => d.suggestedFilename()).catch(() => '');
  step('alex', 'and the stamped file downloads', /-signed-AS\.pdf$/.test(gotR), gotR);
  await shot(P, 'alex', '10-refused-at-create'); await F.close(); }
await browser.close(); console.log(`\nSIGN 2-PHONE LIVE RUN: ${log.length} steps, 0 failures`);
