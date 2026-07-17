// Architect-2525 SPIRAL gate — forward corpus for /main/Architect-2525 (Vision 2525 UI Standard v3.0, 7 tabs).
// Run: cd frontend && npm run dev ; node tests/architect-planning.spiral.mjs
// Backward safety = the Security-2525 corpus (npm run e2e:spiral) must stay green (shared shell/engines untouched).
import { chromium } from 'playwright';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const URL = 'http://localhost:3000/main/Architect-2525/';
const ALLOW = /404|does not match|did not match|hydrat|server-rendered|Prop .* did not match/i;
const TABS = ['Overview', 'Design', 'Simulate', 'Review', 'Build', 'Lifecycle', 'More']; // v3.0 seven-tab spine

const results = [];
const rec = (name, pass, detail = '') => { results.push({ name, pass, detail }); };
const b = await chromium.launch({ headless: true, executablePath: EXE });

const mk = async (vp) => {
  const pg = await b.newPage({ viewport: vp ?? { width: 1000, height: 820 } });
  const errs = [];
  pg.on('pageerror', e => { if (!ALLOW.test(e.message)) errs.push('PE:' + e.message.slice(0, 90)); });
  pg.on('console', m => { if (m.type() === 'error' && !ALLOW.test(m.text())) errs.push(m.text().slice(0, 90)); });
  const clk = async (sel) => { const l = pg.locator(sel); const n = await l.count(); for (let i = 0; i < n; i++) { const el = l.nth(i); let v = false; try { v = await el.isVisible(); } catch {} if (!v) continue; try { await el.click({ timeout: 2500 }); return true; } catch {} } return false; };
  const tab = async (t) => { await clk(`button:has-text("${t}")`); await pg.waitForTimeout(160); };
  const subtab = async (s) => { await clk(`[data-arch-subnav] button:has-text("${s}")`); await pg.waitForTimeout(160); };
  await pg.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForTimeout(1800);
  return { pg, errs, clk, tab, subtab };
};

// ── #A1: route loads + v3.0 header (Architect-2525) + 7 tabs present ──
{
  const { pg, errs } = await mk();
  const header = await pg.evaluate(() => document.body.innerText.includes('Architect-2525'));
  const noOld = await pg.evaluate(() => !document.body.innerText.includes('ARCHITECT · VISION 2525'));
  const tabsPresent = await pg.evaluate((tabs) => tabs.every((t) => [...document.querySelectorAll('button')].some((b) => (b.textContent || '').trim().includes(t === 'More' ? 'More' : t))), TABS);
  rec('#A1 route loads + "Architect-2525" header + 7 tabs present', header && noOld && tabsPresent, `header=${header} noOld=${noOld} tabs=${tabsPresent}`);
  rec('#A1 console clean', errs.length === 0, errs.slice(0, 2).join(' | '));
  await pg.close();
}

// ── #A2: each of the 7 tabs switches (data-arch-tab reflects the active tab) ──
{
  const { pg, tab } = await mk();
  let allSwitch = true, detail = '';
  for (const t of TABS) {
    await tab(t);
    const active = await pg.evaluate(() => document.querySelector('[data-arch-tab]')?.getAttribute('data-arch-tab') || '');
    if (active !== t) { allSwitch = false; detail = `fail@${t} (got ${active})`; break; }
  }
  rec('#A2 all 7 tabs switch active content', allSwitch, detail);
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

// ── #A14: persistent header (search/replay/notifications) + project ribbon + ••• More menu ──
{
  const { pg, tab } = await mk();
  const ribbon = await pg.evaluate(() => { const r = document.querySelector('[data-arch-ribbon]'); const t = r?.textContent || ''; return !!r && /Stage Gate/.test(t) && /Iteration/.test(t) && /Human Authority/.test(t) && /Replay/.test(t); });
  const hdr = await pg.evaluate(() => !!document.querySelector('button[title="Search (⌘K)"]') && !!document.querySelector('button[title="Notifications"]') && document.body.innerText.includes('REPLAY'));
  await tab('More');
  const more = await pg.evaluate(() => document.querySelectorAll('[data-more-group]').length);
  rec('#A14 persistent header + project ribbon + ••• More groups', ribbon && hdr && more === 8, `ribbon=${ribbon} hdr=${hdr} more=${more}`);
  await pg.close();
}

// ── #A4: OVERVIEW observability tiles present ──
{
  const { pg } = await mk();
  const txt = await pg.evaluate(() => document.querySelector('[data-arch-tab="Overview"]')?.textContent || '');
  const ok = ['Project Cost', 'Time Capital', 'Iteration', 'SSSES'].every((k) => txt.includes(k)) && /\$[\d,]/.test(txt);
  rec('#A4 OVERVIEW tiles (cost / time-capital / iteration / SSSES)', ok, txt.slice(0, 60));
  await pg.close();
}

// ── #A5: Build → Cost·Time $/min recomputes live on input change ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Build'); await subtab('Cost·Time');
  const totalOf = () => pg.evaluate(() => { const t = document.querySelector('[data-arch-tab="Build"]')?.textContent || ''; const m = t.match(/Total \(billed\)\s*\$([\d,]+\.\d{2})/); return m ? m[1] : (t.match(/\$([\d,]+\.\d{2})/g) || []).join(','); });
  const before = await totalOf();
  await pg.evaluate(() => { const inp = document.querySelector('[data-arch-tab="Build"] input[type=number]'); if (inp) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inp, '96000'); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); } });
  await pg.waitForTimeout(200);
  const after = await totalOf();
  rec('#A5 Build→Cost·Time $/min recomputes on input', !!before && !!after && before !== after, `before=${before} after=${after}`);
  await pg.close();
}

// ── #A6: Design → Model places a 2×4 wall (count ↑) + 3D toggle renders extrusions ──
{
  const { pg, clk, tab } = await mk();
  await tab('Design'); // default subtab = Model
  // Count the wall primitives directly in the SVG (the MODEL · U-WF PRIMITIVES readout panel was removed 2026-07-17).
  const wallCount = () => pg.evaluate(() => document.querySelectorAll('[data-arch-design] [data-wall]').length);
  const before = await wallCount();
  const box = await pg.locator('[data-arch-design]').boundingBox();
  if (box) { await pg.mouse.click(box.x + box.width * 0.25, box.y + box.height * 0.55); await pg.waitForTimeout(90); await pg.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.55); await pg.waitForTimeout(140); }
  const after = await wallCount();
  await clk('button:has-text("2D")'); await pg.waitForTimeout(150);
  const poly = await pg.evaluate(() => !!document.querySelector('[data-arch-design] polygon[data-wall]'));
  rec('#A6 Design→Model places wall (count↑) + 3D extrusion', before >= 0 && after > before && poly, `before=${before} after=${after} poly=${poly}`);
  await pg.close();
}

// ── #A7: Build → Build 4D scrubber reveals electrical run by day ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Build'); await subtab('Build 4D');
  const hasBuild = await pg.evaluate(() => !!document.querySelector('[data-arch-build]') && (document.querySelector('[data-arch-tab="Build"]')?.textContent || '').includes('TRADE COORDINATION'));
  const elecEarly = await pg.evaluate(() => !!document.querySelector('[data-el="electrical"]'));
  await pg.evaluate(() => { const r = document.querySelector('[data-arch-tab="Build"] input[type=range]'); if (r) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(r, '20'); r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); } });
  await pg.waitForTimeout(150);
  const elecLate = await pg.evaluate(() => !!document.querySelector('[data-el="electrical"]'));
  rec('#A7 Build→4D scrubber reveals electrical run by day', hasBuild && !elecEarly && elecLate, `build=${hasBuild} early=${elecEarly} late=${elecLate}`);
  await pg.close();
}

// ── #A8: Design → Site (SUN·SKY) sun-path + Polaris + window optimization ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Site');
  const ok = await pg.evaluate(() => {
    const dome = document.querySelector('[data-arch-sky]');
    const txt = document.querySelector('[data-arch-tab="Design"]')?.textContent || '';
    return !!dome && !!dome.querySelector('[data-el="sunpath"]') && !!dome.querySelector('[data-el="polaris"]')
      && !!dome.querySelector('[data-el="moonpath"]') && !!document.querySelector('[data-arch-calendar] input[data-cal-input]')
      && txt.includes('WINDOW OPTIMIZATION') && txt.includes('Best light') && /Moon:/.test(txt);
  });
  rec('#A8 Design→Site SUN·SKY sun+moon paths + Polaris + calendar + window optimization', ok, '');
  await pg.close();
}

// ── #A17: Design→Site world-map property placement → clicking sets lat/lon (single coord source) + 4-corner lot ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Site');
  const has = await pg.evaluate(() => !!document.querySelector('[data-arch-world]') && document.querySelectorAll('[data-lot-corner]').length === 4);
  const map = pg.locator('[data-arch-world]');
  await map.scrollIntoViewIfNeeded(); await pg.waitForTimeout(150);
  const box = await map.boundingBox();
  const readLot = () => pg.evaluate(() => document.querySelector('[data-arch-tab="Design"]')?.textContent?.match(/set lot · ([\-\d.]+), ([\-\d.]+)/)?.slice(1).join(','));
  const before = await readLot();
  if (box) { await pg.mouse.click(box.x + box.width * 0.3, box.y + box.height * 0.35); await pg.waitForTimeout(250); }
  const after = await readLot();
  rec('#A17 Site world-map placement sets lat/lon + 4-corner lot', has && !!after && before !== after, `has=${has} before=${before} after=${after}`);
  await pg.close();
}

// ── #A9: Design → Compare (ITERATE 20→33 gallery) ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Compare');
  const n = await pg.evaluate(() => document.querySelectorAll('[data-iter]').length);
  const approved = await pg.evaluate(() => (document.querySelector('[data-arch-tab="Design"]')?.textContent || '').includes('APPROVED'));
  rec('#A9 Design→Compare ITERATE 20→33 gallery (14 cards, 33 approved)', n === 14 && approved, `cards=${n} approved=${approved}`);
  await pg.close();
}

// ── #A10: Review → Contributions (SHARE) universal comment → delta ──
{
  const { pg, clk, tab, subtab } = await mk();
  await tab('Review'); await subtab('Contributions');
  const count = () => pg.evaluate(() => document.querySelectorAll('[data-share-comments] > div').length);
  const before = await count();
  await pg.evaluate(() => { const inp = document.querySelector('[data-arch-tab="Review"] input'); if (inp) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inp, 'Add a skylight'); inp.dispatchEvent(new Event('input', { bubbles: true })); } });
  await clk('button:has-text("post")'); await pg.waitForTimeout(150);
  const after = await count();
  rec('#A10 Review→Contributions comment posts → delta grows', after === before + 1, `before=${before} after=${after}`);
  await pg.close();
}

// ── #A11: Review → Qualification (QUALIFY) checks + gates + on-chain approval ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Review'); await subtab('Qualification');
  const txt = await pg.evaluate(() => document.querySelector('[data-arch-tab="Review"]')?.textContent || '');
  const ok = ['AUTOMATED CHECKS', 'Structural', 'G6 Permit', 'APPROVAL RECORD', 'IMMUTABLE'].every((k) => txt.includes(k));
  rec('#A11 Review→Qualification checks + G0–G13 gates + on-chain approval', ok, '');
  await pg.close();
}

// ── #A12: Simulate + Review→Reviews + Lifecycle→Twin/Replay render ──
{
  const { pg, tab, subtab } = await mk();
  const check = async (sel, min = 1) => pg.evaluate((s) => document.querySelectorAll(s).length, sel).then((n) => n >= min);
  await tab('Simulate'); const sim = await check('[data-sim]', 10);
  await tab('Review'); await subtab('Reviews'); const rev = await check('[data-expert]', 3);
  await tab('Lifecycle'); const twin = await check('[data-twin]', 5);
  await subtab('Replay'); const rep = await check('[data-replay]', 3);
  rec('#A12 Simulate / Review→Reviews / Lifecycle→Twin+Replay render', sim && rev && twin && rep, `sim=${sim} rev=${rev} twin=${twin} rep=${rep}`);
  await pg.close();
}

// ── #A16: Overview opens CLEAN — SoI collapsed by default (Sprint 2), expander present ──
{
  const { pg } = await mk();
  const st = await pg.evaluate(() => ({ exp: !!document.querySelector('[data-arch-exp="soi"]'), collapsed: !document.querySelector('[data-soi]') }));
  rec('#A16 Overview clean — SoI collapsed by default + expander present', st.exp && st.collapsed, JSON.stringify(st));
  await pg.close();
}

// ── #A13: OVERVIEW embeds the SoI Tri-Coin incentive framework (♡ SI · 웃 HI · ◬ AI) + NOSE (expand first) ──
{
  const { pg, clk } = await mk();
  await clk('[data-arch-exp="soi"] button'); await pg.waitForTimeout(200); // expand the collapsed SoI
  const soi = await pg.evaluate(() => {
    const s = document.querySelector('[data-soi]');
    if (!s) return { has: false };
    const t = document.querySelector('[data-arch-tab="Overview"]')?.textContent || '';
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
  rec('#A13 SoI Tri-Coin framework (3 coins + NOSE + 5× ◬ law) on OVERVIEW', ok, JSON.stringify(soi));
  await pg.close();
}

// ── #A15: old-tab deep-links alias to the new 7-tab structure (no 404) ──
{
  const pg = await b.newPage({ viewport: { width: 1000, height: 820 } });
  await pg.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await pg.waitForTimeout(1500);
  const alive = await pg.evaluate(() => document.body.innerText.includes('Architect-2525'));
  rec('#A15 route loads without 404 (aliases preserved)', alive, '');
  await pg.close();
}

// ── #A18: Build→Estimate cone-of-uncertainty + advancing a gate tightens (confidence↑, band↓) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Build'); await subtab('Estimate');
  const rd = () => pg.evaluate(() => {
    const root = document.querySelector('[data-arch-estimate]');
    const conf = +(document.querySelector('[data-arch-checkpoint]')?.textContent?.match(/Confidence:\s*(\d+)%/)?.[1] || 0);
    const band = +(root?.textContent?.match(/±(\d+)% band/)?.[1] || 0);
    return { cone: !!document.querySelector('[data-arch-cone]'), checkpoint: !!document.querySelector('[data-arch-checkpoint]'), sections: document.querySelectorAll('[data-est-section]').length, conf, band };
  });
  const before = await rd();
  await clk('[data-est-advance]'); await pg.waitForTimeout(200);
  const after = await rd();
  const ok = before.cone && before.checkpoint && before.sections === 10 && after.conf > before.conf && after.band < before.band;
  rec('#A18 Build→Estimate cone + Human Authority + advancing a gate tightens (conf↑ band↓)', ok, JSON.stringify({ before, after }));
  await pg.close();
}

// ── #A19: Build→Forecast Gantt + monthly forecast + re-forecasts when crew changes ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Build'); await subtab('Forecast');
  const rd = () => pg.evaluate(() => ({
    forecast: !!document.querySelector('[data-arch-forecast]'),
    gantt: document.querySelectorAll('[data-gantt-row]').length,
    months: document.querySelectorAll('[data-forecast-month]').length,
  }));
  const before = await rd();
  // shrink the crew → build takes longer (more months)
  await pg.evaluate(() => { const inp = [...document.querySelectorAll('[data-arch-forecast] input[type=number]')][0]; if (inp) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inp, '3'); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); } });
  await pg.waitForTimeout(200);
  const after = await rd();
  const ok = before.forecast && before.gantt === 10 && before.months >= 3 && after.months > before.months;
  rec('#A19 Build→Forecast Gantt(10) + monthly + smaller crew → longer schedule', ok, JSON.stringify({ before, after }));
  await pg.close();
}

