"use client";

/**
 * HomeLauncher — post-login interstitial on the website home page.
 * Same look & feel as the Vision 2525 launcher (shared <CubeLauncher>). Shown
 * once per browser session after a Moderator authenticates.
 *
 *   1. eXeL AI Polling  (unlocked) → dismiss → existing landing page
 *   2. Innovation Project (locked)
 *   3. Solution Brainstorm (locked)
 */
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { useTheme } from "@/lib/theme-context";
import { CubeLauncher, type CubeDomain } from "@/components/cube-launcher";

const DISMISS_KEY = "exel-home-launcher-dismissed";
// Don't surface the interstitial on the transient Auth0 callback route.
const HIDDEN_PATHS = ["/callback"];

export function HomeLauncher() {
  const { currentTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true); // hidden until we confirm auth + storage
  const [ready, setReady] = useState(false);

  // Auth0 may be absent (participant view) — guard.
  let isAuthenticated = false;
  let isLoading = true;
  try {
    const a = useAuth0();
    isAuthenticated = a.isAuthenticated;
    isLoading = a.isLoading;
  } catch {
    isLoading = false;
  }

  useEffect(() => {
    const already = typeof window !== "undefined" && sessionStorage.getItem(DISMISS_KEY) === "1";
    setDismissed(already);
    setReady(true);
  }, []);

  const dismiss = (navigateHome = false) => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    setDismissed(true);
    if (navigateHome && pathname !== "/") router.push("/");
  };

  const hiddenHere = HIDDEN_PATHS.some((p) => pathname?.startsWith(p));
  if (!ready || isLoading || !isAuthenticated || dismissed || hiddenHere) return null;

  const domains: CubeDomain[] = [
    { id: "polling", code: "POLLING", name: "eXeL AI POLLING", tagline: "Govern at the Speed of Thought", color: currentTheme.swatch || "#19C8CF", unlocked: true, onEnter: () => dismiss(true) },
    { id: "innovation", code: "INNOVATION", name: "INNOVATION PROJECT", tagline: "Ideate · Prototype · Ship", color: "#c084fc", unlocked: true, onEnter: () => { dismiss(); router.push("/innovation"); } },
    { id: "brainstorm", code: "BRAINSTORM", name: "SOLUTION BRAINSTORM", tagline: "Explore · Diverge · Converge", color: "#f59e0b", unlocked: false },
  ];

  return (
    <CubeLauncher
      title="eXeL AI"
      subtitle="Select your workspace"
      footer="◬ · ♡ · 웃  —  One platform · Many missions"
      domains={domains}
    />
  );
}
