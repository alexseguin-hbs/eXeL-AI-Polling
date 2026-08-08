"use client";

/**
 * VISION 2525 — Humanity's Coordination Framework (the manifesto hub).
 * =====================================================================
 * Makes the eXeL AI vision poster real, in-app: "Innovate at the Speed of Thought" hero, the Trinity of
 * Intelligences (◬ AI · ♡ SI · 웃 HI, sourced from the ONE soi-framework), the mission, the 7-gate
 * Trusted-Progress cycle (Pilot → Replay → Qualify → Certify → Adopt → Educate → Expand), the capability
 * panels — each a LIVE link into the real app — and the values row. Doubles as the civilization-level
 * inter-site nav between SoI-2525 / Architect-2525 / Security-2525 / Celestial-2525 and the toolset.
 *
 * Purely additive: a new route, no existing UI changed. Commits to the poster's single dark cosmic world by
 * design (a manifesto, not a themeable tool surface) — so it reads identically for every viewer.
 * i18n: copy is held in data arrays so the standing lexicon-admin follow-up can wire t() in one pass.
 */
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { SeedOfLifeLogo } from "@/components/seed-of-life-logo";
import { DEFAULT_SOI } from "@/lib/soi-framework";
import {
  Rocket, Play, ShieldCheck, Award, Users, BookOpen, TrendingUp,
  Brain, Globe, GraduationCap, Scale, Heart, Handshake, Sprout, Compass,
  Sparkles, ArrowRight, type LucideIcon,
} from "lucide-react";

// ── Palette (poster-true, single dark world) ───────────────────────────────────────────────────────────────
const GOLD = "#e8b64c";
const CYAN = "#22d3ee";   // ◬ AI
const SUNSET = "#f7b955"; // ♡ SI
const VIOLET = "#a78bfa"; // 웃 HI
const TRINITY_ACCENT: Record<string, string> = { AI: CYAN, SI: SUNSET, HI: VIOLET };

// ── Content (arrays → trivial future t() wiring) ────────────────────────────────────────────────────────────
const MISSION = ["Coordinate Humanity", "Amplify Intelligence", "Advance Civilization", "Preserve Dignity", "Inspire Generations"];

const GATES: { label: string; icon: LucideIcon }[] = [
  { label: "Pilot", icon: Rocket },
  { label: "Replay", icon: Play },
  { label: "Qualify", icon: ShieldCheck },
  { label: "Certify", icon: Award },
  { label: "Adopt", icon: Users },
  { label: "Educate", icon: BookOpen },
  { label: "Expand", icon: TrendingUp },
];

const PANELS: { title: string; icon: LucideIcon; color: string; items: string[]; href: string; cta: string }[] = [
  { title: "Collective Intelligence", icon: Users, color: SUNSET, items: ["Polling", "Feedback", "Priorities", "Insight"], href: "/dashboard/", cta: "Open the console" },
  { title: "Global Coordination", icon: Globe, color: CYAN, items: ["Live map", "Presence", "Sessions", "Reach"], href: "/main/Security-2525/", cta: "See the world view" },
  { title: "Simulation & Replay", icon: Sparkles, color: VIOLET, items: ["Learn", "Improve", "Adapt", "Prove"], href: "/sim/", cta: "Run a simulation" },
  { title: "AI & Data Analytics", icon: Brain, color: CYAN, items: ["Pattern recognition", "Predictive intelligence", "Decision support", "Risk visibility"], href: "/innovation/", cta: "Explore the engine" },
  { title: "Education & Enablement", icon: GraduationCap, color: SUNSET, items: ["Curriculum", "Training", "Certification", "Inspiration"], href: "/experiences/", cta: "Start learning" },
  { title: "Governance & Accountability", icon: Scale, color: VIOLET, items: ["Transparency", "Auditability", "Ethics", "Responsibility"], href: "/atlantis/", cta: "Read the accords" },
];

