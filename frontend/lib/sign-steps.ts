/**
 * Sign Doc's steps as one table (POD_PHASES shape — R-CORE reuse): key, label key, glyph. The glyph
 * carries the meaning across languages (operator: iconology so fewer strings need translating);
 * the label stays translatable. Colour comes from the theme, never from here.
 */
export interface SignStepDef { key: string; labelKey: string; glyph: string }
export const SIGN_STEPS: Record<string, SignStepDef> = {
  upload:  { key: "upload",  labelKey: "soi.sign.step.upload",  glyph: "⤒" },
  open:    { key: "open",    labelKey: "soi.sign.step.open",    glyph: "⤓" },
  signers: { key: "signers", labelKey: "soi.sign.step.signers", glyph: "웃" },
  place:   { key: "place",   labelKey: "soi.sign.step.place",   glyph: "⌖" },
  draw:    { key: "draw",    labelKey: "soi.sign.step.draw",    glyph: "✎" },
  sign:    { key: "sign",    labelKey: "soi.sign.step.sign",    glyph: "◬" },
  handoff: { key: "handoff", labelKey: "soi.sign.step.handoff", glyph: "♡" },
  done:    { key: "done",    labelKey: "soi.sign.step.done",    glyph: "✓" },
};
export const CREATOR_STEPS = ["upload", "signers", "place", "draw", "sign", "handoff", "done"];
export const COUNTERSIGN_STEPS = ["open", "place", "draw", "sign", "done"];
