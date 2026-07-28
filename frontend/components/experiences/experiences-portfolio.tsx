"use client";

// The portfolio the Experiences QR opens ("see the actual work"). Order (hiring-manager flow):
// Presentation & Writeup, Résumés, Industrial, Demo videos, EdTech · eXeL AI, IP/Patents (bottom).
// Every item is a consistent collapsible Card: an open-link icon on the LEFT, the title + badge as a
// 2-line default, an expand dropdown on the UPPER RIGHT, and the blurb (plus PDF View/Download) kept
// indented under the header when expanded. Copy avoids the em-dash on purpose. Titles use `truncate`
// so they stay on one line on phones. Rendered by both /experiences/docs and /main/experiences/docs.

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowLeft, Play, ExternalLink, Award, Cpu, FileText, GraduationCap, Download, Presentation, Rocket, ChevronDown, Film, Sparkles, TrendingUp, KeyRound, X } from "lucide-react";
import { LangSelect } from "@/components/experiences/lang-select";
import { useLexicon } from "@/lib/lexicon-context";

type CardKind = "pdf" | "link" | "video";
type Secret = { labelKey: string; view: string; download: string };
// A gated live-demo reveal (System of Innovation): the access code stays hidden until the visitor opts in.
type Demo = { labelKey: string; codeKey: string; openKey: string; href: string };
// An inline image shown under the card text by default (no toggle).
type CardImage = { src: string; altKey: string };
// Small label/value stats shown under the image (e.g. Build effort · estimated Value).
type Stat = { labelKey: string; valueKey: string };
type Item = { kind: CardKind; titleKey: string; blurbKey: string; href: string; badgeKey?: string; tagKey?: string; icon?: LucideIcon; secret?: Secret; demo?: Demo; image?: CardImage; stats?: Stat[]; defaultOpen?: boolean };

// ── Presentation & Writeup — the AI/ML strategy documents ───────────────────────────────────
const WRITEUPS: Item[] = [
  {
    kind: "pdf",
    icon: Presentation,
    titleKey: "experiences.card.writeup1.title",
    badgeKey: "experiences.card.writeup1.badge",
    blurbKey: "experiences.card.writeup1.blurb",
    href: "/experiences/eXeL_AI_Strategy_AIML_Software_Dev_Integration_A.Seguin.pdf",
  },
  {
    kind: "pdf",
    titleKey: "experiences.card.writeup2.title",
    badgeKey: "experiences.card.writeup2.badge",
    blurbKey: "experiences.card.writeup2.blurb",
    href: "/experiences/eXeL_AI_Strategy_Project_Description_A.Seguin_v2.pdf",
  },
  // Portfolio Optimization — the System of Innovation tool built on this platform. Defaults COLLAPSED;
  // expanding reveals the blurb, vision image, and a gated demo (Open SoI-2525 + access code 369963).
  {
    kind: "link",
    icon: TrendingUp,
    titleKey: "experiences.egg.soi.title",
    badgeKey: "experiences.egg.soi.badge",
    blurbKey: "experiences.egg.soi.blurb",
    href: "/main/SoI-2525/",
    image: { src: "/experiences/innovate-speed-of-thought.png", altKey: "experiences.egg.poster.alt" },
    stats: [
      { labelKey: "experiences.egg.soi.buildLabel", valueKey: "experiences.egg.soi.buildVal" },
      { labelKey: "experiences.egg.soi.valueLabel", valueKey: "experiences.egg.soi.valueVal" },
    ],
    demo: {
      labelKey: "experiences.egg.soi.demoLabel",
      codeKey: "experiences.egg.soi.demoCode",
      openKey: "experiences.egg.soi.demoOpen",
      href: "/main/SoI-2525/",
    },
  },
];

