"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  Users,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Check,
  Globe,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { api, ApiClientError } from "@/lib/api";
import { fetchSessionFromKV } from "@/lib/mock-data";
import { fetchStatusFromSupabase } from "@/lib/supabase-session-sync";
import { toast } from "@/components/ui/use-toast";
import { PRESENCE_POLL_INTERVAL } from "@/lib/constants";
import { useTimer } from "@/lib/timer-context";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { useLexicon } from "@/lib/lexicon-context";
import { VoiceInput } from "@/components/voice-input";
import { PollCountdownTimer } from "@/components/poll-countdown-timer";
import { SimModeratorExperience } from "@/components/sim-moderator-experience";
import { useTheme } from "@/lib/theme-context";
import type { Session, Question, SimTheme } from "@/lib/types";
import { useRealtimeStatus } from "@/lib/use-realtime-status";
import { useSessionBroadcast, type SessionBroadcastPayload } from "@/lib/use-session-broadcast";
import { STATUS_ORDER, statusRank } from "@/lib/session-utils";
import { supabase } from "@/lib/supabase";
import { ThemeRankingDnD } from "@/components/theme-ranking-dnd";
import { ThemeResultsChart } from "@/components/theme-results-chart";
import { getSimPollBySessionId, resolveThemesForLevel } from "@/lib/sim-data";

// ── Simulation Duration Options ──────────────────────────────────
// User-selectable durations so the countdown timer can be observed at each phase.
const SIMULATION_DURATIONS = [
  { label: "2 Day", ms: 2 * 24 * 60 * 60 * 1000, totalDays: 2 },
  { label: "0.5 Day", ms: 12 * 60 * 60 * 1000, totalDays: 1 },
  { label: "0.5 Hour", ms: 30 * 60 * 1000, totalDays: 1 },
  { label: "0.5 Min", ms: 30 * 1000, totalDays: 1 },
] as const;

// Sample session data for simulation mode (F10)
// Supports both live_interactive (default) and static_poll with countdown timer
function makeSimulationSession(
  simType: "live_interactive" | "static_poll",
  durationMs: number,
  totalDays: number,
  label: string,
): Session {
  const now = new Date();
  const isStatic = simType === "static_poll";
  const endsAt = isStatic ? new Date(now.getTime() + durationMs) : null;
  return {
    id: "sim-session-001",
    short_code: "SIM12345",
    created_by: "sim-moderator",
    status: "polling",
    title: isStatic
      ? `Simulation Mode — Static Poll (${label})`
      : `Simulation Mode — Live Poll`,
    description: isStatic
      ? "Sandboxed simulation with countdown timer. Try submitting responses!"
      : "Sandboxed simulation of a live interactive poll. Try submitting responses!",
    anonymity_mode: "anonymous",
    cycle_mode: "single",
    max_cycles: 1,
    current_cycle: 1,
    ranking_mode: "auto",
    language: "en",
    max_response_length: 3333,
    ai_provider: "openai",
    session_type: "polling",
    polling_mode: "single_round",
    pricing_tier: "free",
    max_participants: null,
    fee_amount_cents: 0,
    cost_splitting_enabled: false,
    reward_enabled: false,
    reward_amount_cents: 0,
    theme2_voting_level: "theme2_9",
    live_feed_enabled: false,
    polling_mode_type: simType,
    static_poll_duration_days: isStatic ? totalDays : null,
    ends_at: endsAt ? endsAt.toISOString() : null,
    timer_display_mode: isStatic ? "both" : "flex",
    is_paid: false,
    qr_url: null,
    join_url: null,
    opened_at: now.toISOString(),
    closed_at: null,
    expires_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    participant_count: 42,
  };
}

const SIMULATION_QUESTIONS: Question[] = [
  {
    id: "sim-q1",
    session_id: "sim-session-001",
    question_text: "What is the biggest opportunity for AI in governance?",
    cycle_id: 1,
    order_index: 0,
    status: "active",
    created_at: new Date().toISOString(),
  },
  {
    id: "sim-q2",
    session_id: "sim-session-001",
    question_text: "What concerns do you have about AI-driven decision making?",
    cycle_id: 1,
    order_index: 1,
    status: "active",
    created_at: new Date().toISOString(),
  },
];

// ── 7 Canned AI User Responses (Simulation) ─────────────────────
interface SimAiResponse {
  user: string;
  text: string;
  delayMs: number;
  theme: string;
}

