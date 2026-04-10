"use client";

/**
 * Bilingual Side-by-Side Reader for The Divinity Guide
 *
 * Hover a word on either column → sentence highlights on BOTH sides.
 * The hovered word gets extra brightness. Pinyin toggle for Mandarin.
 *
 * Sentence alignment: both columns normalize to the same sentence count
 * per paragraph so indices match 1:1 across languages.
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { pinyin } from "pinyin-pro";
import type divinityPages from "@/lib/divinity-pages.json";

// ── Types ─────────────────────────────────────────────────────────

type DivinityLang = "en" | "es" | "uk" | "ru" | "zh" | "fa" | "he" | "pt";

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
  chapters: Chapter[];
}

interface BilingualReaderProps {
  chapter: Chapter;
  mirrorChapter: Chapter;
  section: Section;
  pageIndex: number;
  setPageIndex: (n: number) => void;
  primaryLang: DivinityLang;
  mirrorLang: DivinityLang;
  setMirrorLang: (lang: DivinityLang) => void;
  primaryPages: typeof divinityPages;
  mirrorPages: typeof divinityPages;
  onClose: () => void;
  reflectionLabel?: string;
  mirrorReflectionLabel?: string;
  availableLanguages: readonly { code: string; label: string; flag: string }[];
}

// ── Sentence Splitting ────────────────────────────────────────────

function splitSentencesRaw(text: string, lang: DivinityLang): string[] {
  if (!text.trim()) return [text];
  if (lang === "zh") {
    const parts = text.split(/(?<=[。！？])/);
    return parts.filter(s => s.length > 0);
  }
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.filter(s => s.length > 0);
}

/**
 * Normalize two sentence arrays to the same count.
 * Uses the MINIMUM count — merges extra trailing sentences into the last slot.
 * This ensures indices always align 1:1 between languages.
 */
function normalizeSentences(
  primarySentences: string[],
  mirrorSentences: string[]
): { primary: string[]; mirror: string[] } {
  const targetCount = Math.min(primarySentences.length, mirrorSentences.length);
  if (targetCount <= 0) return { primary: [primarySentences.join(" ")], mirror: [mirrorSentences.join(" ")] };

  const mergeTo = (arr: string[], count: number) => {
    if (arr.length <= count) return arr;
    const result = arr.slice(0, count - 1);
    result.push(arr.slice(count - 1).join(" "));
    return result;
  };

  return {
    primary: mergeTo(primarySentences, targetCount),
    mirror: mergeTo(mirrorSentences, targetCount),
  };
}

function splitWords(sentence: string, lang: DivinityLang): string[] {
  if (lang === "zh") {
    return Array.from(sentence).filter(c => c.trim().length > 0);
  }
  return sentence.split(/(\s+)/).filter(w => w.length > 0);
}

// ── Pinyin Text Component ─────────────────────────────────────────

function PinyinText({ text, isHighlighted, isActiveWord }: {
  text: string;
  isHighlighted: boolean;
  isActiveWord: boolean;
}) {
  const chars = useMemo(() => {
    const arr = Array.from(text);
    const py = pinyin(text, { type: "array", toneType: "symbol" });
    return arr.map((char, i) => ({
      char,
      pinyin: py[i],
      isChinese: /[\u4e00-\u9fff]/.test(char),
    }));
  }, [text]);

  return (
    <span className={`${isHighlighted ? "bg-primary/10 rounded-sm" : ""} ${isActiveWord ? "bg-primary/25 font-semibold rounded-sm" : ""}`}>
      {chars.map((c, i) =>
        c.isChinese ? (
          <ruby key={i} className="leading-loose">
            {c.char}
            <rt className="text-[0.55em] text-muted-foreground/70 font-normal">{c.pinyin}</rt>
          </ruby>
        ) : (
          <React.Fragment key={i}>{c.char}</React.Fragment>
        )
      )}
    </span>
  );
}

// ── Synced Paragraph ──────────────────────────────────────────────

