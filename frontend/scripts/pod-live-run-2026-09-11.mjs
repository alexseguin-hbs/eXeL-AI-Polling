// pod-live-run-2026-09-11.mjs — the SoI pod as a SHOWCASE: three EMULATED phones (three Chromium mobile contexts on one host,
// over the local Realtime relay), every phase, with the clock as a button. Not hosted Supabase, not three devices.
//
// Operator (2026-09-11): "use POD SOI-2525 and vision-2525 as a test to showcase the first universal system that
// highlights input in time and authorize local min wage for value". Two claims are made visible here:
//   1. INPUT IN TIME — the lead presses Start, Stop, Add time, Stop; the span is the SUM of both segments, shown in
//      h:mm:ss and N.mmmm..ssss on every phone; a typed claim is capped to what was clocked.
//   2. LOCAL MINIMUM WAGE AUTHORIZES VALUE — the pod's agreed place is New York · Remainder of state (16.00 USD, a
//      dataset scope election); Ana elects Brazil (7.37 BRL, the dataset's verified decree); Bo elects Metro Manila
//      (86.875 PHP, a place the dataset does not name); the same hours mint the same 웃 = M × T; each settles in their
//      own currency, with a USA equivalent beside it wherever a traceable route exists — and the words "awaiting a dated
//      exchange-rate source" where none does (operator 2026-09-12).
//   3. GPS AS A SUPPLEMENT — Ana adds her phone's position fix beside the place she elected; it prints on the receipt
//      and never picks a floor.
// Plus the ruling: the task's PLAN (hours × M) is set by the pod and accepted by all three BEFORE the clock.
//
// Runs against the local Next dev server + scripts/realtime-relay.mjs (the Supabase Realtime v2 wire), so the app's own
// supabase-js client and the SACRED use-session-broadcast hook run unmodified. Not proven: hosted Supabase, Auth0.
//
//   terminal 1:  npm run pod:relay
//   terminal 2:  NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:4999 NEXT_PUBLIC_SUPABASE_ANON_KEY=local npx next dev -p 3210
//   terminal 3:  node scripts/pod-live-run-2026-09-11.mjs        (POD_BASE / OUT / WORK_MS override the defaults)
import { chromium } from 'playwright-core';
import fs from 'fs';
const BASE = process.env.POD_BASE || 'http://127.0.0.1:3210/soi-session/';
const OUT = process.env.OUT || '../docs/assessments/pod-live-run-2026-09-11';
const WORK_MS = Number(process.env.WORK_MS || 12000);      // how long each clock segment runs — real seconds, witnessed
fs.mkdirSync(OUT, { recursive: true }); const log = []; const t0 = Date.now();
const step = (who, what, ok = true, extra = '') => { const l = `${String(Date.now() - t0).padStart(6)}ms  ${who.padEnd(6)} ${ok ? 'OK ' : 'FAIL'} ${what}${extra ? '  ' + extra : ''}`; console.log(l); log.push(l); if (!ok) { fs.writeFileSync(OUT + '/log.txt', log.join('\n')); throw new Error(what); } };
const ready = async (p) => { await p.waitForSelector('next-route-announcer', { state: 'attached', timeout: 90000 }); await p.waitForTimeout(300); };
const shot = async (p, who, name) => p.screenshot({ path: `${OUT}/${name}-${who}.jpg`, type: 'jpeg', quality: 60, fullPage: true });
const shotAll = (name) => Promise.all([shot(L, 'lead', name), shot(A, 'ana', name), shot(B, 'bo', name)]);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const phones = {};
const SAO_PAULO = { latitude: -23.5505, longitude: -46.6333, accuracy: 25 };   // Ana's emulated phone reports this fix
for (const who of ['lead', 'ana', 'bo']) { const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, ...(who === 'ana' ? { geolocation: SAO_PAULO, permissions: ['geolocation'] } : {}) }); phones[who] = await ctx.newPage(); phones[who].on('pageerror', (e) => step(who, 'pageerror ' + e.message, false)); }
process.on('uncaughtException', async (e) => { console.log('FAILED:', e.message.split('\n')[0]); for (const [w, p] of Object.entries(phones)) await p.screenshot({ path: `${OUT}/FAIL-${w}.jpg`, type: 'jpeg', quality: 60, fullPage: true }).catch(() => {}); fs.writeFileSync(OUT + '/log.txt', log.join('\n')); process.exit(1); });
const L = phones.lead, A = phones.ana, B = phones.bo;
const NAMES = { lead: 'Lea', ana: 'Ana', bo: 'Bo' };
const ALL = [['lead', L], ['ana', A], ['bo', B]];
const enabledOf = async (loc) => { for (const el of await loc.all()) if (await el.isEnabled()) return el; return null; };

