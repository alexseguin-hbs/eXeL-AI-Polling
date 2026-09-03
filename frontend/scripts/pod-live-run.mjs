// pod-live-run.mjs — the SoI pod, three REAL phones, end to end. Proof of outcome, not a unit test.
//
// Three Chromium contexts at 375×812 (mobile) drive one lead + two joiners through every phase:
// compose → open pod → join by link and by typed code → seats assigned → names + agreement
// replicated → synchronized start (three Start presses) → ACTIVE on all three → a JOINER stops →
// record (written) → audit (hours + what you did) → cross-witness (each phone the other two) →
// settle → the same receipt on every phone, carrying the recorded outcome.
//
// It runs against a local Next dev server and the local Realtime relay (scripts/realtime-relay.mjs),
// which speaks the Supabase Realtime v2 wire so the app's OWN supabase-js client and the SACRED
// use-session-broadcast hook are exercised unmodified. What it does NOT prove: the hosted Supabase
// service, Auth0 login, or a real network. Screenshots + a timestamped step log land in OUT.
//
//   terminal 1:  npm run pod:relay
//   terminal 2:  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:4999 NEXT_PUBLIC_SUPABASE_ANON_KEY=local npx next dev -p 3210
//   terminal 3:  npm run test:soi-pod-live        (POD_BASE / OUT override the defaults)
import { chromium } from 'playwright-core';
import fs from 'fs';
const BASE = process.env.POD_BASE || 'http://127.0.0.1:3210/soi-session/';
const OUT = process.env.OUT || '../docs/assessments/pod-live-run';
fs.mkdirSync(OUT, { recursive: true }); const log = []; const t0 = Date.now();
const step = (who, what, ok = true, extra = '') => { const l = `${String(Date.now() - t0).padStart(6)}ms  ${who.padEnd(6)} ${ok ? 'OK ' : 'FAIL'} ${what}${extra ? '  ' + extra : ''}`; console.log(l); log.push(l); if (!ok) { fs.writeFileSync(OUT + '/log.txt', log.join('\n')); throw new Error(what); } };
const ready = async (p) => { await p.waitForSelector('next-route-announcer', { state: 'attached', timeout: 60000 }); await p.waitForTimeout(300); };
const shot = async (p, who, name) => p.screenshot({ path: `${OUT}/${name}-${who}.jpg`, type: 'jpeg', quality: 55, fullPage: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const phones = {};
for (const who of ['lead', 'ana', 'bo']) { const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true }); phones[who] = await ctx.newPage(); phones[who].on('console', (m) => { if (m.type() !== 'log' || /pod/i.test(m.text())) console.log('  [console:' + who + ']', m.type(), m.text().slice(0, 160)); }); phones[who].on('pageerror', (e) => step(who, 'pageerror ' + e.message, false)); }
process.on('uncaughtException', async (e) => { console.log('FAILED:', e.message.split('\n')[0]); for (const [w, p] of Object.entries(phones)) await p.screenshot({ path: `${OUT}/FAIL-${w}.jpg`, type: 'jpeg', quality: 55, fullPage: true }).catch(() => {}); fs.writeFileSync(OUT + '/log.txt', log.join('\n')); process.exit(1); });
const L = phones.lead, A = phones.ana, B = phones.bo;
const NAMES = { lead: 'Lea', ana: 'Ana', bo: 'Bo' };

// 1 · lead composes and opens the pod
await L.goto(BASE, { waitUntil: 'domcontentloaded' }); await ready(L); step('lead', 'login/open /soi-session');
await L.getByPlaceholder(/De-risk the first/).fill('Prove the pod works with three live phones.');
await L.getByPlaceholder(/One spec validated/).fill('One settled receipt witnessed by all three, screenshot on every phone.');
await L.getByPlaceholder('Your name').fill(NAMES.lead);
await L.getByPlaceholder(/your email/).fill('lea@example.test');
await shot(L, 'lead', '1-compose');
const open = L.getByRole('button', { name: /Share QR/ }); await open.waitFor(); step('lead', 'open button enabled', await open.isEnabled());
await open.click();
await L.locator('code').first().waitFor();
const code = (await L.locator('code').first().innerText()).trim(); step('lead', 'pod code issued', /^[A-Z0-9]{4,8}$/.test(code), code);
await L.getByText('● live').waitFor({ timeout: 15000 }); step('lead', 'live channel subscribed (relay)');
await shot(L, 'lead', '2-invite');

