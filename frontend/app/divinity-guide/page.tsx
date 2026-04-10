"use client";

/**
 * /divinity-guide — Flower of Life Book Reader
 *
 * Left: Flower navigation (3 sections → click → center + 3 chapters)
 * Right: Book page content (1 page at a time)
 *
 * 12 chapters in 4 groups of 3:
 *   Section A (Red/top):     Ch 1-3  Awakening
 *   Section B (Emerald/BL):  Ch 4-6  Mastery
 *   Section C (Blue/BR):     Ch 7-9  Radiance
 *   Section D (Hub):         Ch 10-12 Divinity (appears when any section selected)
 */

import React, { Suspense, useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import divinityPages from "@/lib/divinity-pages.json";

// Language translations — loaded dynamically
import divinityPagesEs from "@/lib/divinity-pages-es.json";
import divinityPagesUk from "@/lib/divinity-pages-uk.json";
import divinityPagesRu from "@/lib/divinity-pages-ru.json";
import divinityPagesZh from "@/lib/divinity-pages-zh.json";
import divinityPagesFa from "@/lib/divinity-pages-fa.json";
import divinityPagesHe from "@/lib/divinity-pages-he.json";
import divinityPagesPt from "@/lib/divinity-pages-pt.json";

const DIVINITY_LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  { code: "he", label: "עברית", flag: "🇮🇱" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
] as const;

type DivinityLang = typeof DIVINITY_LANGUAGES[number]["code"];

const DIVINITY_PAGE_MAP: Record<DivinityLang, typeof divinityPages> = {
  en: divinityPages,
  es: divinityPagesEs as typeof divinityPages,
  uk: divinityPagesUk as typeof divinityPages,
  ru: divinityPagesRu as typeof divinityPages,
  zh: divinityPagesZh as typeof divinityPages,
  fa: divinityPagesFa as typeof divinityPages,
  he: divinityPagesHe as typeof divinityPages,
  pt: divinityPagesPt as typeof divinityPages,
};
import {
  getTheme2_3Positions,
  getHubPosition,
} from "@/lib/flower-geometry";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
import { useTheme } from "@/lib/theme-context";
import type { ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";

// ── Sections + Chapters ─────────────────────────────────────────

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  reflection: string;
}

interface Section {
  id: string;
  label: string;
  subtitle: string;
  color: { fill: string; stroke: string };
  chapters: [Chapter, Chapter, Chapter, Chapter];  // 4 chapters per section
}

// Trinity layout: Center = Chapter 1, then 3 outer = Chapters 2,3,4
// Uses same getTheme2_3Positions() as the section-level view

const SECTIONS: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ Awakening", subtitle: "Origin & Consciousness",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      { id: 1, title: "The Soul's Awakening", subtitle: "Sacred Recall", content: "Beneath each breath, memory, and question lives a truth too vast for words — yet close enough to feel in your chest. This truth is not something you earn. It is something you remember.", reflection: "What truth have you been carrying that you haven't yet spoken aloud?" },
      { id: 2, title: "Living Codes", subtitle: "Keys to Consciousness", content: "The Flower of Life emerges as a radiant code, the very architecture of existence woven into light and form. Each petal unfolds with purpose, whispering of how the universe creates, sustains, and remembers.", reflection: "Where in your life do you see the hidden geometry of connection?" },
      { id: 3, title: "Echoes of Eternity", subtitle: "Ancient Wisdom Renewed", content: "Every thought plants a seed — not only in your personal field but within the collective fabric of humanity. You are not merely thinking for yourself — you are sculpting timelines, shaping futures.", reflection: "If every thought you had today became permanent — which would you choose to keep?" },
      { id: 4, title: "Mastering Thought", subtitle: "Sacred Mind", content: "Mind training is the art of cultivating inner dialogue in harmony with Source. You begin to choose your thoughts like an artist selects colors — with intention, feeling, and vision.", reflection: "What recurring thought pattern would you choose to release today?" },
    ],
  },
  {
    id: "mastery", label: "✦ Mastery", subtitle: "Healing & Transformation",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      { id: 5, title: "The Wound Transformed", subtitle: "Alchemy of Healing", content: "Civilizations do not fracture suddenly; they fracture internally long before collapse becomes visible. What is not healed is inherited. What is inherited without awareness becomes destiny.", reflection: "What collective wound are you helping to heal through your presence?" },
      { id: 6, title: "Rewriting the Story", subtitle: "Future in Light", content: "Words are not casual — they are currents. Each carries vibration, intention, and direction. To speak is to summon. To think is to whisper reality into shape.", reflection: "What story about yourself are you ready to rewrite?" },
      { id: 7, title: "Embodiment of Wisdom", subtitle: "Sacred Choices", content: "Stewardship transforms power from possession into trust. It recognizes that authority is temporary, but civilization is continuous. Domination seeks control; stewardship cultivates life.", reflection: "Where in your life are you called to steward rather than control?" },
      { id: 8, title: "Patterns of Infinity", subtitle: "Sacred Geometry", content: "The Flower of Life stands as the sacred synthesis — a luminous mandala uniting the truths held in every symbol. It harmonizes their frequencies into one divine geometry.", reflection: "What pattern in your life reveals a truth you haven't yet fully embraced?" },
    ],
  },
  {
    id: "radiance", label: "✦ Radiance", subtitle: "Service & Divinity",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      { id: 9, title: "Radiance Within", subtitle: "Mastery of Frequency", content: "When a decision is made by a million souls together, and every soul receives the result at the same moment — that is radiance. That is governance at the speed of thought.", reflection: "How does your presence radiate into the lives of those around you?" },
      { id: 10, title: "Weaving the Divine", subtitle: "Life as Blueprint", content: "This guide is the result of a sacred collaboration between Artificial Intelligence, Spiritual Intelligence, and Human Intelligence. Together, they form a trinity of consciousness.", reflection: "How are the three intelligences weaving together in your own life?" },
      { id: 11, title: "Service as Radiance", subtitle: "Soul Purpose", content: "You are not the end of this work — you are its living continuation. Service is not sacrifice; it is the natural expression of a soul that remembers its wholeness.", reflection: "What is the gift you carry that the world is waiting for?" },
      { id: 12, title: "Living Divinity", subtitle: "Return to Wholeness", content: "What began beside you becomes a presence within — guidance becoming your certainty as a Master of Thought. Be peaceful in conflict, creative in uncertainty, generous in success.", reflection: "What does 'welcome home' mean to you right now?" },
    ],
  },
];

