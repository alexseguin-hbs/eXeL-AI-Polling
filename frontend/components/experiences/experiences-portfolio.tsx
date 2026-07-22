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
import { ArrowLeft, Play, ExternalLink, Award, Cpu, FileText, GraduationCap, Download, Presentation, Rocket, ChevronDown, Film } from "lucide-react";
import { LangSelect } from "@/components/experiences/lang-select";

type CardKind = "pdf" | "link" | "video";
type Item = { kind: CardKind; title: string; blurb: string; href: string; badge?: string; icon?: LucideIcon };

// ── Presentation & Writeup — the AI/ML strategy documents ───────────────────────────────────
const WRITEUPS: Item[] = [
  {
    kind: "pdf",
    icon: Presentation,
    title: "AI/ML Strategy · Plan",
    badge: "Presentation · plan",
    blurb:
      "The executive presentation: the value proposition, a 4-phase $18M work plan with milestones and a rough-order budget, the operational metrics it moves, and its broader national impact; the same vision, decision-ready.",
    href: "/experiences/eXeL_AI_Strategy_Project_Description_A.Seguin_v2.pdf",
  },
  {
    kind: "pdf",
    title: "AI/ML System Integration",
    badge: "Writeup · 21 pp",
    blurb:
      "The complete 21-page technical writeup: an AI platform ecosystem integrating the Army IVAS headset with ground robots, drones, and edge AI. Problem framing, CONOPs, sensor-fusion architecture, and an OODA-loop decision-support model, end to end.",
    href: "/experiences/eXeL_AI_Strategy_AIML_Software_Dev_Integration_A.Seguin.pdf",
  },
];

// ── Résumés — blurbs pulled from the actual documents ───────────────────────────────────────
const RESUMES: Item[] = [
  {
    kind: "pdf",
    title: "HI + AI Systems",
    badge: "Defense • Systems",
    blurb:
      "15+ years leading perception, sensor-fusion, and autonomy products across defense and industrial: Athena AI / Teal-2, Shield AI's first $25M R&D roadmap, FLIR's $200M portfolio, and 15+ Fluke thermal & acoustic launches, plus an active SECRET clearance and the Apple-cited sensor-fusion patent.",
    href: "/experiences/A.M.Seguin_Resume_HI_AI_Systems_Industrial_Defense.pdf",
  },
  {
    kind: "pdf",
    title: "Technical Product Manager",
    badge: "TPM • PdM",
    blurb:
      "The same career, framed for product leadership: end-to-end delivery, R&D-portfolio governance, and risk management with hard outcomes. A $200M portfolio consolidated toward an $8B acquisition, 12% CAGR on a $3B business, and 20× developer throughput via AI automation.",
    href: "/experiences/ATS_ASeguin_Resume_TPM_20260126.pdf",
  },
];

// ── Industrial (shipped hardware) ───────────────────────────────────────────────────────────
const INDUSTRIAL: Item[] = [
  {
    kind: "link",
    title: "BD Spot · MUVE C360",
    badge: "In the field",
    blurb: "Gas-leak detection mounted on Boston Dynamics Spot; a shipped integration keeping people out of harm's way.",
    href: "https://defense.flir.com/about/news/muve-c360-on-spot-detects-gas-leak/",
  },
  {
    kind: "link",
    title: "Acoustic Imager · ii900",
    badge: "$20M Year-1 revenue",
    blurb: "Led a handheld acoustic-imaging product from first build to market; a new category customers could finally point and use.",
    href: "https://tinyurl.com/yc82z8v3",
  },
];

// ── IP / Patents (bottom) ───────────────────────────────────────────────────────────────────
const IP: Item[] = [
  {
    kind: "link",
    title: "Sensor Fusion Patent",
    badge: "Cited 2× by Apple",
    blurb: "My patent on multi-sensor fusion, independently cited twice by Apple in their own filings.",
    href: "https://tinyurl.com/Sensor-Fusion-Patent",
  },
  {
    kind: "link",
    title: "Apple US 2024/0107160 A1",
    badge: "Apple citation",
    blurb: "One of the Apple patents that cites the work above; the citation, in Apple's own words.",
    href: "https://patents.google.com/patent/US20240107160A1/en",
  },
];