const VALUES: { label: string; sub: string; icon: LucideIcon }[] = [
  { label: "Dignity", sub: "Every human matters", icon: Heart },
  { label: "Accountability", sub: "We own our impact", icon: ShieldCheck },
  { label: "Trust", sub: "Earned every day", icon: Handshake },
  { label: "Resilience", sub: "Stronger together", icon: Sprout },
  { label: "Future readiness", sub: "Prepared for what's next", icon: Compass },
];

// The framework's sibling worlds — the clean inter-site nav the vision promises.
const WORLDS: { code: string; name: string; tagline: string; href: string; color: string }[] = [
  { code: "SoI-2525", name: "System of Innovation", tagline: "Portfolio · Gates · Governance", href: "/innovation/", color: CYAN },
  { code: "ARCHITECT-2525", name: "Architect", tagline: "Design · Build · Model", href: "/main/Architect-2525/", color: VIOLET },
  { code: "SECURITY-2525", name: "Security", tagline: "Air & Missile Defense C2", href: "/main/Security-2525/", color: "#ff6b6b" },
  { code: "CELESTIAL-2525", name: "Celestial", tagline: "Sky · Learn · Family", href: "/main/Celestial-2525/", color: SUNSET },
  { code: "LIGHT CODEX", name: "Light Codex", tagline: "Encode · Image · Key", href: "/light-codex/", color: "#e879f9" },
];

function SectionLabel({ children, color = CYAN }: { children: React.ReactNode; color?: string }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color }}>{children}</p>;
}

