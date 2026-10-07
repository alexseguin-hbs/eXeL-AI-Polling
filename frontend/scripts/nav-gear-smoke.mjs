#!/usr/bin/env node
/**
 * NAV GEAR SMOKE — HP-23 (AsM round 1, 2026-10-07: Christo, Pangu, Sofia, Asar). Inside a session at 375-390 px the
 * navbar's right-hand cluster ran past the screen and the Settings gear — where the easter-egg unlock starts — was
 * off it, so the unlock could not begin on a phone. A source regex cannot see that; a browser can.
 *
 * This serves the built export and, at 375 and 390 px:
 *   1 · /session (a real session from the bundled sample data, no backend): the gear's box lies inside the viewport,
 *       nothing is painted over its centre, and the page is never wider than the screen;
 *   2 · the unlock really STARTS from there: gear → Settings → exel-cyan → sunset → violet, and the badge blinks;
 *   3 · /sim, reached client-side after that unlock (its gate is in-memory, as on a phone): the gear is on screen too.
 * A probe that cannot go red is not evidence: each state is asserted as reached (the gear found, the panel open,
 * the badge blinking, the /sim navbar mounted).
 *
 *   node scripts/nav-gear-smoke.mjs        (needs `next build` first; reads out/)
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const OUT = resolve(new URL('..', import.meta.url).pathname, 'out');
const PORT = Number(process.env.NAV_SMOKE_PORT || 4733);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.txt': 'text/plain',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2' };
// Resolve `/x`, `/x/` and `/x.html` (a 404 on the RSC payload turns a client-side push into a hard reload, which wipes
// the in-memory unlock — see settings-egg-gate.mjs).
const srv = createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(req.url.split('?')[0]);
    let f = join(OUT, p);
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); }
    catch { const alt = join(OUT, p.replace(/\/$/, '') + '.html'); try { await stat(alt); f = alt; } catch { f = join(OUT, p.replace(/\/$/, ''), 'index.html'); } }
    const body = await readFile(f);
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(body);
  } catch { if (!res.headersSent) res.writeHead(404); res.end(); }
}).listen(PORT);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log(`  ✓ ${m}`); } else { fail++; console.log(`FAIL: ${m}`); } };

// The gear's geometry, read from the DOM: inside the viewport on both axes, and the control itself at its centre.
const gear = (p) => p.evaluate(() => {
  const el = document.querySelector('nav [data-nav-settings]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(Math.min(r.left + r.width / 2, window.innerWidth - 1), Math.min(r.top + r.height / 2, window.innerHeight - 1));
  return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: window.innerWidth, h: window.innerHeight,
    hit: !!top && (el === top || el.contains(top)), doc: document.documentElement.scrollWidth };
});
const inside = (g) => !!g && g.l >= 0 && g.r <= g.w + 0.5 && g.t >= 0 && g.b <= g.h && g.r - g.l > 0;
const fmt = (g) => g ? `left ${Math.round(g.l)} · right ${Math.round(g.r)} of ${g.w}${g.hit ? '' : ' · covered'}` : 'gear not found';

try {
  const { chromium } = await import('playwright');
  const cands = [process.env.CHROMIUM_PATH, '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium'].filter(Boolean);
  let executablePath; for (const x of cands) { try { await stat(x); executablePath = x; break; } catch {} }
  const b = await chromium.launch(executablePath ? { executablePath } : {});
  for (const w of [375, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { try { localStorage.setItem('exel-active-locale', 'en'); } catch {} });
    const p = await ctx.newPage();
    const errors = []; p.on('pageerror', (e) => errors.push(e.message));

    // 1 · /session
    await p.goto(`http://127.0.0.1:${PORT}/session/?id=DEMO2026&sim=1`, { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForSelector('nav [data-nav-settings]', { timeout: 15000 }).catch(() => null);
    let g = await gear(p);
    ok(!!g, `${w}: /session — the Settings gear renders in the navbar`);
    ok(inside(g), `${w}: /session — the gear lies inside the viewport (${fmt(g)})`);
    ok(!!g && g.hit, `${w}: /session — nothing is painted over the gear`);
    ok(!!g && g.doc <= g.w + 1, `${w}: /session — the page is not wider than the screen (${g?.doc} of ${g?.w})`);

    // 2 · the unlock starts from that gear, on the phone
    if (g) {
      await p.click('nav [data-nav-settings]');
      await p.getByRole('button', { name: 'Settings' }).last().click();
      const panel = await p.waitForSelector('[data-settings-footer]', { timeout: 10000 }).catch(() => null);
      ok(!!panel, `${w}: the gear opens the Settings panel`);
      for (const id of ['exel-cyan', 'sunset', 'violet']) {
        await p.locator(`[data-theme-preset="${id}"]`).first().scrollIntoViewIfNeeded().catch(() => null);
        await p.click(`[data-theme-preset="${id}"]`).catch(() => null);
        await p.waitForTimeout(120);
      }
      await p.waitForTimeout(300);
      const blinking = await p.evaluate(() => /badge-blink/.test(document.querySelector('[data-settings-footer] [data-exel-badge] button')?.className || ''));
      ok(blinking, `${w}: exel-cyan → sunset → violet unlocks — the badge blinks`);

      // 3 · /sim, client-side (a hard load would reset the in-memory unlock and bounce home)
      await p.keyboard.press('Escape').catch(() => null);
      await p.evaluate(() => { window.__navMarker = 1; window.next?.router?.push('/sim/'); });
      await p.waitForURL(/\/sim\/?/, { timeout: 15000 }).catch(() => null);
      await p.waitForFunction(() => /\[SIM · Split\]/.test(document.querySelector('nav')?.textContent || '') || !!document.querySelector('nav [data-nav-settings]') && location.pathname.startsWith('/sim'), null, { timeout: 15000 }).catch(() => null);
      const soft = await p.evaluate(() => window.__navMarker === 1 && location.pathname.startsWith('/sim'));
      ok(soft, `${w}: /sim reached client-side after the unlock (url ${p.url()})`);
      await p.waitForTimeout(400);
      g = await gear(p);
      ok(inside(g), `${w}: /sim — the gear lies inside the viewport (${fmt(g)})`);
      ok(!!g && g.hit, `${w}: /sim — nothing is painted over the gear`);
    }
    ok(errors.length === 0, `${w}: no page errors${errors.length ? ' — ' + errors.slice(0, 2).join(' | ') : ''}`);
    await ctx.close();
  }
  await b.close();
} catch (e) {
  fail++; console.log('FAIL: nav-gear-smoke could not run —', e?.message || e);
}
srv.close();
console.log(`nav-gear-smoke: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
