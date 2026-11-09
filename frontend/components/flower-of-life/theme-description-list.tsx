"use client";

/**
 * Compact list under the sub-theme bubbles (t181): every theme of the current level with the first line of its
 * description, expandable to the full text. Readable at iPhone width (no SVG scaling). Unpaid viewers see a locked
 * line instead of description text; before the API sends `description`, the free 33-word summary is shown.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Lock } from "lucide-react";
import { useLexicon } from "@/lib/lexicon-context";
import { descriptionState, firstLine } from "@/lib/theme-detail";
import type { ThemeInfo } from "@/lib/types";

export function ThemeDescriptionList({ themes, accentColor, isPaidTier, onOpen }: {
  themes: ThemeInfo[]; accentColor: string; isPaidTier: boolean; onOpen: (label: string) => void;
}) {
  const { t } = useLexicon();
  const [open, setOpen] = useState<string | null>(null);
  const rows = themes.filter((th) => !th.isEmpty);
  if (!rows.length) return null;
  return (
    <ul className="mt-3 space-y-2" data-theme-description-list>
      {rows.map((th) => {
        const st = descriptionState(th, isPaidTier);
        const full = st === "text" ? th.description! : st === "hidden" ? th.summary33 : "";
        const expanded = open === th.label;
        return (
          <li key={th.label} className="rounded-lg border p-3" style={{ borderLeft: `4px solid ${accentColor}` }}>
            <div className="flex items-start gap-2">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onOpen(th.label)}>
                <span className="block text-sm font-semibold leading-snug break-words">{th.label}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("flower.detail.count_conf").replace("{0}", th.count.toLocaleString()).replace("{1}", String(th.avgConfidence))}
                </span>
              </button>
              {full && full.length > firstLine(full).length && (
                <button type="button" className="p-1 text-muted-foreground" aria-expanded={expanded}
                  aria-label={t(expanded ? "flower.detail.collapse" : "flower.detail.expand")}
                  onClick={() => setOpen(expanded ? null : th.label)}>
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              )}
            </div>
            {st === "locked" ? (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />{t("flower.detail.locked_short")}</p>
            ) : full ? (
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{expanded ? full : firstLine(full)}</p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
