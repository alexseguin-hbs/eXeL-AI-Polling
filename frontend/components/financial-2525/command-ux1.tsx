"use client";

/**
 * FINANCIAL-2525 · Command UX 1 — the MoT Financial System on the ◬ ♡ 웃 Session shell (operator 2026-09-30, r.002).
 * ====================================================================================================
 * "financial 2525 uses shell from as UI/UX STARTING POINT FROM ◬ ♡ 웃 Session" (addendum 7) · "remember max R-CORE
 * REUSE · BEHIND SCENES IS A.B..C but UX IS DEFAULTED IN day hour, Min" (addendum 8).
 *
 * So this screen IS the Session's screen with money in it: the same root (one column — r.074, addendum 188: full width on a PC and a phone in landscape, the Mission Planning way), the same header (the
 * globe, the Trinity glyphs, a title), the same one card (the step rail was removed in r.038, addendum 73), the same "your turn" guide card,
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
import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
// r.074 review: measure before paint in the browser (no one-frame jump to a tall chart), a plain effect while the page is pre-rendered
const useBeforePaint = typeof window !== "undefined" ? useLayoutEffect : useEffect;
import { Check, ChevronDown, ChevronRight, Clock, Maximize2, Orbit, Pencil, Plus, Settings, X } from "lucide-react";
import { CategoryIcon, FieldIcon, SectionIcon } from "@/components/financial-2525/category-icon";   // addendum 19: every category carries its icon; r.012: every section too
import { useAuth0 } from "@auth0/auth0-react";
import { useLexicon } from "@/lib/lexicon-context";
import { useThemeHue } from "@/lib/theme-hue";
import { SoiGlobe } from "@/components/soi-globe";
import { ExelWordmark } from "@/components/exel-wordmark";
import { ModeratorSettings } from "@/components/moderator-settings";
import { SoITrinity } from "@/components/soi-trinity";
import { hhmmss } from "@/lib/pod-clock";
import { VECTOR_LAW } from "@/lib/wire-core/vector-law";
import { TRINITY_COLORS } from "@/lib/trinity-palette";
import { versionStamp } from "@/lib/2525-core/version-stamp";
import { RCoreBadge } from "@/components/2525-core/rcore-badge";
import { RCoreChart } from "@/components/2525-core/rcore-chart";   // r.056 (addenda 124 · 127): the shared R-CORE chart; r.064 (addendum 135): our own canvas engine, no TradingView
import { fromLedgerJson } from "@/lib/2525-core/revisions";
import { FINANCIAL_LEDGER } from "@/lib/2525-core/financial-ledger.gen";
import { FINANCIAL_DOMAIN as SRC } from "@/lib/financial-2525/domain.gen";
import { fmtMot, abcPart, spanABC, fmtStampCST, parseStampCST, stampProblem, fmtDays, dayTicks, dateLabel, cstParts, DATE_FMTS, type DateFmt } from "@/lib/financial-2525/mot";
import { positionInYear } from "@/lib/financial-2525/calendar";
import { readPlanetLtu, PLANET_LTU_KEYS } from "@/lib/financial-2525/planets";
import { planetRow, daySecOf, PLANET_LTU_SEED, type PlanetLtuRow } from "@/lib/planet-ltu";
import { balanceAt, series, validateRecord, depositView, type FinTx, type TxKind } from "@/lib/financial-2525/accrual";
import { CATEGORY_FIELD, type BudgetCategory } from "@/lib/financial-2525/budget";
import { loadPlan, savePlan, sheetPlan, planOrSheet, planKey, DEVICE_OWNER, addLine, removeLine, typeIntoLine } from "@/lib/financial-2525/plan";   // r.016: the person's plan — edit mode on the budget (addendum 28)
import { CURRENCIES, CURRENCY_KEY, DEFAULT_CURRENCY, currencyOf, currencyMark } from "@/lib/financial-2525/currency";   // r.049: the currency label
import { FLOW_SECTIONS, withMonthLaw, recordIncomeLines, calendarMonthDays, fieldsOf, fieldOf, netLadder, toPeriod, groupByKind, setCalendarMonth, RECURRENCES, LENGTH_UNITS, LENGTH_UNIT_DAYS, lengthDays, type SectionId, type FlowSectionId, type Recurrence, type LengthUnit, type Period, type LadderLine, type FieldKind } from "@/lib/financial-2525/ladder";   // addendum 22: the Personal Finance Ladder A–U — the lock
import { append, loadRecord, saveRecord, readStored, recordKey, unionRecords, sameChain, chainFingerprint, freshId, nextAt, txIdentity, followId, replay, emptyRecord, correctTx, stableJson, type FinRecord, type TxEdit } from "@/lib/financial-2525/record";   // r.062: correctTx — an edit is a correction entry; r.073: the union
import { parseAmountCents, amountProblem, parsePositive, lengthFits, parseBudgetAmount, parseCardCents, budgetFigure, smallDollars } from "@/lib/financial-2525/typed";   // r.073 (round 1): one reader for what a person types
import { isOperator, operatorDeposits, OPERATOR_WITHDRAWAL } from "@/lib/financial-2525/restore";
import { fitLine } from "@/lib/financial-2525/fit";   // r.071 (addendum 158): the Accrual Units figures fit their row
import { DEBIT, CARDS_KEY, accrualTxs, mergeCards, newCard, uniqueCardId, applyCardSettings, looksLikeCardNumber, cardBalanceAt, cardLevel, cardSeries, cardMoves, type Card, type CardLevel } from "@/lib/financial-2525/cards";   // r.067: the cockpit's credit cards
import { rateSeries, rateAtSeries, windowStart, overSpan, rateIn, RATE_UNITS as CHART_RATE_UNITS, type RateUnitId } from "@/lib/financial-2525/rate-series";   // r.056: income · spending · net in $/min
import { ownerKeyFor, cloudPut, readAll, mergeRecords, syncChoice, nextStamp, PUSH_EVERY_MS, LAST_PUSH_KEY, type CloudState, type PlanDoc } from "@/lib/financial-2525/cloud";   // r.055 (addendum 112): the account copy on every save and every 12 hours   // r.053 (addenda 106 · 110): his entries put back

const FINANCIAL_RCORE_HISTORY = fromLedgerJson(FINANCIAL_LEDGER);
const C = TRINITY_COLORS;
// r.049 (addenda 86–87): the picked currency's SYMBOL prefixes every figure — a label, never a conversion; none = bare numbers and a gray
// code under ACCRUAL UNITS. Set once per render by the surface before its children draw.
let CUR_SYM = "$";
const usd = (cents: number) => (cents < 0 ? "-" : "") + CUR_SYM + Math.abs(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd4 = (cents: number) => (cents < 0 ? "-" : "") + CUR_SYM + smallDollars(cents / 100);   // r.073 twelve-lens (Thoth): never $0.0000 for a real rate
// r.043 (addenda 88–89 "rmeove $ from table as its in label header"): a table cell prints the bare number; the symbol is in the header.
const num2 = (cents: number) => Math.abs(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** The time a budget or card list was edited, as this device stored it (0 when none or unreadable). */
const readStamp = (key: string): number => { try { return Number(localStorage.getItem(key) ?? 0) || 0; } catch { return 0; } };
const CAT_KEY: Record<BudgetCategory, string> = { Income: "income", Home: "home", Auto: "auto", Insurance: "insurance", Utilities: "utilities", Fitness: "fitness", Fun: "fun", Groceries: "groceries", "Dining Out": "dining_out", Other: "other" };
/** The Session's own classes, reused verbatim. */
const CARD = "mt-8 rounded-xl border border-border bg-card p-5";
const SUB = "mb-4 rounded-lg border border-border p-3 text-sm";
const ACCENT_SUB = "mb-4 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm";
const LABEL = "text-xs font-bold uppercase tracking-wide text-primary";
const PRIMARY = "min-h-[44px] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50";
const SECONDARY = "min-h-[44px] rounded-md border border-border px-4 py-2 text-sm";
const INPUT = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring";
const PICK = "w-full rounded-md border border-border bg-background px-2 py-2 text-sm text-foreground landscape:py-1 landscape:text-xs";
/** r.073: one account sync runs at a time; one more waits behind it (it reads everything latest when it starts). */
type SyncQueue = { running: Promise<boolean> | null; queued: Promise<boolean> | null };

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
            <select data-fin-length-unit={hook} aria-label={t("fin.length_unit")} className={PICK} value={otherUnit} onChange={(e) => onOtherUnit(e.target.value as LengthUnit)}>
              {LENGTH_UNITS.map((u) => <option key={u} value={u}>{t(`fin.u.${u}`)}</option>)}
            </select>
          </span>
        </label>
      )}
    </>
  );
}

