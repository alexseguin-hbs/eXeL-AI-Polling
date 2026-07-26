"use client";

/**
 * HomeLauncher — the "mode of operation" preview shown to a Moderator on the HOME route while
 * authenticated. It renders the same <WorkspaceSelect> chooser used as the post-login landing
 * (/workspace), so the two entry points are visually identical. On the home route it appears as a
 * dismissible overlay (in-memory dismiss only, so it re-appears on each fresh home load / login);
 * the canonical post-login flow is the /workspace route (see app/callback → /workspace).
 * Innovation is intentionally NOT in the banner — it is a mode selected here.
 */
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth0 } from "@auth0/auth0-react";
import { WorkspaceSelect } from "@/components/workspace-select";

const HIDDEN_PATHS = ["/callback"];

export function HomeLauncher() {
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

  const onHome = pathname === "/";
  const hiddenHere = HIDDEN_PATHS.some((p) => pathname?.startsWith(p));
  if (!mounted || isLoading || !isAuthenticated || dismissed || hiddenHere || !onHome) return null;

  return <WorkspaceSelect onClose={() => setDismissed(true)} />;
}
