/**
 * Financial-2525 · THE PERSONAL FINANCE LADDER A–U (operator 2026-09-30, addendum 22 — "the lock", v.000_r.012).
 * ====================================================================================================
 * One personal-finance model with two planes: FLOW (the ladder, sections A–M, cash velocity convertible across time bases)
 * and STOCK / STATUS (N–T, off the ladder, never per-minute). U is not a plane: it is an AMORTIZE RULE that spreads a lumpy
 * annual amount into the A–M field it names (mapsTo) — it never appears as a category of its own. Field labels are the
 * brief's slash-merged display names, exactly; one row per field on the ladder; components live only in a detail sheet.
 *
 * THE LADDER MATH (lock): I = Σ A · L = Σ (B+C+D+E+F+G+H+K+L) · Ds = Σ I · Tx = Σ J · Tr = Σ M ;  Net = I − L − Ds − Tx − Tr.
 * Income is positive; transfers are OUTFLOW on the ladder (they raise N/O); HSA/FSA in G is outflow (the invested balance is O);
 * extra principal in M is flow, the remaining balance stays in P; payment ≠ balance — P is never netted against I.
 *
 * PERIODS (fixed, the brief's table): second 1 · minute 60 · hour 3,600 · day 86,400 · week 7 d · 33 days · month 91 d · year
 * 365 d. Never a 30-day month. Switching period multiplies by a constant — no drift beyond cents. (The MoT's A.B..C whole stays
 * the exact 365.259636-day revolution — mot.ts; the ladder's "year" is the brief's 365-day period. Said here, on the record.)
 * Pure; no clock reads; no CAGR, no multiples, no QIS, no "safe / affordable" copy from Net.
 */

export type Plane = "flow" | "stock" | "goal" | "status";
export type SectionId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T";
export type FlowSectionId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M";
export type FieldKind = "Income" | "Fixed" | "Variable" | "Transfer" | "Stock" | "Goal";
/** The time bases (r.020, operator addendum 34 "use 91 day quarter which means 30.333 day month"): 91 days is a QUARTER and a month
 *  is one third of it — 91 ÷ 3 = 30.333… days, the pay MoT he gave on day one; three months make the quarter exactly. Supersedes the
 *  brief's "month (91)" (FD-25's month factor), by his word. */
export type Period = "second" | "minute" | "hour" | "day" | "week" | "days33" | "month" | "quarter" | "year" | "calmonth";
/** The nine FIXED bases. `calmonth` (r.031) is not among them: its length is the calendar's, not a constant. */
export const PERIODS: readonly Period[] = ["second", "minute", "hour", "day", "week", "days33", "month", "quarter", "year"];
const DAY = 86400;
/** THE STANDARD (GREGORIAN) MONTH (r.031, operator addendum 62 "standard month added before month 30.3 (1st day of Gregorian
 *  calendar, even though its not even nor does it reflect reality)"): the calendar month that holds the instant, from its 1st —
 *  28, 29, 30 or 31 days, in Austin CST standard (UTC−6). Pure. */
export function calendarMonthDays(ms: number): number {
  const d = new Date(ms - 6 * 3600 * 1000);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}
let calMonthDays = 365.2425 / 12;            // the mean Gregorian month until the surface names the month it is in
/** The surface sets the calendar month it is showing (the current one); the conversions below then use its real length. */
export function setCalendarMonth(ms: number): number { calMonthDays = calendarMonthDays(ms); return calMonthDays; }
/** The fixed factors — the brief's table with the operator's month (addendum 34) — and the calendar month, read when used. */
export const PERIOD_SECONDS = { second: 1, minute: 60, hour: 3600, day: DAY, week: 7 * DAY, days33: 33 * DAY, month: (91 / 3) * DAY, quarter: 91 * DAY, year: 365 * DAY } as Record<Period, number>;
Object.defineProperty(PERIOD_SECONDS, "calmonth", { get: () => calMonthDays * DAY, enumerable: false });

