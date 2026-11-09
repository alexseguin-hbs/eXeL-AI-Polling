"use client";

/**
 * Public sales demo — SIMULATED only.
 * Seeded from the owner 60-response AI benchmark CSV. Static fixture; no live
 * session create, join, vote, or Stripe. Cannot contaminate real polls.
 */
import { useMemo, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { LiveRankingPanel } from "@/components/live-ranking-panel";
import { useLexicon } from "@/lib/lexicon-context";
import fixture from "@/lib/sales-demo-fixture.json";
import type { RankingCompletePayload } from "@/lib/use-session-broadcast";

const CATEGORY_ORDER = [
  "Supporting Comments",
  "Risk & Concerns",
  "Neutral Comments",
] as const;

const CATEGORY_COLOR: Record<string, string> = {
  "Supporting Comments": "#22c55e",
  "Risk & Concerns": "#ef4444",
  "Neutral Comments": "#3b82f6",
};

type Level = "theme2_9" | "theme2_6" | "theme2_3";

export default function SalesDemoPage() {
  const { t } = useLexicon();
  const [level, setLevel] = useState<Level>("theme2_9");
  const [showAll, setShowAll] = useState(false);
  const meta = fixture.meta;
  const bins = fixture.bins as Record<string, number>;
  const themes = fixture.themes as Record<
    string,
    { theme2_9: string[]; theme2_6: string[]; theme2_3: string[]; counts: Record<string, number> }
  >;
  const ranking = fixture.ranking as RankingCompletePayload;
  const responses = fixture.responses as Array<{
    id: string;
    user: string;
    text: string;
    theme01: string;
    theme01_confidence: number;
    theme02_label: string;
  }>;

  const visible = useMemo(
    () => (showAll ? responses : responses.slice(0, 12)),
    [showAll, responses],
  );

  const liveMs = meta.measured_theme02_evidence.live_api_w3_ms;
  const fastMs = meta.measured_theme02_evidence.fast_pipeline_n60_time_to_final_themes_ms_best;

  return (
    <div className="min-h-screen bg-background text-foreground" data-sales-demo="simulated">
      <Navbar sessionTitle={t("sales.demo.title")} />

      <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-center text-sm font-medium text-amber-200">
        {t("sales.demo.banner")}
      </div>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{t("sales.demo.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sales.demo.isolation_note")}</p>
          <p className="text-sm">
            <span className="font-medium">{t("sales.demo.question_label")}: </span>
            {meta.question}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("sales.demo.responses_label").replace("{count}", String(meta.response_count))}
            {" · "}
            <span className="font-mono">SIMULATED</span>
          </p>
        </header>

        {/* Theme01 bins */}
        <section className="space-y-3" aria-labelledby="theme01">
          <h2 id="theme01" className="text-lg font-semibold">
            {t("sales.demo.theme01_title")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {CATEGORY_ORDER.map((cat) => {
              const n = bins[cat] ?? 0;
              const pct = Math.round((n / meta.response_count) * 100);
              return (
                <div
                  key={cat}
                  className="rounded-lg border bg-card p-4"
                  data-theme01={cat}
                  data-count={n}
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLOR[cat] }}
                    />
                    {cat}
                  </div>
                  <p className="font-mono text-2xl font-bold">{n}</p>
                  <p className="text-xs text-muted-foreground">{pct}% of responses</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full"
                      style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLOR[cat] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Theme02 levels */}
        <section className="space-y-3" aria-labelledby="theme02">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="theme02" className="text-lg font-semibold">
              {t("sales.demo.theme02_title")}
            </h2>
            <div className="flex gap-1">
              {(
                [
                  ["theme2_9", "sales.demo.level9"],
                  ["theme2_6", "sales.demo.level6"],
                  ["theme2_3", "sales.demo.level3"],
                ] as const
              ).map(([id, key]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setLevel(id)}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    level === id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-input text-muted-foreground hover:border-primary/50"
                  }`}
                  data-theme02-level={id}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("sales.demo.classifier_note")}</p>
          <div className="grid gap-3 md:grid-cols-3">
            {CATEGORY_ORDER.map((cat) => {
              const labels = themes[cat]?.[level] ?? [];
              const counts = themes[cat]?.counts ?? {};
              return (
                <div key={cat} className="rounded-lg border bg-card p-3" data-theme02-cat={cat}>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: CATEGORY_COLOR[cat] }}
                    />
                    {cat}
                  </p>
                  <ol className="space-y-1 text-sm">
                    {labels.map((label, i) => (
                      <li key={label} className="flex justify-between gap-2">
                        <span>
                          <span className="mr-1 font-mono text-muted-foreground">{i + 1}.</span>
                          {label}
                        </span>
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          {counts[label] ?? 0}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ranking — reuses LiveRankingPanel with static SIMULATED payload */}
        <section className="space-y-2" aria-labelledby="ranking">
          <h2 id="ranking" className="text-lg font-semibold">
            {t("sales.demo.ranking_title")}
          </h2>
          <LiveRankingPanel
            submissions={ranking.participant_count ?? 60}
            ranking={ranking}
            variant="participant"
          />
        </section>

        {/* Latency honesty */}
        <p className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          {t("sales.demo.latency_note")
            .replace("{live}", String(liveMs))
            .replace("{fast}", String(fastMs))}
        </p>

        {/* Responses */}
        <section className="space-y-3" aria-labelledby="responses">
          <div className="flex items-center justify-between gap-2">
            <h2 id="responses" className="text-lg font-semibold">
              {t("sales.demo.responses_title")}
            </h2>
            <button
              type="button"
              className="text-xs text-primary underline-offset-2 hover:underline"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? t("sales.demo.show_less")
                : t("sales.demo.show_all").replace("{count}", String(responses.length))}
            </button>
          </div>
          <ul className="space-y-2">
            {visible.map((r) => (
              <li key={r.id} className="rounded-md border bg-card/60 p-3 text-sm" data-response={r.id}>
                <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-mono">{r.user}</span>
                  <span
                    className="rounded-full px-2 py-0.5 font-medium text-background"
                    style={{ backgroundColor: CATEGORY_COLOR[r.theme01] || "#71717a" }}
                  >
                    {r.theme01}
                  </span>
                  <span>{r.theme02_label}</span>
                  <span className="font-mono">{Math.round(r.theme01_confidence * 100)}%</span>
                </div>
                <p>{r.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing + CTAs */}
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <h2 className="text-lg font-semibold">{t("sales.demo.pricing_link")}</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>
              {t("cube8.pricing.free")} — {t("cube8.pricing.free_desc")} · {t("cube8.pricing.free_detail")}
            </li>
            <li>
              {t("cube8.pricing.moderator_paid")} — {t("cube8.pricing.unlimited_desc")} ·{" "}
              {t("cube8.pricing.moderator_detail")} · {t("cube8.pricing.minimum_note")}
            </li>
            <li>
              {t("cube8.pricing.cost_split")} — {t("cube8.pricing.cost_split_detail")}
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Live quote uses tracked AI/STT cost × 1.5 (cost + 50% markup) + Stripe fee, floor $11.11.
            Verified 2026-11-09 via POST /payments/poll-quote (margin_multiplier=1.5).
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/dashboard"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              {t("sales.demo.cta_dashboard")}
            </Link>
            <span className="self-center text-xs text-muted-foreground">
              {t("sales.demo.cta_brief")}: fleet/sales/SALES_BRIEF.md
            </span>
          </div>
        </section>
      </main>
    </div>
  );
}