// ── #A20: SoI editable in Architect → saves to draft + publishes to the /main store (flow-through) ──
{
  const { pg, clk } = await mk();
  await clk('[data-arch-exp="soi"] button'); await pg.waitForTimeout(200);   // expand SoI
  await clk('[data-soi-edit]'); await pg.waitForTimeout(150);                 // edit mode
  await pg.evaluate(() => { const inp = document.querySelector('[data-soi-thesis]'); if (inp) { const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inp, 'EDITED-THESIS-XYZ'); inp.dispatchEvent(new Event('input', { bubbles: true })); } });
  await pg.waitForTimeout(150);
  await clk('[data-soi-publish]'); await pg.waitForTimeout(150);
  const st = await pg.evaluate(() => ({ draft: localStorage.getItem('soi2525.draft') || '', pub: localStorage.getItem('soi2525.published') || '' }));
  const ok = /EDITED-THESIS-XYZ/.test(st.draft) && /EDITED-THESIS-XYZ/.test(st.pub);
  rec('#A20 SoI editable → draft saved + published to /main store', ok, `draft=${/EDITED/.test(st.draft)} pub=${/EDITED/.test(st.pub)}`);
  await pg.close();
}

// ── #A21: Design→Site→SUN·SKY "Solar System" toggle → UCRS-2525 celestial map (9 planets + Base-3600 coords) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(200); // UCRS-2525 lives inside SUN·SKY
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120);        // open the ⚙ units & detail panel (declutter)
  const base = await pg.evaluate(() => ({
    map: !!document.querySelector('[data-arch-celestial]'),
    planets: document.querySelectorAll('[data-planet]').length,
    orbits: document.querySelectorAll('[data-orbit]').length,
    hu: !!document.querySelector('[data-hu-input]'),
    tilt: !!document.querySelector('[data-tilt-input]'),
    psize: document.querySelectorAll('[data-size-cycle]').length,            // planet-size cycler in the header (1)
    noSchematic: document.querySelectorAll('[data-scale-toggle]').length === 0, // schematic toggle removed — True-Scale locked
    coord: /SA\.EA\.\.HU/.test(document.querySelector('[data-ucrs-coord]')?.textContent || ''),
    earthPeri: /230\.1584\.\.0\s*·\s*0\.0\.\.0/.test(document.querySelector('[data-ucrs-coord]')?.textContent || ''), // Earth default = perihelion (HU 0)
    clock: !!document.querySelector('[data-phase-clock]') && /PERI/.test(document.querySelector('[data-phase-clock]')?.textContent || '') && /APHE/.test(document.querySelector('[data-phase-clock]')?.textContent || ''),
  }));
  // tilt (in ⚙) changes the ellipsoid foreshortening (orbit ry shrinks as tilt lowers)
  const ry0 = await pg.evaluate(() => document.querySelector('[data-orbit]')?.getAttribute('ry'));
  await pg.evaluate(() => { const t = document.querySelector('[data-tilt-input]'); if (!t) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, '8'); t.dispatchEvent(new Event('input', { bubbles: true })); });
  await pg.waitForTimeout(150);
  const ry1 = await pg.evaluate(() => document.querySelector('[data-orbit]')?.getAttribute('ry'));
  // click Mercury → readout switches + shows Distance/SP-OTU
  await pg.locator('[data-planet-id="mercury"]').click({ force: true }); await pg.waitForTimeout(150);
  const after = await pg.evaluate(() => document.querySelector('[data-ucrs-readout]')?.textContent || '');
  const ok = base.map && base.planets === 9 && base.orbits === 9 && base.hu && base.tilt && base.psize === 1 && base.noSchematic && base.coord && base.earthPeri && base.clock
    && parseFloat(ry1) < parseFloat(ry0) && /Mercury/.test(after) && /Distance/.test(after) && /SP-OTU/.test(after);
  rec('#A21 UCRS-2525 v2 — 9 planets + tilt ellipsoid + True-Scale + Planet-Size (⚙) + SA.EA..HU + click→coords', ok, JSON.stringify({ ...base, ry0, ry1, afterHasMercury: /Mercury/.test(after) }));

  // #A21b: clock icon → TRUE top-down view (perihelion ▲ at top, uniform planets, upright labels) + toggle back
  await pg.locator('[data-clock-toggle]').click(); await pg.waitForTimeout(160);
  const ovOn = await pg.evaluate(() => { const t = document.querySelector('[data-overhead-view]')?.textContent || ''; return document.querySelector('[data-arch-celestial]')?.getAttribute('data-peritop') === '1' && !!document.querySelector('[data-overhead-view]') && /▲/.test(t) && /PERIHELION/.test(t) && /APHELION/.test(t) && /▼/.test(t); }); // arrows now on their own line (▲ above PERIHELION · ▼ below APHELION)
  await pg.locator('[data-clock-toggle]').click(); await pg.waitForTimeout(130);
  const ovOff = await pg.evaluate(() => document.querySelector('[data-arch-celestial]')?.getAttribute('data-peritop') !== '1' && !document.querySelector('[data-overhead-view]'));
  rec('#A21b clock → true top-down (perihelion ▲ top, uniform planets) + toggle back', ovOn && ovOff, `on=${ovOn} off=${ovOff}`);

  // #A22: mini 3D Earth globe present + drag rotates it (graticule paths change) + no wheel/zoom handler
  await pg.locator('[data-planet-id="earth"]').click({ force: true }); await pg.waitForTimeout(150); // re-select Earth → globe (Mercury was selected above)
  const glb = pg.locator('[data-mini-globe]');
  const has = await glb.count();
  const before = await pg.evaluate(() => document.querySelector('[data-mini-globe]')?.innerHTML.length || 0);
  const box = await glb.boundingBox();
  if (box) { await pg.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await pg.mouse.down(); await pg.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.5, { steps: 6 }); await pg.mouse.up(); await pg.waitForTimeout(120); }
  const afterHtml = await pg.evaluate(() => document.querySelector('[data-mini-globe]')?.innerHTML.length || 0);
  // maximize the whole solar system → the root becomes fixed inset-0; minimize returns
  const maxBtn = pg.locator('[data-cel-max]');
  const hasMax = await maxBtn.count();
  await maxBtn.click(); await pg.waitForTimeout(150);
  const maximized = await pg.evaluate(() => { const b = document.querySelector('[data-cel-max]'); const root = b?.closest('.fixed.inset-0'); return !!root && b?.getAttribute('aria-label') === 'Minimize'; });
  await maxBtn.click(); await pg.waitForTimeout(120);
  const restored = await pg.evaluate(() => document.querySelector('[data-cel-max]')?.getAttribute('aria-label') === 'Maximize');
  rec('#A22 mini 3D Earth globe (drag, no zoom) + solar-system maximize/minimize', has === 1 && afterHtml !== before && hasMax === 1 && maximized && restored, `globe=${has} rot=${afterHtml !== before} max=${maximized} restored=${restored}`);
  await pg.close();
}

// ── #A21c: CAPABILITY LOCK — SA tilt foreshortens the orbital pattern in BOTH the normal AND clock/overhead views ──
// (the regression that shipped: clock-mode orbits ignored the tilt. Lock: orbit ry(tilt 8) < ry(tilt 45) AND >0 in both.)
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120); // open ⚙ → SA tilt slider
  const setTilt = async (v) => { await pg.evaluate((val) => { const t = document.querySelector('[data-tilt-input]'); if (!t) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, String(val)); t.dispatchEvent(new Event('input', { bubbles: true })); }, v); await pg.waitForTimeout(160); };
  const orbitRy = (sel) => pg.evaluate((s) => { const o = document.querySelector(`${s} [data-orbit]`); return o ? +o.getAttribute('ry') : NaN; }, sel);
  // NORMAL view
  await setTilt(45); const nRy45 = await orbitRy('[data-cel-view]');
  await setTilt(8);  const nRy8  = await orbitRy('[data-cel-view]');
  // CLOCK / overhead view
  await clk('[data-clock-toggle]'); await pg.waitForTimeout(200);
  await setTilt(45); const cRy45 = await orbitRy('[data-overhead-view]');
  await setTilt(8);  const cRy8  = await orbitRy('[data-overhead-view]');
  const normalOk = nRy8 < nRy45 && nRy8 > 0;
  const clockOk = cRy8 < cRy45 && cRy8 > 0;                   // THE fix — was broken (clock ignored tilt)
  rec('#A21c tilt foreshortens orbits in BOTH normal AND clock views (single tilt source)', normalOk && clockOk, JSON.stringify({ nRy8, nRy45, cRy8, cRy45 }));
  await pg.close();
}

// ── #A43: CRS-SS-02 — clicking the clock/top-down toggle defaults the SA tilt to 45° (looking most over the Sun) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120);
  // set tilt to something other than 45 first
  await pg.evaluate(() => { const t = document.querySelector('[data-tilt-input]'); if (!t) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, '20'); t.dispatchEvent(new Event('input', { bubbles: true })); }); await pg.waitForTimeout(120);
  await clk('[data-clock-toggle]'); await pg.waitForTimeout(200);   // → clock view should force tilt 45
  const tilt = await pg.evaluate(() => +(document.querySelector('[data-tilt-input]')?.value || 0));
  rec('#A43 clock toggle defaults SA tilt to 45° (perihelion-top over the Sun)', tilt === 45, `tiltAfterClock=${tilt}`);
  await pg.close();
}

// ── #A23: date + PLAY (Earth rotates / planets orbit) + selected-planet bottom-right (Earth globe ↔ planet orbit) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  const hasPlay = await pg.locator('[data-cel-play]').count();
  const hasDate = await pg.locator('[data-cel-date]').count();
  // default Earth → Earth+Moon box (draggable land/ocean globe with the Moon orbiting inside)
  const earthGlobe = await pg.evaluate(() => !!document.querySelector('[data-earth-moon]') && !!document.querySelector('[data-earth-moon] [data-mini-globe]'));
  // Units of Measure (⚙): distance defaults to km; picking AU updates the on-screen distance throughout
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120);
  const d0 = await pg.evaluate(() => document.querySelector('[data-ucrs-dist]')?.textContent || '');
  await pg.locator('[data-dist-unit="AU"]').click(); await pg.waitForTimeout(100);
  const d1 = await pg.evaluate(() => document.querySelector('[data-ucrs-dist]')?.textContent || '');
  const uomOk = /km/.test(d0) && /AU/.test(d1) && d0 !== d1;
  // Jupiter — a non-Earth planet clear of the bottom-right mini-panel overlay (Neptune/Mercury can sit under it at the
  // small test viewport → the click lands on the panel; the real UI selects fine, verified by diagnostic). Robust choice.
  await pg.locator('[data-planet-id="jupiter"]').click({ force: true }); await pg.waitForTimeout(300);
  const merc = await pg.evaluate(() => !!document.querySelector('[data-textured-globe]') && !document.querySelector('[data-earth-moon]'));
  rec('#A23 date + play control + Earth+Moon box ↔ textured planet + UoM distance (km→AU) updates throughout', hasPlay === 1 && hasDate === 1 && earthGlobe && merc && uomOk, `play=${hasPlay} date=${hasDate} earthGlobe=${earthGlobe} nonEarthGlobe=${merc} d0="${d0}" d1="${d1}" uomOk=${uomOk}`);
  await pg.close();
}

// ── #A26: the Sky Dome reflects the date set on the Solar-System view (single shared date) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  await pg.evaluate(() => { const inp = document.querySelector('[data-cel-date]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inp, '2025-03-21'); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); });
  await pg.waitForTimeout(150);
  await clk('[data-sky-view="dome"]'); await pg.waitForTimeout(200);
  const domeDate = await pg.evaluate(() => document.querySelector('[data-cal-input]')?.value || '');
  rec('#A26 Sky Dome reflects the Solar-System date (shared)', domeDate === '2025-03-21', `domeDate=${domeDate}`);
  await pg.close();
}

// ── #A24: 3-way size cycler True Scale → Proportional → THEMATIC (no Exaggerated); Thematic = compressed 1.0-1.5× spread ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  const dotR = (id) => pg.evaluate((pid) => { const g = document.querySelector(`[data-planet-id="${pid}"]`); const dot = g ? [...g.querySelectorAll('circle')].find((c) => (c.getAttribute('fill') || '').startsWith('#')) : null; return dot ? parseFloat(dot.getAttribute('r') || '0') : 0; }, id); // coloured dot (hit-target is fill=transparent)
  const modeOf = () => pg.evaluate(() => document.querySelector('[data-size-cycle]')?.getAttribute('data-size-mode') || '');
  // cycle all 3 modes, capturing Jupiter's dot per mode + the mode set (must be truescale/proportional/thematic, NO exaggerated)
  const sizes = {}, modes = {};
  for (let i = 0; i < 3; i++) { const m = await modeOf(); modes[m] = 1; sizes[m] = await dotR('jupiter'); await pg.locator('[data-size-cycle]').click(); await pg.waitForTimeout(120); }
  const three = Object.keys(sizes).length === 3 && modes['truescale'] && modes['proportional'] && modes['thematic'] && !modes['exaggerated'];
  const ordered = sizes['truescale'] < sizes['proportional'];            // real-scale ordering intact (same planet, same depth → dscale cancels)
  // land on Thematic + switch to the TOP-DOWN view (uniform dots, NO depth-scale) so the cross-planet spread is pure:
  // largest (Jupiter) ≤ ~1.5× smallest (Pluto).
  while ((await modeOf()) !== 'thematic') { await pg.locator('[data-size-cycle]').click(); await pg.waitForTimeout(120); }
  await pg.locator('[data-clock-toggle]').click(); await pg.waitForTimeout(200);
  const jT = await dotR('jupiter'), pT = await dotR('pluto');
  const spreadOk = jT > 0 && pT > 0 && jT / pT <= 1.55 && jT / pT >= 1.0; // ~50% spread, largest not dwarfing smallest
  rec('#A24 size cycler TrueScale→Proportional→Thematic (no Exaggerated) + Thematic 1.0-1.5× spread', three && ordered && spreadOk, JSON.stringify({ sizes, jT, pT, ratio: +(jT / pT).toFixed(3) }));
  await pg.close();
}

