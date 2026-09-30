// financial-surface — the Financial-2525 screen is wired the way the laws say (operator 2026-09-30, v.000_r.005).
// Source-level gate over the two route pages, the component and the launcher: the route mounts one component; the
// component reads the generated domain, ticks one clock, feeds every number through the pure libraries, converts time
// from the Admin panel's Planet LTU table (the selected planet's whole, day, hours, minutes, anchor), gates recording
// behind the app's login, draws the chart as strokes on the black ground with the MoT ⇄ Clock icon toggle as the card's
// one reveal, carries the R-CORE badge last, and the export (when out/ exists) emits both routes. The pure laws
// themselves are gated in financial-mot / financial-accrual / planet-ltu.
import fs from 'node:fs';
import path from 'node:path';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const read = (p) => fs.readFileSync(p, 'utf8');
const strip = (s) => s.replace(/\/\/[^\n]*\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '').trim();

// 1 — two routes, one component, identical bodies (the Drone-2525 route pattern)
const ROUTES = ['app/main/Financial-2525/page.tsx', 'app/financial-2525/page.tsx'];
const bodies = ROUTES.map((r) => { const s = read(r); ok(/^"use client";/.test(s), `${r} is a client page`); ok(/import \{ FinancialCommandUX1 \} from "@\/components\/financial-2525\/command-ux1"/.test(s) && /<FinancialCommandUX1 \/>/.test(s), `${r} mounts the one component`); return strip(s); });
ok(bodies[0] === bodies[1], 'both route bodies are identical once comments are stripped');

