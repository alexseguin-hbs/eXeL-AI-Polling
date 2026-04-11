"use client";

/**
 * Bilingual Side-by-Side Reader for The Divinity Guide
 *
 * Hover a word on either column → sentence highlights on BOTH sides.
 * The hovered word gets extra brightness. Mirror side highlights the
 * proportionally-mapped word (or exact dictionary match).
 * Pinyin toggle for Mandarin.
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
  setPrimaryLang: (lang: DivinityLang) => void;
  setMirrorLang: (lang: DivinityLang) => void;
  primaryPages: typeof divinityPages;
  mirrorPages: typeof divinityPages;
  onClose: () => void;
  reflectionLabel?: string;
  mirrorReflectionLabel?: string;
  availableLanguages: readonly { code: string; label: string; flag: string }[];
}

// ── Sacred Terminology Dictionary ─────────────────────────────────
// Key terms that map exactly across languages for word-level alignment

// Full dictionary: 4,436 unique words from the complete Divinity Guide
// Each entry: "english_word": { "es": "spanish", "zh": "中文" }
import divinityDict from "@/lib/divinity-dictionary.json";

const WORD_DICT = divinityDict as Record<string, { es: string; zh: string }>;

/** Look up a word in the dictionary, return its translation in the target language */
function dictLookup(word: string, targetLang: DivinityLang): string | null {
  const entry = WORD_DICT[word.toLowerCase()];
  if (!entry) return null;
  if (targetLang === "es") return entry.es || null;
  if (targetLang === "zh") return entry.zh || null;
  return null;
}

/** Find the word index in the mirror sentence that best matches the translated word */
function findMirrorWordIdx(
  word: string, sourceLang: DivinityLang, mirrorWords: string[], mirrorLang: DivinityLang
): number | null {
  // Get the translation of the hovered word
  let translation: string | null = null;

  if (sourceLang === "en") {
    translation = dictLookup(word, mirrorLang);
  } else if (mirrorLang === "en") {
    // Reverse lookup: find which English word translates to this source word
    const wordLower = word.toLowerCase();
    for (const [enWord, translations] of Object.entries(WORD_DICT)) {
      const t = sourceLang === "es" ? translations.es : translations.zh;
      if (t && t.toLowerCase() === wordLower) {
        translation = enWord;
        break;
      }
    }
  } else {
    // Neither side is English: source → EN → mirror
    const wordLower = word.toLowerCase();
    for (const [enWord, translations] of Object.entries(WORD_DICT)) {
      const t = sourceLang === "es" ? translations.es : translations.zh;
      if (t && t.toLowerCase() === wordLower) {
        translation = dictLookup(enWord, mirrorLang);
        break;
      }
    }
  }

  if (!translation) return null;
  const translationLower = translation.toLowerCase();
  const translationWords = translationLower.split(/[\s\/]+/); // split on space or /

  const nonSpaceEntries: { word: string; origIdx: number }[] = [];
  mirrorWords.forEach((w, i) => { if (!/^\s+$/.test(w)) nonSpaceEntries.push({ word: w, origIdx: i }); });

  // For Chinese: search character-by-character
  if (mirrorLang === "zh") {
    const joined = nonSpaceEntries.map(e => e.word).join("");
    const pos = joined.indexOf(translationLower);
    if (pos >= 0) {
      let charCount = 0;
      for (const entry of nonSpaceEntries) {
        if (charCount >= pos) return entry.origIdx;
        charCount += entry.word.length;
      }
    }
    // Try first character match
    for (const entry of nonSpaceEntries) {
      if (translationLower.includes(entry.word)) return entry.origIdx;
    }
    return null;
  }

  // For space-separated languages: try exact word match first
  for (const tw of translationWords) {
    for (const entry of nonSpaceEntries) {
      if (entry.word.toLowerCase() === tw) return entry.origIdx;
    }
  }
  // Try startsWith match (handles verb conjugations etc.)
  for (const tw of translationWords) {
    if (tw.length < 3) continue;
    const stem = tw.slice(0, Math.max(3, tw.length - 2));
    for (const entry of nonSpaceEntries) {
      if (entry.word.toLowerCase().startsWith(stem)) return entry.origIdx;
    }
  }
  return null;
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

// ── Proportional Word Mapping ─────────────────────────────────────

function getProportionalMirrorWordIdx(
  wordIdx: number, sourceWords: string[], mirrorWords: string[], sourceLang: DivinityLang, mirrorLang: DivinityLang
): number {
  // Count non-space words only
  const srcNonSpace = sourceWords.filter(w => !/^\s+$/.test(w));
  const mirNonSpace = mirrorWords.filter(w => !/^\s+$/.test(w));
  if (srcNonSpace.length === 0 || mirNonSpace.length === 0) return 0;

  // Find position of wordIdx among non-space words
  let srcPos = 0;
  for (let i = 0; i < wordIdx; i++) {
    if (!/^\s+$/.test(sourceWords[i])) srcPos++;
  }

  const ratio = srcPos / Math.max(srcNonSpace.length - 1, 1);
  const mirPos = Math.round(ratio * (mirNonSpace.length - 1));

  // Map back to full array index
  let count = 0;
  for (let i = 0; i < mirrorWords.length; i++) {
    if (!/^\s+$/.test(mirrorWords[i])) {
      if (count === mirPos) return i;
      count++;
    }
  }
  return 0;
}

// ── Pinyin Text Component ─────────────────────────────────────────

function PinyinText({ text, isHighlighted, isActiveWord, sectionColor }: {
  text: string;
  isHighlighted: boolean;
  isActiveWord: boolean;
  sectionColor?: string;
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
            <rt className="text-[0.55em] font-normal" style={{ color: sectionColor || "inherit", opacity: 0.85 }}>{c.pinyin}</rt>
          </ruby>
        ) : (
          <React.Fragment key={i}>{c.char}</React.Fragment>
        )
      )}
    </span>
  );
}

