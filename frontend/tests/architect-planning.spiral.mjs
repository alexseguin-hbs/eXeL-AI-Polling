// Architect-2525 SPIRAL gate — forward corpus for the /main/Architect-2525 command shell.
// Run: cd frontend && npm run dev ; node tests/architect-planning.spiral.mjs
// Backward safety = the Security-2525 corpus (npm run e2e:spiral) must stay green (shared shell/engines untouched).
import { chromium } from 'playwright';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:3000/main/Architect-2525/';
const ALLOW = /404|does not match|did not match|hydrat|server-rendered|Prop .* did not match/i;
const TABS = ['OVERVIEW', 'DESIGN', 'BUILD', 'SUN·SKY', 'SIMULATE', 'COST·TIME', 'ITERATE', 'SHARE', 'REVIEW', 'QUALIFY', 'TWIN', 'REPLAY'];

const results = [];
const rec = (name, pass, detail = '') => { results.push({ name, pass, detail }); };
const b = await chromium.launch({ headless: true, executablePath: EXE });

const mk = async (vp) => {
  const pg = await b.newPage({ viewport: vp ?? { width: 1000, height: 820 } });
  const errs = [];
  pg.on('pageerror', e => { if (!ALLOW.test(e.message)) errs.push('PE:' + e.message.slice(0, 90)); });
  pg.on('console', m => { if (m.type() === 'error' && !ALLOW.test(m.text())) errs.push(m.text().slice(0, 90)); });
  const clk = async (sel) => { const l = pg.locator(sel); const n = await l.count(); for (let i = 0; i < n; i++) { const el = l.nth(i); let v = false; try { v = await el.isVisible(); } catch {} if (!v) continue; try { await el.click({ timeout: 2500 }); return true; } catch {} } return false; };
  await pg.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForTimeout(1800);
  return { pg, errs, clk };
};

// ── #A1: route loads + shell chrome + all 12 tabs present ──
{
  const { pg, errs, clk } = await mk();
  const header = await pg.evaluate(() => document.body.innerText.includes('ARCHITECT · VISION 2525'));
  const tabsPresent = await pg.evaluate((tabs) => tabs.every((t) => [...document.querySelectorAll('button')].some((b) => (b.textContent || '').trim().includes(t))), TABS);
  rec('#A1 route loads + shell header + 12 tabs present', header && tabsPresent, `header=${header} tabs=${tabsPresent}`);
  rec('#A1 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── #A2: each tab switches (data-arch-tab reflects the active tab) ──
{
  const { pg, clk } = await mk();
  let allSwitch = true, detail = '';
  for (const t of TABS) {
    const ok = await clk(`button:has-text("${t}")`); await pg.waitForTimeout(120);
    const active = await pg.evaluate(() => document.querySelector('[data-arch-tab]')?.getAttribute('data-arch-tab') || '');
    if (!ok || active !== t) { allSwitch = false; detail = `fail@${t} (got ${active})`; break; }
  }
  rec('#A2 all 12 tabs switch active content', allSwitch, detail);
  await pg.close();
}

// ── #A3: settings popover opens + FPS toggle flips ──
{
  const { pg, clk } = await mk();
  await clk('button[title="Settings"]'); await pg.waitForTimeout(250);
  const opened = await pg.evaluate(() => document.body.innerText.includes('SETTINGS · ALL TABS'));
  await clk('button:has-text("OFF")'); await pg.waitForTimeout(150);
  const on = await pg.evaluate(() => [...document.querySelectorAll('button')].some((b) => (b.textContent || '').trim() === 'ON'));
  rec('#A3 settings popover opens + FPS toggle', opened && on, `opened=${opened} on=${on}`);
  await pg.close();
}

// ── #A4: OVERVIEW observability tiles present ──
{
  const { pg } = await mk();
  const txt = await pg.evaluate(() => document.querySelector('[data-arch-tab="OVERVIEW"]')?.textContent || '');
  const ok = ['Project Cost', 'Time Capital', 'Iteration', 'SSSES'].every((k) => txt.includes(k)) && /\$[\d,]/.test(txt);
  rec('#A4 OVERVIEW tiles (cost / time-capital / iteration / SSSES)', ok, txt.slice(0, 60));
  await pg.close();
}

// ── #A5: COST·TIME $/min recomputes live on input change ──
{
  const { pg, clk } = await mk();
  await clk('button:has-text("COST·TIME")'); await pg.waitForTimeout(200);
  const totalOf = () => pg.evaluate(() => { const t = document.querySelector('[data-arch-tab="COST·TIME"]')?.textContent || ''; const m = t.match(/Total \(billed\)\s*\$([\d,]+\.\d{2})/); return m ? m[1] : (t.match(/\$([\d,]+\.\d{2})/g) || []).join(','); });
  const before = await totalOf();
  // bump the Labor (min) input (first number input in the tab) and confirm the billed total changes.
  await pg.evaluate(() => { const inp = document.querySelector('[data-arch-tab="COST·TIME"] input[type=number]'); if (inp) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inp, '96000'); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); } });
  await pg.waitForTimeout(200);
  const after = await totalOf();
  rec('#A5 COST·TIME $/min recomputes on input', !!before && !!after && before !== after, `before=${before} after=${after}`);
  await pg.close();
}

await b.close();
const passed = results.filter(r => r.pass).length, total = results.length;
console.log('ARCH-SPIRAL ' + passed + '/' + total + ' passed');
results.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  (' + r.detail + ')' : '')));
process.exit(passed === total ? 0 : 1);
