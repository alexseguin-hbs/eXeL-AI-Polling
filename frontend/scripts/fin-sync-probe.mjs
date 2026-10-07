#!/usr/bin/env node
/**
 * SYNC PROBE — the budget, the cards and the cloud mark against an account store that behaves like the real one (r.073, second pre-push
 * review). Two blockers passed every gate because the gates read source lines and the test store kept keys in the order they were sent:
 *  · Thor: a REALLY full phone refuses a write that makes storage grow but takes a rewrite of the same size — so it refused the budget's
 *    lines and took their 13-character time, held old lines under a new time, and the next sync sent them over the account's newer copy;
 *  · Krishna: the account store keeps jsonb and hands keys back shortest-first — so identical cards read as "other cards" and went up again
 *    on every sync, beating a newer rename made on another device.
 * This serves the built export, signs TEST browsers in (the Auth0 SPA cache — nothing in the product is bypassed), and routes the page's
 * account calls to a store in this process (the chunk that calls the store is patched at serve time: X.supabase → globalThis.__FAKE_SB). The
 * store returns every object's keys in jsonb order. The real service is never called; every outside request is blocked. Each scenario
 * asserts the state it needs was reached — a probe that cannot go red is not evidence.
 *
 *   node scripts/fin-sync-probe.mjs        (needs `next build` first; reads out/)
 */
import { createServer } from 'node:http';
import { readFile, stat, readdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
const OUT = process.env.FIN_OUT || resolve(new URL('..', import.meta.url).pathname, 'out');   // FIN_OUT: run it on another build (the mutation proof)
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
// ── the account store: rows per owner|name, keys handed back in jsonb order (shortest key first, then by bytes)
const store = { rows: new Map(), log: [] };
const jsonb = (v) => JSON.parse(JSON.stringify(v, (_k, x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort((a, b) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0)).map((k) => [k, x[k]])) : x)));
const puts = (name) => store.log.filter((l) => l.fn === 'innovation_state_put' && l.name === name).length;
const rowOf = (name) => { for (const [k, v] of store.rows) if (k.endsWith(`|${name}`)) return v; return null; };
const until = async (fn, ms = 15000, step = 100) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, step)); } return null; };
async function findStoreChunks() {   // EVERY chunk that calls the store: lib/innovation-store.ts shares the RPC name with lib/financial-2525/cloud.ts
  const dir = join(OUT, '_next/static/chunks'), hits = [];
  const walk = async (d, rel) => { for (const f of await readdir(d, { withFileTypes: true })) { const p = join(d, f.name), r = `${rel}/${f.name}`; if (f.isDirectory()) await walk(p, r); else if (f.name.endsWith('.js')) { const s = await readFile(p, 'utf8'); if (s.includes('"innovation_state_put"')) hits.push({ path: `/_next/static/chunks${r}`, s }); } } };
  await walk(dir, '');
  return hits;
}
const patchedChunks = new Map((await findStoreChunks()).map((c) => [c.path, c.s.replace(/([A-Za-z_$][\w$]*)\.supabase\b/g, '(globalThis.__FAKE_SB||$1.supabase)')]));
const finHtml = await readFile(join(OUT, 'financial-2525/index.html'), 'utf8').catch(() => '');
ok([...patchedChunks.keys()].some((k) => finHtml.includes(k.slice(1))), 'the page\'s account calls are routed to the probe\'s store (the state is reached)');
const srv = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/__fakesb') {
      let body = ''; for await (const c of req) body += c;
      const { fn, args } = JSON.parse(body), k = `${args.p_owner}|${args.p_name}`;
      let out = { data: null, error: null };
      if (fn === 'innovation_state_put') store.rows.set(k, jsonb(args.p_payload));
      else if (fn === 'innovation_state_get') out = { data: store.rows.get(k) ?? null, error: null };
      store.log.push({ fn, name: args.p_name, at: Date.now() });
      res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(out)); return;
    }
    if (patchedChunks.has(p)) { res.writeHead(200, { 'content-type': 'text/javascript' }); res.end(patchedChunks.get(p)); return; }
    let f = join(OUT, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); } catch { f = extname(f) ? f : join(f, 'index.html'); }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(await readFile(f));
  } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const PORT = srv.address().port;