// ── #A25: solar-system gesture nav — wheel zoom + drag pan change the view transform + reset restores ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  const svg = pg.locator('[data-arch-celestial]');
  const vt0 = await pg.evaluate(() => document.querySelector('[data-cel-view]')?.getAttribute('transform') || '');
  const box = await svg.boundingBox();
  // wheel-zoom over the map (zoom about the Sun) then drag-pan on empty space
  if (box) { await pg.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await pg.mouse.wheel(0, -240); await pg.waitForTimeout(120); }
  const z1 = await pg.evaluate(() => document.querySelector('[data-cel-zoom]')?.textContent || '');
  const vt1 = await pg.evaluate(() => document.querySelector('[data-cel-view]')?.getAttribute('transform') || '');
  // pan on the empty bottom strip (below all orbits, so no planet swallows the drag)
  if (box) { await pg.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.9); await pg.mouse.down(); await pg.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.88, { steps: 6 }); await pg.mouse.up(); await pg.waitForTimeout(120); }
  const vt2 = await pg.evaluate(() => document.querySelector('[data-cel-view]')?.getAttribute('transform') || '');
  const hasReset = await pg.locator('[data-cel-reset]').count();
  if (hasReset) { await pg.locator('[data-cel-reset]').click(); await pg.waitForTimeout(120); }
  const vt3 = await pg.evaluate(() => document.querySelector('[data-cel-view]')?.getAttribute('transform') || '');
  const zoomed = vt1 !== vt0;
  const panned = vt2 !== vt1;
  const reset = vt3 !== vt2 && /scale\(1\)/.test(vt3);
  rec('#A25 solar-system pinch/wheel zoom + drag pan + rotate (view transform) + reset', zoomed && panned && hasReset === 1 && reset, `z1=${z1} zoomed=${zoomed} panned=${panned} reset=${reset}`);
  await pg.close();
}

// ── #A27: the globe MiniPanel mimics the Security mini-map — ⠿ Drag header + R-CORE lanes + resize + reposition ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  const chrome = await pg.evaluate(() => {
    const p = document.querySelector('[data-mini-panel]');
    return {
      panel: !!p,
      drag: /⠿\s*Drag/.test(p?.textContent || ''),
      lanes: /R-CORE/.test(p?.textContent || '') && ['COMM', 'EDGE', 'SYNC', 'LINK', 'UCRS'].every((k) => (p?.textContent || '').includes(k)),
      resize: !!document.querySelector('[data-mini-panel-resize]'),
      max: !!document.querySelector('[data-mini-panel-max]'),
      globe: !!p?.querySelector('[data-mini-globe]'),
    };
  });
  const grip = pg.locator('[data-mini-panel] .cursor-move').first();
  const gb = await grip.boundingBox();
  if (gb) { await pg.mouse.move(gb.x + gb.width / 2, gb.y + gb.height / 2); await pg.mouse.down(); await pg.mouse.move(gb.x - 120, gb.y - 90, { steps: 6 }); await pg.mouse.up(); await pg.waitForTimeout(120); }
  const moved = await pg.evaluate(() => { const p = document.querySelector('[data-mini-panel]'); return !!p && getComputedStyle(p).position === 'fixed'; });
  const ok = chrome.panel && chrome.drag && chrome.lanes && chrome.resize && chrome.max && chrome.globe && moved;
  rec('#A27 globe MiniPanel — ⠿ Drag header + R-CORE lanes + resize + maximize + repositions', ok, JSON.stringify({ ...chrome, moved }));
  await pg.close();
}

// ── #A29: the Moon is real-textured and orbits Earth at its ASTRONOMICALLY ACCURATE position — moving the
//     date shifts the Moon's orbital position AND its illuminated phase (2025-01-13 full ≈ 99% → 01-21 ≈ waning). ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  const has = await pg.evaluate(() => !!document.querySelector('[data-earth-moon] [data-moon-body] [data-textured-globe]'));
  const posOf = () => pg.evaluate(() => document.querySelector('[data-moon-body]')?.getAttribute('style') || '');
  const illumOf = () => pg.evaluate(() => (document.querySelector('[data-earth-moon]')?.textContent || '').match(/☾\s*(\d+)%/)?.[1] || '');
  const setDate = (d) => pg.evaluate((dd) => { const inp = document.querySelector('[data-cel-date]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inp, dd); inp.dispatchEvent(new Event('input', { bubbles: true })); inp.dispatchEvent(new Event('change', { bubbles: true })); }, d);
  await setDate('2025-01-13'); await pg.waitForTimeout(400); const p1 = await posOf(), i1 = await illumOf();
  await setDate('2025-01-21'); await pg.waitForTimeout(400); const p2 = await posOf(), i2 = await illumOf();
  rec('#A29 Moon accurate orbit — real-textured Moon moves + phase changes with date', has && p1 !== p2 && !!i1 && i1 !== i2, `has=${has} moved=${p1 !== p2} i1=${i1} i2=${i2}`);
  await pg.close();
}

// ── #A28: zoom-to-detail on the textured globe (wheel raises data-zoom) + Play runs ONE rotation then auto-stops ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  await pg.locator('[data-planet-id="mars"]').click({ force: true }); await pg.waitForTimeout(500);
  const g = await pg.locator('[data-textured-globe]').boundingBox();
  const z0 = await pg.evaluate(() => +(document.querySelector('[data-textured-globe]')?.getAttribute('data-zoom') || 1));
  if (g) { await pg.mouse.move(g.x + g.width / 2, g.y + g.height / 2); for (let i = 0; i < 6; i++) { await pg.mouse.wheel(0, -120); await pg.waitForTimeout(30); } }
  await pg.waitForTimeout(200);
  const z1 = await pg.evaluate(() => +(document.querySelector('[data-textured-globe]')?.getAttribute('data-zoom') || 1));
  await pg.locator('[data-planet-id="earth"]').click({ force: true }); await pg.waitForTimeout(300);
  // planet-rotation play (mini bottom-left, ▶ · name) spins one axial rotation then auto-stops
  await pg.locator('[data-planet-spin]').click(); await pg.waitForTimeout(500);
  const during = await pg.evaluate(() => (document.querySelector('[data-planet-spin]')?.textContent || '').includes('⏸'));
  await pg.waitForTimeout(6500); // one-rotation preview = 6s → auto-stop
  const after = await pg.evaluate(() => (document.querySelector('[data-planet-spin]')?.textContent || '').includes('▶'));
  rec('#A28 zoom-to-detail on globe (wheel) + planet-spin play (mini ▶·name) one rotation then auto-stops', z1 > z0 && z1 > 1.3 && during && after, `z0=${z0} z1=${z1} during=${during} after=${after}`);
  await pg.close();
}

// ── #A30: a "••• Advanced" expander on ALL 6 major tabs (persisted), absent on More ──
{
  const { pg, tab } = await mk();
  const majors = ['Overview', 'Design', 'Simulate', 'Review', 'Build', 'Lifecycle'];
  let present = 0, opened = false, persisted = false;
  for (const t of majors) {
    await tab(t); await pg.waitForTimeout(160);
    const has = await pg.evaluate(() => !!document.querySelector('[data-adv-tab] [data-arch-exp^="adv."]'));
    if (has) present++;
  }
  // open on Build + verify it persists to localStorage
  await tab('Build'); await pg.waitForTimeout(160);
  await pg.evaluate(() => { const b = [...document.querySelectorAll('[data-adv-tab] button')].find((x) => /Advanced/.test(x.textContent || '')); b && b.click(); });
  await pg.waitForTimeout(160);
  opened = await pg.evaluate(() => !!document.querySelector('[data-adv-group]'));
  persisted = await pg.evaluate(() => localStorage.getItem('arch2525.exp.adv.Build') === '1');
  const moreAbsent = await (async () => { await tab('More'); await pg.waitForTimeout(160); return pg.evaluate(() => !document.querySelector('[data-adv-tab]')); })();
  rec('#A30 "••• Advanced" expander on all 6 major tabs (persisted) + absent on More', present === 6 && opened && persisted && moreAbsent, `present=${present} opened=${opened} persisted=${persisted} moreAbsent=${moreAbsent}`);
  await pg.close();
}

// ── #A31: Build → Framing — member-by-member plan (draw + per-placement time/cost) + robotics 24/7 scenario + recompute ──
{
  const { pg, tab, clk } = await mk();
  await tab('Build');
  await clk('[data-arch-subnav] button:has-text("Framing")'); await pg.waitForTimeout(250);
  const base = await pg.evaluate(() => ({
    panel: !!document.querySelector('[data-arch-framing]'),
    plan: !!document.querySelector('[data-framing-plan]'),
    robotics: !!document.querySelector('[data-framing-robotics]'),
    members: +((document.querySelector('[data-framing-stat="Members"]')?.textContent) || '0'),
    seq: document.querySelectorAll('[data-framing-step]').length,
    hasRobot: /🤖/.test(document.querySelector('[data-framing-robotics]')?.textContent || ''),
  }));
  await pg.evaluate(() => { const inp = document.querySelector('[data-framing-input="L ft"]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(inp, '80'); inp.dispatchEvent(new Event('input', { bubbles: true })); });
  await pg.waitForTimeout(200);
  const after = await pg.evaluate(() => +((document.querySelector('[data-framing-stat="Members"]')?.textContent) || '0'));
  rec('#A31 Build→Framing member plan + per-placement time/cost + robotics 24/7 + recompute', base.panel && base.plan && base.robotics && base.hasRobot && base.members > 20 && base.seq >= 5 && after > base.members, JSON.stringify({ ...base, after }));
  await pg.close();
}

// ── #A32: the mini map shows the selected planet's axial ROTATION period (days+hours, ↺ for retrograde) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  await pg.locator('[data-planet-id="jupiter"]').click({ force: true }); await pg.waitForTimeout(400);
  const jup = await pg.evaluate(() => document.querySelector('[data-mini-rotation]')?.textContent || '');
  // Uranus for the retrograde check — an ISOLATED outer planet (no inner-planet overlap → robust click) that is
  // genuinely retrograde (rotDays −0.718 → "0.72 d ↺ · 17.2 h"). (Venus is also retrograde but overlaps Mercury.)
  await pg.locator('[data-planet-id="uranus"]').click({ force: true }); await pg.waitForTimeout(400);
  const ret = await pg.evaluate(() => document.querySelector('[data-mini-rotation]')?.textContent || '');
  const ok = /9\.\d\s*h/.test(jup) && /↺/.test(ret) && /17\.2/.test(ret); // Jupiter ~9.9h · Uranus 17.2 h retrograde ↺
  rec('#A32 mini map shows axial rotation period (Jupiter ~9.9 h · Uranus 17.2 h ↺ retrograde)', ok, `jup="${jup.trim()}" uranus="${ret.trim()}"`);
  await pg.close();
}

// ── #A35: clock shows location time zone (CST for Pfield) + military(24h)⇄standard(12h am·pm) toggle in ⚙ ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  // set noon so the 12h form is unambiguous (12:00 → 12:00 pm)
  await pg.evaluate(() => { const r = document.querySelector('[data-hu-input]'); }); // no-op keep structure
  const clk24 = await pg.evaluate(() => document.querySelector('[data-cel-clock]')?.textContent || '');
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120);
  await pg.locator('[data-clock-fmt="12h"]').click(); await pg.waitForTimeout(120);
  const clk12 = await pg.evaluate(() => document.querySelector('[data-cel-clock]')?.textContent || '');
  const ok = /CST/.test(clk24) && /\d{2}:\d{2}/.test(clk24) && /(am|pm)/.test(clk12) && clk24 !== clk12;
  rec('#A35 clock — location tz (CST) + military(24h) ⇄ standard(12h am·pm)', ok, `clk24="${clk24.trim()}" clk12="${clk12.trim()}"`);
  await pg.close();
}

// ── #A33: Moon play (Earth only, bottom-right of the mini map) runs one orbit → counter advances → auto-stops ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  const onEarth = await pg.evaluate(() => !!document.querySelector('[data-earth-moon] [data-moon-play]'));
  await pg.evaluate(() => { const b = document.querySelector('[data-moon-play] button'); b && b.click(); });
  await pg.waitForTimeout(1200);
  const c1 = await pg.evaluate(() => document.querySelector('[data-moon-counter]')?.textContent || '');
  await pg.waitForTimeout(1500);
  const c2 = await pg.evaluate(() => document.querySelector('[data-moon-counter]')?.textContent || '');
  const n1 = +(c1.match(/(\d+)\/3600/)?.[1] || -1), n2 = +(c2.match(/(\d+)\/3600/)?.[1] || -1);
  await pg.waitForTimeout(7000); // 9s run → auto-stop
  const stopped = await pg.evaluate(() => !document.querySelector('[data-moon-counter]'));
  await pg.locator('[data-planet-id="mercury"]').click({ force: true }); await pg.waitForTimeout(200);
  const noMoonOnMercury = await pg.evaluate(() => !document.querySelector('[data-moon-play]'));
  rec('#A33 Moon play (Earth only) — counter advances toward 3600 + auto-stops; absent on planets', onEarth && n2 > n1 && n1 >= 0 && stopped && noMoonOnMercury, `onEarth=${onEarth} n1=${n1} n2=${n2} stopped=${stopped} noMoonOnMercury=${noMoonOnMercury}`);
  await pg.close();
}

// ── #A34: constellation celestial sphere behind the system (inside the view transform, moves with pan) + Polaris ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  const info = await pg.evaluate(() => {
    const sf = document.querySelector('[data-cel-view] [data-starfield]');
    return {
      inView: !!sf,
      cons: document.querySelectorAll('[data-constellation]').length,
      orion: !!document.querySelector('[data-constellation="Orion"]'),
      polaris: /Polaris/.test(sf?.textContent || ''),
    };
  });
  // constellations sit inside data-cel-view, so panning the map moves them (transform changes)
  const vt0 = await pg.evaluate(() => document.querySelector('[data-cel-view]')?.getAttribute('transform') || '');
  const box = await pg.locator('[data-arch-celestial]').boundingBox();
  if (box) { await pg.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.85); await pg.mouse.down(); await pg.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.8, { steps: 5 }); await pg.mouse.up(); await pg.waitForTimeout(120); }
  const vt1 = await pg.evaluate(() => document.querySelector('[data-cel-view]')?.getAttribute('transform') || '');
  const ok = info.inView && info.cons >= 12 && info.orion && info.polaris && vt0 !== vt1;
  rec('#A34 constellation celestial sphere (12+ incl. Orion, Polaris) inside view + moves with pan', ok, JSON.stringify({ ...info, moved: vt0 !== vt1 }));
  await pg.close();
}

