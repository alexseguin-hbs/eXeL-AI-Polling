"use client";

/**
 * ◬ ♡ 웃 Session — the POD (pod-of-3) working session.  "Task • Outcome."
 *
 * Simple flow (operator, 2026-08-13):
 *   1. COMPOSE  — the lead fills an intent + a measurable outcome (required first),
 *                 names the three Trinity leads (the logo auto-draws from their
 *                 first names), and picks 1–3 projects + a task for each. Default
 *                 projects (Architect-2525 · Security-2525 · Manta-2525) each carry
 *                 three ready tasks plus a volunteer/brainstorm item.
 *   2. INVITE   — a scannable QR brings others in; each reviews the intent +
 *                 outcomes and either AGREES or RECOMMENDS CHANGES (which go back
 *                 to the lead).
 *   3. SYNC     — once all agree, all three must start within 15 seconds of each
 *                 other.
 *   4. ACTIVE   — the session runs; anyone can stop it (all stop together).
 *   5. RECORD   — the outcome is recorded: an unlisted YouTube link, written
 *                 words, or voice-to-text (the polling tool's V2T).
 *   6. CLOSED   — a 333-word (3 × 111) synthesis is auto-written.
 *
 * Built on the R-CORE modular framework: reusable data (lib/pod-projects.ts),
 * the shared SoITrinity mark, the SeedCoin, and the polling tool's QR + V2T —
 * nothing new is minted here; the pod is a gate on ◬ ♡ 웃 that already exist.
 *
 * Prototype: local state only, no backend yet.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { SeedCoin } from "@/components/seed-coin";
import { SoITrinity } from "@/components/soi-trinity";
import {
  DEFAULT_PROJECTS, projectTasks, findProject, RECORD_METHODS,
  SYNC_START_SECONDS, type RecordMethod,
} from "@/lib/pod-projects";
import {
  detectRegion, DEFAULT_REGION, REGION_OPTIONS,
  type ResolvedRegion,
} from "@/lib/min-wage";

const WHITE_PAPER = "https://exel-ai-polling.explore-096.workers.dev/whitepaper/vision-2525";

type Phase = "compose" | "invite" | "sync" | "active" | "record" | "closed";
type Member = { role: string; name: string; agreed: boolean; recommend: string; startedAt: number | null };

/* CRS list DERIVED from Vision • 2525 — kept as a collapsible DEMO (operator). */
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
  const A = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let n = seed, out = "";
  for (let i = 0; i < 6; i++) { out += A[n % A.length]; n = Math.floor(n / A.length) + (i + 1) * 131; }
  return out;
}

const firstName = (full: string) => (full.trim().split(/\s+/)[0] || "").toUpperCase();

