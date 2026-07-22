"use client";

// Experiences landing — a polling-style QR that expands with a shareable link to the
// portfolio (<basePath>/docs). Rendered by both /experiences and /main/experiences so
// either URL works. Copy is written to land with hiring managers globally: heart (the
// person who built real things), mind (evidence), spirit (work in service of more).
// Reuses QRCodeSVG exactly like app/sim/page.tsx.

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, ArrowRight, Copy, Check, QrCode } from "lucide-react";
import { SITE_URL } from "@/lib/atlantis-package";

export function ExperiencesLanding({ basePath }: { basePath: string }) {
  const docsPath = `${basePath}/docs`;
  const [copied, setCopied] = useState(false);

  // QR encodes the ABSOLUTE production URL (not window.location.origin) so anyone who
  // scans it — on any device, from any host — lands on the live portfolio docs page.
  const docsUrl = `${SITE_URL}${docsPath}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(docsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the QR + visible link still work */
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          eXeL AI
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/70">Experiences</span>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-5 py-10 sm:py-16">
        <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-primary/70">
          A window into real work
        </p>
        <h1 className="text-balance text-center text-3xl font-semibold leading-tight sm:text-4xl">
          Don&apos;t take my word for it. <span className="text-primary">See the work.</span>
        </h1>
        <p className="mt-3 text-center text-base font-semibold text-primary">Alex Seguin</p>
        <p className="mt-4 max-w-lg text-balance text-center text-[15px] leading-relaxed text-muted-foreground">
          A short, honest portfolio. Things I&apos;ve built, shipped, and been recognized for: sensor-fusion
          systems in the field, a patent Apple has cited twice, and the AI platform you&apos;re looking at now.
          Scan the code or open the link to explore.
        </p>

        <div className="mt-10 flex w-full flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <QRCodeSVG value={docsUrl} size={168} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <QrCode className="h-3.5 w-3.5" />
            Scan to open the portfolio on any device
          </div>

          <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row">
            <div className="flex min-w-0 flex-1 items-center rounded-lg border border-border/60 bg-background px-3 py-2">
              <span className="truncate font-mono text-xs text-muted-foreground">{docsUrl}</span>
            </div>
            <button
              onClick={copyLink}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-2 text-xs font-medium transition hover:border-primary/60 hover:text-primary"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy link"}
            </button>
          </div>

          <Link
            href={docsPath}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Open the portfolio
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-8 max-w-md text-balance text-center text-xs leading-relaxed text-muted-foreground/80">
          Built on the eXeL AI governance engine, where shared intention moves at the speed of thought.
        </p>
      </main>
    </div>
  );
}
