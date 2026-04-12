"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { LogOut, User, Menu, Settings, Code, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeratorSettings } from "@/components/moderator-settings";
import { TokenHUD } from "@/components/token-hud";
import { useLexicon } from "@/lib/lexicon-context";
import { useState } from "react";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { SeedOfLifeLogo } from "@/components/seed-of-life-logo";
import { useTheme } from "@/lib/theme-context";
import { getSortedLanguages } from "@/lib/language-utils";

interface NavbarProps {
  sessionTitle?: string;
}

export function Navbar({ sessionTitle }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiSdkOpen, setApiSdkOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { t, activeLocale, setActiveLocale, languages, pinyinEnabled, setPinyinEnabled } = useLexicon();
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

            {/* Language selector — visible only when NOT authenticated (visitors + pollers) */}
            {/* Moderators access language via Settings panel — no redundant Globe icon */}
            {!isAuthenticated && <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLangOpen((p) => !p)}
                title={t("cube1.join.select_language")}
                className="flex items-center gap-1"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline text-xs uppercase">{activeLocale}</span>
              </Button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-1 w-56 max-h-80 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
                    {(() => {
                      const { sorted, pinnedCount } = getSortedLanguages(languages);
                      return sorted.map((lang, i) => (
                        <div key={lang.code}>
                          <button
                            onClick={() => { setActiveLocale(lang.code); setLangOpen(false); }}
                            className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-sm hover:bg-accent ${activeLocale === lang.code ? "bg-accent font-medium" : ""}`}
                          >
                            <span>{lang.nameNative}</span>
                            <span className="text-muted-foreground text-xs">({lang.nameEn})</span>
                          </button>
                          {i === pinnedCount - 1 && sorted.length > pinnedCount && (
                            <div className="my-1 border-t" />
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </>
              )}
            </div>}

            {/* Pinyin toggle — only when Mandarin (zh) is active */}
            {activeLocale === "zh" && (
              <Button
                variant={pinyinEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setPinyinEnabled(!pinyinEnabled)}
                className="text-[10px] px-2 h-7"
                title={pinyinEnabled ? "Hide Pinyin" : "Show Pinyin"}
              >
                拼音
              </Button>
            )}

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
                      <a
                        href="/api"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                      >
                        <Code className="h-4 w-4" />
                        {t("sdk.api_key.title")}
                      </a>
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
                      <a
                        href="/api"
                        onClick={() => setMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent"
                      >
                        <Code className="h-4 w-4" />
                        {t("sdk.api_key.title")}
                      </a>
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
              {/* Hero — What This Is */}
              <section className="text-center pb-3 border-b">
                <p className="text-sm text-primary font-semibold">{t("sdk.hero.title")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("sdk.hero.subtitle")}</p>
              </section>

              {/* The 9 SDK Functions — Expandable Demos */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("sdk.functions.heading")}</h3>
                <div className="space-y-2">
                  {[
                    { num: "1", name: "compress", icon: "🧠", tagline: "Understand anything", desc: "1M voices → 3 truths in 60s", cost: "5◬/1K", demo: "const themes = await sdk.compress(citizenComments);\n// → ['Healthcare', 'Education', 'Economy']" },
                    { num: "2", name: "vote", icon: "🗳️", tagline: "Govern fairly", desc: "Quadratic voting — no whale domination", cost: "0.01◬", demo: "await sdk.vote(session, ['theme1', 'theme2', 'theme3']);\n// sqrt(stake) weight + anti-sybil" },
                    { num: "3", name: "convert", icon: "웃", tagline: "Value human time", desc: "$7.25 = 1 hour = 1.0 웃 token", cost: "Free", demo: "const tokens = await sdk.convert(50.00);\n// → 6.897 웃 (tracks who invests)" },
                    { num: "4", name: "detect", icon: "🛡️", tagline: "Clean before you count", desc: "Exclude bad actors before math", cost: "1◬", demo: "const scan = await sdk.detect(session);\n// → 3 bot accounts excluded" },
                    { num: "5", name: "consensus", icon: "📊", tagline: "Watch agreement form", desc: "Live convergence score (0→1)", cost: "0.5◬", demo: "const live = await sdk.consensus(session);\n// → 73% converged on 'Theme A'" },
                    { num: "6", name: "verify", icon: "🔐", tagline: "Prove it's real", desc: "SHA-256 determinism proof", cost: "Free", demo: "const proof = await sdk.verify(session);\n// → { match: true, hash: 'a3f8c2...' }" },
                    { num: "7", name: "challenge", icon: "⚡", tagline: "Build the future", desc: "Submit code. Community votes. Deploy.", cost: "10◬", demo: "await sdk.challenge(7, myBetterCode);\n// → 88.2% approved → deployed live" },
                    { num: "8", name: "override", icon: "⚖️", tagline: "Lead transparently", desc: "Authority with public justification", cost: "2◬", demo: 'await sdk.override(session, theme, 1, "Board directive");\n// Immutable. Public. Accountable.' },
                    { num: "9", name: "broadcast", icon: "📡", tagline: "Reach everyone", desc: "1M recipients in <500ms", cost: "1◬/10K", demo: "await sdk.broadcast(session, results);\n// → 100 shards, 1M devices, instant" },
                  ].map((fn) => (
                    <details key={fn.num} className="rounded-lg border bg-muted/20">
                      <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent/50 rounded-lg">
                        <span className="text-base">{fn.icon}</span>
                        <span className="text-sm font-medium flex-1">sdk.{fn.name}()</span>
                        <span className="text-[10px] text-primary/70 font-mono">{fn.cost}</span>
                      </summary>
                      <div className="px-3 pb-3 pt-1 border-t">
                        <p className="text-xs text-primary font-semibold">{fn.tagline}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{fn.desc}</p>
                        <pre className="mt-2 text-[10px] bg-background rounded p-2 font-mono text-muted-foreground overflow-x-auto">{fn.demo}</pre>
                      </div>
                    </details>
                  ))}
                </div>
              </section>

              {/* API Key */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("sdk.api_key.generate")}</h3>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <code className="block text-xs bg-background rounded p-2 font-mono text-primary/80 break-all">
                    exel_pk_●●●●●●●●_●●●●●●●●●●●●●●●●
                  </code>
                  <div className="flex gap-2 mt-2">
                    <button className="text-xs px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90">{t("sdk.api_key.generate")}</button>
                    <button className="text-xs px-3 py-1.5 rounded border hover:bg-accent">{t("sdk.api_key.copy")}</button>
                  </div>
                </div>
              </section>

              {/* Quick Embed */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("sdk.embed.title")}</h3>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <code className="block text-[10px] bg-background rounded p-2 font-mono text-muted-foreground break-all">
                    {`<iframe src="https://exel-ai-polling.explore-096.workers.dev/embed?key=exel_pk_..." />`}
                  </code>
                </div>
              </section>

              {/* Usage */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("sdk.usage.title")}</h3>
                <div className="rounded-lg border bg-muted/30 p-3 flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("sdk.usage.total_calls")}</span>
                  <span className="font-mono text-primary">0 ◬</span>
                </div>
              </section>

              {/* Share & Send Section */}
              <section>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">{t("sdk.share.heading")}</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const docsUrl = `${window.location.origin}/docs/sdk`;
                      window.location.href = `mailto:?subject=eXeL AI Polling SDK&body=Check out the eXeL Governance Engine SDK:%0A%0A${encodeURIComponent(docsUrl)}%0A%0A9 APIs that change how decisions are made.`;
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="text-base">📧</span>
                    {t("api.share.email")}
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
                    {t("api.share.phone")}
                  </button>
                  <button
                    onClick={async () => {
                      // Use our own Cube 1 QR generator via backend API
                      const sdkUrl = `${window.location.origin}/api`;
                      try {
                        const resp = await fetch(`/api/v1/sessions/qr-generate?data=${encodeURIComponent(sdkUrl)}`);
                        if (resp.ok) {
                          const blob = await resp.blob();
                          const url = URL.createObjectURL(blob);
                          window.open(url, "_blank");
                        } else {
                          // Fallback: open URL directly for manual QR generation
                          window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sdkUrl)}`, "_blank");
                        }
                      } catch {
                        window.open(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sdkUrl)}`, "_blank");
                      }
                    }}
                    className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"
                  >
                    <span className="text-base">📷</span>
                    {t("sdk.share.qr_scan")}
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
