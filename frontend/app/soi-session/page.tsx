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
import { SeedMembership } from "@/components/seed-membership";
import { SoiLanding } from "@/components/soi-landing";
import { SoITrinity } from "@/components/soi-trinity";
import { PodPhaseRail } from "@/components/pod-phase-rail";
import { POD_PHASES, phaseIndex } from "@/lib/pod-phases";
import { useAuth0 } from "@auth0/auth0-react";
import { useLexicon } from "@/lib/lexicon-context";
import { useSessionBroadcast, type SessionBroadcastPayload } from "@/lib/use-session-broadcast";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import { buildSynthesis333 } from "@/lib/pod-synthesis";
import { api } from "@/lib/api";
import { format as fmtABC } from "@/lib/abc-3600";
import { measure, supported, witnessedHours as spanHours, hhmmss, heartsFor, RUNGS, type ClockEvent, type Rung } from "@/lib/pod-clock";
import { readProvider } from "@/lib/ai-provider";
import { appendPod, replayPod, recentPods } from "@/lib/pod-store";
import { BANDS, bandFor, standing, hoursToCeiling, YUG_CEILING, mint, stamp, type Vintage } from "@/lib/pod-yug";
import {
  REGION_RATES, regionId, findRegion, tierOf, TIER_REASON, settleInRegion, formatLocal, DEFAULT_REGION_ID,
  JURISDICTIONS, findJurisdiction, localitiesOf, defaultForCountry, COUNTRIES_BY_TIER, BY_TIER,
  TIER_ORDER, TIER_LABEL, type Jurisdiction,
} from "@/lib/pod-rates";
import { aiPodSummary } from "@/lib/ai";
import { lockBaseline, accelerate, noConditions, CONDITION_IDS, split, type Baseline, type AccelConditions } from "@/lib/pod-baseline";
import { useThemeHue } from "@/lib/theme-hue";
import { TrinityGlyphs } from "@/components/trinity-glyphs";
import { SoiGlobe } from "@/components/soi-globe";
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

/**
 * ELECTION OF LOCALITY (operator 2026-09-11) — the two-step control, used for the pod's default and for each member.
 *
 * Step one is the PLACE: 103 countries, grouped by the paper's four settlement tiers. Step two appears only where the
 * paper publishes more than one jurisdiction in that country — today Canada (Federal · Québec) and India (national ·
 * West Bengal · Punjab). Everywhere else a country is one place and the election is a single click.
 *
 * A person elects a place, never a language: Switzerland used to appear three times, once per language, with the same
 * rate each time. The language comes from the app's own 33-language selector.
 */
function LocalityElect({ value, onChange, disabled, testid, inherited }: {
  value: string | null; onChange: (id: string) => void; disabled?: boolean; testid: string; inherited?: Jurisdiction;
}) {
  const chosen = value ? findJurisdiction(value) : undefined;
  const shown = chosen ?? inherited;
  const locs = shown ? localitiesOf(shown.cc) : [];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={shown?.cc ?? ""} disabled={disabled} data-testid={testid}
        onChange={(e) => { const d = defaultForCountry(e.target.value); if (d) onChange(d.id); }}
        className="min-h-[44px] max-w-full rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
      >
        {!chosen && <option value={shown?.cc ?? ""}>{inherited ? `inherits ${inherited.country}` : "choose your place"}</option>}
        {TIER_ORDER.map((tier) => (
          <optgroup key={tier} label={TIER_LABEL[tier]}>
            {COUNTRIES_BY_TIER[tier].map((j) => (
              <option key={j.cc} value={j.cc}>{j.country}{j.rate !== null ? ` — ${j.rate} ${j.currency}/h` : ""}</option>
            ))}
          </optgroup>
        ))}
      </select>
      {locs.length > 1 && (
        <select
          value={chosen?.id ?? shown?.id ?? ""} disabled={disabled} data-testid={`${testid}-locality`}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[44px] max-w-full rounded-md border border-border bg-background px-2 py-1 text-xs disabled:opacity-50"
        >
          {locs.map((j) => (
            <option key={j.id} value={j.id}>{j.locality ?? "national"}{j.rate !== null ? ` — ${j.rate} ${j.currency}/h` : " — no rate published"}</option>
          ))}
        </select>
      )}
    </div>
  );
}

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
    spec: "웃 = M × T (Multiple × Time) — earned = M × hours, currency-free at mint: one 웃 is one hour at 1× the local minimum wage, so the multiple is the 웃-per-hour rate. Settlement is local and reads the stamp: $ = 웃 × stamped rate. 웃 issues ONLY on witnessed work under a scoped, budget-approved task (hours + local currency, like a CRS split into approved dev tasks) — before approval it is planning, not 웃. Wage-floor tranche paid immediately (never clawed back); acceleration tranche locked until witnessed; 9,999 웃/yr settlement boundary with rollforward." },
  { id: "CRS-V04", title: "◬ A.I. = witnessed acceleration, delinked from profit", source: "§14/§18 / unit.accel (D4/D11)",
    spec: "◬ recognizes independently witnessed AI acceleration vs a frozen baseline. The accelerator's only input is the task-scoped hours delta — never Revenue/Gross Profit/Operating Income/R&D Spend — so it sits outside the securities perimeter." },
  { id: "CRS-V05", title: "Pod-of-3 Task • Outcome", source: "open.proposed → frame.pod (this prototype)",
    spec: "A lead + two invited lock a shared start time; every task carries an intent and a measurable outcome; a series of tasks is a Pod Project that auto-writes a 333-word (3×111) summary on close. Mints nothing new." },
  { id: "CRS-V06", title: "Not-a-security by construction", source: "§ legal / coin.family · legal.resilience (D8)",
    spec: "No expectation of profit from the efforts of others; no common enterprise; nothing trades or appreciates idle. The 웃 rail is a Marketplace Escrow Settlement under a per-task Independent Contributor Agreement, not employment." },
  { id: "CRS-V07", title: "Jurisdictional resilience & lawful portability", source: "§16 / legal.sovereign_ledger · legal.iran_workaround (D6/D8)",
    spec: "Ledger logically sovereign from its settlement transport: China participates without crypto (fiat/local rails); Iran has a lawful, crypto-free path. External timestamp anchor + non-operator mirror for tamper-evidence." },
  { id: "CRS-V08", title: "QIS — Qualified Innovation Score (measurement, not appreciation)", source: "§15/§18 / fund.metrics · fund.reward (r217/r228)",
    spec: "A project's financial-innovation growth is measured by QIS = (R + GP + OI + ERD) ÷ 4, where ERD = QRD − ½·max(0, QRD − R/3) (R&D target = R/3). Growth = ΔQIS; ΔQIS sizes the Reward Pool — it mints no 웃 (웃 = M × T). Measurement ≠ payment; QIS creates no recognition, ownership, or appreciation." },
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

