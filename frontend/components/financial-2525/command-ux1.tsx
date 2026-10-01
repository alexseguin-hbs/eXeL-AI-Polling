"use client";

/**
 * FINANCIAL-2525 · Command UX 1 — the MoT Financial System on the ◬ ♡ 웃 Session shell (operator 2026-09-30, r.002).
 * ====================================================================================================
 * "financial 2525 uses shell from as UI/UX STARTING POINT FROM ◬ ♡ 웃 Session" (addendum 7) · "remember max R-CORE
 * REUSE · BEHIND SCENES IS A.B..C but UX IS DEFAULTED IN day hour, Min" (addendum 8).
 *
 * So this screen IS the Session's screen with money in it: the same root (mx-auto max-w-3xl), the same header (the
 * globe, the Trinity glyphs, a title), the same one card with the heading row and the phase pill, the same phase rail
 * (PodPhaseRail, railing DEPOSIT ◬ · HOLD ♡ · RELEASE ♡ · WITHDRAW 웃 · RECORD 웃), the same "your turn" guide card,
 * the same roster list, the same ACTIVE clock block (the big mono number is money released, ticking at $/min), the
 * same phone strip, the same folded Trinity logo, the same footer line — every piece imported from the Session's own
 * components or carrying its exact classes. Nothing here is drawn twice. Money and time come from the pure laws in
 * lib/financial-2525 (deterministic, clock-free); the one clock on the surface is the 1 Hz tick that feeds them `now`.
 * The chart stays under the vector law (strokes only); its glass reads day · hour · minute, A.B..C on reveal — the
 * MoT-icon ⇄ Clock-icon toggle, ONE state for the whole card (addendum 13). Every time conversion reads the PLANET LTU
 * TABLE the operator edits in the Admin panel (lib/planet-ltu.ts via lib/financial-2525/planets.ts): the selected planet's
 * whole (its revolution = 3600 A), its day, hours, minutes, seconds and year anchor (addendum 12 — "everything should
 * modularly adjust"). A.B..C is the standard for all planets; the glass converts to the planet's LTU.
 */
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, ChevronRight, Clock, Orbit, Pencil, Settings, X } from "lucide-react";
import { CategoryIcon, SectionIcon } from "@/components/financial-2525/category-icon";   // addendum 19: every category carries its icon; r.012: every section too
import { useAuth0 } from "@auth0/auth0-react";
import { useLexicon } from "@/lib/lexicon-context";
import { useThemeHue } from "@/lib/theme-hue";
import { SoiGlobe } from "@/components/soi-globe";
import { TrinityGlyphs } from "@/components/trinity-glyphs";
import { SoITrinity } from "@/components/soi-trinity";
import { PodPhaseRail } from "@/components/pod-phase-rail";
import type { PodPhaseDef } from "@/lib/pod-phases";
import { hhmmss } from "@/lib/pod-clock";
import { VECTOR_LAW } from "@/lib/wire-core/vector-law";
import { TRINITY_COLORS } from "@/lib/trinity-palette";
import { versionStamp } from "@/lib/2525-core/version-stamp";
import { RCoreBadge } from "@/components/2525-core/rcore-badge";
import { fromLedgerJson } from "@/lib/2525-core/revisions";
import { FINANCIAL_LEDGER } from "@/lib/2525-core/financial-ledger.gen";
import { FINANCIAL_DOMAIN as SRC } from "@/lib/financial-2525/domain.gen";
import { fmtMot, spanABC, fmtStampCST, parseStampCST, fmtDays, dayTicks, dateLabel, cstParts, DATE_FMTS, type DateFmt } from "@/lib/financial-2525/mot";
import { positionInYear } from "@/lib/financial-2525/calendar";
import { readPlanetLtu, PLANET_LTU_KEYS } from "@/lib/financial-2525/planets";
import { planetRow, daySecOf, PLANET_LTU_SEED, type PlanetLtuRow } from "@/lib/planet-ltu";
import { balanceAt, series, validateWithdrawal, depositView, type FinTx, type TxKind } from "@/lib/financial-2525/accrual";
import { type BudgetCategory } from "@/lib/financial-2525/budget";
import { loadPlan, savePlan, clearPlan, sheetPlan, planOrSheet, setLineAmount, addLine, removeLine, lineInUnit } from "@/lib/financial-2525/plan";   // r.016: the person's plan — edit mode on the budget (addendum 28)
import { FLOW_SECTIONS, fieldsOf, fieldOf, netLadder, toPeriod, groupByKind, RECURRENCES, LENGTH_UNITS, lengthDays, type SectionId, type FlowSectionId, type Recurrence, type LengthUnit, type Period, type LadderLine, type FieldKind } from "@/lib/financial-2525/ladder";   // addendum 22: the Personal Finance Ladder A–U — the lock
import { append, loadRecord, saveRecord, replay, emptyRecord, type FinRecord } from "@/lib/financial-2525/record";

const FINANCIAL_RCORE_HISTORY = fromLedgerJson(FINANCIAL_LEDGER);
const C = TRINITY_COLORS;
const usd = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
const usd4 = (cents: number) => (cents < 0 ? "-$" : "$") + Math.abs(cents / 100).toFixed(4);
const CAT_KEY: Record<BudgetCategory, string> = { Income: "income", Home: "home", Auto: "auto", Insurance: "insurance", Utilities: "utilities", Fitness: "fitness", Fun: "fun", Groceries: "groceries", "Dining Out": "dining_out", Other: "other" };
/** The Session's own classes, reused verbatim. */
const CARD = "mt-8 rounded-xl border border-border bg-card p-5";
const SUB = "mb-4 rounded-lg border border-border p-3 text-sm";
const ACCENT_SUB = "mb-4 rounded-lg border border-cyan-500/40 bg-cyan-500/5 p-3 text-sm";
const LABEL = "text-xs font-semibold uppercase tracking-wide text-cyan-400";
const PRIMARY = "min-h-[44px] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";
const SECONDARY = "min-h-[44px] rounded-md border border-border px-4 py-2 text-sm";
const INPUT = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring";
const PICK = "w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground landscape:py-1 landscape:text-xs";

/** THE PICKER LAW (r.014, operator addendum 26 "this drop down goes away quick!"): a dropdown stays open until the person picks.
 *  Every picker is a MODULE-LEVEL component with a stable identity. A component declared inside the surface's render body is a new
 *  type on every render, and the once-a-second clock that drives $/min re-renders the surface — React then unmounts and remounts
 *  the <select> every second, and the phone's picker sheet is dismissed with the element it belonged to (r.006's CategorySelect,
 *  r.012's LadderPicker). Gated at the source (financial-surface) and on the glass (the r.014 capture: the same DOM node three ticks later). */
function LadderPicker({ section, field, rec, onSection, onField, onRec, otherN, onOtherN, otherUnit, onOtherUnit, t, hook }: {
  section: FlowSectionId; field: string; rec: Recurrence; onSection: (s: FlowSectionId) => void; onField: (f: string) => void; onRec: (r: Recurrence) => void;
  otherN: string; onOtherN: (n: string) => void; otherUnit: LengthUnit; onOtherUnit: (u: LengthUnit) => void; t: (k: string) => string; hook: string;
}) {
  const secLabel = (sec: SectionId) => t(`fin.sec.${sec.toLowerCase()}`);
  const fieldLabel = (id: string) => { const f = fieldOf(id); return f ? t(`fin.field.${f.key}`) : id; };
  return (
    <>
      <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground"><span><SectionIcon section={section} className="mr-1" />{t("fin.section")}</span>
        <select data-fin-section={hook} className={PICK} value={section} onChange={(e) => { const sec = e.target.value as FlowSectionId; onSection(sec); onField(fieldsOf(sec)[0].id); }}>
          {FLOW_SECTIONS.map((sec) => <option key={sec} value={sec}>{secLabel(sec)}</option>)}
        </select>
      </label>
      <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground">{t("fin.field")}
        <select data-fin-field={hook} className={PICK} value={field} onChange={(e) => onField(e.target.value)}>
          {fieldsOf(section).map((f) => <option key={f.id} value={f.id}>{fieldLabel(f.id)}</option>)}
        </select>
      </label>
      <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground">{t("fin.length")}
        <select data-fin-length={hook} className={PICK} value={rec} onChange={(e) => onRec(e.target.value as Recurrence)}>
          {/* r.028 (addendum 58 "remove all 33 day reference"): the 33-day preset is not offered; old entries keep their meaning */}
          {RECURRENCES.filter((r) => r !== "days33" || rec === "days33").map((r) => <option key={r} value={r}>{t(`fin.rec.${r}`)}</option>)}
        </select>
      </label>
      {rec === "other" && (
        <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground">{t("fin.rec.other")}
          <span className="flex gap-2">
            <input data-fin-length-n={hook} className={INPUT} inputMode="decimal" value={otherN} onChange={(e) => onOtherN(e.target.value)} />
            <select data-fin-length-unit={hook} className={PICK} value={otherUnit} onChange={(e) => onOtherUnit(e.target.value as LengthUnit)}>
              {LENGTH_UNITS.map((u) => <option key={u} value={u}>{t(`fin.u.${u}`)}</option>)}
            </select>
          </span>
        </label>
      )}
    </>
  );
}

