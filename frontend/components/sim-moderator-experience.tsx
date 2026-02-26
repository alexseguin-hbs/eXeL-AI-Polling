"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  QrCode,
  Play,
  Square,
  Archive,
  Clock,
  CheckCircle2,
  Copy,
  Radio,
  Timer,
  Loader2,
  MessageSquare,
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
import { toast } from "@/components/ui/use-toast";

// ── Simulated session state machine ─────────────────────────────

type SimSessionStatus = "draft" | "open" | "polling" | "ranking" | "closed" | "archived";

interface SimSessionState {
  title: string;
  status: SimSessionStatus;
  shortCode: string;
  participantCount: number;
  pollingModeType: "live_interactive" | "static_poll";
  staticPollDurationDays: number;
  endsAt: string | null;
  openedAt: string | null;
  closedAt: string | null;
}

const STATUS_LABELS: Record<SimSessionStatus, string> = {
  draft: "Draft",
  open: "Open",
  polling: "Polling",
  ranking: "Ranking",
  closed: "Closed",
  archived: "Archived",
};

const STATUS_COLORS: Record<SimSessionStatus, string> = {
  draft: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  open: "bg-green-500/20 text-green-400 border-green-500/40",
  polling: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  ranking: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  closed: "bg-gray-500/20 text-gray-400 border-gray-500/40",
  archived: "bg-gray-500/20 text-gray-500 border-gray-500/40",
};

function generateSimShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── State transition map (valid next transitions) ───────────────

const NEXT_TRANSITIONS: Record<SimSessionStatus, { action: string; nextStatus: SimSessionStatus } | null> = {
  draft: { action: "Open Session", nextStatus: "open" },
  open: { action: "Start Polling", nextStatus: "polling" },
  polling: { action: "Start Ranking", nextStatus: "ranking" },
  ranking: { action: "Close Session", nextStatus: "closed" },
  closed: { action: "Archive", nextStatus: "archived" },
  archived: null,
};

// ── 7 simulated AI participant responses ────────────────────────
const SIM_RESPONSES = [
  { user: "Participant 1", text: "AI can democratize decision-making by processing millions of voices simultaneously." },
  { user: "Participant 2", text: "My biggest concern is algorithmic bias perpetuating historical inequality." },
  { user: "Participant 3", text: "Transparency is key — every AI decision needs an explainable audit trail." },
  { user: "Participant 4", text: "We need hybrid systems — AI processes data, humans make final decisions." },
  { user: "Participant 5", text: "AI governance means policies can adapt to feedback in hours, not years." },
  { user: "Participant 6", text: "Privacy is #1 — governance AI will access massive citizen data." },
  { user: "Participant 7", text: "Start with low-stakes decisions before scaling to critical governance areas." },
];

const SIM_THEMES_MODERATOR = [
  { name: "Opportunity & Innovation", count: 3, confidence: 92, color: "#22C55E" },
  { name: "Risk & Concerns", count: 2, confidence: 88, color: "#EF4444" },
  { name: "Balanced / Hybrid Approach", count: 2, confidence: 85, color: "#3B82F6" },
];

