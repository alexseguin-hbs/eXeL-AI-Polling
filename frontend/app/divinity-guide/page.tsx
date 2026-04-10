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

import React, { useState, useMemo } from "react";
import Link from "next/link";
import divinityPages from "@/lib/divinity-pages.json";
import {
  getTheme2_3Positions,
  getHubPosition,
} from "@/lib/flower-geometry";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
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

// HUB_SECTION removed — all 12 chapters distributed across 3 sections (4 each)

// ── Page Reader Component ────────────────────────────────────────

function PageReader({
  chapter, section, pageIndex, setPageIndex,
}: {
  chapter: Chapter;
  section: Section;
  pageIndex: number;
  setPageIndex: (n: number) => void;
}) {
  // Swipe detection for mobile page navigation
  const touchStartX = React.useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -50) {
      // Swipe left → next page
      const total = chapter.content.split("\n\n").length + (divinityPages as Array<{ chapter: number }>).filter(p => p.chapter === chapter.id).length + 1;
      if (pageIndex < total - 1) setPageIndex(pageIndex + 1);
    } else if (delta > 50) {
      // Swipe right → previous page
      if (pageIndex > 0) setPageIndex(pageIndex - 1);
    }
  };

  // Get real book pages for this chapter number
  const chapterNum = chapter.id;
  const bookPages = useMemo(
    () => (divinityPages as Array<{ id: string; chapter: number; page: number; text: string }>)
      .filter((p) => p.chapter === chapterNum),
    [chapterNum]
  );

  // Page 0 = summary/intro (from our chapter data), pages 1+ = real book pages
  const isIntro = pageIndex === 0;
  const bookPage = !isIntro ? bookPages[pageIndex - 1] : null;
  const totalPages = bookPages.length + 1; // +1 for intro

  return (
    <div className="w-full max-w-lg animate-in fade-in duration-300" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Page number at top */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-muted-foreground/40 font-mono">
          {isIntro ? chapter.title : bookPage?.id}
        </p>
        <p className="text-[10px] text-muted-foreground/30">
          {pageIndex + 1} / {totalPages}
        </p>
      </div>

      {/* Content */}
      <div className="min-h-[250px]" key={`${chapterNum}-${pageIndex}`}>
        {isIntro ? (
          // Intro page: chapter summary + reflection
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{chapter.title}</h1>
              <p className="text-sm text-primary/80 italic mt-1">{chapter.subtitle}</p>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed">{chapter.content.split("\n\n")[0]}</p>
            <div className="rounded-lg border-l-2 pl-5 py-3" style={{ borderColor: section.color.stroke }}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reflection</p>
              <p className="text-sm text-foreground/60 italic">{chapter.reflection}</p>
            </div>
          </div>
        ) : bookPage ? (
          // Real book page
          <div className="animate-in fade-in slide-in-from-right-2 duration-300">
            {bookPage.text.split("\n").map((paragraph, i) => (
              <p key={i} className="text-sm text-foreground/80 leading-relaxed mb-4" style={{ textIndent: "2rem" }}>
                {paragraph}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      {/* Navigation: ← → */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t">
        <button
          onClick={() => pageIndex > 0 && setPageIndex(pageIndex - 1)}
          disabled={pageIndex === 0}
          className="px-3 py-1 text-sm text-muted-foreground hover:text-primary disabled:opacity-20"
        >
          ←
        </button>
        <button
          onClick={() => pageIndex < totalPages - 1 && setPageIndex(pageIndex + 1)}
          disabled={pageIndex >= totalPages - 1}
          className="px-3 py-1 text-sm text-muted-foreground hover:text-primary disabled:opacity-20"
        >
          →
        </button>
      </div>
    </div>
  );
}

// Donation gate
const DONATION_AMOUNT = 3.33;

export default function DivinityGuidePage() {
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("divinity-guide-unlocked") === "true";
    }
    return false;
  });
  const [showReward, setShowReward] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const hub = getHubPosition();
  const outerPositions = getTheme2_3Positions();

  const handleDonate = () => {
    localStorage.setItem("divinity-guide-unlocked", "true");
    setUnlocked(true);
    setTimeout(() => setShowReward(true), 1500);
    setTimeout(() => setShowReward(false), 6000);
  };

  // Donation gate
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center space-y-6">
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary block">← Back</Link>
          <div className="text-5xl">✦</div>
          <h1 className="text-2xl font-bold">The Divinity Guide</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Return to Wholeness and Living Divinity. Twelve portals of wisdom
            connecting ancient truth to the governance engine of the future.
          </p>
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <p className="text-3xl font-bold text-primary">${DONATION_AMOUNT.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">A sacred contribution that supports the platform and community.</p>
            <button onClick={handleDonate} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              Donate & Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="flex flex-col md:flex-row min-h-screen">
        {/* LEFT (desktop) / TOP (mobile): Flower Navigation */}
        <div className="w-full md:w-1/2 md:border-r flex flex-col items-center justify-center px-6 py-6">
          <Link href="/divinity-guide" className="text-xs text-muted-foreground hover:text-primary mb-2 self-start">← Home</Link>
          <Link href="/divinity-guide" className="text-sm font-semibold mb-0.5 hover:text-primary">The Divinity Guide</Link>
          <p className="text-[10px] text-muted-foreground mb-3 italic">12 Portals of Wisdom</p>

          {/* Flower SVG — same diameter as dashboard Theme Analysis */}
          <svg viewBox="0 0 600 500" className="w-full" style={{ overflow: "visible" }}>
            {/* Lines from hub to outer sections */}
            {!selectedSection && outerPositions.map((pos, i) => (
              <line key={`l-${i}`} x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                stroke={SECTIONS[i].color.stroke} strokeOpacity={0.15} strokeWidth={2} />
            ))}
            {/* Lines from center chapter to 3 outer chapters (Trinity) */}
            {selectedSection && activeSection && outerPositions.map((pos, i) => (
              <line key={`cl-${i}`} x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                stroke={activeSection.color.stroke} strokeOpacity={0.12} strokeWidth={1.5} />
            ))}

            {!selectedSection ? (
              <>
                {/* Hub — decorative center */}
                <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r}
                  theme={{ label: "✦", count: 0, avgConfidence: 0, summary33: "Explore" }}
                  fill="rgba(var(--primary), 0.15)" stroke="hsl(var(--primary))" isHub
                />

                {/* 3 outer sections — no numbers, no confidence, just titles */}
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
                {/* CENTER = Chapter 1 of this section (clickable!) */}
                <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r + 35}
                  theme={{ label: activeSection.chapters[0].title, count: 0, avgConfidence: 0, summary33: activeSection.chapters[0].subtitle }}
                  fill={activeSection.color.fill}
                  stroke={selectedChapter?.id === activeSection.chapters[0].id ? "hsl(var(--primary))" : activeSection.color.stroke}
                  onClick={() => { setSelectedChapter(activeSection.chapters[0]); setPageIndex(0); }}
                />

                {/* 3 outer chapters (Trinity pattern — same positions as sections) */}
                {outerPositions.map((pos, i) => {
                  const ch = activeSection.chapters[i + 1]; // chapters 2,3,4
                  if (!ch) return null;
                  const isSelected = selectedChapter?.id === ch.id;
                  return (
                    <ThemeCircle key={ch.id}
                      cx={pos.cx} cy={pos.cy} r={pos.r}
                      theme={{ label: ch.title, count: 0, avgConfidence: 0, summary33: ch.subtitle }}
                      fill={activeSection.color.fill}
                      stroke={isSelected ? "hsl(var(--primary))" : activeSection.color.stroke}
                      bloom bloomDelay={i * 150}
                      onClick={() => { setSelectedChapter(ch); setPageIndex(0); }}
                    />
                  );
                })}
              </>
            )}
          </svg>

          {/* Section labels */}
          {selectedSection && (
            <button onClick={() => { setSelectedSection(null); setSelectedChapter(null); }}
              className="mt-4 text-xs text-muted-foreground hover:text-primary">
              ← All sections
            </button>
          )}

          {/* Footer */}
          <div className="mt-auto pb-6 text-center">
            <p className="text-[9px] text-muted-foreground/40">◬ A.I. · ♡ S.I. · 웃 H.I.</p>
            <p className="text-[9px] text-muted-foreground/40">••• Master of Thought •••</p>
          </div>
        </div>

        {/* RIGHT (desktop) / BOTTOM (mobile): Book Page */}
        <div className="w-full md:w-1/2 px-6 md:px-10 py-8 md:py-12 overflow-y-auto flex flex-col items-center">
          {!selectedChapter ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center space-y-4 max-w-lg px-4">
                <div className="text-4xl">✦</div>
                <h1 className="text-2xl font-bold">
                  {selectedSection ? activeSection?.subtitle : "The Return to Wholeness"}
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
            />
          )}
        </div>
      </div>
    </div>
  );
}
