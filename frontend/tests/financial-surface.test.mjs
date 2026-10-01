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
ok(/<SectionIcon section=\{section\} className="mr-1" \/>\{t\("fin\.section"\)\}/.test(ux) && /<SectionIcon section=\{sec\} className="mr-1\.5" \/>/.test(ux) && /\{txWhat\(e\.tx\)\}/.test(ux) && /<SectionIcon section=\{sec\} className="mx-0\.5" \/>\{fieldLabel\(tx\.field\)\}/.test(ux) && /<CategoryIcon category=\{tx\.category\} className="mx-0\.5" \/>\{catLabel\(tx\.category\)\}/.test(ux), "the icon sits before the section dropdown's label, on every ladder section row and on every record line (r.012: the section's icon; an r.006–r.011 entry keeps its category icon)");
ok(/positionInYear\(now, planet\.yearAnchor, planet\.yearDays\)/.test(ux) && /frameOf\(now, 33, planet\.yearAnchor, planet\.yearDays\)/.test(ux) && /positionInYear\(from \+ f \* len, planet\.yearAnchor, planet\.yearDays\)/.test(ux), "every year position on the glass takes the selected planet's revolution (the r.007 Mars axis read Earth positions)");
// r.007 (addendum 18) — the perihelion instant that opens the year is written on the glass in Austin CST standard; the axis marks are three lines
ok(/data-fin-perihelion/.test(ux) && /t\("fin\.perihelion_cst"\)\} · \{fmtStampCST\(year\.startMs\)\} CST/.test(ux) && /year\.anchor === "perihelion"/.test(ux), "the year panel prints the perihelion that opened the year, in CST standard (fmtStampCST — UTC−6, never daylight), on the perihelion anchor");
ok(/a\.replace\("\.", "\\n\."\)\.replace\("\.\.", "\\n\.\."\)/.test(ux), "an A.B..C axis mark is three lines — A / .B / ..C — so B and C never overprint a neighbour at phone width (the r.006 Mars capture)");
// r.005 — the Planet LTU table (Admin panel) drives every conversion; the planet selector; the MoT ⇄ Clock icon toggle is the card's one state
ok(/readPlanetLtu\(\)/.test(ux) && /PLANET_LTU_KEYS\.includes\(e\.key\)/.test(ux) && /planetRow\(planets, planetCode\)/.test(ux) && /daySecOf\(planet\) \* 1000/.test(ux), "every conversion reads the selected planet's row from the Admin panel's LTU table (seed on the server, the device copy after mount, other tabs via storage)");
ok(/useState<PlanetLtuRow\[\]>\(\(\) => \[\.\.\.PLANET_LTU_SEED\]\)/.test(ux) && /setPlanets\(readPlanetLtu\(\)\)/.test(ux), 'the first paint is the seed, the device copy arrives after mount (never a hydration mismatch)');
ok(/data-fin-planet/.test(ux) && /planets\.map\(\(p\) => <option key=\{p\.code\} value=\{p\.code\}>\{p\.name\}<\/option>\)/.test(ux), "a planet selector lists the table's rows (Earth default · Mars)");
ok(/import \{ Clock, Orbit \} from "lucide-react"/.test(ux) && /role="group" data-fin-abc-toggle/.test(ux) && /aria-pressed=\{showAbc\} aria-label=\{t\("fin\.show_abc"\)\}/.test(ux) && /aria-pressed=\{!showAbc\} aria-label=\{t\("fin\.show_ltu"\)\}/.test(ux) && /<Orbit size=\{16\} strokeWidth=\{1\.5\} aria-hidden \/>/.test(ux) && /<Clock size=\{16\} strokeWidth=\{1\.5\} aria-hidden \/>/.test(ux), 'the reveal is a MoT-icon ⇄ Clock-icon toggle (addendum 13): two stroke icons, aria-pressed, the existing keys as their names');
ok(/ring-1 ring-inset ring-cyan-500/.test(ux) && !/bg-cyan-500\/15/.test(ux), 'the pressed icon is ringed, never filled (the vector law)');
ok(!/function MotChart[\s\S]*useState\(/.test(ux) && /const \[showAbc, setShowAbc\] = useState\(false\);/.test(ux) && /showAbc=\{showAbc\} onToggle=\{setShowAbc\}/.test(ux) && /\{showAbc \? `[^`]*fin\.a_units[^`]*` : ""\}/.test(ux) && /\{showAbc \? fmtMot\(year\.abc\) : /.test(ux), "ONE toggle state for the whole card: the chart, its header, the clock ladder's A-units line and the year line follow it");
ok(/planet\.code !== "earth" && <p[^>]*>\{t\("fin\.anchor_note"\)\}<\/p>/.test(ux), 'on a planet without a perihelion table the year line says so (declared, not sourced)');
// r.006 — every transaction carries its personal-finance category (addendum 16); the budget is a table with a unit toggle (addendum 17)
ok(/<select data-fin-section=\{hook\}/.test(ux) && /\{FLOW_SECTIONS\.map\(\(sec\) => <option key=\{sec\} value=\{sec\}>\{sec\} · \{secLabel\(sec\)\}<\/option>\)\}/.test(ux) && /<select data-fin-field=\{hook\}/.test(ux) && /\{fieldsOf\(section\)\.map\(\(f\) => <option key=\{f\.id\} value=\{f\.id\}>\{fieldLabel\(f\.id\)\}<\/option>\)\}/.test(ux) && /<select data-fin-length=\{hook\}/.test(ux) && /\{RECURRENCES\.map\(\(r\) => <option key=\{r\} value=\{r\}>\{t\(`fin\.rec\.\$\{r\}`\)\}<\/option>\)\}/.test(ux) && /rec === "other" && \(/.test(ux) && /<input data-fin-length-n=\{hook\}/.test(ux) && /<select data-fin-length-unit=\{hook\}/.test(ux) && /\{LENGTH_UNITS\.map\(\(u\) => <option key=\{u\} value=\{u\}>\{t\(`fin\.u\.\$\{u\}`\)\}<\/option>\)\}/.test(ux) && (ux.match(/<LadderPicker /g) || []).length === 1 && /<LadderPicker[^>]*hook="transaction"/.test(ux) && !/data-fin-category/.test(ux) && !/data-fin-timeline/.test(ux), "the one form carries the SECTION A–M, the FIELD within it, and the LENGTH — presets with Other opening a number in years · days · hours · minutes (addenda 22, 24, 25); one picker, hook transaction; no category or timeline dropdown remains");
ok(/motDays: lengthDays\(rec, Number\(otherN\), otherUnit\), memo: memo\.trim\(\) \|\| undefined, field, recurrence: rec \}\);/.test(ux) && /atMs: instant, motDays: lengthDays\(rec, Number\(otherN\), otherUnit\), memo: memo\.trim\(\) \|\| undefined, field, recurrence: rec \};/.test(ux) && /d\.field \? ` · \$\{fieldLabel\(d\.field\)\}` : d\.category \? ` · \$\{catLabel\(d\.category\)\}` : ""/.test(ux) && /if \(tx\.category\) return <span>/.test(ux), "the field, the length (as motDays) and the timeline are recorded on the entry of either kind (inside its hash) and shown on the roster and the record; an r.006–r.011 entry still prints its category");
// r.013 (addendum 24) — ONE transaction form: the type is the first dropdown; the MoT length is never a typed field; one button whose word follows the type
ok(/data-testid="fin-transaction-form" data-fin-tx-type=\{txType\}/.test(ux) && /<select data-fin-type className=\{PICK\} value=\{txType\} onChange=\{\(e\) => chooseType\(e\.target\.value as TxKind\)\}/.test(ux) && /<option value="deposit">\{t\("fin\.deposit"\)\}<\/option>/.test(ux) && /<option value="withdrawal">\{t\("fin\.withdrawal"\)\}<\/option>/.test(ux) && !/fin-deposit-form/.test(ux) && !/fin-withdraw-form/.test(ux) && !/t\("fin\.mot_days"\)/.test(ux) && /\{txType === "deposit" \? t\("fin\.record_it"\) : t\("fin\.withdraw"\)\}/.test(ux) && /const recordTransaction = \(\) => \(txType === "deposit" \? recordDeposit\(\) : recordWithdrawal\(\)\);/.test(ux) && /if \(k === "deposit"\) \{ setSec\("A"\); setField\("A\.income_wages"\); setRec\("paymot"\); \} else \{ setSec\("B"\); setField\("B\.rent_mortgage"\); setRec\("once"\); \}/.test(ux), "ONE transaction form: the type (Deposit · Withdrawal) is its first dropdown and re-seats the picker's default; no DEPOSIT / WITHDRAWAL pair, no typed MoT field; one button whose word follows the type; both record paths behind it");
ok(/<select data-fin-budget-unit value=\{budgetUnit\}/.test(ux) && !/role="group" data-fin-budget-unit/.test(ux) && /\{UNITS\.map\(\(u\) => <option key=\{u\.key\} value=\{u\.key\}>\{u\.label\}<\/option>\)\}/.test(ux) && /<table className="mt-2 w-full font-mono text-xs">/.test(ux) && /data-fin-budget-row=\{sec\}/.test(ux) && /\{FLOW_SECTIONS\.map\(\(sec\) => \(/.test(ux) && /data-fin-ladder-field=\{l\.fieldId\}/.test(ux) && /data-fin-budget-net/.test(ux) && /totals\.net < 0 \? "text-red-500"/.test(ux) && /\{t\("fin\.stock_note"\)\}/.test(ux), "the budget is the LADDER — thirteen section rows A–M with their totals, the sheet's fields beneath, Net last and red when negative — under ONE unit dropdown (addenda 20 + 22); the N–T note under it");
ok(/<select data-fin-budget-unit value=\{budgetUnit\}[^\n]*className="w-full [^"]*landscape:w-auto landscape:min-w-\[14rem\][^"]*"/.test(ux) && /<label className="flex w-full flex-col gap-1 [^"]*landscape:w-auto landscape:flex-row[^"]*">\{t\("fin\.unit"\)\}/.test(ux), "in portrait the unit dropdown is the panel's full width with its label above (addendum 21 — per hour etc. read at the full line); landscape keeps it at its own width beside the label");
ok(/\{ key: "min", label: t\("fin\.per_min"\), period: "minute" \}/.test(ux) && /\{ key: "day", label: t\("fin\.per_day"\), period: "day" \}/.test(ux) && /\{ key: "week", label: t\("fin\.per_week"\), period: "week" \}/.test(ux) && /\{ key: "month", label: `\$\{t\("fin\.per_month"\)\} \(91\)`, period: "month91" \}/.test(ux) && /\{ key: "year", label: t\("fin\.per_year"\), period: "year" \}/.test(ux) && /useState<BudgetUnit>\("m33"\)/.test(ux), "every view is possible — $/s · $/min · $/h · day · week · 33 days · month (91) · year — each a fixed PERIOD of the brief (FD-25); the sheet month by default");
ok(/const totals = useMemo\(\(\) => netLadder\(SHEET_LINES, period\), \[period\]\);/.test(ux) && /toPeriod\(l\.amountNative, l\.nativePeriod, period\)/.test(ux) && !/ltuDays\(planet\)/.test(ux) && !/\b(86400|1440|525600)\b/.test(ux), "the ladder's figures come from netLadder / toPeriod on the brief's fixed factors (FD-25) — never typed on the surface; the planet's LTU row still drives the clock ladder (daySecOf)");
ok(!/Supabase/.test(ux) && !/Supabase/.test(fs.readFileSync("lib/lexicon-data.ts", "utf8").match(/key: "fin\.device_only"[^\n]*/)[0]), "the record sentence names no vendor (the signer-voice law)");
ok(/append\(record, tx, at\)/.test(ux) && /loadRecord\(owner\)/.test(ux) && /saveRecord\(next\)/.test(ux), 'the record is appended, loaded and saved through lib/financial-2525/record');
ok(/import { SHEET_LINES, type BudgetCategory } from "@\/lib\/financial-2525\/budget"/.test(ux) && /from "@\/lib\/financial-2525\/ladder"/.test(ux) && !/summarize\(/.test(ux), 'the ladder comes from lib/financial-2525/ladder over the sheet bridged in lib/financial-2525/budget (SHEET_LINES); the r.001 summarize is no longer on the glass');
ok(/useAuth0\(\)/.test(ux) && /loginWithRedirect\(\{ appState: \{ returnTo: /.test(ux) && /user\?\.sub/.test(ux), 'each user their own login: Auth0 gates recording, keys the record, and returns the person HERE after login');
ok(/\{owner \? \(/.test(ux) && /data-fin-forms/.test(ux), 'the deposit / withdrawal forms render only for a signed-in person');
// r.002 — the surface STARTS FROM the ◬ ♡ 웃 Session shell (operator addendum 7): its root, header, rail, guide, roster, clock, strip, Trinity
ok(/className="mx-auto max-w-3xl px-4 pb-32 pt-10 sm:pb-10"/.test(ux) && /<SoiGlobe \/>/.test(ux) && /<TrinityGlyphs size="text-3xl"/.test(ux), 'the Session root and header: the globe and the Trinity glyphs');
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
  ok(/data-fin-tx-field=\{tx\.field\}> · <SectionIcon section=\{sec\}/.test(ux) && /<tr data-fin-budget-row=\{sec\}[^\n]*<SectionIcon section=\{sec\}/.test(ux), "the record line and every ladder section row draw the section's stroke before its word");
}

// R-CORE toggle (operator 2026-09-30) — the page's last element must clear the phone strip: the maximized icon under the badge
// measured UNDER the fixed strip (elementFromPoint returned the strip's span) until the surface gained phone bottom padding.
ok(/<div data-financial-ux1 className="mx-auto max-w-3xl px-4 pb-32 pt-10 sm:pb-10">/.test(ux), "the surface pads its bottom on the phone (pb-32) so the R-CORE badge and its icon sit above the fixed strip");

console.log(`\nfinancial-surface: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
