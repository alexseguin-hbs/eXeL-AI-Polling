/**
 * Bilingual word/sentence alignment — shared pure helpers (Divinity-Guide model).
 * =================================================================================================
 * Powers the "hover an English word → its translated equivalent highlights on the mirror column"
 * feature. Reuses the Divinity Guide's 4,436-word cross-language dictionary for real word equivalence,
 * with two fallbacks tuned for fact-dense prose: (1) exact-token match (numbers, units, proper nouns
 * that are identical across languages), (2) proportional position within the aligned sentence.
 *
 * Pure + deterministic. Sentences are index-mapped between columns (faithful translations preserve
 * paragraph + sentence structure), so hovering always lights the correct SENTENCE on both sides; the
 * word mirror is best-effort on top of that.
 */
import divinityDict from "@/lib/divinity-dictionary.json";

const WORD_DICT = divinityDict as Record<string, Record<string, string>>;

/** Split long-form prose into blocks on blank lines; a lone "---" is its own separator block. */
export function splitBlocks(text: string): string[] {
  return (text || "").split(/\n\n+/).map((b) => b.trim()).filter((b) => b.length > 0);
}

/** Sentence split — CJK on 。！？, otherwise on .!? + whitespace. Keeps trailing punctuation. */
export function splitSentences(text: string, lang: string): string[] {
  if (!text.trim()) return [text];
  if (lang === "zh" || lang === "ja") return text.split(/(?<=[。！？])/).filter((s) => s.length > 0);
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
}

/** Tokenize a sentence into render tokens (words + whitespace). CJK → per-character (no spaces). */
export function tokenize(sentence: string, lang: string): string[] {
  if (lang === "zh" || lang === "ja") return Array.from(sentence);
  return sentence.split(/(\s+)/).filter((t) => t.length > 0);
}

const isWord = (t: string) => !/^\s+$/.test(t);
const NUMBERISH = /^[0-9][0-9.,%°/x-]*$/i; // numbers, percents, degrees, ranges, "12,742", "4.6", "71%"

function dictLookup(word: string, targetLang: string): string | null {
  const entry = WORD_DICT[word.toLowerCase().replace(/[.,;:!?()'"]/g, "")];
  return entry ? entry[targetLang] || null : null;
}

/**
 * Best matching word index in the mirror sentence for a hovered source word.
 * Order: dictionary translation → exact token (numbers/proper nouns) → proportional position.
 */
export function findMirrorWordIdx(
  word: string, srcLang: string, mirrorTokens: string[], mirrorLang: string,
  srcPos?: { idx: number; total: number },
): number | null {
  const clean = word.toLowerCase().replace(/[.,;:!?()'"]/g, "");
  if (!clean) return null;
  const mirror = mirrorTokens.map((w, i) => ({ w, i, clean: w.toLowerCase().replace(/[.,;:!?()'"]/g, "") }))
    .filter((e) => isWord(e.w));

  // 1. Dictionary translation (en↔lang, both directions, or via English pivot).
  let translation: string | null = null;
  if (srcLang === "en") translation = dictLookup(word, mirrorLang);
  else if (mirrorLang === "en") {
    for (const [en, tr] of Object.entries(WORD_DICT)) if ((tr[srcLang] || "").toLowerCase() === clean) { translation = en; break; }
  } else {
    for (const [en, tr] of Object.entries(WORD_DICT)) if ((tr[srcLang] || "").toLowerCase() === clean) { translation = dictLookup(en, mirrorLang); break; }
  }
  if (translation) {
    const tl = translation.toLowerCase();
    if (mirrorLang === "zh" || mirrorLang === "ja") {
      for (const e of mirror) if (tl.includes(e.clean) || e.clean.includes(tl)) return e.i;
    } else {
      for (const tw of tl.split(/[\s/]+/)) { for (const e of mirror) if (e.clean === tw) return e.i; }
      for (const tw of tl.split(/[\s/]+/)) { if (tw.length < 3) continue; const stem = tw.slice(0, Math.max(3, tw.length - 2)); for (const e of mirror) if (e.clean.startsWith(stem)) return e.i; }
    }
  }

  // 2. Exact token — numbers/units/proper nouns identical across languages (e.g. "12,742", "NASA", "SOHO").
  if (NUMBERISH.test(clean) || /^[A-Z]/.test(word)) {
    for (const e of mirror) if (e.clean === clean) return e.i;
  }

  // 3. Proportional position within the sentence (best-effort structural map).
  if (srcPos && srcPos.total > 0 && mirror.length) {
    const j = Math.round((srcPos.idx / srcPos.total) * (mirror.length - 1));
    return mirror[Math.max(0, Math.min(mirror.length - 1, j))].i;
  }
  return null;
}
