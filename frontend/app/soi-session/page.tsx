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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { SeedCoin } from "@/components/seed-coin";
import { SoITrinity } from "@/components/soi-trinity";
import { useLexicon } from "@/lib/lexicon-context";
import { useSessionBroadcast, type SessionBroadcastPayload } from "@/lib/use-session-broadcast";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { buildSynthesis333 } from "@/lib/pod-synthesis";
import { api } from "@/lib/api";
import { format as fmtABC } from "@/lib/abc-3600";
import { TRINITY_COLORS } from "@/lib/trinity-palette";
import {
  DEFAULT_PROJECTS, OPEN_TOPIC, SAMPLE_POD, projectTasks, findProject, RECORD_METHODS,
  SYNC_START_SECONDS, POD_SIZE, FREE_TOOLS_NOTE, EVIDENCE_CHAIN,
  type RecordMethod, type ReceiptArtefacts, type Synthesis333,
} from "@/lib/pod-projects";
import {
  initialPod, reducePod, patchPod, patchAll, attest, movePhase, resetPod, randomPodCode, podPresence,
  syncVerdict, canEditSeat, canWitnessAs, witnessedCount as podWitnessedCount, isWitnessed as podIsWitnessed, WITNESS_FLOOR,
  type Member as PodMember, type PodMsg, type PodState, type Phase as PodPhase,
} from "@/lib/pod-roster";
import {
  detectRegion, DEFAULT_REGION, REGION_OPTIONS,
  type ResolvedRegion,
} from "@/lib/min-wage";

const WHITE_PAPER = "https://exel-ai-polling.explore-096.workers.dev/whitepaper/vision-2525";

// The pod's types and its whole protocol live in lib/pod-roster.ts (pure; simulated in
// tests/soi-pod-sim.test.mjs). This page holds React state and the channel, nothing more.
type Phase = PodPhase;
type Member = PodMember;
const DRIVEN: ReadonlySet<Phase> = new Set<Phase>(["sync", "active", "record", "audit", "closed"]);

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

// A pod code from real randomness — never the clock, which was guessable (Thor, round 1).
function randomCode(): string {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(bytes);
  else for (let i = 0; i < 6; i++) bytes[i] = Math.floor(Math.random() * 256);
  return randomPodCode(bytes);
}

const firstName = (full: string) => (full.trim().split(/\s+/)[0] || "").toUpperCase();

