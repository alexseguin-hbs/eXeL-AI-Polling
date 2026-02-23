"use client";

import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useLexicon } from "@/lib/lexicon-context";

/** Languages pinned to top of dropdown for quick access */
const PINNED_CODES = ["en", "es"];

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

function detectBrowserLanguage(approvedCodes: string[]): string {
  if (typeof navigator === "undefined") return "en";
  const browserLang = navigator.language?.split("-")[0]?.toLowerCase() || "en";
  return approvedCodes.includes(browserLang) ? browserLang : "en";
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const { languages, t } = useLexicon();

  const approved = languages.filter((l) => l.status === "approved");
  const approvedCodes = approved.map((l) => l.code);
  const pinned = PINNED_CODES.map((c) => approved.find((l) => l.code === c)).filter(Boolean) as typeof approved;
  const rest = approved.filter((l) => !PINNED_CODES.includes(l.code)).sort((a, b) => a.nameNative.localeCompare(b.nameNative));
  const sortedLangs = [...pinned, ...rest];

  useEffect(() => {
    if (!value) {
      onChange(detectBrowserLanguage(approvedCodes));
    }
  }, [value, onChange, approvedCodes]);

  return (
    <div className="w-full max-w-xs">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={t("cube1.join.select_language")} />
        </SelectTrigger>
        <SelectContent>
          {sortedLangs.map((lang, i) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.nameNative}</span>
                <span className="text-muted-foreground">({lang.nameEn})</span>
              </span>
              {i === pinned.length - 1 && rest.length > 0 && (
                <Separator className="mt-1" />
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