export interface Section { id: SectionId; name: string; plane: Plane; /** the lexicon suffix: fin.sec.<key> */ key: string }
/** A–M flow · N–P stock · Q–S status · T goal — in the brief's order; nothing past T here (U is a rule below). */
export const SECTIONS: readonly Section[] = [
  { id: "A", name: "Income", plane: "flow", key: "a" }, { id: "B", name: "Housing", plane: "flow", key: "b" }, { id: "C", name: "Transportation", plane: "flow", key: "c" },
  { id: "D", name: "Insurance", plane: "flow", key: "d" }, { id: "E", name: "Utilities", plane: "flow", key: "e" }, { id: "F", name: "Food", plane: "flow", key: "f" },
  { id: "G", name: "Health", plane: "flow", key: "g" }, { id: "H", name: "Family", plane: "flow", key: "h" }, { id: "I", name: "Debt service", plane: "flow", key: "i" },
  { id: "J", name: "Taxes", plane: "flow", key: "j" }, { id: "K", name: "Work", plane: "flow", key: "k" }, { id: "L", name: "Lifestyle", plane: "flow", key: "l" },
  { id: "M", name: "Transfers", plane: "flow", key: "m" },
  { id: "N", name: "Cash", plane: "stock", key: "n" }, { id: "O", name: "Investments", plane: "stock", key: "o" }, { id: "P", name: "Debts", plane: "stock", key: "p" },
  { id: "Q", name: "Net worth", plane: "status", key: "q" }, { id: "R", name: "Credit", plane: "status", key: "r" }, { id: "S", name: "Protection", plane: "status", key: "s" },
  { id: "T", name: "Goals", plane: "goal", key: "t" },
];
export const FLOW_SECTIONS: readonly FlowSectionId[] = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
export const isFlow = (s: SectionId): s is FlowSectionId => (FLOW_SECTIONS as readonly string[]).includes(s);
export const sectionOf = (id: SectionId): Section => SECTIONS.find((s) => s.id === id)!;

