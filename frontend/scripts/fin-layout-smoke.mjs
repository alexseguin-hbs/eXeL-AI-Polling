#!/usr/bin/env node
/**
 * LAYOUT SMOKE — the Financial-2525 page never pushes a phone sideways (r.072, the AsM review of addendum 161).
 *
 * Three revisions in a row a phone-width defect shipped behind green source gates: a figure running into its neighbour (r.071), the
 * gear's rate line off the card (r.071), the budget header and then budget EDIT mode pushing the page 24 px at 320 (r.072). A source
 * regex cannot see a layout; a browser can. This serves the built export, signs a TEST browser in (the Auth0 SPA cache — nothing in
 * the product is bypassed), seeds one credit card already past its amber level under a long single-word name (so the cockpit warning
 * shows the worst name a person can type), and at 320 · 390 · 428 px measures the page at rest, with the Accrual gear open and with
 * the budget in edit mode: the document is never wider than the screen. A probe that cannot go red is not evidence — the run also
 * asserts each state was reached (the warning shown, the gear open, the edit inputs present).
 *
 * r.073 (addendum 165, "full screen mode with financial chart messes up. not all is legible"): the chart's full screen must cover the screen
 * the person SEES. iOS zooms a page in when a box under 16 px gets the focus, and a full-screen layer sized to the page's layout width then
 * runs past both edges of what is visible (measured on r.072's layer: 8 controls past the right edge at ×1.14, the left edge too at ×1.33).
 * At 320 · 390 · 428 px, at rest and zoomed ×1.14 and ×1.33 (a mobile browser's page scale, emulated), a deposit is recorded, the chart is
 * opened full screen, and every control of the layer must lie inside the visual viewport, with the layer itself the visual viewport's size.
 *
 *   node scripts/fin-layout-smoke.mjs        (needs `next build` first; reads out/)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
const OUT = resolve(new URL('..', import.meta.url).pathname, 'out');
const PORT = Number(process.env.FIN_SMOKE_PORT || 4723);
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.ico':'image/x-icon' };
const srv = createServer(async (req,res)=>{
  try { let f=join(OUT,decodeURIComponent(req.url.split('?')[0]));
    try{ if((await stat(f)).isDirectory()) f=join(f,'index.html'); }catch{ f=extname(f)?f:join(f,'index.html'); }
    res.writeHead(200,{'content-type':MIME[extname(f)]||'application/octet-stream'}); res.end(await readFile(f));
  } catch { if(!res.headersSent) res.writeHead(404); res.end(); }
}).listen(PORT);
let pass=0, fail=0; const ok=(c,m)=>{ if(c) pass++; else { fail++; console.log('FAIL:',m); } };
// the TEST browser's seed: a signed-in person (Auth0 SPA cache, unsigned token — the app only reads the cache), the operator's cyan
// theme, and one card past amber whose name is the longest the form allows, as one unbroken word
const CLIENT = 'H8wuT6P2nfm87bvbRjaegoOliLyhPw4K', SUB = 'auth0|layout-smoke';
const INIT = `try { localStorage.setItem("exel-active-locale","en"); localStorage.setItem("exel-theme-id","exel-cyan"); const clientId=${JSON.stringify(CLIENT)};
  const user={ sub:${JSON.stringify(SUB)}, name:"Layout Smoke", email:"smoke@example.invalid", email_verified:true, updated_at:new Date().toISOString() };
  const b64=(o)=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/,"").replace(/\\+/g,"-").replace(/\\//g,"_"); const now=Math.floor(Date.now()/1000);
  const claims={...user, iss:"https://exel-ai-polling.us.auth0.com/", aud:clientId, iat:now, exp:now+86400}; const idToken=b64({alg:"none",typ:"JWT"})+"."+b64(claims)+".sig";
  const decodedToken={ encoded:{header:"",payload:"",signature:""}, header:{alg:"none",typ:"JWT"}, claims:{__raw:idToken,...claims}, user };
  localStorage.setItem("@@auth0spajs@@::"+clientId+"::@@user@@", JSON.stringify({id_token:idToken, decodedToken}));
  localStorage.setItem("@@auth0spajs@@::"+clientId+"::default::openid profile email", JSON.stringify({ body:{client_id:clientId, access_token:"smoke", id_token:idToken, scope:"openid profile email", oauthTokenScope:"openid profile email", expires_in:86400, decodedToken, audience:"default"}, expiresAt: now+86400 }));
  localStorage.setItem("fin-cards:" + ${JSON.stringify(SUB)}, JSON.stringify([{ id:"c-smoke", name:"Supercalifragilisticexpialidociouscardna", limitCents:300000, openingCents:160000, openingAtMs:Date.now()-60000, amberCents:150000, redCents:200000 }])); } catch {}`;
try {
  const { chromium } = await import('playwright');
  const cands=[process.env.CHROMIUM_PATH,'/opt/pw-browsers/chromium-1194/chrome-linux/chrome','/opt/pw-browsers/chromium/chrome-linux/chrome','/usr/bin/chromium'].filter(Boolean);
  let executablePath; for(const x of cands){ try{ await stat(x); executablePath=x; break; }catch{} }
  const b = await chromium.launch(executablePath?{executablePath}:{});
  const errors=[];
  const wide = (p) => p.evaluate(() => ({ doc: document.documentElement.scrollWidth, w: window.innerWidth, by: Array.from(document.querySelectorAll('body *')).filter((el) => { const r = el.getBoundingClientRect(); if (!(r.width && r.right > window.innerWidth + 1)) return false; for (let q = el.parentElement; q; q = q.parentElement) if (/(auto|scroll|hidden)/.test(getComputedStyle(q).overflowX)) return false; return true; }).slice(0, 2).map((el) => el.tagName.toLowerCase() + (Array.from(el.attributes).find((a) => a.name.startsWith('data-'))?.name ? '[' + Array.from(el.attributes).find((a) => a.name.startsWith('data-')).name + ']' : '')) }));
  for (const w of [320, 390, 428]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    await ctx.addInitScript(INIT);
    const p = await ctx.newPage();
    p.on('pageerror', e=>errors.push(`${w}: ${e.message}`));
    await p.goto(`http://127.0.0.1:${PORT}/financial-2525/`, { waitUntil:'networkidle', timeout:30000 });
    await p.waitForSelector('[data-fin-tx-open]', { timeout: 15000 });
    ok(await p.locator('[data-fin-card-warning]').count() > 0, `${w}: the seeded card's warning shows (the long-name state is exercised)`);
    let m = await wide(p); ok(m.doc <= m.w + 1, `${w}: the page at rest fits (${m.doc} of ${m.w}${m.by.length ? ' · ' + m.by.join(', ') : ''})`);
    await p.click('[data-fin-accrual-gear]'); await p.waitForTimeout(200);
    ok(await p.locator('[data-fin-accrual-defs]').count() > 0, `${w}: the Accrual gear opens`);
    m = await wide(p); ok(m.doc <= m.w + 1, `${w}: the page with the gear open fits (${m.doc} of ${m.w}${m.by.length ? ' · ' + m.by.join(', ') : ''})`);
    await p.click('[data-fin-budget-edit]'); await p.waitForTimeout(200);
    ok(await p.locator('[data-fin-plan-amount]').count() > 0, `${w}: the budget opens in edit mode`);
    m = await wide(p); ok(m.doc <= m.w + 1, `${w}: the page with the budget in edit mode fits (${m.doc} of ${m.w}${m.by.length ? ' · ' + m.by.join(', ') : ''})`);
    await ctx.close();
  }
  // r.073 (addendum 165): the full-screen chart, at rest and zoomed — a mobile context, so a page scale applies as it does on a phone.
  // r.073 second pre-push review (Athena): and in LANDSCAPE (844×390, 568×320) — his complaint came back there at rest, the bottom cut; the
  // check now covers the bottom edge too (every control inside the visible screen vertically, nothing left below it)
  for (const [w, hgt] of [[320, 844], [390, 844], [428, 844], [844, 390], [568, 320]]) for (const scale of [1, 1.14, 1.33]) {
    const w0 = w; const ctx = await b.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(INIT);
    const p = await ctx.newPage();
    p.on('pageerror', e=>errors.push(`${w}×${scale}: ${e.message}`));
    await p.goto(`http://127.0.0.1:${PORT}/financial-2525/`, { waitUntil:'networkidle', timeout:30000 });
    await p.waitForSelector('[data-fin-tx-open]', { timeout: 15000 });
    await p.click('[data-fin-tx-open]'); await p.waitForSelector('#fin-transaction-form');
    await p.selectOption('[data-fin-type]', 'deposit'); await p.fill('[data-fin-amount-input]', '3604.49');
    await p.locator('#fin-transaction-form').getByLabel('Day and time (CST)').fill('2026.10.01_08.00..00');
    await p.selectOption('[data-fin-length="transaction"]', 'paymot'); await p.click('[data-fin-record]');
    await p.waitForSelector('[data-fin-chart-expand]', { timeout: 10000 });
    await p.locator('[data-fin-chart]').scrollIntoViewIfNeeded();
    if (scale !== 1) { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: scale }); }
    await p.waitForTimeout(300);
    await p.click('[data-fin-chart-expand]', { force: true }); await p.waitForTimeout(500);
    const m = await p.evaluate(() => {
      const v = window.visualViewport, o = document.querySelector('[data-fin-chart-full="1"]');
      if (!v || !o) return null;
      const L = v.offsetLeft, R = L + v.width, T = v.offsetTop, B = T + v.height, ob = o.getBoundingClientRect();
      const tag = (el) => el.tagName.toLowerCase() + (Array.from(el.attributes).find((a) => a.name.startsWith('data-'))?.name ? '[' + Array.from(el.attributes).find((a) => a.name.startsWith('data-')).name + ']' : '');
      const all = Array.from(o.querySelectorAll('button, select, label, p, span, canvas')).filter((el) => { const r = el.getBoundingClientRect(); return r.width && r.height; });
      const side = all.filter((el) => { const r = el.getBoundingClientRect(); return r.left < L - 1 || r.right > R + 1; });
      const below = all.filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > B + 1 || r.top < T - 1; });
      return { scale: v.scale, n: side.length, out: side.slice(0, 3).map((el) => tag(el) + ' ' + Math.round(el.getBoundingClientRect().left) + '…' + Math.round(el.getBoundingClientRect().right)),
        nv: below.length, outv: below.slice(0, 3).map((el) => tag(el) + ' ' + Math.round(el.getBoundingClientRect().top) + '…' + Math.round(el.getBoundingClientRect().bottom)), over: o.scrollHeight - o.clientHeight, B: Math.round(B),
        fits: Math.abs(ob.left - L) <= 1 && Math.abs(ob.width - v.width) <= 1 && Math.abs(ob.top - v.offsetTop) <= 1 && Math.abs(ob.height - v.height) <= 1, L: Math.round(L), W: Math.round(v.width), o: [Math.round(ob.left), Math.round(ob.width), Math.round(ob.top), Math.round(ob.height)] };
    });
    ok(!!m, `${w}×${scale}: the chart opens full screen (the state is reached)`);
    if (m) {
      ok(Math.abs(m.scale - scale) < 0.02, `${w}×${scale}: the page is zoomed as asked (scale ${m.scale.toFixed(2)}) — a check that cannot zoom is not evidence`);
      ok(m.fits, `${w}×${scale}: the full-screen layer is the visible screen (layer ${m.o.join(',')} · visible ${m.L},${m.W})`);
      ok(m.n === 0, `${w}×${scale}: every control of the full screen is inside the visible screen (${m.n} outside${m.out.length ? ' · ' + m.out.join(', ') : ''})`);
      // a screen too short for the rows plus a 100 px chart (a 320 px-tall landscape screen zoomed) keeps the chart at its floor and the rest scrolls
      // inside the layer — judged from the chart's measured height, said, never passed off as a fit
      const ch = await p.evaluate(() => document.querySelector('[data-fin-chart-full="1"] canvas[data-rcore-chart]')?.getBoundingClientRect().height ?? 0);
      const short = m.over > 1 && Math.round(ch) <= 101;
      if (short) ok(hgt / scale < 300, `${w0}×${hgt}×${scale}: a screen ${Math.round(hgt / scale)} px tall keeps the chart at its 100 px floor and scrolls the rest (chart ${Math.round(ch)} px · ${m.over} px to scroll) — only ever below 300 px of visible height`);
      else ok(m.nv === 0 && m.over <= 1, `${w0}×${hgt}×${scale}: nothing of the full screen is below the visible bottom (${m.nv} below · ${m.over} px to scroll${m.outv.length ? ' · ' + m.outv.join(', ') + ' · bottom ' + m.B : ''})`);
    }
    await ctx.close();
  }
  // r.074 review: a phone held upright keeps the very drawing it had — the $ chart's viewBox stays 0 0 360 150
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(INIT);
    const p = await ctx.newPage();
    p.on('pageerror', e=>errors.push(`390 upright: ${e.message}`));
    await p.goto(`http://127.0.0.1:${PORT}/financial-2525/`, { waitUntil:'networkidle', timeout:30000 });
    await p.waitForSelector('[data-fin-tx-open]', { timeout: 15000 });
    await p.click('[data-fin-tx-open]'); await p.waitForSelector('#fin-transaction-form');
    await p.selectOption('[data-fin-type]', 'deposit'); await p.fill('[data-fin-amount-input]', '3604.49');
    await p.locator('#fin-transaction-form').getByLabel('Day and time (CST)').fill('2026.10.01_08.00..00');
    await p.selectOption('[data-fin-length="transaction"]', 'paymot'); await p.click('[data-fin-record]');
    await p.waitForSelector('[data-fin-chart]', { timeout: 10000 });
    await p.selectOption('[data-fin-chart-unit]', 'usd'); await p.waitForTimeout(300);
    const vb = await p.evaluate(() => document.querySelector('[data-fin-chart-svg]')?.getAttribute('viewBox'));
    ok(vb === '0 0 360 150', `390 upright: the $ chart keeps its 360 × 150 drawing (viewBox ${vb})`);
    await ctx.close();
  }
  // r.074 (addendum 188 "landscape on PC is not full width; please fix just like we did for Security-2525 Mision Planning. Landscape on phone
  // should also work"; his answer "Same column, full width"): on a PC and on a phone held sideways the one column spans the screen — every card
  // within the 16 px gutters — and the $ chart stretches with it, never taller than 300 px at rest.
  for (const [w, hgt, mobile] of [[1440, 900, false], [1280, 720, false], [1920, 1080, false], [844, 390, true]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: hgt }, ...(mobile ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true } : {}) });
    await ctx.addInitScript(INIT);
    const p = await ctx.newPage();
    p.on('pageerror', e=>errors.push(`${w}×${hgt}: ${e.message}`));
    await p.goto(`http://127.0.0.1:${PORT}/financial-2525/`, { waitUntil:'networkidle', timeout:30000 });
    await p.waitForSelector('[data-fin-tx-open]', { timeout: 15000 });
    // the chart and the Record appear once a transaction is recorded — record one through the real form
    await p.click('[data-fin-tx-open]'); await p.waitForSelector('#fin-transaction-form');
    await p.selectOption('[data-fin-type]', 'deposit'); await p.fill('[data-fin-amount-input]', '3604.49');
    await p.locator('#fin-transaction-form').getByLabel('Day and time (CST)').fill('2026.10.01_08.00..00');
    await p.selectOption('[data-fin-length="transaction"]', 'paymot'); await p.click('[data-fin-record]');
    await p.waitForSelector('[data-fin-chart]', { timeout: 10000 });
    const r = await p.evaluate(() => {
      const W = document.documentElement.clientWidth, root = document.querySelector('[data-financial-ux1]').getBoundingClientRect();
      const cards = ['[data-fin-chart]', '[data-fin-ledger]', '[data-fin-tx-open]'].map((q) => document.querySelector(q)?.closest('[data-financial-ux1] > *')).filter(Boolean);
      const narrow = cards.filter((el) => el.getBoundingClientRect().width < W - 2 * 16 - 2).map((el) => Math.round(el.getBoundingClientRect().width));
      return { W, l: Math.round(root.left), r: Math.round(root.right), n: cards.length, narrow, doc: document.documentElement.scrollWidth };
    });
    ok(r.l <= 1 && r.r >= r.W - 1, `${w}×${hgt}: the column spans the screen (${r.l}…${r.r} of ${r.W})`);
    ok(r.n >= 2 && r.narrow.length === 0, `${w}×${hgt}: every card is the screen's width less the 16 px gutters (${r.n} cards${r.narrow.length ? ' · narrow ' + r.narrow.join(', ') : ''})`);
    ok(r.doc <= r.W + 1, `${w}×${hgt}: nothing pushes the page sideways (${r.doc} of ${r.W})`);
    await p.locator('[data-fin-chart]').scrollIntoViewIfNeeded();
    await p.selectOption('[data-fin-chart-unit]', 'usd'); await p.waitForTimeout(300);
    const u = await p.evaluate(() => { const card = document.querySelector('[data-fin-chart]').getBoundingClientRect(), svg = document.querySelector('[data-fin-chart-svg]')?.getBoundingClientRect(); return svg ? { cw: Math.round(card.width), sw: Math.round(svg.width), sh: Math.round(svg.height) } : null; });
    ok(!!u && u.sw >= u.cw - 40 && u.sh <= 301 && u.sh >= 100, `${w}×${hgt}: the $ chart stretches across its card and keeps a readable height (${u ? u.sw + ' of ' + u.cw + ' wide · ' + u.sh + ' px tall' : 'no chart'})`);
    await ctx.close();
  }
  ok(errors.length===0, `no page errors (${errors.length}${errors.length?': '+errors.slice(0,3).join(' | '):''})`);
  await b.close();
} catch (e) {
  console.log('FAIL: layout smoke could not run —', e.message); fail++;
} finally { srv.close(); }
console.log(`\nfin-layout-smoke: ${pass} passed, ${fail} failed · nothing on the Financial page pushes a phone sideways; the column spans a PC and a phone held sideways; the full-screen chart fits the visible screen at rest and zoomed`);
process.exit(fail?1:0);
