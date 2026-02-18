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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { Session, Question } from "@/lib/types";

export function SessionView() {
  const searchParams = useSearchParams();
  // Read session ID from query param: /session/?id=abc-123
  const sessionId = searchParams.get("id") || "";

  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Response input
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
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
  }, [sessionId]);

  useEffect(() => {
    if (!session || session.status !== "polling") return;
    api
      .get<Question[]>(`/sessions/${sessionId}/questions`)
      .then(setQuestions)
      .catch(() => {});
  }, [session, sessionId]);

  // Poll participant count
  useEffect(() => {
    if (!sessionId || !session) return;
    const isActive = ["open", "polling", "ranking"].includes(session.status);
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
  }, [sessionId, session]);

  // Poll session status
  useEffect(() => {
    if (!sessionId || !session) return;
    const isActive = ["open", "polling", "ranking"].includes(session.status);
    if (!isActive) return;

    const interval = setInterval(async () => {
      try {
        const data = await api.get<Session>(`/sessions/${sessionId}`);
        if (data.status !== session.status) {
          setSession(data);
        }
      } catch {
        // Silently fail
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId, session]);

  const handleSubmitResponse = useCallback(async () => {
    if (!responseText.trim() || !questions.length) return;
    setSubmitting(true);
    try {
      await api.post(`/sessions/${sessionId}/responses`, {
        question_id: questions[0].id,
        response_text: responseText.trim(),
      });
      setSubmitted(true);
      setResponseText("");
      toast({ title: "Response submitted" });
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
  }, [responseText, questions, sessionId]);

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
                Back to home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar sessionTitle={session?.title} />

      <main className="container flex flex-1 flex-col items-center py-8 px-4">
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
              <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-6 py-4">
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-3xl font-bold text-primary">
                    {participantCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    participants joined
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Waiting for moderator to start polling...</span>
              </div>

              <div className="rounded-md bg-muted px-4 py-2">
                <p className="text-xs text-muted-foreground">Session Code</p>
                <p className="text-lg font-mono font-bold tracking-wider">
                  {session.short_code}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Polling state */}
        {session?.status === "polling" && (
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {questions.length > 0
                    ? questions[0].question_text
                    : "Waiting for question..."}
                </CardTitle>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {participantCount}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="flex flex-col items-center gap-4 py-8">
                  <CheckCircle2 className="h-12 w-12 text-green-400" />
                  <p className="font-medium">Response submitted!</p>
                  <p className="text-sm text-muted-foreground">
                    Waiting for other participants...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Input
                      placeholder="Type your response..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      maxLength={session.max_response_length || 500}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitResponse();
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {responseText.length}/
                      {session.max_response_length || 500}
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmitResponse}
                    disabled={!responseText.trim() || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    Submit
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Ranking state */}
        {session?.status === "ranking" && (
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <CardTitle>Theme Voting</CardTitle>
              <CardDescription>
                Vote on the themes that emerged from responses
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{participantCount} participants</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Theme voting interface coming soon (Cube 7)
              </p>
            </CardContent>
          </Card>
        )}

        {/* Closed state */}
        {(session?.status === "closed" || session?.status === "archived") && (
          <Card className="w-full max-w-lg">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
              <CardTitle>Session Ended</CardTitle>
              <CardDescription className="text-center">
                This session has been closed. If you opted in for results,
                you&apos;ll receive them when they&apos;re ready.
              </CardDescription>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                Back to home
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
