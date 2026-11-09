"use client";

/**
 * CRS-37.01 / CRS-37.02 — the participant's top-3-per-category ballot for a `top3_points` session (the original
 * design's Round 2: "select your top 3 Supporting themes and rank", the same for Concerns and Neutral; 3/2/1 points).
 * Tap to pick in order (1st = 3 pts, 2nd = 2, 3rd = 1), tap again to remove. Submits
 * POST /sessions/{id}/rankings {category_ballots} (the participant token is attached by lib/api). A re-submit replaces
 * the previous ballot (living vote). Every string via t().
 */
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { api, ApiClientError } from "@/lib/api";
import { useLexicon } from "@/lib/lexicon-context";
import type { SimTheme } from "@/lib/types";

export type Top3Category = "support" | "risk" | "neutral";
export const TOP3_CATEGORY_ORDER: Top3Category[] = ["support", "risk", "neutral"];
export const TOP3_POINTS = [3, 2, 1] as const;
const PARTITION_TO_CAT: Record<NonNullable<SimTheme["partition"]>, Top3Category> = {
  "Supporting Comments": "support",
  "Risk & Concerns": "risk",
  "Neutral Comments": "neutral",
};
const CATEGORY_KEY: Record<Top3Category, string> = {
  support: "cube6.themes.supporting",
  risk: "cube6.themes.risk",
  neutral: "cube6.themes.neutral",
};

/** Add a theme as the next pick (max 3) or remove it (later picks move up). Pure — unit-tested. */
export function togglePick(picks: string[], id: string): string[] {
  if (picks.includes(id)) return picks.filter((p) => p !== id);
  return picks.length >= TOP3_POINTS.length ? picks : [...picks, id];
}

/** The request body: only categories with at least one pick. */
export function top3Body(picks: Partial<Record<Top3Category, string[]>>): { category_ballots: Record<string, string[]> } {
  const out: Record<string, string[]> = {};
  for (const c of TOP3_CATEGORY_ORDER) if (picks[c]?.length) out[c] = picks[c]!.slice(0, 3);
  return { category_ballots: out };
}

export function Top3Ballot({ themes, sessionId, onDone }: { themes: SimTheme[]; sessionId: string; onDone: () => void }) {
  const { t } = useLexicon();
  const [picks, setPicks] = useState<Partial<Record<Top3Category, string[]>>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const groups = TOP3_CATEGORY_ORDER.map((c) => ({
    c,
    items: themes.filter((th) => th.partition && PARTITION_TO_CAT[th.partition] === c),
  })).filter((g) => g.items.length > 0);

  const submit = async () => {
    const body = top3Body(picks);
    if (!Object.keys(body.category_ballots).length) {
      toast({ title: t("cube7.top3.pick_one"), variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await api.post(`/sessions/${sessionId}/rankings`, body);
      setSent(true);
      toast({ title: t("pollui.ranking_updated") });
    } catch (e) {
      toast({
        title: t("cube7.ranking.submit_error_title"),
        description: e instanceof ApiClientError && e.detail ? e.detail : t("cube7.ranking.submit_error_retry"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="w-full max-w-lg" data-top3-ballot>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("cube7.top3.instructions")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map(({ c, items }) => (
          <div key={c} className="space-y-1" data-top3-category={c}>
            <p className="text-xs font-semibold uppercase tracking-wide">{t(CATEGORY_KEY[c])}</p>
            {items.map((th) => {
              const pos = (picks[c] ?? []).indexOf(th.id);
              return (
                <button
                  key={th.id}
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-md border-2 px-3 py-2 text-left text-sm ${pos >= 0 ? "" : "border-transparent bg-muted/40"}`}
                  style={pos >= 0 ? { borderColor: th.color } : undefined}
                  onClick={() => { setSent(false); setPicks((p) => ({ ...p, [c]: togglePick(p[c] ?? [], th.id) })); }}
                  aria-pressed={pos >= 0}
                  data-top3-theme={th.id}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: pos >= 0 ? th.color : "#9CA3AF" }}
                  >
                    {pos >= 0 ? TOP3_POINTS[pos] : ""}
                  </span>
                  <span className="flex-1">{th.name}</span>
                </button>
              );
            })}
          </div>
        ))}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : sent ? <CheckCircle2 className="mr-2 h-4 w-4" /> : null}
            {t(sent ? "cube7.top3.update" : "cube7.top3.submit")}
          </Button>
          {sent && <Button variant="outline" onClick={onDone}>{t("cube7.top3.done")}</Button>}
        </div>
      </CardContent>
    </Card>
  );
}
