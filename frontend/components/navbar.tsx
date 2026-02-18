"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { LogOut, User, Menu, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeratorSettings } from "@/components/moderator-settings";
import { TokenHUD } from "@/components/token-hud";
import { useState } from "react";

interface NavbarProps {
  sessionTitle?: string;
}

export function Navbar({ sessionTitle }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <>
      <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2">
            <a href="/" className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">eXeL</span>
              <span className="text-lg font-light text-muted-foreground">
                AI Polling
              </span>
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
                        Settings
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
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {isAuthenticated && (
        <ModeratorSettings
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          userEmail={user?.email}
        />
      )}
    </>
  );
}