export interface Field { id: string; section: SectionId; label: string; plane: Plane; kind: FieldKind; /** lexicon suffix: fin.field.<key> */ key: string }
const F = (section: SectionId, slug: string, label: string, kind: FieldKind): Field => ({ id: `${section}.${slug}`, section, label, plane: sectionOf(section).plane, kind, key: `${section.toLowerCase()}_${slug}` });
/** The sixty fields, labels exactly as the brief writes them (slash-merged). 46 flow · 6 stock · 5 status · 3 goal. */
export const FIELDS: readonly Field[] = [
  F("A", "income_wages", "Income / Wages (take-home)", "Income"), F("A", "upside", "Upside: Overtime / Bonus / Gifts / Other", "Income"),
  F("A", "annuity_pension_disability", "Annuity / Pension / Disability", "Income"), F("A", "alimony_child_support", "Alimony / Child Support", "Income"),
  F("A", "capital_gains", "Capital Gains (realized)", "Income"),
  F("B", "rent_mortgage", "Rent / Mortgage", "Fixed"), F("B", "property_tax_hoa_fees", "Property Tax / HOA / Fees", "Fixed"), F("B", "housing_insurance", "Housing insurance", "Fixed"),
  F("B", "maintenance_repairs", "Home Maintenance & Repairs", "Variable"), F("B", "lawn_pest_security", "Lawn / Pest / Security", "Variable"), F("B", "other_fees", "Other Fees", "Variable"),
  F("C", "auto_payment", "Auto Payment", "Fixed"), F("C", "fuel", "Fuel", "Variable"), F("C", "maintenance_other", "Maintenance / Other", "Variable"),
  F("C", "rideshare_taxi", "Ride-share / Taxi", "Variable"), F("C", "airfare_other", "Airfare / Other", "Variable"),
  F("D", "health_dental_vision", "Health / Dental / Vision", "Fixed"), F("D", "auto_renters_home", "Auto / Renters / Home", "Fixed"),
  F("D", "life_disability", "Life / Disability", "Fixed"), F("D", "umbrella_pet_other", "Umbrella / Pet / Other", "Fixed"),
  F("E", "electric_gas", "Electric / Gas", "Variable"), F("E", "water_sewer_trash", "Water / Sewer / Trash", "Variable"),
  F("E", "internet_phone", "Internet / Phone", "Fixed"), F("E", "subscriptions_ai_cloud", "Subscriptions / AI / Cloud", "Fixed"),
  F("F", "groceries", "Groceries", "Variable"), F("F", "dining_work", "Dining / Work", "Variable"), F("F", "alcohol", "Alcohol (or Fun)", "Variable"),
  F("G", "copays_deductibles_rx", "Copays / Deductibles / Rx", "Variable"), F("G", "hsa_fsa", "HSA / FSA contributions", "Fixed"),
  F("G", "mental_physical", "Mental Health / Physical Fitness", "Fixed"), F("G", "personal_care_devices", "Personal Care / Medical Devices", "Variable"),
  F("H", "childcare_elderly_education", "Childcare / Elderly Care / Education", "Fixed"), F("H", "pets", "Pets (food, vet, insurance)", "Variable"),
  F("I", "cards_student", "Credit Cards / Student Loans", "Fixed"), F("I", "other_loans", "Personal / Medical / Tax / Other Loans", "Fixed"),
  F("J", "federal_state_income", "Federal / State income tax", "Fixed"), F("J", "fica_self_employment", "FICA / Self-employment tax", "Fixed"), F("J", "tax_preparation", "Tax preparation", "Variable"),
  F("K", "gear_licenses_tools", "Gear / Licenses / Tools", "Variable"), F("K", "education_certifications", "Education / Certifications", "Variable"),
  F("L", "fun_hobbies_clothing", "Fun / Hobbies / Clothing", "Variable"), F("L", "gifts_holidays_travel", "Gifts / Holidays / Travel", "Variable"), F("L", "giving_charity", "Giving / Charity", "Variable"),
  F("M", "emergency_sinking", "Emergency / Sinking funds", "Transfer"), F("M", "retirement_brokerage_529", "Retirement / Brokerage / 529", "Transfer"), F("M", "extra_debt_mortgage", "Extra debt / Extra mortgage", "Transfer"),
  F("N", "checking_savings_cash", "Checking / Savings / Cash", "Stock"),
  F("O", "retirement_accounts", "Retirement accounts", "Stock"), F("O", "brokerage_hsa_529", "Brokerage / HSA / 529", "Stock"), F("O", "property_business_other", "Property / Business / Other", "Stock"),
  F("P", "mortgage_auto", "Mortgage / Auto", "Stock"), F("P", "cards_student_other", "Cards / Student / Other", "Stock"),
  F("Q", "assets_minus_debts", "Assets − Debts", "Stock"), F("Q", "liquid_home_invested", "Liquid / Home / Invested", "Stock"),
  F("R", "score_utilization_collections", "Score / Utilization / Collections", "Stock"),
  F("S", "will_beneficiaries_poa", "Will / Beneficiaries / POA", "Stock"), F("S", "id_docs_umbrella", "ID / Docs / Umbrella", "Stock"),
  F("T", "cash_buffer_debt_free", "Cash buffer / Debt-free date", "Goal"), F("T", "house_vehicle_travel_school", "House / Vehicle / Travel / School", "Goal"), F("T", "retirement_business", "Retirement / Business", "Goal"),
];
export const fieldOf = (id: string): Field | undefined => FIELDS.find((f) => f.id === id);
export const fieldsOf = (section: SectionId): Field[] => FIELDS.filter((f) => f.section === section);
export const FLOW_FIELDS: readonly Field[] = FIELDS.filter((f) => isFlow(f.section));

