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
import { Check, ChevronDown, ChevronRight, Clock, Orbit, Pencil, X } from "lucide-react";
import { CategoryIcon, SectionIcon } from "@/components/financial-2525/category-icon";   // addendum 19: every category carries its icon; r.012: every section too
import { useAuth0 } from "@auth0/auth0-react";
import { useLexicon } from "@/lib/lexicon-context";
import { useThemeHue } from "@/lib/theme-hue";
import { SoiGlobe } from "@/components/soi-globe";
import { TrinityGlyphs } from "@/components/trinity-glyphs";
import { SoITrinity } from "@/components/soi-trinity";
import { PodPhaseRail } from "@/components/pod-phase-rail";
import { PodRosterList, type PodRosterRow } from "@/components/pod-roster-list";
import type { PodPhaseDef } from "@/lib/pod-phases";
import { hhmmss } from "@/lib/pod-clock";
import { VECTOR_LAW } from "@/lib/wire-core/vector-law";
import { TRINITY_COLORS } from "@/lib/trinity-palette";
import { versionStamp } from "@/lib/2525-core/version-stamp";
import { RCoreBadge } from "@/components/2525-core/rcore-badge";
import { fromLedgerJson } from "@/lib/2525-core/revisions";
import { FINANCIAL_LEDGER } from "@/lib/2525-core/financial-ledger.gen";
import { FINANCIAL_DOMAIN as SRC } from "@/lib/financial-2525/domain.gen";
import { fmtMot, spanABC, fmtStampCST, parseStampCST } from "@/lib/financial-2525/mot";
import { positionInYear, frameOf } from "@/lib/financial-2525/calendar";
import { readPlanetLtu, PLANET_LTU_KEYS } from "@/lib/financial-2525/planets";
import { planetRow, daySecOf, PLANET_LTU_SEED, type PlanetLtuRow } from "@/lib/planet-ltu";
import { balanceAt, series, validateWithdrawal, depositView, HOLD_MS, type FinTx, type TxKind } from "@/lib/financial-2525/accrual";
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
          {RECURRENCES.map((r) => <option key={r} value={r}>{t(`fin.rec.${r}`)}</option>)}
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

/** The five phases of one deposit, on the Session's rail: DEPOSIT ◬ · HOLD ♡ · RELEASE ♡ · WITHDRAW 웃 · RECORD 웃. */
/** The Released card's rate units (r.024, addendum 46): shorthand on the glass, per hour by default. */
type RateUnit = "sec" | "min" | "hr" | "day";
const RATE_UNITS: readonly RateUnit[] = ["sec", "min", "hr", "day"];
export const FIN_PHASES: PodPhaseDef[] = [
  { key: "deposit", labelKey: "fin.ph.deposit", earnsKey: "fin.ph.deposit_earns", glyph: "◬" },
  { key: "hold", labelKey: "fin.ph.hold", earnsKey: "fin.ph.hold_earns", glyph: "♡" },
  { key: "release", labelKey: "fin.ph.release", earnsKey: "fin.ph.release_earns", glyph: "♡" },
  { key: "withdraw", labelKey: "fin.ph.withdraw", earnsKey: "fin.ph.withdraw_earns", glyph: "웃" },
  { key: "record", labelKey: "fin.ph.record", earnsKey: "fin.ph.record_earns", glyph: "웃" },
];
/** Where one deposit stands at `now` — pure, from the accrual law. */
export function phaseOf(focus: FinTx | null, withdrawals: number, now: number): string {
  if (!focus || now < focus.atMs) return "deposit";
  const v = depositView(focus, now);
  if (v.fraction >= 1) return "record";
  if (now < v.holdUntilMs) return "hold";
  return withdrawals > 0 ? "withdraw" : "release";
}

/** The worked example as data — the operator's paycheck (amount · deposit day and time · MoT), never invented. */
const EXAMPLE: FinTx = {
  id: "example-d1", kind: "deposit", amountCents: Math.round(SRC.example.amountUsd * 100),
  atMs: parseStampCST(SRC.example.depositStamp) ?? 0, motDays: SRC.example.motDays, memo: SRC.example.memo, payer: "example", category: "Income", field: "A.income_wages", recurrence: "days33",
};

