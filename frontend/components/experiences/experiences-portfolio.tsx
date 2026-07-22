"use client";

// The portfolio the Experiences QR opens ("see the actual work"). Order (hiring-manager flow):
// Writeup & Presentation → Résumés → Industrial → Demo videos → EdTech · eXeL AI → IP/Patents (bottom).
// Every blurb reflects the real contents of the document/link it points to. Rendered by both
// /experiences/docs and /main/experiences/docs. Video cards LINK OUT in a new tab (zero CSP risk).
// PDF cards give View (browser reader) + Download; the PDFs are hosted in frontend/public/experiences/
// and serve at /experiences/<file>. Copy is written to land with hiring managers globally.

import Link from "next/link";
import { ArrowLeft, Play, ExternalLink, Award, Cpu, FileText, GraduationCap, Download, Presentation, Rocket } from "lucide-react";

type LinkCard = { title: string; blurb: string; href: string; badge?: string };

// ── Writeup & Presentation — the AI/ML strategy documents ───────────────────────────────────
const WRITEUPS: LinkCard[] = [
  {
    title: "AI/ML Strategy — Project Description & Plan (v2)",
    blurb:
      "The executive presentation: the value proposition, a 4-phase $18M work plan with milestones and a rough-order budget, the operational metrics it moves, and its broader national impact — the same vision, decision-ready.",
    href: "/experiences/eXeL_AI_Strategy_Project_Description_A.Seguin_v2.pdf",
    badge: "Presentation · plan",
  },
  {
    title: "AI/ML Software & Integration — Full Writeup",
    blurb:
      "The complete 21-page technical writeup: an AI platform ecosystem integrating the Army IVAS headset with ground robots, drones, and edge AI — problem framing, CONOPs, sensor-fusion architecture, and an OODA-loop decision-support model, end to end.",
    href: "/experiences/eXeL_AI_Strategy_AIML_Software_Dev_Integration_A.Seguin.pdf",
    badge: "Writeup · 21 pp",
  },
];

// ── Résumés — blurbs pulled from the actual documents ───────────────────────────────────────
const RESUMES: LinkCard[] = [
  {
    title: "Résumé — HI + AI Systems (Industrial & Defense)",
    blurb:
      "15+ years leading perception, sensor-fusion, and autonomy products across defense and industrial — Athena AI / Teal-2, Shield AI's first $25M R&D roadmap, FLIR's $200M portfolio, and 15+ Fluke thermal & acoustic launches — with an active SECRET clearance and the Apple-cited sensor-fusion patent.",
    href: "/experiences/A.M.Seguin_Resume_HI_AI_Systems_Industrial_Defense.pdf",
    badge: "Résumé · systems",
  },
  {
    title: "Résumé — Technical Product Manager (ATS)",
    blurb:
      "The same career, framed for product leadership: end-to-end delivery, R&D-portfolio governance, and risk management with hard outcomes — a $200M portfolio consolidated toward an $8B acquisition, 12% CAGR on a $3B business, and 20× developer throughput via AI automation.",
    href: "/experiences/ATS_ASeguin_Resume_TPM_20260126.pdf",
    badge: "Résumé · ATS-ready",
  },
];

// ── Industrial (shipped hardware) ───────────────────────────────────────────────────────────
const INDUSTRIAL: LinkCard[] = [
  {
    title: "Boston Dynamics Spot · MUVE C360",
    blurb: "Gas-leak detection mounted on Spot — a shipped integration keeping people out of harm's way.",
    href: "https://defense.flir.com/about/news/muve-c360-on-spot-detects-gas-leak/",
    badge: "In the field",
  },
  {
    title: "Handheld Acoustic Imager · ii900",
    blurb: "Led a handheld acoustic-imaging product from MVP to market — a new category customers could finally point and use.",
    href: "https://tinyurl.com/yc82z8v3",
    badge: "$20M Year-1 revenue",
  },
];

// ── IP / Patents (bottom) ───────────────────────────────────────────────────────────────────
const IP: LinkCard[] = [
  {
    title: "Sensor Fusion Patent",
    blurb: "My patent on multi-sensor fusion — independently cited twice by Apple in their own filings.",
    href: "https://tinyurl.com/Sensor-Fusion-Patent",
    badge: "Cited 2× by Apple",
  },
  {
    title: "Apple US 2024/0107160 A1",
    blurb: "One of the Apple patents that cites the work above — the citation, in Apple's own words.",
    href: "https://patents.google.com/patent/US20240107160A1/en",
    badge: "Apple citation",
  },
];

