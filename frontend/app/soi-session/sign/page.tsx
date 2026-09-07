"use client";

/**
 * /soi-session/sign — two entrances on one route:
 *   ?e=<token>&s=<secret>  the countersigner's link: opens WITHOUT login (Sofia, round 1) — the
 *                          token + per-signer secret is the authorization, checked server-side;
 *   (no query)             the creator: behind AuthGuard (returnTo keeps the way back), name and
 *                          e-mail prefilled from the login. Without Auth0 configured (dev), or with
 *                          NEXT_PUBLIC_SIGN_NO_AUTH=1, the creator path runs unguarded — documented
 *                          like the Realtime relay: test scaffolding, never production posture.
 * Create Doc hands a generated PDF in through sessionStorage (`exel-sign-seed`).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth0 } from "@auth0/auth0-react";
import { AuthGuard } from "@/components/auth-guard";
import { SignFlow } from "@/components/sign/sign-flow";
import { useLexicon } from "@/lib/lexicon-context";
import { AUTH0_CLIENT_ID, AUTH0_DOMAIN } from "@/lib/constants";
import { useThemeHue } from "@/lib/theme-hue";
import { base64ToBytes } from "@/lib/pdf-render";
import { secretFromLocation } from "@/lib/sign-envelope";

const AUTH_OFF = !AUTH0_DOMAIN || !AUTH0_CLIENT_ID || process.env.NEXT_PUBLIC_SIGN_NO_AUTH === "1";

function Header() {
  const { t } = useLexicon();
  const hue = useThemeHue();
  return (
    <header className="mb-6 text-center">
      <div className="mb-2 font-mono text-2xl tracking-[0.3em]" aria-hidden="true">
        <span style={{ color: hue.bright }}>&#9708;</span>{" "}
        <span style={{ color: hue.bright }}>&#9825;</span>{" "}
        <span style={{ color: hue.bright }}>&#50883;</span>
      </div>
      <Link href="/soi-session/" className="text-xs text-muted-foreground hover:text-cyan-400">&larr; {t("soi.landing.title")}</Link>
    </header>
  );
}

function CreatorWithLogin({ seed }: { seed: { name: string; bytes: Uint8Array } | null }) {
  const { user } = useAuth0();
  return <SignFlow defaultName={user?.name && !user.name.includes("@") ? user.name : ""} defaultContact={user?.email ?? ""} seed={seed} />;
}

export default function SignPage() {
  const [q, setQ] = useState<{ e: string; s: string } | null>(null);
  const [seed, setSeed] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  useEffect(() => {
    // The secret lives in the fragment, and a fragment-only navigation does not reload the page —
    // so re-read on hashchange/popstate too, and remount the flow (key below) when the link changes.
    const read = () => { const p = new URLSearchParams(window.location.search); setQ({ e: p.get("e") ?? "", s: secretFromLocation(window.location.search, window.location.hash) }); };
    read();
    window.addEventListener("hashchange", read); window.addEventListener("popstate", read);
    const off = () => { window.removeEventListener("hashchange", read); window.removeEventListener("popstate", read); };
    try {
      const raw = sessionStorage.getItem("exel-sign-seed");
      if (raw) { const j = JSON.parse(raw) as { name: string; base64: string }; setSeed({ name: j.name, bytes: base64ToBytes(j.base64) }); sessionStorage.removeItem("exel-sign-seed"); }
    } catch { /* no seed */ }
    return off;
  }, []);
  if (!q) return <div className="mx-auto max-w-3xl px-4 py-10"><Header /></div>;
  const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/soi-session/sign/";
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Header />
      {q.e ? (
        <SignFlow key={`${q.e}:${q.s}`} token={q.e} secret={q.s} />
      ) : AUTH_OFF ? (
        <SignFlow seed={seed} />
      ) : (
        <AuthGuard returnTo={path}><CreatorWithLogin seed={seed} /></AuthGuard>
      )}
    </div>
  );
}