// ── Résumés — blurbs pulled from the actual documents ───────────────────────────────────────
const RESUMES: Item[] = [
  {
    kind: "pdf",
    titleKey: "experiences.card.resume1.title",
    badgeKey: "experiences.card.resume1.badge",
    blurbKey: "experiences.card.resume1.blurb",
    href: "/experiences/A.M.Seguin_Resume_HI_AI_Systems_Industrial_Defense.pdf",
  },
  {
    kind: "pdf",
    titleKey: "experiences.card.resume2.title",
    badgeKey: "experiences.card.resume2.badge",
    blurbKey: "experiences.card.resume2.blurb",
    href: "/experiences/ATS_ASeguin_Resume_TPM_20260126.pdf",
  },
];

// ── Industrial (shipped hardware) ───────────────────────────────────────────────────────────
const INDUSTRIAL: Item[] = [
  {
    kind: "link",
    titleKey: "experiences.card.ind1.title",
    badgeKey: "experiences.card.ind1.badge",
    blurbKey: "experiences.card.ind1.blurb",
    href: "https://defense.flir.com/about/news/muve-c360-on-spot-detects-gas-leak/",
  },
  {
    kind: "link",
    titleKey: "experiences.card.ind2.title",
    badgeKey: "experiences.card.ind2.badge",
    blurbKey: "experiences.card.ind2.blurb",
    href: "https://tinyurl.com/yc82z8v3",
  },
];

// ── IP / Patents (bottom) ───────────────────────────────────────────────────────────────────
const IP: Item[] = [
  {
    kind: "link",
    titleKey: "experiences.card.ip1.title",
    badgeKey: "experiences.card.ip1.badge",
    blurbKey: "experiences.card.ip1.blurb",
    href: "https://tinyurl.com/Sensor-Fusion-Patent",
    // hidden mini easter egg — a sensor-fusion deep-dive PDF, revealed on expand
    secret: {
      labelKey: "experiences.egg.sensorFusion",
      view: "https://drive.google.com/file/d/1NKlswkP17KJsluq_vbqTFMX_gmBnN9nO/view?usp=drivesdk",
      download: "https://drive.google.com/uc?export=download&id=1NKlswkP17KJsluq_vbqTFMX_gmBnN9nO",
    },
  },
  {
    kind: "link",
    titleKey: "experiences.card.ip2.title",
    badgeKey: "experiences.card.ip2.badge",
    blurbKey: "experiences.card.ip2.blurb",
    href: "https://patents.google.com/patent/US20240107160A1/en",
  },
];

// Demo videos — industrial & defense field demos (opens on YouTube).
const VIDEOS: Item[] = [
  { kind: "video", titleKey: "experiences.card.vid1.title", blurbKey: "experiences.card.vid1.blurb", href: "https://youtu.be/rpbb0AiM9fI" },
  { kind: "video", titleKey: "experiences.card.vid2.title", blurbKey: "experiences.card.vid2.blurb", href: "https://youtu.be/Ve7Yqs8uw5M" },
  { kind: "video", titleKey: "experiences.card.vid3.title", blurbKey: "experiences.card.vid3.blurb", href: "https://youtu.be/GGJyRyaE6y4" },
  { kind: "video", titleKey: "experiences.card.vid4.title", blurbKey: "experiences.card.vid4.blurb", href: "https://youtu.be/wbsUZAVa2zM" },
];

// EdTech · eXeL AI — the education presentation (leads) and product videos.
const EDTECH_PRESENTATION: Item = {
  kind: "link",
  icon: Presentation,
  titleKey: "experiences.card.edpres.title",
  blurbKey: "experiences.card.edpres.blurb",
  href: "https://tinyurl.com/eXeL-AI-SFO",
};

