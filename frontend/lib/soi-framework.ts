/**
 * SoI Framework — the ONE editable System-of-Intelligence source (Sprint 6).
 * =========================================================================
 * Editable in Architect-2525; PUBLISHED to the main eXeL AI Polling app (/dashboard, logged-in).
 * Draft lives at `soi2525.draft`; the published copy at `soi2525.published`. Both surfaces compile
 * against one versioned schema. A validating loader falls back to defaults on any malformed payload,
 * and a `storage` event lets an edit in one tab/route flow to the other. Pure data + localStorage.
 * 2525-core candidate (the incentive spine every domain reads).
 */

export const SOI_VERSION = 1;

export interface SoiCoin { sym: string; key: string; name: string; law: string; purpose: string; }
export interface SoiKV { k: string; d: string; }
export interface SoiFramework {
  version: number;
  thesis: string;
  coins: SoiCoin[];   // ♡ SI · 웃 HI · ◬ AI
  flow: SoiKV[];      // value conversion + flow
  nose: SoiKV[];      // Need / Outcome / Solution / Evidence
}

// Default framework — copy written to inspire users, educators, and innovators everywhere, and to read clearly in
// every language (operator ask: "make sense in all languages · inspire users, education and innovators all over the
// world"). The DISPLAY surfaces (soi-section.tsx) render these defaults through the lexicon `t()` so they translate
// into all 33 languages; the englishDefault of each SoI lexicon key mirrors the strings below EXACTLY. Anchors kept
// for the SPIRAL: coin names (Shared/Human/Artificial Intelligence) + the AI law substring "1 min SI = 5 ◬".
export const DEFAULT_SOI: SoiFramework = {
  version: SOI_VERSION,
  thesis: "Value what people bring, not only what they produce. ♡ carries the why · 웃 powers the how · ◬ multiplies the what — so shared intention becomes shared progress for every learner, maker, and community on Earth.",
  coins: [
    { sym: "♡", key: "SI", name: "Shared Intention", law: "1 minute given = 1 ♡", purpose: "Time offered in good faith — the trust and belonging that let people build together." },
    { sym: "웃", key: "HI", name: "Human Intelligence", law: "1 웃 = 1 hour at 1× local min wage · earned = M × hours (Multiple × Time)", purpose: "Skill, craft, and care — honored so people and their families can thrive." },
    { sym: "◬", key: "AI", name: "Artificial Intelligence", law: "◬ = witnessed acceleration · variable ~5–10× leverage", purpose: "Time saved by the tools we create together — leverage returned to everyone, not the few." },
  ],
  flow: [
    { k: "Redeem", d: "웃 becomes real-world value when the treasury allows." },
    { k: "Exchange", d: "Trade within the community — services, tools, and mentorship." },
    { k: "Stake", d: "Shape decisions, earn bonuses, and unlock what comes next." },
    { k: "Amplify", d: "♡ grows into ◬ when your work becomes a tool others reuse." },
  ],
  nose: [
    { k: "Need", d: "The world rarely rewards unpaid contribution — or the tools that multiply everyone's effort." },
    { k: "Outcome", d: "Decisions in minutes, not weeks — with rewards that are transparent and fair to all." },
    { k: "Solution", d: "Fast, inclusive polling + AI clustering + a tokenized Tri-Coin of shared value." },
    { k: "Evidence", d: "Live pilots since 2026 — an open model educators and innovators everywhere can build on." },
  ],
};

const DRAFT_KEY = "soi2525.draft";
const PUB_KEY = "soi2525.published";

// Validate an unknown payload into a SoiFramework, or return null (→ caller falls back to defaults).
function validate(raw: unknown): SoiFramework | null {
  if (!raw || typeof raw !== "object") return null;
  const f = raw as Partial<SoiFramework>;
  if (typeof f.thesis !== "string") return null;
  if (!Array.isArray(f.coins) || f.coins.length !== 3) return null;
  if (!f.coins.every((c) => c && typeof c.key === "string" && typeof c.law === "string" && typeof c.purpose === "string" && typeof c.name === "string" && typeof c.sym === "string")) return null;
  if (!Array.isArray(f.flow) || !f.flow.every((x) => x && typeof x.k === "string" && typeof x.d === "string")) return null;
  if (!Array.isArray(f.nose) || f.nose.length !== 4 || !f.nose.every((x) => x && typeof x.k === "string" && typeof x.d === "string")) return null;
  return { version: SOI_VERSION, thesis: f.thesis, coins: f.coins as SoiCoin[], flow: f.flow as SoiKV[], nose: f.nose as SoiKV[] };
}

function read(key: string): SoiFramework {
  try { const v = validate(JSON.parse(localStorage.getItem(key) || "null")); if (v) return v; } catch { /* fall through */ }
  return structuredClone(DEFAULT_SOI);
}
function write(key: string, f: SoiFramework) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...f, version: SOI_VERSION }));
    // notify same-tab listeners (the `storage` event only fires cross-tab).
    window.dispatchEvent(new CustomEvent("soi:changed", { detail: { key } }));
  } catch { /* storage unavailable — ignore */ }
}

/** The editable DRAFT (Architect). */
export function loadSoI(): SoiFramework { return read(DRAFT_KEY); }
export function saveSoI(f: SoiFramework) { write(DRAFT_KEY, f); }
/** The PUBLISHED copy shown on /main. */
export function loadPublishedSoI(): SoiFramework { return read(PUB_KEY); }
export function publishSoI(f: SoiFramework) { write(PUB_KEY, f); }

/** Subscribe to SoI changes (same-tab custom event + cross-tab storage event). Returns an unsubscribe fn. */
export function subscribeSoI(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => { if (e.key === DRAFT_KEY || e.key === PUB_KEY) cb(); };
  const onCustom = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener("soi:changed", onCustom as EventListener);
  return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("soi:changed", onCustom as EventListener); };
}