// 2 · two joiners dial in by code (one via ?pod= link, one by typing the code)
await A.goto(`${BASE}?pod=${code}`, { waitUntil: 'domcontentloaded' }); await ready(A); step('ana', 'opened join link ?pod=' + code);
await B.goto(BASE, { waitUntil: 'domcontentloaded' }); await ready(B);
await B.getByPlaceholder(/code/i).first().fill(code); await B.getByRole('button', { name: /join/i }).first().click(); step('bo', 'typed the code and joined');
await A.getByText(/you are seat 2/).waitFor({ timeout: 15000 }); step('ana', 'assigned seat 2 by the lead roster');
await B.getByText(/you are seat 3/).waitFor({ timeout: 15000 }); step('bo', 'assigned seat 3 by the lead roster');
await L.getByText(/3 in the pod/).waitFor({ timeout: 15000 }); step('lead', 'lead sees 3 in the pod');
// each joiner names their own seat, everyone agrees
for (const [who, p] of [['ana', A], ['bo', B]]) { const inp = p.getByPlaceholder('enter your name').locator('visible=true'); const en = inp.filter({ hasNot: p.locator('[disabled]') }); await inp.first().waitFor(); 
  const all = await inp.all(); let filled = false; for (const i of all) { if (await i.isEnabled()) { await i.fill(NAMES[who]); filled = true; break; } } step(who, 'entered own name', filled); }
for (const [who, p] of [['lead', L], ['ana', A], ['bo', B]]) { const boxes = await p.getByRole('checkbox').all(); let ok = false; for (const b of boxes) { if (await b.isEnabled()) { await b.check(); ok = true; break; } } step(who, 'agreed (own checkbox)', ok); }
await L.waitForFunction(() => [...document.querySelectorAll('span,input')].some((i) => (i.value || i.textContent || '').trim() === 'Bo'), null, { timeout: 15000 }); step('lead', 'roster shows Bo (name replicated)');
await A.waitForFunction(() => [...document.querySelectorAll('span,input')].some((i) => (i.value || i.textContent || '').trim() === 'Bo'), null, { timeout: 15000 }); step('ana', 'roster shows Bo (peer replicated)');
const go = L.getByRole('button', { name: /Accepted by the trio/ }); await go.waitFor(); 
await L.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => /Accepted by the trio/.test(x.textContent)); return b && !b.disabled; }, null, { timeout: 15000 }); step('lead', 'all three agreed → sync unlocked');
await Promise.all([shot(L, 'lead', '3-agreed'), shot(A, 'ana', '3-agreed'), shot(B, 'bo', '3-agreed')]);
await go.click();

// 3 · synchronized start — all three within 15 s
for (const [who, p] of [['lead', L], ['ana', A], ['bo', B]]) { await p.getByText(/tap to start/).first().waitFor({ timeout: 15000 }); step(who, 'reached SYNC'); }
for (const [who, p] of [['lead', L], ['ana', A], ['bo', B]]) { const btns = await p.getByRole('button', { name: /tap to start/ }).all(); let ok = false; for (const b of btns) { if (await b.isEnabled()) { await b.click(); ok = true; break; } } step(who, 'pressed Start (own seat only)', ok); }
for (const [who, p] of [['lead', L], ['ana', A], ['bo', B]]) { await p.getByText(/Session running/).waitFor({ timeout: 20000 }); step(who, 'ACTIVE — all three started together'); }
await Promise.all([shot(L, 'lead', '4-active'), shot(A, 'ana', '4-active'), shot(B, 'bo', '4-active')]);

