"use client";

// Experiences landing — a polling-style QR that expands with a shareable link to the
// portfolio (<basePath>/docs). Rendered by both /experiences and /main/experiences so
// either URL works. Copy is written to land with hiring managers globally: heart (the
// person who built real things), mind (evidence), spirit (work in service of more).
// Reuses QRCodeSVG exactly like app/sim/page.tsx.

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, ArrowRight, Copy, Check, QrCode, Download } from "lucide-react";
import { SITE_URL } from "@/lib/atlantis-package";
import { LangSelect } from "@/components/experiences/lang-select";
import { useLexicon } from "@/lib/lexicon-context";

// Pre-rendered one-page US-Letter (8.5×11) PDF of this résumé, served statically so the download is a
// real file with an exact name — reliable on every device (mobile Safari included), unlike print-to-PDF.
const RESUME_PDF = "/experiences/Resume.Digital_A.Seguin_2026.pdf";
// Ctrl/⌘-P still yields a clean page: hide chrome, keep Letter size + exact colors.
const PRINT_CSS = `
@media print {
  @page { size: 8.5in 11in portrait; margin: 0.5in; }
  html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #0a0f16 !important; }
  .exp-noprint { display: none !important; }
}`;

export function ExperiencesLanding({ basePath }: { basePath: string }) {
  const { t } = useLexicon();
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
      <style>{PRINT_CSS}</style>
      <header className="exp-noprint flex items-center justify-between border-b border-border/50 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          eXeL AI
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/70">{t("experiences.tag.experiences")}</span>
          <LangSelect />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-5 py-10 sm:py-16">
        <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-primary/70">
          {t("experiences.landing.eyebrow")}
        </p>
        <h1 className="text-balance text-center text-3xl font-semibold leading-tight sm:text-4xl">
          {t("experiences.landing.headline")} <span className="text-primary">{t("experiences.landing.headlineAccent")}</span>
        </h1>
        <p className="mt-3 text-center text-base font-semibold text-foreground">{t("experiences.name")}</p>
        <p className="mt-4 max-w-lg text-balance text-center text-[15px] leading-relaxed text-muted-foreground">
          {t("experiences.landing.intro")}
        </p>

        <div className="mt-10 flex w-full flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <div className="rounded-xl bg-white p-3 shadow-sm">
            <QRCodeSVG value={docsUrl} size={168} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <QrCode className="h-3.5 w-3.5" />
            {t("experiences.landing.scanHint")}
          </div>

          {/* URL with a standard copy icon inline on the right (no separate button) */}
          <div className="flex w-full items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">{docsUrl}</span>
            <button
              onClick={copyLink}
              aria-label={copied ? t("experiences.copied") : t("experiences.copyLink")}
              title={copied ? t("experiences.copied") : t("experiences.copyLink")}
              className="exp-noprint shrink-0 rounded p-1 text-muted-foreground transition hover:text-primary"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <Link
            href={docsPath}
            className="exp-noprint inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {t("experiences.landing.open")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* The governance provenance line IS the download link — a download symbol precedes the text (no
            "Download PDF" words). Clicking it saves the one-page 8.5×11 PDF Resume.Digital_A.Seguin_2026. */}
        <div className="mt-8 text-center">
          <a
            href={RESUME_PDF}
            download="Resume.Digital_A.Seguin_2026.pdf"
            title="Download PDF — Resume.Digital_A.Seguin_2026"
            className="mx-auto inline-flex max-w-md items-center justify-center gap-1.5 text-balance text-center text-[11px] italic leading-relaxed text-muted-foreground/70 transition hover:text-primary"
          >
            <Download className="h-3.5 w-3.5 shrink-0" />
            {t("experiences.landing.footer")}
          </a>
        </div>
      </main>
    </div>
  );
}
