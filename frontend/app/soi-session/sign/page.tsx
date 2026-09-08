"use client";

/**
 * /soi-session/sign — two entrances on one route:
 *   ?e=<token>&s=<secret>  the countersigner's link: opens WITHOUT login (Sofia, round 1) — the
 *                          token + per-signer secret is the authorization, checked server-side;
 *   (no query)             the creator: upload, place and draw run UNGUARDED; the login is asked at
 *                          the moment of "Sign & save" (the draft rides across the redirect in
 *                          sessionStorage — operator 2026-09-07, "I still cannot sign" from a phone
 *                          that met Auth0 before it met the upload). Without Auth0 configured (dev),
 *                          or with NEXT_PUBLIC_SIGN_NO_AUTH=1, no login is asked at all — test
 *                          scaffolding, never production posture.
 * Create Doc hands a generated PDF in through sessionStorage (`exel-sign-seed`).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { SignFlow } from "@/components/sign/sign-flow";
import { useLexicon } from "@/lib/lexicon-context";
import { AUTH0_CLIENT_ID, AUTH0_DOMAIN } from "@/lib/constants";
import { TrinityGlyphs } from "@/components/trinity-glyphs";
import { SoiGlobe } from "@/components/soi-globe";
import { base64ToBytes } from "@/lib/pdf-render";
import { secretFromLocation } from "@/lib/sign-envelope";
import { getTempFile } from "@/lib/tmpfile";

const AUTH_OFF = !AUTH0_DOMAIN || !AUTH0_CLIENT_ID || process.env.NEXT_PUBLIC_SIGN_NO_AUTH === "1";

function TmpGone() { const { t } = useLexicon(); return <>{t("soi.sign.tmp.gone")}</>; }
function Header() {
  const { t } = useLexicon();
  return (
    <header className="relative mb-6 text-center">
      <SoiGlobe className="absolute right-0 top-0" />
      <TrinityGlyphs size="text-2xl" className="mb-2" />
      <Link href="/soi-session/" className="text-xs text-muted-foreground hover:text-cyan-400">&larr; {t("soi.landing.title")}</Link>
    </header>
  );
}

/** The Create-Doc seed is consumed once, on the creator path only (never on a countersign link). */
function takeSeed(): { name: string; bytes: Uint8Array } | null {
  try {
    const raw = sessionStorage.getItem("exel-sign-seed");
    if (!raw) return null;
    const j = JSON.parse(raw) as { name: string; base64: string }; sessionStorage.removeItem("exel-sign-seed");
    return { name: j.name, bytes: base64ToBytes(j.base64) };
  } catch { return null; }
}

export default function SignPage() {
  const [q, setQ] = useState<{ e: string; s: string } | null>(null);
  const [seed, setSeed] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [tmpState, setTmpState] = useState<"" | "ok" | "gone">("");
  useEffect(() => {
    // The secret lives in the fragment, and a fragment-only navigation does not reload the page —
    // so re-read on hashchange/popstate too, and remount the flow (key below) when the link changes.
    const read = () => { const p = new URLSearchParams(window.location.search); setQ({ e: p.get("e") ?? "", s: secretFromLocation(window.location.search, window.location.hash) }); };
    read();
    window.addEventListener("hashchange", read); window.addEventListener("popstate", read);
    const off = () => { window.removeEventListener("hashchange", read); window.removeEventListener("popstate", read); };
    const f = new URLSearchParams(window.location.search).get("f");
    if (!new URLSearchParams(window.location.search).get("e")) {
      // ?f=<token>: a partly-signed file handed over by a 24-hour link (operator 01:25) — the token is the credential
      if (f) { void getTempFile(f).then((got) => { if (got) setSeed({ name: got.name, bytes: got.bytes }); else setSeed(takeSeed()); setTmpState(got ? "ok" : "gone"); }); }
      else setSeed(takeSeed());
    }
    return off;
  }, []);
  if (!q) return <div className="mx-auto max-w-3xl px-4 py-10"><Header /></div>;
  const path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/soi-session/sign/";
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <Header />
      {q.e ? (
        <SignFlow key={`${q.e}:${q.s}`} token={q.e} secret={q.s} />
      ) : (
        <>
          {tmpState === "gone" && <p className="mb-3 rounded-md border border-red-500/40 bg-red-500/5 p-2 text-xs text-red-500" data-testid="tmp-gone"><TmpGone /></p>}
          <SignFlow seed={seed} requireLogin={!AUTH_OFF} returnTo={path} />
        </>
      )}
    </div>
  );
}