function SyncedParagraph({
  sentences, lang, paraIdx, activeSentence, activeWord, showPinyin,
  onHoverWord, side,
}: {
  sentences: string[];
  lang: DivinityLang;
  paraIdx: number;
  activeSentence: string | null;
  activeWord: { paraIdx: number; sentIdx: number; wordIdx: number; side: "left" | "right" } | null;
  showPinyin: boolean;
  onHoverWord: (paraIdx: number, sentIdx: number, wordIdx: number, side: "left" | "right") => void;
  side: "left" | "right";
}) {
  return (
    <p className="text-sm text-foreground/80 leading-relaxed mb-4" style={{ textIndent: "2rem" }}>
      {sentences.map((sentence, sIdx) => {
        const sid = `p${paraIdx}_s${sIdx}`;
        const isSentenceActive = activeSentence === sid;
        const words = splitWords(sentence, lang);

        return (
          <React.Fragment key={sIdx}>
            {words.map((word, wIdx) => {
              const isWordActive = isSentenceActive &&
                activeWord?.paraIdx === paraIdx &&
                activeWord?.sentIdx === sIdx &&
                activeWord?.wordIdx === wIdx &&
                activeWord?.side === side;

              if (lang === "zh" && showPinyin) {
                return (
                  <span
                    key={wIdx}
                    onMouseEnter={() => onHoverWord(paraIdx, sIdx, wIdx, side)}
                    onTouchStart={() => onHoverWord(paraIdx, sIdx, wIdx, side)}
                    className="cursor-default"
                  >
                    <PinyinText
                      text={word}
                      isHighlighted={isSentenceActive && !isWordActive}
                      isActiveWord={isWordActive}
                    />
                  </span>
                );
              }

              const isSpace = /^\s+$/.test(word);
              if (isSpace) return <React.Fragment key={wIdx}>{word}</React.Fragment>;

              return (
                <span
                  key={wIdx}
                  onMouseEnter={() => onHoverWord(paraIdx, sIdx, wIdx, side)}
                  onTouchStart={() => onHoverWord(paraIdx, sIdx, wIdx, side)}
                  className={`cursor-default transition-colors duration-150 ${
                    isWordActive
                      ? "bg-primary/25 font-semibold rounded-sm"
                      : isSentenceActive
                        ? "bg-primary/10 rounded-sm"
                        : ""
                  }`}
                >
                  {word}
                </span>
              );
            })}
          </React.Fragment>
        );
      })}
    </p>
  );
}

// ── Main BilingualReader ──────────────────────────────────────────