/** Alcohol may map to F or L — ONE target (rule 6). The default is the brief's own row, F. */
export type AlcoholTarget = "F" | "L";
export const alcoholSection = (target: AlcoholTarget = "F"): FlowSectionId => target;

/** A line on the ladder: an amount in the period the person entered it. */
export interface LadderLine { fieldId: string; amountNative: number; nativePeriod: Period }
/** An amount in one period, re-expressed in another — a constant multiplier, never a rounding step (round only to print). */
export const toPeriod = (amount: number, from: Period, to: Period): number => (amount * PERIOD_SECONDS[to]) / PERIOD_SECONDS[from];

/** THE GLASS GROUPS BY KIND (r.018, operator addendum 31 "order by fixed vs financial, and have expand button so this is not so busy.
 *  Don't show A-U letters"): the budget's lines grouped by the sheet's own kinds — Income · Fixed · Variable · Transfer — in that
 *  order, each group with its total in the chosen period; a kind with no line on the plan is absent (no $0 row). The sections A–M
 *  and their letters stay in the model and the record; the glass shows a line's section by its icon and name only. */
export const KIND_ORDER: readonly FieldKind[] = ["Income", "Fixed", "Variable", "Transfer"];
export interface KindGroup { kind: FieldKind; lines: LadderLine[]; total: number }
export function groupByKind(lines: readonly LadderLine[], period: Period): KindGroup[] {
  const out: KindGroup[] = [];
  for (const kind of KIND_ORDER) {
    const ls = lines.filter((l) => fieldOf(l.fieldId)?.kind === kind);
    if (!ls.length) continue;
    out.push({ kind, lines: ls, total: ls.reduce((a, l) => a + toPeriod(l.amountNative, l.nativePeriod, period), 0) });
  }
  return out;
}
export const periodFactor = (from: Period, to: Period): number => PERIOD_SECONDS[to] / PERIOD_SECONDS[from];

export interface LadderTotals {
  period: Period;
  sections: Record<FlowSectionId, number>;   // Σ of each flow section in `period`
  income: number; living: number; debtService: number; taxes: number; transfers: number;
  net: number;                                 // I − L − Ds − Tx − Tr
  warnings: string[];                          // rule 5: a premium in both B and D
}
const LIVING: readonly FlowSectionId[] = ["B", "C", "D", "E", "F", "G", "H", "K", "L"];
/** The ladder in one period: section sums and the locked Net equation. Unknown or non-flow fields are ignored (never counted). */
export function netLadder(lines: readonly LadderLine[], period: Period, alcohol: AlcoholTarget = "F"): LadderTotals {
  const sections = Object.fromEntries(FLOW_SECTIONS.map((s) => [s, 0])) as Record<FlowSectionId, number>;
  const seen = new Set<string>();
  for (const l of lines) {
    const f = fieldOf(l.fieldId); if (!f || !isFlow(f.section) || !(l.amountNative > 0)) continue;
    const section = f.id === "F.alcohol" ? alcoholSection(alcohol) : f.section;
    sections[section] += toPeriod(l.amountNative, l.nativePeriod, period); seen.add(f.id);
  }
  const income = sections.A, living = LIVING.reduce((s, k) => s + sections[k], 0), debtService = sections.I, taxes = sections.J, transfers = sections.M;
  const warnings: string[] = [];
  if (seen.has("B.housing_insurance") && seen.has("D.auto_renters_home")) warnings.push("DUPLICATE_INSURANCE");   // rule 5 — warn; the detail sheet decides which premium is the policy; Net counts what was entered
  return { period, sections, income, living, debtService, taxes, transfers, net: income - living - debtService - taxes - transfers, warnings };
}

/** U — the amortize rule: a lumpy amount over `periodDays` (premiums · taxes · registration · holidays · travel · tuition ·
 *  deductibles) becomes a per-`to` addition into the A–M field it names. Refuses a non-flow destination; U is never a section. */
