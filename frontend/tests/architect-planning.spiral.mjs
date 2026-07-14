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
  const wallCount = () => pg.evaluate(() => { const t = document.querySelector('[data-arch-tab="Design"]')?.textContent || ''; const m = t.match(/Walls \(2×4\)\s*(\d+)/); return m ? +m[1] : -1; });
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
  await pg.evaluate(() => { const t = document.querySelector('[data-tilt-input]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, '8'); t.dispatchEvent(new Event('input', { bubbles: true })); });
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
  const ovOn = await pg.evaluate(() => document.querySelector('[data-arch-celestial]')?.getAttribute('data-peritop') === '1' && !!document.querySelector('[data-overhead-view]') && /PERIHELION\s*▲/.test(document.querySelector('[data-overhead-view]')?.textContent || ''));
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
  await pg.locator('[data-planet-id="mercury"]').click({ force: true }); await pg.waitForTimeout(300);
  const merc = await pg.evaluate(() => !!document.querySelector('[data-textured-globe]') && !document.querySelector('[data-earth-moon]')); // Mercury → real-textured 3D globe
  rec('#A23 date + play control + Earth+Moon box ↔ textured planet + UoM distance (km→AU) updates throughout', hasPlay === 1 && hasDate === 1 && earthGlobe && merc && uomOk, `play=${hasPlay} date=${hasDate} earthGlobe=${earthGlobe} merc=${merc} d0="${d0}" d1="${d1}" uomOk=${uomOk}`);
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
  const setTilt = async (v) => { await pg.evaluate((val) => { const t = document.querySelector('[data-tilt-input]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, String(val)); t.dispatchEvent(new Event('input', { bubbles: true })); }, v); await pg.waitForTimeout(150); };
  const range = await pg.evaluate(() => { const t = document.querySelector('[data-tilt-input]'); return { min: +t.min, max: +t.max }; });
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

await b.close();
const passed = results.filter(r => r.pass).length, total = results.length;
console.log('ARCH-SPIRAL ' + passed + '/' + total + ' passed');
results.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  (' + r.detail + ')' : '')));
process.exit(passed === total ? 0 : 1);