// 12 Ascended Master AI Users × 2-3 responses each = 30 responses (multilingual)
// This simulates a realistic 12-user session the Moderator can watch live
const DEFAULT_SIM_AI_RESPONSES: SimAiResponse[] = [
  // ── Wave 1: Enki (Sumerian creator — diversity & edge-case discovery) ──
  { user: "Enki", text: "AI can democratize decision-making by processing millions of voices simultaneously, something human-only systems can't achieve at scale.", delayMs: 1000, theme: "opportunity" },
  { user: "Enki", text: "We must ensure that every voice has equal weight. AI governance without equity safeguards becomes digital tyranny.", delayMs: 3500, theme: "concern" },
  { user: "Enki", text: "The future of collective intelligence lies in combining AI pattern recognition with human moral reasoning.", delayMs: 6000, theme: "balanced" },
  // ── Wave 2: Thor (Norse protector — risk & security stress testing) ──
  { user: "Thor", text: "My biggest concern is algorithmic bias in AI governance. If the training data reflects historical biases, the AI will perpetuate inequality.", delayMs: 2000, theme: "concern" },
  { user: "Thor", text: "Security vulnerabilities in governance AI could be exploited by adversarial actors to manipulate democratic outcomes.", delayMs: 5000, theme: "concern" },
  // ── Wave 3: Krishna (Hindu unifier — integration & cross-module) ──
  { user: "Krishna", text: "La transparencia es clave. Cada decisión de gobernanza con IA debe tener una pista de auditoría explicable que los ciudadanos puedan revisar.", delayMs: 3000, theme: "balanced" },
  { user: "Krishna", text: "We need hybrid systems — AI processes data and identifies patterns, but humans make final governance decisions with that intelligence.", delayMs: 7500, theme: "balanced" },
  { user: "Krishna", text: "Integration across departments and nations is the key unlock. AI governance must be interoperable.", delayMs: 11000, theme: "opportunity" },
  // ── Wave 4: Odin (Norse all-father — predictive & future-proof) ──
  { user: "Odin", text: "The speed of AI analysis means governance can become truly real-time. Policies can adapt to citizen feedback within hours, not years.", delayMs: 4000, theme: "opportunity" },
  { user: "Odin", text: "La velocidad del análisis de IA significa que la gobernanza puede ser verdaderamente en tiempo real.", delayMs: 8000, theme: "opportunity" },
  // ── Wave 5: Athena (Greek wisdom — strategic test planning) ──
  { user: "Athena", text: "Privacy is my #1 concern. Governance AI systems will have access to massive amounts of citizen data. We need iron-clad protections.", delayMs: 5500, theme: "concern" },
  { user: "Athena", text: "Die Strategie muss zuerst kommen. KI-Governance braucht einen klaren Fahrplan mit messbaren Meilensteinen.", delayMs: 9500, theme: "balanced" },
  { user: "Athena", text: "Strategic phased rollouts, starting with local governance before scaling nationally, reduce risk and build public trust.", delayMs: 13500, theme: "balanced" },
  // ── Wave 6: Thoth (Egyptian mathematician — data & analytics) ──
  { user: "Thoth", text: "AI governance should start with low-stakes decisions like urban planning priorities before scaling to more critical areas.", delayMs: 6500, theme: "opportunity" },
  { user: "Thoth", text: "Les données doivent être la base de toute décision. L'IA peut traiter des millions de points de données pour des décisions éclairées.", delayMs: 10500, theme: "opportunity" },
  // ── Wave 7: Sofia (Sophia — multi-perspective analysis) ──
  { user: "Sofia", text: "Multiple perspectives must be weighted equally. AI has the unique ability to synthesize diverse viewpoints without human cognitive bias.", delayMs: 7000, theme: "balanced" },
  { user: "Sofia", text: "A verdadeira inovação na governança é ouvir milhões de vozes e encontrar consenso em tempo real.", delayMs: 12000, theme: "opportunity" },
  // ── Wave 8: Aset (Egyptian Isis — theme reinforcement & consistency) ──
  { user: "Aset", text: "The consistent application of governance rules across all citizens is where AI truly excels over human bureaucracy.", delayMs: 8500, theme: "opportunity" },
  { user: "Aset", text: "しかし、一貫性だけでは不十分です。AIガバナンスには人間の共感も必要です。", delayMs: 14000, theme: "balanced" },
  // ── Wave 9: Pangu (Chinese primordial — cutting-edge innovation) ──
  { user: "Pangu", text: "创新的AI治理可以处理数百万声音，创造真正的全球民主。", delayMs: 9000, theme: "opportunity" },
  { user: "Pangu", text: "Decentralized AI nodes could enable every community to participate in global governance without central authority.", delayMs: 15000, theme: "opportunity" },
  { user: "Pangu", text: "Edge computing combined with federated learning preserves privacy while enabling collective intelligence at planetary scale.", delayMs: 18000, theme: "balanced" },
  // ── Wave 10: Christo (Unity consciousness — consensus building) ──
  { user: "Christo", text: "True governance emerges when every voice is heard and every perspective is honored. AI makes this possible at any scale.", delayMs: 10000, theme: "balanced" },
  { user: "Christo", text: "الوحدة في التنوع هي مبدأ الحوكمة الحقيقية. الذكاء الاصطناعي يمكنه تحقيق هذا.", delayMs: 16000, theme: "balanced" },
  // ── Wave 11: Enlil (Sumerian order — implementation & build) ──
  { user: "Enlil", text: "Implementation must follow rigorous standards. AI governance without audit trails is governance without accountability.", delayMs: 11500, theme: "concern" },
  { user: "Enlil", text: "Every system must be battle-tested before deployment. Simulation and stress testing are non-negotiable.", delayMs: 17000, theme: "concern" },
  // ── Wave 12: Asar (Egyptian Osiris — final synthesis) ──
  { user: "Asar", text: "The synthesis of all perspectives reveals a clear path: AI governance must be transparent, equitable, secure, and human-centered.", delayMs: 13000, theme: "balanced" },
  { user: "Asar", text: "인공지능 거버넌스의 미래는 기술과 인간 지혜의 조화에 있습니다.", delayMs: 19000, theme: "balanced" },
  { user: "Asar", text: "We stand at the threshold of a new era where shared intention moves at the speed of thought.", delayMs: 20000, theme: "opportunity" },
];

// ── Default theme icons for simulation ──────────────────────────
const DEFAULT_THEME_ICONS = ["🚀", "⚠️", "⚖️", "💡", "🔬", "🔒", "🌐", "📊", "🎯"];

