"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, Globe, UserIcon, FileCheck, Radio, Zap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { LanguageSelector } from "@/components/language-selector";
import { useLexicon } from "@/lib/lexicon-context";
import { api, ApiClientError } from "@/lib/api";
import { hydrateSessionFromParams, fetchSessionFromKV, hydrateSessionFromKV, clearStaleMockState } from "@/lib/mock-data";
import { fetchStatusFromSupabase } from "@/lib/supabase-session-sync";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import type { Session, SessionJoinResponse } from "@/lib/types";

type JoinStep = "language" | "identity" | "results" | "joining";

export function JoinFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, setActiveLocale } = useLexicon();
  // Read code from query param: /join/?code=ABCD1234
  const code = searchParams.get("code")?.toUpperCase() || "";
  // Cross-device QR params: immutable session metadata encoded in URL for mock mode hydration
  const qrTitle = searchParams.get("t");
  const qrSid = searchParams.get("sid");
  const qrPm = searchParams.get("pm");
  const qrDur = searchParams.get("dur");
  // SIM mode flag: /join/?code=ABCD1234&sim=1 (from Cube 10 QR scan)
  const simMode = searchParams.get("sim") === "1";

  const [step, setStep] = useState<JoinStep>("language");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pollOpen, setPollOpen] = useState(false);
  // Store join response so we can redirect when polling starts
  const [joinResponse, setJoinResponse] = useState<SessionJoinResponse | null>(null);
  // Live participant count — updated by presence broadcasts
  const [participantCount, setParticipantCount] = useState<number>(0);

  // Form state
  const [language, setLanguage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joinAnonymously, setJoinAnonymously] = useState(false);
  const [resultsOptIn, setResultsOptIn] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);

    // Clear stale localStorage from previous visits so phone users
    // always get fresh session data from KV or URL params.
    clearStaleMockState();

    // Cross-device hydration chain:
    // 1. Try KV fetch (richest data, synced by moderator's device)
    // 2. Fall back to expanded URL params (sid, pm, dur)
    // 3. Fall back to basic URL params (title, status)
    const hydrateAndLoad = async () => {
      // Try KV fetch + Supabase DB in parallel for cross-device status (source of truth)
      const [kvData, sbData] = await Promise.allSettled([
        fetchSessionFromKV(code),
        fetchStatusFromSupabase(code),
      ]);
      const kv = kvData.status === "fulfilled" ? kvData.value : null;
      const sb = sbData.status === "fulfilled" ? sbData.value : null;

      if (kv && !("error" in kv)) {
        hydrateSessionFromKV(code, kv);
        const kvStatus = kv.status as string | undefined;
        if (kvStatus === "polling" || kvStatus === "ranking") setPollOpen(true);
      } else if (qrTitle) {
        // Fallback: hydrate from URL params — status defaults to "open" (lobby)
        // Participants wait in lobby until moderator clicks Start Polling
        hydrateSessionFromParams(code, qrTitle, "open", qrSid, qrPm, qrDur);
      }

      try {
        const data = await api.get<Session>(`/sessions/code/${code}`);
        setSession(data);
        setParticipantCount(data.participant_count ?? 0);
        if (!simMode && (data.status === "closed" || data.status === "archived")) {
          setError(t("cube1.join.session_ended"));
        } else if (!simMode && data.expires_at && new Date(data.expires_at) < new Date()) {
          setError(t("cube1.join.session_ended"));
        } else if (!simMode && (
          data.status === "polling" || data.status === "ranking" ||
          sb?.status === "polling" || sb?.status === "ranking"
        )) {
          // Polling already live — banner shows, handleJoin will redirect directly
          setPollOpen(true);
        }
      } catch (err) {
        if (err instanceof ApiClientError) {
          setError(err.detail);
        } else {
          setError("Failed to load session. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    hydrateAndLoad();
  }, [code, qrTitle, qrSid, qrPm, qrDur, simMode, t]);

  // Triple realtime listener — fires pollOpen the instant moderator clicks Start Polling.
  // broadcast "status"/"session_update": sub-50ms push (primary).
  // presence sync/join: persists state so phones subscribing AFTER polling started get it immediately.
  // postgres_changes: DB-level fallback (requires sessions table in Supabase).
  useEffect(() => {
    if (!code || !supabase) return;
    const channel = supabase.channel(`session:${code}`, {
      config: { presence: { key: `participant-${Math.random().toString(36).slice(2, 8)}` } },
    });

    const checkPresenceForPolling = () => {
      const state = channel.presenceState() as Record<string, Array<{ status?: string }>>;
      const active = Object.values(state).flat();
      if (active.some((e) => e.status === "polling" || e.status === "ranking")) {
        setPollOpen(true);
      }
    };

    channel
      .on(
        "postgres_changes" as Parameters<typeof channel.on>[0],
        { event: "UPDATE", schema: "public", table: "sessions", filter: `code=eq.${code}` },
        (payload: { new: { status?: string } }) => {
          const s = payload.new.status;
          if (s === "open" || s === "polling") setPollOpen(true);
        },
      )
      .on("broadcast", { event: "session_update" }, ({ payload }) => {
        const p = payload as { status?: string };
        if (p.status === "open" || p.status === "polling") setPollOpen(true);
      })
      .on("broadcast", { event: "status" }, ({ payload }) => {
        const p = payload as { status?: string };
        if (p.status === "polling") setPollOpen(true);
      })
      .on("broadcast", { event: "presence" }, ({ payload }) => {
        const p = payload as { participant_count?: number };
        // Take max to guard against out-of-order broadcasts lowering the count
        if (typeof p.participant_count === "number") {
          setParticipantCount((prev) => Math.max(prev, p.participant_count as number));
        }
      })
      // Presence sync — fires on subscribe with current state, catches moderator's tracked status
      .on("presence", { event: "sync" }, () => { checkPresenceForPolling(); })
      .on("presence", { event: "join" }, () => { checkPresenceForPolling(); })
      .subscribe();
    return () => { supabase?.removeChannel(channel); };
  }, [code]);

  // Auto-redirect to session when polling goes live AND participant has already joined
  useEffect(() => {
    if (!pollOpen || !joinResponse) return;
    const simSuffix = simMode ? "&sim=1" : "";
    router.push(
      `/session/?id=${joinResponse.session_id}&pid=${joinResponse.participant_id}&lang=${language || "en"}${simSuffix}`,
    );
  }, [pollOpen, joinResponse, simMode, language, router]);

  // 1s fallback poll — dual source: CF KV + Supabase DB (REST API).
  // CF KV:       requires RESPONSES binding in CF Pages (per-datacenter fallback otherwise)
  // Supabase DB: globally consistent HTTP REST, no CF KV binding required
  // Either source returning "polling" fires the redirect.
  useEffect(() => {
    if (!joinResponse || pollOpen || !code) return;
    const check = async () => {
      // Run both checks in parallel — first positive result wins
      const [kvData, sbData] = await Promise.allSettled([
        fetchSessionFromKV(code),
        fetchStatusFromSupabase(code),
      ]);

      // CF KV result
      if (kvData.status === "fulfilled" && kvData.value && !("error" in kvData.value)) {
        const s = kvData.value.status as string | undefined;
        if (s === "polling" || s === "ranking") { setPollOpen(true); return; }
        if (typeof kvData.value.participant_count === "number") {
          setParticipantCount((prev) => Math.max(prev, kvData.value!.participant_count as number));
        }
      }

      // Supabase DB result (globally consistent, no CF KV needed)
      if (sbData.status === "fulfilled" && sbData.value) {
        const s = sbData.value.status;
        if (s === "polling" || s === "ranking") { setPollOpen(true); return; }
        if (typeof sbData.value.participant_count === "number") {
          setParticipantCount((prev) => Math.max(prev, sbData.value!.participant_count));
        }
      }
    };
    check(); // immediate check on entering lobby
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [joinResponse, pollOpen, code]);

  // When language changes, also set the active UI locale
  const handleLanguageChange = useCallback((code: string) => {
    setLanguage(code);
    if (code) setActiveLocale(code);
  }, [setActiveLocale]);

  const handleJoin = useCallback(async () => {
    if (!session) return;
    setStep("joining");
    try {
      const response = await api.post<SessionJoinResponse>(
        `/sessions/join/${code}`,
        {
          display_name: joinAnonymously ? null : displayName || null,
          language_code: language || "en",
          results_opt_in: resultsOptIn,
        }
      );
      const simSuffix = simMode ? "&sim=1" : "";

      // Re-fetch live session — get accurate status AND participant count after join.
      // Must happen before the presence broadcast so we send the server's true count.
      let liveStatus = session.status;
      let liveCount = (session.participant_count ?? 0) + 1; // optimistic fallback
      try {
        const live = await api.get<Session>(`/sessions/code/${code}`);
        liveStatus = live.status;
        if (typeof live.participant_count === "number") liveCount = live.participant_count;
      } catch { /* use cached status on failure */ }

      // Broadcast accurate participant count to moderator dashboard + waiting participants
      if (supabase && code) {
        supabase.channel(`session:${code.toUpperCase()}`)
          .send({ type: "broadcast", event: "presence", payload: { participant_count: liveCount } })
          .catch(() => {});
      }
      setParticipantCount(liveCount);

      if (pollOpen || liveStatus === "polling" || liveStatus === "ranking") {
        router.push(`/session/?id=${response.session_id}&pid=${response.participant_id}&lang=${language || "en"}${simSuffix}`);
      } else {
        // Park in waiting lobby — fallback poll + realtime redirect automatically
        setJoinResponse(response);
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast({
          title: t("cube1.join.unable_to_join"),
          description: err.detail,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("cube1.join.unable_to_join"),
          description: "Check your internet and try again.",
          variant: "destructive",
        });
      }
      setStep("results");
    }
  }, [session, code, language, displayName, joinAnonymously, resultsOptIn, simMode, router, pollOpen, t]);

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
            <CardHeader className="text-center">
              <CardTitle>{t("cube1.join.unable_to_join")}</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button variant="outline" onClick={() => router.push("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("shared.nav.back_to_home")}
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

      {/* Polling-live banner — visible on join steps so participants know to hurry */}
      {pollOpen && !joinResponse && (
        <div className="bg-green-900/80 border-b border-green-700 text-green-200 text-sm font-medium px-4 py-2 text-center flex items-center justify-center gap-2">
          <Zap className="h-4 w-4 text-green-400 shrink-0" />
          Polling has started — complete your details to join now!
        </div>
      )}

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex justify-center gap-2 pt-6">
            {(["language", "identity", "results"] as const).map((s, i) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full transition-colors ${
                  step === s || (step === "joining" && i === 2)
                    ? "bg-primary"
                    : ["language", "identity", "results"].indexOf(step) > i ||
                      step === "joining"
                    ? "bg-primary/40"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Language */}
          {step === "language" && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 rounded-lg bg-primary/10 p-3 w-fit">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t("cube1.join.select_language")}</CardTitle>
                <CardDescription>
                  {t("cube1.join.select_language_desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6">
                <LanguageSelector value={language} onChange={handleLanguageChange} />
                <Button
                  className="w-full"
                  onClick={() => setStep("identity")}
                  disabled={!language}
                >
                  {t("shared.nav.continue")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 2: Identity */}
          {step === "identity" && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 rounded-lg bg-primary/10 p-3 w-fit">
                  <UserIcon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t("cube1.join.identity_title")}</CardTitle>
                <CardDescription>
                  {session?.anonymity_mode === "anonymous"
                    ? t("cube1.join.identity_anonymous")
                    : t("cube1.join.identity_prompt")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {session?.anonymity_mode !== "anonymous" && (
                  <div className="space-y-2">
                    <Label htmlFor="display-name">{t("cube1.join.display_name")}</Label>
                    <Input
                      id="display-name"
                      placeholder={t("cube1.join.your_name")}
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setJoinAnonymously(false);
                      }}
                      disabled={joinAnonymously}
                    />
                  </div>
                )}
                <Button
                  variant={joinAnonymously || session?.anonymity_mode === "anonymous" ? "default" : "outline"}
                  className="w-full"
                  onClick={() => {
                    setJoinAnonymously(true);
                    setDisplayName("");
                    setStep("results");
                  }}
                >
                  {t("cube1.join.join_anonymously")}
                </Button>
                {session?.anonymity_mode !== "anonymous" && (
                  <Button
                    className="w-full"
                    onClick={() => setStep("results")}
                    disabled={!displayName.trim() && !joinAnonymously}
                  >
                    {t("shared.nav.continue")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("language")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("shared.nav.back")}
                </Button>
              </CardContent>
            </>
          )}

          {/* Step 3: Results Opt-in */}
          {step === "results" && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-2 rounded-lg bg-primary/10 p-3 w-fit">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{t("cube1.join.receive_results")}</CardTitle>
                <CardDescription>
                  {t("cube1.join.results_question")}
                  {session?.is_paid && (
                    <span className="block mt-1 text-primary font-medium">
                      {t("cube1.join.results_paid")}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button
                  className="w-full"
                  onClick={() => {
                    setResultsOptIn(true);
                    handleJoin();
                  }}
                >
                  {t("cube1.join.results_yes_button")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setResultsOptIn(false);
                    handleJoin();
                  }}
                >
                  {t("cube1.join.results_no_button")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("identity")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t("shared.nav.back")}
                </Button>
              </CardContent>
            </>
          )}

          {/* Joining — API call in progress */}
          {step === "joining" && !joinResponse && (
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t("cube1.join.joining")}
              </p>
            </CardContent>
          )}

          {/* Waiting screen — joined, holding in lobby until Start Polling */}
          {step === "joining" && joinResponse && !pollOpen && (
            <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <Radio className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">You&apos;re in the session</p>
                <p className="text-sm text-muted-foreground">
                  Waiting for the moderator to start polling…
                </p>
              </div>
              {/* Live participant count */}
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary tabular-nums">
                  {participantCount}
                </span>
                <span className="text-xs text-muted-foreground">in session</span>
              </div>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary animate-pulse"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                ))}
              </div>
            </CardContent>
          )}

          {/* Polling-live screen — redirecting now */}
          {step === "joining" && joinResponse && pollOpen && (
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="rounded-full bg-green-500/10 p-4">
                <Zap className="h-8 w-8 text-green-400" />
              </div>
              <p className="font-semibold text-foreground">Polling is live!</p>
              <p className="text-sm text-muted-foreground">Taking you to the question…</p>
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}
