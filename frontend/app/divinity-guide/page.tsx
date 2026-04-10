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

import React, { Suspense, useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import divinityPages from "@/lib/divinity-pages.json";
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

// HUB_SECTION removed — all 12 chapters distributed across 3 sections (4 each)

// ── Page Reader Component ────────────────────────────────────────

function PageReader({
  chapter, section, pageIndex, setPageIndex, onNavigateToChapter,
}: {
  chapter: Chapter;
  section: Section;
  pageIndex: number;
  setPageIndex: (n: number) => void;
  onNavigateToChapter?: (chapterId: number) => void;
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
            <button onClick={() => { setSelectedSection(null); setSelectedChapter(null); setPageIndex(0); }} className="text-xs text-muted-foreground hover:text-primary">12 Wisdom Portals</button>
          </div>
          {/* Title — same size as center heading (text-2xl), resets to flower home */}
          <button onClick={() => { setSelectedSection(null); setSelectedChapter(null); setPageIndex(0); }} className="text-2xl font-bold mb-0.5 hover:opacity-80 text-left" style={{ color: currentTheme.swatch }}>
            The Divinity Guide
          </button>
          <p className="text-[10px] text-muted-foreground italic mb-3">The Return to Wholeness and Living Divinity</p>

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

                {/* 3 outer chapters (Trinity pattern — same positions as sections) */}
                {outerPositions.map((pos, i) => {
                  const ch = activeSection.chapters[i + 1]; // chapters 2,3,4
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
          </svg>

          {/* Back to 12 Wisdom Portals */}
          {selectedSection && (
            <button onClick={() => { setSelectedSection(null); setSelectedChapter(null); }}
              className="mt-4 text-xs text-foreground hover:text-primary">
              ← 12 Wisdom Portals
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
        <div ref={readerRef} className="w-full md:w-1/2 px-6 md:px-10 py-8 md:py-12 overflow-y-auto flex flex-col items-center">
          {!selectedChapter ? (
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
