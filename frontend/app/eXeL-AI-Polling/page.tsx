"use client";

/**
 * /eXeL-AI-Polling — public R-CORE surface for the eXeL AI Polling product
 * (Security-2525 Stage 2 pattern: dedicated route + append-only ledger + RCoreBadge).
 * The live moderator console stays at /dashboard (AuthGuard). This page is public so
 * revision history is readable without a session (Vision-2525 §II transparent decision).
 */

import { useMemo } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { RCoreBadge } from "@/components/2525-core/rcore-badge";
import { EXEL_AI_POLLING_CODE } from "@/lib/2525-core/exel-ai-polling-code.gen";
import { fromLedgerJson } from "@/lib/2525-core/revisions";
import { EXEL_AI_POLLING_LEDGER } from "@/lib/2525-core/exel-ai-polling-ledger.gen";
import { useLexicon } from "@/lib/lexicon-context";

const ACCENT = "#22d3ee";

export default function ExelAiPollingRcorePage() {
  const { t } = useLexicon();
  const history = useMemo(() => fromLedgerJson(EXEL_AI_POLLING_LEDGER), []);
  return (
    <div className="min-h-screen bg-[#07090c] text-slate-100">
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: ACCENT }}>
          {t("polling.rcore.kicker")}
        </p>
        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          {t("polling.rcore.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
          {t("polling.rcore.subtitle")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/"
            className="inline-flex items-center rounded-md border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20"
          >
            {t("polling.rcore.open_dashboard")}
          </Link>
          <Link
            href="/join/"
            className="inline-flex items-center rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:border-slate-400"
          >
            {t("polling.rcore.join_session")}
          </Link>
        </div>
        <p className="mt-10 text-xs text-slate-500">{t("polling.rcore.history_hint")}</p>
      </main>
      <RCoreBadge
        history={history}
        accent={ACCENT}
        code={EXEL_AI_POLLING_CODE}
        codeId="exel-ai-polling"
      />
    </div>
  );
}
