"use client";

import { useState, useEffect, useCallback } from "react";
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
import { toast } from "@/components/ui/use-toast";
import { PRESENCE_POLL_INTERVAL } from "@/lib/constants";
import { useTimer } from "@/lib/timer-context";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { useLexicon } from "@/lib/lexicon-context";
import { VoiceInput } from "@/components/voice-input";
import { PollCountdownTimer } from "@/components/poll-countdown-timer";
import { useTheme } from "@/lib/theme-context";
import type { Session, Question } from "@/lib/types";

// ── Simulation Duration Options ──────────────────────────────────
// User-selectable durations so the countdown timer can be observed at each phase.
const SIMULATION_DURATIONS = [
  { label: "2 Day", ms: 2 * 24 * 60 * 60 * 1000, totalDays: 2 },
  { label: "0.5 Day", ms: 12 * 60 * 60 * 1000, totalDays: 1 },
  { label: "0.5 Hour", ms: 30 * 60 * 1000, totalDays: 1 },
  { label: "0.5 Min", ms: 30 * 1000, totalDays: 1 },
] as const;

// Sample session data for simulation mode (F10)
// Static poll with user-selectable countdown duration
function makeSimulationSession(durationMs: number, totalDays: number, label: string): Session {
  const now = new Date();
  const endsAt = new Date(now.getTime() + durationMs);
  return {
    id: "sim-session-001",
    short_code: "SIM12345",
    created_by: "sim-moderator",
    status: "polling",
    title: `Simulation Mode — Static Poll (${label})`,
    description: "Sandboxed simulation with countdown timer. Try submitting responses!",
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
    polling_mode_type: "static_poll",
    static_poll_duration_days: totalDays,
    ends_at: endsAt.toISOString(),
    timer_display_mode: "both",
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

function TokenEarnOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div
        className="text-3xl font-bold"
        style={{
          animation: "token-earn 1.2s ease-out forwards",
          color: "#00D7E4",
        }}
      >
        +1 ♡ +5 ◬
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

  // Simulation duration selector (only used in simulation mode)
  const [simDurationIndex, setSimDurationIndex] = useState(0);

  // Timer integration
  const { start: startTimer, earnTokens } = useTimer();

  // Simulation mode — use sample data instead of API calls
  const { simulationMode } = useEasterEgg();
  const { t } = useLexicon();
  const { currentTheme } = useTheme();

  useEffect(() => {
    // In simulation mode, use sample data with selectable duration
    if (simulationMode) {
      const dur = SIMULATION_DURATIONS[simDurationIndex];
      const simSession = makeSimulationSession(dur.ms, dur.totalDays, dur.label);
      setSession(simSession);
      setQuestions(SIMULATION_QUESTIONS);
      setParticipantCount(simSession.participant_count);
      setLoading(false);
      startTimer();
      return;
    }
    if (!sessionId) return;
    setLoading(true);
    api
      .get<Session>(`/sessions/${sessionId}`)
      .then((data) => {
        setSession(data);
        setParticipantCount(data.participant_count ?? 0);
      })
      .catch((err) => {
        if (err instanceof ApiClientError) {
          setError(err.detail);
        } else {
          setError("Failed to load session.");
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId, simulationMode, simDurationIndex, startTimer]);

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
    const isActive = ["open", "polling", "ranking"].includes(sessionStatus);
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

  // Poll session status
  useEffect(() => {
    if (!sessionId || !sessionStatus) return;
    if (simulationMode) return;
    const isActive = ["open", "polling", "ranking"].includes(sessionStatus);
    if (!isActive) return;

    const interval = setInterval(async () => {
      try {
        const data = await api.get<Session>(`/sessions/${sessionId}`);
        if (data.status !== sessionStatus) {
          setSession(data);
        }
      } catch {
        // Silently fail
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId, sessionStatus, simulationMode]);

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

      // Token earn animation — use server-reported values when available
      const heartsEarned = result?.heart_tokens_earned ?? 1;
      earnTokens(heartsEarned);
      setShowTokenEarn(true);
      setTimeout(() => setShowTokenEarn(false), 1200);

      toast({ title: "Response submitted" });

      // Auto-advance to next question after brief delay
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex((prev) => prev + 1);
        }, 1500);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast({
          title: "Submission failed",
          description: err.detail,
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [responseText, questions, currentQuestionIndex, sessionId, participantId, languageCode, earnTokens]);

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
      <Navbar sessionTitle={simulationMode ? `[SIM] ${session?.title ?? ""}` : session?.title} />
      <TokenEarnOverlay visible={showTokenEarn} />

      <main className="container flex flex-1 flex-col items-center py-8 px-4">
        {/* Status bar — visible during active polling states */}
        {session && ["open", "polling", "ranking"].includes(session.status) && (
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
          {/* Simulation duration selector — only in simulation mode */}
          {simulationMode && (
            <div className="w-full max-w-lg mb-3 flex items-center justify-center gap-2">
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
                  <CardTitle className="text-lg">
                    {currentQuestion
                      ? currentQuestion.question_text
                      : t("cube1.session.waiting_question")}
                  </CardTitle>
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
              {allSubmitted ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                  <p className="font-medium">{t("cube1.session.all_submitted")}</p>
                  <p className="text-sm text-muted-foreground text-center">
                    {t("cube1.session.waiting_others")}
                  </p>
                </div>
              ) : isCurrentSubmitted ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                  <p className="font-medium">{t("cube1.session.response_submitted")}</p>
                  {currentQuestionIndex < questions.length - 1 && (
                    <Button onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}>
                      {t("cube1.session.next_question")}
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <textarea
                      placeholder={t("cube2.input.placeholder")}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      maxLength={session.max_response_length || 3333}
                      rows={4}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
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
                      disabled={!responseText.trim() || submitting}
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
                    {/* Voice input (Cube 3 STT) */}
                    <VoiceInput
                      sessionId={sessionId}
                      questionId={currentQuestion?.id ?? ""}
                      participantId={participantId}
                      languageCode={languageCode}
                      onTranscript={(text) => setResponseText((prev) => prev + text)}
                      onTokensEarned={(hearts) => {
                        earnTokens(hearts);
                        setShowTokenEarn(true);
                        setTimeout(() => setShowTokenEarn(false), 1200);
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
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <CardTitle>{t("cube1.session.theme_voting")}</CardTitle>
              <CardDescription>
                {t("cube1.session.theme_voting_desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{participantCount} {t("shared.nav.participants")}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t("cube1.session.theme_voting_soon")}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Closed state */}
        {(session?.status === "closed" || session?.status === "archived") && (
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
      </main>
    </div>
  );
}