// Demo videos — industrial & defense field demos (opens on YouTube).
const VIDEOS: Item[] = [
  { kind: "video", title: "Athena AI + Teal 2 Drone", blurb: "AI decision-support paired with an autonomous drone; intelligence and hardware working as one system.", href: "https://youtu.be/rpbb0AiM9fI" },
  { kind: "video", title: "BD Spot + Fluke SV600", blurb: "Boston Dynamics Spot carrying an acoustic-imaging payload to find leaks a human can't hear; robotics meets sensing.", href: "https://youtu.be/Ve7Yqs8uw5M" },
  { kind: "video", title: "Dual-Purpose Fluke Ti450 SF6", blurb: "A dual-purpose thermal imager: SF6 gas detection and everyday thermal inspection. Making an invisible gas visible on camera, concept to field.", href: "https://youtu.be/GGJyRyaE6y4" },
  { kind: "video", title: "AI / Claude Code Demo", blurb: "How this very platform is built: human intent directing AI to ship real, governed software.", href: "https://youtu.be/wbsUZAVa2zM" },
];

// EdTech · eXeL AI — the education presentation (leads) and product videos.
const EDTECH_PRESENTATION: Item = {
  kind: "link",
  icon: Presentation,
  title: "EdTech Initiative Presentation",
  blurb: "Bringing AI education to more learners: the mission that started eXeL AI (launched after COVID).",
  href: "https://tinyurl.com/eXeL-AI-SFO",
};

const EDTECH_VIDEOS: Item[] = [
  { kind: "video", title: "eXeL AI · Sensor Fusion", blurb: "The launch video: how the eXeL AI Sensor Fusion app brings edge perception to everyday devices, by Alex.", href: "https://tinyurl.com/eXeL-AI-Launch-Video" },
  { kind: "video", title: "eXeL AI · Simplifying CV", blurb: "Making computer-vision AI/ML approachable: point, learn, and build with real models.", href: "https://youtu.be/1hqutudJXF0?si=Nbzex0K0JT775Etu" },
  { kind: "video", title: "eXeL AI Lane Detection", blurb: "Lane-detection computer vision on a real car; learning AI by building it.", href: "https://tinyurl.com/27999v63" },
];

// eXeL AI Initiative — "Preparing AI to Serve the Future of Humanity" (educational vignettes).
const VIGNETTES: Item[] = [
  { kind: "video", title: "ML Introduction · 1", blurb: "Machine Learning: introduction (Vignette 0001).", href: "https://youtu.be/xzhHllVpYgM" },
  { kind: "video", title: "ML Introduction · 2", blurb: "Machine Learning: introduction (Vignette 0002).", href: "https://youtu.be/uNUW4c-leLo" },
  { kind: "video", title: "AI Agents · Intro", blurb: "AI Agents: introduction (Vignette 0003).", href: "https://youtu.be/HfXzn0KCLcs" },
  { kind: "video", title: "AlphaStar · StarCraft II", blurb: "AlphaStar: StarCraft 2 strategy (Vignette 0004).", href: "https://youtu.be/hF_8Qg7F3KY" },
  { kind: "video", title: "Teaming · Ender's Game", blurb: "Teaming concepts: Ender's Game (Vignette 0005).", href: "https://youtu.be/KN0t0eRo5-4" },
  { kind: "video", title: "DARPA Dogfight · AI", blurb: "AI agent: DARPA dogfight challenge (Vignette 0006).", href: "https://youtu.be/PwSL60rEDJU" },
  { kind: "video", title: "UAS Drones · OFFSET", blurb: "Teaming: UAS drones + DARPA's OFFSET (Vignette 0007).", href: "https://youtu.be/wxHIYh2WRxM" },
  { kind: "video", title: "Simulation & LVC", blurb: "Simulation & LVC benefits: Live-Virtual-Constructive (Vignette 0008).", href: "https://youtu.be/LDTcLRhmuMo" },
];

