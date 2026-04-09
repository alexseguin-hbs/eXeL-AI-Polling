"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { LogOut, User, Menu, Settings, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeratorSettings } from "@/components/moderator-settings";
import { TokenHUD } from "@/components/token-hud";
import { useLexicon } from "@/lib/lexicon-context";
import { useState } from "react";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { SeedOfLifeLogo } from "@/components/seed-of-life-logo";
import { useTheme } from "@/lib/theme-context";

interface NavbarProps {
  sessionTitle?: string;
}

export function Navbar({ sessionTitle }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiSdkOpen, setApiSdkOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { t } = useLexicon();
  const { currentTheme } = useTheme();

  let simulationMode = false;
  try {
    const easterEgg = useEasterEgg();
    simulationMode = easterEgg.simulationMode;
  } catch {
    // Easter egg provider not available
  }

  let isAuthenticated = false;
  let user: { name?: string; email?: string; picture?: string } | undefined;
  let logout: ((options?: { logoutParams?: { returnTo?: string } }) => void) | undefined;

  try {
    const auth0 = useAuth0();
    isAuthenticated = auth0.isAuthenticated;
    user = auth0.user;
    logout = auth0.logout;
  } catch {
    // Auth0 provider not available (participant view)
  }

  // Settings gear visible when: user is in a session (8-digit code) OR authenticated (Moderator)
  const showSettings = !!sessionTitle || isAuthenticated;

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2">
              {simulationMode ? (
                <SeedOfLifeLogo
                  size={28}
                  accentColor={currentTheme.swatch}
                />
              ) : (
                <>
                  <span className="text-lg font-bold text-primary">eXeL</span>
                  <span className="text-lg font-light text-muted-foreground">
                    AI Polling
                  </span>
                </>
              )}
            </a>
          </div>

          {sessionTitle && (
            <div className="ml-4 hidden sm:block">
              <span className="text-sm text-muted-foreground">|</span>
              <span className="ml-4 text-sm font-medium">{sessionTitle}</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <TokenHUD />

            {/* Settings menu — visible for ALL users (polling + moderator) */}
            {showSettings && !isAuthenticated && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUserMenuOpen((p) => !p)}
                  title={t("shared.nav.settings")}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
                      <button
                        onClick={() => { setUserMenuOpen(false); setSettingsOpen(true); }}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                      >
                        <Settings className="h-4 w-4" />
                        {t("shared.nav.settings")}
                      </button>
                      <button
                        onClick={() => { setUserMenuOpen(false); setApiSdkOpen(true); }}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                      >
                        <Code className="h-4 w-4" />
                        {t("sdk.api_key.title")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {isAuthenticated && user && (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  {user.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.picture}
                      alt=""
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline text-sm">
                    {user.name || user.email}
                  </span>
                  <Menu className="h-4 w-4 sm:hidden" />
                </Button>

                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border bg-popover p-1 shadow-md">
                      <div className="px-3 py-2 text-sm text-muted-foreground sm:hidden">
                        {user.name || user.email}
                      </div>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setSettingsOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                      >
                        <Settings className="h-4 w-4" />
                        {t("shared.nav.settings")}
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          setApiSdkOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                      >
                        <Code className="h-4 w-4" />
                        {t("sdk.api_key.title")}
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout?.({
                            logoutParams: {
                              returnTo: window.location.origin,
                            },
                          });
                        }}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("shared.nav.sign_out")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      <ModeratorSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        userEmail={user?.email}
        isPollingUser={!isAuthenticated}
      />

      {/* API & SDK Panel — Developer access for Lead/Developer/Admin */}
      {apiSdkOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end">
          <div className="fixed inset-0 bg-black/40" onClick={() => setApiSdkOpen(false)} />
          <div className="relative z-50 mt-14 mr-4 w-96 max-h-[80vh] overflow-y-auto rounded-xl border bg-card shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b bg-card px-5 py-4">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{t("sdk.api_key.title")}</h2>
              </div>
              <button onClick={() => setApiSdkOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="p-5 space-y-5">
              {/* API Key Section */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("sdk.api_key.generate")}</h3>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-3">API keys allow external applications to access the eXeL governance engine via REST API or SDK.</p>
                  <code className="block text-xs bg-background rounded p-2 font-mono text-primary/80 break-all">
                    exel_pk_●●●●●●●●_●●●●●●●●●●●●●●●●
                  </code>
                  <div className="flex gap-2 mt-3">
                    <button className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90">{t("sdk.api_key.generate")}</button>
                    <button className="text-xs px-3 py-1.5 rounded border hover:bg-accent">{t("sdk.api_key.copy")}</button>
                  </div>
                </div>
              </section>

              {/* Embed Code Section */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("sdk.embed.title")}</h3>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex gap-2 mb-3">
                    <button className="text-xs px-3 py-1.5 rounded bg-primary/10 text-primary">{t("sdk.embed.iframe")}</button>
                    <button className="text-xs px-3 py-1.5 rounded border">{t("sdk.embed.headless")}</button>
                  </div>
                  <code className="block text-[10px] bg-background rounded p-2 font-mono text-muted-foreground break-all">
                    {`<iframe src="https://exel-ai-polling.explore-096.workers.dev/embed?session=DEMO2026" />`}
                  </code>
                </div>
              </section>

              {/* Usage Section */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("sdk.usage.title")}</h3>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("sdk.usage.total_calls")}</span>
                    <span className="font-mono text-primary">0</span>
                  </div>
                </div>
              </section>

              {/* Discovery Endpoints */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Discovery</h3>
                <div className="space-y-1 text-xs font-mono">
                  <p className="text-muted-foreground">GET /api/v1/sdk</p>
                  <p className="text-muted-foreground">GET /api/v1/cubes</p>
                  <p className="text-muted-foreground">GET /api/v1/functions</p>
                  <p className="text-muted-foreground">GET /api/v1/compress/estimate</p>
                </div>
              </section>

              {/* Share & Send Section */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Share SDK Docs</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const docsUrl = `${window.location.origin}/docs/sdk`;
                      window.location.href = `mailto:?subject=eXeL AI Polling SDK&body=Check out the eXeL Governance Engine SDK:%0A%0A${encodeURIComponent(docsUrl)}%0A%0A9 APIs that change how decisions are made.`;
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="text-base">📧</span>
                    Email SDK link to myself
                  </button>
                  <button
                    onClick={() => {
                      const docsUrl = `${window.location.origin}/docs/sdk`;
                      if (navigator.share) {
                        navigator.share({ title: "eXeL AI SDK", text: "9 APIs that change how decisions are made", url: docsUrl });
                      } else {
                        navigator.clipboard.writeText(docsUrl);
                        alert("Link copied!");
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="text-base">📱</span>
                    Share to phone / copy link
                  </button>
                  <button
                    onClick={() => {
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + "/docs/sdk")}`;
                      window.open(qrUrl, "_blank");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="text-base">📷</span>
                    Show QR code
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