export default function BilingualReader({
  chapter, mirrorChapter, section, pageIndex, setPageIndex,
  primaryLang, mirrorLang, setMirrorLang,
  primaryPages, mirrorPages, onClose,
  reflectionLabel = "Reflection", mirrorReflectionLabel = "Reflection",
  availableLanguages,
}: BilingualReaderProps) {
  const [activeSentence, setActiveSentence] = useState<string | null>(null);
  const [activeWord, setActiveWord] = useState<{ paraIdx: number; sentIdx: number; wordIdx: number; side: "left" | "right" } | null>(null);
  const [showPinyin, setShowPinyin] = useState(false);

  // Body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setPageIndex(pageIndex + 1);
      if (e.key === "ArrowLeft" && pageIndex > 0) setPageIndex(pageIndex - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, pageIndex, setPageIndex]);

  // Get book pages for this chapter
  const primaryBookPages = useMemo(
    () => (primaryPages as Array<{ id: string; chapter: number; page: number; text: string }>)
      .filter(p => p.chapter === chapter.id),
    [primaryPages, chapter.id]
  );
  const mirrorBookPages = useMemo(
    () => (mirrorPages as Array<{ id: string; chapter: number; page: number; text: string }>)
      .filter(p => p.chapter === chapter.id),
    [mirrorPages, chapter.id]
  );

  const totalPages = primaryBookPages.length + 1;
  const isIntro = pageIndex === 0;

  const primaryText = isIntro ? chapter.content : primaryBookPages[pageIndex - 1]?.text ?? "";
  const mirrorText = isIntro ? mirrorChapter.content : mirrorBookPages[pageIndex - 1]?.text ?? "";

  const primaryParagraphs = primaryText.split("\n");
  const mirrorParagraphs = mirrorText.split("\n");

  // Pre-compute normalized sentence arrays for each paragraph pair
  const normalizedParagraphs = useMemo(() => {
    const maxLen = Math.max(primaryParagraphs.length, mirrorParagraphs.length);
    const result: { primary: string[]; mirror: string[] }[] = [];
    for (let i = 0; i < maxLen; i++) {
      const pText = primaryParagraphs[i] ?? "";
      const mText = mirrorParagraphs[i] ?? "";
      if (!pText.trim() && !mText.trim()) {
        result.push({ primary: [], mirror: [] });
        continue;
      }
      const pSentences = splitSentencesRaw(pText, primaryLang);
      const mSentences = splitSentencesRaw(mText, mirrorLang);
      result.push(normalizeSentences(pSentences, mSentences));
    }
    return result;
  }, [primaryParagraphs, mirrorParagraphs, primaryLang, mirrorLang]);

  const handleHoverWord = useCallback((paraIdx: number, sentIdx: number, wordIdx: number, side: "left" | "right") => {
    setActiveSentence(`p${paraIdx}_s${sentIdx}`);
    setActiveWord({ paraIdx, sentIdx, wordIdx, side });
  }, []);

  const handleLeave = useCallback(() => {
    setActiveSentence(null);
    setActiveWord(null);
  }, []);

  const hasChinese = primaryLang === "zh" || mirrorLang === "zh";
  const langLabel = (code: string) => availableLanguages.find(l => l.code === code);
  const isRTL = (lang: DivinityLang) => lang === "fa" || lang === "he";

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col animate-in fade-in duration-300">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="h-12 border-b flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-accent/30 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <span className="text-xs text-muted-foreground hidden sm:inline">{chapter.title}</span>
        </div>

        <div className="flex items-center gap-2">
          {hasChinese && (
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`px-2 py-1 rounded text-xs border transition-colors ${showPinyin ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent/30"}`}
            >
              拼
            </button>
          )}

          <select
            value={mirrorLang}
            onChange={e => setMirrorLang(e.target.value as DivinityLang)}
            className="text-xs bg-transparent border rounded px-2 py-1 cursor-pointer"
          >
            {availableLanguages
              .filter(l => l.code !== primaryLang)
              .map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
          </select>

          <div className="flex items-center gap-1">
            <button
              onClick={() => pageIndex > 0 && setPageIndex(pageIndex - 1)}
              disabled={pageIndex === 0}
              className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-accent/30 disabled:opacity-15 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <span className="text-[10px] text-muted-foreground/60 min-w-[40px] text-center">{pageIndex + 1} / {totalPages}</span>
            <button
              onClick={() => pageIndex < totalPages - 1 && setPageIndex(pageIndex + 1)}
              disabled={pageIndex >= totalPages - 1}
              className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-accent/30 disabled:opacity-15 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Column Headers ──────────────────────────────────── */}
      <div className="flex flex-col md:flex-row border-b shrink-0">
        <div className="w-full md:w-1/2 px-4 md:px-6 py-2 md:border-r">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {langLabel(primaryLang)?.flag} {langLabel(primaryLang)?.label}
          </p>
        </div>
        <div className="w-full md:w-1/2 px-4 md:px-6 py-2">
          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {langLabel(mirrorLang)?.flag} {langLabel(mirrorLang)?.label}
          </p>
        </div>
      </div>

      {/* ── Content — 50/50 split ───────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {isIntro ? (
          <>
            <div className="w-full md:w-1/2 overflow-y-auto p-4 md:p-6 md:border-r" dir={isRTL(primaryLang) ? "rtl" : "ltr"}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{chapter.title}</h2>
                  <p className="text-sm italic mt-1" style={{ color: section.color.stroke, opacity: 0.8 }}>{chapter.subtitle}</p>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{chapter.content}</p>
                <div className="rounded-lg border-l-2 pl-4 py-2" style={{ borderColor: section.color.stroke }}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{reflectionLabel}</p>
                  <p className="text-sm text-foreground/60 italic">{chapter.reflection}</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 overflow-y-auto p-4 md:p-6" dir={isRTL(mirrorLang) ? "rtl" : "ltr"}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold">{mirrorChapter.title}</h2>
                  <p className="text-sm italic mt-1" style={{ color: section.color.stroke, opacity: 0.8 }}>{mirrorChapter.subtitle}</p>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{mirrorChapter.content}</p>
                <div className="rounded-lg border-l-2 pl-4 py-2" style={{ borderColor: section.color.stroke }}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{mirrorReflectionLabel}</p>
                  <p className="text-sm text-foreground/60 italic">{mirrorChapter.reflection}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Left column — primary language (50%) */}
            <div
              className="w-full md:w-1/2 overflow-y-auto p-4 md:p-6 md:border-r"
              dir={isRTL(primaryLang) ? "rtl" : "ltr"}
              onMouseLeave={handleLeave}
            >
              {normalizedParagraphs.map((np, i) =>
                np.primary.length > 0 ? (
                  <SyncedParagraph
                    key={i}
                    sentences={np.primary}
                    lang={primaryLang}
                    paraIdx={i}
                    activeSentence={activeSentence}
                    activeWord={activeWord}
                    showPinyin={showPinyin && primaryLang === "zh"}
                    onHoverWord={handleHoverWord}
                    side="left"
                  />
                ) : (
                  <div key={i} className="h-4" />
                )
              )}
            </div>

            {/* Right column — mirror language (50%) */}
            <div
              className="w-full md:w-1/2 overflow-y-auto p-4 md:p-6"
              dir={isRTL(mirrorLang) ? "rtl" : "ltr"}
              onMouseLeave={handleLeave}
            >
              {normalizedParagraphs.map((np, i) =>
                np.mirror.length > 0 ? (
                  <SyncedParagraph
                    key={i}
                    sentences={np.mirror}
                    lang={mirrorLang}
                    paraIdx={i}
                    activeSentence={activeSentence}
                    activeWord={activeWord}
                    showPinyin={showPinyin && mirrorLang === "zh"}
                    onHoverWord={handleHoverWord}
                    side="right"
                  />
                ) : (
                  <div key={i} className="h-4" />
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
