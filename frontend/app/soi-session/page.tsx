"use client";

/**
 * ◬ ♡ 웃 Session — the POD (pod-of-3) working-session prototype.
 *
 * First method: "Task • Outcome". A lead opens a Task with an intent and a
 * MEASURABLE outcome, invites exactly two others (the Trinity size), and all
 * three lock a shared start time; the outcome must be agreed between the three
 * before it can close. On close the system will auto-write a 333-word
 * (3 × 111) summary — Intent · Outcome · Feedback. This mirrors the
 * Pod Innovation Task proposed in the Vision • 2525 living document
 * (open.proposed → frame.pod), minting nothing new: it is a gate on the
 * currencies that already exist (◬ ♡ 웃).
 *
 * This is a PROTOTYPE: local state only, no backend yet. It reuses QRCodeSVG
 * for the leader's join code, exactly as the polling sim does.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

const WHITE_PAPER = "https://exel-ai-polling.explore-096.workers.dev/whitepaper/vision-2525";

type Member = { role: string; name: string; ackedStart: boolean; agreedOutcome: boolean };
type Phase = "compose" | "locked" | "active" | "closed";

/* Candidate CRS list DERIVED from Vision • 2525 (Recursive Coordination for
 * Human Continuity). Each row cites the white-paper section/block it comes from.
 * This is the "can we build a CRS list from the white paper" experiment: the
 * document's locked principles map cleanly onto testable change-request specs. */
const CRS_FROM_VISION: { id: string; title: string; source: string; spec: string }[] = [
  { id: "CRS-V01", title: "Seed = 1/7 of a local min-wage hour", source: "§ Seed / coin.seed.oneseventh",
    spec: "One-time entry purchase + annual subscription, priced at 1/7 of the local minimum-wage hour (Texas $1.036, Nigeria $0.34/7). Non-transferable, no vote, no economic claim." },
  { id: "CRS-V02", title: "♡ S.I. earned only on POD-witnessed outcome", source: "§12 / unit.ontology (D12)",
    spec: "Shared Intent accrues only when a pod establishes and records an outcome. Clockless contributions score on a capped ladder — Noted 1 / Adopted 3 / Foundational 7." },
  { id: "CRS-V03", title: "웃 H.I. denomination + 9,999/yr ceiling", source: "§2 / unit.ceiling · unit.tranche (D7/D10)",
    spec: "1 웃 = one hour × local minimum wage; earned = hours × M. Wage-floor tranche paid immediately (never clawed back); acceleration tranche locked until witnessed; 9,999 웃/yr settlement boundary with rollforward." },
  { id: "CRS-V04", title: "◬ A.I. = witnessed acceleration, delinked from profit", source: "§14/§18 / unit.accel (D4/D11)",
    spec: "◬ recognizes independently witnessed AI acceleration vs a frozen baseline. The accelerator's only input is the task-scoped hours delta — never Revenue/Gross Profit/Operating Income/R&D Spend — so it sits outside the securities perimeter." },
  { id: "CRS-V05", title: "Pod-of-3 Task • Outcome", source: "open.proposed → frame.pod (this prototype)",
    spec: "A lead + two invited lock a shared start time; every task carries an intent and a measurable outcome; a series of tasks is a Pod Project that auto-writes a 333-word (3×111) summary on close. Mints nothing new." },
  { id: "CRS-V06", title: "Not-a-security by construction", source: "§ legal / coin.family · legal.resilience (D8)",
    spec: "No expectation of profit from the efforts of others; no common enterprise; nothing trades or appreciates idle. The 웃 rail is a Marketplace Escrow Settlement under a per-task Independent Contributor Agreement, not employment." },
  { id: "CRS-V07", title: "Jurisdictional resilience & lawful portability", source: "§16 / legal.sovereign_ledger · legal.iran_workaround (D6/D8)",
    spec: "Ledger logically sovereign from its settlement transport: China participates without crypto (fiat/local rails); Iran has a lawful, crypto-free path. External timestamp anchor + non-operator mirror for tamper-evidence." },
  { id: "CRS-V08", title: "Four continuity metrics (health, not appreciation)", source: "§15 / fund.metrics · fund.escrow (r187)",
    spec: "Revenue, Gross Profit, Operating Income, R&D Spend (absolute) benchmark project/framework health and score P = 0.25(g+gp+oi+rds). They never make Seed an appreciating investment." },
  { id: "CRS-V09", title: "Human Primacy — Adaptive AI-Authority Door", source: "§3 / gov.aidoor (D13)",
    spec: "AI authority has three states — Advisory, Bounded-Autonomous (human-signed, reversible envelope), and Sovereign — with Sovereign (vote/signature/settlement) permanently closed to every machine agent." },
  { id: "CRS-V10", title: "MoT + Replay — append-only, deterministic", source: "§5 / rcore.ledger",
    spec: "Every release reconstructable, every correction still visible, every change carrying the reason recorded at the time; Measurement of Time records actual time separately from 웃." },
  { id: "CRS-V11", title: "Off-switch, reserve & fork-restart", source: "§7 / off.*",
    spec: "Two-key shutdown ceremony, ring-fenced reserve, continuity trust, and a standing ability to fork and restart — no single point of capture." },
  { id: "CRS-V12", title: "Atlantis Accords §5 funding caps", source: "frame.accords (D14)",
    spec: "No single institutional source above 20% of a project or 10% of framework funding in a rolling year; overhead ≤ 15%; zero-min-wage jurisdictions use a locally-agreed floor (never $0)." },
];

