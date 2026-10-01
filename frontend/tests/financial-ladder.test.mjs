// financial-ladder — THE PERSONAL FINANCE LADDER A–U (operator 2026-09-30, addendum 22, "the lock"): the sections and fields
// exactly as the brief writes them; two planes; U a rule never a section; the fixed period factors; Net = I − L − Ds − Tx − Tr at
// every period; a period switch multiplies by a constant with no drift beyond cents; the duplicate-insurance warning; Alcohol one
// target; a transaction's money spread over its own length, summed against a window (the operator's "$/min against budget").
import assert from 'node:assert/strict';
const L = await import("../lib/financial-2525/ladder.ts");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const near = (a, b, e = 1e-9) => Math.abs(a - b) <= e;

// ── 1 · sections A–T, planes, nothing past T; U is not a section ─────────────────────────────────────────────────
ok(L.SECTIONS.map((s) => s.id).join("") === "ABCDEFGHIJKLMNOPQRST" && L.SECTIONS.length === 20, "twenty sections A–T in the brief's order; nothing past T; no U");
ok(L.SECTIONS.map((s) => s.name).join(" · ") === "Income · Housing · Transportation · Insurance · Utilities · Food · Health · Family · Debt service · Taxes · Work · Lifestyle · Transfers · Cash · Investments · Debts · Net worth · Credit · Protection · Goals", "the section names, exactly");
ok(L.FLOW_SECTIONS.join("") === "ABCDEFGHIJKLM" && L.SECTIONS.filter((s) => s.plane === "flow").length === 13, "thirteen FLOW sections A–M");
ok(["N", "O", "P"].every((s) => L.sectionOf(s).plane === "stock") && ["Q", "R", "S"].every((s) => L.sectionOf(s).plane === "status") && L.sectionOf("T").plane === "goal", "N–P stock · Q–S status · T goal — off the ladder");
ok(!L.SECTIONS.some((s) => s.id === "U") && !L.FIELDS.some((f) => f.section === "U"), "U never appears as a section or a field (it is the amortize rule)");

// ── 2 · the sixty fields, labels exactly, one row per field ────────────────────────────────────────────────────
ok(L.FIELDS.length === 60 && L.FLOW_FIELDS.length === 46, `sixty fields — 46 flow (got ${L.FIELDS.length} / ${L.FLOW_FIELDS.length})`);
const labels = Object.fromEntries(L.FIELDS.map((f) => [f.id, f.label]));
for (const [id, label] of [["A.income_wages", "Income / Wages (take-home)"], ["A.upside", "Upside: Overtime / Bonus / Gifts / Other"], ["B.rent_mortgage", "Rent / Mortgage"], ["B.housing_insurance", "Housing insurance"], ["B.maintenance_repairs", "Home Maintenance & Repairs"], ["C.rideshare_taxi", "Ride-share / Taxi"], ["D.health_dental_vision", "Health / Dental / Vision"], ["E.subscriptions_ai_cloud", "Subscriptions / AI / Cloud"], ["F.alcohol", "Alcohol (or Fun)"], ["G.hsa_fsa", "HSA / FSA contributions"], ["H.pets", "Pets (food, vet, insurance)"], ["I.other_loans", "Personal / Medical / Tax / Other Loans"], ["J.fica_self_employment", "FICA / Self-employment tax"], ["K.gear_licenses_tools", "Gear / Licenses / Tools"], ["L.giving_charity", "Giving / Charity"], ["M.extra_debt_mortgage", "Extra debt / Extra mortgage"], ["N.checking_savings_cash", "Checking / Savings / Cash"], ["O.brokerage_hsa_529", "Brokerage / HSA / 529"], ["P.cards_student_other", "Cards / Student / Other"], ["Q.assets_minus_debts", "Assets − Debts"], ["R.score_utilization_collections", "Score / Utilization / Collections"], ["S.will_beneficiaries_poa", "Will / Beneficiaries / POA"], ["T.cash_buffer_debt_free", "Cash buffer / Debt-free date"]]) ok(labels[id] === label, `${id} reads "${label}" (got "${labels[id]}")`);
const perSection = Object.fromEntries(L.SECTIONS.map((s) => [s.id, L.fieldsOf(s.id).length]));
ok(JSON.stringify(perSection) === JSON.stringify({ A: 5, B: 6, C: 5, D: 4, E: 4, F: 3, G: 4, H: 2, I: 2, J: 3, K: 2, L: 3, M: 3, N: 1, O: 3, P: 2, Q: 2, R: 1, S: 2, T: 3 }), `fields per section as the brief lists them (got ${JSON.stringify(perSection)})`);
ok(new Set(L.FIELDS.map((f) => f.id)).size === 60 && L.FIELDS.every((f) => f.id.startsWith(f.section + ".") && f.plane === L.sectionOf(f.section).plane), "every id is section.slug, unique, on its section's plane");
ok(L.fieldsOf("A").every((f) => f.kind === "Income") && L.fieldsOf("M").every((f) => f.kind === "Transfer") && L.FIELDS.filter((f) => !L.isFlow(f.section)).every((f) => f.kind === "Stock" || f.kind === "Goal") && L.fieldOf("G.hsa_fsa").kind === "Fixed", "A is Income · M is Transfer · N–T Stock/Goal · HSA/FSA an outflow on the ladder");