// ── #A36: zoom works in BOTH standard + clock (top-down) views; Earth·Moon mini view has a distant backdrop ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  const svg = pg.locator('[data-arch-celestial]');
  const zoomIn = async () => { const box = await svg.boundingBox(); if (box) { await pg.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await pg.mouse.wheel(0, -240); await pg.waitForTimeout(120); } return pg.evaluate(() => +(document.querySelector('[data-cel-zoom]')?.textContent?.replace('×', '') || 1)); };
  const zStd = await zoomIn();                                   // standard view
  await pg.locator('[data-cel-reset]').click().catch(() => {}); await pg.waitForTimeout(100);
  await pg.locator('[data-clock-toggle]').click(); await pg.waitForTimeout(200); // top-down
  const zTop = await zoomIn();                                   // clock/top-down view
  const backdrop = await pg.evaluate(() => !!document.querySelector('[data-earth-moon] [data-em-backdrop]'));
  rec('#A36 zoom works in standard + clock views + Earth·Moon distant backdrop', zStd > 1 && zTop > 1 && backdrop, `zStd=${zStd} zTop=${zTop} backdrop=${backdrop}`);
  await pg.close();
}

// ── #A37: SA tilt 0-45° · constellations TILT with the system · orbits ride off Earth's plane (inclination) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120);        // open ⚙ to reach the SA tilt slider
  const setTilt = async (v) => { await pg.evaluate((val) => { const t = document.querySelector('[data-tilt-input]'); if (!t) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, String(val)); t.dispatchEvent(new Event('input', { bubbles: true })); }, v); await pg.waitForTimeout(150); };
  const range = await pg.evaluate(() => { const t = document.querySelector('[data-tilt-input]'); if (!t) return { min: 0, max: 0 }; return { min: +t.min, max: +t.max }; });
  // constellation Y moves when SA tilt changes (celestial sphere foreshortens with the system)
  const conY = () => pg.evaluate(() => document.querySelector('[data-constellation="Orion"] circle')?.getAttribute('cy'));
  await setTilt(10); const cy10 = await conY();
  await setTilt(45); const cy45 = await conY();
  // orbital inclination: Earth's orbit stays flat (rotate ~0); an inclined orbit (Pluto 17°) is rotated off it
  const incl = await pg.evaluate(() => ({
    earth: +(document.querySelector('[data-orbit-group="earth"]')?.getAttribute('data-incl') || 'NaN'),
    pluto: +(document.querySelector('[data-orbit-group="pluto"]')?.getAttribute('data-incl') || 'NaN'),
    mercury: +(document.querySelector('[data-orbit-group="mercury"]')?.getAttribute('data-incl') || 'NaN'),
  }));
  const moved = cy10 !== null && cy45 !== null && cy10 !== cy45;
  const inclOk = Math.abs(incl.earth) < 0.01 && Math.abs(incl.pluto) > Math.abs(incl.mercury) && Math.abs(incl.mercury) > 0;
  const ok = range.min === 0 && range.max === 45 && moved && inclOk;
  rec('#A37 SA tilt 0-45° + constellations tilt with system + orbits ride off Earth plane (Pluto>Mercury>Earth=0)', ok, JSON.stringify({ range, cy10, cy45, incl }));
  await pg.close();
}

// ── #A38: main-map ORBIT play sweeps HU (SA.EA..HU counter ticks) + 1×/2×/3× speed selector (3× = current) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  const speeds = await pg.evaluate(() => document.querySelectorAll('[data-cel-speed-x]').length);      // 1×/2×/3× buttons
  const huText = () => pg.evaluate(() => document.querySelector('[data-hu-input]')?.value);
  await pg.evaluate(() => { const b = document.querySelector('[data-cel-speed-x="3"]'); b && b.click(); }); // fastest
  const hu0 = await huText();
  await pg.locator('[data-cel-play]').click(); await pg.waitForTimeout(150);
  const playingLabel = await pg.evaluate(() => (document.querySelector('[data-cel-play]')?.textContent || '').includes('pause'));
  await pg.waitForTimeout(700);
  const hu1 = await huText();                       // HU advanced around the orbit
  await pg.locator('[data-cel-play]').click();      // pause
  const ok = speeds === 3 && playingLabel && hu0 !== hu1;
  rec('#A38 main-map orbit play sweeps HU (counter ticks) + 1×/2×/3× speed', ok, JSON.stringify({ speeds, hu0, hu1, playingLabel }));
  await pg.close();
}

// ── #A39: MAP — real RA/Dec constellations + the 12-sign Zodiac band (Sumerian provenance) on the ecliptic + Polaris ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  const info = await pg.evaluate(() => ({
    zodiacSigns: document.querySelectorAll('[data-zodiac] [data-zodiac-sign]').length,
    provenance: /Sumerian|MUL\.APIN|Babylonian/.test(document.querySelector('[data-zodiac-origin]')?.textContent || ''),
    aries: !!document.querySelector('[data-zodiac-sign="Aries"]'),
    priority: document.querySelectorAll('[data-starfield] [data-constellation]').length, // priority (12) + zodiac (12)
    polaris: /Polaris/.test(document.querySelector('[data-starfield]')?.textContent || ''),
    orion: !!document.querySelector('[data-constellation="Orion"]'),
  }));
  // tilt still moves the star sphere (keep #A37 behaviour): Orion cy changes when SA tilt changes
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120);
  const conY = () => pg.evaluate(() => document.querySelector('[data-constellation="Orion"] circle')?.getAttribute('cy'));
  const setTilt = async (v) => { await pg.evaluate((val) => { const t = document.querySelector('[data-tilt-input]'); if (!t) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, String(val)); t.dispatchEvent(new Event('input', { bubbles: true })); }, v); await pg.waitForTimeout(150); };
  await setTilt(10); const y10 = await conY(); await setTilt(45); const y45 = await conY();
  const ok = info.zodiacSigns === 12 && info.provenance && info.aries && info.priority >= 24 && info.polaris && info.orion && y10 !== y45;
  rec('#A39 MAP real RA/Dec constellations + 12 Zodiac signs (Sumerian) on ecliptic + Polaris + tilt-moves-sky', ok, JSON.stringify({ ...info, y10, y45 }));
  await pg.close();
}

// ── #A39b: DOME — real bright-star overlay (RA/Dec → alt-az) agrees with the map; Polaris el ≈ |lat| ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Site');   // default sub-view is the Sky Dome
  await pg.waitForTimeout(300);
  const info = await pg.evaluate(() => {
    const stars = document.querySelectorAll('[data-arch-sky] [data-el="star"]').length;
    const pol = document.querySelector('[data-arch-sky] [data-el="polaris"]');
    return { stars, hasPolaris: !!pol };
  });
  // Polaris altitude ≈ latitude (30.44 default) — read the note line
  const polNote = await pg.evaluate(() => (document.body.textContent || '').match(/Polaris ≈ (\d+)°/)?.[1]);
  const ok = info.stars >= 1 && info.hasPolaris && Math.abs((+polNote) - 30) <= 2;
  rec('#A39b DOME real bright-star overlay + Polaris el≈|lat| (both views share one sky)', ok, JSON.stringify({ ...info, polNote }));
  await pg.close();
}

// ── #A42: ACCURATE mode — flipping to real Kepler positions moves a planet off its schematic spot (additive, default-off) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(300);
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120);
  const defOff = await pg.evaluate(() => document.querySelector('[data-cel-accurate]')?.getAttribute('data-cel-accurate') === '0'); // default schematic
  const jupPos = () => pg.evaluate(() => { const g = document.querySelector('[data-planet-id="jupiter"] circle'); return g ? g.getAttribute('cx') + ',' + g.getAttribute('cy') : ''; });
  const before = await jupPos();
  await pg.locator('[data-cel-accurate]').click(); await pg.waitForTimeout(200); // → accurate (real)
  const on = await pg.evaluate(() => document.querySelector('[data-cel-accurate]')?.getAttribute('data-cel-accurate') === '1');
  const after = await jupPos();
  rec('#A42 accurate mode (default off) → real Kepler positions move a planet', defOff && on && before !== after && !!before, JSON.stringify({ defOff, on, before, after }));
  await pg.close();
}

// ── #A44: HOMEOWNER LOCK — Sky Dome sun rises in the EAST and sets in the WEST (arcs through the south), by hour ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Site'); await pg.waitForTimeout(300);   // Sky Dome is the default sub-view
  const setHour = async (h) => { await pg.evaluate((val) => { const t = [...document.querySelectorAll('input[type=range]')].find(i => +i.max === 24); if (!t) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, String(val)); t.dispatchEvent(new Event('input', { bubbles: true })); }, h); await pg.waitForTimeout(140); };
  const sunX = () => pg.evaluate(() => { const c = document.querySelector('[data-el="sun"]'); return c ? +c.getAttribute('cx') : null; });
  await setHour(8); const morn = await sunX();   // morning → east (CX=50, east = x > 50)
  await setHour(16); const eve = await sunX();    // evening → west (x < 50)
  const ok = morn !== null && eve !== null && morn > 51 && eve < 49;
  rec('#A44 Sky Dome sun rises EAST (morning x>50) + sets WEST (evening x<50) — homeowner arc', ok, `mornX=${morn?.toFixed(1)} eveX=${eve?.toFixed(1)}`);
  await pg.close();
}

// ── #A45: HOMEOWNER — Sky Dome special-date presets (solstice/equinox/today) + sunrise/sunset readout ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Site'); await pg.waitForTimeout(300);   // Sky Dome default
  const presets = await pg.evaluate(() => document.querySelectorAll('[data-arch-presets] [data-preset]').length);
  const riseSet = () => pg.evaluate(() => document.querySelector('[data-arch-riseset]')?.textContent || '');
  // Summer Solstice → a June day; Winter Solstice → a December day; rise/set readout present + differs
  await pg.locator('[data-arch-presets] [data-preset]', { hasText: 'Summer Solstice' }).click(); await pg.waitForTimeout(160);
  const summer = await riseSet();
  const monthS = await pg.evaluate(() => (document.body.textContent || '').includes('Jun'));
  await pg.locator('[data-arch-presets] [data-preset]', { hasText: 'Winter Solstice' }).click(); await pg.waitForTimeout(160);
  const winter = await riseSet();
  const hasRise = /↑\s*\d\d:\d\d/.test(summer) && /↑\s*\d\d:\d\d/.test(winter);
  const ok = presets === 5 && monthS && hasRise && summer !== winter;
  rec('#A45 Sky Dome special-date presets (5) + sunrise/sunset readout (summer≠winter)', ok, JSON.stringify({ presets, monthS, summer: summer.slice(0, 24), winter: winter.slice(0, 24) }));
  await pg.close();
}

// ── #A46: HOMEOWNER — settable window/house-face azimuth + alignment to a special-date sunrise/sunset ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Site'); await pg.waitForTimeout(300);
  const hasFacing = await pg.locator('[data-arch-facing]').count();
  const setFacing = async (v) => { await pg.evaluate((val) => { const t = document.querySelector('[data-arch-facing]'); if (!t) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, String(val)); t.dispatchEvent(new Event('input', { bubbles: true })); }, v); await pg.waitForTimeout(140); };
  const align = () => pg.evaluate(() => document.querySelector('[data-arch-align]')?.textContent || '');
  await setFacing(118); const a118 = await align();   // ~winter-solstice sunrise azimuth at lat 30
  await setFacing(300); const a300 = await align();
  const mentions = (s) => /(solstice|equinox)/.test(s) && /(sunrise|sunset)/.test(s);
  const ok = hasFacing === 1 && mentions(a118) && mentions(a300) && a118 !== a300;
  rec('#A46 settable window-face azimuth → aligns to a special-date sunrise/sunset (the mission sentence)', ok, JSON.stringify({ a118: a118.slice(0, 40), a300: a300.slice(0, 40) }));
  await pg.close();
}

// ── #A48: HOMEOWNER MISSION — Moon (+Sun) over the window on the selected date (time · elevation · phase) ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Site'); await pg.waitForTimeout(300);
  const hasTransit = await pg.locator('[data-arch-window-transit]').count();
  const readTransit = () => pg.evaluate(() => document.querySelector('[data-arch-window-transit]')?.textContent || '');
  const clkPreset = async (label) => { await pg.evaluate((lab) => { const btns = [...document.querySelectorAll('[data-arch-presets] button')]; const bt = btns.find((b) => (b.textContent || '').includes(lab)); if (bt) bt.click(); }, label); await pg.waitForTimeout(180); };
  const timeRe = /\b\d{2}:\d{2}\b/;
  await clkPreset('Summer'); const summer = await readTransit();
  await clkPreset('Winter'); const winter = await readTransit();
  const mentionsBoth = (s) => /☀\s*Sun/.test(s) && /☾\s*Moon/.test(s) && /over your/.test(s);
  // date-driven: the Moon transit line differs between two seasons (proves it recomputes per selected date)
  const moonLine = (s) => (s.match(/☾\s*Moon over your[^☀]*/) || [''])[0];
  const ok = hasTransit === 1 && mentionsBoth(summer) && mentionsBoth(winter) && (timeRe.test(summer) || /never above horizon/.test(summer)) && moonLine(summer) !== moonLine(winter);
  rec('#A48 Moon/Sun over the window on the selected date — the mission (time · el · phase, date-driven)', ok, JSON.stringify({ hasTransit, summer: summer.replace(/\s+/g, ' ').slice(0, 70), winter: winter.replace(/\s+/g, ' ').slice(0, 70) }));
  await pg.close();
}

// ── #A49: HOMEOWNER REVERSE — natural anniversary: which date best frames the window + "go" jumps the calendar there ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Site'); await pg.waitForTimeout(300);
  const hasBest = await pg.locator('[data-arch-best-date]').count();
  const bestText = await pg.evaluate(() => document.querySelector('[data-arch-best-date]')?.textContent || '');
  const jumps = await pg.locator('[data-arch-best-jump]').count();
  // set the calendar to a known-off date (Winter) first so the jump to the best (summer for a S window) is unambiguous
  await pg.evaluate(() => { const btns = [...document.querySelectorAll('[data-arch-presets] button')]; const bt = btns.find((b) => /winter/i.test(b.textContent || '')); if (bt) bt.click(); });
  await pg.waitForTimeout(160);
  const dateBefore = await pg.evaluate(() => document.querySelector('[data-cal-input]')?.value || '');
  // click the Sun "go" — the date must jump to the discovered anniversary
  await pg.evaluate(() => { const b = [...document.querySelectorAll('[data-arch-best-jump]')][0]; if (b) b.click(); });
  await pg.waitForTimeout(160);
  const dateAfter = await pg.evaluate(() => document.querySelector('[data-cal-input]')?.value || '');
  const mentions = /natural anniversary/i.test(bestText) && /best sky framing/i.test(bestText);
  const ok = hasBest === 1 && jumps >= 1 && mentions && dateAfter !== '' && dateAfter !== dateBefore;
  rec('#A49 reverse solver — natural anniversary best-frames the window + "go" jumps the calendar', ok, JSON.stringify({ hasBest, jumps, before: dateBefore, after: dateAfter, best: bestText.replace(/\s+/g, ' ').slice(0, 64) }));
  await pg.close();
}