/** The six conditions in the signer's words, not ours (§14 unit.accel). */
const RUNG_LABEL: Record<Rung, string> = {
  none: "Nothing yet — the outcome has not been taken up",
  noted: "Noted — someone recorded it and it informed a decision (1 ♡)",
  adopted: "Adopted — it is now in use (3 ♡)",
  foundational: "Foundational — other work is built on it (7 ♡)",
};
const CONDITION_LABEL: Record<string, string> = {
  scheduleImproved: "the schedule improved", scopePreserved: "the scope was preserved", qualityHeld: "quality held or improved",
  riskNotWorse: "risk did not get worse", ssses: "SSSES qualification passed", humanAccepted: "a person accepted the outcome",
};
const firstName = (full: string) => (full.trim().split(/\s+/)[0] || "").toUpperCase();

export default function SoISessionPage() {
  const [phase, setPhase] = useState<Phase>("compose");
  const [entered, setEntered] = useState(false);
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
  // §14 unit.witness — THE PLATFORM CLOCK: an append-only pair of events, so the duration is witnessed, not typed.
  const [clockEvents, setClockEvents] = useState<ClockEvent[]>([]);
  const [nowTick, setNowTick] = useState(() => Date.now());
  // §14 unit.accel — the estimate LOCKED BEFORE THE WORK, signed by a party with no stake, carrying a Replay hash.
  const [lock, setLock] = useState<Baseline | null>(null);
  const [conds, setConds] = useState<AccelConditions>(noConditions);
  // D12 · the clockless ladder. ♡ is NOT hours: "a minute is counted as ♡ or 웃, never both" (unit.aitoken). This pod
  // settles 웃 for its measured minutes, so those same minutes carry no ♡ — the ♡ comes only from what the outcome
  // became afterwards, which no clock can measure and only the pod can say. Nothing awarded is the honest default.
  const [rung, setRung] = useState<Rung>("none");
  // D9 · the vintage stamp. Written once at settlement with the hours, the multiple and the 웃 they minted, and never
  // revised — deferral changes WHEN a 웃 settles, never what it recorded. No rate and no currency: the pod mints
  // currency-free, and a rate entering here is the published defect that made the ceiling cost 47.9× more in Lagos.
  const [vintage, setVintage] = useState<Vintage | null>(null);
  const [bandM, setBandM] = useState(1);                                  // unit.multiples — published bands only
  const [carriedIn, setCarriedIn] = useState("");                         // 웃 already recognised, for the carry maths
  const [regionIdSel, setRegionIdSel] = useState(DEFAULT_REGION_ID);      // the region whose floor this pod settles at

  // Real session over the poll's own live channel (session:<code>), scoped to a pod
  // of 3 (operator: same code+login method as the poll, one is lead). A joiner opens
  // /soi-session?pod=<code>; the lead generates the code when opening the pod. Start
  // and stop broadcast over the channel so all three phones move together; if Supabase
  // is unavailable the page still works as a local single-phone prototype.
  const [podCode, setPodCode] = useState("");
  const [isJoiner, setIsJoiner] = useState(false);
  const [liveCount, setLiveCount] = useState(1);
  const { t } = useLexicon();
  const hue = useThemeHue();

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
    // The LEAD's own code rides in the URL as ?lead=<code> (written when it is minted), so a reload
    // returns the lead to its pod instead of the landing with a fresh code that orphans the joiners
    // (Enki, wave 2). Joiners reclaim the seats they held through the roster protocol.
    const leadCode = (q.get("lead") || "").toUpperCase();
    if (leadCode && !code) { setIsJoiner(false); setPodCode(leadCode); setPhase("invite"); setEntered(true); }
    if (code) { setIsJoiner(true); setPodCode(code); setPhase("invite"); }
    // A scanned QR, a typed code, or ?enter=session goes straight to the pod; otherwise the
    // three-door landing (Session · Sign Doc · Create Doc) comes first (operator, 2026-09-07).
    if (code || q.get("enter") === "session") setEntered(true);
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
  // The lead's intent + outcome ride along with every roster so the joiners review the real
  // brief, not two empty boxes (three-phone live run, 2026-09-03). Additive: `brief` beside `pod`.
  const briefRef = useRef({ intent: "", outcome: "" });
  briefRef.current = { intent, outcome };
  // The recorded outcome travels the same way: the phone that recorded it sends it with its
  // phase move, the lead's rosters carry it on, and every receipt shows the same words — the
  // three-phone live run found the other two receipts empty (2026-09-03).
  const recordRef = useRef<{ method: RecordMethod; value: string }>({ method: "written", value: "" });
  recordRef.current = { method: recordMethod, value: recordValue };
  const apply = useCallback((step: { state: PodState; send: PodMsg[] }) => {
    podRef.current = step.state;
    setMembers(step.state.members); setMySeat(step.state.mySeat); setJoinFull(step.state.full);
    setLiveCount(podPresence(step.state));                     // from the roster, never the poll's presence
    if (DRIVEN.has(step.state.phase)) setPhase(step.state.phase);
    else if (step.state.phase === "invite" && isJoinerRef.current) setPhase("invite");   // a lead's Reset
    for (const m of step.send) {
      const brief = m.kind === "roster" && !isJoinerRef.current ? { brief: briefRef.current } : {};
      const record = recordRef.current.value.trim() ? { record: recordRef.current } : {};
      broadcastRef.current("session_update", { pod: m, ...brief, ...record }).catch(() => {});
    }
  }, []);

  const onStatus = useCallback((p: SessionBroadcastPayload) => {
    const msg = (p as { pod?: unknown })?.pod as PodMsg | undefined;
    if (!msg) return;                                          // a poll frame — never ours
    const brief = (p as { brief?: { intent?: string; outcome?: string } }).brief;
    if (brief && isJoinerRef.current) {                        // the lead's brief, for review
      if (typeof brief.intent === "string") setIntent(brief.intent);
      if (typeof brief.outcome === "string") setOutcome(brief.outcome);
    }
    const record = (p as { record?: { method?: RecordMethod; value?: string } }).record;
    if (record && typeof record.value === "string" && record.value.trim() && record.value !== recordRef.current.value) {
      if (record.method) setRecordMethod(record.method);
      setRecordValue(record.value);
    }
    apply(reducePod(podRef.current, msg, ctx()));
  }, [apply, ctx]);
  // The channel's presence count is the POLL's participant number; the pod counts its roster.
  const { broadcast, connected } = useSessionBroadcast(podCode || null, onStatus, undefined);
  broadcastRef.current = broadcast;
  connectedRef.current = connected;

  // The lead's own identity is its pin; a joiner pins the lead from the first roster.
  // A page mounts as a lead (the URL is read in an effect), so a joiner must UNPIN itself when it
  // learns it joined by code — otherwise it holds its own id as "lead" and rejects the real lead's
  // roster as an impostor (found by the three-phone live run, 2026-09-03).
  useEffect(() => {
    podRef.current = { ...podRef.current, lead: isJoiner ? null : (clientId.current || podRef.current.lead) };
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
  useEffect(() => {                                    // one second, and only while running
    if (phase !== "active") return;
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);
  const span = measure(clockEvents, nowTick);
  const measuredHours = spanHours(span);
  // rcore.ledger — each move APPENDS a revision of the pod to this device. Nothing is overwritten, so an earlier revision
  // still reads back exactly as it was, and a reload reopens what happened rather than a blank pod.
  const [saveFailed, setSaveFailed] = useState(false);
  const [resumed, setResumed] = useState("");
  const podRev = useRef(0);
  const restored = useRef(false);
  // Coming back to the same pod: replay the newest revision this device holds for the code in the link. The peers may all
  // have closed their phones — the record is no longer only in their memory.
  useEffect(() => {
    if (restored.current || !podCode) return;
    const e = replayPod<{ phase: Phase; intent: string; outcome: string; members: Member[]; clockEvents: ClockEvent[]; baselineHrs: string; signerIdx: number; recordMethod: RecordMethod; recordValue: string; rung?: Rung; vintage?: Vintage | null; regionIdSel?: string }>(podCode);
    if (!e) return;
    restored.current = true; podRev.current = e.rev;
    setIntent(e.state.intent); setOutcome(e.state.outcome); setMembers(e.state.members);
    setClockEvents(e.state.clockEvents ?? []); setBaselineHrs(e.state.baselineHrs ?? ""); setSignerIdx(e.state.signerIdx ?? 0);
    setRecordMethod(e.state.recordMethod ?? "written"); setRecordValue(e.state.recordValue ?? "");
    setRung(e.state.rung ?? "none");
    // D9: a vintage is READ back, never re-derived. Re-deriving it on reopen would let a later band or a later hour
    // silently rewrite what a past settlement recorded, which is the one thing a stamp exists to prevent.
    setVintage(e.state.vintage ?? null);
    setRegionIdSel(e.state.regionIdSel ?? DEFAULT_REGION_ID);
    podRef.current = { ...podRef.current, phase: e.state.phase }; setPhase(e.state.phase);
    setResumed(`Reopened at revision ${e.rev} — everything recorded is as you left it.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podCode]);
  useEffect(() => {
    if (!podCode) return;
    const ok = appendPod(podCode, ++podRev.current, { phase, intent, outcome, members, clockEvents, baselineHrs, signerIdx, recordMethod, recordValue, rung, vintage, regionIdSel }, Date.now());
    if (!ok) setSaveFailed(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podCode, phase, members, clockEvents, recordValue, rung, vintage, regionIdSel]);
  // OPERATOR RULING 2026-09-10: "Hours is always tracked." The clock is not a mode and not a reward for a clean sync —
  // it starts the moment the pod begins working and it starts ONCE. A pod that never reaches a synced start, or that is
  // reset and tried again, still has an honest record of the time it spent rather than nothing at all. Whether that time
  // is WITNESSED is a separate question, answered by the sync verdict and by supported(), which caps every claim to the
  // measured span. Tracking and crediting are not the same act, and conflating them is what lost the time before.
  useEffect(() => {
    if (phase === "compose" || phase === "invite") return;
    setClockEvents((e) => (e.some((x) => x.kind === "start") ? e : [...e, { kind: "start", at: Date.now(), by: "pod" }]));
  }, [phase]);

  useEffect(() => {
    if (phase !== "sync") return;
    const v = syncVerdict(members, SYNC_START_SECONDS);
    if (v.status === "waiting") return;
    if (v.status === "synced") {
      // §14: "the clock is a platform event" — appended once for the whole pod. The effect above has already started it
      // on entry to sync, so this is a no-op guard kept for a pod that reaches "synced" by any other route.
      setClockEvents((e) => (e.some((x) => x.kind === "start") ? e : [...e, { kind: "start", at: Date.now(), by: "pod" }]));
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

  // Witnessed 웃 — the one mint, 웃 = M × T. Never re-derived here: a second copy is how a correction reaches one place and not the other.
  // OPERATOR RULING 2026-09-10: "Multiples of min wage are HI token 웃 … that way someone can earn at higher rates."
  // The band is the route to the ceiling; 1× remains the default so a pod opened before this change settles unchanged.
  const M = bandM;
  // §14 unit.witness — "웃 is minted only for time CLOCKED BY THE PLATFORM", so a typed claim is bounded by the session the
  // platform witnessed. Where no clock ran the claim stands and the panel SAYS SO: silently trusting an unwitnessed claim is
  // the exact failure the rule exists to prevent.
  const claimOf = (i: number) => supported(parseFloat(members[i]?.hours ?? "") || 0, span);
  const witnessedHours = members.reduce((s, m, i) => s + (isWitnessed(i) ? claimOf(i).hours : 0), 0);
  const totalYugYok = mint(witnessedHours, M);                  // 웃 that would settle — the one mint, never re-derived
  const allSelfAudited = members.every((m) => (parseFloat(m.hours) || 0) > 0 && m.did.trim());
  const allWitnessed = members.every((_, i) => isWitnessed(i));

  // ── One look: the rail's counts and the one line that says what to do next (R-CORE gate) ──
  const counts = {
    joined: members.filter((m) => m.name.trim()).length,
    agreed: members.filter((m) => m.name.trim() && m.agreed).length,
    started: members.filter((m) => m.startedAt != null).length,
    witnessed: members.filter((_, i) => isWitnessed(i)).length,
    size: POD_SIZE,
  };
  const firstOf = (s: string) => s.trim().split(/\s+/)[0] || "";
  const names = (ms: Member[]) => ms.map((m) => firstOf(m.name) || m.role).join(", ");
  const explain = ((): string => {
    switch (phase) {
      case "compose": return canOpen ? t("soi.pod.x.compose_ready") : t("soi.pod.x.compose");
      case "invite": {
        if (joinFull) return t("soi.pod.seat.full");
        const missing = members.filter((m) => !m.name.trim());
        if (missing.length) return t("soi.pod.x.invite_join").replace("{n}", String(missing.length));
        const notAgreed = members.filter((m) => !m.agreed);
        if (notAgreed.length) return t("soi.pod.x.invite_agree").replace("{who}", names(notAgreed));
        return t("soi.pod.x.invite_ready");
      }
      case "sync": { const left = members.filter((m) => m.startedAt == null); return left.length ? t("soi.pod.x.sync").replace("{who}", names(left)) : t("soi.pod.x.sync_ready"); }
      case "active": return t("soi.pod.x.active");
      case "record": return t("soi.pod.x.record");
      case "audit": {
        if (!allSelfAudited) return t("soi.pod.x.audit_self");
        const unwitnessed = members.filter((_, i) => !isWitnessed(i));
        if (unwitnessed.length) return t("soi.pod.x.audit_witness").replace("{who}", names(unwitnessed));
        return t("soi.pod.x.audit_ready");
      }
      case "closed": return t("soi.pod.x.closed").replace("{h}", witnessedHours.toFixed(2)).replace("{y}", totalYugYok.toFixed(3));
      default: return "";
    }
  })();

  // The lead's brief prefilled from the login (name + e-mail) — once, only while the seat is blank.
  const { user: authUser, isAuthenticated } = useAuth0();
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !isAuthenticated || !authUser || isJoiner) return;
    if (members[0].name.trim() || members[0].contact.trim()) return;
    prefilled.current = true;
    const nm = authUser.name && !authUser.name.includes("@") ? authUser.name : "";
    setMember(0, { name: nm, contact: authUser.email ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authUser, isJoiner]);

  // TOK-18 ◬ accelerator: delta of the frozen baseline estimate vs the witnessed actual.
  // Delta-only input — never a profit metric (D4). Positive delta = time saved = ◬ recognised.
  const baseline = parseFloat(baselineHrs) || 0;
  // When an estimate was LOCKED before the work (§14 unit.accel) the receipt reads from the lock and honours the six
  // conditions; without one it falls back to the older typed figure so a pod opened before this change still settles.
  // OPERATOR RULING: earning is never capped, payout always is, and the excess carries to the next year and the next.
  const stand = standing(parseFloat(carriedIn) || 0, mint(witnessedHours, bandM));
  // The region decides only what an already-minted 웃 SETTLES as. It never touches the mint (pod-rates.ts).
  const region = findRegion(regionIdSel);
  // ELECTION OF LOCALITY — each contributor's own floor. unit.denom: "one hour at 1x THE CONTRIBUTOR'S local minimum
  // wage". A member who has not elected inherits the pod's default, and is shown as inheriting, never as having chosen.
  const podJuris = findJurisdiction(regionIdSel);
  const localityOf = (i: number): Jurisdiction | undefined =>
    (members[i]?.region ? findJurisdiction(members[i].region!) : undefined) ?? podJuris;
  const electedOwn = (i: number): boolean => !!members[i]?.region;
  const regionTier = region ? tierOf(region) : "pending";
  const settlesTo = settleInRegion(stand.payableThisYear, region);
  const ceilingSettlesTo = settleInRegion(YUG_CEILING, region);
  const accelRead = accelerate(lock, witnessedHours, conds);
  const accelDelta = lock ? Math.max(0, accelRead.delta) : (baseline > 0 ? Math.max(0, baseline - witnessedHours) : 0);
  const yaTriangle = lock ? accelRead.earned : accelDelta * M;   // ◬ recognised
  // unit.tranche — the accrual splits BEFORE anything is drawn. The floor is wages for witnessed hours and is owed
  // whatever the outcome; everything the band adds above it is held until the work qualifies. A person must be able to
  // see which part of their number can never be taken back, so the two are shown separately and never summed on screen.
  const tranches = split(witnessedHours, bandM, accelRead);
  // The pod settles 웃 for its measured minutes, so settles웃 is true and heartsFor returns the ladder alone — never the
  // minutes again under a different glyph. If the pod ever stopped settling 웃, the same call would add them back.
  const hearts = heartsFor({ settles웃: totalYugYok > 0, measured: span, rung });
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
      `${totalYugYok.toFixed(3)} 웃 settle (웃 = M × T, M=${M}), each person bound by 9,999/yr with rollforward; ` +
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
    // The Worker path, using the provider chosen in Settings (operator 2026-09-10). It carries the MEASURED clock and any
    // claim that was reduced to it, so the model cannot describe a longer session than the platform witnessed, and it is
    // told to report an overrun plainly rather than dress it up. Whichever answers, the panel labels the text AI-written.
    void aiPodSummary({
      intent, outcome, code: podCode, witnessedFor: hhmmss(span.ms),
      members: members.map((m, i) => ({ name: m.name.trim() || m.role, hours: claimOf(i).hours, claimed: parseFloat(m.hours) || 0, capped: claimOf(i).capped, did: m.did })),
      yugYok: totalYugYok, hearts, baselineHours: lock ? lock.hours : null,
      deltaHours: lock ? accelRead.delta : null, accelEarned: yaTriangle, record: recordValue,
    }, "English", readProvider())
      .then((r) => { if (live && r && r.paragraphs.length === 3) setAiSynthesis({ results: r.paragraphs[0], changed: r.paragraphs[1], next: r.paragraphs[2] }); })
      .catch(() => { /* the deterministic synthesis stands and the panel says which one this is */ });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const shownSynthesis = aiSynthesis || synthesis;
  const synthesisSource = aiSynthesis ? "ai" : "local";

  if (!entered) return <SoiLanding onEnter={() => setEntered(true)} />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header ────────────────────────────────────────────────────────── */}
      <header className="mb-8 text-center">
        <div className="mb-2 flex justify-end"><SoiGlobe /></div>
        <TrinityGlyphs size="text-3xl" className="mb-3" />
        <h1 className="text-2xl font-semibold">{t("soi.landing.title")}</h1>
      </header>

      {/* Task • Outcome POD flow ────────────────────────────────────────── */}
      <section className="mt-8 rounded-xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Task • Outcome</h2>
          <span className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
            {phase}
          </span>
        </div>
        <PodPhaseRail phase={phase} counts={counts} />
        <p className="mb-4 text-sm text-cyan-400" data-testid="pod-explain" aria-live="polite">{explain}</p>

        {/* Trinity logo — auto-drawn from the three leads' first names */}
        <div className="mb-5 flex flex-col items-center gap-1">
          <SoITrinity
            labels={trinityLabels}
            color={hue.bright}
            colors={[hue.bright, hue.bright, hue.bright]}   /* all cyan (operator): the black edges separate the rings */
            textColor={hue.ink}
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

            {resumed && <p className="mb-3 rounded-md border border-primary/40 bg-primary/5 p-2 text-xs text-primary" data-testid="pod-resumed">{resumed}</p>}
            {saveFailed && <p className="mb-3 rounded-md border border-amber-500/50 bg-amber-500/5 p-2 text-xs text-amber-500" data-testid="pod-save-failed">This device would not keep a copy of the pod, so closing this page would lose it. Finish here, or free some space and reopen.</p>}
            {recentPods().length > 0 && (
              <div className="mb-4 rounded-lg border border-border p-3 text-sm" data-testid="pod-recent">
                <div className="font-medium">Come back to a pod</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {recentPods().map((r) => (
                    <button key={r.code} type="button" onClick={() => { setPodCode(r.code); restored.current = false; }} data-testid={`resume-${r.code}`}
                      className="min-h-[44px] rounded-md border border-border px-3 text-xs">{r.code} <span className="text-muted-foreground">· r{r.rev}</span></button>
                  ))}
                </div>
              </div>
            )}
            {/* REGION AND MULTIPLE, DECLARED BEFORE THE WORK. D9, the vintage rule: a 웃 is stamped with the local
                minimum-wage rate ON ITS EARNING DATE. A rate discovered at settlement is a rate looked up afterwards,
                which is the thing the stamp exists to prevent — so both are chosen here, where the pod is opened. */}
            <div className="mb-4 rounded-lg border border-border p-3 text-sm" data-testid="pod-anchor">
              <div className="font-medium">Where these hours are anchored <span className="text-xs font-normal text-muted-foreground">— 웃 = M × T (Multiple × Time)</span></div>
              <p className="mt-1 text-xs text-muted-foreground">
                The region sets no part of the mint. The same hour mints the same 웃 in all 114 regions below; the region
                decides only what that 웃 settles as, in its own currency, at the rate stamped when the work is done.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select value={bandM} onChange={(e) => setBandM(Number(e.target.value))} data-testid="anchor-multiple"
                  className="min-h-[44px] rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                  {BANDS.map((b) => <option key={b.m} value={b.m}>{b.label} — {b.atMost ? "≤ " : ""}{b.hours.toLocaleString()} h to 9,999 웃</option>)}
                </select>
                <LocalityElect value={regionIdSel} onChange={setRegionIdSel} testid="anchor-region" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground" data-testid="anchor-preview">
                {region && region.rate !== null ? (
                  <>One witnessed hour at {bandM}× mints <span className="font-medium text-foreground">{mint(1, bandM).toFixed(3)} 웃</span>, settling
                    at <span className="font-medium text-foreground">{formatLocal(settleInRegion(mint(1, bandM), region)!, region.currency)}</span> in {region.name}.
                    A full ceiling year is {formatLocal(settleInRegion(YUG_CEILING, region)!, region.currency)}.</>
                ) : (
                  <>One witnessed hour at {bandM}× mints <span className="font-medium text-foreground">{mint(1, bandM).toFixed(3)} 웃</span>. {region ? region.name : "This region"} publishes
                    no rate, so no figure is shown and none is guessed — {TIER_REASON[regionTier]} The 웃 are earned and recorded either way.</>
                )}
              </p>
              <p className="mt-2 text-[11px] text-muted-foreground" data-testid="pod-grammar">
                Figures carry the ledger grammar beside the plain number: <span className="font-mono">N.mmmm..ssss</span> —
                whole units, then two Base-3600 groups running 0000–3599, 3600 rolling to the next whole. Half a unit is{" "}
                <span className="font-mono">{fmtABC(0.5)}</span>. The annual ceiling spread over a year is{" "}
                <span className="font-mono">{fmtABC(YUG_CEILING / 525600)}</span> 웃 a minute — 9,999 ÷ 525,600.
              </p>
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground">All {JURISDICTIONS.length} places · {BY_TIER.published.length} with a published rate · {REGION_RATES.length} rows across 33 languages</summary>
                <div className="mt-2 max-h-64 overflow-auto rounded border border-border" data-testid="rate-table">
                  <table className="w-full text-left text-[11px]">
                    <thead className="sticky top-0 bg-muted"><tr>
                      <th className="px-2 py-1 font-medium">Country / Jurisdiction</th>
                      <th className="px-2 py-1 font-medium">Lang</th>
                      <th className="px-2 py-1 text-right font-medium">Rate / h</th>
                      <th className="px-2 py-1 font-medium">Cur</th>
                      <th className="px-2 py-1 font-medium">Notes</th>
                    </tr></thead>
                    <tbody>
                      {JURISDICTIONS.map((j) => (
                        <tr key={j.id} className={j.id === regionIdSel ? "bg-primary/10" : undefined}>
                          <td className="px-2 py-1">{j.name}</td>
                          <td className="px-2 py-1 text-muted-foreground">{j.langs.join(" · ")}</td>
                          <td className="px-2 py-1 text-right tabular-nums">{j.rate !== null ? j.rate.toFixed(3) : "—"}</td>
                          <td className="px-2 py-1 text-muted-foreground">{j.currency}</td>
                          <td className="px-2 py-1 text-muted-foreground">{j.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

            {/* §14 unit.accel · the estimate is frozen HERE, before the clock, or there is no accelerator at all. */}
            <div className="mb-4 rounded-lg border border-border p-3 text-sm" data-testid="pod-baseline">
              <div className="font-medium">Estimate, before the work <span className="text-xs font-normal text-muted-foreground">— optional; ◬ is read against it</span></div>
              <p className="mt-1 text-xs text-muted-foreground">Locked when the pod opens, signed by someone who does not gain from the result, and hashed. Leave it blank and this pod simply records time.</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input type="number" min="0" step="0.25" value={baselineHrs} onChange={(e) => setBaselineHrs(e.target.value)} placeholder="est. hours" data-testid="baseline-hours"
                  className="w-28 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
                <select value={signerIdx} onChange={(e) => setSignerIdx(Number(e.target.value))} data-testid="baseline-signer" className="min-h-[44px] rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                  {members.map((m, i) => <option key={i} value={i}>signed by {m.name.trim() || m.role}</option>)}
                </select>
              </div>
            </div>

            <button
              disabled={!canOpen}
              onClick={() => {
                const c = podCode || randomCode();
                if (!podCode) setPodCode(c);
                // §14 unit.accel — "set and signed BEFORE work begins by a party with no stake in the payout", locked with a
                // Replay hash. Typed afterwards, as this pod used to, it cannot bound anything.
                const est = parseFloat(baselineHrs) || 0;
                if (est > 0) void lockBaseline({ id: `${c}-1`, version: 1, scope: outcome.trim() || intent.trim(), hours: est,
                  signedBy: members[signerIdx]?.name?.trim() || members[signerIdx]?.role || "—", signedAt: new Date().toISOString() }).then(setLock).catch(() => setLock(null));
                try { const u = new URL(window.location.href); u.searchParams.set("lead", c); u.searchParams.delete("enter"); window.history.replaceState(null, "", u.toString()); } catch { /* no history */ }
                podRef.current = { ...podRef.current, phase: "invite" }; setPhase("invite");
              }}
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
                        {connected && (!isJoiner || mySeat > 0) && i === mySeat && <span className="ml-1 rounded bg-cyan-400/15 px-1 font-normal normal-case tracking-normal">{t("soi.pod.seat.you")}</span>}
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
                    {/* ELECTION OF LOCALITY — own seat only, so nobody sets another person's wage floor. Elected
                        BEFORE the work, because D9 stamps the rate on the earning date. */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span>Settles at</span>
                      <LocalityElect
                        value={m.region} disabled={!canEdit(i)} testid={`member-locality-${i}`}
                        inherited={podJuris} onChange={(id) => setMember(i, { region: id })}
                      />
                      <span data-testid={`member-floor-${i}`}>
                        {localityOf(i)?.rate != null
                          ? <>{localityOf(i)!.rate} {localityOf(i)!.currency} an hour{electedOwn(i) ? "" : " · inherited from the pod"}</>
                          : <>no rate published{electedOwn(i) ? "" : " · inherited from the pod"}</>}
                      </span>
                    </div>
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
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="font-medium text-cyan-500">Session running — all three started together.</div>
                {/* the platform's own reading — this, not a typed number, is what 웃 may be minted for (§14 unit.witness) */}
                <div className="font-mono text-2xl tabular-nums text-cyan-500" data-testid="pod-clock" aria-label="time this pod has been witnessed">{hhmmss(span.ms)}</div>
              </div>
              {/* The brief stays on screen while the work happens — a late third must never work blind (Sofia, wave 3). */}
              <p className="mt-1 text-muted-foreground"><span className="font-medium text-foreground">Intent:</span> {intent || "—"}</p>
              <p className="text-muted-foreground"><span className="font-medium text-foreground">Measurable outcome:</span> {outcome || "—"}</p>
              <p className="text-muted-foreground">When the work is done, any member stops the session for everyone and records the outcome.</p>
            </div>
            <button onClick={() => { setClockEvents((e) => (e.some((x) => x.kind === "stop") ? e : [...e, { kind: "stop", at: Date.now(), by: "pod" }])); setPhase("record"); drive("record"); }} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" data-testid="pod-stop">
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
            {/* §14 unit.witness — what the PLATFORM measured, stated before any claim is read. */}
            <div className="mb-3 rounded-lg border border-cyan-500/40 bg-cyan-500/5 p-3 text-sm" data-testid="pod-measured">
              {span.startedAt !== null
                ? <><span className="font-medium text-cyan-500">The platform witnessed this pod for {hhmmss(span.ms)}</span><span className="text-muted-foreground"> — {measuredHours.toFixed(2)} h. A claim above that is counted at the witnessed figure.</span></>
                : <span className="text-amber-500">No session was clocked, so the hours below are claims this device cannot vouch for. They settle only on the pod&apos;s witness.</span>}
            </div>
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
                    {claimOf(i).capped && (
                      <span className="text-[11px] text-amber-500" data-testid={`claim-capped-${i}`}>counted as {claimOf(i).hours.toFixed(2)} h — the pod was witnessed for {hhmmss(span.ms)}</span>
                    )}
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

            {/* unit.multiples — the band is published, and it is the route to the ceiling rather than the country a person
                lives in. unit.guard: bands are published in advance and change prospectively only. */}
            <div className="mb-4 rounded-lg border border-border p-3 text-sm" data-testid="pod-band">
              <div className="font-medium">Multiple <span className="text-xs font-normal text-muted-foreground">— 웃 = M × T (Multiple × Time), currency-free at mint</span></div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select value={bandM} onChange={(e) => setBandM(Number(e.target.value))} data-testid="band-select"
                  className="min-h-[44px] rounded-md border border-border bg-background px-2 py-1.5 text-sm">
                  {/* The PUBLISHED figures, read from unit.multiples — never Math.round(9,999 ÷ M), which prints 1,667 where the
                      paper prints 1,666 (docs/asks/2026-09-10_published_band_table_verbatim.md). */}
                  {BANDS.map((b) => <option key={b.m} value={b.m}>{b.label} — {b.atMost ? "≤ " : ""}{b.hours.toLocaleString()} h to 9,999 웃 · {b.atMost ? "≤ " : ""}{b.years} full-time years</option>)}
                </select>
                <input type="number" min="0" step="1" value={carriedIn} onChange={(e) => setCarriedIn(e.target.value)} placeholder="웃 already earned" data-testid="carried-in"
                  className="w-40 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
              </div>

              {/* REGION — the local floor a 웃 settles at. 114 rows, the operator's own table, grouped by his four
                  settlement tiers so a region that cannot settle yet says why instead of showing a number. */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label htmlFor="pod-region" className="text-xs text-muted-foreground">Region</label>
                <LocalityElect value={regionIdSel} onChange={setRegionIdSel} testid="region-select" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground" data-testid="pod-settle">
                {region && settlesTo !== null ? (
                  <>Settles at <span className="font-medium text-foreground">{formatLocal(settlesTo, region.currency)}</span>{" "}
                    — 웃 × {region.rate} {region.currency} an hour in {region.name}. A full ceiling year is{" "}
                    <span className="font-medium text-foreground">{formatLocal(ceilingSettlesTo!, region.currency)}</span>, and
                    that figure IS the ceiling settled at the local rate, not a fraction of it.{" "}
                    <span className="opacity-80">{region.note}</span></>
                ) : (
                  <>No figure is shown for {region ? region.name : "this region"}, and none is guessed.{" "}
                    {TIER_REASON[regionTier]} Nobody settles at zero because their government has not legislated —
                    the 웃 are earned and recorded either way.</>
                )}
                <br />The rate is stamped at settlement and never looked up again, and it takes no part in the mint:
                the same hour mints the same 웃 in every region on this list.
              </p>
              {/* EACH CONTRIBUTOR AT THEIR OWN FLOOR (unit.regional). The 웃 are identical for identical work; only the
                  currency differs. Never summed across currencies — no exchange rate is published, so none is used. */}
              <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground" data-testid="pod-settle-each">
                {members.map((m, i) => {
                  const j = localityOf(i);
                  const own = mint(claimOf(i).hours, bandM);
                  const cash = settleInRegion(own, j);
                  return (
                    <li key={i} data-testid={`settle-member-${i}`}>
                      <span className="font-medium text-foreground">{m.name.trim() || m.role}</span>
                      {" — "}{claimOf(i).hours} h at {bandM}× = 웃 {own.toFixed(3)}
                      <span className="font-mono"> · {fmtABC(own)}</span>
                      {j ? <> · {j.name}{electedOwn(i) ? "" : " (inherited)"}: {cash !== null ? formatLocal(cash, j.currency) : "no rate published"}</> : null}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground" data-testid="pod-reach">
                At {bandM}× another <span className="font-medium text-foreground">{hoursToCeiling(bandM, stand.cumulative).toFixed(0)} h</span> reaches 9,999 웃
                {bandFor(bandM) ? <> — from nothing the published figure is {bandFor(bandM)!.atMost ? "≤ " : ""}{bandFor(bandM)!.hours.toLocaleString()} h. {bandFor(bandM)!.purpose}</> : null}
                <br />One 웃 is one hour at 1× your local minimum wage, so the multiple is simply the 웃-per-hour rate.
                M is unbounded; what is bound is the 9,999 웃 <span className="font-medium text-foreground">payment</span> each
                year, with the excess rolling forward.
              </p>
            </div>

            {/* §14 unit.accel — read AGAINST THE LOCKED ESTIMATE, and only when all six conditions hold. "Faster is not
                automatically better; cheaper is not automatically better; and more AI is certainly not automatically better."
                A negative delta is shown, never hidden: the hypothesis is allowed to fail honestly. */}
            <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3" data-testid="pod-accel">
              <div className="mb-2 text-sm font-medium text-cyan-500">Accelerator <span className="text-xs font-normal text-muted-foreground">— ◬ read against the estimate locked before the work</span></div>
              {!lock ? (
                <p className="text-xs text-muted-foreground" data-testid="accel-nolock">No estimate was locked before this pod opened, so there is no ◬ to read. The hours still settle.</p>
              ) : (() => {
                const a = accelerate(lock, witnessedHours, conds);
                return (
                  <>
                    <p className="text-xs text-muted-foreground">Locked at <span className="font-medium text-foreground">{lock.hours} h</span> by <span className="font-medium text-foreground">{lock.signedBy}</span>, hash <span className="font-mono">{lock.hash.slice(0, 8)}</span>. Witnessed: <span className="font-medium text-foreground">{witnessedHours.toFixed(2)} h</span>.</p>
                    <p className={`mt-1 text-sm font-medium ${a.delta > 0 ? "text-cyan-500" : "text-amber-500"}`} data-testid="accel-delta">{a.delta > 0 ? `${a.delta.toFixed(2)} h earlier than the estimate` : a.delta < 0 ? `${Math.abs(a.delta).toFixed(2)} h longer than the estimate — recorded, not hidden` : "exactly the estimate"}</p>
                    <div className="mt-2 grid gap-1">
                      {CONDITION_IDS.map((k) => (
                        <label key={k} className="flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={conds[k]} onChange={(e) => setConds((c) => ({ ...c, [k]: e.target.checked }))} data-testid={`cond-${k}`} />
                          <span className="text-muted-foreground">{CONDITION_LABEL[k]}</span>
                        </label>
                      ))}
                    </div>
                    <p className="mt-2 text-sm" data-testid="accel-earned">{a.earned > 0 ? <span className="font-medium text-cyan-500">◬ {a.earned.toFixed(2)} recognised — held in escrow against the locked estimate.</span> : <span className="text-muted-foreground">◬ 0 — {a.reason === "conditions_unmet" ? "every condition must hold before a bonus is payable." : a.reason === "no_time_saved" ? "no time was saved against the estimate." : "no locked estimate."}</span>}</p>
                  </>
                );
              })()}
            </div>

            {/* D12 · the clockless ladder — the ONLY source of ♡ in a pod that settles 웃 (unit.aitoken). */}
            <div className="mb-3 rounded-md border border-border p-3 text-sm" data-testid="pod-rung">
              <div className="mb-1 font-medium text-foreground">What did this outcome become?</div>
              <p className="mb-2 text-xs text-muted-foreground">
                ♡ is not time. The minutes here already settle as 웃, and a minute is counted as one or the other, never both.
                ♡ answers a question no clock can: whether the outcome was taken up. It may honestly be none.
              </p>
              <select
                value={rung}
                onChange={(e) => setRung(e.target.value as Rung)}
                data-testid="rung-select"
                className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
              >
                {RUNGS.map((r) => <option key={r.id} value={r.id}>{RUNG_LABEL[r.id]}</option>)}
              </select>
              <p className="mt-2 text-xs text-muted-foreground" data-testid="pod-hearts">
                ♡ <span className="font-medium text-foreground">{hearts}</span> <span className="font-mono">{fmtABC(hearts)}</span> from the outcome{totalYugYok > 0 ? <> · none from the {witnessedHours} h, which settle as 웃</> : null}.
              </p>
            </div>

            <div className="mb-3 rounded-md border border-border p-3 text-sm">
              <span className="font-medium text-foreground">{witnessedHours} witnessed hours <span className="font-mono text-xs text-muted-foreground">· 웃 {fmtABC(witnessedHours)}</span></span>{" "}<span className="text-xs text-muted-foreground" data-testid="pod-mot">· MoT clocked <span className="font-mono">{fmtABC(measuredHours)}</span> ({hhmmss(span.ms)})</span>
              <span className="text-muted-foreground"> → {totalYugYok.toFixed(3)} &#50883; would settle (웃 = M × T, M={M}), each capped at 9,999/yr with rollforward. Only witnessed hours count.</span>
            </div>

            <button
              disabled={!allWitnessed || !allSelfAudited}
              onClick={() => {
                // D9 — written ONCE. `v ?? …` is the whole rule: a second settlement of the same pod cannot overwrite
                // what the first one recorded, so re-opening and re-settling changes nothing about the past.
                setVintage((v) => v ?? stamp(witnessedHours, bandM, new Date().toISOString(), podJuris?.rate ?? null, podJuris?.currency ?? null));
                setPhase("closed"); drive("closed");
              }}
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
              {/* The three lines a person reads first — what was recorded, who witnessed whom, what settles. */}
              <ol className="mb-3 grid gap-1 rounded-md border border-border bg-background p-2 text-xs" data-testid="receipt-3">
                <li><span className="font-medium text-foreground">1 · {t("soi.pod.receipt.recorded")}</span> {recordMethod} — {recordValue ? recordValue.slice(0, 80) + (recordValue.length > 80 ? "…" : "") : "—"}</li>
                <li><span className="font-medium text-foreground">2 · {t("soi.pod.receipt.witnessed")}</span> {members.map((m, i) => `${firstOf(m.name) || m.role}${isWitnessed(i) ? " ✓" : " ✗"}`).join(" · ")}</li>
                <li><span className="font-medium text-foreground">3 · {t("soi.pod.receipt.settles")}</span> 웃 {stand.earned.toFixed(3)} <span className="font-mono text-xs text-muted-foreground">{fmtABC(stand.earned)}</span> earned at {bandM}× · <span className="font-medium text-foreground">{stand.payableThisYear.toFixed(3)} payable this year</span> <span className="font-mono text-xs text-muted-foreground">{fmtABC(stand.payableThisYear)}</span>{stand.carried > 0 ? <> · {stand.carried.toFixed(3)} carried to next year <span className="font-mono text-xs text-muted-foreground">{fmtABC(stand.carried)}</span></> : null}</li>
                <li data-testid="receipt-tranches"><span className="font-medium text-foreground">4 · Drawn &amp; held</span> 웃 <span className="font-medium text-foreground" data-testid="tranche-floor">{tranches.floor.toFixed(3)}</span> <span className="font-mono text-xs text-muted-foreground">{fmtABC(tranches.floor)}</span> draws now and is never clawed back — wages for witnessed hours, owed whatever the outcome{tranches.escrow > 0 ? <> · 웃 <span className="font-medium text-foreground" data-testid="tranche-escrow">{tranches.escrow.toFixed(3)}</span> <span className="font-mono text-xs text-muted-foreground">{fmtABC(tranches.escrow)}</span> held at {bandM}× until the work qualifies</> : null}{tranches.accelEscrow > 0 ? <> · ◬ <span className="font-medium text-foreground" data-testid="tranche-accel">{tranches.accelEscrow.toFixed(3)}</span> <span className="font-mono text-xs text-muted-foreground">{fmtABC(tranches.accelEscrow)}</span> held separately — recognition, not wages</> : null}</li>
                <li data-testid="receipt-hearts"><span className="font-medium text-foreground">5 · ♡</span> <span className="font-medium text-foreground" data-testid="hearts-total">{hearts}</span> — {rung === "none" ? "the outcome has not been taken up yet, so none is awarded" : RUNG_LABEL[rung].split(" — ")[0].toLowerCase() + ", awarded for what the outcome became"}{totalYugYok > 0 ? <>, never for the hours — those settle as 웃</> : null}</li>
                {vintage ? (
                  <li data-testid="receipt-vintage"><span className="font-medium text-foreground">6 · Stamped</span> {new Date(vintage.earnedAt).toLocaleDateString()} — <span data-testid="vintage-line">{vintage.hours} h at {vintage.m}× = 웃 {vintage.yug.toFixed(3)} <span className="font-mono">{fmtABC(vintage.yug)}</span></span>{vintage.rate !== null && vintage.currency ? <> · stamped at {vintage.rate} {vintage.currency} an hour</> : null}. Written once and never revised; waiting to be paid changes when this settles, never what it says.</li>
                ) : null}
              </ol>
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
              Earning is never capped; payout is. A year fills to 9,999 웃 and no further, and everything above it rolls to the next
              year, and the next, so the record becomes lifelong stability rather than a single windfall. ◬ comes only from the estimate
              locked before the work. The same hour mints the same 웃 in Lagos and in Austin — only what it settles as is local.
            </p>
            <button onClick={reset} className="rounded-md border border-border px-4 py-2 text-sm">New pod</button>
          </div>
        )}
      </section>

      {/* Phone strip — intent · phase · Stop, always in reach (CriticalStrip pattern); desktop has the rail. */}
      {phase !== "compose" && (
        <div className="fixed inset-x-0 bottom-14 z-[60] mx-auto flex max-w-3xl items-center gap-2 border-t border-border bg-card/95 px-3 py-2 text-xs backdrop-blur sm:hidden" data-testid="pod-strip">
          <span className="min-w-0 flex-1 truncate">{intent || t("soi.pod.strip.no_intent")}</span>
          <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase" style={{ borderColor: hue.bright, color: hue.bright }}>{t(POD_PHASES[Math.max(phaseIndex(phase), 0)].labelKey)}</span>
          {phase === "active" && <button type="button" onClick={() => { setPhase("record"); drive("record"); }} className="min-h-[36px] rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground">{t("soi.pod.strip.stop")}</button>}
        </div>
      )}

      {/* Seed membership — the entry credential, collapsed below the pod (moved 2026-09-07) */}
      <div className="mt-6"><SeedMembership /></div>

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
        Prototype · {connected ? "live — one roster across the pod" : "local state"} · <TrinityGlyphs inline size="text-[11px]" /> mint nothing new here — the pod is a gate on the
        currencies that already exist. — MoT
      </p>
    </div>
  );
}