// ── 3 · the fixed periods; a switch multiplies by a constant; no drift beyond cents ──────────────────────────────
ok(L.PERIODS.join() === "second,minute,hour,day,week,days33,month,quarter,year", "nine time bases (r.020, addendum 34: the month and the 91-day quarter are two)");
ok(L.PERIOD_SECONDS.minute === 60 && L.PERIOD_SECONDS.hour === 3600 && L.PERIOD_SECONDS.day === 86400 && L.PERIOD_SECONDS.week === 7 * 86400 && L.PERIOD_SECONDS.days33 === 33 * 86400 && L.PERIOD_SECONDS.quarter === 91 * 86400 && L.PERIOD_SECONDS.year === 365 * 86400, "the fixed factors — the quarter is 91 days");
ok(near(L.PERIOD_SECONDS.month, 30 * 86400, 1e-6) && near(L.PERIOD_SECONDS.month * 3 + 86400, L.PERIOD_SECONDS.quarter, 1e-6) && near(L.PERIOD_SECONDS.month / 86400, L.PAY_MOT_DAYS, 1e-12) && !("month91" in L.PERIOD_SECONDS), "r.046 month law (addenda 76, 92): a month is 30 days; a 91-day quarter is three months plus one down day; the Monthly preset is the same 30 days; no 91-day month remains");
ok(near(L.toPeriod(3200, "days33", "month") * 91 / 30, L.toPeriod(3200, "days33", "quarter"), 1e-9) && near(L.toPeriod(3604.49, "month", "month"), 3604.49, 1e-12), "a quarter is 91/30 of a month at every figure (3 × 30 + 1 down day); a monthly paycheque reads back as itself");
ok(near(L.toPeriod(144, "day", "minute"), 0.1) && near(L.toPeriod(0.1, "minute", "day"), 144) && near(L.toPeriod(144, "day", "week"), 1008) && near(L.toPeriod(144, "day", "days33"), 4752) && near(L.toPeriod(144, "day", "year"), 52560), "the sheet's ladder: 144 $/D = 0.1 $/min · 1,008 $/W · 4,752 $/33 d · 52,560 $/Y");
ok(near(L.periodFactor("minute", "year"), 525600) && near(L.toPeriod(L.toPeriod(3200, "days33", "minute"), "minute", "days33"), 3200, 1e-9), "minute → year is one constant (525,600); a round trip returns the amount exactly");
{ const lines = [{ fieldId: "A.income_wages", amountNative: 3200, nativePeriod: "days33" }, { fieldId: "B.rent_mortgage", amountNative: 700, nativePeriod: "days33" }, { fieldId: "C.auto_payment", amountNative: 1800, nativePeriod: "days33" }, { fieldId: "D.auto_renters_home", amountNative: 200, nativePeriod: "days33" }, { fieldId: "E.electric_gas", amountNative: 150, nativePeriod: "days33" }, { fieldId: "F.groceries", amountNative: 300, nativePeriod: "days33" }, { fieldId: "G.mental_physical", amountNative: 50, nativePeriod: "days33" }, { fieldId: "L.fun_hobbies_clothing", amountNative: 200, nativePeriod: "days33" }];
  const t33 = L.netLadder(lines, "days33");
  ok(t33.income === 3200 && near(t33.living, 3400) && t33.debtService === 0 && t33.taxes === 0 && t33.transfers === 0 && near(t33.net, -200), `the operator's sheet on the ladder: Income 3,200 · living 3,400 · Net −200 per 33 days (got ${t33.net})`);
  for (const p of L.PERIODS) { const t = L.netLadder(lines, p); const k = L.periodFactor("days33", p); ok(near(t.net, -200 * k, 1e-6) && near(t.income, 3200 * k, 1e-6), `Net at ${p} is the 33-day Net × ${k} — the equation holds at every time base`); }
  ok(near(L.netLadder(lines, "minute").net, -0.0042087542, 1e-9), "Net per minute −0.0042 (the r.006 table's figure)");
  // I − L − Ds − Tx − Tr with every term present
  const full = [...lines, { fieldId: "I.cards_student", amountNative: 100, nativePeriod: "days33" }, { fieldId: "J.federal_state_income", amountNative: 400, nativePeriod: "days33" }, { fieldId: "M.emergency_sinking", amountNative: 250, nativePeriod: "days33" }];
  const tf = L.netLadder(full, "days33");
  ok(tf.debtService === 100 && tf.taxes === 400 && tf.transfers === 250 && near(tf.net, 3200 - 3400 - 100 - 400 - 250), "debt service, taxes and transfers each subtract once — transfers are OUTFLOW on the ladder");
  ok(L.netLadder([{ fieldId: "P.mortgage_auto", amountNative: 250000, nativePeriod: "year" }, ...lines], "days33").net === t33.net, "a balance in P never nets against the ladder — payment ≠ balance");
  ok(L.netLadder([{ fieldId: "Z.nothing", amountNative: 99, nativePeriod: "day" }, { fieldId: "B.rent_mortgage", amountNative: -5, nativePeriod: "day" }], "day").net === 0, "an unknown field or a negative amount is never counted");
  // rounding: cents at print only — 11 fields at odd cents through minute and back
  const odd = L.FLOW_FIELDS.slice(0, 11).map((f, i) => ({ fieldId: f.id, amountNative: 0.01 * (i + 1) * 7, nativePeriod: "days33" }));
  const back = L.toPeriod(L.netLadder(odd, "minute").net, "minute", "days33");
  ok(near(back, L.netLadder(odd, "days33").net, 1e-9), "no rounding drift: eleven odd-cent lines through per-minute and back agree to a billionth"); }