const EDTECH_VIDEOS: Item[] = [
  { kind: "video", titleKey: "experiences.card.edvid1.title", blurbKey: "experiences.card.edvid1.blurb", href: "https://tinyurl.com/eXeL-AI-Launch-Video" },
  { kind: "video", titleKey: "experiences.card.edvid2.title", blurbKey: "experiences.card.edvid2.blurb", href: "https://youtu.be/1hqutudJXF0?si=Nbzex0K0JT775Etu" },
  { kind: "video", titleKey: "experiences.card.edvid3.title", blurbKey: "experiences.card.edvid3.blurb", href: "https://tinyurl.com/27999v63" },
];

// eXeL AI Initiative — "Preparing AI to Serve the Future of Humanity" (educational vignettes).
const VIGNETTES: Item[] = [
  { kind: "video", titleKey: "experiences.card.vig1.title", blurbKey: "experiences.card.vig1.blurb", href: "https://youtu.be/xzhHllVpYgM" },
  { kind: "video", titleKey: "experiences.card.vig2.title", blurbKey: "experiences.card.vig2.blurb", href: "https://youtu.be/uNUW4c-leLo" },
  { kind: "video", titleKey: "experiences.card.vig3.title", blurbKey: "experiences.card.vig3.blurb", href: "https://youtu.be/HfXzn0KCLcs" },
  { kind: "video", titleKey: "experiences.card.vig4.title", blurbKey: "experiences.card.vig4.blurb", href: "https://youtu.be/hF_8Qg7F3KY" },
  { kind: "video", titleKey: "experiences.card.vig5.title", blurbKey: "experiences.card.vig5.blurb", href: "https://youtu.be/KN0t0eRo5-4" },
  { kind: "video", titleKey: "experiences.card.vig6.title", blurbKey: "experiences.card.vig6.blurb", href: "https://youtu.be/PwSL60rEDJU" },
  { kind: "video", titleKey: "experiences.card.vig7.title", blurbKey: "experiences.card.vig7.blurb", href: "https://youtu.be/wxHIYh2WRxM" },
  { kind: "video", titleKey: "experiences.card.vig8.title", blurbKey: "experiences.card.vig8.blurb", href: "https://youtu.be/LDTcLRhmuMo" },
];

function SectionHead({ icon, eyebrowKey, titleKey, introKey }: { icon: React.ReactNode; eyebrowKey: string; titleKey: string; introKey: string }) {
  const { t } = useLexicon();
  return (
    // Icon sits in its own left column so it stands out; the eyebrow (bold cyan header),
    // the white sub-title, and the intro are all indented under the header.
    <div className="mb-5 flex items-start gap-2.5">
      <span className="mt-1 shrink-0 text-primary">{icon}</span>
      <div className="min-w-0">
        <div className="text-base font-bold uppercase tracking-[0.14em] text-primary sm:text-lg">{t(eyebrowKey)}</div>
        <h2 className="mt-0.5 text-sm font-medium text-foreground">{t(titleKey)}</h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{t(introKey)}</p>
      </div>
    </div>
  );
}

