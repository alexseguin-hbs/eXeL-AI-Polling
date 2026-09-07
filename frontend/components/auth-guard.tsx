"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLexicon } from "@/lib/lexicon-context";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Same-origin path to land on after login (e.g. a signing link) — default: the workspace selector. */
  returnTo?: string;
}

export function AuthGuard({ children, returnTo }: AuthGuardProps) {
  const { isAuthenticated, isLoading, loginWithRedirect, error } = useAuth0();
  const { t } = useLexicon();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !error) {
      loginWithRedirect(returnTo ? { appState: { returnTo } } : undefined);
    }
  }, [isLoading, isAuthenticated, error, loginWithRedirect, returnTo]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("shared.auth.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-semibold text-destructive">
            {t("shared.auth.error")}
          </p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={() => loginWithRedirect(returnTo ? { appState: { returnTo } } : undefined)}
            className="text-sm text-primary hover:underline"
          >
            {t("shared.auth.try_again")}
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
