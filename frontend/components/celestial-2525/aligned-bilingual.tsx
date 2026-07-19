"use client";

/**
 * CELESTIAL-2525 · aligned bilingual reader (Divinity-Guide cross-highlight, reused).
 * =================================================================================================
 * Two 50/50 columns. Hover (or tap) a word → its SENTENCE highlights on BOTH columns and the mapped
 * translated word brightens on the mirror side (dictionary → exact-token → proportional, see
 * lib/bilingual-align.ts). Sentences map by index; faithful translations preserve that structure.
 */
import { useMemo, useState } from "react";
import { splitBlocks, splitSentences, tokenize, findMirrorWordIdx } from "@/lib/bilingual-align";

type Col = { key: string; loc: string; text: string; rtl: boolean; setLoc: (s: string) => void };
type Hover = { side: string; blockIdx: number; sentIdx: number; wordIdx: number; mirrorWordIdx: number | null } | null;

interface ColModel { blocks: { sep: boolean; sentences: { tokens: string[]; wordTokenIdx: number[] }[] }[]; }

const C = { text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", border: "#1e2b3a", panel: "#0c1420", gold: "#ffd400" };
const HL = { sentence: `${C.cyan}22`, word: `${C.gold}66` };

/** Build a render model: blocks → sentences → tokens, with the non-space token indices per sentence. */
function buildModel(text: string, lang: string): ColModel {
  return {
    blocks: splitBlocks(text).map((b) => {
      if (b === "---") return { sep: true, sentences: [] };
      return {
        sep: false,
        sentences: splitSentences(b, lang).map((s) => {
          const tokens = tokenize(s, lang);
          const wordTokenIdx: number[] = [];
          tokens.forEach((t, i) => { if (!/^\s+$/.test(t)) wordTokenIdx.push(i); });
          return { tokens, wordTokenIdx };
        }),
      };
    }),
  };
}

export function AlignedBilingual({ primary, mirror, langOptions }: {
  primary: Col; mirror: Col; langOptions: { code: string; nameNative: string }[];
}) {
  const [hover, setHover] = useState<Hover>(null);
  const pm = useMemo(() => buildModel(primary.text, primary.loc), [primary.text, primary.loc]);
  const mm = useMemo(() => buildModel(mirror.text, mirror.loc), [mirror.text, mirror.loc]);

  const onEnter = (side: string, blockIdx: number, sentIdx: number, wordIdx: number) => {
    const self = side === "primary" ? pm : mm;
    const other = side === "primary" ? mm : pm;
    const selfLang = side === "primary" ? primary.loc : mirror.loc;
    const otherLang = side === "primary" ? mirror.loc : primary.loc;
    const selfSent = self.blocks[blockIdx]?.sentences[sentIdx];
    const otherSent = other.blocks[blockIdx]?.sentences[sentIdx];
    if (!selfSent) return;
    const word = selfSent.tokens[selfSent.wordTokenIdx[wordIdx]] ?? "";
    let mirrorWordIdx: number | null = null;
    if (otherSent && word) {
      const otherWords = otherSent.wordTokenIdx.map((ti) => otherSent.tokens[ti]);
      const found = findMirrorWordIdx(word, selfLang, otherWords, otherLang, { idx: wordIdx, total: selfSent.wordTokenIdx.length });
      mirrorWordIdx = found == null ? null : otherSent.wordTokenIdx.indexOf(found);
    }
    setHover({ side, blockIdx, sentIdx, wordIdx, mirrorWordIdx });
  };

  const renderCol = (col: Col, model: ColModel, side: string) => (
    <div data-cel-col={col.key} dir={col.rtl ? "rtl" : "ltr"}
      className="flex w-full flex-col gap-1 md:w-1/2 md:min-h-0 md:overflow-y-auto md:pr-2"
      onMouseLeave={() => setHover(null)}>
      <select data-cel-lang={col.key} value={col.loc} onChange={(e) => col.setLoc(e.target.value)}
        className="self-start rounded border px-2 py-0.5 text-[11px] font-semibold" style={{ borderColor: C.border, background: C.panel, color: C.cyan }}>
        {langOptions.map((l) => <option key={l.code} value={l.code} style={{ background: C.panel, color: C.text }}>{l.nameNative}</option>)}
      </select>
      <div data-cel-aligned className="text-[13px] leading-relaxed" style={{ color: C.text }}>
        {model.blocks.map((blk, bi) => blk.sep
          ? <hr key={bi} className="my-3 border-0 border-t" style={{ borderColor: C.border }} />
          : <p key={bi} className="mb-3">
              {blk.sentences.map((sent, si) => {
                const sentActive = hover != null && hover.blockIdx === bi && hover.sentIdx === si;
                let wi = -1;
                return (
                  <span key={si}>
                    {sent.tokens.map((tok, ti) => {
                      const wordTok = !/^\s+$/.test(tok);
                      if (wordTok) wi++;
                      const thisWi = wi;
                      if (!wordTok) return <span key={`${si}-${ti}`}>{tok}</span>;
                      const direct = sentActive && hover!.side === side && hover!.wordIdx === thisWi;
                      const mirrored = sentActive && hover!.side !== side && hover!.mirrorWordIdx === thisWi;
                      const bg = direct || mirrored ? HL.word : sentActive ? HL.sentence : "transparent";
                      return (
                        <span key={`${si}-${ti}`} data-cel-word
                          onMouseEnter={() => onEnter(side, bi, si, thisWi)}
                          onClick={() => onEnter(side, bi, si, thisWi)}
                          style={{ backgroundColor: bg, borderRadius: 3, cursor: "pointer", transition: "background-color 80ms" }}>
                          {tok}
                        </span>
                      );
                    })}
                  </span>
                );
              })}
            </p>)}
      </div>
    </div>
  );

  return (
    <div data-cel-dual className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row">
      {renderCol(primary, pm, "primary")}
      {renderCol(mirror, mm, "mirror")}
    </div>
  );
}
