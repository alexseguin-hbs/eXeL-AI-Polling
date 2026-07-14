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

// ── #A6: DESIGN places a 2×4 wall (count ↑) + 3D toggle renders extrusions ──
{
  const { pg, clk } = await mk();
  await clk('button:has-text("DESIGN")'); await pg.waitForTimeout(200);
  const wallCount = () => pg.evaluate(() => { const t = document.querySelector('[data-arch-tab="DESIGN"]')?.textContent || ''; const m = t.match(/Walls \(2×4\)\s*(\d+)/); return m ? +m[1] : -1; });
  const before = await wallCount();
  const box = await pg.locator('[data-arch-design]').boundingBox();
  if (box) { await pg.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.55); await pg.waitForTimeout(90); await pg.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.55); await pg.waitForTimeout(140); }
  const after = await wallCount();
  await clk('button:has-text("2D")'); await pg.waitForTimeout(150); // toggle → 3D
  const poly = await pg.evaluate(() => !!document.querySelector('[data-arch-design] polygon[data-wall]'));
  rec('#A6 DESIGN places wall (count↑) + 3D extrusion renders', before >= 0 && after > before && poly, `before=${before} after=${after} poly=${poly}`);
  await pg.close();
}

// ── #A7: BUILD 4D scrubber reveals elements by day (electrical "wire from power" after day 12) ──
{
  const { pg, clk } = await mk();
  await clk('button:has-text("BUILD")'); await pg.waitForTimeout(200);
  const hasBuild = await pg.evaluate(() => !!document.querySelector('[data-arch-build]') && (document.querySelector('[data-arch-tab="BUILD"]')?.textContent || '').includes('TRADE COORDINATION'));
  const elecEarly = await pg.evaluate(() => !!document.querySelector('[data-el="electrical"]')); // day 1 → not yet
  await pg.evaluate(() => { const r = document.querySelector('[data-arch-tab="BUILD"] input[type=range]'); if (r) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(r, '20'); r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); } });
  await pg.waitForTimeout(150);
  const elecLate = await pg.evaluate(() => !!document.querySelector('[data-el="electrical"]')); // day 20 → wire from power present
  rec('#A7 BUILD 4D scrubber reveals electrical run by day', hasBuild && !elecEarly && elecLate, `build=${hasBuild} early=${elecEarly} late=${elecLate}`);
  await pg.close();
}

// ── #A8: SUN·SKY celestial dome + window optimization ──
{
  const { pg, clk } = await mk();
  await clk('button:has-text("SUN·SKY")'); await pg.waitForTimeout(200);
  const ok = await pg.evaluate(() => {
    const dome = document.querySelector('[data-arch-sky]');
    const txt = document.querySelector('[data-arch-tab="SUN·SKY"]')?.textContent || '';
    return !!dome && !!dome.querySelector('[data-el="sunpath"]') && !!dome.querySelector('[data-el="polaris"]') && txt.includes('WINDOW OPTIMIZATION') && txt.includes('Best light');
  });
  rec('#A8 SUN·SKY sun-path + Polaris + window optimization', ok, '');
  await pg.close();
}

// ── #A9: ITERATE 20→33 gallery ──
{
  const { pg, clk } = await mk();
  await clk('button:has-text("ITERATE")'); await pg.waitForTimeout(150);
  const n = await pg.evaluate(() => document.querySelectorAll('[data-iter]').length);
  const approved = await pg.evaluate(() => (document.querySelector('[data-arch-tab="ITERATE"]')?.textContent || '').includes('APPROVED'));
  rec('#A9 ITERATE 20→33 gallery (14 cards, 33 approved)', n === 14 && approved, `cards=${n} approved=${approved}`);
  await pg.close();
}

// ── #A10: SHARE universal comment → delta ──
{
  const { pg, clk } = await mk();
  await clk('button:has-text("SHARE")'); await pg.waitForTimeout(150);
  const count = () => pg.evaluate(() => document.querySelectorAll('[data-share-comments] > div').length);
  const before = await count();
  await pg.evaluate(() => { const inp = document.querySelector('[data-arch-tab="SHARE"] input'); if (inp) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inp, 'Add a skylight'); inp.dispatchEvent(new Event('input', { bubbles: true })); } });
  await clk('button:has-text("post")'); await pg.waitForTimeout(150);
  const after = await count();
  rec('#A10 SHARE comment posts → delta list grows', after === before + 1, `before=${before} after=${after}`);
  await pg.close();
}

// ── #A11: QUALIFY automated checks + gates + on-chain approval ──
{
  const { pg, clk } = await mk();
  await clk('button:has-text("QUALIFY")'); await pg.waitForTimeout(150);
  const txt = await pg.evaluate(() => document.querySelector('[data-arch-tab="QUALIFY"]')?.textContent || '');
  const ok = ['AUTOMATED CHECKS', 'Structural', 'G6 Permit', 'APPROVAL RECORD', 'IMMUTABLE'].every((k) => txt.includes(k));
  rec('#A11 QUALIFY checks + G0–G13 gates + on-chain approval', ok, '');
  await pg.close();
}

// ── #A12: final 4 tabs render (SIMULATE / REVIEW / TWIN / REPLAY) ──
{
  const { pg, clk } = await mk();
  const check = async (tab, sel, min = 1) => { await clk(`button:has-text("${tab}")`); await pg.waitForTimeout(120); return pg.evaluate((s) => document.querySelectorAll(s).length, sel).then((n) => n >= min); };
  const sim = await check("SIMULATE", "[data-sim]", 10);
  const rev = await check("REVIEW", "[data-expert]", 3);
  const twin = await check("TWIN", "[data-twin]", 5);
  const rep = await check("REPLAY", "[data-replay]", 3);
  rec('#A12 SIMULATE/REVIEW/TWIN/REPLAY render', sim && rev && twin && rep, `sim=${sim} rev=${rev} twin=${twin} rep=${rep}`);
  await pg.close();
}

// ── #A13: OVERVIEW embeds the SoI Tri-Coin incentive framework (♡ SI · 웃 HI · ◬ AI) + NOSE ──
{
  const { pg } = await mk();
  const soi = await pg.evaluate(() => {
    const s = document.querySelector('[data-soi]');
    if (!s) return { has: false };
    const t = document.querySelector('[data-arch-tab="OVERVIEW"]')?.textContent || '';
    return {
      has: true,
      coins: s.querySelectorAll('[data-soi-coin]').length,
      nose: s.querySelectorAll('[data-soi-nose]').length,
      flow: s.querySelectorAll('[data-soi-flow]').length,
      law: /1 min SI = 5 ◬/.test(t) && /Shared Intention/.test(t) && /Human Intelligence/.test(t) && /Artificial Intelligence/.test(t),
      reimagine: /reimagine innovation incentives/.test(t),
    };
  });
  const ok = !!(soi.has && soi.coins === 3 && soi.nose === 4 && soi.flow === 4 && soi.law && soi.reimagine);
  rec('#A13 SoI Tri-Coin framework (3 coins + NOSE + 5× ◬ law + reimagine) on OVERVIEW', ok, JSON.stringify(soi));
  await pg.close();
}

await b.close();
const passed = results.filter(r => r.pass).length, total = results.length;
console.log('ARCH-SPIRAL ' + passed + '/' + total + ' passed');
results.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  (' + r.detail + ')' : '')));
process.exit(passed === total ? 0 : 1);
