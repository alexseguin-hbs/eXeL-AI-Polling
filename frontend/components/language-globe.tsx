"use client";

/**
 * The globe language dropdown — ONE component behind the navbar (home, Vision 2525) and every Session page
 * (operator 2026-09-08: "use globe drop down, must be in same format as settings and vision 2525"). A round
 * globe button; the list reads "EN · English (English)", EN + ES pinned above a rule, then the approved languages.
 * R-CORE: the markup that lived inline in navbar.tsx moved here unchanged; nothing is invented.
 */
import { useState } from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import { getSortedLanguages } from "@/lib/language-utils";

export function LanguageGlobe({ className = "", testId }: { className?: string; testId?: string }) {
  const [open, setOpen] = useState(false);
  const { t, activeLocale, setActiveLocale, languages } = useLexicon();
  const { sorted, pinnedCount } = getSortedLanguages(languages);
  return (
    <div className={`relative ${className}`} data-testid={testId}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((p) => !p)}
        title={t("cube1.join.select_language")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline text-xs uppercase">{activeLocale}</span>
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div role="listbox" className="absolute right-0 top-full z-50 mt-1 w-56 max-h-80 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
            {sorted.map((lang, i) => (
              <div key={lang.code}>
                <button
                  role="option"
                  aria-selected={activeLocale === lang.code}
                  onClick={() => { setActiveLocale(lang.code); setOpen(false); }}
                  className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent ${activeLocale === lang.code ? "bg-accent font-medium" : ""}`}
                >
                  <span className="text-xs font-mono uppercase text-primary">{lang.code}</span>
                  <span className="text-muted-foreground">&bull;</span>
                  <span>{lang.nameNative}</span>
                  <span className="text-muted-foreground text-xs">({lang.nameEn})</span>
                </button>
                {i === pinnedCount - 1 && sorted.length > pinnedCount && <div className="my-1 border-t" />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
