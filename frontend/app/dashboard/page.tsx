"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Users,
  Clock,
  ChevronRight,
  FileText,
  ListChecks,
  MessageSquare,
  QrCode,
  Play,
  Square,
  Archive,
  Copy,
  Maximize2,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";
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
import { SESSION_TYPES } from "@/lib/constants";
import type { Session, PaginatedResponse } from "@/lib/types";

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
  task: ListChecks,
  single_question: MessageSquare,
} as const;

// ── QR Presentation Mode ─────────────────────────────────────────

function QRPresentation({
  session,
  onClose,
}: {
  session: Session;
  onClose: () => void;
}) {
  const joinUrl =
    session.join_url ||
    `${typeof window !== "undefined" ? window.location.origin : ""}/join/?code=${session.short_code}`;

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
      <p className="text-muted-foreground mb-8">Scan to join this session</p>

      <div className="bg-white rounded-2xl p-6">
        <QRCodeSVG value={joinUrl} size={320} level="M" />
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Or enter code:</p>
        <p className="text-5xl font-mono font-bold tracking-[0.3em] text-primary">
          {session.short_code}
        </p>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{joinUrl}</p>
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
  const [presenting, setPresenting] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const joinUrl =
    session.join_url ||
    `${typeof window !== "undefined" ? window.location.origin : ""}/join/?code=${session.short_code}`;

  const handleTransition = async (action: string) => {
    setActionLoading(action);
    try {
      const updated = await api.post<Session>(
        `/sessions/${session.id}/${action}`
      );
      onUpdate(updated);
      toast({ title: `Session ${action === "poll" ? "polling started" : action + "ed"}` });
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
          &larr; Back to sessions
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

          {/* Session controls */}
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
                Open Session
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
                Start Polling
              </Button>
            )}
            {session.status === "polling" && (
              <Button
                onClick={() => handleTransition("rank")}
                disabled={!!actionLoading}
              >
                Start Ranking
              </Button>
            )}
            {["open", "polling", "ranking"].includes(session.status) && (
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
                Close
              </Button>
            )}
            {session.status === "closed" && (
              <Button
                variant="outline"
                onClick={() => handleTransition("archive")}
                disabled={!!actionLoading}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </Button>
            )}
          </div>
        </div>

        {/* QR Code + Join Info */}
        {!["closed", "archived"].includes(session.status) && (
          <Card className="mb-6">
            <CardContent className="flex flex-col sm:flex-row items-center gap-6 p-6">
              <div className="bg-white rounded-xl p-3">
                <QRCodeSVG value={joinUrl} size={160} level="M" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Session Code</p>
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
                  <p className="text-xs text-muted-foreground mb-1">Join Link</p>
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
                  Present QR
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Config Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Type</p>
                <p className="font-medium capitalize">{session.session_type?.replace("_", " ") || "Polling"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Anonymity</p>
                <p className="font-medium capitalize">{session.anonymity_mode}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">AI Provider</p>
                <p className="font-medium capitalize">{session.ai_provider}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Max Response</p>
                <p className="font-medium">{session.max_response_length} chars</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Pricing</p>
                <p className="font-medium capitalize">{(session.pricing_tier || "free").replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Reward</p>
                <p className="font-medium">
                  {session.reward_enabled
                    ? `$${((session.reward_amount_cents || 0) / 100).toFixed(2)}`
                    : "Off"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<string>("single_question");
  const [newAiProvider, setNewAiProvider] = useState("openai");
  const [newMaxResponse, setNewMaxResponse] = useState("500");
  const [newPricingTier, setNewPricingTier] = useState("free");
  const [newMaxParticipants, setNewMaxParticipants] = useState("");
  const [newRewardEnabled, setNewRewardEnabled] = useState(false);
  const [newRewardAmount, setNewRewardAmount] = useState("25");

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
        max_response_length: parseInt(newMaxResponse) || 500,
        pricing_tier: newPricingTier,
        max_participants: newMaxParticipants ? parseInt(newMaxParticipants) : null,
        reward_enabled: newRewardEnabled,
        reward_amount_cents: newRewardEnabled ? Math.round(parseFloat(newRewardAmount) * 100) : 0,
      });
      toast({ title: "Session created", description: `"${session.title}" is ready` });
      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewType("single_question");
      setNewAiProvider("openai");
      setNewMaxResponse("500");
      setNewPricingTier("free");
      setNewMaxParticipants("");
      setNewRewardEnabled(false);
      setNewRewardAmount("25");
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
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Session Facilitator Access
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Session</DialogTitle>
                <DialogDescription>
                  Set up a new polling session for your participants
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Session Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Q1 Strategy Feedback"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    placeholder="Brief description of this session"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Session Type</Label>
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

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>AI Provider</Label>
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
                    <Label htmlFor="maxResponse">Max Response Length</Label>
                    <Input
                      id="maxResponse"
                      type="number"
                      value={newMaxResponse}
                      onChange={(e) => setNewMaxResponse(e.target.value)}
                      min={50}
                      max={5000}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pricing Tier</Label>
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
                    <Label htmlFor="maxParticipants">Max Participants</Label>
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
                      <Label>Gamified Reward</Label>
                      <p className="text-xs text-muted-foreground">
                        Award top contributor by CQS
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
                      <Label htmlFor="rewardAmount">Reward Amount ($)</Label>
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
                  Cancel
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
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="rounded-lg bg-primary/10 p-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>No sessions yet</CardTitle>
              <CardDescription>
                Create your first polling session to get started
              </CardDescription>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Session
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => {
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
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              );
            })}
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