// 4 · a non-lead stops the session for everyone; the outcome is recorded in words
await A.getByRole('button', { name: /stop/i }).first().click(); step('ana', 'joiner pressed Stop');
for (const [who, p] of [['lead', L], ['ana', A], ['bo', B]]) { await p.getByPlaceholder(/outcome/i).first().waitFor({ timeout: 15000 }); step(who, 'reached RECORD'); }
await A.getByPlaceholder(/Write the outcome|type it here/).first().fill('Three phones, one pod: the receipt below is the outcome.');
const nxt = A.getByRole('button', { name: /witness the hours/ }); await nxt.click(); step('ana', 'recorded outcome (words) → audit');
for (const [who, p] of [['lead', L], ['ana', A], ['bo', B]]) { await p.getByPlaceholder('hours').first().waitFor({ timeout: 15000 }); step(who, 'reached AUDIT'); }
await Promise.all([shot(L, 'lead', '5-record'), shot(A, 'ana', '5-record'), shot(B, 'bo', '5-record')]);

// 5 · self-audit + cross-witness on every phone
for (const [who, p] of [['lead', L], ['ana', A], ['bo', B]]) {
  const hrs = await p.getByPlaceholder('hours').all(); let ok = false; for (const h of hrs) if (await h.isEnabled()) { await h.fill('1.5'); ok = true; break; }
  const did = await p.getByPlaceholder(/what you did/).all(); for (const d of did) if (await d.isEnabled()) { await d.fill(`${NAMES[who]} tested the pod`); break; }
  step(who, 'self-audit (hours + what you did)', ok);
}
for (const [who, p] of [['lead', L], ['ana', A], ['bo', B]]) {
  await p.waitForTimeout(500);
  const info = await p.evaluate(() => [...document.querySelectorAll('button')].filter((b) => /witnesses/.test(b.textContent)).map((b) => b.textContent.trim() + (b.disabled ? ' [disabled]' : '')));
  console.log('  [' + who + ' witness buttons]', info.join(' | '));
  let n = 0; for (let k = 0; k < 2; k++) {
    // real DOM click on the enabled "<me> witnesses" button in another member's row (one per pass)
    const clicked = await p.evaluate((name) => { const b = [...document.querySelectorAll('button')].find((x) => new RegExp(`^${name} witnesses$`, 'i').test(x.textContent.trim()) && !x.disabled); if (!b) return false; b.click(); return true; }, NAMES[who]);
    if (clicked) n++; await p.waitForTimeout(300);
  }
  const c = 2;
  step(who, 'witnessed the other two', n === 2, `clicked ${n} of ${c}`);
}
await L.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => /Settle/.test(x.textContent)); return b && !b.disabled; }, null, { timeout: 20000 }); step('lead', 'all witnessed + all self-audited → settle unlocked');
await Promise.all([shot(L, 'lead', '6-audit'), shot(A, 'ana', '6-audit'), shot(B, 'bo', '6-audit')]);
await L.getByRole('button', { name: /Settle/ }).click();
for (const [who, p] of [['lead', L], ['ana', A], ['bo', B]]) { await p.getByText(/Settled & receipted by the pod|Settled &amp; receipted/).waitFor({ timeout: 20000 }); step(who, 'CLOSED — receipt on this phone'); }
await Promise.all([shot(L, 'lead', '7-closed'), shot(A, 'ana', '7-closed'), shot(B, 'bo', '7-closed')]);
const receipt = await L.locator('p', { hasText: /Recorded \(/ }).first().innerText(); step('lead', 'receipt text', /Three phones, one pod/.test(receipt), receipt.slice(0, 80));
fs.writeFileSync(OUT + '/log.txt', log.join('\n'));
await browser.close(); console.log('\nPOD 3-PHONE LIVE RUN: ' + log.length + ' steps, 0 failures');
