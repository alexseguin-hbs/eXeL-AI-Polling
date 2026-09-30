"use client";

/**
 * FINANCIAL-2525 · Command UX 1 — the MoT Financial System on one phone screen (operator 2026-09-30, v.000_r.001).
 * ====================================================================================================
 * The ◬ ♡ 웃 Session is the basis: like the POD clock, VALUE ACCRUES OVER MEASURED TIME — here money released by an
 * escrow at $/min. The screen shows one person's money as time: the deposit's MoT in A.B..C (0.0000..0000 →
 * 3600.3600..3600), the released / withdrawable / escrowed series, the live $/min ladder, the 3-hour hold, every
 * withdrawal as a mark, today's position in the perihelion year, the personal budget on the ladder, and the
 * append-only, chain-hashed record. Before sign-in the worked example (the operator's paycheck as data) runs live;
 * after sign-in the person's own record does. Vector law: black ground, strokes only, the 13 colours, no fill.
 *
 * Every number on the glass comes from the pure libraries in lib/financial-2525 (deterministic, clock-free); the only
 * clock on this surface is the 1 Hz tick that feeds them `now`. Nothing here talks to a bank.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { useLexicon } from "@/lib/lexicon-context";
import { VECTOR_LAW } from "@/lib/wire-core/vector-law";
import { TRINITY_COLORS } from "@/lib/trinity-palette";
import { MONO, HUD, btn, heading, quiet } from "@/components/drone-2525/ui";
import { versionStamp } from "@/lib/2525-core/version-stamp";
import { RCoreBadge } from "@/components/2525-core/rcore-badge";
import { fromLedgerJson } from "@/lib/2525-core/revisions";
import { FINANCIAL_LEDGER } from "@/lib/2525-core/financial-ledger.gen";
import { FINANCIAL_DOMAIN as SRC } from "@/lib/financial-2525/domain.gen";
import { fmtMot, motABC, fmtStampCST, parseStampCST, MS_PER_DAY } from "@/lib/financial-2525/mot";
import { positionInYear, frameOf } from "@/lib/financial-2525/calendar";
import { balanceAt, series, validateWithdrawal, HOLD_MS, type FinTx } from "@/lib/financial-2525/accrual";
import { SHEET_BUDGET, SHEET_MONTH_DAYS, summarize, type BudgetCategory } from "@/lib/financial-2525/budget";
import { append, loadRecord, saveRecord, replay, emptyRecord, type FinRecord } from "@/lib/financial-2525/record";

const FINANCIAL_RCORE_HISTORY = fromLedgerJson(FINANCIAL_LEDGER);
const C = TRINITY_COLORS;
const ACCENT = C.abundance;          // chartreuse — money released
const LINE = "#2a2a2a";
const usd = (cents: number) => (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
const usd4 = (cents: number) => (cents < 0 ? "-$" : "$") + Math.abs(cents / 100).toFixed(4);
const CAT_KEY: Record<BudgetCategory, string> = { Income: "income", Home: "home", Auto: "auto", Insurance: "insurance", Utilities: "utilities", Fitness: "fitness", Fun: "fun", Groceries: "groceries", "Dining Out": "dining_out", Other: "other" };
const panel: React.CSSProperties = { border: `1px solid ${LINE}`, borderRadius: 2, padding: "10px 12px", marginTop: 10 };
const input: React.CSSProperties = { ...MONO, background: "transparent", border: `1px solid ${LINE}`, color: HUD, padding: "7px 8px", borderRadius: 2, width: "100%", minHeight: 34 };
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, ...MONO, color: HUD, padding: "3px 0" };

/** The worked example as data — the operator's paycheck (amount · deposit day and time · MoT), never invented. */
const EXAMPLE: FinTx = {
  id: "example-d1", kind: "deposit", amountCents: Math.round(SRC.example.amountUsd * 100),
  atMs: parseStampCST(SRC.example.depositStamp) ?? 0, motDays: SRC.example.motDays, memo: SRC.example.memo, payer: "example",
};