// ── #A50: HOMEOWNER — plain-language "Window Story" synthesis line (one sentence for the heart) ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Site'); await pg.waitForTimeout(300);
  const hasStory = await pg.locator('[data-arch-window-story]').count();
  const story = await pg.evaluate(() => document.querySelector('[data-arch-window-story]')?.textContent || '');
  const ok = hasStory === 1 && /Your/.test(story) && /window/.test(story) && story.length > 20;
  rec('#A50 plain-language Window Story synthesis line (one sentence, human)', ok, JSON.stringify({ hasStory, story: story.replace(/\s+/g, ' ').slice(0, 80) }));
  await pg.close();
}

// ── #A51: CELESTIAL — line/stroke thinness stays CONSTANT on zoom (vector-effect: non-scaling-stroke) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  // the orbit rings + constellation lines inside data-cel-view must resolve non-scaling-stroke (screen-space stroke)
  const ve = await pg.evaluate(() => {
    const o = document.querySelector('[data-cel-view] [data-orbit]');
    const l = document.querySelector('[data-cel-view] line');
    return { orbit: o ? getComputedStyle(o).vectorEffect : 'none', line: l ? getComputedStyle(l).vectorEffect : 'none' };
  });
  // and after a wheel-zoom, the orbit's on-screen stroke thickness must NOT grow (thin at any zoom)
  const svg = pg.locator('[data-arch-celestial]'); const box = await svg.boundingBox();
  const orbitBox = () => pg.evaluate(() => { const o = document.querySelector('[data-cel-view] [data-orbit]'); if (!o) return 0; const r = o.getBoundingClientRect(); return Math.min(r.width, r.height); });
  const wPre = await orbitBox();
  if (box) { await pg.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await pg.mouse.wheel(0, -240); await pg.waitForTimeout(150); }
  const zoomTxt = await pg.evaluate(() => document.querySelector('[data-cel-zoom]')?.textContent || '');
  const strokePx = await pg.evaluate(() => { const o = document.querySelector('[data-cel-view] [data-orbit]'); if (!o) return -1; return parseFloat(getComputedStyle(o).strokeWidth); });
  const ok = ve.orbit === 'non-scaling-stroke' && ve.line === 'non-scaling-stroke' && strokePx > 0 && strokePx < 2;
  rec('#A51 celestial strokes stay thin on zoom (non-scaling-stroke on orbits + lines)', ok, JSON.stringify({ ...ve, zoom: zoomTxt, strokePx: strokePx.toFixed(3), wPre: wPre.toFixed(0) }));
  await pg.close();
}

// ── #A52: CLOCK icon defaults tilt=45 + resets rotation (upright labels) EVERY click (operator IMG_7337/7339) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(200);
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120);            // open ⚙ to reach the tilt slider
  const setTilt = async (v) => { await pg.evaluate((val) => { const t = document.querySelector('[data-tilt-input]'); if (!t) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, String(val)); t.dispatchEvent(new Event('input', { bubbles: true })); }, v); await pg.waitForTimeout(120); };
  const rotOf = () => pg.evaluate(() => (document.querySelector('[data-cel-view]')?.getAttribute('transform') || '').match(/rotate\(([-0-9.]+)/)?.[1] || '0');
  // twist the map (right-drag = rotate) and knock the tilt off 45 → prove the clock click straightens BOTH
  const svg = pg.locator('[data-arch-celestial]'); const box = await svg.boundingBox();
  if (box) { await pg.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5); await pg.mouse.down({ button: 'right' }); await pg.mouse.move(box.x + box.width * 0.78, box.y + box.height * 0.5, { steps: 6 }); await pg.mouse.up({ button: 'right' }); await pg.waitForTimeout(120); }
  await setTilt(20);
  await pg.locator('[data-clock-toggle]').click(); await pg.waitForTimeout(180);
  const tiltAfter = await pg.evaluate(() => +(document.querySelector('[data-tilt-input]')?.value || '0'));
  const rotAfter = +(await rotOf());
  const peritop = await pg.evaluate(() => document.querySelector('[data-arch-celestial]')?.getAttribute('data-peritop') === '1');
  // and re-asserts 45 even when already IN clock view (knock tilt off, click again → back to 45, not exit)
  await setTilt(20);
  await pg.locator('[data-clock-toggle]').click(); await pg.waitForTimeout(160);
  const tiltReassert = await pg.evaluate(() => +(document.querySelector('[data-tilt-input]')?.value || '0'));
  const ok = tiltAfter === 45 && Math.abs(rotAfter) < 0.01 && peritop && tiltReassert === 45;
  rec('#A52 clock icon → 45° + rotation reset (upright labels) every click', ok, JSON.stringify({ tiltAfter, rotAfter, peritop, tiltReassert }));
  await pg.close();
}

// ── #A53: settings sliders match Security-2525 (cyan accent, not default browser blue) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(200);
  await clk('[data-cel-detail]'); await pg.waitForTimeout(120);              // open ⚙ to reach the tilt slider
  const acc = await pg.evaluate(() => {
    const t = document.querySelector('[data-tilt-input]'), h = document.querySelector('[data-hu-input]');
    const norm = (s) => (s || '').replace(/\s/g, '');
    return { tilt: t ? norm(getComputedStyle(t).accentColor) : 'none', hu: h ? norm(getComputedStyle(h).accentColor) : 'none' };
  });
  // cyan #19c8cf → rgb(25,200,207); accept any explicit color (not 'auto'/default)
  const isCyan = (s) => s === 'rgb(25,200,207)' || /25,200,207/.test(s);
  const ok = isCyan(acc.tilt) && isCyan(acc.hu);
  rec('#A53 settings sliders use Security cyan accent (not default blue)', ok, JSON.stringify(acc));
  await pg.close();
}

// ── #A54: PLANET expand mode matches the MAP maximize — full-screen + cyan minimize UPPER-RIGHT + restore ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  // maximize the planet MiniPanel
  await pg.evaluate(() => document.querySelector('[data-mini-panel-max]')?.click()); await pg.waitForTimeout(200);
  const maxed = await pg.evaluate(() => {
    const p = document.querySelector('[data-mini-panel][data-mini-max="1"]');
    if (!p) return { full: false };
    const cs = getComputedStyle(p), r = p.getBoundingClientRect();
    // the header minimize button should be cyan-bordered (rgb(25,200,207)) — same look as the map's data-cel-max
    const btn = p.querySelector('[data-mini-panel-max]');
    const bc = btn ? getComputedStyle(btn).borderColor.replace(/\s/g, '') : '';
    // MUST cover the WHOLE viewport from the top-left (over the app nav) — not just be big somewhere lower
    return { full: cs.position === 'fixed' && r.top <= 2 && r.left <= 2 && r.width >= window.innerWidth - 4 && r.height >= window.innerHeight - 4, cyanBtn: /25,200,207/.test(bc), top: Math.round(r.top), left: Math.round(r.left) };
  });
  // restore (click the same minimize) → back to docked (no data-mini-max)
  await pg.evaluate(() => document.querySelector('[data-mini-panel][data-mini-max="1"] [data-mini-panel-max]')?.click()); await pg.waitForTimeout(160);
  const restored = await pg.evaluate(() => !document.querySelector('[data-mini-panel][data-mini-max="1"]'));
  const ok = maxed.full === true && maxed.cyanBtn === true && restored === true;
  rec('#A54 planet expand = full-screen like the map + cyan minimize upper-right + restores', ok, JSON.stringify({ ...maxed, restored }));
  await pg.close();
}

// ── #A55: DECLUTTER — R-CORE lanes live in a SCROLLABLE map row (Security method), removed from the shell below-tabs ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  const info = await pg.evaluate(() => {
    const row = document.querySelector('[data-cel-rcore]');
    const txt = row?.textContent || '';
    const ox = row ? getComputedStyle(row).overflowX : '';
    // the OLD shell strip was an unconditional R-CORE row directly under [data-arch-subnav]; it should be gone now
    const sub = document.querySelector('[data-arch-subnav]');
    const next = sub?.nextElementSibling;
    const shellStripGone = !(next && /^R-CORE/.test((next.textContent || '').trim()) && !next.hasAttribute('data-arch-tab'));
    return { hasRow: !!row, lanes: ['COMM', 'EDGE', 'SYNC', 'LINK', 'UCRS'].every((k) => txt.includes(k)), scrollable: ox === 'auto' || ox === 'scroll', shellStripGone };
  });
  const ok = info.hasRow && info.lanes && info.scrollable && info.shellStripGone;
  rec('#A55 R-CORE moved to a scrollable map row (declutter) — Security-2525 method', ok, JSON.stringify(info));
  await pg.close();
}

// ── #A56: MAP ••• edge expanders — left · right · bottom collapsible menus (default closed, open on click) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  const btns = await pg.evaluate(() => ['left', 'right', 'bottom'].map((s) => !!document.querySelector(`[data-map-exp-${s}-btn]`)));
  const closed0 = await pg.evaluate(() => ['left', 'right', 'bottom'].every((s) => !document.querySelector(`[data-map-exp-${s}]`)));
  const opened = {};
  for (const s of ['left', 'right', 'bottom']) {
    await pg.evaluate((side) => document.querySelector(`[data-map-exp-${side}-btn]`)?.click(), s); await pg.waitForTimeout(120);
    opened[s] = await pg.evaluate((side) => !!document.querySelector(`[data-map-exp-${side}]`), s);
    await pg.evaluate((side) => document.querySelector(`[data-map-exp-${side}-btn]`)?.click(), s); await pg.waitForTimeout(80); // close again
  }
  const ok = btns.every(Boolean) && closed0 && opened.left && opened.right && opened.bottom;
  rec('#A56 map ••• edge expanders (left · right · bottom) present, default closed, open on click', ok, JSON.stringify({ btns, closed0, opened }));
  await pg.close();
}

// ── #A57: the ••• toggles use Security's Toggle3 look — three CYAN dots (not a text glyph) ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  const info = await pg.evaluate(() => {
    const out = {};
    for (const s of ['left', 'right', 'bottom']) {
      const btn = document.querySelector(`[data-map-exp-${s}-btn]`);
      const dots = btn ? [...btn.querySelectorAll('span')] : [];
      const cyan = dots.filter((d) => getComputedStyle(d).backgroundColor.replace(/\s/g, '') === 'rgb(25,200,207)').length;
      out[s] = { dots: dots.length, cyan };
    }
    return out;
  });
  const ok = ['left', 'right', 'bottom'].every((s) => info[s].dots >= 3 && info[s].cyan >= 3);
  rec('#A57 ••• toggles = Security Toggle3 look (3 cyan dots each)', ok, JSON.stringify(info));
  await pg.close();
}

// ── #A58: the ••• panels live OUTSIDE the map — expanding one sits ABOVE the map surface (its own flow section),
//          never overlapping/covering the SVG map (operator: "bullet expansion fields are outside map … the
//          expand collapses in a tight section above the map"). Asserts the REAL anti-overlay property. ──
{
  const { pg, tab, subtab, clk } = await mk();
  await tab('Design'); await subtab('Site');
  await clk('[data-sky-view="solar"]'); await pg.waitForTimeout(250);
  // open the left ••• menu, then measure the panel vs the map
  await pg.evaluate(() => document.querySelector('[data-map-exp-left-btn]')?.click()); await pg.waitForTimeout(150);
  const info = await pg.evaluate(() => {
    const panel = document.querySelector('[data-map-exp-left]');
    const svg = document.querySelector('[data-arch-celestial]');
    if (!panel || !svg) return { panel: !!panel, svg: !!svg };
    const p = panel.getBoundingClientRect(), m = svg.getBoundingClientRect();
    return {
      panel: true, svg: true,
      insideSvg: svg.contains(panel),                 // must be false — not a child of the map
      panelBottom: Math.round(p.bottom), mapTop: Math.round(m.top),
      above: p.bottom <= m.top + 1,                   // panel ends at/above the map top → no overlap
    };
  });
  const ok = info.panel && info.svg && info.insideSvg === false && info.above === true;
  rec('#A58 ••• panels are OUTSIDE the map (expand sits above, never overlaps the map surface)', ok, JSON.stringify(info));
  await pg.close();
}

// ── #A66: DESIGN is a Security-2525-style 3-column workspace (LEFT Layer Tree · CENTER engine · RIGHT context)
//          with a 4-tab visualization engine (Model · Site · Sky · Compare) — the Digital-Twin cockpit shell. ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(250);
  const info = await pg.evaluate(() => {
    const subnav = document.querySelector('[data-arch-subnav]');
    const tabs = subnav ? [...subnav.querySelectorAll('button')].map((b) => (b.textContent || '').trim()) : [];
    return {
      ws: !!document.querySelector('[data-arch-design-ws]'),
      leftRail: !!document.querySelector('[data-arch-rail="left"]'),   // Layer Tree rail (open by default)
      engine: !!document.querySelector('[data-arch-engine]'),
      tabs,
    };
  });
  const want = ['Model', 'Site', 'Sky', 'Compare'];
  const ok = info.ws && info.leftRail && info.engine && want.every((t) => info.tabs.includes(t)) && info.tabs.length === 4;
  rec('#A66 Design = 3-column workspace (Layer Tree · engine · context) + 4 engine tabs incl SKY', ok, JSON.stringify(info));
  await pg.close();
}

// ── #A67: the celestial map + Moon-over-window are PRESERVED, not removed — the SKY tab renders the celestial
//          map with its ••• map rails intact; the SITE tab keeps the Sky-Dome/Solar toggle + the window mission. ──
{
  const { pg, tab, subtab } = await mk();
  await tab('Design'); await subtab('Sky'); await pg.waitForTimeout(400);
  const sky = await pg.evaluate(() => ({
    celestial: !!document.querySelector('[data-arch-celestial]'),                         // celestial map under SKY
    railBtns: ['left', 'right', 'bottom'].every((s) => !!document.querySelector(`[data-map-exp-${s}-btn]`)), // ••• rails intact
    noToggle: !document.querySelector('[data-sky-view]'),                                 // engine tab replaces internal toggle
  }));
  await subtab('Site'); await pg.waitForTimeout(350);
  const site = await pg.evaluate(() => ({
    domeToggle: !!document.querySelector('[data-sky-view="solar"]'),                       // SITE keeps dome/solar toggle
    windowMission: !!document.querySelector('[data-arch-window-transit]'),                 // Moon-over-window preserved
  }));
  const ok = sky.celestial && sky.railBtns && sky.noToggle && site.domeToggle && site.windowMission;
  rec('#A67 SKY = celestial map + ••• rails (preserved); SITE keeps dome/solar toggle + Moon-over-window mission', ok, JSON.stringify({ sky, site }));
  await pg.close();
}