type VideoCardData = { title: string; blurb: string; href: string };

// Demo videos — industrial & defense field demos (opens on YouTube).
const VIDEOS: VideoCardData[] = [
  {
    title: "Athena AI + Teal 2 Drone Partnership",
    blurb: "AI decision-support paired with an autonomous drone — intelligence and hardware working as one system.",
    href: "https://youtu.be/rpbb0AiM9fI",
  },
  {
    title: "Boston Dynamics Spot + Fluke SV600 Acoustic Imager",
    blurb: "A quadruped robot carrying an acoustic-imaging payload to find leaks a human can't hear — robotics meets sensing.",
    href: "https://youtu.be/Ve7Yqs8uw5M",
  },
  {
    title: "Fluke Ti450 SF6 — Thermal Gas Detection",
    blurb: "Making an invisible gas visible on camera — the kind of product problem I take from concept to the field.",
    href: "https://youtu.be/GGJyRyaE6y4",
  },
  {
    title: "AI / Claude Code — Building eXeL, Live",
    blurb: "How this very platform is built: human intent directing AI to ship real, governed software.",
    href: "https://youtu.be/wbsUZAVa2zM",
  },
];

// EdTech · eXeL AI — the product/education videos (making AI learnable).
const EDTECH_VIDEOS: VideoCardData[] = [
  {
    title: "eXeL AI Intro — Sensor Fusion App",
    blurb: "The launch video: how the eXeL AI Sensor Fusion app brings edge perception to everyday devices — by Alex.",
    href: "https://tinyurl.com/eXeL-AI-Launch-Video",
  },
  {
    title: "eXeL AI App — Simplifying AI/ML for Computer Vision",
    blurb: "Making computer-vision AI/ML approachable — point, learn, and build with real models.",
    href: "https://youtu.be/1hqutudJXF0?si=Nbzex0K0JT775Etu",
  },
  {
    title: "eXeL AI Car Project — Lane Detection (MVP)",
    blurb: "An MVP putting lane-detection computer vision on a real car — learning AI by building it.",
    href: "https://tinyurl.com/27999v63",
  },
];

function SectionHead({
  icon,
  eyebrow,
  title,
  intro,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <div className="mb-5">
      <div className="mb-1.5 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-primary/70">
        {icon}
        {eyebrow}
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{intro}</p>
    </div>
  );
}

// External links render as a single click-through card. PDFs render as a static card with
// two explicit actions — View (browser PDF reader, new tab) and Download (download attribute).
function OutCard({ c }: { c: LinkCard }) {
  const isPdf = c.href.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    return (
      <div className="flex flex-col rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-medium leading-snug">{c.title}</h3>
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        {c.badge && (
          <span className="mt-2 inline-flex w-fit rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {c.badge}
          </span>
        )}
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.blurb}</p>
        <div className="mt-3 flex items-center gap-2">
          <a
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            <FileText className="h-3.5 w-3.5" />
            View
          </a>
          <a
            href={c.href}
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium transition hover:border-primary/60 hover:text-primary"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </a>
        </div>
      </div>
    );
  }

  return (
    <a
      href={c.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-border/60 bg-card p-4 transition hover:border-primary/60"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug">{c.title}</h3>
        <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
      </div>
      {c.badge && (
        <span className="mt-2 inline-flex w-fit rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
          {c.badge}
        </span>
      )}
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{c.blurb}</p>
    </a>
  );
}