function randomCode(seed: number): string {
  // deterministic-ish 6-char code from a seed (no Math.random at module scope)
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let n = seed, out = "";
  for (let i = 0; i < 6; i++) { out += A[n % A.length]; n = Math.floor(n / A.length) + (i + 1) * 131; }
  return out;
}

export default function SoISessionPage() {
  const [phase, setPhase] = useState<Phase>("compose");
  const [intent, setIntent] = useState("");
  const [outcome, setOutcome] = useState("");
  const [startTime, setStartTime] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { role: "Lead", name: "", ackedStart: false, agreedOutcome: false },
    { role: "Member 2", name: "", ackedStart: false, agreedOutcome: false },
    { role: "Member 3", name: "", ackedStart: false, agreedOutcome: false },
  ]);

  const podCode = useMemo(() => randomCode((intent.length + outcome.length + 7) * 977 + 104729), [intent, outcome]);
  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return `/soi-session?pod=${podCode}`;
    return `${window.location.origin}/soi-session?pod=${podCode}`;
  }, [podCode]);

  const allAcked = members.every((m) => m.ackedStart);
  const allAgreed = members.every((m) => m.agreedOutcome);
  const canLock = intent.trim() && outcome.trim() && startTime && members.every((m) => m.name.trim());

  const setMember = (i: number, patch: Partial<Member>) =>
    setMembers((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header ────────────────────────────────────────────────────────── */}
      <header className="mb-8 text-center">
        <div className="mb-3 font-mono text-3xl tracking-[0.3em]" aria-hidden="true">
          <span className="text-cyan-400">&#9708;</span>{" "}
          <span className="text-pink-400">&#9825;</span>{" "}
          <span className="text-violet-400">&#50883;</span>
        </div>
        <h1 className="text-2xl font-semibold">◬ ♡ 웃 Session</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recursive Coordination for Human Continuity — the POD working session.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          First method: <span className="font-medium text-foreground">Task • Outcome</span>. A pod of three
          agrees an intent and a measurable outcome, together.
        </p>
      </header>

      {/* Task • Outcome prototype ───────────────────────────────────────── */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Task • Outcome</h2>
          <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
            {phase}
          </span>
        </div>

        {/* Compose */}
        <label className="mb-1 block text-sm font-medium">Intent — what the pod is trying to do</label>
        <textarea
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          disabled={phase !== "compose"}
          rows={2}
          placeholder="e.g. Draft the first CRS list from the Vision • 2525 white paper."
          className="mb-4 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
        />

        <label className="mb-1 block text-sm font-medium">Measurable outcome — how we know it is done</label>
        <input
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          disabled={phase !== "compose"}
          placeholder="e.g. 12 CRS items, each citing a white-paper section, reviewed by all 3."
          className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
        />

        <label className="mb-1 block text-sm font-medium">Shared start time — all three lock the same moment</label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          disabled={phase !== "compose"}
          className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
        />

        {/* Pod of three */}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          {members.map((m, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m.role}</div>
              <input
                value={m.name}
                onChange={(e) => setMember(i, { name: e.target.value })}
                disabled={phase !== "compose"}
                placeholder={i === 0 ? "You (lead)" : "Invited name"}
                className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring disabled:opacity-60"
              />
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={m.ackedStart}
                  disabled={phase === "compose" || phase === "closed"}
                  onChange={(e) => setMember(i, { ackedStart: e.target.checked })}
                />
                Locked in
              </label>
            </div>
          ))}
        </div>

        {/* Leader QR — invite the other two */}
        {phase !== "compose" && (
          <div className="mb-4 flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-4">
            <div className="text-xs text-muted-foreground">The lead shares this to bring the other two in:</div>
            <div className="rounded-md bg-white p-2">
              <QRCodeSVG value={joinUrl} size={128} level="M" />
            </div>
            <code className="text-sm tracking-widest">{podCode}</code>
          </div>
        )}

        {/* Consensus — outcome agreed between the three */}
        {(phase === "active" || phase === "locked") && (
          <div className="mb-4 rounded-lg border border-border p-3">
            <div className="mb-2 text-sm font-medium">Agree the outcome — all three must sign off</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {members.map((m, i) => (
                <label key={i} className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={m.agreedOutcome}
                    onChange={(e) => setMember(i, { agreedOutcome: e.target.checked })}
                  />
                  {m.name || m.role} agrees
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Phase controls */}
        <div className="flex flex-wrap gap-2">
          {phase === "compose" && (
            <button
              disabled={!canLock}
              onClick={() => setPhase("locked")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Open pod &amp; invite two
            </button>
          )}
          {phase === "locked" && (
            <button
              disabled={!allAcked}
              onClick={() => setPhase("active")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Start (all three locked in)
            </button>
          )}
          {phase === "active" && (
            <button
              disabled={!allAgreed}
              onClick={() => setPhase("closed")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Close with agreed outcome
            </button>
          )}
          {phase !== "compose" && (
            <button
              onClick={() => { setPhase("compose"); setMembers((ms) => ms.map((m) => ({ ...m, ackedStart: false, agreedOutcome: false }))); }}
              className="rounded-md border border-border px-4 py-2 text-sm"
            >
              Reset
            </button>
          )}
        </div>

        {/* Closed — the 333-word summary is auto-written here (prototype placeholder) */}
        {phase === "closed" && (
          <div className="mt-4 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
            <div className="mb-1 font-medium text-emerald-500">Outcome agreed between the three.</div>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Intent:</span> {intent}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Outcome:</span> {outcome}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              On close, a Pod Project auto-writes a 333-word (3 × 111) synthesis — Intent · Outcome · Feedback.
              (Generation wires into the Cube 6 pipeline; ♡ accrues to all three, per the living document.)
            </p>
          </div>
        )}
      </section>

      {/* CRS list from the white paper ──────────────────────────────────── */}
      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">CRS list — from Vision • 2525</h2>
          <Link href={WHITE_PAPER} target="_blank" className="text-xs text-primary underline">
            Read the white paper ↗
          </Link>
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          A first change-request spec list derived from <em>Recursive Coordination for Human Continuity</em>.
          Each item cites the section/block it comes from — the experiment being whether the document&rsquo;s
          locked principles map cleanly onto testable specs. They do.
        </p>
        <ol className="space-y-3">
          {CRS_FROM_VISION.map((c) => (
            <li key={c.id} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-mono text-xs text-primary">{c.id}</span>
                <span className="text-[11px] text-muted-foreground">{c.source}</span>
              </div>
              <div className="mt-0.5 text-sm font-medium">{c.title}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.spec}</div>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Prototype · local state only · &#9708; &#9825; &#50883; mint nothing new here — the pod is a gate on the
        currencies that already exist. — MoT
      </p>
    </div>
  );
}