export default function SoISessionPage() {
  const [phase, setPhase] = useState<Phase>("compose");
  const [intent, setIntent] = useState("");
  const [outcome, setOutcome] = useState("");
  const [members, setMembers] = useState<Member[]>(() => initialPod(POD_SIZE).members);
  // Open topic is pre-selected: a pod can be about anything (operator, 2026-09-03).
  const [projects, setProjects] = useState<Set<string>>(new Set([OPEN_TOPIC.id]));
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
  const { t } = useLexicon();

  // Dial-in by code (operator, 2026-09-03: "the default option for people to log in and
  // test, similar to how the polling engine allows multiple people to dial in"). A
  // joiner types the pod code exactly as they would a poll's session code; the QR is
  // just that code carried in a URL. Both land in the same `?pod=` path below.
  const [joinCode, setJoinCode] = useState("");
  const [joinFull, setJoinFull] = useState(false);
  // This phone's seat in the pod: 0 = lead; a joiner is seated 1 or 2 by the lead's
  // roster once it says hello. Until then a joiner edits nothing but its own hello.
  const [mySeat, setMySeat] = useState(0);
  const clientId = useRef("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // localStorage, not sessionStorage: a second tab must be the same phone, not a fourth seat (Enki).
      let id = localStorage.getItem("exel-pod-client");
      if (!id) { id = Math.random().toString(36).slice(2, 10); localStorage.setItem("exel-pod-client", id); }
      clientId.current = id;
    } catch { clientId.current = Math.random().toString(36).slice(2, 10); }
  }, []);

  // On load, a scanned QR carries ?pod=<code> (or ?code=, the poll's spelling) → joiner.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    const code = (q.get("pod") || q.get("code") || "").toUpperCase();
    if (code) { setIsJoiner(true); setPodCode(code); setPhase("invite"); }
  }, []);
  const joinByCode = (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    setJoinFull(false); setIsJoiner(true); setPodCode(code); setPhase("invite");
  };

  const joinUrl = useMemo(() => {
    const c = podCode || "PENDING";
    if (typeof window === "undefined") return `/soi-session?pod=${c}`;
    return `${window.location.origin}/soi-session?pod=${c}`;
  }, [podCode]);

  /* ── The pod's roster, synced across phones (operator, 2026-09-03) ────────────────
     The protocol is PURE and lives in lib/pod-roster.ts — the very functions the three-user
     simulation drives (tests/soi-pod-sim.test.mjs). This component holds React state, the
     channel, and the wiring between them, nothing more. Every message travels INSIDE a
     { pod } envelope on the hook's `session_update` event — never as the poll's bare
     `status`, so a pod on the poll's channel can never move a live poll (Krishna, round 1).
     The lead is pinned on the first roster and forged messages are dropped (Thor); an
     incoming roster merges, so a reloaded lead cannot erase the trio's work (Enki). Offline,
     every send is dropped and the page is the single-phone prototype it was. */
  const podRef = useRef<PodState>(initialPod(POD_SIZE));
  const isJoinerRef = useRef(false);
  useEffect(() => { isJoinerRef.current = isJoiner; }, [isJoiner]);
  const connectedRef = useRef(false);
  const broadcastRef = useRef<(event: "session_update", payload: SessionBroadcastPayload) => Promise<void>>(async () => {});
  const ctx = useCallback(() => ({
    role: (isJoinerRef.current ? "joiner" : "lead") as "lead" | "joiner",
    clientId: clientId.current, connected: connectedRef.current, podSize: POD_SIZE,
  }), []);
  // Apply a pure step: its state into React, its messages onto the channel.
  const apply = useCallback((step: { state: PodState; send: PodMsg[] }) => {
    podRef.current = step.state;
    setMembers(step.state.members); setMySeat(step.state.mySeat); setJoinFull(step.state.full);
    setLiveCount(podPresence(step.state));                     // from the roster, never the poll's presence
    if (DRIVEN.has(step.state.phase)) setPhase(step.state.phase);
    else if (step.state.phase === "invite" && isJoinerRef.current) setPhase("invite");   // a lead's Reset
    for (const m of step.send) broadcastRef.current("session_update", { pod: m }).catch(() => {});
  }, []);

  const onStatus = useCallback((p: SessionBroadcastPayload) => {
    const msg = (p as { pod?: unknown })?.pod as PodMsg | undefined;
    if (!msg) return;                                          // a poll frame — never ours
    apply(reducePod(podRef.current, msg, ctx()));
  }, [apply, ctx]);
  // The channel's presence count is the POLL's participant number; the pod counts its roster.
  const { broadcast, connected } = useSessionBroadcast(podCode || null, onStatus, undefined);
  broadcastRef.current = broadcast;
  connectedRef.current = connected;

  // The lead's own identity is its pin; a joiner pins the lead from the first roster.
  useEffect(() => {
    if (!isJoiner) podRef.current = { ...podRef.current, lead: clientId.current || podRef.current.lead };
  }, [isJoiner]);

  // A joiner announces itself as soon as the channel is live; the lead answers with a seat.
  useEffect(() => {
    if (!connected || !isJoiner) return;
    broadcast("session_update", { pod: { kind: "hello", from: clientId.current } }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, isJoiner]);

  // Phase moves travel to every phone inside the pod envelope. Any member may move the pod —
  // the copy has always said "any member stops the session for everyone"; now that is true.
  const drive = useCallback((status: "sync" | "active" | "record" | "audit" | "closed") => {
    apply(movePhase(podRef.current, status, ctx()));
  }, [apply, ctx]);

  // Which rows this phone may edit: offline, the lead fills all three (the original
  // single-phone prototype); live, the lead owns seat 0 and a joiner owns its own seat.
  const canEdit = (i: number) => canEditSeat(i, podRef.current, ctx());

  // Voice-to-text for the RECORD phase — browser-native (Web Speech API), local-first
  // so it works in the pod's degraded single-phone mode. Committed segments append to
  // whatever is already typed; the caller shows the plain textarea when unsupported.
  const voice = useSpeechRecognition({
    baseText: recordValue,
    onCommit: (full) => setRecordValue(full),
  });

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

  // One seat's change, applied here and sent to the other phones (the pure module decides
  // whether this phone may, and what travels).
  const setMember = (i: number, patch: Partial<Member>) => apply(patchPod(podRef.current, i, patch, ctx()));

  const toggleProject = (id: string) =>
    setProjects((s) => {
      const n = new Set(s);
      if (n.has(id)) { n.delete(id); }
      else if (n.size < 3) { n.add(id); }
      return n;
    });

  // Synchronized start — each phone presses its OWN seat; the presses travel as member
  // patches, and every phone checks the spread once all three are in. Live, this is
  // the first time the 15-second window is measured across three real devices.
  const pressStart = (i: number) => setMember(i, { startedAt: Date.now() });
  useEffect(() => {
    if (phase !== "sync") return;
    const v = syncVerdict(members, SYNC_START_SECONDS);
    if (v.status === "waiting") return;
    if (v.status === "synced") {
      setSyncMsg(`Synced — all three started within ${(v.spreadMs / 1000).toFixed(1)}s.`);
      const tmr = setTimeout(() => drive("active"), 400);
      return () => clearTimeout(tmr);
    }
    setSyncMsg(`Too far apart (${(v.spreadMs / 1000).toFixed(1)}s > ${SYNC_START_SECONDS}s). Reset and start together.`);
    // Each phone clears its OWN press (a merge never erases another phone's start — Enki);
    // offline, the lead clears all three.
    const mine = connected ? (isJoiner ? mySeat : 0) : -1;
    if (mine >= 0) { if (members[mine].startedAt != null) setMember(mine, { startedAt: null }); }
    else apply(patchAll(podRef.current, { startedAt: null }, ctx()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, phase]);

  const reset = () => {
    setSyncMsg("");
    setBaselineHrs("");
    // An explicit reset message — a lead's Reset clears every phone and returns them to the invite.
    apply(resetPod(podRef.current, ctx()));
    setPhase(isJoiner ? "invite" : "compose");
  };

  // TOK-17 cross-review: a claim counts only when at least two OTHER members witness it. The rule
  // lives in lib/pod-roster.ts (WITNESS_FLOOR) so the page and the settlement can never disagree.
  const witnessedCount = (i: number) => podWitnessedCount(members, i);
  const isWitnessed = (i: number) => podIsWitnessed(members, i);
  // A reviewer's attestation travels like any other patch — but only the reviewer's own
  // phone may flip it (offline, the lead flips all, as before).
  // Live: a reviewer flips only its own bit (attest). Offline: the lead flips any reviewer's bit
  // on one phone — the original single-phone prototype.
  const toggleWitness = (memberIdx: number, reviewerIdx: number) => {
    const m = podRef.current.members[memberIdx];
    const on = !m.witnessedBy[reviewerIdx];
    if (connected) apply(attest(podRef.current, memberIdx, on, ctx()));
    else apply(patchPod(podRef.current, memberIdx, { witnessedBy: m.witnessedBy.map((w, j) => (j === reviewerIdx ? on : w)) }, ctx()));
  };
  const canWitness = (reviewerIdx: number) => canWitnessAs(reviewerIdx, podRef.current, ctx());

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

  // The 333-word (3 × 111) synthesis. Cube 6 (the AI pipeline) writes these tiers
  // from the recording in production; this is the local-first deterministic fallback
  // (same pod → same synthesis, so it replays) — each paragraph is EXACTLY 111 words,
  // grounded in this pod's own intent, outcome, recording, witnessed hours, and tokens.
  const synthesis: Synthesis333 = useMemo(() => buildSynthesis333({
    intent, outcome, recordMethod, recordValue,
    members: members.map((m, i) => ({
      name: m.name, role: m.role, hours: parseFloat(m.hours) || 0, did: m.did, witnessed: isWitnessed(i),
    })),
    witnessedHours, totalYugYok, M, baseline, accelDelta, yaTriangle, signerName, podCode,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [intent, outcome, recordMethod, recordValue, members, witnessedHours, totalYugYok, M, baseline, accelDelta, yaTriangle, signerName, podCode]);
  const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

  // Semi-Automated / Autonomous path: when the pod closes and the AI backend is
  // reachable (real Cube 6 provider, keys server-side), let it write the synthesis.
  // In Manual mode (mock / no key) the call returns null and the deterministic
  // synthesis above stands. No stub — the AI path is genuinely wired for when it lands.
  const [aiSynthesis, setAiSynthesis] = useState<Synthesis333 | null>(null);
  useEffect(() => {
    if (phase !== "closed") { setAiSynthesis(null); return; }
    let live = true;
    api.synthesizePodOutcome({
      intent, outcome, record_text: recordValue,
      facts: {
        witnessed_hours: witnessedHours, yug_yok: totalYugYok, m: M,
        baseline_hours: baseline, accel_delta: accelDelta, ya_triangle: yaTriangle,
        signer_name: signerName,
        member_names: members.map((m) => firstName(m.name) || m.role).filter(Boolean),
        pod_code: podCode,
      },
    }).then((r) => { if (live && r) setAiSynthesis(r); }).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const shownSynthesis = aiSynthesis || synthesis;
  const synthesisSource = aiSynthesis ? "ai" : "local";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header ────────────────────────────────────────────────────────── */}
      <header className="mb-8 text-center">
        <div className="mb-3 font-mono text-3xl tracking-[0.3em]" aria-hidden="true">
          <span style={{ color: TRINITY_COLORS.consciousness }}>&#9708;</span>{" "}
          <span style={{ color: TRINITY_COLORS.temporal }}>&#9825;</span>{" "}
          <span style={{ color: TRINITY_COLORS.family }}>&#50883;</span>
        </div>
        <h1 className="text-2xl font-semibold">
          Session <span className="font-normal text-muted-foreground">&middot; POD &middot; Task &middot; Outcome</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Recursive coordination for human continuity.
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
            {/* Dial in — the default door, same as the poll's session code (operator 2026-09-03) */}
            <form
              onSubmit={(e) => { e.preventDefault(); joinByCode(joinCode); }}
              className="mb-4 rounded-lg border border-cyan-400/40 bg-cyan-400/5 p-3"
            >
              <div className="mb-1 text-sm font-medium text-cyan-400">{t("soi.pod.join.title")}</div>
              <p className="mb-2 text-xs text-muted-foreground">{t("soi.pod.join.hint")}</p>
              <div className="flex gap-2">
                <input
                  value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder={t("soi.pod.join.placeholder")} maxLength={8} autoCapitalize="characters" autoComplete="off"
                  aria-label={t("soi.pod.join.placeholder")}
                  className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm tracking-[0.25em] outline-none focus:ring-1 focus:ring-ring"
                />
                <button type="submit" disabled={!joinCode.trim()} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                  {t("soi.pod.join.button")}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{t("soi.pod.join.or_lead")}</p>
            </form>
            <p className="mb-4 rounded-md border border-border bg-muted/30 p-2 text-xs text-muted-foreground">
              A pod is <span className="font-medium text-foreground">exactly three</span> — one lead + two invited. Three is the minimum that lets two people witness a third, so no one settles their own hours (TOK-17 · D5 anti-sybil).
            </p>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <label className="block text-sm font-medium">Intent — what the pod is trying to do</label>
              <button
                type="button"
                onClick={() => { setIntent(SAMPLE_POD.intent); setOutcome(SAMPLE_POD.outcome); }}
                className="whitespace-nowrap text-[11px] text-cyan-400 underline-offset-2 hover:underline"
              >
                {t("soi.pod.sample")}
              </button>
            </div>
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
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <label className="text-sm font-medium">{t("soi.pod.topic.label")}</label>
                <span className="whitespace-nowrap text-[11px] text-muted-foreground">{projects.size}/3 selected</span>
              </div>
              <p className="mb-2 text-[11px] text-muted-foreground">{t("soi.pod.topic.hint")}</p>
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
              onClick={() => { if (!podCode) setPodCode(randomCode()); podRef.current = { ...podRef.current, phase: "invite" }; setPhase("invite"); }}
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
                {connected && liveCount > 1 ? ` · ${liveCount} in the pod` : ""}
                {isJoiner
                  ? (mySeat > 0 ? ` · you are seat ${mySeat + 1}` : connected ? ` · ${t("soi.pod.seat.waiting")}` : " · you joined by code")
                  : " · you are the lead"}
              </div>
              {joinFull && (
                <p className="text-xs text-red-500">{t("soi.pod.seat.full")}</p>
              )}
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
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-cyan-400">
                        {i === 0 ? "Lead" : `Member ${i + 1}`}
                        {connected && i === mySeat && <span className="ml-1 rounded bg-cyan-400/15 px-1 font-normal normal-case tracking-normal">{t("soi.pod.seat.you")}</span>}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{m.name.trim() ? (i === 0 ? "set" : "joined ✓") : "not joined yet"}</span>
                    </div>
                    {/* Each phone edits only its own seat once live; offline the lead fills all three. */}
                    {i === 0 || !canEdit(i) ? (
                      <div className="text-sm"><span className="font-medium">{m.name || <span className="text-muted-foreground">—</span>}</span>{m.contact ? ` · ${m.contact}` : ""}</div>
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
                      <input type="checkbox" checked={m.agreed} disabled={!m.name.trim() || !canEdit(i)}
                        onChange={(e) => setMember(i, { agreed: e.target.checked, recommend: e.target.checked ? "" : m.recommend })} />
                      <span className="font-medium">{m.name || `Member ${i + 1}`}</span> approves the intent &amp; outcome
                    </label>
                    {!m.agreed && m.name.trim() && canEdit(i) && (
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
                  key={i} onClick={() => pressStart(i)} disabled={m.startedAt != null || !canEdit(i)}
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
              <>
                {recordMethod === "voice" && (
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {voice.supported ? (
                      <button
                        type="button"
                        onClick={() => (voice.listening ? voice.stop() : voice.start())}
                        aria-pressed={voice.listening}
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition ${voice.listening ? "border-red-500 bg-red-500/10 text-red-500" : "border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"}`}
                      >
                        <span aria-hidden="true" className={voice.listening ? "animate-pulse" : ""}>
                          {voice.listening ? "●" : "🎤"}
                        </span>
                        {voice.listening ? "Listening — tap to stop" : "Speak the outcome"}
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Voice-to-text isn&rsquo;t available in this browser — type the outcome below.
                      </span>
                    )}
                    {voice.listening && (
                      <span className="text-[11px] text-muted-foreground">on-device transcription · no upload</span>
                    )}
                  </div>
                )}
                <textarea
                  value={recordValue} onChange={(e) => setRecordValue(e.target.value)} rows={3}
                  placeholder={recordMethod === "voice" ? "Tap “Speak the outcome”, or type it here…" : "Write the outcome…"}
                  className="mb-1 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                {recordMethod === "voice" && voice.interim && (
                  <p className="mb-3 text-xs italic text-muted-foreground" aria-live="polite">…{voice.interim}</p>
                )}
                {recordMethod === "voice" && voice.error && (
                  <p className="mb-3 text-xs text-red-500">{voice.error}</p>
                )}
                <div className="mb-4" />
              </>
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
                      {isWitnessed(i) ? "witnessed ✓" : `${witnessedCount(i)}/${WITNESS_FLOOR} witnesses`}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="number" min="0" step="0.25" value={m.hours} disabled={!canEdit(i)}
                      onChange={(e) => setMember(i, { hours: e.target.value })}
                      placeholder="hours" className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                    <input
                      value={m.did} onChange={(e) => setMember(i, { did: e.target.value })} disabled={!canEdit(i)}
                      placeholder="what you did (one line)"
                      className="min-w-[10rem] flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                  {/* the other two attest */}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Cross-review:</span>
                    {members.map((r, j) => j === i ? null : (
                      <button
                        key={j} onClick={() => toggleWitness(i, j)} disabled={!canWitness(j)}
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
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <div className="text-sm font-medium">333-word synthesis <span className="text-xs font-normal text-muted-foreground">— 3 paragraphs: Results · What changed · What next</span></div>
                <span className="font-mono text-[11px] text-muted-foreground">
                  {wordCount(shownSynthesis.results) + wordCount(shownSynthesis.changed) + wordCount(shownSynthesis.next)} words
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {([
                  ["Results", shownSynthesis.results],
                  ["What changed", shownSynthesis.changed],
                  ["What next", shownSynthesis.next],
                ] as const).map(([label, body]) => (
                  <div key={label}>
                    <div className="flex items-baseline justify-between">
                      <div className="font-medium text-foreground">{label}</div>
                      <span className="font-mono text-[10px] text-muted-foreground">{wordCount(body)} words</span>
                    </div>
                    <p className="text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground">
                {synthesisSource === "ai"
                  ? "Written by Cube 6 (Gemini/OpenAI) from the recorded outcome."
                  : "Manual mode — deterministic synthesis grounded in the pod’s own record. Cube 6 (Gemini/OpenAI) writes these tiers once the AI backend is online (Semi-Automated → Autonomous)."}
              </p>
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
        Prototype · {connected ? "live — one roster across the pod" : "local state"} · <span style={{ color: TRINITY_COLORS.consciousness }}>&#9708;</span> <span style={{ color: TRINITY_COLORS.temporal }}>&#9825;</span> <span style={{ color: TRINITY_COLORS.family }}>&#50883;</span> mint nothing new here — the pod is a gate on the
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
