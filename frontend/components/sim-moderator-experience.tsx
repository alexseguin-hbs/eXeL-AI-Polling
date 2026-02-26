"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  QrCode,
  Play,
  Pause,
  Archive,
  CheckCircle2,
  Copy,
  Radio,
  Timer,
  Loader2,
  MessageSquare,
  SkipBack,
  Rewind,
  FastForward,
  SkipForward,
  Plus,
  Eye,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLexicon } from "@/lib/lexicon-context";
import { useTheme } from "@/lib/theme-context";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { PollCountdownTimer } from "@/components/poll-countdown-timer";
import { toast } from "@/components/ui/use-toast";
import { ALL_SIM_POLLS, getSimPollBySessionId, resolveThemesForLevel, type SimPollData } from "@/lib/sim-data";
import { ThemeResultsChart } from "@/components/theme-results-chart";
import type { SimTheme } from "@/lib/types";

// ── Extended state machine (includes theming/visuals phases) ───

type SimStep =
  | "draft"
  | "open"
  | "polling"
  | "closed"
  | "theming"
  | "visuals"
  | "ranking"
  | "archived";

const LIVE_STEPS: SimStep[] = [
  "draft",
  "open",
  "polling",
  "closed",
  "theming",
  "visuals",
  "ranking",
  "archived",
];

const STATIC_STEPS: SimStep[] = [
  "draft",
  "open",
  "polling",
  "theming",
  "visuals",
  "ranking",
  "archived",
];

function getSteps(mode: "live_interactive" | "static_poll"): SimStep[] {
  return mode === "live_interactive" ? LIVE_STEPS : STATIC_STEPS;
}

const STEP_LABELS: Record<SimStep, string> = {
  draft: "Draft",
  open: "Open",
  polling: "Polling",
  closed: "Closed",
  theming: "AI Theming",
  visuals: "Theme Visuals",
  ranking: "Ranking",
  archived: "Archived",
};

const STEP_COLORS: Record<SimStep, string> = {
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  open: "bg-green-500/20 text-green-400 border-green-500/40",
  polling: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  theming: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  visuals: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
  ranking: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  archived: "bg-gray-500/20 text-gray-500 border-gray-500/40",
};

// ── Component ────────────────────────────────────────────────────

