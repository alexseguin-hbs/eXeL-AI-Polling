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
ok(/showAbc \? fmtMot\(positionInYear\(from \+ f \* len, planet\.yearAnchor, planet\.yearDays\)\.abc\)/.test(ux) && /spanABC\(elapsed \/ dayMs, planet\.yearDays\)/.test(ux) && !/\bmotABC\(/.test(ux) && !/MS_PER_DAY/.test(ux), "A.B..C IS the revolution (addenda 10–12): the reveal reads the year position at each axis mark on the planet's anchor and the elapsed span in A-units of the planet's whole — never a period as its own 0→3600, never an Earth constant typed on the surface");
ok(/positionInYear\(now, planet\.yearAnchor, planet\.yearDays\)/.test(ux) && /frameOf\(now, 33, planet\.yearAnchor, planet\.yearDays\)/.test(ux) && /data-fin-past-full/.test(ux), "the year position (on the table's anchor) and the 33-day frame are shown; a year past day 365 carries its flag");
// r.008 (addendum 19) — every category carries its icon from ONE map; the year position takes the planet's revolution
const iconSrc = fs.readFileSync(path.join(process.cwd(), "components/financial-2525/category-icon.tsx"), "utf8");
const catList = /export const BUDGET_CATEGORIES[^=]*=\s*\[([^\]]+)\]/.exec(fs.readFileSync(path.join(process.cwd(), "lib/financial-2525/budget.ts"), "utf8"));
const cats = catList ? [...catList[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];
ok(cats.length === 10 && cats.every((c) => new RegExp(`(^|\\n)\\s*"?${c.replace(/ /g, " ")}"?:\\s*[A-Z][A-Za-z]+,`).test(iconSrc)), `every one of the ${cats.length} categories has an icon in CATEGORY_ICON (a bare category fails here)`);
ok(/strokeWidth=\{1\.5\}/.test(iconSrc) && /aria-hidden/.test(iconSrc) && !/fill=/.test(iconSrc), "the icons are strokes (1.5), aria-hidden — the word beside them carries the meaning");
ok(/<SectionIcon section=\{section\} className="mr-1" \/>\{t\("fin\.section"\)\}/.test(ux) && /<SectionIcon section=\{fieldOf\(l\.fieldId\)\?\.section \?\? "L"\} className="mr-1\.5" \/>\{fieldLabel\(l\.fieldId\)\}/.test(ux) && /\{txWhat\(e\.tx\)\}/.test(ux) && /<SectionIcon section=\{sec\} className="mx-0\.5" \/>\{fieldLabel\(tx\.field\)\}/.test(ux) && /<CategoryIcon category=\{tx\.category\} className="mx-0\.5" \/>\{catLabel\(tx\.category\)\}/.test(ux), "the icon sits before the section dropdown's label, on every budget line (its section's stroke, r.018: no section rows, no letters) and on every record line (an r.006–r.011 entry keeps its category icon)");
ok(/positionInYear\(now, planet\.yearAnchor, planet\.yearDays\)/.test(ux) && /frameOf\(now, 33, planet\.yearAnchor, planet\.yearDays\)/.test(ux) && /positionInYear\(from \+ f \* len, planet\.yearAnchor, planet\.yearDays\)/.test(ux), "every year position on the glass takes the selected planet's revolution (the r.007 Mars axis read Earth positions)");
// r.007 (addendum 18) — the perihelion instant that opens the year is written on the glass in Austin CST standard; the axis marks are three lines
ok(/data-fin-perihelion/.test(ux) && /t\("fin\.perihelion_cst"\)\} · \{fmtStampCST\(year\.startMs\)\} CST/.test(ux) && /year\.anchor === "perihelion"/.test(ux), "the year panel prints the perihelion that opened the year, in CST standard (fmtStampCST — UTC−6, never daylight), on the perihelion anchor");
ok(/a\.replace\("\.", "\\n\."\)\.replace\("\.\.", "\\n\.\."\)/.test(ux), "an A.B..C axis mark is three lines — A / .B / ..C — so B and C never overprint a neighbour at phone width (the r.006 Mars capture)");
// r.005 — the Planet LTU table (Admin panel) drives every conversion; the planet selector; the MoT ⇄ Clock icon toggle is the card's one state
ok(/readPlanetLtu\(\)/.test(ux) && /PLANET_LTU_KEYS\.includes\(e\.key\)/.test(ux) && /planetRow\(planets, planetCode\)/.test(ux) && /daySecOf\(planet\) \* 1000/.test(ux), "every conversion reads the selected planet's row from the Admin panel's LTU table (seed on the server, the device copy after mount, other tabs via storage)");
ok(/useState<PlanetLtuRow\[\]>\(\(\) => \[\.\.\.PLANET_LTU_SEED\]\)/.test(ux) && /setPlanets\(readPlanetLtu\(\)\)/.test(ux), 'the first paint is the seed, the device copy arrives after mount (never a hydration mismatch)');
ok(/data-fin-planet/.test(ux) && /planets\.map\(\(p\) => <option key=\{p\.code\} value=\{p\.code\}>\{p\.name\}<\/option>\)/.test(ux), "a planet selector lists the table's rows (Earth default · Mars)");
ok(/import \{ Check, ChevronDown, ChevronRight, Clock, Orbit, Pencil, X \} from "lucide-react"/.test(ux) && /role="group" data-fin-abc-toggle/.test(ux) && /aria-pressed=\{showAbc\} aria-label=\{t\("fin\.show_abc"\)\}/.test(ux) && /aria-pressed=\{!showAbc\} aria-label=\{t\("fin\.show_ltu"\)\}/.test(ux) && /<Orbit size=\{16\} strokeWidth=\{1\.5\} aria-hidden \/>/.test(ux) && /<Clock size=\{16\} strokeWidth=\{1\.5\} aria-hidden \/>/.test(ux), 'the reveal is a MoT-icon ⇄ Clock-icon toggle (addendum 13): two stroke icons, aria-pressed, the existing keys as their names');
ok(/ring-1 ring-inset ring-cyan-500/.test(ux) && !/bg-cyan-500\/15/.test(ux), 'the pressed icon is ringed, never filled (the vector law)');
ok(!/function MotChart[\s\S]*useState\(/.test(ux) && /const \[showAbc, setShowAbc\] = useState\(false\);/.test(ux) && /showAbc=\{showAbc\} onToggle=\{setShowAbc\}/.test(ux) && /\{showAbc \? `[^`]*fin\.a_units[^`]*` : ""\}/.test(ux) && /\{showAbc \? fmtMot\(year\.abc\) : /.test(ux), "ONE toggle state for the whole card: the chart, its header, the clock ladder's A-units line and the year line follow it");
ok(/planet\.code !== "earth" && <p[^>]*>\{t\("fin\.anchor_note"\)\}<\/p>/.test(ux), 'on a planet without a perihelion table the year line says so (declared, not sourced)');
// r.006 — every transaction carries its personal-finance category (addendum 16); the budget is a table with a unit toggle (addendum 17)
ok(/<select data-fin-section=\{hook\}/.test(ux) && /\{FLOW_SECTIONS\.map\(\(sec\) => <option key=\{sec\} value=\{sec\}>\{secLabel\(sec\)\}<\/option>\)\}/.test(ux) && /<select data-fin-field=\{hook\}/.test(ux) && /\{fieldsOf\(section\)\.map\(\(f\) => <option key=\{f\.id\} value=\{f\.id\}>\{fieldLabel\(f\.id\)\}<\/option>\)\}/.test(ux) && /<select data-fin-length=\{hook\}/.test(ux) && /\{RECURRENCES\.map\(\(r\) => <option key=\{r\} value=\{r\}>\{t\(`fin\.rec\.\$\{r\}`\)\}<\/option>\)\}/.test(ux) && /rec === "other" && \(/.test(ux) && /<input data-fin-length-n=\{hook\}/.test(ux) && /<select data-fin-length-unit=\{hook\}/.test(ux) && /\{LENGTH_UNITS\.map\(\(u\) => <option key=\{u\} value=\{u\}>\{t\(`fin\.u\.\$\{u\}`\)\}<\/option>\)\}/.test(ux) && (ux.match(/<LadderPicker /g) || []).length === 1 && /<LadderPicker[^>]*hook="transaction"/.test(ux) && !/data-fin-category/.test(ux) && !/data-fin-timeline/.test(ux), "the one form carries the SECTION A–M, the FIELD within it, and the LENGTH — presets with Other opening a number in years · days · hours · minutes (addenda 22, 24, 25); one picker, hook transaction; no category or timeline dropdown remains");
ok(/motDays: lengthDays\(rec, Number\(otherN\), otherUnit\), memo: memo\.trim\(\) \|\| undefined, field, recurrence: rec \}\);/.test(ux) && /atMs: instant, motDays: lengthDays\(rec, Number\(otherN\), otherUnit\), memo: memo\.trim\(\) \|\| undefined, field, recurrence: rec \};/.test(ux) && /d\.field \? ` · \$\{fieldLabel\(d\.field\)\}` : d\.category \? ` · \$\{catLabel\(d\.category\)\}` : ""/.test(ux) && /if \(tx\.category\) return <span>/.test(ux), "the field, the length (as motDays) and the timeline are recorded on the entry of either kind (inside its hash) and shown on the roster and the record; an r.006–r.011 entry still prints its category");
// r.013 (addendum 24) — ONE transaction form: the type is the first dropdown; the MoT length is never a typed field; one button whose word follows the type
ok(/data-testid="fin-transaction-form" data-fin-tx-type=\{txType\}/.test(ux) && /<select data-fin-type className=\{PICK\} value=\{txType\} onChange=\{\(e\) => chooseType\(e\.target\.value as TxKind\)\}/.test(ux) && /<option value="deposit">\{t\("fin\.deposit"\)\}<\/option>/.test(ux) && /<option value="withdrawal">\{t\("fin\.withdrawal"\)\}<\/option>/.test(ux) && !/fin-deposit-form/.test(ux) && !/fin-withdraw-form/.test(ux) && !/t\("fin\.mot_days"\)/.test(ux) && /\{txType === "deposit" \? t\("fin\.record_it"\) : t\("fin\.withdraw"\)\}/.test(ux) && /const recordTransaction = \(\) => \(txType === "deposit" \? recordDeposit\(\) : recordWithdrawal\(\)\);/.test(ux) && /if \(k === "deposit"\) \{ setSec\("A"\); setField\("A\.income_wages"\); setRec\("paymot"\); \} else \{ setSec\("B"\); setField\("B\.rent_mortgage"\); setRec\("once"\); \}/.test(ux), "ONE transaction form: the type (Deposit · Withdrawal) is its first dropdown and re-seats the picker's default; no DEPOSIT / WITHDRAWAL pair, no typed MoT field; one button whose word follows the type; both record paths behind it");
ok(/<select data-fin-budget-unit value=\{budgetUnit\}/.test(ux) && !/role="group" data-fin-budget-unit/.test(ux) && /\{UNITS\.map\(\(u\) => <option key=\{u\.key\} value=\{u\.key\}>\{u\.label\}<\/option>\)\}/.test(ux) && /<table className="mt-2 w-full font-mono text-xs">/.test(ux) && /data-fin-kind=\{g\.kind\}/.test(ux) && /\{groups\.map\(\(g\) => \(/.test(ux) && !/data-fin-budget-row/.test(ux) && /data-fin-ladder-field=\{l\.fieldId\}/.test(ux) && /data-fin-budget-net/.test(ux) && /totals\.net < 0 \? "text-red-500"/.test(ux) && /\{t\("fin\.stock_note"\)\}/.test(ux), "the budget is the ladder grouped by KIND — one row per kind with its total, the lines beneath when opened, Net last and red when negative — under ONE unit dropdown (addenda 20 + 22 → 31); the N–T note under it");
ok(/<select data-fin-budget-unit value=\{budgetUnit\}[^\n]*className="w-full [^"]*landscape:w-auto landscape:min-w-\[14rem\][^"]*"/.test(ux) && /<label className="flex w-full flex-col gap-1 [^"]*landscape:w-auto landscape:flex-row[^"]*">\{t\("fin\.unit"\)\}/.test(ux), "in portrait the unit dropdown is the panel's full width with its label above (addendum 21 — per hour etc. read at the full line); landscape keeps it at its own width beside the label");
ok(/\{ key: "min", label: t\("fin\.per_min"\), period: "minute" \}/.test(ux) && /\{ key: "day", label: t\("fin\.per_day"\), period: "day" \}/.test(ux) && /\{ key: "week", label: t\("fin\.per_week"\), period: "week" \}/.test(ux) && /\{ key: "month", label: t\("fin\.per_month"\), period: "month" \}, \{ key: "quarter", label: t\("fin\.per_quarter"\), period: "quarter" \}/.test(ux) && !/\(91\)`/.test(ux) && /\{ key: "year", label: t\("fin\.per_year"\), period: "year" \}/.test(ux) && /useState<BudgetUnit>\("m33"\)/.test(ux), "every view is possible — $/s · $/min · $/h · day · week · 33 days · month (30.333 days) · quarter (91 days) · year — each a fixed PERIOD (FD-25, the month by addendum 34); the sheet's 33 days by default");
ok(/const totals = useMemo\(\(\) => netLadder\(plan, period\), \[plan, period\]\);/.test(ux) && /toPeriod\(l\.amountNative, l\.nativePeriod, period\)/.test(ux) && !/ltuDays\(planet\)/.test(ux) && !/\b(86400|1440|525600)\b/.test(ux), "the ladder's figures come from netLadder / toPeriod on the brief's fixed factors (FD-25) — never typed on the surface; the planet's LTU row still drives the clock ladder (daySecOf)");
ok(!/Supabase/.test(ux) && !/Supabase/.test(fs.readFileSync("lib/lexicon-data.ts", "utf8").match(/key: "fin\.device_only"[^\n]*/)[0]), "the record sentence names no vendor (the signer-voice law)");
ok(/append\(record, tx, at\)/.test(ux) && /loadRecord\(owner\)/.test(ux) && /saveRecord\(next\)/.test(ux), 'the record is appended, loaded and saved through lib/financial-2525/record');
ok(/import { type BudgetCategory } from "@\/lib\/financial-2525\/budget"/.test(ux) && /from "@\/lib\/financial-2525\/plan"/.test(ux) && /from "@\/lib\/financial-2525\/ladder"/.test(ux) && !/summarize\(/.test(ux), 'the ladder comes from lib/financial-2525/ladder over the plan of the person (lib/financial-2525/plan, the sheet bridged in budget.ts until they edit); the r.001 summarize is no longer on the glass');
ok(/useAuth0\(\)/.test(ux) && /loginWithRedirect\(\{ appState: \{ returnTo: /.test(ux) && /user\?\.sub/.test(ux), 'each user their own login: Auth0 gates recording, keys the record, and returns the person HERE after login');
ok(/\{owner \? \(/.test(ux) && /data-fin-forms/.test(ux), 'the deposit / withdrawal forms render only for a signed-in person');
// r.002 — the surface STARTS FROM the ◬ ♡ 웃 Session shell (operator addendum 7): its root, header, rail, guide, roster, clock, strip, Trinity
ok(/className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pb-10"/.test(ux) && /<SoiGlobe \/>/.test(ux) && /<TrinityGlyphs size="text-3xl"/.test(ux), 'the Session root and header: the globe and the Trinity glyphs');
ok(/<PodPhaseRail phase=\{phase\} phases=\{FIN_PHASES\} countFor=\{countFor\}/.test(ux) && /<PodRosterList rows=\{rosterRows\}/.test(ux), 'the Session rail (five financial phases) and roster, reused not redrawn');
ok(/data-testid="fin-your-turn" data-state=\{guide\.state\}/.test(ux) && /font-mono text-2xl tabular-nums text-cyan-500/.test(ux) && /data-testid="fin-strip"/.test(ux) && /<SoITrinity /.test(ux), 'the guide card, the ACTIVE clock block, the phone strip and the folded Trinity carry the Session\'s classes');
ok(/const CARD = "mt-8 rounded-xl border border-border bg-card p-5"/.test(ux) && !/VECTOR_LAW\.ground/.test(ux), 'the chrome is the app theme card (bg-card), not a fresh black console');
ok(/<SoITrinity labels=\{\[t\("fin\.wheel\.hi"\), t\("fin\.wheel\.si"\), t\("fin\.wheel\.ai"\)\]\} centerGlyphs=\{\["웃", "♡", "◬"\]\}/.test(ux), 'the Trinity wheel seats the operator\'s way: TOP HI 웃 · BOTTOM-RIGHT SI ♡ minutes · BOTTOM-LEFT AI ◬ tokens (addendum 9; SoITrinity tuple = [top, bottom-right, bottom-left])');
ok(/showAbc \? fmtMot\(positionInYear\(from \+ f \* len, planet\.yearAnchor, planet\.yearDays\)\.abc\) : ltuLabel\(f \* len, len, planet\)/.test(ux) && /useState\(false\)/.test(ux), "the chart glass defaults to the planet's day · hour · minute; A.B..C (the revolution's coordinate) is a reveal (addenda 8 + 10 + 12)");
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

// r.014 — THE PICKER LAW (operator addendum 26 "this drop down goes away quick!"): a dropdown stays open until the person picks.
// A component declared inside the render body is a new type every render; the once-a-second clock remounts its <select> and the
// phone dismisses the picker sheet. Every picker is a module-level component with a stable identity.
ok(/^function LadderPicker\(\{ section, field, rec, onSection, onField, onRec, otherN, onOtherN, otherUnit, onOtherUnit, t, hook \}/m.test(ux), 'LadderPicker is declared at module level (column 0), its Other state and t passed as props');
ok(!/^\s+const [A-Z][A-Za-z]+ = \(/m.test(ux) && !/^\s+function [A-Z][A-Za-z]+\(/m.test(ux), 'no component is declared inside the render body (a nested component remounts its <select> on every clock tick — r.006 CategorySelect, r.012 LadderPicker)');
ok(/^const PICK = "w-full rounded-md/m.test(ux), 'the picker class string is module-level too');
ok(/<LadderPicker section=\{sec\} field=\{field\} rec=\{rec\} onSection=\{setSec\} onField=\{setField\} onRec=\{setRec\} otherN=\{otherN\} onOtherN=\{setOtherN\} otherUnit=\{otherUnit\} onOtherUnit=\{setOtherUnit\} t=\{t\} hook="transaction" \/>/.test(ux), 'the one form mounts the module-level picker with the Other state from the surface');
ok(/THE PICKER LAW \(r\.014/.test(ux), 'the law is written into the file beside the component');

// r.015 (addendum 27) — every section A–T has its OWN stroke; U (the amortize rule) has none by design
{
  const ladderSrc = fs.readFileSync(path.join(process.cwd(), "lib/financial-2525/ladder.ts"), "utf8");
  const secIds = [...ladderSrc.matchAll(/\{ id: "([A-Z])", name: "[^"]+", plane: "[^"]+", key: "[a-z]" \}/g)].map((m) => m[1]);
  const map = /export const SECTION_ICON: Record<SectionId, LucideIcon> = \{([^}]+)\}/.exec(iconSrc);
  const entries = map ? [...map[1].matchAll(/\b([A-Z]): ([A-Z][A-Za-z]+),/g)].map((m) => [m[1], m[2]]) : [];
  const icons = Object.fromEntries(entries);
  ok(secIds.length === 20 && secIds.join("") === "ABCDEFGHIJKLMNOPQRST", `the ladder declares the twenty sections A–T (${secIds.join("")})`);
  ok(secIds.every((id) => icons[id]), `every section A–T has an icon in SECTION_ICON (missing: ${secIds.filter((id) => !icons[id]).join(" ") || "none"})`);
  ok(new Set(Object.values(icons)).size === entries.length && entries.length === 20, `the twenty section strokes are all distinct (${entries.length} entries, ${new Set(Object.values(icons)).size} strokes)`);
  ok(!icons.U && !/\bU: /.test(map ? map[1] : ""), "U is the amortize rule, never a section — it has no icon by design");
  ok(entries.every(([, name]) => new RegExp(`\\b${name}\\b`).test(iconSrc.split("\n").find((l) => l.startsWith("import {")) ?? "")), "every section stroke is imported from lucide (a name that is not imported would render nothing)");
  ok(/data-fin-tx-field=\{tx\.field\}> · <SectionIcon section=\{sec\}/.test(ux) && /<tr key=\{l\.fieldId\} data-fin-ladder-field=\{l\.fieldId\}[^\n]*<SectionIcon section=\{fieldOf\(l\.fieldId\)\?\.section \?\? "L"\}/.test(ux), "the record line and every budget line draw the section's stroke before its word (r.018: the letter never)");
}

// R-CORE toggle (operator 2026-09-30) — the page's last element must clear the phone strip: the maximized icon under the badge
// measured UNDER the fixed strip (elementFromPoint returned the strip's span) until the surface gained phone bottom padding.
ok(/<div data-financial-ux1 className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pb-10">/.test(ux), "the surface pads its bottom on the phone (pb-20) so the R-CORE badge and its icon sit above the app's bottom bar");
// r.017 (addendum 29 "your deposit withdrawal floats; very odd") — NOTHING ON THE SURFACE FLOATS: the strip is the Released card's last row
ok(!/className="fixed |className="sticky /.test(ux) && !/position: "fixed"/.test(ux), "no fixed or sticky element inside the surface (a fixed element positioned against another element's assumed height is the class)");
ok(/data-fin-balance[\s\S]*?<div className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-xs" data-testid="fin-strip">[\s\S]*?\{usd\(bal\.releasedCents\)\} · \{usd\(bal\.availableCents\)\}[\s\S]*?openForm\("withdrawal"\)[\s\S]*?<\/div>\s*<\/div>/.test(ux), "the strip — released · available · the phase · the buttons — is the last row of the Released card, in normal flow");


// r.016 (addendum 28) — EDIT MODE behind an icon on the budget: the plan drives the ladder; typed in the unit, stored on the base
ok(/import \{ loadPlan, savePlan, clearPlan, sheetPlan, planOrSheet, setLineSpec, lineSpec, switchRec, isValidSpec, addLine, removeLine, BUDGET_RECURRENCES, type PlanLine, type LineSpec \} from "@\/lib\/financial-2525\/plan"/.test(ux) && !/SHEET_LINES/.test(ux), "the surface reads the person's plan through lib/financial-2525/plan and never the sheet constant directly");
ok(/const totals = useMemo\(\(\) => netLadder\(plan, period\), \[plan, period\]\);/.test(ux) && /const groups = useMemo\(\(\) => groupByKind\(plan, period\), \[plan, period\]\);/.test(ux) && /isOpen\(g\.kind\) && g\.lines\.map\(\(l\) =>/.test(ux), "every kind total, every line and Net follow the plan (the lines through groupByKind)");
ok(/<button type="button" data-fin-budget-edit aria-pressed=\{editing\} aria-label=\{editing \? t\("fin\.done"\) : t\("fin\.edit"\)\}/.test(ux) && /\{editing \? <Check size=\{14\} strokeWidth=\{1\.5\} aria-hidden \/> : <Pencil size=\{14\} strokeWidth=\{1\.5\} aria-hidden \/>\}/.test(ux) && /ring-1 ring-inset ring-cyan-500" : "border-border"/.test(ux), "the pencil icon opens edit mode and the check closes it; the pressed state is a stroke ring, never a fill");
ok(/data-fin-plan-amount=\{l\.fieldId\}[^\n]*inputMode="decimal"/.test(ux) && /value=\{drafts\[`\$\{l\.fieldId\}:amount`\] \?\? String\(sp\.amount\)\}/.test(ux) && /writePlan\(setLineSpec\(plan, l\.fieldId, \{ \.\.\.lineSpec\(l\), \.\.\.patch \}\)\)/.test(ux), "in edit mode each line's amount is a field AS TYPED (its own MoT, r.021), held as a draft while typing, kept with its MoT on the plan");
ok(/data-fin-plan-remove=\{l\.fieldId\}[^\n]*onClick=\{\(\) => writePlan\(removeLine\(plan, l\.fieldId\)\)\}/.test(ux), "a line can be removed");
ok(/data-fin-plan-add\b/.test(ux) && /<select data-fin-plan-section className=\{PICK\}/.test(ux) && /<select data-fin-plan-field className=\{PICK\}/.test(ux) && /<input data-fin-plan-add-amount className=\{INPUT\}/.test(ux) && /<select data-fin-plan-add-rec className=\{PICK\}/.test(ux) && /data-fin-plan-add-btn[^\n]*writePlan\(addLine\(plan, id, addSpec\)\)/.test(ux) && /const addSpec: LineSpec = \{ amount: addAmt\.trim\(\) === \"\" \? 0 : Number\(addAmt\), rec: addRec, otherN: Number\(addN\) \|\| 0, otherUnit: addUnit \}/.test(ux), "a line can be added — section, a field not yet on the plan, its amount and its MoT — full-width pickers (FD-24), inline (the picker law)");
ok(/data-fin-plan-reset onClick=\{\(\) => \{ if \(owner\) clearPlan\(owner\); setPlan\(sheetPlan\(\)\);/.test(ux) && /if \(owner && !savePlan\(owner, next\)\) setSaveFailed\(true\)/.test(ux) && /setPlan\(planOrSheet\(loadPlan\(owner\)\)\)/.test(ux), "the plan is saved on the device under the person's key, loaded at sign-in, and Reset returns to the sheet");
ok(/\{owner && \(\s*<button type="button" data-fin-budget-edit/.test(ux), "only a signed-in person sees the pencil (the sheet stays the read-only example)");

// r.018 (addendum 31 "order by fixed vs financial, and have expand button so this is not so busy. Don't show A-U letters")
ok(!/\{sec\} · /.test(ux) && !/A–M|A–U|A-M|A-U/.test(ux.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")), "no A–U letter reaches the glass: no '{sec} · ' prefix and no A–M / A–U in rendered text (comments excepted)");
ok(/<tr data-fin-kind=\{g\.kind\} data-fin-kind-open=\{isOpen\(g\.kind\) \? "1" : "0"\}/.test(ux) && /<button type="button" data-fin-kind-toggle=\{g\.kind\} aria-expanded=\{isOpen\(g\.kind\)\} aria-label=\{isOpen\(g\.kind\) \? t\("fin\.collapse"\) : t\("fin\.expand"\)\}/.test(ux) && /\{isOpen\(g\.kind\) \? <ChevronDown size=\{14\} strokeWidth=\{1\.5\} aria-hidden \/> : <ChevronRight size=\{14\} strokeWidth=\{1\.5\} aria-hidden \/>\}\{kindLabel\(g\.kind\)\}/.test(ux), "one row per kind with a chevron (aria-expanded, Show the lines / Hide the lines) and the kind's name");
ok(/const \[openKinds, setOpenKinds\] = useState\(\[\] as FieldKind\[\]\);/.test(ux) && /const isOpen = \(k: FieldKind\) => editing \|\| openKinds\.includes\(k\);/.test(ux), "the groups start collapsed; edit mode opens every group so its fields are reachable");
ok(/const kindLabel = \(k: FieldKind\) => \(k === "Transfer" \? t\("fin\.sec\.m"\) : t\(`fin\.\$\{k\.toLowerCase\(\)\}`\)\);/.test(ux), "the kinds read Income · Fixed · Variable (r.006's keys) and Transfers (the section's own name)");
ok(/<th className="py-1 pr-2">\{t\("fin\.category"\)\}<\/th>/.test(ux), "the table's first column is headed Category, not Section");

// r.019 (addendum 33 "make table 2x2") — the Released card's four figures as a 2 × 2 table, each word above its figure
{
  const order = ["escrowed", "withdrawable", "withdrawn", "available"];
  const cellOk = (c) => new RegExp('data-fin-cell="' + c + '"><dt[^>]*>\\{t\\("fin\\.' + c + '"\\)\\}</dt><dd[^>]*>\\{usd\\(bal\\.' + c + 'Cents\\)\\}</dd>').test(ux);
  const pos = order.map((c) => ux.indexOf('data-fin-cell="' + c + '"'));
  ok(/<dl data-fin-balance-grid className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">/.test(ux) && order.every(cellOk) && pos.every((x, i) => x > 0 && (i === 0 || x > pos[i - 1])), "the four figures sit in a two-column grid in the order In escrow · Withdrawable / Withdrawn · Available, each word above its figure");
  ok(!/\{t\("fin\.escrowed"\)\}:<\/span>/.test(ux), "the run-on line of four figures is gone");
}

// r.021 (addendum 35 "on input of transaction or budget, must be able to specify time (MoT of transaction)") — every budget line its own MoT
ok(/<select data-fin-plan-rec=\{l\.fieldId\} aria-label=\{t\("fin\.length"\)\} value=\{sp\.rec\} onChange=\{\(e\) => writePlan\(setLineSpec\(plan, l\.fieldId, switchRec\(lineSpec\(l\), e\.target\.value as Recurrence\)\)\)\}/.test(ux) && /\{BUDGET_RECURRENCES\.map\(\(r\) => <option key=\{r\} value=\{r\}>\{t\(`fin\.rec\.\$\{r\}`\)\}<\/option>\)\}/.test(ux), "each budget line in edit mode carries a MoT select with the transaction form's presets (One time excepted), labelled Length (MoT)");
ok(/\{sp\.rec === "other" && \(<>[\s\S]{0,400}data-fin-plan-n=\{l\.fieldId\}[\s\S]{0,600}data-fin-plan-unit=\{l\.fieldId\}/.test(ux) && /\{addRec === "other" && \([\s\S]{0,400}data-fin-plan-add-n[\s\S]{0,300}data-fin-plan-add-unit/.test(ux), "Other opens a number with its unit on a line and on the add row, as on the transaction form");
ok(/<select data-fin-plan-add-rec className=\{PICK\} value=\{addRec\} onChange=\{\(e\) => \{ const nx = switchRec\(addSpec, e\.target\.value as Recurrence\);/.test(ux) && /data-fin-plan-add-btn disabled=\{!addable\.length \|\| !isValidSpec\(addSpec\)\}/.test(ux) && /writePlan\(addLine\(plan, id, addSpec\)\)/.test(ux) && !/Number\(addAmt\) \|\| 0/.test(ux) && !/editSpec\(l, \{ rec:/.test(ux), "r.022: picking Other goes through switchRec on a line and on the add row (no snap-back); the add button waits on a valid spec and adds exactly that spec — a typed amount is never turned into a silent zero");
ok(/<select data-fin-length=\{hook\}/.test(ux) && /\{RECURRENCES\.map\(\(r\) => <option key=\{r\} value=\{r\}>\{t\(`fin\.rec\.\$\{r\}`\)\}<\/option>\)\}/.test(ux), "the transaction form keeps its own MoT (Length) for every type");

console.log(`\nfinancial-surface: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