export function FinancialCommandUX1() {
  const { t } = useLexicon();
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
  const [rateUnit, setRateUnit] = useState("hr" as RateUnit);   // r.024: the Released card's rate, per hour by default (addendum 46)

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
  const frame = now ? frameOf(now, 33, planet.yearAnchor, planet.yearDays) : null;
  // THE LADDER'S UNIT (addendum 17 → 20 → 21 → 22): one dropdown of the brief's eight periods with FIXED factors — second · minute 60 ·
  // hour 3,600 · day 86,400 · week 7 d · 33 d · month 30.3̅ d · quarter 91 d · year 365 d. ONE SHARED UNIT (r.024, his answer "One, shared"):
  // in edit mode the amounts are typed in the unit picked; out of edit mode it converts the view. Per month (30.3̅ days) is the default
  // (addendum 41 "personal budget should be defaulted to 30.3 repeating").
  type BudgetUnit = "sec" | "min" | "hour" | "day" | "week" | "m33" | "month" | "quarter" | "year";
  const [budgetUnit, setBudgetUnit] = useState<BudgetUnit>("month");
  const UNITS: { key: BudgetUnit; label: string; period: Period }[] = [
    { key: "sec", label: t("fin.per_sec"), period: "second" }, { key: "min", label: t("fin.per_min"), period: "minute" }, { key: "hour", label: t("fin.per_hour"), period: "hour" },
    { key: "day", label: t("fin.per_day"), period: "day" }, { key: "week", label: t("fin.per_week"), period: "week" }, { key: "m33", label: t("fin.per_33"), period: "days33" },
    { key: "month", label: t("fin.per_month"), period: "month" }, { key: "quarter", label: t("fin.per_quarter"), period: "quarter" }, { key: "year", label: t("fin.per_year"), period: "year" },
  ];
  const period: Period = UNITS.find((u) => u.key === budgetUnit)?.period ?? "days33";
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
  const openForm = () => { setTxType(""); setRefusal(null); if (formOpen) goTo("fin-transaction-form"); else { scrollOnOpen.current = true; setFormOpen(true); } };
  const foldForm = () => { setFormOpen(false); setTxType(""); setRefusal(null); };
  const catLabel = (c: BudgetCategory) => t(`fin.cat.${CAT_KEY[c]}`);   // the record's r.006–r.011 entries still print their category
  const fieldLabel = (id: string) => { const f = fieldOf(id); return f ? t(`fin.field.${f.key}`) : id; };
  const secLabel = (sec: SectionId) => t(`fin.sec.${sec.toLowerCase()}`);
  const [refusal, setRefusal] = useState<string | null>(null);
  const commit = (tx: FinTx) => { const next = append(record, tx, at); setRecord(next); if (!saveRecord(next)) setSaveFailed(true); };
  /** What an entry is for — its ladder field (r.012) or, for the r.006–r.011 entries, its category; icon before the word. */
  const txWhat = (tx: FinTx): ReactNode => {
    if (tx.field) { const sec = fieldOf(tx.field)?.section ?? "L"; return <span data-fin-tx-field={tx.field}> · <SectionIcon section={sec} className="mx-0.5" />{fieldLabel(tx.field)}</span>; }
    if (tx.category) return <span> · <CategoryIcon category={tx.category} className="mx-0.5" />{catLabel(tx.category)}</span>;
    return null;
  };
  const recordDeposit = () => {
    const cents = Math.round(Number(amt) * 100);
    const instant = when.trim() ? parseStampCST(when) : at;
    if (!(cents > 0)) return setRefusal(t("fin.reason_amount"));
    if (instant === null) return setRefusal(t("fin.reason_stamp"));
    setRefusal(null);
    commit({ id: `d-${instant}-${cents}`, kind: "deposit", amountCents: cents, atMs: instant, motDays: lengthDays(rec, Number(otherN), otherUnit), memo: memo.trim() || undefined, field, recurrence: rec });
    setAmt(""); setMemo(""); foldForm();
  };
  const recordWithdrawal = () => {
    const cents = Math.round(Number(amt) * 100);
    const instant = when.trim() ? parseStampCST(when) : at;
    if (instant === null) return setRefusal(t("fin.reason_stamp"));
    const w: FinTx = { id: `w-${instant}-${cents}`, kind: "withdrawal", amountCents: cents, atMs: instant, motDays: lengthDays(rec, Number(otherN), otherUnit), memo: memo.trim() || undefined, field, recurrence: rec };
    const v = validateWithdrawal(txs, w);
    // the refusal names the minute (r.023, addendum 39 "check refuse message"): when the money can first move, or when it would run short
    if (!v.ok) return setRefusal(v.reason === "HOLD" ? `${t("fin.reason_hold")}${v.atMs ? ` · ${fmtStampCST(v.atMs)}` : ""}` : v.reason === "INSUFFICIENT" ? `${t("fin.reason_insufficient_by")} ${fmtStampCST(v.atMs ?? instant)}` : t("fin.reason_amount"));
    setRefusal(null); commit(w); setAmt(""); setMemo(""); foldForm();
  };
  const recordTransaction = () => { if (txType === "deposit") recordDeposit(); else if (txType === "withdrawal") recordWithdrawal(); };
  // the form opens on its TYPE (the first choice), so focus lands on the type dropdown, not the amount
  const goTo = (id: string) => { const el = typeof document !== "undefined" ? document.getElementById(id) : null; el?.scrollIntoView({ behavior: "smooth", block: "center" }); (el?.querySelector("select[data-fin-type], input") as HTMLElement | null)?.focus(); };
  useEffect(() => { if (formOpen && scrollOnOpen.current) { scrollOnOpen.current = false; goTo("fin-transaction-form"); } }, [formOpen]);

  // ── the "your turn" guide — the Session's card, the financial next action ──────────────────────────────────
  const guide = (() => {
    if (!owner) return { state: "turn" as const, sentence: t("fin.guide.sign_in"), label: `${t("fin.sign_in")} ↓`, action: signIn };
    if (!focus) return { state: "turn" as const, sentence: t("fin.guide.first_transaction"), label: t("fin.tx_open"), action: openForm };
    if (phase === "deposit") return { state: "waiting" as const, sentence: `${t("fin.guide.pending")} ${fmtStampCST(focus.atMs)}`, label: null, action: null };
    if (phase === "hold" && focusView) return { state: "waiting" as const, sentence: `${t("fin.guide.held")} ${hhmmss(Math.max(0, focusView.holdUntilMs - at))}`, label: null, action: null };
    if (phase === "record") return { state: "done" as const, sentence: t("fin.guide.done"), label: null, action: null };
    return { state: "turn" as const, sentence: `${t("fin.guide.withdrawable")} ${usd(bal.availableCents)}`, label: t("fin.tx_open"), action: openForm };
  })();
  const rosterRows: PodRosterRow[] = deposits.map((d) => {
    const v = depositView(d, at);
    return { name: `${fmtStampCST(d.atMs)}${d.field ? ` · ${fieldLabel(d.field)}` : d.category ? ` · ${catLabel(d.category)}` : ""}${d.memo ? ` · ${d.memo}` : ""}`, me: true, state: v.state === "released" ? "done" : v.state === "pending" ? "pending" : "turn", label: `${usd(d.amountCents)} · ${d.motDays}` };
  });
  const countFor = (k: string): string | null => {
    if (k === "deposit") return String(deposits.length);
    if (k === "hold" && focusView && phase === "hold") return hhmmss(Math.max(0, focusView.holdUntilMs - at));
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
        <p className="mt-1 text-xs text-muted-foreground">{t("fin.subtitle")} · {t("fin.version")} {SRC.project.version} · {t("fin.revision")} {SRC.project.revision}</p>
      </header>

      {/* The one card — heading row + phase pill, the rail, the guide, the roster, the clock, the chart, the forms … */}
      <section className={CARD}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("fin.chart_title")}</h2>
          <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">{t(phaseDef.labelKey)}</span>
        </div>
        <PodPhaseRail phase={phase} phases={FIN_PHASES} countFor={countFor} />

        {/* your turn — the Session's guide card, the financial next action */}
        <div className={`mb-4 rounded-lg border p-3 ${guide.state === "turn" ? "border-amber-400/70 bg-amber-400/5" : guide.state === "done" ? "border-green-500/50 bg-green-500/5" : "border-border"}`} data-testid="fin-your-turn" data-state={guide.state}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${guide.state === "turn" ? "bg-amber-400 text-black" : guide.state === "done" ? "bg-green-500 text-black" : "border border-border text-muted-foreground"}`}>
              {guide.state === "turn" ? t("soi.pod.guide.your_turn") : guide.state === "done" ? t("soi.pod.guide.done") : t("soi.pod.guide.waiting")}
            </span>
            <p className="min-w-0 flex-1 text-sm text-foreground" data-testid="fin-guide-sentence" aria-live="polite">{guide.sentence}</p>
          </div>
          {guide.label && guide.action && <button type="button" onClick={guide.action} data-testid="fin-your-turn-action" className="mt-2 min-h-[44px] rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-black">{guide.label}</button>}
          {!owner && <p className="mt-1 text-xs text-cyan-400">{t("fin.example_badge")}</p>}
        </div>

        {/* who has done what — the Session's roster, one row per deposit */}
        {rosterRows.length ? <PodRosterList rows={rosterRows} title={t("fin.roster_title")} you={t("soi.pod.guide.you")} /> : null}

        {/* the clock — the Session's ACTIVE block; the big number is money released, ticking at $/min */}
        <div data-fin-balance className={ACCENT_SUB}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            {/* ONE RATE FIGURE WITH ITS UNIT (r.024, addendum 46 + his answer "One figure + dropdown"): per hour by default, the shorthand
                /sec · /min · /hr · /day once picked; the figure is the live $/min times the planet's own units, never typed */}
            <div className="flex flex-wrap items-center gap-1 font-medium text-cyan-500">{t("fin.released")} · {bal.ratePerMinCents > 0 ? (
              <><span data-fin-rate className="tabular-nums">{rateUnit === "day" ? usd(Math.round(rateIn(rateUnit))) : usd4(rateIn(rateUnit))}</span>
                <select data-fin-rate-unit aria-label={t("fin.rate_unit")} value={rateUnit} onChange={(e) => setRateUnit(e.target.value as RateUnit)} className="rounded-md border border-border bg-background px-1 py-0.5 text-xs text-cyan-500">
                  {RATE_UNITS.map((u) => <option key={u} value={u}>{t(`fin.rate.${u}`)}</option>)}
                </select></>
            ) : t(phaseDef.labelKey)}</div>
            <div className="font-mono text-2xl tabular-nums text-cyan-500" data-testid="fin-clock" aria-label={t("fin.released")}>{usd(bal.releasedCents)}</div>
          </div>
          {/* the four figures as a 2 × 2 table (r.019, operator addendum 33 "make table 2x2"): In escrow · Withdrawable over Withdrawn ·
              Available, each cell its word above its figure — the same words and figures as before, laid out so none wraps into another */}
          <dl data-fin-balance-grid className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
            <div data-fin-cell="escrowed"><dt className="text-xs text-muted-foreground">{t("fin.escrowed")}</dt><dd className="font-mono tabular-nums text-foreground">{usd(bal.escrowedCents)}</dd></div>
            <div data-fin-cell="withdrawable"><dt className="text-xs text-muted-foreground">{t("fin.withdrawable")}</dt><dd className="font-mono tabular-nums text-foreground">{usd(bal.withdrawableCents)}</dd></div>
            <div data-fin-cell="withdrawn"><dt className="text-xs text-muted-foreground">{t("fin.withdrawn")}</dt><dd className="font-mono tabular-nums text-foreground">{usd(bal.withdrawnCents)}</dd></div>
            <div data-fin-cell="available"><dt className="text-xs text-muted-foreground">{t("fin.available")}</dt><dd className="font-mono tabular-nums text-foreground">{usd(bal.availableCents)}</dd></div>
          </dl>
          {focusView && focusView.state === "releasing" ? <p className="mt-1 text-xs text-muted-foreground">{t("fin.hold_mark")} {fmtStampCST(focusView.holdUntilMs)}</p> : null}
          {bal.ratePerMinCents > 0 && (
            <ul className="mt-2 space-y-0.5 font-mono text-xs text-muted-foreground" data-testid="fin-ladder">
              {focusView && <li>{hhmmss(Math.max(0, at - focus!.atMs))} {t("fin.elapsed")}{showAbc ? ` · ${fmtMot(spanABC(Math.max(0, at - focus!.atMs) / dayMs, planet.yearDays))} ${t("fin.a_units")}` : ""}</li>}
            </ul>
          )}
          {/* THE STRIP (r.002's CriticalStrip) IN NORMAL FLOW (r.017, operator addendum 29 "your deposit withdrawal floats; very odd"):
              it was FIXED 56 px above the viewport's bottom against the app bar's assumed height and hung mid-air when that bar slid
              away. Nothing on this surface floats: the same words and the same two buttons, the last row of the Released card. */}
          <div className="mt-2 flex items-center gap-2 border-t border-border pt-2 text-xs" data-testid="fin-strip">
        <span className="min-w-0 flex-1 truncate font-mono tabular-nums">{usd(bal.releasedCents)} · {usd(bal.availableCents)}</span>
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase" style={{ borderColor: hue.bright, color: hue.bright }}>{t(phaseDef.labelKey)}</span>
        {owner && <button type="button" data-fin-tx-open-strip onClick={openForm} className="min-h-[36px] rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">{t("fin.tx_open")}</button>}
          </div>
        </div>

        {/* the chart — strokes only, day · hour · minute by default, A.B..C on reveal */}
        {focus && (
          <MotChart tx={focus} txs={txs} now={at} t={t} planet={planet} showAbc={showAbc} onToggle={setShowAbc}
            selector={<label className="flex items-center gap-1 text-xs text-muted-foreground">{t("fin.planet")}
              <select data-fin-planet value={planetCode} onChange={(e) => setPlanetCode(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                {planets.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </label>} />
        )}

        {/* the year — the orbit that resets at perihelion; the 33-day frame */}
        {year && frame && (
          <div data-fin-year className={SUB} data-fin-past-full={year.pastFull ? "1" : undefined}>
            <div className={LABEL}>{t("fin.year_position")}</div>
            <p className="mt-1">{t("fin.day")} {year.day} · {year.down ? t("fin.down_day") : `${t("fin.quarter")} ${year.quarter} · ${year.dayInQuarter}/91`} · {t("fin.frame")} {frame.index + 1} · {frame.dayInFrame}/33</p>
            <p className="font-mono text-xs text-muted-foreground">{fmtStampCST(at)} CST · {year.year} · {year.status} · {showAbc ? fmtMot(year.abc) : `${year.day}/${Math.ceil(year.lengthDays)}`}{year.pastFull ? " ↑" : ""}</p>
            {planet.code === "earth" && year.anchor === "perihelion" && <p data-fin-perihelion className="mt-1 font-mono text-xs text-muted-foreground">{t("fin.perihelion_cst")} · {fmtStampCST(year.startMs)} CST</p>}
            {planet.code !== "earth" && <p className="mt-1 text-xs text-muted-foreground">{t("fin.anchor_note")}</p>}
          </div>
        )}

        {/* forms — only a signed-in person records; the example is read-only */}
        {owner ? (
          <div data-fin-forms>
            {/* + Transaction (r.023): folded until pressed; the save-failed line stays outside the fold so it is never hidden */}
            {saveFailed && <p className="mb-2 text-sm text-amber-500">{t("fin.save_failed")}</p>}
            {!formOpen ? (
            <button type="button" data-fin-tx-open aria-expanded={false} onClick={openForm} className={`mb-4 ${PRIMARY}`}>{t("fin.tx_open")}</button>
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
                <LadderPicker section={sec} field={field} rec={rec} onSection={setSec} onField={setField} onRec={setRec} otherN={otherN} onOtherN={setOtherN} otherUnit={otherUnit} onOtherUnit={setOtherUnit} t={t} hook="transaction" />
                <label className="text-xs text-muted-foreground">{t("fin.memo")}<input className={INPUT} value={memo} onChange={(e) => setMemo(e.target.value)} /></label>
              </div>
              <button type="button" data-fin-record disabled={!txType} className={`mt-2 ${txType === "withdrawal" ? SECONDARY : PRIMARY} disabled:opacity-50`} onClick={recordTransaction}>{txType === "withdrawal" ? t("fin.withdraw") : t("fin.record_it")}</button>
              {refusal && <p className="mt-2 text-sm text-red-500">{t("fin.refused")} · {refusal}</p>}
            </div>
            )}
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
                              value={drafts[l.fieldId] ?? String(lineInUnit(l, period))} onChange={(e) => typeAmount(l.fieldId, e.target.value)} onBlur={() => setDrafts((d) => { const n = { ...d }; delete n[l.fieldId]; return n; })} />
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

        {/* the record — append-only, chain-hashed (FIN-05); honest about where it lives */}
        <div data-fin-ledger className={SUB}>
          <div className={LABEL}>{t("fin.ledger_title")} · {owner && tampered ? t("fin.chain_broken") : t("fin.chain_ok")}</div>
          <ul className="mt-2 space-y-0.5 font-mono text-xs text-muted-foreground">
            {!owner && <li className="flex justify-between gap-2"><span>{fmtStampCST(EXAMPLE.atMs)} · {t("fin.deposit")} · {EXAMPLE.memo}</span><span>{usd(EXAMPLE.amountCents)} · {EXAMPLE.motDays}</span></li>}
            {owner && record.entries.length === 0 && <li>{t("fin.no_deposits")}</li>}
            {owner && record.entries.map((e) => (
              <li key={e.hash} className="flex justify-between gap-2"><span>{e.rev} · {fmtStampCST(e.tx.atMs)} · {e.tx.kind === "deposit" ? t("fin.deposit") : t("fin.withdrawal")}{txWhat(e.tx)}{e.tx.memo ? ` · ${e.tx.memo}` : ""}</span><span className={e.tx.kind === "deposit" ? "text-green-500" : "text-red-500"}>{usd(e.tx.amountCents)}{e.tx.motDays ? ` · ${e.tx.motDays}` : ""} · {e.hash.slice(0, 8)}</span></li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">{t("fin.device_only")}</p>
        </div>

        {/* the Trinity wheel — folded, as the Session folds it. The seats are the operator's (addendum 9): TOP = HI 웃 (the
            person), BOTTOM-LEFT = AI ◬ (AI tokens), BOTTOM-RIGHT = SI ♡ (minutes contribution — volunteer / time logged).
            SoITrinity's tuple order is [top, bottom-right, bottom-left]. */}
        <details className="mb-2" data-testid="fin-details-trinity">
          <summary className="cursor-pointer text-xs text-muted-foreground">{t("fin.trinity_caption")}</summary>
          <div className="mt-2 flex flex-col items-center gap-1">
            <SoITrinity labels={[t("fin.wheel.hi"), t("fin.wheel.si"), t("fin.wheel.ai")]} centerGlyphs={["웃", "♡", "◬"]} color={hue.bright} colors={[hue.bright, hue.bright, hue.bright]} textColor={hue.ink} size={190} />
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

/** One deposit over its MoT: released / withdrawable / escrowed as strokes, NOW, the 3-hour hold, withdrawals as marks.
 *  BEHIND THE SCENES IS A.B..C — the revolution's coordinate (addendum 10) on the selected planet's whole (addendum 12):
 *  on reveal the axis reads the year position (positionInYear, the planet's anchor) at each mark and the elapsed span in
 *  A-units; the glass defaults to the planet's day · hour · minute (addendum 8). The toggle is the card's one state. */
function MotChart({ tx, txs, now, t, planet, showAbc, onToggle, selector }: { tx: FinTx; txs: FinTx[]; now: number; t: (k: string) => string; planet: PlanetLtuRow; showAbc: boolean; onToggle: (v: boolean) => void; selector?: ReactNode }) {
  const W = 360, H = 150, P = 10;
  const dayMs = daySecOf(planet) * 1000;
  const len = Math.max(1, (tx.motDays ?? 0) * dayMs);
  const from = tx.atMs, to = tx.atMs + len;
  function inside(ms: number) { return !(ms < from) && !(ms > to); }
  const withdrawals = txs.filter((x) => x.kind === "withdrawal" && inside(x.atMs));
  const pts = series([tx, ...withdrawals], from, to, len / 120);
  const x = (ms: number) => P + ((ms - from) / len) * (W - 2 * P);
  const y = (cents: number) => H - P - (Math.max(0, Math.min(1, cents / tx.amountCents)) * (H - 2 * P));
  const poly = (pick: (p: (typeof pts)[number]) => number) => pts.map((p) => `${x(p.t).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");
  const elapsed = Math.max(0, Math.min(len, now - from));
  const elapsedAbc = spanABC(elapsed / dayMs, planet.yearDays);      // the elapsed LENGTH, in A-units of the planet's revolution
  const motAbc = spanABC(tx.motDays ?? 0, planet.yearDays);          // the whole MoT, in A-units (30.333 d = 298.3475..1826 A on the exact Earth year)
  const sw = VECTOR_LAW.stroke.normal, hair = VECTOR_LAW.stroke.hairline;
  // the x axis: five marks over the MoT — day · hour · minute by default; on reveal the revolution's A.B..C at each mark
  const axis = [0, 0.25, 0.5, 0.75, 1].map((f) => (showAbc ? fmtMot(positionInYear(from + f * len, planet.yearAnchor, planet.yearDays).abc) : ltuLabel(f * len, len, planet)));
  return (
    <div data-fin-chart className={SUB}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={LABEL}>{t("fin.chart_title")} · {showAbc ? `${fmtMot(elapsedAbc)} / ${fmtMot(motAbc)} ${t("fin.a_units")}` : `${ltuLabel(elapsed, len, planet)} ${t("fin.elapsed")}`}</div>
        <div className="flex items-center gap-2">
          {selector}
          {/* the MoT icon ⇄ the Clock icon (addendum 13): two strokes, the pressed one ringed, never filled; the names are the existing keys */}
          <div role="group" data-fin-abc-toggle className="flex overflow-hidden rounded-md border border-border">
            <button type="button" aria-pressed={showAbc} aria-label={t("fin.show_abc")} title={t("fin.show_abc")} onClick={() => onToggle(true)} className={`flex h-8 w-9 items-center justify-center ${showAbc ? "text-cyan-500 ring-1 ring-inset ring-cyan-500" : "text-muted-foreground"}`}><Orbit size={16} strokeWidth={1.5} aria-hidden /></button>
            <button type="button" aria-pressed={!showAbc} aria-label={t("fin.show_ltu")} title={t("fin.show_ltu")} onClick={() => onToggle(false)} className={`flex h-8 w-9 items-center justify-center ${!showAbc ? "text-cyan-500 ring-1 ring-inset ring-cyan-500" : "text-muted-foreground"}`}><Clock size={16} strokeWidth={1.5} aria-hidden /></button>
          </div>
        </div>
      </div>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{fmtStampCST(tx.atMs)} · {usd(tx.amountCents)} · {tx.motDays} · {now < from ? `${t("fin.pending_from")} ${fmtStampCST(tx.atMs)}` : showAbc ? `${fmtMot(positionInYear(from, planet.yearAnchor).abc)} → ${fmtMot(positionInYear(to, planet.yearAnchor).abc)}` : `${ltuLabel(elapsed, len, planet)} ${t("fin.elapsed")}`}</p>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" className="mt-2 block" aria-hidden>
        <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="none" stroke="var(--border)" strokeWidth={hair} />
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={P + f * (W - 2 * P)} y1={P} x2={P + f * (W - 2 * P)} y2={H - P} stroke="var(--border)" strokeWidth={hair} />)}
        <polyline fill="none" stroke={C.intelligence} strokeWidth={hair} points={poly((p) => p.escrowed)} />
        <polyline fill="none" stroke={C.consciousness} strokeWidth={sw} points={poly((p) => p.withdrawable)} />
        <polyline fill="none" stroke={C.abundance} strokeWidth={sw} points={poly((p) => p.released)} />
        <line x1={x(from + HOLD_MS)} y1={H - P} x2={x(from + HOLD_MS)} y2={H - P - 10} stroke={C.temporal} strokeWidth={sw} />
        {withdrawals.map((w) => <line key={w.id} x1={x(w.atMs)} y1={P} x2={x(w.atMs)} y2={P + 12} stroke={C.evolution} strokeWidth={sw} />)}
        {inside(now) && <line x1={x(now)} y1={P} x2={x(now)} y2={H - P} stroke={C.blank} strokeWidth={hair} />}
      </svg>
      {/* five marks; in A.B..C mode a mark is two lines (A · .BBBB..CCCC) so five of them fit a 390 px phone without overprinting */}
      <div data-fin-axis className="grid grid-cols-5 font-mono text-[10px] leading-tight text-muted-foreground">{axis.map((a, i) => <span key={i} className={`whitespace-pre-line ${i === 0 ? "text-left" : i === 4 ? "text-right" : "text-center"}`}>{showAbc ? a.replace(".", "\n.").replace("..", "\n..") : a}</span>)}</div>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span style={{ color: C.abundance }}>— {t("fin.released")}</span><span style={{ color: C.consciousness }}>— {t("fin.withdrawable")}</span><span style={{ color: C.intelligence }}>— {t("fin.escrowed")}</span><span style={{ color: C.temporal }}>| {t("fin.hold_mark")}</span><span>| {t("fin.now")}</span><span style={{ color: C.evolution }}>| {t("fin.withdrawal")}</span>
      </p>
    </div>
  );
}