// ── 4 · rule 5 (duplicate insurance warns, never double-counts silently) · rule 6 (alcohol one target) ─────────
{ const both = [{ fieldId: "B.housing_insurance", amountNative: 120, nativePeriod: "days33" }, { fieldId: "D.auto_renters_home", amountNative: 120, nativePeriod: "days33" }];
  const t = L.netLadder(both, "days33");
  ok(t.warnings.includes("DUPLICATE_INSURANCE") && L.netLadder(both.slice(0, 1), "days33").warnings.length === 0, "a premium entered in both B and D raises the warning; one alone does not");
  const alc = [{ fieldId: "F.alcohol", amountNative: 60, nativePeriod: "days33" }];
  ok(L.netLadder(alc, "days33").sections.F === 60 && L.netLadder(alc, "days33").sections.L === 0 && L.netLadder(alc, "days33", "L").sections.L === 60 && L.netLadder(alc, "days33", "L").sections.F === 0, "Alcohol maps to F by default, or to L — one target only, never both"); }

// ── 5 · U — the amortize rule: into an A–M field by its period; refuses N–T; never a chip ──────────────────────
{ const u = L.amortize({ amount: 1200, periodDays: 365, mapsTo: "B.property_tax_hoa_fees" }, "days33");
  ok("fieldId" in u && u.fieldId === "B.property_tax_hoa_fees" && near(u.amount, 1200 * 33 / 365), "a 1,200/year property tax becomes 108.49 per 33 days INTO B.property_tax_hoa_fees");
  ok("refused" in L.amortize({ amount: 1, periodDays: 365, mapsTo: "P.mortgage_auto" }, "day") && "refused" in L.amortize({ amount: 1, periodDays: 365, mapsTo: "U.anything" }, "day") && "refused" in L.amortize({ amount: 1, periodDays: 0, mapsTo: "B.rent_mortgage" }, "day"), "U refuses a stock destination, a U destination, and a zero period"); }

