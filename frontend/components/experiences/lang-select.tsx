"use client";

// Globe language dropdown for the Experiences pages. Reuses the app's lexicon
// locale system (same setter Settings uses); English + Français are pinned at
// the top with a separator, then the remaining approved languages alphabetized.

import { useState } from "react";
import { Globe } from "lucide-react";
import { useLexicon } from "@/lib/lexicon-context";

const PINNED = ["en", "fr"];

export function LangSelect() {
  const { activeLocale, setActiveLocale, languages } = useLexicon();
  const [open, setOpen] = useState(false);

  const approved = languages.filter((l) => l.status === "approved");
  const pinned = PINNED.map((c) => approved.find((l) => l.code === c)).filter(Boolean) as typeof approved;
  const rest = approved
    .filter((l) => !PINNED.includes(l.code))
    .sort((a, b) => a.nameEn.localeCompare(b.nameEn));
  const ordered = [...pinned, ...rest];
  const pinnedCount = pinned.length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Language"
        title="Language"
        className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <Globe className="h-4 w-4" />
        <span className="text-xs uppercase">{activeLocale}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 max-h-80 w-56 overflow-y-auto rounded-md border border-border/60 bg-popover p-1 shadow-md">
            {ordered.map((lang, i) => (
              <div key={lang.code}>
                <button
                  type="button"
                  onClick={() => {
                    setActiveLocale(lang.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent ${
                    activeLocale === lang.code ? "bg-accent font-medium" : ""
                  }`}
                >
                  <span>{lang.nameNative}</span>
                  <span className="text-xs text-muted-foreground">({lang.nameEn})</span>
                </button>
                {i === pinnedCount - 1 && ordered.length > pinnedCount && (
                  <div className="my-1 border-t border-border/60" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
