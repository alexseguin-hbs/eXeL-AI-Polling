"use client";
// CACHE CLASS — fix the class, not the instance (operator 2026-11-06: "WHERES MY RASTER"; and Ghana unseen).
// Three times before, a page the operator held was older than the page the site served (r143 · r.202 · DD-81),
// and each fix was server-side (no-cache, must-revalidate in worker.js). But no-cache cannot force a session
// that is ALREADY open to refetch — iOS Safari restores a backgrounded tab from memory without hitting the
// network, so a shipped change (his WALK MODE raster, the Ghana pilot) stays invisible until the tab is killed.
// This closes the class on the CLIENT: the running build knows its own SHA (NEXT_PUBLIC_GIT_SHA, baked at build
// and shown in the footer banner); it polls /version.json (written at build from the same SHA) and, when the
// deployed SHA differs, reloads ONCE per new SHA per session (sessionStorage loop-guard, so a genuinely stale
// deploy can never cause a reload storm). Silent, visible-tab-only. A no-op in dev (sha "dev").
import { useEffect, useRef } from "react";

const BUILD_SHA = (process.env.NEXT_PUBLIC_GIT_SHA || "").slice(0, 7);

export function FreshBuildGuard() {
  const reloaded = useRef(false);
  useEffect(() => {
    if (!BUILD_SHA || BUILD_SHA === "dev") return; // local/dev or no stamp — never auto-reload
    let cancelled = false;
    const check = async () => {
      if (reloaded.current) return;
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/version.json?ts=${Date.now()}`, { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const live = String(data?.sha || "").slice(0, 7);
        if (!live || live === BUILD_SHA || cancelled) return;
        // A new build is deployed. Reload at most ONCE per new SHA per session — if the reload lands on the
        // same old bundle (a deploy that is genuinely not serving), the flag prevents a reload storm.
        const key = `v2525.freshreload.${live}`;
        let already = false;
        try { already = sessionStorage.getItem(key) === "1"; } catch { /* private mode */ }
        if (already) return;
        try { sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
        reloaded.current = true;
        location.reload();
      } catch { /* offline / blocked — try again next tick */ }
    };
    const onVisible = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    const id = window.setInterval(check, 60_000);
    check();
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      window.clearInterval(id);
    };
  }, []);
  return null;
}