// ── 6 · transaction timelines (the operator's ask): recurrence → length; $/min from the date for the length ────
ok(L.RECURRENCES.join() === "once,weekly,paymot,days33,month91,yearly,other" && L.recurrenceDays("weekly") === 7 && L.recurrenceDays("paymot") === 30 && L.recurrenceDays("days33") === 33 && L.recurrenceDays("month91") === 91 && L.recurrenceDays("yearly") === 365 && L.recurrenceDays("once") === 0 && L.recurrenceDays("other") === 0 && L.recurrenceDays(undefined) === 0, "once · weekly · monthly (30) · 33 days · quarterly (91) · yearly · other → 0 · 7 · 30 · 33 · 91 · 365 · (typed) days");
{ const old = { recurrence: "paymot", motDays: 91 / 3, amountCents: 1 }, w = { recurrence: "weekly", motDays: 7 }, o = { recurrence: "other", motDays: 30.333 }; ok(L.withMonthLaw(old).motDays === 30 && old.motDays === 91 / 3 && L.withMonthLaw(w) === w && L.withMonthLaw(o) === o, "r.046 (his answer 'switch to 30'): an old Monthly entry reads 30 days at replay without changing the stored entry; other lengths are untouched"); }
{ const inc = L.recordIncomeLines([{ kind: "deposit", amountCents: 360449, motDays: 30, field: "A.income_wages" }, { kind: "deposit", amountCents: 32000, motDays: 30, field: "A.income_wages" }, { kind: "withdrawal", amountCents: 7100, motDays: 30 }, { kind: "deposit", amountCents: 3000, motDays: 0, field: "B.rent_mortgage" }]); const w = inc.find((l) => l.fieldId === "A.income_wages"); ok(inc.length === 1 && near(w.amountNative, (3604.49 + 320 + 30) / 30, 1e-9) && w.nativePeriod === "day" && near(L.toPeriod(w.amountNative, "day", "month"), 3954.49, 1e-6), "r.048 (addendum 80 'Income from my record'): deposits become Income lines at amount ÷ length per field; a one-time deposit counts over a 30-day month; a non-Income field falls to wages; withdrawals are not income"); }
ok(L.LENGTH_UNITS.join() === "minutes,hours,days,years" && near(L.lengthDays("other", 90, "minutes"), 90 / 1440) && near(L.lengthDays("other", 36, "hours"), 1.5) && L.lengthDays("other", 45, "days") === 45 && L.lengthDays("other", 2, "years") === 730 && L.lengthDays("other", -3, "days") === 0 && L.lengthDays("paymot", 999, "years") === 30, "Other: a typed number in minutes · hours · days · years becomes days (addendum 25); a preset ignores the typed number; a negative is zero");
ok(near(L.ratePerMinute(360449, 91 / 3), 8.2520, 1e-3), "the worked paycheck runs at 8.25 ¢/min over its 30.333-day MoT (cents in, cents/min out)");
{ const day = 86400 * 1000, t0 = Date.UTC(2026, 9, 1);
  const txs = [{ fieldId: "A.income_wages", amount: 3200, atMs: t0, days: 33 }, { fieldId: "B.rent_mortgage", amount: 700, atMs: t0, days: 33 }, { fieldId: "F.groceries", amount: 120, atMs: t0 + 5 * day, days: 0 }, { fieldId: "F.groceries", amount: 80, atMs: t0 + 40 * day, days: 0 }];
  const w = L.actualsByField(txs, t0, t0 + 33 * day);
  ok(near(w["A.income_wages"].amount, 3200) && near(w["B.rent_mortgage"].amount, 700) && near(w["F.groceries"].amount, 120) && near(w["A.income_wages"].perMinute, 3200 / (33 * 1440)), "over the 33-day window the whole paycheck and rent accrue; the one-time grocery inside the window lands whole; the one after it does not");
  const half = L.actualsByField(txs, t0, t0 + 16.5 * day);
  ok(near(half["A.income_wages"].amount, 1600) && near(half["B.rent_mortgage"].amount, 350), "half the window — half the money of every timed transaction (linear from its date for its length)");
  const late = L.actualsByField(txs, t0 + 30 * day, t0 + 60 * day);
  ok(near(late["A.income_wages"].amount, 3200 * 3 / 33) && near(late["F.groceries"].amount, 80), "a window that catches the last three days of the paycheck and the later grocery only"); }

