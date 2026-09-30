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
 * The chart stays under the vector law (strokes only); its glass reads day · hour · minute, A.B..C on reveal.
 */
import { useEffect, useMemo, useState } from "react";
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
import { fmtMot, spanABC, fmtStampCST, parseStampCST, MS_PER_DAY } from "@/lib/financial-2525/mot";
import { positionInYear, frameOf } from "@/lib/financial-2525/calendar";
import { balanceAt, series, validateWithdrawal, depositView, HOLD_MS, type FinTx } from "@/lib/financial-2525/accrual";
import { SHEET_BUDGET, SHEET_MONTH_DAYS, summarize, type BudgetCategory } from "@/lib/financial-2525/budget";
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

/** The five phases of one deposit, on the Session's rail: DEPOSIT ◬ · HOLD ♡ · RELEASE ♡ · WITHDRAW 웃 · RECORD 웃. */
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
  atMs: parseStampCST(SRC.example.depositStamp) ?? 0, motDays: SRC.example.motDays, memo: SRC.example.memo, payer: "example",
};

export function FinancialCommandUX1() {
  const { t } = useLexicon();
  const hue = useThemeHue();
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const stamp = useMemo(() => versionStamp(`v${SRC.project.revision}`), []);
  // The one clock on the surface: null until mounted (a server render has no "now" — a hydration mismatch is a white page).
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

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
  const focusView = focus && now ? depositView(focus, at) : null;
  const year = now ? positionInYear(now) : null;
  const frame = now ? frameOf(now, 33) : null;
  const budget = useMemo(() => summarize(SHEET_BUDGET, SHEET_MONTH_DAYS), []);
  const signIn = () => loginWithRedirect({ appState: { returnTo: `${SRC.project.route}/` } });

  // ── forms ──────────────────────────────────────────────────────────────────────────────────────────────────
  const [dAmt, setDAmt] = useState(""); const [dAt, setDAt] = useState(""); const [dMot, setDMot] = useState(String(SRC.mot.payMotDays)); const [dMemo, setDMemo] = useState("");
  const [wAmt, setWAmt] = useState(""); const [wAt, setWAt] = useState("");
  const [refusal, setRefusal] = useState<string | null>(null);
  const commit = (tx: FinTx) => { const next = append(record, tx, at); setRecord(next); if (!saveRecord(next)) setSaveFailed(true); };
  const recordDeposit = () => {
    const cents = Math.round(Number(dAmt) * 100);
    const when = dAt.trim() ? parseStampCST(dAt) : at;
    if (!(cents > 0)) return setRefusal(t("fin.reason_amount"));
    if (when === null) return setRefusal(t("fin.reason_stamp"));
    setRefusal(null);
    commit({ id: `d-${when}-${cents}`, kind: "deposit", amountCents: cents, atMs: when, motDays: Math.max(0, Number(dMot) || 0), memo: dMemo.trim() || undefined });
    setDAmt(""); setDMemo("");
  };
  const recordWithdrawal = () => {
    const cents = Math.round(Number(wAmt) * 100);
    const when = wAt.trim() ? parseStampCST(wAt) : at;
    if (when === null) return setRefusal(t("fin.reason_stamp"));
    const w: FinTx = { id: `w-${when}-${cents}`, kind: "withdrawal", amountCents: cents, atMs: when };
    const v = validateWithdrawal(txs, w);
    if (!v.ok) return setRefusal(v.reason === "HOLD" ? t("fin.reason_hold") : v.reason === "INSUFFICIENT" ? t("fin.reason_insufficient") : t("fin.reason_amount"));
    setRefusal(null); commit(w); setWAmt("");
  };
  const goTo = (id: string) => { const el = typeof document !== "undefined" ? document.getElementById(id) : null; el?.scrollIntoView({ behavior: "smooth", block: "center" }); (el?.querySelector("input") as HTMLInputElement | null)?.focus(); };

  // ── the "your turn" guide — the Session's card, the financial next action ──────────────────────────────────
  const guide = (() => {
    if (!owner) return { state: "turn" as const, sentence: t("fin.guide.sign_in"), label: t("fin.sign_in"), action: signIn };
    if (!focus) return { state: "turn" as const, sentence: t("fin.guide.first_deposit"), label: t("fin.deposit"), action: () => goTo("fin-deposit-form") };
    if (phase === "deposit") return { state: "waiting" as const, sentence: `${t("fin.guide.pending")} ${fmtStampCST(focus.atMs)}`, label: null, action: null };
    if (phase === "hold" && focusView) return { state: "waiting" as const, sentence: `${t("fin.guide.held")} ${hhmmss(Math.max(0, focusView.holdUntilMs - at))}`, label: null, action: null };
    if (phase === "record") return { state: "done" as const, sentence: t("fin.guide.done"), label: null, action: null };
    return { state: "turn" as const, sentence: `${t("fin.guide.withdrawable")} ${usd(bal.availableCents)}`, label: t("fin.withdraw"), action: () => goTo("fin-withdraw-form") };
  })();
  const rosterRows: PodRosterRow[] = deposits.map((d) => {
    const v = depositView(d, at);
    return { name: `${fmtStampCST(d.atMs)}${d.memo ? ` · ${d.memo}` : ""}`, me: true, state: v.state === "released" ? "done" : v.state === "pending" ? "pending" : "turn", label: `${usd(d.amountCents)} · ${d.motDays}` };
  });
  const countFor = (k: string): string | null => {
    if (k === "deposit") return String(deposits.length);
    if (k === "hold" && focusView && phase === "hold") return hhmmss(Math.max(0, focusView.holdUntilMs - at));
    if (k === "release") return usd(bal.releasedCents);
    if (k === "withdraw") return String(withdrawals.length);
    if (k === "record") return String(owner ? record.entries.length : 1);
    return null;
  };

  return (
    <div data-financial-ux1 className="mx-auto max-w-3xl px-4 py-10">
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
          {guide.label && guide.action && <button type="button" onClick={guide.action} data-testid="fin-your-turn-action" className="mt-2 min-h-[44px] rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-black">{`${guide.label} ↓`}</button>}
          {!owner && <p className="mt-1 text-xs text-cyan-400">{t("fin.example_badge")}</p>}
        </div>

        {/* who has done what — the Session's roster, one row per deposit */}
        {rosterRows.length ? <PodRosterList rows={rosterRows} title={t("fin.roster_title")} you={t("soi.pod.guide.you")} /> : null}

        {/* the clock — the Session's ACTIVE block; the big number is money released, ticking at $/min */}
        <div data-fin-balance className={ACCENT_SUB}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="font-medium text-cyan-500">{t("fin.released")} · {bal.ratePerMinCents > 0 ? `${usd4(bal.ratePerMinCents)} ${t("fin.per_min")}` : t(phaseDef.labelKey)}</div>
            <div className="font-mono text-2xl tabular-nums text-cyan-500" data-testid="fin-clock" aria-label={t("fin.released")}>{usd(bal.releasedCents)}</div>
          </div>
          <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground">{t("fin.escrowed")}:</span> {usd(bal.escrowedCents)} · <span className="font-medium text-foreground">{t("fin.withdrawable")}:</span> {usd(bal.withdrawableCents)} · <span className="font-medium text-foreground">{t("fin.withdrawn")}:</span> {usd(bal.withdrawnCents)}</p>
          <p className="text-muted-foreground"><span className="font-medium text-foreground">{t("fin.available")}:</span> {usd(bal.availableCents)}{focusView && focusView.state === "releasing" ? ` · ${t("fin.hold_mark")} ${fmtStampCST(focusView.holdUntilMs)}` : ""}</p>
          {bal.ratePerMinCents > 0 && (
            <ul className="mt-2 space-y-0.5 font-mono text-xs text-muted-foreground" data-testid="fin-ladder">
              <li>{usd4(bal.ratePerMinCents * 60)} {t("fin.per_hour")} · {usd(Math.round(bal.ratePerMinCents * 1440))} {t("fin.per_day")} · {usd4(bal.ratePerMinCents / 60)} {t("fin.per_sec")}</li>
              {focusView && <li>{hhmmss(Math.max(0, at - focus!.atMs))} {t("fin.elapsed")} · {fmtMot(spanABC(Math.max(0, at - focus!.atMs) / MS_PER_DAY))} {t("fin.a_units")}</li>}
            </ul>
          )}
        </div>

        {/* the chart — strokes only, day · hour · minute by default, A.B..C on reveal */}
        {focus && <MotChart tx={focus} txs={txs} now={at} t={t} />}

        {/* the year — the orbit that resets at perihelion; the 33-day frame */}
        {year && frame && (
          <div data-fin-year className={SUB}>
            <div className={LABEL}>{t("fin.year_position")}</div>
            <p className="mt-1">{t("fin.day")} {year.day} · {year.down ? t("fin.down_day") : `${t("fin.quarter")} ${year.quarter} · ${year.dayInQuarter}/91`} · {t("fin.frame")} {frame.index + 1} · {frame.dayInFrame}/33</p>
            <p className="font-mono text-xs text-muted-foreground">{fmtStampCST(at)} CST · {year.year} · {year.status} · {fmtMot(year.abc)}</p>
          </div>
        )}

        {/* forms — only a signed-in person records; the example is read-only */}
        {owner ? (
          <div data-fin-forms>
            <div id="fin-deposit-form" className={SUB} data-testid="fin-deposit-form">
              <div className={LABEL}>{t("fin.deposit")}</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">{t("fin.amount")}<input className={INPUT} inputMode="decimal" value={dAmt} onChange={(e) => setDAmt(e.target.value)} /></label>
                <label className="text-xs text-muted-foreground">{t("fin.deposit_at")}<input className={INPUT} value={dAt} placeholder={now ? fmtStampCST(now) : t("fin.stamp_hint")} onChange={(e) => setDAt(e.target.value)} /></label>
                <label className="text-xs text-muted-foreground">{t("fin.mot_days")}<input className={INPUT} inputMode="decimal" value={dMot} onChange={(e) => setDMot(e.target.value)} /></label>
                <label className="text-xs text-muted-foreground">{t("fin.memo")}<input className={INPUT} value={dMemo} onChange={(e) => setDMemo(e.target.value)} /></label>
              </div>
              <button type="button" className={`mt-2 ${PRIMARY}`} onClick={recordDeposit}>{t("fin.record_it")}</button>
            </div>
            <div id="fin-withdraw-form" className={SUB} data-testid="fin-withdraw-form">
              <div className={LABEL}>{t("fin.withdrawal")}</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">{t("fin.amount")}<input className={INPUT} inputMode="decimal" value={wAmt} onChange={(e) => setWAmt(e.target.value)} /></label>
                <label className="text-xs text-muted-foreground">{t("fin.deposit_at")}<input className={INPUT} value={wAt} placeholder={now ? fmtStampCST(now) : t("fin.stamp_hint")} onChange={(e) => setWAt(e.target.value)} /></label>
              </div>
              <button type="button" className={`mt-2 ${SECONDARY}`} onClick={recordWithdrawal}>{t("fin.withdraw")}</button>
              {refusal && <p className="mt-2 text-sm text-red-500">{t("fin.refused")} · {refusal}</p>}
              {saveFailed && <p className="mt-2 text-sm text-amber-500">{t("fin.save_failed")}</p>}
            </div>
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
          <div className={LABEL}>{t("fin.budget_title")}</div>
          <p className="mt-1 text-xs text-muted-foreground">{t("fin.per_33")} · {t("fin.per_day")} · {t("fin.per_min")} · {t("fin.per_sec")}</p>
          <ul className="mt-2 space-y-0.5 font-mono text-xs">
            {budget.lines.map((l) => (
              <li key={l.id} className="flex justify-between gap-2"><span>{t(`fin.cat.${CAT_KEY[l.category]}`)}{l.kind === "income" ? "" : ` · ${l.kind === "fixed" ? t("fin.fixed") : t("fin.variable")}`}</span><span className="tabular-nums">{usd(l.amountCents)} · {usd(Math.round(l.ladder.perDay))} · {usd4(l.ladder.perMin)} · {usd4(l.ladder.perSec)}</span></li>
            ))}
            <li className={`flex justify-between gap-2 border-t border-border pt-1 ${budget.netCents < 0 ? "text-red-500" : "text-green-500"}`}><span>{t("fin.net")}</span><span className="tabular-nums">{usd(budget.netCents)} · {usd(Math.round(budget.net.perDay))} · {usd4(budget.net.perMin)} · {usd4(budget.net.perSec)}</span></li>
          </ul>
        </div>

        {/* the record — append-only, chain-hashed (FIN-05); honest about where it lives */}
        <div data-fin-ledger className={SUB}>
          <div className={LABEL}>{t("fin.ledger_title")} · {owner && tampered ? t("fin.chain_broken") : t("fin.chain_ok")}</div>
          <ul className="mt-2 space-y-0.5 font-mono text-xs text-muted-foreground">
            {!owner && <li className="flex justify-between gap-2"><span>{fmtStampCST(EXAMPLE.atMs)} · {t("fin.deposit")} · {EXAMPLE.memo}</span><span>{usd(EXAMPLE.amountCents)} · {EXAMPLE.motDays}</span></li>}
            {owner && record.entries.length === 0 && <li>{t("fin.no_deposits")}</li>}
            {owner && record.entries.map((e) => (
              <li key={e.hash} className="flex justify-between gap-2"><span>{e.rev} · {fmtStampCST(e.tx.atMs)} · {e.tx.kind === "deposit" ? t("fin.deposit") : t("fin.withdrawal")}{e.tx.memo ? ` · ${e.tx.memo}` : ""}</span><span className={e.tx.kind === "deposit" ? "text-green-500" : "text-red-500"}>{usd(e.tx.amountCents)}{e.tx.motDays ? ` · ${e.tx.motDays}` : ""} · {e.hash.slice(0, 8)}</span></li>
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

      {/* the phone strip — the Session's CriticalStrip: what is released, the phase, Withdraw */}
      <div className="fixed inset-x-0 bottom-14 z-[60] mx-auto flex max-w-3xl items-center gap-2 border-t border-border bg-card/95 px-3 py-2 text-xs backdrop-blur sm:hidden" data-testid="fin-strip">
        <span className="min-w-0 flex-1 truncate font-mono tabular-nums">{usd(bal.releasedCents)} · {usd(bal.availableCents)}</span>
        <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] uppercase" style={{ borderColor: hue.bright, color: hue.bright }}>{t(phaseDef.labelKey)}</span>
        {owner && <button type="button" onClick={() => goTo("fin-withdraw-form")} disabled={bal.availableCents <= 0} className="min-h-[36px] disabled:opacity-50 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">{t("fin.withdraw")}</button>}
      </div>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">{SRC.project.stamp} · {stamp} · <TrinityGlyphs inline size="text-[11px]" /></p>

      {/* R-CORE — version history + compare, the bottom of every 2525 surface */}
      <RCoreBadge history={FINANCIAL_RCORE_HISTORY} accent={hue.bright} />
    </div>
  );
}

/** Earth LTU for the glass (operator addendum 8: "UX is defaulted in day, hour, min"): days + hours over a day, hours + minutes under. */
function ltuLabel(ms: number, wholeMs: number): string {
  const d = Math.floor(ms / MS_PER_DAY), h = Math.floor((ms % MS_PER_DAY) / 3600000), m = Math.floor((ms % 3600000) / 60000);
  return wholeMs >= MS_PER_DAY && d > 0 ? `${d} d ${h} h` : `${h} h ${m} min`;
}

/** One deposit over its MoT: released / withdrawable / escrowed as strokes, NOW, the 3-hour hold, withdrawals as marks.
 *  BEHIND THE SCENES IS A.B..C — the revolution's coordinate (addendum 10): on reveal the axis reads the year position
 *  (positionInYear) at each mark and the elapsed span in A-units; the glass defaults to day · hour · minute (addendum 8). */
function MotChart({ tx, txs, now, t }: { tx: FinTx; txs: FinTx[]; now: number; t: (k: string) => string }) {
  const W = 360, H = 150, P = 10;
  const [showAbc, setShowAbc] = useState(false);
  const len = Math.max(1, (tx.motDays ?? 0) * MS_PER_DAY);
  const from = tx.atMs, to = tx.atMs + len;
  function inside(ms: number) { return !(ms < from) && !(ms > to); }
  const withdrawals = txs.filter((x) => x.kind === "withdrawal" && inside(x.atMs));
  const pts = series([tx, ...withdrawals], from, to, len / 120);
  const x = (ms: number) => P + ((ms - from) / len) * (W - 2 * P);
  const y = (cents: number) => H - P - (Math.max(0, Math.min(1, cents / tx.amountCents)) * (H - 2 * P));
  const poly = (pick: (p: (typeof pts)[number]) => number) => pts.map((p) => `${x(p.t).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");
  const elapsed = Math.max(0, Math.min(len, now - from));
  const elapsedAbc = spanABC(elapsed / MS_PER_DAY);                 // the elapsed LENGTH, in A-units of the revolution
  const motAbc = spanABC(tx.motDays ?? 0);                           // the whole MoT, in A-units (30.333 d ≈ 298.97 A)
  const sw = VECTOR_LAW.stroke.normal, hair = VECTOR_LAW.stroke.hairline;
  // the x axis: five marks over the MoT — day · hour · minute by default; on reveal the revolution's A.B..C at each mark
  const axis = [0, 0.25, 0.5, 0.75, 1].map((f) => (showAbc ? fmtMot(positionInYear(from + f * len).abc) : ltuLabel(f * len, len)));
  return (
    <div data-fin-chart className={SUB}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className={LABEL}>{t("fin.chart_title")} · {showAbc ? `${fmtMot(elapsedAbc)} / ${fmtMot(motAbc)} ${t("fin.a_units")}` : `${ltuLabel(elapsed, len)} ${t("fin.elapsed")}`}</div>
        <button type="button" data-fin-abc-toggle className="rounded-md border border-border px-2 py-1 text-xs" onClick={() => setShowAbc((v) => !v)}>{showAbc ? t("fin.show_ltu") : t("fin.show_abc")}</button>
      </div>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{fmtStampCST(tx.atMs)} · {usd(tx.amountCents)} · {tx.motDays} · {now < from ? `${t("fin.pending_from")} ${fmtStampCST(tx.atMs)}` : showAbc ? `${fmtMot(positionInYear(from).abc)} → ${fmtMot(positionInYear(to).abc)}` : `${ltuLabel(elapsed, len)} ${t("fin.elapsed")}`}</p>
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
      <div data-fin-axis className="flex justify-between font-mono text-[10px] text-muted-foreground">{axis.map((a, i) => <span key={i}>{a}</span>)}</div>
      <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
        <span style={{ color: C.abundance }}>— {t("fin.released")}</span><span style={{ color: C.consciousness }}>— {t("fin.withdrawable")}</span><span style={{ color: C.intelligence }}>— {t("fin.escrowed")}</span><span style={{ color: C.temporal }}>| {t("fin.hold_mark")}</span><span>| {t("fin.now")}</span><span style={{ color: C.evolution }}>| {t("fin.withdrawal")}</span>
      </p>
    </div>
  );
}
