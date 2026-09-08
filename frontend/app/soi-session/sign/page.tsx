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
 *   ?f=<token>             a 24-hour file link: the recipient is a hand-off signer — no account, no login
 *                          (the offline path in the flow), the file seeded once per token on this device.
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
    <header className="mb-6 text-center">
      <div className="mb-2 flex justify-end"><SoiGlobe /></div>
      <TrinityGlyphs size="text-2xl" className="mb-2" />
      <Link href="/soi-session/" className="text-xs text-muted-foreground hover:text-primary">&larr; {t("soi.landing.title")}</Link>
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

/** A ?f= file is seeded ONCE per token on this device (reviewer 2026-09-08): an Auth0 round-trip or a reload that brings
 *  a restored draft back must not add the file a second time. The mark outlives the page in sessionStorage. */
const SEEDED_KEY = (token: string) => `exel-sign-seeded:${token}`;
const wasSeeded = (token: string): boolean => { try { return sessionStorage.getItem(SEEDED_KEY(token)) === "1"; } catch { return false; } };
const markSeeded = (token: string) => { try { sessionStorage.setItem(SEEDED_KEY(token), "1"); } catch { /* storage unreadable: the flow's own draft guard still holds */ } };

export default function SignPage() {
  const [q, setQ] = useState<{ e: string; s: string } | null>(null);
  const [seed, setSeed] = useState<{ name: string; bytes: Uint8Array } | null>(null);
  const [tmpState, setTmpState] = useState<"" | "ok" | "gone">("");
  const [fileLink, setFileLink] = useState("");                 // the ?f= token: this reader is a hand-off recipient, not a creator
  useEffect(() => {
    // The secret lives in the fragment, and a fragment-only navigation does not reload the page —
    // so re-read on hashchange/popstate too, and remount the flow (key below) when the link changes.
    const read = () => { const p = new URLSearchParams(window.location.search); setQ({ e: p.get("e") ?? "", s: secretFromLocation(window.location.search, window.location.hash) }); };
    read();
    window.addEventListener("hashchange", read); window.addEventListener("popstate", read);
    const off = () => { window.removeEventListener("hashchange", read); window.removeEventListener("popstate", read); };
    const f = new URLSearchParams(window.location.search).get("f");
    if (!new URLSearchParams(window.location.search).get("e")) {
      // ?f=<token>: a partly-signed file handed over by a 24-hour link (operator 01:25) — the token is the credential.
      // The recipient was promised no account: the flow treats this like the offline hand-off (no login at Sign & save).
      if (f) {
        setFileLink(f);
        if (wasSeeded(f)) { setTmpState("ok"); }                // already on this device (draft restore after a redirect / reload): never seed twice
        else void getTempFile(f).then((got) => { if (got) { markSeeded(f); setSeed({ name: got.name, bytes: got.bytes }); } else setSeed(takeSeed()); setTmpState(got ? "ok" : "gone"); });
      }
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
          <SignFlow seed={seed} fileLink={fileLink || undefined} requireLogin={!AUTH_OFF && !fileLink} returnTo={path} />
        </>
      )}
    </div>
  );
}