const CLIENT = 'H8wuT6P2nfm87bvbRjaegoOliLyhPw4K';
const signIn = (sub) => `try { localStorage.setItem("exel-active-locale","en"); localStorage.setItem("exel-theme-id","exel-cyan"); const clientId=${JSON.stringify(CLIENT)};
  const user={ sub:${JSON.stringify(sub)}, name:"Sync Probe", email:"sync-probe@example.invalid", email_verified:true, updated_at:new Date().toISOString() };
  const b64=(o)=>btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/=+$/,"").replace(/\\+/g,"-").replace(/\\//g,"_"); const now=Math.floor(Date.now()/1000);
  const claims={...user, iss:"https://exel-ai-polling.us.auth0.com/", aud:clientId, iat:now, exp:now+86400}; const idToken=b64({alg:"none",typ:"JWT"})+"."+b64(claims)+".sig";
  const decodedToken={ encoded:{header:"",payload:"",signature:""}, header:{alg:"none",typ:"JWT"}, claims:{__raw:idToken,...claims}, user };
  localStorage.setItem("@@auth0spajs@@::"+clientId+"::@@user@@", JSON.stringify({id_token:idToken, decodedToken}));
  localStorage.setItem("@@auth0spajs@@::"+clientId+"::default::openid profile email", JSON.stringify({ body:{client_id:clientId, access_token:"probe", id_token:idToken, scope:"openid profile email", oauthTokenScope:"openid profile email", expires_in:86400, decodedToken, audience:"default"}, expiresAt: now+86400 })); } catch {}
  globalThis.__FAKE_SB = { rpc: async (fn, args) => { const r = await fetch("/__fakesb", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fn, args }) }); return r.json(); } };`;