export function FinancialCommandUX1() {
  const { t } = useLexicon();
  const router = useRouter();
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
  const focus = deposits[0] ?? null;
  const year = now ? positionInYear(now) : null;
  const frame = now ? frameOf(now, 33) : null;
  const budget = useMemo(() => summarize(SHEET_BUDGET, SHEET_MONTH_DAYS), []);

  // ── forms ──────────────────────────────────────────────────────────────────────────────────────────────────
  const [dAmt, setDAmt] = useState(""); const [dAt, setDAt] = useState(""); const [dMot, setDMot] = useState(String(SRC.mot.payMotDays)); const [dMemo, setDMemo] = useState("");
  const [wAmt, setWAmt] = useState(""); const [wAt, setWAt] = useState("");
  const [refusal, setRefusal] = useState<string | null>(null);
  const commit = (tx: FinTx) => {
    const next = append(record, tx, at);
    setRecord(next);
    if (!saveRecord(next)) setSaveFailed(true);
  };
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

  return (
    <div data-financial-ux1 style={{ minHeight: "100vh", background: VECTOR_LAW.ground, color: HUD, padding: "12px 12px 0", ...MONO }}>
      {/* top bar — the wordmark, the stamp (U-WF-12), the Trinity */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <div>
          <div style={{ ...MONO, fontSize: "clamp(13px, 3.6vw, 16px)", color: ACCENT, letterSpacing: "0.12em" }}>FINANCIAL · 2525</div>
          <div style={quiet(0.7)}>{t("fin.subtitle")} · {t("fin.version")} {SRC.project.version} · {t("fin.revision")} {SRC.project.revision} · {stamp}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ ...MONO, fontSize: 14 }}>◬ ♡ 웃</span>
          <button type="button" style={btn()} onClick={() => router.push("/")}>{t("fin.back")}</button>
        </div>
      </div>

      {/* sign-in — each user their own login (FIN-08); the example runs for everyone else */}
      <div data-fin-signin style={panel}>
        {owner ? (
          <div style={row}><span>{t("fin.signed_in_as")} {user?.name ?? user?.email ?? owner}</span><button type="button" style={btn()} onClick={() => logout({ logoutParams: { returnTo: typeof window !== "undefined" ? window.location.origin : undefined } })}>{t("fin.sign_out")}</button></div>
        ) : (
          <div style={row}><span style={{ color: C.temporal }}>{t("fin.example_badge")}</span><button type="button" style={btn({ on: true, hex: ACCENT, enabled: !isLoading })} onClick={() => loginWithRedirect()}>{t("fin.sign_in")}</button></div>
        )}
      </div>

      {/* the balance — money as of NOW, from the pure law */}
      <div data-fin-balance style={panel}>
        <div style={heading(ACCENT)}>{t("fin.rate")} · {bal.ratePerMinCents > 0 ? usd4(bal.ratePerMinCents) : "—"} {t("fin.per_min")}</div>
        <div style={row}><span>{t("fin.escrowed")}</span><span style={{ color: C.intelligence }}>{usd(bal.escrowedCents)}</span></div>
        <div style={row}><span>{t("fin.released")}</span><span style={{ color: ACCENT }}>{usd(bal.releasedCents)}</span></div>
        <div style={row}><span>{t("fin.withdrawable")}</span><span style={{ color: C.consciousness }}>{usd(bal.withdrawableCents)}</span></div>
        <div style={row}><span>{t("fin.withdrawn")}</span><span style={{ color: C.evolution }}>{usd(bal.withdrawnCents)}</span></div>
        <div style={{ ...row, borderTop: `1px solid ${LINE}`, marginTop: 4, paddingTop: 6 }}><span>{t("fin.available")}</span><span style={{ color: C.blank }}>{usd(bal.availableCents)}</span></div>
        {bal.ratePerMinCents > 0 && (
          <div style={{ ...quiet(0.7), marginTop: 4 }}>{usd4(bal.ratePerMinCents * 60)} {t("fin.per_hour")} · {usd(Math.round(bal.ratePerMinCents * 1440))} {t("fin.per_day")} · {usd4(bal.ratePerMinCents / 60)} {t("fin.per_sec")}</div>
        )}
      </div>

      {/* the chart — one deposit's MoT, in A.B..C on the x axis */}
      {focus && <MotChart tx={focus} txs={txs} now={at} t={t} />}

      {/* the year — the orbit, resetting at perihelion; the 33-day frame */}
      {year && frame && (
        <div data-fin-year style={panel}>
          <div style={heading(C.framework)}>{t("fin.year_position")} · {fmtMot(year.abc)}</div>
          <div style={row}><span>{t("fin.day")} {year.day} · {year.down ? t("fin.down_day") : `${t("fin.quarter")} ${year.quarter} · ${year.dayInQuarter}/91`}</span><span>{year.year} · {year.status}</span></div>
          <div style={row}><span>{t("fin.frame")} {frame.index + 1} · {frame.dayInFrame}/33</span><span>{fmtMot(frame.abc)}</span></div>
          <div style={quiet(0.6)}>{fmtStampCST(at)} CST</div>
        </div>
      )}

      {/* forms — only a signed-in person records; the example is read-only */}
      {owner && (
        <div data-fin-forms style={panel}>
          <div style={heading(ACCENT)}>{t("fin.deposit")}</div>
          <label style={quiet(0.7)}>{t("fin.amount")}<input style={input} inputMode="decimal" value={dAmt} onChange={(e) => setDAmt(e.target.value)} /></label>
          <label style={quiet(0.7)}>{t("fin.deposit_at")}<input style={input} value={dAt} placeholder={now ? fmtStampCST(now) : t("fin.stamp_hint")} onChange={(e) => setDAt(e.target.value)} /></label>
          <label style={quiet(0.7)}>{t("fin.mot_days")}<input style={input} inputMode="decimal" value={dMot} onChange={(e) => setDMot(e.target.value)} /></label>
          <label style={quiet(0.7)}>{t("fin.memo")}<input style={input} value={dMemo} onChange={(e) => setDMemo(e.target.value)} /></label>
          <button type="button" style={{ ...btn({ on: true, hex: ACCENT }), marginTop: 6 }} onClick={recordDeposit}>{t("fin.record_it")}</button>
          <div style={{ ...heading(C.evolution), marginTop: 12 }}>{t("fin.withdrawal")}</div>
          <label style={quiet(0.7)}>{t("fin.amount")}<input style={input} inputMode="decimal" value={wAmt} onChange={(e) => setWAmt(e.target.value)} /></label>
          <label style={quiet(0.7)}>{t("fin.deposit_at")}<input style={input} value={wAt} placeholder={now ? fmtStampCST(now) : t("fin.stamp_hint")} onChange={(e) => setWAt(e.target.value)} /></label>
          <button type="button" style={{ ...btn({ on: true, hex: C.evolution }), marginTop: 6 }} onClick={recordWithdrawal}>{t("fin.withdraw")}</button>
          {refusal && <div style={{ ...MONO, color: C.evolution, marginTop: 6 }}>{t("fin.refused")} · {refusal}</div>}
          {saveFailed && <div style={{ ...MONO, color: C.temporal, marginTop: 6 }}>{t("fin.save_failed")}</div>}
        </div>
      )}

      {/* the budget — every line on the ladder (FIN-06) */}
      <div data-fin-budget style={panel}>
        <div style={heading(C.platonic)}>{t("fin.budget_title")}</div>
        <div style={{ ...row, opacity: 0.6 }}><span>{t("fin.per_33")}</span><span>{t("fin.per_day")} · {t("fin.per_min")} · {t("fin.per_sec")}</span></div>
        {budget.lines.map((l) => (
          <div key={l.id} style={row}>
            <span>{t(`fin.cat.${CAT_KEY[l.category]}`)}{l.kind === "income" ? "" : ` · ${l.kind === "fixed" ? t("fin.fixed") : t("fin.variable")}`}</span>
            <span>{usd(l.amountCents)} · {usd(Math.round(l.ladder.perDay))} · {usd4(l.ladder.perMin)} · {usd4(l.ladder.perSec)}</span>
          </div>
        ))}
        <div style={{ ...row, borderTop: `1px solid ${LINE}`, marginTop: 4, paddingTop: 6, color: budget.netCents < 0 ? C.evolution : ACCENT }}>
          <span>{t("fin.net")}</span><span>{usd(budget.netCents)} · {usd(Math.round(budget.net.perDay))} · {usd4(budget.net.perMin)} · {usd4(budget.net.perSec)}</span>
        </div>
      </div>

      {/* the record — append-only, chain-hashed (FIN-05); honest about where it lives */}
      <div data-fin-ledger style={panel}>
        <div style={heading(C.wholeness)}>{t("fin.ledger_title")} · {owner ? (tampered ? t("fin.chain_broken") : t("fin.chain_ok")) : t("fin.chain_ok")}</div>
        {(owner ? record.entries : []).length === 0 && !owner && (
          <div style={row}><span>{fmtStampCST(EXAMPLE.atMs)} · {t("fin.deposit")} · {EXAMPLE.memo}</span><span>{usd(EXAMPLE.amountCents)} · {EXAMPLE.motDays}</span></div>
        )}
        {owner && record.entries.length === 0 && <div style={quiet(0.6)}>{t("fin.no_deposits")}</div>}
        {owner && record.entries.map((e) => (
          <div key={e.hash} style={row}>
            <span>{e.rev} · {fmtStampCST(e.tx.atMs)} · {e.tx.kind === "deposit" ? t("fin.deposit") : t("fin.withdrawal")}{e.tx.memo ? ` · ${e.tx.memo}` : ""}</span>
            <span style={{ color: e.tx.kind === "deposit" ? ACCENT : C.evolution }}>{usd(e.tx.amountCents)}{e.tx.motDays ? ` · ${e.tx.motDays}` : ""} · {e.hash.slice(0, 8)}</span>
          </div>
        ))}
        <div style={{ ...quiet(0.5), marginTop: 6 }}>{t("fin.device_only")}</div>
      </div>

      {/* R-CORE — version history + compare, the bottom of every 2525 surface */}
      <RCoreBadge history={FINANCIAL_RCORE_HISTORY} accent={ACCENT} />
    </div>
  );
}