// 2 — the component
const ux = read('components/financial-2525/command-ux1.tsx');
ok(/data-financial-ux1/.test(ux), 'the root carries data-financial-ux1 (the live probe hook)');
ok(/from "@\/lib\/financial-2525\/domain\.gen"/.test(ux) && !/docs\/financial-2525/.test(ux), 'reads the generated domain, never docs/');
ok(/setInterval\(\(\) => setNow\(Date\.now\(\)\), 1000\)/.test(ux) && /useState<number \| null>\(null\)/.test(ux), 'one 1 Hz clock, null until mounted (no hydration mismatch)');
ok(!/Math\.random/.test(ux), 'nothing random on the surface');
for (const fn of ['balanceAt', 'series', 'validateWithdrawal', 'HOLD_MS']) ok(new RegExp(`\\b${fn}\\b`).test(ux), `every number goes through the pure accrual law (${fn})`);
for (const fn of ['spanABC', 'fmtMot', 'fmtStampCST', 'parseStampCST']) ok(new RegExp(`\\b${fn}\\b`).test(ux), `MoT in A.B..C and CST stamps come from lib/financial-2525/mot (${fn})`);
ok(/showAbc \? fmtMot\(positionInYear\(from \+ f \* len, planet\.yearAnchor\)\.abc\)/.test(ux) && /spanABC\(elapsed \/ dayMs, planet\.yearDays\)/.test(ux) && !/\bmotABC\(/.test(ux) && !/MS_PER_DAY/.test(ux), "A.B..C IS the revolution (addenda 10–12): the reveal reads the year position at each axis mark on the planet's anchor and the elapsed span in A-units of the planet's whole — never a period as its own 0→3600, never an Earth constant typed on the surface");
ok(/positionInYear\(now, planet\.yearAnchor\)/.test(ux) && /frameOf\(now, 33, planet\.yearAnchor\)/.test(ux) && /data-fin-past-full/.test(ux), "the year position (on the table's anchor) and the 33-day frame are shown; a year past day 365 carries its flag");
// r.005 — the Planet LTU table (Admin panel) drives every conversion; the planet selector; the MoT ⇄ Clock icon toggle is the card's one state
ok(/readPlanetLtu\(\)/.test(ux) && /PLANET_LTU_KEYS\.includes\(e\.key\)/.test(ux) && /planetRow\(planets, planetCode\)/.test(ux) && /daySecOf\(planet\) \* 1000/.test(ux), "every conversion reads the selected planet's row from the Admin panel's LTU table (seed on the server, the device copy after mount, other tabs via storage)");
ok(/useState<PlanetLtuRow\[\]>\(\(\) => \[\.\.\.PLANET_LTU_SEED\]\)/.test(ux) && /setPlanets\(readPlanetLtu\(\)\)/.test(ux), 'the first paint is the seed, the device copy arrives after mount (never a hydration mismatch)');
ok(/data-fin-planet/.test(ux) && /planets\.map\(\(p\) => <option key=\{p\.code\} value=\{p\.code\}>\{p\.name\}<\/option>\)/.test(ux), "a planet selector lists the table's rows (Earth default · Mars)");
ok(/import \{ Clock, Orbit \} from "lucide-react"/.test(ux) && /role="group" data-fin-abc-toggle/.test(ux) && /aria-pressed=\{showAbc\} aria-label=\{t\("fin\.show_abc"\)\}/.test(ux) && /aria-pressed=\{!showAbc\} aria-label=\{t\("fin\.show_ltu"\)\}/.test(ux) && /<Orbit size=\{16\} strokeWidth=\{1\.5\} aria-hidden \/>/.test(ux) && /<Clock size=\{16\} strokeWidth=\{1\.5\} aria-hidden \/>/.test(ux), 'the reveal is a MoT-icon ⇄ Clock-icon toggle (addendum 13): two stroke icons, aria-pressed, the existing keys as their names');
ok(/ring-1 ring-inset ring-cyan-500/.test(ux) && !/bg-cyan-500\/15/.test(ux), 'the pressed icon is ringed, never filled (the vector law)');
ok(!/function MotChart[\s\S]*useState\(/.test(ux) && /const \[showAbc, setShowAbc\] = useState\(false\);/.test(ux) && /showAbc=\{showAbc\} onToggle=\{setShowAbc\}/.test(ux) && /\{showAbc \? `[^`]*fin\.a_units[^`]*` : ""\}/.test(ux) && /\{showAbc \? fmtMot\(year\.abc\) : /.test(ux), "ONE toggle state for the whole card: the chart, its header, the clock ladder's A-units line and the year line follow it");
ok(/planet\.code !== "earth" && <p[^>]*>\{t\("fin\.anchor_note"\)\}<\/p>/.test(ux), 'on a planet without a perihelion table the year line says so (declared, not sourced)');
// r.006 — every transaction carries its personal-finance category (addendum 16); the budget is a table with a unit toggle (addendum 17)
ok(/<select data-fin-category=\{hook\}/.test(ux) && /TRANSACTION_CATEGORIES\.map\(\(g\) => \(/.test(ux) && /<optgroup key=\{g\.kind\} label=\{t\(`fin\.\$\{g\.kind\}`\)\}>/.test(ux) && /hook="deposit"/.test(ux) && /hook="withdrawal"/.test(ux), "both forms carry the category dropdown, grouped Income · Fixed · Variable from the budget law");
ok(/memo: dMemo\.trim\(\) \|\| undefined, category: dCat \}/.test(ux) && /atMs: when, category: wCat \}/.test(ux) && /d\.category \? ` · \$\{catLabel\(d\.category\)\}` : ""/.test(ux) && /e\.tx\.category \? ` · \$\{catLabel\(e\.tx\.category\)\}` : ""/.test(ux), "the category is recorded on the entry and shown on the roster and the record");
ok(/role="group" data-fin-budget-unit/.test(ux) && /<table className="mt-2 w-full font-mono text-xs">/.test(ux) && /data-fin-budget-row=\{l\.id\}/.test(ux) && /data-fin-budget-net/.test(ux), "the budget is a table (category · kind · one figure) under a unit toggle");
ok(/\{ key: "min", label: t\("fin\.per_min"\)/.test(ux) && /\{ key: "day", label: t\("fin\.per_day"\)/.test(ux) && /\{ key: "week", label: t\("fin\.per_week"\)/.test(ux) && /\{ key: "month", label: `\$\{t\("fin\.per_month"\)\} \(\$\{LTU\.M\}\)`/.test(ux) && /\{ key: "year", label: t\("fin\.per_year"\)/.test(ux) && /useState<BudgetUnit>\("m33"\)/.test(ux), "every view is possible — $/s · $/min · $/h · day · week · 33 days · month (from the LTU table) · year — the sheet month by default");
ok(/const LTU = ltuDays\(planet\);/.test(ux) && /days: 1 \/ \(planet\.hoursPerDay \* planet\.minPerHour\)/.test(ux), "the units come from the selected planet\x27s LTU row, never typed");
ok(!/Supabase/.test(ux) && !/Supabase/.test(fs.readFileSync("lib/lexicon-data.ts", "utf8").match(/key: "fin\.device_only"[^\n]*/)[0]), "the record sentence names no vendor (the signer-voice law)");
ok(/append\(record, tx, at\)/.test(ux) && /loadRecord\(owner\)/.test(ux) && /saveRecord\(next\)/.test(ux), 'the record is appended, loaded and saved through lib/financial-2525/record');
ok(/summarize\(SHEET_BUDGET, SHEET_MONTH_DAYS\)/.test(ux), 'the budget ladder comes from lib/financial-2525/budget');
ok(/useAuth0\(\)/.test(ux) && /loginWithRedirect\(\{ appState: \{ returnTo: /.test(ux) && /user\?\.sub/.test(ux), 'each user their own login: Auth0 gates recording, keys the record, and returns the person HERE after login');
ok(/\{owner \? \(/.test(ux) && /data-fin-forms/.test(ux), 'the deposit / withdrawal forms render only for a signed-in person');
// r.002 — the surface STARTS FROM the ◬ ♡ 웃 Session shell (operator addendum 7): its root, header, rail, guide, roster, clock, strip, Trinity
ok(/className="mx-auto max-w-3xl px-4 py-10"/.test(ux) && /<SoiGlobe \/>/.test(ux) && /<TrinityGlyphs size="text-3xl"/.test(ux), 'the Session root and header: the globe and the Trinity glyphs');
ok(/<PodPhaseRail phase=\{phase\} phases=\{FIN_PHASES\} countFor=\{countFor\}/.test(ux) && /<PodRosterList rows=\{rosterRows\}/.test(ux), 'the Session rail (five financial phases) and roster, reused not redrawn');
ok(/data-testid="fin-your-turn" data-state=\{guide\.state\}/.test(ux) && /font-mono text-2xl tabular-nums text-cyan-500/.test(ux) && /data-testid="fin-strip"/.test(ux) && /<SoITrinity /.test(ux), 'the guide card, the ACTIVE clock block, the phone strip and the folded Trinity carry the Session\'s classes');
ok(/const CARD = "mt-8 rounded-xl border border-border bg-card p-5"/.test(ux) && !/VECTOR_LAW\.ground/.test(ux), 'the chrome is the app theme card (bg-card), not a fresh black console');
ok(/<SoITrinity labels=\{\[t\("fin\.wheel\.hi"\), t\("fin\.wheel\.si"\), t\("fin\.wheel\.ai"\)\]\} centerGlyphs=\{\["웃", "♡", "◬"\]\}/.test(ux), 'the Trinity wheel seats the operator\'s way: TOP HI 웃 · BOTTOM-RIGHT SI ♡ minutes · BOTTOM-LEFT AI ◬ tokens (addendum 9; SoITrinity tuple = [top, bottom-right, bottom-left])');
ok(/showAbc \? fmtMot\(positionInYear\(from \+ f \* len, planet\.yearAnchor\)\.abc\) : ltuLabel\(f \* len, len, planet\)/.test(ux) && /useState\(false\)/.test(ux), "the chart glass defaults to the planet's day · hour · minute; A.B..C (the revolution's coordinate) is a reveal (addenda 8 + 10 + 12)");
ok(/data-fin-signin/.test(ux) && /fin\.example_badge/.test(ux), 'an unsigned visitor sees the example badge and a sign-in');
ok(/const EXAMPLE: FinTx = \{[\s\S]*?SRC\.example\.amountUsd[\s\S]*?SRC\.example\.depositStamp[\s\S]*?SRC\.example\.motDays/.test(ux), 'the worked example is read from the domain source, never typed on the surface');
ok(/data-fin-chart/.test(ux) && /<svg viewBox/.test(ux) && /<polyline fill="none"/.test(ux) && !/fill="#/.test(ux), 'the chart is strokes on the black ground — no face is painted');
ok(/x1=\{x\(from \+ HOLD_MS\)\}/.test(ux), 'the 3-hour hold is a mark on the chart');
ok(/VECTOR_LAW\.stroke/.test(ux) && /TRINITY_COLORS/.test(ux), 'the chart stays under the vector law: stroke widths from VECTOR_LAW, colours from the 13');
ok(/data-fin-balance/.test(ux) && /data-fin-budget/.test(ux) && /data-fin-ledger/.test(ux) && /data-fin-year/.test(ux), 'balance, budget, record and year panels carry their hooks');
ok(/<RCoreBadge history=\{FINANCIAL_RCORE_HISTORY\} accent=/.test(ux) && /fromLedgerJson\(FINANCIAL_LEDGER\)/.test(ux), 'the R-CORE badge is mounted last from the Financial ledger');
const lastTag = ux.lastIndexOf('<RCoreBadge'); const rootClose = ux.lastIndexOf('</div>\n  );\n}', ux.indexOf('function MotChart'));
ok(lastTag > 0 && rootClose > lastTag, 'the badge is the last child of the root (bottom of the page)');
ok(/versionStamp\(/.test(ux), 'the U-WF-12 version stamp is printed');
ok(/fin\.device_only/.test(ux) && /fin\.chain_broken/.test(ux), 'the record says where it lives and whether its chain held');

// 3 — the launcher tile
const launcher = read('components/vision-2525-launcher.tsx');
ok(/code: "FINANCIAL-2525"/.test(launcher) && /router\.push\("\/financial-2525"\)/.test(launcher), 'the VISION • 2525 launcher carries the FINANCIAL tile → /financial-2525 (the canonical address, addendum 15; /main/Financial-2525 the alias)');

// 4 — the export emits both routes when out/ exists
for (const r of ['out/main/Financial-2525/index.html', 'out/financial-2525/index.html']) {
  if (!fs.existsSync('out')) { pass++; continue; }
  ok(fs.existsSync(r) && fs.statSync(r).size > 2000, `${r} is exported (> 2 KB)`);
}
ok(path.basename(process.cwd()) === 'frontend', 'runs from frontend/');

console.log(`\nfinancial-surface: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