export interface Amortization { amount: number; periodDays: number; mapsTo: string }
export function amortize(u: Amortization, to: Period): { fieldId: string; amount: number } | { refused: "NOT_A_FLOW_FIELD" | "PERIOD" } {
  const f = fieldOf(u.mapsTo); if (!f || !isFlow(f.section)) return { refused: "NOT_A_FLOW_FIELD" };
  if (!(u.periodDays > 0)) return { refused: "PERIOD" };
  return { fieldId: f.id, amount: (u.amount / (u.periodDays * DAY)) * PERIOD_SECONDS[to] };
}

/** A transaction's timeline (addendum 22): the length its money covers, from its date. `once` covers no length (an instant). */
export type Recurrence = "once" | "weekly" | "paymot" | "days33" | "month91" | "yearly" | "other";
export const RECURRENCES: readonly Recurrence[] = ["once", "weekly", "paymot", "days33", "month91", "yearly", "other"];
/** The length a preset covers, in days; `paymot` is the MONTH — 91 ÷ 3 = 30.333 days — and `month91` the QUARTER of 91 days (r.020,
 *  addendum 34; the ids stay so every recorded entry keeps its meaning, only the words on the glass changed); `other` carries its own length (the entry's motDays, typed as a
 *  number with its unit — years · days · hours · minutes — addendum 25); `once` covers no length. */
export const PAY_MOT_DAYS = 91 / 3;
export const recurrenceDays = (r: Recurrence | undefined): number => (r === "weekly" ? 7 : r === "paymot" ? PAY_MOT_DAYS : r === "days33" ? 33 : r === "month91" ? 91 : r === "yearly" ? 365 : 0);
/** The units a manual length may be typed in (addendum 25: "MoT selectable to Year, Days, hrs, min"), each in days. */
export type LengthUnit = "minutes" | "hours" | "days" | "years";
export const LENGTH_UNITS: readonly LengthUnit[] = ["minutes", "hours", "days", "years"];
export const LENGTH_UNIT_DAYS: Record<LengthUnit, number> = { minutes: 1 / 1440, hours: 1 / 24, days: 1, years: 365 };
/** The length an entry covers, in days: a preset's, or — for `other` — the typed number in its unit. */
export const lengthDays = (r: Recurrence, otherN: number, unit: LengthUnit): number => (r === "other" ? Math.max(0, otherN || 0) * LENGTH_UNIT_DAYS[unit] : recurrenceDays(r));

/** The $/min a transaction runs at from its date for its length; `once` runs at nothing (it lands whole at its instant). */
export const ratePerMinute = (amount: number, days: number): number => (days > 0 ? amount / (days * 1440) : 0);
export interface TimedTx { fieldId?: string; amount: number; atMs: number; days: number }
/** Each transaction's money spread over its own length, summed per field over a window — the "$/min against budget" the operator
 *  wants to track: the overlap of [atMs, atMs + days] with [fromMs, toMs] at the transaction's own rate; `once` lands whole if
 *  its instant is inside the window. Returns amounts in the window, and the average $/min over the window per field. */
export function actualsByField(txs: readonly TimedTx[], fromMs: number, toMs: number): Record<string, { amount: number; perMinute: number }> {
  const out: Record<string, { amount: number; perMinute: number }> = {};
  const windowMin = Math.max(0, (toMs - fromMs) / 60000);
  for (const tx of txs) {
    const key = tx.fieldId ?? "?";
    let amount = 0;
    if (tx.days > 0) { const end = tx.atMs + tx.days * DAY * 1000; const a = Math.max(fromMs, tx.atMs), b = Math.min(toMs, end); if (b > a) amount = tx.amount * ((b - a) / (end - tx.atMs)); }
    else if (tx.atMs >= fromMs && tx.atMs < toMs) amount = tx.amount;
    if (!amount) continue;
    const cur = out[key] ?? { amount: 0, perMinute: 0 }; cur.amount += amount; cur.perMinute = windowMin > 0 ? cur.amount / windowMin : 0; out[key] = cur;
  }
  return out;
}
