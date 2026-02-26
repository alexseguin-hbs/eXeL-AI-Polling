"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ArrowRight, ArrowLeft, Globe, UserIcon, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { LanguageSelector } from "@/components/language-selector";
import { useLexicon } from "@/lib/lexicon-context";
import { api, ApiClientError } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import type { Session, SessionJoinResponse } from "@/lib/types";

type JoinStep = "language" | "identity" | "results" | "joining";

export function JoinFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, setActiveLocale } = useLexicon();
  // Read code from query param: /join/?code=ABCD1234
  const code = searchParams.get("code")?.toUpperCase() || "";

  const [step, setStep] = useState<JoinStep>("language");
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [language, setLanguage] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [joinAnonymously, setJoinAnonymously] = useState(false);
  const [resultsOptIn, setResultsOptIn] = useState(false);

  useEffect(() => {
    if (!code) return;
    setLoading(true);
    api
      .get<Session>(`/sessions/code/${code}`)
      .then((data) => {
        setSession(data);
        if (data.status === "closed" || data.status === "archived") {
          setError(t("cube1.join.session_ended"));
        }
      })
      .catch((err) => {
        if (err instanceof ApiClientError) {
          setError(err.detail);
        } else {
          setError("Failed to load session. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, [code, t]);

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
      router.push(`/session/?id=${response.session_id}&pid=${response.participant_id}&lang=${language || "en"}`);
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
  }, [session, code, language, displayName, joinAnonymously, resultsOptIn, router, t]);

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

          {/* Joining spinner */}
          {step === "joining" && (
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                {t("cube1.join.joining")}
              </p>
            </CardContent>
          )}
        </Card>
      </main>
    </div>
  );
}