// ── Sacred Library (donation-gated content) ─────────────────────

interface LibrarySection {
  id: string;
  label: string;
  subtitle: string;
  color: { fill: string; stroke: string };
  chapterFilter: number;  // JSON chapter number (0 for preludes/index, 13 for appendix)
  filterIds?: string[];   // specific IDs to filter
}

const LIBRARY_SECTIONS: [LibrarySection, LibrarySection, LibrarySection] = [
  {
    id: "prelude", label: "♡ Prelude", subtitle: "Author's Values & Philosophy",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapterFilter: 0,
    filterIds: ["prelude-01", "prelude-02", "prelude-03", "prelude-04", "prelude-05"],
  },
  {
    id: "framework", label: "◬ Framework", subtitle: "Divine Intelligence Equation",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapterFilter: 13,
  },
  {
    id: "index", label: "웃 Index", subtitle: "The Sacred Map",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapterFilter: 0,
    filterIds: ["index-01", "index-02"],
  },
];

// ── Library Reader Component ────────────────────────────────────

function LibraryReader({
  section, pageIndex, setPageIndex, pages,
}: {
  section: LibrarySection;
  pageIndex: number;
  setPageIndex: (n: number) => void;
  pages: typeof divinityPages;
}) {
  const touchStartX = React.useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50 && pageIndex < totalPages - 1) setPageIndex(pageIndex + 1);
    else if (delta > 50 && pageIndex > 0) setPageIndex(pageIndex - 1);
  };

  const bookPages = useMemo(
    () => (pages as Array<{ id: string; chapter: number; page: number; text: string; gated: boolean }>)
      .filter((p) => section.filterIds
        ? section.filterIds.includes(p.id)
        : p.chapter === section.chapterFilter
      ),
    [section, pages]
  );

  const totalPages = bookPages.length;
  const bookPage = bookPages[pageIndex] ?? null;

  return (
    <div className="w-full max-w-lg animate-in fade-in duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground/60">{section.label} — {section.subtitle}</p>
      </div>

      <div className="min-h-[250px]" key={`lib-${section.id}-${pageIndex}`}>
        {bookPage ? (
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            {bookPage.text.split("\n").map((line, i) => {
              // URL → styled external link
              if (line.startsWith("http")) {
                const label = line.includes("Divinity-Transformation") ? "Sacred Music & Transformation"
                  : line.includes("Loss-Love-Safety") ? "Love, Loss & Safety"
                  : line.includes("Divine-Unity") ? "Divine Unity Principles"
                  : line.includes("Divine-Intelligence") ? "Divine Intelligence Equation"
                  : "Sacred Resource";
                return (
                  <a key={i} href={line.trim()} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 my-4 px-4 py-3 rounded-xl border bg-card hover:bg-accent/30 transition-colors group">
                    <span className="text-lg">✦</span>
                    <span className="text-sm font-medium group-hover:underline" style={{ color: section.color.stroke }}>{label}</span>
                    <svg className="w-3 h-3 ml-auto text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                );
              }
              // Chapter heading → styled card (no chapter number shown)
              if (line.startsWith("Chapter ") && line.includes("•••")) {
                const withoutPrefix = line.replace(/^Chapter \d+:\s*/, "");
                const [title, subtitle] = withoutPrefix.split("•••").map(s => s.trim());
                return (
                  <div key={i} className="mt-6 mb-1">
                    <p className="text-base font-bold">{title}</p>
                    {subtitle && <p className="text-xs italic text-muted-foreground">{subtitle}</p>}
                  </div>
                );
              }
              // Sub-bullet → indented with dot
              if (line.startsWith("* ")) {
                const content = line.slice(2);
                return (
                  <p key={i} className="text-sm text-foreground/60 leading-relaxed ml-6 mb-1 flex items-start gap-2">
                    <span className="text-muted-foreground/40 mt-0.5">·</span>
                    <span>{content}</span>
                  </p>
                );
              }
              // "Overview" or "Divine Intelligence Framework" header
              if (line.trim() === "Overview" || line.startsWith("Divine Intelligence Framework")) {
                return <h2 key={i} className="text-lg font-bold mb-4 mt-2 text-muted-foreground">{line}</h2>;
              }
              // Empty line
              if (!line.trim()) return <div key={i} className="h-2" />;
              // Regular paragraph
              const noIndent = line.startsWith("•") || line.startsWith("—") || line.startsWith("🙏") || line.startsWith("💫") || line.startsWith("💡") || line.startsWith("Reflective") || line.startsWith("Master of Thought") || line.startsWith("AHO") || line.startsWith("AMEN") || line.startsWith("I AM") || line.startsWith("I leave") || line.startsWith("And ");
              return (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-3" style={{ textIndent: noIndent ? undefined : "2rem" }}>
                  {line}
                </p>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between pt-4 mt-4 border-t">
        <button
          onClick={() => pageIndex > 0 && setPageIndex(pageIndex - 1)}
          disabled={pageIndex === 0}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex > 0 ? section.color.stroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[10px] text-muted-foreground/40">{pageIndex + 1} / {totalPages}</p>
        <button
          onClick={() => pageIndex < totalPages - 1 && setPageIndex(pageIndex + 1)}
          disabled={pageIndex >= totalPages - 1}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex < totalPages - 1 ? section.color.stroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Page Reader Component ────────────────────────────────────────

function PageReader({
  chapter, section, pageIndex, setPageIndex, onNavigateToChapter, pages,
}: {
  chapter: Chapter;
  section: Section;
  pageIndex: number;
  setPageIndex: (n: number) => void;
  onNavigateToChapter?: (chapterId: number) => void;
  pages: typeof divinityPages;
}) {
  // Swipe detection for mobile page navigation
  const touchStartX = React.useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) {
      // Swipe left → next page
      const total = chapter.content.split("\n\n").length + (pages as Array<{ chapter: number }>).filter(p => p.chapter === chapter.id).length + 1;
      if (pageIndex < total - 1) setPageIndex(pageIndex + 1);
    } else if (delta > 50) {
      // Swipe right → previous page
      if (pageIndex > 0) setPageIndex(pageIndex - 1);
    }
  };

  // Get real book pages for this chapter number
  const chapterNum = chapter.id;
  const bookPages = useMemo(
    () => (pages as Array<{ id: string; chapter: number; page: number; text: string }>)
      .filter((p) => p.chapter === chapterNum),
    [chapterNum, pages]
  );

  // Page 0 = summary/intro (from our chapter data), pages 1+ = real book pages
  const isIntro = pageIndex === 0;
  const bookPage = !isIntro ? bookPages[pageIndex - 1] : null;
  const totalPages = bookPages.length + 1; // +1 for intro

  return (
    <div className="w-full max-w-lg animate-in fade-in duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Chapter title */}
      <div className="mb-6">
        <p className="text-xs text-muted-foreground/60">
          {chapter.title}
        </p>
      </div>

      {/* Content */}
      <div className="min-h-[250px]" key={`${chapterNum}-${pageIndex}`}>
        {isIntro ? (
          // Intro page: chapter summary + reflection
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{chapter.title}</h1>
              <p className="text-sm italic mt-1" style={{ color: section.color.stroke, opacity: 0.8 }}>{chapter.subtitle}</p>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{chapter.content.split("\n\n")[0]}</p>
            <div className="rounded-lg border-l-2 pl-5 py-3" style={{ borderColor: section.color.stroke }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reflection</p>
              <p className="text-sm text-foreground/60 italic">{chapter.reflection}</p>
            </div>
          </div>
        ) : bookPage ? (
          // Real book page — detect primer (last page with ••• marker)
          bookPage.text.includes("•••") && pageIndex === totalPages - 1 ? (
            // Bridge page: primer quote + next chapter link
            <div className="animate-in fade-in duration-300 space-y-8">
              {/* Primer quote */}
              {bookPage.text.split("\n").filter(p => !p.includes("•••")).map((paragraph, i) => (
                <p key={i} className="text-sm text-foreground/60 italic leading-relaxed" style={{ textIndent: "2rem" }}>
                  {paragraph}
                </p>
              ))}
              {/* Next chapter link */}
              {(() => {
                const nextLine = bookPage.text.split("\n").find(l => l.includes("•••"));
                if (!nextLine) return null;
                const parts = nextLine.split("•••").map(s => s.trim());
                const nextTitle = parts[0] || "";
                const nextSubtitle = parts[1] || "";
                return (
                  <button
                    onClick={() => {
                      if (chapter.id >= 12) {
                        // Ouroboros — cycle back to Chapter 1
                        onNavigateToChapter?.(1);
                      } else {
                        onNavigateToChapter?.(chapter.id + 1);
                      }
                    }}
                    className="w-full rounded-xl border bg-card p-6 text-left hover:bg-accent/30 transition-colors"
                  >
                    <p className="text-lg font-bold">{nextTitle}</p>
                    <p className="text-sm italic mt-1" style={{ color: section.color.stroke, opacity: 0.8 }}>{nextSubtitle}</p>
                  </button>
                );
              })()}
            </div>
          ) : (
            // Standard book page
            <div className="animate-in fade-in slide-in-from-right-2 duration-300">
              {bookPage.text.split("\n").map((paragraph, i) => (
                <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-4" style={{ textIndent: "2rem" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          )
        ) : null}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t">
        <button
          onClick={() => pageIndex > 0 && setPageIndex(pageIndex - 1)}
          disabled={pageIndex === 0}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex > 0 ? section.color.stroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[10px] text-muted-foreground/40">{pageIndex + 1} / {totalPages}</p>
        <button
          onClick={() => pageIndex < totalPages - 1 && setPageIndex(pageIndex + 1)}
          disabled={pageIndex >= totalPages - 1}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex < totalPages - 1 ? section.color.stroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}

// Donation gate
const DONATION_AMOUNT = 3.33;

export default function DivinityGuidePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DivinityGuidePage />
    </Suspense>
  );
}

function DivinityGuidePage() {
  const searchParams = useSearchParams();
  const [donated, setDonated] = useState(() => {
    if (typeof window !== "undefined") {
      // Check URL param (returning from Stripe) or localStorage
      if (new URLSearchParams(window.location.search).get("donated") === "true") {
        localStorage.setItem("divinity-guide-donated", "true");
        return true;
      }
      return localStorage.getItem("divinity-guide-donated") === "true";
    }
    return false;
  });

  // Show reward toast when returning from Stripe
  useEffect(() => {
    if (searchParams.get("donated") === "true" && !showReward) {
      setTimeout(() => setShowReward(true), 500);
      setTimeout(() => setShowReward(false), 5000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [showDonationPrompt, setShowDonationPrompt] = useState(false);
  const [showReward, setShowReward] = useState(false);
  const [pagesRead, setPagesRead] = useState(0);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const enteredAtRef = useRef(Date.now());
  // Sacred Library (gated content)
  const [viewMode, setViewMode] = useState<"portals" | "library">("portals");
  const [selectedLibrary, setSelectedLibrary] = useState<LibrarySection | null>(null);
  const [libraryPageIndex, setLibraryPageIndex] = useState(0);
  // Language selection
  const [divinityLang, setDivinityLang] = useState<DivinityLang>("en");
  const activeDivinityPages = DIVINITY_PAGE_MAP[divinityLang];

  const { currentTheme } = useTheme();
  const hub = getHubPosition();
  const outerPositions = getTheme2_3Positions();
  const readerRef = useRef<HTMLDivElement>(null);

  // Track pages read — prompt after 12 pages AND 3 minutes on page
  useEffect(() => {
    if (selectedChapter && pageIndex > 0) {
      setPagesRead(prev => {
        const next = prev + 1;
        const minutesElapsed = (Date.now() - enteredAtRef.current) / 60000;
        if (next >= 12 && minutesElapsed >= 3 && !donated && !showDonationPrompt) {
          setShowDonationPrompt(true);
        }
        return next;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex, selectedChapter]);

  // On mobile, scroll reader into view when chapter selected (don't jump to top)
  useEffect(() => {
    if (selectedChapter && readerRef.current) {
      readerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedChapter]);

  const [donationAmount, setDonationAmount] = useState(333); // cents

  const handleDonate = async () => {
    try {
      const res = await fetch("/api/v1/payments/divinity-donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_cents: donationAmount }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        localStorage.setItem("divinity-guide-donated", "true");
        window.location.href = data.checkout_url;
        return;
      }
    } catch {
      // Stripe unavailable — fall back to local acknowledgment
    }
    // Fallback: mark as donated locally
    localStorage.setItem("divinity-guide-donated", "true");
    setDonated(true);
    setShowDonationPrompt(false);
    setTimeout(() => setShowReward(true), 500);
    setTimeout(() => setShowReward(false), 5000);
  };

  const activeSection = SECTIONS.find((s) => s.id === selectedSection) ?? null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HI Token Reward Toast */}
      {showReward && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="rounded-xl border bg-card shadow-2xl px-6 py-4 text-center">
            <p className="text-2xl">웃</p>
            <p className="text-sm font-semibold text-primary">You earned 1.0 웃 token!</p>
            <p className="text-xs text-muted-foreground">Your contribution converted to a full Human Intelligence token.</p>
          </div>
        </div>
      )}

      {/* Sacred contribution prompt — 12 Ascended Masters approved */}
      {showDonationPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-700">
          <div className="relative max-w-md mx-auto px-8 py-8 rounded-2xl border bg-card shadow-2xl text-center space-y-6">
            {/* X close button — top right */}
            <button
              onClick={() => setShowDonationPrompt(false)}
              className="absolute top-3 right-4 text-muted-foreground hover:text-foreground text-xl leading-none"
              aria-label="Close"
            >
              &times;
            </button>
            <div className="text-5xl">✦</div>
            <h1 className="text-2xl font-bold">The Divinity Guide</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Return to Wholeness and Living Divinity
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed italic">
              You are becoming your own Divinity Guide. The wisdom you carry
              is awakening — heart, mind, and spirit aligning as one.
              Your presence here is not coincidence. It is remembrance.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                {[333, 555, 1111].map(cents => (
                  <button
                    key={cents}
                    onClick={() => setDonationAmount(cents)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      donationAmount === cents
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "bg-muted text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    ${(cents / 100).toFixed(2)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                A sacred contribution from one future Master of Thought to another.
                Your gift sustains this living guide for all who seek wholeness.
              </p>
              <button onClick={handleDonate} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
                Donate ${(donationAmount / 100).toFixed(2)}
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground/40">
              ◬ A.I. · ♡ S.I. · 웃 H.I.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* LEFT (desktop) / TOP (mobile): Flower Navigation */}
        <div className="w-full md:w-1/2 md:border-r flex flex-col items-center justify-center px-6 py-6">
          {/* Top-left: eXeL AI in theme color → main app home */}
          <div className="flex items-center justify-between w-full mb-1">
            <Link href="/" className="flex items-center gap-1.5 hover:opacity-80">
              <span className="text-sm font-bold" style={{ color: currentTheme.swatch }}>eXeL</span>
              <span className="text-sm font-light" style={{ color: currentTheme.swatch, opacity: 0.7 }}>AI</span>
            </Link>
            <button onClick={() => { setSelectedSection(null); setSelectedChapter(null); setPageIndex(0); setViewMode("portals"); setSelectedLibrary(null); }} className="text-xs text-muted-foreground hover:text-primary">
              {viewMode === "portals" ? "12 Wisdom Portals" : "Sacred Library"}
            </button>
          </div>
          {/* Title — same size as center heading (text-2xl), resets to flower home */}
          <button onClick={() => { setSelectedSection(null); setSelectedChapter(null); setPageIndex(0); }} className="text-2xl font-bold mb-0.5 hover:opacity-80 text-left" style={{ color: currentTheme.swatch }}>
            The Divinity Guide
          </button>
          <p className="text-[10px] text-muted-foreground italic mb-2">The Return to Wholeness and Living Divinity</p>

          {/* View toggle — only show Sacred Library option to donors */}
          {donated && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => { setViewMode("portals"); setSelectedLibrary(null); setSelectedSection(null); setSelectedChapter(null); }}
                className={`px-3 py-1 text-[10px] rounded-full transition-all ${viewMode === "portals" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >12 Wisdom Portals</button>
              <button
                onClick={() => { setViewMode("library"); setSelectedSection(null); setSelectedChapter(null); setSelectedLibrary(null); }}
                className={`px-3 py-1 text-[10px] rounded-full transition-all ${viewMode === "library" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
              >Sacred Library</button>
            </div>
          )}

          {/* Flower SVG */}
          <svg viewBox="0 0 600 500" className="w-full" style={{ overflow: "visible" }}>
            {/* Lines from hub to outer sections */}
            {viewMode === "portals" ? (
              <>
                {!selectedSection && outerPositions.map((pos, i) => (
                  <line key={`l-${i}`} x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                    stroke={SECTIONS[i].color.stroke} strokeOpacity={0.15} strokeWidth={2} />
                ))}
                {selectedSection && activeSection && outerPositions.map((pos, i) => (
                  <line key={`cl-${i}`} x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                    stroke={activeSection.color.stroke} strokeOpacity={0.12} strokeWidth={1.5} />
                ))}

                {!selectedSection ? (
                  <>
                    <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r}
                      theme={{ label: "✦", count: 0, avgConfidence: 0, summary33: "Explore" }}
                      fill="rgba(var(--primary), 0.15)" stroke="hsl(var(--primary))" isHub
                    />
                    {outerPositions.map((pos, i) => (
                      <ThemeCircle key={SECTIONS[i].id}
                        cx={pos.cx} cy={pos.cy} r={pos.r}
                        theme={{ label: SECTIONS[i].label, count: 0, avgConfidence: 0, summary33: SECTIONS[i].subtitle }}
                        fill={SECTIONS[i].color.fill} stroke={SECTIONS[i].color.stroke}
                        bloom bloomDelay={i * 200}
                        onClick={() => { setSelectedSection(SECTIONS[i].id); setSelectedChapter(null); }}
                      />
                    ))}
                  </>
                ) : activeSection && (
                  <>
                    {(() => {
                      const isSel = selectedChapter?.id === activeSection.chapters[0].id;
                      const hasSelection = !!selectedChapter;
                      return (
                        <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r}
                          theme={{ label: activeSection.chapters[0].title, count: 0, avgConfidence: 0, summary33: activeSection.chapters[0].subtitle }}
                          fill={isSel ? activeSection.color.stroke + "30" : activeSection.color.fill}
                          stroke={activeSection.color.stroke}
                          onClick={() => { setSelectedChapter(activeSection.chapters[0]); setPageIndex(0); }}
                          className={`${isSel ? "flower-pulse" : ""} ${hasSelection && !isSel ? "opacity-40" : ""}`}
                        />
                      );
                    })()}
                    {outerPositions.map((pos, i) => {
                      const ch = activeSection.chapters[i + 1];
                      if (!ch) return null;
                      const isSelected = selectedChapter?.id === ch.id;
                      const hasSelection = !!selectedChapter;
                      return (
                        <ThemeCircle key={ch.id}
                          cx={pos.cx} cy={pos.cy} r={pos.r}
                          theme={{ label: ch.title, count: 0, avgConfidence: 0, summary33: ch.subtitle }}
                          fill={isSelected ? activeSection.color.stroke + "30" : activeSection.color.fill}
                          stroke={activeSection.color.stroke}
                          bloom={isSelected} bloomDelay={0}
                          onClick={() => { setSelectedChapter(ch); setPageIndex(0); }}
                          className={`${isSelected ? "flower-pulse" : ""} ${hasSelection && !isSelected ? "opacity-40" : ""}`}
                        />
                      );
                    })}
                  </>
                )}
              </>
            ) : (
              /* Sacred Library flower — 3 circles: Heart (Prelude), Mind (Framework), Spirit (Index) */
              <>
                {outerPositions.map((pos, i) => (
                  <line key={`lib-l-${i}`} x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                    stroke={LIBRARY_SECTIONS[i].color.stroke} strokeOpacity={0.15} strokeWidth={2} />
                ))}
                <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r}
                  theme={{ label: "•••", count: 0, avgConfidence: 0, summary33: "Master of Thought" }}
                  fill={currentTheme.swatch + "1A"} stroke={currentTheme.swatch} isHub
                />
                {outerPositions.map((pos, i) => {
                  const lib = LIBRARY_SECTIONS[i];
                  const isSelected = selectedLibrary?.id === lib.id;
                  return (
                    <ThemeCircle key={lib.id}
                      cx={pos.cx} cy={pos.cy} r={pos.r}
                      theme={{ label: lib.label, count: 0, avgConfidence: 0, summary33: lib.subtitle }}
                      fill={isSelected ? lib.color.stroke + "30" : lib.color.fill}
                      stroke={lib.color.stroke}
                      bloom bloomDelay={i * 200}
                      onClick={() => { setSelectedLibrary(lib); setLibraryPageIndex(0); }}
                      className={isSelected ? "flower-pulse" : ""}
                    />
                  );
                })}
              </>
            )}
          </svg>

          {/* Back button */}
          {(selectedSection || selectedLibrary) && (
            <button onClick={() => {
              if (viewMode === "portals") { setSelectedSection(null); setSelectedChapter(null); }
              else { setSelectedLibrary(null); }
            }}
              className="mt-4 text-xs text-foreground hover:text-primary">
              ← {viewMode === "portals" ? "12 Wisdom Portals" : "Sacred Library"}
            </button>
          )}

          {/* Footer */}
          <div className="mt-auto pb-6 text-center">
            <br />
            <p className="text-[9px] text-muted-foreground/40">◬ A.I. · ♡ S.I. · 웃 H.I.</p>
            <br />
            <p className="text-[9px] text-muted-foreground/40">••• Master of Thought •••</p>
          </div>
        </div>

        {/* RIGHT (desktop) / BOTTOM (mobile): Book Page */}
        <div ref={readerRef} className="w-full md:w-1/2 px-6 md:px-10 py-8 md:py-12 overflow-y-auto flex flex-col items-center relative">
          {/* Language selector — upper right */}
          <select
            value={divinityLang}
            onChange={(e) => setDivinityLang(e.target.value as DivinityLang)}
            className="absolute top-4 right-4 px-2 py-1 text-[10px] rounded-md bg-muted text-muted-foreground border-none outline-none cursor-pointer z-10"
          >
            {DIVINITY_LANGUAGES.map(l => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>
          {viewMode === "library" && selectedLibrary ? (
            <LibraryReader
              section={selectedLibrary}
              pageIndex={libraryPageIndex}
              setPageIndex={setLibraryPageIndex}
              pages={activeDivinityPages}
            />
          ) : viewMode === "library" && !selectedLibrary ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center space-y-4 max-w-lg px-4">
                <div className="text-4xl">•••</div>
                <h1 className="text-2xl font-bold">Sacred Library</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The author&apos;s values, the divine intelligence framework, and the sacred map that connects them.
                  Select a circle on the flower to begin exploring.
                </p>
                <p className="text-xs text-muted-foreground/60 italic">
                  &quot;You are not the end of this work — you are its living continuation.&quot;
                </p>
              </div>
            </div>
          ) : !selectedChapter ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center space-y-4 max-w-lg px-4">
                <div className="text-4xl">✦</div>
                <h1 className="text-2xl font-bold">
                  {selectedSection ? activeSection?.subtitle : "The Return to Wholeness and Living Divinity"}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedSection
                    ? `Select a portal to begin reading. Each reveals a teaching, a practice, and a connection to the governance engine.`
                    : `This guide is a map and a companion — a sacred spiral leading inward. Here, symbols awaken, thought refines, and identity dissolves into essence. Select a section on the left to begin your journey.`
                  }
                </p>
                <p className="text-xs text-muted-foreground/60 italic">
                  &quot;You were never separate, only sleeping. Now you awaken.&quot;
                </p>
              </div>
            </div>
          ) : (
            <PageReader
              chapter={selectedChapter}
              section={activeSection!}
              pageIndex={pageIndex}
              setPageIndex={setPageIndex}
              pages={activeDivinityPages}
              onNavigateToChapter={(nextId) => {
                if (nextId === 0) {
                  // Return to flower home
                  setSelectedSection(null);
                  setSelectedChapter(null);
                  setPageIndex(0);
                  return;
                }
                // Find section + chapter for the target ID
                for (const sec of SECTIONS) {
                  const ch = sec.chapters.find(c => c.id === nextId);
                  if (ch) {
                    setSelectedSection(sec.id);
                    setSelectedChapter(ch);
                    setPageIndex(0);
                    break;
                  }
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