export function SimModeratorExperience() {
  const { t } = useLexicon();
  const { currentTheme } = useTheme();
  const accentColor = currentTheme.swatch;

  const [simType, setSimType] = useState<"live_interactive" | "static_poll">("live_interactive");
  const [session, setSession] = useState<SimSessionState | null>(null);
  const [autoAdvancing, setAutoAdvancing] = useState(false);
  const [simResponses, setSimResponses] = useState<typeof SIM_RESPONSES>([]);
  const [simTheming, setSimTheming] = useState(false);
  const participantIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create a new simulated session
  const handleCreateSession = useCallback(() => {
    const shortCode = generateSimShortCode();
    setSession({
      title: simType === "live_interactive"
        ? "Live Team Brainstorm"
        : "3-Day Innovation Challenge",
      status: "draft",
      shortCode,
      participantCount: 0,
      pollingModeType: simType,
      staticPollDurationDays: 3,
      endsAt: null,
      openedAt: null,
      closedAt: null,
    });
    toast({ title: "Session created (SIM)" });
  }, [simType]);

  // Transition session to next state
  const handleTransition = useCallback(() => {
    if (!session) return;
    const transition = NEXT_TRANSITIONS[session.status];
    if (!transition) return;

    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, status: transition.nextStatus };
      if (transition.nextStatus === "open") {
        updated.openedAt = new Date().toISOString();
      }
      if (transition.nextStatus === "polling" && prev.pollingModeType === "static_poll") {
        updated.endsAt = new Date(Date.now() + prev.staticPollDurationDays * 24 * 60 * 60 * 1000).toISOString();
      }
      if (transition.nextStatus === "closed") {
        updated.closedAt = new Date().toISOString();
      }
      return updated;
    });
    toast({ title: `${transition.action} (SIM)` });
  }, [session]);

  // Auto-advance through all states
  const handleAutoAdvance = useCallback(() => {
    if (!session || autoAdvancing) return;
    setAutoAdvancing(true);
  }, [session, autoAdvancing]);

  // Auto-advance effect
  useEffect(() => {
    if (!autoAdvancing || !session) return;
    const transition = NEXT_TRANSITIONS[session.status];
    if (!transition) {
      setAutoAdvancing(false);
      return;
    }
    const timer = setTimeout(() => {
      handleTransition();
    }, 1500);
    return () => clearTimeout(timer);
  }, [autoAdvancing, session, handleTransition]);

  // Simulate 7 AI responses arriving during polling
  useEffect(() => {
    if (session?.status !== "polling") {
      setSimResponses([]);
      return;
    }
    const timers = SIM_RESPONSES.map((r, i) =>
      setTimeout(() => {
        setSimResponses((prev) => prev.length > i ? prev : [...prev, r]);
      }, 2000 + i * 2500)
    );
    return () => timers.forEach(clearTimeout);
  }, [session?.status]);

  // Auto-theming when transitioning to ranking
  useEffect(() => {
    if (session?.status === "ranking") {
      setSimTheming(true);
      const timer = setTimeout(() => setSimTheming(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [session?.status]);

  // Simulate participants joining when session is open
  useEffect(() => {
    if (session?.status === "open" || session?.status === "polling") {
      participantIntervalRef.current = setInterval(() => {
        setSession((prev) => {
          if (!prev) return prev;
          return { ...prev, participantCount: prev.participantCount + Math.floor(Math.random() * 3) + 1 };
        });
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
  }, [session?.status]);

  const joinUrl = typeof window !== "undefined" && session
    ? `${window.location.origin}/join/?code=${session.shortCode}`
    : "";

  const handleCopyCode = useCallback(() => {
    if (!session) return;
    navigator.clipboard.writeText(session.shortCode);
    toast({ title: "Code copied!" });
  }, [session]);

  const handleCopyLink = useCallback(() => {
    if (!joinUrl) return;
    navigator.clipboard.writeText(joinUrl);
    toast({ title: "Link copied!" });
  }, [joinUrl]);

  const transition = session ? NEXT_TRANSITIONS[session.status] : null;

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      {/* Sim type toggle */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground">{t("cube10.sim.sim_type")}:</span>
        <button
          onClick={() => { setSimType("live_interactive"); setSession(null); }}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
            simType === "live_interactive"
              ? "border-primary bg-accent/30 font-medium text-foreground"
              : "border-border hover:bg-accent/20 text-muted-foreground"
          }`}
        >
          <Radio className="h-3 w-3" />
          {t("cube10.sim.live_poll")}
        </button>
        <button
          onClick={() => { setSimType("static_poll"); setSession(null); }}
          className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs transition-colors ${
            simType === "static_poll"
              ? "border-primary bg-accent/30 font-medium text-foreground"
              : "border-border hover:bg-accent/20 text-muted-foreground"
          }`}
        >
          <Timer className="h-3 w-3" />
          {t("cube10.sim.static_poll")}
        </button>
      </div>

      {/* Create session button — shown when no session exists */}
      {!session && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <QrCode className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              {t("cube10.sim.role_poller")} — {t("cube10.sim.sim_type")}
            </p>
            <Button onClick={handleCreateSession}>
              <Play className="mr-2 h-4 w-4" />
              {t("cube10.sim.create_session")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Session card — shown after creation */}
      {session && (
        <>
          {/* Status + title header */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[session.status]}`}
                    >
                      {session.pollingModeType === "live_interactive" ? (
                        <Radio className="h-2.5 w-2.5" />
                      ) : (
                        <Timer className="h-2.5 w-2.5" />
                      )}
                      {STATUS_LABELS[session.status]}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {session.pollingModeType === "live_interactive" ? "LIVE" : "STATIC"}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{session.title}</CardTitle>
                  <CardDescription className="mt-1">
                    [SIM] {t("cube10.sim.role_poller")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0 ml-4">
                  <Users className="h-4 w-4" />
                  <span className="font-mono">{session.participantCount}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4">
              {/* Session code */}
              <div className="rounded-md bg-muted px-4 py-2 text-center">
                <p className="text-xs text-muted-foreground">Session Code</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg font-mono font-bold tracking-wider">
                    {session.shortCode}
                  </p>
                  <button onClick={handleCopyCode} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* QR Code — visible in draft/open/polling */}
              {["draft", "open", "polling"].includes(session.status) && (
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-lg border bg-white p-3">
                    <QRCodeSVG value={joinUrl} size={160} level="M" />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                      <Copy className="mr-1.5 h-3 w-3" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              )}

              {/* Static poll deadline notice */}
              {session.pollingModeType === "static_poll" && session.status === "polling" && session.endsAt && (
                <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-center">
                  <p className="text-xs text-yellow-400">
                    Poll ends: {new Date(session.endsAt).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Participant joining indicator */}
              {session.status === "open" && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  <span>{t("cube10.sim.participants_joining")}</span>
                </div>
              )}

              {/* Response feed during polling */}
              {session.status === "polling" && simResponses.length > 0 && (
                <div className="rounded-lg border border-border">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium">{simResponses.length}/7 Responses</span>
                  </div>
                  <div className="space-y-0 max-h-36 overflow-y-auto">
                    {simResponses.map((r, i) => (
                      <div key={i} className="flex items-start gap-2 px-3 py-1.5 text-xs border-b border-border/50 last:border-0">
                        <span className="font-medium text-primary shrink-0">{r.user}</span>
                        <span className="text-muted-foreground line-clamp-1">{r.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Theming indicator during ranking transition */}
              {session.status === "ranking" && simTheming && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-primary font-medium">Cube 6 — AI Theming...</p>
                </div>
              )}

              {/* Themed results during ranking */}
              {session.status === "ranking" && !simTheming && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center mb-2">3 themes identified from 7 responses</p>
                  {SIM_THEMES_MODERATOR.map((theme, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-md border px-3 py-2" style={{ borderColor: `${theme.color}40` }}>
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: theme.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{theme.name}</p>
                        <p className="text-[10px] text-muted-foreground">{theme.count} responses · {theme.confidence}% confidence</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Closed/archived state */}
              {(session.status === "closed" || session.status === "archived") && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                  <p className="text-sm font-medium">Session Complete</p>
                  <p className="text-xs text-muted-foreground text-center">7 responses · 3 themes · Rankings submitted</p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                {transition && (
                  <Button
                    className="flex-1"
                    onClick={handleTransition}
                    disabled={autoAdvancing}
                    style={{ borderColor: accentColor }}
                  >
                    {transition.nextStatus === "open" && <Play className="mr-2 h-4 w-4" />}
                    {transition.nextStatus === "polling" && <Radio className="mr-2 h-4 w-4" />}
                    {transition.nextStatus === "ranking" && <Square className="mr-2 h-4 w-4" />}
                    {transition.nextStatus === "closed" && <Square className="mr-2 h-4 w-4" />}
                    {transition.nextStatus === "archived" && <Archive className="mr-2 h-4 w-4" />}
                    {transition.action}
                  </Button>
                )}
                {session.status !== "archived" && !autoAdvancing && (
                  <Button
                    variant="outline"
                    onClick={handleAutoAdvance}
                    disabled={!transition}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {t("cube10.sim.auto_advancing")}
                  </Button>
                )}
              </div>

              {/* Auto-advancing indicator */}
              {autoAdvancing && (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                  <span>{t("cube10.sim.auto_advancing")}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
