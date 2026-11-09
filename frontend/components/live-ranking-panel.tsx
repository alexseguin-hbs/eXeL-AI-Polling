"use client";

/**
 * Live 9-theme prioritization (map G2 / G4): the group ranking as votes arrive.
 *
 * Fed by the Cube 7 broadcasts already wired through useSessionBroadcast on `session:{short_code}`:
 *   - ranking_progress → `submissions` (ballots cast this cycle)
 *   - ranking_complete → `category_rankings` {support|risk|neutral: [{theme_id,label,score,vote_count,rank}]}
 *     (live: true while the round is open; is_final once the moderator aggregates or closes)
 * Category names reuse the Cube 6 Theme01 keys; the bar styling mirrors ThemeResultsChart. Every string via t().
 * Moderator variant adds the fallback "Show live ranking" button (POST /rankings/aggregate?live=true).
 */
import { Loader2, Radio, RefreshCw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import type { CategoryRankingRow, RankingCompletePayload } from "@/lib/use-session-broadcast";

const CATEGORY_ORDER = ["support", "risk", "neutral"] as const;
const CATEGORY_META: Record<string, { labelKey: string; color: string }> = {
  support: { labelKey: "cube6.themes.supporting", color: "#22c55e" },
  risk: { labelKey: "cube6.themes.risk", color: "#ef4444" },
  neutral: { labelKey: "cube6.themes.neutral", color: "#3b82f6" },
};

export interface LiveRankingPanelProps {
  submissions: number | null;
  ranking: RankingCompletePayload | null;
  variant: "moderator" | "participant";
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function LiveRankingPanel({ submissions, ranking, variant, onRefresh, refreshing }: LiveRankingPanelProps) {
  const { t } = useLexicon();
  const cats = ranking?.category_rankings ?? null;
  const ballots = submissions ?? ranking?.participant_count ?? 0;
  const isFinal = ranking?.is_final === true;
  const ordered = cats
    ? [...CATEGORY_ORDER.filter((c) => cats[c]?.length), ...Object.keys(cats).filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c) && cats[c]?.length)]
    : [];

  return (
    <div className="w-full rounded-lg border bg-card p-4 space-y-3" data-live-ranking-panel={variant}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isFinal ? <Trophy className="h-4 w-4 text-yellow-400" /> : <Radio className="h-4 w-4 text-green-400 animate-pulse" />}
          <p className="text-sm font-semibold">{t(isFinal ? "cube7.live.final" : "cube7.live.title")}</p>
        </div>
        <span className="text-xs text-muted-foreground" data-live-ballots={ballots}>
          {t("cube7.live.ballots").replace("{0}", String(ballots))}
        </span>
      </div>
      {!isFinal && <p className="text-[11px] text-muted-foreground">{t("cube7.live.updating")}</p>}

      {ordered.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{t(ballots > 0 ? "cube7.live.tallying" : "cube7.live.waiting")}</p>
      ) : (
        <div className={`grid gap-3 ${ordered.length > 1 ? "md:grid-cols-3" : ""}`}>
          {ordered.map((cat) => {
            const rows: CategoryRankingRow[] = cats![cat] ?? [];
            const meta = CATEGORY_META[cat] ?? { labelKey: "cube7.live.other", color: "#a1a1aa" };
            const max = Math.max(1, ...rows.map((r) => r.score));
            return (
              <div key={cat} className="space-y-1.5" data-live-category={cat}>
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  {t(meta.labelKey)}
                </p>
                {rows.map((r) => (
                  <div key={r.theme_id} className="space-y-0.5" data-live-theme={r.theme_id} data-live-rank={r.rank}>
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="truncate">
                        <span className="font-bold mr-1">{t("cube10.sim.rank_number").replace("{0}", String(r.rank))}</span>
                        {r.label}
                      </span>
                      <span className="text-muted-foreground shrink-0">
                        {t("cube7.live.points").replace("{0}", String(Math.round(r.score * 100) / 100))}
                        {" · "}
                        {t("cube7.live.votes").replace("{0}", String(r.vote_count))}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-sm bg-muted overflow-hidden">
                      <div className="h-full rounded-sm transition-all duration-500" style={{ width: `${(r.score / max) * 100}%`, backgroundColor: meta.color, opacity: 0.85 }} />
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {variant === "moderator" && onRefresh && !isFinal && (
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} className="w-full">
          {refreshing ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}
          {t("cube7.live.refresh")}
        </Button>
      )}
    </div>
  );
}