// a REALLY full phone (Thor): a write that makes storage grow is refused; a rewrite of the same size or smaller is taken
// (on this page's own keys — the rest of the app is not under test here)
const FULL = `(() => { const S = Storage.prototype, set = S.setItem; S.setItem = function (k, v) { const old = this.getItem(k), grow = old === null ? String(k).length + String(v).length : String(v).length - old.length; if (/^(fin-|exel-fin:)/.test(String(k)) && grow > 0) throw new DOMException("The quota has been exceeded.", "QuotaExceededError"); return set.call(this, k, v); }; })();`;
const errors = [];
try {
  const { chromium } = await import('playwright');
  const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean);
  let executablePath; for (const x of cands) { try { await stat(x); executablePath = x; break; } catch {} }
  const b = await chromium.launch(executablePath ? { executablePath } : {});
  const context = async (sub, full = false) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 900 } });
    await ctx.route('**/*', (route) => (route.request().url().startsWith('http://127.0.0.1') ? route.continue() : route.abort()));
    await ctx.addInitScript(signIn(sub)); if (full) await ctx.addInitScript(FULL);
    return ctx;
  };
  const open = async (ctx) => { const p = await ctx.newPage(); p.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 160))); await p.goto(`http://127.0.0.1:${PORT}/financial-2525/`, { waitUntil: 'networkidle', timeout: 60000 }); await p.waitForSelector('[data-fin-tx-open]', { timeout: 20000 }); return p; };
  const typeLine = async (p, field, text) => { const box = p.locator(`[data-fin-plan-amount="${field}"]`); await box.click(); await box.press('Control+A'); await box.press('Backspace'); await box.pressSequentially(text, { delay: 15 }); await box.blur(); };
  const rentOf = (row) => row?.lines?.find((l) => l.fieldId === 'B.rent_mortgage')?.amountNative;

  // ── 1 · THOR: a really full phone never sends its old budget over the account's newer one
  {
    const ctx = await context('auth0|sync-probe-thor');
    let p = await open(ctx);
    ok(!!(await until(() => rowOf('fin-plan'))), 'Thor 1: the first sync reads the account and writes the budget (the state is reached)');
    await p.click('[data-fin-budget-edit]'); await p.waitForSelector('[data-fin-plan-amount="B.rent_mortgage"]');
    await typeLine(p, 'B.rent_mortgage', '111');
    ok(!!(await until(() => rentOf(rowOf('fin-plan')) === 111)), `Thor 1: the account holds the typed 111 (it reads ${rentOf(rowOf('fin-plan'))})`);
    await p.evaluate(FULL);   // from here the phone is full: growth refused, same-size rewrites taken
    await typeLine(p, 'B.rent_mortgage', '99999');
    ok(await p.locator('[data-fin-plan-save-failed]').count() > 0, 'Thor 1: the full phone says it would not keep the budget');
    ok(!!(await until(() => rentOf(rowOf('fin-plan')) === 99999)), `Thor 1: the account holds 99999 while the phone could not store it (reads ${rentOf(rowOf('fin-plan'))})`);
    const deviceAt = await p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith('fin-plan-at:')); return k ? Number(localStorage.getItem(k)) : 0; });
    const accountAt = rowOf('fin-plan')?.at ?? 0;
    ok(deviceAt < accountAt, `Thor 1: the phone never dates lines it did not keep (device time ${deviceAt} < account time ${accountAt})`);
    await p.close(); await ctx.addInitScript(FULL);
    const mark = store.log.length;
    p = await open(ctx);   // the reload a real person makes
    ok(!!(await until(() => store.log.slice(mark).some((l) => l.fn === 'innovation_state_get' && l.name === 'fin-plan'), 15000)), 'Thor 1: the reloaded phone reads the account again (the state is reached)');
    await p.waitForTimeout(2500);
    ok(rentOf(rowOf('fin-plan')) === 99999, `Thor 1: after a reload the account still holds 99999 — never the phone's old 111 (reads ${rentOf(rowOf('fin-plan'))})`);
    await p.click('[data-fin-budget-edit]'); await p.waitForSelector('[data-fin-plan-amount="B.rent_mortgage"]');
    const shown = await p.locator('[data-fin-plan-amount="B.rent_mortgage"]').inputValue();
    ok(shown.replace(/,/g, '') === '99999', `Thor 1: the page shows the account's 99999 (shows ${shown})`);
    await ctx.close();
  }

  // ── 2 · KRISHNA: identical cards in jsonb order are not re-sent; a newer rename on another device reaches this one
  store.rows.clear(); store.log.length = 0;   // a fresh account (rowOf reads the first row of a name)
  {
    const ctx = await context('auth0|sync-probe-krishna');
    const p = await open(ctx);
    await until(() => store.log.some((l) => l.fn === 'innovation_state_get' && l.name === 'fin-cards'));
    await p.click('[data-fin-cards] summary');
    await p.click('[data-fin-card-add]'); await p.waitForSelector('[data-fin-card-add-form]');
    await p.fill('[data-fin-card-new="name"]', 'Probe Visa'); await p.fill('[data-fin-card-new="limit"]', '3,000'); await p.fill('[data-fin-card-new="opening"]', '735.27');
    await p.click('[data-fin-card-add-save]');
    ok(!!(await until(() => (rowOf('fin-cards')?.cards ?? []).some((c) => c.name === 'Probe Visa'))), 'Krishna 2: the new card reaches the account (the state is reached)');
    const after = puts('fin-cards');
    for (const amt of ['10', '20', '30']) {
      await p.click('[data-fin-tx-open]'); await p.waitForSelector('#fin-transaction-form');
      await p.selectOption('[data-fin-type]', 'deposit'); await p.fill('[data-fin-amount-input]', amt);
      const before = store.log.length; await p.click('[data-fin-record]');
      await until(() => store.log.slice(before).some((l) => l.fn === 'innovation_state_get' && l.name === 'fin-cards'), 10000);
      await p.waitForTimeout(800);
    }
    ok(puts('fin-cards') === after, `Krishna 2: three syncs after the card was added write the cards ${puts('fin-cards') - after} more time(s) — never again (jsonb order is not a change)`);
    // another device renames the card later, straight in the account
    const row = rowOf('fin-cards'); const owner = [...store.rows.keys()].find((k) => k.endsWith('|fin-cards')).split('|')[0];
    store.rows.set(`${owner}|fin-cards`, jsonb({ cards: row.cards.map((c) => ({ ...c, name: 'Probe Visa Gold' })), at: (row.at ?? 0) + 60000 }));
    const before = store.log.length;
    await p.evaluate(() => window.dispatchEvent(new Event('online')));
    await until(() => store.log.slice(before).some((l) => l.fn === 'innovation_state_get' && l.name === 'fin-cards'), 10000);
    const shown = await until(() => p.locator('[data-fin-card-toggle]').textContent().then((t) => (t.includes('Probe Visa Gold') ? t : null)), 10000);
    ok(!!shown && (rowOf('fin-cards')?.cards ?? [])[0]?.name === 'Probe Visa Gold', `Krishna 2: the other device's later rename reaches this phone and stays in the account (account: ${(rowOf('fin-cards')?.cards ?? [])[0]?.name})`);

    // ── 3 · THOR: "saved to your account" only while the account holds what the page shows
    await until(() => p.locator('[data-fin-cloud]').getAttribute('data-fin-cloud').then((v) => v === 'saved'), 10000);
    ok(await p.locator('[data-fin-cloud]').getAttribute('data-fin-cloud') === 'saved', 'Thor 3: the cloud mark reads saved once the account holds the record (the state is reached)');
    await p.click('[data-fin-tx-open]'); await p.waitForSelector('#fin-transaction-form');
    await p.selectOption('[data-fin-type]', 'deposit'); await p.fill('[data-fin-amount-input]', '44.44');
    await p.click('[data-fin-record]'); await p.waitForTimeout(100);
    const right = await p.locator('[data-fin-cloud]').getAttribute('data-fin-cloud');
    ok(right !== 'saved', `Thor 3: a new entry the account does not hold yet never reads "saved" (read ${right} at once)`);
    const back = await until(async () => (await p.locator('[data-fin-cloud]').getAttribute('data-fin-cloud')) === 'saved' && JSON.stringify(rowOf('fin-record') ?? {}).includes('4444'), 15000);
    ok(!!back, 'Thor 3: …and reads saved again once its sync holds it');

    // ── 4 · ENKI: a refused figure typed into a budget line never lands on the line, the device or the account
    await p.click('[data-fin-budget-edit]'); await p.waitForSelector('[data-fin-plan-amount="B.rent_mortgage"]');
    await typeLine(p, 'B.rent_mortgage', '700');
    await until(() => rentOf(rowOf('fin-plan')) === 700);
    for (const bad of ['1e3', '0x10', '12,50']) {
      await typeLine(p, 'B.rent_mortgage', bad);
      ok(await p.locator('[data-fin-budget-bad]').count() > 0, `Enki 4: "${bad}" is refused out loud`);
    }
    await p.waitForTimeout(2500);
    const dev = await p.evaluate(() => { const k = Object.keys(localStorage).find((x) => x.startsWith('fin-plan-') && !x.startsWith('fin-plan-at:')); try { return JSON.parse(localStorage.getItem(k) || '[]').find((l) => l.fieldId === 'B.rent_mortgage')?.amountNative; } catch { return null; } });
    ok(dev === 700 && rentOf(rowOf('fin-plan')) === 700, `Enki 4: after 1e3, 0x10 and 12,50 the line is still 700 on the device and in the account (device ${dev}, account ${rentOf(rowOf('fin-plan'))}; r.073 left 1.00, 0.00, 12.00)`);
    await ctx.close();
  }
  ok(errors.length === 0, `no page errors (${errors.length}${errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''})`);
  await b.close();
} catch (e) { console.log('FAIL: the sync probe could not run —', e.message); fail++; } finally { srv.close(); }
console.log(`\nfin-sync-probe: ${pass} passed, ${fail} failed · the budget and the cards never go back to an older copy; "saved to your account" only when it is`);
process.exit(fail ? 1 : 0);