// Video card — play glyph + title + blurb, opens the link in a new tab.
function VideoCard({ v }: { v: VideoCardData }) {
  return (
    <a
      href={v.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col rounded-xl border border-border/60 bg-card p-4 transition hover:border-primary/60"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
          <Play className="h-4 w-4 translate-x-[1px]" />
        </span>
        <h3 className="font-medium leading-snug">{v.title}</h3>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{v.blurb}</p>
    </a>
  );
}

export function ExperiencesPortfolio({ basePath }: { basePath: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <Link href={basePath} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Experiences
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/70">Portfolio</span>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
        {/* Intro */}
        <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-primary/70">The actual work</p>
        <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
          How I think — then the proof behind it.
        </h1>
        <p className="mt-3 text-base font-semibold text-primary">Alex Seguin</p>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Open with a technical writeup and executive presentation that show how I approach a hard problem — then the
          résumés, the hardware and field demos that reached customers, the EdTech mission behind eXeL AI, and a patent
          the industry builds on. Everything here is real and verifiable — that&apos;s the point.
        </p>

        {/* 1 · Writeup & Presentation (lead) */}
        <section className="mt-12">
          <SectionHead
            icon={<Presentation className="h-3.5 w-3.5" />}
            eyebrow="Presentation · Writeup"
            title="How I think, on the page"
            intro="A technical capability writeup and executive presentation I authored when Deloitte asked me to assess the U.S. Army's IVAS (Integrated Visual Augmentation System) — an AI/ML platform for multi-domain defense operations."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {WRITEUPS.map((c) => (
              <OutCard key={c.href} c={c} />
            ))}
          </div>
        </section>

        {/* 2 · Résumés */}
        <section className="mt-12">
          <SectionHead
            icon={<GraduationCap className="h-3.5 w-3.5" />}
            eyebrow="Résumés"
            title="The full record"
            intro="Two framings of the same career — deep systems engineering, and technical product leadership. View or download."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {RESUMES.map((c) => (
              <OutCard key={c.href} c={c} />
            ))}
          </div>
        </section>

        {/* 3 · Industrial */}
        <section className="mt-12">
          <SectionHead
            icon={<Cpu className="h-3.5 w-3.5" />}
            eyebrow="Industrial"
            title="Hardware that reached the field"
            intro="Shipped sensor and robotics products — from a first MVP to real revenue and real deployments."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {INDUSTRIAL.map((c) => (
              <OutCard key={c.href} c={c} />
            ))}
          </div>
        </section>

        {/* 4 · Demo videos */}
        <section className="mt-12">
          <SectionHead
            icon={<Play className="h-3.5 w-3.5" />}
            eyebrow="Demo videos"
            title="See it running"
            intro="Short videos — AI, robotics, and sensing in real settings. Each opens in a new tab."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {VIDEOS.map((v) => (
              <VideoCard key={v.href} v={v} />
            ))}
          </div>
        </section>

        {/* 5 · EdTech · eXeL AI (videos + the initiative) — before IP */}
        <section className="mt-12">
          <SectionHead
            icon={<Rocket className="h-3.5 w-3.5" />}
            eyebrow="EdTech · eXeL AI"
            title="Making AI learnable"
            intro="The through-line behind everything: eXeL AI — making sensor-fusion and computer-vision AI approachable — and an EdTech initiative I launched after COVID. The work has always been about helping people learn, build, and rise, not just the technology."
          />
          {/* Education presentation (Google Slides) — FIRST, before the videos, with the Presentation icon */}
          <a
            href="https://tinyurl.com/eXeL-AI-SFO"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-4 transition hover:border-primary/60"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <Presentation className="h-4 w-4" />
              </span>
              <div>
                <div className="font-medium leading-snug group-hover:text-primary">
                  EdTech Initiative — Education Presentation
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  Bringing AI education to more learners — the mission that started eXeL AI (launched after COVID).
                </p>
              </div>
            </div>
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
          </a>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {EDTECH_VIDEOS.map((v) => (
              <VideoCard key={v.href} v={v} />
            ))}
          </div>
        </section>

        {/* 6 · IP / Patents (bottom) */}
        <section className="mt-12">
          <SectionHead
            icon={<Award className="h-3.5 w-3.5" />}
            eyebrow="IP · Patents"
            title="Work the industry builds on"
            intro="A patent isn't just a filing — it's an idea others adopt. Mine has been cited twice by Apple."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {IP.map((c) => (
              <OutCard key={c.href} c={c} />
            ))}
          </div>
        </section>

        <p className="mt-12 text-center text-xs leading-relaxed text-muted-foreground/80">
          Built on the eXeL AI governance engine · where shared intention moves at the speed of thought.
        </p>
      </main>
    </div>
  );
}