// 1 · the lead composes the task and its PLAN — hours × M — and elects the pod's default place
await L.goto(BASE + '?enter=session', { waitUntil: 'domcontentloaded' }); await ready(L); step('lead', 'opened /soi-session');
await L.getByPlaceholder(/De-risk the first/).fill('Showcase: input in time, and local minimum wage authorizing value.');
await L.getByPlaceholder(/One spec validated/).fill('Two clocked segments, three outcomes, three currencies on one receipt.');
await L.getByPlaceholder('Your name').fill(NAMES.lead);
await L.getByPlaceholder(/your email/).fill('lea@example.test');
await L.getByTestId('baseline-hours').fill('2');                                    // the PLAN: 2 h …
await L.getByTestId('anchor-multiple').selectOption('3');                          // … at 3× = 6 웃 planned
step('lead', 'plan set: 2 h at 3× (planned 6 웃)');
await L.getByTestId('anchor-region').selectOption('US');
await L.getByTestId('anchor-region-locality').waitFor({ timeout: 10000 });
const nyOpt = await L.getByTestId('anchor-region-locality').evaluate((sel) => [...sel.options].find((o) => /New York · Remainder of state/.test(o.textContent))?.value || '');
step('lead', 'United States offers New York by scope — "Remainder of state" — as a locality (the dataset\'s own rows)', !!nyOpt);
await L.getByTestId('anchor-region-locality').selectOption(nyOpt); step('lead', 'pod default place: United States — New York · Remainder of state (16.00 USD/h)');
await L.getByTestId('anchor-usd').waitFor({ timeout: 10000 }); step('lead', 'plan preview shows the USA equivalent beside the local figure', /≈ \$/.test(await L.getByTestId('anchor-usd').innerText()));
await shot(L, 'lead', '1-compose-plan');
const open = L.getByRole('button', { name: /Share QR/ }); await open.waitFor(); step('lead', 'open button enabled (plan present)', await open.isEnabled());
await open.click();
await L.locator('code').first().waitFor();
const code = (await L.locator('code').first().innerText()).trim(); step('lead', 'pod code issued', /^[A-Z0-9]{4,8}$/.test(code), code);
await L.getByText('● live').waitFor({ timeout: 20000 }); step('lead', 'live channel subscribed (relay)');
await shot(L, 'lead', '2-invite');

// 2 · two joiners dial in; each names their seat, ELECTS THEIR OWN LOCALITY, and approves the plan
await A.goto(`${BASE}?pod=${code}`, { waitUntil: 'domcontentloaded' }); await ready(A); step('ana', 'opened join link ?pod=' + code);
await B.goto(BASE + '?enter=session', { waitUntil: 'domcontentloaded' }); await ready(B);
await B.getByPlaceholder(/code/i).first().fill(code); await B.getByRole('button', { name: /join/i }).first().click(); step('bo', 'typed the code and joined');
await A.getByText(/you are seat 2/).waitFor({ timeout: 20000 }); step('ana', 'assigned seat 2');
await B.getByText(/you are seat 3/).waitFor({ timeout: 20000 }); step('bo', 'assigned seat 3');
await L.getByText(/3 in the pod/).waitFor({ timeout: 20000 }); step('lead', 'lead sees 3 in the pod');
for (const [who, p] of [['ana', A], ['bo', B]]) { const inp = await enabledOf(p.getByPlaceholder('enter your name')); step(who, 'name input is own seat only', !!inp); await inp.fill(NAMES[who]); }
// ELECTION OF LOCALITY — own seat only. Ana: Brazil (BRL, dataset). Bo: Philippines — Metro Manila (PHP, his row). Lea inherits the pod default (New York · Remainder of state).
const elect = async (who, p, cc, label, locality) => {
  const sel = await enabledOf(p.locator('[data-testid^="member-locality-"]:not([data-testid$="-locality"])')); step(who, 'locality select is own seat only', !!sel); await sel.selectOption(cc);
  if (locality) { const loc = await enabledOf(p.locator('[data-testid^="member-locality-"][data-testid$="-locality"]')); step(who, 'a second step offers the localities of ' + cc, !!loc); const v = await loc.evaluate((s, re) => [...s.options].find((o) => new RegExp(re).test(o.textContent))?.value || '', locality); step(who, 'locality "' + locality + '" is offered', !!v); await loc.selectOption(v); }
  step(who, 'elected ' + label);
};
await elect('ana', A, 'BR', 'Brazil — 7.37 BRL/h (dataset, verified decree)');
await elect('bo', B, 'PH', 'Philippines — Metro Manila — 86.875 PHP/h (a place the dataset does not name; his row)', 'Metro Manila');
// GPS as a supplement — Ana's own seat only; the fix prints beside the place she elected and never picks a floor
const gpsBtn = await enabledOf(A.locator('[data-testid^="member-gps-"]:not([data-testid*="-fix-"])')); step('ana', 'position button is own seat only', !!gpsBtn); await gpsBtn.click();
await A.locator('[data-testid^="member-gps-fix-"]').first().waitFor({ timeout: 10000 }); step('ana', 'position fix recorded beside the elected place', /GPS -23\.5505, -46\.6333 ±25 m/.test(await A.locator('[data-testid^="member-gps-fix-"]').first().innerText()));
await L.locator('[data-testid="member-gps-fix-1"]').waitFor({ timeout: 20000 }); step('lead', 'lead sees Ana\'s fix (replicated), and Ana\'s election is still Brazil', /Brazil/.test(await L.getByTestId('member-floor-1').locator('..').innerText()));
for (const [who, p] of ALL) { const box = await enabledOf(p.getByRole('checkbox')); step(who, 'approval checkbox is own seat only', !!box); await box.check(); step(who, 'approved intent, outcome AND the plan (2 h × 3)'); }
await L.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => /Accepted by the trio/.test(x.textContent)); return b && !b.disabled; }, null, { timeout: 20000 }); step('lead', 'all three approved → sync unlocked');
await L.waitForFunction(() => /BRL/.test(document.body.innerText) && /PHP/.test(document.body.innerText), null, { timeout: 20000 }); step('lead', 'lead sees Ana in BRL and Bo in PHP (elections replicated)');
await shotAll('3-agreed-elected');
await L.getByRole('button', { name: /Accepted by the trio/ }).click();

