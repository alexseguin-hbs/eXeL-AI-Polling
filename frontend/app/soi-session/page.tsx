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
 * Real session: reuses the poll's own live channel (useSessionBroadcast over
 * session:<code>) — the lead opens a pod code, shares the QR; joiners scan
 * (?pod=<code>), and the lead's start/stop broadcasts move all three phones
 * together (same code method as the poll, scoped to 3, one is lead). Degrades to
 * a local single-phone prototype when Supabase is unreachable. SACRED live-delivery
 * files are untouched — this is an additive consumer of the shared hook.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { SeedCoin } from "@/components/seed-coin";
import { SoITrinity } from "@/components/soi-trinity";
import { useSessionBroadcast } from "@/lib/use-session-broadcast";
import { format as fmtABC } from "@/lib/abc-3600";
import {
  DEFAULT_PROJECTS, projectTasks, findProject, RECORD_METHODS,
  SYNC_START_SECONDS, POD_SIZE, FREE_TOOLS_NOTE, EVIDENCE_CHAIN,
  type RecordMethod, type ReceiptArtefacts, type Synthesis333,
} from "@/lib/pod-projects";
import {
  detectRegion, DEFAULT_REGION, REGION_OPTIONS,
  type ResolvedRegion,
} from "@/lib/min-wage";

const WHITE_PAPER = "https://exel-ai-polling.explore-096.workers.dev/whitepaper/vision-2525";

type Phase = "compose" | "invite" | "sync" | "active" | "record" | "audit" | "closed";
type Member = {
  role: string; name: string; contact: string; agreed: boolean; recommend: string; startedAt: number | null;
  hours: string;              // TOK-17 self-audit: hours this member claims
  did: string;                // TOK-17 self-audit: what they did (one line)
  witnessedBy: boolean[];     // TOK-17 cross-review: witnessedBy[j] = member j attests this claim
};

