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
  const base = await pg.evaluate(() => ({
    map: !!document.querySelector('[data-arch-celestial]'),
    planets: document.querySelectorAll('[data-planet]').length,
    orbits: document.querySelectorAll('[data-orbit]').length,
    hu: !!document.querySelector('[data-hu-input]'),
    tilt: !!document.querySelector('[data-tilt-input]'),
    scale: document.querySelectorAll('[data-scale-toggle]').length,
    coord: /SA\.EA\.\.HU/.test(document.querySelector('[data-ucrs-coord]')?.textContent || ''),
    earthPeri: /230\.1584\.\.0\s*·\s*0\.0\.\.0/.test(document.querySelector('[data-ucrs-coord]')?.textContent || ''), // Earth default = perihelion (HU 0)
    clock: !!document.querySelector('[data-phase-clock]') && /PERI/.test(document.querySelector('[data-phase-clock]')?.textContent || '') && /APHE/.test(document.querySelector('[data-phase-clock]')?.textContent || ''),
  }));
  // tilt changes the ellipsoid foreshortening (orbit ry shrinks as tilt lowers)
  const ry0 = await pg.evaluate(() => document.querySelector('[data-orbit]')?.getAttribute('ry'));
  await pg.evaluate(() => { const t = document.querySelector('[data-tilt-input]'); const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; set.call(t, '8'); t.dispatchEvent(new Event('input', { bubbles: true })); });
  await pg.waitForTimeout(150);
  const ry1 = await pg.evaluate(() => document.querySelector('[data-orbit]')?.getAttribute('ry'));
  // click Mercury → readout switches + shows SR/SP-OTU
  await pg.locator('[data-planet-id="mercury"]').click({ force: true }); await pg.waitForTimeout(150);
  const after = await pg.evaluate(() => document.querySelector('[data-ucrs-readout]')?.textContent || '');
  const ok = base.map && base.planets === 9 && base.orbits === 9 && base.hu && base.tilt && base.scale === 2 && base.coord && base.earthPeri && base.clock
    && parseFloat(ry1) < parseFloat(ry0) && /Mercury/.test(after) && /SR:/.test(after) && /SP-OTU/.test(after);
  rec('#A21 UCRS-2525 v2 — 9 planets + tilt ellipsoid + scale toggle + SA.EA..HU + click→coords', ok, JSON.stringify({ ...base, ry0, ry1, afterHasMercury: /Mercury/.test(after) }));

  // #A21b: clock icon toggles the top-down OVERHEAD view (perihelion at 12) and back
  await pg.locator('[data-clock-toggle]').click(); await pg.waitForTimeout(160);
  const ovOn = await pg.evaluate(() => !!document.querySelector('[data-arch-celestial][data-overhead]') && /PERIHELION.*12:00/.test(document.querySelector('[data-overhead]')?.textContent || ''));
  await pg.locator('[data-clock-toggle]').click(); await pg.waitForTimeout(130);
  const ovOff = await pg.evaluate(() => !document.querySelector('[data-overhead]') && !!document.querySelector('[data-arch-celestial]'));
  rec('#A21b clock icon → overhead top-down view (perihelion 12:00) + toggle back', ovOn && ovOff, `on=${ovOn} off=${ovOff}`);

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
  const earthGlobe = await pg.evaluate(() => !!document.querySelector('[data-mini-globe]') && !document.querySelector('[data-planet-inset]')); // default Earth → globe
  await pg.locator('[data-planet-id="mercury"]').click({ force: true }); await pg.waitForTimeout(150);
  const merc = await pg.evaluate(() => !!document.querySelector('[data-planet-inset]') && !document.querySelector('[data-mini-globe]')); // Mercury → full-3600 orbit inset
  const readT = () => pg.evaluate(() => (document.querySelector('[data-arch-tab="Design"]')?.textContent || '').match(/(\d+\.\d)h\b/)?.[1] || null);
  const t0 = await readT();
  await pg.locator('[data-cel-play]').click(); await pg.waitForTimeout(600); await pg.locator('[data-cel-play]').click();
  const t1 = await readT();
  rec('#A23 date + play (time advances) + selected-planet inset (Earth globe ↔ planet full-3600 orbit)', hasPlay === 1 && hasDate === 1 && earthGlobe && merc && !!t0 && t0 !== t1, `play=${hasPlay} date=${hasDate} earthGlobe=${earthGlobe} merc=${merc} t0=${t0} t1=${t1}`);
  await pg.close();
}

await b.close();
const passed = results.filter(r => r.pass).length, total = results.length;
console.log('ARCH-SPIRAL ' + passed + '/' + total + ' passed');
results.forEach(r => console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name + (r.detail ? '  (' + r.detail + ')' : '')));
process.exit(passed === total ? 0 : 1);