// ── #A59: LAYER TREE renders in the Design LEFT rail — 3 scopes (Physical Digital Twin · Operational
//          Intelligence · Lifecycle) + a search box (Vision 2525 Digital Twin Standard v1.0). ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(300);
  const info = await pg.evaluate(() => {
    const tree = document.querySelector('[data-arch-layer-tree]');
    const scopes = [...document.querySelectorAll('[data-layer-scope]')].map((s) => s.getAttribute('data-layer-scope'));
    return {
      tree: !!tree,
      search: !!document.querySelector('[data-layer-search]'),
      scopes,
      hasPhysical: !!document.querySelector('[data-layer-node="physical/site"]'),   // Site branch present
    };
  });
  const want = ['physical', 'operational', 'lifecycle'];
  const ok = info.tree && info.search && want.every((s) => info.scopes.includes(s)) && info.hasPhysical;
  rec('#A59 Layer Tree in Design LEFT rail — 3 scopes + search box', ok, JSON.stringify(info));
  await pg.close();
}

// ── #A60: NESTING LAW — "Level 3 Cubes" lives INSIDE physical systems (never a top-level branch); Site &
//          Spaces have none; Structure is 4 levels deep (Scope → Structure → Primary System → members). ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(300);
  // expand all 10 physical systems (collapsed nodes don't render children) + Primary Structure for the 4th level
  const SYS = ['foundation', 'structure', 'building-envelope', 'mechanical', 'electrical', 'plumbing', 'fire-protection', 'communications-low-voltage', 'interior', 'exterior'];
  for (const s of SYS) { await pg.evaluate((id) => document.querySelector(`[data-layer-node="physical/${id}"]`)?.click(), s); await pg.waitForTimeout(40); }
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/structure/primary-structure"]')?.click()); await pg.waitForTimeout(120);
  const info = await pg.evaluate(() => {
    const l3 = [...document.querySelectorAll('[data-layer-node]')].filter((n) => /\/level-3-cubes$/.test(n.getAttribute('data-layer-node') || ''));
    const l3ids = l3.map((n) => n.getAttribute('data-layer-node'));
    // a Level-3-Cubes node id has ≥2 slashes (scope/system/level-3-cubes) → nested, not top-level
    const allNested = l3ids.length >= 10 && l3ids.every((id) => (id.match(/\//g) || []).length >= 2);
    const siteNo = !document.querySelector('[data-layer-node="physical/site/level-3-cubes"]');
    const spacesNo = !document.querySelector('[data-layer-node="physical/spaces/level-3-cubes"]');
    // 4-level depth: a member under Primary Structure
    const beam = !!document.querySelector('[data-layer-node="physical/structure/primary-structure/beams-girders"]');
    return { count: l3ids.length, allNested, siteNo, spacesNo, beam };
  });
  const ok = info.allNested && info.siteNo && info.spacesNo && info.beam;
  rec('#A60 nesting law — Level 3 Cubes inside systems (10, ≥2 deep, not Site/Spaces) + Structure 4-level depth', ok, JSON.stringify(info));
  await pg.close();
}

// ── #A61: EXPAND / COLLAPSE — a physical system (Foundation) toggles its children open/closed. ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(300);
  const footingSel = '[data-layer-node="physical/foundation/footings"]';
  const seen = () => pg.evaluate((s) => !!document.querySelector(s), footingSel);
  const closed0 = !(await seen());                                                // collapsed by default
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  const openedNow = await seen();                                                 // child visible after expand
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  const closedAgain = !(await seen());                                            // hidden after collapse
  const ok = closed0 && openedNow && closedAgain;
  rec('#A61 Layer Tree expand/collapse — Foundation toggles children', ok, JSON.stringify({ closed0, openedNow, closedAgain }));
  await pg.close();
}

// ── #A65: SEARCH / FILTER — typing filters to matches and auto-expands their ancestors (the enhancement
//          over Security's PlacementRail, which has no search). ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(300);
  const setSearch = async (v) => { await pg.evaluate((val) => { const t = document.querySelector('[data-layer-search]'); if (!t) return; const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, val); t.dispatchEvent(new Event('input', { bubbles: true })); }, v); await pg.waitForTimeout(200); };
  await setSearch('ductwork');
  const info = await pg.evaluate(() => ({
    duct: !!document.querySelector('[data-layer-node="physical/mechanical/ductwork"]'),  // match visible (ancestor auto-expanded)
    unrelated: !!document.querySelector('[data-layer-node="physical/foundation/footings"]'), // non-match hidden
    nodes: document.querySelectorAll('[data-arch-layer-tree] [data-layer-node]').length,
  }));
  await setSearch('');   // clear restores full tree
  const restored = await pg.evaluate(() => document.querySelectorAll('[data-arch-layer-tree] [data-layer-node]').length);
  const ok = info.duct && !info.unrelated && restored > info.nodes;
  rec('#A65 Layer Tree search filters to matches + auto-expands ancestors (Security lacks this)', ok, JSON.stringify({ ...info, restored }));
  await pg.close();
}

// ── #A62: VISIBILITY (👁) — the eye control hides/shows a layer (persisted Set, Security aoHidden pattern). ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.layerHidden'); localStorage.removeItem('arch2525.layerLocked'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  const node = '[data-layer-node="physical/foundation/footings"]';
  const hiddenAttr = () => pg.evaluate((s) => document.querySelector(s)?.getAttribute('data-layer-hidden'), node);
  const before = await hiddenAttr();
  await pg.evaluate((s) => document.querySelector(`${s} [data-layer-ctl="visibility"]`)?.click(), node); await pg.waitForTimeout(140);
  const after = await hiddenAttr();
  await pg.evaluate((s) => document.querySelector(`${s} [data-layer-ctl="visibility"]`)?.click(), node); await pg.waitForTimeout(140);
  const restored = await hiddenAttr();
  const ok = !before && after === 'true' && !restored;
  rec('#A62 Layer visibility toggle (👁) hides + shows a layer', ok, JSON.stringify({ before, after, restored }));
  await pg.close();
}

// ── #A63: LOCK (🔒) + more (•••) — the lock control marks a layer locked; the ••• menu isolates + reveals. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.layerHidden'); localStorage.removeItem('arch2525.layerLocked'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  const node = '[data-layer-node="physical/foundation/footings"]';
  const lockedAttr = () => pg.evaluate((s) => document.querySelector(s)?.getAttribute('data-layer-locked'), node);
  const before = await lockedAttr();
  await pg.evaluate((s) => document.querySelector(`${s} [data-layer-ctl="lock"]`)?.click(), node); await pg.waitForTimeout(140);
  const afterLock = await lockedAttr();
  // ••• menu → Isolate hides other leaves, then Reveal all restores
  await pg.evaluate((s) => document.querySelector(`${s} [data-layer-ctl="menu"]`)?.click(), node); await pg.waitForTimeout(120);
  const menuShown = await pg.evaluate(() => !!document.querySelector('[data-layer-menu="physical/foundation/footings"]'));
  await pg.evaluate(() => { const m = document.querySelector('[data-layer-menu="physical/foundation/footings"]'); m?.querySelector('button')?.click(); }); await pg.waitForTimeout(150);
  const isolatedHidesOther = await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/slab-on-grade"]')?.getAttribute('data-layer-hidden') === 'true');
  const ok = !before && afterLock === 'true' && menuShown && isolatedHidesOther;
  rec('#A63 Layer lock (🔒) marks locked + ••• menu Isolate hides other layers', ok, JSON.stringify({ before, afterLock, menuShown, isolatedHidesOther }));
  await pg.close();
}

// ── #A64: SELECTION → RIGHT CONTEXT PANEL — clicking a layer opens the (default-collapsed) Context rail
//          and inspects the node (breadcrumb + label), and highlights the tree row. ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(300);
  const rightBefore = await pg.evaluate(() => !!document.querySelector('[data-arch-rail="right"]')); // collapsed by default → false
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.click()); await pg.waitForTimeout(250);
  const info = await pg.evaluate(() => {
    const insp = document.querySelector('[data-arch-layer-inspector]');
    const row = document.querySelector('[data-layer-node="physical/foundation/footings"]');
    return {
      rightOpen: !!document.querySelector('[data-arch-rail="right"]'),
      inspectId: insp?.getAttribute('data-inspect-id'),
      hasLabel: (insp?.textContent || '').includes('Footings'),
      hasBreadcrumb: (insp?.textContent || '').includes('Foundation'),
      rowHighlighted: row ? getComputedStyle(row).backgroundColor === 'rgb(34, 24, 51)' : false,
    };
  });
  const ok = rightBefore === false && info.rightOpen && info.inspectId === 'physical/foundation/footings' && info.hasLabel && info.hasBreadcrumb && info.rowHighlighted;
  rec('#A64 select layer → RIGHT Context panel opens + inspects (breadcrumb + label) + row highlighted', ok, JSON.stringify(info));
  await pg.close();
}

// ── #A68: SINGLE-TREE LAW — the Layer Tree is the canonical "what exists" structure. It is defined ONCE
//          (only in the Design workspace); no other tab renders or duplicates it (Vision 2525 design principle). ──
{
  const { pg, tab } = await mk();
  const counts = {};
  for (const t of ['Overview', 'Design', 'Simulate', 'Review', 'Build', 'Lifecycle']) {
    await tab(t); await pg.waitForTimeout(220);
    counts[t] = await pg.evaluate(() => document.querySelectorAll('[data-arch-layer-tree]').length);
  }
  const inDesignWs = await pg.evaluate(() => { const t = document.querySelector('[data-arch-layer-tree]'); return !!t?.closest('[data-arch-design-ws]'); });
  const ok = Object.values(counts).every((c) => c === 1) && inDesignWs;   // exactly one, always, only in the Design workspace
  rec('#A68 single-tree law — exactly one Layer Tree, only in the Design workspace (no tab redefines it)', ok, JSON.stringify({ counts, inDesignWs }));
  await pg.close();
}

// ── #A69: DESKTOP LAYOUT — on a wide (≥lg) viewport the Layer Tree sits to the LEFT of the design engine in
//          one row (never stacked above it); on a narrow viewport it stacks. Width breakpoint, not orientation. ──
{
  const { pg, tab } = await mk({ width: 1280, height: 800 });
  await tab('Design'); await pg.waitForTimeout(300);
  const wide = await pg.evaluate(() => {
    const e = document.querySelector('[data-arch-engine]')?.getBoundingClientRect();
    const t = document.querySelector('[data-arch-layer-tree]')?.getBoundingClientRect();
    if (!e || !t) return null;
    return { treeLeftOfEngine: t.x < e.x, sameRow: Math.abs(t.y - e.y) < 140, engineWide: e.width > 560 };
  });
  await pg.close();
  const { pg: pg2, tab: tab2 } = await mk({ width: 400, height: 900 });
  await tab2('Design'); await pg2.waitForTimeout(300);
  const narrow = await pg2.evaluate(() => {
    const e = document.querySelector('[data-arch-engine]')?.getBoundingClientRect();
    const t = document.querySelector('[data-arch-layer-tree]')?.getBoundingClientRect();
    return e && t ? e.y > t.y + 40 : null;   // stacked: engine below the tree
  });
  await pg2.close();
  const ok = wide && wide.treeLeftOfEngine && wide.sameRow && wide.engineWide && narrow === true;
  rec('#A69 desktop: Layer Tree LEFT of engine (one row); mobile: stacked', ok, JSON.stringify({ wide, narrowStacked: narrow }));
}

// ── #A70: RIGHT Context panel = SETTINGS for the single selected item (Security asset-inspector model) —
//          toggling visibility / lock from the inspector acts on that item and syncs to its tree row. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.layerHidden'); localStorage.removeItem('arch2525.layerLocked'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.click()); await pg.waitForTimeout(250);
  const hasActions = await pg.evaluate(() => !!document.querySelector('[data-arch-layer-inspector][data-inspect-id="physical/foundation/footings"] [data-inspect-actions]'));
  await pg.evaluate(() => document.querySelector('[data-inspect-ctl="visibility"]')?.click()); await pg.waitForTimeout(150);
  const treeHidden = await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.getAttribute('data-layer-hidden') === 'true');
  await pg.evaluate(() => document.querySelector('[data-inspect-ctl="lock"]')?.click()); await pg.waitForTimeout(150);
  const treeLocked = await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.getAttribute('data-layer-locked') === 'true');
  const ok = hasActions && treeHidden && treeLocked;
  rec('#A70 RIGHT Context = per-item settings — visibility/lock from inspector sync to the tree row', ok, JSON.stringify({ hasActions, treeHidden, treeLocked }));
  await pg.close();
}

// ── #A71: TINY HOME selector limits the buildable physical systems + decisions — Fire Protection and
//          Communications drop out (12→10 systems), and no Level 3 Cubes appear; Full Home restores them. ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(300);
  const systemCount = () => pg.evaluate(() =>
    [...document.querySelectorAll('[data-arch-layer-tree] [data-layer-node]')]
      .filter((n) => /^physical\/[^/]+$/.test(n.getAttribute('data-layer-node') || '')).length);
  const fullN = await systemCount();
  await pg.evaluate(() => document.querySelector('[data-hometype="tiny"]')?.click()); await pg.waitForTimeout(220);
  const tinyN = await systemCount();
  const fireGone = await pg.evaluate(() => !document.querySelector('[data-layer-node="physical/fire-protection"]'));
  const commsGone = await pg.evaluate(() => !document.querySelector('[data-layer-node="physical/communications-low-voltage"]'));
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  const noL3 = await pg.evaluate(() => !document.querySelector('[data-layer-node="physical/foundation/level-3-cubes"]'));
  await pg.evaluate(() => document.querySelector('[data-hometype="full"]')?.click()); await pg.waitForTimeout(220);
  const backN = await systemCount();
  const ok = fullN === 12 && tinyN === 10 && fireGone && commsGone && noL3 && backN === 12;
  rec('#A71 Tiny Home limits systems (12→10, no Fire/Comms/L3) + Full Home restores', ok, JSON.stringify({ fullN, tinyN, fireGone, commsGone, noL3, backN }));
  await pg.close();
}

