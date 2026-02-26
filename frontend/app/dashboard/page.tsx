"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Users,
  Clock,
  ChevronRight,
  ChevronDown,
  FileText,
  ListChecks,
  MessageSquare,
  QrCode,
  Play,
  Square,
  Archive,
  Copy,
  Maximize2,
  Lock,
  Radio,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
import { FlowerVisualization } from "@/components/flower-of-life/flower-visualization";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api, ApiClientError } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { SESSION_TYPES, POLLING_MODES, STATIC_POLL_DURATIONS, TIMER_DISPLAY_MODES } from "@/lib/constants";
import { useLexicon } from "@/lib/lexicon-context";
import { useTheme } from "@/lib/theme-context";
import type { Session, PaginatedResponse, PollingModeType, TimerDisplayMode } from "@/lib/types";

function statusColor(status: string): string {
  switch (status) {
    case "open":
      return "text-green-400";
    case "polling":
      return "text-cyan-400";
    case "ranking":
      return "text-yellow-400";
    case "draft":
      return "text-muted-foreground";
    case "closed":
    case "archived":
      return "text-red-400";
    default:
      return "text-muted-foreground";
  }
}

function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

const SESSION_TYPE_ICONS = {
  project_series: FileText,
  multi_question: ListChecks,
  single_question: MessageSquare,
} as const;

/** Always derive join URL from current origin + short_code.
 *  Ignores stored session.join_url to avoid stale-origin mismatches
 *  between QR code and copy link. */
