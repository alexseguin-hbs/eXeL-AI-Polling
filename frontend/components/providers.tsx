"use client";

import { useEffect } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider, useTheme } from "@/lib/theme-context";
import { LexiconProvider } from "@/lib/lexicon-context";
import { TimerProvider } from "@/lib/timer-context";
import { EasterEggProvider } from "@/lib/easter-egg-context";
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
                <Toaster />
              </EasterEggProvider>
            </TimerProvider>
          </LexiconProvider>
        </ThemeAuthSync>
      </ThemeProvider>
    </Auth0Provider>
  );
}