function SectionHead({ icon, eyebrow, title, intro }: { icon: React.ReactNode; eyebrow: string; title: string; intro: string }) {
  return (
    // Icon sits in its own left column so it stands out; the eyebrow (bold cyan header),
    // the white sub-title, and the intro are all indented under the header.
    <div className="mb-5 flex items-start gap-2.5">
      <span className="mt-1 shrink-0 text-primary">{icon}</span>
      <div className="min-w-0">
        <div className="text-base font-bold uppercase tracking-[0.14em] text-primary sm:text-lg">{eyebrow}</div>
        <h2 className="mt-0.5 text-sm font-medium text-foreground">{title}</h2>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{intro}</p>
      </div>
    </div>
  );
}

// Unified collapsible card: open-link icon (left), title + badge (2-line default), expand dropdown
// (upper right). The blurb and PDF actions stay indented under the header when expanded.
function Card({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon ?? (item.kind === "pdf" ? FileText : item.kind === "video" ? Play : ExternalLink);
  return (
    <div className="rounded-xl border border-border/60 bg-card">
      <div className="flex items-start gap-3 p-4">
        {/* open link — LEFT */}
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${item.title}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition hover:bg-primary hover:text-primary-foreground"
        >
          <Icon className="h-4 w-4" />
        </a>

        {/* header + badge (+ expanded blurb) stay under the header */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{item.title}</div>
          {item.badge && (
            <span className="mt-1 inline-flex w-fit rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {item.badge}
            </span>
          )}
          {open && (
            <div className="mt-3">
              <p className="text-[13px] leading-relaxed text-muted-foreground">{item.blurb}</p>
              {item.kind === "pdf" && (
                <div className="mt-3 flex items-center gap-2">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View
                  </a>
                  <a
                    href={item.href}
                    download
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-1.5 text-xs font-medium transition hover:border-primary/60 hover:text-primary"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
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
  );
}

// Expandable "Video Vignettes" group — default collapsed (minimized); reveals vignette cards.
function VideoVignettes() {
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
            <div className="font-medium">Video Vignettes</div>
            <p className="truncate text-[13px] text-muted-foreground">
              eXeL AI Initiative: &ldquo;Preparing AI to Serve the Future of Humanity&rdquo;
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
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <Link href={basePath} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Experiences
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/70">Portfolio</span>
          <LangSelect />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
        {/* Intro — centered masthead: name (largest), eyebrow, headline, then the summary */}
        <div className="text-center">
          <p className="mb-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Alex Seguin</p>
          <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-primary/70">The actual work</p>
          <h1 className="text-balance text-2xl font-semibold leading-tight sm:text-3xl">
            How I think. Then the proof behind it.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
            Open with an executive presentation and technical writeup that show how I approach a hard problem, then the
            résumés, the hardware and field demos that reached customers, the EdTech mission behind eXeL AI, and a patent
            the industry builds on. Everything here is real and verifiable; that&apos;s the point.
          </p>
        </div>

        {/* 1 · Presentation & Writeup (lead) */}
        <section className="mt-12">
          <SectionHead
            icon={<Presentation className="h-4 w-4" />}
            eyebrow="Presentation · Writeup"
            title="How I think, on the page"
            intro="An executive presentation and technical capability writeup I authored when Deloitte asked me to assess the U.S. Army's IVAS (Integrated Visual Augmentation System): an AI/ML platform for multi-domain defense operations."
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
            eyebrow="Résumés"
            title="The full record"
            intro="Two framings of the same career: deep systems engineering, and technical product leadership. Open the icon to view, expand for details."
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
            eyebrow="Industrial"
            title="Hardware that reached the field"
            intro="Shipped sensor and robotics products, from a first build to real revenue and real deployments."
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
            eyebrow="Demo videos"
            title="See it running"
            intro="Short videos: AI, robotics, and sensing in real settings. Open the icon to play."
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
            eyebrow="EdTech · eXeL AI"
            title="Making AI learnable"
            intro="The through-line behind everything: eXeL AI, making sensor-fusion and computer-vision AI approachable, and an EdTech initiative I launched after COVID. The work has always been about helping people learn, build, and rise, not just the technology."
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
            eyebrow="IP · Patents"
            title="Work the industry builds on"
            intro="A patent isn't just a filing; it's an idea others adopt. Mine has been cited twice by Apple."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {IP.map((c) => (
              <Card key={c.href} item={c} />
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