export default function Vision2525Page() {
  return (
    <div className="flex min-h-[100dvh] flex-col text-slate-100" style={{ background: "#050912" }}>
      <Navbar />

      {/* Cosmic ground: layered radial glows + a faint starfield, fixed behind content. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(900px 520px at 50% -8%, rgba(34,211,238,0.16), transparent 60%)," +
            "radial-gradient(700px 480px at 12% 22%, rgba(167,139,250,0.12), transparent 60%)," +
            "radial-gradient(760px 520px at 88% 30%, rgba(247,185,85,0.10), transparent 62%)," +
            "linear-gradient(180deg, #060b16 0%, #050912 40%, #04070f 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.7), transparent)," +
            "radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.5), transparent)," +
            "radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.45), transparent)," +
            "radial-gradient(1px 1px at 85% 60%, rgba(255,255,255,0.6), transparent)," +
            "radial-gradient(1px 1px at 55% 45%, rgba(255,255,255,0.4), transparent)",
          backgroundSize: "auto",
        }}
      />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section className="flex flex-col items-center gap-5 pt-10 text-center sm:pt-16">
          <SeedOfLifeLogo size={64} accentColor={CYAN} className="opacity-90" />
          <h1 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl" style={{ textWrap: "balance" }}>
            <span style={{ color: GOLD }}>Innovate at the Speed of Thought</span>
            <sup className="ml-1 align-super text-xs text-slate-400">™</sup>
          </h1>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm uppercase tracking-[0.35em] text-slate-300 sm:text-base">
            <span>Imagine</span><span style={{ color: CYAN }}>·</span><span>Create</span><span style={{ color: CYAN }}>·</span><span>Manifest</span>
          </p>
          <div className="mt-1 flex flex-col items-center gap-1">
            <p className="text-sm font-semibold tracking-wide sm:text-base">
              <span style={{ color: CYAN }}>Vision 2525</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-slate-200">Humanity&apos;s Coordination Framework</span>
            </p>
            <p className="max-w-xl text-sm text-slate-400">Preparing AI to serve humanity — coordinate, amplify, and advance civilization while preserving the dignity of every person.</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard/" className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-slate-900 transition-transform hover:scale-[1.03]" style={{ background: GOLD }}>
              Enter the framework <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#worlds" className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-cyan-400 hover:text-cyan-300">
              Explore the worlds
            </a>
          </div>
        </section>

        {/* ── HUMANITY DECIDES ─────────────────────────────────────────────── */}
        <section className="mx-auto mt-16 max-w-3xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span style={{ color: SUNSET }}>Idea</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-600" />
            <span style={{ color: CYAN }}>Reality</span>
          </div>
          <h2 className="mt-3 font-serif text-2xl font-bold sm:text-3xl" style={{ color: GOLD }}>Humanity Decides</h2>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">Technology assists — <span className="font-semibold text-slate-100">trust must be proven</span>. Nothing scales until it earns its place through evidence.</p>
        </section>

        {/* ── TRINITY OF INTELLIGENCES ─────────────────────────────────────── */}
        <section className="mt-16">
          <div className="mb-6 text-center">
            <SectionLabel>The Trinity of Intelligences</SectionLabel>
            <p className="mt-2 text-sm text-slate-400">United for humanity · guided by wisdom · driven by purpose.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {DEFAULT_SOI.coins.map((c) => {
              const color = TRINITY_ACCENT[c.key] ?? CYAN;
              return (
                <div key={c.key} className="rounded-2xl border p-5 backdrop-blur-sm" style={{ borderColor: `${color}44`, background: `${color}0d` }}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full text-2xl" style={{ background: `${color}1a`, color }}>{c.sym}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color }}>{c.key}</p>
                      <p className="text-sm font-semibold text-slate-100">{c.name}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{c.purpose}</p>
                  <p className="mt-3 rounded-md px-2 py-1 text-[11px] font-medium tabular-nums" style={{ background: `${color}14`, color }}>{c.law}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── TRUSTED PROGRESS CYCLE (7 gates) ─────────────────────────────── */}
        <section className="mt-16">
          <div className="mb-6 text-center">
            <SectionLabel color={GOLD}>A Continuous Cycle of Trusted Progress</SectionLabel>
            <p className="mt-2 text-sm text-slate-400">Observe · Learn · Adapt · Scale</p>
          </div>
          <ol className="flex flex-wrap items-stretch justify-center gap-2 sm:gap-3">
            {GATES.map((g, i) => {
              const Icon = g.icon;
              return (
                <li key={g.label} className="flex items-center gap-2 sm:gap-3">
                  <div className="flex min-w-[84px] flex-col items-center gap-1 rounded-xl border border-slate-700/70 bg-slate-900/40 px-3 py-3">
                    <Icon className="h-5 w-5" style={{ color: GOLD }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">{g.label}</span>
                  </div>
                  {i < GATES.length - 1 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-slate-600 sm:block" />}
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── CAPABILITY PANELS (live links) ───────────────────────────────── */}
        <section className="mt-16">
          <div className="mb-6 text-center">
            <SectionLabel>One Framework · Many Capabilities</SectionLabel>
            <p className="mt-2 text-sm text-slate-400">Every capability is live — follow any panel straight into the working system.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PANELS.map((p) => {
              const Icon = p.icon;
              return (
                <Link key={p.title} href={p.href} className="group flex flex-col rounded-2xl border border-slate-700/60 bg-slate-900/40 p-5 transition-all hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-900/70">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: `${p.color}1a`, color: p.color }}><Icon className="h-5 w-5" /></span>
                    <h3 className="text-sm font-semibold text-slate-100">{p.title}</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.items.map((it) => (
                      <span key={it} className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300">{it}</span>
                    ))}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: p.color }}>
                    {p.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── VALUES ───────────────────────────────────────────────────────── */}
        <section className="mt-16">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/30 px-3 py-4 text-center">
                  <Icon className="h-5 w-5" style={{ color: GOLD }} />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-100">{v.label}</p>
                  <p className="text-[11px] text-slate-400">{v.sub}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── THE WHITE PAPER (public, no login) ───────────────────────────── */}
        <section className="mt-16">
          <a
            href="/vision-2525/white-paper/"
            className="block rounded-2xl border p-6 transition-colors hover:border-amber-300 sm:p-8"
            style={{ borderColor: "rgba(232,182,76,0.35)", background: "rgba(232,182,76,0.05)" }}
          >
            <SectionLabel color={GOLD}>The white paper &middot; open to everyone</SectionLabel>
            <h2 className="mt-3 font-serif text-2xl font-bold leading-tight sm:text-3xl" style={{ color: GOLD }}>
              Recursive Coordination for Human Continuity
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
              An hour of a human life, recorded so it cannot be discounted by where it was lived &mdash; and the
              legal structure that keeps any one government from switching that record off. Nineteen sections
              after the Flower of Life, replayed release by release, with every earlier version still readable.
            </p>
            <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>No login</span><span style={{ color: CYAN }}>&middot;</span>
              <span>No account</span><span style={{ color: CYAN }}>&middot;</span>
              <span>Reads offline</span><span style={{ color: CYAN }}>&middot;</span>
              <span style={{ color: GOLD }}>Open it &rarr;</span>
            </p>
          </a>

          {/* r142 · the operator asked for a download link on the page. The document
              has argued since r105 that it is meant to be kept on a drive and opened
              in ten years with no network — this is the link that lets a reader do
              that without hunting through a Save As dialog. Outside the card above,
              because tapping "download" should never be a mis-tap on "open". */}
          <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-slate-400">
            <a
              href="/whitepaper/vision-2525.html"
              download="SOI_VISION2525_v.18_LIVING_DOCUMENT.html"
              className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:border-cyan-400 hover:text-cyan-300"
              style={{ borderColor: "rgba(34,211,238,0.45)", color: CYAN }}
            >
              &darr; Download the living document
            </a>
            <span className="text-xs">
              HTML &middot; one self-contained file &middot; 4.8&nbsp;MB &mdash; every release, the replay
              engine and the images included. Opens with no network and no account.
            </span>
          </p>
        </section>

        {/* ── WORLDS (inter-site nav) ──────────────────────────────────────── */}
        <section id="worlds" className="mt-16 scroll-mt-20">
          <div className="mb-6 text-center">
            <SectionLabel color={VIOLET}>The Worlds of Vision 2525</SectionLabel>
            <p className="mt-2 text-sm text-slate-400">One civilization · one framework · limitless possibilities.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {WORLDS.map((w) => (
              <Link key={w.code} href={w.href} className="group flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-500 hover:bg-slate-900/70">
                <SeedOfLifeLogo size={34} accentColor={w.color} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-semibold" style={{ color: w.color }}>{w.code}</p>
                  <p className="truncate text-sm font-semibold text-slate-100">{w.name}</p>
                  <p className="truncate text-[11px] text-slate-400">{w.tagline}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-200" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── MISSION + MANIFESTO ──────────────────────────────────────────── */}
        <section className="mt-16 text-center">
          <SectionLabel>Our Mission</SectionLabel>
          <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-2">
            {MISSION.map((m) => (
              <span key={m} className="rounded-full border border-slate-700 bg-slate-900/40 px-3 py-1 text-xs font-medium text-slate-200">{m}</span>
            ))}
          </div>
          <p className="mx-auto mt-10 max-w-2xl font-serif text-xl font-semibold sm:text-2xl" style={{ textWrap: "balance" }}>
            <span className="text-slate-300">Building a future worth inheriting —</span>{" "}
            <span style={{ color: CYAN }}>Together. Now. Worldwide.</span>
          </p>
          <p className="mx-auto mt-6 max-w-2xl rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3 text-sm italic text-slate-400">
            “The highest technology is not artificial intelligence, but collective intelligence in service of consciousness.”
          </p>
          <div className="mt-8 flex items-center justify-center gap-2 text-lg text-slate-500">
            <span style={{ color: CYAN }}>◬</span><span style={{ color: SUNSET }}>♡</span><span style={{ color: VIOLET }}>웃</span>
          </div>
          <p className="mt-2 text-[11px] uppercase tracking-[0.3em] text-slate-600">Where Shared Intention moves at the Speed of Thought</p>
        </section>
      </main>
    </div>
  );
}