// ── r.016 · THE PERSON'S PLAN (addendum 28 "add edit mode and icon on budget mode") — pure, on the 33-day base ──────────────
{
  const P = await import("../lib/financial-2525/plan.ts");
  const store = new Map(); globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  const sheet = P.sheetPlan();
  ok(sheet.length === 8 && sheet.every((l) => l.nativePeriod === "days33") && sheet !== P.sheetPlan(), "the sheet is the plan at first: eight lines on the 33-day base, a fresh copy every time");
  ok(P.loadPlan("alice") === null && P.planOrSheet(null).length === 8, "a device with no plan reads the sheet");
  // typed in the unit on the glass, stored on the base: $10/day on Groceries = $330 per 33 days; $0.0042/min back and forth within a cent
  const a = P.setLineAmount(sheet, "F.groceries", 10, "day"); const g = a.find((l) => l.fieldId === "F.groceries");
  ok(near(g.amountNative, 330, 1e-9) && g.nativePeriod === "days33" && P.lineInUnit(g, "day") === 10, "an amount typed per day is stored per 33 days (10/day → 330) and reads back per day exactly");
  ok(near(P.lineInUnit(P.setLineAmount(sheet, "A.income_wages", 1.5, "hour").find((l) => l.fieldId === "A.income_wages"), "hour"), 1.5, 1e-9), "per hour round-trips (1.5/h)");
  ok(P.setLineAmount(sheet, "F.groceries", -5, "day").find((l) => l.fieldId === "F.groceries").amountNative === 300 && P.setLineAmount(sheet, "F.groceries", NaN, "day").find((l) => l.fieldId === "F.groceries").amountNative === 300, "a negative or NaN figure changes nothing (a refusal, never an accidental zero)");
  ok(L.netLadder(a, "days33").net === L.netLadder(sheet, "days33").net - 30, "Net follows the plan (330 instead of 300 on Groceries → Net 30 lower)");
  const b = P.addLine(sheet, "C.fuel");
  ok(b.length === 9 && b.at(-1).fieldId === "C.fuel" && b.at(-1).amountNative === 0 && P.addLine(b, "C.fuel").length === 9, "a FLOW field is added once with a zero amount; a second add is refused");
  ok(P.addLine(sheet, "N.checking_savings_cash").length === 8 && P.addLine(sheet, "Z.nothing").length === 8, "N–T and unknown fields are refused (they live on the Balance view, never per period)");
  ok(P.removeLine(b, "C.fuel").length === 8 && !P.removeLine(b, "C.fuel").some((l) => l.fieldId === "C.fuel"), "a line is removed");
  ok(P.savePlan("alice", a) && JSON.stringify(P.loadPlan("alice")) === JSON.stringify(a), "the plan is saved on the device under the person's own key and reads back whole");
  store.set(P.planKey("mallory"), JSON.stringify([{ fieldId: "F.groceries", amountNative: 1, nativePeriod: "day" }, { fieldId: "Q.net_worth", amountNative: 5, nativePeriod: "days33" }, 7]));
  ok((P.loadPlan("mallory") ?? []).length === 0 && P.planOrSheet(P.loadPlan("mallory")).length === 8, "a malformed saved copy (wrong base, an N–T id, a non-line) is dropped line by line and the sheet stands");
  P.clearPlan("alice"); ok(P.loadPlan("alice") === null, "Reset clears the device copy");
  delete globalThis.localStorage;
}

// ── r.018 · THE GLASS GROUPS BY KIND (addendum 31 "order by fixed vs financial … Don't show A-U letters") — pure ───────────
{
  const B = await import("../lib/financial-2525/budget.ts");
  const g33 = L.groupByKind(B.SHEET_LINES, "days33");
  ok(L.KIND_ORDER.join(" ") === "Income Fixed Variable Transfer", "the kinds come in the brief's order: Income · Fixed · Variable · Transfer");
  ok(g33.map((g) => g.kind).join(" ") === "Income Fixed Variable", `the sheet groups into Income · Fixed · Variable — no Transfer group when no transfer line is on the plan (got ${g33.map((g) => g.kind).join(" ")})`);
  const tot = Object.fromEntries(g33.map((g) => [g.kind, g.total]));
  ok(near(tot.Income, 3200) && near(tot.Fixed, 2750) && near(tot.Variable, 650), `the sheet's totals per 33 days: Income 3,200 · Fixed 2,750 (rent 700 + auto 1,800 + insurance 200 + health 50) · Variable 650 (electric 150 + groceries 300 + fun 200) — got ${JSON.stringify(tot)}`);
  ok(near(tot.Income - tot.Fixed - tot.Variable, L.netLadder(B.SHEET_LINES, "days33").net), "the groups add up to the ladder's Net (−200 per 33 days)");
  const gDay = L.groupByKind(B.SHEET_LINES, "day");
  ok(near(gDay.find((g) => g.kind === "Fixed").total, 2750 / 33, 1e-9), "a group's total follows the period by the fixed factor (Fixed 2,750 / 33 per day)");
  ok(g33.every((g) => g.lines.every((l) => L.fieldOf(l.fieldId).kind === g.kind)), "every line sits under its own field's kind — the brief's lock decides, never the glass");
  const withTransfer = [...B.SHEET_LINES, { fieldId: "M.emergency_sinking", amountNative: 100, nativePeriod: "days33" }];
  ok(L.groupByKind(withTransfer, "days33").map((g) => g.kind).join(" ") === "Income Fixed Variable Transfer", "a transfer line brings the Transfer group, last");
  ok(L.groupByKind([], "days33").length === 0, "an empty plan has no groups (no $0 rows)");
}

