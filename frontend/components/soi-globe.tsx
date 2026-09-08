"use client";

/**
 * The globe language switch on every Session page — the same method as Settings and Vision 2525 (operator
 * 2026-09-08: "spanish is same method of Globe translation"): the lexicon's LanguageSelector (EN + ES pinned, then
 * the approved languages), driving the active locale every t() reads. R-CORE: nothing new is invented here.
 */
import { Globe } from "lucide-react";
import { LanguageSelector } from "@/components/language-selector";
import { useLexicon } from "@/lib/lexicon-context";

export function SoiGlobe({ className = "" }: { className?: string }) {
  const { activeLocale, setActiveLocale, t } = useLexicon();
  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="soi-globe" aria-label={t("soi.landing.language")}>
      <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="w-36 text-xs"><LanguageSelector value={activeLocale} onChange={setActiveLocale} /></div>
    </div>
  );
}
