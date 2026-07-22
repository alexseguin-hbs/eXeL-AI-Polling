"use client";

// /main/experiences/docs — the portfolio the Experiences QR opens.
// "See the actual work": demo videos · IP/patents · industrial hardware · assessments · résumés.
// Static-exported, self-contained. Video cards LINK OUT to YouTube in a new tab (zero CSP risk —
// no external images or iframes). Assessment/résumé cards point to /experiences/*.pdf — the operator
// drops those four PDFs into frontend/public/experiences/ (they serve at /experiences/<file> after build).
// Copy is written to land with hiring managers globally: heart · mind · spirit, an invitation to look.

import Link from "next/link";
import { ArrowLeft, Play, ExternalLink, Award, Cpu, FileText, GraduationCap, Download } from "lucide-react";

type VideoCard = { id: string; title: string; proves: string };
const VIDEOS: VideoCard[] = [
  {
    id: "rpbb0AiM9fI",
    title: "Athena AI + Teal 2 Drone Partnership",
    proves: "AI decision-support paired with an autonomous UAS — intelligence and hardware working as one system.",
  },
  {
    id: "Ve7Yqs8uw5M",
    title: "Boston Dynamics Spot + Fluke SV600 Acoustic Imager",
    proves: "A quadruped robot carrying an acoustic-imaging payload to find leaks a human can't hear — robotics meets sensing.",
  },
  {
    id: "GGJyRyaE6y4",
    title: "Fluke Ti450 SF6 — Thermal Gas Detection",
    proves: "Making an invisible gas visible on camera — the kind of product problem I take from concept to the field.",
  },
  {
    id: "wbsUZAVa2zM",
    title: "AI / Claude Code — Building eXeL, Live",
    proves: "How this very platform is built: human intent directing AI to ship real, governed software.",
  },
];

type LinkCard = { title: string; blurb: string; href: string; badge?: string };

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

const ASSESSMENTS: LinkCard[] = [
  {
    title: "eXeL AI Strategy — AI/ML Software Development Integration",
    blurb: "The full Deloitte-assessed strategy for eXeL AI and its engineering integration (21 pp).",
    href: "/experiences/eXeL_AI_Strategy_AIML_Software_Dev_Integration_A.Seguin.pdf",
    badge: "Deloitte assessment",
  },
  {
    title: "eXeL AI Strategy — Project Description (v2)",
    blurb: "The reviewed project description — the vision, scope, and outcomes, evaluated end to end.",
    href: "/experiences/eXeL_AI_Strategy_Project_Description_A.Seguin_v2.pdf",
    badge: "Deloitte assessment",
  },
];

const RESUMES: LinkCard[] = [
  {
    title: "A. M. Seguin — HI + AI Systems (Industrial & Defense)",
    blurb: "The full record: sensor fusion, robotics, and human-plus-AI systems across industrial and defense.",
    href: "/experiences/A.M.Seguin_Resume_HI_AI_Systems_Industrial_Defense.pdf",
  },
  {
    title: "A. Seguin — Technical Program Manager (ATS)",
    blurb: "An ATS-friendly TPM résumé — the same work, framed for program leadership.",
    href: "/experiences/ATS_ASeguin_Resume_TPM_20260126.pdf",
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

// External links (patents, industrial, edtech) render as a single click-through card.
// PDFs (assessments, résumés) render as a static card with TWO explicit actions —
// View (opens the browser's PDF reader in a new tab) and Download (saves the file).
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

export default function ExperiencesDocsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <Link
          href="/main/experiences"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Experiences
        </Link>
        <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-primary/70">Portfolio</span>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
        {/* Intro */}
        <p className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-primary/70">The actual work</p>
        <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
          Real systems, shipped — and the proof behind them.
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Below is a short tour of work I&apos;m proud of: field demos, a patent the industry builds on, hardware
          that reached customers, an independent Deloitte review, and résumés if you want the full record. Everything
          here is verifiable — that&apos;s the point.
        </p>

        {/* Videos */}
        <section className="mt-12">
          <SectionHead
            icon={<Play className="h-3.5 w-3.5" />}
            eyebrow="Demo videos"
            title="See it running"
            intro="Four short videos — AI, robotics, and sensing in real settings. Each opens on YouTube in a new tab."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {VIDEOS.map((v) => (
              <a
                key={v.id}
                href={`https://youtu.be/${v.id}`}
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
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{v.proves}</p>
              </a>
            ))}
          </div>
        </section>

        {/* IP / Patents */}
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

        {/* Industrial */}
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

        {/* Assessments */}
        <section className="mt-12">
          <SectionHead
            icon={<FileText className="h-3.5 w-3.5" />}
            eyebrow="Independent assessment"
            title="Reviewed by Deloitte"
            intro="Two Deloitte assessments of the eXeL AI strategy and its engineering — an outside, independent read."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {ASSESSMENTS.map((c) => (
              <OutCard key={c.href} c={c} />
            ))}
          </div>
        </section>

        {/* Résumés */}
        <section className="mt-12">
          <SectionHead
            icon={<GraduationCap className="h-3.5 w-3.5" />}
            eyebrow="Résumés"
            title="The full record"
            intro="Two framings of the same career — systems-engineering depth, and technical program leadership."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {RESUMES.map((c) => (
              <OutCard key={c.href} c={c} />
            ))}
          </div>
        </section>

        {/* P.S. */}
        <section className="mt-12 rounded-xl border border-border/60 bg-card p-5">
          <div className="mb-1.5 text-[11px] font-mono uppercase tracking-[0.2em] text-primary/70">P.S.</div>
          <a
            href="https://tinyurl.com/eXeL-AI-SFO"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-1.5 font-medium hover:text-primary"
          >
            An EdTech initiative I launched after COVID
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </a>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Because the work has always been about helping people learn, build, and rise — not just the technology.
          </p>
        </section>

        <p className="mt-12 text-center text-xs leading-relaxed text-muted-foreground/80">
          Built on the eXeL AI governance engine · where shared intention moves at the speed of thought.
        </p>
      </main>
    </div>
  );
}