// ── r.024 · THE BUDGET AS HE ASKED (addenda 48 · 50 · 55: "don't change budget inplementetion; this is way too complicated and I never
// asked for it" · "use selects deop down once for budget in edit mode" · his answer "One, shared"): the r.021–r.022 per-line MoT is gone;
// ONE unit — amounts are typed in the unit showing and kept on the 33-day base. A copy saved by r.021–r.022 still loads.
{
  const P = await import("../lib/financial-2525/plan.ts");
  const store = new Map(); globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  ok(!("lineSpec" in P) && !("setLineSpec" in P) && !("switchRec" in P) && !("isValidSpec" in P) && !("BUDGET_RECURRENCES" in P), "plan.ts no longer carries a per-line MoT (r.024 removes lineSpec · setLineSpec · switchRec · isValidSpec)");
  const sheet = P.sheetPlan();
  const rent = P.setLineAmount(sheet, "B.rent_mortgage", 700, "month").find((l) => l.fieldId === "B.rent_mortgage");
  ok(near(L.toPeriod(rent.amountNative, rent.nativePeriod, "month"), 700, 1e-9) && near(L.toPeriod(rent.amountNative, rent.nativePeriod, "quarter"), 700 * 91 / 30, 1e-9) && P.lineInUnit(rent, "month") === 700, "Rent typed as 700 per month (the default unit) reads $700 per month and $2,123.33 per 91-day quarter — one shared unit converts the view");
  ok(P.lineInUnit(rent, "minute") > 0 && near(P.lineInUnit(rent, "year"), Math.round(700 * 365 / 30 * 100) / 100, 0.011), "the same line reads per minute and per year from the one unit dropdown");
  const added = P.addLine(sheet, "C.fuel"); ok(added.some((l) => l.fieldId === "C.fuel" && l.amountNative === 0), "a line is added at zero and its amount typed on the line in the unit showing (r.020's add row)");
  store.set(P.planKey("eve"), JSON.stringify([{ fieldId: "B.rent_mortgage", amountNative: 700 * 33 / 30, nativePeriod: "days33", amount: 700, rec: "other", otherN: 30, otherUnit: "days" }]));
  const ev = P.loadPlan("eve");
  ok(ev.length === 1 && near(P.lineInUnit(ev[0], "days33"), 770, 0.01), "a plan saved by r.021–r.022 (Rent $700 every 30 days) still loads and reads the same rate — its extra fields are ignored");
  delete globalThis.localStorage;
}

// r.031 (addendum 62): the standard (Gregorian) month — the calendar month holding the instant, from its 1st, its real length
ok(L.calendarMonthDays(Date.UTC(2026, 9, 15, 12)) === 31 && L.calendarMonthDays(Date.UTC(2026, 10, 15, 12)) === 30 && L.calendarMonthDays(Date.UTC(2028, 1, 10, 12)) === 29 && L.calendarMonthDays(Date.UTC(2027, 1, 10, 12)) === 28, "calendarMonthDays: October 31 · November 30 · February 2028 29 · February 2027 28");
ok(L.calendarMonthDays(Date.UTC(2026, 10, 1, 3)) === 31, "the calendar month is read in Austin CST standard: 03:00 UTC on November 1 is still October 31 in Austin");
ok(L.setCalendarMonth(Date.UTC(2026, 9, 15, 12)) === 31 && L.PERIOD_SECONDS.calmonth === 31 * 86400 && near(L.toPeriod(3924.49, "month", "calmonth"), 3924.49 * 31 / 30, 1e-9) && !L.PERIODS.includes("calmonth"), "in October the standard month is 31 days: $3,924.49 per 30-day month reads $4,055.31 per calendar month; calmonth is not one of the nine fixed bases");

console.log(`financial-ladder: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