/** The Released card's rate units (r.024, addendum 46): shorthand on the glass, per hour by default. */
type RateUnit = "sec" | "min" | "hr" | "day";
const RATE_UNITS: readonly RateUnit[] = ["sec", "min", "hr", "day"];
/** r.067 (addendum 147): the budget units' shorthand for the closed MoT Unit box (the open list keeps the words). */
const UNIT_SHORT: Record<string, string> = { sec: "/sec", min: "/min", hour: "/hr", day: "/1D", week: "/7D", calmonth: "/1M", month: "/30D", quarter: "/91D", year: "/1Y" };
/** The Clock ⇄ MoT pair (r.025 on the chart; r.030 the year card too, addendum 61): Clock = standard, MoT = the orbit's A.B..C. */
function ClockMotToggle({ abc, onChange, t, hook }: { abc: boolean; onChange: (v: boolean) => void; t: (k: string) => string; hook: string }) {
  return (
    <div role="group" aria-label={`${t("fin.show_ltu")} · ${t("fin.show_abc")}`} data-fin-abc-toggle={hook} className="flex overflow-hidden rounded-md border border-border">
      <button type="button" aria-pressed={!abc} aria-label={t("fin.show_ltu")} title={t("fin.show_ltu")} onClick={() => onChange(false)} className={`flex h-8 w-9 items-center justify-center ${!abc ? "text-primary ring-1 ring-inset ring-primary" : "text-muted-foreground"}`}><Clock size={16} strokeWidth={1.5} aria-hidden /></button>
      <button type="button" aria-pressed={abc} aria-label={t("fin.show_abc")} title={t("fin.show_abc")} onClick={() => onChange(true)} className={`flex h-8 w-9 items-center justify-center ${abc ? "text-primary ring-1 ring-inset ring-primary" : "text-muted-foreground"}`}><Orbit size={16} strokeWidth={1.5} aria-hidden /></button>
    </div>
  );
}
/** The chart's date-text angles (r.028, addendum 58): flat, 30° (default), 45°, upright. */
const DATE_ANGLES = [0, 30, 45, 90] as const;
type DateAngle = (typeof DATE_ANGLES)[number];

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
  const [accrualGear, setAccrualGear] = useState(false);
  const [defOpen, setDefOpen] = useState(null as null | "income" | "escrowed" | "released" | "spent" | "available" | "rate");
  const [trinityBig, setTrinityBig] = useState(false);          // r.042 (addendum 78): the header Trinity, mini by default
  // r.073 second pre-push review (Sofia): the two Trinity buttons swap — the focus follows to the one now showing, never dropped on the page
  const trinityBtn = useRef(null as HTMLButtonElement | null), trinityMoved = useRef(false);
  useEffect(() => { if (trinityMoved.current) { trinityMoved.current = false; trinityBtn.current?.focus(); } }, [trinityBig]);
  const [settingsOpen, setSettingsOpen] = useState(false);          // r.034: the eXeL Polling Settings (colour selector), upper right          // r.028: the Accrual Units settings, closed by default   // r.024: the Released card's rate, per hour by default (addendum 46)
  // r.025 (addendum 42 + his answer "Gear on the chart"): the chart's date format, 2026.10.01 by default, remembered on this phone
  const [dateFmt, setDateFmt] = useState("full" as DateFmt);
  useEffect(() => { try { const v = localStorage.getItem("fin-date-fmt"); if (v && (DATE_FMTS as readonly string[]).includes(v)) setDateFmt(v as DateFmt); } catch { /* storage unreadable: the default stands */ } }, []);
  const pickDateFmt = (f: DateFmt) => { setDateFmt(f); try { localStorage.setItem("fin-date-fmt", f); } catch { /* not remembered; still shown */ } };
  // r.028 (addendum 58 "Settings should open up date format for table, and angle for chart text"): the date text's angle, remembered
  const [dateAngle, setDateAngle] = useState(30 as DateAngle);
  // r.049 the currency (a label): remembered on this phone; the symbol is set before anything below draws a figure
  const [curCode, setCurCode] = useState(DEFAULT_CURRENCY);
  useEffect(() => { try { const v = localStorage.getItem(CURRENCY_KEY); if (v) setCurCode(currencyOf(v).code); } catch { /* storage blocked: USD */ } }, []);
  const pickCurrency = (code: string) => { setCurCode(code); try { localStorage.setItem(CURRENCY_KEY, code); } catch { /* still applies this visit */ } };
  const cur = currencyOf(curCode);
  CUR_SYM = cur.symbol ?? "";
  const curMark = currencyMark(cur);
  useEffect(() => { try { const raw = localStorage.getItem("fin-date-angle"); const v = raw === null || raw === "" ? NaN : Number(raw); if ((DATE_ANGLES as readonly number[]).includes(v)) setDateAngle(v as DateAngle); } catch { /* the default stands */ } }, []);
  const pickDateAngle = (a: DateAngle) => { setDateAngle(a); try { localStorage.setItem("fin-date-angle", String(a)); } catch { /* not remembered; still shown */ } };

  // The person's record on this device, under their own key — loaded on sign-in, verified before it is trusted.
  const owner = isAuthenticated && user?.sub ? user.sub : null;
  const [record, setRecord] = useState<FinRecord>(() => emptyRecord("nobody"));
  const [tampered, setTampered] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [planFailed, setPlanFailed] = useState(false);
  const [cardsFailed, setCardsFailed] = useState(false);   // r.073 second pre-push review (Thor): the cards say so too, in their own words
  useEffect(() => { if (!owner) return; const r = loadRecord(owner); setRecord(r.rec); setTampered(r.tampered); }, [owner]);
  // A FINISHED ENTRY IS NEVER LOST (r.073, round 1 of 33 — the reviewer lenses found a Monthly length edit with no effect, two tabs
  // and two devices burying each other's entries, a page left open 12 hours pushing its opening state back, and a full phone folding
  // the form over an entry it had not kept). Every save and every push reads the LATEST record (this ref) — never a copy captured
  // when a timer or a request began — and every save is united with what the device holds (record.ts saveRecord).
  const recordRef = useRef(record); recordRef.current = record;
  const ownerRef = useRef(owner); ownerRef.current = owner;
  /** Save to this device and show what was saved; a device that would not take it is SAID, and the entry stays on the page (and
   *  goes to the account). Returns false when the device refused. A good save clears an earlier warning. */
  const persist = (next: FinRecord): boolean => {
    const saved = saveRecord(next), shown = saved ?? next;
    recordRef.current = shown; setRecord(shown); setSaveFailed(!saved);   // "saved to your account" is read from what the account holds (holds, below)
    return !!saved;
  };
  // another tab's save reaches this one at once: its entries are united into what this tab shows (and so into its next save) — no tab
  // ever writes from a stale copy; the budget and the cards are read back the same way (Krishna)
  useEffect(() => {
    if (!owner) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key === recordKey(owner)) { const s = readStored(owner); if (s) { const u = recordRef.current.owner === owner ? unionRecords(recordRef.current, s) : s; if (u !== recordRef.current) { recordRef.current = u; setRecord(u); } } }
      else if (e.key === planKey(owner)) setPlan(planOrSheet(loadPlan(owner)));
      else if (e.key === `fin-plan-at:${owner}`) planAtRef.current = readStamp(`fin-plan-at:${owner}`);
      else if (e.key === CARDS_KEY(owner)) { try { setCards(mergeCards(JSON.parse(localStorage.getItem(CARDS_KEY(owner)) ?? "null"))); } catch { /* unreadable: this tab's cards stand */ } }
      else if (e.key === `fin-cards-at:${owner}`) cardsAtRef.current = readStamp(`fin-cards-at:${owner}`);
    };
    window.addEventListener("storage", onStorage); return () => window.removeEventListener("storage", onStorage);
  }, [owner]);

  // r.071 AsM (Thoth): built once per record, not once per second — every memo downstream (the rate chart's series) can finally hold
  const recTxs: FinTx[] = useMemo(() => (owner ? replay(record) : [EXAMPLE]).map(withMonthLaw), [owner, record]);
  const txs: FinTx[] = useMemo(() => accrualTxs(recTxs), [recTxs]);   // r.067 (his answer "No, count once"): a card payment counts against Available only for what no purchase already counted
  const effective = useMemo(() => new Map(replay(record).map((x) => [x.id, x] as const)), [record]);   // r.062: each row reads its corrected values   // r.046: old Monthly entries read 30 days (the month law)
  const at = now ?? 0;
  const bal = balanceAt(txs, at);
  const deposits = txs.filter((x) => x.kind === "deposit").sort((a, b) => b.atMs - a.atMs);
  const withdrawals = txs.filter((x) => x.kind === "withdrawal");
  const focus = deposits[0] ?? null;
  /** The live rate in the unit picked — the $/min times the planet's own seconds, hours and days (cents). */
  // r.066 (addendum 142 + "Spread over rest"): the Accrual Rate is what is left after any spend ahead of accrual is spread over the rest
  const rateIn = (u: RateUnit): number => (u === "sec" ? bal.netRatePerMinCents / planet.secPerMin : u === "min" ? bal.netRatePerMinCents : u === "hr" ? bal.netRatePerMinCents * planet.minPerHour : bal.netRatePerMinCents * planet.hoursPerDay * planet.minPerHour);
  // r.071 (addendum 158): the two figures' shared size, from the characters they show together (monospace → width = chars × advance)
  const rateText = rateUnit === "day" ? usd(Math.round(rateIn(rateUnit))) : usd4(rateIn(rateUnit));
  // Income is escrow plus released. It is not Available, and the rate is not added into it.
  const incomeCents = bal.escrowedCents + bal.releasedCents;
  const moneyBody = (cents: number) => Math.abs(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const wholeLen = (cents: number) => { const b = moneyBody(cents); return Math.max(1, b.slice(0, b.lastIndexOf(".")).length); };
  const figureCols = (amounts: number[]) => {
    const w = Math.max(1, ...amounts.map(wholeLen));
    const sign = amounts.some((c) => c < 0);
    return { style: { gridTemplateColumns: `${sign ? "1ch " : ""}auto ${w}ch auto` }, sign };
  };
  const leftFig = figureCols([incomeCents, bal.escrowedCents, bal.withdrawnCents]);
  const rightFig = figureCols([bal.releasedCents, bal.availableCents]);
  const money = (cents: number, sign: boolean) => {
    const body = moneyBody(cents);
    const dot = body.lastIndexOf(".");
    return (<>{sign ? <span>{cents < 0 ? "−" : ""}</span> : null}<span>{CUR_SYM}</span><span className="text-right">{body.slice(0, dot)}</span><span>{body.slice(dot)}</span></>);
  };
  const focusView = focus && now ? depositView(focus, at) : null;
  const year = now ? positionInYear(now, planet.yearAnchor, planet.yearDays) : null;
  // THE LADDER'S UNIT (addendum 17 → 20 → 21 → 22): one dropdown of the brief's eight periods with FIXED factors — second · minute 60 ·
  // hour 3,600 · day 86,400 · week 7 d · 33 d · month 30 d (r.046 month law) · quarter 91 d · year 365 d. ONE SHARED UNIT (r.024, his answer "One, shared"):
  // in edit mode the amounts are typed in the unit picked; out of edit mode it converts the view. Per month (30 days — r.046) is the default
  // (addendum 41 "personal budget should be defaulted to 30.3 repeating").
  type BudgetUnit = "sec" | "min" | "hour" | "day" | "week" | "m33" | "calmonth" | "month" | "quarter" | "year";
  // r.031 (addendum 62): the standard month — the calendar month we are in, from its 1st, its real length — before the 30-day month
  const calDays = now ? setCalendarMonth(now) : 0;
  const [budgetUnit, setBudgetUnit] = useState<BudgetUnit>("month");
  const UNITS: { key: BudgetUnit; label: string; period: Period }[] = [
    { key: "sec", label: t("fin.per_sec"), period: "second" }, { key: "min", label: t("fin.per_min"), period: "minute" }, { key: "hour", label: t("fin.per_hour"), period: "hour" },
    { key: "day", label: t("fin.per_day"), period: "day" }, { key: "week", label: t("fin.per_week"), period: "week" },
    { key: "calmonth", label: t("fin.per_cal_month"), period: "calmonth" },   // r.039 (addendum 74): "Standard Month", no extra text
    { key: "month", label: t("fin.per_month"), period: "month" }, { key: "quarter", label: t("fin.per_quarter"), period: "quarter" }, { key: "year", label: t("fin.per_year"), period: "year" },
  ];
  const period: Period = UNITS.find((u) => u.key === budgetUnit)?.period ?? "month";   // r.028: no 33-day unit on the glass (addendum 58)
  // the ladder in the chosen period: thirteen sections A–M and the locked Net = I − L − Ds − Tx − Tr (the sheet's lines on the fields)
  // THE PERSON'S PLAN (r.016, addendum 28): the sheet until the device holds the person's own; edit mode behind the pencil; every
  // figure, section total and Net below follows the plan. Drafts hold the typed text while editing so a half-typed "12." survives
  // the once-a-second clock; a figure is written on the 33-day base through setLineAmount, never read back into the input mid-type.
  const [plan, setPlan] = useState(() => sheetPlan() as LadderLine[]);
  // r.067 THE COCKPIT'S CARDS (addenda 142–144): his Capital One and USAA, saved on the device and to the account like the budget
  const [cards, setCards] = useState(() => [] as Card[]);
  // THE TIME TRAVELS WITH WHAT IT DATES (r.073 second pre-push review — Thor, Krishna). The budget and the cards carry the time they were
  // edited, and a sync takes whichever copy was edited later. Three ways that went wrong, fixed together: (1) a full phone refused the
  // content but took its 13-character time, so it held OLD lines under a NEW time and the next sync sent them over the account's newer copy
  // (every device lost the typed line) — a time is now written only after the content it dates was kept, content first; (2) the account
  // hands keys back in jsonb order, so identical cards read as different and went up again on every sync, beating a newer edit made on
  // another device — copies are compared without regard to key order (syncChoice); (3) a phone whose clock runs behind dated an edit
  // before the account copy it had just taken — an edit's time is never at or before the newest time this device has seen (nextStamp).
  // The times live in memory (these refs) and on the device; the sync reads memory, so an edit a full phone could not store still counts.
  const planAtRef = useRef(0), cardsAtRef = useRef(0);
  useEffect(() => { if (!owner) { setCards([]); cardsAtRef.current = 0; return; } cardsAtRef.current = readStamp(`fin-cards-at:${owner}`); try { setCards(mergeCards(JSON.parse(localStorage.getItem(CARDS_KEY(owner)) ?? "null"))); } catch { setCards([]); } }, [owner, user?.email]);   // eslint-disable-line react-hooks/exhaustive-deps
  /** The cards and their time on this device, content first; a device that will not keep them says so (Thor: on a full phone a card added
   *  there vanished from every device after one reload, and nothing was said). */
  const keepCardsHere = (who: string, list: Card[], at: number) => { try { localStorage.setItem(CARDS_KEY(who), JSON.stringify(list)); localStorage.setItem(`fin-cards-at:${who}`, String(at)); setCardsFailed(false); } catch { setCardsFailed(true); } };
  const saveCards = (next: Card[]) => { const at = nextStamp(cardsAtRef.current, Date.now()); setCards(next); cardsRef.current = next; cardsAtRef.current = at; if (owner) keepCardsHere(owner, next, at); };
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState({} as Record<string, string>);
  // r.073 second pre-push review (Enki): the line as it was when its box took the focus, and the box whose text was refused (it says why)
  const focusLine = useRef(null as LadderLine | null);
  const [budgetBad, setBudgetBad] = useState("");
  const [addSec, setAddSec] = useState("A" as FlowSectionId); const [addField, setAddField] = useState("A.income_wages");
  // r.052 (addendum 103 "wheres my edit button on personal budget"): the pencil is there signed in or not — signed out the plan is
  // this phone's own (DEVICE_OWNER), signed in it is the person's
  const planOwner = owner ?? DEVICE_OWNER;
  useEffect(() => { planAtRef.current = readStamp(`fin-plan-at:${planOwner}`); setPlan(planOrSheet(loadPlan(planOwner))); }, [planOwner]);
  // r.073 pre-push review (Thor): a budget this device would not keep says so in the BUDGET's words, on its own flag — the record's warning
  // ("the entry is kept in memory only") was wrong for a budget, and the next good record save used to hide it
  /** The budget and its time on this device, content first — the time only when the lines it dates were kept (Thor). */
  const keepPlanHere = (who: string, lines: LadderLine[], at: number): boolean => { const kept = savePlan(who, lines); if (kept) { try { localStorage.setItem(`fin-plan-at:${who}`, String(at)); } catch { /* the lines hold; their time is a hint */ } } setPlanFailed(!kept); return kept; };
  // a change only (a keystroke that leaves the lines as they were writes nothing and dates nothing)
  const writePlan = (next: LadderLine[]) => { if (stableJson(next) === stableJson(planRef.current)) return; const at = nextStamp(planAtRef.current, Date.now()); planRef.current = next; setPlan(next); planAtRef.current = at; keepPlanHere(planOwner, next, at); };
  // THE CLOUD COPY (r.055, addendum 112 "SAVE AN PUSH TO [the account store]. Identify all saving functions and make sure push is made automatically as
  // well as every 12 hours"; his answer "Account-ID key"). Signed in: the record and the budget are read back from the account once, merged
  // without ever dropping an entry (a diverged copy is kept whole), then every change is pushed, and again every 12 hours.
  const [cloudKey, setCloudKey] = useState(null as { owner: string; key: string } | null);   // r.073 second review (Thor): the key names its person
  const [cloudState, setCloudState] = useState("off" as CloudState);
  const [cloudAt, setCloudAt] = useState(0);
  const [cloudReady, setCloudReady] = useState(false);
  const cloudKeyRef = useRef(cloudKey); cloudKeyRef.current = cloudKey;
  const planRef = useRef(plan); planRef.current = plan;
  const cardsRef = useRef(cards); cardsRef.current = cards;
  const keptFp = useRef("");   // r.073 second review (Thor): a copy kept aside once per page even when the phone cannot store its fingerprint
  // "SAVED TO YOUR ACCOUNT" ONLY WHEN THE ACCOUNT HOLDS WHAT THE PAGE SHOWS (r.073 second pre-push review, Thor): the record, the budget and the
  // cards the account was last known to hold. Any change makes the claim false at once (a new entry read "saved" for 1.2 s, and for 12.5 s
  // while a budget line was being typed); a sync that only confirms it no longer flips it to "kept in memory only" while it runs.
  const [holds, setHolds] = useState(null as null | { record: FinRecord | null; plan: LadderLine[] | null; cards: Card[] | null });
  const dirty = useRef(false);   // a change the account has not been sent yet
  const readBack = useRef(false);   // a record write to confirm with one more read
  useEffect(() => { let live = true; setCloudReady(false); setCloudKey(null); if (owner) void ownerKeyFor(owner).then((k) => { if (live && k) setCloudKey({ owner, key: k }); }); return () => { live = false; }; }, [owner]);
  /** ONE SYNC (r.073, round 1 of 33 — the account is READ before it is written): read the record, the budget and the cards; unite the
   *  record with this device's (nothing either holds is dropped; a copy that fails its chain is kept whole and never adopted); take the
   *  budget and the cards from the account only when they were edited later; then write whatever the account still lacks. A read that
   *  failed writes nothing over the account. Every value is read LATEST (refs) — the 12-hour timer used to push the page's OPENING
   *  record, budget and cards back over the account (Odin). */
  const syncOnce = async (): Promise<boolean> => {
    const who = ownerRef.current, ck = cloudKeyRef.current;
    if (!who || !ck || ck.owner !== who) return false;   // never one person's data under another's key, even in the instant of a switch
    const key = ck.key;
    // r.073 pre-push review (Thor): every step re-checks the sign-in after it waits — nothing of one person is written while another is here
    const here = () => ownerRef.current === who && recordRef.current.owner === who && cloudKeyRef.current?.key === key;
    dirty.current = false; setCloudState("saving");
    const { r, p, c } = await readAll(key);
    if (!here()) return false;   // signed out or switched while reading: nothing of theirs is written here
    // "off" = no account store on this site: the device copy is the record (nothing to read, nothing lost); "ok" = read. Anything else is a
    // read that failed — it writes nothing over the account, and the first sync is tried again (Christo: Put back my entries waits for it)
    const readOk = r.state === "ok" || r.state === "off";
    const out: CloudState[] = [];
    let held: FinRecord | null = null;   // the record the account is known to hold after this sync (written, or already there)
    if (r.state === "ok") {
      const m = mergeRecords(recordRef.current, r.data);
      // an account copy that fails its chain is kept whole first — ONCE per copy (Thor: a new phone wrote another kept row on every sync)
      let kept: CloudState = "saved";
      if (m.keep) {
        const fp = chainFingerprint(m.keep); let last = ""; try { last = localStorage.getItem(`fin-kept-cloud:${who}`) ?? ""; } catch { /* keep it */ }
        if (fp !== last && fp !== keptFp.current) { kept = await cloudPut(key, `fin-record-kept-${Date.now()}`, m.keep); if (kept === "saved") { keptFp.current = fp; try { localStorage.setItem(`fin-kept-cloud:${who}`, fp); } catch { /* remembered in memory for this page */ } } }
        if (!here()) return readOk;
      }
      if (m.current !== recordRef.current) { const wasEmpty = recordRef.current.entries.length === 0; persist(m.current); if (wasEmpty && m.current.entries.length) setTampered(false); }   // Aset: the account put the record back
      const cloudRec = r.data && Array.isArray(r.data.entries) ? r.data : null;
      const lacks = recordRef.current.entries.length > 0 && !(cloudRec && sameChain(recordRef.current, cloudRec));   // never written over with nothing
      const wrote = kept === "saved" && lacks;
      const sent = recordRef.current;
      const st = kept !== "saved" ? kept : wrote ? await cloudPut(key, "fin-record", sent) : "saved";
      out.push(st); if (st === "saved") held = sent;
      if (!here()) return readOk;
      // READ BACK AFTER A WRITE (r.073): the account store has no compare-and-set — another device writing in the same moment could
      // replace this write; one more read a few seconds later unites whatever it holds again, so neither device's entry is left out
      if (wrote && out[out.length - 1] === "saved") readBack.current = true;
    } else out.push(r.state === "off" ? "offline" : r.state);
    // THE BUDGET AND THE CARDS (syncChoice): the copy edited later wins; the same time with other content goes up again under a new time; a
    // copy is never written here, or its time stamped, unless the content it dates was kept (keepPlanHere / keepCardsHere)
    let heldPlan: LadderLine[] | null = null, heldCards: Card[] | null = null;   // what the account is known to hold after this sync
    if (p.state === "ok") {
      const cp = p.data, planAt = planAtRef.current, mine = planRef.current;
      const remote = cp && Array.isArray(cp.lines) && Number.isFinite(cp.at) ? { doc: cp.lines, at: cp.at } : null;
      // r.073 twelve-lens review (Christo, Krishna — blocker): a budget this device never edited (planAt 0, the sheet) is never dated now —
      // it went up as "newest" and a real edit made on a device that was offline lost to it. Like the cards: no tie repair, no stamp, at 0.
      const ch = syncChoice({ doc: mine, at: planAt }, remote, true);
      if (ch === "take" && remote) { planRef.current = remote.doc; setPlan(remote.doc); planAtRef.current = remote.at; keepPlanHere(who, remote.doc, remote.at); heldPlan = remote.doc; out.push("saved"); }
      else if (ch === "same") { heldPlan = mine; out.push("saved"); }
      else {
        // r.073 pre-push review (Odin): the same time with different lines is the row r.072's stale 12-hour push reverted (its old lines under
        // the newest edit's time) — this device's lines go up under a new time, so every device takes them
        const at0 = ch === "send" ? planAt : nextStamp(Math.max(planAt, remote?.at ?? 0), Date.now());
        const st = await cloudPut(key, "fin-plan", { lines: mine, at: at0 } satisfies PlanDoc); out.push(st);
        if (!here()) return readOk;
        if (st === "saved") { heldPlan = mine; if (at0 !== planAt && planRef.current === mine) { planAtRef.current = at0; keepPlanHere(who, mine, at0); } }
      }
    } else out.push(p.state === "off" ? "offline" : p.state);
    if (c.state === "ok") {
      const cc = c.data, cardsAt = cardsAtRef.current, mine = cardsRef.current;
      const remote = cc && Array.isArray(cc.cards) && Number.isFinite(cc.at) ? { doc: cc.cards, at: cc.at } : null;
      const ch = syncChoice({ doc: mine, at: cardsAt }, remote, true);   // the same repair for the cards (Odin) — only for cards this device edited
      if (ch === "take" && remote) { const m2 = mergeCards(remote.doc as Card[]); cardsRef.current = m2; setCards(m2); cardsAtRef.current = remote.at; keepCardsHere(who, m2, remote.at); heldCards = m2; out.push("saved"); }
      else if (ch === "same") { heldCards = mine; out.push("saved"); }
      else {
        const at1 = ch === "send" ? cardsAt : nextStamp(Math.max(cardsAt, remote?.at ?? 0), Date.now());
        const st = await cloudPut(key, "fin-cards", { cards: mine, at: at1 }); out.push(st);
        if (!here()) return readOk;
        if (st === "saved") { heldCards = mine; if (at1 !== cardsAt && cardsRef.current === mine) { cardsAtRef.current = at1; keepCardsHere(who, mine, at1); } }
      }
    } else out.push(c.state === "off" ? "offline" : c.state);
    // "saved" only when the account holds the record as it is NOW (Thor: an entry made during the sync — or one this device would not
    // keep — was told "saved to your account" before any sync had sent it); a newer record waits for the sync its change starts
    const ok = out.every((x) => x === "saved");
    const behind = ok && (held !== recordRef.current || heldPlan !== planRef.current || heldCards !== cardsRef.current);
    setCloudState(behind ? "saving" : ok ? "saved" : out.includes("offline") ? "offline" : "error");
    if (ok) setHolds({ record: held, plan: heldPlan, cards: heldCards });   // a newer change on the page reads "not yet" until its own sync
    if (behind) dirty.current = true;
    else if (ok) { const t0 = Date.now(); setCloudAt(t0); try { localStorage.setItem(LAST_PUSH_KEY, String(t0)); } catch { /* hint only */ } }
    else dirty.current = true;   // retried on return, on the network coming back, or on the next change
    return readOk;
  };
  // one sync at a time; a request during one waits for it and runs once more after it (it reads everything latest)
  const syncQ = useRef({ running: null, queued: null } as SyncQueue);
  const runSync = () => { const q = syncQ.current; const p = syncOnce().catch(() => { dirty.current = true; setCloudState("error"); return false; }).finally(() => { if (q.running === p) q.running = null; if (readBack.current) { readBack.current = false; setTimeout(() => { void syncRef.current(); }, 4000); } }); q.running = p; return p; };
  const sync = () => { const q = syncQ.current; if (!q.running) return runSync(); if (!q.queued) q.queued = q.running.then(() => { q.queued = null; return runSync(); }); return q.queued; };
  const syncRef = useRef(sync); syncRef.current = sync;
  // signed in: the account copy is read back and united before anything is written to it. cloudReady waits for a READ that succeeded (or
  // a site with no account store) — offline at sign-in, the first sync is tried again every 30 s and when the network returns (Christo)
  useEffect(() => {
    if (!owner || !cloudKey || cloudKey.owner !== owner) return; let live = true, timer = 0;
    const first = () => { void syncRef.current().then((ok) => { if (!live) return; if (ok) setCloudReady(true); else timer = window.setTimeout(first, 30000); }); };
    const onOnline = () => { window.clearTimeout(timer); first(); };
    first(); window.addEventListener("online", onOnline);
    return () => { live = false; window.clearTimeout(timer); window.removeEventListener("online", onOnline); };
  }, [owner, cloudKey]);
  // every change to the record, the budget or the cards is sent (a short pause so a burst of typing is one write)
  useEffect(() => { if (!cloudReady) return; dirty.current = true; const id = setTimeout(() => { void syncRef.current(); }, 1500); return () => clearTimeout(id); }, [record, plan, cards, cloudReady]);
  // and every 12 hours — while the page is open, and on return to it when 12 hours have passed (a phone pauses timers in the background).
  // r.073: a change made in the last moments before the page is hidden or closed is sent at once (it used to wait for the next visit),
  // and a send that failed offline is sent again when the network returns
  useEffect(() => {
    if (!cloudReady) return;
    const due = () => { let last = 0; try { last = Number(localStorage.getItem(LAST_PUSH_KEY) ?? 0) || 0; } catch { /* send */ } if (Date.now() - last >= PUSH_EVERY_MS) void syncRef.current(); };
    const id = setInterval(() => { void syncRef.current(); }, PUSH_EVERY_MS);
    const flush = () => { if (dirty.current) void syncRef.current(); };
    // r.073 twelve-lens review (Odin — blocker): every return to the page reads the account first — a phone back within 12 hours showed a stale
    // budget, and its next edit (even to another line) went up as the newest whole copy over a line typed on another device
    const onVis = () => { if (document.visibilityState === "visible") void syncRef.current(); else flush(); };
    document.addEventListener("visibilitychange", onVis); window.addEventListener("pagehide", flush); window.addEventListener("online", flush); due();
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("pagehide", flush); window.removeEventListener("online", flush); };
  }, [cloudReady]);
  // THE BUDGET AS HE ASKED (r.024, addenda 48 · 50: "don't change budget inplementetion; this is way too complicated and I never asked for
  // it"): the r.021–r.022 per-line MoT dropdowns are gone; a line's amount is typed in the unit showing and kept on the 33-day base.
  // r.073 pre-push review (Enki): the budget reads a figure with its own strict reader — "0x10" or "1e3" never set a line; "1,234.56" applies
  // r.073 second pre-push review (Enki): a keystroke that does not read as a figure puts the line back as it was when the box took the focus —
  // the last readable prefix of a refused figure ("1e3" → 1.00, "0x10" → 0.00, a cleared box → its first digit) is never left on the line
  const typeAmount = (fieldId: string, text: string) => { setDrafts((d) => ({ ...d, [fieldId]: text })); const r = typeIntoLine(plan, fieldId, text, period, focusLine.current, cur.symbol ? [cur.symbol] : []); setBudgetBad((b) => (r.bad ? fieldId : b === fieldId ? "" : b)); writePlan(r.lines); };
  // r.026: per second / minute / hour a line is a fraction of a dollar — edit mode shows four decimals there (cents elsewhere), so
  // retyping the figure shown never moves the line (0.07 typed for $0.0673/min was +3.9%)
  // r.073 second pre-push review (Enki): under a dollar the box shows as many decimals as it takes to keep the line (budgetFigure)
  const editFigure = (l: LadderLine) => budgetFigure(toPeriod(l.amountNative, l.nativePeriod, period));
  const addable = fieldsOf(addSec).filter((f) => !plan.some((l) => l.fieldId === f.id) && !(owner && f.kind === "Income" && recordIncomeLines(txs, at).length));   // r.048: Income comes from the record
  // r.048 (addendum 80 "Income from my record"): with deposits on his record, the Income lines ARE the record — each Income field at the
  // rate its deposits release (amount ÷ length) — and the plan keeps Fixed · Variable · Transfers. No deposits: the plan as it was.
  const recIncome = owner ? recordIncomeLines(txs, at) : [];
  const recIncomeKey = recIncome.map((l) => `${l.fieldId}:${l.amountNative}`).join("|");
  const budget = useMemo(() => (recIncome.length ? [...recIncome, ...plan.filter((l) => fieldOf(l.fieldId)?.kind !== "Income")] : plan), [plan, recIncomeKey]);   // eslint-disable-line react-hooks/exhaustive-deps
  const fromRecord = (fieldId: string) => recIncome.some((l) => l.fieldId === fieldId);
  const totals = useMemo(() => netLadder(budget, period), [budget, period]);
  const totalsPerSec = useMemo(() => netLadder(budget, "second"), [budget]);   // r.052: the chart's Net line runs at the table's $/s
  // THE GLASS GROUPS BY KIND, COLLAPSED (r.018, addendum 31 "order by fixed vs financial, and have expand button so this is not so busy.
  // Don't show A-U letters"): Income · Fixed · Variable (· Transfers) each one row with its total and a chevron; the lines show only
  // when a group is opened — or in edit mode, which opens every group so its fields are reachable. No letter reaches the glass.
  const groups = useMemo(() => groupByKind(budget, period), [budget, period]);
  const [openKinds, setOpenKinds] = useState([] as FieldKind[]);
  const isOpen = (k: FieldKind) => editing || openKinds.includes(k);
  const toggleKind = (k: FieldKind) => setOpenKinds((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]));
  const kindLabel = (k: FieldKind) => (k === "Transfer" ? t("fin.sec.m") : t(`fin.${k.toLowerCase()}`));
  const inPeriod = (l: { amountNative: number; nativePeriod: Period }) => toPeriod(l.amountNative, l.nativePeriod, period);
  const numDollars = (x: number) => { const c = x * 100; return (c < 0 ? "−" : "") + (Math.abs(c) >= 100 ? num2(Math.round(c)) : smallDollars(c / 100)); };   // r.073 (Enki): a line per second never reads 0.0000
  const signIn = () => loginWithRedirect({ appState: { returnTo: `${SRC.project.route}/` } });
  // the account holds exactly what this page shows (the cloud mark), and the record in particular (the save warning's words)
  const holdsRecord = !!holds && holds.record === record, acctHolds = holdsRecord && holds?.plan === plan && holds?.cards === cards;
  const cloudMark = acctHolds ? "saved" : cloudState === "saved" ? "saving" : cloudState;

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
  const [paidFrom, setPaidFrom] = useState(DEBIT); const [paysCard, setPaysCard] = useState("");   // r.067 (addendum 143)
  const chooseType = (k: TxKind | "") => { setTxType(k); setPaidFrom(DEBIT); setPaysCard(""); setRefusal(null); if (k === "") return; if (k === "deposit") { setSec("A"); setField("A.income_wages"); setRec("paymot"); } else { setSec("B"); setField("B.rent_mortgage"); setRec("once"); } };
  /** Every door opens the ONE folded form with the type blank (r.023); the scroll waits for the form to be on the page. */
  const openForm = () => { if (formOpen) { goTo("fin-transaction-form"); return; } setTxType(""); setRefusal(null); scrollOnOpen.current = true; setFormOpen(true); };
  // r.068 (addendum 153 + his answer "what reflects reality best"): Pay card opens the one form already set to a Debit-Account
  // payment in Debt service › Credit Cards that names this card — the amount and the time are his to enter
  const payCard = (id: string) => { setTxType("withdrawal"); setPaidFrom(DEBIT); setSec("I"); setField("I.cards_student"); setRec("once"); setPaysCard(id); setAmt(""); setRefusal(null); if (formOpen) { goTo("fin-transaction-form"); return; } scrollOnOpen.current = true; setFormOpen(true); };
  // r.073 (round 1, Athena): folding hands the focus back to + Transaction — a keyboard or screen-reader user never starts again at the top
  const refocusDoor = useRef(false), doorRef = useRef(null as HTMLButtonElement | null);
  const foldForm = () => { setFormOpen(false); setTxType(""); setRefusal(null); setUnsaved(null); refocusDoor.current = true; };
  const catLabel = (c: BudgetCategory) => t(`fin.cat.${CAT_KEY[c]}`);   // the record's r.006–r.011 entries still print their category
  const fieldLabel = (id: string) => { const f = fieldOf(id); return f ? t(`fin.field.${f.key}`) : id; };
  const shortLabel = (id: string) => { const f = fieldOf(id); return f ? t(`fin.fshort.${f.key}`) : id; };   // r.040: one line per budget entry
  const secLabel = (sec: SectionId) => t(`fin.sec.${sec.toLowerCase()}`);
  const [refusal, setRefusal] = useState<string | null>(null);
  // r.073 pre-push review (Sofia): a refusal that repeats is announced again — the alert is a new element each time
  const [refusalN, setRefusalN] = useState(0);
  const refuse = (why: string) => { setRefusal(why); setRefusalN((n) => n + 1); };
  // r.073: an entry is appended to the LATEST record under an id no entry holds (two identical ids would drop the second), then saved;
  // false when this phone would not keep it
  const commit = (tx: FinTx): { ok: boolean; id: string; ident: string } => { const id = freshId(recordRef.current, tx.id); return { ok: persist(append(recordRef.current, { ...tx, id }, nextAt(recordRef.current, at))), id, ident: txIdentity(tx) }; };
  // r.053 (addendum 110 "now enter my transactions back in"): one tap appends his two deposits exactly as recorded and opens the
  // withdrawal form with 250.66 · Auto / Renters / Home — its day, time and length are his to enter (never invented). Append only.
  // r.073 (round 1, Christo): offered only once the account copy has been read — tapped while it loaded, it used to set his four
  // entries aside and write two over the account
  const restoreMine = () => {
    let next = recordRef.current; for (const d of operatorDeposits()) next = append(next, d, nextAt(next, at));
    persist(next);
    setTxType("withdrawal"); setSec(OPERATOR_WITHDRAWAL.section); setField(OPERATOR_WITHDRAWAL.field); setRec("once"); setAmt(OPERATOR_WITHDRAWAL.amount);
    setRefusal(null); scrollOnOpen.current = true; setFormOpen(true);
  };
  /** What an entry is for — its ladder field (r.012) or, for the r.006–r.011 entries, its category; icon before the word. */
  const txWhat = (tx: FinTx): ReactNode => {
    if (tx.field) { const sec = fieldOf(tx.field)?.section ?? "L"; return <span data-fin-tx-field={tx.field}><FieldIcon field={tx.field} section={sec} className="mr-1" />{fieldLabel(tx.field)}</span>; }
    if (tx.category) return <span><CategoryIcon category={tx.category} className="mr-1" />{catLabel(tx.category)}</span>;
    return null;
  };
  // ONE READER for what is typed (r.073, round 1, Enki): "1,234.56" and "$50" are amounts; "Infinity", "1e400" and "0x10" are not;
  // a date the calendar does not have is refused (never moved); Other needs a number above zero (never a silent one-time)
  const marks = cur.symbol ? [cur.symbol] : [];
  const amountWhy = (text: string) => { const p = amountProblem(text, marks); return t(p === "form" ? "fin.reason_amount_form" : p === "large" ? "fin.reason_amount_large" : "fin.reason_amount"); };   // r.073 (Enki): a trillion is "too large", not "not digits"
  const stampWhy = (text: string) => (stampProblem(text) === "day" ? t("fin.reason_stamp_day") : t("fin.reason_stamp"));
  const lengthOf = (instant: number): { days: number } | { why: string } => {
    const n = rec === "other" ? parsePositive(otherN) : 0;
    if (n === null) return { why: t("fin.reason_length_other") };
    const days = lengthDays(rec, n, otherUnit);
    return lengthFits(instant, days) ? { days } : { why: t("fin.reason_length") };
  };
  // A FULL PHONE (r.073, round 1, Thor): when this phone will not keep the entry, the entry is still on the record on this page (and
  // goes to the account), and the form STAYS OPEN with what was typed and says so; its button tries the save again — never a second
  // copy of the same entry. Changing anything in the form makes it a new transaction again.
  // r.073 pre-push review (Thor): changing a field after the failed save never makes a second entry — the change is applied to the entry the
  // phone would not keep (a correction), then the save is tried again
  const formKey = JSON.stringify([txType, amt, when, memo, sec, field, rec, otherN, otherUnit, paidFrom, paysCard]);
  const [unsaved, setUnsaved] = useState(null as null | { id: string; ident: string; key: string });
  const [retryN, setRetryN] = useState(0);   // r.073 second pre-push review (Sofia): each failed attempt is a new alert, so it is announced again
  const retrying = unsaved !== null;
  const afterRecord = (r: { ok: boolean; id: string; ident: string }) => { if (r.ok) { setAmt(""); setMemo(""); setWhen(""); foldForm(); } else { setUnsaved({ id: r.id, ident: r.ident, key: formKey }); setRetryN((n) => n + 1); } };
  const retrySave = () => {
    const u = unsaved; if (!u) return;
    let next = recordRef.current;
    // the entry is found by what it IS, not only by the id it had (a union can rename it — Enlil); gone from the record (another sign-in),
    // the form is a new transaction again
    const uid = followId(next, u.id, u.ident); if (uid === null) { setUnsaved(null); return; }
    const cur = replay(next).find((x) => x.id === uid);
    if (cur && formKey !== u.key) {
      const cents = parseAmountCents(amt, marks), instant = when.trim() ? parseStampCST(when) : cur.atMs;
      if (cents === null) return refuse(amountWhy(amt));
      if (instant === null) return refuse(stampWhy(when));
      const len = lengthOf(instant); if ("why" in len) return refuse(len.why);
      const kind = (txType || cur.kind) as TxKind, out = kind === "withdrawal";
      const edit: TxEdit = { kind, amountCents: cents, atMs: instant, motDays: len.days, recurrence: rec, memo: memo.trim() || undefined, field, paidFrom: out && paidFrom !== DEBIT ? paidFrom : undefined, paysCard: out && paidFrom === DEBIT && paysCard ? paysCard : undefined };
      for (const k of Object.keys(edit) as (keyof TxEdit)[]) if ((edit[k] ?? null) === (cur[k] ?? null)) delete edit[k];
      if (Object.keys(edit).length) {
        next = correctTx(next, cur.id, edit, at);
        const v = validateRecord(accrualTxs(replay(next).map(withMonthLaw)), Math.min(cur.atMs, instant));
        if (!v.ok) return refuse(`${t("fin.reason_insufficient_by")} ${fmtStampCST(v.atMs)}`);
      }
    }
    if (persist(next)) { setAmt(""); setMemo(""); setWhen(""); foldForm(); } else { setUnsaved({ id: uid, ident: u.ident, key: formKey }); setRetryN((n) => n + 1); }
  };
  const recordDeposit = () => {
    const cents = parseAmountCents(amt, marks);
    const instant = when.trim() ? parseStampCST(when) : at;
    if (cents === null) return refuse(amountWhy(amt));
    if (instant === null) return refuse(stampWhy(when));
    const len = lengthOf(instant); if ("why" in len) return refuse(len.why);
    setRefusal(null);
    afterRecord(commit({ id: `d-${instant}-${cents}-${recordRef.current.entries.length + 1}`, kind: "deposit", amountCents: cents, atMs: instant, motDays: len.days, memo: memo.trim() || undefined, field, recurrence: rec }));
  };
  const recordWithdrawal = () => {
    const cents = parseAmountCents(amt, marks);
    const instant = when.trim() ? parseStampCST(when) : at;
    // r.073 (Aset): the same order as a deposit — the amount is checked first
    if (cents === null) return refuse(amountWhy(amt));
    if (instant === null) return refuse(stampWhy(when));
    const len = lengthOf(instant); if ("why" in len) return refuse(len.why);
    const w: FinTx = { id: `w-${instant}-${cents}-${recordRef.current.entries.length + 1}`, kind: "withdrawal", amountCents: cents, atMs: instant, motDays: len.days, memo: memo.trim() || undefined, field, recurrence: rec, ...(paidFrom !== DEBIT ? { paidFrom } : {}), ...(paidFrom === DEBIT && paysCard ? { paysCard } : {}) };
    // the refusal names the minute (r.023, addendum 39 "check refuse message"): when the money can first move, or when it would run short.
    // r.071 (AsM review): checked over the record EXACTLY as the card counts it — a card payment whose purchases already counted is not
    // refused for money it never takes, and an entry that changes how purchases cover later payments is checked for those payments too
    const v = validateRecord(accrualTxs([...recTxs, withMonthLaw(w)]), instant);
    if (!v.ok) return refuse(`${t("fin.reason_insufficient_by")} ${fmtStampCST(v.atMs)}`);
    setRefusal(null); afterRecord(commit(w));
  };
  const recordTransaction = () => { if (txType === "deposit") recordDeposit(); else if (txType === "withdrawal") recordWithdrawal(); };
  // r.062 THE EDIT (addendum 133 "add edit feature for transaction record"): the pencil on a row opens its amount, memo, day and time and
  // length; Save APPENDS a correction (correctTx) — the original entry, its hash and every link after it stay on the record, the table
  // and every figure read the corrected values. Every edit — a deposit's too (r.071 AsM review: a deposit moved later or made smaller
  // could leave a spend already on the record with nothing under it) — passes the same refusal as a new withdrawal.
  const [editId, setEditId] = useState(null as string | null);
  const [editIdent, setEditIdent] = useState("");   // what the entry under the pencil IS (r.073, Enlil): a union may rename it, never swap it
  // r.073 (addendum 164 "all fields in edit of Transaction record should be possible to edit"): the pencil carries every field the form
  // has — the type, the amount, the day and time, the section and field, the length (its presets, Other with its unit), the memo, and
  // what a withdrawal was paid from
  const ED0 = { kind: "deposit" as TxKind, amt: "", memo: "", when: "", sec: "A" as FlowSectionId, field: "A.income_wages", rec: "once" as Recurrence, otherN: "", otherUnit: "days" as LengthUnit, paidFrom: DEBIT, paysCard: "" };
  const [ed, setEd] = useState(ED0);
  // r.070 (addendum 157): a row whose card was removed keeps that card as its payer, shown as a dash — never silently another card
  const payerGone = ed.paidFrom !== DEBIT && !cards.some((c) => c.id === ed.paidFrom);
  const [edRefusal, setEdRefusal] = useState(null as string | null);
  // r.073 (round 1): the editor opens SHOWING the length the entry is counted at (a Monthly entry reads 30 days by the month law), comes
  // into view with the focus on its Amount (Athena: below a long record it opened off-screen and nothing seemed to happen), and remembers
  // what it opened with, so only what the person changed is changed
  const [ed0, setEd0] = useState(ED0);
  const scrollEdit = useRef(false);
  /** The editor's starting values, read from the entry as it is counted: its preset (a Monthly entry reads Monthly), else Other with the
   *  days it covers (an entry from before the presets), else One time; its field (an r.006–r.011 entry's category mapped to its field). */
  const editValues = (x: FinTx): typeof ED0 => {
    const r = x.recurrence as Recurrence | undefined, d = x.motDays ?? 0;
    // r.073 second pre-push review (Enki): an Other length under a day opens in hours or minutes — a 0.5-minute length opened as "0" days and
    // changing only its unit was refused
    const ou: LengthUnit = d >= LENGTH_UNIT_DAYS.days ? "days" : d >= LENGTH_UNIT_DAYS.hours ? "hours" : "minutes", on = d / LENGTH_UNIT_DAYS[ou];
    const len = r && r !== "other" && RECURRENCES.includes(r) ? { rec: r, otherN: "", otherUnit: "days" as LengthUnit } : d > 0 ? { rec: "other" as Recurrence, otherN: String(Math.round(on * 1000) / 1000), otherUnit: ou } : { rec: "once" as Recurrence, otherN: "", otherUnit: "days" as LengthUnit };
    const field = x.field && fieldOf(x.field) ? x.field : x.category ? CATEGORY_FIELD[x.category] : x.kind === "deposit" ? "A.income_wages" : "B.rent_mortgage";
    return { kind: x.kind, amt: (x.amountCents / 100).toFixed(2), memo: x.memo ?? "", when: fmtStampCST(x.atMs), sec: (fieldOf(field)?.section ?? "A") as FlowSectionId, field, ...len, paidFrom: x.paidFrom ?? DEBIT, paysCard: x.paysCard ?? "" };
  };
  const openEdit = (x: FinTx) => { const v = editValues(x), root = recordRef.current.entries.find((e) => e.tx.id === x.id && !e.tx.corrects); setEditId(x.id); setEditIdent(root ? txIdentity(root.tx) : ""); setEdRefusal(null); setEd(v); setEd0(v); scrollEdit.current = true; };
  // a union that renamed the entry under the pencil moves the pencil with it; an entry no longer on the record closes the editor
  useEffect(() => { if (!editId) return; const id = followId(record, editId, editIdent); if (id !== editId) setEditId(id); }, [record, editId, editIdent]);
  // r.073 second pre-push review (Sofia): when the editor closes (Done, Cancel, the pencil) the focus goes back to that row's pencil — it was
  // dropped on the page (3 of 3); the form already hands it back to + Transaction
  const editRev = useRef(null as number | null);
  useEffect(() => {
    if (editId) { const e = recordRef.current.entries.find((q) => q.tx.id === editId); editRev.current = e ? e.rev : null; return; }
    const rev = editRev.current; editRev.current = null;
    if (rev !== null) (document.querySelector(`[data-fin-edit="${rev}"]`) as HTMLElement | null)?.focus({ preventScroll: true });
  }, [editId]);
  useEffect(() => { if (!editId || !scrollEdit.current) return; scrollEdit.current = false; const el = document.querySelector("[data-fin-edit-panel]"); el?.scrollIntoView({ behavior: "smooth", block: "center" }); (el?.querySelector("[data-fin-edit-amount]") as HTMLElement | null)?.focus({ preventScroll: true }); }, [editId]);
  const [edRefusalN, setEdRefusalN] = useState(0);
  const edRefuse = (why: string) => { setEdRefusal(`${t("fin.refused")} · ${why}`); setEdRefusalN((n) => n + 1); };
  const saveEdit = () => {
    const eid = editId ? followId(recordRef.current, editId, editIdent) : null; if (!eid) { setEditId(null); return; }
    const cur = replay(recordRef.current).find((x) => x.id === eid); if (!cur) return;
    const cents = parseAmountCents(ed.amt, marks), instant = parseStampCST(ed.when.trim());
    if (cents === null) return edRefuse(amountWhy(ed.amt));
    if (instant === null) return edRefuse(stampWhy(ed.when));
    const n = ed.rec === "other" ? parsePositive(ed.otherN) : 0;
    if (n === null) return edRefuse(t("fin.reason_length_other"));   // never a silent one-time
    const days = lengthDays(ed.rec, n, ed.otherUnit);
    if (!lengthFits(instant, days)) return edRefuse(t("fin.reason_length"));
    // ONLY WHAT THE PERSON CHANGED IS CHANGED (r.073, round 1): a field goes into the correction only when it was changed in the editor and
    // its value differs — an entry recorded at "now" keeps its exact instant (the stamp shows whole seconds), a retyped "3,604.49" is no
    // edit. A changed LENGTH carries its preset (Enlil: a Monthly entry read 30 days by the month law whatever its stored length said, so
    // 30 → 7 used to append a correction with no effect); an untouched one keeps the entry's own.
    const moved = (k: keyof typeof ED0) => String(ed[k]).trim() !== String(ed0[k]).trim();
    const lengthMoved = moved("rec") || (ed.rec === "other" && (moved("otherN") || moved("otherUnit")));
    const out = ed.kind === "withdrawal";
    const edit: TxEdit = {
      ...(moved("kind") && ed.kind !== cur.kind ? { kind: ed.kind } : {}),
      ...(moved("amt") && cents !== cur.amountCents ? { amountCents: cents } : {}),
      ...(moved("memo") && (ed.memo.trim() || undefined) !== cur.memo ? { memo: ed.memo.trim() || undefined } : {}),
      ...(moved("when") && instant !== cur.atMs ? { atMs: instant } : {}),
      ...(moved("field") && ed.field !== cur.field ? { field: ed.field } : {}),
      ...(lengthMoved && (days !== (withMonthLaw(cur).motDays ?? 0) || ed.rec !== cur.recurrence) ? { motDays: days, recurrence: ed.rec } : {}),
      ...(out && (moved("paidFrom") || moved("paysCard")) ? { paidFrom: ed.paidFrom === DEBIT ? undefined : ed.paidFrom, paysCard: ed.paidFrom === DEBIT && ed.paysCard ? ed.paysCard : undefined } : {}),
      ...(!out && (cur.paidFrom || cur.paysCard) ? { paidFrom: undefined, paysCard: undefined } : {}),   // a deposit is not paid from a card
    };
    // r.073 (Christo): Done with nothing changed closes the editor and appends nothing
    if (Object.keys(edit).length === 0) { setEditId(null); return; }
    const next = correctTx(recordRef.current, cur.id, edit, at);
    { const v = validateRecord(accrualTxs(replay(next).map(withMonthLaw)), Math.min(cur.atMs, edit.atMs ?? cur.atMs));
      if (!v.ok) return edRefuse(`${t("fin.reason_insufficient_by")} ${fmtStampCST(v.atMs)}`); }
    persist(next); setEditId(null);
  };
  // the form opens on its TYPE (the first choice), so focus lands on the type dropdown, not the amount
  const goTo = (id: string) => { const el = typeof document !== "undefined" ? document.getElementById(id) : null; el?.scrollIntoView({ behavior: "smooth", block: "center" }); (el?.querySelector("select[data-fin-type], input") as HTMLElement | null)?.focus(); };
  useEffect(() => {
    if (formOpen && scrollOnOpen.current) { scrollOnOpen.current = false; goTo("fin-transaction-form"); }
    if (!formOpen && refocusDoor.current) { refocusDoor.current = false; doorRef.current?.focus(); }
  }, [formOpen]);

  // pb-20 on the phone: the app's bottom bar (56 px) covers the page's last rows, so the page's last element — the R-CORE badge and
  // its maximized icon — sits above it (measured 2026-09-30; r.017 took the fixed strip out of the way, nothing on this surface floats).
  return (
    <div data-financial-ux1 className="w-full px-4 pb-20 pt-3 sm:pb-10">
      {/* Header — the Session's: the globe, the Trinity glyphs, the title ───────────────────────── */}
      <header data-fin-header className="mb-3 text-center">   {/* r.042 (addendum 76, his third request): the header is smaller — focus is the outcome */}
        {/* r.034 (addendum 67): "eXeL AI" upper left takes the person back to /main; the eXeL Polling Settings (the colour selector)
            and the globe upper right. Every accent on this surface follows the selected colour (Tailwind `primary` = the theme). */}
        <div data-fin-topbar className="relative flex min-h-[64px] items-center justify-between">
          <a href="/main/" data-fin-home aria-label={t("fin.home")} title={t("fin.home")} className="inline-flex min-h-[36px] items-center gap-1 text-sm">
            <ExelWordmark exelClass="font-bold text-primary" aiClass="font-light text-muted-foreground" />
          </a>
          {/* r.042 (addendum 78 + the AsM pre-push review "the header is not visibly smaller"): the mini Trinity sits IN the top bar,
              centred between eXeL AI and the globe — one-third size, no text, the selected colour; a tap grows it in place below the bar */}
          {!trinityBig && (
            <button type="button" data-fin-trinity aria-expanded={trinityBig} aria-label={t("fin.trinity_aria")} title={t("fin.trinity_aria")} ref={trinityBtn} onClick={() => { trinityMoved.current = true; setTrinityBig(true); }} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ outline: "none", boxShadow: "none" }}>
              <SoITrinity labels={["", "", ""]} color={hue.bright} colors={[hue.bright, hue.bright, hue.bright]} textColor={hue.ink} size={63} />
            </button>
          )}
          <div className="flex items-center gap-2">
            {/* r.042 (addendum 76 "move globe first and settings to right") */}
            <SoiGlobe />
            <button type="button" data-fin-settings onClick={() => setSettingsOpen(true)} aria-label={t("fin.settings")} title={t("fin.settings")} className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-primary"><Settings size={18} strokeWidth={1.5} aria-hidden /></button>
          </div>
        </div>
        {trinityBig && (
          <button type="button" data-fin-trinity aria-expanded={trinityBig} aria-label={t("fin.trinity_aria")} title={t("fin.trinity_aria")} ref={trinityBtn} onClick={() => { trinityMoved.current = true; setTrinityBig(false); }} className="mx-auto block rounded-full" style={{ outline: "none", boxShadow: "none" }}>
            {/* r.073 (addendum 168 "the trinity logo should be method from Main and already use right text sizes"): drawn exactly the way
                Main (the home page) draws it — the same call, Main's size, the component's own text size and offsets (FD-89's
                Financial-only font and centring retired); the ring follows the selected colour like every accent here */}
            <SoITrinity labels={[t("fin.wheel.hi"), t("fin.wheel.si"), t("fin.wheel.ai")]} color={hue.bright} size={240} />
          </button>
        )}
        <h1 className="text-xl font-semibold leading-tight">FINANCIAL · 2525</h1>
        {/* no version line here — it is at the bottom (r.028); ONE line, "Measure of Time: A Universal Standard" (r.039, addendum 74) */}
        <p data-fin-subtitle className="text-sm">{/* r.043 (addendum 90): "Measure of Time" in the eXeL colour, "A Universal Standard" in the AI colour (the upper-left wordmark) */}<span data-fin-subtitle-mot className="text-primary">{t("fin.title_mot")}</span><span className="text-muted-foreground">: {t("fin.title_std")}</span></p>
      </header>

      {/* The one card — Accrual Units (+ the entry) · Personal budget · Chart · Record · Year position · sign-in · Trinity (r.038) */}
      <section className={CARD}>
        {/* r.038 (addendum 73 "get rid of this; adds no value"): no step rail. Order: Accrual · Budget · Chart · Record · Year (folded) */}

        {!owner && <p className="mb-4 text-xs text-primary" data-fin-example>{t("fin.example_badge")}</p>}

        {/* ACCRUAL UNITS (r.028, addendum 58): the current balance on the LEFT; the $/min figure and its unit selector on the RIGHT; a
            settings gear upper right; "Available: $…"; no Withdraw button (withdrawal is a choice inside + Transaction); full width on the phone */}
        <style>{`@keyframes fin-accrual-glow{0%,100%{box-shadow:0 0 8px -2px hsl(var(--primary) / .35)}50%{box-shadow:0 0 22px 1px hsl(var(--primary) / .8)}}@media (prefers-reduced-motion:reduce){[data-fin-balance]{animation:none;box-shadow:0 0 16px -2px hsl(var(--primary) / .55)}}`}</style>
        <div data-fin-balance className="-mx-2 mb-4 rounded-lg border border-primary/70 bg-primary/5 p-3 text-sm sm:mx-0" style={{ animation: "fin-accrual-glow 3s ease-in-out infinite" }}>
          {/* r.033 (addendum 64 "Accrual field needs to be left to settings button on top line"): title left; the $/min figure and its
              unit selector on the SAME line, immediately left of the gear */}
          {/* r.042 (addendum 81 "Move transaction left of settings and move accrual rate to right of Available · swap these two"):
              line 1 = ACCRUAL UNITS · + Transaction (the gear's height) · gear; line 2 = Available (left) · Accrual Rate (right) */}
          <div data-fin-accrual-top className="flex flex-wrap items-center justify-between gap-2">
            <div><div className={LABEL}>{t("fin.accrual_units")}</div>{!cur.symbol && <div data-fin-currency-label className="text-[11px] text-muted-foreground">{cur.code} · {cur.name}</div>}</div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {bal.ratePerMinCents > 0 && (
                <div data-fin-rate-block className="flex items-center gap-1 text-primary">
                  <span data-fin-rate className="font-mono text-lg tabular-nums">{rateText}</span>
                  <select data-fin-rate-unit aria-label={t("fin.rate_unit")} value={rateUnit} onChange={(e) => setRateUnit(e.target.value as RateUnit)} className="min-h-[36px] rounded-md border border-border bg-background px-1 py-0.5 text-xs text-primary">
                    {RATE_UNITS.map((u) => <option key={u} value={u}>{t(`fin.rate.${u}`)}</option>)}
                  </select>
                </div>
              )}
              {owner && <button type="button" data-fin-tx-open aria-expanded={formOpen} onClick={openForm} ref={doorRef} className="h-8 shrink-0 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">{t("fin.tx_open")}</button>}
              <button type="button" data-fin-accrual-gear aria-expanded={accrualGear} aria-label={t("fin.settings")} title={t("fin.settings")} onClick={() => { setAccrualGear((g) => !g); setDefOpen(null); }} className={`flex h-8 w-9 items-center justify-center rounded-md border border-border ${accrualGear ? "text-primary" : "text-muted-foreground"}`}><Settings size={16} strokeWidth={1.5} aria-hidden /></button>
            </div>
          </div>
          {/* r.067 THE COCKPIT WARNING (addendum 144 "warnings of credit card overspend"; his levels: amber $1,500 · red $2,000): a card at
              or past a level the person set is named here, in words as well as colour, at the top of the one view; r.072 (addendum 161
              "remove limit from CC"): the balance alone — the limit lives only in the card's settings */}
          <div data-fin-card-warnings aria-live="polite">
          {owner && cards.map((c) => ({ c, b: cardBalanceAt(c, recTxs, at) })).filter(({ c, b }) => cardLevel(c, b) !== "ok").map(({ c, b }) => {
            const lv = cardLevel(c, b);
            return <p key={c.id} data-fin-card-warning={lv} className={`mt-2 break-words rounded-md border px-2 py-1 text-xs font-medium ${lv === "amber" ? "border-yellow-500/60 text-yellow-600 dark:text-yellow-400" : "border-red-500/60 text-red-400"}`}>⚠ {t(ALERT_WORD[lv])} · {c.name} {usd(b)}</p>;
          })}
          </div>
          {/* Accrual card. One identity, two sums. Available is not the headline.
              Header: Accrual, and the rate at the right. The rate explains the 30-day plan. It is not added into Income, Escrow, Released, Spent, or Available.
              Row 1: Income = In Escrow + Released. Computed. Not cash on hand.
              Row 2: Escrow | Released. Escrow cannot be spent. Released has cleared escrow and is still part of Income.
              Row 3, nested under Released only: Spent | Available. Spent = drawn from Released. Available = Released − Spent. Available is the only spendable figure.
              Invariants: escrow + released === income. spent + available === released. Available is not summed into Income. Spent is not summed into Income. */}
          <div data-fin-figures>
          <div data-fin-income-row className="mt-3 grid grid-cols-2 gap-x-3 border-b border-border pb-3">
            <div>
              <div className="block w-full text-left text-lg font-bold text-foreground">{t("fin.income")}</div>
              <div data-fin-income className="grid justify-start text-left font-mono text-lg font-bold tabular-nums text-foreground" style={leftFig.style}>{money(incomeCents, leftFig.sign)}</div>
            </div>
          </div>
          <dl data-fin-balance-grid className="mt-3 grid w-full grid-cols-2 gap-x-3">
            <div data-fin-cell="escrowed"><dt className="block w-full text-left text-base font-bold text-foreground">{t("fin.escrowed")}</dt><dd className="grid justify-start text-left font-mono text-lg tabular-nums text-foreground" style={leftFig.style}>{money(bal.escrowedCents, leftFig.sign)}</dd></div>
            <div data-fin-cell="released" className="border-l border-border pl-3"><dt className="block w-full text-left text-base font-bold text-foreground">{t("fin.released")}</dt><dd className="grid justify-start text-left font-mono text-lg tabular-nums text-foreground" style={rightFig.style}>{money(bal.releasedCents, rightFig.sign)}</dd></div>
          </dl>
          <div data-fin-released-nest className="mt-3 border-t border-border pt-3">
            <dl className="grid w-full grid-cols-2 gap-x-3">
              <div data-fin-cell="spent"><dt className="block w-full text-left text-base font-bold text-primary">{t("fin.spent")}</dt><dd className="grid justify-start text-left font-mono text-lg tabular-nums text-primary" style={leftFig.style}>{money(bal.withdrawnCents, leftFig.sign)}</dd></div>
              <div data-fin-cell="available" className="border-l border-border pl-3"><dt className="block w-full text-left text-base font-bold text-primary">{t("fin.available")}</dt><dd data-testid="fin-clock" className="grid justify-start text-left font-mono text-lg tabular-nums text-primary" style={rightFig.style}>{money(bal.availableCents, rightFig.sign)}</dd></div>
            </dl>
          </div>
          </div>
          {/* the gear (addendum 60 "tell me … what each does (which should be in settings)"): what each figure means, then the clock */}
          {accrualGear && (
            <label className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground">{t("fin.currency")}
              <select data-fin-currency aria-label={t("fin.currency")} value={cur.code} onChange={(e) => pickCurrency(e.target.value)} className="min-h-[36px] rounded-md border border-border bg-background px-2 text-xs text-foreground">
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}{c.symbol ? ` · ${c.symbol}` : ""} · {c.country}</option>)}
              </select>
            </label>
          )}
          {accrualGear && (
            <dl data-fin-accrual-defs className="mt-2 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
              {(["income", "escrowed", "released", "spent", "available", "rate"] as const).map((k) => {
                const e = usd(bal.escrowedCents), rel = usd(bal.releasedCents), spent = usd(bal.withdrawnCents), avail = usd(bal.availableCents), inc = usd(incomeCents);
                const eq = k === "income" ? `${e} + ${rel} = ${inc}`
                  : k === "escrowed" ? `${inc} − ${rel} = ${e}`
                  : k === "released" ? `${spent} + ${avail} = ${rel}`
                  : k === "spent" ? `${rel} − ${avail} = ${spent}`
                  : k === "available" ? `${rel} − ${spent} = ${avail}`
                  : `${usd4(rateIn("hr"))} /hr × 24 × 30 = ${usd(Math.round(rateIn("hr") * 24 * 30))}`;
                const open = defOpen === k;
                return (
                  <div key={k} data-fin-def={k}>
                    <button type="button" aria-expanded={open} onClick={() => setDefOpen(open ? null : k)} className="block min-h-[36px] w-full py-1 text-left">
                      <span className="font-semibold text-foreground">{t(k === "rate" ? "fin.rate_name" : `fin.${k}`)}</span> — {t(`fin.def.${k}`)}
                    </button>
                    {open && <p data-fin-def-math={k} className="pb-1 font-mono text-sm text-foreground">{eq}</p>}
                  </div>
                );
              })}
            </dl>
          )}
          {accrualGear && focusView && (
            <ul data-fin-accrual-menu className="mt-2 space-y-0.5 border-t border-border pt-2 font-mono text-xs text-muted-foreground" data-testid="fin-ladder" style={{ containerType: "inline-size" }}>
              {/* r.043 (addendum 84): one line — elapsed · $/min · $/sec; r.071 AsM (Sofia): fitted to the card, the $/sec part wrapping
                  under only past the smallest size — never off the card */}
              {(() => {
                const parts = [showAbc ? `${fmtMot(spanABC(Math.max(0, at - focus!.atMs) / dayMs, planet.yearDays))} ${t("fin.a_units")}` : `${hhmmss(Math.max(0, at - focus!.atMs))} ${t("fin.elapsed")}`,
                  `· ${usd4(bal.netRatePerMinCents)} ${t("fin.rate.min")}`, `· ${usd4(bal.netRatePerMinCents / planet.secPerMin)} ${t("fin.rate.sec")}`];
                return <li data-fin-elapsed-line className="flex flex-wrap gap-x-1" style={{ fontSize: fitLine(parts.join("").length) }}>{parts.map((p, i) => <span key={i} className="whitespace-nowrap">{p}</span>)}</li>;
              })()}
            </ul>
          )}
        </div>

        {/* the entry, folded until + Transaction is pressed (r.023), directly below the Accrual Units card (r.037); a failed save is said
            outside the fold so folding never hides it */}
        {owner && (
          <div data-fin-tx-top>
            {saveFailed && !retrying && <p role="alert" data-fin-save-failed className="mb-2 text-sm text-amber-500">{holdsRecord ? t("fin.save_failed_cloud") : t("fin.save_failed")}</p>}
            {formOpen && (
            <div id="fin-transaction-form" role="group" aria-label={t("fin.transaction")} className={SUB} data-testid="fin-transaction-form" data-fin-tx-type={txType || "none"}>
              <div className="flex items-center justify-between gap-2">
                <div className={LABEL}>{t("fin.transaction")}</div>
                <button type="button" data-fin-tx-close aria-expanded={true} aria-label={t("fin.tx_close")} title={t("fin.tx_close")} onClick={foldForm} className="flex h-8 w-9 items-center justify-center rounded-md border border-border"><X size={14} strokeWidth={1.5} aria-hidden /></button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground">{t("fin.type")}
                  <select data-fin-type className={PICK} value={txType} onChange={(e) => chooseType(e.target.value as TxKind | "")}>
                    <option value="" disabled>{t("fin.type_select")}</option>
                    <option value="deposit">{t("fin.type_deposit")}</option>
                    <option value="withdrawal">{t("fin.type_withdrawal")}</option>
                  </select>
                </label>
                <label className="text-xs text-muted-foreground">{t("fin.amount_col")}, {curMark}<input data-fin-amount-input className={INPUT} inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} /></label>
                <label className="text-xs text-muted-foreground">{t("fin.when")}<input className={INPUT} value={when} placeholder={now ? fmtStampCST(now) : t("fin.stamp_hint")} onChange={(e) => setWhen(e.target.value)} /></label>
                {/* r.027 (decision 5): Section, Field and Length appear only once a type is picked — nothing is chosen for the person */}
                {txType && <LadderPicker section={sec} field={field} rec={rec} onSection={setSec} onField={setField} onRec={setRec} otherN={otherN} onOtherN={setOtherN} otherUnit={otherUnit} onOtherUnit={setOtherUnit} t={t} hook="transaction" />}
                {/* r.067 (addendum 143 "payment selector added for Card vs Debit Account"): what a withdrawal was paid from; a Debit-Account
                    payment in Debt service names the card it pays down */}
                {txType === "withdrawal" && (
                  <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground">{t("fin.paid_from")}
                    <select data-fin-paid-from className={PICK} value={paidFrom} onChange={(e) => { setPaidFrom(e.target.value); if (e.target.value !== DEBIT) setPaysCard(""); }}>
                      <option value={DEBIT}>{t("fin.debit_account")}</option>
                      {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                )}
                {/* r.068 (addendum 153 "a payment towards CC should … reduce CC BALANCE"): on EVERY Debit withdrawal — you pay a card from
                    checking whatever you call the line */}
                {txType === "withdrawal" && paidFrom === DEBIT && !!cards.length && (
                  <label className="flex w-full flex-col gap-1 text-xs text-muted-foreground">{t("fin.card_paid")}
                    <select data-fin-pays-card className={PICK} value={paysCard} onChange={(e) => setPaysCard(e.target.value)}>
                      <option value="">{t("fin.card_none")}</option>
                      {cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </label>
                )}
                <label className="text-xs text-muted-foreground">{t("fin.memo")}<input className={INPUT} value={memo} onChange={(e) => setMemo(e.target.value)} /></label>
              </div>
              <button type="button" data-fin-record disabled={!txType} data-fin-retry={retrying ? "1" : undefined} className={`mt-2 ${txType === "withdrawal" ? SECONDARY : PRIMARY} disabled:opacity-50`} onClick={retrying ? retrySave : recordTransaction}>{retrying ? t("fin.save_retry") : txType === "withdrawal" ? t("fin.withdraw") : t("fin.record_it")}</button>
              {retrying && <p key={retryN} role="alert" data-fin-save-retry className="mt-2 text-sm text-amber-500">{t("fin.save_failed_form")}{holdsRecord && <> {t("fin.save_failed_cloud")}</>}</p>}
              {refusal && <p role="alert" key={refusalN} className="mt-2 text-sm text-red-500">{t("fin.refused")} · {refusal}</p>}
            </div>
            )}
          </div>
        )}

        {owner && cloudReady && isOperator(user?.email) && record.entries.length === 0 && (
          <div data-fin-restore className={`${SUB} flex flex-wrap items-center justify-between gap-2`}>
            <span className="text-xs text-muted-foreground">{t("fin.restore_note")}</span>
            <button type="button" data-fin-restore-btn onClick={restoreMine} className="min-h-[36px] rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">{t("fin.restore_mine")}</button>
          </div>
        )}
        {/* the budget — every line on the ladder (FIN-06) */}
        <div data-fin-budget className={SUB}>
          {/* r.072 AsM: the title row WRAPS on a narrow phone — at 320 px "MoT Unit" printed over "PERSONAL BUDGET" and its box covered the pencil */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex shrink-0 items-center gap-2">
              <div className={LABEL}>{t("fin.ladder_title")}</div>
              {/* EDIT MODE behind an icon (addendum 28 "add edit mode and icon on budget mode"): the pencil opens it, the check closes it;
                  the pressed state is a stroke ring, never a fill (the vector law). Only a signed-in person edits — the plan is saved under their key. */}
              {(
                <button type="button" data-fin-budget-edit aria-pressed={editing} aria-label={editing ? t("fin.done") : t("fin.edit")} title={editing ? t("fin.done") : t("fin.edit")}
                  onClick={() => { setEditing((v) => !v); setDrafts({}); setBudgetBad(""); }}
                  className={`rounded-md border p-1 ${editing ? "border-primary ring-1 ring-inset ring-primary" : "border-border"}`}>
                  {editing ? <Check size={14} strokeWidth={1.5} aria-hidden /> : <Pencil size={14} strokeWidth={1.5} aria-hidden />}
                </button>
              )}
            </div>
            {/* the unit toggle (addendum 17): one figure per row in the unit the person picks — $/s · $/min · $/h · $/day · $/week · 33 days · month · year */}
            {/* the unit — ONE dropdown (addendum 20 "use drop down": the eight pills wrapped over three rows on the phone) */}
            {/* addendum 21: in portrait the select is the panel's full width (the label above it) so "per hour" etc. read at the full line; landscape keeps it at its own width */}
            {/* r.065 (addendum 139 "place unit block on a single line to right of header on personal budget upper right · call MoT Unit") */}
            <label data-fin-mot-unit-row className="ml-auto flex min-w-0 items-center justify-end gap-1.5 whitespace-nowrap text-xs text-muted-foreground">{t("fin.mot_unit")}
              {/* r.067 (addendum 147 "Keep long description in drop down for MoT · for display however show /30D /7D /1M … shorthand"):
                  the list keeps the words; the closed box shows the shorthand over an invisible select that still takes the tap */}
              <span className="relative inline-flex rounded-md focus-within:ring-2 focus-within:ring-primary">
                <span data-fin-unit-short aria-hidden className="pointer-events-none rounded-md border border-border bg-background px-2 py-1 font-mono text-xs text-foreground">{UNIT_SHORT[budgetUnit] ?? budgetUnit} ▾</span>
                <select data-fin-budget-unit value={budgetUnit} onChange={(e) => setBudgetUnit(e.target.value as BudgetUnit)} aria-label={t("fin.mot_unit")} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
                  {UNITS.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
                </select>
              </span>
            </label>
          </div>
          {/* r.055 (addendum 119 + his answer "Short"): what the budget is for, in one plain line */}
          <p data-fin-budget-purpose className="mt-2 text-xs text-muted-foreground">{t("fin.budget_purpose")}</p>
          {planFailed && <p role="alert" data-fin-plan-save-failed className="mt-2 text-sm text-amber-500">{t("fin.save_failed_plan")}</p>}
          {/* the table (addenda 17 + 22 → 31): the budget by KIND — Income · Fixed · Variable (· Transfers) — one row per kind with its total in
              the chosen unit and a chevron; the lines beneath only when opened (edit mode opens all); Net last, red when negative; no letters */}
          {/* r.072: the unit header wraps when the phone is narrow — at 320 px it no longer pushes the page sideways */}
          <table className="mt-2 w-full font-mono text-xs">
            <thead className="text-left text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="py-1 pr-2">{t("fin.category")}</th><th className="py-1 text-right min-[360px]:whitespace-nowrap">{unitHead(UNITS.find((u) => u.key === budgetUnit)?.label ?? "", curMark)}</th></tr>
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
                    <td className="py-1 text-right tabular-nums">{numDollars(g.total)}</td>
                  </tr>
                  {/* r.040 (addendum 75): each line on ONE row — a short name, "…" if still long, the full name as the row title */}
                  {isOpen(g.kind) && g.lines.map((l) => (
                    <tr key={l.fieldId} data-fin-ladder-field={l.fieldId} className="text-muted-foreground"><td data-fin-line-name className="max-w-0 truncate whitespace-nowrap py-0.5 pl-6 pr-2 w-full" title={fieldLabel(l.fieldId)}><FieldIcon field={l.fieldId} section={fieldOf(l.fieldId)?.section ?? "L"} className="mr-1.5" />{shortLabel(l.fieldId)}</td>
                      <td className="whitespace-nowrap py-0.5 text-right tabular-nums">
                        {editing && !fromRecord(l.fieldId) ? (
                          <span className="flex items-center justify-end gap-1">
                            <input data-fin-plan-amount={l.fieldId} className="w-24 min-[360px]:w-28 rounded-md border border-border bg-background px-2 py-1 text-right text-xs text-foreground" inputMode="decimal"
                              value={drafts[l.fieldId] ?? editFigure(l)} onFocus={() => { focusLine.current = plan.find((x) => x.fieldId === l.fieldId) ?? null; }} onChange={(e) => typeAmount(l.fieldId, e.target.value)}
                              onBlur={() => setDrafts((d) => { const v = d[l.fieldId]; if (v !== undefined && v.trim() !== "" && parseBudgetAmount(v, marks) === null) return d; const n = { ...d }; delete n[l.fieldId]; return n; })} aria-invalid={budgetBad === l.fieldId || undefined} />
                            <button type="button" data-fin-plan-remove={l.fieldId} aria-label={t("fin.remove_line")} title={t("fin.remove_line")} onClick={() => writePlan(removeLine(plan, l.fieldId))} className="rounded-md border border-border p-1"><X size={12} strokeWidth={1.5} aria-hidden /></button>
                          </span>
                        ) : numDollars(inPeriod(l))}
                      </td></tr>
                  ))}
                </Fragment>
              ))}
              <tr className={`border-t border-border font-semibold ${totals.net < 0 ? "text-red-500" : "text-green-500"}`}><td data-fin-budget-net-label className="py-1 pr-2 text-[11px] min-[360px]:whitespace-nowrap">{/* r.045 (addendum 94): the Net line names its sign */}{totals.net < 0 ? t("fin.net_down") : t("fin.net_up")}</td><td data-fin-budget-net className="py-1 text-right tabular-nums">{numDollars(totals.net)}</td></tr>
            </tbody>
          </table>
          {/* r.073 second pre-push review (Enki): a refused figure is said — its own row, so a 320 px table never widens; the line kept its figure */}
          {editing && budgetBad && <p key={budgetBad} role="alert" data-fin-budget-bad className="mt-2 text-xs text-red-400">{t(amountProblem(drafts[budgetBad] ?? "", marks) === "large" ? "fin.reason_amount_large" : "fin.reason_amount_form")}</p>}
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
                <button type="button" data-fin-plan-reset onClick={() => { writePlan(sheetPlan()); setDrafts({}); setBudgetBad(""); }} className="min-h-[36px] rounded-md border border-border px-3 text-xs">{t("fin.reset_sheet")}</button>
              </span>
            </div>
          )}
        </div>

        {/* the chart — strokes only, day · hour · minute by default, A.B..C on reveal */}
        {focus && (
          <MotChart tx={focus} netPerSec={totalsPerSec.net} txs={txs} now={at} t={t} planet={planet} showAbc={showAbc} onToggle={setShowAbc} dateFmt={dateFmt} onDateFmt={pickDateFmt} angle={dateAngle} onAngle={pickDateAngle} locale={activeLocale}
            selector={<label className="flex items-center gap-1 text-xs text-muted-foreground">{t("fin.planet")}
              <select data-fin-planet value={planetCode} onChange={(e) => setPlanetCode(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                {planets.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
            </label>} />
        )}

        {/* the record — append-only, chain-hashed (FIN-05). r.028 (addendum 58 "sloppy · hide and click to expand with better table · every entry
            on a single line with ability to scroll to right"): folded behind a chevron; opened, a table, one entry per line, scrolling sideways */}
        <details data-fin-ledger className={`group ${SUB}`}>
          {/* r.073 (round 1, Sofia): the summary is read as what it shows — the title, a broken chain, the cloud — never a generic "show or hide" */}
          <summary className="flex min-h-[36px] cursor-pointer list-none items-center gap-1">
            <ChevronRight size={14} strokeWidth={1.5} aria-hidden className="transition-transform group-open:rotate-90" />
            <span className={LABEL}>{t("fin.tx_record")}{owner && tampered ? ` · ${t("fin.chain_broken")}` : ""}</span>
            {/* r.055: a small cloud says the record is in his account (tap-hold shows when) — no sentence on the glass */}
            {owner && <span data-fin-cloud={cloudMark} role="img" title={acctHolds ? `${t("fin.cloud_saved")} · ${fmtStampCST(cloudAt)}` : t("fin.cloud_not_yet")} aria-label={acctHolds ? t("fin.cloud_saved") : t("fin.cloud_not_yet")} className={acctHolds ? "text-green-500" : "text-muted-foreground"}>{/* r.065 (addendum 140 "use better cloud icon … universally accepted"): cloud-with-check = saved to your account, cloud-with-slash = not yet */}{/* r.067 (addendum 150 "ensure cloud raster with checkmark looks like this"): his cloud — three rounded bumps, a flat base, a bold outline */}<CloudMark saved={acctHolds} /></span>}   {/* r.041 (addenda 76–77): "TRANSACTION RECORD"; a broken chain is still said */}
          </summary>
          <div data-fin-ledger-scroll className="mt-2 overflow-x-auto">
            <table data-fin-ledger-table className="min-w-full whitespace-nowrap font-mono text-xs text-muted-foreground">
              {/* r.032 (addendum 63): Amount and Category first, then as a person reads an entry — who/what, when, how long, which way —
                  and the proof last (# and Hash). The amount is signed: + money in, − money out. */}
              <thead className="text-left text-[10px] uppercase tracking-wide">
                <tr><th className="py-1 pr-3">{t("fin.amount_col")}, {curMark}</th><th className="py-1 pr-3">{t("fin.category")}</th><th className="py-1 pr-3">{t("fin.memo")}</th><th className="py-1 pr-3">{t("fin.when")}</th><th className="py-1 pr-3 text-right">{t("fin.length")}</th><th className="py-1 pr-3">{t("fin.type")}</th><th className="py-1 pr-3">#</th><th className="py-1 pr-3">{t("fin.hash")}</th><th className="sticky right-0 bg-card py-1 pl-2"><span className="sr-only">{t("fin.edit_tx")}</span></th></tr>
              </thead>
              <tbody>
                {!owner && <tr className="border-t border-border/60"><td data-fin-amount className="py-1 pr-3 tabular-nums text-green-500"><span className="flex justify-between gap-4"><span>+</span><span>{num2(EXAMPLE.amountCents)}</span></span></td><td className="py-1 pr-3">{txWhat(EXAMPLE)}</td><td className="py-1 pr-3">{EXAMPLE.memo}</td><td className="py-1 pr-3">{fmtStampCST(EXAMPLE.atMs)}</td><td className="py-1 pr-3 text-right">{fmtDays(withMonthLaw(EXAMPLE).motDays ?? 0)}</td><td className="py-1 pr-3">{t("fin.deposit")}</td><td className="py-1 pr-3">1</td><td className="py-1 pr-3">—</td><td className="sticky right-0 bg-card" /></tr>}
                {owner && record.entries.length === 0 && <tr><td colSpan={9} className="py-1">{t("fin.no_deposits")}</td></tr>}
                {/* r.067 (addendum 151 "always order transactions in chronological order"): oldest first by day and time (an edited date re-sorts) */}
                {owner && record.entries.filter((e) => !e.tx.corrects).sort((a, b) => (effective.get(a.tx.id)?.atMs ?? a.tx.atMs) - (effective.get(b.tx.id)?.atMs ?? b.tx.atMs) || a.rev - b.rev).map((e) => {
                  const x = effective.get(e.tx.id) ?? e.tx, open = editId === e.tx.id;
                  return (
                  <Fragment key={e.hash}>
                  <tr data-fin-ledger-row={e.rev} className="border-t border-border/60">
                                        <td data-fin-amount className={`py-1 pr-3 tabular-nums ${x.kind === "deposit" ? "text-green-500" : "text-red-500"}`}><span className="flex justify-between gap-4"><span>{x.kind === "deposit" ? "+" : "−"}</span><span>{num2(x.amountCents)}</span></span></td>
                    <td className="py-1 pr-3">{txWhat(x)}</td><td className="py-1 pr-3">{x.memo ?? ""}</td>
                    <td className="py-1 pr-3">{fmtStampCST(x.atMs)}</td>
                    <td className="py-1 pr-3 text-right">{x.motDays ? fmtDays(withMonthLaw(x).motDays ?? 0) : ""}</td>
                    <td className="py-1 pr-3">{x.kind === "deposit" ? t("fin.deposit") : t("fin.withdrawal")}</td>
                    {/* r.073 (addendum 163 "remove history in Cyan. you can have history in supabase to see changes."): the entry number only —
                        every correction stays on the record and in the account copy, where the changes can be read; none is shown on the glass */}
                    <td className="py-1 pr-3">{e.rev}</td>
                    <td className="py-1 pr-3">{e.hash.slice(0, 8)}</td>
                    {/* r.067 (addendum 152 "I need edit button for individual transactions somewhere on right"): the pencil pinned to the RIGHT edge of every row — it stays in view while the table scrolls sideways */}
                    <td data-fin-edit-cell className="sticky right-0 bg-card py-1 pl-2"><button type="button" data-fin-edit={e.rev} aria-label={`${t("fin.edit_tx")} · #${e.rev} · ${x.kind === "deposit" ? "+" : "−"}${num2(x.amountCents)} · ${fmtStampCST(x.atMs)}`} title={t("fin.edit_tx")} aria-expanded={open} onClick={() => (open ? setEditId(null) : openEdit(x))} className={`flex h-8 w-8 items-center justify-center rounded-md border border-border ${open ? "text-primary" : ""}`}><Pencil size={13} strokeWidth={1.5} aria-hidden /></button></td>
                  </tr>
                  </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* r.062: the editor opens UNDER the table, full width (inside the sideways-scrolling table it sat off-screen on a phone) */}
          {owner && editId && (() => { const e = record.entries.find((q) => q.tx.id === editId); return e ? (
            <div data-fin-edit-panel={e.rev} role="group" aria-labelledby="fin-edit-title" className="mt-2 rounded-md border border-border p-2 text-xs">
              <p id="fin-edit-title" className="mb-2 font-mono text-muted-foreground">{t("fin.edit_tx")} · #{e.rev}</p>
              {/* r.073 (addendum 164 "all fields in edit of Transaction record should be possible to edit"): every field the form has */}
              <div className="grid grid-cols-2 items-end gap-2 sm:flex sm:flex-wrap">
                          <label className="col-span-2 text-[10px] uppercase">{t("fin.type")}
                            <select data-fin-edit-type className={PICK} value={ed.kind} onChange={(v) => { const kind = v.target.value as TxKind, inc = fieldOf(ed.field)?.kind === "Income"; setEd(kind === "withdrawal" && inc ? { ...ed, kind, sec: "B", field: "B.rent_mortgage" } : kind === "deposit" && !inc ? { ...ed, kind, sec: "A", field: "A.income_wages" } : { ...ed, kind }); }}>
                              <option value="deposit">{t("fin.type_deposit")}</option>
                              <option value="withdrawal">{t("fin.type_withdrawal")}</option>
                            </select>
                          </label>
                          <label className="text-[10px] uppercase">{t("fin.amount_col")}, {curMark}<input data-fin-edit-amount className={INPUT} inputMode="decimal" value={ed.amt} onChange={(v) => setEd({ ...ed, amt: v.target.value })} /></label>
                          <label className="text-[10px] uppercase">{t("fin.memo")}<input data-fin-edit-memo className={INPUT} value={ed.memo} onChange={(v) => setEd({ ...ed, memo: v.target.value })} /></label>
                          <label className="col-span-2 text-[10px] uppercase">{t("fin.when")}<input data-fin-edit-when className={INPUT} value={ed.when} onChange={(v) => setEd({ ...ed, when: v.target.value })} /></label>
                          <div data-fin-edit-pickers className="col-span-2 grid gap-2 sm:basis-full sm:grid-cols-3">
                            <LadderPicker section={ed.sec} field={ed.field} rec={ed.rec} onSection={(sec) => setEd((d) => ({ ...d, sec }))} onField={(field) => setEd((d) => ({ ...d, field }))} onRec={(rec) => setEd((d) => ({ ...d, rec }))} otherN={ed.otherN} onOtherN={(otherN) => setEd((d) => ({ ...d, otherN }))} otherUnit={ed.otherUnit} onOtherUnit={(otherUnit) => setEd((d) => ({ ...d, otherUnit }))} t={t} hook="edit" />
                          </div>
                          {ed.kind === "withdrawal" && !!cards.length && <label className="text-[10px] uppercase">{t("fin.paid_from")}<select data-fin-edit-paid-from className={PICK} value={ed.paidFrom} onChange={(v) => setEd({ ...ed, paidFrom: v.target.value })}><option value={DEBIT}>{t("fin.debit_account")}</option>{cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}{payerGone && <option value={ed.paidFrom}>—</option>}</select></label>}
                          {ed.kind === "withdrawal" && !!cards.length && ed.paidFrom === DEBIT && <label className="text-[10px] uppercase">{t("fin.card_paid")}<select data-fin-edit-pays-card className={PICK} value={ed.paysCard} onChange={(v) => setEd({ ...ed, paysCard: v.target.value })}><option value="">{t("fin.card_none")}</option>{cards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
                          <button type="button" data-fin-edit-save onClick={saveEdit} className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">{t("fin.done")}</button>
                          <button type="button" data-fin-edit-cancel onClick={() => setEditId(null)} className="h-9 rounded-md border border-border px-3 text-xs">{t("fin.edit_cancel")}</button>
                        </div>
                        {edRefusal && <p role="alert" key={edRefusalN} data-fin-edit-refusal className="mt-1 whitespace-normal text-xs text-red-500">{edRefusal}</p>}
            </div>) : null; })()}
        </details>

        {/* r.067 CREDIT CARDS (addenda 142–144) as of r.070 (addenda 154–157): the person's own cards — balance, available, the balance over
            time with the Red / Amber Alert lines; Add card, rename and remove; folded until opened */}
        {owner && <CardsPanel cards={cards} txs={recTxs} now={at} onSave={saveCards} onPay={payCard} t={t} marks={marks} failed={cardsFailed} />}

        {/* the year as a TABLE, key info in order, PERIHELION FIRST (r.028, addendum 58); months of 30 days (r.046 month law), no 33-day frame */}
        {year && (() => {
          // r.046 THE MONTH LAW (addenda 76, 92): three 30-day months make days 1–90 of a quarter; day 91 is the quarter's down day (no
          // transactions), as day 365 is the year's.
          const monthDays = 30;
          const qDown = !year.down && year.dayInQuarter === 91;
          const mInQ = year.down || qDown ? 0 : Math.ceil(year.dayInQuarter / monthDays);
          const month = year.down || qDown ? null : (year.quarter - 1) * 3 + mInQ;
          const dayInMonth = month === null ? null : year.dayInQuarter - (mInQ - 1) * monthDays;
          // ONE SYSTEM AT A TIME (r.038, addendum 72 "year position is either Gregorian or A.B..C, not a mix of both"):
          //  · Clock — the rows as they were (his answer "keep as is"): today's stamp, day, 91-day quarter, 30-day month (r.046), year.
          //  · MoT — A.B..C only, no stamps, no day counts: the perihelion as the origin, then equal parts of 3600 (addendum 73:
          //    quarter 900 A, month 300 A), then the revolution.
          const q = abcPart(year.abc, 900), mo = abcPart(year.abc, 300);
          const rows: [string, string][] = yearAbc ? [
            [t("fin.perihelion_abc"), fmtMot({ a: 0, b: 0, c: 0 })],   // the origin, in the same writing as every A.B..C here
            [t("fin.now_abc"), `${fmtMot(year.abc)} / 3600`],
            [t("fin.quarter"), `${q.n} · ${fmtMot(q.within)} / 900`],
            [t("fin.month"), `${mo.n} · ${fmtMot(mo.within)} / 300`],
            [t("fin.revolution"), String(year.year)],
          ] : [
            [t("fin.year_today"), `${fmtStampCST(at)} CST`],
            [t("fin.day"), `${year.day} / ${Math.ceil(year.lengthDays)}${year.pastFull ? " ↑" : ""}`],
            [t("fin.quarter"), year.down ? t("fin.down_day") : `${year.quarter} · ${year.dayInQuarter} / 91`],
            [t("fin.month"), month === null ? t("fin.down_day") : `${month} · ${dayInMonth} / ${monthDays}`],
            [t("fin.year"), `${year.year} · ${year.status}`],
          ];
          return (
            // r.038 (addendum 73): at the END of the page, folded to its title; opened, the Clock ⇄ MoT toggle and the rows
            <details data-fin-year className={`group ${SUB}`} data-fin-past-full={year.pastFull ? "1" : undefined}>
              <summary className="flex min-h-[36px] cursor-pointer list-none items-center gap-1" aria-label={t("fin.year_title")}>
                <ChevronRight size={14} strokeWidth={1.5} aria-hidden className="transition-transform group-open:rotate-90" />
                <span className={LABEL}>{t("fin.year_title")}</span>
              </summary>
              <div className="mt-2 flex justify-end"><ClockMotToggle abc={yearAbc} onChange={setYearAbc} t={t} hook="year" /></div>
              <table data-fin-year-table className="mt-2 w-full text-xs">
                <tbody>
                  {rows.map(([k, v], n) => (
                    <tr key={n} className="border-t border-border/60 first:border-t-0"><th scope="row" className="py-1 pr-3 text-left font-normal text-muted-foreground">{k}</th><td className="py-1 text-right font-mono tabular-nums text-foreground">{v}</td></tr>
                  ))}
                </tbody>
              </table>
              {planet.code !== "earth" && <p className="mt-1 text-xs text-muted-foreground">{t("fin.anchor_note")}</p>}
            </details>
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

        {/* r.042 (addendum 76 "cut Trinity icon way below"): the wheel lives in the header now, not here */}
      </section>


      <p className="mt-6 text-center text-[11px] text-muted-foreground">{SRC.project.stamp} · {stamp}</p>

      {/* the eXeL Polling Settings panel — the same one the app's navbar opens (theme colours, language, …) */}
      <ModeratorSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} userEmail={user?.email} isPollingUser={false} variant="nonMaster" />   {/* r.050 (addendum 76 + "Exactly 3 items"): the non-Master settings */}

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

/** One deposit over its MoT: released and escrowed as strokes, NOW and withdrawals as marks. With no hold (r.028) withdrawable IS released,
 *  so its separate stroke and legend word are gone (r.034, addendum 67: one colour per selector).
 *  BEHIND THE SCENES IS A.B..C — the revolution's coordinate (addendum 10) on the selected planet's whole (addendum 12):
 *  on reveal the axis reads the year position (positionInYear, the planet's anchor) at each mark and the elapsed span in
 *  A-units; the glass defaults to the planet's day · hour · minute (addendum 8). The toggle is the card's one state. */
/** r.047 THE SPAN TOGGLE (addenda 95–98): the chart re-spreads every transaction over one span from its entry time, as $/min —
 *  1x is the instant (no span: each lands whole), 1W 7 days, 1M the Standard Month (the calendar month of now), 30D the month law,
 *  91D the quarter, Y the Gregorian year of now (365, or 366 in a leap year, chosen automatically). The record and Available never
 *  change; only the picture does. */
type ChartSpan = "1x" | "1W" | "1M" | "30D" | "91D" | "Y";
const CHART_SPANS: readonly ChartSpan[] = ["1x", "1W", "1M", "30D", "91D", "Y"];
const SPAN_KEY = "fin-chart-span";
function spanDays(sp: ChartSpan, nowMs: number): number {
  if (sp === "1x") return 0;
  if (sp === "1W") return 7;
  if (sp === "1M") return calendarMonthDays(nowMs);
  if (sp === "30D") return 30;
  if (sp === "91D") return 91;
  const y = new Date(nowMs - 6 * 3600 * 1000).getUTCFullYear();
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 366 : 365;
}
const spanLabel = (sp: ChartSpan, nowMs: number): string => (sp === "Y" ? `${spanDays(sp, nowMs)}D` : sp);
/** r.065 (addenda 120 · 138 "in orbital timeline view, nonGregorian calendar references, just A.B..C · 3600 is 365 · quarter is 900 ·
 *  month is 300 · week is 75 · 1X"): the orbital (A.B..C) spans — A-units of the planet's revolution, never days or calendar words. */
const ORBIT_SPANS: readonly ChartSpan[] = ["1x", "1W", "1M", "91D", "Y"];
const ORBIT_A: Record<ChartSpan, number> = { "1x": 0, "1W": 75, "1M": 300, "30D": 300, "91D": 900, Y: 3600 };
const orbitLabel = (sp: ChartSpan): string => (sp === "1x" ? "1X" : String(ORBIT_A[sp]));
/** A span's length in the planet's days: in the orbital view A ÷ 3600 of its revolution; otherwise the calendar span. Pure. */
const spanDaysIn = (sp: ChartSpan, nowMs: number, orbital: boolean, yearDays: number): number => (orbital ? (ORBIT_A[sp] / 3600) * yearDays : spanDays(sp, nowMs));
/** r.052: the 1x live window's widths, narrowest first (addendum 101 "Zoom chart should expand out x axis"). */
const LIVE_WINDOWS: readonly { h: number; label: string }[] = [{ h: 1, label: "1 h" }, { h: 6, label: "6 h" }, { h: 24, label: "1 D" }, { h: 168, label: "1 W" }, { h: 720, label: "30 D" }, { h: 2184, label: "91 D" }, { h: 8760, label: "365 D" }];
/** r.052: the width the left $ scale takes in the chart's 360-unit viewBox. */
const Y_AXIS_W = 50;
/** r.052: the $ scale — the top, the middle, zero and (when Net goes below it) the bottom, in whole currency units. Pure. */
function yAxisTicks(min: number, max: number): number[] {
  const out = [max, max / 2, 0]; if (min < 0) out.push(min);
  return Array.from(new Set(out.map((v) => Math.round(v))));
}
/** r.053: a value at the tapped point, to the cent, in the picked currency. */
const money2 = (c: number): string => (Math.sign(c) === -1 ? "−" : "") + CUR_SYM + num2(c);
const yLabel = (c: number): string => (Math.sign(c) === -1 ? "−" : "") + CUR_SYM + Math.round(Math.abs(c) / 100).toLocaleString("en-US");
/** Every transaction re-spread over the span (1x = the instant). Pure. */
/** r.056: the chart's unit — $/min first (addendum 122 "$/min is main view"), then /sec /hr /day, then $ (the balance view). */
type ChartUnit = RateUnitId | "usd";
const CHART_UNITS: readonly ChartUnit[] = ["min", "sec", "hr", "day", "usd"];
const UNIT_KEY = "fin-chart-unit";
/** r.056: a rate in the picked currency — four decimals under a dollar a minute (his $0.0898/min), two above. */
const rateMoney = (centsPerUnit: number): string => { const d = Math.abs(centsPerUnit) / 100; return (Math.sign(centsPerUnit) === -1 && Math.round(d * 10000) !== 0 ? "−" : "") + CUR_SYM + (d < 10 ? d.toFixed(4) : d.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })); };
/** r.056 THE $/MIN VIEW (addenda 117 · 122 · 123 · 124 · 127): income, spending and net per minute on the shared R-CORE chart, the
 *  window the span's (starting at the current pay cycle so 30D reads the month to its end), the numbers in the upper right following
 *  the finger (Security-2525 style), one-time withdrawals as marks. Module-level (the picker law: the 1 s clock never remounts it). */
function RateView({ txs, now, span, liveHours, unit, showAbc, dateFmt, angle, planet, t, height = 300, tail }: { txs: FinTx[]; now: number; span: ChartSpan; liveHours: number; unit: RateUnitId; showAbc: boolean; dateFmt: DateFmt; angle: DateAngle; planet: PlanetLtuRow; t: (k: string) => string; height?: number; tail?: ReactNode }) {
  const dayMs = daySecOf(planet) * 1000;
  const spanMs = span === "1x" ? liveHours * 3600 * 1000 : spanDaysIn(span, now, showAbc, planet.yearDays) * dayMs;
  // the window: from the start of the current pay cycle (the latest deposit start at or before now, inside one span), else a third back
  const minuteNow = Math.floor(now / 60_000) * 60_000;
  // addendum 128: "$/min takes all transaction records and divides by MoT selected (default 30D)" — every entry over the chart's MoT
  const spread = useMemo(() => overSpan(txs, spanMs / dayMs), [txs, spanMs, dayMs]);
  const cycle = windowStart(spread, minuteNow);
  const from = span === "1x" ? minuteNow - spanMs : Number.isFinite(cycle) && cycle > minuteNow - spanMs ? cycle : minuteNow - spanMs / 3;
  const to = span === "1x" ? minuteNow : from + spanMs;
  // addendum 130 ("30D means cost split into 30 days, not necessarily range of x axis · pinch zoom shows more dates"): the lines run over
  // a WIDE range — a split before the first entry to a split past the last one — and the chart OPENS on the window above; pinching or
  // dragging shows more or fewer dates without changing a figure. Sampled on one even clock (≤ 2,000 points).
  const firstAt = txs.length ? Math.min(...txs.map((x) => x.atMs)) : from, lastAt = txs.length ? Math.max(...txs.map((x) => x.atMs)) : to;
  const dataFrom = Math.min(from, firstAt) - spanMs, dataTo = Math.max(to, lastAt + spanMs) + spanMs;
  const pts = useMemo(() => rateSeries(spread, dataFrom, dataTo), [spread, dataFrom, dataTo]);
  const nowInside = !(minuteNow < from) && !(minuteNow > to);
  // addendum 136: every transaction draws a thin dotted line; each spend also a dot and its amount (overlapping dots sum into one)
  const marks = txs.map((w) => (w.kind === "withdrawal" ? { t: w.atMs, color: C.evolution, text: `−${CUR_SYM}${num2(w.amountCents)}`, value: w.amountCents } : { t: w.atMs, color: C.abundance, dot: false }));
  const unitLabel = CHART_RATE_UNITS.find((u) => u.id === unit)?.label ?? "/min";
  // the date marks for whatever range is in view: as many whole days as fit at the Settings angle; A.B..C mode: five marks
  const fit = angle === 0 ? (dateFmt === "full" ? 4 : dateFmt === "mmdd" ? 6 : 10) : angle === 90 ? (dateFmt === "full" ? 14 : 18) : (dateFmt === "full" ? 6 : dateFmt === "mmdd" ? 10 : 16);
  const ticksFor = (a: number, b: number) => (showAbc ? [0.1, 0.3, 0.5, 0.7, 0.9].map((f) => a + f * (b - a)) : dayTicks(a, b, fit));
  const tick = (ms: number) => (showAbc ? fmtMot(positionInYear(ms, planet.yearAnchor, planet.yearDays).abc).split(".")[0] : dateLabel(ms, dateFmt));
  const figuresAt = (ms: number) => { const q = rateAtSeries(pts, ms) ?? { income: 0, spending: 0, net: 0 }; return [{ color: C.abundance, text: rateMoney(rateIn(q.income, unit)) + unitLabel }, { color: C.evolution, text: rateMoney(rateIn(q.spending, unit)) + unitLabel }, { color: C.temporal, text: rateMoney(rateIn(q.net, unit)) + unitLabel }]; };
  const N = Math.min(2000, Math.max(241, Math.ceil((dataTo - dataFrom) / 60_000) + 1));
  const grid = useMemo(() => Array.from({ length: N }, (_, i) => dataFrom + ((dataTo - dataFrom) * i) / (N - 1)), [dataFrom, dataTo, N]);
  const line = (key: "income" | "spending" | "net") => grid.map((g) => ({ t: g, v: rateIn(rateAtSeries(pts, g)?.[key] ?? 0, unit) / 100 }));
  return (
    <div data-fin-rate-view className="relative mt-2">
      {/* addendum 129: FIGURES ONLY, in their lines' colours, beside the selected date's vertical line (now, or under the finger); the
          dates tilt at the Settings angle */}
      <RCoreChart height={height} ariaLabel={t("fin.chart_tap")} angle={angle} tall={!showAbc && dateFmt === "full"} ticksFor={ticksFor} formatTick={tick}
        initialRange={{ from, to }} readoutAt={nowInside ? minuteNow : from} readout={figuresAt} formatSelected={(ms) => (showAbc ? fmtMot(positionInYear(ms, planet.yearAnchor, planet.yearDays).abc) : fmtStampCST(ms).slice(0, 16).replace("_", " "))}
        lines={[{ id: "income", color: C.abundance, points: line("income"), step: true }, { id: "spending", color: C.evolution, points: line("spending"), step: true }, { id: "net", color: C.temporal, points: line("net"), step: true, width: 3 }]}
        marks={marks} formatMarkSum={(c) => `−${CUR_SYM}${num2(c)}`} formatValue={(v) => rateMoney(v * 100)} />
      {/* r.067 (addendum 145 "Add MoT next to $/hr and place in line with text on left" · "$/hr is right of income spending and net"):
          the legend left, MoT + the unit at the right of the SAME line */}
      <p data-fin-rate-legend className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span style={{ color: C.abundance }}>— {t("fin.income")}</span><span style={{ color: C.evolution }}>— {t("fin.spending")}</span><span style={{ color: C.temporal }}>— {t("fin.net")}</span>
        {tail && <span className="ml-auto">{tail}</span>}
        {/* r.064 (addendum 137 "remove: Net by 07 +$3,893.14"): the Net-by figure is gone from the legend */}
      </p>
    </div>
  );
}
function respread(txs: readonly FinTx[], sp: ChartSpan, nowMs: number, orbital = false, yearDays = 365): FinTx[] {
  const d = spanDaysIn(sp, nowMs, orbital, yearDays);
  return txs.map((x) => ({ ...x, motDays: d }));
}
/** r.067 (addendum 150): the cloud mark drawn to his reference — a small left bump, a large middle bump, a right bump, a FLAT base and a
 *  bold outline; a check inside when saved to the account, a slash across when not yet. Strokes only (the vector law). */
function CloudMark({ saved, size = 18 }: { saved: boolean; size?: number }) {
  return (
    <svg data-fin-cloud-mark={saved ? "saved" : "not-yet"} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="inline-block align-[-3px]">
      <path d="M6.6 19.5h10.9a4.5 4.5 0 0 0 .55-8.97 5.9 5.9 0 0 0-11.25-1.6A4.2 4.2 0 0 0 2.6 13.6c0 3.3 1.9 5.9 4 5.9z" />
      {saved ? <path d="M8.6 14.4l2.3 2.3 4.6-4.6" /> : <path d="M3.5 3.5l17 17" />}
    </svg>
  );
}
/** r.070 (addendum 155): the alert words — the key's "Red Alert" / "Amber Alert", the cockpit warning and the Balance's spoken state. */
/** r.072 AsM: a card's name is a name — long enough for "Capital One Venture X Rewards", never a pasted paragraph that pushes the page */
const CARD_NAME_MAX = 40;
/** r.072 AsM: the budget's unit header — from 360 px up it stays on one line; below it the one break is after "per", so the "$" never
 *  stands alone (non-breaking spaces inside "(30 days)" and before the currency). */
const unitHead = (label: string, cur: string): string => `${label.replace(/ \(/g, "\u00a0(").replace(/(\d) /g, "$1\u00a0")},\u00a0${cur}`;
const ALERT_WORD: Record<CardLevel, string> = { ok: "", amber: "fin.card_level_amber", red: "fin.card_level_red", over: "fin.card_level_over" };
/** r.067 THE CARDS PANEL (module-level: the picker law — the 1 s clock never remounts its selects). */
function CardsPanel({ cards, txs, now, onSave, onPay, t, marks, failed }: { cards: Card[]; txs: FinTx[]; now: number; onSave: (c: Card[]) => void; onPay: (id: string) => void; t: (k: string) => string; marks: readonly string[]; failed: boolean }) {
  const [pick, setPick] = useState(cards[0]?.id ?? "");
  const [gear, setGear] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [draft, setDraft] = useState({ name: "", limit: "", amber: "", red: "", opening: "" });
  const [bad, setBad] = useState("" as "" | "levels" | "name" | "amount" | "large");
  const card = cards.find((c) => c.id === pick) ?? cards[0];
  const bal = card ? cardBalanceAt(card, txs, now) : 0, lv: CardLevel = card ? cardLevel(card, bal) : "ok";
  // r.073 pre-push review (Enki): "1e400" or "0x10" never make a card — the card's check refuses NaN; r.073 second review (Enki): the currency's
  // own mark is read here as on every other form ("R$ 3,000" under BRL), and a figure that does not read is said as such, never as a levels problem
  const cents = (v: string) => parseCardCents(v, marks);
  const unread = (...vals: string[]) => vals.some((v) => Number.isNaN(cents(v)));
  const tooLarge = (...vals: string[]) => vals.some((v) => amountProblem(v, marks) === "large");   // r.073 twelve-lens (Aset): the forms' own sentence
  // r.070 (addendum 157 "allow user to set up their own CC"): a card the person sets up — a name (never a number), a limit and the balance as
  // of now; an amber or red level left blank takes his proportions, half and two-thirds of the limit (shown as the field's hint)
  const openAdd = () => { setDraft({ name: "", limit: "", amber: "", red: "", opening: "" }); setBad(""); setGear(false); setRemoving(false); setAdding((v) => !v); };
  const hint = (f: number) => (cents(draft.limit) > 0 ? ((cents(draft.limit) * f) / 100).toFixed(2) : "");
  const add = () => {
    if (!draft.name.trim() || looksLikeCardNumber(draft.name)) { setBad("name"); return; }
    if (unread(draft.limit, draft.opening, draft.amber, draft.red)) { setBad(tooLarge(draft.limit, draft.opening, draft.amber, draft.red) ? "large" : "amount"); return; }
    const c = newCard({ name: draft.name, limitCents: cents(draft.limit), openingCents: draft.opening.trim() ? cents(draft.opening) : 0, amberCents: draft.amber.trim() ? cents(draft.amber) : undefined, redCents: draft.red.trim() ? cents(draft.red) : undefined }, now, uniqueCardId(cards, now));
    if (!c) { setBad("levels"); return; }
    setBad(""); setAdding(false); setPick(c.id); onSave([...cards, c]);
  };
  const openGear = () => { if (!card) return; setDraft({ name: card.name, limit: (card.limitCents / 100).toFixed(2), amber: (card.amberCents / 100).toFixed(2), red: (card.redCents / 100).toFixed(2), opening: (bal / 100).toFixed(2) }); setBad(""); setAdding(false); setRemoving(false); setGear((g) => !g); };
  const save = () => {
    if (!card) return;
    if (!draft.name.trim() || looksLikeCardNumber(draft.name)) { setBad("name"); return; }
    // r.073 twelve-lens review (Enki — blocker): the balance left as shown ("-264.73" on a card in credit) is never read, so it is never refused
    const same = draft.opening.trim() === (bal / 100).toFixed(2);
    if (unread(draft.limit, draft.amber, draft.red) || (!same && unread(draft.opening))) { setBad(tooLarge(draft.limit, draft.opening, draft.amber, draft.red) ? "large" : "amount"); return; }
    // r.070 (AsM review, Enki): a balance left as shown keeps the opening and its date; only a changed one re-bases at now (cards.ts). r.073 second
    // review (Enki): "left as shown" is read from the text itself — a card in credit shows "-264.73", which no reader takes, and every edit of it
    // was refused. A level left blank takes the add form's proportions (half and two-thirds of the limit), never 0.00 (a permanent amber alert).
    const lim = cents(draft.limit);
    const c2 = applyCardSettings(card, { name: draft.name, limitCents: lim, amberCents: draft.amber.trim() ? cents(draft.amber) : Math.round(lim * 0.5), redCents: draft.red.trim() ? cents(draft.red) : Math.round((lim * 2) / 3), openingCents: same ? bal : cents(draft.opening) }, bal, now);
    if (!c2) { setBad("levels"); return; }
    setBad("");
    onSave(cards.map((c) => (c.id === card.id ? c2 : c))); setGear(false);
  };
  // r.070 (addendum 157): a card can be removed — two taps, the second naming the card; its past transactions stay in the record
  const remove = () => { if (!card) return; const next = cards.filter((c) => c.id !== card.id); setGear(false); setRemoving(false); setPick(next[0]?.id ?? ""); onSave(next); };
  const LV = { ok: "text-green-500", amber: "text-yellow-600 dark:text-yellow-400", red: "text-red-400", over: "text-red-400" }[lv];   // r.070 (AsM, Sofia): red-400 holds AA contrast on his theme
  const FIELD = "h-9 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground";
  const badLine = bad && <p data-fin-cards-bad className="col-span-2 text-xs text-red-400">{t(bad === "name" ? "fin.card_name_bad" : bad === "amount" ? "fin.reason_amount_form" : bad === "large" ? "fin.reason_amount_large" : "fin.card_bad")}</p>;
  return (
    /* r.070 (addendum 156 "have CC default minimized"): folded to its title like the Transaction Record and the Year Position; opened,
       Pay card and the settings sit on the first row (the Year card's pattern — no button inside the summary). An alert still shows at the
       top of the cockpit while the panel is closed. */
    <>
    {/* r.073 second pre-push review (Thor): cards this device would not keep are said — above the folded panel, so it is seen */}
    {failed && <p role="alert" data-fin-cards-save-failed className="mb-2 text-sm text-amber-500">{t("fin.save_failed_cards")}</p>}
    <details data-fin-cards className={`group ${SUB}`}>
      <summary className="flex min-h-[36px] cursor-pointer list-none items-center gap-1" aria-label={t("fin.cards_title")}>
        <ChevronRight size={14} strokeWidth={1.5} aria-hidden className="transition-transform group-open:rotate-90" />
        <span className={LABEL}>{t("fin.cards_title")}</span>
      </summary>
      <div className="mt-2 flex items-center justify-end gap-2">
        {card ? (<>
        <button type="button" data-fin-card-pay onClick={() => onPay(card.id)} className="h-8 shrink-0 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">{t("fin.card_pay")}</button>
        <button type="button" data-fin-cards-gear aria-expanded={gear} aria-label={t("fin.settings")} title={t("fin.settings")} onClick={openGear} className={`flex h-8 w-9 items-center justify-center rounded-md border border-border ${gear ? "text-primary" : "text-muted-foreground"}`}><Settings size={16} strokeWidth={1.5} aria-hidden /></button>
        </>) : (
        <button type="button" data-fin-card-add aria-expanded={adding} onClick={openAdd} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"><Plus size={14} strokeWidth={1.5} aria-hidden />{t("fin.card_add")}</button>
        )}
      </div>
      {card && (
      <div role="group" aria-label={t("fin.cards_title")} data-fin-card-toggle className="mt-2 flex w-full overflow-hidden rounded-md border border-border text-xs">
        {cards.map((c) => <button key={c.id} type="button" data-fin-card={c.id} aria-pressed={c.id === card.id} onClick={() => { setPick(c.id); setGear(false); setAdding(false); }} className={`min-h-[32px] min-w-0 flex-1 truncate border-l border-border px-1 first:border-l-0 ${c.id === card.id ? "ring-1 ring-inset ring-primary text-primary" : "text-muted-foreground"}`}>{c.name}</button>)}
        <button type="button" data-fin-card-add aria-expanded={adding} aria-label={t("fin.card_add")} title={t("fin.card_add")} onClick={openAdd} className={`flex min-h-[32px] w-10 shrink-0 items-center justify-center border-l border-border ${adding ? "text-primary" : "text-muted-foreground"}`}><Plus size={16} strokeWidth={1.5} aria-hidden /></button>
      </div>
      )}
      {adding && (
        <div data-fin-card-add-form className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-border p-2 text-xs">
          <label className="col-span-2 flex flex-col gap-1 text-muted-foreground">{t("fin.card_name")}<input data-fin-card-new="name" autoComplete="off" maxLength={CARD_NAME_MAX} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={FIELD} /></label>
          {([["limit", "fin.card_limit"], ["opening", "fin.card_opening"], ["amber", "fin.card_amber_at"], ["red", "fin.card_red_at"]] as const).map(([k, key]) => (
            <label key={k} className="flex flex-col gap-1 text-muted-foreground">{t(key)}<input data-fin-card-new={k} inputMode="decimal" value={draft[k]} placeholder={k === "amber" ? hint(0.5) : k === "red" ? hint(2 / 3) : undefined} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className={FIELD} /></label>
          ))}
          {badLine}
          <button type="button" data-fin-card-add-save onClick={add} className="h-9 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">{t("fin.card_add")}</button>
          <button type="button" data-fin-card-add-cancel onClick={() => { setAdding(false); setBad(""); }} className="h-9 rounded-md border border-border px-3 text-xs">{t("fin.edit_cancel")}</button>
        </div>
      )}
      {card && (<>
      {/* r.069 (addendum 154 "show balance and available, place limit in setting for credit card"): Balance on the left, Available
          credit on the right; the Limit lives in the gear's settings, its first field */}
      <div data-fin-card-figures className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div><div className="text-muted-foreground">{t("fin.card_balance")}</div><div data-fin-card-balance className={`font-mono text-sm tabular-nums ${LV}`}>{usd(bal)}{lv !== "ok" && <span className="sr-only"> · {t(ALERT_WORD[lv])}</span>}</div></div>
        <div className="text-right"><div className="text-muted-foreground">{t("fin.card_available")}</div><div data-fin-card-available className="font-mono text-sm tabular-nums text-foreground">{usd(card.limitCents - bal)}</div></div>
      </div>
      {gear && (
        <div data-fin-cards-menu className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-border p-2 text-xs">
          <label className="col-span-2 flex flex-col gap-1 text-muted-foreground">{t("fin.card_name")}<input data-fin-card-input="name" autoComplete="off" maxLength={CARD_NAME_MAX} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={FIELD} /></label>
          {([["limit", "fin.card_limit"], ["opening", "fin.card_opening"], ["amber", "fin.card_amber_at"], ["red", "fin.card_red_at"]] as const).map(([k, key]) => (
            <label key={k} className="flex flex-col gap-1 text-muted-foreground">{t(key)}<input data-fin-card-input={k} inputMode="decimal" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className={FIELD} /></label>
          ))}
          {badLine}
          <button type="button" data-fin-cards-save onClick={save} className="col-span-2 h-9 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">{t("fin.done")}</button>
          {removing ? (
            <div data-fin-card-remove-ask className="col-span-2 flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-sm text-red-400">{card.name}</span>
              <span className="flex shrink-0 gap-2">
                <button type="button" data-fin-card-remove-yes onClick={remove} className="h-9 rounded-md border border-red-500 px-3 text-xs font-medium text-red-400">{t("fin.card_remove")}</button>
                <button type="button" data-fin-card-remove-no onClick={() => setRemoving(false)} className="h-9 rounded-md border border-border px-3 text-xs">{t("fin.edit_cancel")}</button>
              </span>
            </div>
          ) : (
            <button type="button" data-fin-card-remove onClick={() => setRemoving(true)} className="col-span-2 h-9 rounded-md border border-border px-3 text-xs text-red-400">{t("fin.card_remove")}</button>
          )}
        </div>
      )}
      <CardChart card={card} txs={txs} now={now} t={t} />
      </>)}
    </details>
    </>
  );
}
/** The card's balance chart and its Alerts key (r.067 · r.070) — only ever drawn for a card that exists. */
function CardChart({ card, txs, now, t }: { card: Card; txs: FinTx[]; now: number; t: (k: string) => string }) {
  const pts = cardSeries(card, txs, now), D = 86_400_000;
  // r.070 (AsM review — all three reviewers): the window moves once a day, never with the 1-second clock, so a tap or a zoom stays put
  const from = card.openingAtMs - D, to = Math.floor(Math.max(now, card.openingAtMs) / D) * D + 8 * D;
  const N = 400, grid = Array.from({ length: N }, (_, i) => from + ((to - from) * i) / (N - 1));
  const at = (g: number) => { let v = pts[0].v; for (const p of pts) { if (p.t <= g) v = p.v; else break; } return g < card.openingAtMs ? card.openingCents : v; };
  const flat = (cents: number) => grid.map((g) => ({ t: g, v: cents / 100 }));
  // r.070 (AsM review): a tapped figure takes the colour of ITS moment's level, not today's
  const tone = (cents: number) => { const l = cardLevel(card, cents); return l === "ok" ? C.abundance : l === "amber" ? C.temporal : C.evolution; };
  // r.070 (AsM review, Sofia/Aset): the chart speaks the balance and both alert levels — the key itself is for the eye only
  const spoken = `${t("fin.cards_title")} · ${card.name} · ${t("fin.card_balance")} ${usd(Math.round(at(now)))} · ${t("fin.card_level_amber")} ${usd(card.amberCents)} · ${t("fin.card_level_red")} ${usd(card.redCents)}`;
  return (<>
      <div className="mt-2">
        <RCoreChart height={200} ariaLabel={spoken} ticksFor={(a, b) => dayTicks(a, b, 6)} formatTick={(ms) => dateLabel(ms, "mmdd")} initialRange={{ from, to }} quietAtRest readoutAt={now} readout={(ms) => [{ color: tone(Math.round(at(ms))), text: usd(Math.round(at(ms))) }]}
          formatSelected={(ms) => fmtStampCST(ms).slice(0, 16).replace("_", " ")}
          lines={[{ id: "amber", color: C.temporal, points: flat(card.amberCents), step: true, dashed: true, width: 1 }, { id: "red", color: C.evolution, points: flat(card.redCents), step: true, dashed: true, width: 1 }, { id: "balance", color: C.abundance, points: grid.map((g) => ({ t: g, v: at(g) / 100 })), step: true, width: 3 }]}
          marks={cardMoves(card, txs).map((m) => ({ t: m.t, color: m.deltaCents > 0 ? C.evolution : C.abundance, dot: false }))}
          formatValue={(v) => `${CUR_SYM}${Math.round(v).toLocaleString("en-US")}`} />
      </div>
      {/* r.070 (addendum 155 "put key for Alerts · Show Red - - - Red Alert · Show Amber - - - Amber Alert"): the key to the two dashed
          lines, drawn with the chart's own dash and colours */}
      <div data-fin-card-alerts aria-hidden="true" className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="font-medium">{t("fin.card_alerts")}</span>
        {([["red", C.evolution, "fin.card_level_red"], ["amber", C.temporal, "fin.card_level_amber"]] as const).map(([k, color, key]) => (
          <span key={k} data-fin-card-alert={k} className="inline-flex items-center gap-1.5"><svg width="22" height="6" aria-hidden="true"><line x1="0" y1="3" x2="22" y2="3" stroke={color} strokeWidth="1.5" strokeDasharray="5 4" /></svg>{t(key)}</span>
        ))}
      </div>
  </>);
}
function MotChart({ tx, txs, now, t, planet, showAbc, onToggle, selector, dateFmt, onDateFmt, angle, onAngle, locale, netPerSec = 0 }: { tx: FinTx; txs: FinTx[]; now: number; t: (k: string) => string; netPerSec?: number; planet: PlanetLtuRow; showAbc: boolean; onToggle: (v: boolean) => void; selector?: ReactNode; dateFmt: DateFmt; onDateFmt: (f: DateFmt) => void; angle: DateAngle; onAngle: (a: DateAngle) => void; locale: string }) {
  // r.074 (addendum 188 "landscape on PC is not full width"): the $ view spans the card's full width. The drawing keeps 150 units of height
  // and gains width as the card widens, so a wide screen draws a longer chart instead of a taller one (the height stops at 300 px; in full
  // screen it is the height the screen leaves, r.073); a phone held upright still draws the 360 × 150 it always did. Strokes keep their size.
  const H = 150, P = 10;
  const plotRef = useRef<HTMLDivElement | null>(null);
  const [plotW, setPlotW] = useState(0);
  // r.064 (addendum 135 "wheres my expand for financial chart"; his answer "Full screen"): the card fills the screen, a ✕ brings it back
  const [full, setFull] = useState(false);
  const [vh, setVh] = useState(800);
  const [fitH, setFitH] = useState(0);   // r.073: the full-screen chart's measured height (fitted below)
  const usdH = full ? fitH || Math.max(100, vh - 260) : Math.min(300, (plotW * H) / 360);
  const W = plotW > 0 && usdH > 0 ? Math.max(360, Math.round((H * plotW) / usdH)) : 360;
  // the plot's LEFT edge moves in when dates show, so the first date at 30° never runs off the card (r.025)
  // r.052 (addendum 101 "i need $ on left y axis"): the plot starts right of the $ scale, and never left of the first date at 30°
  const PL = Math.max(Y_AXIS_W, showAbc || angle === 0 || angle === 90 ? P + 4 : dateFmt === "full" ? 48 : dateFmt === "mmdd" ? 26 : 14);
  const dayMs = daySecOf(planet) * 1000;
  // r.047: the span, remembered on this phone; every transaction re-spread over it from its entry time
  const [span, setSpan] = useState<ChartSpan>("30D");
  // r.056 (addenda 122 · 127 "remember I said $/min is main view" · "where is $/min chart?!?"): the chart's unit — $/min by default
  // (/sec /min /hr /day) or $ (the balance view of r.025–r.053, unchanged); remembered on this phone
  const [unit, setUnit] = useState<ChartUnit>("min");
  useEffect(() => { try { const v = localStorage.getItem(UNIT_KEY) as ChartUnit | null; if (v && CHART_UNITS.includes(v)) setUnit(v); } catch { /* storage blocked: $/min stands */ } }, []);
  const pickUnit = (v: ChartUnit) => { setUnit(v); setProbe(null); try { localStorage.setItem(UNIT_KEY, v); } catch { /* the pick still applies this visit */ } };
  const rate = unit !== "usd";
  const [probe, setProbe] = useState(null as number | null);
  useEffect(() => { try { const v = localStorage.getItem(SPAN_KEY) as ChartSpan | null; if (v && CHART_SPANS.includes(v)) setSpan(v); } catch { /* storage blocked: the default stands */ } }, []);
  const pickSpan = (v: ChartSpan) => { setSpan(v); setProbe(null); try { localStorage.setItem(SPAN_KEY, v); } catch { /* the pick still applies this visit */ } };
  // r.052 (addendum 101 "chart should show transactions for 1x real-time (Zoom chart should expand out x axis"; his answer "Live window,
  // pinch widens"): 1x is a LIVE window ending now — 1 h at first — each transaction a step the moment it lands; spreading two fingers
  // (or −) widens it to hours, days, weeks; pinching them together (or +) narrows it again.
  const [zoom, setZoom] = useState(0);
  const live = span === "1x";
  const widen = (d: number) => { setZoom((z) => Math.max(0, Math.min(LIVE_WINDOWS.length - 1, z + d))); setProbe(null); };
  const pinch = useRef({ ids: new Map<number, number>(), d0: 0 });
  const onPDown = (e: { pointerId: number; clientX: number }) => { if (live) { pinch.current.ids.set(e.pointerId, e.clientX); if (pinch.current.ids.size === 2) { const [a, b] = Array.from(pinch.current.ids.values()); pinch.current.d0 = Math.abs(a - b); } } };
  const onPMove = (e: { pointerId: number; clientX: number }) => {
    const pc = pinch.current; if (!live || !pc.ids.has(e.pointerId)) return; pc.ids.set(e.pointerId, e.clientX);
    if (pc.ids.size !== 2 || !(pc.d0 > 0)) return; const [a, b] = Array.from(pc.ids.values()); const d = Math.abs(a - b);
    if (d > pc.d0 * 1.25) { widen(1); pc.d0 = d; } else if (d < pc.d0 / 1.25) { widen(-1); pc.d0 = d; }
  };
  const onPUp = (e: { pointerId: number }) => { pinch.current.ids.delete(e.pointerId); if (pinch.current.ids.size < 2) pinch.current.d0 = 0; };
  const all = respread(txs.length ? txs : [tx], span, now, showAbc, planet.yearDays);
  const deps = all.filter((x) => x.kind === "deposit");
  const spanMs = spanDaysIn(span, now, showAbc, planet.yearDays) * dayMs;
  const from = live ? now - LIVE_WINDOWS[zoom].h * 3600 * 1000 : Math.min(...all.map((x) => x.atMs));
  const to = live ? now : Math.max(from + dayMs, now, ...all.map((x) => x.atMs + spanMs));
  const len = to - from;
  function inside(ms: number) { return !(ms < from) && !(ms > to); }
  const withdrawals = all.filter((x) => x.kind === "withdrawal" && inside(x.atMs));
  // r.071 AsM review: the balance series is drawn only in the $ view — the $/min view (the default) never pays for it; one walk either way
  const pts = rate ? [] : series(all, from, to, len / 120);
  const total = Math.max(1, deps.reduce((a, x) => a + x.amountCents, 0));
  // r.052 (addendum 101 "if 30 days $/min is shown over 30 days, so we can predict end of month NET • Upside or NET • Downside"; his
  // answers "Budget table" · "Net + Released + Escrow"): Net runs at the budget table's $/min over the last span of the chart, from 0 to
  // the span's end — at 30D its end IS the table's Net. Not on 1x (the live window looks back; Net looks ahead).
  const netFrom = Math.max(from, to - spanMs);
  const netAt = (ms: number) => netPerSec * 100 * (Math.max(0, ms - netFrom) / 1000);
  const netEnd = live ? 0 : netAt(to);
  const yMin = Math.min(0, netEnd), yMax = Math.max(total, netEnd);
  const x = (ms: number) => PL + ((ms - from) / len) * (W - PL - P);
  const y = (cents: number) => H - P - (Math.max(0, Math.min(1, (cents - yMin) / (yMax - yMin))) * (H - 2 * P));
  const yTicks = yAxisTicks(yMin, yMax);
  const probeBal = probe === null || rate ? null : balanceAt(all, probe);   // r.053: the stock-chart readout ($ view only)
  const probeNet = probe === null || live || netPerSec === 0 ? null : netAt(probe);
  const poly = (pick: (p: (typeof pts)[number]) => number) => pts.map((p) => `${x(p.t).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");
  const sw = VECTOR_LAW.stroke.normal, hair = VECTOR_LAW.stroke.hairline;
  // A.B..C mode keeps the five marks; Clock mode reads CALENDAR DATES at 30° (addendum 42), as many whole days as fit
  const axis = [0, 0.25, 0.5, 0.75, 1].map((f) => fmtMot(positionInYear(from + f * len, planet.yearAnchor, planet.yearDays).abc));
  // how many dates fit depends on the angle: flat text needs the most room, upright the least
  const fit = angle === 0 ? (dateFmt === "full" ? 4 : dateFmt === "mmdd" ? 6 : 10) : angle === 90 ? (dateFmt === "full" ? 14 : 18) : (dateFmt === "full" ? 6 : dateFmt === "mmdd" ? 10 : 16);
  const ticks = showAbc ? [] : dayTicks(from, to, fit);
  const monthName = (ms: number) => { const m = cstParts(ms).mo; try { return new Intl.DateTimeFormat(locale || "en", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, m - 1, 15))); } catch { return new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(2026, m - 1, 15))); } };
  // TAP OR DRAG ON THE CHART → the day and time at that point (addendum 42 "find way to click on to see day / time stamp")
  const probeAt = (e: { clientX: number; currentTarget: SVGSVGElement }) => { const r = e.currentTarget.getBoundingClientRect(); if (!(r.width > 0)) return; const vx = ((e.clientX - r.left) / r.width) * W; setProbe(from + Math.max(0, Math.min(1, (vx - PL) / (W - PL - P))) * len); };
  const [gear, setGear] = useState(false);
  const unitPicker = (
    <label data-fin-chart-unit-label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{rate && t("fin.mot")}
      <select data-fin-chart-unit aria-label={t("fin.unit")} title={t("fin.unit")} value={unit} onChange={(e) => pickUnit(e.target.value as ChartUnit)} className="h-8 rounded-md border border-border bg-background px-2 font-mono text-xs text-foreground">
        {CHART_UNITS.map((u) => <option key={u} value={u}>{u === "usd" ? CUR_SYM : `${CUR_SYM}${CHART_RATE_UNITS.find((r) => r.id === u)?.label ?? ""}`}</option>)}
      </select>
    </label>
  );
  // r.073 (addendum 165 "full screen mode with financial chart messes up. not all is legible"): the full-screen view covers the screen the
  // person SEES — the visual viewport — not the page's layout width. A phone that zoomed the page in (iOS does when a box under 16 px gets
  // the focus) showed only part of a layout-sized view: cut at both edges (measured at ×1.14: 8 controls past the right edge; at ×1.33 the
  // left edge too). Sized and placed to the visual viewport, everything fits whatever the zoom.
  const [vv, setVv] = useState(null as null | { l: number; t: number; w: number; h: number });
  const layerRef = useRef(null as HTMLDivElement | null);
  useEffect(() => {
    if (!full) return;
    const v = typeof window !== "undefined" ? window.visualViewport : null;
    const size = () => { setVh((v ? v.height : window.innerHeight) || 800); setVv(v ? { l: v.offsetLeft, t: v.offsetTop, w: v.width, h: v.height } : null); };
    size();
    // r.073 second pre-push review (Sofia): the full screen is a dialog — Tab stays inside it (it used to walk on to the hidden panels behind)
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setFull(false); return; }
      const box = layerRef.current; if (e.key !== "Tab" || !box) return;
      const f = Array.from(box.querySelectorAll<HTMLElement>("button, select, input, [tabindex]:not([tabindex='-1'])")).filter((el) => !el.hasAttribute("disabled") && el.getClientRects().length > 0);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1], inBox = box.contains(document.activeElement);
      if (!inBox || (e.shiftKey && document.activeElement === first)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    // r.073 second pre-push review (Athena): the page comes back where it was — the layer takes the chart out of the page, the page grew shorter
    // and its scroll was clamped (the chart came back 273 px lower at 390 px)
    const y0 = window.scrollY;
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    window.addEventListener("resize", size); window.addEventListener("keydown", keys); v?.addEventListener("resize", size); v?.addEventListener("scroll", size);
    return () => { document.body.style.overflow = prev; window.removeEventListener("resize", size); window.removeEventListener("keydown", keys); v?.removeEventListener("resize", size); v?.removeEventListener("scroll", size); requestAnimationFrame(() => window.scrollTo(0, y0)); };
  }, [full]);
  // r.073 second pre-push review (Athena — his addendum 165 again, in landscape): the chart takes the height LEFT in the visible screen, never a
  // fixed floor of 300 px (844×390 at rest showed the canvas at 136–436 px of a 390 px screen: dates cut, the legend and the unit picker gone).
  // Measured after each paint: whatever does not fit comes off the chart, whatever room is left goes to it (floor 100 px, ceiling the screen).
  useEffect(() => { setFitH(0); }, [vh]);   // r.073 twelve-lens (Enlil): a taller screen after rotating starts again from its own height
  useEffect(() => {
    if (!full) { if (fitH) setFitH(0); return; }
    const box = layerRef.current; if (!box) return;
    const cur = fitH || Math.max(100, vh - 260);
    const next = Math.max(100, Math.min(Math.round(vh), Math.round(cur - (box.scrollHeight - box.clientHeight))));
    if (!fitH || Math.abs(next - cur) > 2) setFitH(next);
  });
  const chartH = full ? fitH || Math.max(100, vh - 260) : 300;
  useBeforePaint(() => {
    const el = plotRef.current; if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setPlotW(Math.round(el.clientWidth)));
    ro.observe(el); setPlotW(Math.round(el.clientWidth));
    return () => ro.disconnect();
  }, [rate]);
  const sample = dayTicks(from, to, 6)[0] ?? from;
  return (
    <div ref={layerRef} data-fin-chart data-fin-chart-full={full ? "1" : "0"} role={full ? "dialog" : undefined} aria-modal={full || undefined} aria-label={full ? t("fin.realtime") : undefined} className={full ? "fixed inset-0 z-[60] overflow-y-auto overflow-x-hidden bg-background p-3" : SUB} style={full && vv ? { left: vv.l, top: vv.t, width: vv.w, height: vv.h, right: "auto", bottom: "auto" } : undefined}>
      {/* r.028 (addendum 58): no "Money as time — this MoT" phrase; Planet on the LEFT, the Clock · MoT toggle and the gear on the RIGHT */}
      <div className="flex items-center justify-between gap-2">
        <div className={LABEL}>{t("fin.realtime")}</div>
        <button type="button" data-fin-chart-expand aria-label={full ? t("fin.chart_close") : t("fin.chart_expand")} title={full ? t("fin.chart_close") : t("fin.chart_expand")} onClick={() => setFull((f) => !f)} className="flex h-8 w-9 items-center justify-center rounded-md border border-border text-muted-foreground">{full ? <X size={16} strokeWidth={1.5} aria-hidden /> : <Maximize2 size={16} strokeWidth={1.5} aria-hidden />}</button>
      </div>   {/* r.041 (addendum 76 "call this: REAL-TIME FINANCIALS"); the elapsed time stays in the line below */}
      {/* r.073 (addendum 165): the row wraps when the screen he sees is narrower than the controls (a zoomed phone at 320 px shows ~241 px) —
          the Clock · MoT toggle and the gear drop to a second line, still on the right, never past the edge */}
      <div data-fin-chart-controls className="mt-2 flex flex-wrap items-center justify-between gap-2">
        {selector}
        <div className="ml-auto flex items-center gap-2">
          {/* the Clock on the LEFT, the MoT on the RIGHT (addendum 42): two strokes, the pressed one ringed, never filled */}
          <ClockMotToggle abc={showAbc} onChange={onToggle} t={t} hook="chart" />
          {/* the date format lives on the chart (his answer "Gear on the chart"), remembered on this phone */}
          <button type="button" data-fin-date-gear aria-expanded={gear} aria-label={t("fin.settings")} title={t("fin.settings")} onClick={() => setGear((g) => !g)} className={`flex h-8 w-9 items-center justify-center rounded-md border border-border ${gear ? "text-primary" : "text-muted-foreground"}`}><Settings size={16} strokeWidth={1.5} aria-hidden /></button>
        </div>
      </div>
      {gear && (
        <div data-fin-date-menu className="mt-2 space-y-2 rounded-md border border-border p-2 text-xs">
          <div role="group" aria-label={t("fin.date_format")} className="flex flex-wrap items-center gap-2">
            <span className="w-full text-muted-foreground">{t("fin.date_format")}</span>
            {DATE_FMTS.map((f) => (
              <button key={f} type="button" data-fin-date-fmt={f} aria-pressed={dateFmt === f} onClick={() => onDateFmt(f)} className={`min-h-[32px] rounded-md border px-2 font-mono ${dateFmt === f ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{f === "month" ? `${monthName(sample)} ${dateLabel(sample, "month")}` : dateLabel(sample, f)}</button>
            ))}
          </div>
          <div role="group" aria-label={t("fin.chart_angle")} data-fin-angle-menu className="flex flex-wrap items-center gap-2">
            <span className="w-full text-muted-foreground">{t("fin.chart_angle")}</span>
            {DATE_ANGLES.map((a) => (
              <button key={a} type="button" data-fin-date-angle={a} aria-pressed={angle === a} onClick={() => onAngle(a)} className={`min-h-[32px] min-w-[44px] rounded-md border px-2 font-mono ${angle === a ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{a}°</button>
            ))}
          </div>
        </div>
      )}
      {/* r.047 (addendum 95 "remove this from charting · instead add toggle similar to 2D/3D"): the span, a segmented row — the
          line above the chart (stamp · amount · length · elapsed) is gone */}
      <div role="group" aria-label={t("fin.chart_span")} data-fin-chart-span className="mt-2 flex w-full overflow-hidden rounded-md border border-border font-mono text-xs">
        {(showAbc ? ORBIT_SPANS : CHART_SPANS).map((sp) => (
          <button key={sp} type="button" data-fin-span={sp} aria-pressed={span === sp || (showAbc && span === "30D" && sp === "1M")} onClick={() => pickSpan(sp)} className={`min-h-[32px] flex-1 border-l border-border first:border-l-0 ${span === sp || (showAbc && span === "30D" && sp === "1M") ? "ring-1 ring-inset ring-primary text-primary" : "text-muted-foreground"}`}>{showAbc ? orbitLabel(sp) : spanLabel(sp, now)}</button>
        ))}
      </div>
      {/* r.065 (addendum 138 "get rid of +- map guidance"): the + 1 h − row is gone; the chart pinches and drags on its own */}
      {rate && <RateView txs={txs.length ? txs : [tx]} now={now} span={span} liveHours={LIVE_WINDOWS[zoom].h} unit={unit as RateUnitId} showAbc={showAbc} dateFmt={dateFmt} angle={angle} planet={planet} t={t} height={chartH} tail={unitPicker} />}
      {!rate && <>
      <p data-fin-chart-probe className="mt-2 min-h-[16px] font-mono text-xs text-foreground">{probe !== null && (showAbc ? fmtMot(positionInYear(probe, planet.yearAnchor, planet.yearDays).abc) : `${fmtStampCST(probe)} CST`)}</p>
      {/* r.053 (addendum 110 "Like a stock chart I should be able to click and see values at that day/time"): the values at the tapped point */}
      {probeBal && <p data-fin-chart-values className="flex flex-wrap gap-x-3 font-mono text-xs tabular-nums"><span style={{ color: C.abundance }}>{t("fin.released")} {money2(probeBal.releasedCents)}</span><span style={{ color: C.intelligence }}>{t("fin.escrowed")} {money2(probeBal.escrowedCents)}</span><span className="text-foreground">{t("fin.available")} {money2(probeBal.availableCents)}</span>{probeNet !== null && <span className={probeNet < 0 ? "text-red-500" : "text-green-500"}>{t("fin.net")} {money2(probeNet)}</span>}</p>}
      <div data-fin-usd-fit>
      <div ref={plotRef} data-fin-chart-plot className="relative mt-2">
      {/* the $ scale on the LEFT (addendum 101), HTML beside the strokes (the chart paints no face), in the picked currency */}
      <div data-fin-y-axis aria-hidden className="pointer-events-none absolute inset-0 font-mono text-[10px] text-muted-foreground">
        {yTicks.map((v) => <span key={v} className="absolute left-0 -translate-y-1/2 whitespace-nowrap tabular-nums" style={{ top: `${((y(v) / H) * 100).toFixed(2)}%` }}>{yLabel(v)}</span>)}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" className={`block h-auto cursor-crosshair${W > 360 ? " [&_*]:[vector-effect:non-scaling-stroke]" : ""}`} style={live ? { touchAction: "pan-y" } : undefined} role="img" aria-label={t("fin.chart_tap")} data-fin-chart-svg onClick={probeAt} onPointerDown={onPDown} onPointerMove={onPMove} onPointerUp={onPUp} onPointerCancel={onPUp} onPointerLeave={onPUp}>
        <rect x={PL} y={P} width={W - PL - P} height={H - 2 * P} fill="none" stroke="var(--border)" strokeWidth={hair} />
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={PL + f * (W - PL - P)} y1={P} x2={PL + f * (W - PL - P)} y2={H - P} stroke="var(--border)" strokeWidth={hair} />)}
        <polyline fill="none" stroke={C.intelligence} strokeWidth={hair} points={poly((p) => p.escrowed)} />
        <polyline fill="none" stroke={C.abundance} strokeWidth={sw} points={poly((p) => p.released)} />
        {yMin < 0 && <line data-fin-zero x1={PL} y1={y(0)} x2={W - P} y2={y(0)} stroke="var(--border)" strokeWidth={hair} />}
        {!live && netPerSec !== 0 && <polyline data-fin-net-line fill="none" stroke={netEnd < 0 ? C.evolution : C.abundance} strokeWidth={sw} strokeDasharray="5 3" points={`${x(netFrom).toFixed(1)},${y(0).toFixed(1)} ${x(to).toFixed(1)},${y(netEnd).toFixed(1)}`} />}
        {withdrawals.map((w) => <line key={w.id} x1={x(w.atMs)} y1={P} x2={x(w.atMs)} y2={P + 12} stroke={C.evolution} strokeWidth={sw} />)}
        {inside(now) && <line x1={x(now)} y1={P} x2={x(now)} y2={H - P} stroke={C.blank} strokeWidth={hair} />}
        {probe !== null && <line data-fin-chart-probe-line x1={x(probe)} y1={P} x2={x(probe)} y2={H - P} stroke="hsl(var(--primary))" strokeWidth={hair} strokeDasharray="3 3" />}
        {!showAbc && ticks.map((tk) => <line key={tk} x1={x(tk)} y1={H - P} x2={x(tk)} y2={H - P + 4} stroke="var(--border)" strokeWidth={hair} />)}
      </svg>
      </div>
      {!showAbc && dateFmt === "month" && (
        <div data-fin-date-months aria-hidden className="relative mt-1 h-4 text-[10px] text-muted-foreground">
          {ticks.filter((tk, k) => k === 0 || cstParts(tk).mo !== cstParts(ticks[k - 1]).mo).map((tk) => <span key={tk} className="absolute top-0 whitespace-nowrap" style={{ left: `${(Math.max(0, (x(tk) - 12) / W) * 100).toFixed(2)}%` }}>{monthName(tk)}</span>)}
        </div>
      )}
      {/* CALENDAR DATES AT 30° (addendum 42) — HTML under the strokes (the vector law: the chart paints no face), one per tick */}
      {!showAbc && ticks.length === 0 && <div data-fin-axis className="grid grid-cols-5 font-mono text-[10px] leading-tight text-muted-foreground">{[0, 0.25, 0.5, 0.75, 1].map((f, i) => <span key={i} className={i === 0 ? "text-left" : i === 4 ? "text-right" : "text-center"}>{ltuLabel(f * len, len, planet)}</span>)}</div>}
      {!showAbc && ticks.length > 0 && (
        <div data-fin-date-axis data-fin-angle={angle} aria-hidden className={`relative font-mono text-[10px] text-muted-foreground ${angle === 0 ? "h-4" : angle === 90 ? (dateFmt === "full" ? "h-16" : "h-10") : dateFmt === "full" ? (angle === 45 ? "h-14" : "h-11") : "h-8"}`}>
          {ticks.map((tk) => <span key={tk} className="absolute top-0.5 whitespace-nowrap" style={{ left: `${((x(tk) / W) * 100).toFixed(2)}%`, transform: angle === 0 ? (x(tk) / W < 0.12 ? "translateX(0)" : x(tk) / W > 0.88 ? "translateX(-100%)" : "translateX(-50%)") : angle === 90 ? "translateX(-100%) rotate(-90deg)" : `translateX(-100%) rotate(-${angle}deg)`, transformOrigin: angle === 0 ? "50% 0" : "100% 0" }}>{dateLabel(tk, dateFmt)}</span>)}
        </div>
      )}
      {/* A.B..C mode: five marks; a mark is two lines (A · .BBBB..CCCC) so five of them fit a 390 px phone without overprinting */}
      {showAbc && <div data-fin-axis className="grid grid-cols-5 font-mono text-[10px] leading-tight text-muted-foreground">{axis.map((a, i) => <span key={i} className={`whitespace-pre-line ${i === 0 ? "text-left" : i === 4 ? "text-right" : "text-center"}`}>{a.replace(".", "\n.").replace("..", "\n..")}</span>)}</div>}
      </div>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span style={{ color: C.abundance }}>— {t("fin.released")}</span><span style={{ color: C.intelligence }}>— {t("fin.escrowed")}</span><span>| {t("fin.now")}</span><span style={{ color: C.evolution }}>| {t("fin.withdrawal")}</span>
      </p>
      </>}
      {/* r.060 → r.067: in the $ view the unit keeps its own row at the bottom right; in the $/MoT view it sits on the legend line */}
      {!rate && <div data-fin-chart-unit-row className="mt-2 flex justify-end">{unitPicker}</div>}
    </div>
  );
}