export default function SoISessionPage() {
  const [phase, setPhase] = useState<Phase>("compose");
  const [intent, setIntent] = useState("");
  const [outcome, setOutcome] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { role: "Lead", name: "", agreed: false, recommend: "", startedAt: null },
    { role: "Member 2", name: "", agreed: false, recommend: "", startedAt: null },
    { role: "Member 3", name: "", agreed: false, recommend: "", startedAt: null },
  ]);
  const [projects, setProjects] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<Record<string, string>>({}); // projectId -> taskId
  const [recordMethod, setRecordMethod] = useState<RecordMethod>("written");
  const [recordValue, setRecordValue] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  const [showCrs, setShowCrs] = useState(false);

  const podCode = useMemo(() => randomCode((intent.length + outcome.length + 7) * 977 + 104729), [intent, outcome]);
  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return `/soi-session?pod=${podCode}`;
    return `${window.location.origin}/soi-session?pod=${podCode}`;
  }, [podCode]);

  // Trinity labels = the three leads' first names (auto-drawn), with gentle fallbacks.
  const trinityLabels = useMemo<[string, string, string]>(() => {
    const [a, b, c] = members.map((m) => firstName(m.name));
    return [a || "YOUR", b || "TRINITY", c || "POD"];
  }, [members]);

  const canOpen = intent.trim() && outcome.trim() && members[0].name.trim();
  const allAgreed = members.every((m) => m.agreed);
  const recommendations = members.filter((m) => !m.agreed && m.recommend.trim());

  const setMember = (i: number, patch: Partial<Member>) =>
    setMembers((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const toggleProject = (id: string) =>
    setProjects((s) => {
      const n = new Set(s);
      if (n.has(id)) { n.delete(id); }
      else if (n.size < 3) { n.add(id); }
      return n;
    });

  // Synchronized start — all three must press within SYNC_START_SECONDS of each other.
  const pressStart = (i: number) => {
    const now = Date.now();
    setMembers((ms) => {
      const next = ms.map((m, j) => (j === i ? { ...m, startedAt: now } : m));
      const times = next.map((m) => m.startedAt).filter((t): t is number => t != null);
      if (times.length === next.length) {
        const spread = Math.max(...times) - Math.min(...times);
        if (spread <= SYNC_START_SECONDS * 1000) {
          setSyncMsg(`Synced — all three started within ${(spread / 1000).toFixed(1)}s.`);
          setTimeout(() => setPhase("active"), 400);
        } else {
          setSyncMsg(`Too far apart (${(spread / 1000).toFixed(1)}s > ${SYNC_START_SECONDS}s). Reset and start together.`);
          return next.map((m) => ({ ...m, startedAt: null }));
        }
      }
      return next;
    });
  };

  const reset = () => {
    setPhase("compose");
    setSyncMsg("");
    setMembers((ms) => ms.map((m) => ({ ...m, agreed: false, recommend: "", startedAt: null })));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header ────────────────────────────────────────────────────────── */}
      <header className="mb-8 text-center">
        <div className="mb-3 font-mono text-3xl tracking-[0.3em]" aria-hidden="true">
          <span className="text-cyan-400">&#9708;</span>{" "}
          <span className="text-pink-400">&#9825;</span>{" "}
          <span className="text-violet-400">&#50883;</span>
        </div>
        <h1 className="text-2xl font-semibold">
          <span className="text-cyan-400">&#9708;</span>{" "}
          <span className="text-pink-400">&#9825;</span>{" "}
          <span className="text-violet-400">&#50883;</span> Session{" "}
          <span className="font-normal text-muted-foreground">&bull; POD &bull; Task &bull; Outcome</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recursive Coordination for Human Continuity — the POD working session.
        </p>
      </header>

      {/* Seed membership — the entry credential (beside the Trinity) ─────── */}
      <SeedMembership />

      {/* Task • Outcome POD flow ────────────────────────────────────────── */}
      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Task • Outcome</h2>
          <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
            {phase}
          </span>
        </div>

        {/* Trinity logo — auto-drawn from the three leads' first names */}
        <div className="mb-5 flex flex-col items-center gap-1">
          <SoITrinity
            labels={trinityLabels}
            color="#19c8cf"
            colors={["#19c8cf", "#ff6bd6", "#c084fc"]}
            textColor="#04121a"
            size={190}
          />
          <span className="text-[11px] text-muted-foreground">Your Trinity — the three leads who gather the pod&rsquo;s feedback</span>
        </div>

        {/* ── COMPOSE ─────────────────────────────────────────────── */}
        {phase === "compose" && (
          <>
            <label className="mb-1 block text-sm font-medium">Intent — what the pod is trying to do</label>
            <textarea
              value={intent} onChange={(e) => setIntent(e.target.value)} rows={2}
              placeholder="e.g. De-risk the first Architect-2525 modular spec."
              className="mb-4 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />
            <label className="mb-1 block text-sm font-medium">Measurable outcome — how we know it is done</label>
            <input
              value={outcome} onChange={(e) => setOutcome(e.target.value)}
              placeholder="e.g. One spec validated on the baseline HAL, reviewed by all 3."
              className="mb-5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
            />

            {/* Three leads → Trinity */}
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              {members.map((m, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{m.role}</div>
                  <input
                    value={m.name} onChange={(e) => setMember(i, { name: e.target.value })}
                    placeholder={i === 0 ? "You (lead)" : "Lead name"}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              ))}
            </div>

            {/* Projects — pick 1–3, then a task each */}
            <div className="mb-5">
              <div className="mb-2 flex items-baseline justify-between">
                <label className="text-sm font-medium">Projects — pick 1 to 3</label>
                <span className="text-[11px] text-muted-foreground">{projects.size}/3 selected</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {DEFAULT_PROJECTS.map((p) => {
                  const on = projects.has(p.id);
                  return (
                    <button
                      key={p.id} type="button" onClick={() => toggleProject(p.id)}
                      className={`rounded-lg border p-3 text-left transition ${on ? "border-cyan-400 bg-cyan-400/10" : "border-border hover:border-cyan-400/50"} ${!on && projects.size >= 3 ? "opacity-40" : ""}`}
                    >
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{p.blurb}</div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                &plus; New Project — register another Domain Play (wires into the Level-3 substrate). Coming from the pod&rsquo;s brainstorm below.
              </p>

              {/* Task menu per selected project (defaults + brainstorm) */}
              {Array.from(projects).map((pid) => {
                const p = findProject(pid);
                if (!p) return null;
                return (
                  <div key={pid} className="mt-3 rounded-lg border border-border bg-background p-3">
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-400">{p.name} — choose a task</div>
                    <div className="grid gap-2">
                      {projectTasks(p).map((t) => (
                        <label key={t.id} className="flex cursor-pointer items-start gap-2 text-sm">
                          <input
                            type="radio" name={`task-${pid}`} className="mt-1"
                            checked={tasks[pid] === t.id}
                            onChange={() => setTasks((s) => ({ ...s, [pid]: t.id }))}
                          />
                          <span>
                            <span className="font-medium">{t.title}</span>
                            <span className="block text-xs text-muted-foreground">{t.outcome}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              disabled={!canOpen}
              onClick={() => setPhase("invite")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Start the pod &amp; invite the others
            </button>
            {!canOpen && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                The lead can only start once the <strong>intent</strong> and <strong>outcome</strong> are filled (and the lead is named).
              </p>
            )}
          </>
        )}

        {/* ── INVITE (QR + agree / recommend) ──────────────────────── */}
        {phase === "invite" && (
          <>
            <div className="mb-4 rounded-lg border border-border bg-background p-4 text-sm">
              <div className="font-medium">Intent</div>
              <p className="mb-2 text-muted-foreground">{intent}</p>
              <div className="font-medium">Measurable outcome</div>
              <p className="text-muted-foreground">{outcome}</p>
            </div>

            <div className="mb-4 flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-4">
              <div className="text-xs text-muted-foreground">Others scan this to review the intent &amp; outcome:</div>
              <div className="rounded-md bg-white p-2"><QRCodeSVG value={joinUrl} size={128} level="M" /></div>
              <code className="text-sm tracking-widest">{podCode}</code>
            </div>

            <div className="mb-4 rounded-lg border border-border p-3">
              <div className="mb-2 text-sm font-medium">Each member: agree, or recommend a change to the lead</div>
              <div className="grid gap-3">
                {members.map((m, i) => (
                  <div key={i} className="rounded-md border border-border p-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={m.agreed}
                        onChange={(e) => setMember(i, { agreed: e.target.checked, recommend: e.target.checked ? "" : m.recommend })} />
                      <span className="font-medium">{m.name || m.role}</span> agrees to the intent &amp; outcome
                    </label>
                    {!m.agreed && (
                      <input
                        value={m.recommend} onChange={(e) => setMember(i, { recommend: e.target.value })}
                        placeholder="…or recommend a change (goes to the lead)"
                        className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                      />
                    )}
                  </div>
                ))}
              </div>
              {recommendations.length > 0 && (
                <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-xs">
                  <div className="mb-1 font-medium text-amber-500">Recommendations for the lead</div>
                  <ul className="list-disc pl-4 text-muted-foreground">
                    {recommendations.map((m, i) => <li key={i}><strong>{m.name || m.role}:</strong> {m.recommend}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                disabled={!allAgreed}
                onClick={() => { setSyncMsg(""); setPhase("sync"); }}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                All agreed — go to synchronized start
              </button>
              <button onClick={() => setPhase("compose")} className="rounded-md border border-border px-4 py-2 text-sm">
                Back to edit (apply recommendations)
              </button>
            </div>
          </>
        )}

        {/* ── SYNC (15-second window) ──────────────────────────────── */}
        {phase === "sync" && (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              All three must press <strong>Start</strong> within <strong>{SYNC_START_SECONDS} seconds</strong> of each other.
            </p>
            <div className="mb-3 grid gap-3 sm:grid-cols-3">
              {members.map((m, i) => (
                <button
                  key={i} onClick={() => pressStart(i)} disabled={m.startedAt != null}
                  className={`rounded-lg border p-3 text-sm font-medium transition ${m.startedAt != null ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-border hover:border-emerald-500/60"}`}
                >
                  {m.name || m.role}
                  <span className="mt-1 block text-xs font-normal">{m.startedAt != null ? "started ✓" : "tap to start"}</span>
                </button>
              ))}
            </div>
            {syncMsg && <p className="mb-2 text-sm font-medium text-foreground">{syncMsg}</p>}
            <button onClick={reset} className="rounded-md border border-border px-4 py-2 text-sm">Reset</button>
          </>
        )}

        {/* ── ACTIVE ───────────────────────────────────────────────── */}
        {phase === "active" && (
          <>
            <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-sm">
              <div className="font-medium text-emerald-500">Session running — all three started together.</div>
              <p className="text-muted-foreground">When the work is done, any member stops the session for everyone and records the outcome.</p>
            </div>
            <button onClick={() => setPhase("record")} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              Stop &amp; record the outcome
            </button>
          </>
        )}

        {/* ── RECORD (video / written / voice) ─────────────────────── */}
        {phase === "record" && (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {RECORD_METHODS.map((r) => (
                <button
                  key={r.id} onClick={() => setRecordMethod(r.id)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${recordMethod === r.id ? "border-cyan-400 bg-cyan-400/10 text-cyan-400" : "border-border"}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="mb-2 text-xs text-muted-foreground">{RECORD_METHODS.find((r) => r.id === recordMethod)?.hint}</p>
            {recordMethod === "video" ? (
              <input
                value={recordValue} onChange={(e) => setRecordValue(e.target.value)}
                placeholder="https://youtu.be/…  (unlisted)"
                className="mb-4 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            ) : (
              <textarea
                value={recordValue} onChange={(e) => setRecordValue(e.target.value)} rows={3}
                placeholder={recordMethod === "voice" ? "Voice-to-text captures the outcome here (polling tool V2T)…" : "Write the outcome…"}
                className="mb-4 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            )}
            <button
              disabled={!recordValue.trim()}
              onClick={() => setPhase("closed")}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Close with recorded outcome
            </button>
          </>
        )}

        {/* ── CLOSED ───────────────────────────────────────────────── */}
        {phase === "closed" && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm">
            <div className="mb-1 font-medium text-emerald-500">Outcome recorded by the pod.</div>
            <p className="text-muted-foreground"><span className="font-medium text-foreground">Intent:</span> {intent}</p>
            <p className="text-muted-foreground"><span className="font-medium text-foreground">Outcome:</span> {outcome}</p>
            <p className="text-muted-foreground break-words"><span className="font-medium text-foreground">Recorded ({recordMethod}):</span> {recordValue}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              A Pod Project auto-writes a 333-word (3 × 111) synthesis — Intent · Outcome · Feedback — via the Cube 6 pipeline; ♡ accrues to all three, per the living document.
            </p>
            <button onClick={reset} className="mt-3 rounded-md border border-border px-4 py-2 text-sm">New pod</button>
          </div>
        )}
      </section>

      {/* CRS list — DEMO, hidden by default ─────────────────────────────── */}
      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <button
          onClick={() => setShowCrs((v) => !v)}
          className="flex w-full items-center justify-between text-left"
          aria-expanded={showCrs}
        >
          <span className="text-lg font-semibold">CRS list — from Vision • 2525 <span className="ml-1 text-xs font-normal text-muted-foreground">demo</span></span>
          <span className="text-sm text-muted-foreground">{showCrs ? "hide ▲" : "show ▼"}</span>
        </button>
        {showCrs && (
          <>
            <div className="mt-3 mb-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                A first change-request spec list derived from <em>Recursive Coordination for Human Continuity</em>.
              </p>
              <Link href={WHITE_PAPER} target="_blank" className="whitespace-nowrap text-xs text-primary underline">Read ↗</Link>
            </div>
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
          </>
        )}
      </section>

      <p className="mt-6 text-center text-[11px] text-muted-foreground">
        Prototype · local state only · &#9708; &#9825; &#50883; mint nothing new here — the pod is a gate on the
        currencies that already exist. — MoT
      </p>
    </div>
  );
}

const fmtUsd = (n: number) => `$${n.toFixed(n < 1 ? 3 : 2)}`;

/**
 * Seed membership panel — entry credential beside the Trinity. Region is
 * auto-assigned from the visitor's IP (Cloudflare /api/geo) so the correct
 * minimum wage prices the Seed; purchase must first be enabled.
 */
function SeedMembership() {
  const [region, setRegion] = useState<ResolvedRegion>(DEFAULT_REGION);
  const [detecting, setDetecting] = useState(true);
  const [manual, setManual] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    detectRegion(ac.signal).then((r) => {
      if (!ac.signal.aborted && !manual) setRegion(r);
    }).finally(() => { if (!ac.signal.aborted) setDetecting(false); });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Seed membership</h2>
        <span className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs uppercase tracking-wide text-emerald-500">
          entry credential
        </span>
      </div>

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
        <div className="flex flex-col items-center gap-1">
          <SeedCoin size={200} />
          <span className="text-[11px] text-muted-foreground">tap the coin to flip</span>
        </div>

        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            Seed is a one-time membership priced at <span className="font-medium text-foreground">one-seventh of your
            local minimum-wage hour</span> — the same formula everywhere; only the local hour changes by region.
            Non-transferable, no vote, no economic claim.
          </p>

          <div className="mt-4 rounded-lg border border-border bg-background p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your region</span>
              <span className="text-[11px] text-muted-foreground">
                {detecting ? "detecting…" : region.detected && !manual ? "auto-detected from your location" : manual ? "manually selected" : "default (detection unavailable)"}
              </span>
            </div>
            <div className="mt-1 text-sm font-medium">{region.label}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">local minimum wage {fmtUsd(region.minWage)}/hr</div>

            <label className="mt-3 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Change region</label>
            <select
              value={region.label}
              onChange={(e) => {
                const r = REGION_OPTIONS.find((o) => o.label === e.target.value)
                  ?? (e.target.value === DEFAULT_REGION.label ? DEFAULT_REGION : undefined);
                if (r) { setManual(true); setRegion(r); }
              }}
              className="mt-1 w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
            >
              {!REGION_OPTIONS.some((o) => o.label === region.label) && (
                <option value={region.label}>{region.label} (detected)</option>
              )}
              {REGION_OPTIONS.map((o) => (
                <option key={o.label} value={o.label}>{o.label} — {fmtUsd(o.minWage)}/hr</option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="text-2xl font-semibold text-emerald-500">
              {fmtUsd(region.seed)}<span className="ml-1 text-sm font-normal text-muted-foreground">/ year</span>
            </div>
            <div className="text-xs text-muted-foreground">= {fmtUsd(region.minWage)} ÷ 7</div>
          </div>

          {!enabled ? (
            <div className="mt-3">
              <button
                onClick={() => setEnabled(true)}
                className="rounded-md border border-emerald-500/50 px-4 py-2 text-sm font-medium text-emerald-500 hover:bg-emerald-500/10"
              >
                Enable Seed membership purchase
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Purchase is disabled until you enable it — a deliberate first step, so nobody buys by accident.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <button className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
                Buy Seed — {fmtUsd(region.seed)}
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Prototype — checkout wires into the Cube 8 payment service. Seed grants membership only; it mints no ◬ ♡ 웃.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
