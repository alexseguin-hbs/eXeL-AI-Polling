/**
 * Sign Doc's steps as one table (POD_PHASES shape — R-CORE reuse): key, label key, glyph. The glyph
 * carries the meaning across languages (operator: iconology so fewer strings need translating);
 * the label stays translatable. Colour comes from the theme, never from here.
 *
 * THE GLYPH LAW — one glyph, one meaning, everywhere on the page (reviewer 2026-09-08):
 *   glyph  meaning                     where
 *   ⤒      upload — a file goes in     rail: upload
 *   ⤓      open — an envelope comes in rail: open (countersign)
 *   웃     people — who signs          rail: signers (H.I., the Trinity's human glyph)
 *   ⌖      place — a box on the page   rail: place
 *   ✎      draw — the stroke           rail: draw
 *   ◬      record / chain — the stamp  rail: sign · the "Sign & save" button · the chain hash on receipts (A.I., the Trinity's record glyph)
 *   ♡      hand off — to the next one  rail: handoff (S.I., shared intent)
 *   ✓      done — complete / past      rail: done · a past step's tick
 *   ✦      AI assistance               the "AI: find my line" button — NEVER ◬, which is reserved for the record
 */
export const SIGN_STEP_KEYS = ["upload", "open", "signers", "place", "draw", "sign", "handoff", "done"] as const;
export type SignStep = (typeof SIGN_STEP_KEYS)[number];
export interface SignStepDef { key: SignStep; labelKey: string; glyph: string }
export const SIGN_STEPS: Record<SignStep, SignStepDef> = {
  upload:  { key: "upload",  labelKey: "soi.sign.step.upload",  glyph: "⤒" },
  open:    { key: "open",    labelKey: "soi.sign.step.open",    glyph: "⤓" },
  signers: { key: "signers", labelKey: "soi.sign.step.signers", glyph: "웃" },
  place:   { key: "place",   labelKey: "soi.sign.step.place",   glyph: "⌖" },
  draw:    { key: "draw",    labelKey: "soi.sign.step.draw",    glyph: "✎" },
  sign:    { key: "sign",    labelKey: "soi.sign.step.sign",    glyph: "◬" },
  handoff: { key: "handoff", labelKey: "soi.sign.step.handoff", glyph: "♡" },
  done:    { key: "done",    labelKey: "soi.sign.step.done",    glyph: "✓" },
};
/** The AI placement button's glyph — assistance, not the record. */
export const AI_GLYPH = "✦";
export const CREATOR_STEPS: readonly SignStep[] = ["upload", "signers", "place", "draw", "sign", "handoff", "done"];
export const COUNTERSIGN_STEPS: readonly SignStep[] = ["open", "place", "draw", "sign", "done"];
