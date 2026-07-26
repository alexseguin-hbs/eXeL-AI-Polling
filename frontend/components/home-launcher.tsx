"use client";

/**
 * HomeLauncher — the "mode of operations" preview shown to a Moderator on the home
 * page after Login. Same look & feel as the Vision 2525 launcher (shared <CubeLauncher>).
 * This preview ALWAYS shows on the home route while authenticated (operator directive,
 * 2026-07-26) — it is the single place both modes of operation are surfaced (Innovation
 * is intentionally NOT in the banner). Dismissal is in-memory only, so it re-appears on
 * every fresh home load / login.
 *
 *   1. eXeL AI Polling   (unlocked) → dismiss → existing landing page
 *   2. Innovation Project (locked · Unlock → routes to /innovation code gate 369963)
 *   3. Solution Brainstorm (locked · coming soon)
 */
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { useTheme } from "@/lib/theme-context";
import { CubeLauncher, type CubeDomain } from "@/components/cube-launcher";

// Only surface on the home route (post-login landing); never on the transient callback.
const HIDDEN_PATHS = ["/callback"];

export function HomeLauncher() {
  const { currentTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false); // in-memory only — preview re-shows each load
  const [mounted, setMounted] = useState(false);

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

  useEffect(() => { setMounted(true); }, []);
  // Re-show the preview whenever the moderator returns to the home route.
  useEffect(() => { if (pathname === "/") setDismissed(false); }, [pathname]);

  const dismiss = (navigateHome = false) => {
    setDismissed(true);
    if (navigateHome && pathname !== "/") router.push("/");
  };

  const onHome = pathname === "/";
  const hiddenHere = HIDDEN_PATHS.some((p) => pathname?.startsWith(p));
  if (!mounted || isLoading || !isAuthenticated || dismissed || hiddenHere || !onHome) return null;

  const domains: CubeDomain[] = [
    { id: "polling", code: "POLLING", name: "eXeL AI POLLING", tagline: "Govern at the Speed of Thought", color: currentTheme.swatch || "#19C8CF", unlocked: true, onEnter: () => dismiss(true) },
    { id: "innovation", code: "INNOVATION", name: "INNOVATION PROJECT", tagline: "Ideate · Prototype · Ship at the Speed of Thought", color: "#c084fc", unlocked: false, enterWhenLocked: true, onEnter: () => { dismiss(); router.push("/innovation"); } },
    { id: "brainstorm", code: "BRAINSTORM", name: "SOLUTION BRAINSTORM", tagline: "Explore · Diverge · Converge", color: "#f59e0b", unlocked: false },
  ];

  return (
    <CubeLauncher
      title="eXeL AI"
      subtitle="Select your mode of operation"
      footer="◬ · ♡ · 웃  —  One platform · Many missions · Transparency + accountability at every level"
      domains={domains}
    />
  );
}