// ── Simulated Themes (Cube 6 Stub — 9-theme fallback at 5000-response AI Governance scale) ──
const SIM_THEMES: SimTheme[] = [
  { id: "t1", name: "Democratic Scale Innovation", confidence: 0.92, responseCount: 750, color: "#10B981", icon: "🚀", partition: "Supporting Comments" },
  { id: "t2", name: "Real-Time Policy Adaptation", confidence: 0.89, responseCount: 620, color: "#059669", icon: "💡", partition: "Supporting Comments" },
  { id: "t3", name: "Participatory Democracy Bridge", confidence: 0.88, responseCount: 580, color: "#047857", icon: "🌐", partition: "Supporting Comments" },
  { id: "t4", name: "Algorithmic Bias Risks", confidence: 0.90, responseCount: 680, color: "#EF4444", icon: "⚠️", partition: "Risk & Concerns" },
  { id: "t5", name: "Privacy Protection Imperatives", confidence: 0.87, responseCount: 610, color: "#DC2626", icon: "🔒", partition: "Risk & Concerns" },
  { id: "t6", name: "Transparency & Explainability", confidence: 0.86, responseCount: 370, color: "#34D399", icon: "🔬", partition: "Supporting Comments" },
  { id: "t7", name: "Hybrid Governance Models", confidence: 0.85, responseCount: 530, color: "#3B82F6", icon: "⚖️", partition: "Neutral Comments" },
  { id: "t8", name: "Regulatory Framework Needs", confidence: 0.84, responseCount: 440, color: "#B91C1C", icon: "📊", partition: "Risk & Concerns" },
  { id: "t9", name: "Incremental Trust Building", confidence: 0.80, responseCount: 420, color: "#2563EB", icon: "🎯", partition: "Neutral Comments" },
];

// ── Polling Status Bar ───────────────────────────────────────────

const POLLING_STEP_KEYS = [
  { labelKey: "cube1.session.step_objectives", key: "objectives" },
  { labelKey: "cube1.session.step_feedback", key: "feedback" },
  { labelKey: "cube1.session.step_ranking", key: "ranking" },
  { labelKey: "cube1.session.step_results", key: "results" },
] as const;

function getActiveStep(status: string): number {
  switch (status) {
    case "open":
    case "draft":
      return 0;
    case "polling":
      return 1;
    case "ranking":
      return 2;
    case "closed":
    case "archived":
      return 3;
    default:
      return 0;
  }
}

