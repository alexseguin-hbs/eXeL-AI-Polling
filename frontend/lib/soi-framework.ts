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

// Default framework — copy simplified to speak to hearts, minds, and spirits (operator ask E).
export const DEFAULT_SOI: SoiFramework = {
  version: SOI_VERSION,
  thesis: "Value presence, not just production. ♡ fuels the why · 웃 powers the how · ◬ scales the what.",
  coins: [
    { sym: "♡", key: "SI", name: "Shared Intention", law: "1 min contributed = 1 ♡", purpose: "Time given in goodwill — builds trust and belonging." },
    { sym: "웃", key: "HI", name: "Human Intelligence", law: "min-wage $7.25/hr → 1 hr ≈ 7.25 웃", purpose: "Skill and care, fairly compensated — sustains people." },
    { sym: "◬", key: "AI", name: "Artificial Intelligence", law: "1 min SI = 5 ◬ (5× acceleration)", purpose: "Time saved by tools — rewards leverage shared with all." },
  ],
  flow: [
    { k: "Redeem", d: "웃 HI → cash on treasury availability" },
    { k: "Exchange", d: "internal — services · tools · mentoring" },
    { k: "Stake", d: "governance · bonuses · future access" },
    { k: "Amplify", d: "♡ SI → ◬ AI when a task becomes a reusable tool" },
  ],
  nose: [
    { k: "Need", d: "Legacy systems fail to value non-monetary contribution and scalable tools." },
    { k: "Outcome", d: "Decisions go from days → minutes, with transparent, fair rewards." },
    { k: "Solution", d: "Fast polling + AI clustering + tokenized Tri-Coin value." },
    { k: "Evidence", d: "SoI test deployments live 2026; echoed by Deloitte + Gartner." },
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