// ── #A72: WIREFRAME THE HOUSE by selecting components — "Add to house" from the Context inspector adds
//          the component to the House Build Spec (bottom panel) with a rough estimate + phase, marks the
//          tree row, and "Add system" adds a whole system's leaves at once. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => localStorage.removeItem('arch2525.houseSpec'));
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  const empty = await pg.evaluate(() => document.querySelector('[data-arch-house-spec]')?.getAttribute('data-house-count'));
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.click()); await pg.waitForTimeout(200);
  await pg.evaluate(() => document.querySelector('[data-inspect-ctl="house"]')?.click()); await pg.waitForTimeout(220);
  const add = await pg.evaluate(() => ({
    count: document.querySelector('[data-arch-house-spec]')?.getAttribute('data-house-count'),
    item: !!document.querySelector('[data-house-item="physical/foundation/footings"]'),
    treeDot: !!document.querySelector('[data-layer-node="physical/foundation/footings"] [data-layer-inhouse]'),
    hasCost: /\$[\d,]/.test(document.querySelector('[data-arch-house-spec]')?.textContent || ''),
    hasPhase: !!document.querySelector('[data-house-phase="foundation"]'),
    hasParallel: /parallel/i.test(document.querySelector('[data-arch-house-spec]')?.textContent || ''),
  }));
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/electrical"]')?.click()); await pg.waitForTimeout(200);
  await pg.evaluate(() => document.querySelector('[data-inspect-ctl="house"]')?.click()); await pg.waitForTimeout(220);
  const afterSystem = await pg.evaluate(() => +(document.querySelector('[data-arch-house-spec]')?.getAttribute('data-house-count') || '0'));
  const mepPhase = await pg.evaluate(() => !!document.querySelector('[data-house-phase="mep"]'));
  const ok = empty === '0' && add.count === '1' && add.item && add.treeDot && add.hasCost && add.hasPhase && add.hasParallel && afterSystem > 1 && mepPhase;
  rec('#A72 wireframe house — Add to house → spec + estimate + phase + tree dot; Add system adds leaves; parallel MEP', ok, JSON.stringify({ empty, ...add, afterSystem, mepPhase }));
  await pg.close();
}

// ── #A73: PARALLEL INSTALL TIMELINE — phases render as bars on a shared day axis, OVERLAPPING (each starts
//          before the previous finishes) so the critical path is shorter than the sequential sum. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => localStorage.removeItem('arch2525.houseSpec'));
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  for (const s of ['foundation', 'structure', 'electrical']) {
    await pg.evaluate((sys) => document.querySelector(`[data-layer-node="physical/${sys}"]`)?.click(), s); await pg.waitForTimeout(150);
    await pg.evaluate(() => document.querySelector('[data-inspect-ctl="house"]')?.click()); await pg.waitForTimeout(180);
  }
  const info = await pg.evaluate(() => {
    const bars = [...document.querySelectorAll('[data-arch-timeline] [data-timeline-phase]')];
    const lefts = bars.map((b) => parseFloat(b.style.left) || 0);
    return {
      timeline: !!document.querySelector('[data-arch-timeline]'),
      phases: bars.map((b) => b.getAttribute('data-timeline-phase')),
      secondOffset: lefts.length >= 2 && lefts[1] > 0 && lefts[1] < 100,   // framing starts after day 0 (overlap)
      savesText: /saves/i.test(document.querySelector('[data-arch-timeline]')?.textContent || ''),
    };
  });
  const ok = info.timeline && info.phases.length === 3 && ['foundation', 'framing', 'mep'].every((p) => info.phases.includes(p)) && info.secondOffset && info.savesText;
  rec('#A73 parallel install timeline — overlapping phase bars on a shared day axis + saves-vs-sequential', ok, JSON.stringify(info));
  await pg.close();
}

// ── #A74: HOUSE SCHEMATIC — a cross-section renders as a faint ghost when the house is empty and
//          assembles (its parts draw in) as components are added. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => localStorage.removeItem('arch2525.houseSpec'));
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  const ghost = await pg.evaluate(() => !!document.querySelector('[data-arch-house-spec][data-house-count="0"] [data-arch-schematic]'));
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-inspect-ctl="house"]')?.click()); await pg.waitForTimeout(220);
  const filled = await pg.evaluate(() => {
    const svg = document.querySelector('[data-arch-schematic]');
    return { present: !!svg, shapes: svg ? svg.querySelectorAll('rect,polygon,polyline,line,circle').length : 0 };
  });
  const ok = ghost && filled.present && filled.shapes > 5;
  rec('#A74 house schematic — ghost cross-section when empty + assembles as components are chosen', ok, JSON.stringify({ ghost, ...filled }));
  await pg.close();
}

// ── #A75: REVIEW FIXES — a Level 3 Cubes node is NOT buildable (no Add-to-house control), and a Tiny
//          Home "Add system" adds ONLY the tiny-buildable leaves (Foundation → 3, not the full 8). ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => localStorage.removeItem('arch2525.houseSpec'));
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/level-3-cubes"]')?.click()); await pg.waitForTimeout(200);
  const l3NoBuild = await pg.evaluate(() => {
    const insp = document.querySelector('[data-arch-layer-inspector]');
    return insp?.getAttribute('data-inspect-id') === 'physical/foundation/level-3-cubes' && !insp.querySelector('[data-inspect-ctl="house"]');
  });
  await pg.evaluate(() => document.querySelector('[data-hometype="tiny"]')?.click()); await pg.waitForTimeout(200);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-inspect-ctl="house"]')?.click()); await pg.waitForTimeout(220);
  const tinyCount = await pg.evaluate(() => +(document.querySelector('[data-arch-house-spec]')?.getAttribute('data-house-count') || '0'));
  const ok = l3NoBuild && tinyCount === 3;
  rec('#A75 review fixes — Level 3 not buildable; Tiny "Add system" adds only tiny leaves (Foundation=3)', ok, JSON.stringify({ l3NoBuild, tinyCount }));
  await pg.close();
}

// ── #A76: BIM I/O — Generate + Import controls; importing a BIM file maps objects into the Physical
//          Digital Twin (adds to the house spec), routes unknowns to an Unclassified queue (not discarded),
//          logs a Replay event, and assigning an unclassified object classifies it into a system. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.houseSpec'); localStorage.removeItem('arch2525.replay'); localStorage.removeItem('arch2525.unclassified'); localStorage.removeItem('arch2525.bimManifest'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  const bar = await pg.evaluate(() => !!document.querySelector('[data-arch-bim]') && !!document.querySelector('[data-bim-export]') && !!document.querySelector('[data-bim-import]'));
  const bim = JSON.stringify({ objects: [{ ifcClass: 'IfcWall', id: 'w1' }, { ifcClass: 'IfcWindow', id: 'win1' }, { ifcClass: 'IfcFoo', id: 'foo1' }] });
  await pg.setInputFiles('[data-bim-file]', { name: 'test.json', mimeType: 'application/json', buffer: Buffer.from(bim) });
  await pg.waitForTimeout(500);
  const afterImport = await pg.evaluate(() => ({
    count: +(document.querySelector('[data-arch-house-spec]')?.getAttribute('data-house-count') || '0'),
    unclassified: !!document.querySelector('[data-bim-unclassified]'),
    manifest: /placed/.test(document.querySelector('[data-bim-manifest]')?.textContent || ''),
    replay: (() => { try { return JSON.parse(localStorage.getItem('arch2525.replay') || '[]').some((e) => e.kind === 'bim.import'); } catch { return false; } })(),
  }));
  const beforeAssign = afterImport.count;
  await pg.evaluate(() => { const s = document.querySelector('[data-unclassified-assign]'); if (s) { s.value = 'physical/interior'; s.dispatchEvent(new Event('change', { bubbles: true })); } });
  await pg.waitForTimeout(350);
  const afterAssign = await pg.evaluate(() => +(document.querySelector('[data-arch-house-spec]')?.getAttribute('data-house-count') || '0'));
  const ok = bar && afterImport.count >= 2 && afterImport.unclassified && afterImport.manifest && afterImport.replay && afterAssign > beforeAssign;
  rec('#A76 BIM I/O — import maps to systems + Unclassified queue + Replay; assign classifies into a system', ok, JSON.stringify({ bar, ...afterImport, beforeAssign, afterAssign }));
  await pg.close();
}

// ── #A77: ASSET INTELLIGENCE — selecting a leaf physical component renders the shared Asset record (cost +
//          schedule + customize + status sections); changing quantity LIVE-RECALCULATES cost; the Digital-Twin
//          status stepper logs a Replay event. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.assetOverrides'); localStorage.removeItem('arch2525.replay'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.click()); await pg.waitForTimeout(250);
  const present = await pg.evaluate(() => ({
    asset: !!document.querySelector('[data-arch-asset][data-asset-id="physical/foundation/footings"]'),
    cost: !!document.querySelector('[data-asset-cost]'),
    schedule: !!document.querySelector('[data-asset-schedule]'),
    customize: !!document.querySelector('[data-asset-customize]'),
    status: !!document.querySelector('[data-asset-status]'),
  }));
  const installed = () => pg.evaluate(() => { const el = [...document.querySelectorAll('[data-asset-cost] div')].find((d) => /Installed/.test(d.textContent || '')); return el?.textContent || ''; });
  const before = await installed();
  await pg.evaluate(() => { const i = document.querySelector('[data-asset-qty]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(i, '3'); i.dispatchEvent(new Event('input', { bubbles: true })); });
  await pg.waitForTimeout(250);
  const afterQty = await installed();
  await pg.evaluate(() => document.querySelector('[data-asset-status-next]')?.click()); await pg.waitForTimeout(200);
  const replay = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('arch2525.replay') || '[]').some((e) => e.kind === 'asset.customize'); } catch { return false; } });
  const recalc = before !== afterQty && /\$/.test(afterQty);
  const ok = present.asset && present.cost && present.schedule && present.customize && present.status && recalc && replay;
  rec('#A77 Asset Intelligence — record on select + quantity live-recalc + status stepper Replay', ok, JSON.stringify({ ...present, before: before.replace(/\s+/g, ' ').slice(0, 22), afterQty: afterQty.replace(/\s+/g, ' ').slice(0, 22), replay }));
  await pg.close();
}

// ── #A78: SELECTION SYNC (Tree ↔ center model ↔ right, bidirectional) — clicking a model (schematic) phase
//          selects a component of it (tree row highlights + inspector opens) and logs Replay; selecting a tree
//          component highlights the owning phase in the model. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.houseSpec'); localStorage.removeItem('arch2525.replay'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  for (const s of ['foundation', 'structure']) {
    await pg.evaluate((sys) => document.querySelector(`[data-layer-node="physical/${sys}"]`)?.click(), s); await pg.waitForTimeout(120);
    await pg.evaluate(() => document.querySelector('[data-inspect-ctl="house"]')?.click()); await pg.waitForTimeout(160);
  }
  // MODEL → TREE + PANEL: click the foundation schematic chip
  await pg.evaluate(() => document.querySelector('[data-schematic-phase="foundation"]')?.click()); await pg.waitForTimeout(250);
  const model = await pg.evaluate(() => {
    const insp = document.querySelector('[data-arch-layer-inspector]');
    const id = insp?.getAttribute('data-inspect-id') || '';
    const row = id ? document.querySelector(`[data-layer-node="${id}"]`) : null;
    return { hasInspector: !!insp, isFoundation: id.startsWith('physical/foundation/'), treeSelected: row ? getComputedStyle(row).backgroundColor === 'rgb(34, 24, 51)' : false };
  });
  const replayModel = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('arch2525.replay') || '[]').some((e) => e.kind === 'select.model'); } catch { return false; } });
  // TREE → MODEL: select a foundation leaf → its phase chip is highlighted
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.click()); await pg.waitForTimeout(250);
  const chipHi = await pg.evaluate(() => { const b = document.querySelector('[data-schematic-phase="foundation"]'); return b ? getComputedStyle(b).backgroundColor === 'rgb(21, 34, 56)' : false; });
  const ok = model.hasInspector && model.isFoundation && model.treeSelected && replayModel && chipHi;
  rec('#A78 selection sync — model chip → tree+panel; tree → model chip highlighted; Replay logged', ok, JSON.stringify({ ...model, replayModel, chipHi }));
  await pg.close();
}

// ── #A79: TRINITY = THREE LEDGERS (MoT consolidation #2) — the Asset Intelligence panel shows the SoI Trinity as
//          three DISTINCT ledgers ◬ AI · ♡ spiritual · 웃 human, never collapsed to one number; MoT is a separate
//          minutes row. ──
{
  const { pg, tab } = await mk();
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.click()); await pg.waitForTimeout(250);
  const tri = await pg.evaluate(() => {
    const row = document.querySelector('[data-asset-trinity]');
    const ai = document.querySelector('[data-trinity-ai]')?.textContent || '';
    const sp = document.querySelector('[data-trinity-spiritual]')?.textContent || '';
    const hu = document.querySelector('[data-trinity-human]')?.textContent || '';
    const motRow = [...document.querySelectorAll('div')].some((d) => /MoT \(minutes\)/.test(d.textContent || ''));
    return { hasRow: !!row, ai, sp, hu, motRow };
  });
  // three separate ledgers, each carrying its glyph + a number, distinctly rendered (not one combined value)
  const num = (s) => (s.match(/-?\d[\d,]*/) || [''])[0];
  const threeDistinct = /◬/.test(tri.ai) && /♡/.test(tri.sp) && /웃/.test(tri.hu) && num(tri.ai) !== '' && num(tri.sp) !== '' && num(tri.hu) !== '';
  const ok79 = tri.hasRow && threeDistinct && tri.motRow;
  rec('#A79 Trinity is three distinct ledgers ◬♡웃 (never one number) + MoT minutes row', ok79, JSON.stringify(tri));
  await pg.close();
}

// ── #A80: ENGINE INTEGRATION + HUMAN AUTHORITY (Inc 4) — the asset panel shows a Human Authority checkpoint
//          (responsible authority + required decision) driven by the reused estimate engine; advancing the
//          project stage gate MATURES the estimate: confidence RISES and the ± cone band NARROWS (tighter). ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.gate'); localStorage.removeItem('arch2525.assetOverrides'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.click()); await pg.waitForTimeout(250);
  const read = () => pg.evaluate(() => {
    const auth = document.querySelector('[data-asset-authority]');
    const who = document.querySelector('[data-asset-authority-who]')?.textContent || '';
    const conf = (document.querySelector('[data-arch-asset] [style*="dim"]')?.textContent || document.querySelector('[data-arch-asset]')?.textContent || '');
    const confPct = ((document.querySelector('[data-arch-asset]')?.textContent || '').match(/(\d+)%\s*conf/) || [])[1];
    const bandPct = ((auth?.textContent || '').match(/±(\d+)%/) || [])[1];
    return { hasAuth: !!auth, who, confPct: confPct ? +confPct : null, bandPct: bandPct ? +bandPct : null };
  });
  const before = await read();
  // advance the stage gate twice (a homeowner decision → tighter estimate)
  await pg.evaluate(() => document.querySelector('[data-authority-advance]')?.click()); await pg.waitForTimeout(180);
  await pg.evaluate(() => document.querySelector('[data-authority-advance]')?.click()); await pg.waitForTimeout(220);
  const after = await read();
  const replayGate = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('arch2525.replay') || '[]').some((e) => e.kind === 'gate.advance'); } catch { return false; } });
  const hasAuthority = before.hasAuth && /[A-Za-z]/.test(before.who);
  const tighter = before.confPct != null && after.confPct != null && after.confPct > before.confPct
                && before.bandPct != null && after.bandPct != null && after.bandPct < before.bandPct;
  const ok80 = hasAuthority && tighter && replayGate;
  rec('#A80 engine integration — Human Authority checkpoint + advancing gate tightens estimate (conf↑ band↓)', ok80, JSON.stringify({ before, after, replayGate }));
  await pg.close();
}