/** The four phases of one deposit, on the Session's rail: DEPOSIT ◬ · RELEASE ♡ · WITHDRAW 웃 · RECORD 웃 (no hold since r.028 — addendum 57). */
/** The Released card's rate units (r.024, addendum 46): shorthand on the glass, per hour by default. */
type RateUnit = "sec" | "min" | "hr" | "day";
const RATE_UNITS: readonly RateUnit[] = ["sec", "min", "hr", "day"];
/** The Clock ⇄ MoT pair (r.025 on the chart; r.030 the year card too, addendum 61): Clock = standard, MoT = the orbit's A.B..C. */
function ClockMotToggle({ abc, onChange, t, hook }: { abc: boolean; onChange: (v: boolean) => void; t: (k: string) => string; hook: string }) {
  return (
    <div role="group" data-fin-abc-toggle={hook} className="flex overflow-hidden rounded-md border border-border">
      <button type="button" aria-pressed={!abc} aria-label={t("fin.show_ltu")} title={t("fin.show_ltu")} onClick={() => onChange(false)} className={`flex h-8 w-9 items-center justify-center ${!abc ? "text-cyan-500 ring-1 ring-inset ring-cyan-500" : "text-muted-foreground"}`}><Clock size={16} strokeWidth={1.5} aria-hidden /></button>
      <button type="button" aria-pressed={abc} aria-label={t("fin.show_abc")} title={t("fin.show_abc")} onClick={() => onChange(true)} className={`flex h-8 w-9 items-center justify-center ${abc ? "text-cyan-500 ring-1 ring-inset ring-cyan-500" : "text-muted-foreground"}`}><Orbit size={16} strokeWidth={1.5} aria-hidden /></button>
    </div>
  );
}
/** The chart's date-text angles (r.028, addendum 58): flat, 30° (default), 45°, upright. */
const DATE_ANGLES = [0, 30, 45, 90] as const;
type DateAngle = (typeof DATE_ANGLES)[number];
export const FIN_PHASES: PodPhaseDef[] = [
  { key: "deposit", labelKey: "fin.ph.deposit", earnsKey: "fin.ph.deposit_earns", glyph: "◬" },
  { key: "release", labelKey: "fin.ph.release", earnsKey: "fin.ph.release_earns", glyph: "♡" },
  { key: "withdraw", labelKey: "fin.ph.withdraw", earnsKey: "fin.ph.withdraw_earns", glyph: "웃" },
  { key: "record", labelKey: "fin.ph.record", earnsKey: "fin.ph.record_earns", glyph: "웃" },
];
/** Where one deposit stands at `now` — pure, from the accrual law. */
export function phaseOf(focus: FinTx | null, withdrawals: number, now: number): string {
  if (!focus || now < focus.atMs) return "deposit";
  const v = depositView(focus, now);
  if (v.fraction >= 1) return "record";
  return withdrawals > 0 ? "withdraw" : "release";
}

/** The worked example as data — the operator's paycheck (amount · deposit day and time · MoT), never invented. */
const EXAMPLE: FinTx = {
  id: "example-d1", kind: "deposit", amountCents: Math.round(SRC.example.amountUsd * 100),
  atMs: parseStampCST(SRC.example.depositStamp) ?? 0, motDays: SRC.example.motDays, memo: SRC.example.memo, payer: "example", category: "Income", field: "A.income_wages", recurrence: "paymot",
};