export function SimModeratorExperience() {
  const { t } = useLexicon();
  const { currentTheme } = useTheme();
  const { simulationSessionId } = useEasterEgg();
  const accentColor = currentTheme.swatch;

  // Which poll is selected
  const [selectedPoll, setSelectedPoll] = useState<SimPollData | null>(() => {
    if (simulationSessionId) {
      return getSimPollBySessionId(simulationSessionId) ?? null;
    }
    return null;
  });

  // Transport state
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sim responses shown during polling step
  const [simResponses, setSimResponses] = useState<
    { user: string; text: string }[]
  >([]);

  // Auto-scroll ref for response feed
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Participant counter
  const [participantCount, setParticipantCount] = useState(0);
  const participantIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const steps = selectedPoll ? getSteps(selectedPoll.pollingMode) : LIVE_STEPS;
  const currentStep = steps[stepIndex] ?? "draft";

  // ── Select a poll ──────────────────────────────────────────────
  const handleSelectPoll = useCallback(
    (poll: SimPollData) => {
      setSelectedPoll(poll);
      setStepIndex(0);
      setIsPlaying(false);
      setSimResponses([]);
      setParticipantCount(0);
      toast({ title: `Selected: ${poll.title}` });
    },
    []
  );

  // ── Create new session (random short code) ─────────────────────
  const handleCreateNew = useCallback(() => {
    setSelectedPoll(null);
    setStepIndex(0);
    setIsPlaying(false);
    setSimResponses([]);
    setParticipantCount(0);
  }, []);

  // ── Transport controls ─────────────────────────────────────────

  const goToStart = useCallback(() => {
    setStepIndex(0);
    setIsPlaying(false);
    setSimResponses([]);
    setParticipantCount(0);
  }, []);

  const goBack = useCallback(() => {
    setStepIndex((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  }, []);

  const goForward = useCallback(() => {
    setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
    setIsPlaying(false);
  }, [steps.length]);

  const goToEnd = useCallback(() => {
    setStepIndex(steps.length - 1);
    setIsPlaying(false);
  }, [steps.length]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // ── Auto-play timer ────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !selectedPoll) return;
    if (stepIndex >= steps.length - 1) {
      setIsPlaying(false);
      return;
    }

    // Variable delay per step
    let delay = 1500;
    if (currentStep === "polling") delay = 3000;
    if (currentStep === "theming") delay = 2500;
    if (currentStep === "visuals") delay = 3000;

    autoPlayRef.current = setTimeout(() => {
      setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
    }, delay);

    return () => {
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current);
    };
  }, [isPlaying, stepIndex, steps.length, currentStep, selectedPoll]);

  // ── Simulate AI responses arriving during polling step ─────────
  useEffect(() => {
    if (currentStep !== "polling" || !selectedPoll) {
      return;
    }
    // Clear previous responses and set them fresh
    setSimResponses([]);
    const responses = selectedPoll.cube2.aiResponses;
    const timers = responses.map((r, i) =>
      setTimeout(() => {
        setSimResponses((prev) =>
          prev.length > i ? prev : [...prev, { user: r.user, text: r.text }]
        );
      }, r.delayMs)
    );
    return () => timers.forEach(clearTimeout);
  }, [currentStep, selectedPoll]);

  // ── Auto-scroll response feed when new responses arrive ────────
  useEffect(() => {
    if (simResponses.length > 0) {
      feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [simResponses.length]);

  // ── Simulate participants joining during open/polling ──────────
  useEffect(() => {
    if (currentStep === "open" || currentStep === "polling") {
      participantIntervalRef.current = setInterval(() => {
        setParticipantCount((prev) =>
          prev + Math.floor(Math.random() * 3) + 1
        );
      }, 2000);
    } else {
      if (participantIntervalRef.current) {
        clearInterval(participantIntervalRef.current);
        participantIntervalRef.current = null;
      }
    }
    return () => {
      if (participantIntervalRef.current) {
        clearInterval(participantIntervalRef.current);
      }
    };
  }, [currentStep]);

  // Derive join URL
  const joinUrl =
    typeof window !== "undefined" && selectedPoll
      ? `${window.location.origin}/join/?code=${selectedPoll.cube1.user.joinCode}&sim=1`
      : "";

  const handleCopyCode = useCallback(() => {
    if (!selectedPoll) return;
    navigator.clipboard.writeText(selectedPoll.cube1.user.joinCode);
    toast({ title: "Code copied!" });
  }, [selectedPoll]);

  const handleCopyLink = useCallback(() => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    toast({ title: "Link copied!" });
  }, [joinUrl]);

  // ── Session picker (no poll selected) ──────────────────────────
  if (!selectedPoll) {
    return (
      <div className="w-full max-w-lg flex flex-col gap-4">
        <div className="text-center mb-2">
          <h2 className="text-lg font-semibold">
            {t("cube10.sim.select_session")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("cube10.sim.select_session_desc")}
          </p>
        </div>

        {ALL_SIM_POLLS.map((poll, i) => (
          <Card
            key={poll.sessionId}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => handleSelectPoll(poll)}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
              >
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{poll.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {poll.pollingMode === "live_interactive" ? (
                    <span className="flex items-center gap-1 text-[10px] text-green-400">
                      <Radio className="h-2.5 w-2.5" />
                      {t("cube10.sim.live_poll")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400">
                      <Timer className="h-2.5 w-2.5" />
                      {t("cube10.sim.static_poll")}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {poll.questions.length} question{poll.questions.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={handleCreateNew} className="mt-2">
          <Plus className="mr-2 h-4 w-4" />
          {t("cube10.sim.create_new")}
        </Button>
      </div>
    );
  }

  // ── Active simulation view — resolve themes dynamically ────────
  const DEFAULT_ICONS = ["🚀", "⚠️", "⚖️", "💡", "🔬", "🔒", "🌐", "📊", "🎯"];
  const resolvedThemes: SimTheme[] = resolveThemesForLevel(selectedPoll, "theme2_9").map((th, i) => ({
    id: th.id,
    name: th.name,
    confidence: th.confidence,
    responseCount: th.count,
    color: th.color,
    icon: DEFAULT_ICONS[i] || "🎯",
    partition: th.partition,
  }));
  const themes = resolvedThemes;
  const totalResponseCount = themes.reduce((s, th) => s + th.responseCount, 0);

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      {/* Back to session picker */}
      <button
        onClick={handleCreateNew}
        className="self-start text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        &larr; {t("cube10.sim.select_session")}
      </button>

      {/* ── Transport Controls Bar ──────────────────────────────── */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${STEP_COLORS[currentStep]}`}
            >
              {selectedPoll.pollingMode === "live_interactive" ? (
                <Radio className="h-2.5 w-2.5" />
              ) : (
                <Timer className="h-2.5 w-2.5" />
              )}
              {STEP_LABELS[currentStep]}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {t("cube10.sim.transport_step")} {stepIndex + 1}/{steps.length}
            </span>
          </div>

          {/* Step progress dots */}
          <div className="flex gap-1 mb-3">
            {steps.map((step, i) => (
              <button
                key={`${step}-${i}`}
                onClick={() => {
                  setStepIndex(i);
                  setIsPlaying(false);
                }}
                className="h-1.5 flex-1 rounded-full transition-colors cursor-pointer"
                style={{
                  backgroundColor:
                    i < stepIndex
                      ? "#22C55E"
                      : i === stepIndex
                      ? accentColor
                      : "hsl(var(--muted))",
                }}
                title={STEP_LABELS[step]}
              />
            ))}
          </div>

          {/* Transport buttons */}
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={goToStart}
              disabled={stepIndex === 0}
              title={t("cube10.sim.jump_to_start")}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={goBack}
              disabled={stepIndex === 0}
            >
              <Rewind className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0 rounded-full"
              onClick={togglePlay}
              style={{ borderColor: accentColor }}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" style={{ color: accentColor }} />
              ) : (
                <Play className="h-4 w-4 ml-0.5" style={{ color: accentColor }} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={goForward}
              disabled={stepIndex >= steps.length - 1}
            >
              <FastForward className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={goToEnd}
              disabled={stepIndex >= steps.length - 1}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Session Card ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-muted-foreground font-mono">
                  {selectedPoll.pollingMode === "live_interactive"
                    ? "LIVE"
                    : "STATIC"}
                </span>
              </div>
              <CardTitle className="text-lg">{selectedPoll.title}</CardTitle>
              <CardDescription className="mt-1">
                [SIM] {t("cube10.sim.role_poller")}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 ml-4">
              <Users className="h-4 w-4" />
              <span className="font-mono">{participantCount}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {/* Session code */}
          <div className="rounded-md bg-muted px-4 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              {t("cube1.session.session_code")}
            </p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-mono font-bold tracking-wider">
                {selectedPoll.cube1.user.joinCode}
              </p>
              <button
                onClick={handleCopyCode}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* QR Code — visible in draft/open/polling */}
          {["draft", "open", "polling"].includes(currentStep) && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-lg border bg-white p-3">
                <QRCodeSVG value={joinUrl} size={160} level="M" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  <Copy className="mr-1.5 h-3 w-3" />
                  {t("cube1.moderator.share_link")}
                </Button>
              </div>
            </div>
          )}

          {/* Static poll countdown timer */}
          {selectedPoll.pollingMode === "static_poll" &&
            currentStep === "polling" && (
              <PollCountdownTimer
                endsAt={new Date(
                  Date.now() +
                    (selectedPoll.staticPollDurationDays ?? 3) *
                      24 *
                      60 *
                      60 *
                      1000
                ).toISOString()}
                totalDays={selectedPoll.staticPollDurationDays ?? 3}
                displayMode="both"
                accentColor={accentColor}
              />
            )}

          {/* Participant joining indicator — open state */}
          {currentStep === "open" && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span>{t("cube10.sim.participants_joining")}</span>
            </div>
          )}

          {/* Response feed during polling */}
          {currentStep === "polling" && simResponses.length > 0 && (
            <div className="rounded-lg border border-border">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">
                  {simResponses.length}/7 Responses
                </span>
              </div>
              <div className="space-y-0 max-h-36 overflow-y-auto">
                {simResponses.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 px-3 py-1.5 text-xs border-b border-border/50 last:border-0 animate-in fade-in slide-in-from-bottom-2"
                  >
                    <span className="font-medium text-primary shrink-0">
                      {r.user}
                    </span>
                    <span className="text-muted-foreground line-clamp-1">
                      {r.text}
                    </span>
                  </div>
                ))}
                <div ref={feedEndRef} />
              </div>
            </div>
          )}

          {/* Closed state (Live only — between polling and theming) */}
          {currentStep === "closed" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground font-medium">
                {t("cube10.sim.state_closed")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("cube10.sim.session_closed_msg")}
              </p>
            </div>
          )}

          {/* AI Theming indicator */}
          {currentStep === "theming" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm text-primary font-medium">
                Cube 6 — {t("cube10.sim.state_theming")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("cube10.sim.clustering_responses").replace("{0}", String(simResponses.length || 7))}
              </p>
            </div>
          )}

          {/* Theme Visuals */}
          {currentStep === "visuals" && (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-primary" />
                <p className="text-xs text-primary font-medium">
                  {t("cube10.sim.state_visuals")}
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center mb-2">
                {t("cube10.sim.responses_to_themes").replace("{0}", String(totalResponseCount)).replace("{1}", String(themes.length))}
              </p>
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="flex items-center gap-3 rounded-md border px-3 py-2"
                  style={{ borderColor: `${theme.color}40` }}
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: theme.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{theme.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {theme.responseCount.toLocaleString()} {t("cube10.sim.responses_count")} &middot;{" "}
                      {Math.round(theme.confidence * 100)}% {t("cube10.sim.confidence")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ranking state — show themed results */}
          {currentStep === "ranking" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center mb-2">
                {themes.length} {t("cube10.sim.themes_identified")} — {t("cube10.sim.ranked_by_priority")}
              </p>
              {themes.map((theme, i) => (
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
                    <p className="text-xs font-medium truncate">{theme.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {theme.responseCount.toLocaleString()} {t("cube10.sim.responses_count")} &middot;{" "}
                      {Math.round(theme.confidence * 100)}% {t("cube10.sim.confidence")}
                    </p>
                  </div>
                </div>
              ))}
              {/* Response Distribution Bar Chart */}
              <ThemeResultsChart themes={themes} totalResponses={totalResponseCount} />
            </div>
          )}

          {/* Archived state — final summary */}
          {currentStep === "archived" && (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="h-8 w-8 text-green-400" />
              <p className="text-sm font-medium">{t("cube10.sim.session_complete")}</p>
              <p className="text-xs text-muted-foreground text-center">
                {t("cube10.sim.final_stats").replace("{0}", String(totalResponseCount)).replace("{1}", String(themes.length))}
              </p>
              {/* Response Distribution Bar Chart */}
              <div className="w-full mt-2">
                <ThemeResultsChart themes={themes} totalResponses={totalResponseCount} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
