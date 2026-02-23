"use client";

import { SessionCodeInput } from "@/components/session-code-input";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Zap } from "lucide-react";
import { useLexicon } from "@/lib/lexicon-context";

export default function LandingPage() {
  const { t } = useLexicon();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        {/* Hero */}
        <div className="flex flex-col items-center gap-6 text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            <span className="text-primary">{t("shared.landing.hero_title_primary")}</span>{" "}
            <span className="text-muted-foreground">{t("shared.landing.hero_title_secondary")}</span>
          </h1>
          <p className="max-w-[600px] text-lg text-muted-foreground">
            {t("shared.landing.hero_subtitle")}
          </p>
        </div>

        {/* Session Code Input */}
        <div className="w-full max-w-xs mb-8">
          <SessionCodeInput />
        </div>

        {/* Features */}
        <div className="grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3 mb-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">{t("shared.landing.feature_ai")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("shared.landing.feature_ai_desc")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">{t("shared.landing.feature_scale")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("shared.landing.feature_scale_desc")}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="rounded-lg bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">{t("shared.landing.feature_governance")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("shared.landing.feature_governance_desc")}
            </p>
          </div>
        </div>

        {/* Moderator CTA */}
        <div className="flex flex-col items-center gap-2 mb-12">
          <Separator className="w-24 mb-4" />
          <p className="text-sm text-muted-foreground">{t("shared.landing.facilitator_cta")}</p>
          <Button variant="outline" asChild>
            <a href="/dashboard/">{t("shared.landing.facilitator_button")}</a>
          </Button>
        </div>
      </main>
    </div>
  );
}