function PollingStatusBar({ status }: { status: string }) {
  const activeStep = getActiveStep(status);
  const { t } = useLexicon();

  return (
    <div className="w-full max-w-lg mb-4">
      <div className="flex items-center justify-between">
        {POLLING_STEP_KEYS.map((step, i) => {
          const isCompleted = i < activeStep;
          const isActive = i === activeStep;
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-colors ${
                    isCompleted
                      ? "border-green-500 bg-green-500/20 text-green-400"
                      : isActive
                      ? "border-green-400 bg-green-400/20 text-green-300"
                      : "border-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isActive ? (
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1 ${
                    isActive
                      ? "text-green-300 font-medium"
                      : isCompleted
                      ? "text-green-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {t(step.labelKey)}
                </span>
              </div>
              {i < POLLING_STEP_KEYS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1.5 mt-[-14px] rounded-full ${
                    i < activeStep ? "bg-green-500" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Token Earn Animation ─────────────────────────────────────────

function TokenEarnOverlay({ visible, color, heartCount = 1, unityCount = 5 }: { visible: boolean; color: string; heartCount?: number; unityCount?: number }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div
        className="text-3xl font-bold"
        style={{
          animation: "token-earn 1.2s ease-out forwards",
          color,
        }}
      >
        +{heartCount} ♡ +{unityCount} ◬
      </div>
      <style jsx global>{`
        @keyframes token-earn {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          50% { opacity: 1; transform: translateY(-30px) scale(1.2); }
          100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
        }
      `}</style>
    </div>
  );
}

export function SessionView() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("id") || "";
  const participantId = searchParams.get("pid") || "";
  const languageCode = searchParams.get("lang") || "en";
  // Note: ss/sc URL params removed — KV is now the source of truth for cross-device status

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Response input
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(new Set());
  const [showTokenEarn, setShowTokenEarn] = useState(false);

  // Simulation duration selector + type toggle (only used in simulation mode)
  const [simDurationIndex, setSimDurationIndex] = useState(0);
  const [simType, setSimType] = useState<"live_interactive" | "static_poll">("live_interactive");

  // Simulation: 7 AI user responses that appear progressively
  const [simAiResponses, setSimAiResponses] = useState<SimAiResponse[]>([]);
  const [simPhase, setSimPhase] = useState<"polling" | "closed" | "theming" | "visuals" | "ranking" | "results">("polling");
  const [simUserSubmitted, setSimUserSubmitted] = useState(false);

  // Question translation toggle
  const [questionTranslated, setQuestionTranslated] = useState(false);

  // Timer integration
  const { start: startTimer, stop: stopTimer, restart: restartTimer, earnTokens } = useTimer();

  // Simulation mode — use sample data instead of API calls
  // Two entry paths: (1) Easter egg sequence → context, (2) QR scan → ?sim=1 in URL
  const { simulationMode: ctxSimMode, simulationRole: ctxSimRole, simulationSessionId: ctxSimSessionId } = useEasterEgg();
  const simParam = searchParams.get("sim") === "1";
  const isQrSim = simParam && !!sessionId;
  // QR-joined users get participant experience (role="moderator" in SIM terminology)
  // without the SimulationOverlay (audio/logos) — just the polling UI
  const simulationMode = ctxSimMode || isQrSim;
  const simulationRole: "moderator" | "poller" = ctxSimMode ? ctxSimRole : "moderator";
  const simulationSessionId = ctxSimMode ? ctxSimSessionId : (isQrSim ? sessionId : null);
  const { t, activeLocale } = useLexicon();
  const { currentTheme } = useTheme();

  // Load per-session SIM data if a session ID is set
  const simPollData = simulationSessionId
    ? getSimPollBySessionId(simulationSessionId)
    : undefined;

  // Resolve AI responses for current sim (per-poll or default)
  const simAiResponseSource: SimAiResponse[] = simPollData
    ? simPollData.cube2.aiResponses.map((r) => ({
        user: r.user,
        text: r.text,
        delayMs: r.delayMs,
        theme: r.theme,
      }))
    : DEFAULT_SIM_AI_RESPONSES;

  // Resolve themes for current sim — dynamic voting level (3/6/9)
  const votingLevel = session?.theme2_voting_level ?? "theme2_9";
  const simThemes: SimTheme[] = simPollData
    ? resolveThemesForLevel(simPollData, votingLevel).map((th, i) => ({
        id: th.id,
        name: th.name,
        confidence: th.confidence,
        responseCount: th.count,
        color: th.color,
        icon: DEFAULT_THEME_ICONS[i] || "🎯",
        partition: th.partition,
      }))
    : SIM_THEMES;

  useEffect(() => {
    // In simulation mode, use sample data with selectable duration
    if (simulationMode) {
      // Poller sim → SimModeratorExperience handles its own state
      if (simulationRole === "poller") {
        setLoading(false);
        return;
      }
      // Moderator sim → show participant polling experience
      // Use per-session SIM data if available
      const pollMode = simPollData?.pollingMode ?? simType;
      const dur = SIMULATION_DURATIONS[simDurationIndex];
      const simSession = makeSimulationSession(pollMode, dur.ms, dur.totalDays, dur.label);

      // Override title/questions from sim-data if available
      if (simPollData) {
        simSession.title = `[SIM] ${simPollData.title}`;
        simSession.id = simPollData.sessionId;
      }

      setSession(simSession);

      // Use per-session questions or defaults
      const simQuestions: Question[] = simPollData
        ? simPollData.questions.map((q, i) => ({
            id: q.id,
            session_id: simPollData.sessionId,
            question_text: q.text,
            cycle_id: 1,
            order_index: i,
            status: "active" as const,
            created_at: new Date().toISOString(),
          }))
        : SIMULATION_QUESTIONS;

      setQuestions(simQuestions);
      setParticipantCount(simSession.participant_count);
      setLoading(false);
      startTimer();
      return;
    }
    if (!sessionId) {
      setError("No session ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);

    const loadSession = async () => {
      try {
        const data = await api.get<Session>(`/sessions/${sessionId}`);

        // Cross-device: check KV then Supabase DB for live session status.
        // KV can fail cross-datacenter (CF Cache API is per-PoP); Supabase DB is globally consistent.
        if (data.short_code) {
          const [kvResult, sbResult] = await Promise.allSettled([
            fetchSessionFromKV(data.short_code),
            fetchStatusFromSupabase(data.short_code),
          ]);
          const kvData = kvResult.status === "fulfilled" ? kvResult.value : null;
          const sbData = sbResult.status === "fulfilled" ? sbResult.value : null;

          if (kvData && !("error" in kvData) && kvData.status) {
            data.status = kvData.status as Session["status"];
            if (kvData.ends_at) data.ends_at = kvData.ends_at as string;
            if (kvData.participant_count != null) data.participant_count = kvData.participant_count as number;
          } else if (sbData?.status) {
            // KV miss — use Supabase DB (globally consistent HTTP REST)
            data.status = sbData.status as Session["status"];
            if (sbData.participant_count != null) data.participant_count = sbData.participant_count;
          }
          if (data.status === "polling" && !data.opened_at) {
            data.opened_at = new Date().toISOString();
          }
        }

        setSession(data);
        setParticipantCount(data.participant_count ?? 0);
        // Start time tracking when session is actively polling
        if (["open", "polling"].includes(data.status)) {
          startTimer();
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError((err as ApiClientError).detail);
        } else {
          setError("Failed to load session.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, simulationMode, simulationRole, simType, simDurationIndex, startTimer, simPollData]);

  // Simulation: Progressive AI responses during moderator sim polling
  useEffect(() => {
    if (!simulationMode || simulationRole !== "moderator" || simPhase !== "polling") return;
    const timers = simAiResponseSource.map((response, i) =>
      setTimeout(() => {
        setSimAiResponses((prev) => {
          if (prev.length > i) return prev; // Already added
          return [...prev, response];
        });
      }, response.delayMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [simulationMode, simulationRole, simPhase, simAiResponseSource]);

  // Simulation: Auto-transition chain when all 7 AI + 1 user submit
  // Flow: polling → closed (1.5s) → theming (1.5s) → visuals (3s) → ranking
  useEffect(() => {
    if (!simulationMode || simulationRole !== "moderator") return;
    if (simAiResponses.length >= 30 && simUserSubmitted && simPhase === "polling") {
      // All 30 Ascended Master responses + 1 user response in — start transition chain
      const t1 = setTimeout(() => {
        setSimPhase("closed");
        toast({ title: t("cube10.sim.state_closed") });
      }, 1500);
      return () => clearTimeout(t1);
    }
  }, [simulationMode, simulationRole, simAiResponses.length, simUserSubmitted, simPhase, t]);

  // Chain: closed → theming
  useEffect(() => {
    if (!simulationMode || simulationRole !== "moderator" || simPhase !== "closed") return;
    const timer = setTimeout(() => {
      setSimPhase("theming");
      toast({ title: t("cube10.sim.state_theming") });
    }, 1500);
    return () => clearTimeout(timer);
  }, [simulationMode, simulationRole, simPhase, t]);

  // Chain: theming → visuals
  useEffect(() => {
    if (!simulationMode || simulationRole !== "moderator" || simPhase !== "theming") return;
    const timer = setTimeout(() => {
      setSimPhase("visuals");
      toast({ title: t("cube10.sim.state_visuals") });
    }, 1500);
    return () => clearTimeout(timer);
  }, [simulationMode, simulationRole, simPhase, t]);

  // Chain: visuals → ranking
  useEffect(() => {
    if (!simulationMode || simulationRole !== "moderator" || simPhase !== "visuals") return;
    const timer = setTimeout(() => {
      setSimPhase("ranking");
      setSession((prev) => prev ? { ...prev, status: "ranking" } : prev);
      toast({ title: t("cube10.sim.themes_ready") });
    }, 3000);
    return () => clearTimeout(timer);
  }, [simulationMode, simulationRole, simPhase, t]);

  // Fetch questions when session is in polling state
  useEffect(() => {
    if (!session || session.status !== "polling") return;
    if (simulationMode) return; // Simulation already has questions
    api
      .getSessionQuestions(sessionId)
      .then((qs) => setQuestions(qs as Question[]))
      .catch(() => {});
  }, [session, sessionId, simulationMode]);

  // Poll participant count — use session.status as dep to avoid stale closure
  const sessionStatus = session?.status;
  useEffect(() => {
    if (!sessionId || !sessionStatus) return;
    if (simulationMode) return;
    const isActive = ["draft", "open", "polling", "ranking"].includes(sessionStatus);
    if (!isActive) return;

    const interval = setInterval(async () => {
      try {
        const data = await api.get<{ count: number; active_count?: number }>(
          `/sessions/${sessionId}/presence`
        );
        setParticipantCount(data.active_count ?? data.count ?? 0);
      } catch {
        // Silently fail
      }
    }, PRESENCE_POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [sessionId, sessionStatus, simulationMode]);

  // Timer starts on FIRST KEYSTROKE or FIRST WORD (anti-gaming)
  // NOT on page load — users can't accrue tokens by just sitting idle
  const timerStartedRef = useRef(false);
  const startTimerOnActivity = useCallback(() => {
    if (!timerStartedRef.current && sessionStatus === "polling") {
      timerStartedRef.current = true;
      startTimer();
    }
  }, [sessionStatus, startTimer]);

  // Stop timer when session leaves polling
  useEffect(() => {
    if (sessionStatus && sessionStatus !== "polling" && sessionStatus !== "open") {
      stopTimer();
      timerStartedRef.current = false;
    }
  }, [sessionStatus, stopTimer]);

  // broadcastHealthy: set to true when Broadcast fires, reset after 8s of silence.
  // When healthy, the 1.5s DB poll is suspended — Broadcast is the primary path.
  const broadcastHealthy = useRef(false);
  const broadcastHealthyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markBroadcastHealthy = useCallback(() => {
    broadcastHealthy.current = true;
    if (broadcastHealthyTimer.current) clearTimeout(broadcastHealthyTimer.current);
    broadcastHealthyTimer.current = setTimeout(() => { broadcastHealthy.current = false; }, 8000);
  }, []);

  // Poll session status — fallback for when Broadcast is silent or WebSocket is paused.
  // Suspended while Broadcast is confirmed healthy (avoids redundant DB calls).
  // Checks KV + Supabase DB in parallel for cross-device, cross-datacenter accuracy.
  useEffect(() => {
    if (!sessionId || !sessionStatus) return;
    if (simulationMode) return;
    const isActive = ["draft", "open", "polling", "ranking"].includes(sessionStatus);
    if (!isActive) return;

    const checkStatus = async () => {
      // Skip DB poll while Broadcast is delivering updates — Broadcast is primary
      if (broadcastHealthy.current) return;

      try {
        if (session?.short_code) {
          const [kvResult, sbResult] = await Promise.allSettled([
            fetchSessionFromKV(session.short_code),
            fetchStatusFromSupabase(session.short_code),
          ]);
          const kvData = kvResult.status === "fulfilled" ? kvResult.value : null;
          const sbData = sbResult.status === "fulfilled" ? sbResult.value : null;

          const kvStatus = kvData && !("error" in kvData) ? kvData.status as string : null;
          const sbStatus = sbData?.status ?? null;

          const candidates = [sessionStatus, kvStatus, sbStatus].filter(Boolean) as string[];
          const bestStatus = candidates.reduce((best, s) => statusRank(s) > statusRank(best) ? s : best, sessionStatus);

          if (bestStatus !== sessionStatus) {
            setSession((prev) => prev ? {
              ...prev,
              status: bestStatus as Session["status"],
              ends_at: (kvData && !("error" in kvData) ? kvData.ends_at as string : null) || prev.ends_at,
              participant_count: (kvData && !("error" in kvData) ? kvData.participant_count as number : null) ?? sbData?.participant_count ?? prev.participant_count,
              updated_at: new Date().toISOString(),
            } : prev);
            return;
          }
        }

        // Local API — only apply if it advances status forward
        const data = await api.get<Session>(`/sessions/${sessionId}`);
        if (statusRank(data.status) > statusRank(sessionStatus)) {
          setSession(data);
        }
      } catch {
        // Silently fail
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 1500);
    return () => {
      clearInterval(interval);
      if (broadcastHealthyTimer.current) clearTimeout(broadcastHealthyTimer.current);
    };
  }, [sessionId, sessionStatus, simulationMode, session?.short_code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Supabase Realtime Broadcast: instant push-based status transitions.
  // Moderator broadcasts status changes → all participants receive instantly (~50ms).
  // Works without any DB tables — pure pub/sub via Supabase Realtime.
  const onBroadcastStatus = useCallback(
    (payload: SessionBroadcastPayload) => {
      markBroadcastHealthy();
      if (!payload.status) return;
      setSession((prev) => {
        if (!prev || prev.status === payload.status) return prev;
        return {
          ...prev,
          status: payload.status as Session["status"],
          ends_at: (payload.ends_at as string) || prev.ends_at,
          participant_count: (payload.participant_count as number) ?? prev.participant_count,
          updated_at: new Date().toISOString(),
        };
      });
    },
    [markBroadcastHealthy],
  );
  const onBroadcastPresence = useCallback(
    (count: number) => { markBroadcastHealthy(); setParticipantCount(count); },
    [markBroadcastHealthy],
  );
  const { broadcast: broadcastToSession } = useSessionBroadcast(
    simulationMode ? null : session?.short_code,
    onBroadcastStatus,
    onBroadcastPresence,
  );

  // Supabase Realtime postgres_changes (secondary — activates when DB tables exist).
  const onRealtimeStatus = useCallback(
    (newStatus: string, payload: Record<string, unknown>) => {
      setSession((prev) => {
        if (!prev || prev.status === newStatus) return prev;
        return {
          ...prev,
          status: newStatus as Session["status"],
          ends_at: (payload.ends_at as string) || prev.ends_at,
          updated_at: new Date().toISOString(),
        };
      });
    },
    [],
  );
  useRealtimeStatus(
    simulationMode ? null : session?.short_code,
    onRealtimeStatus,
  );

  const handleSubmitResponse = useCallback(async () => {
    if (!responseText.trim() || questions.length === 0) return;
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;

    setSubmitting(true);
    try {
      const result = await api.submitTextResponse(
        sessionId,
        currentQuestion.id,
        participantId,
        responseText.trim(),
        languageCode,
      );

      // Mark question as submitted
      setSubmittedQuestions((prev) => new Set(prev).add(currentQuestion.id));
      setResponseText("");

      // Stop active-response timer — tokens only accrue while typing/recording
      stopTimer();

      // Token earn animation — use server-reported values when available
      const heartsEarned = result?.heart_tokens_earned ?? 1;
      earnTokens(heartsEarned);
      setShowTokenEarn(true);
      setTimeout(() => setShowTokenEarn(false), 1200);

      toast({ title: t("cube10.sim.response_submitted") });

      // Push response to dashboard via THREE parallel paths (Trinity redundancy):
      // Path A: Supabase Broadcast (WebSocket, ~50ms) → Dashboard Channel A
      // Path B: Supabase DB INSERT (HTTP REST) → Dashboard Channel B (postgres_changes) + Channel D (poll)
      // Path C: CF KV POST (HTTP) → Dashboard KV poll fallback
      // Any ONE path succeeding = response appears on moderator screen
      if (!simulationMode) {
        const trimmed = responseText.trim();
        const responseId = result?.id ?? `r-${Date.now()}`;
        const submittedAt = new Date().toISOString();

        // Path A — Supabase Broadcast (instant ~50ms, WebSocket push)
        broadcastToSession("new_response", {
          id: responseId,
          text: trimmed.length > 80 ? trimmed.substring(0, 80) + "..." : trimmed,
          clean_text: trimmed,
          submitted_at: submittedAt,
          summary_33: (result as { summary_33?: string })?.summary_33 ?? undefined,
          count: submittedQuestions.size + 1,
        }).catch(() => {});

        // Path B — Supabase DB INSERT (HTTP REST, globally consistent)
        // Feeds: postgres_changes (Channel B) + HTTP poll (Channel D)
        if (supabase && session?.short_code) {
          supabase.from("responses").insert({
            id: responseId,
            session_code: session.short_code,
            participant_id: participantId,
            content: trimmed,
          }).then(() => {}, () => {});
        }

        // Path C — CF KV POST (HTTP, per-datacenter cache, fast reads)
        if (session?.short_code) {
          fetch("/api/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              short_code: session.short_code,
              text: trimmed,
              participant_id: participantId,
              language_code: languageCode || "en",
            }),
          }).catch(() => {});
        }
      }

      // Track sim user submission for auto-transition
      if (simulationMode && simulationRole === "moderator") {
        setSimUserSubmitted(true);
      }

      // User advances via "Next Question" button (no auto-advance to avoid double-click race)
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast({
          title: t("cube2.input.submission_failed"),
          description: err.detail,
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [responseText, questions, currentQuestionIndex, sessionId, participantId, languageCode, earnTokens, stopTimer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.metaKey) {
        e.preventDefault();
        handleSubmitResponse();
      }
    },
    [handleSubmitResponse]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1 items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-muted-foreground">{error}</p>
              <Button variant="outline" onClick={() => (window.location.href = "/")}>
                {t("shared.nav.back_to_home")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCurrentSubmitted = currentQuestion
    ? submittedQuestions.has(currentQuestion.id)
    : false;
  const allSubmitted =
    questions.length > 0 && submittedQuestions.size >= questions.length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar sessionTitle={simulationMode ? `[SIM] ${simulationRole === "poller" ? t("cube10.sim.role_poller") : (session?.title ?? "")}` : session?.title} />
      <TokenEarnOverlay visible={showTokenEarn} color={currentTheme.swatch} />

      <main className="container flex flex-1 flex-col items-center py-8 px-4">
        {/* Poller sim → show moderator dashboard experience */}
        {simulationMode && simulationRole === "poller" && (
          <SimModeratorExperience />
        )}

        {/* Normal flow (or moderator sim → participant polling experience) */}
        {!(simulationMode && simulationRole === "poller") && (
        <>
        {/* Status bar — visible during active polling states + closed/archived (all steps completed) */}
        {session && ["open", "polling", "ranking", "closed", "archived"].includes(session.status) && (
          <PollingStatusBar status={session.status} />
        )}

        {/* Lobby / Open state */}
        {(session?.status === "open" || session?.status === "draft") && (
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{session.title}</CardTitle>
              {session.description && (
                <CardDescription>{session.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-8 py-4">
                <Users className="h-6 w-6 text-primary shrink-0" />
                <div className="flex flex-col items-center">
                  <p className="text-3xl font-bold text-primary">
                    {participantCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("cube1.session.participants_joined")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{t("cube1.session.waiting_polling")}</span>
              </div>

              <div className="rounded-md bg-muted px-4 py-2 text-center">
                <p className="text-xs text-muted-foreground">{t("cube1.session.session_code")}</p>
                <p className="text-lg font-mono font-bold tracking-wider">
                  {session.short_code}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Polling state — One question at a time */}
        {session?.status === "polling" && (
          <>
          {/* Simulation type + duration selector — only in moderator simulation mode */}
          {simulationMode && simulationRole === "moderator" && (
            <div className="w-full max-w-lg mb-3 flex flex-col items-center gap-2">
              {/* Sim type toggle: Live Poll / Static Poll */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t("cube10.sim.sim_type")}:</span>
                <button
                  onClick={() => setSimType("live_interactive")}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    simType === "live_interactive"
                      ? "border-primary bg-accent/30 font-medium text-foreground"
                      : "border-border hover:bg-accent/20 text-muted-foreground"
                  }`}
                >
                  {t("cube10.sim.live_poll")}
                </button>
                <button
                  onClick={() => setSimType("static_poll")}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    simType === "static_poll"
                      ? "border-primary bg-accent/30 font-medium text-foreground"
                      : "border-border hover:bg-accent/20 text-muted-foreground"
                  }`}
                >
                  {t("cube10.sim.static_poll")}
                </button>
              </div>
              {/* Duration selector — only for static poll sim */}
              {simType === "static_poll" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{t("cube1.timer.sim_duration")}:</span>
                  {SIMULATION_DURATIONS.map((dur, i) => (
                    <button
                      key={dur.label}
                      onClick={() => setSimDurationIndex(i)}
                      className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                        simDurationIndex === i
                          ? "border-primary bg-accent/30 font-medium text-foreground"
                          : "border-border hover:bg-accent/20 text-muted-foreground"
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Sim closed state (preparing theming) */}
          {simulationMode && simulationRole === "moderator" && simPhase === "closed" && (
            <div className="w-full max-w-lg mb-4 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium">{t("cube10.sim.state_closed")}</p>
              <p className="text-xs text-muted-foreground">{t("cube10.sim.session_closed_msg")}</p>
            </div>
          )}

          {/* Sim theming indicator */}
          {simulationMode && simulationRole === "moderator" && simPhase === "theming" && (
            <div className="w-full max-w-lg mb-4 flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-primary font-medium">{t("cube10.sim.theming_complete")}</p>
              <p className="text-xs text-muted-foreground">{t("cube10.sim.clustering_responses").replace("{0}", String(simAiResponses.length || 7))}</p>
            </div>
          )}

          {/* Sim visuals (themed clusters preview) */}
          {simulationMode && simulationRole === "moderator" && simPhase === "visuals" && (
            <div className="w-full max-w-lg mb-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-primary" />
                <p className="text-xs text-primary font-medium">{t("cube10.sim.state_visuals")}</p>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground text-center mb-2">{t("cube10.sim.responses_to_themes").replace("{0}", String(simAiResponses.length || 7)).replace("{1}", String(simThemes.length))}</p>
                {simThemes.map((theme) => (
                  <div key={theme.id} className="flex items-center gap-3 rounded-md border px-3 py-2" style={{ borderColor: `${theme.color}40` }}>
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: theme.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{theme.name}</p>
                      <p className="text-[10px] text-muted-foreground">{theme.responseCount} {t("cube10.sim.responses_count")} &middot; {Math.round(theme.confidence * 100)}% {t("cube10.sim.confidence")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {session.polling_mode_type === "static_poll" && session.ends_at && (
            <PollCountdownTimer
              endsAt={session.ends_at}
              totalDays={session.static_poll_duration_days ?? 1}
              displayMode={session.timer_display_mode ?? "flex"}
              accentColor={currentTheme.swatch}
            />
          )}
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {questions.length > 1 && (
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("cube1.session.question_prefix")} {currentQuestionIndex + 1} {t("cube1.session.question_of")} {questions.length}
                    </p>
                  )}
                  <div className="flex items-start gap-2">
                    <CardTitle className="text-lg flex-1">
                      {currentQuestion
                        ? (questionTranslated && activeLocale !== "en"
                            ? `[${activeLocale.toUpperCase()}] ${currentQuestion.question_text}`
                            : currentQuestion.question_text)
                        : t("cube1.session.waiting_question")}
                    </CardTitle>
                    {currentQuestion && simulationMode && (
                      <button
                        onClick={() => {
                          setQuestionTranslated((prev) => !prev);
                          toast({
                            title: questionTranslated
                              ? t("cube10.sim.original")
                              : t("cube10.sim.translate_question"),
                          });
                        }}
                        className="shrink-0 mt-1 rounded-md border px-1.5 py-1 text-[10px] flex items-center gap-1 transition-colors hover:bg-accent/20"
                        style={{ borderColor: questionTranslated ? currentTheme.swatch : undefined }}
                        title={t("cube10.sim.translate_question")}
                      >
                        <Globe className="h-3 w-3" />
                        <span>{questionTranslated ? t("cube10.sim.translated") : t("cube10.sim.original")}</span>
                      </button>
                    )}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 ml-4">
                  <Users className="h-4 w-4" />
                  {participantCount}
                </span>
              </div>
              {/* Progress bar */}
              {questions.length > 1 && (
                <div className="flex gap-1 mt-3">
                  {questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="h-1 flex-1 rounded-full transition-colors"
                      style={{
                        backgroundColor: submittedQuestions.has(q.id)
                          ? "#22C55E"
                          : i === currentQuestionIndex
                          ? "hsl(var(--primary))"
                          : "hsl(var(--muted))",
                      }}
                    />
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {questions.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <Clock className="h-12 w-12 text-muted-foreground" />
                  <p className="font-medium">{t("cube1.session.waiting_question") || "Waiting for questions..."}</p>
                  <p className="text-sm text-muted-foreground text-center">
                    {t("cube1.session.waiting_polling") || "The moderator is preparing questions."}
                  </p>
                </div>
              ) : allSubmitted ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                  <p className="font-medium">{t("cube1.session.all_submitted")}</p>
                  <p className="text-sm text-muted-foreground text-center">
                    {t("cube1.session.waiting_others")}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmittedQuestions(new Set());
                      setResponseText("");
                      setCurrentQuestionIndex(0);
                      restartTimer();
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {t("cube1.session.respond_again") || "Respond Again"}
                  </Button>
                </div>
              ) : isCurrentSubmitted ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                  <p className="font-medium">{t("cube1.session.response_submitted")}</p>
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button onClick={() => {
                      setCurrentQuestionIndex((prev) => prev + 1);
                      restartTimer();
                    }}>
                      {t("cube1.session.next_question")}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmittedQuestions((prev) => {
                          const next = new Set(prev);
                          if (currentQuestion) next.delete(currentQuestion.id);
                          return next;
                        });
                        setResponseText("");
                        restartTimer();
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      {t("cube1.session.respond_again") || "Respond Again"}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <textarea
                      placeholder={t("cube2.input.placeholder")}
                      value={responseText}
                      onChange={(e) => { startTimerOnActivity(); setResponseText(e.target.value); }}
                      maxLength={session.max_response_length || 3333}
                      rows={4}
                      disabled={simulationMode && simPhase !== "polling"}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 resize-none"
                      onKeyDown={handleKeyDown}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {responseText.length}/{session.max_response_length || 3333}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={handleSubmitResponse}
                      disabled={!responseText.trim() || submitting || (simulationMode && simPhase !== "polling")}
                    >
                      {submitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : currentQuestionIndex < questions.length - 1 ? (
                        <Send className="mr-2 h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      {currentQuestionIndex < questions.length - 1
                        ? t("cube1.session.submit_next")
                        : t("cube1.session.submit_btn")}
                    </Button>
                    {/* Voice input (Cube 3 STT) — dictation + direct submit mode */}
                    <VoiceInput
                      sessionId={sessionId}
                      questionId={currentQuestion?.id ?? ""}
                      participantId={participantId}
                      languageCode={languageCode}
                      onTranscript={(text) => { startTimerOnActivity(); setResponseText((prev) => prev + text); }}
                      onSubmitted={(result) => {
                        // Trinity redundancy: 3 paths for voice responses too
                        if (!simulationMode) {
                          const text = result.clean_text || result.transcript_text;
                          const submittedAt = result.submitted_at || new Date().toISOString();
                          // Path A — Broadcast
                          broadcastToSession("new_response", {
                            id: result.id,
                            text: text.length > 80 ? text.substring(0, 80) + "..." : text,
                            clean_text: text,
                            submitted_at: submittedAt,
                            summary_33: result.summary_33,
                            count: submittedQuestions.size + 1,
                          }).catch(() => {});
                          // Path B — Supabase DB
                          if (supabase && session?.short_code) {
                            supabase.from("responses").insert({
                              id: result.id,
                              session_code: session.short_code,
                              participant_id: participantId,
                              content: text,
                            }).then(() => {}, () => {});
                          }
                          // Path C — CF KV
                          if (session?.short_code) {
                            fetch("/api/responses", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ short_code: session.short_code, text, participant_id: participantId }),
                            }).catch(() => {});
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </>
        )}

        {/* Ranking state */}
        {session?.status === "ranking" && (
          <ThemeRankingDnD
            themes={simThemes.length > 0 ? simThemes : SIM_THEMES}
            onComplete={async () => {
              if (simulationMode) {
                setSession((prev) => prev ? { ...prev, status: "closed" } : prev);
                setSimPhase("results");
              } else {
                // Transition session to closed via API (mock or real)
                try {
                  const updated = await api.post<Session>(`/sessions/${sessionId}/close`);
                  setSession(updated);
                } catch {
                  setSession((prev) => prev ? { ...prev, status: "closed" } : prev);
                }
                setSimPhase("results");
              }
              toast({ title: t("cube10.sim.session_complete") });
            }}
          />
        )}

        {/* Results Phase — ranked themes summary after ranking */}
        {simPhase === "results" && (session?.status === "closed" || session?.status === "archived") && (
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
              <CardTitle>{t("cube10.sim.results_summary")}</CardTitle>
              <CardDescription>{t("cube10.sim.sim_results_desc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(simThemes.length > 0 ? simThemes : SIM_THEMES).map((theme, i) => (
                <div
                  key={theme.id}
                  className="flex items-center gap-3 rounded-md border-2 px-3 py-2"
                  style={{ borderColor: theme.color }}
                >
                  <span
                    className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: theme.color }}
                  >
                    {t("cube10.sim.rank_number").replace("{0}", String(i + 1))}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{theme.icon}</span>
                      <p className="text-sm font-medium truncate">{theme.name}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {theme.responseCount} {t("cube10.sim.responses_count")} · {Math.round(theme.confidence * 100)}% {t("cube10.sim.confidence")}
                    </p>
                  </div>
                </div>
              ))}
              {/* Response Distribution Bar Chart */}
              <ThemeResultsChart
                themes={simThemes.length > 0 ? simThemes : SIM_THEMES}
                totalResponses={(simThemes.length > 0 ? simThemes : SIM_THEMES).reduce((s, th) => s + th.responseCount, 0)}
              />

              <div className="rounded-md bg-muted px-3 py-2 text-center mt-2">
                <p className="text-xs text-muted-foreground">
                  {t("cube10.sim.final_stats")
                    .replace("{0}", String((simThemes.length > 0 ? simThemes : SIM_THEMES).reduce((s, th) => s + th.responseCount, 0)))
                    .replace("{1}", String((simThemes.length > 0 ? simThemes : SIM_THEMES).length))}
                </p>
              </div>
              {simulationMode ? (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    setSimPhase("polling");
                    setSimUserSubmitted(false);
                    setSimAiResponses([]);
                    setSubmittedQuestions(new Set());
                    setCurrentQuestionIndex(0);
                    setSession((prev) => prev ? { ...prev, status: "polling" } : prev);
                  }}
                >
                  {t("cube10.sim.return_to_polls")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => (window.location.href = "/")}
                >
                  {t("shared.nav.back_to_home")}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Closed state */}
        {(session?.status === "closed" || session?.status === "archived") && simPhase !== "results" && (
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
              <CardTitle>{t("cube1.session.session_ended")}</CardTitle>
              <CardDescription className="text-center">
                {t("cube1.session.session_closed_msg")}
              </CardDescription>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                {t("shared.nav.back_to_home")}
              </Button>
            </CardContent>
          </Card>
        )}
        </>
        )}
      </main>
    </div>
  );
}
