"use client";

/**
 * Theme detail sheet (t181, 2026-11-09): tapping a sub-theme bubble opens this — a bottom sheet on phones, a side
 * panel on desktop — with the theme name, response count, average confidence and its description (111 words at
 * level 9, 222 at 6, 333 at 3). The description is the paid view: an unpaid viewer sees a locked state with the
 * payment prompt, never the text. Until GET /themes sends `description`, the block is hidden. Strings via t().
 */
import { useEffect } from "react";
import { Lock, X, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import { DESCRIPTION_WORDS, descriptionState } from "@/lib/theme-detail";
import type { ThemeInfo } from "@/lib/types";

export interface ThemeDetailSheetProps {
  theme: ThemeInfo;
  level: 3 | 6 | 9;
  category: string;
  accentColor: string;
  isPaidTier: boolean;
  onClose: () => void;
  onViewResponses?: () => void;
  /** Payment prompt action (e.g. Stripe Checkout for this poll); without it the locked state explains how to unlock. */
  onUnlock?: () => void;
}

export function ThemeDetailSheet({ theme, level, category, accentColor, isPaidTier, onClose, onViewResponses, onUnlock }: ThemeDetailSheetProps) {
  const { t } = useLexicon();
  const state = descriptionState(theme, isPaidTier);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70]" data-theme-detail-sheet>
      <button type="button" aria-label={t("flower.detail.close")} className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={theme.label}
        className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t bg-background p-4 shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0"
        style={{ borderColor: accentColor }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted sm:hidden" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide" style={{ color: accentColor }}>
              {t("flower.detail.level_of").replace("{0}", category).replace("{1}", String(level))}
            </p>
            <h3 className="mt-1 text-lg font-semibold leading-snug break-words">{theme.label}</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={t("flower.detail.close")}><X className="h-5 w-5" /></Button>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">{t("flower.detail.responses")}</dt>
            <dd className="text-2xl font-bold tabular-nums">{theme.count.toLocaleString()}</dd>
          </div>
          <div className="rounded-lg border p-3">
            <dt className="text-xs text-muted-foreground">{t("flower.detail.avg_confidence")}</dt>
            <dd className="text-2xl font-bold tabular-nums">{theme.avgConfidence}%</dd>
          </div>
        </dl>
        {state !== "hidden" && (
          <section className="mt-4" data-theme-description={state}>
            <h4 className="text-sm font-semibold">
              {t("flower.detail.description").replace("{0}", String(DESCRIPTION_WORDS[level]))}
            </h4>
            {state === "text" && <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{theme.description}</p>}
            {state === "unavailable" && <p className="mt-2 text-sm text-muted-foreground">{t("flower.detail.description_unavailable")}</p>}
            {state === "locked" && (
              <div className="mt-2 rounded-lg border border-dashed p-3 text-sm" data-theme-description-locked>
                <p className="flex items-center gap-2 font-medium"><Lock className="h-4 w-4" />{t("flower.detail.locked_title")}</p>
                <p className="mt-1 text-muted-foreground">{t("flower.detail.locked_body")}</p>
                {onUnlock && <Button size="sm" className="mt-2" onClick={onUnlock}>{t("flower.detail.unlock")}</Button>}
              </div>
            )}
          </section>
        )}
        {onViewResponses && (
          <Button variant="outline" className="mt-4 w-full" onClick={onViewResponses}>
            <MessageSquareText className="mr-2 h-4 w-4" />{t("flower.detail.view_responses")}
          </Button>
        )}
      </div>
    </div>
  );
}