// 3 · synchronized readiness — three presses within 15 s — then ACTIVE, where the clock is a BUTTON
for (const [who, p] of ALL) { await p.getByText(/tap to start/).first().waitFor({ timeout: 20000 }); const b = await enabledOf(p.getByRole('button', { name: /tap to start/ })); step(who, 'pressed ready (own seat)', !!b); await b.click(); }
for (const [who, p] of ALL) { await p.getByTestId('pod-clock-toggle').waitFor({ timeout: 25000 }); step(who, 'ACTIVE — the clock button is on screen, not yet running'); }
await shotAll('4-active-ready');
await L.getByTestId('pod-clock-toggle').click(); step('lead', 'START the clock (segment 1)');
await L.waitForTimeout(WORK_MS);
await L.getByTestId('pod-clock-toggle').click(); step('lead', 'STOP the clock (segment 1 closed)');
await L.getByTestId('pod-clock-toggle').click(); step('lead', 'ADD TIME (segment 2 opened)');
await L.waitForTimeout(WORK_MS);
for (const [who, p] of ALL) { await p.waitForFunction(() => /segment 2/.test(document.body.innerText), null, { timeout: 20000 }); step(who, 'sees segment 2 (clock events replicated)'); }
await shotAll('5-active-two-segments');
await A.getByTestId('pod-stop').click(); step('ana', 'a JOINER pressed Stop & record — one route, segment 2 closed for everyone');
for (const [who, p] of ALL) { await p.getByTestId('member-outcome-0').waitFor({ timeout: 20000 }); step(who, 'reached RECORD'); }

// 4 · the shared record + an OUTCOME FROM EACH OF THE THREE
await A.getByPlaceholder(/Write the outcome|type it here/).first().fill('Three phones, two clocked segments, three currencies: this receipt is the outcome.');
for (const [who, p] of ALL) { const o = await enabledOf(p.locator('[data-testid^="member-outcome-"]')); step(who, 'outcome input is own seat only', !!o); await o.fill(`${NAMES[who]}: ${who === 'lead' ? 'framed the plan and ran the clock' : who === 'ana' ? 'elected Brazil and stopped the clock' : 'elected Metro Manila and witnessed'}`); }
await A.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => /witness the hours/.test(x.textContent)); return b && !b.disabled; }, null, { timeout: 20000 }); step('ana', 'all three outcomes in → audit unlocked');
await shotAll('6-record-three-outcomes');
await A.getByRole('button', { name: /witness the hours/ }).click();
for (const [who, p] of ALL) { await p.getByPlaceholder('hours').first().waitFor({ timeout: 20000 }); step(who, 'reached AUDIT'); }

