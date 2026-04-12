"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SESSION_CODE_MAX_LENGTH } from "@/lib/constants";
import { useLexicon } from "@/lib/lexicon-context";

export function SessionCodeInput() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { t } = useLexicon();

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = code.trim().toUpperCase();
      if (!trimmed) {
        setError(t("cube1.session.enter_code_error"));
        return;
      }
      setError("");
      setLoading(true);
      // Navigate to join flow — the join page reads code from query param
      router.push(`/join/?code=${trimmed}`);
    },
    [code, router]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, SESSION_CODE_MAX_LENGTH);
    setCode(value);
    if (error) setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex flex-col items-center gap-4">
        <label
          htmlFor="session-code"
          className="text-lg font-medium text-muted-foreground"
        >
          {t("cube1.join.enter_code")}
        </label>
        <div className="flex w-full gap-1.5 justify-center">
          <input
            ref={inputRef}
            id="session-code"
            type="text"
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="ABCD1234"
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="flex-1 h-14 rounded-lg border border-input bg-background px-4 text-center text-2xl font-mono tracking-[0.3em] text-foreground placeholder:text-muted-foreground/40 placeholder:tracking-[0.3em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          />
          <Button
            type="submit"
            size="lg"
            disabled={loading || !code.trim()}
            className="h-14 px-6"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5" />
            )}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </form>
  );
}