/* CRS list DERIVED from Vision • 2525 — kept as a collapsible DEMO (operator). */
const CRS_FROM_VISION: { id: string; title: string; source: string; spec: string }[] = [
  { id: "CRS-V01", title: "Seed = 1/7 of a local min-wage hour", source: "§ Seed / coin.seed.oneseventh",
    spec: "One-time entry purchase + annual subscription, priced at 1/7 of the local minimum-wage hour (Texas $1.036, Nigeria $0.34/7). Non-transferable, no vote, no economic claim." },
  { id: "CRS-V02", title: "♡ S.I. earned only on POD-witnessed outcome", source: "§12 / unit.ontology (D12)",
    spec: "Shared Intent accrues only when a pod establishes and records an outcome. Clockless contributions score on a capped ladder — Noted 1 / Adopted 3 / Foundational 7." },
  { id: "CRS-V03", title: "웃 H.I. denomination + budget-approval gate + 9,999/yr ceiling", source: "§2 / unit.ceiling · unit.tranche (D7/D10)",
    spec: "1 웃 = one hour × local minimum wage; earned = M × hours (Multiple × Time). 웃 issues ONLY on witnessed work under a scoped, budget-approved task (hours + local currency, like a CRS split into approved dev tasks) — before approval it is planning, not 웃. Wage-floor tranche paid immediately (never clawed back); acceleration tranche locked until witnessed; 9,999 웃/yr settlement boundary with rollforward." },
  { id: "CRS-V04", title: "◬ A.I. = witnessed acceleration, delinked from profit", source: "§14/§18 / unit.accel (D4/D11)",
    spec: "◬ recognizes independently witnessed AI acceleration vs a frozen baseline. The accelerator's only input is the task-scoped hours delta — never Revenue/Gross Profit/Operating Income/R&D Spend — so it sits outside the securities perimeter." },
  { id: "CRS-V05", title: "Pod-of-3 Task • Outcome", source: "open.proposed → frame.pod (this prototype)",
    spec: "A lead + two invited lock a shared start time; every task carries an intent and a measurable outcome; a series of tasks is a Pod Project that auto-writes a 333-word (3×111) summary on close. Mints nothing new." },
  { id: "CRS-V06", title: "Not-a-security by construction", source: "§ legal / coin.family · legal.resilience (D8)",
    spec: "No expectation of profit from the efforts of others; no common enterprise; nothing trades or appreciates idle. The 웃 rail is a Marketplace Escrow Settlement under a per-task Independent Contributor Agreement, not employment." },
  { id: "CRS-V07", title: "Jurisdictional resilience & lawful portability", source: "§16 / legal.sovereign_ledger · legal.iran_workaround (D6/D8)",
    spec: "Ledger logically sovereign from its settlement transport: China participates without crypto (fiat/local rails); Iran has a lawful, crypto-free path. External timestamp anchor + non-operator mirror for tamper-evidence." },
  { id: "CRS-V08", title: "QIS — Qualified Innovation Score (measurement, not appreciation)", source: "§15/§18 / fund.metrics · fund.reward (r217/r228)",
    spec: "A project's financial-innovation growth is measured by QIS = (R + GP + OI + ERD) ÷ 4, where ERD = QRD − ½·max(0, QRD − R/3) (R&D target = R/3). Growth = ΔQIS; ΔQIS sizes the Reward Pool — it mints no 웃 (웃 = M × hours). Measurement ≠ payment; QIS creates no recognition, ownership, or appreciation." },
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
  const mkMember = (role: string): Member =>
    ({ role, name: "", contact: "", agreed: false, recommend: "", startedAt: null,
       hours: "", did: "", witnessedBy: [false, false, false] });
  const [members, setMembers] = useState<Member[]>([
    mkMember("Lead"), mkMember("Lead 2"), mkMember("Lead 3"),
  ]);
  const [projects, setProjects] = useState<Set<string>>(new Set());
  const [tasks, setTasks] = useState<Record<string, string>>({}); // projectId -> taskId
  const [recordMethod, setRecordMethod] = useState<RecordMethod>("written");
  const [recordValue, setRecordValue] = useState("");
  const [syncMsg, setSyncMsg] = useState("");
  const [showCrs, setShowCrs] = useState(false);

  // TOK-18 accelerator: the frozen-baseline estimate (hours) the pod set BEFORE work,
  // and the conflict-excluded signer. ◬ is the delta actual-vs-baseline only — never a
  // profit metric — so it sits outside the securities perimeter (D4).
  const [baselineHrs, setBaselineHrs] = useState("");
  const [signerIdx, setSignerIdx] = useState(0);

  // Real session over the poll's own live channel (session:<code>), scoped to a pod
  // of 3 (operator: same code+login method as the poll, one is lead). A joiner opens
  // /soi-session?pod=<code>; the lead generates the code when opening the pod. Start
  // and stop broadcast over the channel so all three phones move together; if Supabase
  // is unavailable the page still works as a local single-phone prototype.
  const [podCode, setPodCode] = useState("");
  const [isJoiner, setIsJoiner] = useState(false);
  const [liveCount, setLiveCount] = useState(1);

  // On load, a scanned QR carries ?pod=<code> → this phone is a joiner.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const code = new URLSearchParams(window.location.search).get("pod");
    if (code) { setIsJoiner(true); setPodCode(code); setPhase("invite"); }
  }, []);

  const joinUrl = useMemo(() => {
    const c = podCode || "PENDING";
    if (typeof window === "undefined") return `/soi-session?pod=${c}`;
    return `${window.location.origin}/soi-session?pod=${c}`;
  }, [podCode]);

  // Follow the lead's start/stop across phones. Joiners (and the lead's other devices)
  // move phase when a status broadcast arrives; the lead is the only one that emits.
  const onStatus = useCallback((p: { status?: string }) => {
    const s = p?.status;
    if (s === "sync") setPhase("sync");
    else if (s === "active") setPhase("active");
    else if (s === "record") setPhase("record");
    else if (s === "audit") setPhase("audit");
    else if (s === "closed") setPhase("closed");
  }, []);
  const onPresence = useCallback((n: number) => setLiveCount(n), []);
  const { broadcast, connected } = useSessionBroadcast(podCode || null, onStatus, onPresence);
  // The lead drives start/stop; broadcast is a no-op when not connected (graceful degrade).
  const drive = useCallback((status: "sync" | "active" | "record" | "audit" | "closed") => {
    if (!isJoiner) broadcast("status", { status }).catch(() => {});
  }, [isJoiner, broadcast]);

  // Trinity labels = the three leads' first names (auto-drawn), with gentle fallbacks.
  const trinityLabels = useMemo<[string, string, string]>(() => {
    const [a, b, c] = members.map((m) => firstName(m.name));
    return [a || "YOUR", b || "TRINITY", c || "POD"];
  }, [members]);

  // Leader-only setup: the lead runs it once the intent + outcome are filled and
  // the lead is named. The other two join by scanning the QR.
  const canOpen = !!(intent.trim() && outcome.trim() && members[0].name.trim());
  const allJoined = members.every((m) => m.name.trim());
  const allAgreed = allJoined && members.every((m) => m.agreed);
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
          setTimeout(() => { setPhase("active"); drive("active"); }, 400);
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
    setBaselineHrs("");
    setMembers((ms) => ms.map((m) => ({ ...m, agreed: false, recommend: "", startedAt: null, hours: "", did: "", witnessedBy: [false, false, false] })));
  };

  // TOK-17 cross-review: a member's hours count only when BOTH other members witness.
  const witnessedCount = (i: number) => members[i].witnessedBy.filter((w, j) => w && j !== i).length;
  const isWitnessed = (i: number) => witnessedCount(i) >= POD_SIZE - 1; // both others
  const toggleWitness = (memberIdx: number, reviewerIdx: number) =>
    setMembers((ms) => ms.map((m, i) => i === memberIdx
      ? { ...m, witnessedBy: m.witnessedBy.map((w, j) => (j === reviewerIdx ? !w : w)) } : m));

  // Witnessed 웃 (M = 1 wage-floor in this prototype; earned = M × hours (Multiple × Time), ceiling-noted).
  const M = 1;
  const witnessedHours = members.reduce((s, m, i) => s + (isWitnessed(i) ? (parseFloat(m.hours) || 0) : 0), 0);
  const totalYugYok = witnessedHours * M;                       // 웃 that would settle
  const allSelfAudited = members.every((m) => (parseFloat(m.hours) || 0) > 0 && m.did.trim());
  const allWitnessed = members.every((_, i) => isWitnessed(i));

  // TOK-18 ◬ accelerator: delta of the frozen baseline estimate vs the witnessed actual.
  // Delta-only input — never a profit metric (D4). Positive delta = time saved = ◬ recognised.
  const baseline = parseFloat(baselineHrs) || 0;
  const accelDelta = baseline > 0 ? Math.max(0, baseline - witnessedHours) : 0; // hours saved
  const yaTriangle = accelDelta * M;                            // ◬ recognised (illustrative 웃-equiv)
  // D11 conflict-excluded signer: the signer is not the sole beneficiary of the ◬.
  const signerName = firstName(members[signerIdx]?.name || "") || members[signerIdx]?.role || "—";

  // TOK-26 — one record, four artefacts.
  const receipt: ReceiptArtefacts = {
    transcript:
      `Pod ${podCode || "(local)"} — ${members.map((m) => firstName(m.name) || m.role).join(" · ")}. ` +
      `Intent: ${intent || "—"}. Outcome: ${outcome || "—"}. ` +
      `Recorded (${recordMethod}): ${recordValue || "—"}. Self-audited hours: ` +
      members.map((m) => `${firstName(m.name) || m.role} ${parseFloat(m.hours) || 0}h`).join(", ") + ".",
    portfolio:
      `Contributed to "${outcome || intent || "a pod task"}" in a witnessed pod of three, ` +
      `${witnessedHours}h cross-reviewed` + (yaTriangle > 0 ? `, ${accelDelta}h ahead of a frozen baseline.` : "."),
    governance:
      `Witnessed by the pod: ${members.filter((_, i) => isWitnessed(i)).length}/${POD_SIZE} claims cross-reviewed. ` +
      `Accelerator signed by ${signerName} (conflict-excluded). ` +
      `AI-authority: Advisory — every settlement stays human-signed (Sovereign closed to machines).`,
    settlement:
      `${totalYugYok.toFixed(3)} 웃 settle (M × hours, M=${M}), each person bound by 9,999/yr with rollforward; ` +
      (yaTriangle > 0 ? `${yaTriangle.toFixed(0)} ◬ recognised (delta only, no profit input). ` : "no ◬ this task. ") +
      `MoT keeps the actual minutes separately. Nothing new is minted — this gates existing currencies.`,
  };

  // The 333-word (3 × 111) synthesis, in the operator's three sections.
  const synthesis: Synthesis333 = {
    results: `Results — the pod produced: ${outcome || "the agreed outcome"}. Recorded via ${recordMethod}. (Cube 6 writes the full 111 words.)`,
    changed: `What changed — ${witnessedHours}h of witnessed contribution settled as ${totalYugYok.toFixed(1)} 웃` +
      (yaTriangle > 0 ? `, ${accelDelta}h ahead of the frozen baseline (${yaTriangle.toFixed(0)} ◬).` : ".") +
      " (Cube 6 writes the full 111 words.)",
    next: `What next — the outcome feeds the backlog; the pod can adopt the next Task • Outcome. (Cube 6 writes the full 111 words.)`,
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
            <p className="mb-4 rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
              A pod is <span className="font-medium text-foreground">exactly three</span> — one lead + two invited. Three is the minimum that lets two people witness a third, so no one settles their own hours (TOK-17 · D5 anti-sybil).
            </p>
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

            {/* Leader only sets the session up. The lead's email imports from their
                OAuth login; the other two JOIN by scanning the QR — their info
                imports and they enter their name (operator, 2026-08-13). */}
            <div className="mb-2 flex items-baseline justify-between">
              <label className="text-sm font-medium">You — the lead</label>
              <span className="text-[11px] text-muted-foreground">the other two join by QR</span>
            </div>
            <div className="mb-5 rounded-lg border border-cyan-400/40 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cyan-400">Lead</div>
              <input
                value={members[0].name} onChange={(e) => setMember(0, { name: e.target.value })}
                placeholder="Your name"
                className="mb-2 w-full rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
              <input
                value={members[0].contact} onChange={(e) => setMember(0, { contact: e.target.value })}
                placeholder="your email (imports from your login)"
                inputMode="email"
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Your email imports from your OAuth login. You share the QR next — the other two scan to join, their info imports, and they enter their name.
              </p>
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
              onClick={() => { if (!podCode) setPodCode(randomCode((Date.now() % 1e9) + intent.length * 31 + 7)); setPhase("invite"); }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Share QR &amp; open the pod
            </button>
            {!canOpen && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                The lead opens it once the <strong>intent</strong> and <strong>outcome</strong> are filled and the <strong>lead is named</strong>. The other two join by scanning the QR.
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

            {/* Leader shares the QR; the other two scan to join. */}
            <div className="mb-4 flex flex-col items-center gap-2 rounded-lg border border-cyan-400/40 bg-background p-4">
              <div className="text-sm font-medium text-cyan-400">Share this QR</div>
              <div className="text-center text-xs text-muted-foreground">
                The other two scan to join — their info imports from their login (email / OAuth); they enter their name.
              </div>
              <div className="rounded-md bg-white p-2"><QRCodeSVG value={joinUrl} size={140} level="M" /></div>
              <code className="text-sm tracking-widest">{podCode || "…"}</code>
              <div className="text-[11px] text-muted-foreground">
                {connected
                  ? <span className="text-cyan-400">● live</span>
                  : <span>○ local (live sync when Supabase is reachable)</span>}
                {connected && liveCount > 1 ? ` · ${liveCount} on the channel` : ""}
                {isJoiner ? " · you joined by QR" : " · you are the lead"}
              </div>
            </div>

            {/* The trio — lead is set; the other two join, then all comment & approve. */}
            <div className="mb-4 rounded-lg border border-cyan-400/30 p-3">
              <div className="mb-1 text-sm font-medium">The trio — join, comment &amp; approve</div>
              <div className="mb-3 text-xs text-muted-foreground">
                The lead is set. The other two join by scanning; on join their email imports from their login and they enter their name. Each approves the intent &amp; outcome or comments a recommended change (to the lead). The pod proceeds only when <strong>accepted by all three</strong>.
              </div>
              <div className="grid gap-3">
                {members.map((m, i) => (
                  <div key={i} className="rounded-md border border-border p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-cyan-400">{i === 0 ? "Lead" : `Member ${i + 1}`}</span>
                      <span className="text-[11px] text-muted-foreground">{m.name.trim() ? (i === 0 ? "set" : "joined ✓") : "not joined yet"}</span>
                    </div>
                    {i === 0 ? (
                      <div className="text-sm"><span className="font-medium">{m.name}</span>{m.contact ? ` · ${m.contact}` : ""}</div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          value={m.contact} onChange={(e) => setMember(i, { contact: e.target.value })}
                          placeholder="email (imports from login)" inputMode="email"
                          className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                        />
                        <input
                          value={m.name} onChange={(e) => setMember(i, { name: e.target.value })}
                          placeholder="enter your name"
                          className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-ring"
                        />
                      </div>
                    )}
                    <label className="mt-2 flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={m.agreed} disabled={!m.name.trim()}
                        onChange={(e) => setMember(i, { agreed: e.target.checked, recommend: e.target.checked ? "" : m.recommend })} />
                      <span className="font-medium">{m.name || `Member ${i + 1}`}</span> approves the intent &amp; outcome
                    </label>
                    {!m.agreed && m.name.trim() && (
                      <input
                        value={m.recommend} onChange={(e) => setMember(i, { recommend: e.target.value })}
                        placeholder="…or comment a change (goes to the lead)"
                        className="mt-2 w-full rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring"
                      />
                    )}
                  </div>
                ))}
              </div>
              {recommendations.length > 0 && (
                <div className="mt-3 rounded-md border border-cyan-400/40 bg-cyan-400/5 p-2 text-xs">
                  <div className="mb-1 font-medium text-cyan-400">Recommendations for the lead</div>
                  <ul className="list-disc pl-4 text-muted-foreground">
                    {recommendations.map((m, i) => <li key={i}><strong>{m.name || m.role}:</strong> {m.recommend}</li>)}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                disabled={!allAgreed}
                onClick={() => { setSyncMsg(""); setPhase("sync"); drive("sync"); }}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Accepted by the trio — go to synchronized start
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
                  className={`rounded-lg border p-3 text-sm font-medium transition ${m.startedAt != null ? "border-cyan-500 bg-cyan-500/10 text-cyan-500" : "border-border hover:border-cyan-500/60"}`}
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
            <div className="mb-4 rounded-lg border border-cyan-500/40 bg-cyan-500/5 p-3 text-sm">
              <div className="font-medium text-cyan-500">Session running — all three started together.</div>
              <p className="text-muted-foreground">When the work is done, any member stops the session for everyone and records the outcome.</p>
            </div>
            <button onClick={() => { setPhase("record"); drive("record"); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
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
              onClick={() => { setPhase("audit"); drive("audit"); }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Next — witness the hours
            </button>
          </>
        )}

        {/* ── AUDIT — TOK-17 self-audit + cross-review; TOK-18 accelerator ─── */}
        {phase === "audit" && (
          <>
            {/* the eight-step evidence chain, with progress */}
            <div className="mb-4 rounded-lg border border-border p-3">
              <div className="mb-2 text-sm font-medium">The evidence chain <span className="text-xs font-normal text-muted-foreground">— clock-in → cross-review (TOK-17)</span></div>
              <ol className="grid gap-1.5 sm:grid-cols-2">
                {EVIDENCE_CHAIN.map((s) => {
                  const done = s.step <= 5 || (s.key === "selfaudit" && allSelfAudited) || (s.key === "crossreview" && allWitnessed) || (s.key === "mint" && allWitnessed);
                  return (
                    <li key={s.key} className="flex items-start gap-2 text-xs">
                      <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${done ? "bg-cyan-500 text-white" : "border border-border text-muted-foreground"}`}>
                        {done ? "✓" : s.step}
                      </span>
                      <span><span className="font-medium text-foreground">{s.label}</span> — <span className="text-muted-foreground">{s.note}</span></span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* self-audit + cross-review, per member */}
            <div className="mb-4 space-y-3">
              {members.map((m, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">{firstName(m.name) || m.role}</span>
                    <span className={`rounded px-2 py-0.5 text-[11px] ${isWitnessed(i) ? "bg-cyan-500/15 text-cyan-500" : "bg-muted text-muted-foreground"}`}>
                      {isWitnessed(i) ? "witnessed ✓" : `${witnessedCount(i)}/${POD_SIZE - 1} witnesses`}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number" min="0" step="0.25" value={m.hours}
                      onChange={(e) => setMember(i, { hours: e.target.value })}
                      placeholder="hours" className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                    <input
                      value={m.did} onChange={(e) => setMember(i, { did: e.target.value })}
                      placeholder="what you did (one line)"
                      className="min-w-[10rem] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  {/* the other two attest */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Cross-review:</span>
                    {members.map((r, j) => j === i ? null : (
                      <button
                        key={j} onClick={() => toggleWitness(i, j)}
                        className={`rounded-md border px-2 py-1 ${m.witnessedBy[j] ? "border-cyan-400 bg-cyan-400/10 text-cyan-400" : "border-border text-muted-foreground"}`}
                      >
                        {m.witnessedBy[j] ? "✓ " : ""}{firstName(r.name) || r.role} witnesses
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* TOK-18 accelerator — delta only, conflict-excluded signer */}
            <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
              <div className="mb-2 text-sm font-medium text-cyan-500">Accelerator <span className="text-xs font-normal text-muted-foreground">— ◬ vs a frozen baseline (TOK-18)</span></div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="text-xs text-muted-foreground">Frozen baseline (hours the pod estimated up front):</label>
                <input
                  type="number" min="0" step="0.25" value={baselineHrs}
                  onChange={(e) => setBaselineHrs(e.target.value)}
                  placeholder="est. hours" className="w-28 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-foreground">Signer (conflict-excluded):</span>
                {members.map((r, j) => (
                  <button
                    key={j} onClick={() => setSignerIdx(j)}
                    className={`rounded-md border px-2 py-1 ${signerIdx === j ? "border-cyan-400 bg-cyan-400/10 text-cyan-400" : "border-border text-muted-foreground"}`}
                  >{firstName(r.name) || r.role}</button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {baseline > 0
                  ? (accelDelta > 0
                      ? `${accelDelta}h ahead of the ${baseline}h baseline → ${yaTriangle.toFixed(0)} ◬ recognised (delta only — never a profit metric), signed by ${signerName}.`
                      : `No time saved against the ${baseline}h baseline — no ◬ this task.`)
                  : "Enter the frozen baseline to compute ◬. ◬ is the hours delta only — never Revenue / Gross Profit / Operating Income / R&D — so it stays outside the securities perimeter."}
              </p>
            </div>

            <div className="mb-3 rounded-md border border-border p-3 text-sm">
              <span className="font-medium text-foreground">{witnessedHours} witnessed hours <span className="font-mono text-xs text-muted-foreground">· MoT {fmtABC(witnessedHours)}</span></span>
              <span className="text-muted-foreground"> → {totalYugYok.toFixed(3)} &#50883; would settle (M × hours, M={M}), each capped at 9,999/yr with rollforward. Only witnessed hours count.</span>
            </div>

            <button
              disabled={!allWitnessed || !allSelfAudited}
              onClick={() => { setPhase("closed"); drive("closed"); }}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Settle &amp; issue the receipt
            </button>
            {(!allWitnessed || !allSelfAudited) && (
              <p className="mt-2 text-xs text-muted-foreground">Every member self-audits their hours, and both others must witness each claim, before settlement.</p>
            )}
          </>
        )}

        {/* ── CLOSED — TOK-26 four-artefact receipt + 333 synthesis ─── */}
        {phase === "closed" && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-cyan-500/40 bg-cyan-500/5 p-4">
              <div className="mb-1 font-medium text-cyan-500">Settled &amp; receipted by the pod.</div>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Intent:</span> {intent}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Outcome:</span> {outcome}</p>
              <p className="text-muted-foreground break-words"><span className="font-medium text-foreground">Recorded ({recordMethod}):</span> {recordValue}</p>
            </div>

            {/* TOK-26 — one record, four artefacts */}
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 text-sm font-medium">The receipt <span className="text-xs font-normal text-muted-foreground">— one ledger record, read four ways (TOK-26)</span></div>
              <dl className="space-y-2 text-xs">
                {([
                  ["Transcript", receipt.transcript],
                  ["Portfolio", receipt.portfolio],
                  ["Governance", receipt.governance],
                  ["Settlement", receipt.settlement],
                ] as const).map(([label, body]) => (
                  <div key={label} className="rounded-md border border-border p-2">
                    <dt className="font-medium text-cyan-400">{label}</dt>
                    <dd className="mt-0.5 text-muted-foreground">{body}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* the 333-word (3 × 111) synthesis, in the operator's three sections */}
            <div className="rounded-lg border border-border p-4">
              <div className="mb-2 text-sm font-medium">333-word synthesis <span className="text-xs font-normal text-muted-foreground">— 3 × 111: Results · What changed · What next (Cube 6)</span></div>
              <div className="space-y-2 text-xs">
                {([
                  ["Results (111)", synthesis.results],
                  ["What changed (111)", synthesis.changed],
                  ["What next (111)", synthesis.next],
                ] as const).map(([label, body]) => (
                  <div key={label}>
                    <div className="font-medium text-foreground">{label}</div>
                    <p className="text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-cyan-400/30 p-3 text-xs">
              <div className="mb-1 font-medium text-cyan-400">Trio — accepted, witnessed &amp; documented</div>
              <ul className="text-muted-foreground">
                {members.map((m, i) => (
                  <li key={i}>
                    <span className="text-foreground">{m.role}:</span> {m.name || "—"}
                    {m.contact ? ` · ${m.contact}` : ""} {m.agreed ? "· ✓ approved" : ""} {isWitnessed(i) ? "· ✓ witnessed" : ""}
                    {parseFloat(m.hours) > 0 ? ` · ${parseFloat(m.hours)}h` : ""}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">{FREE_TOOLS_NOTE}</p>
            <p className="text-[11px] text-muted-foreground">
              ♡ accrues to all three on the witnessed outcome; 웃 settles from witnessed hours under the 9,999/yr ceiling; ◬ only from the frozen-baseline delta. Nothing new is minted — the pod gates currencies that already exist. — MoT
            </p>
            <button onClick={reset} className="rounded-md border border-border px-4 py-2 text-sm">New pod</button>
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
        <span className="rounded-full border border-cyan-500/40 px-3 py-1 text-xs uppercase tracking-wide text-cyan-500">
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
            <div className="text-2xl font-semibold text-cyan-500">
              {fmtUsd(region.seed)}<span className="ml-1 text-sm font-normal text-muted-foreground">/ year</span>
            </div>
            <div className="text-xs text-muted-foreground">= {fmtUsd(region.minWage)} ÷ 7</div>
          </div>

          {!enabled ? (
            <div className="mt-3">
              <button
                onClick={() => setEnabled(true)}
                className="rounded-md border border-cyan-500/50 px-4 py-2 text-sm font-medium text-cyan-500 hover:bg-cyan-500/10"
              >
                Enable Seed membership purchase
              </button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Purchase is disabled until you enable it — a deliberate first step, so nobody buys by accident.
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <button className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600">
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