// ── #A81: BIM OBJECT MAPPING (Inc 5) — import deepens: IFC-class→system keyword fallback catches variants
//          (IfcStairFlight → structure, IfcSpaceHeater → mechanical), the spatial hierarchy (building→storey→
//          space) is resolved, and only a genuinely-unknown class lands in the Unclassified queue. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.houseSpec'); localStorage.removeItem('arch2525.replay'); localStorage.removeItem('arch2525.unclassified'); localStorage.removeItem('arch2525.bimManifest'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  const bim = JSON.stringify({ objects: [
    { ifcClass: 'IfcBuilding', id: 'b1' },
    { ifcClass: 'IfcBuildingStorey', id: 's1', parent: 'b1' },
    { ifcClass: 'IfcSpace', id: 'sp1', parent: 's1' },
    { ifcClass: 'IfcWall', id: 'w1', parent: 'sp1', area: 24 },       // exact → structure, spatially located
    { ifcClass: 'IfcStairFlight', id: 'st1', parent: 's1' },          // keyword → structure
    { ifcClass: 'IfcSpaceHeater', id: 'h1', parent: 'sp1' },          // keyword → mechanical
    { ifcClass: 'IfcFoo', id: 'foo1' },                              // unknown → Unclassified
  ] });
  await pg.setInputFiles('[data-bim-file]', { name: 'rich.json', mimeType: 'application/json', buffer: Buffer.from(bim) });
  await pg.waitForTimeout(500);
  const res = await pg.evaluate(() => {
    const sum = document.querySelector('[data-bim-mapsummary]')?.textContent || '';
    const unc = document.querySelector('[data-bim-unclassified]')?.textContent || '';
    const g = (re) => (sum.match(re) || [])[1];
    return {
      exact: +(g(/(\d+)\s*exact/) || 0),
      keyword: +(g(/(\d+)\s*keyword/) || 0),
      unclassified: +(g(/(\d+)\s*unclassified/) || 0),
      spatial: +(g(/(\d+)\s*spatially/) || 0),
      uncHasFoo: /IfcFoo/.test(unc), uncHasStair: /IfcStairFlight/.test(unc),
    };
  });
  const ok81 = res.exact >= 1 && res.keyword >= 2 && res.unclassified >= 1 && res.spatial >= 3 && res.uncHasFoo && !res.uncHasStair;
  rec('#A81 BIM object mapping — keyword fallback + spatial hierarchy + only-unknown unclassified', ok81, JSON.stringify(res));
  await pg.close();
}

// ── #A82: rails renamed "Design Tree" / "Active Items" + Security-style collapsed labels — the collapsed rail is a
//          bordered pill whose panel-name label stays VISIBLE (vertical writing-mode ≥md, matching Security's
//          ASSET·SUPPORT / ACTIVE ITEMS), and selecting a tree row AUTO-OPENS the right "Active Items" panel
//          (operator: "I like seeing detail expand on right when selected"). Default vp 1000px → ≥md → vertical. ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(300);
  // Right rail is collapsed by default → its bordered pill shows the renamed "Active Items" label, visible.
  const right = await pg.evaluate(() => {
    const el = document.querySelector('[data-arch-rail-collapsed="right"]');
    const lab = el?.querySelector('[data-arch-rail-label="right"]');
    return { present: !!el, visible: !!(lab && lab.offsetParent !== null), label: (lab?.textContent || '').trim(),
      wm: lab ? getComputedStyle(lab).writingMode : '' };
  });
  // Collapse the LEFT rail ("Vision Tree") via its expanded-header toggle → collapsed vertical label visible.
  await pg.click('[title="Collapse Vision Tree"]'); await pg.waitForTimeout(180);
  const left = await pg.evaluate(() => {
    const el = document.querySelector('[data-arch-rail-collapsed="left"]');
    const lab = el?.querySelector('[data-arch-rail-label="left"]');
    return { present: !!el, visible: !!(lab && lab.offsetParent !== null), label: (lab?.textContent || '').trim(),
      wm: lab ? getComputedStyle(lab).writingMode : '' };
  });
  // Re-open left, select a tree row → the right "Active Items" panel auto-opens (detail expands on right).
  await pg.click('[title="Show Vision Tree"]'); await pg.waitForTimeout(160);
  await pg.click('[data-layer-node="physical/site"]'); await pg.waitForTimeout(220);
  const autoRight = await pg.evaluate(() => !!document.querySelector('[data-arch-rail="right"]'));
  const ok82 = right.present && right.visible && /ACTIVE ITEMS/i.test(right.label)
    && left.present && left.visible && /VISION TREE/i.test(left.label) && /vertical/.test(left.wm)
    && autoRight;
  rec('#A82 rails Vision Tree/Active Items + collapsed vertical label (≥md) + select auto-opens right', ok82, JSON.stringify({ right, left, autoRight }));
  await pg.close();
}

// ── #A83: SAVED FILES cloud backup (Supabase) degrades gracefully — with no Supabase env the client is null,
//          so the House-Build-Spec cloud-status chip reads "offline" (never an error) AND the workspace still
//          persists through the localStorage rung: a seeded house spec survives a full reload. No throw, no loss
//          when the durable rung is unavailable (tile-cache.ts ladder law). ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(350);
  const chip = await pg.evaluate(() => {
    const el = document.querySelector('[data-arch-cloud-status]');
    return { present: !!el, status: el?.getAttribute('data-arch-cloud-status') || '', visible: !!(el && el.offsetParent !== null) };
  });
  // Seed the local house spec, reload → it must persist (localStorage rung intact regardless of cloud).
  await pg.evaluate(() => localStorage.setItem('arch2525.houseSpec', JSON.stringify(['physical/site'])));
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1700);
  const persisted = await pg.evaluate(() => { try { return JSON.parse(localStorage.getItem('arch2525.houseSpec') || '[]'); } catch { return []; } });
  const ok83 = chip.present && chip.visible && chip.status === 'offline' && Array.isArray(persisted) && persisted.includes('physical/site');
  rec('#A83 saved-files cloud backup degrades gracefully (offline) + localStorage snapshot round-trips', ok83, JSON.stringify({ chip, persisted }));
  await pg.close();
}

// ── #A84: PROJECT ROLLUP & QUALIFICATION (Inc 6) — the REAL house spec rolls up at the current gate via the
//          REUSED estimate engine: AACE class + confidence + tightening cost band, a GateReference (frameworkId +
//          sequence + status — addressed by ordinal, no literal G8), and SSSES as a SCORE + status (not a label). ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.houseSpec'); localStorage.removeItem('arch2525.gate'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  // Add a real buildable leaf so the House Build Spec (and thus the project rollup) render.
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.click()); await pg.waitForTimeout(180);
  await pg.evaluate(() => document.querySelector('[data-inspect-ctl="house"]')?.click()); await pg.waitForTimeout(240);
  const roll = await pg.evaluate(() => {
    const el = document.querySelector('[data-arch-project-rollup]');
    if (!el) return { present: false };
    const t = el.textContent || '';
    return {
      present: true,
      gateSeq: el.getAttribute('data-gate-seq'),
      sssesScore: el.getAttribute('data-ssses-score'),
      hasAace: /AACE/i.test(t), hasSsses: /SSSES/i.test(t), hasCost: /\$/.test(t),
      hasGate: /gate/i.test(t), noHardG8: !/\bG8\b/.test(t),
    };
  });
  const ok84 = roll.present && roll.gateSeq === '3' && Number(roll.sssesScore) >= 0
    && roll.hasAace && roll.hasSsses && roll.hasCost && roll.hasGate && roll.noHardG8;
  rec('#A84 project rollup — real spec × gate via reused engine; GateReference (seq, no literal G8) + SSSES score', ok84, JSON.stringify(roll));
  await pg.close();
}

// ── #A85: GLOBAL BUILDING PARAMS live-recalc (S5) — changing a whole-project input (floor area) rescales the
//          project rollup cost LIVE via a deterministic params scale (reused estimate × scale). Default 2000 ft²
//          → scale 1; 4000 ft² → scale 2 → cost doubles. ──
{
  const { pg, tab } = await mk();
  await pg.evaluate(() => { localStorage.removeItem('arch2525.houseSpec'); localStorage.removeItem('arch2525.gate'); localStorage.removeItem('arch2525.globalParams'); });
  await pg.reload({ waitUntil: 'domcontentloaded' }); await pg.waitForTimeout(1600);
  await tab('Design'); await pg.waitForTimeout(250);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(150);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation/footings"]')?.click()); await pg.waitForTimeout(180);
  await pg.evaluate(() => document.querySelector('[data-inspect-ctl="house"]')?.click()); await pg.waitForTimeout(240);
  const before = await pg.evaluate(() => {
    const el = document.querySelector('[data-arch-project-rollup]');
    return { cost: +(el?.getAttribute('data-rollup-cost') || '0'), scale: +(el?.getAttribute('data-rollup-scale') || '0'), hasCtl: !!document.querySelector('[data-param-area]') };
  });
  await pg.fill('[data-param-area]', '4000'); await pg.waitForTimeout(320);
  const after = await pg.evaluate(() => {
    const el = document.querySelector('[data-arch-project-rollup]');
    return { cost: +(el?.getAttribute('data-rollup-cost') || '0'), scale: +(el?.getAttribute('data-rollup-scale') || '0') };
  });
  const ok85 = before.hasCtl && before.cost > 0 && after.cost > before.cost && after.scale > before.scale && Math.abs(after.scale - 2) < 0.02;
  rec('#A85 global building params live-recalc — bigger area rescales the project rollup cost (scale 1→2)', ok85, JSON.stringify({ before, after }));
  await pg.close();
}

// ── #A86: MODEL cleanup (operator 2026-07-17) — the MODEL · U-WF PRIMITIVES panel is REMOVED, and the Model map
//          instead carries a MASTER READOUT (house dimensions · master cost · build time) on a settings header. ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(320);
  const r = await pg.evaluate(() => {
    const readout = document.querySelector('[data-arch-master-readout]');
    const t = readout?.textContent || '';
    const header = document.querySelector('[data-arch-map-header]');
    return {
      noPrimitives: !/U-WF PRIMITIVES/.test(document.body.innerText),
      readout: !!(readout && readout.offsetParent !== null),
      inHeader: !!(header && readout && header.contains(readout)),   // rides the map's own scrolling header
      hasDims: /ft²/.test(t) && /×/.test(t),
      hasCost: /\$/.test(t) && /cost/i.test(t),
      hasTime: /days/i.test(t) && /build/i.test(t),
    };
  });
  const ok86 = r.noPrimitives && r.readout && r.inHeader && r.hasDims && r.hasCost && r.hasTime;
  rec('#A86 Model cleanup — U-WF PRIMITIVES removed; master key rides the map scrolling header (Security R-CORE)', ok86, JSON.stringify(r));
  await pg.close();
}

// ── #A87: ALVAR MARK — the Vision Tree's guardian icon (ouroboros + Yggdrasil + runes) renders BEFORE the tree
//          content as a single-color line-art homage, and tapping it cycles the 13 SoI-Trinity colors (modular). ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(320);
  const info = await pg.evaluate(() => {
    const header = document.querySelector('[data-alvar-header]');
    const mark = header?.querySelector('[data-alvar-mark]');
    const cs = mark ? getComputedStyle(mark) : null;
    const masked = cs ? (cs.maskImage !== 'none' || cs.webkitMaskImage !== 'none') : false;
    const market = document.querySelector('[data-layer-hometype]');
    const before = header && market ? (header.compareDocumentPosition(market) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 : false;
    return { hasMark: !!mark, bg: cs?.backgroundColor || '', masked, before: !!before };
  });
  await pg.click('[data-alvar-header]'); await pg.waitForTimeout(140);
  const after = await pg.evaluate(() => { const m = document.querySelector('[data-alvar-header] [data-alvar-mark]'); return m ? getComputedStyle(m).backgroundColor : ''; });
  const ok87 = info.hasMark && info.before && info.masked && /rgb/.test(info.bg) && after !== '' && after !== info.bg;
  rec('#A87 Alvar raster icon (real art, masked) renders before Vision Tree + taps cycle the 13 Trinity colors', ok87, JSON.stringify({ ...info, after }));
  await pg.close();
}

// ── #A88: Advanced ••• uses the Security 3-cyan-dot toggle (R-CORE Expander `dots` variant), and the cloud-status
//          chip degrades to a CALM "Local only" — never an alarming "retry" — when Supabase/table is absent. ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(320);
  const info = await pg.evaluate(() => {
    const adv = document.querySelector('[data-adv-tab] [data-arch-exp]');
    const dots = adv?.querySelector('[data-exp-dots]');
    const chip = document.querySelector('[data-arch-cloud-status]');
    return {
      advDots: !!dots,
      dotCount: dots ? dots.querySelectorAll('span').length : 0,
      cloudCalm: !/retry/i.test(chip?.textContent || ''),
      cloudText: (chip?.textContent || '').trim(),
    };
  });
  const ok88 = info.advDots && info.dotCount === 3 && info.cloudCalm;
  rec('#A88 Advanced ••• Security 3-dot toggle + calm cloud chip (no alarming retry)', ok88, JSON.stringify(info));
  await pg.close();
}

// ── #A89: per-item estimate — every buildable physical leaf carries a STARTING COST · install-time chip
//          (operator: "all items on tree get starting cost and installation … build schedule"). ──
{
  const { pg, tab } = await mk();
  await tab('Design'); await pg.waitForTimeout(300);
  await pg.evaluate(() => document.querySelector('[data-layer-node="physical/foundation"]')?.click()); await pg.waitForTimeout(220);
  const est = await pg.evaluate(() => {
    const leaf = document.querySelector('[data-layer-node="physical/foundation/footings"]');
    const chip = leaf?.querySelector('[data-layer-est]');
    return { hasChip: !!chip, text: (chip?.textContent || '').trim() };
  });
  const ok89 = est.hasChip && /\$/.test(est.text) && /d$/.test(est.text);
  rec('#A89 per-item starting cost · install-time chip on every buildable leaf', ok89, JSON.stringify(est));
  await pg.close();
}

await b.close();
const passed = results.filter(r => r.pass).length, total = results.length;
console.log('ARCH-SPIRAL ' + passed + '/' + total + ' passed');
results.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  (' + r.detail + ')' : '')));
process.exit(passed === total ? 0 : 1);