// Unified collapsible card: open-link icon (left), title + badge (2-line default), expand dropdown
// (upper right). The blurb and PDF actions stay indented under the header when expanded.
function Card({ item }: { item: Item }) {
  const { t } = useLexicon();
  const [open, setOpen] = useState(item.defaultOpen ?? false);
  const [showCode, setShowCode] = useState(false); // gated demo reveal: code hidden until opt-in
  const [zoom, setZoom] = useState(false); // full-screen image lightbox
  const Icon = item.icon ?? (item.kind === "pdf" ? FileText : item.kind === "video" ? Play : ExternalLink);
  return (
    <>
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="flex items-start gap-3 p-4">
        {/* open link — LEFT */}
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${t(item.titleKey)}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          <Icon className="h-4 w-4" />
        </a>

        {/* header + badge (+ expanded blurb) stay under the header */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{t(item.titleKey)}</div>
          {(item.badgeKey || item.tagKey) && (
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {item.badgeKey && (
                <span className="inline-flex w-fit rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {t(item.badgeKey)}
                </span>
              )}
              {/* Blue framework tag pill */}
              {item.tagKey && (
                <span className="inline-flex w-fit rounded-full border border-blue-500/40 bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-300">
                  {t(item.tagKey)}
                </span>
              )}
            </div>
          )}
          {open && (
            <div className="mt-3">
              <p className="text-[13px] leading-relaxed text-muted-foreground">{t(item.blurbKey)}</p>
              {/* Inline image — shown under the text by default; click opens it full-screen */}
              {item.image && (
                <button
                  type="button"
                  onClick={() => setZoom(true)}
                  aria-label={`${t(item.image.altKey)} — view full screen`}
                  className="mt-3 block w-full cursor-zoom-in overflow-hidden rounded-lg border border-primary/20"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.image.src} alt={t(item.image.altKey)} className="block h-auto w-full" />
                </button>
              )}
              {/* Build / Value stats — under the image, before the demo toggle (label + value on one line each) */}
              {item.stats && item.stats.length > 0 && (
                <div className="mt-3 space-y-1.5 rounded-lg border border-border/60 bg-background/40 p-3">
                  {item.stats.map((s) => (
                    <div key={s.valueKey} className="flex items-baseline gap-2">
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-primary">{t(s.labelKey)}</span>
                      <span className="text-[13px] font-medium text-foreground">{t(s.valueKey)}</span>
                    </div>
                  ))}
                </div>
              )}
              {item.kind === "pdf" && (
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {t("experiences.view")}
                  </a>
                  <a
                    href={item.href}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium transition hover:border-primary/60 hover:text-primary"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t("experiences.download")}
                  </a>
                </div>
              )}
              {/* hidden mini easter egg — revealed only when the card is expanded */}
              {item.secret && (
                <div className="mt-3 rounded-lg border border-primary/25 bg-primary/5 p-2.5">
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-primary/80">
                    <Sparkles className="h-3 w-3" /> {t(item.secret.labelKey)}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={item.secret.view}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {t("experiences.view")}
                    </a>
                    <a
                      href={item.secret.download}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium transition hover:border-primary/60 hover:text-primary"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("experiences.download")}
                    </a>
                  </div>
                </div>
              )}
              {/* Gated live-demo reveal — the access code is MINIMIZED by default; this toggle reveals it
                  and can collapse it again (click once to show, again to hide). */}
              {item.demo && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowCode((o) => !o)}
                    aria-expanded={showCode}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/10"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {t(item.demo.labelKey)}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCode ? "rotate-180" : ""}`} />
                  </button>
                  {showCode && (
                    <div className="mt-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5">
                      {/* Link to open the tool, then the access code directly under it */}
                      <a
                        href={item.demo.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t(item.demo.openKey)}
                      </a>
                      <div className="mt-2 flex items-center gap-2 font-mono text-sm font-semibold tracking-wide text-foreground">
                        <KeyRound className="h-4 w-4 shrink-0 text-primary" />
                        <span>{t(item.demo.codeKey)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* expand dropdown — UPPER RIGHT */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Toggle details"
          className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:text-primary"
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
    </div>

    {/* Full-screen image lightbox — click anywhere (or ✕) to close */}
    {zoom && item.image && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        onClick={() => setZoom(false)}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={() => setZoom(false)}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image.src} alt={t(item.image.altKey)} className="max-h-full max-w-full object-contain" />
      </div>
    )}
    </>
  );
}

// Expandable "Video Vignettes" group — default collapsed (minimized); reveals vignette cards.
function VideoVignettes() {
  const { t } = useLexicon();
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border/60 bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Film className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="font-medium">{t("experiences.vignettes.title")}</div>
            {/* Collapsed: truncate to one line. Expanded: wrap so the full banner is readable
                (operator: "can't read after …"). */}
            <p className={`text-[13px] text-muted-foreground ${open ? "" : "truncate"}`}>
              {t("experiences.vignettes.banner")}
            </p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-3 border-t border-border/60 p-4 sm:grid-cols-2">
          {VIGNETTES.map((v) => (
            <Card key={v.href} item={v} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ExperiencesPortfolio({ basePath }: { basePath: string }) {
  const { t } = useLexicon();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <Link href={basePath} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {t("experiences.navLabel")}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/70">{t("experiences.tag.portfolio")}</span>
          <LangSelect />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
        {/* Intro — centered masthead: name (largest), eyebrow, headline, then the summary */}
        <div className="text-center">
          <p className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{t("experiences.name")}</p>
          <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-primary/70">{t("experiences.work.eyebrow")}</p>
          <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
            {t("experiences.work.h1")}
          </h1>
          <p className="mt-4 max-w-2xl text-left text-[15px] leading-relaxed text-muted-foreground">
            {t("experiences.work.intro")}
          </p>
        </div>

        {/* 1 · Presentation & Writeup (lead) */}
        <section className="mt-12">
          <SectionHead
            icon={<Presentation className="h-4 w-4" />}
            eyebrowKey="experiences.sec.writeups.eyebrow"
            titleKey="experiences.sec.writeups.title"
            introKey="experiences.sec.writeups.intro"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {WRITEUPS.map((c) => (
              <Card key={c.href} item={c} />
            ))}
          </div>
        </section>

        {/* 2 · Résumés */}
        <section className="mt-12">
          <SectionHead
            icon={<GraduationCap className="h-4 w-4" />}
            eyebrowKey="experiences.sec.resumes.eyebrow"
            titleKey="experiences.sec.resumes.title"
            introKey="experiences.sec.resumes.intro"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {RESUMES.map((c) => (
              <Card key={c.href} item={c} />
            ))}
          </div>
        </section>

        {/* 3 · Industrial */}
        <section className="mt-12">
          <SectionHead
            icon={<Cpu className="h-4 w-4" />}
            eyebrowKey="experiences.sec.industrial.eyebrow"
            titleKey="experiences.sec.industrial.title"
            introKey="experiences.sec.industrial.intro"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {INDUSTRIAL.map((c) => (
              <Card key={c.href} item={c} />
            ))}
          </div>
        </section>

        {/* 4 · Demo videos */}
        <section className="mt-12">
          <SectionHead
            icon={<Play className="h-4 w-4" />}
            eyebrowKey="experiences.sec.videos.eyebrow"
            titleKey="experiences.sec.videos.title"
            introKey="experiences.sec.videos.intro"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {VIDEOS.map((v) => (
              <Card key={v.href} item={v} />
            ))}
          </div>
        </section>

        {/* 5 · EdTech · eXeL AI (presentation first, then videos, then vignettes) — before IP */}
        <section className="mt-12">
          <SectionHead
            icon={<Rocket className="h-4 w-4" />}
            eyebrowKey="experiences.sec.edtech.eyebrow"
            titleKey="experiences.sec.edtech.title"
            introKey="experiences.sec.edtech.intro"
          />
          <div className="grid gap-3">
            <Card item={EDTECH_PRESENTATION} />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {EDTECH_VIDEOS.map((v) => (
              <Card key={v.href} item={v} />
            ))}
          </div>
          {/* Video Vignettes — expandable, default minimized */}
          <VideoVignettes />
        </section>

        {/* 6 · IP / Patents (bottom) */}
        <section className="mt-12">
          <SectionHead
            icon={<Award className="h-4 w-4" />}
            eyebrowKey="experiences.sec.ip.eyebrow"
            titleKey="experiences.sec.ip.title"
            introKey="experiences.sec.ip.intro"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {IP.map((c) => (
              <Card key={c.href} item={c} />
            ))}
          </div>
        </section>

        <p className="mt-12 text-center text-xs leading-relaxed text-muted-foreground/80">
          {t("experiences.portfolio.footer")}
        </p>
      </main>
    </div>
  );
}
