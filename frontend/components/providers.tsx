"use client";

import { useEffect, Suspense } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { LexiconProvider } from "@/lib/lexicon-context";
import { TimerProvider } from "@/lib/timer-context";
import { EasterEggProvider } from "@/lib/easter-egg-context";
import { FeedbackWidget } from "@/components/feedback-widget";
import { PoweredBadge } from "@/components/powered-badge";
import { HomeLauncher } from "@/components/home-launcher";
import {
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_AUDIENCE,
  AUTH0_REDIRECT_URI,
} from "@/lib/constants";

/**
 * Bridge: syncs Auth0 authentication state into the theme system.
 * When a moderator logs in, this unlocks theme changes.
 * When logged out (or not authenticated), theme is locked to AI Cyan.
 */
function ThemeAuthSync({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth0();
  const { setModeratorAuthenticated } = useTheme();

  useEffect(() => {
    setModeratorAuthenticated(isAuthenticated);
  }, [isAuthenticated, setModeratorAuthenticated]);

  return <>{children}</>;
}

/**
 * In-flow site footer (all routes) — the Feedback trigger + eXeL AI badge live here,
 * at the bottom of the page, instead of floating fixed over content (operator ask).
 * The eXeL-AI easter-egg (music/portal) still activates from the badge and, when in
 * Simulation Mode, PoweredBadge renders its own fixed overlay — untouched by docking.
 */
function SiteFooter() {
  // Use window.location since this runs client-side only
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  const screen = path.startsWith("/dashboard")
    ? "dashboard"
    : path.startsWith("/session") || path.startsWith("/poll")
    ? "polling"
    : path.startsWith("/join")
    ? "join"
    : path.startsWith("/Celestial-2525") || path.startsWith("/main/Celestial-2525")
    ? "celestial"
    : path === "/"
    ? "landing"
    : "other";
  return (
    <footer className="w-full border-t border-border/40 bg-background/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <FeedbackWidget screen={screen} docked />
        {/* SECURITY-2525 lives on the footer line with Feedback + eXeL AI, tool-wide (operator ask). */}
        <a
          href="/main/Security-2525/"
          className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
          title="SECURITY-2525"
        >
          SECURITY-2525
        </a>
        <Suspense><PoweredBadge docked /></Suspense>
      </div>
    </footer>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Skip Auth0 provider if config is missing (dev mode without Auth0)
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    return (
      <ThemeProvider>
        <LexiconProvider>
          <TimerProvider>
            <EasterEggProvider>
              {children}
              <Toaster />
              <SiteFooter />
            </EasterEggProvider>
          </TimerProvider>
        </LexiconProvider>
      </ThemeProvider>
    );
  }

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: AUTH0_REDIRECT_URI,
        ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
    >
      <ThemeProvider>
        <ThemeAuthSync>
          <LexiconProvider>
            <TimerProvider>
              <EasterEggProvider>
                {children}
                <HomeLauncher />
                <Toaster />
              <SiteFooter />
              </EasterEggProvider>
            </TimerProvider>
          </LexiconProvider>
        </ThemeAuthSync>
      </ThemeProvider>
    </Auth0Provider>
  );
}