// ── Synced Paragraph ──────────────────────────────────────────────

interface HoverState {
  paraIdx: number;
  sentIdx: number;
  wordIdx: number;
  side: "left" | "right";
  // Mirror word mapping (computed by parent)
  mirrorWordIdx: number | null;
}

function SyncedParagraph({
  sentences, lang, paraIdx, activeSentence, hover, showPinyin,
  onHoverWord, side, sectionColor,
}: {
  sentences: string[];
  lang: DivinityLang;
  paraIdx: number;
  activeSentence: string | null;
  hover: HoverState | null;
  showPinyin: boolean;
  onHoverWord: (paraIdx: number, sentIdx: number, wordIdx: number, side: "left" | "right") => void;
  side: "left" | "right";
  sectionColor?: string;
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
              // Determine if THIS word is the active one
              const isDirectHover = isSentenceActive &&
                hover?.paraIdx === paraIdx &&
                hover?.sentIdx === sIdx &&
                hover?.wordIdx === wIdx &&
                hover?.side === side;

              // Mirror side: highlight proportionally-mapped word
              const isMirrorHighlight = isSentenceActive &&
                hover?.paraIdx === paraIdx &&
                hover?.sentIdx === sIdx &&
                hover?.side !== side &&
                hover?.mirrorWordIdx === wIdx;

              const isWordActive = isDirectHover || isMirrorHighlight;

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
                      sectionColor={sectionColor}
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
  primaryLang, mirrorLang, setPrimaryLang, setMirrorLang,
  primaryPages, mirrorPages, onClose,
  reflectionLabel = "Reflection", mirrorReflectionLabel = "Reflection",
  availableLanguages,
}: BilingualReaderProps) {
  const [activeSentence, setActiveSentence] = useState<string | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
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
      if (e.key === "ArrowRight" && pageIndex < totalPages - 1) setPageIndex(pageIndex + 1);
      if (e.key === "ArrowLeft" && pageIndex > 0) setPageIndex(pageIndex - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const sid = `p${paraIdx}_s${sentIdx}`;
    setActiveSentence(sid);

    // Compute mirror word index
    const np = normalizedParagraphs[paraIdx];
    if (!np) { setHover({ paraIdx, sentIdx, wordIdx, side, mirrorWordIdx: null }); return; }

    const sourceSentences = side === "left" ? np.primary : np.mirror;
    const mirrorSentences = side === "left" ? np.mirror : np.primary;
    const sourceLang = side === "left" ? primaryLang : mirrorLang;
    const targetLang = side === "left" ? mirrorLang : primaryLang;

    const sourceSent = sourceSentences[sentIdx] ?? "";
    const mirrorSent = mirrorSentences[sentIdx] ?? "";
    const sourceWords = splitWords(sourceSent, sourceLang);
    const mirrorWords = splitWords(mirrorSent, targetLang);

    // Try dictionary match first
    const hoveredWord = sourceWords[wordIdx] ?? "";
    let mirrorWordIdx: number | null = null;
    if (hoveredWord && !/^\s+$/.test(hoveredWord)) {
      mirrorWordIdx = findMirrorWordIdx(hoveredWord, sourceLang, mirrorWords, targetLang);
    }
    // Fallback to proportional mapping
    if (mirrorWordIdx === null) {
      mirrorWordIdx = getProportionalMirrorWordIdx(wordIdx, sourceWords, mirrorWords, sourceLang, targetLang);
    }

    setHover({ paraIdx, sentIdx, wordIdx, side, mirrorWordIdx });
  }, [normalizedParagraphs, primaryLang, mirrorLang]);

  const handleLeave = useCallback(() => {
    setActiveSentence(null);
    setHover(null);
  }, []);

  const hasChinese = primaryLang === "zh" || mirrorLang === "zh";
  const langLabel = (code: string) => availableLanguages.find(l => l.code === code);
  const isRTL = (lang: DivinityLang) => lang === "fa" || lang === "he";
  const sectionStroke = section.color.stroke;

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col animate-in fade-in duration-300">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="border-b flex items-center justify-between px-4 py-2 shrink-0">
        <div className="flex items-center gap-3">
          {/* Close — matches PageReader circle style */}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full border flex items-center justify-center hover:bg-accent/30 transition-all"
            style={{ borderColor: sectionStroke }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <span className="text-xs text-muted-foreground/60 hidden sm:inline">{chapter.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Pinyin toggle */}
          {hasChinese && (
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs transition-all ${showPinyin ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent/30"}`}
              style={!showPinyin ? { borderColor: sectionStroke } : undefined}
            >
              拼
            </button>
          )}
        </div>
      </div>

      {/* ── Column Headers with language selectors ──────────── */}
      <div className="flex flex-col md:flex-row border-b shrink-0">
        <div className="w-full md:w-1/2 px-6 py-2 md:border-r">
          <select
            value={primaryLang}
            onChange={e => setPrimaryLang(e.target.value as DivinityLang)}
            className="text-[10px] text-muted-foreground/60 uppercase tracking-wider bg-transparent cursor-pointer border-none outline-none"
          >
            {availableLanguages
              .filter(l => l.code !== mirrorLang)
              .map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
          </select>
        </div>
        <div className="w-full md:w-1/2 px-6 py-2">
          <select
            value={mirrorLang}
            onChange={e => setMirrorLang(e.target.value as DivinityLang)}
            className="text-[10px] text-muted-foreground/60 uppercase tracking-wider bg-transparent cursor-pointer border-none outline-none"
          >
            {availableLanguages
              .filter(l => l.code !== primaryLang)
              .map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
          </select>
        </div>
      </div>

      {/* ── Content — 50/50 split ───────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {isIntro ? (
          <>
            <div className="w-full md:w-1/2 overflow-y-auto p-6 md:border-r" dir={isRTL(primaryLang) ? "rtl" : "ltr"}>
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">{chapter.title}</h1>
                  <p className="text-sm italic mt-1" style={{ color: sectionStroke, opacity: 0.8 }}>{chapter.subtitle}</p>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{chapter.content}</p>
                <div className="rounded-lg border-l-2 pl-5 py-3" style={{ borderColor: sectionStroke }}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{reflectionLabel}</p>
                  <p className="text-sm text-foreground/60 italic">{chapter.reflection}</p>
                </div>
              </div>
            </div>
            <div className="w-full md:w-1/2 overflow-y-auto p-6" dir={isRTL(mirrorLang) ? "rtl" : "ltr"}>
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold">{mirrorChapter.title}</h1>
                  <p className="text-sm italic mt-1" style={{ color: sectionStroke, opacity: 0.8 }}>{mirrorChapter.subtitle}</p>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">{mirrorChapter.content}</p>
                <div className="rounded-lg border-l-2 pl-5 py-3" style={{ borderColor: sectionStroke }}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{mirrorReflectionLabel}</p>
                  <p className="text-sm text-foreground/60 italic">{mirrorChapter.reflection}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="w-full md:w-1/2 overflow-y-auto p-6 md:border-r"
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
                    hover={hover}
                    showPinyin={showPinyin && primaryLang === "zh"}
                    onHoverWord={handleHoverWord}
                    side="left"
                    sectionColor={sectionStroke}
                  />
                ) : (
                  <div key={i} className="h-4" />
                )
              )}
            </div>
            <div
              className="w-full md:w-1/2 overflow-y-auto p-6"
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
                    hover={hover}
                    showPinyin={showPinyin && mirrorLang === "zh"}
                    onHoverWord={handleHoverWord}
                    side="right"
                    sectionColor={sectionStroke}
                  />
                ) : (
                  <div key={i} className="h-4" />
                )
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Navigation — matches PageReader circle icon style ── */}
      <div className="flex items-center justify-between px-6 pt-4 pb-4 border-t shrink-0">
        <button
          onClick={() => pageIndex > 0 && setPageIndex(pageIndex - 1)}
          disabled={pageIndex === 0}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex > 0 ? sectionStroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <p className="text-[10px] text-muted-foreground/40">{pageIndex + 1} / {totalPages}</p>
        <button
          onClick={() => pageIndex < totalPages - 1 && setPageIndex(pageIndex + 1)}
          disabled={pageIndex >= totalPages - 1}
          className="w-12 h-12 rounded-full border flex items-center justify-center text-lg hover:bg-accent/30 disabled:opacity-15 transition-all"
          style={{ borderColor: pageIndex < totalPages - 1 ? sectionStroke : undefined }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
