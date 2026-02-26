"use client";

import { useLexicon } from "@/lib/lexicon-context";
import type { SimTheme } from "@/lib/types";

interface ThemeResultsChartProps {
  themes: SimTheme[];
  totalResponses: number;
}

const PARTITION_LABELS: Record<string, { colorDot: string; labelKey: string }> = {
  "Risk & Concerns": { colorDot: "bg-red-500", labelKey: "cube9.results.risk_label" },
  "Supporting Comments": { colorDot: "bg-green-500", labelKey: "cube9.results.support_label" },
  "Neutral Comments": { colorDot: "bg-blue-500", labelKey: "cube9.results.neutral_label" },
};

export function ThemeResultsChart({ themes, totalResponses }: ThemeResultsChartProps) {
  const { t } = useLexicon();

  // Sort by response count descending
  const sorted = [...themes].sort((a, b) => b.responseCount - a.responseCount);
  const maxCount = sorted[0]?.responseCount ?? 1;

  // Collect unique partitions present in the data
  const partitions = Array.from(new Set(sorted.map((th) => th.partition).filter(Boolean)));

  return (
    <div className="w-full space-y-3">
      <p className="text-xs font-medium text-muted-foreground text-center">
        {t("cube9.results.response_distribution")}
      </p>

      {/* Bars */}
      <div className="space-y-2">
        {sorted.map((theme) => {
          const pct = totalResponses > 0 ? ((theme.responseCount / totalResponses) * 100).toFixed(1) : "0";
          const barWidth = maxCount > 0 ? (theme.responseCount / maxCount) * 100 : 0;

          return (
            <div key={theme.id} className="space-y-0.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="text-xs">{theme.icon}</span>
                  <span className="font-medium truncate">{theme.name}</span>
                </span>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {theme.responseCount.toLocaleString()} ({pct}%)
                </span>
              </div>
              <div className="h-4 w-full rounded-sm bg-muted overflow-hidden">
                <div
                  className="h-full rounded-sm transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: theme.color,
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Partition legend */}
      {partitions.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
          {partitions.map((p) => {
            const cfg = PARTITION_LABELS[p!];
            if (!cfg) return null;
            return (
              <span key={p} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${cfg.colorDot}`} />
                {t(cfg.labelKey)}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