/** One deposit over its MoT: released / withdrawable / escrowed as strokes, NOW, the 3-hour hold, withdrawals as marks. */
function MotChart({ tx, txs, now, t }: { tx: FinTx; txs: FinTx[]; now: number; t: (k: string) => string }) {
  const W = 360, H = 150, P = 10;
  const len = Math.max(1, (tx.motDays ?? 0) * MS_PER_DAY);
  const from = tx.atMs, to = tx.atMs + len;
  function inside(ms: number) { return !(ms < from) && !(ms > to); }
  const withdrawals = txs.filter((x) => x.kind === "withdrawal" && inside(x.atMs));
  const pts = series([tx, ...withdrawals], from, to, len / 120);
  const x = (ms: number) => P + ((ms - from) / len) * (W - 2 * P);
  const y = (cents: number) => H - P - (Math.max(0, Math.min(1, cents / tx.amountCents)) * (H - 2 * P));
  const poly = (pick: (p: (typeof pts)[number]) => number) => pts.map((p) => `${x(p.t).toFixed(1)},${y(pick(p)).toFixed(1)}`).join(" ");
  const elapsed = Math.max(0, Math.min(len, now - from));
  const abc = motABC(elapsed / 1000, len / 1000);
  const eh = Math.floor(elapsed / 3600000), em = Math.floor((elapsed % 3600000) / 60000);
  const sw = VECTOR_LAW.stroke.normal, hair = VECTOR_LAW.stroke.hairline;
  return (
    <div data-fin-chart style={panel}>
      <div style={heading(ACCENT)}>{t("fin.chart_title")} · {fmtMot(abc)}</div>
      <div style={quiet(0.7)}>{fmtStampCST(tx.atMs)} · {usd(tx.amountCents)} · {tx.motDays} · {now < from ? `${t("fin.pending_from")} ${fmtStampCST(tx.atMs)}` : `${eh} h ${em} min ${t("fin.elapsed")}`}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="auto" style={{ display: "block", marginTop: 6 }} aria-hidden>
        <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="none" stroke={LINE} strokeWidth={hair} />
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={P + f * (W - 2 * P)} y1={P} x2={P + f * (W - 2 * P)} y2={H - P} stroke={LINE} strokeWidth={hair} />)}
        <polyline fill="none" stroke={C.intelligence} strokeWidth={hair} points={poly((p) => p.escrowed)} />
        <polyline fill="none" stroke={C.consciousness} strokeWidth={sw} points={poly((p) => p.withdrawable)} />
        <polyline fill="none" stroke={ACCENT} strokeWidth={sw} points={poly((p) => p.released)} />
        <line x1={x(from + HOLD_MS)} y1={H - P} x2={x(from + HOLD_MS)} y2={H - P - 10} stroke={C.temporal} strokeWidth={sw} />
        {withdrawals.map((w) => <line key={w.id} x1={x(w.atMs)} y1={P} x2={x(w.atMs)} y2={P + 12} stroke={C.evolution} strokeWidth={sw} />)}
        {inside(now) && <line x1={x(now)} y1={P} x2={x(now)} y2={H - P} stroke={C.blank} strokeWidth={hair} />}
      </svg>
      <div style={{ ...row, opacity: 0.6 }}><span>0</span><span>900</span><span>1800</span><span>2700</span><span>3600</span></div>
      <div style={{ ...quiet(0.7), display: "flex", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: ACCENT }}>— {t("fin.released")}</span><span style={{ color: C.consciousness }}>— {t("fin.withdrawable")}</span><span style={{ color: C.intelligence }}>— {t("fin.escrowed")}</span><span style={{ color: C.temporal }}>| {t("fin.hold_mark")}</span><span style={{ color: C.blank }}>| {t("fin.now")}</span><span style={{ color: C.evolution }}>| {t("fin.withdrawal")}</span>
      </div>
    </div>
  );
}