// 5 · self-audit (a claim ABOVE the clock, to show the cap) + cross-witness + settle
for (const [who, p] of ALL) { const h = await enabledOf(p.getByPlaceholder('hours')); await h.fill('1'); const d = await enabledOf(p.getByPlaceholder(/what you did/)); await d.fill(`${NAMES[who]} worked the plan`); step(who, 'self-audit: claimed 1 h (above the clock — will be capped to what was witnessed)'); }
for (const [who, p] of ALL) {
  await p.waitForTimeout(400); let n = 0;
  for (let k = 0; k < 2; k++) { const clicked = await p.evaluate((name) => { const b = [...document.querySelectorAll('button')].find((x) => new RegExp(`^${name} witnesses$`, 'i').test(x.textContent.trim()) && !x.disabled); if (!b) return false; b.click(); return true; }, NAMES[who]); if (clicked) n++; await p.waitForTimeout(300); }
  step(who, 'witnessed the other two', n === 2, `clicked ${n} of 2`);
}
await L.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => /Settle/.test(x.textContent)); return b && !b.disabled; }, null, { timeout: 25000 }); step('lead', 'all witnessed + all self-audited → settle unlocked');
for (const [who, p] of ALL) { const capped = await p.locator('[data-testid^="claim-capped-"]').count(); step(who, 'the 1 h claim is CAPPED to the clock on this phone', capped >= 1, `${capped} capped rows`); }

step('lead', 'M is locked on the audit screen (no picker)', await L.getByTestId('band-locked').count() === 1 && await L.locator('[data-testid="band-select"]').count() === 0);
await shotAll('7-audit-witness');
await L.getByRole('button', { name: /Settle/ }).click();
for (const [who, p] of ALL) { await p.getByText(/Settled & receipted by the pod|Settled &amp; receipted/).waitFor({ timeout: 25000 }); step(who, 'CLOSED — receipt on this phone'); }
await shotAll('8-closed-receipt');
const body = await L.evaluate(() => document.body.innerText);
step('lead', 'receipt shows PLAN → ACTUAL', /Plan → actual/.test(body));
step('lead', 'receipt shows two segments summed', /in 2 segments/.test(body));
step('lead', 'receipt shows the ledger grammar', /\d+\.\d{4}\.\.\d{4}/.test(body));
step('lead', 'receipt settles Ana in reais and Bo in pesos beside Lea in dollars — each at their own floor', /(BRL|R\$)/.test(body) && /(PHP|₱)/.test(body) && /\$/.test(body) && /Each at their own floor/.test(body));
const usd = await Promise.all([0, 1, 2].map((i) => L.getByTestId(`receipt-usd-${i}`).innerText()));
step('lead', 'Lea (USD) — her own figure is the USA equivalent', /≈ \$/.test(usd[0]) && !/awaiting/.test(usd[0]), usd[0].trim());
step('lead', 'Ana (BRL) — a USA figure only by a traceable route: hi_rates.py\'s USD floor × 웃, named as a second floor', /≈ \$/.test(usd[1]) && /hi_rates\.py USD floor/.test(usd[1]), usd[1].trim());
step('lead', 'Bo (PHP) — no dated exchange rate, no USD floor: the receipt says what is missing, never a number', /awaiting a dated exchange-rate source/.test(usd[2]), usd[2].trim());
step('lead', 'Ana\'s GPS fix prints on the receipt as a supplement to the elected place', /GPS -23\.5505, -46\.6333/.test(await L.getByTestId('receipt-gps-1').innerText()) && /supplement to the elected place/.test(await L.getByTestId('receipt-gps-1').innerText()));
step('lead', 'and no other seat carries a fix it did not take', (await L.locator('[data-testid="receipt-gps-0"]').count()) === 0 && (await L.locator('[data-testid="receipt-gps-2"]').count()) === 0);
step('lead', 'receipt names the D9 rate that paid', /D9/.test(body) && /statutory wage moved/.test(body));
step('lead', 'Lea settles at the New York · Remainder of state floor she inherited from the pod default', /New York · Remainder of state/.test(body));
for (const [who, p] of ALL) { const b = await p.evaluate(() => document.body.innerText); step(who, 'receipt renders each member\'s OWN outcome text', /framed the plan and ran the clock/.test(b) && /elected Brazil and stopped the clock/.test(b) && /elected Metro Manila and witnessed/.test(b)); step(who, 'receipt shows M locked at 3× and the plan line', /at 3×/.test(b) && /person-hours planned/.test(b)); }
for (const [who, p] of ALL) { const b = await p.evaluate(() => document.body.innerText); step(who, 'this phone\'s receipt carries the per-person vintage settlement (reais · pesos · dollars)', /(BRL|R\$)/.test(b) && /(PHP|₱)/.test(b) && /\$/.test(b) && /rate\)/.test(b)); }
const rec = await Promise.all(ALL.map(([, p]) => p.evaluate(() => (document.querySelector('[data-testid="receipt-each"]') || {}).innerText || '')));
step('lead', 'THE THREE RECEIPTS SETTLE IDENTICALLY — the same per-person figures on every phone', rec[0].length > 40 && rec[0] === rec[1] && rec[1] === rec[2], rec[0].slice(0, 60));
fs.writeFileSync(OUT + '/log.txt', log.join('\n'));
await browser.close(); console.log('\nPOD 3-PHONE SHOWCASE RUN: ' + log.length + ' steps, 0 failures');
