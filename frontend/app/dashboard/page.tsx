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
} from "lucide-react";
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

function DashboardContent() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newType, setNewType] = useState<string>("single_question");

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.get<PaginatedResponse<Session>>("/sessions", {
        params: { limit: 50, offset: 0 },
      });
      setSessions(data.items);
    } catch (err) {
      // If paginated response fails, try list response
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
      });
      toast({ title: "Session created", description: `"${session.title}" is ready` });
      setCreateOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNewType("single_question");
      fetchSessions();
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your polling sessions
            </p>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Session
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                          <span className="flex items-center gap-2">
                            {t.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {SESSION_TYPES.find((t) => t.value === newType)?.description}
                  </p>
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
                  onClick={() =>
                    router.push(`/session/?id=${session.id}`)
                  }
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