export function FinancialCommandUX1() {
  const { t, activeLocale } = useLexicon();
  const hue = useThemeHue();
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const stamp = useMemo(() => versionStamp(`v${SRC.project.revision}`), []);
  // The one clock on the surface: null until mounted (a server render has no "now" — a hydration mismatch is a white page).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  // The Planet LTU table from the Admin panel (seed on the server render; the device's copy after mount; other tabs' edits via storage)
  const [planets, setPlanets] = useState<PlanetLtuRow[]>(() => [...PLANET_LTU_SEED]);
  const [planetCode, setPlanetCode] = useState("earth");
  useEffect(() => {
    setPlanets(readPlanetLtu());
    const onStorage = (e: StorageEvent) => { if (!e.key || PLANET_LTU_KEYS.includes(e.key)) setPlanets(readPlanetLtu()); };
    window.addEventListener("storage", onStorage); return () => window.removeEventListener("storage", onStorage);
  }, []);
  const planet = planetRow(planets, planetCode);
  const dayMs = daySecOf(planet) * 1000;                       // one LTU day of the selected planet (Earth hours for every planet for now)
  // ONE reveal state for the whole card: the MoT icon (A.B..C) ⇄ the Clock icon (the planet's LTU) — addendum 13
  const [showAbc, setShowAbc] = useState(false);
  const [yearAbc, setYearAbc] = useState(false);                 // r.030 (addendum 61): the year card's own toggle, standard by default
  const [rateUnit, setRateUnit] = useState("hr" as RateUnit);
  const [accrualGear, setAccrualGear] = useState(false);          // r.028: the Accrual Units settings, closed by default   // r.024: the Released card's rate, per hour by default (addendum 46)
  // r.025 (addendum 42 + his answer "Gear on the chart"): the chart's date format, 2026.10.01 by default, remembered on this phone
  const [dateFmt, setDateFmt] = useState("full" as DateFmt);
  useEffect(() => { try { const v = localStorage.getItem("fin-date-fmt"); if (v && (DATE_FMTS as readonly string[]).includes(v)) setDateFmt(v as DateFmt); } catch { /* storage unreadable: the default stands */ } }, []);
  const pickDateFmt = (f: DateFmt) => { setDateFmt(f); try { localStorage.setItem("fin-date-fmt", f); } catch { /* not remembered; still shown */ } };
  // r.028 (addendum 58 "Settings should open up date format for table, and angle for chart text"): the date text's angle, remembered
  const [dateAngle, setDateAngle] = useState(30 as DateAngle);
  useEffect(() => { try { const v = Number(localStorage.getItem("fin-date-angle")); if ((DATE_ANGLES as readonly number[]).includes(v)) setDateAngle(v as DateAngle); } catch { /* the default stands */ } }, []);
  const pickDateAngle = (a: DateAngle) => { setDateAngle(a); try { localStorage.setItem("fin-date-angle", String(a)); } catch { /* not remembered; still shown */ } };

  // The person's record on this device, under their own key — loaded on sign-in, verified before it is trusted.
  const owner = isAuthenticated && user?.sub ? user.sub : null;
  const [record, setRecord] = useState<FinRecord>(() => emptyRecord("nobody"));
  const [tampered, setTampered] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  useEffect(() => { if (!owner) return; const r = loadRecord(owner); setRecord(r.rec); setTampered(r.tampered); }, [owner]);

  const txs: FinTx[] = owner ? replay(record) : [EXAMPLE];
  const at = now ?? 0;
  const bal = balanceAt(txs, at);
  const deposits = txs.filter((x) => x.kind === "deposit").sort((a, b) => b.atMs - a.atMs);
  const withdrawals = txs.filter((x) => x.kind === "withdrawal");
  const focus = deposits[0] ?? null;
  const phase = phaseOf(focus, withdrawals.length, at);
  const phaseDef = FIN_PHASES.find((p) => p.key === phase) ?? FIN_PHASES[0];
  /** The live rate in the unit picked — the $/min times the planet's own seconds, hours and days (cents). */
  const rateIn = (u: RateUnit): number => (u === "sec" ? bal.ratePerMinCents / planet.secPerMin : u === "min" ? bal.ratePerMinCents : u === "hr" ? bal.ratePerMinCents * planet.minPerHour : bal.ratePerMinCents * planet.hoursPerDay * planet.minPerHour);
  const focusView = focus && now ? depositView(focus, at) : null;
  const year = now ? positionInYear(now, planet.yearAnchor, planet.yearDays) : null;
  // THE LADDER'S UNIT (addendum 17 → 20 → 21 → 22): one dropdown of the brief's eight periods with FIXED factors — second · minute 60 ·
  // hour 3,600 · day 86,400 · week 7 d · 33 d · month 30.3̅ d · quarter 91 d · year 365 d. ONE SHARED UNIT (r.024, his answer "One, shared"):
  // in edit mode the amounts are typed in the unit picked; out of edit mode it converts the view. Per month (30.3̅ days) is the default
  // (addendum 41 "personal budget should be defaulted to 30.3 repeating").
  type BudgetUnit = "sec" | "min" | "hour" | "day" | "week" | "m33" | "month" | "quarter" | "year";
  const [budgetUnit, setBudgetUnit] = useState<BudgetUnit>("month");
  const UNITS: { key: BudgetUnit; label: string; period: Period }[] = [
    { key: "sec", label: t("fin.per_sec"), period: "second" }, { key: "min", label: t("fin.per_min"), period: "minute" }, { key: "hour", label: t("fin.per_hour"), period: "hour" },
    { key: "day", label: t("fin.per_day"), period: "day" }, { key: "week", label: t("fin.per_week"), period: "week" },
    { key: "month", label: t("fin.per_month"), period: "month" }, { key: "quarter", label: t("fin.per_quarter"), period: "quarter" }, { key: "year", label: t("fin.per_year"), period: "year" },
  ];
  const period: Period = UNITS.find((u) => u.key === budgetUnit)?.period ?? "month";   // r.028: no 33-day unit on the glass (addendum 58)
  // the ladder in the chosen period: thirteen sections A–M and the locked Net = I − L − Ds − Tx − Tr (the sheet's lines on the fields)
  // THE PERSON'S PLAN (r.016, addendum 28): the sheet until the device holds the person's own; edit mode behind the pencil; every
  // figure, section total and Net below follows the plan. Drafts hold the typed text while editing so a half-typed "12." survives
  // the once-a-second clock; a figure is written on the 33-day base through setLineAmount, never read back into the input mid-type.
  const [plan, setPlan] = useState(() => sheetPlan() as LadderLine[]);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState({} as Record<string, string>);
  const [addSec, setAddSec] = useState("A" as FlowSectionId); const [addField, setAddField] = useState("A.income_wages");
  useEffect(() => { if (!owner) { setPlan(sheetPlan()); setEditing(false); return; } setPlan(planOrSheet(loadPlan(owner))); }, [owner]);
  const writePlan = (next: LadderLine[]) => { setPlan(next); if (owner && !savePlan(owner, next)) setSaveFailed(true); };
  // THE BUDGET AS HE ASKED (r.024, addenda 48 · 50: "don't change budget inplementetion; this is way too complicated and I never asked for
  // it"): the r.021–r.022 per-line MoT dropdowns are gone; a line's amount is typed in the unit showing and kept on the 33-day base.
  const typeAmount = (fieldId: string, text: string) => { setDrafts((d) => ({ ...d, [fieldId]: text })); const n = Number(text); if (text.trim() !== "" && Number.isFinite(n)) writePlan(setLineAmount(plan, fieldId, n, period)); };
  // r.026: per second / minute / hour a line is a fraction of a dollar — edit mode shows four decimals there (cents elsewhere), so
  // retyping the figure shown never moves the line (0.07 typed for $0.0673/min was +3.9%)
  const editFigure = (l: LadderLine) => { const v = toPeriod(l.amountNative, l.nativePeriod, period); return Math.abs(v) < 100 ? Math.round(v * 10000) / 10000 : lineInUnit(l, period); };
  const addable = fieldsOf(addSec).filter((f) => !plan.some((l) => l.fieldId === f.id));
  const totals = useMemo(() => netLadder(plan, period), [plan, period]);
  // THE GLASS GROUPS BY KIND, COLLAPSED (r.018, addendum 31 "order by fixed vs financial, and have expand button so this is not so busy.
  // Don't show A-U letters"): Income · Fixed · Variable (· Transfers) each one row with its total and a chevron; the lines show only
  // when a group is opened — or in edit mode, which opens every group so its fields are reachable. No letter reaches the glass.
  const groups = useMemo(() => groupByKind(plan, period), [plan, period]);
  const [openKinds, setOpenKinds] = useState([] as FieldKind[]);
  const isOpen = (k: FieldKind) => editing || openKinds.includes(k);
  const toggleKind = (k: FieldKind) => setOpenKinds((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]));
  const kindLabel = (k: FieldKind) => (k === "Transfer" ? t("fin.sec.m") : t(`fin.${k.toLowerCase()}`));
  const inPeriod = (l: { amountNative: number; nativePeriod: Period }) => toPeriod(l.amountNative, l.nativePeriod, period);
  const usdDollars = (x: number) => usdUnit(x * 100);
  const usdUnit = (cents: number) => (Math.abs(cents) >= 100 ? usd(Math.round(cents)) : usd4(cents));
  const signIn = () => loginWithRedirect({ appState: { returnTo: `${SRC.project.route}/` } });

  // ── forms ──────────────────────────────────────────────────────────────────────────────────────────────────
  // ONE transaction form (addendum 24 "there should be just transaction, with type on drop down"): the TYPE is the first dropdown;
  // amount · day and time · section · field · timeline · memo are shared; the MoT length shows only for a deposit; one button.
  // ONE DOOR, FOLDED (r.023, addenda 36 · 38 · 55): "deposit should be transaction. and user selects deposit or withdrawal" · "Transaction
  // should say + Transaction button so the full entry does not shown all the time.  Only expand when pressed". The entry is folded behind
  // + Transaction; every door opens it with the TYPE BLANK (his answer: "Blank until picked") — the person picks Deposit / Funds or
  // Withdrawal / Expense and the record button waits until then; after a recorded transaction it folds back (his answer: "Folds back").
  const [txType, setTxType] = useState("" as TxKind | "");
  const [formOpen, setFormOpen] = useState(false);
  const scrollOnOpen = useRef(false);
  const [amt, setAmt] = useState(""); const [when, setWhen] = useState(""); const [memo, setMemo] = useState("");
  // the LENGTH (addendum 25): a dropdown of presets with Other — a number in its unit (years · days · hours · minutes); ONE control for the MoT and the timeline
  const [otherN, setOtherN] = useState(""); const [otherUnit, setOtherUnit] = useState("days" as LengthUnit);
  // the personal-finance element of the entry (addendum 16): a deposit is Income by default, a withdrawal Mortgage/Rent (the sheet's first fixed line)
  // addendum 22 (FD-26, the delegated decision): TWO dropdowns — the SECTION A–M, then the FIELD within it — and the TIMELINE the
  // transaction's money covers from its date; every picker the panel's full width in portrait (FD-24). A deposit starts on A ·
  // Income / Wages every 33 days (the pay MoT); a withdrawal on B · Rent / Mortgage, one time.
  const [sec, setSec] = useState("A" as FlowSectionId); const [field, setField] = useState("A.income_wages"); const [rec, setRec] = useState("paymot" as Recurrence);
  // choosing the type re-seats the picker on its default: a deposit on A · Income / Wages every 33 days, a withdrawal on B · Rent / Mortgage once
  const chooseType = (k: TxKind | "") => { setTxType(k); if (k === "") return; if (k === "deposit") { setSec("A"); setField("A.income_wages"); setRec("paymot"); } else { setSec("B"); setField("B.rent_mortgage"); setRec("once"); } };
  /** Every door opens the ONE folded form with the type blank (r.023); the scroll waits for the form to be on the page. */
  const openForm = () => { if (formOpen) { goTo("fin-transaction-form"); return; } setTxType(""); setRefusal(null); scrollOnOpen.current = true; setFormOpen(true); };
  const foldForm = () => { setFormOpen(false); setTxType(""); setRefusal(null); };
  const catLabel = (c: BudgetCategory) => t(`fin.cat.${CAT_KEY[c]}`);   // the record's r.006–r.011 entries still print their category
  const fieldLabel = (id: string) => { const f = fieldOf(id); return f ? t(`fin.field.${f.key}`) : id; };
  const secLabel = (sec: SectionId) => t(`fin.sec.${sec.toLowerCase()}`);
  const [refusal, setRefusal] = useState<string | null>(null);
  const commit = (tx: FinTx) => { const next = append(record, tx, at); setRecord(next); if (!saveRecord(next)) setSaveFailed(true); };
  /** What an entry is for — its ladder field (r.012) or, for the r.006–r.011 entries, its category; icon before the word. */
  const txWhat = (tx: FinTx): ReactNode => {
    if (tx.field) { const sec = fieldOf(tx.field)?.section ?? "L"; return <span data-fin-tx-field={tx.field}><SectionIcon section={sec} className="mr-1" />{fieldLabel(tx.field)}</span>; }
    if (tx.category) return <span><CategoryIcon category={tx.category} className="mr-1" />{catLabel(tx.category)}</span>;
    return null;
  };
  const recordDeposit = () => {
    const cents = Math.round(Number(amt) * 100);
    const instant = when.trim() ? parseStampCST(when) : at;
    if (!(cents > 0)) return setRefusal(t("fin.reason_amount"));
    if (instant === null) return setRefusal(t("fin.reason_stamp"));
    setRefusal(null);
    commit({ id: `d-${instant}-${cents}-${record.entries.length + 1}`, kind: "deposit", amountCents: cents, atMs: instant, motDays: lengthDays(rec, Number(otherN), otherUnit), memo: memo.trim() || undefined, field, recurrence: rec });
    setAmt(""); setMemo(""); setWhen(""); foldForm();
  };
  const recordWithdrawal = () => {
    const cents = Math.round(Number(amt) * 100);
    const instant = when.trim() ? parseStampCST(when) : at;
    if (instant === null) return setRefusal(t("fin.reason_stamp"));
    const w: FinTx = { id: `w-${instant}-${cents}-${record.entries.length + 1}`, kind: "withdrawal", amountCents: cents, atMs: instant, motDays: lengthDays(rec, Number(otherN), otherUnit), memo: memo.trim() || undefined, field, recurrence: rec };
    const v = validateWithdrawal(txs, w);
    // the refusal names the minute (r.023, addendum 39 "check refuse message"): when the money can first move, or when it would run short
    if (!v.ok) return setRefusal(v.reason === "INSUFFICIENT" ? `${t("fin.reason_insufficient_by")} ${fmtStampCST(v.atMs ?? instant)}` : t("fin.reason_amount"));
    setRefusal(null); commit(w); setAmt(""); setMemo(""); setWhen(""); foldForm();
  };
  const recordTransaction = () => { if (txType === "deposit") recordDeposit(); else if (txType === "withdrawal") recordWithdrawal(); };
  // the form opens on its TYPE (the first choice), so focus lands on the type dropdown, not the amount
  const goTo = (id: string) => { const el = typeof document !== "undefined" ? document.getElementById(id) : null; el?.scrollIntoView({ behavior: "smooth", block: "center" }); (el?.querySelector("select[data-fin-type], input") as HTMLElement | null)?.focus(); };
  useEffect(() => { if (formOpen && scrollOnOpen.current) { scrollOnOpen.current = false; goTo("fin-transaction-form"); } }, [formOpen]);

  const countFor = (k: string): string | null => {
    if (k === "deposit") return String(deposits.length);
    if (k === "release") return usd(bal.releasedCents);
    if (k === "withdraw") return String(withdrawals.length);
    if (k === "record") return String(owner ? record.entries.length : 1);
    return null;
  };

  // pb-20 on the phone: the app's bottom bar (56 px) covers the page's last rows, so the page's last element — the R-CORE badge and
  // its maximized icon — sits above it (measured 2026-09-30; r.017 took the fixed strip out of the way, nothing on this surface floats).
  return (
    <div data-financial-ux1 className="mx-auto max-w-3xl px-4 pb-20 pt-10 sm:pb-10">
      {/* Header — the Session's: the globe, the Trinity glyphs, the title ───────────────────────── */}
      <header className="mb-8 text-center">
        <div className="mb-2 flex justify-end"><SoiGlobe /></div>
        <TrinityGlyphs size="text-3xl" className="mb-3" />
        <h1 className="text-2xl font-semibold">FINANCIAL · 2525</h1>
        {/* r.028 (addendum 58): no version line here — it is at the bottom; the header reads two lines, "Measure of Time" / "A Universal Standard" */}
        <p data-fin-subtitle className="mt-1 text-base text-foreground"><span className="block">{t("fin.title_l1")}</span><span className="block text-sm text-muted-foreground">{t("fin.title_l2")}</span></p>
      </header>

      {/* The one card — heading row + phase pill, the rail, the guide, the roster, the clock, the chart, the forms … */}
      <section className={CARD}>
        {/* r.028: "Money as time — this MoT" is gone everywhere (addendum 58); the two lines live in the header */}
        <PodPhaseRail phase={phase} phases={FIN_PHASES} countFor={countFor} />

        {/* ONE + Transaction, primary, at the top (r.028, addendum 58 "there should be one primary at top"; the gold box is gone) */}
        {owner && (
          <div data-fin-tx-top>
            {saveFailed && <p className="mb-2 text-sm text-amber-500">{t("fin.save_failed")}</p>}
            {/* + Transaction (r.023): folded until pressed — the one door (r.028) */}
            {!formOpen ? (
            <button type="button" data-fin-tx-open aria-expanded={false} onClick={openForm} className={`mb-4 w-full ${PRIMARY}`}>{t("fin.tx_open")}</button>
            ) : (
            <div id="fin-transaction-form" className={SUB} data-testid="fin-transaction-form" data-fin-tx-type={txType || "none"}>
              <div className="flex items-center justify-between gap-2">
                <div className={LABEL}>{t("fin.transaction")}</div>
                <button type="button" data-fin-tx-close aria-expanded={true} aria-label={t("fin.tx_close")} title={t("fin.tx_close")} onClick={foldForm} className="rounded-md border border-border p-1"><X size={14} strokeWidth={1.5} aria-hidden /></button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground">{t("fin.type")}
                  <select data-fin-type className={PICK} value={txType} onChange={(e) => chooseType(e.target.value as TxKind | "")}>
                    <option value="" disabled>{t("fin.type_select")}</option>
                    <option value="deposit">{t("fin.type_deposit")}</option>
                    <option value="withdrawal">{t("fin.type_withdrawal")}</option>
                  </select>
                </label>
                <label className="text-xs text-muted-foreground">{t("fin.amount")}<input className={INPUT} inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} /></label>
                <label className="text-xs text-muted-foreground">{t("fin.when")}<input className={INPUT} value={when} placeholder={now ? fmtStampCST(now) : t("fin.stamp_hint")} onChange={(e) => setWhen(e.target.value)} /></label>
                {/* r.027 (decision 5): Section, Field and Length appear only once a type is picked — nothing is chosen for the person */}
                {txType && <LadderPicker section={sec} field={field} rec={rec} onSection={setSec} onField={setField} onRec={setRec} otherN={otherN} onOtherN={setOtherN} otherUnit={otherUnit} onOtherUnit={setOtherUnit} t={t} hook="transaction" />}
                <label className="text-xs text-muted-foreground">{t("fin.memo")}<input className={INPUT} value={memo} onChange={(e) => setMemo(e.target.value)} /></label>
              </div>
              <button type="button" data-fin-record disabled={!txType} className={`mt-2 ${txType === "withdrawal" ? SECONDARY : PRIMARY} disabled:opacity-50`} onClick={recordTransaction}>{txType === "withdrawal" ? t("fin.withdraw") : t("fin.record_it")}</button>
              {refusal && <p className="mt-2 text-sm text-red-500">{t("fin.refused")} · {refusal}</p>}
            </div>
            )}
          </div>
        )}
        {!owner && <p className="mb-4 text-xs text-cyan-400" data-fin-example>{t("fin.example_badge")}</p>}

        {/* ACCRUAL UNITS (r.028, addendum 58): the current balance on the LEFT; the $/min figure and its unit selector on the RIGHT; a
            settings gear upper right; "Available: $…"; no Withdraw button (withdrawal is a choice inside + Transaction); full width on the phone */}
        <div data-fin-balance className="-mx-2 mb-4 rounded-lg border border-cyan-500/40 bg-cyan-500/5 p-3 text-sm sm:mx-0">
          <div className="flex items-center justify-between gap-2">
            <div className={LABEL}>{t("fin.accrual_units")}</div>
            <button type="button" data-fin-accrual-gear aria-expanded={accrualGear} aria-label={t("fin.settings")} title={t("fin.settings")} onClick={() => setAccrualGear((g) => !g)} className={`flex h-8 w-9 items-center justify-center rounded-md border border-border ${accrualGear ? "text-cyan-500" : "text-muted-foreground"}`}><Settings size={16} strokeWidth={1.5} aria-hidden /></button>
          </div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div data-fin-current className="min-w-0">
              <div className="text-xs text-muted-foreground">{t("fin.available")}:</div>
              <div className="font-mono text-2xl tabular-nums text-cyan-500" data-testid="fin-clock" aria-label={t("fin.available")}>{usd(bal.availableCents)}</div>
            </div>
            {bal.ratePerMinCents > 0 && (
              <div className="flex shrink-0 items-center gap-1 text-cyan-500">
                <span data-fin-rate className="font-mono tabular-nums">{rateUnit === "day" ? usd(Math.round(rateIn(rateUnit))) : usd4(rateIn(rateUnit))}</span>
                <select data-fin-rate-unit aria-label={t("fin.rate_unit")} value={rateUnit} onChange={(e) => setRateUnit(e.target.value as RateUnit)} className="min-h-[36px] rounded-md border border-border bg-background px-1 py-0.5 text-xs text-cyan-500">
                  {RATE_UNITS.map((u) => <option key={u} value={u}>{t(`fin.rate.${u}`)}</option>)}
                </select>
              </div>
            )}
          </div>
          {/* r.029 (addendum 60 "doesn't this seem duplicative?"): Available is the big figure above, so the grid is three boxes —
              In Escrow · Released · Spent; what each one means is in the gear */}
          <dl data-fin-balance-grid className="mt-3 grid w-full grid-cols-3 gap-x-3">
            <div data-fin-cell="escrowed"><dt className="text-xs text-muted-foreground">{t("fin.escrowed")}</dt><dd className="font-mono tabular-nums text-foreground">{usd(bal.escrowedCents)}</dd></div>
            <div data-fin-cell="released"><dt className="text-xs text-muted-foreground">{t("fin.released")}</dt><dd className="font-mono tabular-nums text-foreground">{usd(bal.releasedCents)}</dd></div>
            <div data-fin-cell="spent"><dt className="text-xs text-muted-foreground">{t("fin.spent")}</dt><dd className="font-mono tabular-nums text-foreground">{usd(bal.withdrawnCents)}</dd></div>
          </dl>
          {/* the gear (addendum 60 "tell me … what each does (which should be in settings)"): what each figure means, then the clock */}
          {accrualGear && (
            <dl data-fin-accrual-defs className="mt-2 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
              {(["available", "escrowed", "released", "spent"] as const).map((k) => (
                <div key={k} data-fin-def={k}><dt className="inline font-semibold text-foreground">{t(k === "available" ? "fin.available" : `fin.${k}`)}</dt> — <dd className="inline">{t(`fin.def.${k}`)}</dd></div>
              ))}
            </dl>
          )}
          {accrualGear && focusView && (
            <ul data-fin-accrual-menu className="mt-2 space-y-0.5 border-t border-border pt-2 font-mono text-xs text-muted-foreground" data-testid="fin-ladder">
              <li>{hhmmss(Math.max(0, at - focus!.atMs))} {t("fin.elapsed")}{showAbc ? ` · ${fmtMot(spanABC(Math.max(0, at - focus!.atMs) / dayMs, planet.yearDays))} ${t("fin.a_units")}` : ""}</li>
              <li>{usd4(bal.ratePerMinCents)} {t("fin.rate.min")} · {usd4(bal.ratePerMinCents / planet.secPerMin)} {t("fin.rate.sec")}</li>
            </ul>
          )}
        </div>

        {/* the chart — strokes only, day · hour · minute by default, A.B..C on reveal */}
        {focus && (
          <MotChart tx={focus} txs={txs} now={at} t={t} planet={planet} showAbc={showAbc} onToggle={setShowAbc} dateFmt={dateFmt} onDateFmt={pickDateFmt} angle={dateAngle} onAngle={pickDateAngle} locale={activeLocale}
            selector={<label className="flex items-center gap-1 text-xs text-muted-foreground">{t("fin.planet")}
              <select data-fin-planet value={planetCode} onChange={(e) => setPlanetCode(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                {planets.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </label>} />
        )}

        {/* the year as a TABLE, key info in order, PERIHELION FIRST (r.028, addendum 58); months of 30.3̅ days, no 33-day frame */}
        {year && (() => {
          const monthDays = 91 / 3;
          const dayIdx = year.day - 1;
          const month = year.down ? null : Math.floor(dayIdx / monthDays) + 1;
          const dayInMonth = year.down ? null : Math.floor(dayIdx - (month! - 1) * monthDays) + 1;
          // standard by default; the MoT icon unlocks the orbital rows — the perihelion and the A.B..C position (addendum 61)
          const rows: [string, string][] = [
            ...(yearAbc && planet.code === "earth" ? [[t("fin.perihelion_cst"), `${fmtStampCST(year.startMs)} CST`] as [string, string]] : []),
            [t("fin.year_today"), `${fmtStampCST(at)} CST`],
            ...(yearAbc ? [[t("fin.orbit_position"), fmtMot(year.abc)] as [string, string]] : []),
            [t("fin.day"), `${year.day} / ${Math.ceil(year.lengthDays)}${year.pastFull ? " ↑" : ""}`],
            [t("fin.quarter"), year.down ? t("fin.down_day") : `${year.quarter} · ${year.dayInQuarter} / 91`],
            [t("fin.month"), month === null ? t("fin.down_day") : `${month} · ${dayInMonth} / ${fmtDays(monthDays)}`],
            [t("fin.year"), `${year.year} · ${year.status}`],
          ];
          return (
            <div data-fin-year className={SUB} data-fin-past-full={year.pastFull ? "1" : undefined}>
              <div className="flex items-center justify-between gap-2">
                <div className={LABEL}>{yearAbc ? t("fin.year_position") : t("fin.year_title")}</div>
                <ClockMotToggle abc={yearAbc} onChange={setYearAbc} t={t} hook="year" />
              </div>
              <table data-fin-year-table className="mt-2 w-full text-xs">
                <tbody>
                  {rows.map(([k, v], n) => (
                    <tr key={n} className="border-t border-border/60 first:border-t-0"><th scope="row" className="py-1 pr-3 text-left font-normal text-muted-foreground">{k}</th><td className="py-1 text-right font-mono tabular-nums text-foreground">{v}</td></tr>
                  ))}
                </tbody>
              </table>
              {planet.code !== "earth" && <p className="mt-1 text-xs text-muted-foreground">{t("fin.anchor_note")}</p>}
            </div>
          );
        })()}

        {/* forms — only a signed-in person records; the example is read-only */}
        {owner ? (
          <div data-fin-forms>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground" data-fin-signin>
              <span>{t("fin.signed_in_as")} {user?.name ?? user?.email ?? owner}</span>
              <button type="button" className={SECONDARY} onClick={() => logout({ logoutParams: { returnTo: typeof window !== "undefined" ? window.location.origin : undefined } })}>{t("fin.sign_out")}</button>
            </div>
          </div>
        ) : (
          <div className={SUB} data-fin-signin>
            <p className="text-muted-foreground">{t("fin.example_badge")}</p>
            <button type="button" className={`mt-2 ${PRIMARY}`} disabled={isLoading} onClick={signIn}>{t("fin.sign_in")}</button>
          </div>
        )}

        {/* the budget — every line on the ladder (FIN-06) */}
        <div data-fin-budget className={SUB}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className={LABEL}>{t("fin.ladder_title")}</div>
              {/* EDIT MODE behind an icon (addendum 28 "add edit mode and icon on budget mode"): the pencil opens it, the check closes it;
                  the pressed state is a stroke ring, never a fill (the vector law). Only a signed-in person edits — the plan is saved under their key. */}
              {owner && (
                <button type="button" data-fin-budget-edit aria-pressed={editing} aria-label={editing ? t("fin.done") : t("fin.edit")} title={editing ? t("fin.done") : t("fin.edit")}
                  onClick={() => { setEditing((v) => !v); setDrafts({}); }}
                  className={`rounded-md border p-1 ${editing ? "border-cyan-500 ring-1 ring-inset ring-cyan-500" : "border-border"}`}>
                  {editing ? <Check size={14} strokeWidth={1.5} aria-hidden /> : <Pencil size={14} strokeWidth={1.5} aria-hidden />}
                </button>
              )}
            </div>
            {/* the unit toggle (addendum 17): one figure per row in the unit the person picks — $/s · $/min · $/h · $/day · $/week · 33 days · month · year */}
            {/* the unit — ONE dropdown (addendum 20 "use drop down": the eight pills wrapped over three rows on the phone) */}
            {/* addendum 21: in portrait the select is the panel's full width (the label above it) so "per hour" etc. read at the full line; landscape keeps it at its own width */}
            <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground landscape:w-auto landscape:flex-row landscape:items-center landscape:gap-2">{t("fin.unit")}
              <select data-fin-budget-unit value={budgetUnit} onChange={(e) => setBudgetUnit(e.target.value as BudgetUnit)} className="w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground landscape:w-auto landscape:min-w-[14rem] landscape:py-1 landscape:text-xs">
                {UNITS.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
              </select>
            </label>
          </div>
          {/* the table (addenda 17 + 22 → 31): the budget by KIND — Income · Fixed · Variable (· Transfers) — one row per kind with its total in
              the chosen unit and a chevron; the lines beneath only when opened (edit mode opens all); Net last, red when negative; no letters */}
          <table className="mt-2 w-full font-mono text-xs">
            <thead className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="py-1 pr-2">{t("fin.category")}</th><th className="py-1 text-right">{UNITS.find((u) => u.key === budgetUnit)?.label}</th></tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g.kind}>
                  <tr data-fin-kind={g.kind} data-fin-kind-open={isOpen(g.kind) ? "1" : "0"} className="border-t border-border/60 font-semibold">
                    <td className="py-1 pr-2">
                      <button type="button" data-fin-kind-toggle={g.kind} aria-expanded={isOpen(g.kind)} aria-label={isOpen(g.kind) ? t("fin.collapse") : t("fin.expand")} onClick={() => toggleKind(g.kind)} className="inline-flex min-h-[32px] items-center gap-1 bg-transparent p-0 text-left">
                        {isOpen(g.kind) ? <ChevronDown size={14} strokeWidth={1.5} aria-hidden /> : <ChevronRight size={14} strokeWidth={1.5} aria-hidden />}{kindLabel(g.kind)}
                      </button>
                    </td>
                    <td className="py-1 text-right tabular-nums">{usdDollars(g.total)}</td>
                  </tr>
                  {isOpen(g.kind) && g.lines.map((l) => (
                    <tr key={l.fieldId} data-fin-ladder-field={l.fieldId} className="text-muted-foreground"><td className="py-0.5 pl-6 pr-2"><SectionIcon section={fieldOf(l.fieldId)?.section ?? "L"} className="mr-1.5" />{fieldLabel(l.fieldId)}</td>
                      <td className="py-0.5 text-right tabular-nums">
                        {editing ? (
                          <span className="flex items-center justify-end gap-1">
                            <input data-fin-plan-amount={l.fieldId} className="w-28 rounded-md border border-border bg-background px-2 py-1 text-right text-xs text-foreground" inputMode="decimal"
                              value={drafts[l.fieldId] ?? String(editFigure(l))} onChange={(e) => typeAmount(l.fieldId, e.target.value)} onBlur={() => setDrafts((d) => { const n = { ...d }; delete n[l.fieldId]; return n; })} />
                            <button type="button" data-fin-plan-remove={l.fieldId} aria-label={t("fin.remove_line")} title={t("fin.remove_line")} onClick={() => writePlan(removeLine(plan, l.fieldId))} className="rounded-md border border-border p-1"><X size={12} strokeWidth={1.5} aria-hidden /></button>
                          </span>
                        ) : usdDollars(inPeriod(l))}
                      </td></tr>
                  ))}
                </Fragment>
              ))}
              <tr className={`border-t border-border font-semibold ${totals.net < 0 ? "text-red-500" : "text-green-500"}`}><td className="py-1 pr-2">{t("fin.net")}</td><td data-fin-budget-net className="py-1 text-right tabular-nums">{usdDollars(totals.net)}</td></tr>
            </tbody>
          </table>
          {editing && (
            <div data-fin-plan-add className="mt-2 grid gap-2 sm:grid-cols-3">
              {/* add a line: a FLOW field A–M not yet on the plan (the pickers are inline, never a nested component — the picker law, r.014) */}
              <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground"><span><SectionIcon section={addSec} className="mr-1" />{t("fin.section")}</span>
                <select data-fin-plan-section className={PICK} value={addSec} onChange={(e) => { const sec = e.target.value as FlowSectionId; setAddSec(sec); setAddField(fieldsOf(sec)[0]?.id ?? ""); }}>
                  {FLOW_SECTIONS.map((sec) => <option key={sec} value={sec}>{secLabel(sec)}</option>)}
                </select>
              </label>
              <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground">{t("fin.field")}
                <select data-fin-plan-field className={PICK} value={addable.some((f) => f.id === addField) ? addField : (addable[0]?.id ?? "")} onChange={(e) => setAddField(e.target.value)}>
                  {addable.map((f) => <option key={f.id} value={f.id}>{fieldLabel(f.id)}</option>)}
                </select>
              </label>
              <span className="flex items-end gap-2">
                <button type="button" data-fin-plan-add-btn disabled={!addable.length} onClick={() => { const id = addable.some((f) => f.id === addField) ? addField : addable[0]?.id; if (id) writePlan(addLine(plan, id)); }} className="min-h-[36px] rounded-md border border-border px-3 text-xs disabled:opacity-50">{t("fin.add_line")}</button>
                <button type="button" data-fin-plan-reset onClick={() => { if (owner) clearPlan(owner); setPlan(sheetPlan()); setDrafts({}); }} className="min-h-[36px] rounded-md border border-border px-3 text-xs">{t("fin.reset_sheet")}</button>
              </span>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">{t("fin.stock_note")}</p>
        </div>

        {/* the record — append-only, chain-hashed (FIN-05). r.028 (addendum 58 "sloppy · hide and click to expand with better table · every entry
            on a single line with ability to scroll to right"): folded behind a chevron; opened, a table, one entry per line, scrolling sideways */}
        <details data-fin-ledger className={`group ${SUB}`}>
          <summary className="flex min-h-[36px] cursor-pointer list-none items-center gap-1" aria-label={t("fin.record_toggle")}>
            <ChevronRight size={14} strokeWidth={1.5} aria-hidden className="transition-transform group-open:rotate-90" />
            <span className={LABEL}>{t("fin.ledger_title")} · {owner && tampered ? t("fin.chain_broken") : t("fin.chain_ok")} · {owner ? record.entries.length : 1}</span>
          </summary>
          <div data-fin-ledger-scroll className="mt-2 overflow-x-auto">
            <table data-fin-ledger-table className="min-w-full whitespace-nowrap font-mono text-xs text-muted-foreground">
              <thead className="text-left text-[10px] uppercase tracking-wide">
                <tr><th className="py-1 pr-3">#</th><th className="py-1 pr-3">{t("fin.when")}</th><th className="py-1 pr-3">{t("fin.type")}</th><th className="py-1 pr-3">{t("fin.field")}</th><th className="py-1 pr-3">{t("fin.memo")}</th><th className="py-1 pr-3 text-right">{t("fin.amount")}</th><th className="py-1 pr-3 text-right">{t("fin.length")}</th><th className="py-1">{t("fin.hash")}</th></tr>
              </thead>
              <tbody>
                {!owner && <tr className="border-t border-border/60"><td className="py-1 pr-3">1</td><td className="py-1 pr-3">{fmtStampCST(EXAMPLE.atMs)}</td><td className="py-1 pr-3">{t("fin.deposit")}</td><td className="py-1 pr-3">{txWhat(EXAMPLE)}</td><td className="py-1 pr-3">{EXAMPLE.memo}</td><td className="py-1 pr-3 text-right text-green-500">{usd(EXAMPLE.amountCents)}</td><td className="py-1 pr-3 text-right">{fmtDays(EXAMPLE.motDays ?? 0)}</td><td className="py-1">—</td></tr>}
                {owner && record.entries.length === 0 && <tr><td colSpan={8} className="py-1">{t("fin.no_deposits")}</td></tr>}
                {owner && record.entries.map((e) => (
                  <tr key={e.hash} className="border-t border-border/60">
                    <td className="py-1 pr-3">{e.rev}</td><td className="py-1 pr-3">{fmtStampCST(e.tx.atMs)}</td>
                    <td className="py-1 pr-3">{e.tx.kind === "deposit" ? t("fin.deposit") : t("fin.withdrawal")}</td>
                    <td className="py-1 pr-3">{txWhat(e.tx)}</td><td className="py-1 pr-3">{e.tx.memo ?? ""}</td>
                    <td className={`py-1 pr-3 text-right tabular-nums ${e.tx.kind === "deposit" ? "text-green-500" : "text-red-500"}`}>{usd(e.tx.amountCents)}</td>
                    <td className="py-1 pr-3 text-right">{e.tx.motDays ? fmtDays(e.tx.motDays) : ""}</td><td className="py-1">{e.hash.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t("fin.device_only")}</p>
        </details>

        {/* the Trinity wheel — folded, as the Session folds it. The seats are the operator's (addendum 9): TOP = HI 웃 (the
            person), BOTTOM-LEFT = AI ◬ (AI tokens), BOTTOM-RIGHT = SI ♡ (minutes contribution — volunteer / time logged).
            SoITrinity's tuple order is [top, bottom-right, bottom-left]. */}
        <details className="mb-2" data-testid="fin-details-trinity">
          <summary className="min-h-[36px] cursor-pointer py-2 text-xs text-muted-foreground" aria-label={t("fin.trinity_aria")} title={t("fin.trinity_aria")} />
          <div className="mt-2 flex flex-col items-center gap-1">
            <SoITrinity labels={[t("fin.wheel.hi"), t("fin.wheel.si"), t("fin.wheel.ai")]} color={hue.bright} colors={[hue.bright, hue.bright, hue.bright]} textColor={hue.ink} size={190} />
          </div>
        </details>
      </section>


      <p className="mt-6 text-center text-[11px] text-muted-foreground">{SRC.project.stamp} · {stamp} · <TrinityGlyphs inline size="text-[11px]" /></p>

      {/* R-CORE — version history + compare, the bottom of every 2525 surface */}
      <RCoreBadge history={FINANCIAL_RCORE_HISTORY} accent={hue.bright} />
    </div>
  );
}

/** The planet's LTU for the glass (operator addendum 8: "UX is defaulted in day, hour, min"; addendum 12: the LTU table decides
 *  the day, the hour and the minute): days + hours over a day, hours + minutes under. */
function ltuLabel(ms: number, wholeMs: number, p: PlanetLtuRow): string {
  const dayMs = daySecOf(p) * 1000, hourMs = p.minPerHour * p.secPerMin * 1000, minMs = p.secPerMin * 1000;
  const d = Math.floor(ms / dayMs), h = Math.floor((ms % dayMs) / hourMs), m = Math.floor((ms % hourMs) / minMs);
  return wholeMs >= dayMs && d > 0 ? `${d} d ${h} h` : `${h} h ${m} min`;
}

/** One deposit over its MoT: released / withdrawable / escrowed as strokes, NOW and withdrawals as marks (the 180-minute mark is not drawn — his answer, r.025).
 *  BEHIND THE SCENES IS A.B..C — the revolution's coordinate (addendum 10) on the selected planet's whole (addendum 12):
 *  on reveal the axis reads the year position (positionInYear, the planet's anchor) at each mark and the elapsed span in
 *  A-units; the glass defaults to the planet's day · hour · minute (addendum 8). The toggle is the card's one state. */
function MotChart({ tx, txs, now, t, planet, showAbc, onToggle, selector, dateFmt, onDateFmt, angle, onAngle, locale }: { tx: FinTx; txs: FinTx[]; now: number; t: (k: string) => string; planet: PlanetLtuRow; showAbc: boolean; onToggle: (v: boolean) => void; selector?: ReactNode; dateFmt: DateFmt; onDateFmt: (f: DateFmt) => void; angle: DateAngle; onAngle: (a: DateAngle) => void; locale: string }) {
  const W = 360, H = 150, P = 10;
  // the plot's LEFT edge moves in when dates show, so the first date at 30° never runs off the card (r.025)
  const PL = showAbc || angle === 0 || angle === 90 ? P + 4 : dateFmt === "full" ? 48 : dateFmt === "mmdd" ? 26 : 14;
  const dayMs = daySecOf(planet) * 1000;
  const len = Math.max(1, (tx.motDays ?? 0) * dayMs);
  const from = tx.atMs, to = tx.atMs + len;
  function inside(ms: number) { return !(ms < from) && !(ms > to); }
  const withdrawals = txs.filter((x) => x.kind === "withdrawal" && inside(x.atMs));
  const pts = series([tx, ...withdrawals], from, to, len / 120);
  const x = (ms: number) => PL + ((ms - from) / len) * (W - PL - P);
  const y = (cents: number) => H - P - (Math.max(0, Math.min(1, cents / tx.amountCents)) * (H - 2 * P));
  const poly = (pick: (p: (typeof pts)[number]) => number) => pts.map((p) => `${x(p.t).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");
  const elapsed = Math.max(0, Math.min(len, now - from));
  const elapsedAbc = spanABC(elapsed / dayMs, planet.yearDays);      // the elapsed LENGTH, in A-units of the planet's revolution
  const motAbc = spanABC(tx.motDays ?? 0, planet.yearDays);          // the whole MoT, in A-units (30.333 d = 298.3475..1826 A on the exact Earth year)
  const sw = VECTOR_LAW.stroke.normal, hair = VECTOR_LAW.stroke.hairline;
  // A.B..C mode keeps the five marks; Clock mode reads CALENDAR DATES at 30° (addendum 42), as many whole days as fit
  const axis = [0, 0.25, 0.5, 0.75, 1].map((f) => fmtMot(positionInYear(from + f * len, planet.yearAnchor, planet.yearDays).abc));
  // how many dates fit depends on the angle: flat text needs the most room, upright the least
  const fit = angle === 0 ? (dateFmt === "full" ? 4 : dateFmt === "mmdd" ? 6 : 10) : angle === 90 ? (dateFmt === "full" ? 14 : 18) : (dateFmt === "full" ? 6 : dateFmt === "mmdd" ? 10 : 16);
  const ticks = showAbc ? [] : dayTicks(from, to, fit);
  const monthName = (ms: number) => { const m = cstParts(ms).mo; try { return new Intl.DateTimeFormat(locale || "en", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, m - 1, 15))); } catch { return new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, m - 1, 15))); } };
  // TAP OR DRAG ON THE CHART → the day and time at that point (addendum 42 "find way to click on to see day / time stamp")
  const [probe, setProbe] = useState(null as number | null);
  const probeAt = (e: { clientX: number; currentTarget: SVGSVGElement }) => { const r = e.currentTarget.getBoundingClientRect(); if (!(r.width > 0)) return; const vx = ((e.clientX - r.left) / r.width) * W; setProbe(from + Math.max(0, Math.min(1, (vx - PL) / (W - PL - P))) * len); };
  const [gear, setGear] = useState(false);
  const sample = dayTicks(from, to, 6)[0] ?? from;
  return (
    <div data-fin-chart className={SUB}>
      {/* r.028 (addendum 58): no "Money as time — this MoT" phrase; Planet on the LEFT, the Clock · MoT toggle and the gear on the RIGHT */}
      <div className={LABEL}>{showAbc ? `${fmtMot(elapsedAbc)} / ${fmtMot(motAbc)} ${t("fin.a_units")}` : `${ltuLabel(elapsed, len, planet)} ${t("fin.elapsed")}`}</div>
      <div data-fin-chart-controls className="mt-2 flex items-center justify-between gap-2">
        {selector}
        <div className="flex items-center gap-2">
          {/* the Clock on the LEFT, the MoT on the RIGHT (addendum 42): two strokes, the pressed one ringed, never filled */}
          <ClockMotToggle abc={showAbc} onChange={onToggle} t={t} hook="chart" />
          {/* the date format lives on the chart (his answer "Gear on the chart"), remembered on this phone */}
          <button type="button" data-fin-date-gear aria-expanded={gear} aria-label={t("fin.settings")} title={t("fin.settings")} onClick={() => setGear((g) => !g)} className={`flex h-8 w-9 items-center justify-center rounded-md border border-border ${gear ? "text-cyan-500" : "text-muted-foreground"}`}><Settings size={16} strokeWidth={1.5} aria-hidden /></button>
        </div>
      </div>
      {gear && (
        <div data-fin-date-menu className="mt-2 space-y-2 rounded-md border border-border p-2 text-xs">
          <div role="group" aria-label={t("fin.date_format")} className="flex flex-wrap items-center gap-2">
            <span className="w-full text-muted-foreground">{t("fin.date_format")}</span>
            {DATE_FMTS.map((f) => (
              <button key={f} type="button" data-fin-date-fmt={f} aria-pressed={dateFmt === f} onClick={() => onDateFmt(f)} className={`min-h-[32px] rounded-md border px-2 font-mono ${dateFmt === f ? "border-cyan-500 text-cyan-500" : "border-border text-muted-foreground"}`}>{f === "month" ? `${monthName(sample)} ${dateLabel(sample, "month")}` : dateLabel(sample, f)}</button>
            ))}
          </div>
          <div role="group" aria-label={t("fin.chart_angle")} data-fin-angle-menu className="flex flex-wrap items-center gap-2">
            <span className="w-full text-muted-foreground">{t("fin.chart_angle")}</span>
            {DATE_ANGLES.map((a) => (
              <button key={a} type="button" data-fin-date-angle={a} aria-pressed={angle === a} onClick={() => onAngle(a)} className={`min-h-[32px] min-w-[44px] rounded-md border px-2 font-mono ${angle === a ? "border-cyan-500 text-cyan-500" : "border-border text-muted-foreground"}`}>{a}°</button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-1 font-mono text-xs text-muted-foreground">{fmtStampCST(tx.atMs)} · {usd(tx.amountCents)} · {fmtDays(tx.motDays ?? 0)} · {now < from ? `${t("fin.pending_from")} ${fmtStampCST(tx.atMs)}` : showAbc ? `${fmtMot(positionInYear(from, planet.yearAnchor).abc)} → ${fmtMot(positionInYear(to, planet.yearAnchor).abc)}` : `${ltuLabel(elapsed, len, planet)} ${t("fin.elapsed")}`}</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" className="mt-2 block cursor-crosshair" role="img" aria-label={t("fin.chart_tap")} data-fin-chart-svg onClick={probeAt}>
        <rect x={PL} y={P} width={W - PL - P} height={H - 2 * P} fill="none" stroke="var(--border)" strokeWidth={hair} />
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={PL + f * (W - PL - P)} y1={P} x2={PL + f * (W - PL - P)} y2={H - P} stroke="var(--border)" strokeWidth={hair} />)}
        <polyline fill="none" stroke={C.intelligence} strokeWidth={hair} points={poly((p) => p.escrowed)} />
        <polyline fill="none" stroke={C.consciousness} strokeWidth={sw} points={poly((p) => p.withdrawable)} />
        <polyline fill="none" stroke={C.abundance} strokeWidth={sw} points={poly((p) => p.released)} />
        {withdrawals.map((w) => <line key={w.id} x1={x(w.atMs)} y1={P} x2={x(w.atMs)} y2={P + 12} stroke={C.evolution} strokeWidth={sw} />)}
        {inside(now) && <line x1={x(now)} y1={P} x2={x(now)} y2={H - P} stroke={C.blank} strokeWidth={hair} />}
        {probe !== null && <line data-fin-chart-probe-line x1={x(probe)} y1={P} x2={x(probe)} y2={H - P} stroke={C.consciousness} strokeWidth={hair} strokeDasharray="3 3" />}
        {!showAbc && ticks.map((tk) => <line key={tk} x1={x(tk)} y1={H - P} x2={x(tk)} y2={H - P + 4} stroke="var(--border)" strokeWidth={hair} />)}
      </svg>
      {!showAbc && dateFmt === "month" && (
        <div data-fin-date-months aria-hidden className="relative mt-1 h-4 text-[10px] text-muted-foreground">
          {ticks.filter((tk, k) => k === 0 || cstParts(tk).mo !== cstParts(ticks[k - 1]).mo).map((tk) => <span key={tk} className="absolute top-0 whitespace-nowrap" style={{ left: `${(Math.max(0, (x(tk) - 12) / W) * 100).toFixed(2)}%` }}>{monthName(tk)}</span>)}
        </div>
      )}
      {/* CALENDAR DATES AT 30° (addendum 42) — HTML under the strokes (the vector law: the chart paints no face), one per tick */}
      {!showAbc && ticks.length === 0 && <div data-fin-axis className="grid grid-cols-5 font-mono text-[10px] leading-tight text-muted-foreground">{[0, 0.25, 0.5, 0.75, 1].map((f, i) => <span key={i} className={i === 0 ? "text-left" : i === 4 ? "text-right" : "text-center"}>{ltuLabel(f * len, len, planet)}</span>)}</div>}
      {!showAbc && ticks.length > 0 && (
        <div data-fin-date-axis data-fin-angle={angle} aria-hidden className={`relative font-mono text-[10px] text-muted-foreground ${angle === 0 ? "h-4" : angle === 90 ? (dateFmt === "full" ? "h-16" : "h-10") : dateFmt === "full" ? (angle === 45 ? "h-14" : "h-11") : "h-8"}`}>
          {ticks.map((tk) => <span key={tk} className="absolute top-0.5 whitespace-nowrap" style={{ left: `${((x(tk) / W) * 100).toFixed(2)}%`, transform: angle === 0 ? "translateX(-50%)" : angle === 90 ? "translateX(-100%) rotate(-90deg)" : `translateX(-100%) rotate(-${angle}deg)`, transformOrigin: angle === 0 ? "50% 0" : "100% 0" }}>{dateLabel(tk, dateFmt)}</span>)}
        </div>
      )}
      {probe !== null && <p data-fin-chart-probe className="mt-1 font-mono text-xs text-foreground">{fmtStampCST(probe)} CST</p>}
      {/* A.B..C mode: five marks; a mark is two lines (A · .BBBB..CCCC) so five of them fit a 390 px phone without overprinting */}
      {showAbc && <div data-fin-axis className="grid grid-cols-5 font-mono text-[10px] leading-tight text-muted-foreground">{axis.map((a, i) => <span key={i} className={`whitespace-pre-line ${i === 0 ? "text-left" : i === 4 ? "text-right" : "text-center"}`}>{a.replace(".", "\n.").replace("..", "\n..")}</span>)}</div>}
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span style={{ color: C.abundance }}>— {t("fin.released")}</span><span style={{ color: C.consciousness }}>— {t("fin.withdrawable")}</span><span style={{ color: C.intelligence }}>— {t("fin.escrowed")}</span><span>| {t("fin.now")}</span><span style={{ color: C.evolution }}>| {t("fin.withdrawal")}</span>
      </p>
    </div>
  );
}
