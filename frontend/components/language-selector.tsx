"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

interface LanguageSelectorProps {
  value: string;
  onChange: (code: string) => void;
}

function detectBrowserLanguage(): string {
  if (typeof navigator === "undefined") return "en";
  const browserLang = navigator.language?.split("-")[0]?.toLowerCase() || "en";
  const match = SUPPORTED_LANGUAGES.find((l) => l.code === browserLang);
  return match ? match.code : "en";
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    if (!detected && !value) {
      const detectedLang = detectBrowserLanguage();
      onChange(detectedLang);
      setDetected(true);
    }
  }, [detected, value, onChange]);

  return (
    <div className="w-full max-w-xs">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.native}</span>
                <span className="text-muted-foreground">({lang.name})</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
