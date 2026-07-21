"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, Copy, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useLexicon } from "@/lib/lexicon-context";
import { CubeDevSim } from "@/components/cube-dev-sim";

// SIM is easter-egg + password gated. The gate lives in React context (in-memory
// only). If the user navigates here without unlocking on `/` first, we bounce
// them back to home.
const SIM_DEFAULT_CODE = "DEMO2026";

function SimSplitScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const { simulationMode, cube10Access } = useEasterEgg();
  const { t } = useLexicon();

  const gated = simulationMode || cube10Access === "admin" || cube10Access === "challenger";
  const sessionCode = params.get("code") || SIM_DEFAULT_CODE;

  useEffect(() => {
    if (!gated) {
      router.replace("/");
    }
  }, [gated, router]);

  const [origin, setOrigin] = useState<string>("");
  const [view, setView] = useState<"dev" | "split">("dev");
  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);
  }, []);

  const modUrl = useMemo(
    () => `/dashboard?sim=1&code=${encodeURIComponent(sessionCode)}`,
    [sessionCode],
  );
  const userUrl = useMemo(
    () => `/session?sim=1&role=user1&code=${encodeURIComponent(sessionCode)}`,
    [sessionCode],
  );
  const phoneUrl = useMemo(
    () =>
      origin
        ? `${origin}/session?code=${encodeURIComponent(sessionCode)}&sim=1&role=user2`
        : "",
    [origin, sessionCode],
  );

  const copyPhoneUrl = () => {
    if (!phoneUrl) return;
    navigator.clipboard.writeText(phoneUrl);
    toast({ description: t("cube10.sim.link_copied") || "Phone link copied" });
  };

  if (!gated) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar sessionTitle={`[SIM · Split] ${sessionCode}`} />

      <div className="flex items-center justify-between border-b border-border/40 bg-muted/20 px-4 py-2 text-xs">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          className="h-7 gap-1"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("cube10.sim.split_exit")}
        </Button>
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="font-mono">code={sessionCode}</span>
          <span>· Live rankings propagate across all three views</span>
        </div>
      </div>

      {/* Simulation option: Cube Developer Sim (Cubes 1-9) vs the session split-screen demo */}
      <div className="flex justify-center gap-2 border-b border-border/40 bg-muted/10 px-4 py-2">
        <Button variant={view === "dev" ? "default" : "outline"} size="sm" onClick={() => setView("dev")}>
          Cube Dev Sim · 1–9
        </Button>
        <Button variant={view === "split" ? "default" : "outline"} size="sm" onClick={() => setView("split")}>
          Session Demo
        </Button>
      </div>

      {view === "dev" && <CubeDevSim />}

      {view === "split" && (<>
      <div className="grid flex-1 grid-cols-1 gap-0 md:grid-cols-2">
        {/* LEFT — Moderator */}
        <div className="flex flex-col border-r border-border/40 min-h-[70vh]">
          <div className="flex items-center justify-between border-b border-border/40 bg-muted/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>{t("cube10.sim.split_moderator")}</span>
            <span className="font-mono normal-case tracking-normal opacity-70">
              {modUrl}
            </span>
          </div>
          <iframe
            title="SIM Moderator"
            src={modUrl}
            className="h-full w-full flex-1 border-0"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>

        {/* RIGHT — User 1 */}
        <div className="flex flex-col min-h-[70vh]">
          <div className="flex items-center justify-between border-b border-border/40 bg-muted/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>{t("cube10.sim.split_user1")}</span>
            <span className="font-mono normal-case tracking-normal opacity-70">
              {userUrl}
            </span>
          </div>
          <iframe
            title="SIM User 1"
            src={userUrl}
            className="h-full w-full flex-1 border-0"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>
      </div>

      {/* Bottom bar — User 2 on phone via QR */}
      <div className="border-t border-border/40 bg-muted/10 px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-semibold">{t("cube10.sim.split_user2_phone")}</p>
              <p className="text-xs text-muted-foreground">
                Scan the QR or open the link on a second device to join as a real
                participant. Rankings you submit will appear live in both panes above.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {phoneUrl && (
              <div className="rounded-md bg-white p-2">
                <QRCodeSVG value={phoneUrl} size={72} />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={copyPhoneUrl}
              disabled={!phoneUrl}
              className="gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy phone link
            </Button>
          </div>
        </div>
      </div>
      </>)}
    </div>
  );
}

function SimLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function SimPage() {
  return (
    <Suspense fallback={<SimLoading />}>
      <SimSplitScreen />
    </Suspense>
  );
}