function getJoinUrl(session: Session): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/join/?code=${session.short_code}`;
}

// ── QR Presentation Mode ─────────────────────────────────────────

function QRPresentation({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const { t } = useLexicon();
  const joinUrl = getJoinUrl(session);

  const copyCode = () => {
    navigator.clipboard.writeText(session.short_code);
    toast({ title: "Code copied" });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast({ title: "Join link copied" });
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </Button>

      <h2 className="text-3xl font-bold mb-2">{session.title}</h2>
      <p className="text-muted-foreground mb-8">{t("cube1.moderator.scan_join")}</p>

      <div className="bg-white rounded-2xl p-6">
        <QRCodeSVG value={joinUrl} size={320} level="M" />
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">{t("cube1.moderator.or_enter_code")}</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-5xl font-mono font-bold tracking-[0.3em] text-primary">
            {session.short_code}
          </p>
          <Button variant="ghost" size="sm" onClick={copyCode} className="text-muted-foreground hover:text-primary">
            <Copy className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2">
        <p className="text-sm text-muted-foreground">{joinUrl}</p>
        <Button variant="ghost" size="sm" onClick={copyLink} className="text-muted-foreground hover:text-primary">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Session Detail Panel ─────────────────────────────────────────

function SessionDetail({
  session,
  onBack,
  onUpdate,
}: {
  session: Session;
  onBack: () => void;
  onUpdate: (s: Session) => void;
}) {
  const { t } = useLexicon();
  const [presenting, setPresenting] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [configExpanded, setConfigExpanded] = useState(false);
  const isLiveInteractive = (session.polling_mode_type ?? "live_interactive") === "live_interactive";
  const showQR = !["closed", "archived"].includes(session.status) &&
    (isLiveInteractive ? session.status !== "polling" : true);
  const showScrollingFeed = isLiveInteractive && session.status === "polling";
  const [feedExpanded, setFeedExpanded] = useState(false);
  const [feedResponses, setFeedResponses] = useState<Array<{ id: string; clean_text: string; submitted_at: string }>>([]);

  // Poll for live responses during polling state
  useEffect(() => {
    if (!showScrollingFeed) return;
    const fetchResponses = async () => {
      try {
        const data = await api.get<{ items: Array<{ id: string; clean_text: string; submitted_at: string }> }>(
          `/sessions/${session.id}/responses`
        );
        setFeedResponses((data.items || []).slice().reverse());
      } catch {
        // Silently fail
      }
    };
    fetchResponses();
    const interval = setInterval(fetchResponses, 3000);
    return () => clearInterval(interval);
  }, [showScrollingFeed, session.id]);

  const joinUrl = getJoinUrl(session);

  const handleTransition = async (action: string) => {
    setActionLoading(action);
    try {
      const updated = await api.post<Session>(
        `/sessions/${session.id}/${action}`
      );
      onUpdate(updated);
      const toastMessages: Record<string, string> = {
        start: "Session opened — share the QR code!",
        open: "Session opened",
        poll: "Polling started — participants can now respond",
        rank: "Ranking started — themes are being analyzed",
        close: "Session closed",
        archive: "Session archived",
      };
      toast({ title: toastMessages[action] || `Session ${action}ed` });
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast({ title: "Action failed", description: err.detail, variant: "destructive" });
      }
    } finally {
      setActionLoading("");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(session.short_code);
    toast({ title: "Code copied" });
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast({ title: "Join link copied" });
  };

  return (
    <>
      {presenting && (
        <QRPresentation session={session} onClose={() => setPresenting(false)} />
      )}

      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          &larr; {t("cube1.moderator.back_sessions")}
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">{session.title}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-sm font-medium ${statusColor(session.status)}`}>
                {statusLabel(session.status)}
              </span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {session.participant_count ?? 0}
              </span>
            </div>
          </div>

          {/* Session controls — Static polls auto-close at deadline, no manual rank/close */}
          <div className="flex items-center gap-2">
            {session.status === "draft" && (
              <Button
                onClick={() => handleTransition("start")}
                disabled={!!actionLoading}
              >
                {actionLoading === "start" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {t("cube1.moderator.open_session")}
              </Button>
            )}
            {session.status === "open" && (
              <Button
                onClick={() => handleTransition("poll")}
                disabled={!!actionLoading}
              >
                {actionLoading === "poll" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {t("cube1.moderator.start_polling")}
              </Button>
            )}
            {/* Start Ranking — live polls only (static polls auto-advance) */}
            {session.status === "polling" && isLiveInteractive && (
              <Button
                onClick={() => handleTransition("rank")}
                disabled={!!actionLoading}
              >
                {t("cube1.moderator.start_ranking")}
              </Button>
            )}
            {/* Close — live polls only (static polls close at ends_at deadline) */}
            {["open", "polling", "ranking"].includes(session.status) && isLiveInteractive && (
              <Button
                variant="destructive"
                onClick={() => handleTransition("close")}
                disabled={!!actionLoading}
              >
                {actionLoading === "close" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                {t("cube1.moderator.close_label")}
              </Button>
            )}
            {session.status === "closed" && (
              <Button
                variant="outline"
                onClick={() => handleTransition("archive")}
                disabled={!!actionLoading}
              >
                <Archive className="mr-2 h-4 w-4" />
                {t("cube1.moderator.archive_label")}
              </Button>
            )}
          </div>
        </div>

        {/* Static poll deadline notice — moderator sees when poll auto-closes */}
        {!isLiveInteractive && session.status === "polling" && session.ends_at && (
          <div className="flex items-center gap-2 mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-2.5">
            <Timer className="h-4 w-4 text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300">
              {t("cube1.timer.poll_ends")}{" "}
              <span className="font-semibold font-mono">
                {new Date(session.ends_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                {t("cube1.timer.at")}{" "}
                {new Date(session.ends_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            </p>
          </div>
        )}

        {/* QR Code + Join Info (hides during live polling, stays for static) */}
        {showQR && (
          <Card className="mb-6">
            <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
              <div className="bg-white rounded-xl p-3">
                <QRCodeSVG value={joinUrl} size={160} level="M" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("cube1.session.session_code")}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono font-bold tracking-wider">
                      {session.short_code}
                    </span>
                    <Button variant="ghost" size="sm" onClick={copyCode}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t("cube1.moderator.join_link")}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary truncate max-w-[280px]">
                      {joinUrl}
                    </span>
                    <Button variant="ghost" size="sm" onClick={copyLink}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setPresenting(true)}>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  {t("cube1.moderator.present_qr")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scrolling 33-word summary feed (replaces QR during live polling) */}
        {showScrollingFeed && (
          <Card className="mb-6 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary animate-pulse" />
                {t("cube1.moderator.live_feed")}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFeedExpanded(!feedExpanded)}
                className="h-7 px-2"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {feedResponses.length === 0 ? (
                <div
                  className="flex items-center justify-center text-muted-foreground text-sm"
                  style={{ height: 120 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Radio className="h-5 w-5 animate-pulse" />
                    <span>{t("cube1.moderator.waiting_responses")}</span>
                  </div>
                </div>
              ) : (
                <div
                  className="overflow-y-auto divide-y divide-border"
                  style={{ maxHeight: feedExpanded ? 500 : 200 }}
                >
                  {feedResponses.map((r) => (
                    <div key={r.id} className="px-4 py-3 text-sm">
                      <p className="text-foreground leading-relaxed">{r.clean_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(r.submitted_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Flower of Life Theme Visualization (closed/archived sessions) */}
        {["closed", "archived"].includes(session.status) && (
          <FlowerVisualization
            sessionId={session.id}
            sessionTitle={session.title}
            isPaidTier={session.pricing_tier !== "free"}
          />
        )}

        {/* Session Config Summary — Collapsed by default */}
        <Card>
          <button
            onClick={() => setConfigExpanded(!configExpanded)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <span className="text-base font-semibold leading-none tracking-tight">
              {t("cube1.moderator.configuration")}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                configExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
          {configExpanded && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">{t("cube1.moderator.type_label")}</p>
                  <p className="font-medium capitalize">{session.session_type?.replace("_", " ") || "Polling"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("cube1.moderator.polling_mode")}</p>
                  <p className="font-medium capitalize">{(session.polling_mode_type ?? "live_interactive").replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("cube1.moderator.anonymity_label")}</p>
                  <p className="font-medium capitalize">{session.anonymity_mode}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("cube1.moderator.ai_provider")}</p>
                  <p className="font-medium capitalize">{session.ai_provider}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("cube1.moderator.max_response_config")}</p>
                  <p className="font-medium">{session.max_response_length} {t("shared.nav.chars")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("cube1.moderator.pricing_config")}</p>
                  <p className="font-medium capitalize">{(session.pricing_tier || "free").replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">{t("cube1.moderator.reward_config")}</p>
                  <p className="font-medium">
                    {session.reward_enabled
                      ? `$${((session.reward_amount_cents || 0) / 100).toFixed(2)}`
                      : t("shared.nav.off")}
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────

function DashboardContent() {
  const { t } = useLexicon();
  const { currentTheme } = useTheme();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [archiveExpanded, setArchiveExpanded] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Split sessions: active (non-archived) and archived
  const activeSessions = sessions.filter((s) => s.status !== "archived");
  const archivedSessions = sessions.filter((s) => s.status === "archived");

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<string>("single_question");
  const [newAiProvider, setNewAiProvider] = useState("openai");
  const [newMaxResponse, setNewMaxResponse] = useState("3333");
  const [newPricingTier, setNewPricingTier] = useState("free");
  const [newMaxParticipants, setNewMaxParticipants] = useState("");
  const [newRewardEnabled, setNewRewardEnabled] = useState(false);
  const [newRewardAmount, setNewRewardAmount] = useState("25");
  const [newPollingModeType, setNewPollingModeType] = useState<PollingModeType>("live_interactive");
  const [newStaticPollDuration, setNewStaticPollDuration] = useState(1);
  const [newTimerDisplayMode, setNewTimerDisplayMode] = useState<TimerDisplayMode>("flex");

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.get<PaginatedResponse<Session>>("/sessions", {
        params: { limit: 50, offset: 0 },
      });
      setSessions(data.items);
    } catch (err) {
      try {
        const data = await api.get<Session[]>("/sessions");
        setSessions(Array.isArray(data) ? data : []);
      } catch {
        if (err instanceof ApiClientError && err.status !== 401) {
          toast({
            title: "Failed to load sessions",
            description: "Could not fetch your sessions. Please try again.",
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const session = await api.post<Session>("/sessions", {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        cycle_mode: newType === "project_series" ? "multi" : "single",
        ai_provider: newAiProvider,
        max_response_length: parseInt(newMaxResponse) || 3333,
        pricing_tier: newPricingTier,
        max_participants: newMaxParticipants ? parseInt(newMaxParticipants) : null,
        reward_enabled: newRewardEnabled,
        reward_amount_cents: newRewardEnabled ? Math.round(parseFloat(newRewardAmount) * 100) : 0,
        polling_mode_type: newPollingModeType,
        static_poll_duration_days: newPollingModeType === "static_poll" ? newStaticPollDuration : null,
        timer_display_mode: newTimerDisplayMode,
      });
      toast({ title: "Session created", description: `"${session.title}" is ready` });
      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewType("single_question");
      setNewAiProvider("openai");
      setNewMaxResponse("3333");
      setNewPricingTier("free");
      setNewMaxParticipants("");
      setNewRewardEnabled(false);
      setNewRewardAmount("25");
      setNewPollingModeType("live_interactive");
      setNewStaticPollDuration(1);
      setNewTimerDisplayMode("flex");
      fetchSessions();
      setSelectedSession(session);
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast({
          title: "Failed to create session",
          description: err.detail,
          variant: "destructive",
        });
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSessionUpdate = (updated: Session) => {
    setSelectedSession(updated);
    setSessions((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleDeleteSession = async (sessionId: string) => {
    setDeletingId(sessionId);
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast({ title: "Session deleted permanently" });
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast({ title: "Delete failed", description: err.detail, variant: "destructive" });
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Detail view
  if (selectedSession) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="container py-8">
          <SessionDetail
            session={selectedSession}
            onBack={() => {
              setSelectedSession(null);
              fetchSessions();
            }}
            onUpdate={handleSessionUpdate}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{t("cube1.moderator.dashboard_title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("cube1.moderator.facilitator_access")}
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("cube1.moderator.create_session")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("cube1.moderator.create_new")}</DialogTitle>
                <DialogDescription>
                  {t("cube1.moderator.create_new_desc")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("cube1.moderator.session_title")}</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Q1 Strategy Feedback"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("cube1.moderator.description_label")}</Label>
                  <Input
                    id="description"
                    placeholder="What outcome do you want from this session?"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t("cube1.moderator.session_type")}</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SESSION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {SESSION_TYPES.find((t) => t.value === newType)?.description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t("cube1.moderator.polling_mode")}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {POLLING_MODES.map((mode) => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setNewPollingModeType(mode.value)}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                          newPollingModeType === mode.value
                            ? "border-primary bg-accent/30"
                            : "border-border hover:bg-accent/20"
                        }`}
                      >
                        <span className="flex items-center gap-1.5 text-sm font-medium">
                          {mode.value === "live_interactive" ? (
                            <Radio className="h-3.5 w-3.5" />
                          ) : (
                            <Timer className="h-3.5 w-3.5" />
                          )}
                          {mode.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {mode.description}
                        </span>
                      </button>
                    ))}
                  </div>
                  {newPollingModeType === "static_poll" && (
                    <div className="space-y-2 pt-2">
                      <Label>{t("cube1.moderator.poll_duration")}</Label>
                      <div className="flex gap-2">
                        {STATIC_POLL_DURATIONS.map((d) => {
                          const isLocked = d.locked && newPricingTier === "free";
                          return (
                            <button
                              key={d.value}
                              type="button"
                              disabled={isLocked}
                              onClick={() => !isLocked && setNewStaticPollDuration(d.value)}
                              className={`flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                                newStaticPollDuration === d.value
                                  ? "border-primary bg-accent/30 font-medium"
                                  : isLocked
                                  ? "border-border opacity-40 cursor-not-allowed"
                                  : "border-border hover:bg-accent/20"
                              }`}
                            >
                              {d.label}
                              {isLocked && <Lock className="h-3 w-3 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                      <Label>{t("cube1.moderator.timer_display")}</Label>
                      <div className="flex gap-2">
                        {TIMER_DISPLAY_MODES.map((mode) => (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() => setNewTimerDisplayMode(mode.value)}
                            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                              newTimerDisplayMode === mode.value
                                ? "border-primary bg-accent/30 font-medium"
                                : "border-border hover:bg-accent/20"
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("cube1.moderator.ai_provider")}</Label>
                    <Select value={newAiProvider} onValueChange={setNewAiProvider}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="grok">Grok (xAI)</SelectItem>
                        <SelectItem value="gemini">Gemini</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxResponse">{t("cube1.moderator.max_response_label")}</Label>
                    <Input
                      id="maxResponse"
                      type="number"
                      value={newMaxResponse}
                      onChange={(e) => setNewMaxResponse(e.target.value)}
                      min={50}
                      max={3333}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("cube1.moderator.pricing_tier")}</Label>
                    <Select value={newPricingTier} onValueChange={setNewPricingTier}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free (max 19)</SelectItem>
                        <SelectItem value="moderator_paid">Moderator Paid</SelectItem>
                        <SelectItem value="cost_split">Cost Split</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">{t("cube1.moderator.max_participants_label")}</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      placeholder="Unlimited"
                      value={newMaxParticipants}
                      onChange={(e) => setNewMaxParticipants(e.target.value)}
                      min={1}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{t("cube1.moderator.gamified_reward")}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t("cube1.moderator.reward_cqs")}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={newRewardEnabled}
                      onClick={() => setNewRewardEnabled(!newRewardEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        newRewardEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-background shadow-lg transition-transform ${
                          newRewardEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {newRewardEnabled && (
                    <div className="space-y-2">
                      <Label htmlFor="rewardAmount">{t("cube1.moderator.reward_amount_label")}</Label>
                      <Input
                        id="rewardAmount"
                        type="number"
                        value={newRewardAmount}
                        onChange={(e) => setNewRewardAmount(e.target.value)}
                        min={1}
                        step={0.01}
                      />
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  {t("shared.nav.cancel")}
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || creating}
                >
                  {creating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {t("cube1.moderator.create_session")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sessions List — active (non-archived) sessions */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeSessions.length === 0 && archivedSessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="rounded-lg bg-primary/10 p-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>{t("cube1.moderator.no_sessions")}</CardTitle>
              <CardDescription>
                {t("cube1.moderator.create_first")}
              </CardDescription>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("cube1.moderator.create_session")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {activeSessions.length > 0 && (
              <div className="grid gap-4">
                {activeSessions.map((session) => {
                  const TypeIcon =
                    session.cycle_mode === "multi"
                      ? SESSION_TYPE_ICONS.project_series
                      : SESSION_TYPE_ICONS.single_question;
                  return (
                    <Card
                      key={session.id}
                      className="cursor-pointer transition-colors hover:bg-card/80"
                      onClick={() => setSelectedSession(session)}
                    >
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="rounded-lg bg-primary/10 p-2.5">
                          <TypeIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium truncate">
                              {session.title}
                            </h3>
                            <span
                              className={`text-xs font-medium ${statusColor(
                                session.status
                              )}`}
                            >
                              {statusLabel(session.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {session.participant_count ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {new Date(session.created_at).toLocaleDateString()}
                            </span>
                            <span className="font-mono text-xs">
                              {session.short_code}
                            </span>
                            {(session.polling_mode_type ?? "live_interactive") === "static_poll" ? (
                              <span className="flex items-center gap-1 text-xs" style={{ color: currentTheme.swatch }}>
                                <Timer className="h-3 w-3" />
                                {t("cube1.moderator.mode_static")}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs" style={{ color: currentTheme.swatch }}>
                                <Radio className="h-3 w-3" />
                                {t("cube1.moderator.mode_live")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Permanently delete "${session.title}"? This cannot be undone.`)) {
                              handleDeleteSession(session.id);
                            }
                          }}
                          disabled={deletingId === session.id}
                        >
                          {deletingId === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {activeSessions.length === 0 && archivedSessions.length > 0 && (
              <p className="text-center text-muted-foreground py-8">
                No active sessions. Check the archive below.
              </p>
            )}

            {/* Archived sessions — collapsed by default */}
            {archivedSessions.length > 0 && (
              <div>
                <button
                  onClick={() => setArchiveExpanded(!archiveExpanded)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                >
                  <Archive className="h-4 w-4" />
                  <span>Archived ({archivedSessions.length})</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${archiveExpanded ? "rotate-180" : ""}`}
                  />
                </button>
                {archiveExpanded && (
                  <div className="grid gap-3 opacity-60">
                    {archivedSessions.map((session) => {
                      const TypeIcon =
                        session.cycle_mode === "multi"
                          ? SESSION_TYPE_ICONS.project_series
                          : SESSION_TYPE_ICONS.single_question;
                      return (
                        <Card
                          key={session.id}
                          className="cursor-pointer transition-colors hover:bg-card/80"
                          onClick={() => setSelectedSession(session)}
                        >
                          <CardContent className="flex items-center gap-4 p-3">
                            <div className="rounded-lg bg-muted p-2">
                              <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-sm truncate">
                                  {session.title}
                                </h3>
                                <span className="text-xs font-medium text-red-400">
                                  Archived
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {session.participant_count ?? 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(session.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Permanently delete "${session.title}"? This cannot be undone.`)) {
                                  handleDeleteSession(session.id);
                                }
                              }}
                              disabled={deletingId === session.id}
                            >
                              {deletingId === session.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
